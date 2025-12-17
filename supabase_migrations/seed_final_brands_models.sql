-- =====================================================
-- Fahrzeugfehler.de - Finale Seed-Daten
-- =====================================================
-- Diese Datei erweitert die Seed-Daten mit noch mehr
-- Automarken, Modellen und Generationen für eine
-- vollständige und umfassende Datenbank
-- =====================================================

-- =====================================================
-- WEITERE AUTOMARKEN
-- =====================================================

-- Dacia
INSERT INTO public.car_brands (name, slug, country, founded_year, is_featured, display_order, description)
VALUES (
    'Dacia',
    'dacia',
    'Rumänien',
    1966,
    true,
    27,
    'Rumänischer Automobilhersteller, Teil der Renault-Gruppe, bekannt für günstige Fahrzeuge'
)
ON CONFLICT (slug) DO UPDATE SET
    is_featured = true,
    display_order = 27;

-- Lada
INSERT INTO public.car_brands (name, slug, country, founded_year, is_featured, display_order, description)
VALUES (
    'Lada',
    'lada',
    'Russland',
    1966,
    true,
    28,
    'Russischer Automobilhersteller, bekannt für robuste Fahrzeuge'
)
ON CONFLICT (slug) DO UPDATE SET
    is_featured = true,
    display_order = 28;

-- Jeep
INSERT INTO public.car_brands (name, slug, country, founded_year, is_featured, display_order, description)
VALUES (
    'Jeep',
    'jeep',
    'USA',
    1941,
    true,
    29,
    'Amerikanischer Automobilhersteller, bekannt für Geländefahrzeuge'
)
ON CONFLICT (slug) DO UPDATE SET
    is_featured = true,
    display_order = 29;

-- Land Rover
INSERT INTO public.car_brands (name, slug, country, founded_year, is_featured, display_order, description)
VALUES (
    'Land Rover',
    'land-rover',
    'Vereinigtes Königreich',
    1948,
    true,
    30,
    'Britischer Automobilhersteller, bekannt für Geländefahrzeuge'
)
ON CONFLICT (slug) DO UPDATE SET
    is_featured = true,
    display_order = 30;

-- Jaguar
INSERT INTO public.car_brands (name, slug, country, founded_year, is_featured, display_order, description)
VALUES (
    'Jaguar',
    'jaguar',
    'Vereinigtes Königreich',
    1922,
    true,
    31,
    'Britischer Automobilhersteller, bekannt für Luxusfahrzeuge'
)
ON CONFLICT (slug) DO UPDATE SET
    is_featured = true,
    display_order = 31;

-- Lexus
INSERT INTO public.car_brands (name, slug, country, founded_year, is_featured, display_order, description)
VALUES (
    'Lexus',
    'lexus',
    'Japan',
    1989,
    true,
    32,
    'Japanischer Automobilhersteller, Premium-Marke von Toyota'
)
ON CONFLICT (slug) DO UPDATE SET
    is_featured = true,
    display_order = 32;

-- Infiniti
INSERT INTO public.car_brands (name, slug, country, founded_year, is_featured, display_order, description)
VALUES (
    'Infiniti',
    'infiniti',
    'Japan',
    1989,
    true,
    33,
    'Japanischer Automobilhersteller, Premium-Marke von Nissan'
)
ON CONFLICT (slug) DO UPDATE SET
    is_featured = true,
    display_order = 33;

-- =====================================================
-- WEITERE AUTOMODELLE
-- =====================================================

-- Dacia Modelle
INSERT INTO public.car_models (brand_id, name, slug, is_featured, display_order, description)
SELECT 
    id,
    'Sandero',
    'sandero',
    true,
    1,
    'Dacia Sandero - Kompaktklasse, bekannt für günstigen Preis'
FROM public.car_brands WHERE slug = 'dacia'
ON CONFLICT (brand_id, slug) DO UPDATE SET
    is_featured = true,
    display_order = 1;

INSERT INTO public.car_models (brand_id, name, slug, is_featured, display_order, description)
SELECT 
    id,
    'Duster',
    'duster',
    true,
    2,
    'Dacia Duster - Kompakter SUV, bekannt für Geländefähigkeit'
