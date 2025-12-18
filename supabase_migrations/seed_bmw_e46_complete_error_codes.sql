-- =====================================================
-- BMW 3er E46 (1998-2006) - Vollständige Fehlercode-Liste
-- =====================================================
-- Diese Datei enthält alle wichtigen Fehlercodes für
-- den BMW 3er E46 mit detaillierten Beschreibungen
-- =====================================================

-- =====================================================
-- OBD-II FEHLERCODES - MOTORSTEUERUNG
-- =====================================================

-- P0300 - Zufällige Zylinderfehlzündung
INSERT INTO public.car_faults (
    model_generation_id, slug, title, description, solution,
    error_code, affected_component, severity, difficulty_level,
    estimated_repair_time, language_path, status
)
SELECT mg.id, 'p0300-zufallige-zylinderfehlzuendung',
    'P0300: Zufällige Zylinderfehlzündung',
    'Der Fehlercode P0300 deutet auf zufällige Zylinderfehlzündungen hin. Dies kann zu Ruckeln, Leistungsverlust und erhöhtem Kraftstoffverbrauch führen.',
    '1. Zündkerzen prüfen und bei Bedarf wechseln\n2. Zündspulen auf Defekte prüfen\n3. Kraftstofffilter wechseln\n4. Luftfilter prüfen\n5. Lambda-Sonde prüfen\n6. Fehlerspeicher löschen und Testfahrt',
    'P0300', 'Zündsystem', 'medium', 'medium', '2-4 Stunden', 'de', 'live'
FROM public.model_generations mg
JOIN public.car_models cm ON mg.car_model_id = cm.id
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'bmw' AND cm.slug = '3er' AND mg.slug = 'e46-1998-2006'
ON CONFLICT DO NOTHING;

-- P0301 - Zylinder 1 Fehlzündung
INSERT INTO public.car_faults (
    model_generation_id, slug, title, description, solution,
    error_code, affected_component, severity, difficulty_level,
    estimated_repair_time, language_path, status
)
SELECT mg.id, 'p0301-zylinder-1-fehlzuendung',
    'P0301: Zylinder 1 Fehlzündung',
    'Der Fehlercode P0301 zeigt eine Fehlzündung im Zylinder 1 an. Dies führt zu Ruckeln, Leistungsverlust und erhöhtem Kraftstoffverbrauch.',
    '1. Zündkerze Zylinder 1 prüfen und wechseln\n2. Zündspule Zylinder 1 prüfen\n3. Einspritzventil Zylinder 1 prüfen\n4. Kompression Zylinder 1 prüfen\n5. Kraftstoffqualität prüfen',
    'P0301', 'Zündsystem', 'medium', 'medium', '1-2 Stunden', 'de', 'live'
FROM public.model_generations mg
JOIN public.car_models cm ON mg.car_model_id = cm.id
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'bmw' AND cm.slug = '3er' AND mg.slug = 'e46-1998-2006'
ON CONFLICT DO NOTHING;

-- P0302 - Zylinder 2 Fehlzündung
INSERT INTO public.car_faults (
    model_generation_id, slug, title, description, solution,
    error_code, affected_component, severity, difficulty_level,
    estimated_repair_time, language_path, status
)
SELECT mg.id, 'p0302-zylinder-2-fehlzuendung',
    'P0302: Zylinder 2 Fehlzündung',
    'Der Fehlercode P0302 zeigt eine Fehlzündung im Zylinder 2 an. Dies führt zu Ruckeln, Leistungsverlust und erhöhtem Kraftstoffverbrauch.',
    '1. Zündkerze Zylinder 2 prüfen und wechseln\n2. Zündspule Zylinder 2 prüfen\n3. Einspritzventil Zylinder 2 prüfen\n4. Kompression Zylinder 2 prüfen\n5. Kraftstoffqualität prüfen',
    'P0302', 'Zündsystem', 'medium', 'medium', '1-2 Stunden', 'de', 'live'
FROM public.model_generations mg
JOIN public.car_models cm ON mg.car_model_id = cm.id
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'bmw' AND cm.slug = '3er' AND mg.slug = 'e46-1998-2006'
ON CONFLICT DO NOTHING;

-- P0303 - Zylinder 3 Fehlzündung
INSERT INTO public.car_faults (
    model_generation_id, slug, title, description, solution,
    error_code, affected_component, severity, difficulty_level,
    estimated_repair_time, language_path, status
)
SELECT mg.id, 'p0303-zylinder-3-fehlzuendung',
    'P0303: Zylinder 3 Fehlzündung',
    'Der Fehlercode P0303 zeigt eine Fehlzündung im Zylinder 3 an. Dies führt zu Ruckeln, Leistungsverlust und erhöhtem Kraftstoffverbrauch.',
    '1. Zündkerze Zylinder 3 prüfen und wechseln\n2. Zündspule Zylinder 3 prüfen\n3. Einspritzventil Zylinder 3 prüfen\n4. Kompression Zylinder 3 prüfen\n5. Kraftstoffqualität prüfen',
    'P0303', 'Zündsystem', 'medium', 'medium', '1-2 Stunden', 'de', 'live'
