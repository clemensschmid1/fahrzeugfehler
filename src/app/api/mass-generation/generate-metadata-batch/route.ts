import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { writeFile, mkdir } from 'fs/promises';

export const runtime = 'nodejs';
export const maxDuration = 600; // 10 minutes

const OPENAI_API_URL = 'https://api.openai.com/v1';

function getOpenAIApiKey() {
  const apiKey = process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('Missing OpenAI API key');
  }
  return apiKey;
}

// Create FormData for file upload
function createFormData(content: string, filename: string): FormData {
  const form = new FormData();
  form.append('purpose', 'batch');
  form.append('file', new Blob([content], { type: 'text/plain' }), filename);
  return form;
}

// Download and parse JSONL file from OpenAI
async function downloadAndParseJsonl(fileId: string, apiKey: string): Promise<any[]> {
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
    const { questionsFileUrl, answersFileId, contentType, brandId, modelId, generationId } = await req.json();

    if (!questionsFileUrl || !answersFileId) {
      return NextResponse.json({ error: 'Missing questionsFileUrl or answersFileId' }, { status: 400 });
    }

    const apiKey = getOpenAIApiKey();

    // Read questions file
    const questionsFilename = questionsFileUrl.replace('/generated/', '');
    const questionsFilePath = join(process.cwd(), 'public', 'generated', questionsFilename);
    
    let questionsJsonl: string;
    try {
      questionsJsonl = await readFile(questionsFilePath, 'utf-8');
    } catch (err) {
      return NextResponse.json({ error: 'Questions file not found' }, { status: 404 });
    }

    const questionsLines = questionsJsonl.trim().split('\n').filter(line => line.trim());
    const questionsWithMetadata = questionsLines.map(line => {
      try {
        const parsed = JSON.parse(line);
        // Extract generation_id from custom_id: answer-{generationId}-{index}
        const customId = parsed.custom_id || '';
        const match = customId.match(/^answer-(.+?)-(\d+)$/);
        const generationId = match ? match[1] : null;
        
        return {
          question: parsed.body.messages[1].content, // Extract question from user message
          generationId,
          customId,
        };
      } catch (e) {
        return null;
      }
    }).filter(q => q !== null);

    // Download answers from OpenAI
    const answers = await downloadAndParseJsonl(answersFileId, apiKey);

    // Map answers to questions by custom_id
    const qaPairs: Array<{ question: string; answer: string; generationId?: string }> = [];
    const questionsMap = new Map(questionsWithMetadata.map(q => [q.customId, q]));
    
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
          });
        }
      }
    }

    if (qaPairs.length === 0) {
      return NextResponse.json({ error: 'No valid Q&A pairs found' }, { status: 400 });
    }

    // Fetch brand, model data for context
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const [brandResult, modelResult] = await Promise.all([
      supabase.from('car_brands').select('name').eq('id', brandId).single(),
      supabase.from('car_models').select('name').eq('id', modelId).single(),
    ]);

    const brand = brandResult.data?.name || '';
    const model = modelResult.data?.name || '';

    // Create metadata batch JSONL
    const MODEL_METADATA = process.env.BATCH_MODEL_METADATA || 'gpt-4o-mini';
    const batchJsonlLines = qaPairs.map((qa, i) => ({
      custom_id: `metadata-${i + 1}`,
      method: 'POST',
      url: '/v1/chat/completions',
      body: {
        model: MODEL_METADATA,
        messages: [
          {
            role: 'system',
            content: `You are an expert at extracting structured metadata from automotive content. Return ONLY valid JSON with the following structure:
{
  "severity": "low" | "medium" | "high" | "critical",
  "difficulty_level": "easy" | "medium" | "hard" | "expert",
  "error_code": string | null,
  "affected_component": string | null,
  "symptoms": string[],
  "diagnostic_steps": string[],
  "tools_required": string[],
  "estimated_repair_time": string | null,
  "meta_title": string,
  "meta_description": string,
  "seo_score": number | null,
  "content_score": number | null,
  "manual_type": "repair" | "maintenance" | "diagnostic" | null,
  "estimated_time": string | null,
  "parts_required": string[]
}`
          },
          {
            role: 'user',
            content: `Extract metadata from this ${contentType === 'fault' ? 'fault description' : 'manual'}:\n\nQuestion: ${qa.question}\n\nAnswer: ${qa.answer}\n\nBrand: ${brand}\nModel: ${model}\n\nReturn ONLY the JSON object, no other text.`
          }
        ],
        temperature: 0.3,
        max_tokens: 1000,
        response_format: { type: 'json_object' }
      }
    }));

    const batchJsonl = batchJsonlLines.map(line => JSON.stringify(line)).join('\n');

    // Upload metadata batch file to OpenAI
    const fileRes = await fetch(`${OPENAI_API_URL}/files`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}` },
      body: createFormData(batchJsonl, 'metadata-batch.jsonl')
    });

    if (!fileRes.ok) {
      const errorText = await fileRes.text();
      return NextResponse.json({ error: `File upload failed: ${errorText}` }, { status: 500 });
    }

    const fileData = await fileRes.json();
    const inputFileId = fileData.id;

    // Check for concurrent batch limit
    const activeBatchesRes = await fetch(`${OPENAI_API_URL}/batches?limit=100`, {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    });
    
    if (activeBatchesRes.ok) {
      const batchesData = await activeBatchesRes.json();
      const activeBatches = batchesData.data?.filter((b: any) => 
        ['validating', 'in_progress', 'finalizing'].includes(b.status)
      ) || [];
      
      if (activeBatches.length >= 50) {
        return NextResponse.json({ 
          error: `OpenAI batch limit reached: ${activeBatches.length}/50 active batches. Please wait and try again later.` 
        }, { status: 429 });
      }
    }

    // Create metadata batch job
    const batchRes = await fetch(`${OPENAI_API_URL}/batches`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        input_file_id: inputFileId,
        endpoint: '/v1/chat/completions',
        completion_window: '24h',
        metadata: {
          type: 'metadata',
          contentType,
          brandId,
          modelId,
        }
      })
    });

    if (!batchRes.ok) {
      const errorText = await batchRes.text();
      return NextResponse.json({ error: `Batch creation failed: ${errorText}` }, { status: 500 });
    }

    const batchData = await batchRes.json();

    return NextResponse.json({
      success: true,
      batchId: batchData.id,
      fileId: inputFileId,
      status: batchData.status,
      qaPairsCount: qaPairs.length,
    });
  } catch (error) {
    console.error('Generate metadata batch error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

