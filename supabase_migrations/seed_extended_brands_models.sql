-- =====================================================
-- Fahrzeugfehler.de - Erweiterte Seed-Daten
-- =====================================================
-- Diese Datei erweitert die Seed-Daten mit weiteren
-- Automarken, Modellen und Generationen
-- =====================================================

-- =====================================================
-- WEITERE AUTOMARKEN
-- =====================================================

-- Toyota
INSERT INTO public.car_brands (name, slug, country, founded_year, is_featured, display_order, description)
VALUES (
    'Toyota',
    'toyota',
    'Japan',
    1937,
    true,
    9,
    'Japanischer Automobilhersteller, bekannt für Zuverlässigkeit und Effizienz'
)
ON CONFLICT (slug) DO UPDATE SET
    is_featured = true,
    display_order = 9;

-- Honda
INSERT INTO public.car_brands (name, slug, country, founded_year, is_featured, display_order, description)
VALUES (
    'Honda',
    'honda',
    'Japan',
    1948,
    true,
    10,
    'Japanischer Automobilhersteller, bekannt für Innovation und Qualität'
)
ON CONFLICT (slug) DO UPDATE SET
    is_featured = true,
    display_order = 10;

-- Nissan
INSERT INTO public.car_brands (name, slug, country, founded_year, is_featured, display_order, description)
VALUES (
    'Nissan',
    'nissan',
    'Japan',
    1933,
    true,
    11,
    'Japanischer Automobilhersteller, bekannt für Technologie und Innovation'
)
ON CONFLICT (slug) DO UPDATE SET
    is_featured = true,
    display_order = 11;

-- Hyundai
INSERT INTO public.car_brands (name, slug, country, founded_year, is_featured, display_order, description)
VALUES (
    'Hyundai',
    'hyundai',
    'Südkorea',
    1967,
    true,
    12,
    'Südkoreanischer Automobilhersteller, bekannt für Wert und Qualität'
)
ON CONFLICT (slug) DO UPDATE SET
    is_featured = true,
    display_order = 12;

-- Mazda
INSERT INTO public.car_brands (name, slug, country, founded_year, is_featured, display_order, description)
VALUES (
    'Mazda',
    'mazda',
    'Japan',
    1920,
    true,
    13,
    'Japanischer Automobilhersteller, bekannt für Fahrspaß und Innovation'
)
ON CONFLICT (slug) DO UPDATE SET
    is_featured = true,
    display_order = 13;

-- Volvo
INSERT INTO public.car_brands (name, slug, country, founded_year, is_featured, display_order, description)
VALUES (
    'Volvo',
    'volvo',
    'Schweden',
    1927,
    true,
    14,
    'Schwedischer Automobilhersteller, bekannt für Sicherheit und Qualität'
)
ON CONFLICT (slug) DO UPDATE SET
    is_featured = true,
    display_order = 14;

-- Peugeot
INSERT INTO public.car_brands (name, slug, country, founded_year, is_featured, display_order, description)
VALUES (
    'Peugeot',
    'peugeot',
    'Frankreich',
    1810,
    true,
    15,
    'Französischer Automobilhersteller, einer der ältesten der Welt'
)
ON CONFLICT (slug) DO UPDATE SET
    is_featured = true,
    display_order = 15;

-- Renault
INSERT INTO public.car_brands (name, slug, country, founded_year, is_featured, display_order, description)
VALUES (
    'Renault',
    'renault',
    'Frankreich',
    1899,
    true,
    16,
    'Französischer Automobilhersteller, bekannt für Innovation und Design'
)
ON CONFLICT (slug) DO UPDATE SET
    is_featured = true,
    display_order = 16;

-- Seat
INSERT INTO public.car_brands (name, slug, country, founded_year, is_featured, display_order, description)
VALUES (
    'SEAT',
    'seat',
    'Spanien',
    1950,
    true,
    17,
    'Spanischer Automobilhersteller, Teil der Volkswagen-Gruppe'
)
ON CONFLICT (slug) DO UPDATE SET
    is_featured = true,
    display_order = 17;

