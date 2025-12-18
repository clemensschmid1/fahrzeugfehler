-- =====================================================
-- Erweiterte Fehlercode-Seed-Daten für mehrere Generationen
-- =====================================================
-- Diese Datei enthält Fehlercodes für weitere beliebte
-- Automodelle und Generationen
-- =====================================================

-- =====================================================
-- BMW 3er E90 (2005-2013) - Fehlercodes
-- =====================================================

-- P0300 - Zufällige Zylinderfehlzündung
INSERT INTO public.car_faults (
    model_generation_id, slug, title, description, solution,
    error_code, affected_component, severity, difficulty_level,
    estimated_repair_time, language_path, status
)
SELECT mg.id, 'p0300-zufallige-zylinderfehlzuendung-e90',
    'P0300: Zufällige Zylinderfehlzündung',
    'Der Fehlercode P0300 deutet auf zufällige Zylinderfehlzündungen hin. Beim BMW E90 häufig durch defekte Zündspulen oder verschlissene Zündkerzen verursacht.',
    '1. Zündkerzen prüfen und bei Bedarf wechseln\n2. Zündspulen auf Defekte prüfen (besonders bei N52/N53 Motoren)\n3. Kraftstofffilter wechseln\n4. Luftfilter prüfen\n5. Lambda-Sonde prüfen\n6. Fehlerspeicher löschen und Testfahrt',
    'P0300', 'Zündsystem', 'medium', 'medium', '2-4 Stunden', 'de', 'live'
FROM public.model_generations mg
JOIN public.car_models cm ON mg.car_model_id = cm.id
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'bmw' AND cm.slug = '3er' AND mg.slug = 'e90-2005-2013'
ON CONFLICT DO NOTHING;

-- P0171 - Kraftstoffgemisch zu mager (Bank 1)
INSERT INTO public.car_faults (
    model_generation_id, slug, title, description, solution,
    error_code, affected_component, severity, difficulty_level,
    estimated_repair_time, language_path, status
)
SELECT mg.id, 'p0171-kraftstoffgemisch-zu-mager-e90',
    'P0171: Kraftstoffgemisch zu mager (Bank 1)',
    'Der Fehlercode P0171 zeigt an, dass das Kraftstoffgemisch zu mager ist. Beim BMW E90 häufig durch Undichtigkeiten im Ansaugsystem oder defekte Lambda-Sonde verursacht.',
    '1. Luftfilter prüfen und wechseln\n2. Undichtigkeiten im Ansaugsystem suchen (Schläuche, Dichtungen)\n3. Kraftstoffdruck prüfen (Kraftstoffpumpe, Filter)\n4. Lambda-Sonde prüfen (Bank 1)\n5. Drosselklappe reinigen\n6. Luftmassenmesser prüfen',
    'P0171', 'Kraftstoffsystem', 'medium', 'hard', '3-5 Stunden', 'de', 'live'
FROM public.model_generations mg
JOIN public.car_models cm ON mg.car_model_id = cm.id
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'bmw' AND cm.slug = '3er' AND mg.slug = 'e90-2005-2013'
ON CONFLICT DO NOTHING;

-- P0420 - Katalysator-Wirkungsgrad zu niedrig (Bank 1)
INSERT INTO public.car_faults (
    model_generation_id, slug, title, description, solution,
    error_code, affected_component, severity, difficulty_level,
    estimated_repair_time, language_path, status
)
SELECT mg.id, 'p0420-katalysator-wirkungsgrad-zu-niedrig-e90',
    'P0420: Katalysator-Wirkungsgrad zu niedrig (Bank 1)',
    'Der Fehlercode P0420 deutet auf einen defekten oder verschlissenen Katalysator hin. Beim BMW E90 kann dies durch Ölverbrauch oder defekte Lambda-Sonden verursacht werden.',
    '1. Lambda-Sonden prüfen (vor und nach Katalysator)\n2. Katalysator auf Beschädigungen prüfen\n3. Abgasanlage auf Undichtigkeiten prüfen\n4. Motor auf Ölverbrauch prüfen (kann Katalysator beschädigen)\n5. Bei Defekt: Katalysator wechseln',
    'P0420', 'Abgasanlage', 'high', 'expert', '4-6 Stunden', 'de', 'live'
FROM public.model_generations mg
JOIN public.car_models cm ON mg.car_model_id = cm.id
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'bmw' AND cm.slug = '3er' AND mg.slug = 'e90-2005-2013'
ON CONFLICT DO NOTHING;

-- 2A82 - VANOS Einlass Nockenwelle - Stellbereich
INSERT INTO public.car_faults (
    model_generation_id, slug, title, description, solution,
    error_code, affected_component, severity, difficulty_level,
    estimated_repair_time, language_path, status
)
SELECT mg.id, '2a82-vanos-einlass-nockenwelle-stellbereich-e90',
    '2A82: VANOS Einlass Nockenwelle - Stellbereich',
    'Der BMW-spezifische Fehlercode 2A82 weist auf ein Problem mit der VANOS-Verstellung der Einlassnockenwelle hin. Dies kann zu Leistungsverlust und erhöhtem Kraftstoffverbrauch führen.',
    '1. Ölstand und Öldruck prüfen\n2. VANOS-Magnetventil prüfen und reinigen/wechseln\n3. VANOS-Versteller prüfen\n4. Steuerzeiten prüfen\n5. Bei Defekt: VANOS-Versteller wechseln',
    '2A82', 'Motorsteuerung', 'high', 'hard', '4-8 Stunden', 'de', 'live'
FROM public.model_generations mg
JOIN public.car_models cm ON mg.car_model_id = cm.id
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'bmw' AND cm.slug = '3er' AND mg.slug = 'e90-2005-2013'
ON CONFLICT DO NOTHING;

-- 2A87 - VANOS Auslass Nockenwelle - Stellbereich
INSERT INTO public.car_faults (
    model_generation_id, slug, title, description, solution,
    error_code, affected_component, severity, difficulty_level,
    estimated_repair_time, language_path, status
)
SELECT mg.id, '2a87-vanos-auslass-nockenwelle-stellbereich-e90',
    '2A87: VANOS Auslass Nockenwelle - Stellbereich',
    'Der BMW-spezifische Fehlercode 2A87 weist auf ein Problem mit der VANOS-Verstellung der Auslassnockenwelle hin. Dies kann zu Leistungsverlust führen.',
    '1. Ölstand und Öldruck prüfen\n2. VANOS-Magnetventil prüfen und reinigen/wechseln\n3. VANOS-Versteller prüfen\n4. Steuerzeiten prüfen\n5. Bei Defekt: VANOS-Versteller wechseln',
    '2A87', 'Motorsteuerung', 'high', 'hard', '4-8 Stunden', 'de', 'live'
