import { NextResponse } from 'next/server';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

function getOpenAIApiKey() {
  const apiKey = process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('Missing OpenAI API key');
  }
  return apiKey;
}

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(supabaseUrl, supabaseKey);
}

export async function POST(req: Request) {
  try {
    const { 
      questionsFileUrl,
      contentType = 'fault',
      brandIds = [],
      generationIds = [],
      questionsPerGeneration = 0,
    } = await req.json();

    if (!questionsFileUrl) {
      return NextResponse.json({ error: 'Missing questionsFileUrl' }, { status: 400 });
    }

    // Read the TXT questions file
    const questionsFilename = questionsFileUrl.replace('/generated/', '');
    const questionsFilePath = join(process.cwd(), 'public', 'generated', questionsFilename);
    
    if (!existsSync(questionsFilePath)) {
      return NextResponse.json({ error: 'Questions file not found' }, { status: 404 });
    }

    if (!questionsFilename.endsWith('.txt')) {
      return NextResponse.json({ error: 'File must be a .txt file' }, { status: 400 });
    }

    let questionsTxt: string;
    try {
      questionsTxt = await readFile(questionsFilePath, 'utf-8');
    } catch (err) {
      return NextResponse.json({ error: 'Failed to read questions file' }, { status: 500 });
    }

    // Parse questions (one per line)
    const questions = questionsTxt
      .split('\n')
      .map(q => q.trim())
      .filter(q => q.length > 0);

    if (questions.length === 0) {
      return NextResponse.json({ error: 'No questions found in file' }, { status: 400 });
    }

    const apiKey = getOpenAIApiKey();
    const MODEL_ANSWERS = process.env.BATCH_MODEL_ANSWERS || 'gpt-4o-mini';
    
    // Enhanced system prompt (same as Carbulk for quality)
    const systemPrompt = contentType === 'fault'
      ? `You are an expert automotive technician and repair specialist. Provide detailed, step-by-step solutions for car problems and maintenance procedures.

Your answers MUST include:
- Detailed step-by-step instructions
- Specific symptoms the user might experience (e.g., "Check engine light", "Rough idle", "Loss of power", "Stalling", "Poor fuel economy")
- Diagnostic steps to identify the problem (e.g., "Scan for error codes", "Check fluid levels", "Inspect components", "Test with multimeter")
- Specific tools required (e.g., "OBD-II scanner", "Multimeter", "Socket set", "Torque wrench", "Fuel pressure gauge")
- Parts/components that may need replacement
- Estimated time for the repair/maintenance
- Safety warnings if applicable

Be technically accurate, specific, and practical. Use proper automotive terminology.
Do not mention AI, do not refer to yourself, and do not simulate a human persona.
Format your response with clear headings and structured steps. Include sections for: Problem Statement, Symptoms, Diagnostic Steps, Repair Instructions, Verification, and Prevention Tips when applicable.`
      : `You are an expert automotive technician and repair specialist. Provide detailed, step-by-step maintenance and repair procedures.

Your answers MUST include:
- Detailed step-by-step instructions
- Specific tools required (e.g., "Socket set", "Torque wrench", "Multimeter", "Drain pan")
- Parts/components needed
- Estimated time for the procedure
- Safety warnings if applicable
- Diagnostic steps if troubleshooting is needed

Be technically accurate, specific, and practical. Use proper automotive terminology.
Do not mention AI, do not refer to yourself, and do not simulate a human persona.
Format your response with clear headings and structured steps. Include sections for: Procedure Overview, Tools Required, Parts Required, Step-by-Step Instructions, Verification, and Safety Tips when applicable.`;

    // Fetch generation data for context (if generationIds provided)
    const generationDataMap = new Map<string, { brand: string; model: string; generation: string; generationCode: string | null }>();
    
    if (generationIds.length > 0) {
      const supabase = getSupabaseClient();
      const { data: generationsData } = await supabase
        .from('model_generations')
        .select('id, name, generation_code, car_models!inner(id, name, car_brands!inner(id, name))')
        .in('id', generationIds);

      if (generationsData) {
        for (const gen of generationsData) {
          const model = (gen.car_models as any);
          const brand = model?.car_brands?.[0] || model?.car_brands;
          if (brand && model) {
            generationDataMap.set(gen.id, {
              brand: brand.name,
              model: model.name,
              generation: gen.name,
              generationCode: gen.generation_code,
            });
          }
        }
      }
    }

    // Build JSONL lines
    const jsonlLines: any[] = [];
    
    // Map questions to generations
    // If we have generationIds and questionsPerGeneration, map correctly
    // Otherwise, distribute evenly
    let questionIndex = 0;

    for (const question of questions) {
      let generationId: string;
      
      if (generationIds.length > 0 && questionsPerGeneration > 0) {
        // Map questions to generations based on questionsPerGeneration
        const generationIndex = Math.floor(questionIndex / questionsPerGeneration);
        generationId = generationIndex < generationIds.length 
          ? generationIds[generationIndex] 
          : generationIds[generationIds.length - 1]; // Use last generation if overflow
      } else if (generationIds.length > 0) {
        // Distribute evenly if we don't know questionsPerGeneration
        const questionsPerGen = Math.ceil(questions.length / generationIds.length);
        const generationIndex = Math.floor(questionIndex / questionsPerGen);
        generationId = generationIndex < generationIds.length 
          ? generationIds[generationIndex] 
          : generationIds[generationIds.length - 1];
      } else {
        // No generation IDs provided, use generic format
        generationId = `gen-${Math.floor(questionIndex / 100)}`;
      }

      // Get generation context for user prompt (like Carbulk)
      const genData = generationDataMap.get(generationId);
      const userPrompt = genData
        ? `${question} - ${genData.brand} ${genData.model} ${genData.generation}${genData.generationCode ? ` (${genData.generationCode})` : ''}`
        : question;

      jsonlLines.push({
        custom_id: `answer-${generationId}-${questionIndex + 1}`,
        method: 'POST',
        url: '/v1/chat/completions',
        body: {
          model: MODEL_ANSWERS,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.7,
          max_tokens: 2000,
        }
      });
      questionIndex++;
    }

    // Save JSONL file
    const jsonlContent = jsonlLines
      .map(line => JSON.stringify(line))
      .join('\n');

    const timestamp = Date.now();
    const jsonlFilename = questionsFilename.replace('.txt', `-${timestamp}.jsonl`);
    const publicDir = join(process.cwd(), 'public', 'generated');
    
    try {
      await mkdir(publicDir, { recursive: true });
    } catch (err: any) {
      if (err.code !== 'EEXIST') {
        throw err;
      }
    }

    const jsonlFilePath = join(publicDir, jsonlFilename);
    await writeFile(jsonlFilePath, jsonlContent, 'utf-8');

    return NextResponse.json({
      success: true,
      fileUrl: `/generated/${jsonlFilename}`,
      filename: jsonlFilename,
      count: jsonlLines.length,
      questionsCount: questions.length,
    });
  } catch (error) {
    console.error('Build JSONL error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