-- Fiat
INSERT INTO public.car_brands (name, slug, country, founded_year, is_featured, display_order, description)
VALUES (
    'Fiat',
    'fiat',
    'Italien',
    1899,
    true,
    18,
    'Italienischer Automobilhersteller, bekannt für kompakte Fahrzeuge'
)
ON CONFLICT (slug) DO UPDATE SET
    is_featured = true,
    display_order = 18;

-- =====================================================
-- WEITERE AUTOMODELLE
-- =====================================================

-- Toyota Modelle
INSERT INTO public.car_models (brand_id, name, slug, is_featured, display_order, description)
SELECT 
    id,
    'Corolla',
    'corolla',
    true,
    1,
    'Toyota Corolla - Kompaktklasse, weltweit meistverkauftes Automodell'
FROM public.car_brands WHERE slug = 'toyota'
ON CONFLICT (brand_id, slug) DO UPDATE SET
    is_featured = true,
    display_order = 1;

INSERT INTO public.car_models (brand_id, name, slug, is_featured, display_order, description)
SELECT 
    id,
    'Camry',
    'camry',
    true,
    2,
    'Toyota Camry - Mittelklasse-Limousine, bekannt für Zuverlässigkeit'
FROM public.car_brands WHERE slug = 'toyota'
ON CONFLICT (brand_id, slug) DO UPDATE SET
    is_featured = true,
    display_order = 2;

INSERT INTO public.car_models (brand_id, name, slug, is_featured, display_order, description)
SELECT 
    id,
    'RAV4',
    'rav4',
    true,
    3,
    'Toyota RAV4 - Kompakter SUV, erfolgreichstes SUV-Modell von Toyota'
FROM public.car_brands WHERE slug = 'toyota'
ON CONFLICT (brand_id, slug) DO UPDATE SET
    is_featured = true,
    display_order = 3;

-- Honda Modelle
INSERT INTO public.car_models (brand_id, name, slug, is_featured, display_order, description)
SELECT 
    id,
    'Civic',
    'civic',
    true,
    1,
    'Honda Civic - Kompaktklasse, bekannt für Zuverlässigkeit und Fahrspaß'
FROM public.car_brands WHERE slug = 'honda'
ON CONFLICT (brand_id, slug) DO UPDATE SET
    is_featured = true,
    display_order = 1;

INSERT INTO public.car_models (brand_id, name, slug, is_featured, display_order, description)
SELECT 
    id,
    'Accord',
    'accord',
    true,
    2,
    'Honda Accord - Mittelklasse-Limousine, bekannt für Qualität'
FROM public.car_brands WHERE slug = 'honda'
ON CONFLICT (brand_id, slug) DO UPDATE SET
    is_featured = true,
    display_order = 2;

INSERT INTO public.car_models (brand_id, name, slug, is_featured, display_order, description)
SELECT 
    id,
    'CR-V',
    'cr-v',
    true,
    3,
    'Honda CR-V - Kompakter SUV, erfolgreichstes SUV-Modell von Honda'
FROM public.car_brands WHERE slug = 'honda'
ON CONFLICT (brand_id, slug) DO UPDATE SET
    is_featured = true,
    display_order = 3;

-- Nissan Modelle
INSERT INTO public.car_models (brand_id, name, slug, is_featured, display_order, description)
SELECT 
    id,
    'Micra',
    'micra',
    true,
    1,
    'Nissan Micra - Kleinwagen, bekannt für Kompaktheit und Effizienz'
FROM public.car_brands WHERE slug = 'nissan'
ON CONFLICT (brand_id, slug) DO UPDATE SET
    is_featured = true,
    display_order = 1;

INSERT INTO public.car_models (brand_id, name, slug, is_featured, display_order, description)
SELECT 
    id,
    'Qashqai',
    'qashqai',
    true,
    2,
    'Nissan Qashqai - Kompakter SUV, erfolgreichstes Modell von Nissan in Europa'
FROM public.car_brands WHERE slug = 'nissan'
ON CONFLICT (brand_id, slug) DO UPDATE SET
    is_featured = true,
    display_order = 2;

INSERT INTO public.car_models (brand_id, name, slug, is_featured, display_order, description)
SELECT 
    id,
    'X-Trail',
    'x-trail',
    true,
    3,
    'Nissan X-Trail - Kompakter SUV, bekannt für Allradfähigkeiten'
