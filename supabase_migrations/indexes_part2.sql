-- PART 2: Secondary Important Indexes (Run this after Part 1)
-- These will further improve performance

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