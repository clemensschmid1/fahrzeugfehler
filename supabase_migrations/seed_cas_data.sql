-- Seed data for CAS (Car Assistance System)
-- Two most popular brands: BMW and Mercedes-Benz
-- Two most popular models per brand

-- Insert Car Brands
INSERT INTO car_brands (id, name, slug, description, country, founded_year, is_featured, display_order) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'BMW', 'bmw', 'Bayerische Motoren Werke AG - Premium German automotive manufacturer known for luxury vehicles, performance cars, and motorcycles. Founded in 1916, BMW is renowned for its engineering excellence and innovative technology.', 'Germany', 1916, true, 1),
  ('550e8400-e29b-41d4-a716-446655440002', 'Mercedes-Benz', 'mercedes-benz', 'Mercedes-Benz is a German luxury automotive brand known for premium vehicles, advanced safety features, and cutting-edge technology. Part of Daimler AG, Mercedes-Benz has been producing automobiles since 1926.', 'Germany', 1926, true, 2)
ON CONFLICT (slug) DO NOTHING;

-- Insert Car Models for BMW
INSERT INTO car_models (id, brand_id, name, slug, year_start, year_end, description, is_featured, display_order) VALUES
  ('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', '3 Series', '3-series', 1975, NULL, 'The BMW 3 Series is a compact executive car that has been in production since 1975. It is BMW''s best-selling model and is known for its sporty handling, premium interior, and advanced technology. Available in sedan, wagon, and Gran Turismo body styles.', true, 1),
  ('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', '5 Series', '5-series', 1972, NULL, 'The BMW 5 Series is a mid-size luxury executive car that combines performance, comfort, and technology. First introduced in 1972, it has become one of the most successful luxury sedans in the world, offering exceptional driving dynamics and premium features.', true, 2)
ON CONFLICT (brand_id, slug) DO NOTHING;

-- Insert Car Models for Mercedes-Benz
INSERT INTO car_models (id, brand_id, name, slug, year_start, year_end, description, is_featured, display_order) VALUES
  ('660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440002', 'C-Class', 'c-class', 1993, NULL, 'The Mercedes-Benz C-Class is a compact executive car that has been in production since 1993. It combines luxury, performance, and advanced safety features. Available in sedan, wagon, coupe, and convertible body styles, the C-Class is one of Mercedes-Benz''s most popular models.', true, 1),
  ('660e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440002', 'E-Class', 'e-class', 1993, NULL, 'The Mercedes-Benz E-Class is a mid-size luxury car that has been in production since 1993. Known for its sophisticated design, advanced technology, and exceptional comfort, the E-Class represents the perfect balance between luxury and performance in the Mercedes-Benz lineup.', true, 2)
ON CONFLICT (brand_id, slug) DO NOTHING;