FROM public.model_generations mg
JOIN public.car_models cm ON mg.car_model_id = cm.id
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'bmw' AND cm.slug = '3er' AND mg.slug = 'e46-1998-2006'
ON CONFLICT DO NOTHING;

-- P0304 - Zylinder 4 Fehlzündung
INSERT INTO public.car_faults (
    model_generation_id, slug, title, description, solution,
    error_code, affected_component, severity, difficulty_level,
    estimated_repair_time, language_path, status
)
SELECT mg.id, 'p0304-zylinder-4-fehlzuendung',
    'P0304: Zylinder 4 Fehlzündung',
    'Der Fehlercode P0304 zeigt eine Fehlzündung im Zylinder 4 an. Dies führt zu Ruckeln, Leistungsverlust und erhöhtem Kraftstoffverbrauch.',
    '1. Zündkerze Zylinder 4 prüfen und wechseln\n2. Zündspule Zylinder 4 prüfen\n3. Einspritzventil Zylinder 4 prüfen\n4. Kompression Zylinder 4 prüfen\n5. Kraftstoffqualität prüfen',
    'P0304', 'Zündsystem', 'medium', 'medium', '1-2 Stunden', 'de', 'live'
FROM public.model_generations mg
JOIN public.car_models cm ON mg.car_model_id = cm.id
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'bmw' AND cm.slug = '3er' AND mg.slug = 'e46-1998-2006'
ON CONFLICT DO NOTHING;

-- P0171 - Kraftstoffgemisch zu mager (Bank 1)
INSERT INTO public.car_faults (
    model_generation_id, slug, title, description, solution,
    error_code, affected_component, severity, difficulty_level,
    estimated_repair_time, language_path, status
)
SELECT mg.id, 'p0171-kraftstoffgemisch-zu-mager-bank-1',
    'P0171: Kraftstoffgemisch zu mager (Bank 1)',
    'Der Fehlercode P0171 zeigt an, dass das Kraftstoffgemisch zu mager ist. Dies führt zu Leistungsverlust, Ruckeln und erhöhtem Kraftstoffverbrauch.',
    '1. Luftfilter prüfen und wechseln\n2. Undichtigkeiten im Ansaugsystem suchen\n3. Kraftstoffdruck prüfen\n4. Lambda-Sonde Bank 1 prüfen\n5. Drosselklappe reinigen\n6. Luftmassenmesser prüfen',
    'P0171', 'Kraftstoffsystem', 'medium', 'hard', '3-5 Stunden', 'de', 'live'
FROM public.model_generations mg
JOIN public.car_models cm ON mg.car_model_id = cm.id
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'bmw' AND cm.slug = '3er' AND mg.slug = 'e46-1998-2006'
ON CONFLICT DO NOTHING;

-- P0172 - Kraftstoffgemisch zu fett (Bank 1)
INSERT INTO public.car_faults (
    model_generation_id, slug, title, description, solution,
    error_code, affected_component, severity, difficulty_level,
    estimated_repair_time, language_path, status
)
SELECT mg.id, 'p0172-kraftstoffgemisch-zu-fett-bank-1',
    'P0172: Kraftstoffgemisch zu fett (Bank 1)',
    'Der Fehlercode P0172 zeigt an, dass das Kraftstoffgemisch zu fett ist. Dies führt zu erhöhtem Kraftstoffverbrauch, Rußbildung und möglichen Katalysatorschäden.',
    '1. Lambda-Sonde Bank 1 prüfen\n2. Kraftstoffdruck prüfen\n3. Einspritzventile prüfen\n4. Luftmassenmesser prüfen\n5. Drosselklappe reinigen\n6. Kühlmitteltemperatursensor prüfen',
    'P0172', 'Kraftstoffsystem', 'medium', 'hard', '3-5 Stunden', 'de', 'live'
FROM public.model_generations mg
JOIN public.car_models cm ON mg.car_model_id = cm.id
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'bmw' AND cm.slug = '3er' AND mg.slug = 'e46-1998-2006'
ON CONFLICT DO NOTHING;

-- P0135 - Lambda-Sonde Bank 1 Sensor 1 Heizung
INSERT INTO public.car_faults (
    model_generation_id, slug, title, description, solution,
    error_code, affected_component, severity, difficulty_level,
    estimated_repair_time, language_path, status
)
SELECT mg.id, 'p0135-lambda-sonde-bank-1-sensor-1-heizung',
    'P0135: Lambda-Sonde Bank 1 Sensor 1 - Heizung',
    'Der Fehlercode P0135 deutet auf ein Problem mit der Heizung der Lambda-Sonde vor dem Katalysator hin. Dies kann zu erhöhten Abgaswerten führen.',
    '1. Lambda-Sonde Bank 1 Sensor 1 Heizung elektrisch prüfen\n2. Kabelbaum zur Lambda-Sonde prüfen\n3. Sicherung prüfen\n4. Bei Defekt: Lambda-Sonde wechseln',
    'P0135', 'Abgasreinigung', 'medium', 'medium', '1-2 Stunden', 'de', 'live'
