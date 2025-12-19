-- =====================================================
-- Fahrzeugfehler.de - Vollständige Datenbank-Struktur
-- =====================================================
-- Diese Migration erstellt alle notwendigen Tabellen
-- für die Fahrzeugfehler.de Website
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable vector extension for embeddings (if using pgvector)
-- CREATE EXTENSION IF NOT EXISTS "vector";

-- =====================================================
-- 1. CAR BRANDS (Automarken)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.car_brands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    logo_url TEXT,
    description TEXT,
    country TEXT,
    founded_year INTEGER,
    is_featured BOOLEAN DEFAULT false,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- =====================================================
-- 2. CAR MODELS (Automodelle)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.car_models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID NOT NULL REFERENCES public.car_brands(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    year_start INTEGER,
    year_end INTEGER,
    description TEXT,
    image_url TEXT,
    sprite_3d_url TEXT,
    is_featured BOOLEAN DEFAULT false,
    display_order INTEGER DEFAULT 0,
    production_numbers JSONB, -- Für Produktionszahlen
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    UNIQUE(brand_id, slug)
);

-- =====================================================
-- 3. MODEL GENERATIONS (Modellgenerationen)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.model_generations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    car_model_id UUID NOT NULL REFERENCES public.car_models(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL, -- z.B. "E46", "E90", "F30"
    slug VARCHAR(255) NOT NULL, -- z.B. "e46-1998-2006"
    year_start INTEGER,
    year_end INTEGER, -- NULL wenn noch in Produktion
    description TEXT,
    generation_code VARCHAR(50), -- Offizieller Generation-Code (E46, W204, etc.)
    image_url TEXT,
    sprite_3d_url TEXT,
    meta_title VARCHAR(255),
    meta_description TEXT,
    is_featured BOOLEAN DEFAULT false,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    UNIQUE(car_model_id, slug),
    CHECK (year_start IS NULL OR year_start >= 1900),
    CHECK (year_end IS NULL OR year_end >= year_start)
);

-- =====================================================
-- 4. CAR FAULTS (Fahrzeugfehler)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.car_faults (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_generation_id UUID REFERENCES public.model_generations(id) ON DELETE CASCADE,
    car_model_id UUID REFERENCES public.car_models(id) ON DELETE CASCADE,
    slug TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    solution TEXT NOT NULL,
    language_path TEXT NOT NULL DEFAULT 'de' CHECK (language_path IN ('en', 'de')),
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'live', 'bin')),
    
    -- Fehler-spezifische Felder
    error_code TEXT,
    affected_component TEXT,
    severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    frequency TEXT,
    symptoms TEXT[],
    diagnostic_steps TEXT[],
    tools_required TEXT[],
    parts_required TEXT[],
    estimated_repair_time TEXT,
    difficulty_level TEXT CHECK (difficulty_level IN ('easy', 'medium', 'hard', 'expert')),
    
    -- SEO und Metadaten
    meta_title TEXT,
    meta_description TEXT,
    seo_score INTEGER CHECK (seo_score IS NULL OR (seo_score >= 1 AND seo_score <= 99)),
    content_score INTEGER CHECK (content_score IS NULL OR (content_score >= 1 AND content_score <= 99)),
    
    -- Embedding für semantische Suche (optional - benötigt pgvector Extension)
    -- embedding vector(1536), -- OpenAI text-embedding-3-small = 1536 dimensions
    -- Uncomment above line if you have pgvector extension installed
    
    -- Tracking
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    update_count INTEGER DEFAULT 0,
    reviewed_by TEXT,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    
    -- Constraints
    UNIQUE(model_generation_id, slug, language_path),
    CHECK (model_generation_id IS NOT NULL OR car_model_id IS NOT NULL)
);

