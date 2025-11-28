-- Table to track auto-generated profiles for comment generation
CREATE TABLE IF NOT EXISTS generated_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT NOT NULL,
    email TEXT NOT NULL,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    last_used_at TIMESTAMP WITH TIME ZONE,
    comments_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_generated_profiles_active ON generated_profiles(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_generated_profiles_username ON generated_profiles(username);
CREATE INDEX IF NOT EXISTS idx_generated_profiles_generated_at ON generated_profiles(generated_at DESC);

-- RLS Policies
ALTER TABLE generated_profiles ENABLE ROW LEVEL SECURITY;

-- Service role has full access
DROP POLICY IF EXISTS "Service role has full access to generated_profiles" ON generated_profiles;
CREATE POLICY "Service role has full access to generated_profiles"
    ON generated_profiles FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Authenticated users can read (for internal tools)
DROP POLICY IF EXISTS "Authenticated users can read generated_profiles" ON generated_profiles;
CREATE POLICY "Authenticated users can read generated_profiles"
    ON generated_profiles FOR SELECT
    TO authenticated
    USING (true);

COMMENT ON TABLE generated_profiles IS 'Tracks auto-generated user profiles used for mass comment generation';
COMMENT ON COLUMN generated_profiles.comments_count IS 'Number of comments created by this profile';
COMMENT ON COLUMN generated_profiles.last_used_at IS 'Last time this profile was used to create a comment';

