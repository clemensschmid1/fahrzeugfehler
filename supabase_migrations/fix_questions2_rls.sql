-- Fix RLS policies for questions2 table
-- Run this if the table already exists and you just need to fix the policies

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Allow public read access to live questions2" ON questions2;
DROP POLICY IF EXISTS "Allow authenticated users to read draft questions2" ON questions2;
DROP POLICY IF EXISTS "Allow anonymous insert questions2" ON questions2;
DROP POLICY IF EXISTS "Allow anonymous update questions2" ON questions2;
DROP POLICY IF EXISTS "Allow anonymous delete questions2" ON questions2;

-- RLS Policy: Allow public read access to live questions
CREATE POLICY "Allow public read access to live questions2"
ON questions2
FOR SELECT
TO public
USING (status = 'live');

-- RLS Policy: Allow authenticated users to read draft questions (for their own content)
CREATE POLICY "Allow authenticated users to read draft questions2"
ON questions2
FOR SELECT
TO authenticated
USING (status = 'draft' OR status = 'live' OR status = 'bin');

-- RLS Policy: Allow anonymous inserts (for API routes with anon key)
-- Rate limiting and validation handled in application layer
-- This policy allows anyone to insert rows (rate limiting is handled in the application)
-- IMPORTANT: No TO clause means it applies to ALL roles including anon
CREATE POLICY "Allow anonymous insert questions2"
ON questions2
FOR INSERT
WITH CHECK (true);

-- RLS Policy: Allow anonymous updates (for API routes)
CREATE POLICY "Allow anonymous update questions2"
ON questions2
FOR UPDATE
USING (true)
WITH CHECK (true);

-- RLS Policy: Allow anonymous deletes (for API routes)
CREATE POLICY "Allow anonymous delete questions2"
ON questions2
FOR DELETE
USING (true);