FROM public.car_brands WHERE slug = 'dacia'
ON CONFLICT (brand_id, slug) DO UPDATE SET
    is_featured = true,
    display_order = 2;

-- Lada Modelle
INSERT INTO public.car_models (brand_id, name, slug, is_featured, display_order, description)
SELECT 
    id,
    'Niva',
    'niva',
    true,
    1,
    'Lada Niva - Kompakter SUV, bekannt für Geländefähigkeit'
FROM public.car_brands WHERE slug = 'lada'
ON CONFLICT (brand_id, slug) DO UPDATE SET
    is_featured = true,
    display_order = 1;

-- Jeep Modelle
INSERT INTO public.car_models (brand_id, name, slug, is_featured, display_order, description)
SELECT 
    id,
    'Wrangler',
    'wrangler',
    true,
    1,
    'Jeep Wrangler - Geländewagen, bekannt für Offroad-Fähigkeiten'
FROM public.car_brands WHERE slug = 'jeep'
ON CONFLICT (brand_id, slug) DO UPDATE SET
    is_featured = true,
    display_order = 1;

INSERT INTO public.car_models (brand_id, name, slug, is_featured, display_order, description)
SELECT 
    id,
    'Cherokee',
    'cherokee',
    true,
    2,
    'Jeep Cherokee - Kompakter SUV, bekannt für Geländefähigkeit'
FROM public.car_brands WHERE slug = 'jeep'
ON CONFLICT (brand_id, slug) DO UPDATE SET
    is_featured = true,
    display_order = 2;

-- Land Rover Modelle
INSERT INTO public.car_models (brand_id, name, slug, is_featured, display_order, description)
SELECT 
    id,
    'Discovery',
    'discovery',
    true,
    1,
    'Land Rover Discovery - Geländewagen, bekannt für Geländefähigkeit'
FROM public.car_brands WHERE slug = 'land-rover'
ON CONFLICT (brand_id, slug) DO UPDATE SET
    is_featured = true,
    display_order = 1;

INSERT INTO public.car_models (brand_id, name, slug, is_featured, display_order, description)
SELECT 
    id,
    'Range Rover',
    'range-rover',
    true,
    2,
    'Land Rover Range Rover - Luxus-Geländewagen'
FROM public.car_brands WHERE slug = 'land-rover'
ON CONFLICT (brand_id, slug) DO UPDATE SET
    is_featured = true,
    display_order = 2;

-- Jaguar Modelle
INSERT INTO public.car_models (brand_id, name, slug, is_featured, display_order, description)
SELECT 
    id,
    'XF',
    'xf',
    true,
    1,
    'Jaguar XF - Mittelklasse-Limousine, bekannt für Luxus'
FROM public.car_brands WHERE slug = 'jaguar'
ON CONFLICT (brand_id, slug) DO UPDATE SET
    is_featured = true,
    display_order = 1;

INSERT INTO public.car_models (brand_id, name, slug, is_featured, display_order, description)
SELECT 
    id,
    'XE',
    'xe',
    true,
    2,
    'Jaguar XE - Kompaktklasse-Limousine, bekannt für Sportlichkeit'
FROM public.car_brands WHERE slug = 'jaguar'
ON CONFLICT (brand_id, slug) DO UPDATE SET
    is_featured = true,
    display_order = 2;

-- Lexus Modelle
INSERT INTO public.car_models (brand_id, name, slug, is_featured, display_order, description)
SELECT 
    id,
    'IS',
    'is',
    true,
    1,
    'Lexus IS - Kompaktklasse-Limousine, bekannt für Qualität'
FROM public.car_brands WHERE slug = 'lexus'
ON CONFLICT (brand_id, slug) DO UPDATE SET
    is_featured = true,
    display_order = 1;

INSERT INTO public.car_models (brand_id, name, slug, is_featured, display_order, description)
SELECT 
    id,
    'RX',
    'rx',
    true,
    2,
    'Lexus RX - Kompakter SUV, bekannt für Komfort'