FROM public.model_generations mg
JOIN public.car_models cm ON mg.car_model_id = cm.id
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'bmw' AND cm.slug = '3er' AND mg.slug = 'e46-1998-2006'
ON CONFLICT DO NOTHING;

-- P0136 - Lambda-Sonde Bank 1 Sensor 2
INSERT INTO public.car_faults (
    model_generation_id, slug, title, description, solution,
    error_code, affected_component, severity, difficulty_level,
    estimated_repair_time, language_path, status
)
SELECT mg.id, 'p0136-lambda-sonde-bank-1-sensor-2',
    'P0136: Lambda-Sonde Bank 1 Sensor 2',
    'Der Fehlercode P0136 zeigt ein Problem mit der Lambda-Sonde nach dem Katalysator an. Dies kann zu erhöhten Abgaswerten führen.',
    '1. Lambda-Sonde Bank 1 Sensor 2 elektrisch prüfen\n2. Kabelbaum zur Lambda-Sonde prüfen\n3. Abgasanlage auf Undichtigkeiten prüfen\n4. Katalysator prüfen\n5. Bei Defekt: Lambda-Sonde wechseln',
    'P0136', 'Abgasreinigung', 'medium', 'medium', '1-2 Stunden', 'de', 'live'
FROM public.model_generations mg
JOIN public.car_models cm ON mg.car_model_id = cm.id
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'bmw' AND cm.slug = '3er' AND mg.slug = 'e46-1998-2006'
ON CONFLICT DO NOTHING;

-- P0420 - Katalysator-Wirkungsgrad zu niedrig
INSERT INTO public.car_faults (
    model_generation_id, slug, title, description, solution,
    error_code, affected_component, severity, difficulty_level,
    estimated_repair_time, language_path, status
)
SELECT mg.id, 'p0420-katalysator-wirkungsgrad-zu-niedrig',
    'P0420: Katalysator-Wirkungsgrad zu niedrig',
    'Der Fehlercode P0420 deutet auf einen defekten oder verschlissenen Katalysator hin. Dies kann zu erhöhten Abgaswerten und Leistungsverlust führen.',
    '1. Lambda-Sonden prüfen (vor und nach Katalysator)\n2. Katalysator auf Beschädigungen prüfen\n3. Abgasanlage auf Undichtigkeiten prüfen\n4. Motor auf Ölverbrauch prüfen\n5. Bei Defekt: Katalysator wechseln',
    'P0420', 'Abgasanlage', 'high', 'expert', '4-6 Stunden', 'de', 'live'
FROM public.model_generations mg
JOIN public.car_models cm ON mg.car_model_id = cm.id
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'bmw' AND cm.slug = '3er' AND mg.slug = 'e46-1998-2006'
ON CONFLICT DO NOTHING;

-- P0341 - Nockenwellenpositionssensor Bank 1
INSERT INTO public.car_faults (
    model_generation_id, slug, title, description, solution,
    error_code, affected_component, severity, difficulty_level,
    estimated_repair_time, language_path, status
)
SELECT mg.id, 'p0341-nockenwellenpositionssensor-bank-1',
    'P0341: Nockenwellenpositionssensor Bank 1',
    'Der Fehlercode P0341 deutet auf ein Problem mit dem Nockenwellenpositionssensor Bank 1 hin. Dies kann zu Startproblemen und Leistungsverlust führen.',
    '1. Nockenwellenpositionssensor Bank 1 elektrisch prüfen\n2. Kabelbaum zum Sensor prüfen\n3. Sensor auf Verschmutzung prüfen\n4. Zahnriemen/Timing prüfen\n5. Bei Defekt: Sensor wechseln',
    'P0341', 'Motorsteuerung', 'high', 'hard', '2-3 Stunden', 'de', 'live'
FROM public.model_generations mg
JOIN public.car_models cm ON mg.car_model_id = cm.id
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'bmw' AND cm.slug = '3er' AND mg.slug = 'e46-1998-2006'
ON CONFLICT DO NOTHING;

-- P0015 - Nockenwellenverstellung Bank 1
INSERT INTO public.car_faults (
    model_generation_id, slug, title, description, solution,
    error_code, affected_component, severity, difficulty_level,
    estimated_repair_time, language_path, status
)
SELECT mg.id, 'p0015-nockenwellenverstellung-bank-1',
    'P0015: Nockenwellenverstellung Bank 1',
    'Der Fehlercode P0015 zeigt ein Problem mit der Nockenwellenverstellung Bank 1 an. Dies kann zu Leistungsverlust und erhöhtem Kraftstoffverbrauch führen.',
    '1. Motorölstand und Qualität prüfen\n2. Öldruck prüfen\n3. Nockenwellenversteller prüfen\n4. Steuerventil für Nockenwellenverstellung prüfen\n5. Ölfilter wechseln\n6. Bei Defekt: Nockenwellenversteller wechseln',
    'P0015', 'Motorsteuerung', 'high', 'expert', '4-6 Stunden', 'de', 'live'
