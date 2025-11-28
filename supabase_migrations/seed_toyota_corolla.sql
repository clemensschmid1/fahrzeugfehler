-- Seed data for Toyota Corolla
-- Focus on most popular generations by search volume: E210 (2018-present), E170 (2013-2019), E140 (2006-2013)
-- 
-- IMPORTANT: This seed file requires the following migrations to be run first:
-- 1. create_cas_tables.sql (creates car_brands, car_models, car_faults, car_manuals)
-- 2. create_cas_generations.sql (creates model_generations table)
--
-- If you get an error about "model_generations" not existing, run create_cas_generations.sql first!
--
-- Migration order:
--   1. Run: create_cas_tables.sql
--   2. Run: create_cas_generations.sql  
--   3. Run: seed_cas_data.sql (optional - for BMW/Mercedes sample data)
--   4. Run: seed_cas_generations.sql (optional - for BMW/Mercedes generations)
--   5. Run: seed_toyota_corolla.sql (this file)

-- NOTE: If you get an error about "model_generations" not existing, 
-- you MUST run create_cas_generations.sql first to create the table!

-- Insert Toyota Brand
INSERT INTO car_brands (id, name, slug, description, country, founded_year, is_featured, display_order) VALUES
  ('550e8400-e29b-41d4-a716-446655440003', 'Toyota', 'toyota', 'Toyota Motor Corporation is a Japanese multinational automotive manufacturer. Founded in 1937, Toyota is one of the largest automobile manufacturers in the world, known for reliability, fuel efficiency, and innovative hybrid technology. The Toyota Corolla is the world''s best-selling car model.', 'Japan', 1937, true, 3)
ON CONFLICT (slug) DO NOTHING;

-- Insert Toyota Corolla Model
INSERT INTO car_models (id, brand_id, name, slug, year_start, year_end, description, is_featured, display_order) VALUES
  ('660e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440003', 'Corolla', 'corolla', 1966, NULL, 'The Toyota Corolla is a compact car that has been in production since 1966. It is the world''s best-selling car model, with over 50 million units sold worldwide. Known for its reliability, fuel efficiency, and value, the Corolla has been a favorite among consumers for decades. Available in sedan, hatchback, and wagon body styles.', true, 1)
ON CONFLICT (brand_id, slug) DO NOTHING;

-- Insert Generations for Toyota Corolla
DO $$
DECLARE
    toyota_corolla_id UUID;
    
    -- Generation IDs
    e210_id UUID;
    e170_id UUID;
    e140_id UUID;
