-- Add human authorship fields to questions table
-- These fields help Google recognize human editorial oversight

-- Add author/reviewer fields
ALTER TABLE questions 
ADD COLUMN IF NOT EXISTS reviewed_by TEXT,
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_updated TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS update_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS editor_notes TEXT;

-- Add comments for documentation
COMMENT ON COLUMN questions.reviewed_by IS 'Name or identifier of the human reviewer/editor who reviewed this content';
COMMENT ON COLUMN questions.reviewed_at IS 'When this content was last reviewed by a human';
COMMENT ON COLUMN questions.last_updated IS 'When this content was last updated';
COMMENT ON COLUMN questions.update_count IS 'Number of times this content has been updated (shows freshness)';
COMMENT ON COLUMN questions.editor_notes IS 'Internal notes from editors about content quality or changes';

-- Set last_updated to created_at for existing records
UPDATE questions 
SET last_updated = created_at 
WHERE last_updated IS NULL;

-- Create index for freshness queries
CREATE INDEX IF NOT EXISTS idx_questions_last_updated ON questions(last_updated DESC);
CREATE INDEX IF NOT EXISTS idx_questions_reviewed_at ON questions(reviewed_at DESC);






