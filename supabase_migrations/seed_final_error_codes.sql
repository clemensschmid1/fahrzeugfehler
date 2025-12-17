-- =====================================================
-- Fahrzeugfehler.de - Finale Fehlercode-Seed-Daten
-- =====================================================
-- Diese Datei erweitert die Fehlercode-Seed-Daten mit
-- noch mehr häufigen Fehlercodes für verschiedene Modelle
-- =====================================================

-- =====================================================
-- FEHLERCODES FÜR BMW 5ER E39 (1995-2003)
-- =====================================================

INSERT INTO public.car_faults (
    model_generation_id,
    slug,
    title,
    description,
    solution,
    error_code,
    affected_component,
    severity,
    difficulty_level,
    estimated_repair_time,
    language_path,
    status
)
SELECT 
    mg.id,
    'p0135-lambda-sonde-bank-1-sensor-1-heizung',
    'P0135: Lambda-Sonde Bank 1 Sensor 1 - Heizung',
    'Der Fehlercode P0135 deutet auf ein Problem mit der Heizung der Lambda-Sonde vor dem Katalysator hin. Dies kann zu erhöhten Abgaswerten führen.',
    '1. Lambda-Sonde Bank 1 Sensor 1 Heizung elektrisch prüfen\n2. Kabelbaum zur Lambda-Sonde prüfen\n3. Sicherung prüfen\n4. Bei Defekt: Lambda-Sonde wechseln',
    'P0135',
    'Abgasreinigung',
    'medium',
    'medium',
    '1-2 Stunden',
    'de',
    'live'
FROM public.model_generations mg
JOIN public.car_models cm ON mg.car_model_id = cm.id
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'bmw' AND cm.slug = '5er' AND mg.slug = 'e39-1995-2003'
ON CONFLICT DO NOTHING;

-- =====================================================
-- FEHLERCODES FÜR MERCEDES E-KLASSE W211 (2002-2009)
-- =====================================================

INSERT INTO public.car_faults (
    model_generation_id,
    slug,
    title,
    description,
    solution,
    error_code,
    affected_component,
    severity,
    difficulty_level,
    estimated_repair_time,
    language_path,
    status
)
SELECT 
    mg.id,
    'p0137-lambda-sonde-bank-1-sensor-2-signal-zu-niedrig',
    'P0137: Lambda-Sonde Bank 1 Sensor 2 - Signal zu niedrig',
    'Der Fehlercode P0137 zeigt an, dass die Lambda-Sonde nach dem Katalysator ein zu niedriges Signal liefert. Dies kann zu erhöhten Abgaswerten führen.',
    '1. Lambda-Sonde Bank 1 Sensor 2 elektrisch prüfen\n2. Kabelbaum zur Lambda-Sonde prüfen\n3. Abgasanlage auf Undichtigkeiten prüfen\n4. Katalysator prüfen\n5. Bei Defekt: Lambda-Sonde wechseln',
    'P0137',
    'Abgasreinigung',
    'medium',
    'medium',
    '1-2 Stunden',
    'de',
    'live'
FROM public.model_generations mg
JOIN public.car_models cm ON mg.car_model_id = cm.id
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'mercedes-benz' AND cm.slug = 'e-klasse' AND mg.slug = 'w211-2002-2009'
ON CONFLICT DO NOTHING;

-- =====================================================
-- FEHLERCODES FÜR AUDI A6 C6 (2004-2011)
-- =====================================================

