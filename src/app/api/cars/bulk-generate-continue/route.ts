import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes per check

const OPENAI_API_URL = 'https://api.openai.com/v1';

const MODEL_ANSWERS = process.env.BATCH_MODEL_ANSWERS || 'gpt-4o-mini';
const MODEL_METADATA = process.env.BATCH_MODEL_METADATA || 'gpt-4o-mini';

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(supabaseUrl, supabaseKey);
}

function getOpenAIApiKey() {
  const apiKey = process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('Missing OpenAI API key');
  }
  return apiKey;
}

// Helper: Create FormData for file upload
function createFormData(content: string, filename: string): FormData {
  const form = new FormData();
  form.append('purpose', 'batch');
  form.append('file', new Blob([content], { type: 'text/plain' }), filename);
  return form;
}

// Helper: Download and parse JSONL file
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

// Helper: Check batch status (non-blocking, just check once)
async function checkBatchStatus(batchId: string, apiKey: string) {
  const res = await fetch(`${OPENAI_API_URL}/batches/${batchId}`, {
    headers: { 'Authorization': `Bearer ${apiKey}` }
  });
  
  if (!res.ok) {
    throw new Error(`Failed to fetch batch status: ${res.statusText}`);
  }
  
  return await res.json();
}

// Helper: Generate questions using AI (same as bulk-generate)
async function generateFaultQuestions(brand: string, model: string, generation: string, generationCode: string | null, count: number, language: 'en' | 'de', apiKey: string): Promise<string[]> {
  const yearRange = generationCode ? ` (${generationCode})` : '';
  const contextPrompt = language === 'en'
    ? `Generate the ${count} most searched/common problems, faults, and issues for ${brand} ${model} ${generation}${yearRange}. Focus on real-world problems that car owners actually search for online, such as: engine issues, transmission problems, electrical faults, warning lights, error codes, common breakdowns, performance issues, and maintenance problems. Make each question specific to this exact model and generation. Format: One problem/question per line, no numbering, clear and searchable. No duplicates, no repetitions.`
    : `Generiere die ${count} am häufigsten gesuchten/häufigsten Probleme, Fehler und Probleme für ${brand} ${model} ${generation}${yearRange}. Konzentriere dich auf reale Probleme, die Autobesitzer tatsächlich online suchen, wie z.B.: Motorprobleme, Getriebeprobleme, elektrische Fehler, Warnleuchten, Fehlercodes, häufige Pannen, Leistungsprobleme und Wartungsprobleme. Mache jede Frage spezifisch für dieses genaue Modell und diese Generation. Format: Ein Problem/Frage pro Zeile, keine Nummerierung, klar und durchsuchbar. Keine Duplikate, keine Wiederholungen.`;

  // Generate in batches
  const BATCH_SIZE = 100;
  const batches = Math.ceil(count / BATCH_SIZE);
  const allQuestions: string[] = [];

  for (let i = 0; i < batches; i++) {
    const batchCount = i === batches - 1 ? count - (i * BATCH_SIZE) : BATCH_SIZE;
    const batchPrompt = `${contextPrompt} Generate exactly ${batchCount} unique questions. Do not repeat questions from previous batches.`;

    const systemPrompt = language === 'de'
      ? `Du bist ein Experte für technische Wissensdatenbanken. Generiere ${batchCount} hochwertige, einzigartige, präzise, technische Fragen zum Thema: "${batchPrompt}". Gib nur die Fragen aus, eine pro Zeile, mit normalen Leerzeichen und korrekter Formatierung. Keine Nummerierung, keine Antworten, keine Wiederholungen, keine Einleitung, keine doppelten Fragen. Schreibe normale, lesbare Sätze.`
      : `You are an expert in technical knowledge bases. Generate ${batchCount} high-quality, unique, precise, technical questions about: "${batchPrompt}". Output only the questions, one per line, with proper spacing and normal sentence formatting. No numbering, no answers, no introduction, no duplicates. Write normal, readable sentences with proper spaces between words.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'system', content: systemPrompt }],
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to generate questions batch ${i + 1}: ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim();
    
    if (!content) {
      throw new Error(`No questions generated in batch ${i + 1}`);
    }

    const questions = content
      .split('\n')
      .map((line: string) => line.trim())
      .filter((line: string) => line.length > 0 && !line.match(/^\d+[\.\)]/));
    
    allQuestions.push(...questions);

    if (i < batches - 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  const uniqueQuestions = Array.from(new Set(allQuestions.map(q => q.trim())));
  return uniqueQuestions.slice(0, count);
}

async function generateManualQuestions(brand: string, model: string, generation: string, generationCode: string | null, count: number, language: 'en' | 'de', apiKey: string): Promise<string[]> {
  const yearRange = generationCode ? ` (${generationCode})` : '';
  const contextPrompt = language === 'en'
    ? `Generate the ${count} most searched/common maintenance procedures, repair guides, and how-to instructions for ${brand} ${model} ${generation}${yearRange}. Focus on procedures that car owners actually search for, such as: oil changes, brake pad replacement, filter changes, fluid top-ups, part replacements, diagnostic procedures, and routine maintenance. Make each instruction specific to this exact model and generation. Format: One instruction/guide per line, no numbering, clear and actionable. No duplicates, no repetitions.`
    : `Generiere die ${count} am häufigsten gesuchten/häufigsten Wartungsverfahren, Reparaturanleitungen und Anleitungen für ${brand} ${model} ${generation}${yearRange}. Konzentriere dich auf Verfahren, die Autobesitzer tatsächlich suchen, wie z.B.: Ölwechsel, Bremsbelagwechsel, Filterwechsel, Flüssigkeitsnachfüllung, Teilewechsel, Diagnoseverfahren und routinemäßige Wartung. Mache jede Anleitung spezifisch für dieses genaue Modell und diese Generation. Format: Eine Anleitung/Leitfaden pro Zeile, keine Nummerierung, klar und umsetzbar. Keine Duplikate, keine Wiederholungen.`;

  // Generate in batches
  const BATCH_SIZE = 100;
  const batches = Math.ceil(count / BATCH_SIZE);
  const allQuestions: string[] = [];

  for (let i = 0; i < batches; i++) {
    const batchCount = i === batches - 1 ? count - (i * BATCH_SIZE) : BATCH_SIZE;
    const batchPrompt = `${contextPrompt} Generate exactly ${batchCount} unique questions. Do not repeat questions from previous batches.`;

    const systemPrompt = language === 'de'
      ? `Du bist ein Experte für technische Wissensdatenbanken. Generiere ${batchCount} hochwertige, einzigartige, präzise, technische Fragen zum Thema: "${batchPrompt}". Gib nur die Fragen aus, eine pro Zeile, mit normalen Leerzeichen und korrekter Formatierung. Keine Nummerierung, keine Antworten, keine Wiederholungen, keine Einleitung, keine doppelten Fragen. Schreibe normale, lesbare Sätze.`
      : `You are an expert in technical knowledge bases. Generate ${batchCount} high-quality, unique, precise, technical questions about: "${batchPrompt}". Output only the questions, one per line, with proper spacing and normal sentence formatting. No numbering, no answers, no introduction, no duplicates. Write normal, readable sentences with proper spaces between words.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'system', content: systemPrompt }],
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to generate questions batch ${i + 1}: ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim();
    
    if (!content) {
      throw new Error(`No questions generated in batch ${i + 1}`);
    }

    const questions = content
      .split('\n')
      .map((line: string) => line.trim())
      .filter((line: string) => line.length > 0 && !line.match(/^\d+[\.\)]/));
    
    allQuestions.push(...questions);

    if (i < batches - 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  const uniqueQuestions = Array.from(new Set(allQuestions.map(q => q.trim())));
  return uniqueQuestions.slice(0, count);
}