-- Insert Car Faults for BMW 3 Series (English)
INSERT INTO car_faults (id, car_model_id, slug, title, description, solution, language_path, status, error_code, affected_component, severity, symptoms, diagnostic_steps, tools_required, estimated_repair_time, difficulty_level) VALUES
  ('770e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', 'engine-coolant-leak', 'Engine Coolant Leak', 
   'A common issue in BMW 3 Series vehicles where coolant leaks from various points in the cooling system. This can lead to engine overheating, potential engine damage, and warning lights on the dashboard.',
   '## Solution Steps:\n\n1. **Locate the Leak Source**\n   - Check the radiator for cracks or damage\n   - Inspect all coolant hoses for wear, cracks, or loose connections\n   - Examine the water pump for signs of leakage\n   - Check the expansion tank for cracks\n   - Inspect the thermostat housing for leaks\n\n2. **Common Leak Points**\n   - Radiator hoses (upper and lower)\n   - Water pump seal\n   - Expansion tank\n   - Thermostat housing gasket\n   - Heater core connections\n\n3. **Repair Procedure**\n   - Drain the cooling system completely\n   - Replace damaged components (hoses, water pump, expansion tank)\n   - Use OEM or high-quality replacement parts\n   - Refill with BMW-approved coolant (50/50 mix with distilled water)\n   - Bleed the cooling system to remove air pockets\n   - Test for leaks and proper operation\n\n4. **Prevention**\n   - Regular coolant system inspections\n   - Replace coolant every 2-3 years or 30,000 miles\n   - Use only BMW-approved coolant types',
   'en', 'live', NULL, 'Cooling System', 'high',
   ARRAY['Coolant warning light on dashboard', 'Low coolant level', 'Engine overheating', 'Sweet smell from engine bay', 'White smoke from exhaust', 'Coolant puddles under the vehicle'],
   ARRAY['Check coolant level in expansion tank', 'Inspect for visible leaks with engine running', 'Use UV dye to locate small leaks', 'Pressure test the cooling system', 'Check for oil contamination in coolant'],
   ARRAY['Coolant pressure tester', 'UV leak detection kit', 'Basic hand tools', 'Coolant drain pan', 'Torque wrench'],
   '2-4 hours', 'medium'),
  
  ('770e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440001', 'transmission-shifting-issues', 'Transmission Shifting Problems',
   'BMW 3 Series vehicles may experience rough shifting, delayed engagement, or transmission slipping. This is often related to the automatic transmission fluid, valve body, or transmission control module.',
   '## Solution Steps:\n\n1. **Diagnostic Checks**\n   - Check transmission fluid level and condition\n   - Scan for transmission fault codes\n   - Test drive to identify specific symptoms\n   - Check transmission temperature\n\n2. **Common Causes**\n   - Low or contaminated transmission fluid\n   - Faulty transmission control module (TCM)\n   - Worn valve body\n   - Clutch pack wear\n   - Solenoid valve failure\n\n3. **Repair Options**\n   - **Fluid Service**: Drain and refill transmission fluid, replace filter\n   - **TCM Reset**: Reset transmission adaptations using diagnostic tool\n   - **Valve Body Service**: Clean or replace valve body\n   - **Solenoid Replacement**: Replace faulty shift solenoids\n   - **Transmission Rebuild**: Required for severe internal damage\n\n4. **Prevention**\n   - Regular transmission fluid changes (every 60,000-100,000 miles)\n   - Avoid aggressive driving\n   - Allow transmission to warm up before hard acceleration',
   'en', 'live', NULL, 'Transmission', 'high',
   ARRAY['Rough or jerky shifting', 'Delayed engagement when shifting', 'Transmission slipping', 'Check engine light', 'Transmission warning message', 'Vehicle stuck in one gear'],
   ARRAY['Check transmission fluid level and color', 'Scan for transmission fault codes', 'Test drive to reproduce symptoms', 'Check transmission fluid temperature', 'Inspect for fluid leaks'],
   ARRAY['OBD-II scanner', 'Transmission fluid dipstick', 'Fluid pump', 'Basic hand tools', 'BMW diagnostic software'],
   '3-6 hours', 'hard'),
  
  ('770e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440001', 'electrical-battery-drain', 'Electrical System Battery Drain',
   'BMW 3 Series vehicles may experience battery drain issues, causing the battery to discharge overnight or when the vehicle is not in use. This is often caused by faulty modules, aftermarket accessories, or parasitic draws.',
   '## Solution Steps:\n\n1. **Identify the Draw**\n   - Use a multimeter to measure parasitic current draw\n   - Current draw should be less than 50mA after 20 minutes\n   - Check all modules and systems\n\n2. **Common Causes**\n   - Faulty comfort access module\n   - Aftermarket alarm or accessories\n   - Faulty alternator\n   - Battery control module issues\n   - Radio or navigation system staying on\n   - Door lock actuators\n\n3. **Diagnostic Procedure**\n   - Disconnect battery negative terminal\n   - Connect multimeter in series\n   - Pull fuses one by one to identify circuit\n   - Check each module individually\n\n4. **Repair**\n   - Replace faulty modules\n   - Remove or fix aftermarket accessories\n   - Update module software\n   - Replace battery if capacity is low\n\n5. **Prevention**\n   - Use only BMW-approved accessories\n   - Regular battery testing\n   - Keep software updated',
   'en', 'live', NULL, 'Electrical System', 'medium',
   ARRAY['Battery dies overnight', 'Battery warning light', 'Vehicle won''t start after sitting', 'Dim interior lights', 'Clock resets'],
   ARRAY['Measure parasitic current draw with multimeter', 'Check battery voltage and capacity', 'Pull fuses to isolate circuit', 'Test each module individually', 'Check for aftermarket accessories'],
   ARRAY['Digital multimeter', 'Battery tester', 'Fuse puller', 'BMW diagnostic software'],
   '2-4 hours', 'medium')
ON CONFLICT (car_model_id, slug, language_path) DO NOTHING;

