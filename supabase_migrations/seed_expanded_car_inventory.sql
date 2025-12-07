-- Expanded Car Inventory Seed
-- Adds popular brands, models, and generations for comprehensive coverage
-- This migration is idempotent and can be run multiple times safely

DO $$
DECLARE
  bmw_id UUID;
  mercedes_id UUID;
  tesla_id UUID;
  kia_id UUID;
  mazda_id UUID;
  subaru_id UUID;
  toyota_id UUID;
  honda_id UUID;
  ford_id UUID;
  volkswagen_id UUID;
  -- Model IDs
  bmw_3series_id UUID;
  bmw_5series_id UUID;
  bmw_x3_id UUID;
  bmw_x5_id UUID;
  mercedes_cclass_id UUID;
  mercedes_eclass_id UUID;
  mercedes_glc_id UUID;
  tesla_model3_id UUID;
  tesla_modely_id UUID;
  tesla_models_id UUID;
  kia_sportage_id UUID;
  kia_sorento_id UUID;
  mazda_cx5_id UUID;
  mazda_cx9_id UUID;
  subaru_outback_id UUID;
  subaru_forester_id UUID;
  toyota_rav4_id UUID;
  toyota_camry_id UUID;
  toyota_highlander_id UUID;
  honda_crv_id UUID;
  honda_accord_id UUID;
  honda_pilot_id UUID;
  ford_f150_id UUID;
  ford_explorer_id UUID;
  vw_golf_id UUID;
  vw_tiguan_id UUID;