FROM public.model_generations mg
JOIN public.car_models cm ON mg.car_model_id = cm.id
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'bmw' AND cm.slug = '3er' AND mg.slug = 'e46-1998-2006'
ON CONFLICT DO NOTHING;

-- P0102 - Luftmassenmesser Signal zu niedrig
INSERT INTO public.car_faults (
    model_generation_id, slug, title, description, solution,
    error_code, affected_component, severity, difficulty_level,
    estimated_repair_time, language_path, status
)
SELECT mg.id, 'p0102-luftmassenmesser-signal-zu-niedrig',
    'P0102: Luftmassenmesser Signal zu niedrig',
    'Der Fehlercode P0102 zeigt an, dass das Signal des Luftmassenmessers zu niedrig ist. Dies führt zu Leistungsverlust und erhöhtem Kraftstoffverbrauch.',
    '1. Luftmassenmesser elektrisch prüfen\n2. Kabelbaum zum Luftmassenmesser prüfen\n3. Luftmassenmesser auf Verschmutzung prüfen\n4. Luftfilter prüfen\n5. Bei Defekt: Luftmassenmesser wechseln',
    'P0102', 'Ansaugsystem', 'medium', 'medium', '1-2 Stunden', 'de', 'live'
FROM public.model_generations mg
JOIN public.car_models cm ON mg.car_model_id = cm.id
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'bmw' AND cm.slug = '3er' AND mg.slug = 'e46-1998-2006'
ON CONFLICT DO NOTHING;

-- P0103 - Luftmassenmesser Signal zu hoch
INSERT INTO public.car_faults (
    model_generation_id, slug, title, description, solution,
    error_code, affected_component, severity, difficulty_level,
    estimated_repair_time, language_path, status
)
SELECT mg.id, 'p0103-luftmassenmesser-signal-zu-hoch',
    'P0103: Luftmassenmesser Signal zu hoch',
    'Der Fehlercode P0103 zeigt an, dass das Signal des Luftmassenmessers zu hoch ist. Dies führt zu erhöhtem Kraftstoffverbrauch und möglichen Motorproblemen.',
    '1. Luftmassenmesser elektrisch prüfen\n2. Kabelbaum zum Luftmassenmesser prüfen\n3. Luftmassenmesser auf Verschmutzung prüfen\n4. Undichtigkeiten im Ansaugsystem prüfen\n5. Bei Defekt: Luftmassenmesser wechseln',
    'P0103', 'Ansaugsystem', 'medium', 'medium', '1-2 Stunden', 'de', 'live'
FROM public.model_generations mg
JOIN public.car_models cm ON mg.car_model_id = cm.id
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'bmw' AND cm.slug = '3er' AND mg.slug = 'e46-1998-2006'
ON CONFLICT DO NOTHING;

-- P0113 - Ansauglufttemperatursensor Signal zu hoch
INSERT INTO public.car_faults (
    model_generation_id, slug, title, description, solution,
    error_code, affected_component, severity, difficulty_level,
    estimated_repair_time, language_path, status
)
SELECT mg.id, 'p0113-ansauglufttemperatursensor-signal-zu-hoch',
    'P0113: Ansauglufttemperatursensor Signal zu hoch',
    'Der Fehlercode P0113 zeigt ein Problem mit dem Ansauglufttemperatursensor an. Dies kann zu erhöhtem Kraftstoffverbrauch führen.',
    '1. Ansauglufttemperatursensor elektrisch prüfen\n2. Kabelbaum zum Sensor prüfen\n3. Sensor auf Verschmutzung prüfen\n4. Bei Defekt: Sensor wechseln',
    'P0113', 'Ansaugsystem', 'low', 'easy', '30-60 Minuten', 'de', 'live'
FROM public.model_generations mg
JOIN public.car_models cm ON mg.car_model_id = cm.id
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'bmw' AND cm.slug = '3er' AND mg.slug = 'e46-1998-2006'
ON CONFLICT DO NOTHING;

-- P0118 - Kühlmitteltemperatursensor Signal zu hoch
INSERT INTO public.car_faults (
    model_generation_id, slug, title, description, solution,
    error_code, affected_component, severity, difficulty_level,
    estimated_repair_time, language_path, status
)
SELECT mg.id, 'p0118-kuehlmitteltemperatursensor-signal-zu-hoch',
    'P0118: Kühlmitteltemperatursensor Signal zu hoch',
    'Der Fehlercode P0118 zeigt ein Problem mit dem Kühlmitteltemperatursensor an. Dies kann zu falscher Motortemperaturanzeige und erhöhtem Kraftstoffverbrauch führen.',
    '1. Kühlmitteltemperatursensor elektrisch prüfen\n2. Kabelbaum zum Sensor prüfen\n3. Kühlmittelstand prüfen\n4. Thermostat prüfen\n5. Bei Defekt: Sensor wechseln',
    'P0118', 'Kühlsystem', 'medium', 'medium', '1-2 Stunden', 'de', 'live'
