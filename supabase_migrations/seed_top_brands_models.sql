-- =====================================================
-- Fahrzeugfehler.de - Seed-Daten für Top-Marken
-- =====================================================
-- Diese Datei fügt die wichtigsten deutschen Automarken,
-- beliebte Modelle und bekannte Generationen ein
-- =====================================================

-- =====================================================
-- 1. AUTOMARKEN (Car Brands)
-- =====================================================

-- BMW
INSERT INTO public.car_brands (name, slug, country, founded_year, is_featured, display_order, description)
VALUES (
    'BMW',
    'bmw',
    'Deutschland',
    1916,
    true,
    1,
    'Bayerische Motoren Werke - Premium-Automobilhersteller aus München'
)
ON CONFLICT (slug) DO UPDATE SET
    is_featured = true,
    display_order = 1;

-- Mercedes-Benz
INSERT INTO public.car_brands (name, slug, country, founded_year, is_featured, display_order, description)
VALUES (
    'Mercedes-Benz',
    'mercedes-benz',
    'Deutschland',
    1926,
    true,
    2,
    'Premium-Automobilhersteller aus Stuttgart, bekannt für Luxus und Innovation'
)
ON CONFLICT (slug) DO UPDATE SET
    is_featured = true,
    display_order = 2;

-- Audi
INSERT INTO public.car_brands (name, slug, country, founded_year, is_featured, display_order, description)
VALUES (
    'Audi',
    'audi',
    'Deutschland',
    1909,
    true,
    3,
    'Premium-Automobilhersteller aus Ingolstadt, Teil der Volkswagen-Gruppe'
)
ON CONFLICT (slug) DO UPDATE SET
    is_featured = true,
    display_order = 3;

-- Volkswagen
INSERT INTO public.car_brands (name, slug, country, founded_year, is_featured, display_order, description)
VALUES (
    'Volkswagen',
    'volkswagen',
    'Deutschland',
    1937,
    true,
    4,
    'Größter Automobilhersteller Europas, bekannt für zuverlässige Fahrzeuge'
)
ON CONFLICT (slug) DO UPDATE SET
    is_featured = true,
    display_order = 4;

-- Opel
INSERT INTO public.car_brands (name, slug, country, founded_year, is_featured, display_order, description)
VALUES (
    'Opel',
    'opel',
    'Deutschland',
    1862,
    true,
    5,
    'Deutscher Automobilhersteller, seit 2017 Teil der PSA-Gruppe'
)
ON CONFLICT (slug) DO UPDATE SET
    is_featured = true,
    display_order = 5;

-- Porsche
INSERT INTO public.car_brands (name, slug, country, founded_year, is_featured, display_order, description)
VALUES (
    'Porsche',
    'porsche',
    'Deutschland',
    1931,
    true,
    6,
    'Sportwagenhersteller aus Stuttgart, bekannt für Hochleistungsfahrzeuge'
)
ON CONFLICT (slug) DO UPDATE SET
    is_featured = true,
    display_order = 6;

-- Ford (Deutschland)
INSERT INTO public.car_brands (name, slug, country, founded_year, is_featured, display_order, description)
VALUES (
    'Ford',
    'ford',
    'Deutschland',
    1925,
    true,
    7,
    'Amerikanischer Automobilhersteller mit großer Präsenz in Deutschland'
)
ON CONFLICT (slug) DO UPDATE SET
    is_featured = true,
    display_order = 7;

-- Skoda
INSERT INTO public.car_brands (name, slug, country, founded_year, is_featured, display_order, description)
VALUES (
    'Škoda',
    'skoda',
    'Tschechien',
    1895,
    true,
    8,
    'Tschechischer Automobilhersteller, Teil der Volkswagen-Gruppe'
)
ON CONFLICT (slug) DO UPDATE SET
    is_featured = true,
    display_order = 8;

-- =====================================================
-- 2. AUTOMODELLE (Car Models)
-- =====================================================

-- BMW Modelle
INSERT INTO public.car_models (brand_id, name, slug, is_featured, display_order, description)
SELECT 
    id,
    '3er',
    '3er',
    true,
    1,
    'BMW 3er - Kompaktklasse-Limousine, eines der erfolgreichsten Modelle von BMW'
FROM public.car_brands WHERE slug = 'bmw'
ON CONFLICT (brand_id, slug) DO UPDATE SET
    is_featured = true,
    display_order = 1;

