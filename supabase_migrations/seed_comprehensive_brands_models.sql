-- =====================================================
-- Fahrzeugfehler.de - Umfassende Seed-Daten
-- =====================================================
-- Diese Datei erweitert die Seed-Daten mit noch mehr
-- Automarken, Modellen und Generationen für eine
-- vollständige Datenbank
-- =====================================================

-- =====================================================
-- WEITERE AUTOMARKEN
-- =====================================================

-- Kia
INSERT INTO public.car_brands (name, slug, country, founded_year, is_featured, display_order, description)
VALUES (
    'Kia',
    'kia',
    'Südkorea',
    1944,
    true,
    19,
    'Südkoreanischer Automobilhersteller, bekannt für Wert und Design'
)
ON CONFLICT (slug) DO UPDATE SET
    is_featured = true,
    display_order = 19;

-- Subaru
INSERT INTO public.car_brands (name, slug, country, founded_year, is_featured, display_order, description)
VALUES (
    'Subaru',
    'subaru',
    'Japan',
    1953,
    true,
    20,
    'Japanischer Automobilhersteller, bekannt für Allradantrieb'
)
ON CONFLICT (slug) DO UPDATE SET
    is_featured = true,
    display_order = 20;

-- Mitsubishi
INSERT INTO public.car_brands (name, slug, country, founded_year, is_featured, display_order, description)
VALUES (
    'Mitsubishi',
    'mitsubishi',
    'Japan',
    1917,
    true,
    21,
    'Japanischer Automobilhersteller, bekannt für Allradtechnik'
)
ON CONFLICT (slug) DO UPDATE SET
    is_featured = true,
    display_order = 21;

-- Suzuki
INSERT INTO public.car_brands (name, slug, country, founded_year, is_featured, display_order, description)
VALUES (
    'Suzuki',
    'suzuki',
    'Japan',
    1909,
    true,
    22,
    'Japanischer Automobilhersteller, bekannt für kompakte Fahrzeuge'
)
ON CONFLICT (slug) DO UPDATE SET
    is_featured = true,
    display_order = 22;

-- Citroën
INSERT INTO public.car_brands (name, slug, country, founded_year, is_featured, display_order, description)
VALUES (
    'Citroën',
    'citroen',
    'Frankreich',
    1919,
    true,
    23,
    'Französischer Automobilhersteller, bekannt für Innovation'
)
ON CONFLICT (slug) DO UPDATE SET
    is_featured = true,
    display_order = 23;

-- Alfa Romeo
INSERT INTO public.car_brands (name, slug, country, founded_year, is_featured, display_order, description)
VALUES (
    'Alfa Romeo',
    'alfa-romeo',
    'Italien',
    1910,
    true,
    24,
    'Italienischer Automobilhersteller, bekannt für Sportlichkeit'
)
ON CONFLICT (slug) DO UPDATE SET
    is_featured = true,
    display_order = 24;

-- Mini
INSERT INTO public.car_brands (name, slug, country, founded_year, is_featured, display_order, description)
VALUES (
    'Mini',
    'mini',
    'Vereinigtes Königreich',
    1959,
    true,
    25,
    'Britischer Automobilhersteller, Teil der BMW-Gruppe'
)
ON CONFLICT (slug) DO UPDATE SET
    is_featured = true,
    display_order = 25;

-- Smart
INSERT INTO public.car_brands (name, slug, country, founded_year, is_featured, display_order, description)
VALUES (
    'Smart',
    'smart',
    'Deutschland',
    1994,
    true,
    26,
    'Deutscher Automobilhersteller, bekannt für kompakte Stadtfahrzeuge'
)
ON CONFLICT (slug) DO UPDATE SET
    is_featured = true,
    display_order = 26;

-- =====================================================
-- WEITERE AUTOMODELLE
-- =====================================================

-- Kia Modelle
INSERT INTO public.car_models (brand_id, name, slug, is_featured, display_order, description)
SELECT 
    id,
    'Ceed',
    'ceed',
    true,
    1,
    'Kia Ceed - Kompaktklasse, bekannt für Wert und Qualität'
