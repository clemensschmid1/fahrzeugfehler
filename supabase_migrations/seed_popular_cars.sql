-- Seed data for popular car brands, models, and generations
-- Based on most searched vehicles for maintenance and repair

-- Insert Car Brands (using DO block to ensure they exist)
DO $$
DECLARE
  ford_id UUID := '770e8400-e29b-41d4-a716-446655440001';
  honda_id UUID := '770e8400-e29b-41d4-a716-446655440002';
  volkswagen_id UUID := '770e8400-e29b-41d4-a716-446655440003';
  toyota_id UUID := '770e8400-e29b-41d4-a716-446655440004';
  nissan_id UUID := '770e8400-e29b-41d4-a716-446655440005';
  hyundai_id UUID := '770e8400-e29b-41d4-a716-446655440006';
  chevrolet_id UUID := '770e8400-e29b-41d4-a716-446655440007';
BEGIN
  -- Insert Ford
  INSERT INTO car_brands (id, name, slug, description, country, founded_year, is_featured, display_order) VALUES
    (ford_id, 'Ford', 'ford', 'Ford Motor Company - American automotive manufacturer known for trucks, SUVs, and reliable vehicles. Founded in 1903, Ford is one of the largest automakers in the world.', 'United States', 1903, true, 3)
  ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    country = EXCLUDED.country,
    founded_year = EXCLUDED.founded_year,
    is_featured = EXCLUDED.is_featured,
    display_order = EXCLUDED.display_order;

  -- Insert Honda
  INSERT INTO car_brands (id, name, slug, description, country, founded_year, is_featured, display_order) VALUES
    (honda_id, 'Honda', 'honda', 'Honda Motor Co., Ltd. - Japanese multinational manufacturer known for reliable, fuel-efficient vehicles and motorcycles. Founded in 1948.', 'Japan', 1948, true, 4)
  ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    country = EXCLUDED.country,
    founded_year = EXCLUDED.founded_year,
    is_featured = EXCLUDED.is_featured,
    display_order = EXCLUDED.display_order;

  -- Insert Volkswagen
  INSERT INTO car_brands (id, name, slug, description, country, founded_year, is_featured, display_order) VALUES
    (volkswagen_id, 'Volkswagen', 'volkswagen', 'Volkswagen AG - German automotive manufacturer known for quality engineering and popular models like Golf and Passat. Founded in 1937.', 'Germany', 1937, true, 5)
  ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    country = EXCLUDED.country,
    founded_year = EXCLUDED.founded_year,
    is_featured = EXCLUDED.is_featured,
    display_order = EXCLUDED.display_order;

  -- Insert Toyota
  INSERT INTO car_brands (id, name, slug, description, country, founded_year, is_featured, display_order) VALUES
    (toyota_id, 'Toyota', 'toyota', 'Toyota Motor Corporation - Japanese automotive manufacturer known for reliability, quality, and innovation. One of the world''s largest automakers, founded in 1937.', 'Japan', 1937, true, 6)
  ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    country = EXCLUDED.country,
    founded_year = EXCLUDED.founded_year,
    is_featured = EXCLUDED.is_featured,
    display_order = EXCLUDED.display_order;

  -- Insert Nissan
  INSERT INTO car_brands (id, name, slug, description, country, founded_year, is_featured, display_order) VALUES
    (nissan_id, 'Nissan', 'nissan', 'Nissan Motor Co., Ltd. - Japanese automotive manufacturer known for innovative technology and popular models like Altima and Sentra. Founded in 1933.', 'Japan', 1933, true, 7)
  ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    country = EXCLUDED.country,
    founded_year = EXCLUDED.founded_year,
    is_featured = EXCLUDED.is_featured,
    display_order = EXCLUDED.display_order;

  -- Insert Hyundai
  INSERT INTO car_brands (id, name, slug, description, country, founded_year, is_featured, display_order) VALUES
    (hyundai_id, 'Hyundai', 'hyundai', 'Hyundai Motor Company - South Korean automotive manufacturer known for value, quality, and warranty. Founded in 1967.', 'South Korea', 1967, true, 8)
  ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    country = EXCLUDED.country,
    founded_year = EXCLUDED.founded_year,
    is_featured = EXCLUDED.is_featured,
    display_order = EXCLUDED.display_order;

  -- Insert Chevrolet
  INSERT INTO car_brands (id, name, slug, description, country, founded_year, is_featured, display_order) VALUES
    (chevrolet_id, 'Chevrolet', 'chevrolet', 'Chevrolet - American automotive brand known for trucks, SUVs, and performance vehicles. Part of General Motors, founded in 1911.', 'United States', 1911, true, 9)
  ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    country = EXCLUDED.country,
    founded_year = EXCLUDED.founded_year,
    is_featured = EXCLUDED.is_featured,
    display_order = EXCLUDED.display_order;

  -- Now get the actual IDs (in case they were updated due to conflict)
  SELECT id INTO ford_id FROM car_brands WHERE slug = 'ford';
  SELECT id INTO honda_id FROM car_brands WHERE slug = 'honda';
  SELECT id INTO volkswagen_id FROM car_brands WHERE slug = 'volkswagen';
  SELECT id INTO toyota_id FROM car_brands WHERE slug = 'toyota';
  SELECT id INTO nissan_id FROM car_brands WHERE slug = 'nissan';
  SELECT id INTO hyundai_id FROM car_brands WHERE slug = 'hyundai';
  SELECT id INTO chevrolet_id FROM car_brands WHERE slug = 'chevrolet';

  -- Insert Car Models

  -- Ford F-150
  INSERT INTO car_models (id, brand_id, name, slug, year_start, year_end, description, production_numbers, is_featured, display_order) VALUES
    ('880e8400-e29b-41d4-a716-446655440001', ford_id, 'F-150', 'f-150', 1975, NULL, 'The Ford F-150 is America''s best-selling truck for over 40 years. Known for durability, towing capacity, and versatility. Available in multiple cab configurations and engine options.', 'Over 40 million units', true, 1)
  ON CONFLICT (brand_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    year_start = EXCLUDED.year_start,
    year_end = EXCLUDED.year_end,
    description = EXCLUDED.description,
    production_numbers = EXCLUDED.production_numbers,
    is_featured = EXCLUDED.is_featured,
    display_order = EXCLUDED.display_order;

  -- Honda Civic
  INSERT INTO car_models (id, brand_id, name, slug, year_start, year_end, description, production_numbers, is_featured, display_order) VALUES
    ('880e8400-e29b-41d4-a716-446655440002', honda_id, 'Civic', 'civic', 1972, NULL, 'The Honda Civic is a compact car known for reliability, fuel efficiency, and sporty performance. One of the most popular compact cars worldwide.', 'Over 27 million units', true, 1)
  ON CONFLICT (brand_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    year_start = EXCLUDED.year_start,
    year_end = EXCLUDED.year_end,
    description = EXCLUDED.description,
    production_numbers = EXCLUDED.production_numbers,
    is_featured = EXCLUDED.is_featured,
    display_order = EXCLUDED.display_order;

  -- Honda Accord
  INSERT INTO car_models (id, brand_id, name, slug, year_start, year_end, description, production_numbers, is_featured, display_order) VALUES
    ('880e8400-e29b-41d4-a716-446655440003', honda_id, 'Accord', 'accord', 1976, NULL, 'The Honda Accord is a mid-size sedan known for reliability, comfort, and advanced safety features. Consistently ranked among the best midsize cars.', 'Over 20 million units', true, 2)
  ON CONFLICT (brand_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    year_start = EXCLUDED.year_start,
    year_end = EXCLUDED.year_end,
    description = EXCLUDED.description,
    production_numbers = EXCLUDED.production_numbers,
    is_featured = EXCLUDED.is_featured,
    display_order = EXCLUDED.display_order;

  -- Volkswagen Golf
  INSERT INTO car_models (id, brand_id, name, slug, year_start, year_end, description, production_numbers, is_featured, display_order) VALUES
    ('880e8400-e29b-41d4-a716-446655440004', volkswagen_id, 'Golf', 'golf', 1974, NULL, 'The Volkswagen Golf is a compact car known for German engineering, build quality, and versatility. One of the best-selling cars of all time.', 'Over 35 million units', true, 1)
  ON CONFLICT (brand_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    year_start = EXCLUDED.year_start,
    year_end = EXCLUDED.year_end,
    description = EXCLUDED.description,
    production_numbers = EXCLUDED.production_numbers,
    is_featured = EXCLUDED.is_featured,
    display_order = EXCLUDED.display_order;

  -- Toyota Camry
  INSERT INTO car_models (id, brand_id, name, slug, year_start, year_end, description, production_numbers, is_featured, display_order) VALUES
    ('880e8400-e29b-41d4-a716-446655440005', toyota_id, 'Camry', 'camry', 1982, NULL, 'The Toyota Camry is a mid-size sedan known for reliability, comfort, and fuel efficiency. Consistently one of America''s best-selling cars.', 'Over 20 million units', true, 1)
  ON CONFLICT (brand_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    year_start = EXCLUDED.year_start,
    year_end = EXCLUDED.year_end,
    description = EXCLUDED.description,
    production_numbers = EXCLUDED.production_numbers,
    is_featured = EXCLUDED.is_featured,
    display_order = EXCLUDED.display_order;

  -- Toyota RAV4
  INSERT INTO car_models (id, brand_id, name, slug, year_start, year_end, description, production_numbers, is_featured, display_order) VALUES
    ('880e8400-e29b-41d4-a716-446655440006', toyota_id, 'RAV4', 'rav4', 1994, NULL, 'The Toyota RAV4 is a compact crossover SUV known for reliability, fuel efficiency, and versatility. One of the best-selling SUVs worldwide.', 'Over 10 million units', true, 2)
  ON CONFLICT (brand_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    year_start = EXCLUDED.year_start,
    year_end = EXCLUDED.year_end,
    description = EXCLUDED.description,
    production_numbers = EXCLUDED.production_numbers,
    is_featured = EXCLUDED.is_featured,
    display_order = EXCLUDED.display_order;

  -- Nissan Altima
  INSERT INTO car_models (id, brand_id, name, slug, year_start, year_end, description, production_numbers, is_featured, display_order) VALUES
    ('880e8400-e29b-41d4-a716-446655440007', nissan_id, 'Altima', 'altima', 1992, NULL, 'The Nissan Altima is a mid-size sedan known for comfort, technology, and value. Popular choice for families and commuters.', 'Over 5 million units', true, 1)
  ON CONFLICT (brand_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    year_start = EXCLUDED.year_start,
    year_end = EXCLUDED.year_end,
    description = EXCLUDED.description,
    production_numbers = EXCLUDED.production_numbers,
    is_featured = EXCLUDED.is_featured,
    display_order = EXCLUDED.display_order;

  -- Hyundai Elantra
  INSERT INTO car_models (id, brand_id, name, slug, year_start, year_end, description, production_numbers, is_featured, display_order) VALUES
    ('880e8400-e29b-41d4-a716-446655440008', hyundai_id, 'Elantra', 'elantra', 1990, NULL, 'The Hyundai Elantra is a compact sedan known for value, warranty, and modern features. Popular choice for budget-conscious buyers.', 'Over 12 million units', true, 1)
  ON CONFLICT (brand_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    year_start = EXCLUDED.year_start,
    year_end = EXCLUDED.year_end,
    description = EXCLUDED.description,
    production_numbers = EXCLUDED.production_numbers,
    is_featured = EXCLUDED.is_featured,
    display_order = EXCLUDED.display_order;

  -- Chevrolet Silverado 1500
  INSERT INTO car_models (id, brand_id, name, slug, year_start, year_end, description, production_numbers, is_featured, display_order) VALUES
    ('880e8400-e29b-41d4-a716-446655440009', chevrolet_id, 'Silverado 1500', 'silverado-1500', 1999, NULL, 'The Chevrolet Silverado 1500 is a full-size pickup truck known for towing capacity, durability, and technology. One of America''s best-selling trucks.', 'Over 15 million units', true, 1)
  ON CONFLICT (brand_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    year_start = EXCLUDED.year_start,
    year_end = EXCLUDED.year_end,
    description = EXCLUDED.description,
    production_numbers = EXCLUDED.production_numbers,
    is_featured = EXCLUDED.is_featured,
    display_order = EXCLUDED.display_order;

  -- Insert Model Generations

  -- Ford F-150 Generations (2009-2024)
  INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
  SELECT gen_random_uuid(), '880e8400-e29b-41d4-a716-446655440001', '12th Generation (2009-2014)', '12th-gen-2009-2014', 2009, 2014, 'P415', 'Twelfth generation F-150 with improved fuel economy and towing capacity. Available with V6, V8, and EcoBoost engines.', true, 1
  WHERE EXISTS (SELECT 1 FROM car_models WHERE id = '880e8400-e29b-41d4-a716-446655440001')
  ON CONFLICT (car_model_id, slug) DO NOTHING;

  INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
  SELECT gen_random_uuid(), '880e8400-e29b-41d4-a716-446655440001', '13th Generation (2015-2020)', '13th-gen-2015-2020', 2015, 2020, 'P558', 'Thirteenth generation F-150 with aluminum body, advanced technology, and improved fuel efficiency. Introduced 2.7L EcoBoost V6.', true, 2
  WHERE EXISTS (SELECT 1 FROM car_models WHERE id = '880e8400-e29b-41d4-a716-446655440001')
  ON CONFLICT (car_model_id, slug) DO NOTHING;

  INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
  SELECT gen_random_uuid(), '880e8400-e29b-41d4-a716-446655440001', '14th Generation (2021-2024)', '14th-gen-2021-2024', 2021, 2024, 'P703', 'Fourteenth generation F-150 with hybrid powertrain option, advanced driver assistance, and improved towing. Available with PowerBoost hybrid.', true, 3
  WHERE EXISTS (SELECT 1 FROM car_models WHERE id = '880e8400-e29b-41d4-a716-446655440001')
  ON CONFLICT (car_model_id, slug) DO NOTHING;

  -- Honda Civic Generations (2012-2022)
  INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
  SELECT gen_random_uuid(), '880e8400-e29b-41d4-a716-446655440002', '9th Generation (2012-2015)', '9th-gen-2012-2015', 2012, 2015, 'FB/FC', 'Ninth generation Civic with improved fuel economy and refined styling. Available in sedan and coupe body styles.', true, 1
  WHERE EXISTS (SELECT 1 FROM car_models WHERE id = '880e8400-e29b-41d4-a716-446655440002')
  ON CONFLICT (car_model_id, slug) DO NOTHING;

  INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
  SELECT gen_random_uuid(), '880e8400-e29b-41d4-a716-446655440002', '10th Generation (2016-2021)', '10th-gen-2016-2021', 2016, 2021, 'FC/FK', 'Tenth generation Civic with turbocharged engines, advanced safety features (Honda Sensing), and sporty design. Available in sedan, coupe, and hatchback.', true, 2
  WHERE EXISTS (SELECT 1 FROM car_models WHERE id = '880e8400-e29b-41d4-a716-446655440002')
  ON CONFLICT (car_model_id, slug) DO NOTHING;

  INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
  SELECT gen_random_uuid(), '880e8400-e29b-41d4-a716-446655440002', '11th Generation (2022-Present)', '11th-gen-2022-present', 2022, NULL, 'FL', 'Eleventh generation Civic with refined design, improved technology, and enhanced safety. Available in sedan and hatchback.', true, 3
  WHERE EXISTS (SELECT 1 FROM car_models WHERE id = '880e8400-e29b-41d4-a716-446655440002')
  ON CONFLICT (car_model_id, slug) DO NOTHING;

  -- Honda Accord Generations (2008-2022)
  INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
  SELECT gen_random_uuid(), '880e8400-e29b-41d4-a716-446655440003', '8th Generation (2008-2012)', '8th-gen-2008-2012', 2008, 2012, 'CP/CS', 'Eighth generation Accord with V6 and four-cylinder engines. Known for reliability and comfort.', true, 1
  WHERE EXISTS (SELECT 1 FROM car_models WHERE id = '880e8400-e29b-41d4-a716-446655440003')
  ON CONFLICT (car_model_id, slug) DO NOTHING;

  INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
  SELECT gen_random_uuid(), '880e8400-e29b-41d4-a716-446655440003', '9th Generation (2013-2017)', '9th-gen-2013-2017', 2013, 2017, 'CR/CU', 'Ninth generation Accord with Earth Dreams engines, improved fuel economy, and advanced safety features.', true, 2
  WHERE EXISTS (SELECT 1 FROM car_models WHERE id = '880e8400-e29b-41d4-a716-446655440003')
  ON CONFLICT (car_model_id, slug) DO NOTHING;

  INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
  SELECT gen_random_uuid(), '880e8400-e29b-41d4-a716-446655440003', '10th Generation (2018-2022)', '10th-gen-2018-2022', 2018, 2022, 'CV/CR', 'Tenth generation Accord with turbocharged engines, Honda Sensing standard, and modern design. Available in sedan and hybrid.', true, 3
  WHERE EXISTS (SELECT 1 FROM car_models WHERE id = '880e8400-e29b-41d4-a716-446655440003')
  ON CONFLICT (car_model_id, slug) DO NOTHING;

  -- Volkswagen Golf Generations (MK5-MK7)
  INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
  SELECT gen_random_uuid(), '880e8400-e29b-41d4-a716-446655440004', 'MK5 (2004-2008)', 'mk5-2004-2008', 2004, 2008, '1K', 'Fifth generation Golf with improved quality and technology. Available with multiple engine options including TDI diesel.', true, 1
  WHERE EXISTS (SELECT 1 FROM car_models WHERE id = '880e8400-e29b-41d4-a716-446655440004')
  ON CONFLICT (car_model_id, slug) DO NOTHING;

  INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
  SELECT gen_random_uuid(), '880e8400-e29b-41d4-a716-446655440004', 'MK6 (2009-2014)', 'mk6-2009-2014', 2009, 2014, '5K', 'Sixth generation Golf with refined design and improved fuel economy. Introduced TSI turbocharged engines.', true, 2
  WHERE EXISTS (SELECT 1 FROM car_models WHERE id = '880e8400-e29b-41d4-a716-446655440004')
  ON CONFLICT (car_model_id, slug) DO NOTHING;

  INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
  SELECT gen_random_uuid(), '880e8400-e29b-41d4-a716-446655440004', 'MK7 (2015-2019)', 'mk7-2015-2019', 2015, 2019, '5G', 'Seventh generation Golf with MQB platform, advanced technology, and improved efficiency. Available in multiple variants including GTI and R.', true, 3
  WHERE EXISTS (SELECT 1 FROM car_models WHERE id = '880e8400-e29b-41d4-a716-446655440004')
  ON CONFLICT (car_model_id, slug) DO NOTHING;

  INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
  SELECT gen_random_uuid(), '880e8400-e29b-41d4-a716-446655440004', 'MK7.5 (2020-Present)', 'mk7-5-2020-present', 2020, NULL, '5G', 'Seventh generation facelift with updated styling and technology. Continues with proven MQB platform.', true, 4
  WHERE EXISTS (SELECT 1 FROM car_models WHERE id = '880e8400-e29b-41d4-a716-446655440004')
  ON CONFLICT (car_model_id, slug) DO NOTHING;

  -- Toyota Camry Generations (XV40-XV70)
  INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
  SELECT gen_random_uuid(), '880e8400-e29b-41d4-a716-446655440005', 'XV40 (2007-2011)', 'xv40-2007-2011', 2007, 2011, 'XV40', 'Sixth generation Camry with improved fuel economy and safety. Available with V6 and four-cylinder engines.', true, 1
  WHERE EXISTS (SELECT 1 FROM car_models WHERE id = '880e8400-e29b-41d4-a716-446655440005')
  ON CONFLICT (car_model_id, slug) DO NOTHING;

  INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
  SELECT gen_random_uuid(), '880e8400-e29b-41d4-a716-446655440005', 'XV50 (2012-2017)', 'xv50-2012-2017', 2012, 2017, 'XV50', 'Seventh generation Camry with refreshed design and improved technology. Enhanced fuel efficiency and safety features.', true, 2
  WHERE EXISTS (SELECT 1 FROM car_models WHERE id = '880e8400-e29b-41d4-a716-446655440005')
  ON CONFLICT (car_model_id, slug) DO NOTHING;

  INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
  SELECT gen_random_uuid(), '880e8400-e29b-41d4-a716-446655440005', 'XV70 (2018-2024)', 'xv70-2018-2024', 2018, 2024, 'XV70', 'Eighth generation Camry with TNGA platform, aggressive styling, and advanced safety (Toyota Safety Sense). Available in hybrid.', true, 3
  WHERE EXISTS (SELECT 1 FROM car_models WHERE id = '880e8400-e29b-41d4-a716-446655440005')
  ON CONFLICT (car_model_id, slug) DO NOTHING;

  -- Toyota RAV4 Generations (XA40-XA50)
  INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
  SELECT gen_random_uuid(), '880e8400-e29b-41d4-a716-446655440006', 'XA40 (2013-2018)', 'xa40-2013-2018', 2013, 2018, 'XA40', 'Fourth generation RAV4 with improved fuel economy and available AWD. More car-like handling and comfort.', true, 1
  WHERE EXISTS (SELECT 1 FROM car_models WHERE id = '880e8400-e29b-41d4-a716-446655440006')
  ON CONFLICT (car_model_id, slug) DO NOTHING;

  INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
  SELECT gen_random_uuid(), '880e8400-e29b-41d4-a716-446655440006', 'XA50 (2019-2024)', 'xa50-2019-2024', 2019, 2024, 'XA50', 'Fifth generation RAV4 with TNGA platform, bold styling, and available hybrid powertrain. Improved off-road capability with Adventure and TRD Off-Road trims.', true, 2
  WHERE EXISTS (SELECT 1 FROM car_models WHERE id = '880e8400-e29b-41d4-a716-446655440006')
  ON CONFLICT (car_model_id, slug) DO NOTHING;

  -- Nissan Altima Generations (2007-2020)
  INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
  SELECT gen_random_uuid(), '880e8400-e29b-41d4-a716-446655440007', 'L32 (2007-2012)', 'l32-2007-2012', 2007, 2012, 'L32', 'Fourth generation Altima with V6 and four-cylinder engines. Known for sporty handling and reliability.', true, 1
  WHERE EXISTS (SELECT 1 FROM car_models WHERE id = '880e8400-e29b-41d4-a716-446655440007')
  ON CONFLICT (car_model_id, slug) DO NOTHING;

  INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
  SELECT gen_random_uuid(), '880e8400-e29b-41d4-a716-446655440007', 'L33 (2013-2018)', 'l33-2013-2018', 2013, 2018, 'L33', 'Fifth generation Altima with improved fuel economy and technology. Available with CVT transmission.', true, 2
  WHERE EXISTS (SELECT 1 FROM car_models WHERE id = '880e8400-e29b-41d4-a716-446655440007')
  ON CONFLICT (car_model_id, slug) DO NOTHING;

  INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
  SELECT gen_random_uuid(), '880e8400-e29b-41d4-a716-446655440007', 'L34 (2019-2024)', 'l34-2019-2024', 2019, 2024, 'L34', 'Sixth generation Altima with variable compression turbo engine, ProPILOT Assist, and modern design. Available in AWD.', true, 3
  WHERE EXISTS (SELECT 1 FROM car_models WHERE id = '880e8400-e29b-41d4-a716-446655440007')
  ON CONFLICT (car_model_id, slug) DO NOTHING;

  -- Hyundai Elantra Generations (2011-2022)
  INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
  SELECT gen_random_uuid(), '880e8400-e29b-41d4-a716-446655440008', 'MD/UD (2011-2015)', 'md-ud-2011-2015', 2011, 2015, 'MD/UD', 'Fifth generation Elantra with improved fuel economy and modern design. Available in sedan and coupe.', true, 1
  WHERE EXISTS (SELECT 1 FROM car_models WHERE id = '880e8400-e29b-41d4-a716-446655440008')
  ON CONFLICT (car_model_id, slug) DO NOTHING;

  INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
  SELECT gen_random_uuid(), '880e8400-e29b-41d4-a716-446655440008', 'AD (2016-2020)', 'ad-2016-2020', 2016, 2020, 'AD', 'Sixth generation Elantra with turbocharged engine option and advanced safety features. Improved technology and efficiency.', true, 2
  WHERE EXISTS (SELECT 1 FROM car_models WHERE id = '880e8400-e29b-41d4-a716-446655440008')
  ON CONFLICT (car_model_id, slug) DO NOTHING;

  INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
  SELECT gen_random_uuid(), '880e8400-e29b-41d4-a716-446655440008', 'CN7 (2021-2024)', 'cn7-2021-2024', 2021, 2024, 'CN7', 'Seventh generation Elantra with bold design, hybrid option, and advanced technology. Available in sedan and N-Line performance variant.', true, 3
  WHERE EXISTS (SELECT 1 FROM car_models WHERE id = '880e8400-e29b-41d4-a716-446655440008')
  ON CONFLICT (car_model_id, slug) DO NOTHING;

  -- Chevrolet Silverado 1500 Generations (2008-2023)
  INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
  SELECT gen_random_uuid(), '880e8400-e29b-41d4-a716-446655440009', 'GMT900 (2007-2013)', 'gmt900-2007-2013', 2007, 2013, 'GMT900', 'Third generation Silverado with improved towing and payload. Available with multiple V8 engine options.', true, 1
  WHERE EXISTS (SELECT 1 FROM car_models WHERE id = '880e8400-e29b-41d4-a716-446655440009')
  ON CONFLICT (car_model_id, slug) DO NOTHING;

  INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
  SELECT gen_random_uuid(), '880e8400-e29b-41d4-a716-446655440009', 'K2XX (2014-2018)', 'k2xx-2014-2018', 2014, 2018, 'K2XX', 'Fourth generation Silverado with improved fuel economy and technology. Available with V6, V8, and diesel engines.', true, 2
  WHERE EXISTS (SELECT 1 FROM car_models WHERE id = '880e8400-e29b-41d4-a716-446655440009')
  ON CONFLICT (car_model_id, slug) DO NOTHING;

  INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
  SELECT gen_random_uuid(), '880e8400-e29b-41d4-a716-446655440009', 'T1XX (2019-2023)', 't1xx-2019-2023', 2019, 2023, 'T1XX', 'Fifth generation Silverado with advanced technology, improved towing, and available diesel engine. Multiple trim levels including High Country and Trail Boss.', true, 3
  WHERE EXISTS (SELECT 1 FROM car_models WHERE id = '880e8400-e29b-41d4-a716-446655440009')
  ON CONFLICT (car_model_id, slug) DO NOTHING;

END $$;
