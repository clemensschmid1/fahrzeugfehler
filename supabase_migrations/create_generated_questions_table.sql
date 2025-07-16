-- Create generated_questions table for tracking AI-generated questions
CREATE TABLE IF NOT EXISTS generated_questions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    question_text TEXT NOT NULL,
    question_hash TEXT NOT NULL UNIQUE,
    language TEXT NOT NULL CHECK (language IN ('en', 'de')),
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    exported_at TIMESTAMP WITH TIME ZONE,
    export_filename TEXT,
    prompt_used TEXT,
    ai_model_used TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_generated_questions_hash ON generated_questions(question_hash);
CREATE INDEX IF NOT EXISTS idx_generated_questions_language ON generated_questions(language);
CREATE INDEX IF NOT EXISTS idx_generated_questions_generated_at ON generated_questions(generated_at);
CREATE INDEX IF NOT EXISTS idx_generated_questions_exported_at ON generated_questions(exported_at);

-- Add RLS (Row Level Security) policies
ALTER TABLE generated_questions ENABLE ROW LEVEL SECURITY;

-- Policy to allow all operations for authenticated users (since this is internal)
CREATE POLICY "Allow all operations for authenticated users" ON generated_questions
    FOR ALL USING (auth.role() = 'authenticated');

-- Add comments for documentation
COMMENT ON TABLE generated_questions IS 'Tracks AI-generated questions for bulk import to prevent duplicates';
COMMENT ON COLUMN generated_questions.question_hash IS 'SHA256 hash of question_text for fast duplicate detection';
COMMENT ON COLUMN generated_questions.language IS 'Language of the question (en/de)';
COMMENT ON COLUMN generated_questions.exported_at IS 'When the question was exported to txt file';
COMMENT ON COLUMN generated_questions.export_filename IS 'Name of the txt file where question was exported';
COMMENT ON COLUMN generated_questions.prompt_used IS 'Original prompt used to generate this question';
COMMENT ON COLUMN generated_questions.ai_model_used IS 'AI model that generated this question'; 