FROM public.model_generations mg
JOIN public.car_models cm ON mg.car_model_id = cm.id
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'bmw' AND cm.slug = '3er' AND mg.slug = 'e90-2005-2013'
ON CONFLICT DO NOTHING;

-- 5DF0 - ABS Pumpenmotor defekt
INSERT INTO public.car_faults (
    model_generation_id, slug, title, description, solution,
    error_code, affected_component, severity, difficulty_level,
    estimated_repair_time, language_path, status
)
SELECT mg.id, '5df0-abs-pumpenmotor-defekt-e90',
    '5DF0: ABS Pumpenmotor defekt',
    'Der Fehlercode 5DF0 deutet auf einen Defekt des Pumpenmotors im ABS/DSC-Steuergerät hin. Beim BMW E90 führt dies zum Ausfall des ABS-Systems.',
    '1. ABS/DSC-Steuergerät prüfen und bei Bedarf reparieren/wechseln\n2. Sicherungen prüfen\n3. Kabelbaum zum ABS-Steuergerät prüfen',
    '5DF0', 'ABS/DSC-System', 'critical', 'expert', '3-5 Stunden', 'de', 'live'
FROM public.model_generations mg
JOIN public.car_models cm ON mg.car_model_id = cm.id
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'bmw' AND cm.slug = '3er' AND mg.slug = 'e90-2005-2013'
ON CONFLICT DO NOTHING;

-- =====================================================
-- BMW 5er E39 (1995-2003) - Fehlercodes
-- =====================================================

-- P0300 - Zufällige Zylinderfehlzündung
INSERT INTO public.car_faults (
    model_generation_id, slug, title, description, solution,
    error_code, affected_component, severity, difficulty_level,
    estimated_repair_time, language_path, status
)
SELECT mg.id, 'p0300-zufallige-zylinderfehlzuendung-e39',
    'P0300: Zufällige Zylinderfehlzündung',
    'Der Fehlercode P0300 deutet auf zufällige Zylinderfehlzündungen hin. Beim BMW E39 häufig durch defekte Zündspulen oder verschlissene Zündkerzen verursacht.',
    '1. Zündkerzen prüfen und bei Bedarf wechseln\n2. Zündspulen auf Defekte prüfen\n3. Kraftstofffilter wechseln\n4. Luftfilter prüfen\n5. Lambda-Sonde prüfen\n6. Fehlerspeicher löschen und Testfahrt',
    'P0300', 'Zündsystem', 'medium', 'medium', '2-4 Stunden', 'de', 'live'
FROM public.model_generations mg
JOIN public.car_models cm ON mg.car_model_id = cm.id
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'bmw' AND cm.slug = '5er' AND mg.slug = 'e39-1995-2003'
ON CONFLICT DO NOTHING;

-- P0171 - Kraftstoffgemisch zu mager (Bank 1)
INSERT INTO public.car_faults (
    model_generation_id, slug, title, description, solution,
    error_code, affected_component, severity, difficulty_level,
    estimated_repair_time, language_path, status
)
SELECT mg.id, 'p0171-kraftstoffgemisch-zu-mager-e39',
    'P0171: Kraftstoffgemisch zu mager (Bank 1)',
    'Der Fehlercode P0171 zeigt an, dass das Kraftstoffgemisch zu mager ist. Beim BMW E39 häufig durch Undichtigkeiten im Ansaugsystem verursacht.',
    '1. Luftfilter prüfen und wechseln\n2. Undichtigkeiten im Ansaugsystem suchen (Schläuche, Dichtungen)\n3. Kraftstoffdruck prüfen (Kraftstoffpumpe, Filter)\n4. Lambda-Sonde prüfen (Bank 1)\n5. Drosselklappe reinigen\n6. Luftmassenmesser prüfen',
    'P0171', 'Kraftstoffsystem', 'medium', 'hard', '3-5 Stunden', 'de', 'live'
FROM public.model_generations mg
JOIN public.car_models cm ON mg.car_model_id = cm.id
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'bmw' AND cm.slug = '5er' AND mg.slug = 'e39-1995-2003'
ON CONFLICT DO NOTHING;

-- P0420 - Katalysator-Wirkungsgrad zu niedrig (Bank 1)
INSERT INTO public.car_faults (
    model_generation_id, slug, title, description, solution,
    error_code, affected_component, severity, difficulty_level,
    estimated_repair_time, language_path, status
)
SELECT mg.id, 'p0420-katalysator-wirkungsgrad-zu-niedrig-e39',
    'P0420: Katalysator-Wirkungsgrad zu niedrig (Bank 1)',
    'Der Fehlercode P0420 deutet auf einen defekten oder verschlissenen Katalysator hin. Beim BMW E39 kann dies durch Ölverbrauch verursacht werden.',
    '1. Lambda-Sonden prüfen (vor und nach Katalysator)\n2. Katalysator auf Beschädigungen prüfen\n3. Abgasanlage auf Undichtigkeiten prüfen\n4. Motor auf Ölverbrauch prüfen (kann Katalysator beschädigen)\n5. Bei Defekt: Katalysator wechseln',
    'P0420', 'Abgasanlage', 'high', 'expert', '4-6 Stunden', 'de', 'live'
FROM public.model_generations mg
JOIN public.car_models cm ON mg.car_model_id = cm.id
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'bmw' AND cm.slug = '5er' AND mg.slug = 'e39-1995-2003'
ON CONFLICT DO NOTHING;

-- P0015 - Nockenwellenposition B - Spät (Bank 1)
INSERT INTO public.car_faults (
    model_generation_id, slug, title, description, solution,
    error_code, affected_component, severity, difficulty_level,
    estimated_repair_time, language_path, status
)
SELECT mg.id, 'p0015-nockenwellenverstellung-bank-1-e39',
    'P0015: Nockenwellenposition B - Spät (Bank 1)',
    'Der Fehlercode P0015 weist auf ein Problem mit der Nockenwellenverstellung auf Bank 1 hin, bei dem die Nockenwelle zu spät steht. Beim BMW E39 häufig durch VANOS-Probleme verursacht.',
    '1. Ölstand und Öldruck prüfen\n2. VANOS-Magnetventil prüfen und reinigen/wechseln\n3. Nockenwellenversteller prüfen\n4. Steuerzeiten prüfen',
    'P0015', 'Motorsteuerung', 'high', 'hard', '3-6 Stunden', 'de', 'live'