FROM public.car_brands WHERE slug = 'nissan'
ON CONFLICT (brand_id, slug) DO UPDATE SET
    is_featured = true,
    display_order = 3;

-- Hyundai Modelle
INSERT INTO public.car_models (brand_id, name, slug, is_featured, display_order, description)
SELECT 
    id,
    'i30',
    'i30',
    true,
    1,
    'Hyundai i30 - Kompaktklasse, bekannt für Wert und Qualität'
FROM public.car_brands WHERE slug = 'hyundai'
ON CONFLICT (brand_id, slug) DO UPDATE SET
    is_featured = true,
    display_order = 1;

INSERT INTO public.car_models (brand_id, name, slug, is_featured, display_order, description)
SELECT 
    id,
    'Tucson',
    'tucson',
    true,
    2,
    'Hyundai Tucson - Kompakter SUV, erfolgreichstes SUV-Modell von Hyundai'
FROM public.car_brands WHERE slug = 'hyundai'
ON CONFLICT (brand_id, slug) DO UPDATE SET
    is_featured = true,
    display_order = 2;

-- Mazda Modelle
INSERT INTO public.car_models (brand_id, name, slug, is_featured, display_order, description)
SELECT 
    id,
    '3',
    '3',
    true,
    1,
    'Mazda 3 - Kompaktklasse, bekannt für Fahrspaß und Design'
FROM public.car_brands WHERE slug = 'mazda'
ON CONFLICT (brand_id, slug) DO UPDATE SET
    is_featured = true,
    display_order = 1;

INSERT INTO public.car_models (brand_id, name, slug, is_featured, display_order, description)
SELECT 
    id,
    'CX-5',
    'cx-5',
    true,
    2,
    'Mazda CX-5 - Kompakter SUV, bekannt für Design und Fahrspaß'
FROM public.car_brands WHERE slug = 'mazda'
ON CONFLICT (brand_id, slug) DO UPDATE SET
    is_featured = true,
    display_order = 2;

-- Volvo Modelle
INSERT INTO public.car_models (brand_id, name, slug, is_featured, display_order, description)
SELECT 
    id,
    'V40',
    'v40',
    true,
    1,
    'Volvo V40 - Kompaktklasse, bekannt für Sicherheit und Qualität'
FROM public.car_brands WHERE slug = 'volvo'
ON CONFLICT (brand_id, slug) DO UPDATE SET
    is_featured = true,
    display_order = 1;

INSERT INTO public.car_models (brand_id, name, slug, is_featured, display_order, description)
SELECT 
    id,
    'XC60',
    'xc60',
    true,
    2,
    'Volvo XC60 - Kompakter SUV, bekannt für Sicherheit und Komfort'
FROM public.car_brands WHERE slug = 'volvo'
ON CONFLICT (brand_id, slug) DO UPDATE SET
    is_featured = true,
    display_order = 2;

-- Peugeot Modelle
INSERT INTO public.car_models (brand_id, name, slug, is_featured, display_order, description)
SELECT 
    id,
    '208',
    '208',
    true,
    1,
    'Peugeot 208 - Kleinwagen, bekannt für Design und Effizienz'
FROM public.car_brands WHERE slug = 'peugeot'
ON CONFLICT (brand_id, slug) DO UPDATE SET
    is_featured = true,
    display_order = 1;

INSERT INTO public.car_models (brand_id, name, slug, is_featured, display_order, description)
SELECT 
    id,
    '308',
    '308',
    true,
    2,
    'Peugeot 308 - Kompaktklasse, bekannt für Komfort und Design'
FROM public.car_brands WHERE slug = 'peugeot'
ON CONFLICT (brand_id, slug) DO UPDATE SET
    is_featured = true,
    display_order = 2;

-- Renault Modelle
INSERT INTO public.car_models (brand_id, name, slug, is_featured, display_order, description)
SELECT 
    id,
    'Clio',
    'clio',
    true,
    1,
    'Renault Clio - Kleinwagen, bekannt für Kompaktheit und Effizienz'
FROM public.car_brands WHERE slug = 'renault'
ON CONFLICT (brand_id, slug) DO UPDATE SET
    is_featured = true,
    display_order = 1;