-- Insert Car Faults for BMW 3 Series (German)
INSERT INTO car_faults (id, car_model_id, slug, title, description, solution, language_path, status, error_code, affected_component, severity, symptoms, diagnostic_steps, tools_required, estimated_repair_time, difficulty_level) VALUES
  ('770e8400-e29b-41d4-a716-446655440004', '660e8400-e29b-41d4-a716-446655440001', 'engine-coolant-leak', 'Kühlmittelverlust',
   'Ein häufiges Problem bei BMW 3er Modellen, bei dem Kühlmittel an verschiedenen Stellen des Kühlsystems austritt. Dies kann zu Motortüberhitzung, möglichen Motorschäden und Warnleuchten im Armaturenbrett führen.',
   '## Lösungsschritte:\n\n1. **Leckquelle lokalisieren**\n   - Kühler auf Risse oder Beschädigungen prüfen\n   - Alle Kühlmittelschläuche auf Verschleiß, Risse oder lockere Verbindungen untersuchen\n   - Wasserpumpe auf Leckanzeichen prüfen\n   - Ausgleichsbehälter auf Risse prüfen\n   - Thermostatgehäuse auf Undichtigkeiten prüfen\n\n2. **Häufige Leckstellen**\n   - Kühlerschläuche (oberer und unterer)\n   - Wasserpumpendichtung\n   - Ausgleichsbehälter\n   - Thermostatgehäusedichtung\n   - Heizungskernanschlüsse\n\n3. **Reparaturvorgehen**\n   - Kühlsystem vollständig entleeren\n   - Beschädigte Komponenten ersetzen (Schläuche, Wasserpumpe, Ausgleichsbehälter)\n   - OEM oder hochwertige Ersatzteile verwenden\n   - Mit BMW-zugelassenem Kühlmittel auffüllen (50/50 Mischung mit destilliertem Wasser)\n   - Kühlsystem entlüften, um Luftblasen zu entfernen\n   - Auf Undichtigkeiten und ordnungsgemäßen Betrieb prüfen',
   'de', 'live', NULL, 'Kühlsystem', 'high',
   ARRAY['Kühlmittel-Warnleuchte im Armaturenbrett', 'Niedriger Kühlmittelstand', 'Motortüberhitzung', 'Süßlicher Geruch aus dem Motorraum', 'Weißer Rauch aus dem Auspuff', 'Kühlmittelpfützen unter dem Fahrzeug'],
   ARRAY['Kühlmittelstand im Ausgleichsbehälter prüfen', 'Bei laufendem Motor auf sichtbare Lecks prüfen', 'UV-Farbstoff zur Lokalisierung kleiner Lecks verwenden', 'Kühlsystem druckprüfen', 'Auf Ölverunreinigung im Kühlmittel prüfen'],
   ARRAY['Kühlmitteldruckprüfgerät', 'UV-Lecksuchkit', 'Grundwerkzeuge', 'Kühlmittelablaufwanne', 'Drehmomentschlüssel'],
   '2-4 Stunden', 'medium')
ON CONFLICT (car_model_id, slug, language_path) DO NOTHING;