FROM public.model_generations mg
JOIN public.car_models cm ON mg.car_model_id = cm.id
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'bmw' AND cm.slug = '3er' AND mg.slug = 'e46-1998-2006'
ON CONFLICT DO NOTHING;

-- P0128 - Kühlmitteltemperatur zu niedrig
INSERT INTO public.car_faults (
    model_generation_id, slug, title, description, solution,
    error_code, affected_component, severity, difficulty_level,
    estimated_repair_time, language_path, status
)
SELECT mg.id, 'p0128-kuehlmitteltemperatur-zu-niedrig',
    'P0128: Kühlmitteltemperatur zu niedrig',
    'Der Fehlercode P0128 zeigt an, dass die Kühlmitteltemperatur zu niedrig ist. Dies deutet meist auf ein defektes Thermostat hin.',
    '1. Thermostat prüfen (öffnet zu früh)\n2. Kühlmitteltemperatursensor prüfen\n3. Kühlmittelstand prüfen\n4. Kühlsystem auf Undichtigkeiten prüfen\n5. Bei Defekt: Thermostat wechseln',
    'P0128', 'Kühlsystem', 'medium', 'medium', '1-2 Stunden', 'de', 'live'
FROM public.model_generations mg
JOIN public.car_models cm ON mg.car_model_id = cm.id
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'bmw' AND cm.slug = '3er' AND mg.slug = 'e46-1998-2006'
ON CONFLICT DO NOTHING;

-- P0440 - EVAP-System Fehlfunktion
INSERT INTO public.car_faults (
    model_generation_id, slug, title, description, solution,
    error_code, affected_component, severity, difficulty_level,
    estimated_repair_time, language_path, status
)
SELECT mg.id, 'p0440-evap-system-fehlfunktion',
    'P0440: EVAP-System Fehlfunktion',
    'Der Fehlercode P0440 zeigt eine Fehlfunktion im EVAP-System (Kraftstoffdampfrückführung) an. Dies kann zu erhöhten Abgaswerten führen.',
    '1. Tankdeckel prüfen (dicht?)\n2. EVAP-Ventil prüfen\n3. Schläuche des EVAP-Systems prüfen\n4. DMTL-Pumpe prüfen (bei E46)\n5. Undichtigkeiten im System suchen',
    'P0440', 'Abgasreinigung', 'low', 'hard', '2-4 Stunden', 'de', 'live'
FROM public.model_generations mg
JOIN public.car_models cm ON mg.car_model_id = cm.id
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'bmw' AND cm.slug = '3er' AND mg.slug = 'e46-1998-2006'
ON CONFLICT DO NOTHING;

-- P0441 - EVAP-System Durchfluss zu niedrig
INSERT INTO public.car_faults (
    model_generation_id, slug, title, description, solution,
    error_code, affected_component, severity, difficulty_level,
    estimated_repair_time, language_path, status
)
SELECT mg.id, 'p0441-evap-system-durchfluss-zu-niedrig',
    'P0441: EVAP-System Durchfluss zu niedrig',
    'Der Fehlercode P0441 zeigt an, dass der Durchfluss im EVAP-System zu niedrig ist. Dies deutet auf eine Verstopfung oder ein defektes Ventil hin.',
    '1. EVAP-Ventil prüfen\n2. Schläuche des EVAP-Systems auf Verstopfung prüfen\n3. DMTL-Pumpe prüfen\n4. Kohlefilter prüfen\n5. Bei Defekt: Komponenten wechseln',
    'P0441', 'Abgasreinigung', 'low', 'hard', '2-4 Stunden', 'de', 'live'
FROM public.model_generations mg
JOIN public.car_models cm ON mg.car_model_id = cm.id
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'bmw' AND cm.slug = '3er' AND mg.slug = 'e46-1998-2006'
ON CONFLICT DO NOTHING;

-- P0455 - EVAP-System große Undichtigkeit
INSERT INTO public.car_faults (
    model_generation_id, slug, title, description, solution,
    error_code, affected_component, severity, difficulty_level,
    estimated_repair_time, language_path, status
)
SELECT mg.id, 'p0455-evap-system-grosse-undichtigkeit',
    'P0455: EVAP-System große Undichtigkeit',
    'Der Fehlercode P0455 zeigt eine große Undichtigkeit im EVAP-System an. Dies kann zu erhöhten Abgaswerten führen.',
    '1. Tankdeckel prüfen und wechseln\n2. Schläuche des EVAP-Systems auf Risse prüfen\n3. Tank auf Undichtigkeiten prüfen\n4. DMTL-System prüfen\n5. Undichtigkeiten beheben',
    'P0455', 'Abgasreinigung', 'medium', 'hard', '2-4 Stunden', 'de', 'live'
