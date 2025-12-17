import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes

const OPENAI_API_URL = 'https://api.openai.com/v1';

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase credentials');
  }
  
  return createClient(supabaseUrl, supabaseKey);
}

// Load prompts from database for a generation
async function loadGenerationPrompts(
  supabase: any,
  generationId: string,
  contentType: 'fault' | 'manual',
  language: 'en' | 'de'
): Promise<Array<{
  prompt_order: number;
  system_prompt: string;
  user_prompt_template: string;
  model: string;
  temperature: number;
  max_tokens: number;
}>> {
  try {
    const { data, error } = await supabase
      .from('generation_prompts')
      .select('prompt_order, system_prompt, user_prompt_template, model, temperature, max_tokens')
      .eq('generation_id', generationId)
      .eq('content_type', contentType)
      .eq('language', language)
      .eq('is_active', true)
      .order('prompt_order');
    
    if (error) {
      console.error('Error loading prompts:', error);
      return [];
    }
    
    return data || [];
  } catch (err) {
    console.error('Error loading prompts:', err);
    return [];
  }
}

// Get prompt for a specific batch (rotates every 4 batches for 25 slots = 200 questions per slot)
function getPromptForBatch(
  prompts: Array<{ prompt_order: number; system_prompt: string; user_prompt_template: string; model: string; temperature: number; max_tokens: number }>,
  batchNumber: number,
  brand: string,
  model: string,
  generation: string,
  generationCode: string | null,
  totalBatches: number,
  batchCount: number
): {
  systemPrompt: string;
  userPrompt: string;
  model: string;
  temperature: number;
  maxTokens: number;
} {
  // If no custom prompts, return default
  if (prompts.length === 0) {
    const defaultSystemPrompt = `You are an expert in automotive search queries and technical knowledge bases. You know the most frequently searched problems for each car model.

CRITICALLY IMPORTANT - MUST BE FOLLOWED EXACTLY:
- You MUST generate EXACTLY ${batchCount} questions - NOT fewer, NOT more
- If you generate fewer than ${batchCount} questions, your response is INCOMPLETE and UNUSABLE
- Count your questions before outputting - there must be EXACTLY ${batchCount}
- Prioritize questions by search frequency (most searched first)
- Use natural search query formulations
- Each question must be specific to this model/generation
- No repetitions or similar questions
- Output ONLY the questions, one per line, with proper spacing and normal sentence formatting
- No numbering, no answers, no introduction, no duplicates
- Write normal, readable sentences as people would search for them
- GENERATE EXACTLY ${batchCount} QUESTIONS - THIS IS A HARD REQUIREMENT`;

    const defaultUserPrompt = `Generate exactly ${batchCount} unique questions about ${brand} ${model} ${generation}${generationCode ? ` (${generationCode})` : ''}. Do not repeat questions from previous batches. Each question must be distinct and specific to ${brand} ${model} ${generation}.`;

    return {
      systemPrompt: defaultSystemPrompt,
      userPrompt: defaultUserPrompt,
      model: 'gpt-4o-mini',
      temperature: 0.8,
      maxTokens: 5000,
    };
  }
  
  // Rotate prompt every 4 batches (200 questions per slot):
  // Batches 1-4 use prompt 1, batches 5-8 use prompt 2, etc.
  const BATCHES_PER_SLOT = 4; // 200 questions / 50 batch size = 4 batches
  const promptIndex = Math.floor((batchNumber - 1) / BATCHES_PER_SLOT) % prompts.length;
  const selectedPrompt = prompts[promptIndex];
  
  // Replace placeholders in user prompt template
  let userPrompt = selectedPrompt.user_prompt_template
    .replace(/{brand}/g, brand)
    .replace(/{model}/g, model)
    .replace(/{generation}/g, generation)
    .replace(/{generationCode}/g, generationCode || '')
    .replace(/{batchNumber}/g, batchNumber.toString())
    .replace(/{totalBatches}/g, totalBatches.toString());
  
  // Add batch-specific instructions
  userPrompt = `${userPrompt}

CRITICAL REQUIREMENT - MUST BE FOLLOWED EXACTLY:
You MUST generate EXACTLY ${batchCount} unique questions - NOT ${batchCount - 1}, NOT ${batchCount + 1}, EXACTLY ${batchCount}.
This is a HARD REQUIREMENT. Your response is INCOMPLETE and UNUSABLE if you generate fewer than ${batchCount} questions.

BEFORE OUTPUTTING:
1. Count your questions carefully
2. Ensure you have EXACTLY ${batchCount} questions
3. If you have fewer, generate more until you reach ${batchCount}
4. If you have more, remove the extras until you have exactly ${batchCount}

QUALITY REQUIREMENTS:
- Each question must be distinct and specific to ${brand} ${model} ${generation}
- Do not repeat questions from previous batches
- Use natural, searchable question formats that real users would type
- Prioritize high-search-volume problems and issues
- Ensure questions are unique and not too similar to each other

OUTPUT FORMAT:
- One question per line
- No numbering, no bullets, no prefixes
- Just the question text, one per line
- EXACTLY ${batchCount} lines of questions

OUTPUT EXACTLY ${batchCount} QUESTIONS - THIS IS MANDATORY AND NON-NEGOTIABLE.`;
  
  return {
    systemPrompt: selectedPrompt.system_prompt,
    userPrompt,
    model: selectedPrompt.model,
    temperature: selectedPrompt.temperature,
    maxTokens: Math.max(selectedPrompt.max_tokens || 5000, batchCount * 100),
  };
}