FROM public.car_brands WHERE slug = 'kia'
ON CONFLICT (brand_id, slug) DO UPDATE SET
    is_featured = true,
    display_order = 1;

INSERT INTO public.car_models (brand_id, name, slug, is_featured, display_order, description)
SELECT 
    id,
    'Sportage',
    'sportage',
    true,
    2,
    'Kia Sportage - Kompakter SUV, bekannt für Design'
FROM public.car_brands WHERE slug = 'kia'
ON CONFLICT (brand_id, slug) DO UPDATE SET
    is_featured = true,
    display_order = 2;

-- Subaru Modelle
INSERT INTO public.car_models (brand_id, name, slug, is_featured, display_order, description)
SELECT 
    id,
    'Impreza',
    'impreza',
    true,
    1,
    'Subaru Impreza - Kompaktklasse, bekannt für Allradantrieb'
FROM public.car_brands WHERE slug = 'subaru'
ON CONFLICT (brand_id, slug) DO UPDATE SET
    is_featured = true,
    display_order = 1;

INSERT INTO public.car_models (brand_id, name, slug, is_featured, display_order, description)
SELECT 
    id,
    'Forester',
    'forester',
    true,
    2,
    'Subaru Forester - Kompakter SUV, bekannt für Allradfähigkeiten'
FROM public.car_brands WHERE slug = 'subaru'
ON CONFLICT (brand_id, slug) DO UPDATE SET
    is_featured = true,
    display_order = 2;

-- Mitsubishi Modelle
INSERT INTO public.car_models (brand_id, name, slug, is_featured, display_order, description)
SELECT 
    id,
    'Lancer',
    'lancer',
    true,
    1,
    'Mitsubishi Lancer - Kompaktklasse, bekannt für Zuverlässigkeit'
FROM public.car_brands WHERE slug = 'mitsubishi'
ON CONFLICT (brand_id, slug) DO UPDATE SET
    is_featured = true,
    display_order = 1;

INSERT INTO public.car_models (brand_id, name, slug, is_featured, display_order, description)
SELECT 
    id,
    'Outlander',
    'outlander',
    true,
    2,
    'Mitsubishi Outlander - Kompakter SUV, bekannt für Allradtechnik'
FROM public.car_brands WHERE slug = 'mitsubishi'
ON CONFLICT (brand_id, slug) DO UPDATE SET
    is_featured = true,
    display_order = 2;

-- Suzuki Modelle
INSERT INTO public.car_models (brand_id, name, slug, is_featured, display_order, description)
SELECT 
    id,
    'Swift',
    'swift',
    true,
    1,
    'Suzuki Swift - Kleinwagen, bekannt für Kompaktheit und Effizienz'
FROM public.car_brands WHERE slug = 'suzuki'
ON CONFLICT (brand_id, slug) DO UPDATE SET
    is_featured = true,
    display_order = 1;

INSERT INTO public.car_models (brand_id, name, slug, is_featured, display_order, description)
SELECT 
    id,
    'Vitara',
    'vitara',
    true,
    2,
    'Suzuki Vitara - Kompakter SUV, bekannt für Geländefähigkeit'
FROM public.car_brands WHERE slug = 'suzuki'
ON CONFLICT (brand_id, slug) DO UPDATE SET
    is_featured = true,
    display_order = 2;

-- Citroën Modelle
INSERT INTO public.car_models (brand_id, name, slug, is_featured, display_order, description)
SELECT 
    id,
    'C3',
    'c3',
    true,
    1,
    'Citroën C3 - Kleinwagen, bekannt für Komfort und Design'
FROM public.car_brands WHERE slug = 'citroen'
ON CONFLICT (brand_id, slug) DO UPDATE SET
    is_featured = true,
    display_order = 1;

INSERT INTO public.car_models (brand_id, name, slug, is_featured, display_order, description)
SELECT 
    id,
    'C4',
    'c4',
    true,
    2,
    'Citroën C4 - Kompaktklasse, bekannt für Innovation'
FROM public.car_brands WHERE slug = 'citroen'
ON CONFLICT (brand_id, slug) DO UPDATE SET
    is_featured = true,
    display_order = 2;

