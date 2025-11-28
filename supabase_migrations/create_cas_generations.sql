-- Add model_generations table for proper car model hierarchy
-- This allows us to have specific generations like BMW 3 Series E46 (1998-2006), E90 (2005-2013), etc.

CREATE TABLE IF NOT EXISTS public.model_generations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    car_model_id UUID NOT NULL REFERENCES public.car_models(id) ON DELETE CASCADE,
    
    -- Generation identification
    name VARCHAR(255) NOT NULL, -- e.g., "E46", "E90", "F30"
    slug VARCHAR(255) NOT NULL, -- e.g., "e46-1998-2006"
    
    -- Year range for this generation
    year_start INTEGER,
    year_end INTEGER, -- NULL if still in production
    
    -- Generation details
    description TEXT,
    generation_code VARCHAR(50), -- Official generation code (E46, W204, etc.)
    
    -- Media
    image_url TEXT,
    sprite_3d_url TEXT,
    
    -- SEO
    meta_title VARCHAR(255),
    meta_description TEXT,
    
    -- Display
    is_featured BOOLEAN DEFAULT false,
    display_order INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- Constraints
    UNIQUE(car_model_id, slug),
    CHECK (year_start IS NULL OR year_start >= 1900),
    CHECK (year_end IS NULL OR year_end >= year_start)
);

-- Update car_faults to reference model_generations instead of car_models
ALTER TABLE public.car_faults 
    ADD COLUMN IF NOT EXISTS model_generation_id UUID REFERENCES public.model_generations(id) ON DELETE CASCADE;

-- Make car_model_id nullable in car_faults (since we now use model_generation_id)
ALTER TABLE public.car_faults 
    ALTER COLUMN car_model_id DROP NOT NULL;

-- Update car_manuals to reference model_generations
ALTER TABLE public.car_manuals
    ADD COLUMN IF NOT EXISTS model_generation_id UUID REFERENCES public.model_generations(id) ON DELETE CASCADE;

-- Make car_model_id nullable in car_manuals (since we now use model_generation_id)
ALTER TABLE public.car_manuals
    ALTER COLUMN car_model_id DROP NOT NULL;

-- Update UNIQUE constraints to use model_generation_id instead of car_model_id
-- Drop old unique constraints (PostgreSQL auto-generates names, so we try common patterns)
DO $$
DECLARE
    constraint_rec RECORD;
BEGIN
    -- Drop unique constraint on car_faults
    FOR constraint_rec IN 
        SELECT constraint_name
        FROM information_schema.table_constraints
        WHERE table_schema = 'public'
          AND table_name = 'car_faults'
          AND constraint_type = 'UNIQUE'
    LOOP
        -- Check if this constraint involves car_model_id, slug, and language_path
        IF EXISTS (
            SELECT 1 FROM information_schema.constraint_column_usage
            WHERE constraint_name = constraint_rec.constraint_name
              AND table_name = 'car_faults'
              AND column_name IN ('car_model_id', 'slug', 'language_path')
            GROUP BY constraint_name
            HAVING COUNT(DISTINCT column_name) = 3
        ) THEN
            EXECUTE format('ALTER TABLE public.car_faults DROP CONSTRAINT IF EXISTS %I', constraint_rec.constraint_name);
        END IF;
    END LOOP;
    
    -- Drop unique constraint on car_manuals
    FOR constraint_rec IN 
        SELECT constraint_name
        FROM information_schema.table_constraints
        WHERE table_schema = 'public'
          AND table_name = 'car_manuals'
          AND constraint_type = 'UNIQUE'
    LOOP
        -- Check if this constraint involves car_model_id, slug, and language_path
        IF EXISTS (
            SELECT 1 FROM information_schema.constraint_column_usage
            WHERE constraint_name = constraint_rec.constraint_name
              AND table_name = 'car_manuals'
              AND column_name IN ('car_model_id', 'slug', 'language_path')
            GROUP BY constraint_name
            HAVING COUNT(DISTINCT column_name) = 3
        ) THEN
            EXECUTE format('ALTER TABLE public.car_manuals DROP CONSTRAINT IF EXISTS %I', constraint_rec.constraint_name);
        END IF;
    END LOOP;
END $$;

-- Create new unique constraints using model_generation_id
DO $$
BEGIN
    -- Add constraint to car_faults if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_schema = 'public'
          AND table_name = 'car_faults'
          AND constraint_name = 'car_faults_generation_slug_language_key'
    ) THEN
        ALTER TABLE public.car_faults 
            ADD CONSTRAINT car_faults_generation_slug_language_key 
            UNIQUE (model_generation_id, slug, language_path);
    END IF;
    
    -- Add constraint to car_manuals if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_schema = 'public'
          AND table_name = 'car_manuals'
          AND constraint_name = 'car_manuals_generation_slug_language_key'
    ) THEN
        ALTER TABLE public.car_manuals 
            ADD CONSTRAINT car_manuals_generation_slug_language_key 
            UNIQUE (model_generation_id, slug, language_path);
    END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_model_generations_car_model_id ON public.model_generations(car_model_id);
CREATE INDEX IF NOT EXISTS idx_model_generations_slug ON public.model_generations(slug);
CREATE INDEX IF NOT EXISTS idx_model_generations_year_range ON public.model_generations(year_start, year_end);
CREATE INDEX IF NOT EXISTS idx_model_generations_featured ON public.model_generations(is_featured, display_order);

CREATE INDEX IF NOT EXISTS idx_car_faults_generation_id ON public.car_faults(model_generation_id);
CREATE INDEX IF NOT EXISTS idx_car_manuals_generation_id ON public.car_manuals(model_generation_id);

-- Enable RLS
ALTER TABLE public.model_generations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for model_generations (drop first if they exist, then create)
DROP POLICY IF EXISTS "model_generations_select_policy" ON public.model_generations;
DROP POLICY IF EXISTS "model_generations_insert_policy" ON public.model_generations;
DROP POLICY IF EXISTS "model_generations_update_policy" ON public.model_generations;
DROP POLICY IF EXISTS "model_generations_delete_policy" ON public.model_generations;

CREATE POLICY "model_generations_select_policy" ON public.model_generations
    FOR SELECT USING (true);

CREATE POLICY "model_generations_insert_policy" ON public.model_generations
    FOR INSERT WITH CHECK (true);

CREATE POLICY "model_generations_update_policy" ON public.model_generations
    FOR UPDATE USING (true);

CREATE POLICY "model_generations_delete_policy" ON public.model_generations
    FOR DELETE USING (true);

-- Comments
COMMENT ON TABLE public.model_generations IS 'Specific generations of car models (e.g., BMW 3 Series E46, E90, F30)';
COMMENT ON COLUMN public.model_generations.generation_code IS 'Official manufacturer generation code';
COMMENT ON COLUMN public.model_generations.year_end IS 'NULL if generation is still in production';

