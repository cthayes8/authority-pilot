-- AuthorityPilot Database Schema for Supabase
-- MVP Version - Essential tables only

-- Enable Row Level Security (RLS) by default
ALTER DEFAULT PRIVILEGES REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

-- Create profiles table (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  company TEXT,
  role TEXT,
  industry TEXT,
  timezone TEXT DEFAULT 'America/New_York',
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'starter', 'professional', 'executive')),
  subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'cancelled', 'past_due')),
  stripe_customer_id TEXT,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Voice profiles for AI training
CREATE TABLE voice_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  writing_samples TEXT[] NOT NULL,
  tone_attributes JSONB DEFAULT '{"professional": 0.5, "casual": 0.3, "humorous": 0.1, "inspirational": 0.1, "educational": 0.5}',
  vocabulary_preferences JSONB DEFAULT '{"use": [], "avoid": []}',
  sentence_structure JSONB DEFAULT '{"averageLength": 15, "complexity": "medium", "paragraphLength": 3}',
  emoji_usage JSONB DEFAULT '{"frequency": "low", "preferred": []}',
  hashtag_style JSONB DEFAULT '{"count": 3, "placement": "end", "format": "camelCase"}',
  industry_jargon JSONB DEFAULT '{}',
  key_messages TEXT[] DEFAULT '{}',
  brand_personality JSONB DEFAULT '{}',
  last_trained_at TIMESTAMP WITH TIME ZONE,
  training_version INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id) -- One voice profile per user for MVP
);

-- Content posts
CREATE TABLE content_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL CHECK (content_type IN ('post', 'article', 'thread', 'carousel')),
  platform TEXT NOT NULL CHECK (platform IN ('linkedin', 'twitter')),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'published', 'failed')),
  content JSONB NOT NULL, -- {text, hashtags, mentions, mediaUrls}
  ai_generated BOOLEAN DEFAULT TRUE,
  user_edited BOOLEAN DEFAULT FALSE,
  scheduled_for TIMESTAMP WITH TIME ZONE,
  published_at TIMESTAMP WITH TIME ZONE,
  platform_post_id TEXT,
  performance_metrics JSONB, -- {views, likes, comments, shares, engagementRate}
  ai_confidence_score DECIMAL(3,2) NOT NULL CHECK (ai_confidence_score >= 0 AND ai_confidence_score <= 1),
  generation_prompt TEXT,
  voice_profile_version INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- LinkedIn accounts (OAuth tokens)
CREATE TABLE linkedin_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  account_id TEXT NOT NULL,
  account_name TEXT,
  access_token TEXT NOT NULL, -- Will be encrypted at application level
  refresh_token TEXT, -- Will be encrypted at application level
  token_expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  follower_count INTEGER,
  connection_count INTEGER,
  post_count INTEGER,
  engagement_rate DECIMAL(5,2),
  last_synced_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, account_id) -- One LinkedIn account per user for MVP
);

-- Create indexes for performance
CREATE INDEX idx_content_posts_user_scheduled ON content_posts(user_id, scheduled_for) WHERE scheduled_for IS NOT NULL;
CREATE INDEX idx_content_posts_status ON content_posts(status) WHERE status IN ('scheduled', 'draft');
CREATE INDEX idx_content_posts_user_platform ON content_posts(user_id, platform);
CREATE INDEX idx_linkedin_accounts_user_active ON linkedin_accounts(user_id) WHERE is_active = TRUE;

-- Row Level Security (RLS) Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE linkedin_accounts ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Voice profiles policies
CREATE POLICY "Users can view own voice profile" ON voice_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own voice profile" ON voice_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own voice profile" ON voice_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Content posts policies
CREATE POLICY "Users can view own content" ON content_posts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own content" ON content_posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own content" ON content_posts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own content" ON content_posts
  FOR DELETE USING (auth.uid() = user_id);

-- LinkedIn accounts policies
CREATE POLICY "Users can view own linkedin accounts" ON linkedin_accounts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own linkedin accounts" ON linkedin_accounts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own linkedin accounts" ON linkedin_accounts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own linkedin accounts" ON linkedin_accounts
  FOR DELETE USING (auth.uid() = user_id);

-- Functions and triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_profiles_updated_at 
  BEFORE UPDATE ON profiles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_posts_updated_at 
  BEFORE UPDATE ON content_posts 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create profile automatically when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ language 'plpgsql' security definer;

-- Trigger the function every time a user is created
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Authority Score calculation function (placeholder)
CREATE OR REPLACE FUNCTION calculate_authority_score(user_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  score INTEGER := 0;
  follower_count INTEGER := 0;
  engagement_rate DECIMAL := 0;
  post_count INTEGER := 0;
BEGIN
  -- Get LinkedIn metrics
  SELECT 
    COALESCE(la.follower_count, 0),
    COALESCE(la.engagement_rate, 0)
  INTO follower_count, engagement_rate
  FROM linkedin_accounts la
  WHERE la.user_id = user_uuid AND la.is_active = TRUE
  LIMIT 1;

  -- Get post count from last 30 days
  SELECT COUNT(*)
  INTO post_count
  FROM content_posts cp
  WHERE cp.user_id = user_uuid 
    AND cp.status = 'published'
    AND cp.published_at > NOW() - INTERVAL '30 days';

  -- Simple authority score calculation (0-100)
  -- This is a placeholder - will be enhanced with more sophisticated metrics
  score := LEAST(100, 
    (follower_count / 100) +  -- 1 point per 100 followers
    (engagement_rate * 20) +  -- 20 points for 1% engagement
    (post_count * 2)          -- 2 points per post in last 30 days
  );

  RETURN score;
END;
$$ language 'plpgsql' security definer;

-- Comments for documentation
COMMENT ON TABLE profiles IS 'User profiles extending Supabase auth.users';
COMMENT ON TABLE voice_profiles IS 'AI voice training data and parameters';
COMMENT ON TABLE content_posts IS 'Generated and scheduled content posts';
COMMENT ON TABLE linkedin_accounts IS 'LinkedIn OAuth tokens and account data';
COMMENT ON FUNCTION calculate_authority_score IS 'Calculates user authority score based on various metrics';