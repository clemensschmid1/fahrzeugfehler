
DO $$
DECLARE
  -- Brand IDs
  porsche_id UUID;
  lexus_id UUID;
  infiniti_id UUID;
  genesis_id UUID;
  land_rover_id UUID;
  jaguar_id UUID;
  dodge_id UUID;
  jeep_id UUID;
  ram_id UUID;
  gmc_id UUID;
  cadillac_id UUID;
  lincoln_id UUID;
  acura_id UUID;
  mini_id UUID;
  alfa_romeo_id UUID;
  skoda_id UUID;
  opel_id UUID;
  peugeot_id UUID;
  renault_id UUID;
  -- Model IDs will be declared as needed
BEGIN
  -- ============================================
  -- PORSCHE - German Sports/Luxury Brand
  -- ============================================
  INSERT INTO car_brands (id, name, slug, description, country, founded_year, is_featured, display_order) VALUES
    (gen_random_uuid(), 'Porsche', 'porsche', 'Porsche AG - German luxury sports car manufacturer known for high-performance vehicles, engineering excellence, and iconic 911 model. Founded in 1931.', 'Germany', 1931, true, 12)
  ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    country = EXCLUDED.country,
    founded_year = EXCLUDED.founded_year,
    is_featured = EXCLUDED.is_featured,
    display_order = EXCLUDED.display_order;
  
  SELECT id INTO porsche_id FROM car_brands WHERE slug = 'porsche';

  -- Porsche 911
  INSERT INTO car_models (id, brand_id, name, slug, year_start, year_end, description, is_featured, display_order) VALUES
    (gen_random_uuid(), porsche_id, '911', '911', 1964, NULL, 'The Porsche 911 is an iconic sports car, one of the most recognizable and successful sports cars in history. Known for rear-engine layout and exceptional performance.', true, 1)
  ON CONFLICT (brand_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    is_featured = EXCLUDED.is_featured,
    display_order = EXCLUDED.display_order;

  -- Porsche 911 Generations
  INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
  SELECT gen_random_uuid(), (SELECT id FROM car_models WHERE brand_id = porsche_id AND slug = '911'), '992 (2019-Present)', '992-2019-present', 2019, NULL, '992', 'Eighth generation 911 with updated design, advanced technology, and improved performance. Available with turbocharged flat-6 engines.', true, 1
  WHERE EXISTS (SELECT 1 FROM car_models WHERE brand_id = porsche_id AND slug = '911')
  ON CONFLICT (car_model_id, slug) DO NOTHING;

  INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
  SELECT gen_random_uuid(), (SELECT id FROM car_models WHERE brand_id = porsche_id AND slug = '911'), '991 (2011-2019)', '991-2011-2019', 2011, 2019, '991', 'Seventh generation 911 with new platform, improved efficiency, and advanced technology. Available in Carrera, S, GTS, Turbo, and GT3 variants.', true, 2
  WHERE EXISTS (SELECT 1 FROM car_models WHERE brand_id = porsche_id AND slug = '911')
  ON CONFLICT (car_model_id, slug) DO NOTHING;

  -- Porsche Cayenne
  INSERT INTO car_models (id, brand_id, name, slug, year_start, year_end, description, is_featured, display_order) VALUES
    (gen_random_uuid(), porsche_id, 'Cayenne', 'cayenne', 2002, NULL, 'The Porsche Cayenne is a luxury mid-size SUV combining Porsche performance with SUV practicality. Known for exceptional handling and powerful engines.', true, 2)
  ON CONFLICT (brand_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    is_featured = EXCLUDED.is_featured,
    display_order = EXCLUDED.display_order;

  INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
  SELECT gen_random_uuid(), (SELECT id FROM car_models WHERE brand_id = porsche_id AND slug = 'cayenne'), 'E3 (2018-Present)', 'e3-2018-present', 2018, NULL, 'E3', 'Third generation Cayenne with updated design, advanced technology, and improved efficiency. Available with V6, V8, and plug-in hybrid powertrains.', true, 1
  WHERE EXISTS (SELECT 1 FROM car_models WHERE brand_id = porsche_id AND slug = 'cayenne')
  ON CONFLICT (car_model_id, slug) DO NOTHING;

  -- ============================================
  -- LEXUS - Japanese Luxury Brand
  -- ============================================
  INSERT INTO car_brands (id, name, slug, description, country, founded_year, is_featured, display_order) VALUES
    (gen_random_uuid(), 'Lexus', 'lexus', 'Lexus - Japanese luxury vehicle division of Toyota. Known for reliability, comfort, and advanced technology. Founded in 1989.', 'Japan', 1989, true, 13)
  ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    country = EXCLUDED.country,
    founded_year = EXCLUDED.founded_year,
    is_featured = EXCLUDED.is_featured,
    display_order = EXCLUDED.display_order;
  
  SELECT id INTO lexus_id FROM car_brands WHERE slug = 'lexus';

  -- Lexus RX
  INSERT INTO car_models (id, brand_id, name, slug, year_start, year_end, description, is_featured, display_order) VALUES
    (gen_random_uuid(), lexus_id, 'RX', 'rx', 1998, NULL, 'The Lexus RX is a luxury mid-size crossover SUV. One of the first luxury crossovers and Lexus best-selling model. Known for comfort and reliability.', true, 1)
  ON CONFLICT (brand_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    is_featured = EXCLUDED.is_featured,
    display_order = EXCLUDED.display_order;

  INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
  SELECT gen_random_uuid(), (SELECT id FROM car_models WHERE brand_id = lexus_id AND slug = 'rx'), 'L (2023-Present)', 'l-2023-present', 2023, NULL, 'L', 'Fifth generation RX with new platform, updated design, and hybrid powertrains. Available with 2.4L turbo and 2.5L hybrid options.', true, 1
  WHERE EXISTS (SELECT 1 FROM car_models WHERE brand_id = lexus_id AND slug = 'rx')
  ON CONFLICT (car_model_id, slug) DO NOTHING;

  INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
  SELECT gen_random_uuid(), (SELECT id FROM car_models WHERE brand_id = lexus_id AND slug = 'rx'), 'AL (2015-2022)', 'al-2015-2022', 2015, 2022, 'AL', 'Fourth generation RX with bold design, advanced safety features, and hybrid powertrain options. Available in standard and L (long wheelbase) variants.', true, 2
  WHERE EXISTS (SELECT 1 FROM car_models WHERE brand_id = lexus_id AND slug = 'rx')
  ON CONFLICT (car_model_id, slug) DO NOTHING;

  -- Lexus ES
  INSERT INTO car_models (id, brand_id, name, slug, year_start, year_end, description, is_featured, display_order) VALUES
    (gen_random_uuid(), lexus_id, 'ES', 'es', 1989, NULL, 'The Lexus ES is a mid-size luxury sedan. Known for comfort, reliability, and value. One of Lexus most popular models.', true, 2)
  ON CONFLICT (brand_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    is_featured = EXCLUDED.is_featured,
    display_order = EXCLUDED.display_order;

  INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
  SELECT gen_random_uuid(), (SELECT id FROM car_models WHERE brand_id = lexus_id AND slug = 'es'), 'XV70 (2018-2024)', 'xv70-2018-2024', 2018, 2024, 'XV70', 'Seventh generation ES with new platform, updated design, and improved technology. Available with 3.5L V6 and 2.5L hybrid powertrains.', true, 1
  WHERE EXISTS (SELECT 1 FROM car_models WHERE brand_id = lexus_id AND slug = 'es')
  ON CONFLICT (car_model_id, slug) DO NOTHING;

  -- ============================================
  -- INFINITI - Japanese Luxury Brand
  -- ============================================
  INSERT INTO car_brands (id, name, slug, description, country, founded_year, is_featured, display_order) VALUES
    (gen_random_uuid(), 'Infiniti', 'infiniti', 'Infiniti - Japanese luxury vehicle division of Nissan. Known for performance, technology, and distinctive design. Founded in 1989.', 'Japan', 1989, true, 14)
  ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    country = EXCLUDED.country,
    founded_year = EXCLUDED.founded_year,
    is_featured = EXCLUDED.is_featured,
    display_order = EXCLUDED.display_order;
  
  SELECT id INTO infiniti_id FROM car_brands WHERE slug = 'infiniti';

  -- Infiniti Q50
  INSERT INTO car_models (id, brand_id, name, slug, year_start, year_end, description, is_featured, display_order) VALUES
    (gen_random_uuid(), infiniti_id, 'Q50', 'q50', 2013, NULL, 'The Infiniti Q50 is a compact luxury sedan. Known for performance, technology, and available all-wheel drive. Replaced the G37.', true, 1)
  ON CONFLICT (brand_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    is_featured = EXCLUDED.is_featured,
    display_order = EXCLUDED.display_order;

  INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
  SELECT gen_random_uuid(), (SELECT id FROM car_models WHERE brand_id = infiniti_id AND slug = 'q50'), 'V37 (2013-Present)', 'v37-2013-present', 2013, NULL, 'V37', 'First generation Q50 with advanced technology, available 3.7L V6 and 3.0L twin-turbo V6 engines. Features Direct Adaptive Steering.', true, 1
  WHERE EXISTS (SELECT 1 FROM car_models WHERE brand_id = infiniti_id AND slug = 'q50')
  ON CONFLICT (car_model_id, slug) DO NOTHING;

  -- ============================================
  -- GENESIS - Korean Luxury Brand
  -- ============================================
  INSERT INTO car_brands (id, name, slug, description, country, founded_year, is_featured, display_order) VALUES
    (gen_random_uuid(), 'Genesis', 'genesis', 'Genesis - Korean luxury vehicle division of Hyundai. Known for value, technology, and warranty. Founded in 2015.', 'South Korea', 2015, true, 15)
  ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    country = EXCLUDED.country,
    founded_year = EXCLUDED.founded_year,
    is_featured = EXCLUDED.is_featured,
    display_order = EXCLUDED.display_order;
  
  SELECT id INTO genesis_id FROM car_brands WHERE slug = 'genesis';

  -- Genesis G70
  INSERT INTO car_models (id, brand_id, name, slug, year_start, year_end, description, is_featured, display_order) VALUES
    (gen_random_uuid(), genesis_id, 'G70', 'g70', 2017, NULL, 'The Genesis G70 is a compact luxury sports sedan. Known for performance, value, and technology. Competes with BMW 3 Series and Mercedes C-Class.', true, 1)
  ON CONFLICT (brand_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    is_featured = EXCLUDED.is_featured,
    display_order = EXCLUDED.display_order;

  INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
  SELECT gen_random_uuid(), (SELECT id FROM car_models WHERE brand_id = genesis_id AND slug = 'g70'), 'IG (2017-2023)', 'ig-2017-2023', 2017, 2023, 'IG', 'First generation G70 with 2.0L turbo and 3.3L twin-turbo V6 engines. Available with rear-wheel or all-wheel drive.', true, 1
  WHERE EXISTS (SELECT 1 FROM car_models WHERE brand_id = genesis_id AND slug = 'g70')
  ON CONFLICT (car_model_id, slug) DO NOTHING;

  -- ============================================
  -- LAND ROVER - British Luxury SUV Brand
  -- ============================================
  INSERT INTO car_brands (id, name, slug, description, country, founded_year, is_featured, display_order) VALUES
    (gen_random_uuid(), 'Land Rover', 'land-rover', 'Land Rover - British luxury SUV manufacturer. Known for off-road capability, luxury, and distinctive design. Founded in 1948.', 'United Kingdom', 1948, true, 16)
  ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    country = EXCLUDED.country,
    founded_year = EXCLUDED.founded_year,
    is_featured = EXCLUDED.is_featured,
    display_order = EXCLUDED.display_order;
  
  SELECT id INTO land_rover_id FROM car_brands WHERE slug = 'land-rover';

  -- Land Rover Range Rover
  INSERT INTO car_models (id, brand_id, name, slug, year_start, year_end, description, is_featured, display_order) VALUES
    (gen_random_uuid(), land_rover_id, 'Range Rover', 'range-rover', 1970, NULL, 'The Range Rover is a full-size luxury SUV. Known for off-road capability, luxury interior, and advanced technology. Iconic British luxury vehicle.', true, 1)
  ON CONFLICT (brand_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    is_featured = EXCLUDED.is_featured,
    display_order = EXCLUDED.display_order;

  INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
  SELECT gen_random_uuid(), (SELECT id FROM car_models WHERE brand_id = land_rover_id AND slug = 'range-rover'), 'L460 (2022-Present)', 'l460-2022-present', 2022, NULL, 'L460', 'Fifth generation Range Rover with new platform, updated design, and advanced technology. Available with inline-6, V8, and plug-in hybrid powertrains.', true, 1
  WHERE EXISTS (SELECT 1 FROM car_models WHERE brand_id = land_rover_id AND slug = 'range-rover')
  ON CONFLICT (car_model_id, slug) DO NOTHING;

  INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
  SELECT gen_random_uuid(), (SELECT id FROM car_models WHERE brand_id = land_rover_id AND slug = 'range-rover'), 'L405 (2012-2021)', 'l405-2012-2021', 2012, 2021, 'L405', 'Fourth generation Range Rover with aluminum construction, improved efficiency, and advanced technology. Available with V6, V8, and diesel engines.', true, 2
  WHERE EXISTS (SELECT 1 FROM car_models WHERE brand_id = land_rover_id AND slug = 'range-rover')
  ON CONFLICT (car_model_id, slug) DO NOTHING;

  -- Land Rover Discovery
  INSERT INTO car_models (id, brand_id, name, slug, year_start, year_end, description, is_featured, display_order) VALUES
    (gen_random_uuid(), land_rover_id, 'Discovery', 'discovery', 1989, NULL, 'The Land Rover Discovery is a mid-size luxury SUV. Known for off-road capability, seven-seat capacity, and practical luxury.', true, 2)
  ON CONFLICT (brand_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    is_featured = EXCLUDED.is_featured,
    display_order = EXCLUDED.display_order;

  INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
  SELECT gen_random_uuid(), (SELECT id FROM car_models WHERE brand_id = land_rover_id AND slug = 'discovery'), 'L462 (2017-Present)', 'l462-2017-present', 2017, NULL, 'L462', 'Fifth generation Discovery with aluminum construction, updated design, and advanced technology. Available with inline-6 and V6 engines.', true, 1
  WHERE EXISTS (SELECT 1 FROM car_models WHERE brand_id = land_rover_id AND slug = 'discovery')
  ON CONFLICT (car_model_id, slug) DO NOTHING;

  -- ============================================
  -- JAGUAR - British Luxury Brand
  -- ============================================
  INSERT INTO car_brands (id, name, slug, description, country, founded_year, is_featured, display_order) VALUES
    (gen_random_uuid(), 'Jaguar', 'jaguar', 'Jaguar - British luxury vehicle manufacturer. Known for elegant design, performance, and British heritage. Founded in 1922.', 'United Kingdom', 1922, true, 17)
  ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    country = EXCLUDED.country,
    founded_year = EXCLUDED.founded_year,
    is_featured = EXCLUDED.is_featured,
    display_order = EXCLUDED.display_order;
  
  SELECT id INTO jaguar_id FROM car_brands WHERE slug = 'jaguar';

  -- Jaguar XF
  INSERT INTO car_models (id, brand_id, name, slug, year_start, year_end, description, is_featured, display_order) VALUES
    (gen_random_uuid(), jaguar_id, 'XF', 'xf', 2007, NULL, 'The Jaguar XF is a mid-size luxury sedan. Known for elegant design, performance, and British luxury. Replaced the S-Type.', true, 1)
  ON CONFLICT (brand_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    is_featured = EXCLUDED.is_featured,
    display_order = EXCLUDED.display_order;

  INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
  SELECT gen_random_uuid(), (SELECT id FROM car_models WHERE brand_id = jaguar_id AND slug = 'xf'), 'X260 (2015-2024)', 'x260-2015-2024', 2015, 2024, 'X260', 'Second generation XF with aluminum construction, updated design, and improved efficiency. Available with 2.0L turbo, 3.0L supercharged V6, and diesel engines.', true, 1
  WHERE EXISTS (SELECT 1 FROM car_models WHERE brand_id = jaguar_id AND slug = 'xf')
  ON CONFLICT (car_model_id, slug) DO NOTHING;

  -- ============================================
  -- DODGE - American Performance Brand
  -- ============================================
  INSERT INTO car_brands (id, name, slug, description, country, founded_year, is_featured, display_order) VALUES
    (gen_random_uuid(), 'Dodge', 'dodge', 'Dodge - American automotive brand known for performance vehicles, muscle cars, and trucks. Part of Stellantis. Founded in 1900.', 'United States', 1900, true, 18)
  ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    country = EXCLUDED.country,
    founded_year = EXCLUDED.founded_year,
    is_featured = EXCLUDED.is_featured,
    display_order = EXCLUDED.display_order;
  
  SELECT id INTO dodge_id FROM car_brands WHERE slug = 'dodge';

  -- Dodge Charger
  INSERT INTO car_models (id, brand_id, name, slug, year_start, year_end, description, is_featured, display_order) VALUES
    (gen_random_uuid(), dodge_id, 'Charger', 'charger', 2006, NULL, 'The Dodge Charger is a full-size performance sedan. Known for powerful V8 engines, aggressive styling, and performance variants including Hellcat and Redeye.', true, 1)
  ON CONFLICT (brand_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    is_featured = EXCLUDED.is_featured,
    display_order = EXCLUDED.display_order;

  INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
  SELECT gen_random_uuid(), (SELECT id FROM car_models WHERE brand_id = dodge_id AND slug = 'charger'), 'LD (2011-2024)', 'ld-2011-2024', 2011, 2024, 'LD', 'Third generation Charger with updated design, available V6 and V8 engines including 6.4L HEMI and 6.2L supercharged Hellcat variants.', true, 1
  WHERE EXISTS (SELECT 1 FROM car_models WHERE brand_id = dodge_id AND slug = 'charger')
  ON CONFLICT (car_model_id, slug) DO NOTHING;

  -- ============================================
  -- JEEP - American SUV Brand
  -- ============================================
  INSERT INTO car_brands (id, name, slug, description, country, founded_year, is_featured, display_order) VALUES
    (gen_random_uuid(), 'Jeep', 'jeep', 'Jeep - American SUV and off-road vehicle brand. Known for off-road capability, iconic design, and ruggedness. Part of Stellantis. Founded in 1941.', 'United States', 1941, true, 19)
  ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    country = EXCLUDED.country,
    founded_year = EXCLUDED.founded_year,
    is_featured = EXCLUDED.is_featured,
    display_order = EXCLUDED.display_order;
  
  SELECT id INTO jeep_id FROM car_brands WHERE slug = 'jeep';

  -- Jeep Wrangler
  INSERT INTO car_models (id, brand_id, name, slug, year_start, year_end, description, is_featured, display_order) VALUES
    (gen_random_uuid(), jeep_id, 'Wrangler', 'wrangler', 1986, NULL, 'The Jeep Wrangler is an iconic off-road SUV. Known for exceptional off-road capability, removable doors and roof, and legendary 4x4 system.', true, 1)
  ON CONFLICT (brand_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    is_featured = EXCLUDED.is_featured,
    display_order = EXCLUDED.display_order;

  INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
  SELECT gen_random_uuid(), (SELECT id FROM car_models WHERE brand_id = jeep_id AND slug = 'wrangler'), 'JL (2018-Present)', 'jl-2018-present', 2018, NULL, 'JL', 'Fourth generation Wrangler with improved on-road comfort, updated technology, and available 2.0L turbo, 3.6L V6, and 3.0L diesel engines.', true, 1
  WHERE EXISTS (SELECT 1 FROM car_models WHERE brand_id = jeep_id AND slug = 'wrangler')
  ON CONFLICT (car_model_id, slug) DO NOTHING;

  INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
  SELECT gen_random_uuid(), (SELECT id FROM car_models WHERE brand_id = jeep_id AND slug = 'wrangler'), 'JK (2007-2018)', 'jk-2007-2018', 2007, 2018, 'JK', 'Third generation Wrangler with improved interior, available 3.6L V6 and 3.8L V6 engines. Available in two-door and four-door Unlimited variants.', true, 2
  WHERE EXISTS (SELECT 1 FROM car_models WHERE brand_id = jeep_id AND slug = 'wrangler')
  ON CONFLICT (car_model_id, slug) DO NOTHING;

  -- Jeep Grand Cherokee
  INSERT INTO car_models (id, brand_id, name, slug, year_start, year_end, description, is_featured, display_order) VALUES
    (gen_random_uuid(), jeep_id, 'Grand Cherokee', 'grand-cherokee', 1992, NULL, 'The Jeep Grand Cherokee is a mid-size luxury SUV. Known for off-road capability, comfortable interior, and available powerful engines.', true, 2)
  ON CONFLICT (brand_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    is_featured = EXCLUDED.is_featured,
    display_order = EXCLUDED.display_order;

  INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
  SELECT gen_random_uuid(), (SELECT id FROM car_models WHERE brand_id = jeep_id AND slug = 'grand-cherokee'), 'WL (2021-Present)', 'wl-2021-present', 2021, NULL, 'WL', 'Fifth generation Grand Cherokee with new platform, updated design, and advanced technology. Available with V6, V8, and plug-in hybrid powertrains.', true, 1
  WHERE EXISTS (SELECT 1 FROM car_models WHERE brand_id = jeep_id AND slug = 'grand-cherokee')
  ON CONFLICT (car_model_id, slug) DO NOTHING;

  -- ============================================
  -- RAM - American Truck Brand
  -- ============================================
  INSERT INTO car_brands (id, name, slug, description, country, founded_year, is_featured, display_order) VALUES
    (gen_random_uuid(), 'Ram', 'ram', 'Ram Trucks - American truck brand specializing in pickup trucks and commercial vehicles. Known for capability, towing, and durability. Part of Stellantis. Founded in 2009.', 'United States', 2009, true, 20)
  ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    country = EXCLUDED.country,
    founded_year = EXCLUDED.founded_year,
    is_featured = EXCLUDED.is_featured,
    display_order = EXCLUDED.display_order;
  
  SELECT id INTO ram_id FROM car_brands WHERE slug = 'ram';

  -- Ram 1500
  INSERT INTO car_models (id, brand_id, name, slug, year_start, year_end, description, is_featured, display_order) VALUES
    (gen_random_uuid(), ram_id, '1500', '1500', 2009, NULL, 'The Ram 1500 is a full-size pickup truck. Known for towing capability, comfortable interior, and available powerful engines including HEMI V8.', true, 1)
  ON CONFLICT (brand_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    is_featured = EXCLUDED.is_featured,
    display_order = EXCLUDED.display_order;

  INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
  SELECT gen_random_uuid(), (SELECT id FROM car_models WHERE brand_id = ram_id AND slug = '1500'), 'DT (2019-Present)', 'dt-2019-present', 2019, NULL, 'DT', 'Fifth generation 1500 with updated design, improved efficiency, and available 3.6L V6, 5.7L HEMI V8, and 3.0L diesel engines.', true, 1
  WHERE EXISTS (SELECT 1 FROM car_models WHERE brand_id = ram_id AND slug = '1500')
  ON CONFLICT (car_model_id, slug) DO NOTHING;

  -- ============================================
  -- GMC - American Truck/SUV Brand
  -- ============================================
  INSERT INTO car_brands (id, name, slug, description, country, founded_year, is_featured, display_order) VALUES
    (gen_random_uuid(), 'GMC', 'gmc', 'GMC - American truck and SUV brand. Known for capability, towing, and professional-grade vehicles. Part of General Motors. Founded in 1911.', 'United States', 1911, true, 21)
  ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    country = EXCLUDED.country,
    founded_year = EXCLUDED.founded_year,
    is_featured = EXCLUDED.is_featured,
    display_order = EXCLUDED.display_order;
  
  SELECT id INTO gmc_id FROM car_brands WHERE slug = 'gmc';

  -- GMC Sierra
  INSERT INTO car_models (id, brand_id, name, slug, year_start, year_end, description, is_featured, display_order) VALUES
    (gen_random_uuid(), gmc_id, 'Sierra', 'sierra', 1999, NULL, 'The GMC Sierra is a full-size pickup truck. Known for towing capability, available Denali luxury trim, and powerful engines.', true, 1)
  ON CONFLICT (brand_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    is_featured = EXCLUDED.is_featured,
    display_order = EXCLUDED.display_order;

  INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
  SELECT gen_random_uuid(), (SELECT id FROM car_models WHERE brand_id = gmc_id AND slug = 'sierra'), 'T1XX (2019-Present)', 't1xx-2019-present', 2019, NULL, 'T1XX', 'Fourth generation Sierra with updated design, advanced technology, and available 2.7L turbo, 5.3L V8, 6.2L V8, and 3.0L diesel engines.', true, 1
  WHERE EXISTS (SELECT 1 FROM car_models WHERE brand_id = gmc_id AND slug = 'sierra')
  ON CONFLICT (car_model_id, slug) DO NOTHING;

  -- ============================================
  -- CADILLAC - American Luxury Brand
  -- ============================================
  INSERT INTO car_brands (id, name, slug, description, country, founded_year, is_featured, display_order) VALUES
    (gen_random_uuid(), 'Cadillac', 'cadillac', 'Cadillac - American luxury vehicle brand. Known for luxury, technology, and American style. Part of General Motors. Founded in 1902.', 'United States', 1902, true, 22)
  ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    country = EXCLUDED.country,
    founded_year = EXCLUDED.founded_year,
    is_featured = EXCLUDED.is_featured,
    display_order = EXCLUDED.display_order;
  
  SELECT id INTO cadillac_id FROM car_brands WHERE slug = 'cadillac';

  -- Cadillac Escalade
  INSERT INTO car_models (id, brand_id, name, slug, year_start, year_end, description, is_featured, display_order) VALUES
    (gen_random_uuid(), cadillac_id, 'Escalade', 'escalade', 1998, NULL, 'The Cadillac Escalade is a full-size luxury SUV. Known for luxury, technology, and powerful engines. Iconic American luxury SUV.', true, 1)
  ON CONFLICT (brand_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    is_featured = EXCLUDED.is_featured,
    display_order = EXCLUDED.display_order;

  INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
  SELECT gen_random_uuid(), (SELECT id FROM car_models WHERE brand_id = cadillac_id AND slug = 'escalade'), 'T1XX (2021-Present)', 't1xx-2021-present', 2021, NULL, 'T1XX', 'Fifth generation Escalade with new platform, updated design, and advanced technology. Available with 6.2L V8 and 3.0L diesel engines.', true, 1
  WHERE EXISTS (SELECT 1 FROM car_models WHERE brand_id = cadillac_id AND slug = 'escalade')
  ON CONFLICT (car_model_id, slug) DO NOTHING;

  -- ============================================
  -- LINCOLN - American Luxury Brand
  -- ============================================
  INSERT INTO car_brands (id, name, slug, description, country, founded_year, is_featured, display_order) VALUES
    (gen_random_uuid(), 'Lincoln', 'lincoln', 'Lincoln - American luxury vehicle brand. Known for comfort, technology, and American luxury. Part of Ford Motor Company. Founded in 1917.', 'United States', 1917, true, 23)
  ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    country = EXCLUDED.country,
    founded_year = EXCLUDED.founded_year,
    is_featured = EXCLUDED.is_featured,
    display_order = EXCLUDED.display_order;
  
  SELECT id INTO lincoln_id FROM car_brands WHERE slug = 'lincoln';

  -- Lincoln Navigator
  INSERT INTO car_models (id, brand_id, name, slug, year_start, year_end, description, is_featured, display_order) VALUES
    (gen_random_uuid(), lincoln_id, 'Navigator', 'navigator', 1997, NULL, 'The Lincoln Navigator is a full-size luxury SUV. Known for luxury, spacious interior, and powerful engines. Competes with Cadillac Escalade.', true, 1)
  ON CONFLICT (brand_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    is_featured = EXCLUDED.is_featured,
    display_order = EXCLUDED.display_order;

  INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
  SELECT gen_random_uuid(), (SELECT id FROM car_models WHERE brand_id = lincoln_id AND slug = 'navigator'), 'U554 (2018-Present)', 'u554-2018-present', 2018, NULL, 'U554', 'Fourth generation Navigator with updated design, advanced technology, and 3.5L twin-turbo V6 engine. Available in standard and L (long wheelbase) variants.', true, 1
  WHERE EXISTS (SELECT 1 FROM car_models WHERE brand_id = lincoln_id AND slug = 'navigator')
  ON CONFLICT (car_model_id, slug) DO NOTHING;

  -- ============================================
  -- ACURA - Japanese Luxury Brand
  -- ============================================
  INSERT INTO car_brands (id, name, slug, description, country, founded_year, is_featured, display_order) VALUES
    (gen_random_uuid(), 'Acura', 'acura', 'Acura - Japanese luxury vehicle division of Honda. Known for performance, reliability, and technology. Founded in 1986.', 'Japan', 1986, true, 24)
  ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    country = EXCLUDED.country,
    founded_year = EXCLUDED.founded_year,
    is_featured = EXCLUDED.is_featured,
    display_order = EXCLUDED.display_order;
  
  SELECT id INTO acura_id FROM car_brands WHERE slug = 'acura';

  -- Acura MDX
  INSERT INTO car_models (id, brand_id, name, slug, year_start, year_end, description, is_featured, display_order) VALUES
    (gen_random_uuid(), acura_id, 'MDX', 'mdx', 2000, NULL, 'The Acura MDX is a mid-size luxury crossover SUV. Known for reliability, technology, and three-row seating. Acura best-selling model.', true, 1)
  ON CONFLICT (brand_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    is_featured = EXCLUDED.is_featured,
    display_order = EXCLUDED.display_order;

  INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
  SELECT gen_random_uuid(), (SELECT id FROM car_models WHERE brand_id = acura_id AND slug = 'mdx'), 'YF3 (2022-Present)', 'yf3-2022-present', 2022, NULL, 'YF3', 'Fourth generation MDX with new platform, updated design, and advanced technology. Available with 3.5L V6 and hybrid powertrains.', true, 1
  WHERE EXISTS (SELECT 1 FROM car_models WHERE brand_id = acura_id AND slug = 'mdx')
  ON CONFLICT (car_model_id, slug) DO NOTHING;

  -- ============================================
  -- MINI - British Compact Brand
  -- ============================================
  INSERT INTO car_brands (id, name, slug, description, country, founded_year, is_featured, display_order) VALUES
    (gen_random_uuid(), 'Mini', 'mini', 'Mini - British compact car brand. Known for distinctive design, fun driving, and customization options. Owned by BMW. Founded in 1959.', 'United Kingdom', 1959, true, 25)
  ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    country = EXCLUDED.country,
    founded_year = EXCLUDED.founded_year,
    is_featured = EXCLUDED.is_featured,
    display_order = EXCLUDED.display_order;
  
  SELECT id INTO mini_id FROM car_brands WHERE slug = 'mini';

  -- Mini Cooper
  INSERT INTO car_models (id, brand_id, name, slug, year_start, year_end, description, is_featured, display_order) VALUES
    (gen_random_uuid(), mini_id, 'Cooper', 'cooper', 2001, NULL, 'The Mini Cooper is a compact car. Known for distinctive design, fun driving dynamics, and customization options. Available in hatchback, convertible, and Clubman variants.', true, 1)
  ON CONFLICT (brand_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    is_featured = EXCLUDED.is_featured,
    display_order = EXCLUDED.display_order;

  INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
  SELECT gen_random_uuid(), (SELECT id FROM car_models WHERE brand_id = mini_id AND slug = 'cooper'), 'F56 (2014-Present)', 'f56-2014-present', 2014, NULL, 'F56', 'Third generation Cooper with updated design, improved efficiency, and advanced technology. Available with 1.5L turbo and 2.0L turbo engines.', true, 1
  WHERE EXISTS (SELECT 1 FROM car_models WHERE brand_id = mini_id AND slug = 'cooper')
  ON CONFLICT (car_model_id, slug) DO NOTHING;

  -- ============================================
  -- ALFA ROMEO - Italian Luxury Brand
  -- ============================================
  INSERT INTO car_brands (id, name, slug, description, country, founded_year, is_featured, display_order) VALUES
    (gen_random_uuid(), 'Alfa Romeo', 'alfa-romeo', 'Alfa Romeo - Italian luxury sports car manufacturer. Known for performance, distinctive design, and Italian heritage. Part of Stellantis. Founded in 1910.', 'Italy', 1910, true, 26)
  ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    country = EXCLUDED.country,
    founded_year = EXCLUDED.founded_year,
    is_featured = EXCLUDED.is_featured,
    display_order = EXCLUDED.display_order;
  
  SELECT id INTO alfa_romeo_id FROM car_brands WHERE slug = 'alfa-romeo';

  -- Alfa Romeo Giulia
  INSERT INTO car_models (id, brand_id, name, slug, year_start, year_end, description, is_featured, display_order) VALUES
    (gen_random_uuid(), alfa_romeo_id, 'Giulia', 'giulia', 2016, NULL, 'The Alfa Romeo Giulia is a compact luxury sports sedan. Known for performance, Italian design, and available Quadrifoglio high-performance variant.', true, 1)
  ON CONFLICT (brand_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    is_featured = EXCLUDED.is_featured,
    display_order = EXCLUDED.display_order;

  INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
  SELECT gen_random_uuid(), (SELECT id FROM car_models WHERE brand_id = alfa_romeo_id AND slug = 'giulia'), '952 (2016-Present)', '952-2016-present', 2016, NULL, '952', 'First generation Giulia with 2.0L turbo and 2.9L twin-turbo V6 (Quadrifoglio) engines. Available with rear-wheel or all-wheel drive.', true, 1
  WHERE EXISTS (SELECT 1 FROM car_models WHERE brand_id = alfa_romeo_id AND slug = 'giulia')
  ON CONFLICT (car_model_id, slug) DO NOTHING;

  -- ============================================
  -- SKODA - Czech Brand
  -- ============================================
  INSERT INTO car_brands (id, name, slug, description, country, founded_year, is_featured, display_order) VALUES
    (gen_random_uuid(), 'Skoda', 'skoda', 'Skoda Auto - Czech automotive manufacturer. Known for value, practicality, and reliability. Part of Volkswagen Group. Founded in 1895.', 'Czech Republic', 1895, true, 27)
  ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    country = EXCLUDED.country,
    founded_year = EXCLUDED.founded_year,
    is_featured = EXCLUDED.is_featured,
    display_order = EXCLUDED.display_order;
  
  SELECT id INTO skoda_id FROM car_brands WHERE slug = 'skoda';

  -- Skoda Octavia
  INSERT INTO car_models (id, brand_id, name, slug, year_start, year_end, description, is_featured, display_order) VALUES
    (gen_random_uuid(), skoda_id, 'Octavia', 'octavia', 1996, NULL, 'The Skoda Octavia is a compact car. Known for value, practicality, and spacious interior. Available in sedan and wagon body styles.', true, 1)
  ON CONFLICT (brand_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    is_featured = EXCLUDED.is_featured,
    display_order = EXCLUDED.display_order;

  INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
  SELECT gen_random_uuid(), (SELECT id FROM car_models WHERE brand_id = skoda_id AND slug = 'octavia'), 'NFL (2020-Present)', 'nfl-2020-present', 2020, NULL, 'NFL', 'Fourth generation Octavia with updated design, advanced technology, and improved efficiency. Available with gasoline, diesel, and plug-in hybrid powertrains.', true, 1
  WHERE EXISTS (SELECT 1 FROM car_models WHERE brand_id = skoda_id AND slug = 'octavia')
  ON CONFLICT (car_model_id, slug) DO NOTHING;

  -- ============================================
  -- OPEL - German Brand
  -- ============================================
  INSERT INTO car_brands (id, name, slug, description, country, founded_year, is_featured, display_order) VALUES
    (gen_random_uuid(), 'Opel', 'opel', 'Opel - German automotive manufacturer. Known for value, practicality, and European design. Part of Stellantis. Founded in 1862.', 'Germany', 1862, true, 28)
  ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    country = EXCLUDED.country,
    founded_year = EXCLUDED.founded_year,
    is_featured = EXCLUDED.is_featured,
    display_order = EXCLUDED.display_order;
  
  SELECT id INTO opel_id FROM car_brands WHERE slug = 'opel';

  -- Opel Astra
  INSERT INTO car_models (id, brand_id, name, slug, year_start, year_end, description, is_featured, display_order) VALUES
    (gen_random_uuid(), opel_id, 'Astra', 'astra', 1991, NULL, 'The Opel Astra is a compact car. Known for value, practicality, and European design. Available in hatchback, sedan, and wagon body styles.', true, 1)
  ON CONFLICT (brand_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    is_featured = EXCLUDED.is_featured,
    display_order = EXCLUDED.display_order;

  INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
  SELECT gen_random_uuid(), (SELECT id FROM car_models WHERE brand_id = opel_id AND slug = 'astra'), 'L (2015-2021)', 'l-2015-2021', 2015, 2021, 'L', 'Sixth generation Astra with updated design, improved efficiency, and advanced technology. Available with gasoline and diesel engines.', true, 1
  WHERE EXISTS (SELECT 1 FROM car_models WHERE brand_id = opel_id AND slug = 'astra')
  ON CONFLICT (car_model_id, slug) DO NOTHING;

  -- ============================================
  -- PEUGEOT - French Brand
  -- ============================================
  INSERT INTO car_brands (id, name, slug, description, country, founded_year, is_featured, display_order) VALUES
    (gen_random_uuid(), 'Peugeot', 'peugeot', 'Peugeot - French automotive manufacturer. Known for design, efficiency, and innovation. Part of Stellantis. Founded in 1810.', 'France', 1810, true, 29)
  ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    country = EXCLUDED.country,
    founded_year = EXCLUDED.founded_year,
    is_featured = EXCLUDED.is_featured,
    display_order = EXCLUDED.display_order;
  
  SELECT id INTO peugeot_id FROM car_brands WHERE slug = 'peugeot';

  -- Peugeot 308
  INSERT INTO car_models (id, brand_id, name, slug, year_start, year_end, description, is_featured, display_order) VALUES
    (gen_random_uuid(), peugeot_id, '308', '308', 2007, NULL, 'The Peugeot 308 is a compact car. Known for design, efficiency, and practicality. Available in hatchback and wagon body styles.', true, 1)
  ON CONFLICT (brand_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    is_featured = EXCLUDED.is_featured,
    display_order = EXCLUDED.display_order;

  INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
  SELECT gen_random_uuid(), (SELECT id FROM car_models WHERE brand_id = peugeot_id AND slug = '308'), 'P5 (2021-Present)', 'p5-2021-present', 2021, NULL, 'P5', 'Third generation 308 with updated design, advanced technology, and improved efficiency. Available with gasoline, diesel, and plug-in hybrid powertrains.', true, 1
  WHERE EXISTS (SELECT 1 FROM car_models WHERE brand_id = peugeot_id AND slug = '308')
  ON CONFLICT (car_model_id, slug) DO NOTHING;

  -- ============================================
  -- RENAULT - French Brand
  -- ============================================
  INSERT INTO car_brands (id, name, slug, description, country, founded_year, is_featured, display_order) VALUES
    (gen_random_uuid(), 'Renault', 'renault', 'Renault - French automotive manufacturer. Known for innovation, efficiency, and electric vehicles. Part of Renault-Nissan-Mitsubishi Alliance. Founded in 1899.', 'France', 1899, true, 30)
  ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    country = EXCLUDED.country,
    founded_year = EXCLUDED.founded_year,
    is_featured = EXCLUDED.is_featured,
    display_order = EXCLUDED.display_order;
  
  SELECT id INTO renault_id FROM car_brands WHERE slug = 'renault';

  -- Renault Clio
  INSERT INTO car_models (id, brand_id, name, slug, year_start, year_end, description, is_featured, display_order) VALUES
    (gen_random_uuid(), renault_id, 'Clio', 'clio', 1990, NULL, 'The Renault Clio is a supermini car. Known for value, efficiency, and practicality. One of Europe most popular small cars.', true, 1)
  ON CONFLICT (brand_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    is_featured = EXCLUDED.is_featured,
    display_order = EXCLUDED.display_order;

  INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
  SELECT gen_random_uuid(), (SELECT id FROM car_models WHERE brand_id = renault_id AND slug = 'clio'), 'V (2019-Present)', 'v-2019-present', 2019, NULL, 'V', 'Fifth generation Clio with updated design, advanced technology, and improved efficiency. Available with gasoline, diesel, and hybrid powertrains.', true, 1
  WHERE EXISTS (SELECT 1 FROM car_models WHERE brand_id = renault_id AND slug = 'clio')
  ON CONFLICT (car_model_id, slug) DO NOTHING;

END $$;

-- Add more popular models to existing brands
DO $$
DECLARE
  toyota_id UUID;
  honda_id UUID;
  nissan_id UUID;
  hyundai_id UUID;
  kia_id UUID;
  volkswagen_id UUID;
  ford_id UUID;
  chevrolet_id UUID;
  volvo_id UUID;
BEGIN
  -- Get existing brand IDs
  SELECT id INTO toyota_id FROM car_brands WHERE slug = 'toyota';
  SELECT id INTO honda_id FROM car_brands WHERE slug = 'honda';
  SELECT id INTO nissan_id FROM car_brands WHERE slug = 'nissan';
  SELECT id INTO hyundai_id FROM car_brands WHERE slug = 'hyundai';
  SELECT id INTO kia_id FROM car_brands WHERE slug = 'kia';
  SELECT id INTO volkswagen_id FROM car_brands WHERE slug = 'volkswagen';
  SELECT id INTO ford_id FROM car_brands WHERE slug = 'ford';
  SELECT id INTO chevrolet_id FROM car_brands WHERE slug = 'chevrolet';
  SELECT id INTO volvo_id FROM car_brands WHERE slug = 'volvo';

  -- ============================================
  -- TOYOTA - Additional Models
  -- ============================================
  IF toyota_id IS NOT NULL THEN
    -- Toyota Highlander
    INSERT INTO car_models (id, brand_id, name, slug, year_start, year_end, description, is_featured, display_order) VALUES
      (gen_random_uuid(), toyota_id, 'Highlander', 'highlander', 2000, NULL, 'The Toyota Highlander is a mid-size crossover SUV. Known for reliability, three-row seating, and available hybrid powertrain.', true, 3)
    ON CONFLICT (brand_id, slug) DO UPDATE SET
      name = EXCLUDED.name,
      description = EXCLUDED.description,
      is_featured = EXCLUDED.is_featured,
      display_order = EXCLUDED.display_order;

    INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
    SELECT gen_random_uuid(), (SELECT id FROM car_models WHERE brand_id = toyota_id AND slug = 'highlander'), 'XU70 (2020-Present)', 'xu70-2020-present', 2020, NULL, 'XU70', 'Fourth generation Highlander with new platform, updated design, and available 3.5L V6 and 2.5L hybrid powertrains.', true, 1
    WHERE EXISTS (SELECT 1 FROM car_models WHERE brand_id = toyota_id AND slug = 'highlander')
    ON CONFLICT (car_model_id, slug) DO NOTHING;

    -- Toyota Tacoma
    INSERT INTO car_models (id, brand_id, name, slug, year_start, year_end, description, is_featured, display_order) VALUES
      (gen_random_uuid(), toyota_id, 'Tacoma', 'tacoma', 1995, NULL, 'The Toyota Tacoma is a mid-size pickup truck. Known for reliability, off-road capability, and resale value. Popular with off-road enthusiasts.', true, 4)
    ON CONFLICT (brand_id, slug) DO UPDATE SET
      name = EXCLUDED.name,
      description = EXCLUDED.description,
      is_featured = EXCLUDED.is_featured,
      display_order = EXCLUDED.display_order;

    INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
    SELECT gen_random_uuid(), (SELECT id FROM car_models WHERE brand_id = toyota_id AND slug = 'tacoma'), 'N300 (2016-Present)', 'n300-2016-present', 2016, NULL, 'N300', 'Third generation Tacoma with updated design, improved capability, and available 2.7L I4 and 3.5L V6 engines.', true, 1
    WHERE EXISTS (SELECT 1 FROM car_models WHERE brand_id = toyota_id AND slug = 'tacoma')
    ON CONFLICT (car_model_id, slug) DO NOTHING;
  END IF;

  -- ============================================
  -- HONDA - Additional Models
  -- ============================================
  IF honda_id IS NOT NULL THEN
    -- Honda Pilot
    INSERT INTO car_models (id, brand_id, name, slug, year_start, year_end, description, is_featured, display_order) VALUES
      (gen_random_uuid(), honda_id, 'Pilot', 'pilot', 2002, NULL, 'The Honda Pilot is a mid-size crossover SUV. Known for reliability, three-row seating, and available all-wheel drive.', true, 3)
    ON CONFLICT (brand_id, slug) DO UPDATE SET
      name = EXCLUDED.name,
      description = EXCLUDED.description,
      is_featured = EXCLUDED.is_featured,
      display_order = EXCLUDED.display_order;

    INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
    SELECT gen_random_uuid(), (SELECT id FROM car_models WHERE brand_id = honda_id AND slug = 'pilot'), 'YF3 (2016-2022)', 'yf3-2016-2022', 2016, 2022, 'YF3', 'Third generation Pilot with updated design, improved technology, and 3.5L V6 engine. Available with front-wheel or all-wheel drive.', true, 1
    WHERE EXISTS (SELECT 1 FROM car_models WHERE brand_id = honda_id AND slug = 'pilot')
    ON CONFLICT (car_model_id, slug) DO NOTHING;

    INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
    SELECT gen_random_uuid(), (SELECT id FROM car_models WHERE brand_id = honda_id AND slug = 'pilot'), 'YF4 (2023-Present)', 'yf4-2023-present', 2023, NULL, 'YF4', 'Fourth generation Pilot with new platform, updated design, and improved technology. Available with 3.5L V6 engine.', true, 2
    WHERE EXISTS (SELECT 1 FROM car_models WHERE brand_id = honda_id AND slug = 'pilot')
    ON CONFLICT (car_model_id, slug) DO NOTHING;
  END IF;

  -- ============================================
  -- NISSAN - Additional Models
  -- ============================================
  IF nissan_id IS NOT NULL THEN
    -- Nissan Altima
    INSERT INTO car_models (id, brand_id, name, slug, year_start, year_end, description, is_featured, display_order) VALUES
      (gen_random_uuid(), nissan_id, 'Altima', 'altima', 1992, NULL, 'The Nissan Altima is a mid-size sedan. Known for value, reliability, and available all-wheel drive.', true, 2)
    ON CONFLICT (brand_id, slug) DO UPDATE SET
      name = EXCLUDED.name,
      description = EXCLUDED.description,
      is_featured = EXCLUDED.is_featured,
      display_order = EXCLUDED.display_order;

    INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
    SELECT gen_random_uuid(), (SELECT id FROM car_models WHERE brand_id = nissan_id AND slug = 'altima'), 'L34 (2019-Present)', 'l34-2019-present', 2019, NULL, 'L34', 'Sixth generation Altima with updated design, available 2.5L I4 and 2.0L turbo engines, and available all-wheel drive.', true, 1
    WHERE EXISTS (SELECT 1 FROM car_models WHERE brand_id = nissan_id AND slug = 'altima')
    ON CONFLICT (car_model_id, slug) DO NOTHING;

    -- Nissan Pathfinder
    INSERT INTO car_models (id, brand_id, name, slug, year_start, year_end, description, is_featured, display_order) VALUES
      (gen_random_uuid(), nissan_id, 'Pathfinder', 'pathfinder', 1986, NULL, 'The Nissan Pathfinder is a mid-size SUV. Known for capability, three-row seating, and available all-wheel drive.', true, 3)
    ON CONFLICT (brand_id, slug) DO UPDATE SET
      name = EXCLUDED.name,
      description = EXCLUDED.description,
      is_featured = EXCLUDED.is_featured,
      display_order = EXCLUDED.display_order;

    INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
    SELECT gen_random_uuid(), (SELECT id FROM car_models WHERE brand_id = nissan_id AND slug = 'pathfinder'), 'R52 (2022-Present)', 'r52-2022-present', 2022, NULL, 'R52', 'Fifth generation Pathfinder with new platform, updated design, and 3.5L V6 engine. Available with front-wheel or all-wheel drive.', true, 1
    WHERE EXISTS (SELECT 1 FROM car_models WHERE brand_id = nissan_id AND slug = 'pathfinder')
    ON CONFLICT (car_model_id, slug) DO NOTHING;
  END IF;

  -- ============================================
  -- HYUNDAI - Additional Models
  -- ============================================
  IF hyundai_id IS NOT NULL THEN
    -- Hyundai Elantra
    INSERT INTO car_models (id, brand_id, name, slug, year_start, year_end, description, is_featured, display_order) VALUES
      (gen_random_uuid(), hyundai_id, 'Elantra', 'elantra', 1990, NULL, 'The Hyundai Elantra is a compact sedan. Known for value, reliability, and available technology. Available in sedan and hatchback body styles.', true, 2)
    ON CONFLICT (brand_id, slug) DO UPDATE SET
      name = EXCLUDED.name,
      description = EXCLUDED.description,
      is_featured = EXCLUDED.is_featured,
      display_order = EXCLUDED.display_order;

    INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
    SELECT gen_random_uuid(), (SELECT id FROM car_models WHERE brand_id = hyundai_id AND slug = 'elantra'), 'CN7 (2021-Present)', 'cn7-2021-present', 2021, NULL, 'CN7', 'Seventh generation Elantra with updated design, advanced technology, and available 2.0L I4, 1.6L turbo, and hybrid powertrains.', true, 1
    WHERE EXISTS (SELECT 1 FROM car_models WHERE brand_id = hyundai_id AND slug = 'elantra')
    ON CONFLICT (car_model_id, slug) DO NOTHING;

    -- Hyundai Tucson
    INSERT INTO car_models (id, brand_id, name, slug, year_start, year_end, description, is_featured, display_order) VALUES
      (gen_random_uuid(), hyundai_id, 'Tucson', 'tucson', 2004, NULL, 'The Hyundai Tucson is a compact crossover SUV. Known for value, technology, and available all-wheel drive.', true, 3)
    ON CONFLICT (brand_id, slug) DO UPDATE SET
      name = EXCLUDED.name,
      description = EXCLUDED.description,
      is_featured = EXCLUDED.is_featured,
      display_order = EXCLUDED.display_order;

    INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
    SELECT gen_random_uuid(), (SELECT id FROM car_models WHERE brand_id = hyundai_id AND slug = 'tucson'), 'NX4 (2021-Present)', 'nx4-2021-present', 2021, NULL, 'NX4', 'Fourth generation Tucson with updated design, advanced technology, and available 2.5L I4, 1.6L turbo, and hybrid powertrains.', true, 1
    WHERE EXISTS (SELECT 1 FROM car_models WHERE brand_id = hyundai_id AND slug = 'tucson')
    ON CONFLICT (car_model_id, slug) DO NOTHING;
  END IF;

  -- ============================================
  -- KIA - Additional Models
  -- ============================================
  IF kia_id IS NOT NULL THEN
    -- Kia Optima/K5
    INSERT INTO car_models (id, brand_id, name, slug, year_start, year_end, description, is_featured, display_order) VALUES
      (gen_random_uuid(), kia_id, 'K5', 'k5', 2000, NULL, 'The Kia K5 (formerly Optima) is a mid-size sedan. Known for value, design, and available technology. Renamed to K5 in 2021.', true, 2)
    ON CONFLICT (brand_id, slug) DO UPDATE SET
      name = EXCLUDED.name,
      description = EXCLUDED.description,
      is_featured = EXCLUDED.is_featured,
      display_order = EXCLUDED.display_order;

    INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
    SELECT gen_random_uuid(), (SELECT id FROM car_models WHERE brand_id = kia_id AND slug = 'k5'), 'DL3 (2021-Present)', 'dl3-2021-present', 2021, NULL, 'DL3', 'Fifth generation K5 with updated design, advanced technology, and available 2.5L I4, 1.6L turbo, and 2.5L turbo engines.', true, 1
    WHERE EXISTS (SELECT 1 FROM car_models WHERE brand_id = kia_id AND slug = 'k5')
    ON CONFLICT (car_model_id, slug) DO NOTHING;
  END IF;

  -- ============================================
  -- VOLKSWAGEN - Additional Models
  -- ============================================
  IF volkswagen_id IS NOT NULL THEN
    -- Volkswagen Passat
    INSERT INTO car_models (id, brand_id, name, slug, year_start, year_end, description, is_featured, display_order) VALUES
      (gen_random_uuid(), volkswagen_id, 'Passat', 'passat', 1973, NULL, 'The Volkswagen Passat is a mid-size sedan. Known for value, reliability, and European design. Available in sedan and wagon body styles.', true, 2)
    ON CONFLICT (brand_id, slug) DO UPDATE SET
      name = EXCLUDED.name,
      description = EXCLUDED.description,
      is_featured = EXCLUDED.is_featured,
      display_order = EXCLUDED.display_order;

    INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
    SELECT gen_random_uuid(), (SELECT id FROM car_models WHERE brand_id = volkswagen_id AND slug = 'passat'), 'B8 (2015-2022)', 'b8-2015-2022', 2015, 2022, 'B8', 'Eighth generation Passat with updated design, improved efficiency, and available 1.8L turbo, 2.0L turbo, and 3.6L V6 engines.', true, 1
    WHERE EXISTS (SELECT 1 FROM car_models WHERE brand_id = volkswagen_id AND slug = 'passat')
    ON CONFLICT (car_model_id, slug) DO NOTHING;
  END IF;

  -- ============================================
  -- FORD - Additional Models
  -- ============================================
  IF ford_id IS NOT NULL THEN
    -- Ford Mustang
    INSERT INTO car_models (id, brand_id, name, slug, year_start, year_end, description, is_featured, display_order) VALUES
      (gen_random_uuid(), ford_id, 'Mustang', 'mustang', 1964, NULL, 'The Ford Mustang is an iconic American sports car. Known for performance, V8 engines, and legendary status. Available in coupe and convertible.', true, 2)
    ON CONFLICT (brand_id, slug) DO UPDATE SET
      name = EXCLUDED.name,
      description = EXCLUDED.description,
      is_featured = EXCLUDED.is_featured,
      display_order = EXCLUDED.display_order;

    INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
    SELECT gen_random_uuid(), (SELECT id FROM car_models WHERE brand_id = ford_id AND slug = 'mustang'), 'S550 (2015-2023)', 's550-2015-2023', 2015, 2023, 'S550', 'Sixth generation Mustang with updated design, available 2.3L turbo I4, 5.0L V8, and high-performance Shelby variants.', true, 1
    WHERE EXISTS (SELECT 1 FROM car_models WHERE brand_id = ford_id AND slug = 'mustang')
    ON CONFLICT (car_model_id, slug) DO NOTHING;

    INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
    SELECT gen_random_uuid(), (SELECT id FROM car_models WHERE brand_id = ford_id AND slug = 'mustang'), 'S650 (2024-Present)', 's650-2024-present', 2024, NULL, 'S650', 'Seventh generation Mustang with updated design, advanced technology, and available 2.3L turbo I4 and 5.0L V8 engines.', true, 2
    WHERE EXISTS (SELECT 1 FROM car_models WHERE brand_id = ford_id AND slug = 'mustang')
    ON CONFLICT (car_model_id, slug) DO NOTHING;
  END IF;

  -- ============================================
  -- CHEVROLET - Additional Models
  -- ============================================
  IF chevrolet_id IS NOT NULL THEN
    -- Chevrolet Silverado
    INSERT INTO car_models (id, brand_id, name, slug, year_start, year_end, description, is_featured, display_order) VALUES
      (gen_random_uuid(), chevrolet_id, 'Silverado', 'silverado', 1999, NULL, 'The Chevrolet Silverado is a full-size pickup truck. Known for towing capability, durability, and available powerful engines.', true, 2)
    ON CONFLICT (brand_id, slug) DO UPDATE SET
      name = EXCLUDED.name,
      description = EXCLUDED.description,
      is_featured = EXCLUDED.is_featured,
      display_order = EXCLUDED.display_order;

    INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
    SELECT gen_random_uuid(), (SELECT id FROM car_models WHERE brand_id = chevrolet_id AND slug = 'silverado'), 'T1XX (2019-Present)', 't1xx-2019-present', 2019, NULL, 'T1XX', 'Fourth generation Silverado with updated design, advanced technology, and available 2.7L turbo, 5.3L V8, 6.2L V8, and 3.0L diesel engines.', true, 1
    WHERE EXISTS (SELECT 1 FROM car_models WHERE brand_id = chevrolet_id AND slug = 'silverado')
    ON CONFLICT (car_model_id, slug) DO NOTHING;
  END IF;

  -- ============================================
  -- VOLVO - Additional Models
  -- ============================================
  IF volvo_id IS NOT NULL THEN
    -- Volvo XC60
    INSERT INTO car_models (id, brand_id, name, slug, year_start, year_end, description, is_featured, display_order) VALUES
      (gen_random_uuid(), volvo_id, 'XC60', 'xc60', 2008, NULL, 'The Volvo XC60 is a compact luxury crossover SUV. Known for safety, Scandinavian design, and available plug-in hybrid powertrains.', true, 2)
    ON CONFLICT (brand_id, slug) DO UPDATE SET
      name = EXCLUDED.name,
      description = EXCLUDED.description,
      is_featured = EXCLUDED.is_featured,
      display_order = EXCLUDED.display_order;

    INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
    SELECT gen_random_uuid(), (SELECT id FROM car_models WHERE brand_id = volvo_id AND slug = 'xc60'), '536 (2017-Present)', '536-2017-present', 2017, NULL, '536', 'Second generation XC60 with updated design, advanced safety features, and available 2.0L turbo, 2.0L supercharged/turbo, and plug-in hybrid powertrains.', true, 1
    WHERE EXISTS (SELECT 1 FROM car_models WHERE brand_id = volvo_id AND slug = 'xc60')
    ON CONFLICT (car_model_id, slug) DO NOTHING;
  END IF;

END $$;

