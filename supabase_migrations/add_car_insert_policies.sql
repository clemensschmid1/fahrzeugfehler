-- Add INSERT policies for car_faults and car_manuals
-- This allows the internal content generator to insert new faults and manuals

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Allow anonymous insert to car_faults" ON public.car_faults;
DROP POLICY IF EXISTS "Allow anonymous insert to car_manuals" ON public.car_manuals;

-- Allow anonymous users to insert (for internal content generator)
CREATE POLICY "Allow anonymous insert to car_faults"
    ON public.car_faults
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

CREATE POLICY "Allow anonymous insert to car_manuals"
    ON public.car_manuals
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- Also allow updates for draft items (so we can update status later)
DROP POLICY IF EXISTS "Allow anonymous update to car_faults" ON public.car_faults;
DROP POLICY IF EXISTS "Allow anonymous update to car_manuals" ON public.car_manuals;

CREATE POLICY "Allow anonymous update to car_faults"
    ON public.car_faults
    FOR UPDATE
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow anonymous update to car_manuals"
    ON public.car_manuals
    FOR UPDATE
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

