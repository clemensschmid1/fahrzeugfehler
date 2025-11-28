-- Create car_comments table for comments on car faults and manuals
-- Similar structure to comments table but for car content

CREATE TABLE IF NOT EXISTS car_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    car_fault_id UUID REFERENCES car_faults(id) ON DELETE CASCADE,
    car_manual_id UUID REFERENCES car_manuals(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL CHECK (char_length(content) > 0 AND char_length(content) <= 1000),
    status TEXT NOT NULL DEFAULT 'live' CHECK (status IN ('live', 'binned')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- Ensure either car_fault_id or car_manual_id is set, but not both
    CHECK (
        (car_fault_id IS NOT NULL AND car_manual_id IS NULL) OR
        (car_fault_id IS NULL AND car_manual_id IS NOT NULL)
    )
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_car_comments_fault ON car_comments(car_fault_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_car_comments_manual ON car_comments(car_manual_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_car_comments_user ON car_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_car_comments_status ON car_comments(status);

-- RLS Policies
ALTER TABLE car_comments ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read live comments
DROP POLICY IF EXISTS "Anyone can read live car comments" ON car_comments;
CREATE POLICY "Anyone can read live car comments"
    ON car_comments FOR SELECT
    USING (status = 'live');

-- Policy: Authenticated users can insert their own comments
DROP POLICY IF EXISTS "Authenticated users can insert car comments" ON car_comments;
CREATE POLICY "Authenticated users can insert car comments"
    ON car_comments FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own comments
DROP POLICY IF EXISTS "Users can update their own car comments" ON car_comments;
CREATE POLICY "Users can update their own car comments"
    ON car_comments FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy: Service role has full access
DROP POLICY IF EXISTS "Service role has full access to car_comments" ON car_comments;
CREATE POLICY "Service role has full access to car_comments"
    ON car_comments FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

COMMENT ON TABLE car_comments IS 'Comments on car faults and manuals. Each comment must be linked to either a car_fault or car_manual.';
COMMENT ON COLUMN car_comments.car_fault_id IS 'Reference to car_fault if this comment is on a fault';
COMMENT ON COLUMN car_comments.car_manual_id IS 'Reference to car_manual if this comment is on a manual';
COMMENT ON COLUMN car_comments.content IS 'Comment content, max 1000 characters';
COMMENT ON COLUMN car_comments.status IS 'Comment status: live (visible) or binned (hidden)';