-- Insert Car Manuals for BMW 3 Series (English)
INSERT INTO car_manuals (id, car_model_id, title, slug, content, language_path, status, manual_type, difficulty_level, estimated_time, tools_required, parts_required) VALUES
  ('880e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', 'Oil Change Procedure', 'oil-change-procedure',
   '# BMW 3 Series Oil Change Guide\n\n## Overview\nRegular oil changes are essential for maintaining engine performance and longevity. BMW recommends changing the oil every 10,000-15,000 miles or once per year.\n\n## Required Materials\n- BMW-approved engine oil (check owner''s manual for specific grade)\n- Genuine BMW oil filter\n- New drain plug washer\n- Oil drain pan\n- Funnel\n- Torque wrench\n\n## Step-by-Step Procedure\n\n### 1. Preparation\n- Park vehicle on level surface\n- Allow engine to cool (warm oil drains better, but avoid hot engine)\n- Engage parking brake\n- Gather all tools and materials\n\n### 2. Drain Old Oil\n- Locate oil drain plug under engine\n- Place drain pan beneath drain plug\n- Remove drain plug using appropriate socket\n- Allow oil to drain completely (10-15 minutes)\n- Clean drain plug and inspect threads\n- Install new washer on drain plug\n\n### 3. Replace Oil Filter\n- Locate oil filter housing\n- Remove old filter using filter wrench if needed\n- Clean filter housing surface\n- Apply thin film of new oil to new filter gasket\n- Install new filter hand-tight (do not over-tighten)\n\n### 4. Refill Engine Oil\n- Reinstall drain plug and torque to specification (25-30 Nm)\n- Add new oil through oil fill cap\n- Check oil level using dipstick\n- Add oil gradually until level is correct\n- Do not overfill\n\n### 5. Final Checks\n- Start engine and let run for 30 seconds\n- Check for leaks around drain plug and filter\n- Turn off engine and wait 2 minutes\n- Check oil level again and adjust if needed\n- Reset oil service indicator using diagnostic tool\n\n## Important Notes\n- Always use BMW-approved oil specifications\n- Dispose of old oil properly at recycling center\n- Keep records of oil changes for warranty purposes',
   'en', 'live', 'maintenance', 'easy', '30-45 minutes',
   ARRAY['Socket set', 'Oil filter wrench', 'Torque wrench', 'Oil drain pan', 'Funnel'],
   ARRAY['Engine oil (5-7 liters)', 'Oil filter', 'Drain plug washer']),
  
  ('880e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440001', 'Brake Pad Replacement', 'brake-pad-replacement',
   '# BMW 3 Series Brake Pad Replacement\n\n## Overview\nBrake pads should be replaced when they reach minimum thickness (typically 3mm). BMW 3 Series uses high-performance brake systems that require proper procedure.\n\n## Safety Warning\nBrake work is critical for safety. If unsure, consult a professional mechanic.\n\n## Required Materials\n- Genuine BMW brake pads (front and/or rear)\n- Brake pad wear sensors (if equipped)\n- Brake cleaner\n- High-temperature brake grease\n- Torque wrench\n- Brake caliper tool\n\n## Step-by-Step Procedure\n\n### 1. Preparation\n- Park on level surface, engage parking brake\n- Loosen lug nuts (do not remove yet)\n- Jack up vehicle and support with jack stands\n- Remove wheel\n\n### 2. Remove Old Brake Pads\n- Remove brake caliper bolts (usually 2 bolts)\n- Lift caliper away from rotor (do not let it hang by brake hose)\n- Remove old brake pads\n- Inspect brake rotor for wear and damage\n- Check brake fluid level\n\n### 3. Prepare Caliper\n- Clean caliper and mounting bracket\n- Inspect caliper piston and seals\n- Compress caliper piston using brake tool\n- Apply brake grease to caliper contact points\n\n### 4. Install New Brake Pads\n- Install new brake pads in caliper bracket\n- Install new wear sensor (if equipped)\n- Position caliper over new pads\n- Install and torque caliper bolts to specification (80-120 Nm)\n\n### 5. Final Steps\n- Reinstall wheel and torque lug nuts to specification\n- Lower vehicle\n- Pump brake pedal several times to seat pads\n- Test brake operation before driving\n- Reset brake pad service indicator if needed\n\n## Important Notes\n- Always replace pads in axle pairs (both front or both rear)\n- Check rotor condition - may need resurfacing or replacement\n- Use only BMW-approved brake pads for optimal performance',
   'en', 'live', 'repair', 'medium', '1-2 hours per axle',
   ARRAY['Jack and jack stands', 'Socket set', 'Torque wrench', 'Brake caliper tool', 'C-clamp or piston compressor'],
   ARRAY['Brake pads (front or rear set)', 'Brake pad wear sensors', 'Brake grease'])
ON CONFLICT (car_model_id, slug, language_path) DO NOTHING;

