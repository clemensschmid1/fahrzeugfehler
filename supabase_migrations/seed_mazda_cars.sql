-- Seed data for Mazda - Japanese brand known for driving dynamics
-- Models: Mazda3, CX-5

DO $$
DECLARE
  mazda_id UUID;
  mazda3_id UUID;
  cx5_id UUID;
BEGIN
  -- Insert Mazda Brand
  INSERT INTO car_brands (id, name, slug, description, country, founded_year, is_featured, display_order) VALUES
    ('bb0e8400-e29b-41d4-a716-446655440001', 'Mazda', 'mazda', 'Mazda Motor Corporation - Japanese automotive manufacturer known for SkyActiv technology, Kodo design, and driving dynamics. Founded in 1920.', 'Japan', 1920, true, 11)
  ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    country = EXCLUDED.country,
    founded_year = EXCLUDED.founded_year,
    is_featured = EXCLUDED.is_featured,
    display_order = EXCLUDED.display_order;

  SELECT id INTO mazda_id FROM car_brands WHERE slug = 'mazda';

  -- Insert Mazda3
  INSERT INTO car_models (id, brand_id, name, slug, year_start, year_end, description, production_numbers, is_featured, display_order) VALUES
    ('cc0e8400-e29b-41d4-a716-446655440001', mazda_id, 'Mazda3', 'mazda3', 2003, NULL, 'The Mazda3 is a compact car known for sporty handling, SkyActiv technology, and Kodo design. Available in sedan and hatchback body styles.', 'Over 6 million units', true, 1)
  ON CONFLICT (brand_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    production_numbers = EXCLUDED.production_numbers,
    is_featured = EXCLUDED.is_featured,
    display_order = EXCLUDED.display_order;

  SELECT id INTO mazda3_id FROM car_models WHERE brand_id = mazda_id AND slug = 'mazda3';

  -- Insert Mazda CX-5
  INSERT INTO car_models (id, brand_id, name, slug, year_start, year_end, description, production_numbers, is_featured, display_order) VALUES
    ('cc0e8400-e29b-41d4-a716-446655440002', mazda_id, 'CX-5', 'cx-5', 2012, NULL, 'The Mazda CX-5 is a compact crossover SUV known for sporty handling, SkyActiv technology, and premium interior. Mazda''s best-selling model.', 'Over 3 million units', true, 2)
  ON CONFLICT (brand_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    production_numbers = EXCLUDED.production_numbers,
    is_featured = EXCLUDED.is_featured,
    display_order = EXCLUDED.display_order;

  SELECT id INTO cx5_id FROM car_models WHERE brand_id = mazda_id AND slug = 'cx-5';

  -- Mazda3 Generations
  INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
  SELECT gen_random_uuid(), mazda3_id, 'BK (2009-2013)', 'bk-2009-2013', 2009, 2013, 'BK', 'Second generation Mazda3 with improved fuel economy and technology. Available in sedan and hatchback.', true, 1
  WHERE EXISTS (SELECT 1 FROM car_models WHERE id = mazda3_id)
  ON CONFLICT (car_model_id, slug) DO NOTHING;

  INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
  SELECT gen_random_uuid(), mazda3_id, 'BM/BN (2014-2018)', 'bm-bn-2014-2018', 2014, 2018, 'BM/BN', 'Third generation Mazda3 with SkyActiv technology, Kodo design, and improved efficiency. Available in sedan and hatchback.', true, 2
  WHERE EXISTS (SELECT 1 FROM car_models WHERE id = mazda3_id)
  ON CONFLICT (car_model_id, slug) DO NOTHING;

  INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
  SELECT gen_random_uuid(), mazda3_id, 'BP (2019-2024)', 'bp-2019-2024', 2019, 2024, 'BP', 'Fourth generation Mazda3 with SkyActiv-X engine, premium interior, and advanced safety. Available in sedan and hatchback.', true, 3
  WHERE EXISTS (SELECT 1 FROM car_models WHERE id = mazda3_id)
  ON CONFLICT (car_model_id, slug) DO NOTHING;

  -- Mazda CX-5 Generations
  INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
  SELECT gen_random_uuid(), cx5_id, 'KE (2012-2016)', 'ke-2012-2016', 2012, 2016, 'KE', 'First generation CX-5 with SkyActiv technology and Kodo design. Available with front-wheel drive and all-wheel drive.', true, 1
  WHERE EXISTS (SELECT 1 FROM car_models WHERE id = cx5_id)
  ON CONFLICT (car_model_id, slug) DO NOTHING;

  INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
  SELECT gen_random_uuid(), cx5_id, 'KF (2017-2024)', 'kf-2017-2024', 2017, 2024, 'KF', 'Second generation CX-5 with refined design, improved technology, and enhanced safety. Available with turbocharged engine option.', true, 2
  WHERE EXISTS (SELECT 1 FROM car_models WHERE id = cx5_id)
  ON CONFLICT (car_model_id, slug) DO NOTHING;

END $$;

