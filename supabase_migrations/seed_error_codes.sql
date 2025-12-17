-- =====================================================
-- Fahrzeugfehler.de - Seed-Daten für Fehlercodes
-- =====================================================
-- Diese Datei fügt häufige Fehlercodes für die
-- bereits erstellten Automodelle und Generationen ein
-- =====================================================

-- =====================================================
-- FEHLERCODES FÜR BMW 3ER E46 (1998-2006)
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
    'p0300-zufallige-zylinderfehlzuendung',
    'P0300: Zufällige Zylinderfehlzündung',
    'Der Fehlercode P0300 deutet auf zufällige Zylinderfehlzündungen hin. Dies kann zu Ruckeln, Leistungsverlust und erhöhtem Kraftstoffverbrauch führen.',
    '1. Zündkerzen prüfen und bei Bedarf wechseln (alle 4 Zylinder)\n2. Zündspulen auf Defekte prüfen\n3. Kraftstofffilter wechseln\n4. Luftfilter prüfen und reinigen\n5. Lambda-Sonde prüfen\n6. Fehlerspeicher löschen und Testfahrt durchführen',
    'P0300',
    'Zündsystem',
    'medium',
    'medium',
    '2-4 Stunden',
    'de',
    'live'
FROM public.model_generations mg
JOIN public.car_models cm ON mg.car_model_id = cm.id
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'bmw' AND cm.slug = '3er' AND mg.slug = 'e46-1998-2006'
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
    'p0171-kraftstoffgemisch-zu-mager',
    'P0171: Kraftstoffgemisch zu mager (Bank 1)',
    'Der Fehlercode P0171 zeigt an, dass das Kraftstoffgemisch zu mager ist. Dies führt zu Leistungsverlust, Ruckeln und erhöhtem Kraftstoffverbrauch.',
    '1. Luftfilter prüfen und wechseln\n2. Undichtigkeiten im Ansaugsystem suchen (Schläuche, Dichtungen)\n3. Kraftstoffdruck prüfen (Kraftstoffpumpe, Filter)\n4. Lambda-Sonde prüfen (Bank 1)\n5. Drosselklappe reinigen\n6. Luftmassenmesser prüfen',
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
WHERE cb.slug = 'bmw' AND cm.slug = '3er' AND mg.slug = 'e46-1998-2006'
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
    'p0420-katalysator-wirkungsgrad-zu-niedrig',
    'P0420: Katalysator-Wirkungsgrad zu niedrig',
    'Der Fehlercode P0420 deutet auf einen defekten oder verschlissenen Katalysator hin. Dies kann zu erhöhten Abgaswerten und Leistungsverlust führen.',
    '1. Lambda-Sonden prüfen (vor und nach Katalysator)\n2. Katalysator auf Beschädigungen prüfen\n3. Abgasanlage auf Undichtigkeiten prüfen\n4. Motor auf Ölverbrauch prüfen (kann Katalysator beschädigen)\n5. Bei Defekt: Katalysator wechseln',
    'P0420',
    'Abgasanlage',
    'high',
    'expert',
    '4-6 Stunden',
    'de',
    'live'
FROM public.model_generations mg
JOIN public.car_models cm ON mg.car_model_id = cm.id
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'bmw' AND cm.slug = '3er' AND mg.slug = 'e46-1998-2006'
ON CONFLICT DO NOTHING;

-- =====================================================
-- FEHLERCODES FÜR BMW 3ER E90 (2005-2013)
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
    'p0301-zylinder-1-fehlzuendung',
    'P0301: Zylinder 1 Fehlzündung',
    'Der Fehlercode P0301 zeigt eine Fehlzündung im Zylinder 1 an. Dies führt zu Ruckeln, Leistungsverlust und erhöhtem Kraftstoffverbrauch.',
    '1. Zündkerze Zylinder 1 prüfen und wechseln\n2. Zündspule Zylinder 1 prüfen\n3. Einspritzventil Zylinder 1 prüfen\n4. Kompression Zylinder 1 prüfen\n5. Kraftstoffqualität prüfen',
    'P0301',
    'Zündsystem',
    'medium',
    'medium',
    '1-2 Stunden',
    'de',
    'live'
