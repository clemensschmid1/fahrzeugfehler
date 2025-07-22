-- PART 4: Documentation Comments (Run this last)
-- These add helpful comments to the indexes

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