FROM public.model_generations mg
JOIN public.car_models cm ON mg.car_model_id = cm.id
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'bmw' AND cm.slug = '5er' AND mg.slug = 'e39-1995-2003'
ON CONFLICT DO NOTHING;

-- =====================================================
-- Mercedes E-Klasse W211 (2002-2009) - Fehlercodes
-- =====================================================

-- P0300 - Zufällige Zylinderfehlzündung
INSERT INTO public.car_faults (
    model_generation_id, slug, title, description, solution,
    error_code, affected_component, severity, difficulty_level,
    estimated_repair_time, language_path, status
)
SELECT mg.id, 'p0300-zufallige-zylinderfehlzuendung-w211',
    'P0300: Zufällige Zylinderfehlzündung',
    'Der Fehlercode P0300 deutet auf zufällige Zylinderfehlzündungen hin. Beim Mercedes W211 häufig durch defekte Zündspulen oder verschlissene Zündkerzen verursacht.',
    '1. Zündkerzen prüfen und bei Bedarf wechseln\n2. Zündspulen auf Defekte prüfen\n3. Kraftstofffilter wechseln\n4. Luftfilter prüfen\n5. Lambda-Sonde prüfen\n6. Fehlerspeicher löschen und Testfahrt',
    'P0300', 'Zündsystem', 'medium', 'medium', '2-4 Stunden', 'de', 'live'
FROM public.model_generations mg
JOIN public.car_models cm ON mg.car_model_id = cm.id
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'mercedes-benz' AND cm.slug = 'e-klasse' AND mg.slug = 'w211-2002-2009'
ON CONFLICT DO NOTHING;

-- P0171 - Kraftstoffgemisch zu mager (Bank 1)
INSERT INTO public.car_faults (
    model_generation_id, slug, title, description, solution,
    error_code, affected_component, severity, difficulty_level,
    estimated_repair_time, language_path, status
)
SELECT mg.id, 'p0171-kraftstoffgemisch-zu-mager-w211',
    'P0171: Kraftstoffgemisch zu mager (Bank 1)',
    'Der Fehlercode P0171 zeigt an, dass das Kraftstoffgemisch zu mager ist. Beim Mercedes W211 häufig durch Undichtigkeiten im Ansaugsystem verursacht.',
    '1. Luftfilter prüfen und wechseln\n2. Undichtigkeiten im Ansaugsystem suchen (Schläuche, Dichtungen)\n3. Kraftstoffdruck prüfen (Kraftstoffpumpe, Filter)\n4. Lambda-Sonde prüfen (Bank 1)\n5. Drosselklappe reinigen\n6. Luftmassenmesser prüfen',
    'P0171', 'Kraftstoffsystem', 'medium', 'hard', '3-5 Stunden', 'de', 'live'
FROM public.model_generations mg
JOIN public.car_models cm ON mg.car_model_id = cm.id
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'mercedes-benz' AND cm.slug = 'e-klasse' AND mg.slug = 'w211-2002-2009'
ON CONFLICT DO NOTHING;

-- P0420 - Katalysator-Wirkungsgrad zu niedrig (Bank 1)
INSERT INTO public.car_faults (
    model_generation_id, slug, title, description, solution,
    error_code, affected_component, severity, difficulty_level,
    estimated_repair_time, language_path, status
)
SELECT mg.id, 'p0420-katalysator-wirkungsgrad-zu-niedrig-w211',
    'P0420: Katalysator-Wirkungsgrad zu niedrig (Bank 1)',
    'Der Fehlercode P0420 deutet auf einen defekten oder verschlissenen Katalysator hin. Beim Mercedes W211 kann dies durch Ölverbrauch verursacht werden.',
    '1. Lambda-Sonden prüfen (vor und nach Katalysator)\n2. Katalysator auf Beschädigungen prüfen\n3. Abgasanlage auf Undichtigkeiten prüfen\n4. Motor auf Ölverbrauch prüfen (kann Katalysator beschädigen)\n5. Bei Defekt: Katalysator wechseln',
    'P0420', 'Abgasanlage', 'high', 'expert', '4-6 Stunden', 'de', 'live'
FROM public.model_generations mg
JOIN public.car_models cm ON mg.car_model_id = cm.id
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'mercedes-benz' AND cm.slug = 'e-klasse' AND mg.slug = 'w211-2002-2009'
ON CONFLICT DO NOTHING;

-- P2510 - ESP/ASR Steuergerät - Kommunikationsfehler
INSERT INTO public.car_faults (
    model_generation_id, slug, title, description, solution,
    error_code, affected_component, severity, difficulty_level,
    estimated_repair_time, language_path, status
)
SELECT mg.id, 'p2510-esp-asr-steuergeraet-kommunikationsfehler-w211',
    'P2510: ESP/ASR Steuergerät - Kommunikationsfehler',
    'Der Fehlercode P2510 weist auf einen Kommunikationsfehler im ESP/ASR-Steuergerät hin. Beim Mercedes W211 kann dies zu Ausfällen des Fahrdynamiksystems führen.',
    '1. ESP/ASR-Steuergerät prüfen\n2. CAN-Bus-Verbindung prüfen\n3. Sicherungen prüfen\n4. Kabelbaum zum Steuergerät prüfen\n5. Bei Defekt: Steuergerät wechseln',
    'P2510', 'Fahrdynamiksystem', 'high', 'hard', '2-4 Stunden', 'de', 'live'
FROM public.model_generations mg
JOIN public.car_models cm ON mg.car_model_id = cm.id
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'mercedes-benz' AND cm.slug = 'e-klasse' AND mg.slug = 'w211-2002-2009'
ON CONFLICT DO NOTHING;

-- =====================================================
-- Audi A6 C6 (2004-2011) - Fehlercodes
-- =====================================================

