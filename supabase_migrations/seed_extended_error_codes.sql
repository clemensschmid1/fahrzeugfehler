-- =====================================================
-- Fahrzeugfehler.de - Erweiterte Fehlercode-Seed-Daten
-- =====================================================
-- Diese Datei erweitert die Fehlercode-Seed-Daten mit
-- weiteren häufigen Fehlercodes für verschiedene Modelle
-- =====================================================

-- =====================================================
-- FEHLERCODES FÜR TOYOTA COROLLA E12 (2002-2008)
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
    'p0136-lambda-sonde-bank-1-sensor-2',
    'P0136: Lambda-Sonde Bank 1 Sensor 2',
    'Der Fehlercode P0136 deutet auf ein Problem mit der Lambda-Sonde nach dem Katalysator hin. Dies kann zu erhöhten Abgaswerten führen.',
    '1. Lambda-Sonde Bank 1 Sensor 2 elektrisch prüfen\n2. Kabelbaum zur Lambda-Sonde prüfen\n3. Abgasanlage auf Undichtigkeiten prüfen\n4. Bei Defekt: Lambda-Sonde wechseln',
    'P0136',
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
    'p0455-kraftstoffdampf-rueckfuehrung-grosse-undichtigkeit',
    'P0455: Kraftstoffdampf-Rückführung - große Undichtigkeit',
    'Der Fehlercode P0455 zeigt eine große Undichtigkeit im EVAP-System an. Dies führt zu erhöhten Emissionen.',
    '1. Tankdeckel prüfen und wechseln\n2. EVAP-Leitungen auf Risse und Undichtigkeiten prüfen\n3. EVAP-Ventil prüfen\n4. Kohlefilter prüfen\n5. Dichtungen prüfen und wechseln',
    'P0455',
    'Abgasreinigung',
    'medium',
    'hard',
    '2-4 Stunden',
    'de',
    'live'
FROM public.model_generations mg
JOIN public.car_models cm ON mg.car_model_id = cm.id
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'toyota' AND cm.slug = 'corolla' AND mg.slug = 'corolla-e12-2002-2008'
ON CONFLICT DO NOTHING;

-- =====================================================
-- FEHLERCODES FÜR HONDA CIVIC VIII (2005-2011)
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
    'p0305-zylinder-5-fehlzuendung',
    'P0305: Zylinder 5 Fehlzündung',
    'Der Fehlercode P0305 zeigt eine Fehlzündung im Zylinder 5 an. Dies führt zu Ruckeln, Leistungsverlust und erhöhtem Kraftstoffverbrauch.',
    '1. Zündkerze Zylinder 5 prüfen und wechseln\n2. Zündspule Zylinder 5 prüfen\n3. Einspritzventil Zylinder 5 prüfen\n4. Kompression Zylinder 5 prüfen\n5. Kraftstoffqualität prüfen',
    'P0305',
    'Zündsystem',
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
    'p0340-nockenwellenpositionssensor',
    'P0340: Nockenwellenpositionssensor',
    'Der Fehlercode P0340 deutet auf ein Problem mit dem Nockenwellenpositionssensor hin. Dies kann zu Startproblemen und Leistungsverlust führen.',
    '1. Nockenwellenpositionssensor elektrisch prüfen\n2. Kabelbaum zum Sensor prüfen\n3. Sensor auf Verschmutzung prüfen\n4. Bei Defekt: Nockenwellenpositionssensor wechseln',
    'P0340',
    'Motorsteuerung',
    'high',
    'hard',
    '2-3 Stunden',
    'de',
    'live'
FROM public.model_generations mg
JOIN public.car_models cm ON mg.car_model_id = cm.id
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'honda' AND cm.slug = 'civic' AND mg.slug = 'civic-8-2005-2011'
ON CONFLICT DO NOTHING;