-- Alfa Romeo Modelle
INSERT INTO public.car_models (brand_id, name, slug, is_featured, display_order, description)
SELECT 
    id,
    'Giulietta',
    'giulietta',
    true,
    1,
    'Alfa Romeo Giulietta - Kompaktklasse, bekannt für Sportlichkeit'
FROM public.car_brands WHERE slug = 'alfa-romeo'
ON CONFLICT (brand_id, slug) DO UPDATE SET
    is_featured = true,
    display_order = 1;

INSERT INTO public.car_models (brand_id, name, slug, is_featured, display_order, description)
SELECT 
    id,
    '159',
    '159',
    true,
    2,
    'Alfa Romeo 159 - Mittelklasse-Limousine, bekannt für Design'
FROM public.car_brands WHERE slug = 'alfa-romeo'
ON CONFLICT (brand_id, slug) DO UPDATE SET
    is_featured = true,
    display_order = 2;

-- Mini Modelle
INSERT INTO public.car_models (brand_id, name, slug, is_featured, display_order, description)
SELECT 
    id,
    'Cooper',
    'cooper',
    true,
    1,
    'Mini Cooper - Kompaktklasse, bekannt für Fahrspaß und Design'
FROM public.car_brands WHERE slug = 'mini'
ON CONFLICT (brand_id, slug) DO UPDATE SET
    is_featured = true,
    display_order = 1;

INSERT INTO public.car_models (brand_id, name, slug, is_featured, display_order, description)
SELECT 
    id,
    'Countryman',
    'countryman',
    true,
    2,
    'Mini Countryman - Kompakter SUV, bekannt für Design und Raum'
FROM public.car_brands WHERE slug = 'mini'
ON CONFLICT (brand_id, slug) DO UPDATE SET
    is_featured = true,
    display_order = 2;

-- Smart Modelle
INSERT INTO public.car_models (brand_id, name, slug, is_featured, display_order, description)
SELECT 
    id,
    'Fortwo',
    'fortwo',
    true,
    1,
    'Smart Fortwo - Kleinstwagen, bekannt für Kompaktheit'
FROM public.car_brands WHERE slug = 'smart'
ON CONFLICT (brand_id, slug) DO UPDATE SET
    is_featured = true,
    display_order = 1;

-- Weitere Modelle für bestehende Marken
-- BMW 1er
INSERT INTO public.car_models (brand_id, name, slug, is_featured, display_order, description)
SELECT 
    id,
    '1er',
    '1er',
    true,
    4,
    'BMW 1er - Kompaktklasse, Einstiegsmodell von BMW'
FROM public.car_brands WHERE slug = 'bmw'
ON CONFLICT (brand_id, slug) DO UPDATE SET
    is_featured = true,
    display_order = 4;

-- Mercedes A-Klasse
INSERT INTO public.car_models (brand_id, name, slug, is_featured, display_order, description)
SELECT 
    id,
    'A-Klasse',
    'a-klasse',
    true,
    4,
    'Mercedes-Benz A-Klasse - Kompaktklasse, Einstiegsmodell von Mercedes'
FROM public.car_brands WHERE slug = 'mercedes-benz'
ON CONFLICT (brand_id, slug) DO UPDATE SET
    is_featured = true,
    display_order = 4;

-- Audi A3
INSERT INTO public.car_models (brand_id, name, slug, is_featured, display_order, description)
SELECT 
    id,
    'A3',
    'a3',
    true,
    4,
    'Audi A3 - Kompaktklasse, erfolgreichstes Modell von Audi'
FROM public.car_brands WHERE slug = 'audi'
ON CONFLICT (brand_id, slug) DO UPDATE SET
    is_featured = true,
    display_order = 4;

-- VW Polo
INSERT INTO public.car_models (brand_id, name, slug, is_featured, display_order, description)
SELECT 
    id,
    'Polo',
    'polo',
    true,
    4,
    'Volkswagen Polo - Kleinwagen, bekannt für Zuverlässigkeit'
FROM public.car_brands WHERE slug = 'volkswagen'
ON CONFLICT (brand_id, slug) DO UPDATE SET
    is_featured = true,
    display_order = 4;

