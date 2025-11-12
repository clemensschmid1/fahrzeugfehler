-- Final comprehensive fix for questions2 RLS policies
-- This will ensure inserts work from API routes using anon key

-- Step 1: Drop ALL existing policies (using a more aggressive approach)
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'questions2') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON questions2';
    END LOOP;
END $$;

-- Step 2: Create a completely permissive INSERT policy
-- This allows ANYONE to insert (rate limiting handled in app)
CREATE POLICY "questions2_insert_permissive"
ON questions2
FOR INSERT
WITH CHECK (true);

-- Step 3: Create SELECT policies
CREATE POLICY "questions2_select_public"
ON questions2
FOR SELECT
USING (status = 'live');

CREATE POLICY "questions2_select_authenticated"
ON questions2
FOR SELECT
TO authenticated
USING (true);

-- Step 4: Create UPDATE and DELETE policies
CREATE POLICY "questions2_update_permissive"
ON questions2
FOR UPDATE
USING (true)
WITH CHECK (true);

CREATE POLICY "questions2_delete_permissive"
ON questions2
FOR DELETE
USING (true);

-- Verify RLS is enabled
ALTER TABLE questions2 ENABLE ROW LEVEL SECURITY;