FROM public.car_brands WHERE slug = 'lexus'
ON CONFLICT (brand_id, slug) DO UPDATE SET
    is_featured = true,
    display_order = 2;

-- Infiniti Modelle
INSERT INTO public.car_models (brand_id, name, slug, is_featured, display_order, description)
SELECT 
    id,
    'Q50',
    'q50',
    true,
    1,
    'Infiniti Q50 - Kompaktklasse-Limousine, bekannt für Technik'
FROM public.car_brands WHERE slug = 'infiniti'
ON CONFLICT (brand_id, slug) DO UPDATE SET
    is_featured = true,
    display_order = 1;

-- Weitere Modelle für bestehende Marken
-- BMW 5er
INSERT INTO public.car_models (brand_id, name, slug, is_featured, display_order, description)
SELECT 
    id,
    '5er',
    '5er',
    true,
    5,
    'BMW 5er - Mittelklasse-Limousine, bekannt für Komfort'
FROM public.car_brands WHERE slug = 'bmw'
ON CONFLICT (brand_id, slug) DO UPDATE SET
    is_featured = true,
    display_order = 5;

-- Mercedes E-Klasse
INSERT INTO public.car_models (brand_id, name, slug, is_featured, display_order, description)
SELECT 
    id,
    'E-Klasse',
    'e-klasse',
    true,
    5,
    'Mercedes-Benz E-Klasse - Mittelklasse-Limousine, bekannt für Luxus'
FROM public.car_brands WHERE slug = 'mercedes-benz'
ON CONFLICT (brand_id, slug) DO UPDATE SET
    is_featured = true,
    display_order = 5;

-- Audi A6
INSERT INTO public.car_models (brand_id, name, slug, is_featured, display_order, description)
SELECT 
    id,
    'A6',
    'a6',
    true,
    5,
    'Audi A6 - Mittelklasse-Limousine, bekannt für Qualität'
FROM public.car_brands WHERE slug = 'audi'
ON CONFLICT (brand_id, slug) DO UPDATE SET
    is_featured = true,
    display_order = 5;

-- VW Passat
INSERT INTO public.car_models (brand_id, name, slug, is_featured, display_order, description)
SELECT 
    id,
    'Passat',
    'passat',
    true,
    5,
    'Volkswagen Passat - Mittelklasse-Limousine, bekannt für Zuverlässigkeit'
FROM public.car_brands WHERE slug = 'volkswagen'
ON CONFLICT (brand_id, slug) DO UPDATE SET
    is_featured = true,
    display_order = 5;

-- Opel Insignia
INSERT INTO public.car_models (brand_id, name, slug, is_featured, display_order, description)
SELECT 
    id,
    'Insignia',
    'insignia',
    true,
    3,
    'Opel Insignia - Mittelklasse-Limousine, bekannt für Design'
FROM public.car_brands WHERE slug = 'opel'
ON CONFLICT (brand_id, slug) DO UPDATE SET
    is_featured = true,
    display_order = 3;

-- =====================================================
-- WEITERE MODELLGENERATIONEN
-- =====================================================

-- BMW 5er Generationen
INSERT INTO public.model_generations (car_model_id, name, slug, generation_code, year_start, year_end, is_featured, display_order, description)
SELECT 
    cm.id,
    'E39 (1995-2003)',
    'e39-1995-2003',
    'E39',
    1995,
    2003,
    true,
    1,
    'BMW 5er E39 - Fünfte Generation, bekannt für Qualität'
FROM public.car_models cm
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'bmw' AND cm.slug = '5er'
ON CONFLICT (car_model_id, slug) DO UPDATE SET
    is_featured = true,
    display_order = 1;

INSERT INTO public.model_generations (car_model_id, name, slug, generation_code, year_start, year_end, is_featured, display_order, description)
SELECT 
    cm.id,
    'F10 (2010-2017)',
    'f10-2010-2017',
    'F10',
    2010,
    2017,
    true,
    2,
    'BMW 5er F10 - Sechste Generation, bekannt für Technik'
