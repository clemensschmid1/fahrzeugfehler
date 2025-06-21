-- Add ip_address column to votes table for unauthenticated user voting
-- Run this in your Supabase SQL editor

ALTER TABLE votes 
ADD COLUMN IF NOT EXISTS ip_address TEXT;

-- Create an index for better performance when querying by IP
CREATE INDEX IF NOT EXISTS idx_votes_ip_address ON votes(ip_address);

-- Add a constraint to ensure either user_id or ip_address is present
ALTER TABLE votes 
ADD CONSTRAINT check_voter_identifier 
CHECK (user_id IS NOT NULL OR ip_address IS NOT NULL); 