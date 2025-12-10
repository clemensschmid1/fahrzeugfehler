import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const maxDuration = 900; // 15 minutes - Vercel limit (needed for large batches, but limited by platform)

const OPENAI_API_URL = 'https://api.openai.com/v1';

// Model configuration for cost optimization
// Batch API pricing (per 1M tokens):
// - gpt-4o: INPUT $1.25, OUTPUT $5.00
// - gpt-4o-mini: INPUT $0.075, OUTPUT $0.30 (16.7x cheaper!)
// - gpt-4.1-mini: INPUT $0.20, OUTPUT $0.80 (6.25x cheaper)
// - gpt-5-mini: INPUT $0.125, OUTPUT $1.00 (10x cheaper input, 5x cheaper output)

// Use cheaper models for cost optimization while maintaining quality
const MODEL_ANSWERS = process.env.BATCH_MODEL_ANSWERS || 'gpt-4o-mini'; // For generating answers (Batch 1)
const MODEL_METADATA = process.env.BATCH_MODEL_METADATA || 'gpt-4o-mini'; // For extracting metadata (Batch 2) - JSON extraction is simpler

// Fallback to gpt-4o if environment variables want premium quality
const MODEL = process.env.BATCH_MODEL || MODEL_ANSWERS; // Legacy support

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

// Create FormData for file upload
function createFormData(content: string, filename: string): FormData {
  const form = new FormData();
  form.append('purpose', 'batch');
  form.append('file', new Blob([content], { type: 'text/plain' }), filename);
  return form;
}