INSERT INTO public.car_models (brand_id, name, slug, is_featured, display_order, description)
SELECT 
    id,
    'Megane',
    'megane',
    true,
    2,
    'Renault Megane - Kompaktklasse, bekannt für Design und Technik'
FROM public.car_brands WHERE slug = 'renault'
ON CONFLICT (brand_id, slug) DO UPDATE SET
    is_featured = true,
    display_order = 2;

-- Seat Modelle
INSERT INTO public.car_models (brand_id, name, slug, is_featured, display_order, description)
SELECT 
    id,
    'Ibiza',
    'ibiza',
    true,
    1,
    'SEAT Ibiza - Kleinwagen, bekannt für Fahrspaß und Design'
FROM public.car_brands WHERE slug = 'seat'
ON CONFLICT (brand_id, slug) DO UPDATE SET
    is_featured = true,
    display_order = 1;

INSERT INTO public.car_models (brand_id, name, slug, is_featured, display_order, description)
SELECT 
    id,
    'Leon',
    'leon',
    true,
    2,
    'SEAT Leon - Kompaktklasse, bekannt für Sportlichkeit und Design'
FROM public.car_brands WHERE slug = 'seat'
ON CONFLICT (brand_id, slug) DO UPDATE SET
    is_featured = true,
    display_order = 2;

-- Fiat Modelle
INSERT INTO public.car_models (brand_id, name, slug, is_featured, display_order, description)
SELECT 
    id,
    '500',
    '500',
    true,
    1,
    'Fiat 500 - Kleinwagen, bekannt für Design und Kompaktheit'
FROM public.car_brands WHERE slug = 'fiat'
ON CONFLICT (brand_id, slug) DO UPDATE SET
    is_featured = true,
    display_order = 1;

INSERT INTO public.car_models (brand_id, name, slug, is_featured, display_order, description)
SELECT 
    id,
    'Punto',
    'punto',
    true,
    2,
    'Fiat Punto - Kleinwagen, bekannt für Kompaktheit und Effizienz'
FROM public.car_brands WHERE slug = 'fiat'
ON CONFLICT (brand_id, slug) DO UPDATE SET
    is_featured = true,
    display_order = 2;

-- =====================================================
-- WEITERE MODELLGENERATIONEN
-- =====================================================

-- Toyota Corolla Generationen
INSERT INTO public.model_generations (car_model_id, name, slug, generation_code, year_start, year_end, is_featured, display_order, description)
SELECT 
    cm.id,
    'Corolla E12 (2002-2008)',
    'corolla-e12-2002-2008',
    'E12',
    2002,
    2008,
    true,
    1,
    'Toyota Corolla E12 - Neunte Generation, bekannt für Zuverlässigkeit'
FROM public.car_models cm
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'toyota' AND cm.slug = 'corolla'
ON CONFLICT (car_model_id, slug) DO UPDATE SET
    is_featured = true,
    display_order = 1;

INSERT INTO public.model_generations (car_model_id, name, slug, generation_code, year_start, year_end, is_featured, display_order, description)
SELECT 
    cm.id,
    'Corolla E210 (2018-)',
    'corolla-e210-2018',
    'E210',
    2018,
    NULL,
    true,
    2,
    'Toyota Corolla E210 - Zwölfte Generation, aktuelle Generation'
FROM public.car_models cm
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'toyota' AND cm.slug = 'corolla'
ON CONFLICT (car_model_id, slug) DO UPDATE SET
    is_featured = true,
    display_order = 2;

-- Honda Civic Generationen
INSERT INTO public.model_generations (car_model_id, name, slug, generation_code, year_start, year_end, is_featured, display_order, description)
SELECT 
    cm.id,
    'Civic VIII (2005-2011)',
    'civic-8-2005-2011',
    'Civic VIII',
    2005,
    2011,
    true,
    1,
    'Honda Civic VIII - Achte Generation, bekannt für Zuverlässigkeit'
FROM public.car_models cm
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'honda' AND cm.slug = 'civic'
ON CONFLICT (car_model_id, slug) DO UPDATE SET
    is_featured = true,
    display_order = 1;

