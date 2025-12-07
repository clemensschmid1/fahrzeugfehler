import { NextResponse } from 'next/server';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export const runtime = 'nodejs';

function getOpenAIApiKey() {
  const apiKey = process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('Missing OpenAI API key');
  }
  return apiKey;
}

// Download and parse JSONL file from OpenAI
async function downloadAndParseJsonl(fileId: string, apiKey: string): Promise<any[]> {
  const OPENAI_API_URL = 'https://api.openai.com/v1';
  const res = await fetch(`${OPENAI_API_URL}/files/${fileId}/content`, {
    headers: { 'Authorization': `Bearer ${apiKey}` }
  });
  
  if (!res.ok) {
    throw new Error(`Failed to download file: ${res.statusText}`);
  }
  
  const text = await res.text();
  const lines = text.trim().split('\n').filter(line => line.trim());
  return lines.map(line => {
    try {
      return JSON.parse(line);
    } catch (e) {
      console.error('Failed to parse JSONL line:', line);
      return null;
    }
  }).filter(item => item !== null);
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const questionsFile = formData.get('questionsFile') as File;
    const answersFile = formData.get('answersFile') as File;
    const contentType = (formData.get('contentType') as string) || 'fault';
    const generationIdsStr = formData.get('generationIds') as string;
    const generationIds = generationIdsStr ? JSON.parse(generationIdsStr) : [];

    if (!questionsFile) {
      return NextResponse.json({ error: 'Missing questionsFile' }, { status: 400 });
    }

    if (!answersFile) {
      return NextResponse.json({ error: 'Missing answersFile' }, { status: 400 });
    }

    if (!questionsFile.name.endsWith('.jsonl')) {
      return NextResponse.json({ error: 'Questions file must be a .jsonl file' }, { status: 400 });
    }

    if (!answersFile.name.endsWith('.jsonl')) {
      return NextResponse.json({ error: 'Answers file must be a .jsonl file' }, { status: 400 });
    }

    // Read questions file
    const questionsJsonl = await questionsFile.text();
    const questionsLines = questionsJsonl.trim().split('\n').filter(line => line.trim());
    const questionsMap = new Map<string, { question: string; generationId?: string }>();
    
    for (const line of questionsLines) {
      try {
        const parsed = JSON.parse(line);
        const customId = parsed.custom_id || '';
        
        // Extract generation_id from custom_id: answer-{generationId}-{index}
        const match = customId.match(/^answer-(.+?)-(\d+)$/);
        const generationId = match ? match[1] : null;
        
        // Extract question from user message
        const question = parsed.body?.messages?.[1]?.content || '';
        
        if (customId && question) {
          questionsMap.set(customId, { question, generationId: generationId || undefined });
        }
      } catch (e) {
        console.error('Failed to parse question line:', e);
      }
    }

    if (questionsMap.size === 0) {
      return NextResponse.json({ error: 'No valid questions found in file' }, { status: 400 });
    }

    // Read answers file
    const answersJsonl = await answersFile.text();
    const answersLines = answersJsonl.trim().split('\n').filter(line => line.trim());
    const answers = answersLines.map(line => {
      try {
        return JSON.parse(line);
      } catch (e) {
        return null;
      }
    }).filter(item => item !== null);

    if (answers.length === 0) {
      return NextResponse.json({ error: 'No answers found' }, { status: 400 });
    }

    // Map answers to questions by custom_id
    const qaPairs: Array<{ question: string; answer: string; generationId?: string; customId: string }> = [];
    
    for (const answerResult of answers) {
      if (answerResult.error || answerResult.response?.status_code !== 200) {
        continue;
      }

      const customId = answerResult.custom_id;
      const questionData = questionsMap.get(customId);
      
      if (questionData) {
        const answer = answerResult.response?.body?.choices?.[0]?.message?.content;
        if (answer) {
          qaPairs.push({
            question: questionData.question,
            answer: answer.trim(),
            generationId: questionData.generationId,
            customId,
          });
        }
      }
    }

    if (qaPairs.length === 0) {
      return NextResponse.json({ error: 'No valid Q&A pairs found' }, { status: 400 });
    }

    // Fetch generation data for context (if generationIds provided)
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const generationDataMap = new Map<string, { brand: string; model: string; generation: string }>();
    
    if (generationIds.length > 0) {
      const { data: generationsData } = await supabase
        .from('model_generations')
        .select('id, name, car_models!inner(id, name, car_brands!inner(id, name))')
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
            });
          }
        }
      }
    }

    // Create metadata batch JSONL
    const MODEL_METADATA = process.env.BATCH_MODEL_METADATA || 'gpt-4o-mini';
    const batchJsonlLines = qaPairs.map((qa, i) => {
      const genData = qa.generationId ? generationDataMap.get(qa.generationId) : null;
      const context = genData 
        ? `This is about ${genData.brand} ${genData.model} ${genData.generation}.`
        : '';

      // Build comprehensive metadata prompt (same as Carbulk for consistency)
      const metadataPrompt = contentType === 'fault'
        ? `You are an expert automotive technician and SEO specialist. Generate comprehensive metadata for a car fault/solution page.

Context: ${context}

Question/Problem: ${qa.question}
Solution: ${qa.answer.substring(0, 2000)}

Return **ONLY valid JSON** (no markdown, no code blocks, no explanations).

**REQUIRED fields (never null):**
- severity: "low" | "medium" | "high" | "critical"
- difficulty_level: "easy" | "medium" | "hard" | "expert"
- meta_title: Short, SEO-optimized title (50-60 characters, includes brand/model if context provided)
- meta_description: 1-2 sentences for SEO (150-160 characters, no markdown)
- seo_score: Integer 1-99 (assess SEO optimization: keyword relevance, search intent match, structure)
- content_score: Integer 1-99 (assess content quality: detail, accuracy, practical relevance, step-by-step clarity)

**REQUIRED fields (must extract from solution, infer if not explicit):**
- symptoms: Array of symptom strings (MUST extract from solution or infer from problem description, minimum 2-3 symptoms)
- diagnostic_steps: Array of diagnostic step strings (MUST extract from solution, minimum 3-5 steps)
- tools_required: Array of required tools (MUST extract from solution, minimum 2-3 tools)
- affected_component: Main component affected (MUST infer from problem, e.g., "Engine", "Transmission", "Brakes", "Electrical", "Cooling System", "Fuel System")
- estimated_repair_time: String (MUST estimate based on solution complexity, e.g., "1-2 hours", "2-4 hours", "4-8 hours")

**STRONGLY PREFERRED fields (extract if present, otherwise null):**
- error_code: OBD-II or manufacturer error codes (e.g., "P0301", "P0420", "P0420, P0430")

**Extraction rules (CRITICAL - these fields are REQUIRED for sortability):**
- symptoms: MUST extract ALL symptoms mentioned in solution. If solution doesn't explicitly list symptoms, infer them from the problem description. Minimum 2-3 symptoms. Examples: ["Check engine light", "Rough idle", "Loss of power", "Stalling", "Poor fuel economy"]
- diagnostic_steps: MUST extract ALL diagnostic steps from solution. Break down the solution into clear diagnostic procedures. Minimum 3-5 steps. Examples: ["Scan for error codes", "Check spark plugs", "Test ignition coils", "Inspect fuel injectors", "Check compression"]
- tools_required: MUST extract ALL tools mentioned in solution. If tools aren't explicitly mentioned, infer standard tools needed for this type of repair. Minimum 2-3 tools. Examples: ["OBD-II scanner", "Spark plug socket", "Multimeter", "Socket set", "Torque wrench"]
- affected_component: MUST identify the main component. If unclear, infer from problem description and solution content.
- estimated_repair_time: MUST provide realistic time estimate based on solution steps and complexity.
- Extract error codes from question/solution (P-codes, manufacturer codes)
- Infer severity from problem description (safety issues = critical/high, minor = low)
- Infer difficulty from solution complexity
- Generate meta_title: Include key terms like error code, component, brand/model. Keep it concise and search-friendly.
- Score seo_score: Higher if includes specific error codes, brand/model, clear search intent (70-90 for good content, 50-70 for average, below 50 for poor)
- Score content_score: Higher if detailed, step-by-step, accurate, practical (80-95 for excellent, 70-80 for good, 60-70 for average, below 60 for poor)

**Scoring Guidelines:**
- seo_score: Assess keyword optimization, search intent match, title/description quality. Good technical content should score 70-90.
- content_score: Assess detail level, accuracy, step-by-step clarity, practical value. Comprehensive guides should score 80-95.

Example output (NOTE: symptoms, diagnostic_steps, tools_required are REQUIRED, not optional):
{
  "severity": "high",
  "difficulty_level": "medium",
  "error_code": "P0301",
  "affected_component": "Engine",
  "symptoms": ["Check engine light", "Rough idle", "Engine misfire", "Loss of power", "Poor fuel economy"],
  "diagnostic_steps": ["Scan for error codes using OBD-II scanner", "Check spark plugs for wear or fouling", "Test ignition coils with multimeter", "Inspect spark plug wires", "Check compression in affected cylinder"],
  "tools_required": ["OBD-II scanner", "Spark plug socket set", "Multimeter", "Compression tester", "Basic hand tools"],
  "estimated_repair_time": "2-4 hours",
  "meta_title": "P0301 Cylinder 1 Misfire Fix - ${genData?.model || 'Car'} Repair Guide",
  "meta_description": "Learn how to diagnose and fix P0301 cylinder 1 misfire in ${genData?.model || 'your vehicle'}. Step-by-step guide with diagnostic procedures and repair instructions.",
  "seo_score": 85,
  "content_score": 88
}`
        : `You are an expert automotive technician and SEO specialist. Generate comprehensive metadata for a car maintenance/repair manual page.

Context: ${context}

Title/Procedure: ${qa.question}
Content: ${qa.answer.substring(0, 2000)}

Return **ONLY valid JSON** (no markdown, no code blocks, no explanations).

**REQUIRED fields (never null):**
- difficulty_level: "easy" | "medium" | "hard" | "expert"
- manual_type: "maintenance" | "repair" | "diagnostic" | "parts" | "specifications" | "other"
- meta_title: Short, SEO-optimized title (50-60 characters, includes brand/model if context provided)
- meta_description: 1-2 sentences for SEO (150-160 characters, no markdown)

**STRONGLY PREFERRED fields (extract if present, otherwise null):**
- estimated_time: String (e.g., "30 minutes", "1-2 hours", "2-4 hours")
- tools_required: Array of required tools
- parts_required: Array of required parts/components

**Extraction rules:**
- Classify manual type from content
- Infer difficulty from procedure complexity
- Extract time estimates from content
- List all tools mentioned
- List all parts/components mentioned
- Generate meta_title: Include procedure type, brand/model. Keep it concise and search-friendly.

Example output:
{
  "difficulty_level": "easy",
  "manual_type": "maintenance",
  "estimated_time": "30 minutes",
  "tools_required": ["Socket set", "Oil filter wrench", "Drain pan"],
  "parts_required": ["Engine oil", "Oil filter"],
  "meta_title": "How to Change Engine Oil - ${genData?.model || 'Car'} Guide",
  "meta_description": "Step-by-step guide to changing engine oil in ${genData?.model || 'your vehicle'}. Includes tools needed, parts required, and detailed instructions."
}`;

      return {
        custom_id: `metadata-${qa.customId.replace('answer-', '')}`,
        method: 'POST',
        url: '/v1/chat/completions',
        body: {
          model: MODEL_METADATA,
          messages: [
            {
              role: 'system',
              content: 'You are an expert at extracting structured metadata from automotive technical content. Always return valid JSON only. Be precise with scores and ensure all required fields are present.'
            },
            {
              role: 'user',
              content: metadataPrompt
            }
          ],
          temperature: 0.2,
          max_tokens: 1500,
          response_format: { type: 'json_object' }
        }
      };
    });

    // Save metadata JSONL file
    const batchJsonl = batchJsonlLines.map(line => JSON.stringify(line)).join('\n');

    const timestamp = Date.now();
    const questionsBaseName = questionsFile.name.replace('.jsonl', '').replace(/[^a-zA-Z0-9-_]/g, '_');
    const metadataFilename = `metadata-${questionsBaseName}-${timestamp}.jsonl`;
    const publicDir = join(process.cwd(), 'public', 'generated');
    
    try {
      await mkdir(publicDir, { recursive: true });
    } catch (err: any) {
      if (err.code !== 'EEXIST') {
        throw err;
      }
    }

    const metadataFilePath = join(publicDir, metadataFilename);
    await writeFile(metadataFilePath, batchJsonl, 'utf-8');

    // Return example prompts for display
    const exampleQa = qaPairs[0];
    const exampleGenData = exampleQa?.generationId ? generationDataMap.get(exampleQa.generationId) : null;
    const context = exampleGenData 
      ? `This is about ${exampleGenData.brand} ${exampleGenData.model} ${exampleGenData.generation}.`
      : '';
    
    const exampleMetadataPrompt = contentType === 'fault'
      ? `You are an expert automotive technician and SEO specialist. Generate comprehensive metadata for a car fault/solution page.

Context: ${context}

Question/Problem: ${exampleQa?.question || 'Example question'}
Solution: ${exampleQa?.answer?.substring(0, 2000) || 'Example solution'}

Return **ONLY valid JSON** (no markdown, no code blocks, no explanations).

**REQUIRED fields (never null):**
- severity: "low" | "medium" | "high" | "critical"
- difficulty_level: "easy" | "medium" | "hard" | "expert"
- meta_title: Short, SEO-optimized title (50-60 characters, includes brand/model if context provided)
- meta_description: 1-2 sentences for SEO (150-160 characters, no markdown)
- seo_score: Integer 1-99 (assess SEO optimization: keyword relevance, search intent match, structure)
- content_score: Integer 1-99 (assess content quality: detail, accuracy, practical relevance, step-by-step clarity)

**REQUIRED fields (must extract from solution, infer if not explicit):**
- symptoms: Array of symptom strings (MUST extract from solution or infer from problem description, minimum 2-3 symptoms)
- diagnostic_steps: Array of diagnostic step strings (MUST extract from solution, minimum 3-5 steps)
- tools_required: Array of required tools (MUST extract from solution, minimum 2-3 tools)
- affected_component: Main component affected (MUST infer from problem, e.g., "Engine", "Transmission", "Brakes", "Electrical", "Cooling System", "Fuel System")
- estimated_repair_time: String (MUST estimate based on solution complexity, e.g., "1-2 hours", "2-4 hours", "4-8 hours")

**STRONGLY PREFERRED fields (extract if present, otherwise null):**
- error_code: OBD-II or manufacturer error codes (e.g., "P0301", "P0420", "P0420, P0430")

**Extraction rules (CRITICAL - these fields are REQUIRED for sortability):**
- symptoms: MUST extract ALL symptoms mentioned in solution. If solution doesn't explicitly list symptoms, infer them from the problem description. Minimum 2-3 symptoms. Examples: ["Check engine light", "Rough idle", "Loss of power", "Stalling", "Poor fuel economy"]
- diagnostic_steps: MUST extract ALL diagnostic steps from solution. Break down the solution into clear diagnostic procedures. Minimum 3-5 steps. Examples: ["Scan for error codes", "Check spark plugs", "Test ignition coils", "Inspect fuel injectors", "Check compression"]
- tools_required: MUST extract ALL tools mentioned in solution. If tools aren't explicitly mentioned, infer standard tools needed for this type of repair. Minimum 2-3 tools. Examples: ["OBD-II scanner", "Spark plug socket", "Multimeter", "Socket set", "Torque wrench"]
- affected_component: MUST identify the main component. If unclear, infer from problem description and solution content.
- estimated_repair_time: MUST provide realistic time estimate based on solution steps and complexity.
- Extract error codes from question/solution (P-codes, manufacturer codes)
- Infer severity from problem description (safety issues = critical/high, minor = low)
- Infer difficulty from solution complexity
- Generate meta_title: Include key terms like error code, component, brand/model. Keep it concise and search-friendly.
- Score seo_score: Higher if includes specific error codes, brand/model, clear search intent (70-90 for good content, 50-70 for average, below 50 for poor)
- Score content_score: Higher if detailed, step-by-step, accurate, practical (80-95 for excellent, 70-80 for good, 60-70 for average, below 60 for poor)

**Scoring Guidelines:**
- seo_score: Assess keyword optimization, search intent match, title/description quality. Good technical content should score 70-90.
- content_score: Assess detail level, accuracy, step-by-step clarity, practical value. Comprehensive guides should score 80-95.`
      : `You are an expert automotive technician and SEO specialist. Generate comprehensive metadata for a car maintenance/repair manual page.

Context: ${context}

Title/Procedure: ${exampleQa?.question || 'Example procedure'}
Content: ${exampleQa?.answer?.substring(0, 2000) || 'Example content'}

Return **ONLY valid JSON** (no markdown, no code blocks, no explanations).

**REQUIRED fields (never null):**
- difficulty_level: "easy" | "medium" | "hard" | "expert"
- manual_type: "maintenance" | "repair" | "diagnostic" | "parts" | "specifications" | "other"
- meta_title: Short, SEO-optimized title (50-60 characters, includes brand/model if context provided)
- meta_description: 1-2 sentences for SEO (150-160 characters, no markdown)

**STRONGLY PREFERRED fields (extract if present, otherwise null):**
- estimated_time: String (e.g., "30 minutes", "1-2 hours", "2-4 hours")
- tools_required: Array of required tools
- parts_required: Array of required parts/components

**Extraction rules:**
- Classify manual type from content
- Infer difficulty from procedure complexity
- Extract time estimates from content
- List all tools mentioned
- List all parts/components mentioned
- Generate meta_title: Include procedure type, brand/model. Keep it concise and search-friendly.`;

    return NextResponse.json({
      success: true,
      fileUrl: `/generated/${metadataFilename}`,
      filename: metadataFilename,
      count: batchJsonlLines.length,
      qaPairsCount: qaPairs.length,
      prompts: {
        systemPrompt: 'You are an expert at extracting structured metadata from automotive technical content. Always return valid JSON only. Be precise with scores and ensure all required fields are present.',
        exampleUserPrompt: exampleMetadataPrompt,
        model: MODEL_METADATA,
        temperature: 0.2,
        maxTokens: 1500,
        responseFormat: 'json_object',
        generationContext: exampleGenData ? {
          brand: exampleGenData.brand,
          model: exampleGenData.model,
          generation: exampleGenData.generation,
        } : null,
      },
    });
  } catch (error) {
    console.error('Build metadata JSONL error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