-- P0300 - Zufällige Zylinderfehlzündung
INSERT INTO public.car_faults (
    model_generation_id, slug, title, description, solution,
    error_code, affected_component, severity, difficulty_level,
    estimated_repair_time, language_path, status
)
SELECT mg.id, 'p0300-zufallige-zylinderfehlzuendung-a6-c6',
    'P0300: Zufällige Zylinderfehlzündung',
    'Der Fehlercode P0300 deutet auf zufällige Zylinderfehlzündungen hin. Beim Audi A6 C6 häufig durch defekte Zündspulen oder verschlissene Zündkerzen verursacht.',
    '1. Zündkerzen prüfen und bei Bedarf wechseln\n2. Zündspulen auf Defekte prüfen\n3. Kraftstofffilter wechseln\n4. Luftfilter prüfen\n5. Lambda-Sonde prüfen\n6. Fehlerspeicher löschen und Testfahrt',
    'P0300', 'Zündsystem', 'medium', 'medium', '2-4 Stunden', 'de', 'live'
FROM public.model_generations mg
JOIN public.car_models cm ON mg.car_model_id = cm.id
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'audi' AND cm.slug = 'a6' AND mg.slug = 'a6-c6-2004-2011'
ON CONFLICT DO NOTHING;

-- P0171 - Kraftstoffgemisch zu mager (Bank 1)
INSERT INTO public.car_faults (
    model_generation_id, slug, title, description, solution,
    error_code, affected_component, severity, difficulty_level,
    estimated_repair_time, language_path, status
)
SELECT mg.id, 'p0171-kraftstoffgemisch-zu-mager-a6-c6',
    'P0171: Kraftstoffgemisch zu mager (Bank 1)',
    'Der Fehlercode P0171 zeigt an, dass das Kraftstoffgemisch zu mager ist. Beim Audi A6 C6 häufig durch Undichtigkeiten im Ansaugsystem verursacht.',
    '1. Luftfilter prüfen und wechseln\n2. Undichtigkeiten im Ansaugsystem suchen (Schläuche, Dichtungen)\n3. Kraftstoffdruck prüfen (Kraftstoffpumpe, Filter)\n4. Lambda-Sonde prüfen (Bank 1)\n5. Drosselklappe reinigen\n6. Luftmassenmesser prüfen',
    'P0171', 'Kraftstoffsystem', 'medium', 'hard', '3-5 Stunden', 'de', 'live'
FROM public.model_generations mg
JOIN public.car_models cm ON mg.car_model_id = cm.id
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'audi' AND cm.slug = 'a6' AND mg.slug = 'a6-c6-2004-2011'
ON CONFLICT DO NOTHING;

-- P0420 - Katalysator-Wirkungsgrad zu niedrig (Bank 1)
INSERT INTO public.car_faults (
    model_generation_id, slug, title, description, solution,
    error_code, affected_component, severity, difficulty_level,
    estimated_repair_time, language_path, status
)
SELECT mg.id, 'p0420-katalysator-wirkungsgrad-zu-niedrig-a6-c6',
    'P0420: Katalysator-Wirkungsgrad zu niedrig (Bank 1)',
    'Der Fehlercode P0420 deutet auf einen defekten oder verschlissenen Katalysator hin. Beim Audi A6 C6 kann dies durch Ölverbrauch verursacht werden.',
    '1. Lambda-Sonden prüfen (vor und nach Katalysator)\n2. Katalysator auf Beschädigungen prüfen\n3. Abgasanlage auf Undichtigkeiten prüfen\n4. Motor auf Ölverbrauch prüfen (kann Katalysator beschädigen)\n5. Bei Defekt: Katalysator wechseln',
    'P0420', 'Abgasanlage', 'high', 'expert', '4-6 Stunden', 'de', 'live'
FROM public.model_generations mg
JOIN public.car_models cm ON mg.car_model_id = cm.id
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'audi' AND cm.slug = 'a6' AND mg.slug = 'a6-c6-2004-2011'
ON CONFLICT DO NOTHING;

-- P2187 - Kraftstoffgemisch zu mager im Leerlauf (Bank 1)
INSERT INTO public.car_faults (
    model_generation_id, slug, title, description, solution,
    error_code, affected_component, severity, difficulty_level,
    estimated_repair_time, language_path, status
)
SELECT mg.id, 'p2187-kraftstoffgemisch-zu-mager-leerlauf-a6-c6',
    'P2187: Kraftstoffgemisch zu mager im Leerlauf (Bank 1)',
    'Der Fehlercode P2187 zeigt an, dass das Kraftstoffgemisch im Leerlauf zu mager ist. Beim Audi A6 C6 häufig durch Undichtigkeiten im Ansaugsystem verursacht.',
    '1. Undichtigkeiten im Ansaugsystem suchen (besonders im Leerlauf)\n2. Leerlaufregelventil prüfen\n3. Lambda-Sonde prüfen (Bank 1)\n4. Drosselklappe reinigen\n5. Luftmassenmesser prüfen',
    'P2187', 'Kraftstoffsystem', 'medium', 'hard', '2-4 Stunden', 'de', 'live'
FROM public.model_generations mg
JOIN public.car_models cm ON mg.car_model_id = cm.id
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'audi' AND cm.slug = 'a6' AND mg.slug = 'a6-c6-2004-2011'
ON CONFLICT DO NOTHING;

-- =====================================================
-- VW Passat B6 (2005-2010) - Fehlercodes
-- =====================================================

-- P0300 - Zufällige Zylinderfehlzündung
INSERT INTO public.car_faults (
    model_generation_id, slug, title, description, solution,
    error_code, affected_component, severity, difficulty_level,
    estimated_repair_time, language_path, status
)
SELECT mg.id, 'p0300-zufallige-zylinderfehlzuendung-passat-b6',
    'P0300: Zufällige Zylinderfehlzündung',
    'Der Fehlercode P0300 deutet auf zufällige Zylinderfehlzündungen hin. Beim VW Passat B6 häufig durch defekte Zündspulen oder verschlissene Zündkerzen verursacht.',
    '1. Zündkerzen prüfen und bei Bedarf wechseln\n2. Zündspulen auf Defekte prüfen\n3. Kraftstofffilter wechseln\n4. Luftfilter prüfen\n5. Lambda-Sonde prüfen\n6. Fehlerspeicher löschen und Testfahrt',
    'P0300', 'Zündsystem', 'medium', 'medium', '2-4 Stunden', 'de', 'live'
FROM public.model_generations mg
JOIN public.car_models cm ON mg.car_model_id = cm.id
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'volkswagen' AND cm.slug = 'passat' AND mg.slug = 'b6-2005-2010'
ON CONFLICT DO NOTHING;