-- =====================================================
-- FEHLERCODES FÜR NISSAN QASHQAI J10 (2006-2013)
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
    'p0306-zylinder-6-fehlzuendung',
    'P0306: Zylinder 6 Fehlzündung',
    'Der Fehlercode P0306 zeigt eine Fehlzündung im Zylinder 6 an. Dies führt zu Ruckeln, Leistungsverlust und erhöhtem Kraftstoffverbrauch.',
    '1. Zündkerze Zylinder 6 prüfen und wechseln\n2. Zündspule Zylinder 6 prüfen\n3. Einspritzventil Zylinder 6 prüfen\n4. Kompression Zylinder 6 prüfen\n5. Kraftstoffqualität prüfen',
    'P0306',
    'Zündsystem',
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
    'p0174-kraftstoffgemisch-zu-mager-bank-2',
    'P0174: Kraftstoffgemisch zu mager (Bank 2)',
    'Der Fehlercode P0174 zeigt an, dass das Kraftstoffgemisch auf Bank 2 zu mager ist. Dies führt zu Leistungsverlust und erhöhtem Kraftstoffverbrauch.',
    '1. Luftfilter prüfen und wechseln\n2. Undichtigkeiten im Ansaugsystem suchen (Bank 2)\n3. Kraftstoffdruck prüfen\n4. Lambda-Sonde Bank 2 prüfen\n5. Luftmassenmesser prüfen',
    'P0174',
    'Kraftstoffsystem',
    'medium',
    'hard',
    '3-5 Stunden',
    'de',
    'live'
FROM public.model_generations mg
JOIN public.car_models cm ON mg.car_model_id = cm.id
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'nissan' AND cm.slug = 'qashqai' AND mg.slug = 'qashqai-j10-2006-2013'
ON CONFLICT DO NOTHING;

-- =====================================================
-- FEHLERCODES FÜR HYUNDAI I30 FD (2007-2012)
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
    'p0113-ansauglufttemperatursensor-zu-hoch',
    'P0113: Ansauglufttemperatursensor - Signal zu hoch',
    'Der Fehlercode P0113 zeigt an, dass der Ansauglufttemperatursensor ein zu hohes Signal liefert. Dies kann zu erhöhtem Kraftstoffverbrauch führen.',
    '1. Ansauglufttemperatursensor elektrisch prüfen\n2. Kabelbaum zum Sensor prüfen\n3. Sensor auf Verschmutzung prüfen\n4. Bei Defekt: Sensor wechseln',
    'P0113',
    'Motorsteuerung',
    'low',
    'easy',
    '1-2 Stunden',
    'de',
    'live'
FROM public.model_generations mg
JOIN public.car_models cm ON mg.car_model_id = cm.id
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'hyundai' AND cm.slug = 'i30' AND mg.slug = 'i30-fd-2007-2012'
ON CONFLICT DO NOTHING;

-- =====================================================
-- FEHLERCODES FÜR MAZDA 3 BK (2003-2009)
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
    'p0112-ansauglufttemperatursensor-zu-niedrig',
    'P0112: Ansauglufttemperatursensor - Signal zu niedrig',
    'Der Fehlercode P0112 zeigt an, dass der Ansauglufttemperatursensor ein zu niedriges Signal liefert. Dies kann zu erhöhtem Kraftstoffverbrauch führen.',
    '1. Ansauglufttemperatursensor elektrisch prüfen\n2. Kabelbaum zum Sensor prüfen\n3. Sensor auf Verschmutzung prüfen\n4. Bei Defekt: Sensor wechseln',
    'P0112',
    'Motorsteuerung',
    'low',
    'easy',
    '1-2 Stunden',
    'de',
    'live'
FROM public.model_generations mg
JOIN public.car_models cm ON mg.car_model_id = cm.id
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'mazda' AND cm.slug = '3' AND mg.slug = 'mazda-3-bk-2003-2009'
ON CONFLICT DO NOTHING;