FROM public.model_generations mg
JOIN public.car_models cm ON mg.car_model_id = cm.id
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'bmw' AND cm.slug = '3er' AND mg.slug = 'e46-1998-2006'
ON CONFLICT DO NOTHING;

-- P0505 - Leerlaufregelung Fehlfunktion
INSERT INTO public.car_faults (
    model_generation_id, slug, title, description, solution,
    error_code, affected_component, severity, difficulty_level,
    estimated_repair_time, language_path, status
)
SELECT mg.id, 'p0505-leerlaufregelung-fehlfunktion',
    'P0505: Leerlaufregelung Fehlfunktion',
    'Der Fehlercode P0505 zeigt eine Fehlfunktion der Leerlaufregelung an. Dies kann zu unruhigem Leerlauf und Stalling führen.',
    '1. Drosselklappe reinigen\n2. Leerlaufsteller prüfen\n3. Undichtigkeiten im Ansaugsystem prüfen\n4. Luftfilter prüfen\n5. Drosselklappensteller prüfen',
    'P0505', 'Motorsteuerung', 'medium', 'medium', '1-2 Stunden', 'de', 'live'
FROM public.model_generations mg
JOIN public.car_models cm ON mg.car_model_id = cm.id
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'bmw' AND cm.slug = '3er' AND mg.slug = 'e46-1998-2006'
ON CONFLICT DO NOTHING;

-- P0506 - Leerlaufdrehzahl zu niedrig
INSERT INTO public.car_faults (
    model_generation_id, slug, title, description, solution,
    error_code, affected_component, severity, difficulty_level,
    estimated_repair_time, language_path, status
)
SELECT mg.id, 'p0506-leerlaufdrehzahl-zu-niedrig',
    'P0506: Leerlaufdrehzahl zu niedrig',
    'Der Fehlercode P0506 zeigt an, dass die Leerlaufdrehzahl zu niedrig ist. Dies kann zu Stalling führen.',
    '1. Drosselklappe reinigen\n2. Leerlaufsteller prüfen\n3. Undichtigkeiten im Ansaugsystem prüfen\n4. Luftfilter prüfen\n5. Drosselklappensteller prüfen',
    'P0506', 'Motorsteuerung', 'medium', 'medium', '1-2 Stunden', 'de', 'live'
FROM public.model_generations mg
JOIN public.car_models cm ON mg.car_model_id = cm.id
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'bmw' AND cm.slug = '3er' AND mg.slug = 'e46-1998-2006'
ON CONFLICT DO NOTHING;

-- P0507 - Leerlaufdrehzahl zu hoch
INSERT INTO public.car_faults (
    model_generation_id, slug, title, description, solution,
    error_code, affected_component, severity, difficulty_level,
    estimated_repair_time, language_path, status
)
SELECT mg.id, 'p0507-leerlaufdrehzahl-zu-hoch',
    'P0507: Leerlaufdrehzahl zu hoch',
    'Der Fehlercode P0507 zeigt an, dass die Leerlaufdrehzahl zu hoch ist. Dies führt zu erhöhtem Kraftstoffverbrauch.',
    '1. Drosselklappe reinigen\n2. Leerlaufsteller prüfen\n3. Undichtigkeiten im Ansaugsystem prüfen\n4. Drosselklappensteller prüfen\n5. Kabelbaum prüfen',
    'P0507', 'Motorsteuerung', 'medium', 'medium', '1-2 Stunden', 'de', 'live'
FROM public.model_generations mg
JOIN public.car_models cm ON mg.car_model_id = cm.id
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'bmw' AND cm.slug = '3er' AND mg.slug = 'e46-1998-2006'
ON CONFLICT DO NOTHING;

-- =====================================================
-- BMW-SPEZIFISCHE FEHLERCODES
-- =====================================================

-- 279C - Kennfeldthermostat Funktionsstörung
INSERT INTO public.car_faults (
    model_generation_id, slug, title, description, solution,
    error_code, affected_component, severity, difficulty_level,
    estimated_repair_time, language_path, status
)
SELECT mg.id, '279c-kennfeldthermostat-funktionsstoerung',
    '279C: Kennfeldthermostat Funktionsstörung',
    'Der BMW-spezifische Fehlercode 279C zeigt eine Funktionsstörung des Kennfeldthermostats an. Dies kann zu erhöhtem Kraftstoffverbrauch führen.',
    '1. Kennfeldthermostat elektrisch prüfen\n2. Kabelbaum zum Thermostat prüfen\n3. Thermostat auf mechanische Defekte prüfen\n4. Kühlmittelstand prüfen\n5. Bei Defekt: Kennfeldthermostat wechseln',
    '279C', 'Kühlsystem', 'medium', 'hard', '2-3 Stunden', 'de', 'live'
FROM public.model_generations mg
JOIN public.car_models cm ON mg.car_model_id = cm.id
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'bmw' AND cm.slug = '3er' AND mg.slug = 'e46-1998-2006'
ON CONFLICT DO NOTHING;

