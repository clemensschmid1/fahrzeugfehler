-- Add performance indexes for chat functionality
-- These indexes will dramatically improve chat page performance

-- Index for conversation history lookups (most important for chat)
CREATE INDEX IF NOT EXISTS idx_questions_conversation_history 
ON questions(conversation_id, created_at) 
WHERE conversation_id IS NOT NULL;

-- Index for comments by question_id (for chat-related comments)
CREATE INDEX IF NOT EXISTS idx_comments_question_created_desc 
ON comments(question_id, created_at DESC);

-- Composite index for chat metadata polling
CREATE INDEX IF NOT EXISTS idx_questions_meta_polling 
ON questions(id, meta_generated) 
WHERE meta_generated = false;

-- Index for free question limit tracking (if using database instead of localStorage)
-- CREATE INDEX IF NOT EXISTS idx_user_questions_count 
-- ON questions(user_id, created_at) 
-- WHERE user_id IS NOT NULL;

-- Add comments for documentation
COMMENT ON INDEX idx_questions_conversation_history IS 'Critical index for chat conversation history - dramatically improves chat performance';
COMMENT ON INDEX idx_comments_question_created_desc IS 'Index for comments display in chat and knowledge pages';
COMMENT ON INDEX idx_questions_meta_polling IS 'Index for metadata generation polling in chat'; 