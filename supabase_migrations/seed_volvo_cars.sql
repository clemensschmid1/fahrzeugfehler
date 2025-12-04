-- Seed data for Volvo - Swedish brand known for safety
-- Models: XC60, XC90

DO $$
DECLARE
  volvo_id UUID;
  xc60_id UUID;
  xc90_id UUID;
BEGIN
  -- Insert Volvo Brand
  INSERT INTO car_brands (id, name, slug, description, country, founded_year, is_featured, display_order) VALUES
    ('ff0e8400-e29b-41d4-a716-446655440001', 'Volvo', 'volvo', 'Volvo Cars - Swedish luxury automotive manufacturer known for safety innovation, Scandinavian design, and advanced technology. Founded in 1927.', 'Sweden', 1927, true, 13)
  ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    country = EXCLUDED.country,
    founded_year = EXCLUDED.founded_year,
    is_featured = EXCLUDED.is_featured,
    display_order = EXCLUDED.display_order;

  SELECT id INTO volvo_id FROM car_brands WHERE slug = 'volvo';

  -- Insert Volvo XC60
  INSERT INTO car_models (id, brand_id, name, slug, year_start, year_end, description, production_numbers, is_featured, display_order) VALUES
    ('110e8400-e29b-41d4-a716-446655440001', volvo_id, 'XC60', 'xc60', 2008, NULL, 'The Volvo XC60 is a compact luxury crossover SUV known for safety, Scandinavian design, and advanced technology. Volvo''s best-selling model.', 'Over 1.5 million units', true, 1)
  ON CONFLICT (brand_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    production_numbers = EXCLUDED.production_numbers,
    is_featured = EXCLUDED.is_featured,
    display_order = EXCLUDED.display_order;

  SELECT id INTO xc60_id FROM car_models WHERE brand_id = volvo_id AND slug = 'xc60';

  -- Insert Volvo XC90
  INSERT INTO car_models (id, brand_id, name, slug, year_start, year_end, description, production_numbers, is_featured, display_order) VALUES
    ('110e8400-e29b-41d4-a716-446655440002', volvo_id, 'XC90', 'xc90', 2002, NULL, 'The Volvo XC90 is a mid-size luxury SUV known for safety, three-row seating, and advanced technology. Flagship Volvo SUV.', 'Over 1 million units', true, 2)
  ON CONFLICT (brand_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    production_numbers = EXCLUDED.production_numbers,
    is_featured = EXCLUDED.is_featured,
    display_order = EXCLUDED.display_order;

  SELECT id INTO xc90_id FROM car_models WHERE brand_id = volvo_id AND slug = 'xc90';

  -- Volvo XC60 Generations
  INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
  SELECT gen_random_uuid(), xc60_id, 'First Generation (2008-2017)', '1st-gen-2008-2017', 2008, 2017, 'Y20', 'First generation XC60 with City Safety, all-wheel drive, and premium features. Available with multiple engine options.', true, 1
  WHERE EXISTS (SELECT 1 FROM car_models WHERE id = xc60_id)
  ON CONFLICT (car_model_id, slug) DO NOTHING;

  INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
  SELECT gen_random_uuid(), xc60_id, 'Second Generation (2018-2024)', '2nd-gen-2018-2024', 2018, 2024, 'SPA', 'Second generation XC60 with SPA platform, Sensus infotainment, and advanced safety. Available with T5, T6, and T8 plug-in hybrid.', true, 2
  WHERE EXISTS (SELECT 1 FROM car_models WHERE id = xc60_id)
  ON CONFLICT (car_model_id, slug) DO NOTHING;

  -- Volvo XC90 Generations
  INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
  SELECT gen_random_uuid(), xc90_id, 'First Generation (2002-2014)', '1st-gen-2002-2014', 2002, 2014, 'P2', 'First generation XC90 with three-row seating, all-wheel drive, and safety features. Available with V8 and inline-6 engines.', true, 1
  WHERE EXISTS (SELECT 1 FROM car_models WHERE id = xc90_id)
  ON CONFLICT (car_model_id, slug) DO NOTHING;

  INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
  SELECT gen_random_uuid(), xc90_id, 'Second Generation (2015-2024)', '2nd-gen-2015-2024', 2015, 2024, 'SPA', 'Second generation XC90 with SPA platform, Sensus infotainment, and T8 plug-in hybrid. Available with T5, T6, and T8 powertrains.', true, 2
  WHERE EXISTS (SELECT 1 FROM car_models WHERE id = xc90_id)
  ON CONFLICT (car_model_id, slug) DO NOTHING;

END $$;