-- 8F / 143 - DMTL Tankleckage
INSERT INTO public.car_faults (
    model_generation_id, slug, title, description, solution,
    error_code, affected_component, severity, difficulty_level,
    estimated_repair_time, language_path, status
)
SELECT mg.id, '8f-143-dmtl-tankleckage',
    '8F / 143: DMTL Tankleckage',
    'Der BMW-spezifische Fehlercode 8F (143 dezimal) zeigt an, dass das DMTL-System (Diagnostic Module Tank Leakage) eine vermeintliche Tankleckage festgestellt hat.',
    '1. Tankdeckel prüfen und wechseln\n2. DMTL-Pumpe prüfen\n3. Schläuche des EVAP-Systems prüfen\n4. Tank auf Undichtigkeiten prüfen\n5. DMTL-System neu kalibrieren',
    '8F', 'Abgasreinigung', 'low', 'hard', '2-4 Stunden', 'de', 'live'
FROM public.model_generations mg
JOIN public.car_models cm ON mg.car_model_id = cm.id
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'bmw' AND cm.slug = '3er' AND mg.slug = 'e46-1998-2006'
ON CONFLICT DO NOTHING;

-- 30C1 - Motoröldruckregelung statisch
INSERT INTO public.car_faults (
    model_generation_id, slug, title, description, solution,
    error_code, affected_component, severity, difficulty_level,
    estimated_repair_time, language_path, status
)
SELECT mg.id, '30c1-motoroeldruckregelung-statisch',
    '30C1: Motoröldruckregelung statisch',
    'Der BMW-spezifische Fehlercode 30C1 zeigt ein Problem mit der Motoröldruckregelung an. Dies kann zu Motorschäden führen.',
    '1. Motorölstand prüfen\n2. Öldruck prüfen\n3. Ölpumpe prüfen\n4. Ölfilter wechseln\n5. Öldruckschalter prüfen\n6. Bei Defekt: Ölpumpe oder Öldruckschalter wechseln',
    '30C1', 'Motorschmierung', 'critical', 'expert', '4-8 Stunden', 'de', 'live'
FROM public.model_generations mg
JOIN public.car_models cm ON mg.car_model_id = cm.id
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'bmw' AND cm.slug = '3er' AND mg.slug = 'e46-1998-2006'
ON CONFLICT DO NOTHING;

-- 169 / A9 - SG-Endstufe Motordrosselklappe Notabschaltung
INSERT INTO public.car_faults (
    model_generation_id, slug, title, description, solution,
    error_code, affected_component, severity, difficulty_level,
    estimated_repair_time, language_path, status
)
SELECT mg.id, '169-a9-sg-endstufe-motordrosselklappe-notabschaltung',
    '169 / A9: SG-Endstufe Motordrosselklappe Notabschaltung',
    'Der BMW-spezifische Fehlercode 169 (A9 hex) zeigt eine Notabschaltung der Motordrosselklappe an. Dies führt zu Leistungsverlust und Notlauf.',
    '1. Drosselklappe mechanisch prüfen\n2. Drosselklappensteller prüfen\n3. Kabelbaum zur Drosselklappe prüfen\n4. Motorsteuergerät prüfen\n5. Drosselklappe reinigen\n6. Bei Defekt: Drosselklappe oder Steller wechseln',
    '169', 'Motorsteuerung', 'critical', 'expert', '3-5 Stunden', 'de', 'live'
FROM public.model_generations mg
JOIN public.car_models cm ON mg.car_model_id = cm.id
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'bmw' AND cm.slug = '3er' AND mg.slug = 'e46-1998-2006'
ON CONFLICT DO NOTHING;

-- 100 / 64 - Steuergerät Mikroprozessor Fehlfunktion
INSERT INTO public.car_faults (
    model_generation_id, slug, title, description, solution,
    error_code, affected_component, severity, difficulty_level,
    estimated_repair_time, language_path, status
)
SELECT mg.id, '100-64-steuergeraet-mikroprozessor-fehlfunktion',
    '100 / 64: Steuergerät Mikroprozessor Fehlfunktion',
    'Der BMW-spezifische Fehlercode 100 (64 hex) zeigt eine Fehlfunktion des Mikroprozessors im Motorsteuergerät an. Dies kann zu verschiedenen Motorproblemen führen.',
    '1. Batteriespannung prüfen\n2. Kabelbaum zum Steuergerät prüfen\n3. Steuergerät auf Korrosion prüfen\n4. Fehlerspeicher komplett löschen\n5. Bei wiederholtem Auftreten: Steuergerät tauschen oder reparieren lassen',
    '100', 'Motorsteuerung', 'critical', 'expert', '4-8 Stunden', 'de', 'live'
FROM public.model_generations mg
JOIN public.car_models cm ON mg.car_model_id = cm.id
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'bmw' AND cm.slug = '3er' AND mg.slug = 'e46-1998-2006'
ON CONFLICT DO NOTHING;

