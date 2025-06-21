-- Add quality score fields to questions table
-- These fields are used for automatic quality filtering

-- Add the score columns
ALTER TABLE questions 
ADD COLUMN IF NOT EXISTS seo_score INTEGER,
ADD COLUMN IF NOT EXISTS content_score INTEGER,
ADD COLUMN IF NOT EXISTS expertise_score INTEGER,
ADD COLUMN IF NOT EXISTS helpfulness_score INTEGER;

-- Add comments to document the purpose of these fields
COMMENT ON COLUMN questions.seo_score IS 'SEO optimization score (1-99). Used for quality filtering. Threshold: 50';
COMMENT ON COLUMN questions.content_score IS 'Content quality score (1-99). Used for quality filtering. Threshold: 70';
COMMENT ON COLUMN questions.expertise_score IS 'Technical expertise score (1-99). Used for quality filtering. Threshold: 60';
COMMENT ON COLUMN questions.helpfulness_score IS 'Helpfulness score (1-99). Used for quality filtering. Threshold: 40';

-- Add indexes for efficient querying of quality scores
CREATE INDEX IF NOT EXISTS idx_questions_seo_score ON questions(seo_score);
CREATE INDEX IF NOT EXISTS idx_questions_content_score ON questions(content_score);
CREATE INDEX IF NOT EXISTS idx_questions_expertise_score ON questions(expertise_score);
CREATE INDEX IF NOT EXISTS idx_questions_helpfulness_score ON questions(helpfulness_score);

-- Add composite index for quality filtering queries
CREATE INDEX IF NOT EXISTS idx_questions_quality_scores ON questions(seo_score, content_score, expertise_score, helpfulness_score);

-- Add constraint to ensure scores are within valid range
ALTER TABLE questions 
ADD CONSTRAINT check_seo_score_range CHECK (seo_score IS NULL OR (seo_score >= 1 AND seo_score <= 99)),
ADD CONSTRAINT check_content_score_range CHECK (content_score IS NULL OR (content_score >= 1 AND content_score <= 99)),
ADD CONSTRAINT check_expertise_score_range CHECK (expertise_score IS NULL OR (expertise_score >= 1 AND expertise_score <= 99)),
ADD CONSTRAINT check_helpfulness_score_range CHECK (helpfulness_score IS NULL OR (helpfulness_score >= 1 AND helpfulness_score <= 99)); 