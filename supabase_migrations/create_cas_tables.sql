-- Create CAS (Car Assistance System) tables
-- This includes car brands, models, faults, and manuals

-- Car Brands Table
CREATE TABLE IF NOT EXISTS car_brands (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
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

-- Car Models Table
CREATE TABLE IF NOT EXISTS car_models (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    brand_id UUID NOT NULL REFERENCES car_brands(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    year_start INTEGER,
    year_end INTEGER,
    description TEXT,
    image_url TEXT,
    sprite_3d_url TEXT, -- For future 3D sprite implementation
    is_featured BOOLEAN DEFAULT false,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    UNIQUE(brand_id, slug)
);

-- Car Faults Table (similar to questions2 but car-specific)
CREATE TABLE IF NOT EXISTS car_faults (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    car_model_id UUID NOT NULL REFERENCES car_models(id) ON DELETE CASCADE,
    slug TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    solution TEXT NOT NULL,
    language_path TEXT NOT NULL CHECK (language_path IN ('en', 'de')),
    status TEXT NOT NULL DEFAULT 'live' CHECK (status IN ('draft', 'live', 'bin')),
    
    -- Fault-specific fields
    error_code TEXT,
    affected_component TEXT,
    severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    frequency TEXT,
    symptoms TEXT[],
    diagnostic_steps TEXT[],
    tools_required TEXT[],
    estimated_repair_time TEXT,
    difficulty_level TEXT CHECK (difficulty_level IN ('easy', 'medium', 'hard', 'expert')),
    
    -- SEO and metadata
    meta_description TEXT,
    seo_score INTEGER CHECK (seo_score IS NULL OR (seo_score >= 1 AND seo_score <= 99)),
    content_score INTEGER CHECK (content_score IS NULL OR (content_score >= 1 AND content_score <= 99)),
    
    -- Tracking
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    update_count INTEGER DEFAULT 0,
    reviewed_by TEXT,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    
    UNIQUE(car_model_id, slug, language_path)
);

-- Car Manuals Table
CREATE TABLE IF NOT EXISTS car_manuals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    car_model_id UUID NOT NULL REFERENCES car_models(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    slug TEXT NOT NULL,
    content TEXT NOT NULL,
    language_path TEXT NOT NULL CHECK (language_path IN ('en', 'de')),
    status TEXT NOT NULL DEFAULT 'live' CHECK (status IN ('draft', 'live', 'bin')),
    
    -- Manual-specific fields
    manual_type TEXT CHECK (manual_type IN ('maintenance', 'repair', 'diagnostic', 'parts', 'specifications', 'other')),
    section TEXT,
    page_number INTEGER,
    difficulty_level TEXT CHECK (difficulty_level IN ('easy', 'medium', 'hard', 'expert')),
    estimated_time TEXT,
    tools_required TEXT[],
    parts_required TEXT[],
    
    -- SEO and metadata
    meta_description TEXT,
    
    -- Tracking
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    update_count INTEGER DEFAULT 0,
    reviewed_by TEXT,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    
    UNIQUE(car_model_id, slug, language_path)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_car_brands_slug ON car_brands(slug);
CREATE INDEX IF NOT EXISTS idx_car_brands_featured ON car_brands(is_featured, display_order);
CREATE INDEX IF NOT EXISTS idx_car_models_brand_id ON car_models(brand_id);
CREATE INDEX IF NOT EXISTS idx_car_models_slug ON car_models(slug);
CREATE INDEX IF NOT EXISTS idx_car_models_featured ON car_models(is_featured, display_order);
CREATE INDEX IF NOT EXISTS idx_car_faults_model_id ON car_faults(car_model_id);
CREATE INDEX IF NOT EXISTS idx_car_faults_slug ON car_faults(slug);
CREATE INDEX IF NOT EXISTS idx_car_faults_language ON car_faults(language_path);
CREATE INDEX IF NOT EXISTS idx_car_faults_status ON car_faults(status);
CREATE INDEX IF NOT EXISTS idx_car_manuals_model_id ON car_manuals(car_model_id);
CREATE INDEX IF NOT EXISTS idx_car_manuals_slug ON car_manuals(slug);
CREATE INDEX IF NOT EXISTS idx_car_manuals_language ON car_manuals(language_path);
CREATE INDEX IF NOT EXISTS idx_car_manuals_status ON car_manuals(status);
CREATE INDEX IF NOT EXISTS idx_car_manuals_type ON car_manuals(manual_type);

-- Enable Row Level Security
ALTER TABLE car_brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE car_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE car_faults ENABLE ROW LEVEL SECURITY;
ALTER TABLE car_manuals ENABLE ROW LEVEL SECURITY;

-- RLS Policies for car_brands
CREATE POLICY "Allow public read access to car brands"
    ON car_brands FOR SELECT
    TO public
    USING (true);

-- RLS Policies for car_models
CREATE POLICY "Allow public read access to car models"
    ON car_models FOR SELECT
    TO public
    USING (true);

-- RLS Policies for car_faults
CREATE POLICY "Allow public read access to live car faults"
    ON car_faults FOR SELECT
    TO public
    USING (status = 'live');

CREATE POLICY "Allow authenticated users to read all car faults"
    ON car_faults FOR SELECT
    TO authenticated
    USING (true);

-- RLS Policies for car_manuals
CREATE POLICY "Allow public read access to live car manuals"
    ON car_manuals FOR SELECT
    TO public
    USING (status = 'live');

CREATE POLICY "Allow authenticated users to read all car manuals"
    ON car_manuals FOR SELECT
    TO authenticated
    USING (true);

-- Allow service role to insert/update/delete (for API routes)
CREATE POLICY "Allow service role full access to car_brands"
    ON car_brands FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow service role full access to car_models"
    ON car_models FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow service role full access to car_faults"
    ON car_faults FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow service role full access to car_manuals"
    ON car_manuals FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Add comments for documentation
COMMENT ON TABLE car_brands IS 'Car brands/manufacturers for CAS platform';
COMMENT ON TABLE car_models IS 'Car models for each brand';
COMMENT ON TABLE car_faults IS 'Fault descriptions and solutions for car models';
COMMENT ON TABLE car_manuals IS 'Fixing manuals and guides for car models';