/**
 * Background job processor that continues batch processing
 * This endpoint can be called periodically (via cron or webhook) to check
 * and continue processing jobs that are waiting for batch completion
 */
export async function POST(req: Request) {
  try {
    const { jobId } = await req.json();
    
    if (!jobId) {
      return NextResponse.json({ error: 'Job ID is required' }, { status: 400 });
    }

    const supabase = getSupabaseClient();
    const apiKey = getOpenAIApiKey();

    // Fetch job from database
    const { data: job, error: jobError } = await supabase
      .from('car_bulk_generation_jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (jobError || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    const updateJobStatus = async (updates: any) => {
      try {
        await supabase
          .from('car_bulk_generation_jobs')
          .update({
            ...updates,
            updated_at: new Date().toISOString(),
          })
          .eq('id', jobId);
      } catch (e: any) {
        if (e?.code !== '42P01' && !e?.message?.includes('does not exist')) {
          console.error('Failed to update job status:', e);
        }
      }
    };

    // Fetch brand, model, generation details
    const { data: brand } = await supabase.from('car_brands').select('name, slug').eq('id', job.brand_id).single();
    const { data: model } = await supabase.from('car_models').select('name, slug').eq('id', job.model_id).single();
    const { data: generation } = await supabase.from('model_generations').select('name, slug, generation_code').eq('id', job.generation_id).single();

    if (!brand || !model || !generation) {
      return NextResponse.json({ error: 'Missing brand/model/generation data' }, { status: 400 });
    }

    // Check current status and continue processing
    if (job.status === 'batch1_created' || job.status === 'batch1_complete') {
      // Check Batch 1 status
      if (job.batch1_id) {
        const batch1Status = await checkBatchStatus(job.batch1_id, apiKey);
        
        await updateJobStatus({
          batch1_status: batch1Status.status,
          current_stage: `Batch 1: ${batch1Status.status}`,
        });
        
        if (batch1Status.status === 'completed') {
          // Batch 1 complete - continue to Batch 2
          await continueToBatch2(job, brand, model, generation, supabase, apiKey, updateJobStatus);
        } else if (batch1Status.status === 'failed' || batch1Status.status === 'expired') {
          await updateJobStatus({
            status: 'failed',
            error_message: `Batch 1 ${batch1Status.status}`,
          });
        }
      }
    } else if (job.status === 'batch2_created' || job.status === 'batch2_complete') {
      // Check Batch 2 status
      if (job.batch2_id) {
        const batch2Status = await checkBatchStatus(job.batch2_id, apiKey);
        
        await updateJobStatus({
          batch2_status: batch2Status.status,
          current_stage: `Batch 2: ${batch2Status.status}`,
        });
        
        if (batch2Status.status === 'completed') {
          // Batch 2 complete - continue to database insertion
          await continueToDatabaseInsertion(job, brand, model, generation, supabase, apiKey, updateJobStatus);
        } else if (batch2Status.status === 'failed' || batch2Status.status === 'expired') {
          await updateJobStatus({
            status: 'failed',
            error_message: `Batch 2 ${batch2Status.status}`,
          });
        }
      }
    }

    return NextResponse.json({ success: true, message: 'Job status checked and updated' });
  } catch (error: any) {
    console.error('Continue processing error:', error);
    return NextResponse.json(
      { error: error.message || 'Unknown error' },
      { status: 500 }
    );
  }
}

