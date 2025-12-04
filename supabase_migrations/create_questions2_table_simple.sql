-- Create questions2 table for new production version
-- This table is separate from questions and will be used for all new chat questions

CREATE TABLE IF NOT EXISTS questions2 (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    slug TEXT UNIQUE,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    language_path TEXT NOT NULL CHECK (language_path IN ('en', 'de')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'live', 'bin')),
    
    -- Optional fields
    header TEXT,
    manufacturer TEXT,
    part_type TEXT,
    part_series TEXT,
    embedding vector(1536),
    seo_score INTEGER CHECK (seo_score IS NULL OR (seo_score >= 1 AND seo_score <= 99)),
    content_score INTEGER CHECK (content_score IS NULL OR (content_score >= 1 AND content_score <= 99)),
    expertise_score INTEGER CHECK (expertise_score IS NULL OR (expertise_score >= 1 AND expertise_score <= 99)),
    helpfulness_score INTEGER CHECK (helpfulness_score IS NULL OR (helpfulness_score >= 1 AND helpfulness_score <= 99)),
    meta_description TEXT,
    parent_id UUID REFERENCES questions2(id) ON DELETE SET NULL,
    conversation_id UUID,
    is_main BOOLEAN DEFAULT true,
    meta_generated BOOLEAN DEFAULT false,
    sector TEXT,
    related_slugs TEXT[],
    question_type TEXT,
    affected_components TEXT[],
    error_code TEXT,
    complexity_level TEXT,
    related_processes TEXT[],
    confidentiality_flag BOOLEAN DEFAULT false,
    voltage TEXT,
    current TEXT,
    power_rating TEXT,
    machine_type TEXT,
    application_area TEXT[],
    product_category TEXT,
    electrical_type TEXT,
    control_type TEXT,
    relevant_standards TEXT[],
    mounting_type TEXT,
    cooling_method TEXT,
    communication_protocols TEXT[],
    manufacturer_mentions TEXT[],
    risk_keywords TEXT[],
    tools_involved TEXT[],
    installation_context TEXT,
    sensor_type TEXT,
    mechanical_component TEXT,
    industry_tag TEXT,
    maintenance_relevance BOOLEAN,
    failure_mode TEXT,
    software_context TEXT,
    
    -- Human authorship fields
    reviewed_by TEXT,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    update_count INTEGER DEFAULT 0,
    editor_notes TEXT
);