// Generate diverse fault questions using AI (like CarBike/CarInternal)
// This ensures high-quality, relevant, non-repetitive questions
export async function generateFaultQuestions(
  brand: string, 
  model: string, 
  generation: string, 
  generationCode: string | null, 
  count: number, 
  language: 'en' | 'de',
  apiKey: string
): Promise<string[]> {
  const yearRange = generationCode ? ` (${generationCode})` : '';
  const contextPrompt = language === 'en'
    ? `Generate the ${count} most searched/common problems, faults, and issues for ${brand} ${model} ${generation}${yearRange}. Focus on real-world problems that car owners actually search for online, such as: engine issues, transmission problems, electrical faults, warning lights, error codes, common breakdowns, performance issues, and maintenance problems. Make each question specific to this exact model and generation. Format: One problem/question per line, no numbering, clear and searchable. No duplicates, no repetitions.`
    : `Generiere die ${count} am häufigsten gesuchten/häufigsten Probleme, Fehler und Probleme für ${brand} ${model} ${generation}${yearRange}. Konzentriere dich auf reale Probleme, die Autobesitzer tatsächlich online suchen, wie z.B.: Motorprobleme, Getriebeprobleme, elektrische Fehler, Warnleuchten, Fehlercodes, häufige Pannen, Leistungsprobleme und Wartungsprobleme. Mache jede Frage spezifisch für dieses genaue Modell und diese Generation. Format: Ein Problem/Frage pro Zeile, keine Nummerierung, klar und durchsuchbar. Keine Duplikate, keine Wiederholungen.`;

  // Generate in batches to ensure quality and avoid token limits
  const BATCH_SIZE = 100; // Generate 100 questions per batch
  const batches = Math.ceil(count / BATCH_SIZE);
  const allQuestions: string[] = [];

  for (let i = 0; i < batches; i++) {
    const batchCount = i === batches - 1 ? count - (i * BATCH_SIZE) : BATCH_SIZE;
    const batchPrompt = `${contextPrompt} Generate exactly ${batchCount} unique questions. Do not repeat questions from previous batches.`;

    const systemPrompt = language === 'de'
      ? `Du bist ein Experte für technische Wissensdatenbanken. Generiere ${batchCount} hochwertige, einzigartige, präzise, technische Fragen zum Thema: "${batchPrompt}". Gib nur die Fragen aus, eine pro Zeile, mit normalen Leerzeichen und korrekter Formatierung. Keine Nummerierung, keine Antworten, keine Wiederholungen, keine Einleitung, keine doppelten Fragen. Schreibe normale, lesbare Sätze.`
      : `You are an expert in technical knowledge bases. Generate ${batchCount} high-quality, unique, precise, technical questions about: "${batchPrompt}". Output only the questions, one per line, with proper spacing and normal sentence formatting. No numbering, no answers, no introduction, no duplicates. Write normal, readable sentences with proper spaces between words.`;

    // Retry logic for network errors (502, 503, 504, etc.)
    let response: Response | null = null;
    let lastError: Error | null = null;
    const maxRetries = 5;
    const retryDelay = 2000; // 2 seconds
    
    for (let retry = 0; retry < maxRetries; retry++) {
      try {
        response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini', // Cost-optimized, same as CarBike
            messages: [
              { role: 'system', content: systemPrompt },
            ],
            temperature: 0.7,
            max_tokens: 4000, // Increased for larger batches
          }),
        });

        // Retry on 5xx errors (server errors) or network errors
        if (!response.ok && (response.status >= 500 || response.status === 429)) {
          let errorText = '';
          try {
            errorText = await response.text();
          } catch (e) {
            errorText = `Status ${response.status}`;
          }
          lastError = new Error(`Failed to generate questions batch ${i + 1} (attempt ${retry + 1}/${maxRetries}): ${response.status} ${errorText.substring(0, 200)}`);
          
          if (retry < maxRetries - 1) {
            const delay = retryDelay * Math.pow(2, retry); // Exponential backoff
            console.warn(`[Question Generation] Retrying batch ${i + 1} after ${delay}ms... (${retry + 1}/${maxRetries}) - Status: ${response.status}`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
        } else if (!response.ok) {
          // Non-retryable error (4xx except 429)
          let errorText = '';
          try {
            errorText = await response.text();
          } catch (e) {
            errorText = `Status ${response.status}`;
          }
          throw new Error(`Failed to generate questions batch ${i + 1}: ${response.status} ${errorText.substring(0, 200)}`);
        } else {
          // Success - break out of retry loop
          break;
        }
      } catch (err: any) {
        lastError = err;
        const errorMsg = err.message || String(err);
        // Retry on network errors, 502 Bad Gateway, or any 5xx errors
        const shouldRetry = retry < maxRetries - 1 && (
          errorMsg.includes('fetch') || 
          errorMsg.includes('network') || 
          errorMsg.includes('ECONNREFUSED') || 
          errorMsg.includes('502') || 
          errorMsg.includes('Bad Gateway') ||
          errorMsg.includes('503') ||
          errorMsg.includes('504') ||
          errorMsg.includes('timeout')
        );
        
        if (shouldRetry) {
          const delay = retryDelay * Math.pow(2, retry);
          console.warn(`[Question Generation] Network/server error, retrying batch ${i + 1} after ${delay}ms... (${retry + 1}/${maxRetries}) - Error: ${errorMsg.substring(0, 100)}`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        // If it's the last retry or non-retryable error, throw
        if (retry === maxRetries - 1) {
          throw lastError || err;
        }
      }
    }

    if (!response || !response.ok) {
      throw lastError || new Error(`Failed to generate questions batch ${i + 1} after ${maxRetries} attempts`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim();
    
    if (!content) {
      throw new Error(`No questions generated in batch ${i + 1}`);
    }

    // Split into lines and filter
    const questions = content
      .split('\n')
      .map((line: string) => line.trim())
      .filter((line: string) => line.length > 0 && !line.match(/^\d+[\.\)]/)); // Remove numbered lines
    
    allQuestions.push(...questions);

    // Small delay between batches to avoid rate limits
    if (i < batches - 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  // Deduplicate and limit to requested count
  const uniqueQuestions = Array.from(new Set(allQuestions.map(q => q.trim())));
  return uniqueQuestions.slice(0, count);
}

// Generate diverse manual questions using AI (like CarBike/CarInternal)
// This ensures high-quality, relevant, non-repetitive questions
export async function generateManualQuestions(
  brand: string, 
  model: string, 
  generation: string, 
  generationCode: string | null, 
  count: number, 
  language: 'en' | 'de',
  apiKey: string
): Promise<string[]> {
  const yearRange = generationCode ? ` (${generationCode})` : '';
  const contextPrompt = language === 'en'
    ? `Generate the ${count} most searched/common maintenance procedures, repair guides, and how-to instructions for ${brand} ${model} ${generation}${yearRange}. Focus on procedures that car owners actually search for, such as: oil changes, brake pad replacement, filter changes, fluid top-ups, part replacements, diagnostic procedures, and routine maintenance. Make each instruction specific to this exact model and generation. Format: One instruction/guide per line, no numbering, clear and actionable. No duplicates, no repetitions.`
    : `Generiere die ${count} am häufigsten gesuchten/häufigsten Wartungsverfahren, Reparaturanleitungen und Anleitungen für ${brand} ${model} ${generation}${yearRange}. Konzentriere dich auf Verfahren, die Autobesitzer tatsächlich suchen, wie z.B.: Ölwechsel, Bremsbelagwechsel, Filterwechsel, Flüssigkeitsnachfüllung, Teilewechsel, Diagnoseverfahren und routinemäßige Wartung. Mache jede Anleitung spezifisch für dieses genaue Modell und diese Generation. Format: Eine Anleitung/Leitfaden pro Zeile, keine Nummerierung, klar und umsetzbar. Keine Duplikate, keine Wiederholungen.`;

  // Generate in batches to ensure quality and avoid token limits
  const BATCH_SIZE = 100; // Generate 100 questions per batch
  const batches = Math.ceil(count / BATCH_SIZE);
  const allQuestions: string[] = [];

  for (let i = 0; i < batches; i++) {
    const batchCount = i === batches - 1 ? count - (i * BATCH_SIZE) : BATCH_SIZE;
    const batchPrompt = `${contextPrompt} Generate exactly ${batchCount} unique questions. Do not repeat questions from previous batches.`;

    const systemPrompt = language === 'de'
      ? `Du bist ein Experte für technische Wissensdatenbanken. Generiere ${batchCount} hochwertige, einzigartige, präzise, technische Fragen zum Thema: "${batchPrompt}". Gib nur die Fragen aus, eine pro Zeile, mit normalen Leerzeichen und korrekter Formatierung. Keine Nummerierung, keine Antworten, keine Wiederholungen, keine Einleitung, keine doppelten Fragen. Schreibe normale, lesbare Sätze.`
      : `You are an expert in technical knowledge bases. Generate ${batchCount} high-quality, unique, precise, technical questions about: "${batchPrompt}". Output only the questions, one per line, with proper spacing and normal sentence formatting. No numbering, no answers, no introduction, no duplicates. Write normal, readable sentences with proper spaces between words.`;

    // Retry logic for network errors (502, 503, 504, etc.)
    let response: Response | null = null;
    let lastError: Error | null = null;
    const maxRetries = 5;
    const retryDelay = 2000; // 2 seconds
    
    for (let retry = 0; retry < maxRetries; retry++) {
      try {
        response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini', // Cost-optimized, same as CarBike
            messages: [
              { role: 'system', content: systemPrompt },
            ],
            temperature: 0.7,
            max_tokens: 4000, // Increased for larger batches
          }),
        });

        // Retry on 5xx errors (server errors) or network errors
        if (!response.ok && (response.status >= 500 || response.status === 429)) {
          let errorText = '';
          try {
            errorText = await response.text();
          } catch (e) {
            errorText = `Status ${response.status}`;
          }
          lastError = new Error(`Failed to generate questions batch ${i + 1} (attempt ${retry + 1}/${maxRetries}): ${response.status} ${errorText.substring(0, 200)}`);
          
          if (retry < maxRetries - 1) {
            const delay = retryDelay * Math.pow(2, retry); // Exponential backoff
            console.warn(`[Question Generation] Retrying batch ${i + 1} after ${delay}ms... (${retry + 1}/${maxRetries}) - Status: ${response.status}`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
        } else if (!response.ok) {
          // Non-retryable error (4xx except 429)
          let errorText = '';
          try {
            errorText = await response.text();
          } catch (e) {
            errorText = `Status ${response.status}`;
          }
          throw new Error(`Failed to generate questions batch ${i + 1}: ${response.status} ${errorText.substring(0, 200)}`);
        } else {
          // Success - break out of retry loop
          break;
        }
      } catch (err: any) {
        lastError = err;
        const errorMsg = err.message || String(err);
        // Retry on network errors, 502 Bad Gateway, or any 5xx errors
        const shouldRetry = retry < maxRetries - 1 && (
          errorMsg.includes('fetch') || 
          errorMsg.includes('network') || 
          errorMsg.includes('ECONNREFUSED') || 
          errorMsg.includes('502') || 
          errorMsg.includes('Bad Gateway') ||
          errorMsg.includes('503') ||
          errorMsg.includes('504') ||
          errorMsg.includes('timeout')
        );
        
        if (shouldRetry) {
          const delay = retryDelay * Math.pow(2, retry);
          console.warn(`[Question Generation] Network/server error, retrying batch ${i + 1} after ${delay}ms... (${retry + 1}/${maxRetries}) - Error: ${errorMsg.substring(0, 100)}`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        // If it's the last retry or non-retryable error, throw
        if (retry === maxRetries - 1) {
          throw lastError || err;
        }
      }
    }

    if (!response || !response.ok) {
      throw lastError || new Error(`Failed to generate questions batch ${i + 1} after ${maxRetries} attempts`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim();
    
    if (!content) {
      throw new Error(`No questions generated in batch ${i + 1}`);
    }

    // Split into lines and filter
    const questions = content
      .split('\n')
      .map((line: string) => line.trim())
      .filter((line: string) => line.length > 0 && !line.match(/^\d+[\.\)]/)); // Remove numbered lines
    
    allQuestions.push(...questions);

    // Small delay between batches to avoid rate limits
    if (i < batches - 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  // Deduplicate and limit to requested count
  const uniqueQuestions = Array.from(new Set(allQuestions.map(q => q.trim())));
  return uniqueQuestions.slice(0, count);
}

// Poll batch status until complete (with progress updates)
async function pollBatchStatus(
  batchId: string, 
  apiKey: string, 
  sendProgress: (stage: string, details?: any) => void,
  batchNumber: number
): Promise<any> {
  let lastStatus = '';
  let pollCount = 0;
  const maxPolls = 720; // 24 hours max (720 * 2min = 1440min = 24h)
  
  while (pollCount < maxPolls) {
    pollCount++;
    
    // Create AbortController with timeout for status checks
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 seconds
    
    let res: Response;
    try {
      res = await fetch(`${OPENAI_API_URL}/batches/${batchId}`, {
        headers: { 'Authorization': `Bearer ${apiKey}` },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
    } catch (err: any) {
      clearTimeout(timeoutId);
      // Handle timeout/abort errors gracefully
      if (err.name === 'AbortError' || err.code === 'UND_ERR_HEADERS_TIMEOUT') {
        console.warn(`[Batch Status] Timeout checking batch ${batchId}, using last known status: ${lastStatus || 'in_progress'}`);
        // Continue polling with last known status
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds before retry
        continue;
      }
      throw err;
    }
    
    if (!res.ok) {
      // Handle timeout errors gracefully
      if (res.status === 504 || res.statusText === 'Gateway Time-out') {
        // Gateway timeout - batch might still be processing, return current status
        console.warn(`[Batch Status] Gateway timeout for batch ${batchId}, returning last known status`);
        return lastStatus || 'in_progress';
      }
      throw new Error(`Failed to fetch batch status: ${res.statusText}`);
    }
    
    const data = await res.json();
    const status = data.status;
    lastStatus = status; // Update last known status
    
    // Send progress update if status changed or every 10 polls
    if (status !== lastStatus || pollCount % 10 === 0) {
      const statusMessages: Record<string, string> = {
        'validating': 'Validating input file...',
        'in_progress': 'Processing batch...',
        'finalizing': 'Finalizing results...',
        'completed': 'Batch completed!',
        'failed': 'Batch failed',
        'expired': 'Batch expired',
        'cancelling': 'Cancelling batch...',
        'cancelled': 'Batch cancelled'
      };
      
      // Prepare status update details
      const progressDetails: any = {
        [`batch${batchNumber}Id`]: batchId,
        [`batch${batchNumber}Status`]: status,
        requestCounts: data.request_counts,
        pollCount
      };
      
      // Update main status for key milestones
      if (status === 'completed' && batchNumber === 1) {
        progressDetails.status = 'batch1_complete';
      } else if (status === 'completed' && batchNumber === 2) {
        progressDetails.status = 'batch2_complete';
      } else if (status === 'in_progress' && batchNumber === 1 && lastStatus !== 'in_progress') {
        progressDetails.status = 'batch1_created';
      } else if (status === 'in_progress' && batchNumber === 2 && lastStatus !== 'in_progress') {
        progressDetails.status = 'batch2_created';
      }
      
      sendProgress(`Batch ${batchNumber} ${statusMessages[status] || status}`, progressDetails);
      lastStatus = status;
    }
    
    // Check if batch is complete
    if (status === 'completed') {
      return data;
    }
    
    // Check for terminal failure states
    if (status === 'failed') {
      const errorMsg = data.errors?.message || data.errors?.code || 'Unknown error';
      throw new Error(`Batch ${batchNumber} failed: ${errorMsg}`);
    }
    
    if (status === 'expired') {
      throw new Error(`Batch ${batchNumber} expired: The batch did not complete within 24 hours`);
    }
    
    if (status === 'cancelled') {
      throw new Error(`Batch ${batchNumber} was cancelled`);
    }
    
    // Wait before polling again (adaptive based on status)
    let waitTime = 5000; // Default 5 seconds
    if (status === 'validating') {
      waitTime = 3000; // Check more frequently during validation
    } else if (status === 'in_progress') {
      waitTime = 10000; // Check every 10 seconds during processing
    } else if (status === 'finalizing') {
      waitTime = 5000; // Check every 5 seconds during finalization
    }
    
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }
  
  // Instead of throwing immediately, return current status so job can be continued
  const finalStatus = lastStatus || 'in_progress';
  console.warn(`[Batch ${batchNumber}] Polling timeout after ${maxPolls} attempts. Batch ID: ${batchId}, Last status: ${finalStatus}. Job will be continued via worker.`);
  
  // Return a status object that indicates timeout but batch is still processing
  return { 
    status: finalStatus, 
    _pollingTimeout: true, 
    id: batchId,
    // Include minimal data so worker can continue
    output_file_id: null,
    error_file_id: null,
    request_counts: null
  };
}

// Background processing function - continues independently of client connection
// This function runs asynchronously and will continue even if the client disconnects
// However, on Vercel, if the function times out (60 min max), processing stops
// For 24-hour batches, we rely on OpenAI Batch API which processes independently
async function processBulkGenerationInBackground(params: {
  jobRecordId: string | null;
  brandId: string;
  modelId: string;
  generationId: string;
  contentType: string;
  count: number;
  language: string;
  brand: string;
  brandSlug: string;
  model: string;
  modelSlug: string;
  generation: string;
  generationSlug: string;
  generationCode: string | null;
  questions: string[];
  supabase: any;
  apiKey: string;
}) {
  const {
    jobRecordId,
    brandId,
    modelId,
    generationId,
    contentType,
    count,
    language,
    brand,
    brandSlug,
    model,
    modelSlug,
    generation,
    generationSlug,
    generationCode,
    questions,
    supabase,
    apiKey,
  } = params;

  const updateJobStatus = async (updates: any) => {
    if (jobRecordId) {
      try {
        await supabase
          .from('car_bulk_generation_jobs')
          .update({
            ...updates,
            updated_at: new Date().toISOString(),
          })
          .eq('id', jobRecordId);
      } catch (e: any) {
        if (e?.code !== '42P01' && !e?.message?.includes('does not exist')) {
          console.error('Failed to update job status:', e);
        }
      }
    }
  };

  const MODEL_ANSWERS = process.env.BATCH_MODEL_ANSWERS || 'gpt-4o-mini';
  const MODEL_METADATA = process.env.BATCH_MODEL_METADATA || 'gpt-4o-mini';

  try {
    // ===== BATCH 1: Generate Answers =====
    await updateJobStatus({ status: 'processing', current_stage: 'Creating Batch 1...' });

    const systemPrompt = contentType === 'fault'
      ? `You are an expert automotive technician. Provide detailed, step-by-step solutions for car problems. Include symptoms, diagnostic steps, tools required, and repair instructions. Be specific and technical. Format your response with clear headings and structured steps.`
      : `You are an expert automotive technician. Provide detailed, step-by-step maintenance and repair procedures. Include tools required, parts needed, time estimates, and safety warnings. Be specific and technical. Format your response with clear headings and structured steps.`;

    // Create JSONL for Batch 1
    const batch1JsonlLines = questions.map((question, i) => ({
      custom_id: `answer-${i + 1}`,
      method: 'POST',
      url: '/v1/chat/completions',
      body: {
        model: MODEL_ANSWERS,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `${question} - ${brand} ${model} ${generation}${generationCode ? ` (${generationCode})` : ''}` }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }
    }));

    const batch1Jsonl = batch1JsonlLines.map(line => JSON.stringify(line)).join('\n');

    // Upload Batch 1 file
    const file1Res = await fetch(`${OPENAI_API_URL}/files`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}` },
      body: createFormData(batch1Jsonl, 'batch1-answers.jsonl')
    });

    if (!file1Res.ok) {
      throw new Error(`Batch 1 file upload failed: ${await file1Res.text()}`);
    }

    const file1Data = await file1Res.json();
    const inputFile1Id = file1Data.id;

    // Check for concurrent batch limit (OpenAI allows max 50 concurrent batches)
    // Count active batches (validating, in_progress, finalizing)
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
            // Still at limit - mark as pending for worker
            if (jobRecordId) {
              try {
                await supabase
                  .from('car_bulk_generation_jobs')
                  .update({ 
                    status: 'pending',
                    current_stage: `Waiting for batch limit: ${recheckActive.length}/50 active batches`,
                    updated_at: new Date().toISOString(),
                  })
                  .eq('id', jobRecordId);
              } catch (e) {
                // Ignore update errors
              }
            }
            throw new Error(`OpenAI batch limit still reached after waiting: ${recheckActive.length}/50. Job marked as pending.`);
          } else {
            console.log(`[Batch Limit] Slot available after waiting: ${recheckActive.length}/50`);
          }
        }
      }
      
      console.log(`[Batch Limit] Active batches: ${activeBatches.length}/50`);
    }

    // Create Batch 1 job
    const batch1Res = await fetch(`${OPENAI_API_URL}/batches`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        input_file_id: inputFile1Id,
        endpoint: '/v1/chat/completions',
        completion_window: '24h',
        metadata: {
          type: 'answers',
          contentType,
          brand,
          model: MODEL_ANSWERS,
          generation,
          count: questions.length.toString()
        }
      })
    });

    if (!batch1Res.ok) {
      throw new Error(`Batch 1 creation failed: ${await batch1Res.text()}`);
    }

    const batch1Data = await batch1Res.json();
    const batch1Id = batch1Data.id;

    await updateJobStatus({ 
      batch1_id: batch1Id,
      batch1_status: batch1Data.status,
      status: 'batch1_created',
      current_stage: 'Batch 1 created, polling for completion...',
    });

    // Poll Batch 1 until complete (continues even if client disconnects)
    // NOTE: On Vercel, if function times out (60 min), polling stops
    // But OpenAI Batch API continues processing independently
    const sendProgress1 = async (stage: string, details?: any) => {
      const statusUpdate: any = { current_stage: stage };
      if (details?.batch1Status === 'completed') {
        statusUpdate.status = 'batch1_complete';
        statusUpdate.batch1_status = 'completed';
      } else if (details?.batch1Status) {
        statusUpdate.batch1_status = details.batch1Status;
      }
      await updateJobStatus(statusUpdate);
    };

    const batch1Status = await pollBatchStatus(batch1Id, apiKey, sendProgress1, 1);

    // Handle polling timeout - job will be continued via worker
    if (batch1Status._pollingTimeout) {
      await updateJobStatus({
        status: 'batch1_created',
        batch1_status: batch1Status.status || 'in_progress',
        current_stage: `Batch 1 polling timeout. Status: ${batch1Status.status || 'in_progress'}. Will be continued via worker.`,
      });
      // Don't throw error - just return. The worker will continue polling later.
      console.log(`[Batch 1] Polling timeout reached. Job ${jobRecordId} will be continued via worker.`);
      return; // Exit gracefully - worker will continue
    }

    if (batch1Status.status !== 'completed') {
      throw new Error(`Batch 1 failed with status: ${batch1Status.status}`);
    }

    if (!batch1Status.output_file_id) {
      throw new Error('Batch 1 completed but no output file ID');
    }

    await updateJobStatus({ 
      status: 'batch1_complete',
      batch1_status: 'completed',
      current_stage: 'Batch 1 completed, downloading results...',
    });

    // Download Batch 1 results
    const batch1Results = await downloadAndParseJsonl(batch1Status.output_file_id, apiKey);
    
    // Map results to Q&A pairs
    const qaPairs = batch1Results
      .map((result: any) => {
        const questionIndex = parseInt(result.custom_id?.replace('answer-', '') || '0') - 1;
        const question = questions[questionIndex];
        const answer = result.response?.body?.choices?.[0]?.message?.content;
        return question && answer ? { question, answer } : null;
      })
      .filter((pair: any) => pair !== null);

    if (qaPairs.length === 0) {
      throw new Error('No valid Q&A pairs generated from Batch 1');
    }

    // ===== BATCH 2: Generate Metadata =====
    await updateJobStatus({ 
      status: 'processing',
      current_stage: 'Creating Batch 2 for metadata...',
    });

    const batch2JsonlLines = qaPairs.map((qa: any, i: number) => ({
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
            content: `Extract metadata from this ${contentType === 'fault' ? 'fault description' : 'manual'}:\n\nQuestion: ${qa.question}\n\nAnswer: ${qa.answer}\n\nBrand: ${brand}\nModel: ${model}\nGeneration: ${generation}\n\nReturn ONLY the JSON object, no other text.`
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
          contentType,
          brand,
          model: MODEL_METADATA,
          generation
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
      current_stage: 'Batch 2 created, polling for completion...',
    });

    // Poll Batch 2 until complete
    const sendProgress2 = async (stage: string, details?: any) => {
      const statusUpdate: any = { current_stage: stage };
      if (details?.batch2Status === 'completed') {
        statusUpdate.status = 'batch2_complete';
        statusUpdate.batch2_status = 'completed';
      } else if (details?.batch2Status) {
        statusUpdate.batch2_status = details.batch2Status;
      }
      await updateJobStatus(statusUpdate);
    };

    const batch2Status = await pollBatchStatus(batch2Id, apiKey, sendProgress2, 2);

    // Handle polling timeout - job will be continued via worker
    if (batch2Status._pollingTimeout) {
      await updateJobStatus({
        status: 'batch2_created',
        batch2_status: batch2Status.status || 'in_progress',
        current_stage: `Batch 2 polling timeout. Status: ${batch2Status.status || 'in_progress'}. Will be continued via worker.`,
      });
      // Don't throw error - just return. The worker will continue polling later.
      console.log(`[Batch 2] Polling timeout reached. Job ${jobRecordId} will be continued via worker.`);
      return; // Exit gracefully - worker will continue
    }

    if (batch2Status.status !== 'completed') {
      throw new Error(`Batch 2 failed with status: ${batch2Status.status}`);
    }

    if (!batch2Status.output_file_id) {
      throw new Error('Batch 2 completed but no output file ID');
    }

    await updateJobStatus({ 
      status: 'batch2_complete',
      batch2_status: 'completed',
      current_stage: 'Batch 2 completed, downloading results...',
    });

    // Download Batch 2 results
    const batch2Results = await downloadAndParseJsonl(batch2Status.output_file_id, apiKey);
    
    // Map metadata
    const metadataMap = new Map();
    for (const result of batch2Results) {
      try {
        const metadata = JSON.parse(result.response?.body?.choices?.[0]?.message?.content || '{}');
        metadataMap.set(result.custom_id, metadata);
      } catch (e) {
        console.error('Failed to parse metadata:', e);
      }
    }

    // ===== STEP 3: Database Insertion =====
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
          model_generation_id: generationId,
          slug,
          title,
          description,
          language_path: language,
          status: 'live',
          ...(contentType === 'fault' ? {
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

        if (brandSlug && modelSlug && generationSlug) {
          const url = `https://faultbase.com/${language}/cars/${brandSlug}/${modelSlug}/${generationSlug}/${contentType === 'fault' ? 'faults' : 'manuals'}/${slug}`;
          indexNowUrls.push(url);
        }
      } catch (error) {
        failedCount++;
        errors.push(`Item ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Batch insert all data
    const tableName = contentType === 'fault' ? 'car_faults' : 'car_manuals';
    
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
    if (indexNowUrls.length > 0 && brandSlug && modelSlug && generationSlug) {
      try {
        // Submit to IndexNow in batches (non-blocking, fail silently)
        try {
          const { submitMultipleToIndexNow } = await import('@/lib/submitToIndexNow');
          const INDEXNOW_BATCH_SIZE = 100;
          for (let i = 0; i < indexNowUrls.length; i += INDEXNOW_BATCH_SIZE) {
            const urlBatch = indexNowUrls.slice(i, i + INDEXNOW_BATCH_SIZE);
            // Use batch submission for better performance
            submitMultipleToIndexNow(urlBatch).catch(() => {
              // Fail silently - IndexNow is not critical
            });
            if (i + INDEXNOW_BATCH_SIZE < indexNowUrls.length) {
              await new Promise(resolve => setTimeout(resolve, 100));
            }
          }
        } catch (error) {
          // Fail silently - IndexNow is not critical for the main workflow
          console.warn('[IndexNow] Failed to submit URLs:', error);
        }
      } catch (err) {
        console.warn('[IndexNow] Error:', err);
      }
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
        batch1Id,
        batch2Id,
      },
      errors: errors.slice(0, 100),
    });

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    await updateJobStatus({
      status: 'failed',
      error_message: errorMsg,
      updated_at: new Date().toISOString(),
    });
    throw error;
  }
}

// Download and parse JSONL file
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
    const { brandId, modelId, generationId, contentType, count, language, jobId } = await req.json();

    if (!brandId || !modelId || !generationId || !contentType || !count) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    if (count < 1 || count > 50000) {
      return NextResponse.json({ error: 'Count must be between 1 and 50,000' }, { status: 400 });
    }

    const apiKey = getOpenAIApiKey();
    const supabase = getSupabaseClient();

    // Create or get job record (gracefully handle if table doesn't exist)
    let jobRecordId = jobId;
    if (!jobRecordId) {
      try {
        const { data: newJob, error: jobError } = await supabase
          .from('car_bulk_generation_jobs')
          .insert({
            brand_id: brandId,
            model_id: modelId,
            generation_id: generationId,
            content_type: contentType,
            language,
            count,
            status: 'pending',
            progress_total: count,
            started_at: new Date().toISOString(),
          })
          .select('id')
          .single();
        
        if (jobError) {
          // If table doesn't exist, just log and continue without job tracking
          if (jobError.code === '42P01' || jobError.message?.includes('does not exist')) {
            console.warn('car_bulk_generation_jobs table does not exist. Run migration: supabase_migrations/create_car_bulk_generation_jobs_table.sql');
          } else {
            console.error('Failed to create job record:', jobError);
          }
        } else if (newJob) {
          jobRecordId = newJob.id;
        }
      } catch (err: any) {
        // Table might not exist - continue without job tracking
        if (err?.code === '42P01' || err?.message?.includes('does not exist')) {
          console.warn('car_bulk_generation_jobs table does not exist. Job tracking disabled.');
        } else {
          console.error('Error creating job record:', err);
        }
      }
    } else {
      // Job ID provided - update existing job to 'processing' status (if it's pending)
      try {
        const { error: updateError } = await supabase
          .from('car_bulk_generation_jobs')
          .update({
            status: 'processing',
            current_stage: 'Starting generation...',
            updated_at: new Date().toISOString(),
          })
          .eq('id', jobRecordId)
          .eq('status', 'pending'); // Only update if still pending
        
        if (updateError && updateError.code !== '42P01') {
          console.warn('Failed to update existing job status:', updateError);
        } else {
          console.log(`[Bulk Generate] Updated existing job ${jobRecordId} from 'pending' to 'processing'`);
        }
      } catch (err: any) {
        console.warn('Error updating existing job status:', err);
      }
    }

    // Fetch brand, model, generation data
    const [brandResult, modelResult, generationResult] = await Promise.all([
      supabase.from('car_brands').select('name, slug').eq('id', brandId).single(),
      supabase.from('car_models').select('name, slug').eq('id', modelId).single(),
      supabase.from('model_generations').select('name, slug, generation_code').eq('id', generationId).single(),
    ]);

    if (brandResult.error || !brandResult.data) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
    }
    if (modelResult.error || !modelResult.data) {
      return NextResponse.json({ error: 'Model not found' }, { status: 404 });
    }
    if (generationResult.error || !generationResult.data) {
      return NextResponse.json({ error: 'Generation not found' }, { status: 404 });
    }

    const brand = brandResult.data.name;
    const brandSlug = brandResult.data.slug;
    const model = modelResult.data.name;
    const modelSlug = modelResult.data.slug;
    const generation = generationResult.data.name;
    const generationSlug = generationResult.data.slug;
    const generationCode = generationResult.data.generation_code;

    // Generate questions using AI (same quality as CarBike)
    const questions = contentType === 'fault'
      ? await generateFaultQuestions(brand, model, generation, generationCode, count, language, apiKey)
      : await generateManualQuestions(brand, model, generation, generationCode, count, language, apiKey);

    // CRITICAL: Process in background to continue even if client disconnects
    // Start processing immediately (fire-and-forget) so it continues independently
    processBulkGenerationInBackground({
      jobRecordId,
      brandId,
      modelId,
      generationId,
      contentType,
      count,
      language,
      brand,
      brandSlug,
      model,
      modelSlug,
      generation,
      generationSlug,
      generationCode,
      questions,
      supabase,
      apiKey,
    }).catch(async (err) => {
      console.error('Background processing error:', err);
      
      // Don't mark as failed if it's a polling timeout - worker will continue
      if (err.message?.includes('polling timeout') || 
          err.message?.includes('Exceeded maximum polling attempts') ||
          err.message?.includes('will be continued via worker')) {
        console.log(`[Background] Polling timeout detected for job ${jobRecordId}. Worker will continue.`);
        // Update job status to batch1_created so worker can continue
        if (jobRecordId) {
          try {
            await supabase.from('car_bulk_generation_jobs')
              .update({
                status: 'batch1_created',
                current_stage: 'Polling timeout - will be continued via worker',
                updated_at: new Date().toISOString(),
              })
              .eq('id', jobRecordId);
          } catch (updateError) {
            // Ignore errors when updating job status
          }
        }
        return; // Exit gracefully - worker will handle continuation
      }
      
      // Update job status to failed if processing fails (only for real errors)
      if (jobRecordId) {
        try {
          await supabase.from('car_bulk_generation_jobs')
            .update({
              status: 'failed',
              error_message: err.message || 'Unknown error',
              updated_at: new Date().toISOString(),
            })
            .eq('id', jobRecordId);
        } catch (updateError) {
          // Ignore errors when updating job status
        }
      }
    });

    // Return immediately with job ID - processing continues in background
    return NextResponse.json({
      success: true,
      jobId: jobRecordId,
      message: 'Job started. Processing continues in background. Check status via Active Jobs.',
      batchIds: {
        batch1: null, // Will be set when batch is created
        batch2: null,
      }
    });

    // OLD STREAMING CODE (kept for reference but not used)
    /*
    // Create streaming response
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        
        const updateJobStatus = async (updates: any) => {
          if (jobRecordId) {
            try {
              await supabase
                .from('car_bulk_generation_jobs')
                .update({
                  ...updates,
                  updated_at: new Date().toISOString(),
                })
                .eq('id', jobRecordId);
            } catch (e: any) {
              // Silently fail if table doesn't exist
              if (e?.code !== '42P01' && !e?.message?.includes('does not exist')) {
                console.error('Failed to update job status:', e);
              }
            }
          }
        };

        const sendProgress = async (stage: string, details?: any) => {
          const progressData = { 
            progress: { stage },
            model: MODEL_ANSWERS, // Primary model for display
            modelAnswers: MODEL_ANSWERS,
            modelMetadata: MODEL_METADATA,
            jobId: jobRecordId,
            ...details 
          };
          
          // Build status update object
          const statusUpdate: any = {
            current_stage: stage,
          };
          
          // Update progress if provided
          if (details?.progress) {
            statusUpdate.progress_current = details.progress.current || 0;
            statusUpdate.progress_total = details.progress.total || count;
          }
          
          // Handle batch1 updates
          if (details?.batch1Id) {
            statusUpdate.batch1_id = details.batch1Id;
            statusUpdate.batch1_status = details.batch1Status || 'created';
            // Update main status based on batch1 status
            if (details.batch1Status === 'completed') {
              statusUpdate.status = 'batch1_complete';
            } else if (details.batch1Status === 'in_progress' && !statusUpdate.status) {
              statusUpdate.status = 'batch1_created';
            }
          }
          
          // Handle batch2 updates
          if (details?.batch2Id) {
            statusUpdate.batch2_id = details.batch2Id;
            statusUpdate.batch2_status = details.batch2Status || 'created';
            // Update main status based on batch2 status
            if (details.batch2Status === 'completed') {
              statusUpdate.status = 'batch2_complete';
            } else if (details.batch2Status === 'in_progress' && !statusUpdate.status) {
              statusUpdate.status = 'batch2_created';
            }
          }
          
          // Handle explicit status updates from details (highest priority)
          if (details?.status) {
            statusUpdate.status = details.status;
          }
          
          // Update job record with all changes at once
          await updateJobStatus(statusUpdate);
          
          // Check if controller is still open before enqueueing
          try {
            if (controller.desiredSize !== null) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(progressData)}\n\n`));
            }
          } catch (err: any) {
            // Controller is closed, silently ignore
            if (err?.code !== 'ERR_INVALID_STATE') {
              console.warn('Error sending progress update:', err);
            }
          }
        };

        try {
          // ===== BATCH 1: Generate Answers =====
          // Update job status
          await updateJobStatus({ status: 'processing' });
          
          sendProgress(`Step 1/3: Creating Batch 1 - Generating ${questions.length} answers using ${MODEL_ANSWERS}...`);

          const systemPrompt = contentType === 'fault'
            ? `You are an expert automotive technician. Provide detailed, step-by-step solutions for car problems. Include symptoms, diagnostic steps, tools required, and repair instructions. Be specific and technical. Format your response with clear headings and structured steps.`
            : `You are an expert automotive technician. Provide detailed, step-by-step maintenance and repair procedures. Include tools required, parts needed, time estimates, and safety warnings. Be specific and technical. Format your response with clear headings and structured steps.`;

          // Create JSONL for Batch 1 (Answers) - proper format per OpenAI docs
          const batch1JsonlLines = questions.map((question, i) => ({
            custom_id: `answer-${i + 1}`,
            method: 'POST',
            url: '/v1/chat/completions',
            body: {
              model: MODEL_ANSWERS,
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: `${question} - ${brand} ${model} ${generation}${generationCode ? ` (${generationCode})` : ''}` }
              ],
              temperature: 0.7,
              max_tokens: 2000,
            }
          }));

          const batch1Jsonl = batch1JsonlLines.map(line => JSON.stringify(line)).join('\n');

          // Upload Batch 1 file
          sendProgress(`Step 1/3: Uploading Batch 1 JSONL file to OpenAI...`);
          
          const file1Res = await fetch(`${OPENAI_API_URL}/files`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${apiKey}` },
            body: createFormData(batch1Jsonl, 'batch1-answers.jsonl')
          });

          if (!file1Res.ok) {
            const errorText = await file1Res.text();
            throw new Error(`Batch 1 file upload failed: ${errorText}`);
          }

          const file1Data = await file1Res.json();
          const inputFile1Id = file1Data.id;

          sendProgress(`Step 1/3: File uploaded (${inputFile1Id}), creating batch job...`);

          // Create Batch 1 job
          const batch1Res = await fetch(`${OPENAI_API_URL}/batches`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              input_file_id: inputFile1Id,
              endpoint: '/v1/chat/completions',
              completion_window: '24h',
              metadata: {
                type: 'answers',
                contentType,
                brand,
                model: MODEL_ANSWERS,
                generation,
                count: questions.length.toString()
              }
            })
          });

          if (!batch1Res.ok) {
            const errorText = await batch1Res.text();
            throw new Error(`Batch 1 creation failed: ${errorText}`);
          }

          const batch1Data = await batch1Res.json();
          const batch1Id = batch1Data.id;

          sendProgress(`Step 1/3: Batch 1 created (${batch1Id}), polling for completion...`, { 
            batch1Id,
            batch1Status: batch1Data.status 
          });

          // CRITICAL: Start polling in background (fire-and-forget) so it continues even if client disconnects
          // The polling will continue independently and update the database
          const pollBatch1Promise = pollBatchStatus(batch1Id, apiKey, sendProgress, 1);
          
          // Poll Batch 1 until complete (but continue even if client disconnects)
          const batch1Status = await pollBatch1Promise;

          if (batch1Status.status !== 'completed') {
            throw new Error(`Batch 1 failed with status: ${batch1Status.status}`);
          }

          if (!batch1Status.output_file_id) {
            throw new Error('Batch 1 completed but no output file ID');
          }

          // Update job status to batch1_complete
          await updateJobStatus({ 
            status: 'batch1_complete',
            batch1_status: 'completed',
          });
          
          sendProgress(`Step 1/3: Batch 1 completed! Downloading results...`, { 
            batch1Id, 
            batch1Status: 'completed',
            outputFile1Id: batch1Status.output_file_id,
            errorFile1Id: batch1Status.error_file_id,
            requestCounts: batch1Status.request_counts
          });

          // Download Batch 1 results
          const batch1Results = await downloadAndParseJsonl(batch1Status.output_file_id, apiKey);
          
          // Download error file if it exists
          if (batch1Status.error_file_id) {
            try {
              const errorResults = await downloadAndParseJsonl(batch1Status.error_file_id, apiKey);
              sendProgress(`Step 1/3: Found ${errorResults.length} errors in Batch 1, processing successful items...`, {
                batch1Id,
                batch1Errors: errorResults.length
              });
            } catch (e) {
              console.warn('Failed to download Batch 1 error file:', e);
            }
          }
          
          // Map results by custom_id (order may not match input per OpenAI docs)
          // IMPORTANT: Output order may not match input order - always use custom_id to map
          const qaMap = new Map<string, { question: string; answer: string }>();
          let batch1Errors = 0;
          
          for (const result of batch1Results) {
            if (result.error) {
              batch1Errors++;
              console.error(`Batch 1 error for ${result.custom_id}:`, result.error);
              continue;
            }
            
            if (result.response?.status_code === 200 && result.response?.body?.choices?.[0]?.message?.content) {
              const customId = result.custom_id;
              // Extract question index from custom_id (e.g., "answer-1" -> 0)
              const questionIndex = parseInt(customId.replace('answer-', '')) - 1;
              if (questionIndex >= 0 && questionIndex < questions.length) {
                qaMap.set(customId, {
                  question: questions[questionIndex],
                  answer: result.response.body.choices[0].message.content.trim()
                });
              } else {
                console.warn(`Invalid custom_id or question index: ${customId}, index: ${questionIndex}`);
              }
            } else if (result.response?.status_code !== 200) {
              batch1Errors++;
              console.error(`Batch 1 non-200 status for ${result.custom_id}:`, result.response?.status_code);
            }
          }

          const qaPairs = Array.from(qaMap.values());
          
          if (batch1Errors > 0) {
            sendProgress(`Step 1/3: Warning - ${batch1Errors} items failed in Batch 1, continuing with ${qaPairs.length} successful items...`, {
              batch1Id,
              batch1Errors,
              answersGenerated: qaPairs.length
            });
          }

          if (qaPairs.length === 0) {
            throw new Error('No valid answers generated from Batch 1');
          }

          sendProgress(`Step 2/3: Creating Batch 2 - Generating metadata for ${qaPairs.length} items using ${MODEL_METADATA}...`, { 
            batch1Id,
            answersGenerated: qaPairs.length 
          });

          // ===== BATCH 2: Generate Metadata =====
          // Create JSONL for Batch 2 (Metadata)
          const batch2JsonlLines = qaPairs.map((qa, i) => ({
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
                  content: `Extract metadata from this ${contentType === 'fault' ? 'fault description' : 'manual'}:\n\nQuestion: ${qa.question}\n\nAnswer: ${qa.answer}\n\nBrand: ${brand}\nModel: ${model}\nGeneration: ${generation}\n\nReturn ONLY the JSON object, no other text.`
                }
              ],
              temperature: 0.3,
              max_tokens: 1000,
              response_format: { type: 'json_object' }
            }
          }));

          const batch2Jsonl = batch2JsonlLines.map(line => JSON.stringify(line)).join('\n');

          // Upload Batch 2 file
          sendProgress(`Step 2/3: Uploading Batch 2 JSONL file to OpenAI...`);

          const file2Res = await fetch(`${OPENAI_API_URL}/files`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${apiKey}` },
            body: createFormData(batch2Jsonl, 'batch2-metadata.jsonl')
          });

          if (!file2Res.ok) {
            const errorText = await file2Res.text();
            throw new Error(`Batch 2 file upload failed: ${errorText}`);
          }

          const file2Data = await file2Res.json();
          const inputFile2Id = file2Data.id;

          sendProgress(`Step 2/3: File uploaded (${inputFile2Id}), creating batch job...`);

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
                contentType,
                brand,
                model: MODEL_METADATA,
                generation
              }
            })
          });

          if (!batch2Res.ok) {
            const errorText = await batch2Res.text();
            throw new Error(`Batch 2 creation failed: ${errorText}`);
          }

          const batch2Data = await batch2Res.json();
          const batch2Id = batch2Data.id;

          sendProgress(`Step 2/3: Batch 2 created (${batch2Id}), polling for completion...`, { 
            batch1Id, 
            batch2Id,
            batch2Status: batch2Data.status
          });

          // Poll Batch 2 until complete
          const batch2Status = await pollBatchStatus(batch2Id, apiKey, sendProgress, 2);

          if (batch2Status.status !== 'completed') {
            throw new Error(`Batch 2 failed with status: ${batch2Status.status}`);
          }

          if (!batch2Status.output_file_id) {
            throw new Error('Batch 2 completed but no output file ID');
          }

          // Update job status to batch2_complete
          await updateJobStatus({ 
            status: 'batch2_complete',
            batch2_status: 'completed',
          });
          
          sendProgress(`Step 2/3: Batch 2 completed! Downloading results...`, { 
            batch1Id, 
            batch2Id,
            batch2Status: 'completed',
            outputFile2Id: batch2Status.output_file_id,
            errorFile2Id: batch2Status.error_file_id,
            requestCounts: batch2Status.request_counts
          });

          // Download Batch 2 results
          const batch2Results = await downloadAndParseJsonl(batch2Status.output_file_id, apiKey);
          
          // Download error file if it exists
          if (batch2Status.error_file_id) {
            try {
              const errorResults = await downloadAndParseJsonl(batch2Status.error_file_id, apiKey);
              sendProgress(`Step 2/3: Found ${errorResults.length} errors in Batch 2, using defaults where needed...`, {
                batch2Id,
                batch2Errors: errorResults.length
              });
            } catch (e) {
              console.warn('Failed to download Batch 2 error file:', e);
            }
          }

          // Map metadata by custom_id (order may not match input)
          const metadataMap = new Map<string, any>();
          let batch2Errors = 0;
          
          for (const result of batch2Results) {
            if (result.error) {
              batch2Errors++;
              console.error(`Batch 2 error for ${result.custom_id}:`, result.error);
              continue;
            }
            
            if (result.response?.status_code === 200 && result.response?.body?.choices?.[0]?.message?.content) {
              try {
                const metadata = JSON.parse(result.response.body.choices[0].message.content);
                metadataMap.set(result.custom_id, metadata);
              } catch (e) {
                batch2Errors++;
                console.error(`Failed to parse metadata for ${result.custom_id}:`, e);
                metadataMap.set(result.custom_id, {}); // Use empty metadata as fallback
              }
            } else if (result.response?.status_code !== 200) {
              batch2Errors++;
              console.error(`Batch 2 non-200 status for ${result.custom_id}:`, result.response?.status_code);
              metadataMap.set(result.custom_id, {}); // Use empty metadata as fallback
            }
          }
          
          if (batch2Errors > 0) {
            sendProgress(`Step 2/3: Warning - ${batch2Errors} metadata items failed, using defaults where needed...`, {
              batch2Id,
              batch2Errors
            });
          }

          sendProgress(`Step 3/3: Processing and inserting ${qaPairs.length} items into database...`, { 
            batch1Id, 
            batch2Id,
            itemsToProcess: qaPairs.length,
            progress: { current: 0, total: qaPairs.length, stage: 'Starting database insertion...' }
          });

          // ===== STEP 3: Process and Insert into Database =====
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
              .substring(0, 80); // Shorter to leave room for uniqueness
            // Add index and timestamp to ensure uniqueness without DB check
            return `${base}-${index}-${Date.now().toString(36)}`;
          }

          // Prepare all insert data first (batch processing for performance)
          const BATCH_SIZE = 100; // Insert 100 items at a time
          const insertBatches: any[][] = [];
          const indexNowUrls: string[] = [];

          sendProgress(`Step 3/3: Preparing ${qaPairs.length} items for batch insertion...`, { 
            batch1Id, 
            batch2Id,
            progress: { 
              current: 0, 
              total: qaPairs.length, 
              stage: 'Preparing data...' 
            }
          });

          // Prepare all data
          for (let i = 0; i < qaPairs.length; i++) {
            try {
              const { question, answer } = qaPairs[i];
              // Map metadata by index (metadata-1, metadata-2, etc.)
              const metadataId = `metadata-${i + 1}`;
              const metadata = metadataMap.get(metadataId) || {};
              
              // Ensure metadata has required fields
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
                model_generation_id: generationId,
                slug,
                title,
                description,
                language_path: language,
                status: 'live',
                ...(contentType === 'fault' ? {
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

              // Group into batches
              const batchIndex = Math.floor(i / BATCH_SIZE);
              if (!insertBatches[batchIndex]) {
                insertBatches[batchIndex] = [];
              }
              insertBatches[batchIndex].push(insertData);

              // Prepare IndexNow URL
              if (brandSlug && modelSlug && generationSlug) {
                const url = `https://faultbase.com/${language}/cars/${brandSlug}/${modelSlug}/${generationSlug}/${contentType === 'fault' ? 'faults' : 'manuals'}/${slug}`;
                indexNowUrls.push(url);
              }
            } catch (error) {
              failedCount++;
              const errorMsg = error instanceof Error ? error.message : 'Unknown error';
              errors.push(`Item ${i + 1}: ${errorMsg}`);
              console.error(`Error preparing item ${i + 1}:`, error);
            }
          }

          // Batch insert all prepared data
          const tableName = contentType === 'fault' ? 'car_faults' : 'car_manuals';
          
          for (let batchIndex = 0; batchIndex < insertBatches.length; batchIndex++) {
            const batch = insertBatches[batchIndex];
            if (batch.length === 0) continue;

            try {
              sendProgress(`Step 3/3: Inserting batch ${batchIndex + 1}/${insertBatches.length} (${batch.length} items)...`, { 
                batch1Id, 
                batch2Id,
                progress: { 
                  current: batchIndex * BATCH_SIZE, 
                  total: qaPairs.length, 
                  stage: `Batch ${batchIndex + 1}/${insertBatches.length}` 
                }
              });

              // Batch insert
              const { data: insertedData, error: insertError } = await supabase
                .from(tableName)
                .insert(batch)
                .select('id, slug');

              if (insertError) {
                // If batch insert fails, try individual inserts for this batch
                console.warn(`Batch insert failed for batch ${batchIndex + 1}, trying individual inserts:`, insertError);
                for (const item of batch) {
                  try {
                    const { error: singleError } = await supabase
                      .from(tableName)
                      .insert(item);
                    if (singleError) {
                      throw singleError;
                    }
                    successCount++;
                  } catch (singleErr: any) {
                    failedCount++;
                    errors.push(`Item in batch ${batchIndex + 1}: ${singleErr.message}`);
                  }
                }
              } else {
                successCount += insertedData?.length || batch.length;
              }

              // Send progress update
              try {
                if (controller.desiredSize !== null) {
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                    result: { success: true, batch: batchIndex + 1, totalBatches: insertBatches.length },
                    progress: { 
                      current: Math.min((batchIndex + 1) * BATCH_SIZE, qaPairs.length), 
                      total: qaPairs.length, 
                      stage: `Inserted batch ${batchIndex + 1}/${insertBatches.length}` 
                    }
                  })}\n\n`));
                }
              } catch (err: any) {
                if (err?.code !== 'ERR_INVALID_STATE') {
                  console.warn('Error sending progress update:', err);
                }
              }

              // Small delay between batches to avoid overwhelming the database
              if (batchIndex < insertBatches.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 100));
              }
            } catch (error) {
              failedCount += batch.length;
              const errorMsg = error instanceof Error ? error.message : String(error);
              errors.push(`Batch ${batchIndex + 1}: ${errorMsg}`);
              console.error(`Error inserting batch ${batchIndex + 1}:`, error);
            }
          }

          // Batch submit IndexNow URLs (non-blocking, fire and forget)
          if (indexNowUrls.length > 0 && brandSlug && modelSlug && generationSlug) {
            try {
              const { submitToIndexNow } = await import('@/lib/submitToIndexNow');
              // Submit in batches of 100 URLs
              const INDEXNOW_BATCH_SIZE = 100;
              for (let i = 0; i < indexNowUrls.length; i += INDEXNOW_BATCH_SIZE) {
                const urlBatch = indexNowUrls.slice(i, i + INDEXNOW_BATCH_SIZE);
                // Submit each URL (IndexNow handles batching internally)
                urlBatch.forEach(url => {
                  submitToIndexNow(url).catch(err => {
                    console.warn('[IndexNow] Failed to submit URL:', err);
                  });
                });
                // Small delay between batches
                if (i + INDEXNOW_BATCH_SIZE < indexNowUrls.length) {
                  await new Promise(resolve => setTimeout(resolve, 50));
                }
              }
            } catch (err) {
              console.warn('[IndexNow] Error:', err);
            }
          }

          // Final summary
          const summary = {
            success: successCount,
            failed: failedCount,
            total: qaPairs.length,
            batch1Id,
            batch2Id,
            model: MODEL_ANSWERS,
            modelAnswers: MODEL_ANSWERS,
            modelMetadata: MODEL_METADATA,
            batch1RequestCounts: batch1Status.request_counts,
            batch2RequestCounts: batch2Status.request_counts,
            errors: errors.slice(0, 50) // Limit errors in response
          };
          
          // Update job as completed
          if (jobRecordId) {
            try {
              await supabase
                .from('car_bulk_generation_jobs')
                .update({
                  status: 'completed',
                  success_count: successCount,
                  failed_count: failedCount,
                  progress_current: qaPairs.length,
                  progress_total: qaPairs.length,
                  current_stage: 'Complete!',
                  completed_at: new Date().toISOString(),
                  result: summary,
                  errors: errors.slice(0, 100), // Store more errors in DB
                  updated_at: new Date().toISOString(),
                })
                .eq('id', jobRecordId);
            } catch (e: any) {
              // Silently fail if table doesn't exist
              if (e?.code !== '42P01' && !e?.message?.includes('does not exist')) {
                console.error('Failed to update job completion:', e);
              }
            }
          }
          
          sendProgress(`Step 3/3: Complete! Successfully inserted ${successCount}/${qaPairs.length} items.`, {
            ...summary,
            progress: { current: qaPairs.length, total: qaPairs.length, stage: 'Complete!' }
          });
          
          try {
            if (controller.desiredSize !== null) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                complete: true,
                summary,
                jobId: jobRecordId
              })}\n\n`));
            }
          } catch (err: any) {
            if (err?.code !== 'ERR_INVALID_STATE') {
              console.warn('Error sending completion:', err);
            }
          } finally {
            try {
              controller.close();
            } catch (err: any) {
              // Controller already closed, ignore
            }
          }
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          
          // Update job as failed
          if (jobRecordId) {
            try {
              await supabase
                .from('car_bulk_generation_jobs')
                .update({
                  status: 'failed',
                  error_message: errorMsg,
                  updated_at: new Date().toISOString(),
                })
                .eq('id', jobRecordId);
            } catch (e: any) {
              // Silently fail if table doesn't exist
              if (e?.code !== '42P01' && !e?.message?.includes('does not exist')) {
                console.error('Failed to update job failure:', e);
              }
            }
          }
          
          try {
            if (controller.desiredSize !== null) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: errorMsg })}\n\n`));
            }
          } catch (err: any) {
            if (err?.code !== 'ERR_INVALID_STATE') {
              console.warn('Error sending error message:', err);
            }
          } finally {
            try {
              controller.close();
            } catch (err: any) {
              // Controller already closed, ignore
            }
          }
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
    */
  } catch (error) {
    console.error('Bulk generation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