INSERT INTO public.car_models (brand_id, name, slug, is_featured, display_order, description)
SELECT 
    id,
    '5er',
    '5er',
    true,
    2,
    'BMW 5er - Mittelklasse-Limousine, bekannt für Komfort und Fahrleistung'
FROM public.car_brands WHERE slug = 'bmw'
ON CONFLICT (brand_id, slug) DO UPDATE SET
    is_featured = true,
    display_order = 2;

INSERT INTO public.car_models (brand_id, name, slug, is_featured, display_order, description)
SELECT 
    id,
    'X3',
    'x3',
    true,
    3,
    'BMW X3 - Kompakter SUV, erfolgreichstes SUV-Modell von BMW'
FROM public.car_brands WHERE slug = 'bmw'
ON CONFLICT (brand_id, slug) DO UPDATE SET
    is_featured = true,
    display_order = 3;

-- Mercedes-Benz Modelle
INSERT INTO public.car_models (brand_id, name, slug, is_featured, display_order, description)
SELECT 
    id,
    'C-Klasse',
    'c-klasse',
    true,
    1,
    'Mercedes-Benz C-Klasse - Kompaktklasse-Limousine, Bestseller von Mercedes'
FROM public.car_brands WHERE slug = 'mercedes-benz'
ON CONFLICT (brand_id, slug) DO UPDATE SET
    is_featured = true,
    display_order = 1;

INSERT INTO public.car_models (brand_id, name, slug, is_featured, display_order, description)
SELECT 
    id,
    'E-Klasse',
    'e-klasse',
    true,
    2,
    'Mercedes-Benz E-Klasse - Mittelklasse-Limousine, bekannt für Komfort und Technik'
FROM public.car_brands WHERE slug = 'mercedes-benz'
ON CONFLICT (brand_id, slug) DO UPDATE SET
    is_featured = true,
    display_order = 2;

INSERT INTO public.car_models (brand_id, name, slug, is_featured, display_order, description)
SELECT 
    id,
    'GLC',
    'glc',
    true,
    3,
    'Mercedes-Benz GLC - Kompakter SUV, Nachfolger der GLK-Klasse'
FROM public.car_brands WHERE slug = 'mercedes-benz'
ON CONFLICT (brand_id, slug) DO UPDATE SET
    is_featured = true,
    display_order = 3;

-- Audi Modelle
INSERT INTO public.car_models (brand_id, name, slug, is_featured, display_order, description)
SELECT 
    id,
    'A4',
    'a4',
    true,
    1,
    'Audi A4 - Mittelklasse-Limousine, erfolgreichstes Modell von Audi'
FROM public.car_brands WHERE slug = 'audi'
ON CONFLICT (brand_id, slug) DO UPDATE SET
    is_featured = true,
    display_order = 1;

INSERT INTO public.car_models (brand_id, name, slug, is_featured, display_order, description)
SELECT 
    id,
    'A6',
    'a6',
    true,
    2,
    'Audi A6 - Oberklasse-Limousine, bekannt für Technik und Komfort'
FROM public.car_brands WHERE slug = 'audi'
ON CONFLICT (brand_id, slug) DO UPDATE SET
    is_featured = true,
    display_order = 2;

INSERT INTO public.car_models (brand_id, name, slug, is_featured, display_order, description)
SELECT 
    id,
    'Q5',
    'q5',
    true,
    3,
    'Audi Q5 - Kompakter SUV, erfolgreichstes SUV-Modell von Audi'
FROM public.car_brands WHERE slug = 'audi'
ON CONFLICT (brand_id, slug) DO UPDATE SET
    is_featured = true,
    display_order = 3;

-- Volkswagen Modelle
INSERT INTO public.car_models (brand_id, name, slug, is_featured, display_order, description)
SELECT 
    id,
    'Golf',
    'golf',
    true,
    1,
    'Volkswagen Golf - Kompaktklasse, meistverkauftes Modell von VW'
FROM public.car_brands WHERE slug = 'volkswagen'
ON CONFLICT (brand_id, slug) DO UPDATE SET
    is_featured = true,
    display_order = 1;

INSERT INTO public.car_models (brand_id, name, slug, is_featured, display_order, description)
SELECT 
    id,
    'Passat',
    'passat',
    true,
    2,
    'Volkswagen Passat - Mittelklasse-Limousine, bekannt für Zuverlässigkeit'