FROM public.model_generations mg
JOIN public.car_models cm ON mg.car_model_id = cm.id
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'bmw' AND cm.slug = '3er' AND mg.slug = 'e90-2005-2013'
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
    'p0015-nockenwellenverstellung-bank-1',
    'P0015: Nockenwellenverstellung Bank 1 - Retard',
    'Der Fehlercode P0015 deutet auf ein Problem mit der Nockenwellenverstellung hin. Dies kann zu Leistungsverlust, erhöhtem Kraftstoffverbrauch und rauem Leerlauf führen.',
    '1. Motorölstand und -qualität prüfen (Ölwechsel bei Bedarf)\n2. Nockenwellenversteller prüfen\n3. Öldruck prüfen\n4. Steuerkette/Steuerriemen prüfen\n5. Ventilspiel prüfen\n6. Bei Defekt: Nockenwellenversteller wechseln',
    'P0015',
    'Motorsteuerung',
    'high',
    'expert',
    '5-8 Stunden',
    'de',
    'live'
FROM public.model_generations mg
JOIN public.car_models cm ON mg.car_model_id = cm.id
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'bmw' AND cm.slug = '3er' AND mg.slug = 'e90-2005-2013'
ON CONFLICT DO NOTHING;

-- =====================================================
-- FEHLERCODES FÜR MERCEDES-BENZ C-KLASSE W204 (2007-2014)
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
    'p0172-kraftstoffgemisch-zu-fett',
    'P0172: Kraftstoffgemisch zu fett (Bank 1)',
    'Der Fehlercode P0172 zeigt an, dass das Kraftstoffgemisch zu fett ist. Dies führt zu erhöhtem Kraftstoffverbrauch, schwarzem Rauch und Leistungsverlust.',
    '1. Luftfilter prüfen und wechseln\n2. Kraftstoffdruck prüfen (zu hoch?)\n3. Einspritzventile prüfen (undicht?)\n4. Lambda-Sonde prüfen (Bank 1)\n5. Luftmassenmesser prüfen\n6. Drosselklappe reinigen',
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
WHERE cb.slug = 'mercedes-benz' AND cm.slug = 'c-klasse' AND mg.slug = 'w204-2007-2014'
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
    'p0401-egr-ventil-durchfluss-zu-niedrig',
    'P0401: EGR-Ventil Durchfluss zu niedrig',
    'Der Fehlercode P0401 deutet auf ein Problem mit dem EGR-Ventil (Abgasrückführung) hin. Dies kann zu erhöhten NOx-Emissionen und Leistungsverlust führen.',
    '1. EGR-Ventil auf Verschmutzung prüfen\n2. EGR-Ventil reinigen\n3. EGR-Leitungen auf Verstopfung prüfen\n4. EGR-Ventil elektrisch prüfen\n5. Bei Defekt: EGR-Ventil wechseln',
    'P0401',
    'Abgasrückführung',
    'medium',
    'medium',
    '2-3 Stunden',
    'de',
    'live'
FROM public.model_generations mg
JOIN public.car_models cm ON mg.car_model_id = cm.id
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'mercedes-benz' AND cm.slug = 'c-klasse' AND mg.slug = 'w204-2007-2014'
ON CONFLICT DO NOTHING;

-- =====================================================
-- FEHLERCODES FÜR AUDI A4 B8 (2007-2015)
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
    'p0299-ladedruck-zu-niedrig',
    'P0299: Ladedruck zu niedrig',
    'Der Fehlercode P0299 zeigt an, dass der Ladedruck zu niedrig ist. Dies führt zu erheblichem Leistungsverlust, besonders bei Turbomotoren.',
    '1. Ladeluftschläuche auf Undichtigkeiten prüfen\n2. Turbolader auf Beschädigungen prüfen\n3. Ladeluftkühler prüfen\n4. Drosselklappe prüfen\n5. Bypass-Ventil prüfen\n6. Bei Defekt: Turbolader oder Komponenten wechseln',
    'P0299',
    'Turbolader',
    'high',
    'expert',
    '4-6 Stunden',
    'de',
    'live'
FROM public.model_generations mg
JOIN public.car_models cm ON mg.car_model_id = cm.id
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'audi' AND cm.slug = 'a4' AND mg.slug = 'b8-2007-2015'
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
    'p2187-kraftstoffgemisch-zu-mager-leerlauf',
    'P2187: Kraftstoffgemisch zu mager im Leerlauf',
    'Der Fehlercode P2187 zeigt an, dass das Kraftstoffgemisch im Leerlauf zu mager ist. Dies führt zu rauem Leerlauf, Ruckeln und möglichem Abwürgen.',
    '1. Luftfilter prüfen und wechseln\n2. Undichtigkeiten im Ansaugsystem suchen\n3. Kraftstoffdruck im Leerlauf prüfen\n4. Lambda-Sonde prüfen\n5. Luftmassenmesser prüfen\n6. Drosselklappe reinigen',
    'P2187',
    'Kraftstoffsystem',
    'medium',
    'hard',
    '3-4 Stunden',
    'de',
    'live'
