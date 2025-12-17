-- Add parts_required and safety_warnings columns to car_faults table
ALTER TABLE public.car_faults 
ADD COLUMN IF NOT EXISTS parts_required TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS safety_warnings TEXT[] DEFAULT '{}';

-- Add comments
COMMENT ON COLUMN public.car_faults.parts_required IS 'Array of parts/components required for the repair';
COMMENT ON COLUMN public.car_faults.safety_warnings IS 'Array of safety warnings for this repair procedure';