-- =====================================================
-- WEITERE MODELLGENERATIONEN
-- =====================================================

-- BMW 1er Generationen
INSERT INTO public.model_generations (car_model_id, name, slug, generation_code, year_start, year_end, is_featured, display_order, description)
SELECT 
    cm.id,
    'E87 (2004-2011)',
    'e87-2004-2011',
    'E87',
    2004,
    2011,
    true,
    1,
    'BMW 1er E87 - Erste Generation, bekannt für Fahrspaß'
FROM public.car_models cm
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'bmw' AND cm.slug = '1er'
ON CONFLICT (car_model_id, slug) DO UPDATE SET
    is_featured = true,
    display_order = 1;

INSERT INTO public.model_generations (car_model_id, name, slug, generation_code, year_start, year_end, is_featured, display_order, description)
SELECT 
    cm.id,
    'F20 (2011-2019)',
    'f20-2011-2019',
    'F20',
    2011,
    2019,
    true,
    2,
    'BMW 1er F20 - Zweite Generation, bekannt für Technik'
FROM public.car_models cm
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'bmw' AND cm.slug = '1er'
ON CONFLICT (car_model_id, slug) DO UPDATE SET
    is_featured = true,
    display_order = 2;

-- Mercedes A-Klasse Generationen
INSERT INTO public.model_generations (car_model_id, name, slug, generation_code, year_start, year_end, is_featured, display_order, description)
SELECT 
    cm.id,
    'W176 (2012-2018)',
    'w176-2012-2018',
    'W176',
    2012,
    2018,
    true,
    1,
    'Mercedes-Benz A-Klasse W176 - Dritte Generation, bekannt für Design'
FROM public.car_models cm
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'mercedes-benz' AND cm.slug = 'a-klasse'
ON CONFLICT (car_model_id, slug) DO UPDATE SET
    is_featured = true,
    display_order = 1;

INSERT INTO public.model_generations (car_model_id, name, slug, generation_code, year_start, year_end, is_featured, display_order, description)
SELECT 
    cm.id,
    'W177 (2018-)',
    'w177-2018',
    'W177',
    2018,
    NULL,
    true,
    2,
    'Mercedes-Benz A-Klasse W177 - Vierte Generation, aktuelle Generation'
FROM public.car_models cm
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'mercedes-benz' AND cm.slug = 'a-klasse'
ON CONFLICT (car_model_id, slug) DO UPDATE SET
    is_featured = true,
    display_order = 2;

-- Audi A3 Generationen
INSERT INTO public.model_generations (car_model_id, name, slug, generation_code, year_start, year_end, is_featured, display_order, description)
SELECT 
    cm.id,
    'A3 8P (2003-2013)',
    'a3-8p-2003-2013',
    '8P',
    2003,
    2013,
    true,
    1,
    'Audi A3 8P - Zweite Generation, bekannt für Qualität'
FROM public.car_models cm
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'audi' AND cm.slug = 'a3'
ON CONFLICT (car_model_id, slug) DO UPDATE SET
    is_featured = true,
    display_order = 1;

INSERT INTO public.model_generations (car_model_id, name, slug, generation_code, year_start, year_end, is_featured, display_order, description)
SELECT 
    cm.id,
    'A3 8Y (2020-)',
    'a3-8y-2020',
    '8Y',
    2020,
    NULL,
    true,
    2,
    'Audi A3 8Y - Vierte Generation, aktuelle Generation'
FROM public.car_models cm
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'audi' AND cm.slug = 'a3'
ON CONFLICT (car_model_id, slug) DO UPDATE SET
    is_featured = true,
    display_order = 2;

-- VW Polo Generationen
INSERT INTO public.model_generations (car_model_id, name, slug, generation_code, year_start, year_end, is_featured, display_order, description)
SELECT 
    cm.id,
    'Polo 9N (2001-2009)',
    'polo-9n-2001-2009',
    '9N',
    2001,
    2009,
    true,
    1,
    'Volkswagen Polo 9N - Vierte Generation, bekannt für Zuverlässigkeit'
