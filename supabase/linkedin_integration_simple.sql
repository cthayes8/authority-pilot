-- Simple LinkedIn Integration for Supabase
-- Run this in the Supabase SQL Editor

-- 1. OAuth state management table
CREATE TABLE IF NOT EXISTS oauth_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  state TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for oauth_states
CREATE INDEX IF NOT EXISTS idx_oauth_states_expires_at ON oauth_states(expires_at);
CREATE INDEX IF NOT EXISTS idx_oauth_states_user_provider ON oauth_states(user_id, provider);

-- 2. Add missing columns to existing linkedin_accounts table
-- First check what columns exist
DO $$
BEGIN
    -- Add scope column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'linkedin_accounts' AND column_name = 'scope') THEN
        ALTER TABLE linkedin_accounts ADD COLUMN scope TEXT;
    END IF;
    
    -- Add profile_data column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'linkedin_accounts' AND column_name = 'profile_data') THEN
        ALTER TABLE linkedin_accounts ADD COLUMN profile_data JSONB;
    END IF;
    
    -- Add connected_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'linkedin_accounts' AND column_name = 'connected_at') THEN
        ALTER TABLE linkedin_accounts ADD COLUMN connected_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
    
    -- Add updated_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'linkedin_accounts' AND column_name = 'updated_at') THEN
        ALTER TABLE linkedin_accounts ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
    
    -- Add is_active column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'linkedin_accounts' AND column_name = 'is_active') THEN
        ALTER TABLE linkedin_accounts ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
END
$$;

-- 3. Add LinkedIn connection status to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS linkedin_connected BOOLEAN DEFAULT false;

-- 4. LinkedIn posts tracking table
CREATE TABLE IF NOT EXISTS linkedin_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_post_id UUID REFERENCES content_posts(id) ON DELETE SET NULL,
  linkedin_post_id TEXT,
  linkedin_activity_id TEXT,
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  scheduled_for TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  linkedin_url TEXT,
  performance_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for linkedin_posts
CREATE INDEX IF NOT EXISTS idx_linkedin_posts_user_id ON linkedin_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_linkedin_posts_status ON linkedin_posts(status);
CREATE INDEX IF NOT EXISTS idx_linkedin_posts_scheduled_for ON linkedin_posts(scheduled_for);

-- 5. Update trigger for linkedin_posts
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_linkedin_posts_updated_at 
  BEFORE UPDATE ON linkedin_posts 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 6. Enable RLS for new tables
ALTER TABLE oauth_states ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own OAuth states" ON oauth_states
  FOR ALL USING (auth.uid() = user_id);

ALTER TABLE linkedin_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own LinkedIn posts" ON linkedin_posts
  FOR ALL USING (auth.uid() = user_id);

-- 7. Grant permissions
GRANT ALL ON oauth_states TO authenticated;
GRANT ALL ON linkedin_posts TO authenticated;