BEGIN
  -- ============================================
  -- BMW - German Luxury Brand
  -- ============================================
  -- First, try to get existing brand by name or slug
  SELECT id INTO bmw_id FROM car_brands WHERE name = 'BMW' OR slug = 'bmw' LIMIT 1;
  
  -- If brand doesn't exist, insert it
  IF bmw_id IS NULL THEN
    INSERT INTO car_brands (id, name, slug, description, country, founded_year, is_featured, display_order) VALUES
      ('bb0e8400-e29b-41d4-a716-446655440001', 'BMW', 'bmw', 'Bayerische Motoren Werke AG - German luxury automotive manufacturer known for performance, engineering excellence, and the "Ultimate Driving Machine" philosophy. Founded in 1916.', 'Germany', 1916, true, 1)
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      slug = EXCLUDED.slug,
      description = EXCLUDED.description,
      country = EXCLUDED.country,
      founded_year = EXCLUDED.founded_year,
      is_featured = EXCLUDED.is_featured,
      display_order = EXCLUDED.display_order;
    
    SELECT id INTO bmw_id FROM car_brands WHERE name = 'BMW' OR slug = 'bmw' LIMIT 1;
  ELSE
    -- Update existing brand if needed
    UPDATE car_brands SET
      description = 'Bayerische Motoren Werke AG - German luxury automotive manufacturer known for performance, engineering excellence, and the "Ultimate Driving Machine" philosophy. Founded in 1916.',
      country = 'Germany',
      founded_year = 1916,
      is_featured = true,
      display_order = 1
    WHERE id = bmw_id;
  END IF;

  -- BMW 3 Series
  INSERT INTO car_models (id, brand_id, name, slug, year_start, year_end, description, production_numbers, is_featured, display_order) VALUES
    ('bb1e8400-e29b-41d4-a716-446655440001', bmw_id, '3 Series', '3-series', 1975, NULL, 'The BMW 3 Series is a compact executive car, BMW''s best-selling model. Known for sporty handling, premium quality, and advanced technology. Available in sedan, wagon, and Gran Turismo body styles.', 'Over 15 million units', true, 1)
  ON CONFLICT (brand_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    production_numbers = EXCLUDED.production_numbers,
    is_featured = EXCLUDED.is_featured,
    display_order = EXCLUDED.display_order;

  SELECT id INTO bmw_3series_id FROM car_models WHERE brand_id = bmw_id AND slug = '3-series';

  -- BMW 3 Series Generations
  INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
  SELECT gen_random_uuid(), bmw_3series_id, 'G20/G21 (2019-2024)', 'g20-2019-2024', 2019, 2024, 'G20', 'Seventh generation 3 Series with CLAR platform, advanced driver assistance, and iDrive 7.0. Available with 2.0L turbo, 3.0L turbo, and plug-in hybrid powertrains.', true, 1
  WHERE EXISTS (SELECT 1 FROM car_models WHERE id = bmw_3series_id)
  ON CONFLICT (car_model_id, slug) DO NOTHING;

  INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
  SELECT gen_random_uuid(), bmw_3series_id, 'F30/F31 (2012-2019)', 'f30-2012-2019', 2012, 2019, 'F30', 'Sixth generation 3 Series with turbocharged engines, iDrive system, and improved fuel efficiency. Available with 2.0L, 3.0L, and diesel options.', true, 2
  WHERE EXISTS (SELECT 1 FROM car_models WHERE id = bmw_3series_id)
  ON CONFLICT (car_model_id, slug) DO NOTHING;

  INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
  SELECT gen_random_uuid(), bmw_3series_id, 'E90/E91 (2005-2012)', 'e90-2005-2012', 2005, 2012, 'E90', 'Fifth generation 3 Series with modern design, iDrive, and improved safety. Available with inline-6 and V8 engines.', true, 3
  WHERE EXISTS (SELECT 1 FROM car_models WHERE id = bmw_3series_id)
  ON CONFLICT (car_model_id, slug) DO NOTHING;

  -- BMW 5 Series
  INSERT INTO car_models (id, brand_id, name, slug, year_start, year_end, description, production_numbers, is_featured, display_order) VALUES
    ('bb1e8400-e29b-41d4-a716-446655440002', bmw_id, '5 Series', '5-series', 1972, NULL, 'The BMW 5 Series is a mid-size executive car known for luxury, performance, and advanced technology. Flagship sedan with excellent driving dynamics.', 'Over 8 million units', true, 2)
  ON CONFLICT (brand_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    production_numbers = EXCLUDED.production_numbers,
    is_featured = EXCLUDED.is_featured,
    display_order = EXCLUDED.display_order;

  SELECT id INTO bmw_5series_id FROM car_models WHERE brand_id = bmw_id AND slug = '5-series';

  -- BMW 5 Series Generations
  INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
  SELECT gen_random_uuid(), bmw_5series_id, 'G30/G31 (2017-2024)', 'g30-2017-2024', 2017, 2024, 'G30', 'Seventh generation 5 Series with CLAR platform, gesture control, and advanced safety. Available with 2.0L, 3.0L, V8, and plug-in hybrid.', true, 1
  WHERE EXISTS (SELECT 1 FROM car_models WHERE id = bmw_5series_id)
  ON CONFLICT (car_model_id, slug) DO NOTHING;

  INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
  SELECT gen_random_uuid(), bmw_5series_id, 'F10/F11 (2010-2017)', 'f10-2010-2017', 2010, 2017, 'F10', 'Sixth generation 5 Series with turbocharged engines, 8-speed automatic, and improved efficiency. Available with 2.0L, 3.0L, and V8 options.', true, 2
  WHERE EXISTS (SELECT 1 FROM car_models WHERE id = bmw_5series_id)
  ON CONFLICT (car_model_id, slug) DO NOTHING;

  -- BMW X3
  INSERT INTO car_models (id, brand_id, name, slug, year_start, year_end, description, production_numbers, is_featured, display_order) VALUES
    ('bb1e8400-e29b-41d4-a716-446655440003', bmw_id, 'X3', 'x3', 2003, NULL, 'The BMW X3 is a compact luxury SUV known for sporty handling, premium interior, and all-wheel drive capability. Popular choice for families seeking performance and luxury.', 'Over 3 million units', true, 3)
  ON CONFLICT (brand_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    production_numbers = EXCLUDED.production_numbers,
    is_featured = EXCLUDED.is_featured,
    display_order = EXCLUDED.display_order;

  SELECT id INTO bmw_x3_id FROM car_models WHERE brand_id = bmw_id AND slug = 'x3';

  -- BMW X3 Generations
  INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
  SELECT gen_random_uuid(), bmw_x3_id, 'G01 (2018-2024)', 'g01-2018-2024', 2018, 2024, 'G01', 'Third generation X3 with CLAR platform, improved space, and advanced technology. Available with 2.0L turbo, 3.0L turbo, and plug-in hybrid.', true, 1
  WHERE EXISTS (SELECT 1 FROM car_models WHERE id = bmw_x3_id)
  ON CONFLICT (car_model_id, slug) DO NOTHING;

  INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
  SELECT gen_random_uuid(), bmw_x3_id, 'F25 (2011-2018)', 'f25-2011-2018', 2011, 2018, 'F25', 'Second generation X3 with improved design, turbocharged engines, and better fuel economy. Available with 2.0L and 3.0L options.', true, 2
  WHERE EXISTS (SELECT 1 FROM car_models WHERE id = bmw_x3_id)
  ON CONFLICT (car_model_id, slug) DO NOTHING;

  -- BMW X5
  INSERT INTO car_models (id, brand_id, name, slug, year_start, year_end, description, production_numbers, is_featured, display_order) VALUES
    ('bb1e8400-e29b-41d4-a716-446655440004', bmw_id, 'X5', 'x5', 1999, NULL, 'The BMW X5 is a mid-size luxury SUV known for performance, luxury, and capability. Pioneered the Sports Activity Vehicle segment.', 'Over 3.5 million units', true, 4)
  ON CONFLICT (brand_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    production_numbers = EXCLUDED.production_numbers,
    is_featured = EXCLUDED.is_featured,
    display_order = EXCLUDED.display_order;

  SELECT id INTO bmw_x5_id FROM car_models WHERE brand_id = bmw_id AND slug = 'x5';

  -- BMW X5 Generations
  INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
  SELECT gen_random_uuid(), bmw_x5_id, 'G05 (2019-2024)', 'g05-2019-2024', 2019, 2024, 'G05', 'Fourth generation X5 with CLAR platform, larger size, and advanced technology. Available with 3.0L, 4.4L V8, and plug-in hybrid.', true, 1
  WHERE EXISTS (SELECT 1 FROM car_models WHERE id = bmw_x5_id)
  ON CONFLICT (car_model_id, slug) DO NOTHING;

  INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
  SELECT gen_random_uuid(), bmw_x5_id, 'F15 (2014-2019)', 'f15-2014-2019', 2014, 2019, 'F15', 'Third generation X5 with improved efficiency, modern design, and advanced features. Available with 3.0L, 4.4L V8, and diesel options.', true, 2
  WHERE EXISTS (SELECT 1 FROM car_models WHERE id = bmw_x5_id)
  ON CONFLICT (car_model_id, slug) DO NOTHING;

  -- ============================================
  -- Mercedes-Benz - German Luxury Brand
  -- ============================================
  -- First, try to get existing brand by name or slug
  SELECT id INTO mercedes_id FROM car_brands WHERE name = 'Mercedes-Benz' OR slug = 'mercedes-benz' LIMIT 1;
  
  -- If brand doesn't exist, insert it
  IF mercedes_id IS NULL THEN
    INSERT INTO car_brands (id, name, slug, description, country, founded_year, is_featured, display_order) VALUES
      ('cc0e8400-e29b-41d4-a716-446655440001', 'Mercedes-Benz', 'mercedes-benz', 'Mercedes-Benz - German luxury automotive manufacturer known for innovation, luxury, and engineering excellence. Part of Daimler AG, founded in 1926.', 'Germany', 1926, true, 2)
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      slug = EXCLUDED.slug,
      description = EXCLUDED.description,
      country = EXCLUDED.country,
      founded_year = EXCLUDED.founded_year,
      is_featured = EXCLUDED.is_featured,
      display_order = EXCLUDED.display_order;
    
    SELECT id INTO mercedes_id FROM car_brands WHERE name = 'Mercedes-Benz' OR slug = 'mercedes-benz' LIMIT 1;
  ELSE
    -- Update existing brand if needed
    UPDATE car_brands SET
      description = 'Mercedes-Benz - German luxury automotive manufacturer known for innovation, luxury, and engineering excellence. Part of Daimler AG, founded in 1926.',
      country = 'Germany',
      founded_year = 1926,
      is_featured = true,
      display_order = 2
    WHERE id = mercedes_id;
  END IF;

  -- Mercedes-Benz C-Class
  INSERT INTO car_models (id, brand_id, name, slug, year_start, year_end, description, production_numbers, is_featured, display_order) VALUES
    ('cc1e8400-e29b-41d4-a716-446655440001', mercedes_id, 'C-Class', 'c-class', 1993, NULL, 'The Mercedes-Benz C-Class is a compact executive car, one of Mercedes'' best-selling models. Known for luxury, technology, and refined driving experience.', 'Over 10 million units', true, 1)
  ON CONFLICT (brand_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    production_numbers = EXCLUDED.production_numbers,
    is_featured = EXCLUDED.is_featured,
    display_order = EXCLUDED.display_order;

  SELECT id INTO mercedes_cclass_id FROM car_models WHERE brand_id = mercedes_id AND slug = 'c-class';

  -- Mercedes C-Class Generations
  INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
  SELECT gen_random_uuid(), mercedes_cclass_id, 'W206 (2021-2024)', 'w206-2021-2024', 2021, 2024, 'W206', 'Fifth generation C-Class with MBUX infotainment, 48V mild hybrid, and advanced driver assistance. Available with 1.5L, 2.0L turbo, and plug-in hybrid.', true, 1
  WHERE EXISTS (SELECT 1 FROM car_models WHERE id = mercedes_cclass_id)
  ON CONFLICT (car_model_id, slug) DO NOTHING;

  INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
  SELECT gen_random_uuid(), mercedes_cclass_id, 'W205 (2014-2021)', 'w205-2014-2021', 2014, 2021, 'W205', 'Fourth generation C-Class with modern design, COMAND Online, and turbocharged engines. Available with 1.6L, 2.0L, and 3.0L V6 options.', true, 2
  WHERE EXISTS (SELECT 1 FROM car_models WHERE id = mercedes_cclass_id)
  ON CONFLICT (car_model_id, slug) DO NOTHING;

  -- Mercedes-Benz E-Class
  INSERT INTO car_models (id, brand_id, name, slug, year_start, year_end, description, production_numbers, is_featured, display_order) VALUES
    ('cc1e8400-e29b-41d4-a716-446655440002', mercedes_id, 'E-Class', 'e-class', 1953, NULL, 'The Mercedes-Benz E-Class is a mid-size executive car known for luxury, technology, and comfort. Flagship sedan with excellent build quality.', 'Over 14 million units', true, 2)
  ON CONFLICT (brand_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    production_numbers = EXCLUDED.production_numbers,
    is_featured = EXCLUDED.is_featured,
    display_order = EXCLUDED.display_order;

  SELECT id INTO mercedes_eclass_id FROM car_models WHERE brand_id = mercedes_id AND slug = 'e-class';

  -- Mercedes E-Class Generations
  INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
  SELECT gen_random_uuid(), mercedes_eclass_id, 'W213 (2016-2024)', 'w213-2016-2024', 2016, 2024, 'W213', 'Fifth generation E-Class with MBUX, advanced safety, and 48V mild hybrid. Available with 2.0L turbo, 3.0L V6, and plug-in hybrid.', true, 1
  WHERE EXISTS (SELECT 1 FROM car_models WHERE id = mercedes_eclass_id)
  ON CONFLICT (car_model_id, slug) DO NOTHING;

  INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
  SELECT gen_random_uuid(), mercedes_eclass_id, 'W212 (2009-2016)', 'w212-2009-2016', 2009, 2016, 'W212', 'Fourth generation E-Class with modern design, COMAND, and improved efficiency. Available with 1.8L, 3.0L V6, and 5.5L V8 options.', true, 2
  WHERE EXISTS (SELECT 1 FROM car_models WHERE id = mercedes_eclass_id)
  ON CONFLICT (car_model_id, slug) DO NOTHING;

  -- Mercedes-Benz GLC
  INSERT INTO car_models (id, brand_id, name, slug, year_start, year_end, description, production_numbers, is_featured, display_order) VALUES
    ('cc1e8400-e29b-41d4-a716-446655440003', mercedes_id, 'GLC', 'glc', 2015, NULL, 'The Mercedes-Benz GLC is a compact luxury SUV based on the C-Class platform. Known for luxury, technology, and all-wheel drive capability.', 'Over 2 million units', true, 3)
  ON CONFLICT (brand_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    production_numbers = EXCLUDED.production_numbers,
    is_featured = EXCLUDED.is_featured,
    display_order = EXCLUDED.display_order;

  SELECT id INTO mercedes_glc_id FROM car_models WHERE brand_id = mercedes_id AND slug = 'glc';

  -- Mercedes GLC Generations
  INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
  SELECT gen_random_uuid(), mercedes_glc_id, 'X254 (2023-2024)', 'x254-2023-2024', 2023, 2024, 'X254', 'Second generation GLC with MBUX, 48V mild hybrid, and improved technology. Available with 2.0L turbo and plug-in hybrid.', true, 1
  WHERE EXISTS (SELECT 1 FROM car_models WHERE id = mercedes_glc_id)
  ON CONFLICT (car_model_id, slug) DO NOTHING;

  INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
  SELECT gen_random_uuid(), mercedes_glc_id, 'X253 (2015-2023)', 'x253-2015-2023', 2015, 2023, 'X253', 'First generation GLC with COMAND, turbocharged engines, and all-wheel drive. Available with 2.0L turbo and 3.0L V6 options.', true, 2
  WHERE EXISTS (SELECT 1 FROM car_models WHERE id = mercedes_glc_id)
  ON CONFLICT (car_model_id, slug) DO NOTHING;

  -- ============================================
  -- Tesla - Electric Vehicle Brand
  -- ============================================
  -- First, try to get existing brand by name or slug
  SELECT id INTO tesla_id FROM car_brands WHERE name = 'Tesla' OR slug = 'tesla' LIMIT 1;
  
  -- If brand doesn't exist, insert it
  IF tesla_id IS NULL THEN
    INSERT INTO car_brands (id, name, slug, description, country, founded_year, is_featured, display_order) VALUES
      ('dd0e8400-e29b-41d4-a716-446655440001', 'Tesla', 'tesla', 'Tesla, Inc. - American electric vehicle and clean energy company. Founded in 2003, Tesla revolutionized the automotive industry with electric vehicles, Autopilot, and over-the-air updates.', 'United States', 2003, true, 7)
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      slug = EXCLUDED.slug,
      description = EXCLUDED.description,
      country = EXCLUDED.country,
      founded_year = EXCLUDED.founded_year,
      is_featured = EXCLUDED.is_featured,
      display_order = EXCLUDED.display_order;
    
    SELECT id INTO tesla_id FROM car_brands WHERE name = 'Tesla' OR slug = 'tesla' LIMIT 1;
  ELSE
    -- Update existing brand if needed
    UPDATE car_brands SET
      description = 'Tesla, Inc. - American electric vehicle and clean energy company. Founded in 2003, Tesla revolutionized the automotive industry with electric vehicles, Autopilot, and over-the-air updates.',
      country = 'United States',
      founded_year = 2003,
      is_featured = true,
      display_order = 7
    WHERE id = tesla_id;
  END IF;

  -- Tesla Model 3
  INSERT INTO car_models (id, brand_id, name, slug, year_start, year_end, description, production_numbers, is_featured, display_order) VALUES
    ('dd1e8400-e29b-41d4-a716-446655440001', tesla_id, 'Model 3', 'model-3', 2017, NULL, 'The Tesla Model 3 is a compact electric sedan, Tesla''s most affordable and best-selling model. Known for range, performance, and Autopilot capability.', 'Over 5 million units', true, 1)
  ON CONFLICT (brand_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    production_numbers = EXCLUDED.production_numbers,
    is_featured = EXCLUDED.is_featured,
    display_order = EXCLUDED.display_order;

  SELECT id INTO tesla_model3_id FROM car_models WHERE brand_id = tesla_id AND slug = 'model-3';

  -- Tesla Model 3 Generations (by year/refresh)
  INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
  SELECT gen_random_uuid(), tesla_model3_id, 'Highland (2024-present)', 'highland-2024', 2024, NULL, 'Highland', 'Refreshed Model 3 with improved design, longer range, and updated interior. Available in RWD, Long Range, and Performance variants.', true, 1
  WHERE EXISTS (SELECT 1 FROM car_models WHERE id = tesla_model3_id)
  ON CONFLICT (car_model_id, slug) DO NOTHING;

  INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
  SELECT gen_random_uuid(), tesla_model3_id, 'Original (2017-2023)', 'original-2017-2023', 2017, 2023, 'Original', 'Original Model 3 with Autopilot, Supercharging, and over-the-air updates. Available in Standard Range, Long Range, and Performance.', true, 2
  WHERE EXISTS (SELECT 1 FROM car_models WHERE id = tesla_model3_id)
  ON CONFLICT (car_model_id, slug) DO NOTHING;

  -- Tesla Model Y
  INSERT INTO car_models (id, brand_id, name, slug, year_start, year_end, description, production_numbers, is_featured, display_order) VALUES
    ('dd1e8400-e29b-41d4-a716-446655440002', tesla_id, 'Model Y', 'model-y', 2020, NULL, 'The Tesla Model Y is a compact electric SUV based on Model 3 platform. Known for versatility, range, and Autopilot. Tesla''s best-selling model.', 'Over 2 million units', true, 2)
  ON CONFLICT (brand_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    production_numbers = EXCLUDED.production_numbers,
    is_featured = EXCLUDED.is_featured,
    display_order = EXCLUDED.display_order;

  SELECT id INTO tesla_modely_id FROM car_models WHERE brand_id = tesla_id AND slug = 'model-y';

  -- Tesla Model Y Generations
  INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
  SELECT gen_random_uuid(), tesla_modely_id, 'Current (2020-present)', 'current-2020', 2020, NULL, 'Current', 'Model Y with Autopilot, Supercharging, and seven-seat option. Available in Long Range, Performance, and Standard Range variants.', true, 1
  WHERE EXISTS (SELECT 1 FROM car_models WHERE id = tesla_modely_id)
  ON CONFLICT (car_model_id, slug) DO NOTHING;

  -- Tesla Model S
  INSERT INTO car_models (id, brand_id, name, slug, year_start, year_end, description, production_numbers, is_featured, display_order) VALUES
    ('dd1e8400-e29b-41d4-a716-446655440003', tesla_id, 'Model S', 'model-s', 2012, NULL, 'The Tesla Model S is a full-size electric luxury sedan. Known for long range, Ludicrous Mode performance, and Autopilot. Tesla''s flagship sedan.', 'Over 500,000 units', true, 3)
  ON CONFLICT (brand_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    production_numbers = EXCLUDED.production_numbers,
    is_featured = EXCLUDED.is_featured,
    display_order = EXCLUDED.display_order;

  SELECT id INTO tesla_models_id FROM car_models WHERE brand_id = tesla_id AND slug = 'model-s';

  -- Tesla Model S Generations
  INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
  SELECT gen_random_uuid(), tesla_models_id, 'Plaid/Refresh (2021-present)', 'plaid-2021', 2021, NULL, 'Plaid', 'Refreshed Model S with Plaid powertrain, updated interior, and improved range. Available in Long Range and Plaid variants.', true, 1
  WHERE EXISTS (SELECT 1 FROM car_models WHERE id = tesla_models_id)
  ON CONFLICT (car_model_id, slug) DO NOTHING;

  INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
  SELECT gen_random_uuid(), tesla_models_id, 'Original (2012-2020)', 'original-2012-2020', 2012, 2020, 'Original', 'Original Model S with various battery options, Autopilot, and Supercharging. Available in 60, 75, 85, 90, 100 kWh variants.', true, 2
  WHERE EXISTS (SELECT 1 FROM car_models WHERE id = tesla_models_id)
  ON CONFLICT (car_model_id, slug) DO NOTHING;

  -- ============================================
  -- Kia - Korean Brand
  -- ============================================
  -- First, try to get existing brand by name or slug
  SELECT id INTO kia_id FROM car_brands WHERE name = 'Kia' OR slug = 'kia' LIMIT 1;
  
  -- If brand doesn't exist, insert it
  IF kia_id IS NULL THEN
    INSERT INTO car_brands (id, name, slug, description, country, founded_year, is_featured, display_order) VALUES
      ('ee0e8400-e29b-41d4-a716-446655440001', 'Kia', 'kia', 'Kia Corporation - South Korean automotive manufacturer known for value, reliability, and design. Part of Hyundai Motor Group, founded in 1944.', 'South Korea', 1944, true, 8)
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      slug = EXCLUDED.slug,
      description = EXCLUDED.description,
      country = EXCLUDED.country,
      founded_year = EXCLUDED.founded_year,
      is_featured = EXCLUDED.is_featured,
      display_order = EXCLUDED.display_order;
    
    SELECT id INTO kia_id FROM car_brands WHERE name = 'Kia' OR slug = 'kia' LIMIT 1;
  ELSE
    -- Update existing brand if needed
    UPDATE car_brands SET
      description = 'Kia Corporation - South Korean automotive manufacturer known for value, reliability, and design. Part of Hyundai Motor Group, founded in 1944.',
      country = 'South Korea',
      founded_year = 1944,
      is_featured = true,
      display_order = 8
    WHERE id = kia_id;
  END IF;

  -- Kia Sportage
  INSERT INTO car_models (id, brand_id, name, slug, year_start, year_end, description, production_numbers, is_featured, display_order) VALUES
    ('ee1e8400-e29b-41d4-a716-446655440001', kia_id, 'Sportage', 'sportage', 1993, NULL, 'The Kia Sportage is a compact SUV known for value, reliability, and modern design. Popular choice for families seeking practicality and features.', 'Over 7 million units', true, 1)
  ON CONFLICT (brand_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    production_numbers = EXCLUDED.production_numbers,
    is_featured = EXCLUDED.is_featured,
    display_order = EXCLUDED.display_order;

  SELECT id INTO kia_sportage_id FROM car_models WHERE brand_id = kia_id AND slug = 'sportage';

  -- Kia Sportage Generations
  INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
  SELECT gen_random_uuid(), kia_sportage_id, 'Fifth Generation (2022-present)', '5th-gen-2022', 2022, NULL, 'NQ5', 'Fifth generation Sportage with bold design, advanced technology, and hybrid options. Available with 2.0L, 2.5L, and hybrid powertrains.', true, 1
  WHERE EXISTS (SELECT 1 FROM car_models WHERE id = kia_sportage_id)
  ON CONFLICT (car_model_id, slug) DO NOTHING;

  INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
  SELECT gen_random_uuid(), kia_sportage_id, 'Fourth Generation (2016-2021)', '4th-gen-2016-2021', 2016, 2021, 'QL', 'Fourth generation Sportage with improved design, technology, and efficiency. Available with 2.0L, 2.4L, and 1.6L turbo options.', true, 2
  WHERE EXISTS (SELECT 1 FROM car_models WHERE id = kia_sportage_id)
  ON CONFLICT (car_model_id, slug) DO NOTHING;

  -- Kia Sorento
  INSERT INTO car_models (id, brand_id, name, slug, year_start, year_end, description, production_numbers, is_featured, display_order) VALUES
    ('ee1e8400-e29b-41d4-a716-446655440002', kia_id, 'Sorento', 'sorento', 2002, NULL, 'The Kia Sorento is a mid-size SUV known for three-row seating, value, and reliability. Popular choice for families needing space and features.', 'Over 3 million units', true, 2)
  ON CONFLICT (brand_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    production_numbers = EXCLUDED.production_numbers,
    is_featured = EXCLUDED.is_featured,
    display_order = EXCLUDED.display_order;

  SELECT id INTO kia_sorento_id FROM car_models WHERE brand_id = kia_id AND slug = 'sorento';

  -- Kia Sorento Generations
  INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
  SELECT gen_random_uuid(), kia_sorento_id, 'Fourth Generation (2021-present)', '4th-gen-2021', 2021, NULL, 'MQ4', 'Fourth generation Sorento with modern design, advanced technology, and hybrid/plug-in hybrid options. Available with 2.5L, 3.5L V6, and hybrid.', true, 1
  WHERE EXISTS (SELECT 1 FROM car_models WHERE id = kia_sorento_id)
  ON CONFLICT (car_model_id, slug) DO NOTHING;

  INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
  SELECT gen_random_uuid(), kia_sorento_id, 'Third Generation (2015-2020)', '3rd-gen-2015-2020', 2015, 2020, 'UM', 'Third generation Sorento with improved design, technology, and efficiency. Available with 2.4L, 3.3L V6, and 2.0L turbo options.', true, 2
  WHERE EXISTS (SELECT 1 FROM car_models WHERE id = kia_sorento_id)
  ON CONFLICT (car_model_id, slug) DO NOTHING;

  -- ============================================
  -- Additional Models for Existing Brands
  -- ============================================
  
  -- Get existing brand IDs
  SELECT id INTO toyota_id FROM car_brands WHERE slug = 'toyota';
  SELECT id INTO honda_id FROM car_brands WHERE slug = 'honda';
  SELECT id INTO ford_id FROM car_brands WHERE slug = 'ford';
  SELECT id INTO volkswagen_id FROM car_brands WHERE slug = 'volkswagen';
  SELECT id INTO mazda_id FROM car_brands WHERE slug = 'mazda';
  SELECT id INTO subaru_id FROM car_brands WHERE slug = 'subaru';

  -- Toyota RAV4
  IF toyota_id IS NOT NULL THEN
    INSERT INTO car_models (id, brand_id, name, slug, year_start, year_end, description, production_numbers, is_featured, display_order) VALUES
      ('ff1e8400-e29b-41d4-a716-446655440001', toyota_id, 'RAV4', 'rav4', 1994, NULL, 'The Toyota RAV4 is a compact SUV, one of the best-selling SUVs worldwide. Known for reliability, fuel efficiency, and available hybrid powertrain.', 'Over 10 million units', true, 2)
    ON CONFLICT (brand_id, slug) DO UPDATE SET
      name = EXCLUDED.name,
      description = EXCLUDED.description,
      production_numbers = EXCLUDED.production_numbers,
      is_featured = EXCLUDED.is_featured,
      display_order = EXCLUDED.display_order;

    SELECT id INTO toyota_rav4_id FROM car_models WHERE brand_id = toyota_id AND slug = 'rav4';

    -- RAV4 Generations
    INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
    SELECT gen_random_uuid(), toyota_rav4_id, 'Fifth Generation (2019-present)', '5th-gen-2019', 2019, NULL, 'XA50', 'Fifth generation RAV4 with TNGA platform, hybrid option, and improved design. Available with 2.5L and hybrid powertrains.', true, 1
    WHERE EXISTS (SELECT 1 FROM car_models WHERE id = toyota_rav4_id)
    ON CONFLICT (car_model_id, slug) DO NOTHING;

    INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
    SELECT gen_random_uuid(), toyota_rav4_id, 'Fourth Generation (2013-2018)', '4th-gen-2013-2018', 2013, 2018, 'XA40', 'Fourth generation RAV4 with improved efficiency, design, and available hybrid. Available with 2.5L and hybrid options.', true, 2
    WHERE EXISTS (SELECT 1 FROM car_models WHERE id = toyota_rav4_id)
    ON CONFLICT (car_model_id, slug) DO NOTHING;
  END IF;

  -- Toyota Camry
  IF toyota_id IS NOT NULL THEN
    INSERT INTO car_models (id, brand_id, name, slug, year_start, year_end, description, production_numbers, is_featured, display_order) VALUES
      ('ff1e8400-e29b-41d4-a716-446655440002', toyota_id, 'Camry', 'camry', 1982, NULL, 'The Toyota Camry is a mid-size sedan, one of the best-selling cars in America. Known for reliability, comfort, and available hybrid powertrain.', 'Over 20 million units', true, 3)
    ON CONFLICT (brand_id, slug) DO UPDATE SET
      name = EXCLUDED.name,
      description = EXCLUDED.description,
      production_numbers = EXCLUDED.production_numbers,
      is_featured = EXCLUDED.is_featured,
      display_order = EXCLUDED.display_order;

    SELECT id INTO toyota_camry_id FROM car_models WHERE brand_id = toyota_id AND slug = 'camry';

    -- Camry Generations
    INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
    SELECT gen_random_uuid(), toyota_camry_id, 'Eighth Generation (2018-present)', '8th-gen-2018', 2018, NULL, 'XV70', 'Eighth generation Camry with TNGA platform, improved design, and hybrid option. Available with 2.5L, 3.5L V6, and hybrid.', true, 1
    WHERE EXISTS (SELECT 1 FROM car_models WHERE id = toyota_camry_id)
    ON CONFLICT (car_model_id, slug) DO NOTHING;

    INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
    SELECT gen_random_uuid(), toyota_camry_id, 'Seventh Generation (2012-2017)', '7th-gen-2012-2017', 2012, 2017, 'XV50', 'Seventh generation Camry with improved efficiency, design, and available hybrid. Available with 2.5L, 3.5L V6, and hybrid options.', true, 2
    WHERE EXISTS (SELECT 1 FROM car_models WHERE id = toyota_camry_id)
    ON CONFLICT (car_model_id, slug) DO NOTHING;
  END IF;

  -- Toyota Highlander
  IF toyota_id IS NOT NULL THEN
    INSERT INTO car_models (id, brand_id, name, slug, year_start, year_end, description, production_numbers, is_featured, display_order) VALUES
      ('ff1e8400-e29b-41d4-a716-446655440003', toyota_id, 'Highlander', 'highlander', 2000, NULL, 'The Toyota Highlander is a mid-size SUV with three-row seating. Known for reliability, comfort, and available hybrid powertrain.', 'Over 4 million units', true, 4)
    ON CONFLICT (brand_id, slug) DO UPDATE SET
      name = EXCLUDED.name,
      description = EXCLUDED.description,
      production_numbers = EXCLUDED.production_numbers,
      is_featured = EXCLUDED.is_featured,
      display_order = EXCLUDED.display_order;

    SELECT id INTO toyota_highlander_id FROM car_models WHERE brand_id = toyota_id AND slug = 'highlander';

    -- Highlander Generations
    INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
    SELECT gen_random_uuid(), toyota_highlander_id, 'Fourth Generation (2020-present)', '4th-gen-2020', 2020, NULL, 'XU70', 'Fourth generation Highlander with TNGA platform, improved design, and hybrid option. Available with 2.5L hybrid and 3.5L V6.', true, 1
    WHERE EXISTS (SELECT 1 FROM car_models WHERE id = toyota_highlander_id)
    ON CONFLICT (car_model_id, slug) DO NOTHING;

    INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
    SELECT gen_random_uuid(), toyota_highlander_id, 'Third Generation (2014-2019)', '3rd-gen-2014-2019', 2014, 2019, 'XU50', 'Third generation Highlander with improved efficiency, design, and available hybrid. Available with 2.7L, 3.5L V6, and hybrid options.', true, 2
    WHERE EXISTS (SELECT 1 FROM car_models WHERE id = toyota_highlander_id)
    ON CONFLICT (car_model_id, slug) DO NOTHING;
  END IF;

  -- Honda CR-V
  IF honda_id IS NOT NULL THEN
    INSERT INTO car_models (id, brand_id, name, slug, year_start, year_end, description, production_numbers, is_featured, display_order) VALUES
      ('a11e8400-e29b-41d4-a716-446655440001', honda_id, 'CR-V', 'cr-v', 1995, NULL, 'The Honda CR-V is a compact SUV, one of the best-selling SUVs worldwide. Known for reliability, fuel efficiency, and available hybrid powertrain.', 'Over 11 million units', true, 1)
    ON CONFLICT (brand_id, slug) DO UPDATE SET
      name = EXCLUDED.name,
      description = EXCLUDED.description,
      production_numbers = EXCLUDED.production_numbers,
      is_featured = EXCLUDED.is_featured,
      display_order = EXCLUDED.display_order;

    SELECT id INTO honda_crv_id FROM car_models WHERE brand_id = honda_id AND slug = 'cr-v';

    -- CR-V Generations
    INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
    SELECT gen_random_uuid(), honda_crv_id, 'Sixth Generation (2023-present)', '6th-gen-2023', 2023, NULL, '6G', 'Sixth generation CR-V with improved design, hybrid option, and advanced technology. Available with 1.5L turbo and hybrid.', true, 1
    WHERE EXISTS (SELECT 1 FROM car_models WHERE id = honda_crv_id)
    ON CONFLICT (car_model_id, slug) DO NOTHING;

    INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
    SELECT gen_random_uuid(), honda_crv_id, 'Fifth Generation (2017-2022)', '5th-gen-2017-2022', 2017, 2022, '5G', 'Fifth generation CR-V with turbocharged engine, improved design, and available hybrid. Available with 1.5L turbo and hybrid options.', true, 2
    WHERE EXISTS (SELECT 1 FROM car_models WHERE id = honda_crv_id)
    ON CONFLICT (car_model_id, slug) DO NOTHING;
  END IF;

  -- Honda Accord
  IF honda_id IS NOT NULL THEN
    INSERT INTO car_models (id, brand_id, name, slug, year_start, year_end, description, production_numbers, is_featured, display_order) VALUES
      ('a11e8400-e29b-41d4-a716-446655440002', honda_id, 'Accord', 'accord', 1976, NULL, 'The Honda Accord is a mid-size sedan, one of the best-selling cars in America. Known for reliability, fuel efficiency, and available hybrid powertrain.', 'Over 18 million units', true, 2)
    ON CONFLICT (brand_id, slug) DO UPDATE SET
      name = EXCLUDED.name,
      description = EXCLUDED.description,
      production_numbers = EXCLUDED.production_numbers,
      is_featured = EXCLUDED.is_featured,
      display_order = EXCLUDED.display_order;

    SELECT id INTO honda_accord_id FROM car_models WHERE brand_id = honda_id AND slug = 'accord';

    -- Accord Generations
    INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
    SELECT gen_random_uuid(), honda_accord_id, 'Eleventh Generation (2023-present)', '11th-gen-2023', 2023, NULL, '11G', 'Eleventh generation Accord with improved design, hybrid standard, and advanced technology. Available with 1.5L turbo and hybrid.', true, 1
    WHERE EXISTS (SELECT 1 FROM car_models WHERE id = honda_accord_id)
    ON CONFLICT (car_model_id, slug) DO NOTHING;

    INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
    SELECT gen_random_uuid(), honda_accord_id, 'Tenth Generation (2018-2022)', '10th-gen-2018-2022', 2018, 2022, '10G', 'Tenth generation Accord with turbocharged engines, improved design, and available hybrid. Available with 1.5L turbo, 2.0L turbo, and hybrid options.', true, 2
    WHERE EXISTS (SELECT 1 FROM car_models WHERE id = honda_accord_id)
    ON CONFLICT (car_model_id, slug) DO NOTHING;
  END IF;

  -- Honda Pilot
  IF honda_id IS NOT NULL THEN
    INSERT INTO car_models (id, brand_id, name, slug, year_start, year_end, description, production_numbers, is_featured, display_order) VALUES
      ('a11e8400-e29b-41d4-a716-446655440003', honda_id, 'Pilot', 'pilot', 2002, NULL, 'The Honda Pilot is a mid-size SUV with three-row seating. Known for reliability, space, and family-friendly features.', 'Over 2 million units', true, 3)
    ON CONFLICT (brand_id, slug) DO UPDATE SET
      name = EXCLUDED.name,
      description = EXCLUDED.description,
      production_numbers = EXCLUDED.production_numbers,
      is_featured = EXCLUDED.is_featured,
      display_order = EXCLUDED.display_order;

    SELECT id INTO honda_pilot_id FROM car_models WHERE brand_id = honda_id AND slug = 'pilot';

    -- Pilot Generations
    INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
    SELECT gen_random_uuid(), honda_pilot_id, 'Third Generation (2016-present)', '3rd-gen-2016', 2016, NULL, '3G', 'Third generation Pilot with improved design, technology, and efficiency. Available with 3.5L V6 engine.', true, 1
    WHERE EXISTS (SELECT 1 FROM car_models WHERE id = honda_pilot_id)
    ON CONFLICT (car_model_id, slug) DO NOTHING;
  END IF;

  -- Ford F-150
  IF ford_id IS NOT NULL THEN
    INSERT INTO car_models (id, brand_id, name, slug, year_start, year_end, description, production_numbers, is_featured, display_order) VALUES
      ('ff2e8400-e29b-41d4-a716-446655440001', ford_id, 'F-150', 'f-150', 1975, NULL, 'The Ford F-150 is a full-size pickup truck, America''s best-selling vehicle for over 40 years. Known for capability, towing, and available hybrid powertrain.', 'Over 40 million units', true, 1)
    ON CONFLICT (brand_id, slug) DO UPDATE SET
      name = EXCLUDED.name,
      description = EXCLUDED.description,
      production_numbers = EXCLUDED.production_numbers,
      is_featured = EXCLUDED.is_featured,
      display_order = EXCLUDED.display_order;

    SELECT id INTO ford_f150_id FROM car_models WHERE brand_id = ford_id AND slug = 'f-150';

    -- F-150 Generations
    INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
    SELECT gen_random_uuid(), ford_f150_id, 'Fourteenth Generation (2021-present)', '14th-gen-2021', 2021, NULL, 'P702', 'Fourteenth generation F-150 with improved design, hybrid option, and advanced technology. Available with 3.3L V6, 2.7L turbo, 3.5L turbo, 5.0L V8, and hybrid.', true, 1
    WHERE EXISTS (SELECT 1 FROM car_models WHERE id = ford_f150_id)
    ON CONFLICT (car_model_id, slug) DO NOTHING;

    INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
    SELECT gen_random_uuid(), ford_f150_id, 'Thirteenth Generation (2015-2020)', '13th-gen-2015-2020', 2015, 2020, 'P552', 'Thirteenth generation F-150 with aluminum body, improved efficiency, and advanced features. Available with 3.5L V6, 2.7L turbo, 3.5L turbo, and 5.0L V8.', true, 2
    WHERE EXISTS (SELECT 1 FROM car_models WHERE id = ford_f150_id)
    ON CONFLICT (car_model_id, slug) DO NOTHING;
  END IF;

  -- Ford Explorer
  IF ford_id IS NOT NULL THEN
    INSERT INTO car_models (id, brand_id, name, slug, year_start, year_end, description, production_numbers, is_featured, display_order) VALUES
      ('ff2e8400-e29b-41d4-a716-446655440002', ford_id, 'Explorer', 'explorer', 1990, NULL, 'The Ford Explorer is a mid-size SUV with three-row seating. Known for capability, space, and family-friendly features.', 'Over 8 million units', true, 2)
    ON CONFLICT (brand_id, slug) DO UPDATE SET
      name = EXCLUDED.name,
      description = EXCLUDED.description,
      production_numbers = EXCLUDED.production_numbers,
      is_featured = EXCLUDED.is_featured,
      display_order = EXCLUDED.display_order;

    SELECT id INTO ford_explorer_id FROM car_models WHERE brand_id = ford_id AND slug = 'explorer';

    -- Explorer Generations
    INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
    SELECT gen_random_uuid(), ford_explorer_id, 'Sixth Generation (2020-present)', '6th-gen-2020', 2020, NULL, 'U625', 'Sixth generation Explorer with rear-wheel drive platform, improved design, and hybrid option. Available with 2.3L turbo, 3.0L turbo, and hybrid.', true, 1
    WHERE EXISTS (SELECT 1 FROM car_models WHERE id = ford_explorer_id)
    ON CONFLICT (car_model_id, slug) DO NOTHING;

    INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
    SELECT gen_random_uuid(), ford_explorer_id, 'Fifth Generation (2011-2019)', '5th-gen-2011-2019', 2011, 2019, 'U502', 'Fifth generation Explorer with unibody construction, improved efficiency, and modern design. Available with 3.5L V6, 2.3L turbo, and 3.5L turbo options.', true, 2
    WHERE EXISTS (SELECT 1 FROM car_models WHERE id = ford_explorer_id)
    ON CONFLICT (car_model_id, slug) DO NOTHING;
  END IF;

  -- Volkswagen Golf
  IF volkswagen_id IS NOT NULL THEN
    INSERT INTO car_models (id, brand_id, name, slug, year_start, year_end, description, production_numbers, is_featured, display_order) VALUES
      ('a21e8400-e29b-41d4-a716-446655440001', volkswagen_id, 'Golf', 'golf', 1974, NULL, 'The Volkswagen Golf is a compact car, one of the best-selling cars worldwide. Known for quality, practicality, and available GTI performance variant.', 'Over 35 million units', true, 1)
    ON CONFLICT (brand_id, slug) DO UPDATE SET
      name = EXCLUDED.name,
      description = EXCLUDED.description,
      production_numbers = EXCLUDED.production_numbers,
      is_featured = EXCLUDED.is_featured,
      display_order = EXCLUDED.display_order;

    SELECT id INTO vw_golf_id FROM car_models WHERE brand_id = volkswagen_id AND slug = 'golf';

    -- Golf Generations
    INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
    SELECT gen_random_uuid(), vw_golf_id, 'Eighth Generation (2020-present)', '8th-gen-2020', 2020, NULL, 'MK8', 'Eighth generation Golf with MQB Evo platform, digital cockpit, and improved efficiency. Available with 1.0L, 1.5L, and 2.0L turbo options.', true, 1
    WHERE EXISTS (SELECT 1 FROM car_models WHERE id = vw_golf_id)
    ON CONFLICT (car_model_id, slug) DO NOTHING;

    INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
    SELECT gen_random_uuid(), vw_golf_id, 'Seventh Generation (2013-2020)', '7th-gen-2013-2020', 2013, 2020, 'MK7', 'Seventh generation Golf with MQB platform, improved efficiency, and modern design. Available with 1.4L, 1.8L turbo, and 2.0L turbo options.', true, 2
    WHERE EXISTS (SELECT 1 FROM car_models WHERE id = vw_golf_id)
    ON CONFLICT (car_model_id, slug) DO NOTHING;
  END IF;

  -- Volkswagen Tiguan
  IF volkswagen_id IS NOT NULL THEN
    INSERT INTO car_models (id, brand_id, name, slug, year_start, year_end, description, production_numbers, is_featured, display_order) VALUES
      ('a21e8400-e29b-41d4-a716-446655440002', volkswagen_id, 'Tiguan', 'tiguan', 2007, NULL, 'The Volkswagen Tiguan is a compact SUV known for quality, practicality, and European design. Popular choice for families.', 'Over 6 million units', true, 2)
    ON CONFLICT (brand_id, slug) DO UPDATE SET
      name = EXCLUDED.name,
      description = EXCLUDED.description,
      production_numbers = EXCLUDED.production_numbers,
      is_featured = EXCLUDED.is_featured,
      display_order = EXCLUDED.display_order;

    SELECT id INTO vw_tiguan_id FROM car_models WHERE brand_id = volkswagen_id AND slug = 'tiguan';

    -- Tiguan Generations
    INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
    SELECT gen_random_uuid(), vw_tiguan_id, 'Second Generation (2018-present)', '2nd-gen-2018', 2018, NULL, '5N', 'Second generation Tiguan with MQB platform, longer wheelbase, and improved technology. Available with 2.0L turbo engine.', true, 1
    WHERE EXISTS (SELECT 1 FROM car_models WHERE id = vw_tiguan_id)
    ON CONFLICT (car_model_id, slug) DO NOTHING;

    INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
    SELECT gen_random_uuid(), vw_tiguan_id, 'First Generation (2007-2018)', '1st-gen-2007-2018', 2007, 2018, '5N', 'First generation Tiguan with compact size, all-wheel drive, and turbocharged engines. Available with 2.0L turbo engine.', true, 2
    WHERE EXISTS (SELECT 1 FROM car_models WHERE id = vw_tiguan_id)
    ON CONFLICT (car_model_id, slug) DO NOTHING;
  END IF;

  -- Mazda CX-5
  IF mazda_id IS NOT NULL THEN
    INSERT INTO car_models (id, brand_id, name, slug, year_start, year_end, description, production_numbers, is_featured, display_order) VALUES
      ('a31e8400-e29b-41d4-a716-446655440001', mazda_id, 'CX-5', 'cx-5', 2012, NULL, 'The Mazda CX-5 is a compact SUV known for sporty handling, Skyactiv technology, and premium design. Popular choice for driving enthusiasts.', 'Over 4 million units', true, 1)
    ON CONFLICT (brand_id, slug) DO UPDATE SET
      name = EXCLUDED.name,
      description = EXCLUDED.description,
      production_numbers = EXCLUDED.production_numbers,
      is_featured = EXCLUDED.is_featured,
      display_order = EXCLUDED.display_order;

    SELECT id INTO mazda_cx5_id FROM car_models WHERE brand_id = mazda_id AND slug = 'cx-5';

    -- CX-5 Generations
    INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
    SELECT gen_random_uuid(), mazda_cx5_id, 'Second Generation (2017-present)', '2nd-gen-2017', 2017, NULL, 'KF', 'Second generation CX-5 with Skyactiv-G engines, improved design, and advanced safety. Available with 2.0L, 2.5L, and 2.5L turbo options.', true, 1
    WHERE EXISTS (SELECT 1 FROM car_models WHERE id = mazda_cx5_id)
    ON CONFLICT (car_model_id, slug) DO NOTHING;

    INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
    SELECT gen_random_uuid(), mazda_cx5_id, 'First Generation (2012-2017)', '1st-gen-2012-2017', 2012, 2017, 'KE', 'First generation CX-5 with Skyactiv technology, efficient engines, and sporty handling. Available with 2.0L and 2.5L options.', true, 2
    WHERE EXISTS (SELECT 1 FROM car_models WHERE id = mazda_cx5_id)
    ON CONFLICT (car_model_id, slug) DO NOTHING;
  END IF;

  -- Subaru Outback
  IF subaru_id IS NOT NULL THEN
    INSERT INTO car_models (id, brand_id, name, slug, year_start, year_end, description, production_numbers, is_featured, display_order) VALUES
      ('a41e8400-e29b-41d4-a716-446655440001', subaru_id, 'Outback', 'outback', 1994, NULL, 'The Subaru Outback is a mid-size crossover wagon known for all-wheel drive, reliability, and versatility. Popular choice for outdoor enthusiasts.', 'Over 3 million units', true, 1)
    ON CONFLICT (brand_id, slug) DO UPDATE SET
      name = EXCLUDED.name,
      description = EXCLUDED.description,
      production_numbers = EXCLUDED.production_numbers,
      is_featured = EXCLUDED.is_featured,
      display_order = EXCLUDED.display_order;

    SELECT id INTO subaru_outback_id FROM car_models WHERE brand_id = subaru_id AND slug = 'outback';

    -- Outback Generations
    INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
    SELECT gen_random_uuid(), subaru_outback_id, 'Sixth Generation (2020-present)', '6th-gen-2020', 2020, NULL, 'BT', 'Sixth generation Outback with Subaru Global Platform, improved design, and advanced technology. Available with 2.5L and 2.4L turbo options.', true, 1
    WHERE EXISTS (SELECT 1 FROM car_models WHERE id = subaru_outback_id)
    ON CONFLICT (car_model_id, slug) DO NOTHING;

    INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
    SELECT gen_random_uuid(), subaru_outback_id, 'Fifth Generation (2015-2019)', '5th-gen-2015-2019', 2015, 2019, 'BS', 'Fifth generation Outback with improved efficiency, design, and technology. Available with 2.5L and 3.6L H6 options.', true, 2
    WHERE EXISTS (SELECT 1 FROM car_models WHERE id = subaru_outback_id)
    ON CONFLICT (car_model_id, slug) DO NOTHING;
  END IF;

  -- Subaru Forester
  IF subaru_id IS NOT NULL THEN
    INSERT INTO car_models (id, brand_id, name, slug, year_start, year_end, description, production_numbers, is_featured, display_order) VALUES
      ('a41e8400-e29b-41d4-a716-446655440002', subaru_id, 'Forester', 'forester', 1997, NULL, 'The Subaru Forester is a compact SUV known for all-wheel drive, reliability, and practicality. Popular choice for families and outdoor enthusiasts.', 'Over 3.5 million units', true, 2)
    ON CONFLICT (brand_id, slug) DO UPDATE SET
      name = EXCLUDED.name,
      description = EXCLUDED.description,
      production_numbers = EXCLUDED.production_numbers,
      is_featured = EXCLUDED.is_featured,
      display_order = EXCLUDED.display_order;

    SELECT id INTO subaru_forester_id FROM car_models WHERE brand_id = subaru_id AND slug = 'forester';

    -- Forester Generations
    INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
    SELECT gen_random_uuid(), subaru_forester_id, 'Fifth Generation (2019-present)', '5th-gen-2019', 2019, NULL, 'SK', 'Fifth generation Forester with Subaru Global Platform, improved design, and advanced safety. Available with 2.5L engine.', true, 1
    WHERE EXISTS (SELECT 1 FROM car_models WHERE id = subaru_forester_id)
    ON CONFLICT (car_model_id, slug) DO NOTHING;

    INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
    SELECT gen_random_uuid(), subaru_forester_id, 'Fourth Generation (2014-2018)', '4th-gen-2014-2018', 2014, 2018, 'SJ', 'Fourth generation Forester with improved efficiency, design, and technology. Available with 2.5L and 2.0L turbo options.', true, 2
    WHERE EXISTS (SELECT 1 FROM car_models WHERE id = subaru_forester_id)
    ON CONFLICT (car_model_id, slug) DO NOTHING;
  END IF;

END $$;

-- Summary
SELECT 
  'Expanded car inventory seed completed successfully!' as message,
  (SELECT COUNT(*) FROM car_brands) as total_brands,
  (SELECT COUNT(*) FROM car_models) as total_models,
  (SELECT COUNT(*) FROM model_generations) as total_generations;