FROM public.car_models cm
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'bmw' AND cm.slug = '5er'
ON CONFLICT (car_model_id, slug) DO UPDATE SET
    is_featured = true,
    display_order = 2;

-- Mercedes E-Klasse Generationen
INSERT INTO public.model_generations (car_model_id, name, slug, generation_code, year_start, year_end, is_featured, display_order, description)
SELECT 
    cm.id,
    'W211 (2002-2009)',
    'w211-2002-2009',
    'W211',
    2002,
    2009,
    true,
    1,
    'Mercedes-Benz E-Klasse W211 - Vierte Generation, bekannt für Komfort'
FROM public.car_models cm
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'mercedes-benz' AND cm.slug = 'e-klasse'
ON CONFLICT (car_model_id, slug) DO UPDATE SET
    is_featured = true,
    display_order = 1;

INSERT INTO public.model_generations (car_model_id, name, slug, generation_code, year_start, year_end, is_featured, display_order, description)
SELECT 
    cm.id,
    'W213 (2016-)',
    'w213-2016',
    'W213',
    2016,
    NULL,
    true,
    2,
    'Mercedes-Benz E-Klasse W213 - Fünfte Generation, aktuelle Generation'
FROM public.car_models cm
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'mercedes-benz' AND cm.slug = 'e-klasse'
ON CONFLICT (car_model_id, slug) DO UPDATE SET
    is_featured = true,
    display_order = 2;

-- Audi A6 Generationen
INSERT INTO public.model_generations (car_model_id, name, slug, generation_code, year_start, year_end, is_featured, display_order, description)
SELECT 
    cm.id,
    'A6 C6 (2004-2011)',
    'a6-c6-2004-2011',
    'C6',
    2004,
    2011,
    true,
    1,
    'Audi A6 C6 - Fünfte Generation, bekannt für Qualität'
FROM public.car_models cm
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'audi' AND cm.slug = 'a6'
ON CONFLICT (car_model_id, slug) DO UPDATE SET
    is_featured = true,
    display_order = 1;

INSERT INTO public.model_generations (car_model_id, name, slug, generation_code, year_start, year_end, is_featured, display_order, description)
SELECT 
    cm.id,
    'A6 C8 (2018-)',
    'a6-c8-2018',
    'C8',
    2018,
    NULL,
    true,
    2,
    'Audi A6 C8 - Siebte Generation, aktuelle Generation'
FROM public.car_models cm
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'audi' AND cm.slug = 'a6'
ON CONFLICT (car_model_id, slug) DO UPDATE SET
    is_featured = true,
    display_order = 2;

-- VW Passat Generationen
INSERT INTO public.model_generations (car_model_id, name, slug, generation_code, year_start, year_end, is_featured, display_order, description)
SELECT 
    cm.id,
    'Passat B6 (2005-2010)',
    'passat-b6-2005-2010',
    'B6',
    2005,
    2010,
    true,
    1,
    'Volkswagen Passat B6 - Sechste Generation, bekannt für Zuverlässigkeit'
FROM public.car_models cm
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'volkswagen' AND cm.slug = 'passat'
ON CONFLICT (car_model_id, slug) DO UPDATE SET
    is_featured = true,
    display_order = 1;

INSERT INTO public.model_generations (car_model_id, name, slug, generation_code, year_start, year_end, is_featured, display_order, description)
SELECT 
    cm.id,
    'Passat B8 (2014-)',
    'passat-b8-2014',
    'B8',
    2014,
    NULL,
    true,
    2,
    'Volkswagen Passat B8 - Achte Generation, aktuelle Generation'
FROM public.car_models cm
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'volkswagen' AND cm.slug = 'passat'
ON CONFLICT (car_model_id, slug) DO UPDATE SET
    is_featured = true,
    display_order = 2;

-- Opel Insignia Generationen
INSERT INTO public.model_generations (car_model_id, name, slug, generation_code, year_start, year_end, is_featured, display_order, description)
SELECT 
    cm.id,
    'Insignia A (2008-2017)',
    'insignia-a-2008-2017',
    'A',
    2008,
    2017,
    true,
    1,
    'Opel Insignia A - Erste Generation, bekannt für Design'