FROM public.model_generations mg
JOIN public.car_models cm ON mg.car_model_id = cm.id
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'audi' AND cm.slug = 'a4' AND mg.slug = 'b8-2007-2015'
ON CONFLICT DO NOTHING;

-- =====================================================
-- FEHLERCODES FÜR VOLKSWAGEN GOLF VI (2008-2012)
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
    'p0135-lambda-sonde-heizung-bank-1-sensor-1',
    'P0135: Lambda-Sonde Heizung Bank 1 Sensor 1',
    'Der Fehlercode P0135 deutet auf ein Problem mit der Heizung der Lambda-Sonde hin. Dies kann zu erhöhten Abgaswerten und erhöhtem Kraftstoffverbrauch führen.',
    '1. Lambda-Sonde Heizung elektrisch prüfen\n2. Kabelbaum zur Lambda-Sonde prüfen\n3. Sicherung prüfen\n4. Bei Defekt: Lambda-Sonde wechseln',
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
WHERE cb.slug = 'volkswagen' AND cm.slug = 'golf' AND mg.slug = 'golf-6-2008-2012'
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
    'p0128-kuehlmitteltemperatur-zu-niedrig',
    'P0128: Kühlmitteltemperatur zu niedrig',
    'Der Fehlercode P0128 zeigt an, dass die Kühlmitteltemperatur zu niedrig ist. Dies kann zu erhöhtem Kraftstoffverbrauch und erhöhtem Verschleiß führen.',
    '1. Kühlmittelthermostat prüfen (klemmt offen?)\n2. Kühlmitteltemperatursensor prüfen\n3. Kühlmittelstand prüfen\n4. Bei Defekt: Thermostat wechseln',
    'P0128',
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
-- FEHLERCODES FÜR VOLKSWAGEN GOLF VII (2012-2019)
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
    'p2015-drosselklappen-stellungsfehler',
    'P2015: Drosselklappen-Stellungsfehler',
    'Der Fehlercode P2015 deutet auf ein Problem mit der Drosselklappenstellung hin. Dies führt zu Leistungsverlust, Ruckeln und möglichem Abwürgen.',
    '1. Drosselklappe reinigen\n2. Drosselklappensteller elektrisch prüfen\n3. Kabelbaum prüfen\n4. Drosselklappenadaption durchführen\n5. Bei Defekt: Drosselklappe wechseln',
    'P2015',
    'Drosselklappe',
    'high',
    'hard',
    '2-4 Stunden',
    'de',
    'live'
FROM public.model_generations mg
JOIN public.car_models cm ON mg.car_model_id = cm.id
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'volkswagen' AND cm.slug = 'golf' AND mg.slug = 'golf-7-2012-2019'
ON CONFLICT DO NOTHING;

-- =====================================================
-- FEHLERCODES FÜR OPEL ASTRA G (1998-2004)
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
    'p0302-zylinder-2-fehlzuendung',
    'P0302: Zylinder 2 Fehlzündung',
    'Der Fehlercode P0302 zeigt eine Fehlzündung im Zylinder 2 an. Dies führt zu Ruckeln, Leistungsverlust und erhöhtem Kraftstoffverbrauch.',
    '1. Zündkerze Zylinder 2 prüfen und wechseln\n2. Zündspule Zylinder 2 prüfen\n3. Einspritzventil Zylinder 2 prüfen\n4. Kompression Zylinder 2 prüfen\n5. Kraftstoffqualität prüfen',
    'P0302',
    'Zündsystem',
    'medium',
    'medium',
    '1-2 Stunden',
    'de',
    'live'
FROM public.model_generations mg
JOIN public.car_models cm ON mg.car_model_id = cm.id
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'opel' AND cm.slug = 'astra' AND mg.slug = 'astra-g-1998-2004'
ON CONFLICT DO NOTHING;

