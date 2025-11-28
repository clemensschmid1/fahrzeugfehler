-- Add meta_title column to car_faults and car_manuals for better SEO

-- Add meta_title to car_faults
ALTER TABLE public.car_faults
ADD COLUMN IF NOT EXISTS meta_title VARCHAR(255);

COMMENT ON COLUMN public.car_faults.meta_title IS 'SEO-optimized title for the fault page (50-60 characters recommended)';

-- Add meta_title to car_manuals
ALTER TABLE public.car_manuals
ADD COLUMN IF NOT EXISTS meta_title VARCHAR(255);

COMMENT ON COLUMN public.car_manuals.meta_title IS 'SEO-optimized title for the manual page (50-60 characters recommended)';