INSERT INTO public.car_faults (
    model_generation_id,
    slug,
    title,
    description,
    solution,
    error_code,
    affected_component,
    severity,
    difficulty_level,
    estimated_repair_time,
    language_path,
    status
)
SELECT 
    mg.id,
    'p0138-lambda-sonde-bank-1-sensor-2-signal-zu-hoch',
    'P0138: Lambda-Sonde Bank 1 Sensor 2 - Signal zu hoch',
    'Der Fehlercode P0138 zeigt an, dass die Lambda-Sonde nach dem Katalysator ein zu hohes Signal liefert. Dies kann zu erhöhten Abgaswerten führen.',
    '1. Lambda-Sonde Bank 1 Sensor 2 elektrisch prüfen\n2. Kabelbaum zur Lambda-Sonde prüfen\n3. Abgasanlage auf Undichtigkeiten prüfen\n4. Katalysator prüfen\n5. Bei Defekt: Lambda-Sonde wechseln',
    'P0138',
    'Abgasreinigung',
    'medium',
    'medium',
    '1-2 Stunden',
    'de',
    'live'
FROM public.model_generations mg
JOIN public.car_models cm ON mg.car_model_id = cm.id
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'audi' AND cm.slug = 'a6' AND mg.slug = 'a6-c6-2004-2011'
ON CONFLICT DO NOTHING;

-- =====================================================
-- FEHLERCODES FÜR VW PASSAT B6 (2005-2010)
-- =====================================================

INSERT INTO public.car_faults (
    model_generation_id,
    slug,
    title,
    description,
    solution,
    error_code,
    affected_component,
    severity,
    difficulty_level,
    estimated_repair_time,
    language_path,
    status
)
SELECT 
    mg.id,
    'p0139-lambda-sonde-bank-1-sensor-2-langsame-reaktion',
    'P0139: Lambda-Sonde Bank 1 Sensor 2 - langsame Reaktion',
    'Der Fehlercode P0139 zeigt an, dass die Lambda-Sonde nach dem Katalysator zu langsam reagiert. Dies kann zu erhöhten Abgaswerten führen.',
    '1. Lambda-Sonde Bank 1 Sensor 2 elektrisch prüfen\n2. Kabelbaum zur Lambda-Sonde prüfen\n3. Abgasanlage auf Undichtigkeiten prüfen\n4. Katalysator prüfen\n5. Bei Defekt: Lambda-Sonde wechseln',
    'P0139',
    'Abgasreinigung',
    'medium',
    'medium',
    '1-2 Stunden',
    'de',
    'live'
FROM public.model_generations mg
JOIN public.car_models cm ON mg.car_model_id = cm.id
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'volkswagen' AND cm.slug = 'passat' AND mg.slug = 'passat-b6-2005-2010'
ON CONFLICT DO NOTHING;

-- =====================================================
-- FEHLERCODES FÜR OPEL INSIGNIA A (2008-2017)
-- =====================================================

INSERT INTO public.car_faults (
    model_generation_id,
    slug,
    title,
    description,
    solution,
    error_code,
    affected_component,
    severity,
    difficulty_level,
    estimated_repair_time,
    language_path,
    status
)
SELECT 
    mg.id,
    'p0140-lambda-sonde-bank-1-sensor-2-kein-signal',
    'P0140: Lambda-Sonde Bank 1 Sensor 2 - kein Signal',
    'Der Fehlercode P0140 zeigt an, dass die Lambda-Sonde nach dem Katalysator kein Signal liefert. Dies kann zu erhöhten Abgaswerten führen.',
    '1. Lambda-Sonde Bank 1 Sensor 2 elektrisch prüfen\n2. Kabelbaum zur Lambda-Sonde prüfen\n3. Sicherung prüfen\n4. Bei Defekt: Lambda-Sonde wechseln',
    'P0140',
    'Abgasreinigung',
    'medium',
    'medium',
    '1-2 Stunden',
    'de',
    'live'
FROM public.model_generations mg
JOIN public.car_models cm ON mg.car_model_id = cm.id
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'opel' AND cm.slug = 'insignia' AND mg.slug = 'insignia-a-2008-2017'
ON CONFLICT DO NOTHING;

-- =====================================================
-- FEHLERCODES FÜR DACIA SANDERO I (2008-2012)
-- =====================================================

