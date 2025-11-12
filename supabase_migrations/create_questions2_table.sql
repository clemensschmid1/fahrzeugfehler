-- Create questions2 table for new production version
-- This table is separate from questions and will be used for all new chat questions

CREATE TABLE IF NOT EXISTS questions2 (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    slug TEXT UNIQUE,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    language_path TEXT NOT NULL CHECK (language_path IN ('en', 'de')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    status TEXT NOT NULL DEFAULT 'live' CHECK (status IN ('draft', 'live', 'bin')),
    
    -- Optional fields
    header TEXT,
    manufacturer TEXT,
    part_type TEXT,
    part_series TEXT,
    embedding vector(1536), -- For pgvector if used
    seo_score INTEGER CHECK (seo_score IS NULL OR (seo_score >= 1 AND seo_score <= 99)),
    content_score INTEGER CHECK (content_score IS NULL OR (content_score >= 1 AND content_score <= 99)),
    expertise_score INTEGER CHECK (expertise_score IS NULL OR (expertise_score >= 1 AND expertise_score <= 99)),
    helpfulness_score INTEGER CHECK (helpfulness_score IS NULL OR (helpfulness_score >= 1 AND helpfulness_score <= 99)),
    meta_description TEXT,
    parent_id UUID REFERENCES questions2(id) ON DELETE SET NULL,
    conversation_id UUID,
    is_main BOOLEAN DEFAULT true,
    meta_generated BOOLEAN DEFAULT false,
    sector TEXT,
    related_slugs TEXT[],
    question_type TEXT,
    affected_components TEXT[],
    error_code TEXT,
    complexity_level TEXT,
    related_processes TEXT[],
    confidentiality_flag BOOLEAN DEFAULT false,
    voltage TEXT,
    current TEXT,
    power_rating TEXT,
    machine_type TEXT,
    application_area TEXT[],
    product_category TEXT,
    electrical_type TEXT,
    control_type TEXT,
    relevant_standards TEXT[],
    mounting_type TEXT,
    cooling_method TEXT,
    communication_protocols TEXT[],
    manufacturer_mentions TEXT[],
    risk_keywords TEXT[],
    tools_involved TEXT[],
    installation_context TEXT,
    sensor_type TEXT,
    mechanical_component TEXT,
    industry_tag TEXT,
    maintenance_relevance BOOLEAN,
    failure_mode TEXT,
    software_context TEXT,
    
    -- Human authorship fields
    reviewed_by TEXT,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    update_count INTEGER DEFAULT 0,
    editor_notes TEXT
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_questions2_slug ON questions2(slug);
CREATE INDEX IF NOT EXISTS idx_questions2_language_path ON questions2(language_path);
CREATE INDEX IF NOT EXISTS idx_questions2_status ON questions2(status);
CREATE INDEX IF NOT EXISTS idx_questions2_created_at ON questions2(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_questions2_parent_id ON questions2(parent_id);
CREATE INDEX IF NOT EXISTS idx_questions2_conversation_id ON questions2(conversation_id);
CREATE INDEX IF NOT EXISTS idx_questions2_is_main ON questions2(is_main);
CREATE INDEX IF NOT EXISTS idx_questions2_slug_lang_status_main ON questions2(slug, language_path, status, is_main);
CREATE INDEX IF NOT EXISTS idx_questions2_conversation_lang_status ON questions2(conversation_id, language_path, status);
CREATE INDEX IF NOT EXISTS idx_questions2_last_updated ON questions2(last_updated DESC);
CREATE INDEX IF NOT EXISTS idx_questions2_reviewed_at ON questions2(reviewed_at DESC);

-- Create function to auto-generate slug if not provided
CREATE OR REPLACE FUNCTION generate_questions2_slug()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    base_slug TEXT;
    final_slug TEXT;
    counter INTEGER := 0;
BEGIN
    IF NEW.slug IS NULL OR NEW.slug = '' THEN
        -- Generate slug from question text
        base_slug := lower(regexp_replace(
            regexp_replace(
                regexp_replace(COALESCE(NEW.question, ''), '[^a-zA-Z0-9\s-]', '', 'g'),
                '\s+', '-', 'g'
            ),
            '-+', '-', 'g'
        ));
        
        -- Remove leading/trailing dashes
        base_slug := trim(both '-' from base_slug);
        
        -- Limit length
        IF length(base_slug) > 100 THEN
            base_slug := left(base_slug, 100);
        END IF;
        
        -- Ensure slug is not empty
        IF base_slug = '' OR base_slug IS NULL THEN
            base_slug := 'question-' || substr(md5(random()::text), 1, 8);
        END IF;
        
        -- Handle uniqueness: try base slug first, then add counter
        final_slug := base_slug;
        WHILE EXISTS (SELECT 1 FROM questions2 WHERE slug = final_slug AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)) LOOP
            counter := counter + 1;
            final_slug := base_slug || '-' || counter;
            -- Prevent infinite loop
            IF counter > 1000 THEN
                final_slug := base_slug || '-' || substr(md5(random()::text), 1, 8);
                EXIT;
            END IF;
        END LOOP;
        
        NEW.slug := final_slug;
    END IF;
    RETURN NEW;
END;
$$;

-- Create trigger to auto-generate slug
CREATE TRIGGER trigger_generate_questions2_slug
    BEFORE INSERT ON questions2
    FOR EACH ROW
    EXECUTE FUNCTION generate_questions2_slug();

-- Enable Row Level Security
ALTER TABLE questions2 ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Allow public read access to live questions2" ON questions2;
DROP POLICY IF EXISTS "Allow authenticated users to read draft questions2" ON questions2;
DROP POLICY IF EXISTS "Allow anonymous insert questions2" ON questions2;
DROP POLICY IF EXISTS "Allow anonymous update questions2" ON questions2;
DROP POLICY IF EXISTS "Allow anonymous delete questions2" ON questions2;

-- RLS Policy: Allow public read access to live questions
CREATE POLICY "Allow public read access to live questions2"
    ON questions2
    FOR SELECT
    TO public
    USING (status = 'live');

-- RLS Policy: Allow authenticated users to read draft questions (for their own content)
CREATE POLICY "Allow authenticated users to read draft questions2"
    ON questions2
    FOR SELECT
    TO authenticated
    USING (status = 'draft' OR status = 'live' OR status = 'bin');

-- RLS Policy: Allow anonymous inserts (for API routes with anon key)
-- Rate limiting and validation handled in application layer
-- This policy allows anyone to insert rows (rate limiting is handled in the application)
CREATE POLICY "Allow anonymous insert questions2"
    ON questions2
    FOR INSERT
    TO anon, authenticated, service_role
    WITH CHECK (true); -- Allow all inserts (rate limiting handled in application)

-- RLS Policy: Allow anonymous updates (for API routes)
CREATE POLICY "Allow anonymous update questions2"
    ON questions2
    FOR UPDATE
    TO anon, authenticated, service_role
    USING (true)
    WITH CHECK (true);

-- RLS Policy: Allow anonymous deletes (for API routes)
CREATE POLICY "Allow anonymous delete questions2"
    ON questions2
    FOR DELETE
    TO anon, authenticated, service_role
    USING (true);

-- Add comments for documentation
COMMENT ON TABLE questions2 IS 'New production table for chat questions. Separate from questions table for clean migration.';
COMMENT ON COLUMN questions2.status IS 'Status: draft (new), live (published), bin (deleted)';
COMMENT ON COLUMN questions2.is_main IS 'True if this is the main question in a conversation, false for follow-ups';
COMMENT ON COLUMN questions2.meta_generated IS 'Whether metadata has been generated for this question';
COMMENT ON COLUMN questions2.reviewed_by IS 'Name or identifier of the human reviewer/editor';
COMMENT ON COLUMN questions2.reviewed_at IS 'When this content was last reviewed by a human';
COMMENT ON COLUMN questions2.last_updated IS 'When this content was last updated';
COMMENT ON COLUMN questions2.update_count IS 'Number of times this content has been updated';

-- NOTE: If you use the match_questions RPC function for similarity search,
-- you will need to create a separate function match_questions2 that queries
-- the questions2 table instead of questions. The existing match_questions
-- function will continue to work with the old questions table.