-- P0171 - Kraftstoffgemisch zu mager (Bank 1)
INSERT INTO public.car_faults (
    model_generation_id, slug, title, description, solution,
    error_code, affected_component, severity, difficulty_level,
    estimated_repair_time, language_path, status
)
SELECT mg.id, 'p0171-kraftstoffgemisch-zu-mager-passat-b6',
    'P0171: Kraftstoffgemisch zu mager (Bank 1)',
    'Der Fehlercode P0171 zeigt an, dass das Kraftstoffgemisch zu mager ist. Beim VW Passat B6 häufig durch Undichtigkeiten im Ansaugsystem verursacht.',
    '1. Luftfilter prüfen und wechseln\n2. Undichtigkeiten im Ansaugsystem suchen (Schläuche, Dichtungen)\n3. Kraftstoffdruck prüfen (Kraftstoffpumpe, Filter)\n4. Lambda-Sonde prüfen (Bank 1)\n5. Drosselklappe reinigen\n6. Luftmassenmesser prüfen',
    'P0171', 'Kraftstoffsystem', 'medium', 'hard', '3-5 Stunden', 'de', 'live'
FROM public.model_generations mg
JOIN public.car_models cm ON mg.car_model_id = cm.id
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'volkswagen' AND cm.slug = 'passat' AND mg.slug = 'b6-2005-2010'
ON CONFLICT DO NOTHING;

-- P0420 - Katalysator-Wirkungsgrad zu niedrig (Bank 1)
INSERT INTO public.car_faults (
    model_generation_id, slug, title, description, solution,
    error_code, affected_component, severity, difficulty_level,
    estimated_repair_time, language_path, status
)
SELECT mg.id, 'p0420-katalysator-wirkungsgrad-zu-niedrig-passat-b6',
    'P0420: Katalysator-Wirkungsgrad zu niedrig (Bank 1)',
    'Der Fehlercode P0420 deutet auf einen defekten oder verschlissenen Katalysator hin. Beim VW Passat B6 kann dies durch Ölverbrauch verursacht werden.',
    '1. Lambda-Sonden prüfen (vor und nach Katalysator)\n2. Katalysator auf Beschädigungen prüfen\n3. Abgasanlage auf Undichtigkeiten prüfen\n4. Motor auf Ölverbrauch prüfen (kann Katalysator beschädigen)\n5. Bei Defekt: Katalysator wechseln',
    'P0420', 'Abgasanlage', 'high', 'expert', '4-6 Stunden', 'de', 'live'
FROM public.model_generations mg
JOIN public.car_models cm ON mg.car_model_id = cm.id
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'volkswagen' AND cm.slug = 'passat' AND mg.slug = 'b6-2005-2010'
ON CONFLICT DO NOTHING;

-- P2188 - Kraftstoffgemisch zu mager im Leerlauf (Bank 2)
INSERT INTO public.car_faults (
    model_generation_id, slug, title, description, solution,
    error_code, affected_component, severity, difficulty_level,
    estimated_repair_time, language_path, status
)
SELECT mg.id, 'p2188-kraftstoffgemisch-zu-mager-leerlauf-passat-b6',
    'P2188: Kraftstoffgemisch zu mager im Leerlauf (Bank 2)',
    'Der Fehlercode P2188 zeigt an, dass das Kraftstoffgemisch im Leerlauf zu mager ist. Beim VW Passat B6 häufig durch Undichtigkeiten im Ansaugsystem verursacht.',
    '1. Undichtigkeiten im Ansaugsystem suchen (besonders im Leerlauf)\n2. Leerlaufregelventil prüfen\n3. Lambda-Sonde prüfen (Bank 2)\n4. Drosselklappe reinigen\n5. Luftmassenmesser prüfen',
    'P2188', 'Kraftstoffsystem', 'medium', 'hard', '2-4 Stunden', 'de', 'live'
FROM public.model_generations mg
JOIN public.car_models cm ON mg.car_model_id = cm.id
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'volkswagen' AND cm.slug = 'passat' AND mg.slug = 'b6-2005-2010'
ON CONFLICT DO NOTHING;

-- =====================================================
-- WEITERE HÄUFIGE FEHLERCODES FÜR ALLE GENERATIONEN
-- =====================================================

-- P0135 - Lambda-Sonde Bank 1 Sensor 1 - Heizung (für alle Generationen)
INSERT INTO public.car_faults (
    model_generation_id, slug, title, description, solution,
    error_code, affected_component, severity, difficulty_level,
    estimated_repair_time, language_path, status
)
SELECT mg.id, 'p0135-lambda-sonde-bank-1-sensor-1-heizung-' || mg.slug,
    'P0135: Lambda-Sonde Bank 1 Sensor 1 - Heizung',
    'Der Fehlercode P0135 deutet auf ein Problem mit der Heizung der Lambda-Sonde vor dem Katalysator hin. Dies kann zu erhöhten Abgaswerten führen.',
    '1. Lambda-Sonde Bank 1 Sensor 1 Heizung elektrisch prüfen\n2. Kabelbaum zur Lambda-Sonde prüfen\n3. Sicherung prüfen\n4. Bei Defekt: Lambda-Sonde wechseln',
    'P0135', 'Abgasreinigung', 'medium', 'medium', '1-2 Stunden', 'de', 'live'
FROM public.model_generations mg
WHERE mg.slug IN ('e90-2005-2013', 'e39-1995-2003', 'w211-2002-2009', 'a6-c6-2004-2011', 'b6-2005-2010')
ON CONFLICT DO NOTHING;

-- P0136 - Lambda-Sonde Bank 1 Sensor 2 - Fehlfunktion (für alle Generationen)
INSERT INTO public.car_faults (
    model_generation_id, slug, title, description, solution,
    error_code, affected_component, severity, difficulty_level,
    estimated_repair_time, language_path, status
)
SELECT mg.id, 'p0136-lambda-sonde-bank-1-sensor-2-fehlfunktion-' || mg.slug,
    'P0136: Lambda-Sonde Bank 1 Sensor 2 - Fehlfunktion',
    'Der Fehlercode P0136 zeigt eine Fehlfunktion der Lambda-Sonde nach dem Katalysator an. Dies kann zu erhöhten Abgaswerten führen.',
    '1. Lambda-Sonde Bank 1 Sensor 2 elektrisch prüfen\n2. Kabelbaum zur Lambda-Sonde prüfen\n3. Abgasanlage auf Undichtigkeiten prüfen\n4. Bei Defekt: Lambda-Sonde wechseln',
    'P0136', 'Abgasreinigung', 'medium', 'medium', '1-2 Stunden', 'de', 'live'