FROM public.car_brands WHERE slug = 'volkswagen'
ON CONFLICT (brand_id, slug) DO UPDATE SET
    is_featured = true,
    display_order = 2;

INSERT INTO public.car_models (brand_id, name, slug, is_featured, display_order, description)
SELECT 
    id,
    'Tiguan',
    'tiguan',
    true,
    3,
    'Volkswagen Tiguan - Kompakter SUV, erfolgreichstes SUV-Modell von VW'
FROM public.car_brands WHERE slug = 'volkswagen'
ON CONFLICT (brand_id, slug) DO UPDATE SET
    is_featured = true,
    display_order = 3;

-- Opel Modelle
INSERT INTO public.car_models (brand_id, name, slug, is_featured, display_order, description)
SELECT 
    id,
    'Astra',
    'astra',
    true,
    1,
    'Opel Astra - Kompaktklasse, erfolgreichstes Modell von Opel'
FROM public.car_brands WHERE slug = 'opel'
ON CONFLICT (brand_id, slug) DO UPDATE SET
    is_featured = true,
    display_order = 1;

INSERT INTO public.car_models (brand_id, name, slug, is_featured, display_order, description)
SELECT 
    id,
    'Corsa',
    'corsa',
    true,
    2,
    'Opel Corsa - Kleinwagen, bekannt für Effizienz und Kompaktheit'
FROM public.car_brands WHERE slug = 'opel'
ON CONFLICT (brand_id, slug) DO UPDATE SET
    is_featured = true,
    display_order = 2;

-- =====================================================
-- 3. MODELLGENERATIONEN (Model Generations)
-- =====================================================

-- BMW 3er Generationen
INSERT INTO public.model_generations (car_model_id, name, slug, generation_code, year_start, year_end, is_featured, display_order, description)
SELECT 
    cm.id,
    'E46 (1998-2006)',
    'e46-1998-2006',
    'E46',
    1998,
    2006,
    true,
    1,
    'BMW 3er E46 - Vierte Generation, bekannt für sportliche Fahrleistung und Zuverlässigkeit'
FROM public.car_models cm
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'bmw' AND cm.slug = '3er'
ON CONFLICT (car_model_id, slug) DO UPDATE SET
    is_featured = true,
    display_order = 1;

INSERT INTO public.model_generations (car_model_id, name, slug, generation_code, year_start, year_end, is_featured, display_order, description)
SELECT 
    cm.id,
    'E90 (2005-2013)',
    'e90-2005-2013',
    'E90',
    2005,
    2013,
    true,
    2,
    'BMW 3er E90 - Fünfte Generation, erste Generation mit moderner Elektronik'
FROM public.car_models cm
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'bmw' AND cm.slug = '3er'
ON CONFLICT (car_model_id, slug) DO UPDATE SET
    is_featured = true,
    display_order = 2;

INSERT INTO public.model_generations (car_model_id, name, slug, generation_code, year_start, year_end, is_featured, display_order, description)
SELECT 
    cm.id,
    'F30 (2012-2019)',
    'f30-2012-2019',
    'F30',
    2012,
    2019,
    true,
    3,
    'BMW 3er F30 - Sechste Generation, bekannt für Effizienz und Komfort'
FROM public.car_models cm
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'bmw' AND cm.slug = '3er'
ON CONFLICT (car_model_id, slug) DO UPDATE SET
    is_featured = true,
    display_order = 3;

INSERT INTO public.model_generations (car_model_id, name, slug, generation_code, year_start, year_end, is_featured, display_order, description)
SELECT 
    cm.id,
    'G20 (2019-)',
    'g20-2019',
    'G20',
    2019,
    NULL,
    true,
    4,
    'BMW 3er G20 - Siebte Generation, aktuelle Generation mit modernster Technik'
FROM public.car_models cm
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'bmw' AND cm.slug = '3er'
ON CONFLICT (car_model_id, slug) DO UPDATE SET
    is_featured = true,
    display_order = 4;

-- BMW 5er Generationen
INSERT INTO public.model_generations (car_model_id, name, slug, generation_code, year_start, year_end, is_featured, display_order, description)
SELECT 
    cm.id,
    'E39 (1995-2004)',
    'e39-1995-2004',
    'E39',
    1995,
    2004,
    true,
    1,
    'BMW 5er E39 - Fünfte Generation, bekannt für Qualität und Komfort'
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
    'BMW 5er F10 - Sechste Generation, bekannt für Luxus und Technik'
