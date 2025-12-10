-- Add popular new generations that don't have faults yet
-- These are the most popular car generations that are missing from the database
-- Focus on recent generations (2015+) and very popular models

DO $$
DECLARE
  -- Brand IDs
  bmw_id UUID;
  mercedes_id UUID;
  audi_id UUID;
  volkswagen_id UUID;
  toyota_id UUID;
  honda_id UUID;
  nissan_id UUID;
  ford_id UUID;
  chevrolet_id UUID;
  hyundai_id UUID;
  kia_id UUID;
  volvo_id UUID;
  tesla_id UUID;
  mazda_id UUID;
  subaru_id UUID;
  jeep_id UUID;
  ram_id UUID;
  gmc_id UUID;
  lexus_id UUID;
  acura_id UUID;
  infiniti_id UUID;
  land_rover_id UUID;
  genesis_id UUID;
  polestar_id UUID;
  
  -- Model IDs
  bmw_3_series_id UUID;
  bmw_5_series_id UUID;
  bmw_x3_id UUID;
  bmw_x5_id UUID;
  mercedes_c_class_id UUID;
  mercedes_e_class_id UUID;
  mercedes_g_class_id UUID;
  mercedes_glc_id UUID;
  audi_a4_id UUID;
  audi_a6_id UUID;
  audi_q5_id UUID;
  vw_golf_id UUID;
  vw_passat_id UUID;
  toyota_camry_id UUID;
  toyota_rav4_id UUID;
  honda_civic_id UUID;
  honda_crv_id UUID;
  nissan_altima_id UUID;
  nissan_rogue_id UUID;
  ford_f150_id UUID;
  ford_explorer_id UUID;
  chevrolet_silverado_id UUID;
  chevrolet_equinox_id UUID;
  hyundai_elantra_id UUID;
  hyundai_tucson_id UUID;
  kia_sportage_id UUID;
  kia_sorento_id UUID;
  volvo_xc60_id UUID;
  mazda_cx5_id UUID;
  mazda_cx9_id UUID;
  subaru_outback_id UUID;
  subaru_forester_id UUID;
  jeep_wrangler_id UUID;
  jeep_grand_cherokee_id UUID;
  ram_1500_id UUID;
  gmc_sierra_id UUID;
  lexus_rx_id UUID;
  lexus_es_id UUID;
  acura_mdx_id UUID;
  acura_rdx_id UUID;
  infiniti_q50_id UUID;
  infiniti_qx60_id UUID;
  land_rover_range_rover_id UUID;
  land_rover_discovery_id UUID;
  genesis_g70_id UUID;
  genesis_gv70_id UUID;
  polestar_2_id UUID;
  volvo_xc90_id UUID;
  tesla_model_3_id UUID;
  tesla_model_y_id UUID;
  bmw_x1_id UUID;
  bmw_x7_id UUID;
  bmw_7_series_id UUID;
  mercedes_s_class_id UUID;
  mercedes_gle_id UUID;
  mercedes_gls_id UUID;
  mercedes_a_class_id UUID;
  audi_a3_id UUID;
  audi_q3_id UUID;
  audi_q7_id UUID;
  audi_e_tron_id UUID;
  vw_tiguan_id UUID;
  vw_atlas_id UUID;
  vw_id4_id UUID;
  toyota_corolla_id UUID;
  toyota_highlander_id UUID;
  toyota_prius_id UUID;
  honda_accord_id UUID;
  honda_odyssey_id UUID;
  nissan_sentra_id UUID;
  nissan_maxima_id UUID;
  ford_escape_id UUID;
  ford_edge_id UUID;
  ford_bronco_id UUID;
  chevrolet_tahoe_id UUID;
  chevrolet_suburban_id UUID;
  chevrolet_traverse_id UUID;
  hyundai_sonata_id UUID;
  hyundai_santa_fe_id UUID;
  hyundai_palisade_id UUID;
  kia_telluride_id UUID;
  kia_ev6_id UUID;
  volvo_xc40_id UUID;
  tesla_model_s_id UUID;
  tesla_model_x_id UUID;
  mazda_3_id UUID;
  mazda_cx30_id UUID;
  subaru_ascent_id UUID;
  subaru_crosstrek_id UUID;
  jeep_cherokee_id UUID;
  jeep_compass_id UUID;
  porsche_id UUID;
  porsche_cayenne_id UUID;
  porsche_macan_id UUID;
  porsche_911_id UUID;
  dodge_id UUID;
  dodge_charger_id UUID;
  dodge_challenger_id UUID;
  cadillac_id UUID;
  cadillac_escalade_id UUID;
  cadillac_xt5_id UUID;
  lincoln_id UUID;
  lincoln_navigator_id UUID;
  lincoln_aviator_id UUID;