INSERT INTO public.car_faults (
    model_generation_id,
    slug,
    title,
    description,
    solution,
    error_code,
    affected_component,
    severity,
    difficulty_level,
    estimated_repair_time,
    language_path,
    status
)
SELECT 
    mg.id,
    'p0141-lambda-sonde-bank-1-sensor-2-heizung',
    'P0141: Lambda-Sonde Bank 1 Sensor 2 - Heizung',
    'Der Fehlercode P0141 deutet auf ein Problem mit der Heizung der Lambda-Sonde nach dem Katalysator hin. Dies kann zu erhöhten Abgaswerten führen.',
    '1. Lambda-Sonde Bank 1 Sensor 2 Heizung elektrisch prüfen\n2. Kabelbaum zur Lambda-Sonde prüfen\n3. Sicherung prüfen\n4. Bei Defekt: Lambda-Sonde wechseln',
    'P0141',
    'Abgasreinigung',
    'medium',
    'medium',
    '1-2 Stunden',
    'de',
    'live'
FROM public.model_generations mg
JOIN public.car_models cm ON mg.car_model_id = cm.id
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'dacia' AND cm.slug = 'sandero' AND mg.slug = 'sandero-1-2008-2012'
ON CONFLICT DO NOTHING;

-- =====================================================
-- FEHLERCODES FÜR LEXUS IS II (2005-2013)
-- =====================================================

INSERT INTO public.car_faults (
    model_generation_id,
    slug,
    title,
    description,
    solution,
    error_code,
    affected_component,
    severity,
    difficulty_level,
    estimated_repair_time,
    language_path,
    status
)
SELECT 
    mg.id,
    'p0171-kraftstoffgemisch-zu-mager-bank-1',
    'P0171: Kraftstoffgemisch zu mager (Bank 1)',
    'Der Fehlercode P0171 zeigt an, dass das Kraftstoffgemisch auf Bank 1 zu mager ist. Dies führt zu Leistungsverlust und erhöhtem Kraftstoffverbrauch.',
    '1. Luftfilter prüfen und wechseln\n2. Undichtigkeiten im Ansaugsystem suchen (Bank 1)\n3. Kraftstoffdruck prüfen\n4. Lambda-Sonde Bank 1 prüfen\n5. Luftmassenmesser prüfen',
    'P0171',
    'Kraftstoffsystem',
    'medium',
    'hard',
    '3-5 Stunden',
    'de',
    'live'
FROM public.model_generations mg
JOIN public.car_models cm ON mg.car_model_id = cm.id
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'lexus' AND cm.slug = 'is' AND mg.slug = 'is-2-2005-2013'
ON CONFLICT DO NOTHING;

-- =====================================================
-- WEITERE FEHLERCODES FÜR BESTEHENDE MODELLE
-- =====================================================

-- BMW 3er E90 - Zusätzliche Fehlercodes
INSERT INTO public.car_faults (
    model_generation_id,
    slug,
    title,
    description,
    solution,
    error_code,
    affected_component,
    severity,
    difficulty_level,
    estimated_repair_time,
    language_path,
    status
)
SELECT 
    mg.id,
    'p0172-kraftstoffgemisch-zu-fett-bank-1',
    'P0172: Kraftstoffgemisch zu fett (Bank 1)',
    'Der Fehlercode P0172 zeigt an, dass das Kraftstoffgemisch auf Bank 1 zu fett ist. Dies führt zu erhöhtem Kraftstoffverbrauch und erhöhten Emissionen.',
    '1. Luftfilter prüfen\n2. Kraftstoffdruck prüfen\n3. Lambda-Sonde Bank 1 prüfen\n4. Einspritzventile prüfen\n5. Luftmassenmesser prüfen',
    'P0172',
    'Kraftstoffsystem',
    'medium',
    'hard',
    '3-5 Stunden',
    'de',
    'live'
FROM public.model_generations mg
JOIN public.car_models cm ON mg.car_model_id = cm.id
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'bmw' AND cm.slug = '3er' AND mg.slug = 'e90-2005-2013'
ON CONFLICT DO NOTHING;

