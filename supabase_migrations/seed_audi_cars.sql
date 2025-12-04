-- Seed data for Audi - Premium German brand
-- Models: A4, A6, Q5

DO $$
DECLARE
  audi_id UUID;
  a4_id UUID;
  a6_id UUID;
  q5_id UUID;
BEGIN
  -- Insert Audi Brand
  INSERT INTO car_brands (id, name, slug, description, country, founded_year, is_featured, display_order) VALUES
    ('990e8400-e29b-41d4-a716-446655440001', 'Audi', 'audi', 'Audi AG - German luxury automotive manufacturer known for quattro all-wheel drive, advanced technology, and premium quality. Part of Volkswagen Group, founded in 1909.', 'Germany', 1909, true, 10)
  ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    country = EXCLUDED.country,
    founded_year = EXCLUDED.founded_year,
    is_featured = EXCLUDED.is_featured,
    display_order = EXCLUDED.display_order;

  SELECT id INTO audi_id FROM car_brands WHERE slug = 'audi';

  -- Insert Audi A4
  INSERT INTO car_models (id, brand_id, name, slug, year_start, year_end, description, production_numbers, is_featured, display_order) VALUES
    ('aa0e8400-e29b-41d4-a716-446655440001', audi_id, 'A4', 'a4', 1994, NULL, 'The Audi A4 is a compact executive car known for quattro all-wheel drive, premium interior, and advanced technology. One of Audi''s best-selling models.', 'Over 7 million units', true, 1)
  ON CONFLICT (brand_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    production_numbers = EXCLUDED.production_numbers,
    is_featured = EXCLUDED.is_featured,
    display_order = EXCLUDED.display_order;

  SELECT id INTO a4_id FROM car_models WHERE brand_id = audi_id AND slug = 'a4';

  -- Insert Audi A6
  INSERT INTO car_models (id, brand_id, name, slug, year_start, year_end, description, production_numbers, is_featured, display_order) VALUES
    ('aa0e8400-e29b-41d4-a716-446655440002', audi_id, 'A6', 'a6', 1994, NULL, 'The Audi A6 is a mid-size luxury executive car known for comfort, technology, and quattro all-wheel drive. Available in sedan and Avant wagon.', 'Over 5 million units', true, 2)
  ON CONFLICT (brand_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    production_numbers = EXCLUDED.production_numbers,
    is_featured = EXCLUDED.is_featured,
    display_order = EXCLUDED.display_order;

  SELECT id INTO a6_id FROM car_models WHERE brand_id = audi_id AND slug = 'a6';

  -- Insert Audi Q5
  INSERT INTO car_models (id, brand_id, name, slug, year_start, year_end, description, production_numbers, is_featured, display_order) VALUES
    ('aa0e8400-e29b-41d4-a716-446655440003', audi_id, 'Q5', 'q5', 2008, NULL, 'The Audi Q5 is a compact luxury crossover SUV known for quattro all-wheel drive, premium interior, and versatile performance. One of Audi''s most popular models.', 'Over 2 million units', true, 3)
  ON CONFLICT (brand_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    production_numbers = EXCLUDED.production_numbers,
    is_featured = EXCLUDED.is_featured,
    display_order = EXCLUDED.display_order;

  SELECT id INTO q5_id FROM car_models WHERE brand_id = audi_id AND slug = 'q5';

  -- Audi A4 Generations
  INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
  SELECT gen_random_uuid(), a4_id, 'B8 (2008-2015)', 'b8-2008-2015', 2008, 2015, 'B8', 'Fourth generation A4 with improved efficiency and technology. Available with quattro all-wheel drive and multiple engine options.', true, 1
  WHERE EXISTS (SELECT 1 FROM car_models WHERE id = a4_id)
  ON CONFLICT (car_model_id, slug) DO NOTHING;

  INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
  SELECT gen_random_uuid(), a4_id, 'B9 (2016-2023)', 'b9-2016-2023', 2016, 2023, 'B9', 'Fifth generation A4 with Virtual Cockpit, advanced driver assistance, and improved efficiency. Available in sedan and Avant.', true, 2
  WHERE EXISTS (SELECT 1 FROM car_models WHERE id = a4_id)
  ON CONFLICT (car_model_id, slug) DO NOTHING;

  INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
  SELECT gen_random_uuid(), a4_id, 'B10 (2024-Present)', 'b10-2024-present', 2024, NULL, 'B10', 'Sixth generation A4 with updated design, enhanced technology, and improved efficiency. Available with mild hybrid powertrains.', true, 3
  WHERE EXISTS (SELECT 1 FROM car_models WHERE id = a4_id)
  ON CONFLICT (car_model_id, slug) DO NOTHING;

  -- Audi A6 Generations
  INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
  SELECT gen_random_uuid(), a6_id, 'C7 (2011-2018)', 'c7-2011-2018', 2011, 2018, 'C7', 'Fourth generation A6 with advanced technology and improved efficiency. Available with quattro and multiple engine options.', true, 1
  WHERE EXISTS (SELECT 1 FROM car_models WHERE id = a6_id)
  ON CONFLICT (car_model_id, slug) DO NOTHING;

  INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
  SELECT gen_random_uuid(), a6_id, 'C8 (2018-2024)', 'c8-2018-2024', 2018, 2024, 'C8', 'Fifth generation A6 with dual touchscreen MMI, advanced driver assistance, and mild hybrid technology. Available in sedan and Avant.', true, 2
  WHERE EXISTS (SELECT 1 FROM car_models WHERE id = a6_id)
  ON CONFLICT (car_model_id, slug) DO NOTHING;

  -- Audi Q5 Generations
  INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
  SELECT gen_random_uuid(), q5_id, '8R (2008-2017)', '8r-2008-2017', 2008, 2017, '8R', 'First generation Q5 with quattro all-wheel drive and premium features. Available with multiple engine options including TDI diesel.', true, 1
  WHERE EXISTS (SELECT 1 FROM car_models WHERE id = q5_id)
  ON CONFLICT (car_model_id, slug) DO NOTHING;

  INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
  SELECT gen_random_uuid(), q5_id, 'FY (2018-2024)', 'fy-2018-2024', 2018, 2024, 'FY', 'Second generation Q5 with Virtual Cockpit, advanced technology, and improved efficiency. Available with mild hybrid and plug-in hybrid options.', true, 2
  WHERE EXISTS (SELECT 1 FROM car_models WHERE id = q5_id)
  ON CONFLICT (car_model_id, slug) DO NOTHING;

END $$;