-- Insert Car Faults for Mercedes C-Class (English)
INSERT INTO car_faults (id, car_model_id, slug, title, description, solution, language_path, status, error_code, affected_component, severity, symptoms, diagnostic_steps, tools_required, estimated_repair_time, difficulty_level) VALUES
  ('770e8400-e29b-41d4-a716-446655440005', '660e8400-e29b-41d4-a716-446655440003', 'air-suspension-failure', 'Air Suspension System Failure',
   'Mercedes C-Class vehicles equipped with AIRMATIC suspension may experience air suspension failures, causing the vehicle to sit low, display warning messages, or have a harsh ride quality.',
   '## Solution Steps:\n\n1. **Diagnostic Checks**\n   - Check for air suspension warning messages\n   - Inspect vehicle ride height (should be level)\n   - Listen for air compressor running continuously\n   - Check for air leaks with soapy water\n\n2. **Common Causes**\n   - Air strut failure (most common)\n   - Air compressor failure\n   - Air line leaks\n   - Height sensor malfunction\n   - Control valve failure\n   - Moisture in air system\n\n3. **Repair Procedure**\n   - **Air Strut Replacement**: Most common fix, requires removing old strut and installing new one\n   - **Compressor Replacement**: If compressor fails to build pressure\n   - **Leak Repair**: Locate and repair air line leaks\n   - **System Recalibration**: After repairs, system must be calibrated using STAR diagnostic tool\n\n4. **Prevention**\n   - Regular system inspections\n   - Keep air system dry (replace desiccant if equipped)\n   - Address leaks immediately to prevent compressor damage\n\n## Cost Considerations\nAir suspension repairs can be expensive. Consider:\n- Replacing in pairs (both front or both rear)\n- Using quality aftermarket parts if available\n- Converting to conventional suspension (if legal and desired)',
   'en', 'live', NULL, 'Suspension System', 'high',
   ARRAY['Vehicle sits low on one or more corners', 'AIRMATIC warning message', 'Harsh ride quality', 'Air compressor running continuously', 'Vehicle leaning to one side'],
   ARRAY['Check ride height at all four corners', 'Listen for air compressor operation', 'Inspect air struts for visible damage', 'Check for air leaks with soapy water', 'Scan for suspension fault codes'],
   ARRAY['STAR diagnostic tool', 'Air pressure gauge', 'Soapy water solution', 'Basic hand tools', 'Jack and jack stands'],
   '3-6 hours', 'hard'),
  
  ('770e8400-e29b-41d4-a716-446655440006', '660e8400-e29b-41d4-a716-446655440003', 'turbocharger-wastegate-issue', 'Turbocharger Wastegate Problems',
   'Mercedes C-Class turbocharged engines may experience wastegate issues, causing boost pressure problems, reduced power, or turbocharger failure.',
   '## Solution Steps:\n\n1. **Symptoms Identification**\n   - Reduced engine power\n   - Check engine light\n   - Boost pressure codes\n   - Whistling or whooshing sounds\n   - Excessive exhaust smoke\n\n2. **Common Causes**\n   - Sticky wastegate actuator\n   - Wastegate valve carbon buildup\n   - Actuator diaphragm failure\n   - Boost pressure sensor failure\n   - Turbocharger bearing wear\n\n3. **Diagnostic Procedure**\n   - Scan for turbo-related fault codes\n   - Check boost pressure with scan tool\n   - Inspect wastegate actuator movement\n   - Check for exhaust leaks\n   - Test turbocharger shaft play\n\n4. **Repair Options**\n   - **Actuator Replacement**: Replace wastegate actuator\n   - **Turbo Clean**: Clean carbon buildup from wastegate\n   - **Turbo Rebuild**: Rebuild turbocharger if bearings worn\n   - **Turbo Replacement**: Replace entire turbocharger if severely damaged\n\n5. **Prevention**\n   - Use quality engine oil\n   - Allow turbo to cool after hard driving\n   - Regular oil changes\n   - Use premium fuel',
   'en', 'live', 'P0299', 'Turbocharger', 'high',
   ARRAY['Reduced engine power', 'Check engine light', 'Whistling noise from turbo', 'Excessive exhaust smoke', 'Poor acceleration'],
   ARRAY['Scan for turbo fault codes', 'Check boost pressure readings', 'Inspect wastegate actuator', 'Test turbocharger shaft play', 'Check for exhaust leaks'],
   ARRAY['OBD-II scanner', 'Boost pressure gauge', 'STAR diagnostic tool', 'Basic hand tools'],
   '4-8 hours', 'expert')
ON CONFLICT (car_model_id, slug, language_path) DO NOTHING;

-- Insert Car Manuals for Mercedes C-Class (English)
INSERT INTO car_manuals (id, car_model_id, title, slug, content, language_path, status, manual_type, difficulty_level, estimated_time, tools_required, parts_required) VALUES
  ('880e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440003', 'Battery Replacement Guide', 'battery-replacement-guide',
   '# Mercedes C-Class Battery Replacement\n\n## Overview\nModern Mercedes C-Class vehicles require proper battery replacement procedure to prevent electrical system issues and ensure proper battery registration.\n\n## Important Notes\n- Mercedes vehicles require battery registration after replacement\n- Use only AGM (Absorbent Glass Mat) batteries for vehicles with start-stop system\n- Battery replacement may require STAR diagnostic tool\n\n## Required Materials\n- Correct battery type (check vehicle specifications)\n- Battery terminal cleaning tool\n- Battery hold-down clamp\n- STAR diagnostic tool (for registration)\n\n## Step-by-Step Procedure\n\n### 1. Preparation\n- Park vehicle in safe location\n- Turn off all electrical accessories\n- Locate battery (usually in engine bay or trunk)\n- Note battery specifications (Ah, CCA rating)\n\n### 2. Remove Old Battery\n- Disconnect negative terminal first (prevents short circuits)\n- Disconnect positive terminal\n- Remove battery hold-down clamp\n- Carefully lift out old battery\n- Clean battery tray\n\n### 3. Install New Battery\n- Place new battery in tray\n- Ensure correct orientation (positive/negative)\n- Install hold-down clamp and secure\n- Connect positive terminal first\n- Connect negative terminal last\n- Tighten terminals securely\n\n### 4. Battery Registration\n- Connect STAR diagnostic tool\n- Navigate to battery replacement procedure\n- Enter new battery specifications\n- Register battery in vehicle control modules\n- Clear any fault codes\n\n### 5. Final Checks\n- Test all electrical systems\n- Verify charging system operation\n- Check for warning messages\n- Test start-stop system (if equipped)\n\n## Important Warnings\n- Always disconnect negative terminal first\n- Do not allow battery terminals to touch\n- Ensure battery is correct type and capacity\n- Battery registration is critical for proper operation',
   'en', 'live', 'repair', 'medium', '30-60 minutes',
   ARRAY['Basic hand tools', 'Battery terminal cleaner', 'STAR diagnostic tool', 'Battery tester'],
   ARRAY['AGM battery (correct specifications)', 'Battery terminal protectors'])