-- =====================================================
-- FEHLERCODES FÜR BMW 3ER F30 (2012-2019)
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
    'p0303-zylinder-3-fehlzuendung',
    'P0303: Zylinder 3 Fehlzündung',
    'Der Fehlercode P0303 zeigt eine Fehlzündung im Zylinder 3 an. Dies führt zu Ruckeln, Leistungsverlust und erhöhtem Kraftstoffverbrauch.',
    '1. Zündkerze Zylinder 3 prüfen und wechseln\n2. Zündspule Zylinder 3 prüfen\n3. Einspritzventil Zylinder 3 prüfen\n4. Kompression Zylinder 3 prüfen\n5. Kraftstoffqualität prüfen',
    'P0303',
    'Zündsystem',
    'medium',
    'medium',
    '1-2 Stunden',
    'de',
    'live'
FROM public.model_generations mg
JOIN public.car_models cm ON mg.car_model_id = cm.id
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'bmw' AND cm.slug = '3er' AND mg.slug = 'f30-2012-2019'
ON CONFLICT DO NOTHING;

-- =====================================================
-- FEHLERCODES FÜR MERCEDES-BENZ C-KLASSE W205 (2014-2021)
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
    'p0304-zylinder-4-fehlzuendung',
    'P0304: Zylinder 4 Fehlzündung',
    'Der Fehlercode P0304 zeigt eine Fehlzündung im Zylinder 4 an. Dies führt zu Ruckeln, Leistungsverlust und erhöhtem Kraftstoffverbrauch.',
    '1. Zündkerze Zylinder 4 prüfen und wechseln\n2. Zündspule Zylinder 4 prüfen\n3. Einspritzventil Zylinder 4 prüfen\n4. Kompression Zylinder 4 prüfen\n5. Kraftstoffqualität prüfen',
    'P0304',
    'Zündsystem',
    'medium',
    'medium',
    '1-2 Stunden',
    'de',
    'live'
FROM public.model_generations mg
JOIN public.car_models cm ON mg.car_model_id = cm.id
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'mercedes-benz' AND cm.slug = 'c-klasse' AND mg.slug = 'w205-2014-2021'
ON CONFLICT DO NOTHING;

-- =====================================================
-- FEHLERCODES FÜR AUDI A4 B9 (2015-)
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
    'p0441-kraftstoffdampf-rueckfuehrung-durchfluss',
    'P0441: Kraftstoffdampf-Rückführung Durchfluss',
    'Der Fehlercode P0441 deutet auf ein Problem mit dem EVAP-System (Kraftstoffdampf-Rückführung) hin. Dies kann zu erhöhten Emissionen führen.',
    '1. Tankdeckel prüfen (undicht?)\n2. EVAP-Ventil prüfen\n3. EVAP-Leitungen auf Undichtigkeiten prüfen\n4. Kohlefilter prüfen\n5. Bei Defekt: EVAP-Ventil wechseln',
    'P0441',
    'Abgasreinigung',
    'low',
    'medium',
    '2-3 Stunden',
    'de',
    'live'
FROM public.model_generations mg
JOIN public.car_models cm ON mg.car_model_id = cm.id
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'audi' AND cm.slug = 'a4' AND mg.slug = 'b9-2015'
ON CONFLICT DO NOTHING;

-- =====================================================
-- FEHLERCODES FÜR VOLKSWAGEN GOLF VII (2012-2019)
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
    'p0442-kraftstoffdampf-rueckfuehrung-kleine-undichtigkeit',
    'P0442: Kraftstoffdampf-Rückführung - kleine Undichtigkeit',
    'Der Fehlercode P0442 zeigt eine kleine Undichtigkeit im EVAP-System an. Dies kann zu erhöhten Emissionen führen.',
    '1. Tankdeckel prüfen und wechseln (häufigste Ursache)\n2. EVAP-Leitungen auf Risse prüfen\n3. EVAP-Ventil prüfen\n4. Kohlefilter prüfen\n5. Dichtungen prüfen',
    'P0442',
    'Abgasreinigung',
    'low',
    'easy',
    '1-2 Stunden',
    'de',
    'live'
FROM public.model_generations mg
JOIN public.car_models cm ON mg.car_model_id = cm.id
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'volkswagen' AND cm.slug = 'golf' AND mg.slug = 'golf-7-2012-2019'
ON CONFLICT DO NOTHING;

-- =====================================================
-- FERTIG!
-- =====================================================
-- Die Fehlercode-Seed-Daten wurden erfolgreich eingefügt.
-- Diese Fehlercodes sind jetzt mit den entsprechenden
-- Modellgenerationen verknüpft und auf der Website sichtbar.
-- 
-- Insgesamt wurden über 15 verschiedene Fehlercodes für
-- verschiedene Modelle und Generationen eingefügt.
-- =====================================================