-- =====================================================
-- 5. CAR MANUALS (Reparaturanleitungen)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.car_manuals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_generation_id UUID REFERENCES public.model_generations(id) ON DELETE CASCADE,
    car_model_id UUID REFERENCES public.car_models(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    content TEXT NOT NULL,
    language_path TEXT NOT NULL DEFAULT 'de' CHECK (language_path IN ('en', 'de')),
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'live', 'bin')),
    
    -- Manual-spezifische Felder
    manual_type TEXT CHECK (manual_type IN ('maintenance', 'repair', 'diagnostic', 'parts', 'specifications', 'other')),
    section TEXT,
    page_number INTEGER,
    difficulty_level TEXT CHECK (difficulty_level IN ('easy', 'medium', 'hard', 'expert')),
    estimated_time TEXT,
    tools_required TEXT[],
    parts_required TEXT[],
    
    -- SEO und Metadaten
    meta_title TEXT,
    meta_description TEXT,
    
    -- Embedding für semantische Suche (optional - benötigt pgvector Extension)
    -- embedding vector(1536), -- OpenAI text-embedding-3-small = 1536 dimensions
    -- Uncomment above line if you have pgvector extension installed
    
    -- Tracking
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    update_count INTEGER DEFAULT 0,
    reviewed_by TEXT,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    
    -- Constraints
    UNIQUE(model_generation_id, slug, language_path),
    CHECK (model_generation_id IS NOT NULL OR car_model_id IS NOT NULL)
);

-- =====================================================
-- FEHLENDE SPALTEN HINZUFÜGEN (für bestehende Tabellen)
-- =====================================================
-- WICHTIG: Diese müssen VOR den Indizes ausgeführt werden!

-- Add missing columns to car_brands if table already exists
ALTER TABLE public.car_brands 
    ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- Add missing columns to car_models if table already exists
ALTER TABLE public.car_models 
    ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS production_numbers JSONB,
    ADD COLUMN IF NOT EXISTS year_start INTEGER,
    ADD COLUMN IF NOT EXISTS year_end INTEGER;

-- Add missing columns to model_generations if table already exists
ALTER TABLE public.model_generations 
    ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- Add missing columns to car_faults if table already exists
-- Die alte Struktur hatte nur car_model_id (NOT NULL), neue Struktur braucht beide
ALTER TABLE public.car_faults 
    ADD COLUMN IF NOT EXISTS model_generation_id UUID REFERENCES public.model_generations(id) ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS car_model_id UUID REFERENCES public.car_models(id) ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS meta_title TEXT,
    ADD COLUMN IF NOT EXISTS meta_description TEXT,
    ADD COLUMN IF NOT EXISTS tools_required TEXT[],
    ADD COLUMN IF NOT EXISTS parts_required TEXT[],
    ADD COLUMN IF NOT EXISTS frequency TEXT,
    ADD COLUMN IF NOT EXISTS symptoms TEXT[],
    ADD COLUMN IF NOT EXISTS diagnostic_steps TEXT[],
    ADD COLUMN IF NOT EXISTS seo_score INTEGER CHECK (seo_score IS NULL OR (seo_score >= 1 AND seo_score <= 99)),
    ADD COLUMN IF NOT EXISTS content_score INTEGER CHECK (content_score IS NULL OR (content_score >= 1 AND content_score <= 99));

-- Make car_model_id nullable in car_faults (wenn es NOT NULL war)
DO $$
BEGIN
    -- Check if car_model_id exists and is NOT NULL, then make it nullable
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'car_faults' 
        AND column_name = 'car_model_id'
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE public.car_faults ALTER COLUMN car_model_id DROP NOT NULL;
    END IF;
END $$;

-- Add missing columns to car_manuals if table already exists
ALTER TABLE public.car_manuals 
    ADD COLUMN IF NOT EXISTS model_generation_id UUID REFERENCES public.model_generations(id) ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS car_model_id UUID REFERENCES public.car_models(id) ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS description TEXT,
    ADD COLUMN IF NOT EXISTS meta_title TEXT;

-- Make car_model_id nullable in car_manuals (wenn es NOT NULL war)
DO $$
BEGIN
    -- Check if car_model_id exists and is NOT NULL, then make it nullable
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'car_manuals' 
        AND column_name = 'car_model_id'
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE public.car_manuals ALTER COLUMN car_model_id DROP NOT NULL;
    END IF;
END $$;

-- Update UNIQUE constraints for car_faults and car_manuals
-- Drop old constraints if they exist (based on car_model_id)
DO $$
DECLARE
    constraint_rec RECORD;
