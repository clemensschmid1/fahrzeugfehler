import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase credentials');
  }
  
  return createClient(supabaseUrl, supabaseKey);
}

function getOpenAIApiKey() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not set');
  }
  return apiKey;
}

export async function POST(req: Request) {
  try {
    const contentTypeHeader = req.headers.get('content-type') || '';
    let questionsOutputJsonl: string;
    let contentType: string = 'fault';
    let brandIds: string[] = [];
    let generationIds: string[] = [];

    if (contentTypeHeader.includes('multipart/form-data')) {
      // Handle file upload
      const formData = await req.formData();
      const questionsOutputFile = formData.get('questionsOutputFile') as File;
      contentType = (formData.get('contentType') as string) || 'fault';
      const brandIdsStr = formData.get('brandIds') as string;
      brandIds = brandIdsStr ? JSON.parse(brandIdsStr) : [];
      const generationIdsStr = formData.get('generationIds') as string;
      generationIds = generationIdsStr ? JSON.parse(generationIdsStr) : [];

      if (!questionsOutputFile) {
        return NextResponse.json({ error: 'Missing questionsOutputFile' }, { status: 400 });
      }

      questionsOutputJsonl = await questionsOutputFile.text();
    } else {
      // Handle fileUrl
      const { 
        questionsOutputFileUrl,
        contentType: contentTypeParam = 'fault',
        brandIds: brandIdsParam = [],
        generationIds: generationIdsParam = [],
      } = await req.json();
      
      contentType = contentTypeParam;
      brandIds = brandIdsParam;
      generationIds = generationIdsParam;

      if (!questionsOutputFileUrl) {
        return NextResponse.json({ error: 'Missing questionsOutputFileUrl' }, { status: 400 });
      }

      // Download from URL or read from local file
      if (questionsOutputFileUrl.startsWith('http')) {
        const response = await fetch(questionsOutputFileUrl);
        if (!response.ok) {
          return NextResponse.json({ error: 'Failed to download questions output file' }, { status: 500 });
        }
        questionsOutputJsonl = await response.text();
      } else {
        // Local file path
        const filePath = join(process.cwd(), 'public', questionsOutputFileUrl.replace(/^\//, ''));
        questionsOutputJsonl = await require('fs/promises').readFile(filePath, 'utf-8');
      }
    }

    // Parse questions output JSONL (from OpenAI Batch API)
    const questionsOutputLines = questionsOutputJsonl
      .trim()
      .split('\n')
      .filter(line => line.trim());

    if (questionsOutputLines.length === 0) {
      return NextResponse.json({ error: 'No data found in questions output file' }, { status: 400 });
    }

    // Parse each line and extract questions
    const questions: Array<{ question: string; customId: string; generationId?: string }> = [];
    
    for (const line of questionsOutputLines) {
      try {
        const result = JSON.parse(line);
        
        // Extract question from OpenAI Batch API response format
        // Format: { "custom_id": "...", "response": { "body": { "choices": [{ "message": { "content": "..." } }] } } }
        const questionContent = result.response?.body?.choices?.[0]?.message?.content?.trim();
        
        if (!questionContent) {
          console.warn('Skipping line with no question content:', result.custom_id);
          continue;
        }

        // Parse custom_id to extract generationId if available
        // Format: question-{generationId}-{batchNumber}
        const customId = result.custom_id || '';
        const generationIdMatch = customId.match(/question-([^-]+)-/);
        const generationId = generationIdMatch ? generationIdMatch[1] : undefined;

        // Split question content into individual questions (one per line)
        const questionLines = questionContent
          .split('\n')
          .map(q => q.trim())
          .filter(q => q.length > 0 && !q.match(/^\d+[\.\)]/)); // Remove numbering

        for (const question of questionLines) {
          questions.push({
            question,
            customId,
            generationId,
          });
        }
      } catch (error) {
        console.error('Error parsing line:', error);
        continue;
      }
    }

    if (questions.length === 0) {
      return NextResponse.json({ error: 'No valid questions extracted from output file' }, { status: 400 });
    }

    // Load generation data to get brand/model/generation info for prompts
    const supabase = getSupabaseClient();
    const generationsMap = new Map<string, any>();

    if (generationIds.length > 0) {
      const { data: generationsData } = await supabase
        .from('model_generations')
        .select(`
          id,
          name,
          slug,
          generation_code,
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

      if (generationsData) {
        for (const gen of generationsData) {
          generationsMap.set(gen.id, gen);
        }
      }
    }

    // Build answer generation JSONL
    const MODEL_ANSWERS = process.env.BATCH_MODEL_ANSWERS || 'gpt-4o-mini';
    
    // System prompt for answer generation (same as in build-jsonl)
    const systemPrompt = contentType === 'fault'
      ? `You are an expert automotive technician and repair specialist. Provide comprehensive, structured solutions for car problems.

**CRITICAL STRUCTURE REQUIREMENTS - Your answer MUST be organized into these sections:**

1. **Problem Statement** (1-2 sentences)
   - Clear, concise description of the issue
   - Include brand, model, generation if provided in context

2. **Symptoms** (Bullet list, 3-6 items)
   - List ALL symptoms the user might experience
   - Examples: "Check engine light illuminated", "Rough idle", "Loss of power", "Engine stalling", "Poor fuel economy", "Increased emissions"
   - Extract from problem description and infer additional related symptoms
   - NO repetition - each symptom should be distinct

3. **Diagnostic Steps** (Numbered list, 3-7 steps)
   - Step-by-step diagnostic procedures to identify the problem
   - Examples: "1. Scan for error codes using OBD-II scanner", "2. Check fluid levels", "3. Inspect components visually", "4. Test with multimeter"
   - Each step should be actionable and specific
   - NO repetition - each diagnostic step should be unique

4. **Solution** (Numbered list with sub-steps)
   - Detailed repair instructions broken into clear, numbered steps
   - Each major step should have:
     * Clear heading (e.g., "1. Preparation", "2. Remove Component", "3. Inspect and Clean")
     * Sub-steps within each major step
     * Tools required for that step (if different from overall tools)
     * Safety warnings if applicable
   - Be specific: mention exact procedures, torque values, fluid types, etc.
   - NO repetition - do not repeat information from Diagnostic Steps

5. **Verification** (Bullet list, 3-5 items)
   - Steps to verify the repair was successful
   - Examples: "Test drive the vehicle", "Check for error codes", "Monitor for leaks", "Verify component function"
   - NO repetition - verification steps should be distinct from diagnostic steps

6. **Prevention Tips** (Bullet list, 3-5 items)
   - Tips to prevent the issue from recurring
   - Examples: "Follow manufacturer's maintenance schedule", "Use quality parts and fluids", "Address warning signs early"
   - NO repetition - prevention tips should be unique

**ADDITIONAL REQUIREMENTS:**
- **Tools Required**: List all tools needed (e.g., "OBD-II scanner", "Multimeter", "Socket set", "Torque wrench", "Fuel pressure gauge")
- **Parts Required**: List components that may need replacement
- **Estimated Repair Time**: Provide realistic time estimate (e.g., "1-3 hours", "2-4 hours", "4-8 hours")
- **Safety Warnings**: Include if applicable (e.g., "Disconnect battery before working on electrical systems", "Allow engine to cool before opening radiator")

**QUALITY STANDARDS:**
- Be technically accurate, specific, and practical
- Use proper automotive terminology
- NO repetition between sections - each section should provide unique information
- Symptoms should NOT be repeated in Solution
- Diagnostic Steps should NOT be repeated in Solution
- Solution should focus ONLY on repair procedures, not diagnosis
- Be comprehensive but concise - every word should add value
- Format with clear headings using markdown (## for main sections, ### for sub-sections)
- Do not mention AI, do not refer to yourself, and do not simulate a human persona

**OUTPUT FORMAT:**
Use markdown formatting with clear section headings. Example structure:

## Problem Statement
[1-2 sentences describing the issue]

## Symptoms
- [Symptom 1]
- [Symptom 2]
- [Symptom 3]

## Diagnostic Steps
1. [Diagnostic step 1]
2. [Diagnostic step 2]
3. [Diagnostic step 3]

## Solution
### 1. Preparation
[Sub-steps and instructions]

### 2. [Main Step Name]
[Sub-steps and instructions]

## Verification
- [Verification step 1]
- [Verification step 2]

## Prevention Tips
- [Prevention tip 1]
- [Prevention tip 2]

**Tools Required:**
- [Tool 1]
- [Tool 2]

**Parts Required:**
- [Part 1]
- [Part 2]

**Estimated Repair Time:** [Time estimate]

**Safety Warnings:**
- [Warning if applicable]`
      : `You are an expert automotive technician and repair specialist. Provide comprehensive, structured maintenance and repair procedures.

**CRITICAL STRUCTURE REQUIREMENTS - Your answer MUST be organized into these sections:**

1. **Procedure Overview** (1-2 sentences)
   - Clear description of what the procedure accomplishes
   - Include brand, model, generation if provided in context

2. **Tools Required** (Bullet list, 3-8 items)
   - All tools needed for the procedure
   - Examples: "Socket set", "Torque wrench", "Multimeter", "Drain pan", "Funnel"

3. **Parts Required** (Bullet list, if applicable)
   - Components, fluids, or parts needed
   - Include quantities and specifications when relevant

4. **Step-by-Step Instructions** (Numbered list with sub-steps)
   - Detailed procedure broken into clear, numbered steps
   - Each major step should have:
     * Clear heading
     * Sub-steps within each major step
     * Specific measurements, torque values, fluid types
   - Be specific and actionable

5. **Verification** (Bullet list, 2-4 items)
   - Steps to verify the procedure was completed correctly
   - Examples: "Check for leaks", "Verify fluid levels", "Test component function"

6. **Safety Tips** (Bullet list, 2-4 items)
   - Important safety considerations
   - Examples: "Allow engine to cool", "Disconnect battery", "Work in well-ventilated area"

**ADDITIONAL REQUIREMENTS:**
- **Estimated Time**: Provide realistic time estimate
- **Difficulty Level**: Mention if procedure is easy, medium, or hard
- Be technically accurate, specific, and practical
- Use proper automotive terminology
- Format with clear headings using markdown
- Do not mention AI, do not refer to yourself, and do not simulate a human persona

**OUTPUT FORMAT:**
Use markdown formatting with clear section headings.`;

    const jsonlLines: string[] = [];
    let questionIndex = 0;

    for (const { question, customId, generationId } of questions) {
      // Get generation context if available
      let context = '';
      if (generationId && generationsMap.has(generationId)) {
        const gen = generationsMap.get(generationId);
        const model = gen.car_models as any;
        const brand = model?.car_brands as any;
        if (brand && model && gen) {
          context = `This is about ${brand.name} ${model.name} ${gen.name}${gen.generation_code ? ` (${gen.generation_code})` : ''}.`;
        }
      }

      const userPrompt = `${question}${context ? ` - ${context}` : ''}`;

      // Create JSONL entry for answer generation
      const answerEntry = {
        custom_id: `answer-${generationId || 'unknown'}-${questionIndex + 1}`,
        method: 'POST',
        url: '/v1/chat/completions',
        body: {
          model: MODEL_ANSWERS,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.7,
          max_tokens: 4000,
        },
      };

      jsonlLines.push(JSON.stringify(answerEntry));
      questionIndex++;
    }

    if (jsonlLines.length === 0) {
      return NextResponse.json({ error: 'No valid entries generated' }, { status: 400 });
    }

    // Create JSONL content
    const jsonlContent = jsonlLines.join('\n');

    // Save file
    const timestamp = Date.now();
    const filename = `answers-from-questions-${questions.length}questions-${timestamp}.jsonl`;
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
        totalQuestions: questions.length,
        totalEntries: jsonlLines.length,
      });
    } catch (fileError) {
      console.error('Error saving file:', fileError);
      return NextResponse.json(
        { error: `Failed to save file: ${fileError instanceof Error ? fileError.message : 'Unknown error'}` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Convert questions to answers JSONL error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}



