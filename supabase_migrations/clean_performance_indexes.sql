-- Add critical performance indexes for knowledge pages
-- These indexes will dramatically improve query performance and reduce compute usage

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

-- CRITICAL: Index for filter options queries (prevents full table scans)
CREATE INDEX IF NOT EXISTS idx_questions_filter_options 
ON questions(language_path, is_main, meta_generated, sector, manufacturer, complexity_level, part_type, voltage, current, power_rating, machine_type, product_category, control_type, industry_tag);

-- CRITICAL: Index for live-slugs API (prevents full table scans)
CREATE INDEX IF NOT EXISTS idx_questions_live_slugs 
ON questions(status, is_main, slug) WHERE status = 'live' AND is_main = true;

-- CRITICAL: Index for votes queries
CREATE INDEX IF NOT EXISTS idx_votes_question_user 
ON votes(question_id, user_id, vote_type);

-- CRITICAL: Index for votes by IP
CREATE INDEX IF NOT EXISTS idx_votes_question_ip 
ON votes(question_id, ip_address, vote_type);

-- CRITICAL: Index for user comments
CREATE INDEX IF NOT EXISTS idx_comments_user_created 
ON comments(user_id, created_at);

-- CRITICAL: Index for profiles username lookup
CREATE INDEX IF NOT EXISTS idx_profiles_username 
ON profiles(username);

-- Add comments for documentation
COMMENT ON INDEX idx_questions_slug_lang_status_main IS 'Primary index for knowledge page lookups - critical for performance';
COMMENT ON INDEX idx_questions_conversation_lang_status IS 'Index for follow-up questions queries';
COMMENT ON INDEX idx_removed_slugs_slug_lang IS 'Index for checking removed slugs';
COMMENT ON INDEX idx_comments_question_created IS 'Index for comments display on knowledge pages';
COMMENT ON INDEX idx_questions_metadata_lookup IS 'Index for metadata generation and sitemap queries';
COMMENT ON INDEX idx_questions_filter_options IS 'CRITICAL: Prevents full table scans for filter options - major performance impact';
COMMENT ON INDEX idx_questions_live_slugs IS 'CRITICAL: Prevents full table scans for live-slugs API - major performance impact';
COMMENT ON INDEX idx_votes_question_user IS 'Index for vote lookups by user';
COMMENT ON INDEX idx_votes_question_ip IS 'Index for vote lookups by IP address';
COMMENT ON INDEX idx_comments_user_created IS 'Index for user comments display';
COMMENT ON INDEX idx_profiles_username IS 'Index for username lookups'; 