-- LinkedIn Integration Schema - FIXED VERSION
-- Adds tables and columns needed for LinkedIn OAuth and API integration
-- Compatible with existing linkedin_accounts table structure

-- OAuth state management table
CREATE TABLE IF NOT EXISTS oauth_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  state TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for cleanup and lookup
CREATE INDEX IF NOT EXISTS idx_oauth_states_expires_at ON oauth_states(expires_at);
CREATE INDEX IF NOT EXISTS idx_oauth_states_user_provider ON oauth_states(user_id, provider);

-- Update existing linkedin_accounts table to add missing columns
-- (Only add columns that don't exist)
ALTER TABLE linkedin_accounts 
ADD COLUMN IF NOT EXISTS scope TEXT,
ADD COLUMN IF NOT EXISTS profile_data JSONB,
ADD COLUMN IF NOT EXISTS connected_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Update existing indexes to use correct column names (account_id, not linkedin_id)
CREATE INDEX IF NOT EXISTS idx_linkedin_accounts_user_id ON linkedin_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_linkedin_accounts_account_id ON linkedin_accounts(account_id);
CREATE INDEX IF NOT EXISTS idx_linkedin_accounts_expires_at ON linkedin_accounts(expires_at);

-- Add LinkedIn connection status to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS linkedin_connected BOOLEAN DEFAULT false;

-- LinkedIn posts tracking table
CREATE TABLE IF NOT EXISTS linkedin_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_post_id UUID REFERENCES content_posts(id) ON DELETE SET NULL,
  linkedin_post_id TEXT, -- LinkedIn's URN identifier
  linkedin_activity_id TEXT, -- LinkedIn's activity identifier
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft', -- draft, scheduled, published, failed
  scheduled_for TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  linkedin_url TEXT,
  performance_data JSONB, -- likes, comments, shares, views
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for LinkedIn posts
CREATE INDEX IF NOT EXISTS idx_linkedin_posts_user_id ON linkedin_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_linkedin_posts_status ON linkedin_posts(status);
CREATE INDEX IF NOT EXISTS idx_linkedin_posts_scheduled_for ON linkedin_posts(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_linkedin_posts_content_post_id ON linkedin_posts(content_post_id);

-- LinkedIn connections tracking table
CREATE TABLE IF NOT EXISTS linkedin_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  linkedin_person_id TEXT NOT NULL,
  profile_data JSONB,
  connection_type TEXT DEFAULT 'first', -- first, second, third
  connected_at TIMESTAMPTZ,
  relationship_strength INTEGER DEFAULT 1, -- 1-10 scale
  last_interaction_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Prevent duplicate connections
  CONSTRAINT unique_user_connection UNIQUE(user_id, linkedin_person_id)
);

-- Indexes for connections
CREATE INDEX IF NOT EXISTS idx_linkedin_connections_user_id ON linkedin_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_linkedin_connections_person_id ON linkedin_connections(linkedin_person_id);
CREATE INDEX IF NOT EXISTS idx_linkedin_connections_strength ON linkedin_connections(relationship_strength);

-- LinkedIn engagement tracking table
CREATE TABLE IF NOT EXISTS linkedin_engagements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  linkedin_post_id TEXT NOT NULL, -- The post we engaged with
  linkedin_post_author_id TEXT, -- Author of the post
  engagement_type TEXT NOT NULL, -- like, comment, share, connection_request
  our_content TEXT, -- Our comment text or message content
  engagement_id TEXT, -- LinkedIn's ID for our engagement
  status TEXT DEFAULT 'pending', -- pending, success, failed
  engaged_at TIMESTAMPTZ DEFAULT NOW(),
  response_data JSONB, -- Any response from the target
  ai_generated BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for engagements
CREATE INDEX IF NOT EXISTS idx_linkedin_engagements_user_id ON linkedin_engagements(user_id);
CREATE INDEX IF NOT EXISTS idx_linkedin_engagements_post_id ON linkedin_engagements(linkedin_post_id);
CREATE INDEX IF NOT EXISTS idx_linkedin_engagements_type ON linkedin_engagements(engagement_type);
CREATE INDEX IF NOT EXISTS idx_linkedin_engagements_engaged_at ON linkedin_engagements(engaged_at);

-- Update triggers for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update triggers (only if tables exist)
DO $$ 
BEGIN
    -- Check if linkedin_accounts table exists and add trigger
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'linkedin_accounts') THEN
        DROP TRIGGER IF EXISTS update_linkedin_accounts_updated_at ON linkedin_accounts;
        CREATE TRIGGER update_linkedin_accounts_updated_at 
          BEFORE UPDATE ON linkedin_accounts 
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    -- Add trigger for linkedin_posts
    DROP TRIGGER IF EXISTS update_linkedin_posts_updated_at ON linkedin_posts;
    CREATE TRIGGER update_linkedin_posts_updated_at 
      BEFORE UPDATE ON linkedin_posts 
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

    -- Add trigger for linkedin_connections
    DROP TRIGGER IF EXISTS update_linkedin_connections_updated_at ON linkedin_connections;
    CREATE TRIGGER update_linkedin_connections_updated_at 
      BEFORE UPDATE ON linkedin_connections 
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
END $$;

-- RLS Policies
-- OAuth states - users can only access their own states
ALTER TABLE oauth_states ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own OAuth states" ON oauth_states;
CREATE POLICY "Users can manage their own OAuth states" ON oauth_states
  FOR ALL USING (auth.uid() = user_id);

-- LinkedIn accounts - users can only access their own accounts  
-- (Enable RLS if not already enabled)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_class c 
        JOIN pg_namespace n ON n.oid = c.relnamespace 
        WHERE c.relname = 'linkedin_accounts' AND n.nspname = 'public' AND c.relrowsecurity = true
    ) THEN
        ALTER TABLE linkedin_accounts ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

DROP POLICY IF EXISTS "Users can manage their own LinkedIn accounts" ON linkedin_accounts;
CREATE POLICY "Users can manage their own LinkedIn accounts" ON linkedin_accounts
  FOR ALL USING (auth.uid() = user_id);

-- LinkedIn posts - users can only access their own posts
ALTER TABLE linkedin_posts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own LinkedIn posts" ON linkedin_posts;
CREATE POLICY "Users can manage their own LinkedIn posts" ON linkedin_posts
  FOR ALL USING (auth.uid() = user_id);

-- LinkedIn connections - users can only access their own connections
ALTER TABLE linkedin_connections ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own LinkedIn connections" ON linkedin_connections;
CREATE POLICY "Users can manage their own LinkedIn connections" ON linkedin_connections
  FOR ALL USING (auth.uid() = user_id);

-- LinkedIn engagements - users can only access their own engagements
ALTER TABLE linkedin_engagements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own LinkedIn engagements" ON linkedin_engagements;
CREATE POLICY "Users can manage their own LinkedIn engagements" ON linkedin_engagements
  FOR ALL USING (auth.uid() = user_id);

-- Cleanup function for expired OAuth states
CREATE OR REPLACE FUNCTION cleanup_expired_oauth_states()
RETURNS void AS $$
BEGIN
  DELETE FROM oauth_states WHERE expires_at < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_expired_oauth_states() IS 'Cleanup expired OAuth states - should be run periodically';

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;