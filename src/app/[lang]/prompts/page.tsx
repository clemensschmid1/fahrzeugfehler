'use client';

import { useState, useEffect, useMemo } from 'react';
import InternalAuth from '@/components/InternalAuth';
import { getSupabaseClient } from '@/lib/supabase';
import Link from 'next/link';
import { useParams } from 'next/navigation';

type CarBrand = {
  id: string;
  name: string;
  slug: string;
};

type CarModel = {
  id: string;
  name: string;
  slug: string;
  brand_id: string;
};

type ModelGeneration = {
  id: string;
  name: string;
  slug: string;
  car_model_id: string;
  generation_code?: string;
  year_start?: number;
  year_end?: number;
  brand_id?: string;
  brand_name?: string;
  model_name?: string;
};

type GenerationPrompt = {
  id: string;
  generation_id: string;
  content_type: 'fault' | 'manual';
  language: 'en' | 'de';
  prompt_order: number;
  system_prompt: string;
  user_prompt_template: string;
  model: string;
  temperature: number;
  max_tokens: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
  notes?: string;
};

// Presets for Variance Areas (specific problem categories with detailed focus)
const VARIANCE_AREA_PRESETS = [
  {
    label: 'Engine & Performance Issues',
    value: `SPECIFIC FOCUS AREAS:
- Engine misfires, rough idle, stalling, hesitation
- Loss of power, acceleration problems, turbo issues
- Overheating, coolant leaks, temperature gauge problems
- Oil consumption, oil leaks, low oil pressure warnings
- Timing chain/belt issues, camshaft problems
- Fuel system problems (injectors, fuel pump, filter)
- Exhaust system issues (smoke, emissions, catalytic converter)
- Knocking, pinging, unusual engine noises
- Start-up problems, hard starting, no-start conditions
- Engine codes: P0300-P0310 (misfires), P0171/P0174 (lean), P0420 (catalyst), P0011-P0021 (timing)`,
  },
  {
    label: 'Transmission & Drivetrain',
    value: `SPECIFIC FOCUS AREAS:
- Transmission slipping, jerking, hard shifting
- Delayed engagement, won't shift into gear
- Transmission fluid leaks, burning smell
- Torque converter problems, shuddering
- CVT issues (belt slipping, overheating)
- Clutch problems (slipping, chattering, hard pedal)
- Differential noise, whining, grinding
- Transfer case problems (4WD/AWD)
- Driveshaft vibration, U-joint issues
- Transmission codes: P0700-P0799 series`,
  },
  {
    label: 'Electrical & Electronics',
    value: `SPECIFIC FOCUS AREAS:
- Battery dies overnight, parasitic drain, alternator issues
- Fuses blowing repeatedly, electrical shorts
- Dashboard warning lights (ABS, traction, airbag, etc.)
- Power windows, locks, mirrors not working
- Infotainment system freezing, screen black, no sound
- Key fob not working, remote start issues
- Headlights flickering, dimming, or not working
- Interior lights staying on, door ajar sensors
- CAN bus communication errors, module failures
- Electrical codes: B-codes (body), U-codes (network)`,
  },
  {
    label: 'Brakes & Suspension',
    value: `SPECIFIC FOCUS AREAS:
- Brake pedal soft, spongy, goes to floor
- Brakes grinding, squealing, pulsating
- ABS light on, traction control disabled
- Brake fluid leaks, master cylinder problems
- Uneven brake pad wear, caliper issues
- Suspension noise (clunking, squeaking, rattling)
- Car pulling to one side, alignment issues
- Struts/shocks leaking, worn out
- Wheel bearing noise, vibration
- Brake codes: C-codes (chassis), ABS module errors`,
  },
  {
    label: 'Climate Control & HVAC',
    value: `SPECIFIC FOCUS AREAS:
- AC not cold, weak airflow, compressor issues
- Heater not working, no heat, cold air only
- Blower motor not working, only one speed
- Strange smells (musty, burning, chemical)
- AC compressor clutch not engaging
- Refrigerant leaks, system won't hold charge
- Climate control buttons not responding
- Temperature blend door actuator problems
- Condensation, water leaks inside car
- HVAC codes: B-codes related to climate control`,
  },
  {
    label: 'Steering & Handling',
    value: `SPECIFIC FOCUS AREAS:
- Power steering fluid leaks, pump whining
- Steering wheel hard to turn, stiff
- Car wanders, pulls to one side
- Steering wheel vibration, shaking
- Tie rod ends, ball joints worn
- Steering rack leaks, loose steering
- Electric power steering (EPS) problems
- Alignment issues, tire wear patterns
- Steering column noise, clicking
- Steering-related codes: C-codes`,
  },
  {
    label: 'Fuel System & Emissions',
    value: `SPECIFIC FOCUS AREAS:
- Check engine light, emissions test failures
- Poor fuel economy, gas mileage dropped
- Fuel pump not working, car won't start
- Fuel injector problems, rough running
- EVAP system leaks, gas cap issues
- EGR valve problems, carbon buildup
- Oxygen sensor failures, catalytic converter
- Fuel tank issues, fuel gauge inaccurate
- Diesel-specific: DPF problems, AdBlue/SCR issues
- Emissions codes: P0400-P0499 (EGR, EVAP), P0130-P0165 (O2 sensors)`,
  },
  {
    label: 'Safety Systems',
    value: `SPECIFIC FOCUS AREAS:
- Airbag light on, SRS system problems
- Seatbelt warning not working, pretensioners
- Blind spot monitoring not working
- Lane departure warning false alarms
- Forward collision warning issues
- Parking sensors not working, false alerts
- Backup camera black screen, no image
- Tire pressure monitoring system (TPMS) errors
- Stability control, traction control problems
- Safety system codes: B-codes, C-codes`,
  },
];