async function continueToBatch2(
  job: any,
  brand: any,
  model: any,
  generation: any,
  supabase: any,
  apiKey: string,
  updateJobStatus: (updates: any) => Promise<void>
) {
  try {
    await updateJobStatus({
      status: 'batch1_complete',
      batch1_status: 'completed',
      current_stage: 'Batch 1 completed, downloading results...',
    });

    // Download Batch 1 results
    const batch1Status = await checkBatchStatus(job.batch1_id, apiKey);
    if (!batch1Status.output_file_id) {
      throw new Error('Batch 1 completed but no output file ID');
    }

    const batch1Results = await downloadAndParseJsonl(batch1Status.output_file_id, apiKey);
    
    // Regenerate questions to map results (using AI, same as initial generation)
    const questions = job.content_type === 'fault'
      ? await generateFaultQuestions(brand.name, model.name, generation.name, generation.generation_code, job.count, job.language as 'en' | 'de', apiKey)
      : await generateManualQuestions(brand.name, model.name, generation.name, generation.generation_code, job.count, job.language as 'en' | 'de', apiKey);
    
    // Map results to Q&A pairs
    const qaPairs = batch1Results
      .map((result: any) => {
        if (result.error || result.response?.status_code !== 200) {
          return null;
        }
        const questionIndex = parseInt(result.custom_id?.replace('answer-', '') || '0') - 1;
        const question = questions[questionIndex];
        const answer = result.response?.body?.choices?.[0]?.message?.content;
        return question && answer ? { question, answer } : null;
      })
      .filter((pair: any) => pair !== null);

    if (qaPairs.length === 0) {
      throw new Error('No valid Q&A pairs generated from Batch 1');
    }

    // Create Batch 2 for metadata
    await updateJobStatus({
      status: 'processing',
      current_stage: 'Creating Batch 2 for metadata...',
    });

    const systemPrompt = `You are an expert at extracting structured metadata from automotive content. Return ONLY valid JSON with the following structure:
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
}`;

    const batch2JsonlLines = qaPairs.map((qa: any, i: number) => ({
      custom_id: `metadata-${i + 1}`,
      method: 'POST',
      url: '/v1/chat/completions',
      body: {
        model: MODEL_METADATA,
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: `Extract metadata from this ${job.content_type === 'fault' ? 'fault description' : 'manual'}:\n\nQuestion: ${qa.question}\n\nAnswer: ${qa.answer}\n\nBrand: ${brand.name}\nModel: ${model.name}\nGeneration: ${generation.name}\n\nReturn ONLY the JSON object, no other text.`
          }
        ],
        temperature: 0.3,
        max_tokens: 1000,
        response_format: { type: 'json_object' }
      }
    }));

    const batch2Jsonl = batch2JsonlLines.map((line: any) => JSON.stringify(line)).join('\n');

    // Upload Batch 2 file
    const file2Res = await fetch(`${OPENAI_API_URL}/files`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}` },
      body: createFormData(batch2Jsonl, 'batch2-metadata.jsonl')
    });

    if (!file2Res.ok) {
      throw new Error(`Batch 2 file upload failed: ${await file2Res.text()}`);
    }

    const file2Data = await file2Res.json();
    const inputFile2Id = file2Data.id;

    // Check for concurrent batch limit (OpenAI allows max 50 concurrent batches)
    const activeBatchesRes = await fetch(`${OPENAI_API_URL}/batches?limit=100`, {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    });
    
    if (activeBatchesRes.ok) {
      const batchesData = await activeBatchesRes.json();
      const activeBatches = batchesData.data?.filter((b: any) => 
        ['validating', 'in_progress', 'finalizing'].includes(b.status)
      ) || [];
      
      if (activeBatches.length >= 50) {
        // Wait and retry instead of immediately failing
        console.warn(`[Batch Limit] At limit (${activeBatches.length}/50), waiting 30 seconds before retry...`);
        await new Promise(resolve => setTimeout(resolve, 30000)); // Wait 30 seconds
        
        // Re-check after waiting
        const recheckRes = await fetch(`${OPENAI_API_URL}/batches?limit=100`, {
          headers: { 'Authorization': `Bearer ${apiKey}` }
        });
        
        if (recheckRes.ok) {
          const recheckData = await recheckRes.json();
          const recheckActive = recheckData.data?.filter((b: any) => 
            ['validating', 'in_progress', 'finalizing'].includes(b.status)
          ) || [];
          
          if (recheckActive.length >= 50) {
            // Still at limit - update job status and throw
            await updateJobStatus({
              status: 'batch1_complete', // Keep at batch1_complete so worker can retry
              current_stage: `Waiting for batch limit: ${recheckActive.length}/50 active batches`,
            });
            throw new Error(`OpenAI batch limit still reached after waiting: ${recheckActive.length}/50. Will retry later.`);
          } else {
            console.log(`[Batch Limit] Slot available after waiting: ${recheckActive.length}/50`);
          }
        }
      }
      
      console.log(`[Batch Limit] Active batches: ${activeBatches.length}/50`);
    }

    // Create Batch 2 job
    const batch2Res = await fetch(`${OPENAI_API_URL}/batches`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        input_file_id: inputFile2Id,
        endpoint: '/v1/chat/completions',
        completion_window: '24h',
        metadata: {
          type: 'metadata',
          contentType: job.content_type,
          brand: brand.name,
          model: MODEL_METADATA,
          generation: generation.name
        }
      })
    });

    if (!batch2Res.ok) {
      throw new Error(`Batch 2 creation failed: ${await batch2Res.text()}`);
    }

    const batch2Data = await batch2Res.json();
    const batch2Id = batch2Data.id;

    await updateJobStatus({
      batch2_id: batch2Id,
      batch2_status: batch2Data.status,
      status: 'batch2_created',
      current_stage: 'Batch 2 created, waiting for completion...',
    });
  } catch (error: any) {
    await updateJobStatus({
      status: 'failed',
      error_message: error.message || 'Unknown error',
    });
    throw error;
  }
}

async function continueToDatabaseInsertion(
  job: any,
  brand: any,
  model: any,
  generation: any,
  supabase: any,
  apiKey: string,
  updateJobStatus: (updates: any) => Promise<void>
) {
  try {
    await updateJobStatus({
      status: 'batch2_complete',
      batch2_status: 'completed',
      current_stage: 'Batch 2 completed, downloading results...',
    });

    // Download Batch 2 results
    const batch2Status = await checkBatchStatus(job.batch2_id, apiKey);
    if (!batch2Status.output_file_id) {
      throw new Error('Batch 2 completed but no output file ID');
    }

    const batch2Results = await downloadAndParseJsonl(batch2Status.output_file_id, apiKey);
    
    // Regenerate questions and download Batch 1 results (using AI, same as initial generation)
    const questions = job.content_type === 'fault'
      ? await generateFaultQuestions(brand.name, model.name, generation.name, generation.generation_code, job.count, job.language as 'en' | 'de', apiKey)
      : await generateManualQuestions(brand.name, model.name, generation.name, generation.generation_code, job.count, job.language as 'en' | 'de', apiKey);

    const batch1Status = await checkBatchStatus(job.batch1_id, apiKey);
    const batch1Results = await downloadAndParseJsonl(batch1Status.output_file_id!, apiKey);
    
    // Map Batch 1 results to Q&A pairs
    const qaPairs = batch1Results
      .map((result: any) => {
        if (result.error || result.response?.status_code !== 200) {
          return null;
        }
        const questionIndex = parseInt(result.custom_id?.replace('answer-', '') || '0') - 1;
        const question = questions[questionIndex];
        const answer = result.response?.body?.choices?.[0]?.message?.content;
        return question && answer ? { question, answer } : null;
      })
      .filter((pair: any) => pair !== null);

    // Map metadata
    const metadataMap = new Map();
    for (const result of batch2Results) {
      try {
        if (result.error || result.response?.status_code !== 200) {
          continue;
        }
        const metadata = JSON.parse(result.response?.body?.choices?.[0]?.message?.content || '{}');
        metadataMap.set(result.custom_id, metadata);
      } catch (e) {
        console.error('Failed to parse metadata:', e);
      }
    }

    // Insert into database
    await updateJobStatus({
      status: 'processing',
      current_stage: 'Inserting into database...',
    });

    let successCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    function generateSlug(title: string, index: number): string {
      const base = title
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '')
        .substring(0, 80);
      return `${base}-${index}-${Date.now().toString(36)}`;
    }

    // Use larger batches to reduce number of requests (Supabase can handle up to 1000 rows per query)
    // But we use 500 to be safe and avoid timeout issues
    const BATCH_SIZE = 500;
    const insertBatches: any[][] = [];
    const indexNowUrls: string[] = [];

    // Prepare all data
    for (let i = 0; i < qaPairs.length; i++) {
      try {
        const qaPair = qaPairs[i];
        if (!qaPair) continue;
        const { question, answer } = qaPair;
        const metadataId = `metadata-${i + 1}`;
        const metadata = metadataMap.get(metadataId) || {};
        
        if (!metadata.meta_title && question) {
          metadata.meta_title = question.length > 60 ? question.substring(0, 60).trim() + '...' : question.trim();
        }
        if (!metadata.meta_description && answer) {
          metadata.meta_description = answer.split('\n\n')[0]?.substring(0, 200) || question.substring(0, 200);
        }

        const slug = generateSlug(question, i);
        const title = question.length > 100 ? question.substring(0, 100).trim() + '...' : question.trim();
        const description = metadata.meta_description || answer.split('\n\n')[0]?.substring(0, 200) || question;

        const insertData: any = {
          model_generation_id: job.generation_id,
          slug,
          title,
          description,
          language_path: job.language,
          status: 'live',
          ...(job.content_type === 'fault' ? {
            solution: answer,
            severity: metadata.severity || 'medium',
            difficulty_level: metadata.difficulty_level || 'medium',
            error_code: metadata.error_code || null,
            affected_component: metadata.affected_component || null,
            symptoms: metadata.symptoms || [],
            diagnostic_steps: metadata.diagnostic_steps || [],
            tools_required: metadata.tools_required || [],
            estimated_repair_time: metadata.estimated_repair_time || null,
            meta_title: metadata.meta_title || title,
            meta_description: metadata.meta_description || description,
            seo_score: metadata.seo_score || null,
            content_score: metadata.content_score || null,
          } : {
            content: answer,
            manual_type: metadata.manual_type || 'repair',
            difficulty_level: metadata.difficulty_level || 'medium',
            estimated_time: metadata.estimated_time || null,
            tools_required: metadata.tools_required || [],
            parts_required: metadata.parts_required || [],
            meta_title: metadata.meta_title || title,
            meta_description: metadata.meta_description || description,
          }),
        };

        const batchIndex = Math.floor(i / BATCH_SIZE);
        if (!insertBatches[batchIndex]) {
          insertBatches[batchIndex] = [];
        }
        insertBatches[batchIndex].push(insertData);

        if (brand.slug && model.slug && generation.slug) {
          const url = `https://faultbase.com/${job.language}/cars/${brand.slug}/${model.slug}/${generation.slug}/${job.content_type === 'fault' ? 'faults' : 'manuals'}/${slug}`;
          indexNowUrls.push(url);
        }
      } catch (error) {
        failedCount++;
        errors.push(`Item ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Batch insert all data
    const tableName = job.content_type === 'fault' ? 'car_faults' : 'car_manuals';
    
    for (let batchIndex = 0; batchIndex < insertBatches.length; batchIndex++) {
      const batch = insertBatches[batchIndex];
      if (batch.length === 0) continue;

      try {
        await updateJobStatus({
          current_stage: `Inserting batch ${batchIndex + 1}/${insertBatches.length}...`,
          progress_current: batchIndex * BATCH_SIZE,
          progress_total: qaPairs.length,
        });

        const { data: insertedData, error: insertError } = await supabase
          .from(tableName)
          .insert(batch)
          .select('id, slug');

        if (insertError) {
          // Try individual inserts
          for (const item of batch) {
            try {
              const { error: singleError } = await supabase.from(tableName).insert(item);
              if (singleError) throw singleError;
              successCount++;
            } catch {
              failedCount++;
            }
          }
        } else {
          successCount += insertedData?.length || batch.length;
        }

        if (batchIndex < insertBatches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } catch (error) {
        failedCount += batch.length;
        errors.push(`Batch ${batchIndex + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Submit IndexNow URLs (non-blocking)
    if (indexNowUrls.length > 0 && brand.slug && model.slug && generation.slug) {
      try {
        // Submit to IndexNow in batches (non-blocking, fail silently)
        try {
          const { submitMultipleToIndexNow } = await import('@/lib/submitToIndexNow');
          const INDEXNOW_BATCH_SIZE = 100;
          let submittedBatches = 0;
          let failedBatches = 0;
          
          // For large volumes (3000+ URLs), increase delay to avoid rate limiting
          const delayMs = indexNowUrls.length > 2000 ? 500 : 100;
          
          for (let i = 0; i < indexNowUrls.length; i += INDEXNOW_BATCH_SIZE) {
            const urlBatch = indexNowUrls.slice(i, i + INDEXNOW_BATCH_SIZE);
            // Use batch submission for better performance
            submitMultipleToIndexNow(urlBatch)
              .then(() => {
                submittedBatches++;
                console.log(`[IndexNow] Successfully submitted batch ${submittedBatches}/${Math.ceil(indexNowUrls.length / INDEXNOW_BATCH_SIZE)} (${urlBatch.length} URLs)`);
              })
              .catch((err) => {
                failedBatches++;
                console.warn(`[IndexNow] Failed to submit batch ${Math.floor(i / INDEXNOW_BATCH_SIZE) + 1}/${Math.ceil(indexNowUrls.length / INDEXNOW_BATCH_SIZE)}:`, err);
              });
            
            // Delay between batches to avoid rate limiting (longer for large volumes)
            if (i + INDEXNOW_BATCH_SIZE < indexNowUrls.length) {
              await new Promise(resolve => setTimeout(resolve, delayMs));
            }
          }
          
          console.log(`[IndexNow] Submission initiated: ${indexNowUrls.length} URLs in ${Math.ceil(indexNowUrls.length / INDEXNOW_BATCH_SIZE)} batches`);
        } catch (error) {
          // Fail silently - IndexNow is not critical for the main workflow
          console.warn('[IndexNow] Failed to import or initialize IndexNow submission:', error);
        }
      } catch (err) {
        console.warn('[IndexNow] Error setting up IndexNow submission:', err);
      }
    } else {
      console.warn('[IndexNow] Skipping IndexNow submission - missing URLs or slugs:', {
        urlCount: indexNowUrls.length,
        brandSlug: brand.slug,
        modelSlug: model.slug,
        generationSlug: generation.slug,
      });
    }

    // Final update
    await updateJobStatus({
      status: 'completed',
      success_count: successCount,
      failed_count: failedCount,
      progress_current: qaPairs.length,
      progress_total: qaPairs.length,
      current_stage: 'Complete!',
      completed_at: new Date().toISOString(),
      result: {
        success: successCount,
        failed: failedCount,
        total: qaPairs.length,
        batch1Id: job.batch1_id,
        batch2Id: job.batch2_id,
      },
      errors: errors.slice(0, 100),
    });
  } catch (error: any) {
    await updateJobStatus({
      status: 'failed',
      error_message: error.message || 'Unknown error',
    });
    throw error;
  }
}