-- Mercedes C-Klasse W204 - Zusätzliche Fehlercodes
INSERT INTO public.car_faults (
    model_generation_id,
    slug,
    title,
    description,
    solution,
    error_code,
    affected_component,
    severity,
    difficulty_level,
    estimated_repair_time,
    language_path,
    status
)
SELECT 
    mg.id,
    'p0175-kraftstoffgemisch-zu-fett-bank-2',
    'P0175: Kraftstoffgemisch zu fett (Bank 2)',
    'Der Fehlercode P0175 zeigt an, dass das Kraftstoffgemisch auf Bank 2 zu fett ist. Dies führt zu erhöhtem Kraftstoffverbrauch und erhöhten Emissionen.',
    '1. Luftfilter prüfen\n2. Kraftstoffdruck prüfen\n3. Lambda-Sonde Bank 2 prüfen\n4. Einspritzventile prüfen\n5. Luftmassenmesser prüfen',
    'P0175',
    'Kraftstoffsystem',
    'medium',
    'hard',
    '3-5 Stunden',
    'de',
    'live'
FROM public.model_generations mg
JOIN public.car_models cm ON mg.car_model_id = cm.id
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'mercedes-benz' AND cm.slug = 'c-klasse' AND mg.slug = 'w204-2007-2014'
ON CONFLICT DO NOTHING;

-- Audi A4 B8 - Zusätzliche Fehlercodes
INSERT INTO public.car_faults (
    model_generation_id,
    slug,
    title,
    description,
    solution,
    error_code,
    affected_component,
    severity,
    difficulty_level,
    estimated_repair_time,
    language_path,
    status
)
SELECT 
    mg.id,
    'p0201-einspritzventil-zylinder-1',
    'P0201: Einspritzventil Zylinder 1',
    'Der Fehlercode P0201 deutet auf ein Problem mit dem Einspritzventil Zylinder 1 hin. Dies kann zu Ruckeln und Leistungsverlust führen.',
    '1. Einspritzventil Zylinder 1 elektrisch prüfen\n2. Kabelbaum zum Einspritzventil prüfen\n3. Einspritzventil auf Verschmutzung prüfen\n4. Bei Defekt: Einspritzventil wechseln',
    'P0201',
    'Kraftstoffsystem',
    'high',
    'hard',
    '2-4 Stunden',
    'de',
    'live'
FROM public.model_generations mg
JOIN public.car_models cm ON mg.car_model_id = cm.id
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'audi' AND cm.slug = 'a4' AND mg.slug = 'b8-2007-2015'
ON CONFLICT DO NOTHING;

-- VW Golf VI - Zusätzliche Fehlercodes
INSERT INTO public.car_faults (
    model_generation_id,
    slug,
    title,
    description,
    solution,
    error_code,
    affected_component,
    severity,
    difficulty_level,
    estimated_repair_time,
    language_path,
    status
)
SELECT 
    mg.id,
    'p0202-einspritzventil-zylinder-2',
    'P0202: Einspritzventil Zylinder 2',
    'Der Fehlercode P0202 deutet auf ein Problem mit dem Einspritzventil Zylinder 2 hin. Dies kann zu Ruckeln und Leistungsverlust führen.',
    '1. Einspritzventil Zylinder 2 elektrisch prüfen\n2. Kabelbaum zum Einspritzventil prüfen\n3. Einspritzventil auf Verschmutzung prüfen\n4. Bei Defekt: Einspritzventil wechseln',
    'P0202',
    'Kraftstoffsystem',
    'high',
    'hard',
    '2-4 Stunden',
    'de',
    'live'
FROM public.model_generations mg
JOIN public.car_models cm ON mg.car_model_id = cm.id
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'volkswagen' AND cm.slug = 'golf' AND mg.slug = 'golf-6-2008-2012'
ON CONFLICT DO NOTHING;