// Presets for Topic Focus (specific problem scenarios)
const TOPIC_FOCUS_PRESETS = [
  {
    label: 'High Search Volume - Common Daily Problems',
    value: `PRIORITIZE THESE HIGH-SEARCH-VOLUME PROBLEMS:
- Problems that prevent the car from starting or running
- Issues that cause warning lights to appear
- Problems that affect daily driving (rough idle, stalling, hesitation)
- Safety-related issues (brakes, steering, airbags)
- Problems that cause the car to break down or leave you stranded
- Issues that are expensive to fix if ignored (transmission, engine)
- Problems that affect fuel economy significantly
- Issues reported frequently in owner forums and reviews`,
  },
  {
    label: 'Specific Error Codes & Diagnostics',
    value: `FOCUS ON CODE-SPECIFIC PROBLEMS:
- P-codes (powertrain): P0300-P0310 (misfires), P0171/P0174 (lean), P0420 (catalyst), P0011-P0021 (timing), P0700-P0799 (transmission)
- B-codes (body): Climate control, airbags, seatbelts, infotainment
- C-codes (chassis): ABS, traction control, suspension, steering
- U-codes (network): CAN bus, module communication errors
- Manufacturer-specific codes (BMW, Mercedes, Audi, etc.)
- Include the specific code in the question when relevant
- Focus on "how to fix [CODE] in [MODEL]" type questions`,
  },
  {
    label: 'Model-Specific Known Issues',
    value: `FOCUS ON MODEL-SPECIFIC PROBLEMS:
- Problems documented in TSBs (Technical Service Bulletins)
- Recalls and known defects for this specific model/generation
- Common issues reported in owner forums for this exact model
- Problems that appear after certain mileage (e.g., "at 80k miles")
- Issues specific to certain model years or production runs
- Problems unique to this generation (e.g., "first gen has this issue")
- Manufacturer-specific problems (e.g., "common BMW issue")`,
  },
  {
    label: 'Seasonal & Weather-Related Problems',
    value: `FOCUS ON SEASONAL/WEATHER ISSUES:
- Cold weather problems: hard starting, battery dies, frozen locks
- Hot weather issues: overheating, AC not working, battery overcharging
- Rain/water problems: leaks, electrical shorts, moisture issues
- Winter-specific: heater problems, defroster not working, ice buildup
- Summer-specific: AC failures, overheating, tire pressure
- Problems that appear during specific seasons
- Weather-related breakdowns and failures`,
  },
  {
    label: 'Performance & Driving Experience',
    value: `FOCUS ON PERFORMANCE ISSUES:
- Loss of power, acceleration problems, turbo lag
- Rough running, misfires, hesitation, stalling
- Transmission shifting problems, jerking, slipping
- Handling issues: pulling, wandering, vibration
- Noise problems: engine, transmission, suspension, exhaust
- Fuel economy dropped significantly
- Throttle response issues, pedal problems
- Problems that affect the driving experience directly`,
  },
  {
    label: 'Maintenance & Wear Items',
    value: `FOCUS ON MAINTENANCE-RELATED PROBLEMS:
- Problems that indicate maintenance is needed
- Wear items that need replacement (brakes, tires, belts)
- Fluid leaks and low fluid warnings
- Parts that fail at certain mileage intervals
- Problems caused by deferred maintenance
- "When to replace" type questions for this model
- Maintenance schedule questions specific to this model`,
  },
];

// Master prompts from mass generation - IMPROVED for real-world search queries
const MASTER_FAULT_SYSTEM_PROMPT_EN = `You are an expert automotive search query analyst with access to real-world search volume data. You understand exactly how car owners search for problems online - using natural language, specific symptoms, and real-world problem descriptions. Your goal is to generate questions that match actual high-volume search queries (500M+ monthly searches globally).

CRITICAL INSTRUCTIONS:
- Generate questions EXACTLY as people type them into Google, forums, and search engines
- Prioritize by REAL search volume - most searched problems first
- Each question must be a COMPLETE, ACTIONABLE search query (not just keywords)
- Questions should describe SPECIFIC SYMPTOMS and PROBLEMS, not generic topics
- Include model name naturally in the question when relevant
- Use natural language - how real people actually ask questions
- NO generic phrases like "battery drain issue" - be SPECIFIC: "why does my battery die overnight"
- Output ONLY the questions, one per line, no numbering, no prefixes, no explanations`;

const MASTER_FAULT_USER_PROMPT_TEMPLATE_EN = `Generate {count} REAL-WORLD search queries for {brand} {model} {generation}{yearRange} that match how people ACTUALLY search online. These should be high-volume search queries (targeting 500M+ monthly global searches).

CRITICAL REQUIREMENTS - READ CAREFULLY:
1. SEARCH QUERY FORMAT: Write questions EXACTLY as people type them - natural, conversational, specific
2. SYMPTOM-BASED: Focus on SPECIFIC SYMPTOMS people experience, not generic problem categories
3. HIGH SEARCH VOLUME: Prioritize problems that generate millions of searches monthly
4. MODEL-SPECIFIC: Include {brand} {model} {generation} naturally when it adds value
5. ERROR CODES: Include specific codes (P0301, P0420, etc.) when relevant - these are highly searched
6. NO GENERIC PHRASES: Avoid vague terms like "battery drain issue" - use "why does my battery die when car is off"
7. REAL-WORLD LANGUAGE: Use how people actually talk: "my car won't start", "check engine light came on", "transmission is slipping"
8. AVOID DUPLICATES: NO similar questions to: {existingQuestions}
9. LENGTH: 15-150 characters, 3-25 words - complete searchable queries
10. ACTIONABLE: Questions should lead to solutions, not just descriptions

{VARIANCE_AREA}

{TOPIC_FOCUS}

EXAMPLES OF EXCELLENT REAL-WORLD QUESTIONS (HIGH SEARCH VOLUME):
- "why does my {brand} {model} {generation} check engine light keep coming on"
- "how to fix P0301 misfire code {brand} {model} {generation}"
- "my {brand} {model} transmission slips when accelerating what's wrong"
- "why does my {brand} {model} battery die overnight when car is off"
- "{brand} {model} {generation} rough idle when cold start"
- "how to reset check engine light {brand} {model} {generation}"
- "my {brand} {model} won't start just clicks what to do"
- "{brand} {model} {generation} AC not blowing cold air"
- "why is my {brand} {model} using so much oil"
- "{brand} {model} {generation} brake pedal goes to floor"
- "how to fix {brand} {model} transmission jerking when shifting"
- "my {brand} {model} overheats in traffic what's causing it"
- "{brand} {model} {generation} ABS light on how to fix"
- "why does my {brand} {model} shake when I brake"
- "how to diagnose {brand} {model} {generation} electrical problems"

EXAMPLES OF BAD QUESTIONS (TOO GENERIC - AVOID):
- "{brand} {model} battery drain issue" (too vague)
- "Common electrical problems {brand} {model}" (not specific enough)
- "What is wrong with my car" (too generic)
- "Engine problems" (not a question, too short)

Format: One complete search query per line. Natural language. No numbering. No prefixes.`;