ON CONFLICT (car_model_id, slug, language_path) DO NOTHING;

-- Insert Car Faults for BMW 5 Series (English)
INSERT INTO car_faults (id, car_model_id, slug, title, description, solution, language_path, status, error_code, affected_component, severity, symptoms, diagnostic_steps, tools_required, estimated_repair_time, difficulty_level) VALUES
  ('770e8400-e29b-41d4-a716-446655440007', '660e8400-e29b-41d4-a716-446655440002', 'valvetronic-motor-failure', 'Valvetronic Motor Failure',
   'BMW 5 Series vehicles with Valvetronic engines may experience Valvetronic motor failures, causing rough idle, reduced power, check engine light, and poor fuel economy.',
   '## Solution Steps:\n\n1. **Diagnostic Checks**\n   - Scan for Valvetronic-related fault codes (typically P0015, P0016)\n   - Check Valvetronic motor operation with diagnostic tool\n   - Inspect Valvetronic motor for physical damage\n   - Test motor resistance and operation\n\n2. **Common Causes**\n   - Valvetronic motor wear or failure\n   - Valvetronic eccentric shaft wear\n   - Motor position sensor failure\n   - Wiring harness issues\n   - Dirt or carbon buildup in Valvetronic system\n\n3. **Repair Procedure**\n   - **Motor Replacement**: Replace Valvetronic motor if faulty\n   - **Eccentric Shaft Service**: May require eccentric shaft replacement if worn\n   - **System Cleaning**: Clean Valvetronic components if carbon buildup present\n   - **Adaptation Reset**: Reset Valvetronic adaptations after repair\n\n4. **Prevention**\n   - Regular engine oil changes with BMW-approved oil\n   - Use quality fuel\n   - Address oil leaks promptly\n   - Regular engine maintenance',
   'en', 'live', 'P0015', 'Engine', 'high',
   ARRAY['Rough idle', 'Reduced engine power', 'Check engine light', 'Poor fuel economy', 'Engine misfires', 'Valvetronic error message'],
   ARRAY['Scan for Valvetronic fault codes', 'Test Valvetronic motor operation', 'Check motor resistance', 'Inspect eccentric shaft', 'Check wiring harness'],
   ARRAY['BMW diagnostic software', 'Multimeter', 'Oscilloscope', 'Basic hand tools'],
   '3-5 hours', 'hard'),
  
  ('770e8400-e29b-41d4-a716-446655440008', '660e8400-e29b-41d4-a716-446655440002', 'idrive-system-issues', 'iDrive System Malfunction',
   'BMW 5 Series vehicles may experience iDrive system issues including screen freezing, unresponsive controls, navigation failures, or system crashes.',
   '## Solution Steps:\n\n1. **Initial Troubleshooting**\n   - Perform iDrive system reset (hold volume button for 30 seconds)\n   - Check for software updates\n   - Disconnect battery for 15 minutes to reset system\n   - Check all iDrive connections\n\n2. **Common Causes**\n   - Software glitches or bugs\n   - Faulty iDrive controller\n   - Screen display failure\n   - Hard drive failure (older models)\n   - Wiring harness issues\n   - Control unit failure\n\n3. **Repair Options**\n   - **Software Update**: Update iDrive software to latest version\n   - **Controller Replacement**: Replace iDrive controller if unresponsive\n   - **Screen Replacement**: Replace display if screen is faulty\n   - **Control Unit Replacement**: Replace iDrive control unit if severely damaged\n   - **Hard Drive Replacement**: Replace hard drive in older models\n\n4. **Prevention**\n   - Keep iDrive software updated\n   - Avoid installing unauthorized software\n   - Regular system maintenance',
   'en', 'live', NULL, 'Infotainment System', 'medium',
   ARRAY['iDrive screen freezing', 'Unresponsive iDrive controller', 'Navigation not working', 'System crashes or reboots', 'No audio output', 'Display shows errors'],
   ARRAY['Test iDrive controller response', 'Check for software updates', 'Inspect wiring connections', 'Test screen display', 'Check control unit for faults'],
   ARRAY['BMW diagnostic software', 'iDrive update tool', 'Basic hand tools', 'Multimeter'],
   '1-3 hours', 'medium')
