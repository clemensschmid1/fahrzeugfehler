-- Add production_numbers column to car_models table
-- This stores the total number of units produced for each model

ALTER TABLE public.car_models 
    ADD COLUMN IF NOT EXISTS production_numbers TEXT;

COMMENT ON COLUMN public.car_models.production_numbers IS 'Total number of units produced (e.g., "50,000,000+", "Over 1 million", etc.)';