FROM public.model_generations mg
WHERE mg.slug IN ('e90-2005-2013', 'e39-1995-2003', 'w211-2002-2009', 'a6-c6-2004-2011', 'b6-2005-2010')
ON CONFLICT DO NOTHING;

-- P0102 - Luftmassenmesser (LMM) - Signal zu niedrig (für alle Generationen)
INSERT INTO public.car_faults (
    model_generation_id, slug, title, description, solution,
    error_code, affected_component, severity, difficulty_level,
    estimated_repair_time, language_path, status
)
SELECT mg.id, 'p0102-luftmassenmesser-signal-zu-niedrig-' || mg.slug,
    'P0102: Luftmassenmesser (LMM) - Signal zu niedrig',
    'Der Fehlercode P0102 deutet auf ein zu niedriges Signal vom Luftmassenmesser hin. Dies kann zu Leistungsverlust, unruhigem Leerlauf und erhöhtem Kraftstoffverbrauch führen.',
    '1. Luftmassenmesser elektrisch prüfen\n2. Kabelbaum zum LMM prüfen\n3. Luftfilter prüfen\n4. Ansaugsystem auf Undichtigkeiten prüfen\n5. Bei Defekt: LMM wechseln',
    'P0102', 'Motorsteuerung', 'medium', 'medium', '1-2 Stunden', 'de', 'live'
FROM public.model_generations mg
WHERE mg.slug IN ('e90-2005-2013', 'e39-1995-2003', 'w211-2002-2009', 'a6-c6-2004-2011', 'b6-2005-2010')
ON CONFLICT DO NOTHING;

-- P0103 - Luftmassenmesser (LMM) - Signal zu hoch (für alle Generationen)
INSERT INTO public.car_faults (
    model_generation_id, slug, title, description, solution,
    error_code, affected_component, severity, difficulty_level,
    estimated_repair_time, language_path, status
)
SELECT mg.id, 'p0103-luftmassenmesser-signal-zu-hoch-' || mg.slug,
    'P0103: Luftmassenmesser (LMM) - Signal zu hoch',
    'Der Fehlercode P0103 deutet auf ein zu hohes Signal vom Luftmassenmesser hin. Dies kann zu Leistungsverlust, unruhigem Leerlauf und erhöhtem Kraftstoffverbrauch führen.',
    '1. Luftmassenmesser elektrisch prüfen\n2. Kabelbaum zum LMM prüfen\n3. Ansaugsystem auf Undichtigkeiten prüfen\n4. Bei Defekt: LMM wechseln',
    'P0103', 'Motorsteuerung', 'medium', 'medium', '1-2 Stunden', 'de', 'live'
FROM public.model_generations mg
WHERE mg.slug IN ('e90-2005-2013', 'e39-1995-2003', 'w211-2002-2009', 'a6-c6-2004-2011', 'b6-2005-2010')
ON CONFLICT DO NOTHING;

-- P0440 - Verdunstungsemissionssystem (EVAP) - Fehlfunktion (für alle Generationen)
INSERT INTO public.car_faults (
    model_generation_id, slug, title, description, solution,
    error_code, affected_component, severity, difficulty_level,
    estimated_repair_time, language_path, status
)
SELECT mg.id, 'p0440-evap-system-fehlfunktion-' || mg.slug,
    'P0440: Verdunstungsemissionssystem (EVAP) - Fehlfunktion',
    'Der Fehlercode P0440 deutet auf eine Fehlfunktion im EVAP-System hin, das Kraftstoffdämpfe auffängt. Dies kann zu erhöhten Emissionen führen.',
    '1. Tankdeckel prüfen und festziehen\n2. EVAP-Schläuche und -Ventile auf Undichtigkeiten prüfen\n3. Aktivkohlefilter prüfen',
    'P0440', 'Abgasreinigung', 'low', 'easy', '0.5-2 Stunden', 'de', 'live'
FROM public.model_generations mg
WHERE mg.slug IN ('e90-2005-2013', 'e39-1995-2003', 'w211-2002-2009', 'a6-c6-2004-2011', 'b6-2005-2010')
ON CONFLICT DO NOTHING;

-- P0505 - Leerlaufregelung - Fehlfunktion (für alle Generationen)
INSERT INTO public.car_faults (
    model_generation_id, slug, title, description, solution,
    error_code, affected_component, severity, difficulty_level,
    estimated_repair_time, language_path, status
)
SELECT mg.id, 'p0505-leerlaufregelung-fehlfunktion-' || mg.slug,
    'P0505: Leerlaufregelung - Fehlfunktion',
    'Der Fehlercode P0505 deutet auf eine Fehlfunktion in der Leerlaufregelung hin. Dies kann zu unruhigem Leerlauf oder Absterben des Motors führen.',
    '1. Leerlaufregelventil prüfen und reinigen/wechseln\n2. Drosselklappe reinigen\n3. Ansaugsystem auf Undichtigkeiten prüfen',
    'P0505', 'Motorsteuerung', 'medium', 'medium', '1-2 Stunden', 'de', 'live'
FROM public.model_generations mg
WHERE mg.slug IN ('e90-2005-2013', 'e39-1995-2003', 'w211-2002-2009', 'a6-c6-2004-2011', 'b6-2005-2010')
ON CONFLICT DO NOTHING;

-- P0506 - Leerlaufregelung - Drehzahl zu niedrig (für alle Generationen)
INSERT INTO public.car_faults (
    model_generation_id, slug, title, description, solution,
    error_code, affected_component, severity, difficulty_level,
    estimated_repair_time, language_path, status
)
SELECT mg.id, 'p0506-leerlaufregelung-drehzahl-zu-niedrig-' || mg.slug,
    'P0506: Leerlaufregelung - Drehzahl zu niedrig',
    'Der Fehlercode P0506 deutet auf eine zu niedrige Leerlaufdrehzahl hin. Dies kann zu unruhigem Motorlauf oder Absterben des Motors führen.',
    '1. Leerlaufregelventil prüfen und reinigen/wechseln\n2. Drosselklappe reinigen\n3. Ansaugsystem auf Undichtigkeiten prüfen',
    'P0506', 'Motorsteuerung', 'medium', 'medium', '1-2 Stunden', 'de', 'live'