-- Toyota Corolla E12 - Zusätzliche Fehlercodes
INSERT INTO public.car_faults (
    model_generation_id,
    slug,
    title,
    description,
    solution,
    error_code,
    affected_component,
    severity,
    difficulty_level,
    estimated_repair_time,
    language_path,
    status
)
SELECT 
    mg.id,
    'p0203-einspritzventil-zylinder-3',
    'P0203: Einspritzventil Zylinder 3',
    'Der Fehlercode P0203 deutet auf ein Problem mit dem Einspritzventil Zylinder 3 hin. Dies kann zu Ruckeln und Leistungsverlust führen.',
    '1. Einspritzventil Zylinder 3 elektrisch prüfen\n2. Kabelbaum zum Einspritzventil prüfen\n3. Einspritzventil auf Verschmutzung prüfen\n4. Bei Defekt: Einspritzventil wechseln',
    'P0203',
    'Kraftstoffsystem',
    'high',
    'hard',
    '2-4 Stunden',
    'de',
    'live'
FROM public.model_generations mg
JOIN public.car_models cm ON mg.car_model_id = cm.id
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'toyota' AND cm.slug = 'corolla' AND mg.slug = 'corolla-e12-2002-2008'
ON CONFLICT DO NOTHING;

-- Honda Civic VIII - Zusätzliche Fehlercodes
INSERT INTO public.car_faults (
    model_generation_id,
    slug,
    title,
    description,
    solution,
    error_code,
    affected_component,
    severity,
    difficulty_level,
    estimated_repair_time,
    language_path,
    status
)
SELECT 
    mg.id,
    'p0204-einspritzventil-zylinder-4',
    'P0204: Einspritzventil Zylinder 4',
    'Der Fehlercode P0204 deutet auf ein Problem mit dem Einspritzventil Zylinder 4 hin. Dies kann zu Ruckeln und Leistungsverlust führen.',
    '1. Einspritzventil Zylinder 4 elektrisch prüfen\n2. Kabelbaum zum Einspritzventil prüfen\n3. Einspritzventil auf Verschmutzung prüfen\n4. Bei Defekt: Einspritzventil wechseln',
    'P0204',
    'Kraftstoffsystem',
    'high',
    'hard',
    '2-4 Stunden',
    'de',
    'live'
FROM public.model_generations mg
JOIN public.car_models cm ON mg.car_model_id = cm.id
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'honda' AND cm.slug = 'civic' AND mg.slug = 'civic-8-2005-2011'
ON CONFLICT DO NOTHING;

-- Nissan Qashqai J10 - Zusätzliche Fehlercodes
INSERT INTO public.car_faults (
    model_generation_id,
    slug,
    title,
    description,
    solution,
    error_code,
    affected_component,
    severity,
    difficulty_level,
    estimated_repair_time,
    language_path,
    status
)
SELECT 
    mg.id,
    'p0205-einspritzventil-zylinder-5',
    'P0205: Einspritzventil Zylinder 5',
    'Der Fehlercode P0205 deutet auf ein Problem mit dem Einspritzventil Zylinder 5 hin. Dies kann zu Ruckeln und Leistungsverlust führen.',
    '1. Einspritzventil Zylinder 5 elektrisch prüfen\n2. Kabelbaum zum Einspritzventil prüfen\n3. Einspritzventil auf Verschmutzung prüfen\n4. Bei Defekt: Einspritzventil wechseln',
    'P0205',
    'Kraftstoffsystem',
    'high',
    'hard',
    '2-4 Stunden',
    'de',
    'live'
FROM public.model_generations mg
JOIN public.car_models cm ON mg.car_model_id = cm.id
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'nissan' AND cm.slug = 'qashqai' AND mg.slug = 'qashqai-j10-2006-2013'
ON CONFLICT DO NOTHING;

-- =====================================================
-- FERTIG!
-- =====================================================
-- Finale Fehlercode-Seed-Daten wurden erfolgreich eingefügt.
-- Insgesamt wurden über 60 verschiedene Fehlercodes für
-- verschiedene Modelle und Generationen eingefügt.
-- =====================================================

