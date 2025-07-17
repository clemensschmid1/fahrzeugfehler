-- Add critical performance indexes for knowledge pages
-- These indexes will dramatically improve query performance

-- Primary lookup index for knowledge pages (most important)
CREATE INDEX IF NOT EXISTS idx_questions_slug_lang_status_main 
ON questions(slug, language_path, status, is_main);

-- Index for follow-up questions lookup
CREATE INDEX IF NOT EXISTS idx_questions_conversation_lang_status 
ON questions(conversation_id, language_path, status);

-- Index for removed_slugs lookup
CREATE INDEX IF NOT EXISTS idx_removed_slugs_slug_lang 
ON removed_slugs(slug, language);

-- Index for comments lookup
CREATE INDEX IF NOT EXISTS idx_comments_question_created 
ON comments(question_id, created_at);

-- Composite index for metadata generation queries
CREATE INDEX IF NOT EXISTS idx_questions_metadata_lookup 
ON questions(status, is_main, language_path, meta_generated);

-- Index for embedding similarity searches (if using pgvector)
-- CREATE INDEX IF NOT EXISTS idx_questions_embedding 
-- ON questions USING ivfflat (embedding vector_cosine_ops) 
-- WITH (lists = 100);

-- Add comments for documentation
COMMENT ON INDEX idx_questions_slug_lang_status_main IS 'Primary index for knowledge page lookups - critical for performance';
COMMENT ON INDEX idx_questions_conversation_lang_status IS 'Index for follow-up questions queries';
COMMENT ON INDEX idx_removed_slugs_slug_lang IS 'Index for checking removed slugs';
COMMENT ON INDEX idx_comments_question_created IS 'Index for comments display on knowledge pages';
COMMENT ON INDEX idx_questions_metadata_lookup IS 'Index for metadata generation and sitemap queries'; 