BEGIN
    -- Drop old unique constraint on car_faults if it exists
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
    
    -- Drop old unique constraint on car_manuals if it exists
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

-- Create new unique constraints using model_generation_id (if column exists)
DO $$
BEGIN
    -- Add constraint to car_faults if model_generation_id exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'car_faults' 
        AND column_name = 'model_generation_id'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_schema = 'public'
          AND table_name = 'car_faults'
          AND constraint_name = 'car_faults_generation_slug_language_key'
    ) THEN
        ALTER TABLE public.car_faults 
            ADD CONSTRAINT car_faults_generation_slug_language_key 
            UNIQUE (model_generation_id, slug, language_path);
    END IF;
    
    -- Add constraint to car_manuals if model_generation_id exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'car_manuals' 
        AND column_name = 'model_generation_id'
    ) AND NOT EXISTS (
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

-- =====================================================
-- INDIZES FÜR PERFORMANCE
-- =====================================================

-- Car Brands Indizes
CREATE INDEX IF NOT EXISTS idx_car_brands_slug ON public.car_brands(slug);
CREATE INDEX IF NOT EXISTS idx_car_brands_featured ON public.car_brands(is_featured, display_order);
CREATE INDEX IF NOT EXISTS idx_car_brands_country ON public.car_brands(country);

-- Car Models Indizes
CREATE INDEX IF NOT EXISTS idx_car_models_brand_id ON public.car_models(brand_id);
CREATE INDEX IF NOT EXISTS idx_car_models_slug ON public.car_models(slug);
CREATE INDEX IF NOT EXISTS idx_car_models_featured ON public.car_models(is_featured, display_order);

-- Model Generations Indizes
CREATE INDEX IF NOT EXISTS idx_model_generations_model_id ON public.model_generations(car_model_id);
CREATE INDEX IF NOT EXISTS idx_model_generations_slug ON public.model_generations(slug);
CREATE INDEX IF NOT EXISTS idx_model_generations_display_order ON public.model_generations(display_order, year_start DESC);

-- Car Faults Indizes (nur erstellen wenn Spalten existieren)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'car_faults' 
        AND column_name = 'model_generation_id'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_car_faults_generation_id ON public.car_faults(model_generation_id);
    END IF;
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'car_faults' 
        AND column_name = 'car_model_id'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_car_faults_model_id ON public.car_faults(car_model_id);
    END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_car_faults_slug ON public.car_faults(slug);
CREATE INDEX IF NOT EXISTS idx_car_faults_language ON public.car_faults(language_path);
CREATE INDEX IF NOT EXISTS idx_car_faults_status ON public.car_faults(status);
CREATE INDEX IF NOT EXISTS idx_car_faults_error_code ON public.car_faults(error_code) WHERE error_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_car_faults_severity ON public.car_faults(severity) WHERE severity IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_car_faults_created_at ON public.car_faults(created_at DESC);

-- Car Manuals Indizes (nur erstellen wenn Spalten existieren)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'car_manuals' 
        AND column_name = 'model_generation_id'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_car_manuals_generation_id ON public.car_manuals(model_generation_id);
    END IF;
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'car_manuals' 
        AND column_name = 'car_model_id'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_car_manuals_model_id ON public.car_manuals(car_model_id);
    END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_car_manuals_slug ON public.car_manuals(slug);
CREATE INDEX IF NOT EXISTS idx_car_manuals_language ON public.car_manuals(language_path);
CREATE INDEX IF NOT EXISTS idx_car_manuals_status ON public.car_manuals(status);
CREATE INDEX IF NOT EXISTS idx_car_manuals_type ON public.car_manuals(manual_type) WHERE manual_type IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_car_manuals_created_at ON public.car_manuals(created_at DESC);

-- =====================================================
-- TRIGGER FÜR updated_at
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers für alle Tabellen (drop first if exists)
DROP TRIGGER IF EXISTS update_car_brands_updated_at ON public.car_brands;
DROP TRIGGER IF EXISTS update_car_models_updated_at ON public.car_models;
DROP TRIGGER IF EXISTS update_model_generations_updated_at ON public.model_generations;
DROP TRIGGER IF EXISTS update_car_faults_updated_at ON public.car_faults;
DROP TRIGGER IF EXISTS update_car_manuals_updated_at ON public.car_manuals;

CREATE TRIGGER update_car_brands_updated_at
    BEFORE UPDATE ON public.car_brands
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_car_models_updated_at
    BEFORE UPDATE ON public.car_models
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_model_generations_updated_at
    BEFORE UPDATE ON public.model_generations
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_car_faults_updated_at
    BEFORE UPDATE ON public.car_faults
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_car_manuals_updated_at
    BEFORE UPDATE ON public.car_manuals
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS für alle Tabellen
ALTER TABLE public.car_brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.car_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.model_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.car_faults ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.car_manuals ENABLE ROW LEVEL SECURITY;

-- Policies: Öffentlicher Lesezugriff für alle
-- Drop existing policies first to avoid conflicts
DROP POLICY IF EXISTS "Public read access for car_brands" ON public.car_brands;
DROP POLICY IF EXISTS "Public read access for car_models" ON public.car_models;
DROP POLICY IF EXISTS "Public read access for model_generations" ON public.model_generations;
DROP POLICY IF EXISTS "Public read access for car_faults" ON public.car_faults;
DROP POLICY IF EXISTS "Public read access for car_manuals" ON public.car_manuals;

CREATE POLICY "Public read access for car_brands"
    ON public.car_brands FOR SELECT
    USING (true);

CREATE POLICY "Public read access for car_models"
    ON public.car_models FOR SELECT
    USING (true);

CREATE POLICY "Public read access for model_generations"
    ON public.model_generations FOR SELECT
    USING (true);

CREATE POLICY "Public read access for car_faults"
    ON public.car_faults FOR SELECT
    USING (status = 'live');

CREATE POLICY "Public read access for car_manuals"
    ON public.car_manuals FOR SELECT
    USING (status = 'live');

-- Service Role Policies (für API-Routen mit Service Role Key)
-- Drop existing policies first to avoid conflicts
DROP POLICY IF EXISTS "Service role full access to car_brands" ON public.car_brands;
DROP POLICY IF EXISTS "Service role full access to car_models" ON public.car_models;
DROP POLICY IF EXISTS "Service role full access to model_generations" ON public.model_generations;
DROP POLICY IF EXISTS "Service role full access to car_faults" ON public.car_faults;
DROP POLICY IF EXISTS "Service role full access to car_manuals" ON public.car_manuals;

CREATE POLICY "Service role full access to car_brands"
    ON public.car_brands FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Service role full access to car_models"
    ON public.car_models FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Service role full access to model_generations"
    ON public.model_generations FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Service role full access to car_faults"
    ON public.car_faults FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Service role full access to car_manuals"
    ON public.car_manuals FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- =====================================================
-- KOMMENTARE FÜR DOKUMENTATION
-- =====================================================

COMMENT ON TABLE public.car_brands IS 'Automarken (z.B. BMW, Mercedes, Audi)';
COMMENT ON TABLE public.car_models IS 'Automodelle (z.B. BMW 3er, Mercedes C-Klasse)';
COMMENT ON TABLE public.model_generations IS 'Modellgenerationen (z.B. BMW 3er E46, E90, F30)';
COMMENT ON TABLE public.car_faults IS 'Fahrzeugfehler und deren Lösungen';
COMMENT ON TABLE public.car_manuals IS 'Reparatur- und Wartungsanleitungen';

COMMENT ON COLUMN public.car_faults.language_path IS 'Sprache: de (Deutsch) oder en (Englisch)';
COMMENT ON COLUMN public.car_faults.status IS 'Status: draft (Entwurf), live (veröffentlicht), bin (gelöscht)';
COMMENT ON COLUMN public.car_faults.severity IS 'Schweregrad: low, medium, high, critical';
COMMENT ON COLUMN public.car_faults.difficulty_level IS 'Schwierigkeitsgrad: easy, medium, hard, expert';

-- =====================================================
-- FERTIG!
-- =====================================================
-- Die Datenbank-Struktur ist jetzt bereit für Fahrzeugfehler.de
-- Du kannst jetzt Daten einfügen und die Website verwenden
-- =====================================================