export async function POST(req: Request) {
  try {
    const { brandIds, generationIds, contentType = 'fault', language = 'en', questionsPerGeneration = 5000 } = await req.json();

    if (!brandIds || !Array.isArray(brandIds) || brandIds.length === 0) {
      return NextResponse.json({ error: 'Missing or invalid brandIds' }, { status: 400 });
    }

    if (!generationIds || !Array.isArray(generationIds) || generationIds.length === 0) {
      return NextResponse.json({ error: 'Missing or invalid generationIds' }, { status: 400 });
    }

    const supabase = getSupabaseClient();
    const BATCH_SIZE = 50; // 50 questions per batch
    const batchesPerGeneration = Math.ceil(questionsPerGeneration / BATCH_SIZE);

    // Load generation data with brand and model info
    const { data: generationsData, error: generationsError } = await supabase
      .from('model_generations')
      .select(`
        id,
        name,
        slug,
        generation_code,
        year_start,
        year_end,
        car_models (
          id,
          name,
          slug,
          brand_id,
          car_brands (
            id,
            name,
            slug
          )
        )
      `)
      .in('id', generationIds);

    if (generationsError) {
      return NextResponse.json({ error: `Failed to load generations: ${generationsError.message}` }, { status: 500 });
    }

    if (!generationsData || generationsData.length === 0) {
      return NextResponse.json({ error: 'No generations found' }, { status: 404 });
    }

    // Build JSONL lines for OpenAI Batch API
    const jsonlLines: string[] = [];
    let totalBatches = 0;

    for (const generation of generationsData) {
      const model = generation.car_models as any;
      const brand = model.car_brands as any;

      if (!brand || !model) {
        console.warn(`Skipping generation ${generation.id} - missing brand or model data`);
        continue;
      }

      const generationId = generation.id;
      const brandName = brand.name;
      const modelName = model.name;
      const generationName = generation.name;
      const generationCode = generation.generation_code || null;

      // Load prompts for this generation
      const customPrompts = await loadGenerationPrompts(
        supabase,
        generationId,
        contentType as 'fault' | 'manual',
        language as 'en' | 'de'
      );

      // Generate JSONL entries for all batches of this generation
      for (let batchNumber = 1; batchNumber <= batchesPerGeneration; batchNumber++) {
        const batchIndex = batchNumber - 1;
        const batchCount = batchIndex === batchesPerGeneration - 1 
          ? questionsPerGeneration - (batchIndex * BATCH_SIZE) 
          : BATCH_SIZE;

        // Get prompt for this batch
        const promptData = getPromptForBatch(
          customPrompts,
          batchNumber,
          brandName,
          modelName,
          generationName,
          generationCode,
          batchesPerGeneration,
          batchCount
        );

        // Create JSONL entry in OpenAI Batch API format
        const batchEntry = {
          custom_id: `question-${generationId}-${batchNumber}`,
          method: 'POST',
          url: '/v1/chat/completions',
          body: {
            model: promptData.model,
            messages: [
              { role: 'system', content: promptData.systemPrompt },
              { role: 'user', content: promptData.userPrompt }
            ],
            temperature: promptData.temperature,
            max_tokens: promptData.maxTokens,
          },
        };

        jsonlLines.push(JSON.stringify(batchEntry));
        totalBatches++;
      }
    }

    if (jsonlLines.length === 0) {
      return NextResponse.json({ error: 'No batches generated' }, { status: 400 });
    }

    // Create JSONL content
    const jsonlContent = jsonlLines.join('\n');

    // Save file
    const timestamp = Date.now();
    const filename = `questions-batch-${generationIds.length}gens-${totalBatches}batches-${timestamp}.jsonl`;
    const publicDir = join(process.cwd(), 'public', 'generated');

    try {
      await mkdir(publicDir, { recursive: true });
      const filePath = join(publicDir, filename);
      await writeFile(filePath, jsonlContent, 'utf-8');

      const fileUrl = `/generated/${filename}`;

      return NextResponse.json({
        success: true,
        filename,
        fileUrl,
        totalBatches,
        totalGenerations: generationsData.length,
        questionsPerGeneration,
        batchesPerGeneration,
      });
    } catch (fileError) {
      console.error('Error saving file:', fileError);
      return NextResponse.json(
        { error: `Failed to save file: ${fileError instanceof Error ? fileError.message : 'Unknown error'}` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Transform to JSONL error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}