INSERT INTO public.model_generations (car_model_id, name, slug, generation_code, year_start, year_end, is_featured, display_order, description)
SELECT 
    cm.id,
    'Civic X (2015-2021)',
    'civic-10-2015-2021',
    'Civic X',
    2015,
    2021,
    true,
    2,
    'Honda Civic X - Zehnte Generation, bekannt für Design und Technik'
FROM public.car_models cm
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'honda' AND cm.slug = 'civic'
ON CONFLICT (car_model_id, slug) DO UPDATE SET
    is_featured = true,
    display_order = 2;

-- Nissan Qashqai Generationen
INSERT INTO public.model_generations (car_model_id, name, slug, generation_code, year_start, year_end, is_featured, display_order, description)
SELECT 
    cm.id,
    'Qashqai J10 (2006-2013)',
    'qashqai-j10-2006-2013',
    'J10',
    2006,
    2013,
    true,
    1,
    'Nissan Qashqai J10 - Erste Generation, bekannt für Komfort'
FROM public.car_models cm
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'nissan' AND cm.slug = 'qashqai'
ON CONFLICT (car_model_id, slug) DO UPDATE SET
    is_featured = true,
    display_order = 1;

INSERT INTO public.model_generations (car_model_id, name, slug, generation_code, year_start, year_end, is_featured, display_order, description)
SELECT 
    cm.id,
    'Qashqai J11 (2013-2021)',
    'qashqai-j11-2013-2021',
    'J11',
    2013,
    2021,
    true,
    2,
    'Nissan Qashqai J11 - Zweite Generation, bekannt für Technik'
FROM public.car_models cm
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'nissan' AND cm.slug = 'qashqai'
ON CONFLICT (car_model_id, slug) DO UPDATE SET
    is_featured = true,
    display_order = 2;

-- Hyundai i30 Generationen
INSERT INTO public.model_generations (car_model_id, name, slug, generation_code, year_start, year_end, is_featured, display_order, description)
SELECT 
    cm.id,
    'i30 FD (2007-2012)',
    'i30-fd-2007-2012',
    'FD',
    2007,
    2012,
    true,
    1,
    'Hyundai i30 FD - Erste Generation, bekannt für Wert'
FROM public.car_models cm
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'hyundai' AND cm.slug = 'i30'
ON CONFLICT (car_model_id, slug) DO UPDATE SET
    is_featured = true,
    display_order = 1;

INSERT INTO public.model_generations (car_model_id, name, slug, generation_code, year_start, year_end, is_featured, display_order, description)
SELECT 
    cm.id,
    'i30 PD (2017-)',
    'i30-pd-2017',
    'PD',
    2017,
    NULL,
    true,
    2,
    'Hyundai i30 PD - Dritte Generation, aktuelle Generation'
FROM public.car_models cm
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'hyundai' AND cm.slug = 'i30'
ON CONFLICT (car_model_id, slug) DO UPDATE SET
    is_featured = true,
    display_order = 2;

-- Mazda 3 Generationen
INSERT INTO public.model_generations (car_model_id, name, slug, generation_code, year_start, year_end, is_featured, display_order, description)
SELECT 
    cm.id,
    'Mazda 3 BK (2003-2009)',
    'mazda-3-bk-2003-2009',
    'BK',
    2003,
    2009,
    true,
    1,
    'Mazda 3 BK - Erste Generation, bekannt für Fahrspaß'
FROM public.car_models cm
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'mazda' AND cm.slug = '3'
ON CONFLICT (car_model_id, slug) DO UPDATE SET
    is_featured = true,
    display_order = 1;

INSERT INTO public.model_generations (car_model_id, name, slug, generation_code, year_start, year_end, is_featured, display_order, description)
SELECT 
    cm.id,
    'Mazda 3 BP (2019-)',
    'mazda-3-bp-2019',
    'BP',
    2019,
    NULL,
    true,
    2,
    'Mazda 3 BP - Vierte Generation, aktuelle Generation'
FROM public.car_models cm
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'mazda' AND cm.slug = '3'
ON CONFLICT (car_model_id, slug) DO UPDATE SET
    is_featured = true,
    display_order = 2;

