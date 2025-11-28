-- Simple cleanup script - works even if generated_profiles table doesn't exist
-- Run this in Supabase SQL Editor

-- Step 1: Delete the last 38 car_comments (most recent first)
DELETE FROM car_comments
WHERE id IN (
  SELECT id
  FROM car_comments
  ORDER BY created_at DESC
  LIMIT 38
);

-- Step 2: Delete generated profiles from the profiles table
-- This finds profiles with usernames that look like generated ones (user_* pattern)
-- and deletes the last 10 most recent ones
DELETE FROM profiles
WHERE id IN (
  SELECT p.id
  FROM profiles p
  WHERE p.username LIKE 'user_%' 
     OR p.username LIKE '%@generated.local'
     OR EXISTS (
       SELECT 1 
       FROM auth.users u 
       WHERE u.id = p.id 
       AND u.raw_user_meta_data->>'auto_generated' = 'true'
     )
  ORDER BY p.created_at DESC
  LIMIT 10
);

-- Step 3: Clean up orphaned auth users (if any)
-- Note: This may require admin access in Supabase Dashboard
-- Uncomment if needed:
/*
DELETE FROM auth.users
WHERE id IN (
  SELECT u.id
  FROM auth.users u
  WHERE u.raw_user_meta_data->>'auto_generated' = 'true'
    AND NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = u.id)
  ORDER BY u.created_at DESC
  LIMIT 10
);
*/

-- Verification queries (run these to check):
-- SELECT COUNT(*) as remaining_comments FROM car_comments;
-- SELECT COUNT(*) as remaining_generated_profiles FROM profiles WHERE username LIKE 'user_%';
-- SELECT id, username, created_at FROM profiles WHERE username LIKE 'user_%' ORDER BY created_at DESC LIMIT 20;