FROM public.car_models cm
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'bmw' AND cm.slug = '5er'
ON CONFLICT (car_model_id, slug) DO UPDATE SET
    is_featured = true,
    display_order = 2;

-- Mercedes-Benz C-Klasse Generationen
INSERT INTO public.model_generations (car_model_id, name, slug, generation_code, year_start, year_end, is_featured, display_order, description)
SELECT 
    cm.id,
    'W203 (2000-2007)',
    'w203-2000-2007',
    'W203',
    2000,
    2007,
    true,
    1,
    'Mercedes-Benz C-Klasse W203 - Dritte Generation, bekannt für Zuverlässigkeit'
FROM public.car_models cm
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'mercedes-benz' AND cm.slug = 'c-klasse'
ON CONFLICT (car_model_id, slug) DO UPDATE SET
    is_featured = true,
    display_order = 1;

INSERT INTO public.model_generations (car_model_id, name, slug, generation_code, year_start, year_end, is_featured, display_order, description)
SELECT 
    cm.id,
    'W204 (2007-2014)',
    'w204-2007-2014',
    'W204',
    2007,
    2014,
    true,
    2,
    'Mercedes-Benz C-Klasse W204 - Vierte Generation, bekannt für Komfort und Qualität'
FROM public.car_models cm
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'mercedes-benz' AND cm.slug = 'c-klasse'
ON CONFLICT (car_model_id, slug) DO UPDATE SET
    is_featured = true,
    display_order = 2;

INSERT INTO public.model_generations (car_model_id, name, slug, generation_code, year_start, year_end, is_featured, display_order, description)
SELECT 
    cm.id,
    'W205 (2014-2021)',
    'w205-2014-2021',
    'W205',
    2014,
    2021,
    true,
    3,
    'Mercedes-Benz C-Klasse W205 - Fünfte Generation, bekannt für moderne Technik'
FROM public.car_models cm
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'mercedes-benz' AND cm.slug = 'c-klasse'
ON CONFLICT (car_model_id, slug) DO UPDATE SET
    is_featured = true,
    display_order = 3;

INSERT INTO public.model_generations (car_model_id, name, slug, generation_code, year_start, year_end, is_featured, display_order, description)
SELECT 
    cm.id,
    'W206 (2021-)',
    'w206-2021',
    'W206',
    2021,
    NULL,
    true,
    4,
    'Mercedes-Benz C-Klasse W206 - Sechste Generation, aktuelle Generation'
FROM public.car_models cm
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'mercedes-benz' AND cm.slug = 'c-klasse'
ON CONFLICT (car_model_id, slug) DO UPDATE SET
    is_featured = true,
    display_order = 4;

-- Mercedes-Benz E-Klasse Generationen
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

-- Audi A4 Generationen
INSERT INTO public.model_generations (car_model_id, name, slug, generation_code, year_start, year_end, is_featured, display_order, description)
SELECT 
    cm.id,
    'B6 (2000-2005)',
    'b6-2000-2005',
    'B6',
    2000,
    2005,
    true,
    1,
    'Audi A4 B6 - Zweite Generation, bekannt für Qualität'
FROM public.car_models cm
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'audi' AND cm.slug = 'a4'
ON CONFLICT (car_model_id, slug) DO UPDATE SET
    is_featured = true,
    display_order = 1;

INSERT INTO public.model_generations (car_model_id, name, slug, generation_code, year_start, year_end, is_featured, display_order, description)
SELECT 
    cm.id,
    'B8 (2007-2015)',
    'b8-2007-2015',
    'B8',
    2007,
    2015,
    true,
    2,
    'Audi A4 B8 - Vierte Generation, bekannt für Technik und Komfort'
FROM public.car_models cm
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'audi' AND cm.slug = 'a4'
ON CONFLICT (car_model_id, slug) DO UPDATE SET
    is_featured = true,
    display_order = 2;

INSERT INTO public.model_generations (car_model_id, name, slug, generation_code, year_start, year_end, is_featured, display_order, description)
SELECT 
    cm.id,
    'B9 (2015-)',
    'b9-2015',
    'B9',
    2015,
    NULL,
    true,
    3,
    'Audi A4 B9 - Fünfte Generation, aktuelle Generation'
FROM public.car_models cm
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'audi' AND cm.slug = 'a4'
ON CONFLICT (car_model_id, slug) DO UPDATE SET
    is_featured = true,
    display_order = 3;