ON CONFLICT (car_model_id, slug, language_path) DO NOTHING;

-- Insert Car Manuals for BMW 5 Series (English)
INSERT INTO car_manuals (id, car_model_id, title, slug, content, language_path, status, manual_type, difficulty_level, estimated_time, tools_required, parts_required) VALUES
  ('880e8400-e29b-41d4-a716-446655440004', '660e8400-e29b-41d4-a716-446655440002', 'Air Filter Replacement', 'air-filter-replacement',
   '# BMW 5 Series Air Filter Replacement\n\n## Overview\nReplacing the engine air filter is a simple maintenance task that should be performed every 15,000-30,000 miles or as recommended in your owner''s manual.\n\n## Required Materials\n- Genuine BMW air filter\n- Basic hand tools\n\n## Step-by-Step Procedure\n\n### 1. Locate Air Filter Housing\n- Open the hood\n- Locate the air filter housing (usually a large black plastic box)\n- The housing is typically located near the front of the engine bay\n\n### 2. Remove Old Filter\n- Unclip or unscrew the air filter housing cover\n- Carefully remove the old air filter\n- Inspect the housing for debris and clean if necessary\n\n### 3. Install New Filter\n- Place new air filter in housing\n- Ensure filter is properly seated\n- Replace housing cover and secure clips or screws\n\n### 4. Final Check\n- Verify filter is properly installed\n- Check that housing is securely closed\n- Close the hood\n\n## Important Notes\n- Always use genuine BMW air filters for optimal performance\n- Check filter condition during regular maintenance\n- Replace more frequently if driving in dusty conditions',
   'en', 'live', 'maintenance', 'easy', '15-20 minutes',
   ARRAY['Basic hand tools'],
   ARRAY['Engine air filter']),
  
  ('880e8400-e29b-41d4-a716-446655440005', '660e8400-e29b-41d4-a716-446655440002', 'Cabin Air Filter Replacement', 'cabin-air-filter-replacement',
   '# BMW 5 Series Cabin Air Filter Replacement\n\n## Overview\nThe cabin air filter improves air quality inside your vehicle by filtering dust, pollen, and other particles. Replace every 15,000-20,000 miles or annually.\n\n## Required Materials\n- Genuine BMW cabin air filter\n- Basic hand tools\n\n## Step-by-Step Procedure\n\n### 1. Locate Filter Housing\n- Open the glove compartment\n- Remove contents from glove box\n- Look for filter housing access panel\n\n### 2. Remove Old Filter\n- Remove housing cover (usually clips or screws)\n- Slide out old filter\n- Note filter orientation for installation\n\n### 3. Install New Filter\n- Insert new filter in correct orientation\n- Ensure filter is fully seated\n- Replace housing cover\n- Reinstall glove box contents\n\n## Important Notes\n- Replace more frequently if you have allergies\n- Check filter during seasonal changes\n- Use only genuine BMW filters',
   'en', 'live', 'maintenance', 'easy', '20-30 minutes',
   ARRAY['Basic hand tools'],
   ARRAY['Cabin air filter'])
ON CONFLICT (car_model_id, slug, language_path) DO NOTHING;

