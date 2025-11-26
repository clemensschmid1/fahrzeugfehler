-- Seed data for model generations with proper hierarchy
-- This creates specific generations for each model

-- First, get the model IDs (assuming seed_cas_data.sql has run)
DO $$
DECLARE
    bmw_3_series_id UUID;
    bmw_5_series_id UUID;
    mercedes_c_class_id UUID;
    mercedes_e_class_id UUID;
    
    -- BMW 3 Series Generations
    e46_id UUID;
    e90_id UUID;
    f30_id UUID;
    
    -- BMW 5 Series Generations
    e39_id UUID;
    e60_id UUID;
    f10_id UUID;
    
    -- Mercedes C-Class Generations
    w203_id UUID;
    w204_id UUID;
    w205_id UUID;
    
    -- Mercedes E-Class Generations
    w210_id UUID;
    w211_id UUID;
    w212_id UUID;
BEGIN
    -- Get model IDs
    SELECT id INTO bmw_3_series_id FROM car_models WHERE slug = '3-series' LIMIT 1;
    SELECT id INTO bmw_5_series_id FROM car_models WHERE slug = '5-series' LIMIT 1;
    SELECT id INTO mercedes_c_class_id FROM car_models WHERE slug = 'c-class' LIMIT 1;
    SELECT id INTO mercedes_e_class_id FROM car_models WHERE slug = 'e-class' LIMIT 1;
    
    -- ========================================
    -- BMW 3 SERIES GENERATIONS
    -- ========================================
    
    -- E46 (1998-2006)
    INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
    VALUES (
        gen_random_uuid(),
        bmw_3_series_id,
        'E46 (1998-2006)',
        'e46-1998-2006',
        1998,
        2006,
        'E46',
        'Fourth generation BMW 3 Series. Known for excellent handling and reliable inline-6 engines. Popular models include 330i, M3.',
        true,
        1
    ) RETURNING id INTO e46_id;
    
    -- E90/E91/E92/E93 (2005-2013)
    INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
    VALUES (
        gen_random_uuid(),
        bmw_3_series_id,
        'E90/E91/E92/E93 (2005-2013)',
        'e90-2005-2013',
        2005,
        2013,
        'E90',
        'Fifth generation BMW 3 Series. First to feature iDrive and run-flat tires as standard. Popular models include 335i, M3.',
        true,
        2
    ) RETURNING id INTO e90_id;
    
    -- F30/F31 (2012-2019)
    INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
    VALUES (
        gen_random_uuid(),
        bmw_3_series_id,
        'F30/F31 (2012-2019)',
        'f30-2012-2019',
        2012,
        2019,
        'F30',
        'Sixth generation BMW 3 Series. Features turbocharged engines across the range and improved fuel efficiency.',
        false,
        3
    ) RETURNING id INTO f30_id;
    
    -- ========================================
    -- BMW 5 SERIES GENERATIONS
    -- ========================================
    
    -- E39 (1995-2003)
    INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
    VALUES (
        gen_random_uuid(),
        bmw_5_series_id,
        'E39 (1995-2003)',
        'e39-1995-2003',
        1995,
        2003,
        'E39',
        'Fourth generation BMW 5 Series. Considered one of the best BMWs ever made. Features excellent build quality and the legendary M5.',
        true,
        1
    ) RETURNING id INTO e39_id;
    
    -- E60/E61 (2003-2010)
    INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
    VALUES (
        gen_random_uuid(),
        bmw_5_series_id,
        'E60/E61 (2003-2010)',
        'e60-2003-2010',
        2003,
        2010,
        'E60',
        'Fifth generation BMW 5 Series. Controversial design with Bangle styling. Features iDrive and advanced electronics.',
        true,
        2
    ) RETURNING id INTO e60_id;
    
    -- F10/F11 (2010-2017)
    INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
    VALUES (
        gen_random_uuid(),
        bmw_5_series_id,
        'F10/F11 (2010-2017)',
        'f10-2010-2017',
        2010,
        2017,
        'F10',
        'Sixth generation BMW 5 Series. Features turbocharged engines, improved efficiency, and refined driving dynamics.',
        false,
        3
    ) RETURNING id INTO f10_id;
    
    -- ========================================
    -- MERCEDES C-CLASS GENERATIONS
    -- ========================================
    
    -- W203 (2000-2007)
    INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
    VALUES (
        gen_random_uuid(),
        mercedes_c_class_id,
        'W203 (2000-2007)',
        'w203-2000-2007',
        2000,
        2007,
        'W203',
        'Second generation Mercedes C-Class. More modern design and improved safety features. Popular with the C32 AMG and C55 AMG.',
        true,
        1
    ) RETURNING id INTO w203_id;
    
    -- W204 (2007-2014)
    INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
    VALUES (
        gen_random_uuid(),
        mercedes_c_class_id,
        'W204 (2007-2014)',
        'w204-2007-2014',
        2007,
        2014,
        'W204',
        'Third generation Mercedes C-Class. Major redesign with improved quality and the powerful C63 AMG with 6.2L V8.',
        true,
        2
    ) RETURNING id INTO w204_id;
    
    -- W205 (2014-2021)
    INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
    VALUES (
        gen_random_uuid(),
        mercedes_c_class_id,
        'W205 (2014-2021)',
        'w205-2014-2021',
        2014,
        2021,
        'W205',
        'Fourth generation Mercedes C-Class. Features advanced technology, turbocharged engines throughout, and the 4.0L V8 AMG.',
        false,
        3
    ) RETURNING id INTO w205_id;
    
    -- ========================================
    -- MERCEDES E-CLASS GENERATIONS
    -- ========================================
    
    -- W210 (1995-2002)
    INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
    VALUES (
        gen_random_uuid(),
        mercedes_e_class_id,
        'W210 (1995-2002)',
        'w210-1995-2002',
        1995,
        2002,
        'W210',
        'Third generation Mercedes E-Class. Known for distinctive quad headlights and excellent comfort. Features E55 AMG.',
        true,
        1
    ) RETURNING id INTO w210_id;
    
    -- W211 (2002-2009)
    INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
    VALUES (
        gen_random_uuid(),
        mercedes_e_class_id,
        'W211 (2002-2009)',
        'w211-2002-2009',
        2002,
        2009,
        'W211',
        'Fourth generation Mercedes E-Class. Features modern technology, AIRMATIC suspension, and the powerful E55/E63 AMG.',
        true,
        2
    ) RETURNING id INTO w211_id;
    
    -- W212 (2009-2016)
    INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
    VALUES (
        gen_random_uuid(),
        mercedes_e_class_id,
        'W212 (2009-2016)',
        'w212-2009-2016',
        2009,
        2016,
        'W212',
        'Fifth generation Mercedes E-Class. Refined styling, advanced safety features, and the twin-turbo E63 AMG.',
        false,
        3
    ) RETURNING id INTO w212_id;
    
    -- ========================================
    -- UPDATE EXISTING FAULTS TO USE GENERATIONS
    -- ========================================
    
    -- Update BMW 3 Series faults to E46 generation
    UPDATE car_faults 
    SET model_generation_id = e46_id
    WHERE car_model_id = bmw_3_series_id;
    
    -- Update BMW 5 Series faults to E39 generation
    UPDATE car_faults 
    SET model_generation_id = e39_id
    WHERE car_model_id = bmw_5_series_id;
    
    -- Update Mercedes C-Class faults to W203 generation  
    UPDATE car_faults 
    SET model_generation_id = w203_id
    WHERE car_model_id = mercedes_c_class_id;
    
    -- Update Mercedes E-Class faults to W210 generation
    UPDATE car_faults 
    SET model_generation_id = w210_id
    WHERE car_model_id = mercedes_e_class_id;
    
    -- ========================================
    -- UPDATE EXISTING MANUALS TO USE GENERATIONS
    -- ========================================
    
    -- Update BMW 3 Series manuals to E46 generation
    UPDATE car_manuals 
    SET model_generation_id = e46_id
    WHERE car_model_id = bmw_3_series_id;
    
    -- Update BMW 5 Series manuals to E39 generation
    UPDATE car_manuals 
    SET model_generation_id = e39_id
    WHERE car_model_id = bmw_5_series_id;
    
    -- Update Mercedes C-Class manuals to W203 generation
    UPDATE car_manuals 
    SET model_generation_id = w203_id
    WHERE car_model_id = mercedes_c_class_id;
    
    -- Update Mercedes E-Class manuals to W210 generation
    UPDATE car_manuals 
    SET model_generation_id = w210_id
    WHERE car_model_id = mercedes_e_class_id;
    
END $$;

