-- TEMPORARY: Disable RLS on questions2 to test if that's the issue
-- WARNING: Only use this for testing! Re-enable RLS after confirming inserts work.

ALTER TABLE questions2 DISABLE ROW LEVEL SECURITY;

-- To re-enable RLS later, run:
-- ALTER TABLE questions2 ENABLE ROW LEVEL SECURITY;
-- Then run fix_questions2_rls_final.sql




