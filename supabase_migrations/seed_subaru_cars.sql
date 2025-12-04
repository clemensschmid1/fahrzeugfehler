-- Seed data for Subaru - Japanese brand known for all-wheel drive
-- Models: Outback, Forester

DO $$
DECLARE
  subaru_id UUID;
  outback_id UUID;
  forester_id UUID;
BEGIN
  -- Insert Subaru Brand
  INSERT INTO car_brands (id, name, slug, description, country, founded_year, is_featured, display_order) VALUES
    ('dd0e8400-e29b-41d4-a716-446655440001', 'Subaru', 'subaru', 'Subaru Corporation - Japanese automotive manufacturer known for boxer engines, Symmetrical All-Wheel Drive, and safety. Founded in 1953.', 'Japan', 1953, true, 12)
  ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    country = EXCLUDED.country,
    founded_year = EXCLUDED.founded_year,
    is_featured = EXCLUDED.is_featured,
    display_order = EXCLUDED.display_order;

  SELECT id INTO subaru_id FROM car_brands WHERE slug = 'subaru';

  -- Insert Subaru Outback
  INSERT INTO car_models (id, brand_id, name, slug, year_start, year_end, description, production_numbers, is_featured, display_order) VALUES
    ('ee0e8400-e29b-41d4-a716-446655440001', subaru_id, 'Outback', 'outback', 1994, NULL, 'The Subaru Outback is a crossover SUV wagon known for all-wheel drive, ground clearance, and versatility. Perfect for outdoor adventures.', 'Over 2.5 million units', true, 1)
  ON CONFLICT (brand_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    production_numbers = EXCLUDED.production_numbers,
    is_featured = EXCLUDED.is_featured,
    display_order = EXCLUDED.display_order;

  SELECT id INTO outback_id FROM car_models WHERE brand_id = subaru_id AND slug = 'outback';

  -- Insert Subaru Forester
  INSERT INTO car_models (id, brand_id, name, slug, year_start, year_end, description, production_numbers, is_featured, display_order) VALUES
    ('ee0e8400-e29b-41d4-a716-446655440002', subaru_id, 'Forester', 'forester', 1997, NULL, 'The Subaru Forester is a compact crossover SUV known for all-wheel drive, reliability, and safety. Popular choice for families and outdoor enthusiasts.', 'Over 2 million units', true, 2)
  ON CONFLICT (brand_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    production_numbers = EXCLUDED.production_numbers,
    is_featured = EXCLUDED.is_featured,
    display_order = EXCLUDED.display_order;

  SELECT id INTO forester_id FROM car_models WHERE brand_id = subaru_id AND slug = 'forester';

  -- Subaru Outback Generations
  INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
  SELECT gen_random_uuid(), outback_id, '4th Generation (2010-2014)', '4th-gen-2010-2014', 2010, 2014, 'BM/BR', 'Fourth generation Outback with improved fuel economy and safety. Available with 2.5L and 3.6L engines.', true, 1
  WHERE EXISTS (SELECT 1 FROM car_models WHERE id = outback_id)
  ON CONFLICT (car_model_id, slug) DO NOTHING;

  INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
  SELECT gen_random_uuid(), outback_id, '5th Generation (2015-2019)', '5th-gen-2015-2019', 2015, 2019, 'BS', 'Fifth generation Outback with EyeSight safety system and improved technology. Available with 2.5L and 3.6L engines.', true, 2
  WHERE EXISTS (SELECT 1 FROM car_models WHERE id = outback_id)
  ON CONFLICT (car_model_id, slug) DO NOTHING;

  INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
  SELECT gen_random_uuid(), outback_id, '6th Generation (2020-2024)', '6th-gen-2020-2024', 2020, 2024, 'BT', 'Sixth generation Outback with larger touchscreen, improved EyeSight, and turbocharged engine option. Available with XT trim.', true, 3
  WHERE EXISTS (SELECT 1 FROM car_models WHERE id = outback_id)
  ON CONFLICT (car_model_id, slug) DO NOTHING;

  -- Subaru Forester Generations
  INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
  SELECT gen_random_uuid(), forester_id, '4th Generation (2014-2018)', '4th-gen-2014-2018', 2014, 2018, 'SJ', 'Fourth generation Forester with improved fuel economy and EyeSight safety. Available with 2.0L turbo and 2.5L engines.', true, 1
  WHERE EXISTS (SELECT 1 FROM car_models WHERE id = forester_id)
  ON CONFLICT (car_model_id, slug) DO NOTHING;

  INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
  SELECT gen_random_uuid(), forester_id, '5th Generation (2019-2024)', '5th-gen-2019-2024', 2019, 2024, 'SK', 'Fifth generation Forester with Global Platform, improved EyeSight, and hybrid option. Available with 2.5L engine and e-Boxer hybrid.', true, 2
  WHERE EXISTS (SELECT 1 FROM car_models WHERE id = forester_id)
  ON CONFLICT (car_model_id, slug) DO NOTHING;

END $$;

