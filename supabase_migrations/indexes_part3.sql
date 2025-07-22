-- PART 3: User-Related Indexes (Run this after Part 2)
-- These will improve user experience and reduce compute on user actions

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