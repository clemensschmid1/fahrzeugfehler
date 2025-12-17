-- =====================================================
-- Fahrzeugfehler.de - Umfassende Fehlercode-Seed-Daten
-- =====================================================
-- Diese Datei erweitert die Fehlercode-Seed-Daten mit
-- noch mehr häufigen Fehlercodes für verschiedene Modelle
-- =====================================================

-- =====================================================
-- FEHLERCODES FÜR KIA CEED JD (2006-2012)
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
    'p0117-kuehlmitteltemperatursensor-signal-zu-niedrig',
    'P0117: Kühlmitteltemperatursensor - Signal zu niedrig',
    'Der Fehlercode P0117 zeigt an, dass der Kühlmitteltemperatursensor ein zu niedriges Signal liefert. Dies kann zu erhöhtem Kraftstoffverbrauch führen.',
    '1. Kühlmitteltemperatursensor elektrisch prüfen\n2. Kabelbaum zum Sensor prüfen\n3. Kühlmittelstand prüfen\n4. Bei Defekt: Sensor wechseln',
    'P0117',
    'Kühlsystem',
    'low',
    'easy',
    '1-2 Stunden',
    'de',
    'live'
FROM public.model_generations mg
JOIN public.car_models cm ON mg.car_model_id = cm.id
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'kia' AND cm.slug = 'ceed' AND mg.slug = 'ceed-jd-2006-2012'
ON CONFLICT DO NOTHING;

-- =====================================================
-- FEHLERCODES FÜR SUBARU IMPREZA GD (2000-2007)
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
    'p0118-kuehlmitteltemperatursensor-signal-zu-hoch',
    'P0118: Kühlmitteltemperatursensor - Signal zu hoch',
    'Der Fehlercode P0118 zeigt an, dass der Kühlmitteltemperatursensor ein zu hohes Signal liefert. Dies kann zu erhöhtem Kraftstoffverbrauch führen.',
    '1. Kühlmitteltemperatursensor elektrisch prüfen\n2. Kabelbaum zum Sensor prüfen\n3. Kühlmittelstand prüfen\n4. Bei Defekt: Sensor wechseln',
    'P0118',
    'Kühlsystem',
    'low',
    'easy',
    '1-2 Stunden',
    'de',
    'live'
FROM public.model_generations mg
JOIN public.car_models cm ON mg.car_model_id = cm.id
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'subaru' AND cm.slug = 'impreza' AND mg.slug = 'impreza-gd-2000-2007'
ON CONFLICT DO NOTHING;

-- =====================================================
-- FEHLERCODES FÜR MINI COOPER R50 (2001-2006)
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
    'p0119-kuehlmitteltemperatursensor-bereichsfehler',
    'P0119: Kühlmitteltemperatursensor - Bereichsfehler',
    'Der Fehlercode P0119 deutet auf ein Problem mit dem Kühlmitteltemperatursensor hin. Dies kann zu erhöhtem Kraftstoffverbrauch führen.',
    '1. Kühlmitteltemperatursensor elektrisch prüfen\n2. Kabelbaum zum Sensor prüfen\n3. Kühlmittelstand prüfen\n4. Bei Defekt: Sensor wechseln',
    'P0119',
    'Kühlsystem',
    'low',
    'easy',
    '1-2 Stunden',
    'de',
    'live'
FROM public.model_generations mg
JOIN public.car_models cm ON mg.car_model_id = cm.id
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'mini' AND cm.slug = 'cooper' AND mg.slug = 'cooper-r50-2001-2006'
ON CONFLICT DO NOTHING;

-- =====================================================
-- FEHLERCODES FÜR BMW 1ER E87 (2004-2011)
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
    'p0120-drosselklappenpositionssensor-signal-zu-niedrig',
    'P0120: Drosselklappenpositionssensor - Signal zu niedrig',
    'Der Fehlercode P0120 zeigt an, dass der Drosselklappenpositionssensor ein zu niedriges Signal liefert. Dies kann zu Leistungsverlust führen.',
    '1. Drosselklappenpositionssensor elektrisch prüfen\n2. Drosselklappe reinigen\n3. Kabelbaum prüfen\n4. Drosselklappenadaption durchführen\n5. Bei Defekt: Sensor oder Drosselklappe wechseln',
    'P0120',
    'Drosselklappe',
    'high',
    'hard',
    '2-4 Stunden',
    'de',
    'live'
