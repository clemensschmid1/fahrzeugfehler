-- SQL to delete the last 10 generated profiles and 38 comments
-- Run this in Supabase SQL Editor
-- 
-- IMPORTANT: Make sure to run create_generated_profiles_table.sql first if the table doesn't exist!

-- Step 1: Delete the last 38 car_comments (most recent first)
DELETE FROM car_comments
WHERE id IN (
  SELECT id
  FROM car_comments
  ORDER BY created_at DESC
  LIMIT 38
);

-- Step 2: Delete the last 10 generated profiles (most recent first)
-- This will also cascade delete the auth users and profiles entries
-- Only run this if generated_profiles table exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'generated_profiles') THEN
    DELETE FROM generated_profiles
    WHERE id IN (
      SELECT id
      FROM generated_profiles
      ORDER BY generated_at DESC
      LIMIT 10
    );
    RAISE NOTICE 'Deleted profiles from generated_profiles table';
  ELSE
    RAISE NOTICE 'generated_profiles table does not exist. Skipping profile deletion.';
    RAISE NOTICE 'To create the table, run: supabase_migrations/create_generated_profiles_table.sql';
  END IF;
END $$;

-- Step 3: Clean up any orphaned auth users (if cascade didn't work)
-- Note: This requires admin access, may need to run in Supabase Dashboard
-- DELETE FROM auth.users
-- WHERE id IN (
--   SELECT id
--   FROM generated_profiles
--   WHERE id NOT IN (SELECT id FROM generated_profiles)
-- );

-- Verification queries (run these to check):
-- SELECT COUNT(*) as remaining_comments FROM car_comments;
-- SELECT COUNT(*) as remaining_profiles FROM generated_profiles;
-- SELECT id, username, generated_at, comments_count FROM generated_profiles ORDER BY generated_at DESC LIMIT 20;