-- 170 / AA - Steuergerät elektronische Drosselklappe Fehler Plausibilität
INSERT INTO public.car_faults (
    model_generation_id, slug, title, description, solution,
    error_code, affected_component, severity, difficulty_level,
    estimated_repair_time, language_path, status
)
SELECT mg.id, '170-aa-steuergeraet-elektronische-drosselklappe-fehler-plausibilitaet',
    '170 / AA: Steuergerät elektronische Drosselklappe Fehler Plausibilität',
    'Der BMW-spezifische Fehlercode 170 (AA hex) zeigt einen Plausibilitätsfehler der elektronischen Drosselklappe an. Dies führt zu Leistungsverlust.',
    '1. Drosselklappe mechanisch prüfen\n2. Drosselklappensteller prüfen\n3. Kabelbaum zur Drosselklappe prüfen\n4. Drosselklappe reinigen\n5. Anlernprozedur durchführen\n6. Bei Defekt: Drosselklappe oder Steller wechseln',
    '170', 'Motorsteuerung', 'high', 'hard', '2-4 Stunden', 'de', 'live'
FROM public.model_generations mg
JOIN public.car_models cm ON mg.car_model_id = cm.id
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'bmw' AND cm.slug = '3er' AND mg.slug = 'e46-1998-2006'
ON CONFLICT DO NOTHING;

-- =====================================================
-- ABS/DSC FEHLERCODES
-- =====================================================

-- 5DF0 - ABS Pumpenmotor defekt
INSERT INTO public.car_faults (
    model_generation_id, slug, title, description, solution,
    error_code, affected_component, severity, difficulty_level,
    estimated_repair_time, language_path, status
)
SELECT mg.id, '5df0-abs-pumpenmotor-defekt',
    '5DF0: ABS Pumpenmotor defekt',
    'Der BMW-spezifische Fehlercode 5DF0 zeigt einen defekten ABS-Pumpenmotor an. Dies führt zum Ausfall des ABS-Systems.',
    '1. ABS-Pumpenmotor elektrisch prüfen\n2. Sicherungen prüfen\n3. Kabelbaum zur ABS-Pumpe prüfen\n4. ABS-Steuergerät prüfen\n5. Bei Defekt: ABS-Pumpe wechseln oder reparieren lassen',
    '5DF0', 'ABS/DSC', 'high', 'expert', '4-6 Stunden', 'de', 'live'
FROM public.model_generations mg
JOIN public.car_models cm ON mg.car_model_id = cm.id
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'bmw' AND cm.slug = '3er' AND mg.slug = 'e46-1998-2006'
ON CONFLICT DO NOTHING;

-- 5DF1 - ABS Interner Steuergerätedefekt
INSERT INTO public.car_faults (
    model_generation_id, slug, title, description, solution,
    error_code, affected_component, severity, difficulty_level,
    estimated_repair_time, language_path, status
)
SELECT mg.id, '5df1-abs-interner-steuergeraetedefekt',
    '5DF1: ABS Interner Steuergerätedefekt',
    'Der BMW-spezifische Fehlercode 5DF1 zeigt einen internen Defekt im ABS-Steuergerät an. Dies führt zum Ausfall des ABS-Systems.',
    '1. ABS-Steuergerät auf Korrosion prüfen\n2. Kabelbaum zum ABS-Steuergerät prüfen\n3. Batteriespannung prüfen\n4. Fehlerspeicher löschen\n5. Bei wiederholtem Auftreten: ABS-Steuergerät tauschen oder reparieren lassen',
    '5DF1', 'ABS/DSC', 'high', 'expert', '4-8 Stunden', 'de', 'live'
FROM public.model_generations mg
JOIN public.car_models cm ON mg.car_model_id = cm.id
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'bmw' AND cm.slug = '3er' AND mg.slug = 'e46-1998-2006'
ON CONFLICT DO NOTHING;

-- 5E20 - ABS Drucksensor Fehlfunktion
INSERT INTO public.car_faults (
    model_generation_id, slug, title, description, solution,
    error_code, affected_component, severity, difficulty_level,
    estimated_repair_time, language_path, status
)
SELECT mg.id, '5e20-abs-drucksensor-fehlfunktion',
    '5E20: ABS Drucksensor Fehlfunktion',
    'Der BMW-spezifische Fehlercode 5E20 zeigt eine Fehlfunktion des ABS-Drucksensors an. Dies kann zu ABS-Problemen führen.',
    '1. ABS-Drucksensor elektrisch prüfen\n2. Kabelbaum zum Sensor prüfen\n3. Sensor auf Verschmutzung prüfen\n4. Bremsflüssigkeitsstand prüfen\n5. Bei Defekt: Drucksensor wechseln',
    '5E20', 'ABS/DSC', 'medium', 'hard', '2-3 Stunden', 'de', 'live'
FROM public.model_generations mg
JOIN public.car_models cm ON mg.car_model_id = cm.id
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'bmw' AND cm.slug = '3er' AND mg.slug = 'e46-1998-2006'
ON CONFLICT DO NOTHING;