FROM public.model_generations mg
JOIN public.car_models cm ON mg.car_model_id = cm.id
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'bmw' AND cm.slug = '1er' AND mg.slug = 'e87-2004-2011'
ON CONFLICT DO NOTHING;

-- =====================================================
-- FEHLERCODES FÜR MERCEDES A-KLASSE W176 (2012-2018)
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
    'p0121-drosselklappenpositionssensor-signal-zu-hoch',
    'P0121: Drosselklappenpositionssensor - Signal zu hoch',
    'Der Fehlercode P0121 zeigt an, dass der Drosselklappenpositionssensor ein zu hohes Signal liefert. Dies kann zu Leistungsverlust führen.',
    '1. Drosselklappenpositionssensor elektrisch prüfen\n2. Drosselklappe reinigen\n3. Kabelbaum prüfen\n4. Drosselklappenadaption durchführen\n5. Bei Defekt: Sensor oder Drosselklappe wechseln',
    'P0121',
    'Drosselklappe',
    'high',
    'hard',
    '2-4 Stunden',
    'de',
    'live'
FROM public.model_generations mg
JOIN public.car_models cm ON mg.car_model_id = cm.id
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'mercedes-benz' AND cm.slug = 'a-klasse' AND mg.slug = 'w176-2012-2018'
ON CONFLICT DO NOTHING;

-- =====================================================
-- FEHLERCODES FÜR AUDI A3 8P (2003-2013)
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
    'p0122-drosselklappenpositionssensor-signal-zu-niedrig',
    'P0122: Drosselklappenpositionssensor - Signal zu niedrig',
    'Der Fehlercode P0122 zeigt an, dass der Drosselklappenpositionssensor ein zu niedriges Signal liefert. Dies kann zu Leistungsverlust führen.',
    '1. Drosselklappenpositionssensor elektrisch prüfen\n2. Drosselklappe reinigen\n3. Kabelbaum prüfen\n4. Drosselklappenadaption durchführen\n5. Bei Defekt: Sensor oder Drosselklappe wechseln',
    'P0122',
    'Drosselklappe',
    'high',
    'hard',
    '2-4 Stunden',
    'de',
    'live'
FROM public.model_generations mg
JOIN public.car_models cm ON mg.car_model_id = cm.id
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'audi' AND cm.slug = 'a3' AND mg.slug = 'a3-8p-2003-2013'
ON CONFLICT DO NOTHING;

-- =====================================================
-- FEHLERCODES FÜR VW POLO 9N (2001-2009)
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
    'p0123-drosselklappenpositionssensor-signal-zu-hoch',
    'P0123: Drosselklappenpositionssensor - Signal zu hoch',
    'Der Fehlercode P0123 zeigt an, dass der Drosselklappenpositionssensor ein zu hohes Signal liefert. Dies kann zu Leistungsverlust führen.',
    '1. Drosselklappenpositionssensor elektrisch prüfen\n2. Drosselklappe reinigen\n3. Kabelbaum prüfen\n4. Drosselklappenadaption durchführen\n5. Bei Defekt: Sensor oder Drosselklappe wechseln',
    'P0123',
    'Drosselklappe',
    'high',
    'hard',
    '2-4 Stunden',
    'de',
    'live'
