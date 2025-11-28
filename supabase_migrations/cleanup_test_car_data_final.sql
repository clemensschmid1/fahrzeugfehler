-- Final cleanup script - deletes last 10 profiles and 38 comments
-- Run this in Supabase SQL Editor
-- This assumes generated_profiles table exists

-- Step 1: Delete the last 38 car_comments (most recent first)
DELETE FROM car_comments
WHERE id IN (
  SELECT id
  FROM car_comments
  ORDER BY created_at DESC
  LIMIT 38
);

-- Step 2: Get the IDs of the last 10 generated profiles before deleting
-- This helps us clean up related auth users and profiles
DO $$
DECLARE
  profile_ids UUID[];
BEGIN
  -- Get the IDs of profiles to delete
  SELECT ARRAY_AGG(id) INTO profile_ids
  FROM generated_profiles
  ORDER BY generated_at DESC
  LIMIT 10;

  -- Delete from generated_profiles (this will cascade to auth.users if foreign key is set up)
  IF profile_ids IS NOT NULL AND array_length(profile_ids, 1) > 0 THEN
    DELETE FROM generated_profiles
    WHERE id = ANY(profile_ids);
    
    RAISE NOTICE 'Deleted % profiles from generated_profiles', array_length(profile_ids, 1);
    
    -- Also delete from profiles table (in case cascade doesn't work)
    DELETE FROM profiles
    WHERE id = ANY(profile_ids);
    
    RAISE NOTICE 'Deleted % profiles from profiles table', array_length(profile_ids, 1);
  ELSE
    RAISE NOTICE 'No profiles found to delete';
  END IF;
END $$;

-- Step 3: Verification - check what's left
-- Uncomment these to see the results:
/*
SELECT COUNT(*) as remaining_comments FROM car_comments;
SELECT COUNT(*) as remaining_profiles FROM generated_profiles;
SELECT id, username, generated_at, comments_count 
FROM generated_profiles 
ORDER BY generated_at DESC 
LIMIT 20;
*/