export default function PromptsPage() {
  return (
    <InternalAuth>
      <PromptsContent />
    </InternalAuth>
  );
}

function PromptsContent() {
  const params = useParams();
  const lang = params.lang as string;
  const t = (en: string, de: string) => lang === 'de' ? de : en;

  const [brands, setBrands] = useState<CarBrand[]>([]);
  const [models, setModels] = useState<CarModel[]>([]);
  const [allGenerations, setAllGenerations] = useState<ModelGeneration[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [selectedGenerations, setSelectedGenerations] = useState<string[]>([]);
  const [contentType, setContentType] = useState<'fault' | 'manual'>('fault');
  const [language, setLanguage] = useState<'en' | 'de'>('en');
  
  // Master prompt template
  const [masterSystemPrompt, setMasterSystemPrompt] = useState<string>(MASTER_FAULT_SYSTEM_PROMPT_EN);
  const [masterUserPromptTemplate, setMasterUserPromptTemplate] = useState<string>(MASTER_FAULT_USER_PROMPT_TEMPLATE_EN);
  const [varianceAreas, setVarianceAreas] = useState<string[]>(['']);
  const [topicFocus, setTopicFocus] = useState<string>('');
  
  // Intelligent preset combinations for 25 slots - OPTIMIZED CONFIGURATION
  // Each combination is unique and strategically chosen for maximum coverage
  const getIntelligentPresets = () => {
    const variancePresets = VARIANCE_AREA_PRESETS;
    const topicPresets = TOPIC_FOCUS_PRESETS;
    
    // OPTIMIZED CONFIGURATION: 25 unique, strategic combinations
    // Strategy: Each variance area appears multiple times with different topic focuses
    // No duplicate combinations - maximum diversity and coverage
    const combinations = [
      // Engine & Performance (5 slots - most common problems)
      { variance: variancePresets[0].value, topic: topicPresets[0].value, label: 'Engine - High Search Volume' }, // Slot 1
      { variance: variancePresets[0].value, topic: topicPresets[1].value, label: 'Engine - Error Codes' }, // Slot 2
      { variance: variancePresets[0].value, topic: topicPresets[2].value, label: 'Engine - Model-Specific' }, // Slot 3
      { variance: variancePresets[0].value, topic: topicPresets[4].value, label: 'Engine - Performance' }, // Slot 4
      { variance: variancePresets[0].value, topic: topicPresets[5].value, label: 'Engine - Maintenance' }, // Slot 5
      
      // Transmission & Drivetrain (5 slots - critical systems)
      { variance: variancePresets[1].value, topic: topicPresets[1].value, label: 'Transmission - Error Codes' }, // Slot 6 (GOOD COMBI)
      { variance: variancePresets[1].value, topic: topicPresets[0].value, label: 'Transmission - High Search' }, // Slot 7
      { variance: variancePresets[1].value, topic: topicPresets[2].value, label: 'Transmission - Model-Specific' }, // Slot 8
      { variance: variancePresets[1].value, topic: topicPresets[4].value, label: 'Transmission - Performance' }, // Slot 9
      { variance: variancePresets[1].value, topic: topicPresets[5].value, label: 'Transmission - Maintenance' }, // Slot 10
      
      // Electrical & Electronics (5 slots - modern car complexity)
      { variance: variancePresets[2].value, topic: topicPresets[0].value, label: 'Electrical - High Search' }, // Slot 11
      { variance: variancePresets[2].value, topic: topicPresets[1].value, label: 'Electrical - Error Codes' }, // Slot 12
      { variance: variancePresets[2].value, topic: topicPresets[3].value, label: 'Electrical - Seasonal' }, // Slot 13
      { variance: variancePresets[2].value, topic: topicPresets[2].value, label: 'Electrical - Model-Specific' }, // Slot 14
      { variance: variancePresets[2].value, topic: topicPresets[5].value, label: 'Electrical - Maintenance' }, // Slot 15
      
      // Brakes & Suspension (3 slots - safety critical)
      { variance: variancePresets[3].value, topic: topicPresets[0].value, label: 'Brakes - High Search' }, // Slot 16
      { variance: variancePresets[3].value, topic: topicPresets[1].value, label: 'Brakes - Error Codes' }, // Slot 17
      { variance: variancePresets[3].value, topic: topicPresets[4].value, label: 'Brakes - Performance' }, // Slot 18
      
      // Climate Control & HVAC (2 slots)
      { variance: variancePresets[4].value, topic: topicPresets[3].value, label: 'Climate - Seasonal' }, // Slot 19
      { variance: variancePresets[4].value, topic: topicPresets[0].value, label: 'Climate - High Search' }, // Slot 20
      
      // Steering & Handling (2 slots)
      { variance: variancePresets[5].value, topic: topicPresets[4].value, label: 'Steering - Performance' }, // Slot 21
      { variance: variancePresets[5].value, topic: topicPresets[2].value, label: 'Steering - Model-Specific' }, // Slot 22
      
      // Fuel System & Emissions (2 slots)
      { variance: variancePresets[6].value, topic: topicPresets[1].value, label: 'Fuel - Error Codes' }, // Slot 23
      { variance: variancePresets[6].value, topic: topicPresets[4].value, label: 'Fuel - Performance' }, // Slot 24
      
      // Safety Systems (1 slot)
      { variance: variancePresets[7].value, topic: topicPresets[0].value, label: 'Safety - High Search' }, // Slot 25
    ];
    
    return combinations;
  };

  // Initialize 25 prompt slots with intelligent presets
  const getInitialSlots = () => {
    const presets = getIntelligentPresets();
    return Array.from({ length: 25 }, (_, i) => ({
      order: i + 1,
      systemPrompt: '',
      userPromptTemplate: '',
      varianceArea: presets[i].variance,
      topicFocus: presets[i].topic,
      varianceLabel: presets[i].label,
      model: 'gpt-4o-mini',
      temperature: 0.8,
      maxTokens: 5000,
    }));
  };

  // Apply optimized preset configuration to all slots
  const applyOptimizedPresets = () => {
    const presets = getIntelligentPresets();
    const newSlots = promptSlots.map((slot, index) => ({
      ...slot,
      varianceArea: presets[index].variance,
      topicFocus: presets[index].topic,
      varianceLabel: presets[index].label,
    }));
    setPromptSlots(newSlots);
    setSuccess(t(
      'Optimized preset configuration applied to all 25 slots. Each slot now has a unique, strategic combination for maximum coverage.',
      'Optimierte Preset-Konfiguration auf alle 25 Slots angewendet. Jeder Slot hat jetzt eine einzigartige, strategische Kombination für maximale Abdeckung.'
    ));
  };

  const initialSlots = useMemo(() => getInitialSlots(), []);

  const [promptSlots, setPromptSlots] = useState(initialSlots);
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'master' | 'slots'>('master');
  const [savedPromptsCount, setSavedPromptsCount] = useState<number>(0);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  const supabase = useMemo(() => {
    try {
      return getSupabaseClient();
    } catch (error: any) {
      console.error('Failed to initialize Supabase client:', error);
      return null;
    }
  }, []);

  // Load brands
  useEffect(() => {
    if (!supabase) return;
    const loadBrands = async () => {
      try {
        const { data, error } = await supabase
          .from('car_brands')
          .select('id, name, slug')
          .order('name');
        if (error) throw error;
        setBrands(data || []);
      } catch (err) {
        console.error('Error loading brands:', err);
      }
    };
    loadBrands();
  }, [supabase]);

  // Load models when brands selected
  useEffect(() => {
    if (!supabase || selectedBrands.length === 0) {
      setModels([]);
      return;
    }
    const loadModels = async () => {
      try {
        const { data, error } = await supabase
          .from('car_models')
          .select('id, name, slug, brand_id')
          .in('brand_id', selectedBrands)
          .order('name');
        if (error) throw error;
        setModels(data || []);
      } catch (err) {
        console.error('Error loading models:', err);
      }
    };
    loadModels();
  }, [supabase, selectedBrands]);

  // Load generations when models selected
  useEffect(() => {
    if (!supabase || selectedModels.length === 0) {
      setAllGenerations([]);
      return;
    }
    const loadGenerations = async () => {
      try {
        // First get models with their brands
        const { data: modelsData, error: modelsError } = await supabase
          .from('car_models')
          .select('id, name, brand_id, car_brands(id, name)')
          .in('id', selectedModels);
        if (modelsError) throw modelsError;

        const modelMap = new Map(modelsData?.map((m: any) => [m.id, m]) || []);

        // Then get generations
        const { data, error } = await supabase
          .from('model_generations')
          .select('id, name, slug, car_model_id, generation_code, year_start, year_end')
          .in('car_model_id', selectedModels)
          .order('year_start', { ascending: false });
        if (error) throw error;
        
        const enriched = (data || []).map((gen: any) => {
          const model = modelMap.get(gen.car_model_id);
          return {
            ...gen,
            brand_id: model?.brand_id,
            brand_name: model?.car_brands?.name,
            model_name: model?.name,
          };
        });
        setAllGenerations(enriched);
      } catch (err) {
        console.error('Error loading generations:', err);
      }
    };
    loadGenerations();
  }, [supabase, selectedModels]);

  // Load existing prompts for selected generations
  useEffect(() => {
    if (!supabase || selectedGenerations.length === 0) {
      return;
    }
    const loadPrompts = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('generation_prompts')
          .select('*')
          .in('generation_id', selectedGenerations)
          .eq('content_type', contentType)
          .eq('language', language)
          .order('generation_id, prompt_order');
        if (error) throw error;
        
        // Group by generation and load into slots
        const promptsByGen = new Map<string, GenerationPrompt[]>();
        (data || []).forEach((p: GenerationPrompt) => {
          if (!promptsByGen.has(p.generation_id)) {
            promptsByGen.set(p.generation_id, []);
          }
          promptsByGen.get(p.generation_id)!.push(p);
        });
        
        // If we have prompts, load the first generation's prompts into slots
        if (promptsByGen.size > 0) {
          const firstGenId = selectedGenerations[0];
          const firstGenPrompts = promptsByGen.get(firstGenId) || [];
          const newSlots = initialSlots.map(slot => {
            const existing = firstGenPrompts.find(p => p.prompt_order === slot.order);
            return existing ? {
              order: slot.order,
              systemPrompt: existing.system_prompt,
              userPromptTemplate: existing.user_prompt_template,
              varianceArea: existing.notes?.split('VARIANCE:')[1]?.split('TOPIC:')[0]?.trim() || slot.varianceArea,
              topicFocus: existing.notes?.split('TOPIC:')[1]?.trim() || slot.topicFocus,
              varianceLabel: slot.varianceLabel, // Preserve varianceLabel from slot
              model: existing.model,
              temperature: existing.temperature,
              maxTokens: existing.max_tokens,
            } : slot;
          });
          setPromptSlots(newSlots);
        } else {
          // Reset to initial presets if no prompts found
          setPromptSlots(getInitialSlots());
        }
      } catch (err) {
        console.error('Error loading prompts:', err);
      } finally {
        setLoading(false);
      }
    };
    loadPrompts();
  }, [supabase, selectedGenerations, contentType, language]);

  // Apply master template to all slots
  const applyMasterToSlots = () => {
    const newSlots = promptSlots.map(slot => ({
      ...slot,
      systemPrompt: masterSystemPrompt,
      userPromptTemplate: masterUserPromptTemplate,
    }));
    setPromptSlots(newSlots);
    setSuccess(t('Master template applied to all slots', 'Master-Vorlage auf alle Slots angewendet'));
  };

  // Save prompts for all selected generations - OPTIMIZED with batch operations
  const handleBulkSave = async () => {
    if (!supabase || selectedGenerations.length === 0) {
      setError(t('Please select at least one generation', 'Bitte wählen Sie mindestens eine Generation'));
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      // Prepare all prompt data - use UPSERT to handle both insert and update
      const allPrompts: any[] = [];

      // Prepare all prompt data
      for (const generationId of selectedGenerations) {
        for (const slot of promptSlots) {
          if (!slot.systemPrompt.trim() || !slot.userPromptTemplate.trim()) continue;

          // Build final user prompt with variance and topic focus
          let finalUserPrompt = slot.userPromptTemplate;
          if (slot.varianceArea) {
            finalUserPrompt = finalUserPrompt.replace('{VARIANCE_AREA}', slot.varianceArea);
          } else {
            finalUserPrompt = finalUserPrompt.replace('{VARIANCE_AREA}\n\n', '');
          }
          if (slot.topicFocus) {
            finalUserPrompt = finalUserPrompt.replace('{TOPIC_FOCUS}', slot.topicFocus);
          } else {
            finalUserPrompt = finalUserPrompt.replace('{TOPIC_FOCUS}\n\n', '');
          }

          const notes = `VARIANCE: ${slot.varianceArea}\nTOPIC: ${slot.topicFocus}`;

          const promptData = {
            generation_id: generationId,
            content_type: contentType,
            language: language,
            prompt_order: slot.order,
            system_prompt: slot.systemPrompt,
            user_prompt_template: finalUserPrompt,
            model: slot.model,
            temperature: slot.temperature,
            max_tokens: slot.maxTokens,
            is_active: true,
            notes: notes,
          };

          allPrompts.push(promptData);
        }
      }

      // Use UPSERT (INSERT ... ON CONFLICT DO UPDATE) to handle both insert and update
      // This avoids the unique constraint violation
      const UPSERT_CHUNK_SIZE = 50; // Process in chunks to avoid too large queries
      for (let i = 0; i < allPrompts.length; i += UPSERT_CHUNK_SIZE) {
        const chunk = allPrompts.slice(i, i + UPSERT_CHUNK_SIZE);
        
        // Use upsert with the unique constraint columns
        // The unique constraint is: (generation_id, content_type, language, prompt_order)
        // Supabase automatically detects the unique constraint, but we can specify it explicitly
        const { data: upsertData, error: upsertError } = await supabase
          .from('generation_prompts')
          .upsert(chunk, {
            onConflict: 'generation_id,content_type,language,prompt_order',
            ignoreDuplicates: false, // Update existing rows instead of ignoring
          })
          .select('id');
        
        if (upsertError) {
          console.error('Upsert error:', upsertError);
          throw new Error(`Failed to save prompts: ${upsertError.message || JSON.stringify(upsertError)}`);
        }
      }

      // Verify that prompts were saved
      const verificationPrompts = await supabase
        .from('generation_prompts')
        .select('id, prompt_order')
        .in('generation_id', selectedGenerations)
        .eq('content_type', contentType)
        .eq('language', language);
      
      if (verificationPrompts.error) {
        throw new Error(t('Failed to verify saved prompts', 'Fehler beim Verifizieren der gespeicherten Prompts'));
      }
      
      const savedCount = verificationPrompts.data?.length || 0;
      const expectedCount = selectedGenerations.length * promptSlots.filter(s => s.systemPrompt.trim() && s.userPromptTemplate.trim()).length;
      
      if (savedCount < expectedCount) {
        console.warn(`Expected ${expectedCount} prompts, but only ${savedCount} were saved`);
        setError(t(
          `Warning: Expected ${expectedCount} prompts but only ${savedCount} were saved. Please check the database.`,
          `Warnung: ${expectedCount} Prompts erwartet, aber nur ${savedCount} gespeichert. Bitte Datenbank überprüfen.`
        ));
      } else {
        setSavedPromptsCount(savedCount);
        setLastSavedAt(new Date());
        setSuccess(t(
          `✅ Prompts successfully saved for ${selectedGenerations.length} generation(s). ${savedCount} prompt entries verified in database. All prompts are now active and will be used in generation.`,
          `✅ Prompts erfolgreich für ${selectedGenerations.length} Generation(en) gespeichert. ${savedCount} Prompt-Einträge in der Datenbank verifiziert. Alle Prompts sind jetzt aktiv und werden bei der Generierung verwendet.`
        ));
      }
    } catch (err: any) {
      console.error('Error saving prompts:', err);
      const errorMessage = err?.message || err?.error?.message || JSON.stringify(err) || t('Failed to save prompts', 'Fehler beim Speichern der Prompts');
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const selectedGenerationsData = allGenerations.filter(g => selectedGenerations.includes(g.id));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-black dark:to-slate-950 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">
              {t('Multi-Generation Prompt Manager', 'Multi-Generation Prompt-Manager')}
            </h1>
            <Link
              href={`/${lang}/mass-generation`}
              className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-700 transition-all text-sm font-medium"
            >
              {t('Back to Mass Generation', 'Zurück zur Massen-Generierung')}
            </Link>
          </div>
          <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base">
            {t(
              'Manage prompts for multiple generations simultaneously. Create variance through different prompts that rotate every 5 batches. Target 5000 high-quality, high-search-volume questions per generation with maximum variance and no duplicates.',
              'Verwalten Sie Prompts für mehrere Generationen gleichzeitig. Erstellen Sie Varianz durch verschiedene Prompts, die alle 5 Batches rotieren. Ziel: 5000 hochwertige Fragen mit hohem Suchvolumen pro Generation, maximale Varianz, keine Duplikate.'
            )}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-lg">
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/30 rounded-lg">
            <p className="text-sm text-green-800 dark:text-green-200 font-medium">{success}</p>
            {lastSavedAt && (
              <p className="text-xs text-green-700 dark:text-green-300 mt-2">
                {t('Saved at', 'Gespeichert um')}: {lastSavedAt.toLocaleString()} | {t('Total prompts in database', 'Gesamt Prompts in Datenbank')}: {savedPromptsCount}
              </p>
            )}
          </div>
        )}
        
        {savedPromptsCount > 0 && lastSavedAt && (
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/30 rounded-lg">
            <p className="text-xs text-blue-800 dark:text-blue-200">
              {t('Status', 'Status')}: {t('Prompts are saved and active', 'Prompts sind gespeichert und aktiv')} | 
              {t('Last saved', 'Zuletzt gespeichert')}: {lastSavedAt.toLocaleString()} | 
              {t('Total', 'Gesamt')}: {savedPromptsCount} {t('prompts', 'Prompts')}
            </p>
          </div>
        )}

        {/* Multi-Selection */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-lg mb-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
            {t('Select Generations', 'Generationen auswählen')}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  {t('Brands', 'Marken')} ({selectedBrands.length} {t('selected', 'ausgewählt')})
                </label>
                <button
                  type="button"
                  onClick={() => {
                    if (selectedBrands.length === brands.length) {
                      setSelectedBrands([]);
                    } else {
                      setSelectedBrands(brands.map(b => b.id));
                    }
                    setSelectedModels([]);
                    setSelectedGenerations([]);
                  }}
                  className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-all"
                >
                  {selectedBrands.length === brands.length 
                    ? t('Deselect All', 'Alle abwählen')
                    : t('Select All', 'Alle auswählen')
                  }
                </button>
              </div>
              <select
                multiple
                value={selectedBrands}
                onChange={(e) => {
                  const values = Array.from(e.target.selectedOptions, opt => opt.value);
                  setSelectedBrands(values);
                  setSelectedModels([]);
                  setSelectedGenerations([]);
                }}
                size={5}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              >
                {brands.map(brand => (
                  <option key={brand.id} value={brand.id}>{brand.name}</option>
                ))}
              </select>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {t('Hold Ctrl/Cmd to select multiple, or use "Select All"', 'Strg/Cmd gedrückt halten für Mehrfachauswahl, oder "Alle auswählen" verwenden')}
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  {t('Models', 'Modelle')} ({selectedModels.length} {t('selected', 'ausgewählt')})
                </label>
                {models.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedModels.length === models.length) {
                        setSelectedModels([]);
                      } else {
                        setSelectedModels(models.map(m => m.id));
                      }
                      setSelectedGenerations([]);
                    }}
                    disabled={selectedBrands.length === 0}
                    className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {selectedModels.length === models.length 
                      ? t('Deselect All', 'Alle abwählen')
                      : t('Select All', 'Alle auswählen')
                    }
                  </button>
                )}
              </div>
              <select
                multiple
                value={selectedModels}
                onChange={(e) => {
                  const values = Array.from(e.target.selectedOptions, opt => opt.value);
                  setSelectedModels(values);
                  setSelectedGenerations([]);
                }}
                disabled={selectedBrands.length === 0}
                size={5}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-400 disabled:opacity-50"
              >
                {models.map(model => (
                  <option key={model.id} value={model.id}>{model.name}</option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  {t('Generations', 'Generationen')} ({selectedGenerations.length} {t('selected', 'ausgewählt')})
                </label>
                {allGenerations.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedGenerations.length === allGenerations.length) {
                        setSelectedGenerations([]);
                      } else {
                        setSelectedGenerations(allGenerations.map(g => g.id));
                      }
                    }}
                    disabled={selectedModels.length === 0}
                    className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {selectedGenerations.length === allGenerations.length 
                      ? t('Deselect All', 'Alle abwählen')
                      : t('Select All', 'Alle auswählen')
                    }
                  </button>
                )}
              </div>
              <select
                multiple
                value={selectedGenerations}
                onChange={(e) => {
                  const values = Array.from(e.target.selectedOptions, opt => opt.value);
                  setSelectedGenerations(values);
                }}
                disabled={selectedModels.length === 0}
                size={5}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-400 disabled:opacity-50"
              >
                {allGenerations.map(gen => (
                  <option key={gen.id} value={gen.id}>
                    {gen.brand_name} {gen.model_name} {gen.name} {gen.generation_code && `(${gen.generation_code})`}
                  </option>
                ))}
              </select>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {t('Select specific generations or use "Select All" to apply to all visible generations', 'Spezifische Generationen auswählen oder "Alle auswählen" verwenden, um auf alle sichtbaren Generationen anzuwenden')}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                {t('Content Type', 'Inhaltstyp')}
              </label>
              <select
                value={contentType}
                onChange={(e) => setContentType(e.target.value as 'fault' | 'manual')}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              >
                <option value="fault">{t('Fault', 'Fehler')}</option>
                <option value="manual">{t('Manual', 'Anleitung')}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                {t('Language', 'Sprache')}
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as 'en' | 'de')}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              >
                <option value="en">EN</option>
                <option value="de">DE</option>
              </select>
            </div>
          </div>

          {selectedGenerations.length > 0 && (
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-bold text-blue-900 dark:text-blue-200">
                  {t('Selected', 'Ausgewählt')}: {selectedGenerations.length} {t('generation(s)', 'Generation(en)')}
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  {t('Variance will be applied to all selected generations', 'Varianz wird auf alle ausgewählten Generationen angewendet')}
                </p>
              </div>
              <div className="mt-2 p-2 bg-blue-100 dark:bg-blue-900/30 rounded text-xs text-blue-800 dark:text-blue-200">
                <p className="font-medium mb-1">{t('Note', 'Hinweis')}:</p>
                <p>
                  {t('The same variance (Variance Area & Topic Focus) will be applied to all selected generations. The prompts will automatically adapt to each specific brand, model, and generation through placeholders like {brand}, {model}, {generation}. This ensures good coverage and variance within each model while maintaining consistency across all models.', 'Die gleiche Varianz (Varianz-Bereich & Themen-Fokus) wird auf alle ausgewählten Generationen angewendet. Die Prompts passen sich automatisch an jede spezifische Marke, Modell und Generation durch Platzhalter wie {brand}, {model}, {generation} an. Dies gewährleistet eine gute Abdeckung und Varianz innerhalb jedes Modells bei gleichbleibender Konsistenz über alle Modelle hinweg.')}
                </p>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {selectedGenerationsData.slice(0, 10).map(gen => (
                  <span key={gen.id} className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded">
                    {gen.brand_name} {gen.model_name} {gen.name}
                  </span>
                ))}
                {selectedGenerationsData.length > 10 && (
                  <span className="text-xs px-2 py-1 text-blue-600 dark:text-blue-400">
                    +{selectedGenerationsData.length - 10} {t('more', 'mehr')}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* View Mode Toggle & Preset Configuration */}
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('master')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                viewMode === 'master'
                  ? 'bg-red-600 dark:bg-red-500 text-white'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              {t('Master Template', 'Master-Vorlage')}
            </button>
            <button
              onClick={() => setViewMode('slots')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                viewMode === 'slots'
                  ? 'bg-red-600 dark:bg-red-500 text-white'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              {t('Prompt Slots (1-25)', 'Prompt-Slots (1-25)')}
            </button>
          </div>
          
          {viewMode === 'slots' && (
            <button
              onClick={applyOptimizedPresets}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-500 dark:to-purple-500 text-white rounded-lg font-bold hover:from-blue-700 hover:to-purple-700 dark:hover:from-blue-600 dark:hover:to-purple-600 transition-all shadow-lg"
            >
              {t('🎯 Apply Optimized Preset Configuration', '🎯 Optimierte Preset-Konfiguration anwenden')}
            </button>
          )}
        </div>

        {/* Master Template View */}
        {viewMode === 'master' && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-lg mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {t('Master Prompt Template', 'Master-Prompt-Vorlage')}
              </h2>
              <button
                onClick={applyMasterToSlots}
                className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-700 dark:hover:bg-blue-600 transition-all"
              >
                {t('Apply to All Slots', 'Auf alle Slots anwenden')}
              </button>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              {t('This is the base template. Use {VARIANCE_AREA} and {TOPIC_FOCUS} placeholders for variance. The prompts will automatically adapt to each brand/model/generation through {brand}, {model}, {generation} placeholders. Apply to all slots, then customize each slot individually with variance presets.', 'Dies ist die Basis-Vorlage. Verwenden Sie {VARIANCE_AREA} und {TOPIC_FOCUS} Platzhalter für Varianz. Die Prompts passen sich automatisch an jede Marke/Modell/Generation durch {brand}, {model}, {generation} Platzhalter an. Auf alle Slots anwenden, dann jeden Slot individuell mit Varianz-Presets anpassen.')}
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  {t('System Prompt', 'System-Prompt')}
                </label>
                <textarea
                  value={masterSystemPrompt}
                  onChange={(e) => setMasterSystemPrompt(e.target.value)}
                  rows={8}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  {t('User Prompt Template', 'User-Prompt-Vorlage')}
                  <span className="text-xs text-slate-500 dark:text-slate-400 ml-2">
                    ({t('Placeholders: {brand}, {model}, {generation}, {generationCode}, {count}, {yearRange}, {existingQuestions}, {VARIANCE_AREA}, {TOPIC_FOCUS}', 'Platzhalter: {brand}, {model}, {generation}, {generationCode}, {count}, {yearRange}, {existingQuestions}, {VARIANCE_AREA}, {TOPIC_FOCUS}')})
                  </span>
                </label>
                <textarea
                  value={masterUserPromptTemplate}
                  onChange={(e) => setMasterUserPromptTemplate(e.target.value)}
                  rows={12}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-mono text-sm"
                />
              </div>
            </div>
          </div>
        )}

        {/* Prompt Slots View */}
        {viewMode === 'slots' && (
          <div className="space-y-6">
            {promptSlots.map((slot, index) => (
              <PromptSlotEditor
                key={slot.order}
                slot={slot}
                onUpdate={(updated) => {
                  const newSlots = [...promptSlots];
                  newSlots[index] = updated;
                  setPromptSlots(newSlots);
                }}
                t={t}
              />
            ))}
          </div>
        )}

        {/* Bulk Save Button */}
        {selectedGenerations.length > 0 && (
          <div className="mt-6 flex justify-end">
            <button
              onClick={handleBulkSave}
              disabled={saving || loading}
              className="px-6 py-3 bg-red-600 dark:bg-red-500 text-white rounded-lg font-bold hover:bg-red-700 dark:hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-lg"
            >
              {saving
                ? t('Saving...', 'Speichere...')
                : t(`Save Prompts for ${selectedGenerations.length} Generation(s)`, `Prompts für ${selectedGenerations.length} Generation(en) speichern`)
              }
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function PromptSlotEditor({
  slot,
  onUpdate,
  t,
}: {
  slot: {
    order: number;
    systemPrompt: string;
    userPromptTemplate: string;
    varianceArea: string;
    topicFocus: string;
    varianceLabel?: string;
    model: string;
    temperature: number;
    maxTokens: number;
  };
  onUpdate: (slot: PromptSlot) => void;
  t: (en: string, de: string) => string;
}) {
  const [variancePreset, setVariancePreset] = useState<string>('');
  const [topicPreset, setTopicPreset] = useState<string>('');

  const handleVariancePresetChange = (value: string) => {
    setVariancePreset(value);
    if (value) {
      const preset = VARIANCE_AREA_PRESETS.find(p => p.label === value);
      if (preset) {
        onUpdate({ ...slot, varianceArea: preset.value, varianceLabel: undefined });
      }
    }
  };

  const handleTopicPresetChange = (value: string) => {
    setTopicPreset(value);
    if (value) {
      const preset = TOPIC_FOCUS_PRESETS.find(p => p.label === value);
      if (preset) {
        onUpdate({ ...slot, topicFocus: preset.value });
      }
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-200 dark:border-slate-800 p-6 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
          {t('Prompt Slot', 'Prompt-Slot')} {slot.order} {t('(Questions', '(Fragen')} {(slot.order - 1) * 200 + 1}-{slot.order * 200}, {t('Batches', 'Batches')} {Math.floor((slot.order - 1) * 200 / 50) + 1}-{Math.floor(slot.order * 200 / 50)}{')'}
        </h3>
        {slot.varianceLabel && (
          <span className="px-3 py-1 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 text-blue-800 dark:text-blue-200 rounded-lg text-xs font-medium border border-blue-200 dark:border-blue-800">
            {slot.varianceLabel}
          </span>
        )}
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            {t('System Prompt', 'System-Prompt')}
          </label>
          <textarea
            value={slot.systemPrompt}
            onChange={(e) => onUpdate({ ...slot, systemPrompt: e.target.value })}
            rows={6}
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-mono text-sm"
            placeholder={t('System prompt for this slot...', 'System-Prompt für diesen Slot...')}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            {t('User Prompt Template', 'User-Prompt-Vorlage')}
          </label>
          <textarea
            value={slot.userPromptTemplate}
            onChange={(e) => onUpdate({ ...slot, userPromptTemplate: e.target.value })}
            rows={8}
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-mono text-sm"
            placeholder={t('User prompt template with placeholders...', 'User-Prompt-Vorlage mit Platzhaltern...')}
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              {t('Variance Area', 'Varianz-Bereich')} ({t('Optional - replaces {VARIANCE_AREA}', 'Optional - ersetzt {VARIANCE_AREA}')})
            </label>
            <select
              value={variancePreset}
              onChange={(e) => handleVariancePresetChange(e.target.value)}
              className="px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
            >
              <option value="">{t('Select Preset...', 'Preset auswählen...')}</option>
              {VARIANCE_AREA_PRESETS.map(preset => (
                <option key={preset.label} value={preset.label}>{preset.label}</option>
              ))}
            </select>
          </div>
          <textarea
            value={slot.varianceArea}
            onChange={(e) => {
              onUpdate({ ...slot, varianceArea: e.target.value, varianceLabel: undefined });
              setVariancePreset(''); // Clear preset selection when manually editing
            }}
            rows={6}
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm font-mono"
            placeholder={t('Add specific variance instructions, focus areas, or constraints for this slot...', 'Spezifische Varianz-Anweisungen, Fokus-Bereiche oder Einschränkungen für diesen Slot hinzufügen...')}
          />
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {t('Select a preset above or type custom variance instructions. This will guide the AI to focus on specific problem categories.', 'Wählen Sie ein Preset oben oder geben Sie benutzerdefinierte Varianz-Anweisungen ein. Dies leitet die KI an, sich auf spezifische Problemkategorien zu konzentrieren.')}
          </p>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              {t('Topic Focus', 'Themen-Fokus')} ({t('Optional - replaces {TOPIC_FOCUS}', 'Optional - ersetzt {TOPIC_FOCUS}')})
            </label>
            <select
              value={topicPreset}
              onChange={(e) => handleTopicPresetChange(e.target.value)}
              className="px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
            >
              <option value="">{t('Select Preset...', 'Preset auswählen...')}</option>
              {TOPIC_FOCUS_PRESETS.map(preset => (
                <option key={preset.label} value={preset.label}>{preset.label}</option>
              ))}
            </select>
          </div>
          <textarea
            value={slot.topicFocus}
            onChange={(e) => {
              onUpdate({ ...slot, topicFocus: e.target.value });
              setTopicPreset(''); // Clear preset selection when manually editing
            }}
            rows={4}
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm font-mono"
            placeholder={t('Focus on specific topics (e.g., "Focus on engine and transmission issues", "Prioritize electrical problems")', 'Fokus auf spezifische Themen (z.B. "Fokus auf Motor- und Getriebeprobleme", "Priorisiere elektrische Probleme")')}
          />
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {t('Select a preset above or type custom topic focus. This prioritizes specific problem types or search patterns.', 'Wählen Sie ein Preset oben oder geben Sie einen benutzerdefinierten Themen-Fokus ein. Dies priorisiert spezifische Problemtypen oder Suchmuster.')}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              {t('Model', 'Modell')}
            </label>
            <input
              type="text"
              value={slot.model}
              onChange={(e) => onUpdate({ ...slot, model: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              {t('Temperature', 'Temperatur')}
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="2"
              value={slot.temperature}
              onChange={(e) => onUpdate({ ...slot, temperature: parseFloat(e.target.value) || 0.8 })}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              {t('Max Tokens', 'Max Tokens')}
            </label>
            <input
              type="number"
              value={slot.maxTokens}
              onChange={(e) => onUpdate({ ...slot, maxTokens: parseInt(e.target.value) || 5000 })}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