FROM public.car_models cm
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'volkswagen' AND cm.slug = 'polo'
ON CONFLICT (car_model_id, slug) DO UPDATE SET
    is_featured = true,
    display_order = 1;

INSERT INTO public.model_generations (car_model_id, name, slug, generation_code, year_start, year_end, is_featured, display_order, description)
SELECT 
    cm.id,
    'Polo AW (2017-)',
    'polo-aw-2017',
    'AW',
    2017,
    NULL,
    true,
    2,
    'Volkswagen Polo AW - Sechste Generation, aktuelle Generation'
FROM public.car_models cm
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'volkswagen' AND cm.slug = 'polo'
ON CONFLICT (car_model_id, slug) DO UPDATE SET
    is_featured = true,
    display_order = 2;

-- Kia Ceed Generationen
INSERT INTO public.model_generations (car_model_id, name, slug, generation_code, year_start, year_end, is_featured, display_order, description)
SELECT 
    cm.id,
    'Ceed JD (2006-2012)',
    'ceed-jd-2006-2012',
    'JD',
    2006,
    2012,
    true,
    1,
    'Kia Ceed JD - Erste Generation, bekannt für Wert'
FROM public.car_models cm
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'kia' AND cm.slug = 'ceed'
ON CONFLICT (car_model_id, slug) DO UPDATE SET
    is_featured = true,
    display_order = 1;

INSERT INTO public.model_generations (car_model_id, name, slug, generation_code, year_start, year_end, is_featured, display_order, description)
SELECT 
    cm.id,
    'Ceed CD (2018-)',
    'ceed-cd-2018',
    'CD',
    2018,
    NULL,
    true,
    2,
    'Kia Ceed CD - Dritte Generation, aktuelle Generation'
FROM public.car_models cm
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'kia' AND cm.slug = 'ceed'
ON CONFLICT (car_model_id, slug) DO UPDATE SET
    is_featured = true,
    display_order = 2;

-- Subaru Impreza Generationen
INSERT INTO public.model_generations (car_model_id, name, slug, generation_code, year_start, year_end, is_featured, display_order, description)
SELECT 
    cm.id,
    'Impreza GD (2000-2007)',
    'impreza-gd-2000-2007',
    'GD',
    2000,
    2007,
    true,
    1,
    'Subaru Impreza GD - Zweite Generation, bekannt für Allradantrieb'
FROM public.car_models cm
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'subaru' AND cm.slug = 'impreza'
ON CONFLICT (car_model_id, slug) DO UPDATE SET
    is_featured = true,
    display_order = 1;

-- Mini Cooper Generationen
INSERT INTO public.model_generations (car_model_id, name, slug, generation_code, year_start, year_end, is_featured, display_order, description)
SELECT 
    cm.id,
    'Cooper R50 (2001-2006)',
    'cooper-r50-2001-2006',
    'R50',
    2001,
    2006,
    true,
    1,
    'Mini Cooper R50 - Erste Generation, bekannt für Fahrspaß'
FROM public.car_models cm
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'mini' AND cm.slug = 'cooper'
ON CONFLICT (car_model_id, slug) DO UPDATE SET
    is_featured = true,
    display_order = 1;

INSERT INTO public.model_generations (car_model_id, name, slug, generation_code, year_start, year_end, is_featured, display_order, description)
SELECT 
    cm.id,
    'Cooper F56 (2014-)',
    'cooper-f56-2014',
    'F56',
    2014,
    NULL,
    true,
    2,
    'Mini Cooper F56 - Dritte Generation, aktuelle Generation'
FROM public.car_models cm
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'mini' AND cm.slug = 'cooper'
ON CONFLICT (car_model_id, slug) DO UPDATE SET
    is_featured = true,
    display_order = 2;

-- =====================================================
-- FERTIG!
-- =====================================================
-- Umfassende Seed-Daten wurden erfolgreich eingefügt.
-- Insgesamt wurden hinzugefügt:
-- - 8 weitere Automarken
-- - 15+ weitere Automodelle
-- - 10+ weitere Modellgenerationen
-- =====================================================