FROM public.model_generations mg
JOIN public.car_models cm ON mg.car_model_id = cm.id
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'volkswagen' AND cm.slug = 'polo' AND mg.slug = 'polo-9n-2001-2009'
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
    'p0124-drosselklappenpositionssensor-bereichsfehler',
    'P0124: Drosselklappenpositionssensor - Bereichsfehler',
    'Der Fehlercode P0124 deutet auf ein Problem mit dem Drosselklappenpositionssensor hin. Dies kann zu Leistungsverlust führen.',
    '1. Drosselklappenpositionssensor elektrisch prüfen\n2. Drosselklappe reinigen\n3. Kabelbaum prüfen\n4. Drosselklappenadaption durchführen\n5. Bei Defekt: Sensor oder Drosselklappe wechseln',
    'P0124',
    'Drosselklappe',
    'high',
    'hard',
    '2-4 Stunden',
    'de',
    'live'
FROM public.model_generations mg
JOIN public.car_models cm ON mg.car_model_id = cm.id
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'bmw' AND cm.slug = '3er' AND mg.slug = 'e90-2005-2013'
ON CONFLICT DO NOTHING;

-- Mercedes C-Klasse W205 - Zusätzliche Fehlercodes
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
    'p0125-kuehlmitteltemperatursensor-zu-lange-zeit-zu-niedrig',
    'P0125: Kühlmitteltemperatursensor - zu lange Zeit zu niedrig',
    'Der Fehlercode P0125 zeigt an, dass die Kühlmitteltemperatur zu lange zu niedrig war. Dies kann zu erhöhtem Kraftstoffverbrauch führen.',
    '1. Kühlmittelthermostat prüfen (klemmt offen?)\n2. Kühlmitteltemperatursensor prüfen\n3. Kühlmittelstand prüfen\n4. Bei Defekt: Thermostat wechseln',
    'P0125',
    'Kühlsystem',
    'low',
    'easy',
    '1-2 Stunden',
    'de',
    'live'
FROM public.model_generations mg
JOIN public.car_models cm ON mg.car_model_id = cm.id
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'mercedes-benz' AND cm.slug = 'c-klasse' AND mg.slug = 'w205-2014-2021'
ON CONFLICT DO NOTHING;

-- Audi A4 B9 - Zusätzliche Fehlercodes
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
    'p0126-kuehlmitteltemperatur-zu-niedrig-fuer-geschlossene-schleife',
    'P0126: Kühlmitteltemperatur zu niedrig für geschlossene Schleife',
    'Der Fehlercode P0126 zeigt an, dass die Kühlmitteltemperatur zu niedrig ist, um in die geschlossene Regelung zu gehen. Dies kann zu erhöhtem Kraftstoffverbrauch führen.',
    '1. Kühlmittelthermostat prüfen (klemmt offen?)\n2. Kühlmitteltemperatursensor prüfen\n3. Kühlmittelstand prüfen\n4. Bei Defekt: Thermostat wechseln',
    'P0126',
    'Kühlsystem',
    'low',
    'easy',
    '1-2 Stunden',
    'de',
    'live'
FROM public.model_generations mg
JOIN public.car_models cm ON mg.car_model_id = cm.id
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'audi' AND cm.slug = 'a4' AND mg.slug = 'b9-2015'
ON CONFLICT DO NOTHING;

-- VW Golf VII - Zusätzliche Fehlercodes
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
    'p0130-lambda-sonde-bank-1-sensor-1',
    'P0130: Lambda-Sonde Bank 1 Sensor 1',
    'Der Fehlercode P0130 deutet auf ein Problem mit der Lambda-Sonde vor dem Katalysator hin. Dies kann zu erhöhten Abgaswerten führen.',
    '1. Lambda-Sonde Bank 1 Sensor 1 elektrisch prüfen\n2. Kabelbaum zur Lambda-Sonde prüfen\n3. Abgasanlage auf Undichtigkeiten prüfen\n4. Bei Defekt: Lambda-Sonde wechseln',
    'P0130',
    'Abgasreinigung',
    'medium',
    'medium',
    '1-2 Stunden',
    'de',
    'live'