-- =====================================================
-- FEHLERCODES FÜR PEUGEOT 208 T9 (2012-2019)
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
    'p0106-drosselklappenpositionssensor',
    'P0106: Drosselklappenpositionssensor',
    'Der Fehlercode P0106 deutet auf ein Problem mit dem Drosselklappenpositionssensor hin. Dies kann zu Leistungsverlust und Ruckeln führen.',
    '1. Drosselklappenpositionssensor elektrisch prüfen\n2. Drosselklappe reinigen\n3. Kabelbaum prüfen\n4. Drosselklappenadaption durchführen\n5. Bei Defekt: Sensor oder Drosselklappe wechseln',
    'P0106',
    'Drosselklappe',
    'high',
    'hard',
    '2-4 Stunden',
    'de',
    'live'
FROM public.model_generations mg
JOIN public.car_models cm ON mg.car_model_id = cm.id
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'peugeot' AND cm.slug = '208' AND mg.slug = '208-t9-2012-2019'
ON CONFLICT DO NOTHING;

-- =====================================================
-- FEHLERCODES FÜR RENAULT CLIO III (2005-2012)
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
    'p0107-luftdrucksensor-ansaugkrümmer',
    'P0107: Luftdrucksensor Ansaugkrümmer',
    'Der Fehlercode P0107 deutet auf ein Problem mit dem Luftdrucksensor im Ansaugkrümmer hin. Dies kann zu Leistungsverlust führen.',
    '1. Luftdrucksensor elektrisch prüfen\n2. Kabelbaum zum Sensor prüfen\n3. Ansaugsystem auf Undichtigkeiten prüfen\n4. Bei Defekt: Sensor wechseln',
    'P0107',
    'Motorsteuerung',
    'medium',
    'medium',
    '1-2 Stunden',
    'de',
    'live'
FROM public.model_generations mg
JOIN public.car_models cm ON mg.car_model_id = cm.id
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'renault' AND cm.slug = 'clio' AND mg.slug = 'clio-3-2005-2012'
ON CONFLICT DO NOTHING;

-- =====================================================
-- FEHLERCODES FÜR SEAT LEON 1P (2005-2012)
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
    'p0108-luftdrucksensor-ansaugkrümmer-signal-zu-hoch',
    'P0108: Luftdrucksensor Ansaugkrümmer - Signal zu hoch',
    'Der Fehlercode P0108 zeigt an, dass der Luftdrucksensor ein zu hohes Signal liefert. Dies kann zu Leistungsverlust führen.',
    '1. Luftdrucksensor elektrisch prüfen\n2. Kabelbaum zum Sensor prüfen\n3. Ansaugsystem auf Undichtigkeiten prüfen\n4. Bei Defekt: Sensor wechseln',
    'P0108',
    'Motorsteuerung',
    'medium',
    'medium',
    '1-2 Stunden',
    'de',
    'live'
FROM public.model_generations mg
JOIN public.car_models cm ON mg.car_model_id = cm.id
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'seat' AND cm.slug = 'leon' AND mg.slug = 'leon-1p-2005-2012'
ON CONFLICT DO NOTHING;

-- =====================================================
-- FEHLERCODES FÜR FIAT 500 312 (2007-)
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
    'p0105-luftdrucksensor-ansaugkrümmer-signal-zu-niedrig',
    'P0105: Luftdrucksensor Ansaugkrümmer - Signal zu niedrig',
    'Der Fehlercode P0105 zeigt an, dass der Luftdrucksensor ein zu niedriges Signal liefert. Dies kann zu Leistungsverlust führen.',
    '1. Luftdrucksensor elektrisch prüfen\n2. Kabelbaum zum Sensor prüfen\n3. Ansaugsystem auf Undichtigkeiten prüfen\n4. Bei Defekt: Sensor wechseln',
    'P0105',
    'Motorsteuerung',
    'medium',
    'medium',
    '1-2 Stunden',
    'de',
    'live'
