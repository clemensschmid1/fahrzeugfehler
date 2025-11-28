-- Cleanup script - Run this now to delete last 10 profiles and 38 comments
-- Run this in Supabase SQL Editor

-- Step 1: Delete the last 38 car_comments (most recent first)
DELETE FROM car_comments
WHERE id IN (
  SELECT id
  FROM car_comments
  ORDER BY created_at DESC
  LIMIT 38
);

-- Step 2: Delete the last 10 generated profiles
-- This will cascade delete auth users and profiles entries
DELETE FROM generated_profiles
WHERE id IN (
  SELECT id
  FROM generated_profiles
  ORDER BY generated_at DESC
  LIMIT 10
);

-- Done! The cascade should handle auth.users and profiles deletion automatically.
-- If you want to verify, run these queries:
-- SELECT COUNT(*) as remaining_comments FROM car_comments;
-- SELECT COUNT(*) as remaining_profiles FROM generated_profiles;