FROM public.model_generations mg
JOIN public.car_models cm ON mg.car_model_id = cm.id
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'volkswagen' AND cm.slug = 'golf' AND mg.slug = 'golf-7-2012-2019'
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
    'p0131-lambda-sonde-bank-1-sensor-1-signal-zu-niedrig',
    'P0131: Lambda-Sonde Bank 1 Sensor 1 - Signal zu niedrig',
    'Der Fehlercode P0131 zeigt an, dass die Lambda-Sonde vor dem Katalysator ein zu niedriges Signal liefert. Dies kann zu erhöhten Abgaswerten führen.',
    '1. Lambda-Sonde Bank 1 Sensor 1 elektrisch prüfen\n2. Kabelbaum zur Lambda-Sonde prüfen\n3. Abgasanlage auf Undichtigkeiten prüfen\n4. Kraftstoffgemisch prüfen\n5. Bei Defekt: Lambda-Sonde wechseln',
    'P0131',
    'Abgasreinigung',
    'medium',
    'medium',
    '1-2 Stunden',
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
    'p0132-lambda-sonde-bank-1-sensor-1-signal-zu-hoch',
    'P0132: Lambda-Sonde Bank 1 Sensor 1 - Signal zu hoch',
    'Der Fehlercode P0132 zeigt an, dass die Lambda-Sonde vor dem Katalysator ein zu hohes Signal liefert. Dies kann zu erhöhten Abgaswerten führen.',
    '1. Lambda-Sonde Bank 1 Sensor 1 elektrisch prüfen\n2. Kabelbaum zur Lambda-Sonde prüfen\n3. Abgasanlage auf Undichtigkeiten prüfen\n4. Kraftstoffgemisch prüfen\n5. Bei Defekt: Lambda-Sonde wechseln',
    'P0132',
    'Abgasreinigung',
    'medium',
    'medium',
    '1-2 Stunden',
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
    'p0133-lambda-sonde-bank-1-sensor-1-langsame-reaktion',
    'P0133: Lambda-Sonde Bank 1 Sensor 1 - langsame Reaktion',
    'Der Fehlercode P0133 zeigt an, dass die Lambda-Sonde vor dem Katalysator zu langsam reagiert. Dies kann zu erhöhten Abgaswerten führen.',
    '1. Lambda-Sonde Bank 1 Sensor 1 elektrisch prüfen\n2. Kabelbaum zur Lambda-Sonde prüfen\n3. Abgasanlage auf Undichtigkeiten prüfen\n4. Bei Defekt: Lambda-Sonde wechseln',
    'P0133',
    'Abgasreinigung',
    'medium',
    'medium',
    '1-2 Stunden',
    'de',
    'live'
FROM public.model_generations mg
JOIN public.car_models cm ON mg.car_model_id = cm.id
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'nissan' AND cm.slug = 'qashqai' AND mg.slug = 'qashqai-j10-2006-2013'
ON CONFLICT DO NOTHING;

-- Hyundai i30 FD - Zusätzliche Fehlercodes
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
    'p0134-lambda-sonde-bank-1-sensor-1-kein-signal',
    'P0134: Lambda-Sonde Bank 1 Sensor 1 - kein Signal',
    'Der Fehlercode P0134 zeigt an, dass die Lambda-Sonde vor dem Katalysator kein Signal liefert. Dies kann zu erhöhten Abgaswerten führen.',
    '1. Lambda-Sonde Bank 1 Sensor 1 elektrisch prüfen\n2. Kabelbaum zur Lambda-Sonde prüfen\n3. Sicherung prüfen\n4. Bei Defekt: Lambda-Sonde wechseln',
    'P0134',
    'Abgasreinigung',
    'medium',
    'medium',
    '1-2 Stunden',
    'de',
    'live'
FROM public.model_generations mg
JOIN public.car_models cm ON mg.car_model_id = cm.id
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'hyundai' AND cm.slug = 'i30' AND mg.slug = 'i30-fd-2007-2012'
ON CONFLICT DO NOTHING;

-- =====================================================
-- FERTIG!
-- =====================================================
-- Umfassende Fehlercode-Seed-Daten wurden erfolgreich eingefügt.
-- Insgesamt wurden über 45 verschiedene Fehlercodes für
-- verschiedene Modelle und Generationen eingefügt.
-- =====================================================