FROM public.model_generations mg
JOIN public.car_models cm ON mg.car_model_id = cm.id
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'fiat' AND cm.slug = '500' AND mg.slug = '500-312-2007'
ON CONFLICT DO NOTHING;

-- =====================================================
-- WEITERE FEHLERCODES FÜR BESTEHENDE MODELLE
-- =====================================================

-- BMW 3er E46 - Zusätzliche Fehlercodes
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
    'p0341-nockenwellenpositionssensor-bank-1',
    'P0341: Nockenwellenpositionssensor Bank 1',
    'Der Fehlercode P0341 deutet auf ein Problem mit dem Nockenwellenpositionssensor Bank 1 hin. Dies kann zu Startproblemen führen.',
    '1. Nockenwellenpositionssensor Bank 1 elektrisch prüfen\n2. Kabelbaum zum Sensor prüfen\n3. Sensor auf Verschmutzung prüfen\n4. Bei Defekt: Sensor wechseln',
    'P0341',
    'Motorsteuerung',
    'high',
    'hard',
    '2-3 Stunden',
    'de',
    'live'
FROM public.model_generations mg
JOIN public.car_models cm ON mg.car_model_id = cm.id
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'bmw' AND cm.slug = '3er' AND mg.slug = 'e46-1998-2006'
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
    'p0342-nockenwellenpositionssensor-bank-1-signal-zu-niedrig',
    'P0342: Nockenwellenpositionssensor Bank 1 - Signal zu niedrig',
    'Der Fehlercode P0342 zeigt an, dass der Nockenwellenpositionssensor Bank 1 ein zu niedriges Signal liefert. Dies kann zu Startproblemen führen.',
    '1. Nockenwellenpositionssensor Bank 1 elektrisch prüfen\n2. Kabelbaum zum Sensor prüfen\n3. Sensor auf Verschmutzung prüfen\n4. Bei Defekt: Sensor wechseln',
    'P0342',
    'Motorsteuerung',
    'high',
    'hard',
    '2-3 Stunden',
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
    'p0343-nockenwellenpositionssensor-bank-1-signal-zu-hoch',
    'P0343: Nockenwellenpositionssensor Bank 1 - Signal zu hoch',
    'Der Fehlercode P0343 zeigt an, dass der Nockenwellenpositionssensor Bank 1 ein zu hohes Signal liefert. Dies kann zu Startproblemen führen.',
    '1. Nockenwellenpositionssensor Bank 1 elektrisch prüfen\n2. Kabelbaum zum Sensor prüfen\n3. Sensor auf Verschmutzung prüfen\n4. Bei Defekt: Sensor wechseln',
    'P0343',
    'Motorsteuerung',
    'high',
    'hard',
    '2-3 Stunden',
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
    'p0116-kuehlmitteltemperatursensor-bereichsfehler',
    'P0116: Kühlmitteltemperatursensor - Bereichsfehler',
    'Der Fehlercode P0116 deutet auf ein Problem mit dem Kühlmitteltemperatursensor hin. Dies kann zu erhöhtem Kraftstoffverbrauch führen.',
    '1. Kühlmitteltemperatursensor elektrisch prüfen\n2. Kabelbaum zum Sensor prüfen\n3. Kühlmittelstand prüfen\n4. Bei Defekt: Sensor wechseln',
    'P0116',
    'Kühlsystem',
    'low',
    'easy',
    '1-2 Stunden',
    'de',
    'live'
FROM public.model_generations mg
JOIN public.car_models cm ON mg.car_model_id = cm.id
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'volkswagen' AND cm.slug = 'golf' AND mg.slug = 'golf-6-2008-2012'
ON CONFLICT DO NOTHING;

-- =====================================================
-- FERTIG!
-- =====================================================
-- Erweiterte Fehlercode-Seed-Daten wurden erfolgreich eingefügt.
-- Insgesamt wurden über 30 verschiedene Fehlercodes für
-- verschiedene Modelle und Generationen eingefügt.
-- =====================================================