BEGIN
  -- Get existing brand IDs
  SELECT id INTO bmw_id FROM car_brands WHERE slug = 'bmw';
  SELECT id INTO mercedes_id FROM car_brands WHERE slug = 'mercedes-benz';
  SELECT id INTO audi_id FROM car_brands WHERE slug = 'audi';
  SELECT id INTO volkswagen_id FROM car_brands WHERE slug = 'volkswagen';
  SELECT id INTO toyota_id FROM car_brands WHERE slug = 'toyota';
  SELECT id INTO honda_id FROM car_brands WHERE slug = 'honda';
  SELECT id INTO nissan_id FROM car_brands WHERE slug = 'nissan';
  SELECT id INTO ford_id FROM car_brands WHERE slug = 'ford';
  SELECT id INTO chevrolet_id FROM car_brands WHERE slug = 'chevrolet';
  SELECT id INTO hyundai_id FROM car_brands WHERE slug = 'hyundai';
  SELECT id INTO kia_id FROM car_brands WHERE slug = 'kia';
  SELECT id INTO volvo_id FROM car_brands WHERE slug = 'volvo';
  SELECT id INTO tesla_id FROM car_brands WHERE slug = 'tesla';
  SELECT id INTO mazda_id FROM car_brands WHERE slug = 'mazda';
  SELECT id INTO subaru_id FROM car_brands WHERE slug = 'subaru';
  SELECT id INTO jeep_id FROM car_brands WHERE slug = 'jeep';
  SELECT id INTO ram_id FROM car_brands WHERE slug = 'ram';
  SELECT id INTO gmc_id FROM car_brands WHERE slug = 'gmc';
  SELECT id INTO lexus_id FROM car_brands WHERE slug = 'lexus';
  SELECT id INTO acura_id FROM car_brands WHERE slug = 'acura';
  SELECT id INTO infiniti_id FROM car_brands WHERE slug = 'infiniti';
  SELECT id INTO land_rover_id FROM car_brands WHERE slug = 'land-rover';
  SELECT id INTO genesis_id FROM car_brands WHERE slug = 'genesis';
  SELECT id INTO polestar_id FROM car_brands WHERE slug = 'polestar';
  SELECT id INTO porsche_id FROM car_brands WHERE slug = 'porsche';
  SELECT id INTO dodge_id FROM car_brands WHERE slug = 'dodge';
  SELECT id INTO cadillac_id FROM car_brands WHERE slug = 'cadillac';
  SELECT id INTO lincoln_id FROM car_brands WHERE slug = 'lincoln';

  -- ============================================
  -- BMW - New Generations
  -- ============================================
  IF bmw_id IS NOT NULL THEN
    -- Get BMW 3 Series model
    SELECT id INTO bmw_3_series_id FROM car_models WHERE brand_id = bmw_id AND slug = '3-series' LIMIT 1;
    
    IF bmw_3_series_id IS NOT NULL THEN
      -- G20/G21 (2019-2024) - Current generation
      INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
      SELECT gen_random_uuid(), bmw_3_series_id, 'G20/G21 (2019-2024)', 'g20-2019-2024', 2019, 2024, 'G20', 'Seventh generation 3 Series with new platform, updated design, and advanced technology. Available with 2.0L turbo I4, 3.0L turbo I6, and plug-in hybrid powertrains.', true, 4
      WHERE NOT EXISTS (SELECT 1 FROM model_generations WHERE car_model_id = bmw_3_series_id AND slug = 'g20-2019-2024')
      ON CONFLICT (car_model_id, slug) DO NOTHING;

      -- G20/G21 LCI (2024-Present) - Latest facelift
      INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
      SELECT gen_random_uuid(), bmw_3_series_id, 'G20/G21 LCI (2024-Present)', 'g20-lci-2024-present', 2024, NULL, 'G20 LCI', 'Seventh generation 3 Series facelift with updated design, new iDrive 8, and improved technology.', true, 5
      WHERE NOT EXISTS (SELECT 1 FROM model_generations WHERE car_model_id = bmw_3_series_id AND slug = 'g20-lci-2024-present')
      ON CONFLICT (car_model_id, slug) DO NOTHING;
    END IF;

    -- Get BMW 5 Series model
    SELECT id INTO bmw_5_series_id FROM car_models WHERE brand_id = bmw_id AND slug = '5-series' LIMIT 1;
    
    IF bmw_5_series_id IS NOT NULL THEN
      -- G30/G31 (2017-2023) - Current generation
      INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
      SELECT gen_random_uuid(), bmw_5_series_id, 'G30/G31 (2017-2023)', 'g30-2017-2023', 2017, 2023, 'G30', 'Seventh generation 5 Series with new platform, updated design, and advanced technology. Available with 2.0L turbo I4, 3.0L turbo I6, V8, and plug-in hybrid powertrains.', true, 4
      WHERE NOT EXISTS (SELECT 1 FROM model_generations WHERE car_model_id = bmw_5_series_id AND slug = 'g30-2017-2023')
      ON CONFLICT (car_model_id, slug) DO NOTHING;

      -- G60/G61 (2024-Present) - Latest generation
      INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
      SELECT gen_random_uuid(), bmw_5_series_id, 'G60/G61 (2024-Present)', 'g60-2024-present', 2024, NULL, 'G60', 'Eighth generation 5 Series with completely new design, iDrive 8.5, and advanced technology. Available with 2.0L turbo I4, 3.0L turbo I6, and plug-in hybrid powertrains.', true, 5
      WHERE NOT EXISTS (SELECT 1 FROM model_generations WHERE car_model_id = bmw_5_series_id AND slug = 'g60-2024-present')
      ON CONFLICT (car_model_id, slug) DO NOTHING;
    END IF;

    -- BMW X3
    SELECT id INTO bmw_x3_id FROM car_models WHERE brand_id = bmw_id AND slug = 'x3' LIMIT 1;
    IF bmw_x3_id IS NULL THEN
      INSERT INTO car_models (id, brand_id, name, slug, year_start, year_end, description, is_featured, display_order) VALUES
        (gen_random_uuid(), bmw_id, 'X3', 'x3', 2003, NULL, 'The BMW X3 is a compact luxury crossover SUV. Known for sporty handling, premium interior, and available powerful engines.', true, 3)
      ON CONFLICT (brand_id, slug) DO NOTHING
      RETURNING id INTO bmw_x3_id;
    ELSE
      SELECT id INTO bmw_x3_id FROM car_models WHERE brand_id = bmw_id AND slug = 'x3' LIMIT 1;
    END IF;

    IF bmw_x3_id IS NOT NULL THEN
      -- G01 (2018-2024) - Current generation
      INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
      SELECT gen_random_uuid(), bmw_x3_id, 'G01 (2018-2024)', 'g01-2018-2024', 2018, 2024, 'G01', 'Third generation X3 with new platform, updated design, and advanced technology. Available with 2.0L turbo I4, 3.0L turbo I6, and plug-in hybrid powertrains.', true, 1
      WHERE NOT EXISTS (SELECT 1 FROM model_generations WHERE car_model_id = bmw_x3_id AND slug = 'g01-2018-2024')
      ON CONFLICT (car_model_id, slug) DO NOTHING;

      -- G45 (2024-Present) - Latest generation
      INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
      SELECT gen_random_uuid(), bmw_x3_id, 'G45 (2024-Present)', 'g45-2024-present', 2024, NULL, 'G45', 'Fourth generation X3 with completely new design, iDrive 8.5, and advanced technology.', true, 2
      WHERE NOT EXISTS (SELECT 1 FROM model_generations WHERE car_model_id = bmw_x3_id AND slug = 'g45-2024-present')
      ON CONFLICT (car_model_id, slug) DO NOTHING;
    END IF;

    -- BMW X5
    SELECT id INTO bmw_x5_id FROM car_models WHERE brand_id = bmw_id AND slug = 'x5' LIMIT 1;
    IF bmw_x5_id IS NULL THEN
      INSERT INTO car_models (id, brand_id, name, slug, year_start, year_end, description, is_featured, display_order) VALUES
        (gen_random_uuid(), bmw_id, 'X5', 'x5', 1999, NULL, 'The BMW X5 is a mid-size luxury SUV. Known for sporty handling, premium interior, and powerful engines.', true, 4)
      ON CONFLICT (brand_id, slug) DO NOTHING
      RETURNING id INTO bmw_x5_id;
    ELSE
      SELECT id INTO bmw_x5_id FROM car_models WHERE brand_id = bmw_id AND slug = 'x5' LIMIT 1;
    END IF;

    IF bmw_x5_id IS NOT NULL THEN
      -- G05 (2019-2024) - Current generation
      INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
      SELECT gen_random_uuid(), bmw_x5_id, 'G05 (2019-2024)', 'g05-2019-2024', 2019, 2024, 'G05', 'Fourth generation X5 with new platform, updated design, and advanced technology. Available with 3.0L turbo I6, 4.4L twin-turbo V8, and plug-in hybrid powertrains.', true, 1
      WHERE NOT EXISTS (SELECT 1 FROM model_generations WHERE car_model_id = bmw_x5_id AND slug = 'g05-2019-2024')
      ON CONFLICT (car_model_id, slug) DO NOTHING;

      -- G65 (2024-Present) - Latest generation
      INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
      SELECT gen_random_uuid(), bmw_x5_id, 'G65 (2024-Present)', 'g65-2024-present', 2024, NULL, 'G65', 'Fifth generation X5 with completely new design, iDrive 8.5, and advanced technology.', true, 2
      WHERE NOT EXISTS (SELECT 1 FROM model_generations WHERE car_model_id = bmw_x5_id AND slug = 'g65-2024-present')
      ON CONFLICT (car_model_id, slug) DO NOTHING;
    END IF;
  END IF;

  -- ============================================
  -- MERCEDES-BENZ - New Generations
  -- ============================================
  IF mercedes_id IS NOT NULL THEN
    -- Get Mercedes C-Class model
    SELECT id INTO mercedes_c_class_id FROM car_models WHERE brand_id = mercedes_id AND slug = 'c-class' LIMIT 1;
    
    IF mercedes_c_class_id IS NOT NULL THEN
      -- W206 (2021-Present) - Latest generation
      INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
      SELECT gen_random_uuid(), mercedes_c_class_id, 'W206 (2021-Present)', 'w206-2021-present', 2021, NULL, 'W206', 'Fifth generation C-Class with new platform, updated design, and advanced technology. Available with 1.5L turbo I4, 2.0L turbo I4, and plug-in hybrid powertrains.', true, 4
      WHERE NOT EXISTS (SELECT 1 FROM model_generations WHERE car_model_id = mercedes_c_class_id AND slug = 'w206-2021-present')
      ON CONFLICT (car_model_id, slug) DO NOTHING;
    END IF;

    -- Get Mercedes E-Class model
    SELECT id INTO mercedes_e_class_id FROM car_models WHERE brand_id = mercedes_id AND slug = 'e-class' LIMIT 1;
    
    IF mercedes_e_class_id IS NOT NULL THEN
      -- W213 (2016-2023) - Current generation
      INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
      SELECT gen_random_uuid(), mercedes_e_class_id, 'W213 (2016-2023)', 'w213-2016-2023', 2016, 2023, 'W213', 'Sixth generation E-Class with new platform, updated design, and advanced technology. Available with 2.0L turbo I4, 3.0L turbo V6, and plug-in hybrid powertrains.', true, 4
      WHERE NOT EXISTS (SELECT 1 FROM model_generations WHERE car_model_id = mercedes_e_class_id AND slug = 'w213-2016-2023')
      ON CONFLICT (car_model_id, slug) DO NOTHING;

      -- W214 (2024-Present) - Latest generation
      INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
      SELECT gen_random_uuid(), mercedes_e_class_id, 'W214 (2024-Present)', 'w214-2024-present', 2024, NULL, 'W214', 'Seventh generation E-Class with completely new design, MBUX Superscreen, and advanced technology.', true, 5
      WHERE NOT EXISTS (SELECT 1 FROM model_generations WHERE car_model_id = mercedes_e_class_id AND slug = 'w214-2024-present')
      ON CONFLICT (car_model_id, slug) DO NOTHING;
    END IF;

    -- Mercedes G-Class
    SELECT id INTO mercedes_g_class_id FROM car_models WHERE brand_id = mercedes_id AND slug = 'g-class' LIMIT 1;
    IF mercedes_g_class_id IS NULL THEN
      INSERT INTO car_models (id, brand_id, name, slug, year_start, year_end, description, is_featured, display_order) VALUES
        (gen_random_uuid(), mercedes_id, 'G-Class', 'g-class', 1979, NULL, 'The Mercedes G-Class is a luxury off-road SUV. Known for iconic boxy design, exceptional off-road capability, and powerful engines.', true, 3)
      ON CONFLICT (brand_id, slug) DO NOTHING
      RETURNING id INTO mercedes_g_class_id;
    ELSE
      SELECT id INTO mercedes_g_class_id FROM car_models WHERE brand_id = mercedes_id AND slug = 'g-class' LIMIT 1;
    END IF;

    IF mercedes_g_class_id IS NOT NULL THEN
      -- W463 (2018-Present) - Current generation
      INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
      SELECT gen_random_uuid(), mercedes_g_class_id, 'W463 (2018-Present)', 'w463-2018-present', 2018, NULL, 'W463', 'Second generation G-Class with updated design, improved on-road comfort, and advanced technology. Available with 4.0L twin-turbo V8 and AMG variants.', true, 1
      WHERE NOT EXISTS (SELECT 1 FROM model_generations WHERE car_model_id = mercedes_g_class_id AND slug = 'w463-2018-present')
      ON CONFLICT (car_model_id, slug) DO NOTHING;
    END IF;

    -- Mercedes GLC
    SELECT id INTO mercedes_glc_id FROM car_models WHERE brand_id = mercedes_id AND slug = 'glc' LIMIT 1;
    IF mercedes_glc_id IS NULL THEN
      INSERT INTO car_models (id, brand_id, name, slug, year_start, year_end, description, is_featured, display_order) VALUES
        (gen_random_uuid(), mercedes_id, 'GLC', 'glc', 2015, NULL, 'The Mercedes GLC is a compact luxury crossover SUV. Known for comfort, technology, and available AMG variants.', true, 4)
      ON CONFLICT (brand_id, slug) DO NOTHING
      RETURNING id INTO mercedes_glc_id;
    ELSE
      SELECT id INTO mercedes_glc_id FROM car_models WHERE brand_id = mercedes_id AND slug = 'glc' LIMIT 1;
    END IF;

    IF mercedes_glc_id IS NOT NULL THEN
      -- X253 (2015-2022) - First generation
      INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
      SELECT gen_random_uuid(), mercedes_glc_id, 'X253 (2015-2022)', 'x253-2015-2022', 2015, 2022, 'X253', 'First generation GLC with 2.0L turbo I4 and 3.0L turbo V6 engines. Available with rear-wheel or all-wheel drive.', true, 1
      WHERE NOT EXISTS (SELECT 1 FROM model_generations WHERE car_model_id = mercedes_glc_id AND slug = 'x253-2015-2022')
      ON CONFLICT (car_model_id, slug) DO NOTHING;

      -- X254 (2023-Present) - Latest generation
      INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
      SELECT gen_random_uuid(), mercedes_glc_id, 'X254 (2023-Present)', 'x254-2023-present', 2023, NULL, 'X254', 'Second generation GLC with new platform, updated design, MBUX, and advanced technology. Available with 2.0L turbo I4 and plug-in hybrid powertrains.', true, 2
      WHERE NOT EXISTS (SELECT 1 FROM model_generations WHERE car_model_id = mercedes_glc_id AND slug = 'x254-2023-present')
      ON CONFLICT (car_model_id, slug) DO NOTHING;
    END IF;
  END IF;

  -- ============================================
  -- AUDI - New Generations
  -- ============================================
  IF audi_id IS NOT NULL THEN
    -- Audi A4
    SELECT id INTO audi_a4_id FROM car_models WHERE brand_id = audi_id AND slug = 'a4' LIMIT 1;
    IF audi_a4_id IS NULL THEN
      INSERT INTO car_models (id, brand_id, name, slug, year_start, year_end, description, is_featured, display_order) VALUES
        (gen_random_uuid(), audi_id, 'A4', 'a4', 1994, NULL, 'The Audi A4 is a compact executive sedan. Known for Quattro all-wheel drive, premium interior, and advanced technology.', true, 1)
      ON CONFLICT (brand_id, slug) DO NOTHING
      RETURNING id INTO audi_a4_id;
    ELSE
      SELECT id INTO audi_a4_id FROM car_models WHERE brand_id = audi_id AND slug = 'a4' LIMIT 1;
    END IF;

    IF audi_a4_id IS NOT NULL THEN
      -- B9 (2016-2023) - Current generation
      INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
      SELECT gen_random_uuid(), audi_a4_id, 'B9 (2016-2023)', 'b9-2016-2023', 2016, 2023, 'B9', 'Fifth generation A4 with new platform, updated design, and advanced technology. Available with 2.0L turbo I4 and 3.0L turbo V6 engines.', true, 1
      WHERE NOT EXISTS (SELECT 1 FROM model_generations WHERE car_model_id = audi_a4_id AND slug = 'b9-2016-2023')
      ON CONFLICT (car_model_id, slug) DO NOTHING;

      -- B10 (2024-Present) - Latest generation
      INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
      SELECT gen_random_uuid(), audi_a4_id, 'B10 (2024-Present)', 'b10-2024-present', 2024, NULL, 'B10', 'Sixth generation A4 with completely new design, updated technology, and improved efficiency.', true, 2
      WHERE NOT EXISTS (SELECT 1 FROM model_generations WHERE car_model_id = audi_a4_id AND slug = 'b10-2024-present')
      ON CONFLICT (car_model_id, slug) DO NOTHING;
    END IF;

    -- Audi A6
    SELECT id INTO audi_a6_id FROM car_models WHERE brand_id = audi_id AND slug = 'a6' LIMIT 1;
    IF audi_a6_id IS NULL THEN
      INSERT INTO car_models (id, brand_id, name, slug, year_start, year_end, description, is_featured, display_order) VALUES
        (gen_random_uuid(), audi_id, 'A6', 'a6', 1994, NULL, 'The Audi A6 is a mid-size executive sedan. Known for Quattro all-wheel drive, premium interior, and advanced technology.', true, 2)
      ON CONFLICT (brand_id, slug) DO NOTHING
      RETURNING id INTO audi_a6_id;
    ELSE
      SELECT id INTO audi_a6_id FROM car_models WHERE brand_id = audi_id AND slug = 'a6' LIMIT 1;
    END IF;

    IF audi_a6_id IS NOT NULL THEN
      -- C8 (2018-2023) - Current generation
      INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
      SELECT gen_random_uuid(), audi_a6_id, 'C8 (2018-2023)', 'c8-2018-2023', 2018, 2023, 'C8', 'Fifth generation A6 with new platform, updated design, and advanced technology. Available with 2.0L turbo I4, 3.0L turbo V6, and plug-in hybrid powertrains.', true, 1
      WHERE NOT EXISTS (SELECT 1 FROM model_generations WHERE car_model_id = audi_a6_id AND slug = 'c8-2018-2023')
      ON CONFLICT (car_model_id, slug) DO NOTHING;

      -- C9 (2024-Present) - Latest generation
      INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
      SELECT gen_random_uuid(), audi_a6_id, 'C9 (2024-Present)', 'c9-2024-present', 2024, NULL, 'C9', 'Sixth generation A6 with completely new design, updated technology, and improved efficiency.', true, 2
      WHERE NOT EXISTS (SELECT 1 FROM model_generations WHERE car_model_id = audi_a6_id AND slug = 'c9-2024-present')
      ON CONFLICT (car_model_id, slug) DO NOTHING;
    END IF;

    -- Audi Q5
    SELECT id INTO audi_q5_id FROM car_models WHERE brand_id = audi_id AND slug = 'q5' LIMIT 1;
    IF audi_q5_id IS NULL THEN
      INSERT INTO car_models (id, brand_id, name, slug, year_start, year_end, description, is_featured, display_order) VALUES
        (gen_random_uuid(), audi_id, 'Q5', 'q5', 2008, NULL, 'The Audi Q5 is a compact luxury crossover SUV. Known for Quattro all-wheel drive, premium interior, and advanced technology.', true, 3)
      ON CONFLICT (brand_id, slug) DO NOTHING
      RETURNING id INTO audi_q5_id;
    ELSE
      SELECT id INTO audi_q5_id FROM car_models WHERE brand_id = audi_id AND slug = 'q5' LIMIT 1;
    END IF;

    IF audi_q5_id IS NOT NULL THEN
      -- FY (2017-2023) - Current generation
      INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
      SELECT gen_random_uuid(), audi_q5_id, 'FY (2017-2023)', 'fy-2017-2023', 2017, 2023, 'FY', 'Second generation Q5 with new platform, updated design, and advanced technology. Available with 2.0L turbo I4 and 3.0L turbo V6 engines.', true, 1
      WHERE NOT EXISTS (SELECT 1 FROM model_generations WHERE car_model_id = audi_q5_id AND slug = 'fy-2017-2023')
      ON CONFLICT (car_model_id, slug) DO NOTHING;

      -- FZ (2024-Present) - Latest generation
      INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
      SELECT gen_random_uuid(), audi_q5_id, 'FZ (2024-Present)', 'fz-2024-present', 2024, NULL, 'FZ', 'Third generation Q5 with completely new design, updated technology, and improved efficiency.', true, 2
      WHERE NOT EXISTS (SELECT 1 FROM model_generations WHERE car_model_id = audi_q5_id AND slug = 'fz-2024-present')
      ON CONFLICT (car_model_id, slug) DO NOTHING;
    END IF;
  END IF;

  -- ============================================
  -- VOLKSWAGEN - New Generations
  -- ============================================
  IF volkswagen_id IS NOT NULL THEN
    -- VW Golf
    SELECT id INTO vw_golf_id FROM car_models WHERE brand_id = volkswagen_id AND slug = 'golf' LIMIT 1;
    IF vw_golf_id IS NULL THEN
      INSERT INTO car_models (id, brand_id, name, slug, year_start, year_end, description, is_featured, display_order) VALUES
        (gen_random_uuid(), volkswagen_id, 'Golf', 'golf', 1974, NULL, 'The Volkswagen Golf is a compact car. One of the best-selling cars in the world. Known for reliability, practicality, and value.', true, 1)
      ON CONFLICT (brand_id, slug) DO NOTHING
      RETURNING id INTO vw_golf_id;
    ELSE
      SELECT id INTO vw_golf_id FROM car_models WHERE brand_id = volkswagen_id AND slug = 'golf' LIMIT 1;
    END IF;

    IF vw_golf_id IS NOT NULL THEN
      -- MK8 (2019-2024) - Current generation
      INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
      SELECT gen_random_uuid(), vw_golf_id, 'MK8 (2019-2024)', 'mk8-2019-2024', 2019, 2024, 'MK8', 'Eighth generation Golf with new platform, updated design, and advanced technology. Available with gasoline, diesel, and plug-in hybrid powertrains.', true, 1
      WHERE NOT EXISTS (SELECT 1 FROM model_generations WHERE car_model_id = vw_golf_id AND slug = 'mk8-2019-2024')
      ON CONFLICT (car_model_id, slug) DO NOTHING;

      -- MK8.5 (2024-Present) - Latest facelift
      INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
      SELECT gen_random_uuid(), vw_golf_id, 'MK8.5 (2024-Present)', 'mk8-5-2024-present', 2024, NULL, 'MK8.5', 'Eighth generation Golf facelift with updated design, improved infotainment, and enhanced technology.', true, 2
      WHERE NOT EXISTS (SELECT 1 FROM model_generations WHERE car_model_id = vw_golf_id AND slug = 'mk8-5-2024-present')
      ON CONFLICT (car_model_id, slug) DO NOTHING;
    END IF;

    -- VW Passat
    SELECT id INTO vw_passat_id FROM car_models WHERE brand_id = volkswagen_id AND slug = 'passat' LIMIT 1;
    IF vw_passat_id IS NOT NULL THEN
      -- B9 (2024-Present) - Latest generation (Europe)
      INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
      SELECT gen_random_uuid(), vw_passat_id, 'B9 (2024-Present)', 'b9-2024-present', 2024, NULL, 'B9', 'Ninth generation Passat with new platform, updated design, and advanced technology. Available with gasoline, diesel, and plug-in hybrid powertrains.', true, 1
      WHERE NOT EXISTS (SELECT 1 FROM model_generations WHERE car_model_id = vw_passat_id AND slug = 'b9-2024-present')
      ON CONFLICT (car_model_id, slug) DO NOTHING;
    END IF;
  END IF;

  -- ============================================
  -- TOYOTA - New Generations
  -- ============================================
  IF toyota_id IS NOT NULL THEN
    -- Toyota Camry
    SELECT id INTO toyota_camry_id FROM car_models WHERE brand_id = toyota_id AND slug = 'camry' LIMIT 1;
    IF toyota_camry_id IS NULL THEN
      INSERT INTO car_models (id, brand_id, name, slug, year_start, year_end, description, is_featured, display_order) VALUES
        (gen_random_uuid(), toyota_id, 'Camry', 'camry', 1982, NULL, 'The Toyota Camry is a mid-size sedan. One of the best-selling cars in America. Known for reliability, comfort, and value.', true, 1)
      ON CONFLICT (brand_id, slug) DO NOTHING
      RETURNING id INTO toyota_camry_id;
    ELSE
      SELECT id INTO toyota_camry_id FROM car_models WHERE brand_id = toyota_id AND slug = 'camry' LIMIT 1;
    END IF;

    IF toyota_camry_id IS NOT NULL THEN
      -- XV70 (2018-2024) - Current generation
      INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
      SELECT gen_random_uuid(), toyota_camry_id, 'XV70 (2018-2024)', 'xv70-2018-2024', 2018, 2024, 'XV70', 'Eighth generation Camry with new platform, updated design, and available 2.5L I4, 3.5L V6, and hybrid powertrains.', true, 1
      WHERE NOT EXISTS (SELECT 1 FROM model_generations WHERE car_model_id = toyota_camry_id AND slug = 'xv70-2018-2024')
      ON CONFLICT (car_model_id, slug) DO NOTHING;

      -- XV80 (2025-Present) - Latest generation
      INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
      SELECT gen_random_uuid(), toyota_camry_id, 'XV80 (2025-Present)', 'xv80-2025-present', 2025, NULL, 'XV80', 'Ninth generation Camry with completely new design, updated technology, and improved efficiency.', true, 2
      WHERE NOT EXISTS (SELECT 1 FROM model_generations WHERE car_model_id = toyota_camry_id AND slug = 'xv80-2025-present')
      ON CONFLICT (car_model_id, slug) DO NOTHING;
    END IF;

    -- Toyota RAV4
    SELECT id INTO toyota_rav4_id FROM car_models WHERE brand_id = toyota_id AND slug = 'rav4' LIMIT 1;
    IF toyota_rav4_id IS NULL THEN
      INSERT INTO car_models (id, brand_id, name, slug, year_start, year_end, description, is_featured, display_order) VALUES
        (gen_random_uuid(), toyota_id, 'RAV4', 'rav4', 1994, NULL, 'The Toyota RAV4 is a compact crossover SUV. One of the best-selling SUVs in the world. Known for reliability, practicality, and available hybrid powertrain.', true, 2)
      ON CONFLICT (brand_id, slug) DO NOTHING
      RETURNING id INTO toyota_rav4_id;
    ELSE
      SELECT id INTO toyota_rav4_id FROM car_models WHERE brand_id = toyota_id AND slug = 'rav4' LIMIT 1;
    END IF;

    IF toyota_rav4_id IS NOT NULL THEN
      -- XA50 (2019-Present) - Current generation
      INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
      SELECT gen_random_uuid(), toyota_rav4_id, 'XA50 (2019-Present)', 'xa50-2019-present', 2019, NULL, 'XA50', 'Fifth generation RAV4 with new platform, updated design, and available 2.5L I4 and hybrid powertrains.', true, 1
      WHERE NOT EXISTS (SELECT 1 FROM model_generations WHERE car_model_id = toyota_rav4_id AND slug = 'xa50-2019-present')
      ON CONFLICT (car_model_id, slug) DO NOTHING;
    END IF;
  END IF;

  -- ============================================
  -- HONDA - New Generations
  -- ============================================
  IF honda_id IS NOT NULL THEN
    -- Honda Civic
    SELECT id INTO honda_civic_id FROM car_models WHERE brand_id = honda_id AND slug = 'civic' LIMIT 1;
    IF honda_civic_id IS NULL THEN
      INSERT INTO car_models (id, brand_id, name, slug, year_start, year_end, description, is_featured, display_order) VALUES
        (gen_random_uuid(), honda_id, 'Civic', 'civic', 1972, NULL, 'The Honda Civic is a compact car. One of the best-selling cars in the world. Known for reliability, fuel economy, and value.', true, 1)
      ON CONFLICT (brand_id, slug) DO NOTHING
      RETURNING id INTO honda_civic_id;
    ELSE
      SELECT id INTO honda_civic_id FROM car_models WHERE brand_id = honda_id AND slug = 'civic' LIMIT 1;
    END IF;

    IF honda_civic_id IS NOT NULL THEN
      -- 11th Gen (2022-Present) - Latest generation
      INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
      SELECT gen_random_uuid(), honda_civic_id, '11th Gen (2022-Present)', '11th-gen-2022-present', 2022, NULL, '11th Gen', 'Eleventh generation Civic with new platform, updated design, and available 2.0L I4 and 1.5L turbo I4 engines.', true, 1
      WHERE NOT EXISTS (SELECT 1 FROM model_generations WHERE car_model_id = honda_civic_id AND slug = '11th-gen-2022-present')
      ON CONFLICT (car_model_id, slug) DO NOTHING;
    END IF;

    -- Honda CR-V
    SELECT id INTO honda_crv_id FROM car_models WHERE brand_id = honda_id AND slug = 'cr-v' LIMIT 1;
    IF honda_crv_id IS NULL THEN
      INSERT INTO car_models (id, brand_id, name, slug, year_start, year_end, description, is_featured, display_order) VALUES
        (gen_random_uuid(), honda_id, 'CR-V', 'cr-v', 1995, NULL, 'The Honda CR-V is a compact crossover SUV. One of the best-selling SUVs in the world. Known for reliability, practicality, and available hybrid powertrain.', true, 2)
      ON CONFLICT (brand_id, slug) DO NOTHING
      RETURNING id INTO honda_crv_id;
    ELSE
      SELECT id INTO honda_crv_id FROM car_models WHERE brand_id = honda_id AND slug = 'cr-v' LIMIT 1;
    END IF;

    IF honda_crv_id IS NOT NULL THEN
      -- 6th Gen (2023-Present) - Latest generation
      INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
      SELECT gen_random_uuid(), honda_crv_id, '6th Gen (2023-Present)', '6th-gen-2023-present', 2023, NULL, '6th Gen', 'Sixth generation CR-V with new platform, updated design, and available 1.5L turbo I4 and hybrid powertrains.', true, 1
      WHERE NOT EXISTS (SELECT 1 FROM model_generations WHERE car_model_id = honda_crv_id AND slug = '6th-gen-2023-present')
      ON CONFLICT (car_model_id, slug) DO NOTHING;
    END IF;
  END IF;

  -- ============================================
  -- TESLA - New Models (if Tesla brand exists)
  -- ============================================
  IF tesla_id IS NOT NULL THEN
    -- Tesla Model 3
    SELECT id INTO tesla_model_3_id FROM car_models WHERE brand_id = tesla_id AND slug = 'model-3' LIMIT 1;
    IF tesla_model_3_id IS NULL THEN
      INSERT INTO car_models (id, brand_id, name, slug, year_start, year_end, description, is_featured, display_order) VALUES
        (gen_random_uuid(), tesla_id, 'Model 3', 'model-3', 2017, NULL, 'The Tesla Model 3 is an electric compact sedan. One of the best-selling electric cars in the world. Known for range, technology, and performance.', true, 1)
      ON CONFLICT (brand_id, slug) DO NOTHING
      RETURNING id INTO tesla_model_3_id;
    ELSE
      SELECT id INTO tesla_model_3_id FROM car_models WHERE brand_id = tesla_id AND slug = 'model-3' LIMIT 1;
    END IF;

    IF tesla_model_3_id IS NOT NULL THEN
      -- Highland (2024-Present) - Latest refresh
      INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
      SELECT gen_random_uuid(), tesla_model_3_id, 'Highland (2024-Present)', 'highland-2024-present', 2024, NULL, 'Highland', 'Model 3 Highland refresh with updated design, improved range, and enhanced technology.', true, 1
      WHERE NOT EXISTS (SELECT 1 FROM model_generations WHERE car_model_id = tesla_model_3_id AND slug = 'highland-2024-present')
      ON CONFLICT (car_model_id, slug) DO NOTHING;
    END IF;

    -- Tesla Model Y
    SELECT id INTO tesla_model_y_id FROM car_models WHERE brand_id = tesla_id AND slug = 'model-y' LIMIT 1;
    IF tesla_model_y_id IS NULL THEN
      INSERT INTO car_models (id, brand_id, name, slug, year_start, year_end, description, is_featured, display_order) VALUES
        (gen_random_uuid(), tesla_id, 'Model Y', 'model-y', 2020, NULL, 'The Tesla Model Y is an electric compact crossover SUV. One of the best-selling electric SUVs. Known for range, technology, and performance.', true, 2)
      ON CONFLICT (brand_id, slug) DO NOTHING
      RETURNING id INTO tesla_model_y_id;
    ELSE
      SELECT id INTO tesla_model_y_id FROM car_models WHERE brand_id = tesla_id AND slug = 'model-y' LIMIT 1;
    END IF;

    IF tesla_model_y_id IS NOT NULL THEN
      -- Juniper (2025-Present) - Latest refresh
      INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
      SELECT gen_random_uuid(), tesla_model_y_id, 'Juniper (2025-Present)', 'juniper-2025-present', 2025, NULL, 'Juniper', 'Model Y Juniper refresh with updated design, improved range, and enhanced technology.', true, 1
      WHERE NOT EXISTS (SELECT 1 FROM model_generations WHERE car_model_id = tesla_model_y_id AND slug = 'juniper-2025-present')
      ON CONFLICT (car_model_id, slug) DO NOTHING;
    END IF;
  END IF;

  -- ============================================
  -- MAZDA - New Generations
  -- ============================================
  IF mazda_id IS NOT NULL THEN
    -- Mazda CX-5
    SELECT id INTO mazda_cx5_id FROM car_models WHERE brand_id = mazda_id AND slug = 'cx-5' LIMIT 1;
    IF mazda_cx5_id IS NULL THEN
      INSERT INTO car_models (id, brand_id, name, slug, year_start, year_end, description, is_featured, display_order) VALUES
        (gen_random_uuid(), mazda_id, 'CX-5', 'cx-5', 2012, NULL, 'The Mazda CX-5 is a compact crossover SUV. Known for driving dynamics, design, and available all-wheel drive.', true, 1)
      ON CONFLICT (brand_id, slug) DO NOTHING
      RETURNING id INTO mazda_cx5_id;
    ELSE
      SELECT id INTO mazda_cx5_id FROM car_models WHERE brand_id = mazda_id AND slug = 'cx-5' LIMIT 1;
    END IF;

    IF mazda_cx5_id IS NOT NULL THEN
      -- 2nd Gen (2017-2023)
      INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
      SELECT gen_random_uuid(), mazda_cx5_id, '2nd Gen (2017-2023)', '2nd-gen-2017-2023', 2017, 2023, '2nd Gen', 'Second generation CX-5 with updated design, improved technology, and available 2.5L I4 and 2.5L turbo engines.', true, 1
      WHERE NOT EXISTS (SELECT 1 FROM model_generations WHERE car_model_id = mazda_cx5_id AND slug = '2nd-gen-2017-2023')
      ON CONFLICT (car_model_id, slug) DO NOTHING;

      -- 3rd Gen (2024-Present)
      INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
      SELECT gen_random_uuid(), mazda_cx5_id, '3rd Gen (2024-Present)', '3rd-gen-2024-present', 2024, NULL, '3rd Gen', 'Third generation CX-5 with updated design, advanced technology, and available 2.5L I4 and 2.5L turbo engines.', true, 2
      WHERE NOT EXISTS (SELECT 1 FROM model_generations WHERE car_model_id = mazda_cx5_id AND slug = '3rd-gen-2024-present')
      ON CONFLICT (car_model_id, slug) DO NOTHING;
    END IF;

    -- Mazda CX-9
    SELECT id INTO mazda_cx9_id FROM car_models WHERE brand_id = mazda_id AND slug = 'cx-9' LIMIT 1;
    IF mazda_cx9_id IS NULL THEN
      INSERT INTO car_models (id, brand_id, name, slug, year_start, year_end, description, is_featured, display_order) VALUES
        (gen_random_uuid(), mazda_id, 'CX-9', 'cx-9', 2006, NULL, 'The Mazda CX-9 is a mid-size crossover SUV. Known for three-row seating, driving dynamics, and available all-wheel drive.', true, 2)
      ON CONFLICT (brand_id, slug) DO NOTHING
      RETURNING id INTO mazda_cx9_id;
    ELSE
      SELECT id INTO mazda_cx9_id FROM car_models WHERE brand_id = mazda_id AND slug = 'cx-9' LIMIT 1;
    END IF;

    IF mazda_cx9_id IS NOT NULL THEN
      -- 2nd Gen (2016-2023)
      INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
      SELECT gen_random_uuid(), mazda_cx9_id, '2nd Gen (2016-2023)', '2nd-gen-2016-2023', 2016, 2023, '2nd Gen', 'Second generation CX-9 with updated design, improved technology, and 2.5L turbo I4 engine.', true, 1
      WHERE NOT EXISTS (SELECT 1 FROM model_generations WHERE car_model_id = mazda_cx9_id AND slug = '2nd-gen-2016-2023')
      ON CONFLICT (car_model_id, slug) DO NOTHING;
    END IF;
  END IF;

  -- ============================================
  -- SUBARU - New Generations
  -- ============================================
  IF subaru_id IS NOT NULL THEN
    -- Subaru Outback
    SELECT id INTO subaru_outback_id FROM car_models WHERE brand_id = subaru_id AND slug = 'outback' LIMIT 1;
    IF subaru_outback_id IS NULL THEN
      INSERT INTO car_models (id, brand_id, name, slug, year_start, year_end, description, is_featured, display_order) VALUES
        (gen_random_uuid(), subaru_id, 'Outback', 'outback', 1994, NULL, 'The Subaru Outback is a mid-size crossover wagon. Known for all-wheel drive, reliability, and off-road capability.', true, 1)
      ON CONFLICT (brand_id, slug) DO NOTHING
      RETURNING id INTO subaru_outback_id;
    ELSE
      SELECT id INTO subaru_outback_id FROM car_models WHERE brand_id = subaru_id AND slug = 'outback' LIMIT 1;
    END IF;

    IF subaru_outback_id IS NOT NULL THEN
      -- 6th Gen (2020-Present)
      INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
      SELECT gen_random_uuid(), subaru_outback_id, '6th Gen (2020-Present)', '6th-gen-2020-present', 2020, NULL, '6th Gen', 'Sixth generation Outback with new platform, updated design, and available 2.5L flat-4 and 2.4L turbo flat-4 engines.', true, 1
      WHERE NOT EXISTS (SELECT 1 FROM model_generations WHERE car_model_id = subaru_outback_id AND slug = '6th-gen-2020-present')
      ON CONFLICT (car_model_id, slug) DO NOTHING;
    END IF;

    -- Subaru Forester
    SELECT id INTO subaru_forester_id FROM car_models WHERE brand_id = subaru_id AND slug = 'forester' LIMIT 1;
    IF subaru_forester_id IS NULL THEN
      INSERT INTO car_models (id, brand_id, name, slug, year_start, year_end, description, is_featured, display_order) VALUES
        (gen_random_uuid(), subaru_id, 'Forester', 'forester', 1997, NULL, 'The Subaru Forester is a compact crossover SUV. Known for all-wheel drive, reliability, and practicality.', true, 2)
      ON CONFLICT (brand_id, slug) DO NOTHING
      RETURNING id INTO subaru_forester_id;
    ELSE
      SELECT id INTO subaru_forester_id FROM car_models WHERE brand_id = subaru_id AND slug = 'forester' LIMIT 1;
    END IF;

    IF subaru_forester_id IS NOT NULL THEN
      -- 5th Gen (2019-Present)
      INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
      SELECT gen_random_uuid(), subaru_forester_id, '5th Gen (2019-Present)', '5th-gen-2019-present', 2019, NULL, '5th Gen', 'Fifth generation Forester with new platform, updated design, and available 2.5L flat-4 engine.', true, 1
      WHERE NOT EXISTS (SELECT 1 FROM model_generations WHERE car_model_id = subaru_forester_id AND slug = '5th-gen-2019-present')
      ON CONFLICT (car_model_id, slug) DO NOTHING;
    END IF;
  END IF;

  -- ============================================
  -- JEEP - New Generations
  -- ============================================
  IF jeep_id IS NOT NULL THEN
    -- Jeep Wrangler
    SELECT id INTO jeep_wrangler_id FROM car_models WHERE brand_id = jeep_id AND slug = 'wrangler' LIMIT 1;
    IF jeep_wrangler_id IS NULL THEN
      INSERT INTO car_models (id, brand_id, name, slug, year_start, year_end, description, is_featured, display_order) VALUES
        (gen_random_uuid(), jeep_id, 'Wrangler', 'wrangler', 1986, NULL, 'The Jeep Wrangler is an iconic off-road SUV. Known for legendary capability, removable doors, and convertible top.', true, 1)
      ON CONFLICT (brand_id, slug) DO NOTHING
      RETURNING id INTO jeep_wrangler_id;
    ELSE
      SELECT id INTO jeep_wrangler_id FROM car_models WHERE brand_id = jeep_id AND slug = 'wrangler' LIMIT 1;
    END IF;

    IF jeep_wrangler_id IS NOT NULL THEN
      -- JL (2018-Present)
      INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
      SELECT gen_random_uuid(), jeep_wrangler_id, 'JL (2018-Present)', 'jl-2018-present', 2018, NULL, 'JL', 'Fourth generation Wrangler with updated design, improved technology, and available 2.0L turbo, 3.6L V6, and 3.0L diesel engines.', true, 1
      WHERE NOT EXISTS (SELECT 1 FROM model_generations WHERE car_model_id = jeep_wrangler_id AND slug = 'jl-2018-present')
      ON CONFLICT (car_model_id, slug) DO NOTHING;
    END IF;

    -- Jeep Grand Cherokee
    SELECT id INTO jeep_grand_cherokee_id FROM car_models WHERE brand_id = jeep_id AND slug = 'grand-cherokee' LIMIT 1;
    IF jeep_grand_cherokee_id IS NULL THEN
      INSERT INTO car_models (id, brand_id, name, slug, year_start, year_end, description, is_featured, display_order) VALUES
        (gen_random_uuid(), jeep_id, 'Grand Cherokee', 'grand-cherokee', 1992, NULL, 'The Jeep Grand Cherokee is a mid-size luxury SUV. Known for capability, comfort, and available powerful engines.', true, 2)
      ON CONFLICT (brand_id, slug) DO NOTHING
      RETURNING id INTO jeep_grand_cherokee_id;
    ELSE
      SELECT id INTO jeep_grand_cherokee_id FROM car_models WHERE brand_id = jeep_id AND slug = 'grand-cherokee' LIMIT 1;
    END IF;

    IF jeep_grand_cherokee_id IS NOT NULL THEN
      -- WL (2021-Present)
      INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
      SELECT gen_random_uuid(), jeep_grand_cherokee_id, 'WL (2021-Present)', 'wl-2021-present', 2021, NULL, 'WL', 'Fifth generation Grand Cherokee with new platform, updated design, and available 3.6L V6, 5.7L V8, and 2.0L turbo engines.', true, 1
      WHERE NOT EXISTS (SELECT 1 FROM model_generations WHERE car_model_id = jeep_grand_cherokee_id AND slug = 'wl-2021-present')
      ON CONFLICT (car_model_id, slug) DO NOTHING;
    END IF;
  END IF;

  -- ============================================
  -- RAM - New Generations
  -- ============================================
  IF ram_id IS NOT NULL THEN
    -- Ram 1500
    SELECT id INTO ram_1500_id FROM car_models WHERE brand_id = ram_id AND slug = '1500' LIMIT 1;
    IF ram_1500_id IS NULL THEN
      INSERT INTO car_models (id, brand_id, name, slug, year_start, year_end, description, is_featured, display_order) VALUES
        (gen_random_uuid(), ram_id, '1500', '1500', 1981, NULL, 'The Ram 1500 is a full-size pickup truck. Known for towing capability, comfort, and available powerful engines.', true, 1)
      ON CONFLICT (brand_id, slug) DO NOTHING
      RETURNING id INTO ram_1500_id;
    ELSE
      SELECT id INTO ram_1500_id FROM car_models WHERE brand_id = ram_id AND slug = '1500' LIMIT 1;
    END IF;

    IF ram_1500_id IS NOT NULL THEN
      -- DT (2019-Present)
      INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
      SELECT gen_random_uuid(), ram_1500_id, 'DT (2019-Present)', 'dt-2019-present', 2019, NULL, 'DT', 'Fifth generation Ram 1500 with updated design, advanced technology, and available 3.6L V6, 5.7L V8, and 3.0L diesel engines.', true, 1
      WHERE NOT EXISTS (SELECT 1 FROM model_generations WHERE car_model_id = ram_1500_id AND slug = 'dt-2019-present')
      ON CONFLICT (car_model_id, slug) DO NOTHING;
    END IF;
  END IF;

  -- ============================================
  -- GMC - New Generations
  -- ============================================
  IF gmc_id IS NOT NULL THEN
    -- GMC Sierra
    SELECT id INTO gmc_sierra_id FROM car_models WHERE brand_id = gmc_id AND slug = 'sierra' LIMIT 1;
    IF gmc_sierra_id IS NULL THEN
      INSERT INTO car_models (id, brand_id, name, slug, year_start, year_end, description, is_featured, display_order) VALUES
        (gen_random_uuid(), gmc_id, 'Sierra', 'sierra', 1999, NULL, 'The GMC Sierra is a full-size pickup truck. Known for towing capability, luxury features, and available powerful engines.', true, 1)
      ON CONFLICT (brand_id, slug) DO NOTHING
      RETURNING id INTO gmc_sierra_id;
    ELSE
      SELECT id INTO gmc_sierra_id FROM car_models WHERE brand_id = gmc_id AND slug = 'sierra' LIMIT 1;
    END IF;

    IF gmc_sierra_id IS NOT NULL THEN
      -- T1XX (2019-Present)
      INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
      SELECT gen_random_uuid(), gmc_sierra_id, 'T1XX (2019-Present)', 't1xx-2019-present', 2019, NULL, 'T1XX', 'Fourth generation Sierra with updated design, advanced technology, and available 2.7L turbo, 5.3L V8, 6.2L V8, and 3.0L diesel engines.', true, 1
      WHERE NOT EXISTS (SELECT 1 FROM model_generations WHERE car_model_id = gmc_sierra_id AND slug = 't1xx-2019-present')
      ON CONFLICT (car_model_id, slug) DO NOTHING;
    END IF;
  END IF;

  -- ============================================
  -- LEXUS - New Generations
  -- ============================================
  IF lexus_id IS NOT NULL THEN
    -- Lexus RX
    SELECT id INTO lexus_rx_id FROM car_models WHERE brand_id = lexus_id AND slug = 'rx' LIMIT 1;
    IF lexus_rx_id IS NULL THEN
      INSERT INTO car_models (id, brand_id, name, slug, year_start, year_end, description, is_featured, display_order) VALUES
        (gen_random_uuid(), lexus_id, 'RX', 'rx', 1998, NULL, 'The Lexus RX is a luxury mid-size crossover SUV. Known for reliability, comfort, and available hybrid powertrains.', true, 1)
      ON CONFLICT (brand_id, slug) DO NOTHING
      RETURNING id INTO lexus_rx_id;
    ELSE
      SELECT id INTO lexus_rx_id FROM car_models WHERE brand_id = lexus_id AND slug = 'rx' LIMIT 1;
    END IF;

    IF lexus_rx_id IS NOT NULL THEN
      -- 5th Gen (2023-Present)
      INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
      SELECT gen_random_uuid(), lexus_rx_id, '5th Gen (2023-Present)', '5th-gen-2023-present', 2023, NULL, '5th Gen', 'Fifth generation RX with new platform, updated design, and available 2.4L turbo, 2.5L hybrid, and 2.4L turbo hybrid powertrains.', true, 1
      WHERE NOT EXISTS (SELECT 1 FROM model_generations WHERE car_model_id = lexus_rx_id AND slug = '5th-gen-2023-present')
      ON CONFLICT (car_model_id, slug) DO NOTHING;
    END IF;

    -- Lexus ES
    SELECT id INTO lexus_es_id FROM car_models WHERE brand_id = lexus_id AND slug = 'es' LIMIT 1;
    IF lexus_es_id IS NULL THEN
      INSERT INTO car_models (id, brand_id, name, slug, year_start, year_end, description, is_featured, display_order) VALUES
        (gen_random_uuid(), lexus_id, 'ES', 'es', 1989, NULL, 'The Lexus ES is a luxury mid-size sedan. Known for comfort, reliability, and available hybrid powertrain.', true, 2)
      ON CONFLICT (brand_id, slug) DO NOTHING
      RETURNING id INTO lexus_es_id;
    ELSE
      SELECT id INTO lexus_es_id FROM car_models WHERE brand_id = lexus_id AND slug = 'es' LIMIT 1;
    END IF;

    IF lexus_es_id IS NOT NULL THEN
      -- 7th Gen (2018-Present)
      INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
      SELECT gen_random_uuid(), lexus_es_id, '7th Gen (2018-Present)', '7th-gen-2018-present', 2018, NULL, '7th Gen', 'Seventh generation ES with updated design, improved technology, and available 3.5L V6 and 2.5L hybrid powertrains.', true, 1
      WHERE NOT EXISTS (SELECT 1 FROM model_generations WHERE car_model_id = lexus_es_id AND slug = '7th-gen-2018-present')
      ON CONFLICT (car_model_id, slug) DO NOTHING;
    END IF;
  END IF;

  -- ============================================
  -- ACURA - New Generations
  -- ============================================
  IF acura_id IS NOT NULL THEN
    -- Acura MDX
    SELECT id INTO acura_mdx_id FROM car_models WHERE brand_id = acura_id AND slug = 'mdx' LIMIT 1;
    IF acura_mdx_id IS NULL THEN
      INSERT INTO car_models (id, brand_id, name, slug, year_start, year_end, description, is_featured, display_order) VALUES
        (gen_random_uuid(), acura_id, 'MDX', 'mdx', 2000, NULL, 'The Acura MDX is a luxury mid-size crossover SUV. Known for three-row seating, reliability, and available all-wheel drive.', true, 1)
      ON CONFLICT (brand_id, slug) DO NOTHING
      RETURNING id INTO acura_mdx_id;
    ELSE
      SELECT id INTO acura_mdx_id FROM car_models WHERE brand_id = acura_id AND slug = 'mdx' LIMIT 1;
    END IF;

    IF acura_mdx_id IS NOT NULL THEN
      -- 4th Gen (2022-Present)
      INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
      SELECT gen_random_uuid(), acura_mdx_id, '4th Gen (2022-Present)', '4th-gen-2022-present', 2022, NULL, '4th Gen', 'Fourth generation MDX with new platform, updated design, and available 3.5L V6 and 3.0L turbo V6 engines.', true, 1
      WHERE NOT EXISTS (SELECT 1 FROM model_generations WHERE car_model_id = acura_mdx_id AND slug = '4th-gen-2022-present')
      ON CONFLICT (car_model_id, slug) DO NOTHING;
    END IF;

    -- Acura RDX
    SELECT id INTO acura_rdx_id FROM car_models WHERE brand_id = acura_id AND slug = 'rdx' LIMIT 1;
    IF acura_rdx_id IS NULL THEN
      INSERT INTO car_models (id, brand_id, name, slug, year_start, year_end, description, is_featured, display_order) VALUES
        (gen_random_uuid(), acura_id, 'RDX', 'rdx', 2006, NULL, 'The Acura RDX is a luxury compact crossover SUV. Known for performance, technology, and available all-wheel drive.', true, 2)
      ON CONFLICT (brand_id, slug) DO NOTHING
      RETURNING id INTO acura_rdx_id;
    ELSE
      SELECT id INTO acura_rdx_id FROM car_models WHERE brand_id = acura_id AND slug = 'rdx' LIMIT 1;
    END IF;

    IF acura_rdx_id IS NOT NULL THEN
      -- 3rd Gen (2019-Present)
      INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
      SELECT gen_random_uuid(), acura_rdx_id, '3rd Gen (2019-Present)', '3rd-gen-2019-present', 2019, NULL, '3rd Gen', 'Third generation RDX with updated design, improved technology, and 2.0L turbo I4 engine.', true, 1
      WHERE NOT EXISTS (SELECT 1 FROM model_generations WHERE car_model_id = acura_rdx_id AND slug = '3rd-gen-2019-present')
      ON CONFLICT (car_model_id, slug) DO NOTHING;
    END IF;
  END IF;

  -- ============================================
  -- INFINITI - New Generations
  -- ============================================
  IF infiniti_id IS NOT NULL THEN
    -- Infiniti Q50
    SELECT id INTO infiniti_q50_id FROM car_models WHERE brand_id = infiniti_id AND slug = 'q50' LIMIT 1;
    IF infiniti_q50_id IS NULL THEN
      INSERT INTO car_models (id, brand_id, name, slug, year_start, year_end, description, is_featured, display_order) VALUES
        (gen_random_uuid(), infiniti_id, 'Q50', 'q50', 2013, NULL, 'The Infiniti Q50 is a luxury compact sedan. Known for performance, technology, and available all-wheel drive.', true, 1)
      ON CONFLICT (brand_id, slug) DO NOTHING
      RETURNING id INTO infiniti_q50_id;
    ELSE
      SELECT id INTO infiniti_q50_id FROM car_models WHERE brand_id = infiniti_id AND slug = 'q50' LIMIT 1;
    END IF;

    IF infiniti_q50_id IS NOT NULL THEN
      -- V37 (2014-Present)
      INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
      SELECT gen_random_uuid(), infiniti_q50_id, 'V37 (2014-Present)', 'v37-2014-present', 2014, NULL, 'V37', 'First generation Q50 with updated design, advanced technology, and available 2.0L turbo, 3.0L turbo V6, and 3.5L hybrid powertrains.', true, 1
      WHERE NOT EXISTS (SELECT 1 FROM model_generations WHERE car_model_id = infiniti_q50_id AND slug = 'v37-2014-present')
      ON CONFLICT (car_model_id, slug) DO NOTHING;
    END IF;

    -- Infiniti QX60
    SELECT id INTO infiniti_qx60_id FROM car_models WHERE brand_id = infiniti_id AND slug = 'qx60' LIMIT 1;
    IF infiniti_qx60_id IS NULL THEN
      INSERT INTO car_models (id, brand_id, name, slug, year_start, year_end, description, is_featured, display_order) VALUES
        (gen_random_uuid(), infiniti_id, 'QX60', 'qx60', 2012, NULL, 'The Infiniti QX60 is a luxury mid-size crossover SUV. Known for three-row seating, comfort, and available all-wheel drive.', true, 2)
      ON CONFLICT (brand_id, slug) DO NOTHING
      RETURNING id INTO infiniti_qx60_id;
    ELSE
      SELECT id INTO infiniti_qx60_id FROM car_models WHERE brand_id = infiniti_id AND slug = 'qx60' LIMIT 1;
    END IF;

    IF infiniti_qx60_id IS NOT NULL THEN
      -- 2nd Gen (2022-Present)
      INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
      SELECT gen_random_uuid(), infiniti_qx60_id, '2nd Gen (2022-Present)', '2nd-gen-2022-present', 2022, NULL, '2nd Gen', 'Second generation QX60 with updated design, improved technology, and 3.5L V6 engine.', true, 1
      WHERE NOT EXISTS (SELECT 1 FROM model_generations WHERE car_model_id = infiniti_qx60_id AND slug = '2nd-gen-2022-present')
      ON CONFLICT (car_model_id, slug) DO NOTHING;
    END IF;
  END IF;

  -- ============================================
  -- LAND ROVER - New Generations
  -- ============================================
  IF land_rover_id IS NOT NULL THEN
    -- Land Rover Range Rover
    SELECT id INTO land_rover_range_rover_id FROM car_models WHERE brand_id = land_rover_id AND slug = 'range-rover' LIMIT 1;
    IF land_rover_range_rover_id IS NULL THEN
      INSERT INTO car_models (id, brand_id, name, slug, year_start, year_end, description, is_featured, display_order) VALUES
        (gen_random_uuid(), land_rover_id, 'Range Rover', 'range-rover', 1970, NULL, 'The Land Rover Range Rover is a luxury full-size SUV. Known for off-road capability, luxury, and powerful engines.', true, 1)
      ON CONFLICT (brand_id, slug) DO NOTHING
      RETURNING id INTO land_rover_range_rover_id;
    ELSE
      SELECT id INTO land_rover_range_rover_id FROM car_models WHERE brand_id = land_rover_id AND slug = 'range-rover' LIMIT 1;
    END IF;

    IF land_rover_range_rover_id IS NOT NULL THEN
      -- L460 (2022-Present)
      INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
      SELECT gen_random_uuid(), land_rover_range_rover_id, 'L460 (2022-Present)', 'l460-2022-present', 2022, NULL, 'L460', 'Fifth generation Range Rover with new platform, updated design, and available 3.0L turbo I6, 4.4L turbo V8, and plug-in hybrid powertrains.', true, 1
      WHERE NOT EXISTS (SELECT 1 FROM model_generations WHERE car_model_id = land_rover_range_rover_id AND slug = 'l460-2022-present')
      ON CONFLICT (car_model_id, slug) DO NOTHING;
    END IF;

    -- Land Rover Discovery
    SELECT id INTO land_rover_discovery_id FROM car_models WHERE brand_id = land_rover_id AND slug = 'discovery' LIMIT 1;
    IF land_rover_discovery_id IS NULL THEN
      INSERT INTO car_models (id, brand_id, name, slug, year_start, year_end, description, is_featured, display_order) VALUES
        (gen_random_uuid(), land_rover_id, 'Discovery', 'discovery', 1989, NULL, 'The Land Rover Discovery is a luxury mid-size SUV. Known for off-road capability, three-row seating, and available all-wheel drive.', true, 2)
      ON CONFLICT (brand_id, slug) DO NOTHING
      RETURNING id INTO land_rover_discovery_id;
    ELSE
      SELECT id INTO land_rover_discovery_id FROM car_models WHERE brand_id = land_rover_id AND slug = 'discovery' LIMIT 1;
    END IF;

    IF land_rover_discovery_id IS NOT NULL THEN
      -- L462 (2017-Present)
      INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
      SELECT gen_random_uuid(), land_rover_discovery_id, 'L462 (2017-Present)', 'l462-2017-present', 2017, NULL, 'L462', 'Fifth generation Discovery with updated design, improved technology, and available 3.0L turbo V6 and 2.0L turbo I4 engines.', true, 1
      WHERE NOT EXISTS (SELECT 1 FROM model_generations WHERE car_model_id = land_rover_discovery_id AND slug = 'l462-2017-present')
      ON CONFLICT (car_model_id, slug) DO NOTHING;
    END IF;
  END IF;

  -- ============================================
  -- GENESIS - New Generations
  -- ============================================
  IF genesis_id IS NOT NULL THEN
    -- Genesis G70
    SELECT id INTO genesis_g70_id FROM car_models WHERE brand_id = genesis_id AND slug = 'g70' LIMIT 1;
    IF genesis_g70_id IS NULL THEN
      INSERT INTO car_models (id, brand_id, name, slug, year_start, year_end, description, is_featured, display_order) VALUES
        (gen_random_uuid(), genesis_id, 'G70', 'g70', 2017, NULL, 'The Genesis G70 is a luxury compact sedan. Known for performance, value, and available all-wheel drive.', true, 1)
      ON CONFLICT (brand_id, slug) DO NOTHING
      RETURNING id INTO genesis_g70_id;
    ELSE
      SELECT id INTO genesis_g70_id FROM car_models WHERE brand_id = genesis_id AND slug = 'g70' LIMIT 1;
    END IF;

    IF genesis_g70_id IS NOT NULL THEN
      -- 1st Gen (2018-Present)
      INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
      SELECT gen_random_uuid(), genesis_g70_id, '1st Gen (2018-Present)', '1st-gen-2018-present', 2018, NULL, '1st Gen', 'First generation G70 with updated design, advanced technology, and available 2.0L turbo I4 and 3.3L turbo V6 engines.', true, 1
      WHERE NOT EXISTS (SELECT 1 FROM model_generations WHERE car_model_id = genesis_g70_id AND slug = '1st-gen-2018-present')
      ON CONFLICT (car_model_id, slug) DO NOTHING;
    END IF;

    -- Genesis GV70
    SELECT id INTO genesis_gv70_id FROM car_models WHERE brand_id = genesis_id AND slug = 'gv70' LIMIT 1;
    IF genesis_gv70_id IS NULL THEN
      INSERT INTO car_models (id, brand_id, name, slug, year_start, year_end, description, is_featured, display_order) VALUES
        (gen_random_uuid(), genesis_id, 'GV70', 'gv70', 2020, NULL, 'The Genesis GV70 is a luxury compact crossover SUV. Known for design, technology, and available all-wheel drive.', true, 2)
      ON CONFLICT (brand_id, slug) DO NOTHING
      RETURNING id INTO genesis_gv70_id;
    ELSE
      SELECT id INTO genesis_gv70_id FROM car_models WHERE brand_id = genesis_id AND slug = 'gv70' LIMIT 1;
    END IF;

    IF genesis_gv70_id IS NOT NULL THEN
      -- 1st Gen (2021-Present)
      INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
      SELECT gen_random_uuid(), genesis_gv70_id, '1st Gen (2021-Present)', '1st-gen-2021-present', 2021, NULL, '1st Gen', 'First generation GV70 with updated design, advanced technology, and available 2.5L turbo I4 and 3.5L turbo V6 engines.', true, 1
      WHERE NOT EXISTS (SELECT 1 FROM model_generations WHERE car_model_id = genesis_gv70_id AND slug = '1st-gen-2021-present')
      ON CONFLICT (car_model_id, slug) DO NOTHING;
    END IF;
  END IF;

  -- ============================================
  -- POLESTAR - New Models
  -- ============================================
  IF polestar_id IS NOT NULL THEN
    -- Polestar 2
    SELECT id INTO polestar_2_id FROM car_models WHERE brand_id = polestar_id AND slug = '2' LIMIT 1;
    IF polestar_2_id IS NULL THEN
      INSERT INTO car_models (id, brand_id, name, slug, year_start, year_end, description, is_featured, display_order) VALUES
        (gen_random_uuid(), polestar_id, '2', '2', 2020, NULL, 'The Polestar 2 is an electric compact sedan. Known for performance, technology, and Scandinavian design.', true, 1)
      ON CONFLICT (brand_id, slug) DO NOTHING
      RETURNING id INTO polestar_2_id;
    ELSE
      SELECT id INTO polestar_2_id FROM car_models WHERE brand_id = polestar_id AND slug = '2' LIMIT 1;
    END IF;

    IF polestar_2_id IS NOT NULL THEN
      -- 1st Gen (2020-Present)
      INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
      SELECT gen_random_uuid(), polestar_2_id, '1st Gen (2020-Present)', '1st-gen-2020-present', 2020, NULL, '1st Gen', 'First generation Polestar 2 with dual-motor all-wheel drive, long range, and fast charging capability.', true, 1
      WHERE NOT EXISTS (SELECT 1 FROM model_generations WHERE car_model_id = polestar_2_id AND slug = '1st-gen-2020-present')
      ON CONFLICT (car_model_id, slug) DO NOTHING;
    END IF;
  END IF;

  -- ============================================
  -- FORD - Additional Popular Models
  -- ============================================
  IF ford_id IS NOT NULL THEN
    -- Ford F-150 (Most popular truck in America)
    SELECT id INTO ford_f150_id FROM car_models WHERE brand_id = ford_id AND slug = 'f-150' LIMIT 1;
    IF ford_f150_id IS NULL THEN
      INSERT INTO car_models (id, brand_id, name, slug, year_start, year_end, description, is_featured, display_order) VALUES
        (gen_random_uuid(), ford_id, 'F-150', 'f-150', 1975, NULL, 'The Ford F-150 is a full-size pickup truck. The best-selling vehicle in America for decades. Known for towing capability, durability, and available powerful engines.', true, 1)
      ON CONFLICT (brand_id, slug) DO NOTHING
      RETURNING id INTO ford_f150_id;
    ELSE
      SELECT id INTO ford_f150_id FROM car_models WHERE brand_id = ford_id AND slug = 'f-150' LIMIT 1;
    END IF;

    IF ford_f150_id IS NOT NULL THEN
      -- 14th Gen (2021-Present) - Latest generation
      INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
      SELECT gen_random_uuid(), ford_f150_id, '14th Gen (2021-Present)', '14th-gen-2021-present', 2021, NULL, '14th Gen', 'Fourteenth generation F-150 with updated design, advanced technology, and available 3.3L V6, 2.7L turbo V6, 3.5L turbo V6, 5.0L V8, 3.5L PowerBoost hybrid, and electric powertrains.', true, 1
      WHERE NOT EXISTS (SELECT 1 FROM model_generations WHERE car_model_id = ford_f150_id AND slug = '14th-gen-2021-present')
      ON CONFLICT (car_model_id, slug) DO NOTHING;
    END IF;

    -- Ford Explorer
    SELECT id INTO ford_explorer_id FROM car_models WHERE brand_id = ford_id AND slug = 'explorer' LIMIT 1;
    IF ford_explorer_id IS NULL THEN
      INSERT INTO car_models (id, brand_id, name, slug, year_start, year_end, description, is_featured, display_order) VALUES
        (gen_random_uuid(), ford_id, 'Explorer', 'explorer', 1990, NULL, 'The Ford Explorer is a mid-size crossover SUV. One of the best-selling SUVs in America. Known for three-row seating, capability, and available all-wheel drive.', true, 2)
      ON CONFLICT (brand_id, slug) DO NOTHING
      RETURNING id INTO ford_explorer_id;
    ELSE
      SELECT id INTO ford_explorer_id FROM car_models WHERE brand_id = ford_id AND slug = 'explorer' LIMIT 1;
    END IF;

    IF ford_explorer_id IS NOT NULL THEN
      -- 6th Gen (2020-Present) - Latest generation
      INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
      SELECT gen_random_uuid(), ford_explorer_id, '6th Gen (2020-Present)', '6th-gen-2020-present', 2020, NULL, '6th Gen', 'Sixth generation Explorer with new platform, updated design, and available 2.3L turbo I4, 3.0L turbo V6, and 3.3L hybrid powertrains.', true, 1
      WHERE NOT EXISTS (SELECT 1 FROM model_generations WHERE car_model_id = ford_explorer_id AND slug = '6th-gen-2020-present')
      ON CONFLICT (car_model_id, slug) DO NOTHING;
    END IF;
  END IF;

  -- ============================================
  -- NISSAN - Additional Popular Models
  -- ============================================
  IF nissan_id IS NOT NULL THEN
    -- Nissan Rogue (Best-selling Nissan model)
    SELECT id INTO nissan_rogue_id FROM car_models WHERE brand_id = nissan_id AND slug = 'rogue' LIMIT 1;
    IF nissan_rogue_id IS NULL THEN
      INSERT INTO car_models (id, brand_id, name, slug, year_start, year_end, description, is_featured, display_order) VALUES
        (gen_random_uuid(), nissan_id, 'Rogue', 'rogue', 2007, NULL, 'The Nissan Rogue is a compact crossover SUV. The best-selling Nissan model. Known for value, reliability, and available all-wheel drive.', true, 1)
      ON CONFLICT (brand_id, slug) DO NOTHING
      RETURNING id INTO nissan_rogue_id;
    ELSE
      SELECT id INTO nissan_rogue_id FROM car_models WHERE brand_id = nissan_id AND slug = 'rogue' LIMIT 1;
    END IF;

    IF nissan_rogue_id IS NOT NULL THEN
      -- 3rd Gen (2021-Present) - Latest generation
      INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
      SELECT gen_random_uuid(), nissan_rogue_id, '3rd Gen (2021-Present)', '3rd-gen-2021-present', 2021, NULL, '3rd Gen', 'Third generation Rogue with new platform, updated design, and available 2.5L I4 engine with front-wheel or all-wheel drive.', true, 1
      WHERE NOT EXISTS (SELECT 1 FROM model_generations WHERE car_model_id = nissan_rogue_id AND slug = '3rd-gen-2021-present')
      ON CONFLICT (car_model_id, slug) DO NOTHING;
    END IF;
  END IF;

  -- ============================================
  -- CHEVROLET - Additional Popular Models
  -- ============================================
  IF chevrolet_id IS NOT NULL THEN
    -- Chevrolet Equinox
    SELECT id INTO chevrolet_equinox_id FROM car_models WHERE brand_id = chevrolet_id AND slug = 'equinox' LIMIT 1;
    IF chevrolet_equinox_id IS NULL THEN
      INSERT INTO car_models (id, brand_id, name, slug, year_start, year_end, description, is_featured, display_order) VALUES
        (gen_random_uuid(), chevrolet_id, 'Equinox', 'equinox', 2004, NULL, 'The Chevrolet Equinox is a compact crossover SUV. One of the best-selling SUVs in America. Known for value, reliability, and available all-wheel drive.', true, 2)
      ON CONFLICT (brand_id, slug) DO NOTHING
      RETURNING id INTO chevrolet_equinox_id;
    ELSE
      SELECT id INTO chevrolet_equinox_id FROM car_models WHERE brand_id = chevrolet_id AND slug = 'equinox' LIMIT 1;
    END IF;

    IF chevrolet_equinox_id IS NOT NULL THEN
      -- 3rd Gen (2018-Present) - Current generation
      INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
      SELECT gen_random_uuid(), chevrolet_equinox_id, '3rd Gen (2018-Present)', '3rd-gen-2018-present', 2018, NULL, '3rd Gen', 'Third generation Equinox with updated design, improved technology, and available 1.5L turbo I4, 2.0L turbo I4, and 1.6L diesel engines.', true, 1
      WHERE NOT EXISTS (SELECT 1 FROM model_generations WHERE car_model_id = chevrolet_equinox_id AND slug = '3rd-gen-2018-present')
      ON CONFLICT (car_model_id, slug) DO NOTHING;
    END IF;
  END IF;

  -- ============================================
  -- KIA - Additional Popular Models
  -- ============================================
  IF kia_id IS NOT NULL THEN
    -- Kia Sportage
    SELECT id INTO kia_sportage_id FROM car_models WHERE brand_id = kia_id AND slug = 'sportage' LIMIT 1;
    IF kia_sportage_id IS NULL THEN
      INSERT INTO car_models (id, brand_id, name, slug, year_start, year_end, description, is_featured, display_order) VALUES
        (gen_random_uuid(), kia_id, 'Sportage', 'sportage', 1993, NULL, 'The Kia Sportage is a compact crossover SUV. Known for value, design, and available all-wheel drive.', true, 1)
      ON CONFLICT (brand_id, slug) DO NOTHING
      RETURNING id INTO kia_sportage_id;
    ELSE
      SELECT id INTO kia_sportage_id FROM car_models WHERE brand_id = kia_id AND slug = 'sportage' LIMIT 1;
    END IF;

    IF kia_sportage_id IS NOT NULL THEN
      -- 5th Gen (2022-Present) - Latest generation
      INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
      SELECT gen_random_uuid(), kia_sportage_id, '5th Gen (2022-Present)', '5th-gen-2022-present', 2022, NULL, '5th Gen', 'Fifth generation Sportage with updated design, advanced technology, and available 2.5L I4, 1.6L turbo, and hybrid powertrains.', true, 1
      WHERE NOT EXISTS (SELECT 1 FROM model_generations WHERE car_model_id = kia_sportage_id AND slug = '5th-gen-2022-present')
      ON CONFLICT (car_model_id, slug) DO NOTHING;
    END IF;

    -- Kia Sorento
    SELECT id INTO kia_sorento_id FROM car_models WHERE brand_id = kia_id AND slug = 'sorento' LIMIT 1;
    IF kia_sorento_id IS NULL THEN
      INSERT INTO car_models (id, brand_id, name, slug, year_start, year_end, description, is_featured, display_order) VALUES
        (gen_random_uuid(), kia_id, 'Sorento', 'sorento', 2002, NULL, 'The Kia Sorento is a mid-size crossover SUV. Known for three-row seating, value, and available all-wheel drive.', true, 2)
      ON CONFLICT (brand_id, slug) DO NOTHING
      RETURNING id INTO kia_sorento_id;
    ELSE
      SELECT id INTO kia_sorento_id FROM car_models WHERE brand_id = kia_id AND slug = 'sorento' LIMIT 1;
    END IF;

    IF kia_sorento_id IS NOT NULL THEN
      -- 4th Gen (2021-Present) - Latest generation
      INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
      SELECT gen_random_uuid(), kia_sorento_id, '4th Gen (2021-Present)', '4th-gen-2021-present', 2021, NULL, '4th Gen', 'Fourth generation Sorento with updated design, advanced technology, and available 2.5L I4, 2.5L turbo, and hybrid powertrains.', true, 1
      WHERE NOT EXISTS (SELECT 1 FROM model_generations WHERE car_model_id = kia_sorento_id AND slug = '4th-gen-2021-present')
      ON CONFLICT (car_model_id, slug) DO NOTHING;
    END IF;
  END IF;

  -- ============================================
  -- BMW - Additional Important Models
  -- ============================================
  IF bmw_id IS NOT NULL THEN
    -- BMW X1
    SELECT id INTO bmw_x1_id FROM car_models WHERE brand_id = bmw_id AND slug = 'x1' LIMIT 1;
    IF bmw_x1_id IS NULL THEN
      INSERT INTO car_models (id, brand_id, name, slug, year_start, year_end, description, is_featured, display_order) VALUES
        (gen_random_uuid(), bmw_id, 'X1', 'x1', 2009, NULL, 'The BMW X1 is a compact luxury crossover SUV. Known for sporty handling, premium interior, and available all-wheel drive.', true, 3)
      ON CONFLICT (brand_id, slug) DO NOTHING
      RETURNING id INTO bmw_x1_id;
    ELSE
      SELECT id INTO bmw_x1_id FROM car_models WHERE brand_id = bmw_id AND slug = 'x1' LIMIT 1;
    END IF;

    IF bmw_x1_id IS NOT NULL THEN
      -- U11 (2023-Present) - Latest generation
      INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
      SELECT gen_random_uuid(), bmw_x1_id, 'U11 (2023-Present)', 'u11-2023-present', 2023, NULL, 'U11', 'Third generation X1 with new platform, updated design, and available 2.0L turbo I4 and plug-in hybrid powertrains.', true, 1
      WHERE NOT EXISTS (SELECT 1 FROM model_generations WHERE car_model_id = bmw_x1_id AND slug = 'u11-2023-present')
      ON CONFLICT (car_model_id, slug) DO NOTHING;
    END IF;

    -- BMW X7
    SELECT id INTO bmw_x7_id FROM car_models WHERE brand_id = bmw_id AND slug = 'x7' LIMIT 1;
    IF bmw_x7_id IS NULL THEN
      INSERT INTO car_models (id, brand_id, name, slug, year_start, year_end, description, is_featured, display_order) VALUES
        (gen_random_uuid(), bmw_id, 'X7', 'x7', 2019, NULL, 'The BMW X7 is a full-size luxury SUV. Known for three-row seating, luxury features, and powerful engines.', true, 4)
      ON CONFLICT (brand_id, slug) DO NOTHING
      RETURNING id INTO bmw_x7_id;
    ELSE
      SELECT id INTO bmw_x7_id FROM car_models WHERE brand_id = bmw_id AND slug = 'x7' LIMIT 1;
    END IF;

    IF bmw_x7_id IS NOT NULL THEN
      -- G07 (2019-Present) - First generation
      INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
      SELECT gen_random_uuid(), bmw_x7_id, 'G07 (2019-Present)', 'g07-2019-present', 2019, NULL, 'G07', 'First generation X7 with 3.0L turbo I6, 4.4L twin-turbo V8, and available plug-in hybrid powertrains.', true, 1
      WHERE NOT EXISTS (SELECT 1 FROM model_generations WHERE car_model_id = bmw_x7_id AND slug = 'g07-2019-present')
      ON CONFLICT (car_model_id, slug) DO NOTHING;
    END IF;

    -- BMW 7 Series
    SELECT id INTO bmw_7_series_id FROM car_models WHERE brand_id = bmw_id AND slug = '7-series' LIMIT 1;
    IF bmw_7_series_id IS NULL THEN
      INSERT INTO car_models (id, brand_id, name, slug, year_start, year_end, description, is_featured, display_order) VALUES
        (gen_random_uuid(), bmw_id, '7 Series', '7-series', 1977, NULL, 'The BMW 7 Series is a full-size luxury sedan. Known for luxury, technology, and powerful engines.', true, 5)
      ON CONFLICT (brand_id, slug) DO NOTHING
      RETURNING id INTO bmw_7_series_id;
    ELSE
      SELECT id INTO bmw_7_series_id FROM car_models WHERE brand_id = bmw_id AND slug = '7-series' LIMIT 1;
    END IF;

    IF bmw_7_series_id IS NOT NULL THEN
      -- G70 (2023-Present) - Latest generation
      INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
      SELECT gen_random_uuid(), bmw_7_series_id, 'G70 (2023-Present)', 'g70-2023-present', 2023, NULL, 'G70', 'Seventh generation 7 Series with updated design, advanced technology, and available 3.0L turbo I6, 4.4L twin-turbo V8, and electric powertrains.', true, 1
      WHERE NOT EXISTS (SELECT 1 FROM model_generations WHERE car_model_id = bmw_7_series_id AND slug = 'g70-2023-present')
      ON CONFLICT (car_model_id, slug) DO NOTHING;
    END IF;
  END IF;

  -- ============================================
  -- MERCEDES-BENZ - Additional Important Models
  -- ============================================
  IF mercedes_id IS NOT NULL THEN
    -- Mercedes S-Class
    SELECT id INTO mercedes_s_class_id FROM car_models WHERE brand_id = mercedes_id AND slug = 's-class' LIMIT 1;
    IF mercedes_s_class_id IS NULL THEN
      INSERT INTO car_models (id, brand_id, name, slug, year_start, year_end, description, is_featured, display_order) VALUES
        (gen_random_uuid(), mercedes_id, 'S-Class', 's-class', 1972, NULL, 'The Mercedes S-Class is a full-size luxury sedan. Known for luxury, technology, and powerful engines.', true, 5)
      ON CONFLICT (brand_id, slug) DO NOTHING
      RETURNING id INTO mercedes_s_class_id;
    ELSE
      SELECT id INTO mercedes_s_class_id FROM car_models WHERE brand_id = mercedes_id AND slug = 's-class' LIMIT 1;
    END IF;

    IF mercedes_s_class_id IS NOT NULL THEN
      -- W223 (2021-Present) - Latest generation
      INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
      SELECT gen_random_uuid(), mercedes_s_class_id, 'W223 (2021-Present)', 'w223-2021-present', 2021, NULL, 'W223', 'Seventh generation S-Class with updated design, MBUX, and available 3.0L turbo I6, 4.0L twin-turbo V8, and plug-in hybrid powertrains.', true, 1
      WHERE NOT EXISTS (SELECT 1 FROM model_generations WHERE car_model_id = mercedes_s_class_id AND slug = 'w223-2021-present')
      ON CONFLICT (car_model_id, slug) DO NOTHING;
    END IF;

    -- Mercedes GLE
    SELECT id INTO mercedes_gle_id FROM car_models WHERE brand_id = mercedes_id AND slug = 'gle' LIMIT 1;
    IF mercedes_gle_id IS NULL THEN
      INSERT INTO car_models (id, brand_id, name, slug, year_start, year_end, description, is_featured, display_order) VALUES
        (gen_random_uuid(), mercedes_id, 'GLE', 'gle', 1997, NULL, 'The Mercedes GLE is a mid-size luxury SUV. Known for comfort, technology, and available AMG variants.', true, 5)
      ON CONFLICT (brand_id, slug) DO NOTHING
      RETURNING id INTO mercedes_gle_id;
    ELSE
      SELECT id INTO mercedes_gle_id FROM car_models WHERE brand_id = mercedes_id AND slug = 'gle' LIMIT 1;
    END IF;

    IF mercedes_gle_id IS NOT NULL THEN
      -- V167 (2019-Present) - Latest generation
      INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
      SELECT gen_random_uuid(), mercedes_gle_id, 'V167 (2019-Present)', 'v167-2019-present', 2019, NULL, 'V167', 'Second generation GLE with new platform, updated design, and available 2.0L turbo I4, 3.0L turbo I6, and plug-in hybrid powertrains.', true, 1
      WHERE NOT EXISTS (SELECT 1 FROM model_generations WHERE car_model_id = mercedes_gle_id AND slug = 'v167-2019-present')
      ON CONFLICT (car_model_id, slug) DO NOTHING;
    END IF;

    -- Mercedes GLS
    SELECT id INTO mercedes_gls_id FROM car_models WHERE brand_id = mercedes_id AND slug = 'gls' LIMIT 1;
    IF mercedes_gls_id IS NULL THEN
      INSERT INTO car_models (id, brand_id, name, slug, year_start, year_end, description, is_featured, display_order) VALUES
        (gen_random_uuid(), mercedes_id, 'GLS', 'gls', 2006, NULL, 'The Mercedes GLS is a full-size luxury SUV. Known for three-row seating, luxury, and powerful engines.', true, 6)
      ON CONFLICT (brand_id, slug) DO NOTHING
      RETURNING id INTO mercedes_gls_id;
    ELSE
      SELECT id INTO mercedes_gls_id FROM car_models WHERE brand_id = mercedes_id AND slug = 'gls' LIMIT 1;
    END IF;

    IF mercedes_gls_id IS NOT NULL THEN
      -- X167 (2020-Present) - Latest generation
      INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
      SELECT gen_random_uuid(), mercedes_gls_id, 'X167 (2020-Present)', 'x167-2020-present', 2020, NULL, 'X167', 'Second generation GLS with updated design, MBUX, and available 3.0L turbo I6, 4.0L twin-turbo V8, and AMG variants.', true, 1
      WHERE NOT EXISTS (SELECT 1 FROM model_generations WHERE car_model_id = mercedes_gls_id AND slug = 'x167-2020-present')
      ON CONFLICT (car_model_id, slug) DO NOTHING;
    END IF;
  END IF;

  -- ============================================
  -- AUDI - Additional Important Models
  -- ============================================
  IF audi_id IS NOT NULL THEN
    -- Audi A3
    SELECT id INTO audi_a3_id FROM car_models WHERE brand_id = audi_id AND slug = 'a3' LIMIT 1;
    IF audi_a3_id IS NULL THEN
      INSERT INTO car_models (id, brand_id, name, slug, year_start, year_end, description, is_featured, display_order) VALUES
        (gen_random_uuid(), audi_id, 'A3', 'a3', 1996, NULL, 'The Audi A3 is a compact executive car. Known for Quattro all-wheel drive, premium interior, and sporty performance.', true, 2)
      ON CONFLICT (brand_id, slug) DO NOTHING
      RETURNING id INTO audi_a3_id;
    ELSE
      SELECT id INTO audi_a3_id FROM car_models WHERE brand_id = audi_id AND slug = 'a3' LIMIT 1;
    END IF;

    IF audi_a3_id IS NOT NULL THEN
      -- 8Y (2020-Present) - Latest generation
      INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
      SELECT gen_random_uuid(), audi_a3_id, '8Y (2020-Present)', '8y-2020-present', 2020, NULL, '8Y', 'Fourth generation A3 with updated design, advanced technology, and available 1.5L turbo I4 and 2.0L turbo I4 engines.', true, 1
      WHERE NOT EXISTS (SELECT 1 FROM model_generations WHERE car_model_id = audi_a3_id AND slug = '8y-2020-present')
      ON CONFLICT (car_model_id, slug) DO NOTHING;
    END IF;

    -- Audi Q3
    SELECT id INTO audi_q3_id FROM car_models WHERE brand_id = audi_id AND slug = 'q3' LIMIT 1;
    IF audi_q3_id IS NULL THEN
      INSERT INTO car_models (id, brand_id, name, slug, year_start, year_end, description, is_featured, display_order) VALUES
        (gen_random_uuid(), audi_id, 'Q3', 'q3', 2011, NULL, 'The Audi Q3 is a compact luxury crossover SUV. Known for Quattro all-wheel drive, premium interior, and practicality.', true, 3)
      ON CONFLICT (brand_id, slug) DO NOTHING
      RETURNING id INTO audi_q3_id;
    ELSE
      SELECT id INTO audi_q3_id FROM car_models WHERE brand_id = audi_id AND slug = 'q3' LIMIT 1;
    END IF;

    IF audi_q3_id IS NOT NULL THEN
      -- 8U (2018-Present) - Latest generation
      INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
      SELECT gen_random_uuid(), audi_q3_id, '8U (2018-Present)', '8u-2018-present', 2018, NULL, '8U', 'Second generation Q3 with updated design, advanced technology, and available 2.0L turbo I4 engines.', true, 1
      WHERE NOT EXISTS (SELECT 1 FROM model_generations WHERE car_model_id = audi_q3_id AND slug = '8u-2018-present')
      ON CONFLICT (car_model_id, slug) DO NOTHING;
    END IF;

    -- Audi Q7
    SELECT id INTO audi_q7_id FROM car_models WHERE brand_id = audi_id AND slug = 'q7' LIMIT 1;
    IF audi_q7_id IS NULL THEN
      INSERT INTO car_models (id, brand_id, name, slug, year_start, year_end, description, is_featured, display_order) VALUES
        (gen_random_uuid(), audi_id, 'Q7', 'q7', 2005, NULL, 'The Audi Q7 is a full-size luxury SUV. Known for three-row seating, Quattro all-wheel drive, and powerful engines.', true, 4)
      ON CONFLICT (brand_id, slug) DO NOTHING
      RETURNING id INTO audi_q7_id;
    ELSE
      SELECT id INTO audi_q7_id FROM car_models WHERE brand_id = audi_id AND slug = 'q7' LIMIT 1;
    END IF;

    IF audi_q7_id IS NOT NULL THEN
      -- 4M (2015-Present) - Latest generation
      INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
      SELECT gen_random_uuid(), audi_q7_id, '4M (2015-Present)', '4m-2015-present', 2015, NULL, '4M', 'Second generation Q7 with updated design, advanced technology, and available 3.0L turbo V6, 4.0L twin-turbo V8, and plug-in hybrid powertrains.', true, 1
      WHERE NOT EXISTS (SELECT 1 FROM model_generations WHERE car_model_id = audi_q7_id AND slug = '4m-2015-present')
      ON CONFLICT (car_model_id, slug) DO NOTHING;
    END IF;
  END IF;

  -- ============================================
  -- VOLKSWAGEN - Additional Important Models
  -- ============================================
  IF volkswagen_id IS NOT NULL THEN
    -- VW Tiguan
    SELECT id INTO vw_tiguan_id FROM car_models WHERE brand_id = volkswagen_id AND slug = 'tiguan' LIMIT 1;
    IF vw_tiguan_id IS NULL THEN
      INSERT INTO car_models (id, brand_id, name, slug, year_start, year_end, description, is_featured, display_order) VALUES
        (gen_random_uuid(), volkswagen_id, 'Tiguan', 'tiguan', 2007, NULL, 'The Volkswagen Tiguan is a compact crossover SUV. Known for value, reliability, and available all-wheel drive.', true, 3)
      ON CONFLICT (brand_id, slug) DO NOTHING
      RETURNING id INTO vw_tiguan_id;
    ELSE
      SELECT id INTO vw_tiguan_id FROM car_models WHERE brand_id = volkswagen_id AND slug = 'tiguan' LIMIT 1;
    END IF;

    IF vw_tiguan_id IS NOT NULL THEN
      -- 2nd Gen (2018-Present) - Latest generation
      INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
      SELECT gen_random_uuid(), vw_tiguan_id, '2nd Gen (2018-Present)', '2nd-gen-2018-present', 2018, NULL, '2nd Gen', 'Second generation Tiguan with updated design, improved technology, and available 2.0L turbo I4 engine.', true, 1
      WHERE NOT EXISTS (SELECT 1 FROM model_generations WHERE car_model_id = vw_tiguan_id AND slug = '2nd-gen-2018-present')
      ON CONFLICT (car_model_id, slug) DO NOTHING;
    END IF;

    -- VW Atlas
    SELECT id INTO vw_atlas_id FROM car_models WHERE brand_id = volkswagen_id AND slug = 'atlas' LIMIT 1;
    IF vw_atlas_id IS NULL THEN
      INSERT INTO car_models (id, brand_id, name, slug, year_start, year_end, description, is_featured, display_order) VALUES
        (gen_random_uuid(), volkswagen_id, 'Atlas', 'atlas', 2017, NULL, 'The Volkswagen Atlas is a mid-size crossover SUV. Known for three-row seating, value, and available all-wheel drive.', true, 4)
      ON CONFLICT (brand_id, slug) DO NOTHING
      RETURNING id INTO vw_atlas_id;
    ELSE
      SELECT id INTO vw_atlas_id FROM car_models WHERE brand_id = volkswagen_id AND slug = 'atlas' LIMIT 1;
    END IF;

    IF vw_atlas_id IS NOT NULL THEN
      -- 1st Gen (2017-Present) - First generation
      INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
      SELECT gen_random_uuid(), vw_atlas_id, '1st Gen (2017-Present)', '1st-gen-2017-present', 2017, NULL, '1st Gen', 'First generation Atlas with 2.0L turbo I4 and 3.6L V6 engines. Available with front-wheel or all-wheel drive.', true, 1
      WHERE NOT EXISTS (SELECT 1 FROM model_generations WHERE car_model_id = vw_atlas_id AND slug = '1st-gen-2017-present')
      ON CONFLICT (car_model_id, slug) DO NOTHING;
    END IF;
  END IF;

  -- ============================================
  -- TOYOTA - Additional Important Models
  -- ============================================
  IF toyota_id IS NOT NULL THEN
    -- Toyota Corolla
    SELECT id INTO toyota_corolla_id FROM car_models WHERE brand_id = toyota_id AND slug = 'corolla' LIMIT 1;
    IF toyota_corolla_id IS NULL THEN
      INSERT INTO car_models (id, brand_id, name, slug, year_start, year_end, description, is_featured, display_order) VALUES
        (gen_random_uuid(), toyota_id, 'Corolla', 'corolla', 1966, NULL, 'The Toyota Corolla is a compact car. The best-selling car nameplate in the world. Known for reliability, fuel economy, and value.', true, 3)
      ON CONFLICT (brand_id, slug) DO NOTHING
      RETURNING id INTO toyota_corolla_id;
    ELSE
      SELECT id INTO toyota_corolla_id FROM car_models WHERE brand_id = toyota_id AND slug = 'corolla' LIMIT 1;
    END IF;

    IF toyota_corolla_id IS NOT NULL THEN
      -- E210 (2019-Present) - Latest generation
      INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
      SELECT gen_random_uuid(), toyota_corolla_id, 'E210 (2019-Present)', 'e210-2019-present', 2019, NULL, 'E210', 'Twelfth generation Corolla with new platform, updated design, and available 1.8L I4, 2.0L I4, and hybrid powertrains.', true, 1
      WHERE NOT EXISTS (SELECT 1 FROM model_generations WHERE car_model_id = toyota_corolla_id AND slug = 'e210-2019-present')
      ON CONFLICT (car_model_id, slug) DO NOTHING;
    END IF;

    -- Toyota Highlander
    SELECT id INTO toyota_highlander_id FROM car_models WHERE brand_id = toyota_id AND slug = 'highlander' LIMIT 1;
    IF toyota_highlander_id IS NULL THEN
      INSERT INTO car_models (id, brand_id, name, slug, year_start, year_end, description, is_featured, display_order) VALUES
        (gen_random_uuid(), toyota_id, 'Highlander', 'highlander', 2000, NULL, 'The Toyota Highlander is a mid-size crossover SUV. Known for reliability, three-row seating, and available hybrid powertrain.', true, 4)
      ON CONFLICT (brand_id, slug) DO NOTHING
      RETURNING id INTO toyota_highlander_id;
    ELSE
      SELECT id INTO toyota_highlander_id FROM car_models WHERE brand_id = toyota_id AND slug = 'highlander' LIMIT 1;
    END IF;

    IF toyota_highlander_id IS NOT NULL THEN
      -- XU70 (2020-Present) - Latest generation
      INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
      SELECT gen_random_uuid(), toyota_highlander_id, 'XU70 (2020-Present)', 'xu70-2020-present', 2020, NULL, 'XU70', 'Fourth generation Highlander with new platform, updated design, and available 3.5L V6 and 2.5L hybrid powertrains.', true, 1
      WHERE NOT EXISTS (SELECT 1 FROM model_generations WHERE car_model_id = toyota_highlander_id AND slug = 'xu70-2020-present')
      ON CONFLICT (car_model_id, slug) DO NOTHING;
    END IF;

    -- Toyota Prius
    SELECT id INTO toyota_prius_id FROM car_models WHERE brand_id = toyota_id AND slug = 'prius' LIMIT 1;
    IF toyota_prius_id IS NULL THEN
      INSERT INTO car_models (id, brand_id, name, slug, year_start, year_end, description, is_featured, display_order) VALUES
        (gen_random_uuid(), toyota_id, 'Prius', 'prius', 1997, NULL, 'The Toyota Prius is a hybrid compact car. Known for fuel economy, reliability, and pioneering hybrid technology.', true, 5)
      ON CONFLICT (brand_id, slug) DO NOTHING
      RETURNING id INTO toyota_prius_id;
    ELSE
      SELECT id INTO toyota_prius_id FROM car_models WHERE brand_id = toyota_id AND slug = 'prius' LIMIT 1;
    END IF;

    IF toyota_prius_id IS NOT NULL THEN
      -- 5th Gen (2023-Present) - Latest generation
      INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
      SELECT gen_random_uuid(), toyota_prius_id, '5th Gen (2023-Present)', '5th-gen-2023-present', 2023, NULL, '5th Gen', 'Fifth generation Prius with updated design, improved efficiency, and 2.0L hybrid powertrain.', true, 1
      WHERE NOT EXISTS (SELECT 1 FROM model_generations WHERE car_model_id = toyota_prius_id AND slug = '5th-gen-2023-present')
      ON CONFLICT (car_model_id, slug) DO NOTHING;
    END IF;
  END IF;

  -- ============================================
  -- HONDA - Additional Important Models
  -- ============================================
  IF honda_id IS NOT NULL THEN
    -- Honda Accord
    SELECT id INTO honda_accord_id FROM car_models WHERE brand_id = honda_id AND slug = 'accord' LIMIT 1;
    IF honda_accord_id IS NULL THEN
      INSERT INTO car_models (id, brand_id, name, slug, year_start, year_end, description, is_featured, display_order) VALUES
        (gen_random_uuid(), honda_id, 'Accord', 'accord', 1976, NULL, 'The Honda Accord is a mid-size sedan. One of the best-selling cars in America. Known for reliability, comfort, and value.', true, 3)
      ON CONFLICT (brand_id, slug) DO NOTHING
      RETURNING id INTO honda_accord_id;
    ELSE
      SELECT id INTO honda_accord_id FROM car_models WHERE brand_id = honda_id AND slug = 'accord' LIMIT 1;
    END IF;

    IF honda_accord_id IS NOT NULL THEN
      -- 11th Gen (2023-Present) - Latest generation
      INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
      SELECT gen_random_uuid(), honda_accord_id, '11th Gen (2023-Present)', '11th-gen-2023-present', 2023, NULL, '11th Gen', 'Eleventh generation Accord with updated design, improved technology, and available 1.5L turbo I4 and 2.0L hybrid powertrains.', true, 1
      WHERE NOT EXISTS (SELECT 1 FROM model_generations WHERE car_model_id = honda_accord_id AND slug = '11th-gen-2023-present')
      ON CONFLICT (car_model_id, slug) DO NOTHING;
    END IF;

    -- Honda Odyssey
    SELECT id INTO honda_odyssey_id FROM car_models WHERE brand_id = honda_id AND slug = 'odyssey' LIMIT 1;
    IF honda_odyssey_id IS NULL THEN
      INSERT INTO car_models (id, brand_id, name, slug, year_start, year_end, description, is_featured, display_order) VALUES
        (gen_random_uuid(), honda_id, 'Odyssey', 'odyssey', 1994, NULL, 'The Honda Odyssey is a minivan. Known for reliability, three-row seating, and family-friendly features.', true, 4)
      ON CONFLICT (brand_id, slug) DO NOTHING
      RETURNING id INTO honda_odyssey_id;
    ELSE
      SELECT id INTO honda_odyssey_id FROM car_models WHERE brand_id = honda_id AND slug = 'odyssey' LIMIT 1;
    END IF;

    IF honda_odyssey_id IS NOT NULL THEN
      -- 5th Gen (2018-Present) - Latest generation
      INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
      SELECT gen_random_uuid(), honda_odyssey_id, '5th Gen (2018-Present)', '5th-gen-2018-present', 2018, NULL, '5th Gen', 'Fifth generation Odyssey with updated design, improved technology, and 3.5L V6 engine.', true, 1
      WHERE NOT EXISTS (SELECT 1 FROM model_generations WHERE car_model_id = honda_odyssey_id AND slug = '5th-gen-2018-present')
      ON CONFLICT (car_model_id, slug) DO NOTHING;
    END IF;
  END IF;

  -- ============================================
  -- NISSAN - Additional Important Models
  -- ============================================
  IF nissan_id IS NOT NULL THEN
    -- Nissan Sentra
    SELECT id INTO nissan_sentra_id FROM car_models WHERE brand_id = nissan_id AND slug = 'sentra' LIMIT 1;
    IF nissan_sentra_id IS NULL THEN
      INSERT INTO car_models (id, brand_id, name, slug, year_start, year_end, description, is_featured, display_order) VALUES
        (gen_random_uuid(), nissan_id, 'Sentra', 'sentra', 1982, NULL, 'The Nissan Sentra is a compact sedan. Known for value, reliability, and fuel economy.', true, 2)
      ON CONFLICT (brand_id, slug) DO NOTHING
      RETURNING id INTO nissan_sentra_id;
    ELSE
      SELECT id INTO nissan_sentra_id FROM car_models WHERE brand_id = nissan_id AND slug = 'sentra' LIMIT 1;
    END IF;

    IF nissan_sentra_id IS NOT NULL THEN
      -- B18 (2020-Present) - Latest generation
      INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
      SELECT gen_random_uuid(), nissan_sentra_id, 'B18 (2020-Present)', 'b18-2020-present', 2020, NULL, 'B18', 'Eighth generation Sentra with updated design, improved technology, and 2.0L I4 engine.', true, 1
      WHERE NOT EXISTS (SELECT 1 FROM model_generations WHERE car_model_id = nissan_sentra_id AND slug = 'b18-2020-present')
      ON CONFLICT (car_model_id, slug) DO NOTHING;
    END IF;

    -- Nissan Maxima
    SELECT id INTO nissan_maxima_id FROM car_models WHERE brand_id = nissan_id AND slug = 'maxima' LIMIT 1;
    IF nissan_maxima_id IS NULL THEN
      INSERT INTO car_models (id, brand_id, name, slug, year_start, year_end, description, is_featured, display_order) VALUES
        (gen_random_uuid(), nissan_id, 'Maxima', 'maxima', 1981, NULL, 'The Nissan Maxima is a full-size sedan. Known for performance, technology, and V6 power.', true, 4)
      ON CONFLICT (brand_id, slug) DO NOTHING
      RETURNING id INTO nissan_maxima_id;
    ELSE
      SELECT id INTO nissan_maxima_id FROM car_models WHERE brand_id = nissan_id AND slug = 'maxima' LIMIT 1;
    END IF;

    IF nissan_maxima_id IS NOT NULL THEN
      -- A36 (2016-2023) - Latest generation
      INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
      SELECT gen_random_uuid(), nissan_maxima_id, 'A36 (2016-2023)', 'a36-2016-2023', 2016, 2023, 'A36', 'Eighth generation Maxima with updated design, improved technology, and 3.5L V6 engine.', true, 1
      WHERE NOT EXISTS (SELECT 1 FROM model_generations WHERE car_model_id = nissan_maxima_id AND slug = 'a36-2016-2023')
      ON CONFLICT (car_model_id, slug) DO NOTHING;
    END IF;
  END IF;

  -- ============================================
  -- FORD - Additional Important Models
  -- ============================================
  IF ford_id IS NOT NULL THEN
    -- Ford Escape
    SELECT id INTO ford_escape_id FROM car_models WHERE brand_id = ford_id AND slug = 'escape' LIMIT 1;
    IF ford_escape_id IS NULL THEN
      INSERT INTO car_models (id, brand_id, name, slug, year_start, year_end, description, is_featured, display_order) VALUES
        (gen_random_uuid(), ford_id, 'Escape', 'escape', 2000, NULL, 'The Ford Escape is a compact crossover SUV. One of the best-selling SUVs in America. Known for value, reliability, and available all-wheel drive.', true, 3)
      ON CONFLICT (brand_id, slug) DO NOTHING
      RETURNING id INTO ford_escape_id;
    ELSE
      SELECT id INTO ford_escape_id FROM car_models WHERE brand_id = ford_id AND slug = 'escape' LIMIT 1;
    END IF;

    IF ford_escape_id IS NOT NULL THEN
      -- 4th Gen (2020-Present) - Latest generation
      INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
      SELECT gen_random_uuid(), ford_escape_id, '4th Gen (2020-Present)', '4th-gen-2020-present', 2020, NULL, '4th Gen', 'Fourth generation Escape with updated design, improved technology, and available 1.5L turbo I3, 2.0L turbo I4, and hybrid powertrains.', true, 1
      WHERE NOT EXISTS (SELECT 1 FROM model_generations WHERE car_model_id = ford_escape_id AND slug = '4th-gen-2020-present')
      ON CONFLICT (car_model_id, slug) DO NOTHING;
    END IF;

    -- Ford Edge
    SELECT id INTO ford_edge_id FROM car_models WHERE brand_id = ford_id AND slug = 'edge' LIMIT 1;
    IF ford_edge_id IS NULL THEN
      INSERT INTO car_models (id, brand_id, name, slug, year_start, year_end, description, is_featured, display_order) VALUES
        (gen_random_uuid(), ford_id, 'Edge', 'edge', 2006, NULL, 'The Ford Edge is a mid-size crossover SUV. Known for value, reliability, and available all-wheel drive.', true, 4)
      ON CONFLICT (brand_id, slug) DO NOTHING
      RETURNING id INTO ford_edge_id;
    ELSE
      SELECT id INTO ford_edge_id FROM car_models WHERE brand_id = ford_id AND slug = 'edge' LIMIT 1;
    END IF;

    IF ford_edge_id IS NOT NULL THEN
      -- 2nd Gen (2019-Present) - Latest generation
      INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
      SELECT gen_random_uuid(), ford_edge_id, '2nd Gen (2019-Present)', '2nd-gen-2019-present', 2019, NULL, '2nd Gen', 'Second generation Edge with updated design, improved technology, and available 2.0L turbo I4 and 2.7L turbo V6 engines.', true, 1
      WHERE NOT EXISTS (SELECT 1 FROM model_generations WHERE car_model_id = ford_edge_id AND slug = '2nd-gen-2019-present')
      ON CONFLICT (car_model_id, slug) DO NOTHING;
    END IF;

    -- Ford Bronco
    SELECT id INTO ford_bronco_id FROM car_models WHERE brand_id = ford_id AND slug = 'bronco' LIMIT 1;
    IF ford_bronco_id IS NULL THEN
      INSERT INTO car_models (id, brand_id, name, slug, year_start, year_end, description, is_featured, display_order) VALUES
        (gen_random_uuid(), ford_id, 'Bronco', 'bronco', 1966, NULL, 'The Ford Bronco is an off-road SUV. Known for legendary capability, removable doors, and iconic design.', true, 5)
      ON CONFLICT (brand_id, slug) DO NOTHING
      RETURNING id INTO ford_bronco_id;
    ELSE
      SELECT id INTO ford_bronco_id FROM car_models WHERE brand_id = ford_id AND slug = 'bronco' LIMIT 1;
    END IF;

    IF ford_bronco_id IS NOT NULL THEN
      -- 6th Gen (2021-Present) - Latest generation
      INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
      SELECT gen_random_uuid(), ford_bronco_id, '6th Gen (2021-Present)', '6th-gen-2021-present', 2021, NULL, '6th Gen', 'Sixth generation Bronco with updated design, advanced technology, and available 2.3L turbo I4 and 2.7L turbo V6 engines.', true, 1
      WHERE NOT EXISTS (SELECT 1 FROM model_generations WHERE car_model_id = ford_bronco_id AND slug = '6th-gen-2021-present')
      ON CONFLICT (car_model_id, slug) DO NOTHING;
    END IF;
  END IF;

  -- ============================================
  -- CHEVROLET - Additional Important Models
  -- ============================================
  IF chevrolet_id IS NOT NULL THEN
    -- Chevrolet Tahoe
    SELECT id INTO chevrolet_tahoe_id FROM car_models WHERE brand_id = chevrolet_id AND slug = 'tahoe' LIMIT 1;
    IF chevrolet_tahoe_id IS NULL THEN
      INSERT INTO car_models (id, brand_id, name, slug, year_start, year_end, description, is_featured, display_order) VALUES
        (gen_random_uuid(), chevrolet_id, 'Tahoe', 'tahoe', 1995, NULL, 'The Chevrolet Tahoe is a full-size SUV. Known for towing capability, three-row seating, and powerful engines.', true, 3)
      ON CONFLICT (brand_id, slug) DO NOTHING
      RETURNING id INTO chevrolet_tahoe_id;
    ELSE
      SELECT id INTO chevrolet_tahoe_id FROM car_models WHERE brand_id = chevrolet_id AND slug = 'tahoe' LIMIT 1;
    END IF;

    IF chevrolet_tahoe_id IS NOT NULL THEN
      -- 5th Gen (2021-Present) - Latest generation
      INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
      SELECT gen_random_uuid(), chevrolet_tahoe_id, '5th Gen (2021-Present)', '5th-gen-2021-present', 2021, NULL, '5th Gen', 'Fifth generation Tahoe with updated design, advanced technology, and available 5.3L V8, 6.2L V8, and 3.0L diesel engines.', true, 1
      WHERE NOT EXISTS (SELECT 1 FROM model_generations WHERE car_model_id = chevrolet_tahoe_id AND slug = '5th-gen-2021-present')
      ON CONFLICT (car_model_id, slug) DO NOTHING;
    END IF;

    -- Chevrolet Suburban
    SELECT id INTO chevrolet_suburban_id FROM car_models WHERE brand_id = chevrolet_id AND slug = 'suburban' LIMIT 1;
    IF chevrolet_suburban_id IS NULL THEN
      INSERT INTO car_models (id, brand_id, name, slug, year_start, year_end, description, is_featured, display_order) VALUES
        (gen_random_uuid(), chevrolet_id, 'Suburban', 'suburban', 1935, NULL, 'The Chevrolet Suburban is a full-size SUV. Known for towing capability, three-row seating, and powerful engines.', true, 4)
      ON CONFLICT (brand_id, slug) DO NOTHING
      RETURNING id INTO chevrolet_suburban_id;
    ELSE
      SELECT id INTO chevrolet_suburban_id FROM car_models WHERE brand_id = chevrolet_id AND slug = 'suburban' LIMIT 1;
    END IF;

    IF chevrolet_suburban_id IS NOT NULL THEN
      -- 13th Gen (2021-Present) - Latest generation
      INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
      SELECT gen_random_uuid(), chevrolet_suburban_id, '13th Gen (2021-Present)', '13th-gen-2021-present', 2021, NULL, '13th Gen', 'Thirteenth generation Suburban with updated design, advanced technology, and available 5.3L V8, 6.2L V8, and 3.0L diesel engines.', true, 1
      WHERE NOT EXISTS (SELECT 1 FROM model_generations WHERE car_model_id = chevrolet_suburban_id AND slug = '13th-gen-2021-present')
      ON CONFLICT (car_model_id, slug) DO NOTHING;
    END IF;

    -- Chevrolet Traverse
    SELECT id INTO chevrolet_traverse_id FROM car_models WHERE brand_id = chevrolet_id AND slug = 'traverse' LIMIT 1;
    IF chevrolet_traverse_id IS NULL THEN
      INSERT INTO car_models (id, brand_id, name, slug, year_start, year_end, description, is_featured, display_order) VALUES
        (gen_random_uuid(), chevrolet_id, 'Traverse', 'traverse', 2009, NULL, 'The Chevrolet Traverse is a mid-size crossover SUV. Known for three-row seating, value, and available all-wheel drive.', true, 5)
      ON CONFLICT (brand_id, slug) DO NOTHING
      RETURNING id INTO chevrolet_traverse_id;
    ELSE
      SELECT id INTO chevrolet_traverse_id FROM car_models WHERE brand_id = chevrolet_id AND slug = 'traverse' LIMIT 1;
    END IF;

    IF chevrolet_traverse_id IS NOT NULL THEN
      -- 2nd Gen (2018-Present) - Latest generation
      INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
      SELECT gen_random_uuid(), chevrolet_traverse_id, '2nd Gen (2018-Present)', '2nd-gen-2018-present', 2018, NULL, '2nd Gen', 'Second generation Traverse with updated design, improved technology, and 3.6L V6 engine.', true, 1
      WHERE NOT EXISTS (SELECT 1 FROM model_generations WHERE car_model_id = chevrolet_traverse_id AND slug = '2nd-gen-2018-present')
      ON CONFLICT (car_model_id, slug) DO NOTHING;
    END IF;
  END IF;

  -- ============================================
  -- HYUNDAI - Additional Important Models
  -- ============================================
  IF hyundai_id IS NOT NULL THEN
    -- Hyundai Sonata
    SELECT id INTO hyundai_sonata_id FROM car_models WHERE brand_id = hyundai_id AND slug = 'sonata' LIMIT 1;
    IF hyundai_sonata_id IS NULL THEN
      INSERT INTO car_models (id, brand_id, name, slug, year_start, year_end, description, is_featured, display_order) VALUES
        (gen_random_uuid(), hyundai_id, 'Sonata', 'sonata', 1985, NULL, 'The Hyundai Sonata is a mid-size sedan. Known for value, reliability, and available technology.', true, 4)
      ON CONFLICT (brand_id, slug) DO NOTHING
      RETURNING id INTO hyundai_sonata_id;
    ELSE
      SELECT id INTO hyundai_sonata_id FROM car_models WHERE brand_id = hyundai_id AND slug = 'sonata' LIMIT 1;
    END IF;

    IF hyundai_sonata_id IS NOT NULL THEN
      -- 8th Gen (2020-Present) - Latest generation
      INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
      SELECT gen_random_uuid(), hyundai_sonata_id, '8th Gen (2020-Present)', '8th-gen-2020-present', 2020, NULL, '8th Gen', 'Eighth generation Sonata with updated design, advanced technology, and available 2.5L I4, 1.6L turbo, and hybrid powertrains.', true, 1
      WHERE NOT EXISTS (SELECT 1 FROM model_generations WHERE car_model_id = hyundai_sonata_id AND slug = '8th-gen-2020-present')
      ON CONFLICT (car_model_id, slug) DO NOTHING;
    END IF;

    -- Hyundai Santa Fe
    SELECT id INTO hyundai_santa_fe_id FROM car_models WHERE brand_id = hyundai_id AND slug = 'santa-fe' LIMIT 1;
    IF hyundai_santa_fe_id IS NULL THEN
      INSERT INTO car_models (id, brand_id, name, slug, year_start, year_end, description, is_featured, display_order) VALUES
        (gen_random_uuid(), hyundai_id, 'Santa Fe', 'santa-fe', 2000, NULL, 'The Hyundai Santa Fe is a mid-size crossover SUV. Known for value, reliability, and available all-wheel drive.', true, 5)
      ON CONFLICT (brand_id, slug) DO NOTHING
      RETURNING id INTO hyundai_santa_fe_id;
    ELSE
      SELECT id INTO hyundai_santa_fe_id FROM car_models WHERE brand_id = hyundai_id AND slug = 'santa-fe' LIMIT 1;
    END IF;

    IF hyundai_santa_fe_id IS NOT NULL THEN
      -- 4th Gen (2019-Present) - Latest generation
      INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
      SELECT gen_random_uuid(), hyundai_santa_fe_id, '4th Gen (2019-Present)', '4th-gen-2019-present', 2019, NULL, '4th Gen', 'Fourth generation Santa Fe with updated design, advanced technology, and available 2.5L I4, 2.5L turbo, and hybrid powertrains.', true, 1
      WHERE NOT EXISTS (SELECT 1 FROM model_generations WHERE car_model_id = hyundai_santa_fe_id AND slug = '4th-gen-2019-present')
      ON CONFLICT (car_model_id, slug) DO NOTHING;
    END IF;

    -- Hyundai Palisade
    SELECT id INTO hyundai_palisade_id FROM car_models WHERE brand_id = hyundai_id AND slug = 'palisade' LIMIT 1;
    IF hyundai_palisade_id IS NULL THEN
      INSERT INTO car_models (id, brand_id, name, slug, year_start, year_end, description, is_featured, display_order) VALUES
        (gen_random_uuid(), hyundai_id, 'Palisade', 'palisade', 2019, NULL, 'The Hyundai Palisade is a full-size crossover SUV. Known for three-row seating, value, and available all-wheel drive.', true, 6)
      ON CONFLICT (brand_id, slug) DO NOTHING
      RETURNING id INTO hyundai_palisade_id;
    ELSE
      SELECT id INTO hyundai_palisade_id FROM car_models WHERE brand_id = hyundai_id AND slug = 'palisade' LIMIT 1;
    END IF;

    IF hyundai_palisade_id IS NOT NULL THEN
      -- 1st Gen (2019-Present) - First generation
      INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
      SELECT gen_random_uuid(), hyundai_palisade_id, '1st Gen (2019-Present)', '1st-gen-2019-present', 2019, NULL, '1st Gen', 'First generation Palisade with 3.8L V6 engine. Available with front-wheel or all-wheel drive.', true, 1
      WHERE NOT EXISTS (SELECT 1 FROM model_generations WHERE car_model_id = hyundai_palisade_id AND slug = '1st-gen-2019-present')
      ON CONFLICT (car_model_id, slug) DO NOTHING;
    END IF;
  END IF;

  -- ============================================
  -- KIA - Additional Important Models
  -- ============================================
  IF kia_id IS NOT NULL THEN
    -- Kia Telluride
    SELECT id INTO kia_telluride_id FROM car_models WHERE brand_id = kia_id AND slug = 'telluride' LIMIT 1;
    IF kia_telluride_id IS NULL THEN
      INSERT INTO car_models (id, brand_id, name, slug, year_start, year_end, description, is_featured, display_order) VALUES
        (gen_random_uuid(), kia_id, 'Telluride', 'telluride', 2019, NULL, 'The Kia Telluride is a full-size crossover SUV. Known for three-row seating, value, and available all-wheel drive.', true, 3)
      ON CONFLICT (brand_id, slug) DO NOTHING
      RETURNING id INTO kia_telluride_id;
    ELSE
      SELECT id INTO kia_telluride_id FROM car_models WHERE brand_id = kia_id AND slug = 'telluride' LIMIT 1;
    END IF;

    IF kia_telluride_id IS NOT NULL THEN
      -- 1st Gen (2019-Present) - First generation
      INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
      SELECT gen_random_uuid(), kia_telluride_id, '1st Gen (2019-Present)', '1st-gen-2019-present', 2019, NULL, '1st Gen', 'First generation Telluride with 3.8L V6 engine. Available with front-wheel or all-wheel drive.', true, 1
      WHERE NOT EXISTS (SELECT 1 FROM model_generations WHERE car_model_id = kia_telluride_id AND slug = '1st-gen-2019-present')
      ON CONFLICT (car_model_id, slug) DO NOTHING;
    END IF;

    -- Kia EV6
    SELECT id INTO kia_ev6_id FROM car_models WHERE brand_id = kia_id AND slug = 'ev6' LIMIT 1;
    IF kia_ev6_id IS NULL THEN
      INSERT INTO car_models (id, brand_id, name, slug, year_start, year_end, description, is_featured, display_order) VALUES
        (gen_random_uuid(), kia_id, 'EV6', 'ev6', 2021, NULL, 'The Kia EV6 is an electric compact crossover SUV. Known for range, technology, and fast charging capability.', true, 4)
      ON CONFLICT (brand_id, slug) DO NOTHING
      RETURNING id INTO kia_ev6_id;
    ELSE
      SELECT id INTO kia_ev6_id FROM car_models WHERE brand_id = kia_id AND slug = 'ev6' LIMIT 1;
    END IF;

    IF kia_ev6_id IS NOT NULL THEN
      -- 1st Gen (2021-Present) - First generation
      INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
      SELECT gen_random_uuid(), kia_ev6_id, '1st Gen (2021-Present)', '1st-gen-2021-present', 2021, NULL, '1st Gen', 'First generation EV6 with rear-wheel or all-wheel drive, long range, and fast charging capability.', true, 1
      WHERE NOT EXISTS (SELECT 1 FROM model_generations WHERE car_model_id = kia_ev6_id AND slug = '1st-gen-2021-present')
      ON CONFLICT (car_model_id, slug) DO NOTHING;
    END IF;
  END IF;

  -- ============================================
  -- VOLVO - Additional Important Models
  -- ============================================
  IF volvo_id IS NOT NULL THEN
    -- Volvo XC40
    SELECT id INTO volvo_xc40_id FROM car_models WHERE brand_id = volvo_id AND slug = 'xc40' LIMIT 1;
    IF volvo_xc40_id IS NULL THEN
      INSERT INTO car_models (id, brand_id, name, slug, year_start, year_end, description, is_featured, display_order) VALUES
        (gen_random_uuid(), volvo_id, 'XC40', 'xc40', 2017, NULL, 'The Volvo XC40 is a compact luxury crossover SUV. Known for safety, Scandinavian design, and available plug-in hybrid powertrains.', true, 3)
      ON CONFLICT (brand_id, slug) DO NOTHING
      RETURNING id INTO volvo_xc40_id;
    ELSE
      SELECT id INTO volvo_xc40_id FROM car_models WHERE brand_id = volvo_id AND slug = 'xc40' LIMIT 1;
    END IF;

    IF volvo_xc40_id IS NOT NULL THEN
      -- 1st Gen (2017-Present) - First generation
      INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
      SELECT gen_random_uuid(), volvo_xc40_id, '1st Gen (2017-Present)', '1st-gen-2017-present', 2017, NULL, '1st Gen', 'First generation XC40 with 2.0L turbo I4 and plug-in hybrid powertrains. Available with front-wheel or all-wheel drive.', true, 1
      WHERE NOT EXISTS (SELECT 1 FROM model_generations WHERE car_model_id = volvo_xc40_id AND slug = '1st-gen-2017-present')
      ON CONFLICT (car_model_id, slug) DO NOTHING;
    END IF;
  END IF;

  -- ============================================
  -- TESLA - Additional Important Models
  -- ============================================
  IF tesla_id IS NOT NULL THEN
    -- Tesla Model S
    SELECT id INTO tesla_model_s_id FROM car_models WHERE brand_id = tesla_id AND slug = 'model-s' LIMIT 1;
    IF tesla_model_s_id IS NULL THEN
      INSERT INTO car_models (id, brand_id, name, slug, year_start, year_end, description, is_featured, display_order) VALUES
        (gen_random_uuid(), tesla_id, 'Model S', 'model-s', 2012, NULL, 'The Tesla Model S is an electric full-size sedan. Known for range, performance, and advanced technology.', true, 3)
      ON CONFLICT (brand_id, slug) DO NOTHING
      RETURNING id INTO tesla_model_s_id;
    ELSE
      SELECT id INTO tesla_model_s_id FROM car_models WHERE brand_id = tesla_id AND slug = 'model-s' LIMIT 1;
    END IF;

    IF tesla_model_s_id IS NOT NULL THEN
      -- Refresh (2021-Present) - Latest refresh
      INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
      SELECT gen_random_uuid(), tesla_model_s_id, 'Refresh (2021-Present)', 'refresh-2021-present', 2021, NULL, 'Refresh', 'Model S refresh with updated design, improved range, Plaid variant, and enhanced technology.', true, 1
      WHERE NOT EXISTS (SELECT 1 FROM model_generations WHERE car_model_id = tesla_model_s_id AND slug = 'refresh-2021-present')
      ON CONFLICT (car_model_id, slug) DO NOTHING;
    END IF;

    -- Tesla Model X
    SELECT id INTO tesla_model_x_id FROM car_models WHERE brand_id = tesla_id AND slug = 'model-x' LIMIT 1;
    IF tesla_model_x_id IS NULL THEN
      INSERT INTO car_models (id, brand_id, name, slug, year_start, year_end, description, is_featured, display_order) VALUES
        (gen_random_uuid(), tesla_id, 'Model X', 'model-x', 2015, NULL, 'The Tesla Model X is an electric mid-size crossover SUV. Known for falcon-wing doors, range, and performance.', true, 4)
      ON CONFLICT (brand_id, slug) DO NOTHING
      RETURNING id INTO tesla_model_x_id;
    ELSE
      SELECT id INTO tesla_model_x_id FROM car_models WHERE brand_id = tesla_id AND slug = 'model-x' LIMIT 1;
    END IF;

    IF tesla_model_x_id IS NOT NULL THEN
      -- Refresh (2021-Present) - Latest refresh
      INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
      SELECT gen_random_uuid(), tesla_model_x_id, 'Refresh (2021-Present)', 'refresh-2021-present', 2021, NULL, 'Refresh', 'Model X refresh with updated design, improved range, Plaid variant, and enhanced technology.', true, 1
      WHERE NOT EXISTS (SELECT 1 FROM model_generations WHERE car_model_id = tesla_model_x_id AND slug = 'refresh-2021-present')
      ON CONFLICT (car_model_id, slug) DO NOTHING;
    END IF;
  END IF;

  -- ============================================
  -- MAZDA - Additional Important Models
  -- ============================================
  IF mazda_id IS NOT NULL THEN
    -- Mazda 3
    SELECT id INTO mazda_3_id FROM car_models WHERE brand_id = mazda_id AND slug = '3' LIMIT 1;
    IF mazda_3_id IS NULL THEN
      INSERT INTO car_models (id, brand_id, name, slug, year_start, year_end, description, is_featured, display_order) VALUES
        (gen_random_uuid(), mazda_id, '3', '3', 2003, NULL, 'The Mazda 3 is a compact car. Known for driving dynamics, design, and value.', true, 3)
      ON CONFLICT (brand_id, slug) DO NOTHING
      RETURNING id INTO mazda_3_id;
    ELSE
      SELECT id INTO mazda_3_id FROM car_models WHERE brand_id = mazda_id AND slug = '3' LIMIT 1;
    END IF;

    IF mazda_3_id IS NOT NULL THEN
      -- 4th Gen (2019-Present) - Latest generation
      INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
      SELECT gen_random_uuid(), mazda_3_id, '4th Gen (2019-Present)', '4th-gen-2019-present', 2019, NULL, '4th Gen', 'Fourth generation Mazda 3 with updated design, improved technology, and available 2.0L I4, 2.5L I4, and 2.5L turbo I4 engines.', true, 1
      WHERE NOT EXISTS (SELECT 1 FROM model_generations WHERE car_model_id = mazda_3_id AND slug = '4th-gen-2019-present')
      ON CONFLICT (car_model_id, slug) DO NOTHING;
    END IF;

    -- Mazda CX-30
    SELECT id INTO mazda_cx30_id FROM car_models WHERE brand_id = mazda_id AND slug = 'cx-30' LIMIT 1;
    IF mazda_cx30_id IS NULL THEN
      INSERT INTO car_models (id, brand_id, name, slug, year_start, year_end, description, is_featured, display_order) VALUES
        (gen_random_uuid(), mazda_id, 'CX-30', 'cx-30', 2019, NULL, 'The Mazda CX-30 is a subcompact crossover SUV. Known for driving dynamics, design, and value.', true, 4)
      ON CONFLICT (brand_id, slug) DO NOTHING
      RETURNING id INTO mazda_cx30_id;
    ELSE
      SELECT id INTO mazda_cx30_id FROM car_models WHERE brand_id = mazda_id AND slug = 'cx-30' LIMIT 1;
    END IF;

    IF mazda_cx30_id IS NOT NULL THEN
      -- 1st Gen (2019-Present) - First generation
      INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
      SELECT gen_random_uuid(), mazda_cx30_id, '1st Gen (2019-Present)', '1st-gen-2019-present', 2019, NULL, '1st Gen', 'First generation CX-30 with 2.0L I4 and 2.5L I4 engines. Available with front-wheel or all-wheel drive.', true, 1
      WHERE NOT EXISTS (SELECT 1 FROM model_generations WHERE car_model_id = mazda_cx30_id AND slug = '1st-gen-2019-present')
      ON CONFLICT (car_model_id, slug) DO NOTHING;
    END IF;
  END IF;

  -- ============================================
  -- SUBARU - Additional Important Models
  -- ============================================
  IF subaru_id IS NOT NULL THEN
    -- Subaru Ascent
    SELECT id INTO subaru_ascent_id FROM car_models WHERE brand_id = subaru_id AND slug = 'ascent' LIMIT 1;
    IF subaru_ascent_id IS NULL THEN
      INSERT INTO car_models (id, brand_id, name, slug, year_start, year_end, description, is_featured, display_order) VALUES
        (gen_random_uuid(), subaru_id, 'Ascent', 'ascent', 2019, NULL, 'The Subaru Ascent is a mid-size crossover SUV. Known for three-row seating, all-wheel drive, and reliability.', true, 3)
      ON CONFLICT (brand_id, slug) DO NOTHING
      RETURNING id INTO subaru_ascent_id;
    ELSE
      SELECT id INTO subaru_ascent_id FROM car_models WHERE brand_id = subaru_id AND slug = 'ascent' LIMIT 1;
    END IF;

    IF subaru_ascent_id IS NOT NULL THEN
      -- 1st Gen (2019-Present) - First generation
      INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
      SELECT gen_random_uuid(), subaru_ascent_id, '1st Gen (2019-Present)', '1st-gen-2019-present', 2019, NULL, '1st Gen', 'First generation Ascent with 2.4L turbo flat-4 engine and standard all-wheel drive.', true, 1
      WHERE NOT EXISTS (SELECT 1 FROM model_generations WHERE car_model_id = subaru_ascent_id AND slug = '1st-gen-2019-present')
      ON CONFLICT (car_model_id, slug) DO NOTHING;
    END IF;

    -- Subaru Crosstrek
    SELECT id INTO subaru_crosstrek_id FROM car_models WHERE brand_id = subaru_id AND slug = 'crosstrek' LIMIT 1;
    IF subaru_crosstrek_id IS NULL THEN
      INSERT INTO car_models (id, brand_id, name, slug, year_start, year_end, description, is_featured, display_order) VALUES
        (gen_random_uuid(), subaru_id, 'Crosstrek', 'crosstrek', 2012, NULL, 'The Subaru Crosstrek is a subcompact crossover SUV. Known for all-wheel drive, reliability, and off-road capability.', true, 4)
      ON CONFLICT (brand_id, slug) DO NOTHING
      RETURNING id INTO subaru_crosstrek_id;
    ELSE
      SELECT id INTO subaru_crosstrek_id FROM car_models WHERE brand_id = subaru_id AND slug = 'crosstrek' LIMIT 1;
    END IF;

    IF subaru_crosstrek_id IS NOT NULL THEN
      -- 2nd Gen (2018-Present) - Latest generation
      INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
      SELECT gen_random_uuid(), subaru_crosstrek_id, '2nd Gen (2018-Present)', '2nd-gen-2018-present', 2018, NULL, '2nd Gen', 'Second generation Crosstrek with updated design, improved technology, and available 2.0L flat-4 and 2.5L flat-4 engines.', true, 1
      WHERE NOT EXISTS (SELECT 1 FROM model_generations WHERE car_model_id = subaru_crosstrek_id AND slug = '2nd-gen-2018-present')
      ON CONFLICT (car_model_id, slug) DO NOTHING;
    END IF;
  END IF;

  -- ============================================
  -- JEEP - Additional Important Models
  -- ============================================
  IF jeep_id IS NOT NULL THEN
    -- Jeep Cherokee
    SELECT id INTO jeep_cherokee_id FROM car_models WHERE brand_id = jeep_id AND slug = 'cherokee' LIMIT 1;
    IF jeep_cherokee_id IS NULL THEN
      INSERT INTO car_models (id, brand_id, name, slug, year_start, year_end, description, is_featured, display_order) VALUES
        (gen_random_uuid(), jeep_id, 'Cherokee', 'cherokee', 1974, NULL, 'The Jeep Cherokee is a compact crossover SUV. Known for capability, value, and available all-wheel drive.', true, 3)
      ON CONFLICT (brand_id, slug) DO NOTHING
      RETURNING id INTO jeep_cherokee_id;
    ELSE
      SELECT id INTO jeep_cherokee_id FROM car_models WHERE brand_id = jeep_id AND slug = 'cherokee' LIMIT 1;
    END IF;

    IF jeep_cherokee_id IS NOT NULL THEN
      -- KL (2014-Present) - Latest generation
      INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
      SELECT gen_random_uuid(), jeep_cherokee_id, 'KL (2014-Present)', 'kl-2014-present', 2014, NULL, 'KL', 'Fifth generation Cherokee with updated design, improved technology, and available 2.4L I4, 3.2L V6, and 2.0L turbo I4 engines.', true, 1
      WHERE NOT EXISTS (SELECT 1 FROM model_generations WHERE car_model_id = jeep_cherokee_id AND slug = 'kl-2014-present')
      ON CONFLICT (car_model_id, slug) DO NOTHING;
    END IF;

    -- Jeep Compass
    SELECT id INTO jeep_compass_id FROM car_models WHERE brand_id = jeep_id AND slug = 'compass' LIMIT 1;
    IF jeep_compass_id IS NULL THEN
      INSERT INTO car_models (id, brand_id, name, slug, year_start, year_end, description, is_featured, display_order) VALUES
        (gen_random_uuid(), jeep_id, 'Compass', 'compass', 2007, NULL, 'The Jeep Compass is a compact crossover SUV. Known for value, capability, and available all-wheel drive.', true, 4)
      ON CONFLICT (brand_id, slug) DO NOTHING
      RETURNING id INTO jeep_compass_id;
    ELSE
      SELECT id INTO jeep_compass_id FROM car_models WHERE brand_id = jeep_id AND slug = 'compass' LIMIT 1;
    END IF;

    IF jeep_compass_id IS NOT NULL THEN
      -- 2nd Gen (2017-Present) - Latest generation
      INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
      SELECT gen_random_uuid(), jeep_compass_id, '2nd Gen (2017-Present)', '2nd-gen-2017-present', 2017, NULL, '2nd Gen', 'Second generation Compass with updated design, improved technology, and available 2.4L I4 and 1.3L turbo I4 engines.', true, 1
      WHERE NOT EXISTS (SELECT 1 FROM model_generations WHERE car_model_id = jeep_compass_id AND slug = '2nd-gen-2017-present')
      ON CONFLICT (car_model_id, slug) DO NOTHING;
    END IF;
  END IF;

  -- ============================================
  -- PORSCHE - Important Models
  -- ============================================
  IF porsche_id IS NOT NULL THEN
    -- Porsche Cayenne
    SELECT id INTO porsche_cayenne_id FROM car_models WHERE brand_id = porsche_id AND slug = 'cayenne' LIMIT 1;
    IF porsche_cayenne_id IS NULL THEN
      INSERT INTO car_models (id, brand_id, name, slug, year_start, year_end, description, is_featured, display_order) VALUES
        (gen_random_uuid(), porsche_id, 'Cayenne', 'cayenne', 2002, NULL, 'The Porsche Cayenne is a luxury mid-size SUV. Known for performance, luxury, and powerful engines.', true, 1)
      ON CONFLICT (brand_id, slug) DO NOTHING
      RETURNING id INTO porsche_cayenne_id;
    ELSE
      SELECT id INTO porsche_cayenne_id FROM car_models WHERE brand_id = porsche_id AND slug = 'cayenne' LIMIT 1;
    END IF;

    IF porsche_cayenne_id IS NOT NULL THEN
      -- 3rd Gen (2019-Present) - Latest generation
      INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
      SELECT gen_random_uuid(), porsche_cayenne_id, '3rd Gen (2019-Present)', '3rd-gen-2019-present', 2019, NULL, '3rd Gen', 'Third generation Cayenne with updated design, advanced technology, and available 3.0L turbo V6, 2.9L twin-turbo V6, and 4.0L twin-turbo V8 engines.', true, 1
      WHERE NOT EXISTS (SELECT 1 FROM model_generations WHERE car_model_id = porsche_cayenne_id AND slug = '3rd-gen-2019-present')
      ON CONFLICT (car_model_id, slug) DO NOTHING;
    END IF;

    -- Porsche Macan
    SELECT id INTO porsche_macan_id FROM car_models WHERE brand_id = porsche_id AND slug = 'macan' LIMIT 1;
    IF porsche_macan_id IS NULL THEN
      INSERT INTO car_models (id, brand_id, name, slug, year_start, year_end, description, is_featured, display_order) VALUES
        (gen_random_uuid(), porsche_id, 'Macan', 'macan', 2014, NULL, 'The Porsche Macan is a luxury compact crossover SUV. Known for performance, handling, and powerful engines.', true, 2)
      ON CONFLICT (brand_id, slug) DO NOTHING
      RETURNING id INTO porsche_macan_id;
    ELSE
      SELECT id INTO porsche_macan_id FROM car_models WHERE brand_id = porsche_id AND slug = 'macan' LIMIT 1;
    END IF;

    IF porsche_macan_id IS NOT NULL THEN
      -- 2nd Gen (2024-Present) - Latest generation
      INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
      SELECT gen_random_uuid(), porsche_macan_id, '2nd Gen (2024-Present)', '2nd-gen-2024-present', 2024, NULL, '2nd Gen', 'Second generation Macan with updated design, advanced technology, and available 2.0L turbo I4, 2.9L twin-turbo V6, and 4.0L twin-turbo V8 engines.', true, 1
      WHERE NOT EXISTS (SELECT 1 FROM model_generations WHERE car_model_id = porsche_macan_id AND slug = '2nd-gen-2024-present')
      ON CONFLICT (car_model_id, slug) DO NOTHING;
    END IF;
  END IF;

  -- ============================================
  -- DODGE - Important Models
  -- ============================================
  IF dodge_id IS NOT NULL THEN
    -- Dodge Charger
    SELECT id INTO dodge_charger_id FROM car_models WHERE brand_id = dodge_id AND slug = 'charger' LIMIT 1;
    IF dodge_charger_id IS NULL THEN
      INSERT INTO car_models (id, brand_id, name, slug, year_start, year_end, description, is_featured, display_order) VALUES
        (gen_random_uuid(), dodge_id, 'Charger', 'charger', 1966, NULL, 'The Dodge Charger is a full-size sedan. Known for performance, V8 engines, and powerful variants.', true, 1)
      ON CONFLICT (brand_id, slug) DO NOTHING
      RETURNING id INTO dodge_charger_id;
    ELSE
      SELECT id INTO dodge_charger_id FROM car_models WHERE brand_id = dodge_id AND slug = 'charger' LIMIT 1;
    END IF;

    IF dodge_charger_id IS NOT NULL THEN
      -- LD (2011-Present) - Latest generation
      INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
      SELECT gen_random_uuid(), dodge_charger_id, 'LD (2011-Present)', 'ld-2011-present', 2011, NULL, 'LD', 'Seventh generation Charger with updated design, available 3.6L V6, 5.7L V8, 6.4L V8, and 6.2L supercharged V8 engines.', true, 1
      WHERE NOT EXISTS (SELECT 1 FROM model_generations WHERE car_model_id = dodge_charger_id AND slug = 'ld-2011-present')
      ON CONFLICT (car_model_id, slug) DO NOTHING;
    END IF;

    -- Dodge Challenger
    SELECT id INTO dodge_challenger_id FROM car_models WHERE brand_id = dodge_id AND slug = 'challenger' LIMIT 1;
    IF dodge_challenger_id IS NULL THEN
      INSERT INTO car_models (id, brand_id, name, slug, year_start, year_end, description, is_featured, display_order) VALUES
        (gen_random_uuid(), dodge_id, 'Challenger', 'challenger', 1970, NULL, 'The Dodge Challenger is a muscle car. Known for performance, V8 engines, and powerful variants.', true, 2)
      ON CONFLICT (brand_id, slug) DO NOTHING
      RETURNING id INTO dodge_challenger_id;
    ELSE
      SELECT id INTO dodge_challenger_id FROM car_models WHERE brand_id = dodge_id AND slug = 'challenger' LIMIT 1;
    END IF;

    IF dodge_challenger_id IS NOT NULL THEN
      -- 3rd Gen (2008-2023) - Latest generation
      INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
      SELECT gen_random_uuid(), dodge_challenger_id, '3rd Gen (2008-2023)', '3rd-gen-2008-2023', 2008, 2023, '3rd Gen', 'Third generation Challenger with available 3.6L V6, 5.7L V8, 6.4L V8, and 6.2L supercharged V8 engines.', true, 1
      WHERE NOT EXISTS (SELECT 1 FROM model_generations WHERE car_model_id = dodge_challenger_id AND slug = '3rd-gen-2008-2023')
      ON CONFLICT (car_model_id, slug) DO NOTHING;
    END IF;
  END IF;

  -- ============================================
  -- CADILLAC - Important Models
  -- ============================================
  IF cadillac_id IS NOT NULL THEN
    -- Cadillac Escalade
    SELECT id INTO cadillac_escalade_id FROM car_models WHERE brand_id = cadillac_id AND slug = 'escalade' LIMIT 1;
    IF cadillac_escalade_id IS NULL THEN
      INSERT INTO car_models (id, brand_id, name, slug, year_start, year_end, description, is_featured, display_order) VALUES
        (gen_random_uuid(), cadillac_id, 'Escalade', 'escalade', 1999, NULL, 'The Cadillac Escalade is a full-size luxury SUV. Known for luxury, three-row seating, and powerful engines.', true, 1)
      ON CONFLICT (brand_id, slug) DO NOTHING
      RETURNING id INTO cadillac_escalade_id;
    ELSE
      SELECT id INTO cadillac_escalade_id FROM car_models WHERE brand_id = cadillac_id AND slug = 'escalade' LIMIT 1;
    END IF;

    IF cadillac_escalade_id IS NOT NULL THEN
      -- 5th Gen (2021-Present) - Latest generation
      INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
      SELECT gen_random_uuid(), cadillac_escalade_id, '5th Gen (2021-Present)', '5th-gen-2021-present', 2021, NULL, '5th Gen', 'Fifth generation Escalade with updated design, advanced technology, and available 6.2L V8 and 3.0L diesel engines.', true, 1
      WHERE NOT EXISTS (SELECT 1 FROM model_generations WHERE car_model_id = cadillac_escalade_id AND slug = '5th-gen-2021-present')
      ON CONFLICT (car_model_id, slug) DO NOTHING;
    END IF;

    -- Cadillac XT5
    SELECT id INTO cadillac_xt5_id FROM car_models WHERE brand_id = cadillac_id AND slug = 'xt5' LIMIT 1;
    IF cadillac_xt5_id IS NULL THEN
      INSERT INTO car_models (id, brand_id, name, slug, year_start, year_end, description, is_featured, display_order) VALUES
        (gen_random_uuid(), cadillac_id, 'XT5', 'xt5', 2017, NULL, 'The Cadillac XT5 is a mid-size luxury crossover SUV. Known for luxury, comfort, and available all-wheel drive.', true, 2)
      ON CONFLICT (brand_id, slug) DO NOTHING
      RETURNING id INTO cadillac_xt5_id;
    ELSE
      SELECT id INTO cadillac_xt5_id FROM car_models WHERE brand_id = cadillac_id AND slug = 'xt5' LIMIT 1;
    END IF;

    IF cadillac_xt5_id IS NOT NULL THEN
      -- 1st Gen (2017-Present) - First generation
      INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
      SELECT gen_random_uuid(), cadillac_xt5_id, '1st Gen (2017-Present)', '1st-gen-2017-present', 2017, NULL, '1st Gen', 'First generation XT5 with 3.6L V6 engine. Available with front-wheel or all-wheel drive.', true, 1
      WHERE NOT EXISTS (SELECT 1 FROM model_generations WHERE car_model_id = cadillac_xt5_id AND slug = '1st-gen-2017-present')
      ON CONFLICT (car_model_id, slug) DO NOTHING;
    END IF;
  END IF;

  -- ============================================
  -- LINCOLN - Important Models
  -- ============================================
  IF lincoln_id IS NOT NULL THEN
    -- Lincoln Navigator
    SELECT id INTO lincoln_navigator_id FROM car_models WHERE brand_id = lincoln_id AND slug = 'navigator' LIMIT 1;
    IF lincoln_navigator_id IS NULL THEN
      INSERT INTO car_models (id, brand_id, name, slug, year_start, year_end, description, is_featured, display_order) VALUES
        (gen_random_uuid(), lincoln_id, 'Navigator', 'navigator', 1998, NULL, 'The Lincoln Navigator is a full-size luxury SUV. Known for luxury, three-row seating, and powerful engines.', true, 1)
      ON CONFLICT (brand_id, slug) DO NOTHING
      RETURNING id INTO lincoln_navigator_id;
    ELSE
      SELECT id INTO lincoln_navigator_id FROM car_models WHERE brand_id = lincoln_id AND slug = 'navigator' LIMIT 1;
    END IF;

    IF lincoln_navigator_id IS NOT NULL THEN
      -- 4th Gen (2018-Present) - Latest generation
      INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
      SELECT gen_random_uuid(), lincoln_navigator_id, '4th Gen (2018-Present)', '4th-gen-2018-present', 2018, NULL, '4th Gen', 'Fourth generation Navigator with updated design, advanced technology, and 3.5L twin-turbo V6 engine.', true, 1
      WHERE NOT EXISTS (SELECT 1 FROM model_generations WHERE car_model_id = lincoln_navigator_id AND slug = '4th-gen-2018-present')
      ON CONFLICT (car_model_id, slug) DO NOTHING;
    END IF;

    -- Lincoln Aviator
    SELECT id INTO lincoln_aviator_id FROM car_models WHERE brand_id = lincoln_id AND slug = 'aviator' LIMIT 1;
    IF lincoln_aviator_id IS NULL THEN
      INSERT INTO car_models (id, brand_id, name, slug, year_start, year_end, description, is_featured, display_order) VALUES
        (gen_random_uuid(), lincoln_id, 'Aviator', 'aviator', 2003, NULL, 'The Lincoln Aviator is a mid-size luxury crossover SUV. Known for luxury, three-row seating, and available all-wheel drive.', true, 2)
      ON CONFLICT (brand_id, slug) DO NOTHING
      RETURNING id INTO lincoln_aviator_id;
    ELSE
      SELECT id INTO lincoln_aviator_id FROM car_models WHERE brand_id = lincoln_id AND slug = 'aviator' LIMIT 1;
    END IF;

    IF lincoln_aviator_id IS NOT NULL THEN
      -- 2nd Gen (2020-Present) - Latest generation
      INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
      SELECT gen_random_uuid(), lincoln_aviator_id, '2nd Gen (2020-Present)', '2nd-gen-2020-present', 2020, NULL, '2nd Gen', 'Second generation Aviator with updated design, advanced technology, and available 3.0L twin-turbo V6 and plug-in hybrid powertrains.', true, 1
      WHERE NOT EXISTS (SELECT 1 FROM model_generations WHERE car_model_id = lincoln_aviator_id AND slug = '2nd-gen-2020-present')
      ON CONFLICT (car_model_id, slug) DO NOTHING;
    END IF;
  END IF;

END $$;