-- Peugeot 208 Generationen
INSERT INTO public.model_generations (car_model_id, name, slug, generation_code, year_start, year_end, is_featured, display_order, description)
SELECT 
    cm.id,
    '208 T9 (2012-2019)',
    '208-t9-2012-2019',
    'T9',
    2012,
    2019,
    true,
    1,
    'Peugeot 208 T9 - Erste Generation, bekannt für Design'
FROM public.car_models cm
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'peugeot' AND cm.slug = '208'
ON CONFLICT (car_model_id, slug) DO UPDATE SET
    is_featured = true,
    display_order = 1;

INSERT INTO public.model_generations (car_model_id, name, slug, generation_code, year_start, year_end, is_featured, display_order, description)
SELECT 
    cm.id,
    '208 P21 (2019-)',
    '208-p21-2019',
    'P21',
    2019,
    NULL,
    true,
    2,
    'Peugeot 208 P21 - Zweite Generation, aktuelle Generation'
FROM public.car_models cm
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'peugeot' AND cm.slug = '208'
ON CONFLICT (car_model_id, slug) DO UPDATE SET
    is_featured = true,
    display_order = 2;

-- Renault Clio Generationen
INSERT INTO public.model_generations (car_model_id, name, slug, generation_code, year_start, year_end, is_featured, display_order, description)
SELECT 
    cm.id,
    'Clio III (2005-2012)',
    'clio-3-2005-2012',
    'Clio III',
    2005,
    2012,
    true,
    1,
    'Renault Clio III - Dritte Generation, bekannt für Kompaktheit'
FROM public.car_models cm
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'renault' AND cm.slug = 'clio'
ON CONFLICT (car_model_id, slug) DO UPDATE SET
    is_featured = true,
    display_order = 1;

INSERT INTO public.model_generations (car_model_id, name, slug, generation_code, year_start, year_end, is_featured, display_order, description)
SELECT 
    cm.id,
    'Clio V (2019-)',
    'clio-5-2019',
    'Clio V',
    2019,
    NULL,
    true,
    2,
    'Renault Clio V - Fünfte Generation, aktuelle Generation'
FROM public.car_models cm
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'renault' AND cm.slug = 'clio'
ON CONFLICT (car_model_id, slug) DO UPDATE SET
    is_featured = true,
    display_order = 2;

-- SEAT Leon Generationen
INSERT INTO public.model_generations (car_model_id, name, slug, generation_code, year_start, year_end, is_featured, display_order, description)
SELECT 
    cm.id,
    'Leon 1P (2005-2012)',
    'leon-1p-2005-2012',
    '1P',
    2005,
    2012,
    true,
    1,
    'SEAT Leon 1P - Erste Generation, bekannt für Sportlichkeit'
FROM public.car_models cm
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'seat' AND cm.slug = 'leon'
ON CONFLICT (car_model_id, slug) DO UPDATE SET
    is_featured = true,
    display_order = 1;

INSERT INTO public.model_generations (car_model_id, name, slug, generation_code, year_start, year_end, is_featured, display_order, description)
SELECT 
    cm.id,
    'Leon 5F (2012-2020)',
    'leon-5f-2012-2020',
    '5F',
    2012,
    2020,
    true,
    2,
    'SEAT Leon 5F - Dritte Generation, bekannt für Design'
FROM public.car_models cm
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'seat' AND cm.slug = 'leon'
ON CONFLICT (car_model_id, slug) DO UPDATE SET
    is_featured = true,
    display_order = 2;

-- Fiat 500 Generationen
INSERT INTO public.model_generations (car_model_id, name, slug, generation_code, year_start, year_end, is_featured, display_order, description)
SELECT 
    cm.id,
    '500 312 (2007-)',
    '500-312-2007',
    '312',
    2007,
    NULL,
    true,
    1,
    'Fiat 500 312 - Moderne Generation, bekannt für Design'
FROM public.car_models cm
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'fiat' AND cm.slug = '500'
ON CONFLICT (car_model_id, slug) DO UPDATE SET
    is_featured = true,
    display_order = 1;

-- =====================================================
-- FERTIG!
-- =====================================================
-- Erweiterte Seed-Daten wurden erfolgreich eingefügt.
-- Insgesamt wurden hinzugefügt:
-- - 10 weitere Automarken
-- - 20+ weitere Automodelle
-- - 15+ weitere Modellgenerationen
-- =====================================================