FROM public.car_models cm
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'opel' AND cm.slug = 'insignia'
ON CONFLICT (car_model_id, slug) DO UPDATE SET
    is_featured = true,
    display_order = 1;

INSERT INTO public.model_generations (car_model_id, name, slug, generation_code, year_start, year_end, is_featured, display_order, description)
SELECT 
    cm.id,
    'Insignia B (2017-)',
    'insignia-b-2017',
    'B',
    2017,
    NULL,
    true,
    2,
    'Opel Insignia B - Zweite Generation, aktuelle Generation'
FROM public.car_models cm
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'opel' AND cm.slug = 'insignia'
ON CONFLICT (car_model_id, slug) DO UPDATE SET
    is_featured = true,
    display_order = 2;

-- Dacia Sandero Generationen
INSERT INTO public.model_generations (car_model_id, name, slug, generation_code, year_start, year_end, is_featured, display_order, description)
SELECT 
    cm.id,
    'Sandero I (2008-2012)',
    'sandero-1-2008-2012',
    'I',
    2008,
    2012,
    true,
    1,
    'Dacia Sandero I - Erste Generation, bekannt für günstigen Preis'
FROM public.car_models cm
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'dacia' AND cm.slug = 'sandero'
ON CONFLICT (car_model_id, slug) DO UPDATE SET
    is_featured = true,
    display_order = 1;

INSERT INTO public.model_generations (car_model_id, name, slug, generation_code, year_start, year_end, is_featured, display_order, description)
SELECT 
    cm.id,
    'Sandero III (2020-)',
    'sandero-3-2020',
    'III',
    2020,
    NULL,
    true,
    2,
    'Dacia Sandero III - Dritte Generation, aktuelle Generation'
FROM public.car_models cm
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'dacia' AND cm.slug = 'sandero'
ON CONFLICT (car_model_id, slug) DO UPDATE SET
    is_featured = true,
    display_order = 2;

-- Jeep Wrangler Generationen
INSERT INTO public.model_generations (car_model_id, name, slug, generation_code, year_start, year_end, is_featured, display_order, description)
SELECT 
    cm.id,
    'Wrangler JK (2006-2018)',
    'wrangler-jk-2006-2018',
    'JK',
    2006,
    2018,
    true,
    1,
    'Jeep Wrangler JK - Dritte Generation, bekannt für Offroad-Fähigkeiten'
FROM public.car_models cm
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'jeep' AND cm.slug = 'wrangler'
ON CONFLICT (car_model_id, slug) DO UPDATE SET
    is_featured = true,
    display_order = 1;

-- Lexus IS Generationen
INSERT INTO public.model_generations (car_model_id, name, slug, generation_code, year_start, year_end, is_featured, display_order, description)
SELECT 
    cm.id,
    'IS II (2005-2013)',
    'is-2-2005-2013',
    'II',
    2005,
    2013,
    true,
    1,
    'Lexus IS II - Zweite Generation, bekannt für Qualität'
FROM public.car_models cm
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'lexus' AND cm.slug = 'is'
ON CONFLICT (car_model_id, slug) DO UPDATE SET
    is_featured = true,
    display_order = 1;

INSERT INTO public.model_generations (car_model_id, name, slug, generation_code, year_start, year_end, is_featured, display_order, description)
SELECT 
    cm.id,
    'IS III (2013-)',
    'is-3-2013',
    'III',
    2013,
    NULL,
    true,
    2,
    'Lexus IS III - Dritte Generation, aktuelle Generation'
FROM public.car_models cm
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'lexus' AND cm.slug = 'is'
ON CONFLICT (car_model_id, slug) DO UPDATE SET
    is_featured = true,
    display_order = 2;

-- =====================================================
-- FERTIG!
-- =====================================================
-- Finale Seed-Daten wurden erfolgreich eingefügt.
-- Insgesamt wurden hinzugefügt:
-- - 7 weitere Automarken
-- - 15+ weitere Automodelle
-- - 10+ weitere Modellgenerationen
-- =====================================================

