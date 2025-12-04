-- Create indexes for questions2 table

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






