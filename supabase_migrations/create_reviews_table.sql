-- Create reviews table for user testimonials
CREATE TABLE IF NOT EXISTS reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT NOT NULL,
    language_path TEXT NOT NULL CHECK (language_path IN ('en', 'de')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    job_title TEXT,
    company TEXT
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_reviews_status ON reviews(status);
CREATE INDEX IF NOT EXISTS idx_reviews_language ON reviews(language_path);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);

-- Enable RLS
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Allow public to read approved reviews
CREATE POLICY "Allow public read access to approved reviews"
    ON reviews FOR SELECT
    TO public
    USING (status = 'approved');

-- Allow authenticated users to read their own reviews
CREATE POLICY "Allow users to read their own reviews"
    ON reviews FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Allow authenticated users to insert their own reviews
CREATE POLICY "Allow authenticated users to insert reviews"
    ON reviews FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to update their own reviews
CREATE POLICY "Allow users to update their own reviews"
    ON reviews FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Add comments for documentation
COMMENT ON TABLE reviews IS 'User reviews and testimonials for FAULTBASE';
COMMENT ON COLUMN reviews.status IS 'Review moderation status: pending, approved, or rejected';
COMMENT ON COLUMN reviews.rating IS 'User rating from 1 to 5 stars';