-- Insert Car Faults for Mercedes E-Class (English)
INSERT INTO car_faults (id, car_model_id, slug, title, description, solution, language_path, status, error_code, affected_component, severity, symptoms, diagnostic_steps, tools_required, estimated_repair_time, difficulty_level) VALUES
  ('770e8400-e29b-41d4-a716-446655440009', '660e8400-e29b-41d4-a716-446655440004', 'sbc-brake-system-failure', 'SBC Brake System Failure',
   'Mercedes E-Class vehicles with Sensotronic Brake Control (SBC) may experience SBC pump failures, causing brake warning lights, reduced brake assistance, or complete brake system failure.',
   '## Solution Steps:\n\n1. **Diagnostic Checks**\n   - Scan for SBC-related fault codes\n   - Check SBC pump operation\n   - Test brake pressure\n   - Inspect SBC hydraulic unit\n\n2. **Common Causes**\n   - SBC pump motor failure\n   - Hydraulic unit failure\n   - Pressure sensor failure\n   - Wiring harness issues\n   - SBC control unit failure\n\n3. **Repair Procedure**\n   - **SBC Pump Replacement**: Replace SBC pump if motor fails\n   - **Hydraulic Unit Service**: Service or replace hydraulic unit\n   - **System Bleeding**: Bleed brake system after repairs\n   - **Adaptation**: Perform SBC adaptation using STAR diagnostic tool\n\n4. **Important Notes**\n   - SBC repairs require specialized knowledge\n   - Always use STAR diagnostic tool for proper adaptation\n   - System must be properly bled after repairs\n   - Consider professional service for SBC issues',
   'en', 'live', NULL, 'Brake System', 'critical',
   ARRAY['SBC warning light', 'Reduced brake assistance', 'Brake pedal feels hard', 'Brake system failure warning', 'ABS warning light'],
   ARRAY['Scan for SBC fault codes', 'Test SBC pump operation', 'Check brake pressure', 'Inspect hydraulic unit', 'Test brake system'],
   ARRAY['STAR diagnostic tool', 'Brake pressure tester', 'Brake bleeding equipment', 'Basic hand tools'],
   '4-8 hours', 'expert'),
  
  ('770e8400-e29b-41d4-a716-446655440010', '660e8400-e29b-41d4-a716-446655440004', 'comand-system-problems', 'COMAND System Issues',
   'Mercedes E-Class vehicles may experience COMAND infotainment system problems including screen issues, navigation failures, Bluetooth connectivity problems, or system freezes.',
   '## Solution Steps:\n\n1. **Initial Troubleshooting**\n   - Perform COMAND system reset\n   - Check for software updates\n   - Disconnect battery to reset system\n   - Check all connections\n\n2. **Common Causes**\n   - Software glitches\n   - Faulty COMAND unit\n   - Screen display failure\n   - GPS antenna issues\n   - Wiring harness problems\n   - Hard drive failure (older models)\n\n3. **Repair Options**\n   - **Software Update**: Update COMAND software\n   - **Unit Replacement**: Replace COMAND unit if faulty\n   - **Screen Replacement**: Replace display screen\n   - **Antenna Repair**: Fix or replace GPS antenna\n   - **Hard Drive Replacement**: Replace hard drive in older models\n\n4. **Prevention**\n   - Keep COMAND software updated\n   - Avoid unauthorized modifications\n   - Regular system maintenance',
   'en', 'live', NULL, 'Infotainment System', 'medium',
   ARRAY['COMAND screen not working', 'Navigation not functioning', 'Bluetooth connection issues', 'System freezes or crashes', 'No audio output'],
   ARRAY['Test COMAND unit operation', 'Check for software updates', 'Inspect wiring connections', 'Test GPS antenna', 'Check control unit'],
   ARRAY['STAR diagnostic tool', 'COMAND update tool', 'Basic hand tools', 'Multimeter'],
   '2-4 hours', 'medium')
ON CONFLICT (car_model_id, slug, language_path) DO NOTHING;

-- Insert Car Manuals for Mercedes E-Class (English)
INSERT INTO car_manuals (id, car_model_id, title, slug, content, language_path, status, manual_type, difficulty_level, estimated_time, tools_required, parts_required) VALUES
  ('880e8400-e29b-41d4-a716-446655440006', '660e8400-e29b-41d4-a716-446655440004', 'Spark Plug Replacement', 'spark-plug-replacement',
   '# Mercedes E-Class Spark Plug Replacement\n\n## Overview\nSpark plugs should be replaced according to your vehicle''s maintenance schedule, typically every 60,000-100,000 miles depending on engine type.\n\n## Required Materials\n- Genuine Mercedes spark plugs (check specifications)\n- Spark plug socket\n- Torque wrench\n- Dielectric grease\n\n## Step-by-Step Procedure\n\n### 1. Preparation\n- Allow engine to cool completely\n- Remove engine cover if present\n- Locate spark plugs (usually under ignition coils)\n\n### 2. Remove Old Spark Plugs\n- Remove ignition coil or spark plug wire\n- Use spark plug socket to remove old plug\n- Inspect old plug for wear patterns\n- Check gap on new plugs before installation\n\n### 3. Install New Spark Plugs\n- Apply small amount of dielectric grease to plug boot\n- Thread new plug by hand to avoid cross-threading\n- Torque to specification (typically 20-25 Nm)\n- Reinstall ignition coil or wire\n\n### 4. Final Steps\n- Repeat for all cylinders\n- Reinstall engine cover\n- Start engine and check for smooth operation\n\n## Important Notes\n- Always use correct spark plug type for your engine\n- Replace all plugs at once\n- Check gap specifications in owner''s manual',
   'en', 'live', 'maintenance', 'medium', '1-2 hours',
   ARRAY['Spark plug socket', 'Torque wrench', 'Basic hand tools'],
   ARRAY['Spark plugs (set for all cylinders)', 'Dielectric grease'])
ON CONFLICT (car_model_id, slug, language_path) DO NOTHING;