-- Volkswagen Golf Generationen
INSERT INTO public.model_generations (car_model_id, name, slug, generation_code, year_start, year_end, is_featured, display_order, description)
SELECT 
    cm.id,
    'Golf IV (1997-2003)',
    'golf-4-1997-2003',
    'Golf IV',
    1997,
    2003,
    true,
    1,
    'Volkswagen Golf IV - Vierte Generation, bekannt für Zuverlässigkeit'
FROM public.car_models cm
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'volkswagen' AND cm.slug = 'golf'
ON CONFLICT (car_model_id, slug) DO UPDATE SET
    is_featured = true,
    display_order = 1;

INSERT INTO public.model_generations (car_model_id, name, slug, generation_code, year_start, year_end, is_featured, display_order, description)
SELECT 
    cm.id,
    'Golf V (2003-2008)',
    'golf-5-2003-2008',
    'Golf V',
    2003,
    2008,
    true,
    2,
    'Volkswagen Golf V - Fünfte Generation, bekannt für Qualität'
FROM public.car_models cm
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'volkswagen' AND cm.slug = 'golf'
ON CONFLICT (car_model_id, slug) DO UPDATE SET
    is_featured = true,
    display_order = 2;

INSERT INTO public.model_generations (car_model_id, name, slug, generation_code, year_start, year_end, is_featured, display_order, description)
SELECT 
    cm.id,
    'Golf VI (2008-2012)',
    'golf-6-2008-2012',
    'Golf VI',
    2008,
    2012,
    true,
    3,
    'Volkswagen Golf VI - Sechste Generation, bekannt für Effizienz'
FROM public.car_models cm
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'volkswagen' AND cm.slug = 'golf'
ON CONFLICT (car_model_id, slug) DO UPDATE SET
    is_featured = true,
    display_order = 3;

INSERT INTO public.model_generations (car_model_id, name, slug, generation_code, year_start, year_end, is_featured, display_order, description)
SELECT 
    cm.id,
    'Golf VII (2012-2019)',
    'golf-7-2012-2019',
    'Golf VII',
    2012,
    2019,
    true,
    4,
    'Volkswagen Golf VII - Siebte Generation, bekannt für Technik'
FROM public.car_models cm
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'volkswagen' AND cm.slug = 'golf'
ON CONFLICT (car_model_id, slug) DO UPDATE SET
    is_featured = true,
    display_order = 4;

INSERT INTO public.model_generations (car_model_id, name, slug, generation_code, year_start, year_end, is_featured, display_order, description)
SELECT 
    cm.id,
    'Golf VIII (2019-)',
    'golf-8-2019',
    'Golf VIII',
    2019,
    NULL,
    true,
    5,
    'Volkswagen Golf VIII - Achte Generation, aktuelle Generation'
FROM public.car_models cm
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'volkswagen' AND cm.slug = 'golf'
ON CONFLICT (car_model_id, slug) DO UPDATE SET
    is_featured = true,
    display_order = 5;

-- Opel Astra Generationen
INSERT INTO public.model_generations (car_model_id, name, slug, generation_code, year_start, year_end, is_featured, display_order, description)
SELECT 
    cm.id,
    'Astra G (1998-2004)',
    'astra-g-1998-2004',
    'Astra G',
    1998,
    2004,
    true,
    1,
    'Opel Astra G - Zweite Generation, bekannt für Zuverlässigkeit'
FROM public.car_models cm
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'opel' AND cm.slug = 'astra'
ON CONFLICT (car_model_id, slug) DO UPDATE SET
    is_featured = true,
    display_order = 1;

INSERT INTO public.model_generations (car_model_id, name, slug, generation_code, year_start, year_end, is_featured, display_order, description)
SELECT 
    cm.id,
    'Astra K (2015-)',
    'astra-k-2015',
    'Astra K',
    2015,
    NULL,
    true,
    2,
    'Opel Astra K - Fünfte Generation, aktuelle Generation'
FROM public.car_models cm
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'opel' AND cm.slug = 'astra'
ON CONFLICT (car_model_id, slug) DO UPDATE SET
    is_featured = true,
    display_order = 2;

-- =====================================================
-- FERTIG!
-- =====================================================
-- Die Seed-Daten wurden erfolgreich eingefügt.
-- Du kannst jetzt die Website testen: http://localhost:3000/cars
-- =====================================================