FROM public.model_generations mg
WHERE mg.slug IN ('e90-2005-2013', 'e39-1995-2003', 'w211-2002-2009', 'a6-c6-2004-2011', 'b6-2005-2010')
ON CONFLICT DO NOTHING;

-- P0507 - Leerlaufregelung - Drehzahl zu hoch (für alle Generationen)
INSERT INTO public.car_faults (
    model_generation_id, slug, title, description, solution,
    error_code, affected_component, severity, difficulty_level,
    estimated_repair_time, language_path, status
)
SELECT mg.id, 'p0507-leerlaufregelung-drehzahl-zu-hoch-' || mg.slug,
    'P0507: Leerlaufregelung - Drehzahl zu hoch',
    'Der Fehlercode P0507 deutet auf eine zu hohe Leerlaufdrehzahl hin. Dies kann auf Undichtigkeiten im Ansaugsystem oder ein defektes Leerlaufregelventil hindeuten.',
    '1. Leerlaufregelventil prüfen und reinigen/wechseln\n2. Drosselklappe reinigen\n3. Ansaugsystem auf Undichtigkeiten prüfen',
    'P0507', 'Motorsteuerung', 'medium', 'medium', '1-2 Stunden', 'de', 'live'
FROM public.model_generations mg
WHERE mg.slug IN ('e90-2005-2013', 'e39-1995-2003', 'w211-2002-2009', 'a6-c6-2004-2011', 'b6-2005-2010')
ON CONFLICT DO NOTHING;

-- P0118 - Kühlmitteltemperatursensor - Signal zu hoch (für alle Generationen)
INSERT INTO public.car_faults (
    model_generation_id, slug, title, description, solution,
    error_code, affected_component, severity, difficulty_level,
    estimated_repair_time, language_path, status
)
SELECT mg.id, 'p0118-kuehlmitteltemperatursensor-signal-zu-hoch-' || mg.slug,
    'P0118: Kühlmitteltemperatursensor - Signal zu hoch',
    'Der Fehlercode P0118 deutet auf ein zu hohes Signal vom Kühlmitteltemperatursensor hin. Dies kann zu Startproblemen und erhöhtem Kraftstoffverbrauch führen.',
    '1. Kühlmitteltemperatursensor elektrisch prüfen\n2. Kabelbaum zum Sensor prüfen\n3. Bei Defekt: Sensor wechseln',
    'P0118', 'Motorsteuerung', 'medium', 'easy', '0.5-1 Stunde', 'de', 'live'
FROM public.model_generations mg
WHERE mg.slug IN ('e90-2005-2013', 'e39-1995-2003', 'w211-2002-2009', 'a6-c6-2004-2011', 'b6-2005-2010')
ON CONFLICT DO NOTHING;

-- P0128 - Kühlmitteltemperatur unterhalb des Thermostat-Regelbereichs (für alle Generationen)
INSERT INTO public.car_faults (
    model_generation_id, slug, title, description, solution,
    error_code, affected_component, severity, difficulty_level,
    estimated_repair_time, language_path, status
)
SELECT mg.id, 'p0128-kuehlmitteltemperatur-unterhalb-thermostat-' || mg.slug,
    'P0128: Kühlmitteltemperatur unterhalb des Thermostat-Regelbereichs',
    'Der Fehlercode P0128 deutet darauf hin, dass der Motor nicht die optimale Betriebstemperatur erreicht. Dies kann auf ein defektes Thermostat hinweisen.',
    '1. Thermostat prüfen und bei Bedarf wechseln\n2. Kühlmittelstand prüfen\n3. Kühlmitteltemperatursensor prüfen',
    'P0128', 'Kühlsystem', 'medium', 'medium', '1-3 Stunden', 'de', 'live'
FROM public.model_generations mg
WHERE mg.slug IN ('e90-2005-2013', 'e39-1995-2003', 'w211-2002-2009', 'a6-c6-2004-2011', 'b6-2005-2010')
ON CONFLICT DO NOTHING;

-- P0301 - Zylinder 1 Fehlzündung (für alle Generationen)
INSERT INTO public.car_faults (
    model_generation_id, slug, title, description, solution,
    error_code, affected_component, severity, difficulty_level,
    estimated_repair_time, language_path, status
)
SELECT mg.id, 'p0301-zylinder-1-fehlzuendung-' || mg.slug,
    'P0301: Zylinder 1 Fehlzündung',
    'Der Fehlercode P0301 zeigt eine Fehlzündung im Zylinder 1 an. Dies führt zu Ruckeln, Leistungsverlust und erhöhtem Kraftstoffverbrauch.',
    '1. Zündkerze Zylinder 1 prüfen und wechseln\n2. Zündspule Zylinder 1 prüfen\n3. Einspritzventil Zylinder 1 prüfen\n4. Kompression Zylinder 1 prüfen\n5. Kraftstoffqualität prüfen',
    'P0301', 'Zündsystem', 'medium', 'medium', '1-2 Stunden', 'de', 'live'
FROM public.model_generations mg
WHERE mg.slug IN ('e90-2005-2013', 'e39-1995-2003', 'w211-2002-2009', 'a6-c6-2004-2011', 'b6-2005-2010')
ON CONFLICT DO NOTHING;

-- P0302 - Zylinder 2 Fehlzündung (für alle Generationen)
INSERT INTO public.car_faults (
    model_generation_id, slug, title, description, solution,
    error_code, affected_component, severity, difficulty_level,
    estimated_repair_time, language_path, status
)
SELECT mg.id, 'p0302-zylinder-2-fehlzuendung-' || mg.slug,
    'P0302: Zylinder 2 Fehlzündung',
    'Der Fehlercode P0302 zeigt eine Fehlzündung im Zylinder 2 an. Dies führt zu Ruckeln, Leistungsverlust und erhöhtem Kraftstoffverbrauch.',
    '1. Zündkerze Zylinder 2 prüfen und wechseln\n2. Zündspule Zylinder 2 prüfen\n3. Einspritzventil Zylinder 2 prüfen\n4. Kompression Zylinder 2 prüfen\n5. Kraftstoffqualität prüfen',
    'P0302', 'Zündsystem', 'medium', 'medium', '1-2 Stunden', 'de', 'live'