BEGIN
    -- Get Corolla model ID
    SELECT id INTO toyota_corolla_id FROM car_models WHERE slug = 'corolla' LIMIT 1;
    
    -- ========================================
    -- TOYOTA COROLLA GENERATIONS
    -- ========================================
    
    -- E210 (2019-2024) - Most popular, highest search volume
    INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
    VALUES (
        gen_random_uuid(),
        toyota_corolla_id,
        'E210 (2019-2024)',
        'e210-2019-2024',
        2019,
        2024,
        'E210',
        'Twelfth generation Toyota Corolla (2019-2024). Features TNGA platform, advanced safety systems (Toyota Safety Sense 2.0), and modern infotainment. Engine options: 1.8L 2ZR-FAE (132 hp), 2.0L M20A-FKS Dynamic Force (169 hp), and hybrid variants. Available in sedan and hatchback body styles. Known for improved handling, fuel efficiency, and technology. This generation represents the most popular and searched Corolla model.',
        true,
        1
    ) RETURNING id INTO e210_id;
    
    -- E170 (2013-2019) - Very popular generation
    INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
    VALUES (
        gen_random_uuid(),
        toyota_corolla_id,
        'E170 (2013-2019)',
        'e170-2013-2019',
        2013,
        2019,
        'E170',
        'Eleventh generation Toyota Corolla. Redesigned with improved fuel economy and interior space. Engine options: 1.6L 1ZR-FE Dual VVT-i (132 hp), 1.8L 2ZR-FE Dual VVT-i (140 hp), and 1.8L hybrid (99 hp). Features improved ride comfort, better fuel efficiency, and enhanced safety features. Popular in global markets.',
        true,
        2
    ) RETURNING id INTO e170_id;
    
    -- E140 (2006-2013) - Still popular, many on the road
    INSERT INTO model_generations (id, car_model_id, name, slug, year_start, year_end, generation_code, description, is_featured, display_order)
    VALUES (
        gen_random_uuid(),
        toyota_corolla_id,
        'E140 (2006-2013)',
        'e140-2006-2013',
        2006,
        2013,
        'E140',
        'Tenth generation Toyota Corolla. Larger dimensions and improved interior space. Engine options: 1.6L 3ZZ-FE VVT-i (110 hp), 1.8L 2ZR-FE Dual VVT-i (132 hp), and 2.0L 3ZR-FE (158 hp). Known for reliability, comfortable ride, and good fuel economy. Available in sedan and wagon body styles.',
        false,
        3
    ) RETURNING id INTO e140_id;
    
    -- ========================================
    -- SAMPLE FAULTS FOR E210 (Most Popular)
    -- ========================================
    
    -- Common E210 Fault: CVT Transmission Issues
    INSERT INTO car_faults (id, model_generation_id, slug, title, description, solution, language_path, status, error_code, affected_component, severity, symptoms, diagnostic_steps, tools_required, estimated_repair_time, difficulty_level) VALUES
    (
        gen_random_uuid(),
        e210_id,
        'cvt-transmission-shudder',
        'CVT Transmission Shudder or Jerking',
        'The Toyota Corolla E210 with CVT transmission may experience shuddering, jerking, or hesitation during acceleration, especially at low speeds. This is often related to CVT fluid condition, transmission control module, or mechanical issues within the CVT unit.',
        '## Solution Steps:

### 1. **Check CVT Fluid**
   - Verify CVT fluid level using the dipstick (if equipped) or inspection plug
   - Check fluid color and condition
   - CVT fluid should be red/pink and not smell burnt
   - Low or contaminated fluid is a common cause

### 2. **CVT Fluid Service**
   - Drain and replace CVT fluid (use only Toyota CVT Fluid FE or equivalent)
   - Replace CVT fluid filter if equipped
   - Proper fluid level is critical for CVT operation
   - Service interval: Every 60,000-100,000 miles

### 3. **Transmission Control Module (TCM) Reset**
   - Use Toyota Techstream or compatible scanner to reset TCM adaptations
   - Clear transmission learned values
   - Relearn shift patterns through driving cycle

### 4. **Diagnostic Checks**
   - Scan for transmission fault codes (P0700 series)
   - Check transmission temperature
   - Test drive to reproduce symptoms
   - Monitor transmission data with scan tool

### 5. **Common Causes**
   - **Low/Contaminated CVT Fluid**: Most common cause
   - **TCM Software Issues**: May require update
   - **CVT Pulley Wear**: Mechanical wear in CVT unit
   - **Torque Converter Issues**: Lock-up clutch problems
   - **Input/Output Speed Sensor**: Faulty sensor readings

### 6. **Repair Options**
   - **Fluid Service**: First step, often resolves issue
   - **TCM Update**: Software update from dealer
   - **CVT Rebuild**: Required for severe mechanical damage
   - **Transmission Replacement**: Last resort for catastrophic failure

### 7. **Prevention**
   - Regular CVT fluid changes (every 60,000 miles)
   - Avoid aggressive driving and towing beyond capacity
   - Allow transmission to warm up before hard acceleration
   - Use only Toyota-approved CVT fluid',
        'en',
        'live',
        'P0700, P2769, P2791',
        'Transmission',
        'high',
        ARRAY['Shuddering during acceleration', 'Jerking or hesitation at low speeds', 'Rough shifting feel', 'Transmission warning light', 'Check engine light', 'Loss of power during acceleration'],
        ARRAY['Check CVT fluid level and condition', 'Scan for transmission fault codes', 'Test drive to reproduce symptoms', 'Check transmission temperature', 'Monitor transmission data with scan tool', 'Inspect for fluid leaks'],
        ARRAY['OBD-II scanner with Toyota support', 'CVT fluid dipstick or inspection tools', 'CVT fluid (Toyota CVT Fluid FE)', 'Fluid pump', 'Basic hand tools', 'Toyota Techstream or compatible scanner'],
        '2-4 hours',
        'medium'
    );
    
    -- Common E210 Fault: Engine Oil Consumption
    INSERT INTO car_faults (id, model_generation_id, slug, title, description, solution, language_path, status, error_code, affected_component, severity, symptoms, diagnostic_steps, tools_required, estimated_repair_time, difficulty_level) VALUES
    (
        gen_random_uuid(),
        e210_id,
        'engine-oil-consumption',
        'Excessive Engine Oil Consumption',
        'Some Toyota Corolla E210 models with 2.0L M20A-FKS engine may experience higher than normal oil consumption. This can be related to piston ring design, PCV system, or engine break-in procedures.',
        '## Solution Steps:

### 1. **Verify Oil Consumption**
   - Check oil level regularly (every 1,000 miles)
   - Document consumption rate
   - Normal consumption: Less than 1 quart per 1,000 miles
   - Excessive: More than 1 quart per 1,000 miles

### 2. **Check for External Leaks**
   - Inspect oil pan, valve cover, oil filter
   - Check timing cover and front/rear main seals
   - Look for oil on ground under vehicle
   - Use UV dye to locate small leaks

### 3. **PCV System Inspection**
   - Check PCV valve operation
   - Inspect PCV hoses for blockages
   - Replace PCV valve if faulty
   - Clean PCV system components

### 4. **Engine Break-In**
   - Ensure proper break-in procedure was followed
   - Avoid extended idling during first 1,000 miles
   - Vary engine speeds during break-in
   - Use recommended oil viscosity (0W-20)

### 5. **Piston Ring Issues**
   - May require piston ring replacement
   - Check for cylinder wall scoring
   - Perform compression test
   - Consider engine rebuild if severe

### 6. **Warranty Coverage**
   - Check if vehicle is under warranty
   - Toyota may cover excessive consumption under warranty
   - Document all service records
   - Contact Toyota dealer for warranty claim

### 7. **Prevention**
   - Use only Toyota-approved 0W-20 synthetic oil
   - Follow recommended oil change intervals
   - Avoid extended idling
   - Regular maintenance and inspections',
        'en',
        'live',
        NULL,
        'Engine',
        'medium',
        ARRAY['Low oil level between changes', 'Oil warning light', 'Blue smoke from exhaust', 'Oil consumption between service intervals', 'Engine noise or knocking'],
        ARRAY['Check oil level regularly', 'Monitor consumption rate', 'Inspect for external leaks', 'Check PCV system', 'Perform compression test', 'Check for blue smoke'],
        ARRAY['Oil dipstick', 'UV leak detection kit', 'Compression tester', 'PCV valve', 'Basic hand tools'],
        '2-6 hours',
        'medium'
    );
    
    -- Common E210 Fault: Infotainment System Issues
    INSERT INTO car_faults (id, model_generation_id, slug, title, description, solution, language_path, status, error_code, affected_component, severity, symptoms, diagnostic_steps, tools_required, estimated_repair_time, difficulty_level) VALUES
    (
        gen_random_uuid(),
        e210_id,
        'infotainment-system-freeze',
        'Infotainment System Freezing or Not Responding',
        'The Toyota Corolla E210 infotainment system (Entune 3.0 or Audio Plus) may freeze, become unresponsive, or restart unexpectedly. This can affect radio, navigation, Bluetooth, and other multimedia functions.',
        '## Solution Steps:

### 1. **Soft Reset**
   - Turn off vehicle
   - Disconnect battery negative terminal for 10 minutes
   - Reconnect battery
   - Restart vehicle and test system

### 2. **System Reset via Settings**
   - Go to Settings menu
   - Select "General" or "System"
   - Choose "Factory Reset" or "Reset All Settings"
   - Confirm reset (will erase saved settings)

### 3. **Software Update**
   - Check for available software updates
   - Visit Toyota website or dealer for updates
   - Update via USB or dealer service
   - Follow update instructions carefully

### 4. **Check Connections**
   - Inspect wiring harness connections
   - Check for loose connectors behind head unit
   - Verify antenna connections
   - Check fuse box for blown fuses

### 5. **Common Causes**
   - **Software Glitch**: Most common, resolved by reset
   - **Low Battery Voltage**: Can cause system issues
   - **Faulty Head Unit**: Hardware failure
   - **Corrupted Software**: Requires update or reflash
   - **Bluetooth Module Issues**: Affects connectivity

### 6. **Repair Options**
   - **Reset**: First step, often resolves issue
   - **Software Update**: Fixes known bugs
   - **Head Unit Replacement**: Required for hardware failure
   - **Module Replacement**: For specific component failure

### 7. **Prevention**
   - Keep software updated
   - Avoid aftermarket modifications
   - Maintain proper battery voltage
   - Regular system maintenance',
        'en',
        'live',
        NULL,
        'Infotainment System',
        'low',
        ARRAY['Screen freezes or black screen', 'Touch screen not responding', 'System restarts randomly', 'Bluetooth not connecting', 'Radio not working', 'Navigation not functioning'],
        ARRAY['Perform soft reset', 'Check for software updates', 'Inspect wiring connections', 'Check battery voltage', 'Test all functions', 'Scan for fault codes'],
        ARRAY['Basic hand tools', 'Multimeter', 'USB drive for updates', 'Toyota diagnostic software'],
        '1-2 hours',
        'easy'
    );
    
    -- ========================================
    -- SAMPLE MANUALS FOR E210
    -- ========================================
    
    -- Oil Change Procedure
    INSERT INTO car_manuals (id, model_generation_id, title, slug, content, language_path, status, manual_type, difficulty_level, estimated_time, tools_required, parts_required) VALUES
    (
        gen_random_uuid(),
        e210_id,
        'Engine Oil Change Procedure',
        'engine-oil-change',
        '## Engine Oil Change Procedure for Toyota Corolla E210

### Required Materials:
- **Engine Oil**: 4.2 quarts (4.0 liters) of Toyota Genuine Motor Oil 0W-20 or equivalent
- **Oil Filter**: Toyota part # 04152-YZZA1 or equivalent
- **Drain Plug Washer**: New crush washer (recommended)

### Tools Required:
- Socket wrench set
- Oil filter wrench
- Drain pan
- Funnel
- Jack and jack stands (or ramps)
- Torque wrench

### Step-by-Step Procedure:

#### 1. **Preparation**
   - Park vehicle on level surface
   - Engage parking brake
   - Allow engine to cool (warm oil drains better, but avoid hot engine)
   - Gather all tools and materials

#### 2. **Raise Vehicle**
   - Safely raise front of vehicle using jack and jack stands
   - Ensure vehicle is stable before working underneath
   - **Never work under vehicle supported only by jack**

#### 3. **Drain Engine Oil**
   - Locate oil drain plug on bottom of oil pan
   - Place drain pan directly under drain plug
   - Remove drain plug using 14mm socket
   - Allow oil to drain completely (5-10 minutes)
   - Clean drain plug and inspect threads

#### 4. **Replace Oil Filter**
   - Locate oil filter (typically on side of engine)
   - Place drain pan under filter
   - Remove old filter using oil filter wrench
   - Clean filter mounting surface
   - Apply thin film of new oil to new filter gasket
   - Install new filter hand-tight, then 3/4 turn more
   - **Do not over-tighten**

#### 5. **Reinstall Drain Plug**
   - Install new crush washer on drain plug
   - Reinstall drain plug
   - Torque to 30 ft-lbs (40 Nm)
   - **Do not over-tighten**

#### 6. **Add New Oil**
   - Lower vehicle
   - Remove oil filler cap
   - Add 4.2 quarts (4.0 liters) of 0W-20 oil
   - Replace filler cap

#### 7. **Check Oil Level**
   - Start engine and let run for 30 seconds
   - Turn off engine and wait 2-3 minutes
   - Check oil level using dipstick
   - Oil level should be between min and max marks
   - Add more oil if needed (do not overfill)

#### 8. **Final Checks**
   - Check for leaks around drain plug and filter
   - Verify no warning lights on dashboard
   - Dispose of old oil properly (recycling center)
   - Reset oil change reminder if equipped

### Service Interval:
- **Normal Conditions**: Every 10,000 miles or 12 months
- **Severe Conditions**: Every 5,000 miles or 6 months

### Important Notes:
- Always use Toyota-approved 0W-20 synthetic oil
- Never exceed maximum oil level
- Proper disposal of used oil is required by law
- Keep service records for warranty purposes',
        'en',
        'live',
        'maintenance',
        'easy',
        '30-45 minutes',
        ARRAY['Socket wrench set', 'Oil filter wrench', 'Drain pan', 'Funnel', 'Jack and jack stands', 'Torque wrench'],
        ARRAY['4.2 quarts 0W-20 synthetic oil', 'Oil filter (Toyota #04152-YZZA1)', 'Drain plug washer']
    );
    
    -- Battery Replacement Guide
    INSERT INTO car_manuals (id, model_generation_id, title, slug, content, language_path, status, manual_type, difficulty_level, estimated_time, tools_required, parts_required) VALUES
    (
        gen_random_uuid(),
        e210_id,
        'Battery Replacement Guide',
        'battery-replacement',
        '## Battery Replacement Guide for Toyota Corolla E210

### Required Battery:
- **Group Size**: 24F or 27F (check owner''s manual)
- **Cold Cranking Amps (CCA)**: 550 CCA minimum
- **Reserve Capacity**: 90 minutes minimum
- **Voltage**: 12V

### Tools Required:
- 10mm socket and wrench
- Battery terminal cleaner
- Battery hold-down clamp tool
- Safety glasses
- Gloves

### Step-by-Step Procedure:

#### 1. **Safety Precautions**
   - Park vehicle on level surface
   - Turn off all electrical accessories
   - Engage parking brake
   - Wear safety glasses and gloves

#### 2. **Locate Battery**
   - Open hood
   - Battery is located in engine compartment
   - Identify positive (+) and negative (-) terminals

#### 3. **Disconnect Battery**
   - **Always disconnect negative terminal first**
   - Loosen negative terminal clamp (10mm)
   - Remove negative cable
   - Secure cable away from battery
   - Loosen positive terminal clamp
   - Remove positive cable

#### 4. **Remove Old Battery**
   - Remove battery hold-down clamp
   - Lift battery out carefully (batteries are heavy)
   - Place old battery on stable surface

#### 5. **Clean Battery Tray**
   - Clean battery tray with baking soda solution
   - Neutralize any acid residue
   - Dry thoroughly
   - Clean terminal clamps with wire brush

#### 6. **Install New Battery**
   - Place new battery in battery tray
   - Ensure battery is oriented correctly
   - Install battery hold-down clamp
   - Tighten clamp securely

#### 7. **Connect Battery**
   - **Connect positive terminal first**
   - Tighten positive terminal clamp (10mm)
   - Connect negative terminal
   - Tighten negative terminal clamp
   - Apply terminal protector spray (optional)

#### 8. **Final Checks**
   - Verify connections are tight
   - Start engine to verify operation
   - Check for warning lights
   - Test electrical accessories
   - Reset clock and radio presets if needed

### Important Notes:
- Always disconnect negative terminal first
- Always connect positive terminal first
- Never short-circuit battery terminals
- Properly dispose of old battery (recycling required)
- Some vehicles may require battery registration with scan tool
- Check battery date code (replace if over 3-4 years old)

### Battery Maintenance:
- Keep terminals clean and tight
- Check battery voltage regularly (12.6V when fully charged)
- Inspect for corrosion or damage
- Keep battery securely mounted',
        'en',
        'live',
        'maintenance',
        'easy',
        '20-30 minutes',
        ARRAY['10mm socket and wrench', 'Battery terminal cleaner', 'Wire brush', 'Safety glasses', 'Gloves'],
        ARRAY['Replacement battery (Group 24F or 27F)', 'Terminal protector spray (optional)']
    );
    
END $$;