FROM public.model_generations mg
WHERE mg.slug IN ('e90-2005-2013', 'e39-1995-2003', 'w211-2002-2009', 'a6-c6-2004-2011', 'b6-2005-2010')
ON CONFLICT DO NOTHING;

-- P0303 - Zylinder 3 Fehlzündung (für alle Generationen)
INSERT INTO public.car_faults (
    model_generation_id, slug, title, description, solution,
    error_code, affected_component, severity, difficulty_level,
    estimated_repair_time, language_path, status
)
SELECT mg.id, 'p0303-zylinder-3-fehlzuendung-' || mg.slug,
    'P0303: Zylinder 3 Fehlzündung',
    'Der Fehlercode P0303 zeigt eine Fehlzündung im Zylinder 3 an. Dies führt zu Ruckeln, Leistungsverlust und erhöhtem Kraftstoffverbrauch.',
    '1. Zündkerze Zylinder 3 prüfen und wechseln\n2. Zündspule Zylinder 3 prüfen\n3. Einspritzventil Zylinder 3 prüfen\n4. Kompression Zylinder 3 prüfen\n5. Kraftstoffqualität prüfen',
    'P0303', 'Zündsystem', 'medium', 'medium', '1-2 Stunden', 'de', 'live'
FROM public.model_generations mg
WHERE mg.slug IN ('e90-2005-2013', 'e39-1995-2003', 'w211-2002-2009', 'a6-c6-2004-2011', 'b6-2005-2010')
ON CONFLICT DO NOTHING;

-- P0304 - Zylinder 4 Fehlzündung (für alle Generationen)
INSERT INTO public.car_faults (
    model_generation_id, slug, title, description, solution,
    error_code, affected_component, severity, difficulty_level,
    estimated_repair_time, language_path, status
)
SELECT mg.id, 'p0304-zylinder-4-fehlzuendung-' || mg.slug,
    'P0304: Zylinder 4 Fehlzündung',
    'Der Fehlercode P0304 zeigt eine Fehlzündung im Zylinder 4 an. Dies führt zu Ruckeln, Leistungsverlust und erhöhtem Kraftstoffverbrauch.',
    '1. Zündkerze Zylinder 4 prüfen und wechseln\n2. Zündspule Zylinder 4 prüfen\n3. Einspritzventil Zylinder 4 prüfen\n4. Kompression Zylinder 4 prüfen\n5. Kraftstoffqualität prüfen',
    'P0304', 'Zündsystem', 'medium', 'medium', '1-2 Stunden', 'de', 'live'
FROM public.model_generations mg
WHERE mg.slug IN ('e90-2005-2013', 'e39-1995-2003', 'w211-2002-2009', 'a6-c6-2004-2011', 'b6-2005-2010')
ON CONFLICT DO NOTHING;

-- P0172 - Kraftstoffgemisch zu fett (Bank 1) (für alle Generationen)
INSERT INTO public.car_faults (
    model_generation_id, slug, title, description, solution,
    error_code, affected_component, severity, difficulty_level,
    estimated_repair_time, language_path, status
)
SELECT mg.id, 'p0172-kraftstoffgemisch-zu-fett-' || mg.slug,
    'P0172: Kraftstoffgemisch zu fett (Bank 1)',
    'Der Fehlercode P0172 zeigt an, dass das Kraftstoffgemisch zu fett ist. Dies führt zu erhöhtem Kraftstoffverbrauch, Rußbildung und möglichen Katalysatorschäden.',
    '1. Lambda-Sonde Bank 1 prüfen\n2. Kraftstoffdruck prüfen\n3. Einspritzventile prüfen\n4. Luftmassenmesser prüfen\n5. Drosselklappe reinigen\n6. Kühlmitteltemperatursensor prüfen',
    'P0172', 'Kraftstoffsystem', 'medium', 'hard', '3-5 Stunden', 'de', 'live'
FROM public.model_generations mg
WHERE mg.slug IN ('e90-2005-2013', 'e39-1995-2003', 'w211-2002-2009', 'a6-c6-2004-2011', 'b6-2005-2010')
ON CONFLICT DO NOTHING;

-- P0441 - EVAP-System - Falscher Durchfluss (für alle Generationen)
INSERT INTO public.car_faults (
    model_generation_id, slug, title, description, solution,
    error_code, affected_component, severity, difficulty_level,
    estimated_repair_time, language_path, status
)
SELECT mg.id, 'p0441-evap-system-falscher-durchfluss-' || mg.slug,
    'P0441: EVAP-System - Falscher Durchfluss',
    'Der Fehlercode P0441 deutet auf einen falschen Durchfluss im EVAP-System hin. Dies kann auf ein defektes Spülventil oder verstopfte Leitungen hindeuten.',
    '1. Spülventil prüfen und reinigen/wechseln\n2. EVAP-Leitungen auf Verstopfungen prüfen',
    'P0441', 'Abgasreinigung', 'low', 'medium', '1-3 Stunden', 'de', 'live'
FROM public.model_generations mg
WHERE mg.slug IN ('e90-2005-2013', 'e39-1995-2003', 'w211-2002-2009', 'a6-c6-2004-2011', 'b6-2005-2010')
ON CONFLICT DO NOTHING;

-- P0455 - EVAP-System - Große Leckage erkannt (für alle Generationen)
INSERT INTO public.car_faults (
    model_generation_id, slug, title, description, solution,
    error_code, affected_component, severity, difficulty_level,
    estimated_repair_time, language_path, status
)
SELECT mg.id, 'p0455-evap-system-grosse-leckage-' || mg.slug,
    'P0455: EVAP-System - Große Leckage erkannt',
    'Der Fehlercode P0455 deutet auf eine große Leckage im EVAP-System hin. Dies kann zu erhöhten Emissionen und Kraftstoffgeruch führen.',
    '1. Tankdeckel prüfen und festziehen\n2. EVAP-Schläuche und -Ventile auf große Undichtigkeiten prüfen\n3. Aktivkohlefilter prüfen',
    'P0455', 'Abgasreinigung', 'medium', 'medium', '1-3 Stunden', 'de', 'live'
FROM public.model_generations mg
WHERE mg.slug IN ('e90-2005-2013', 'e39-1995-2003', 'w211-2002-2009', 'a6-c6-2004-2011', 'b6-2005-2010')
ON CONFLICT DO NOTHING;
