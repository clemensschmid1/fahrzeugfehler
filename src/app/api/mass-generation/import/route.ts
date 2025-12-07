import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { readFile } from 'fs/promises';
import { join } from 'path';

export const runtime = 'nodejs';
export const maxDuration = 3600; // 60 minutes for large imports

const OPENAI_API_URL = 'https://api.openai.com/v1';

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
      console.error('Failed to parse JSONL line:', e);
      return null;
    }
  }).filter(item => item !== null);
}

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

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const questionsFile = formData.get('questionsFile') as File;
    const answersFile = formData.get('answersFile') as File;
    const metadataFile = formData.get('metadataFile') as File | null;
    const contentType = (formData.get('contentType') as string) || 'fault';
    const generationIdsStr = formData.get('generationIds') as string;
    const generationIds = generationIdsStr ? JSON.parse(generationIdsStr) : [];
    const questionsPerGeneration = parseInt(formData.get('questionsPerGeneration') as string) || 0;
    const language = (formData.get('language') as string) || 'en';

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

    if (metadataFile && !metadataFile.name.endsWith('.jsonl')) {
      return NextResponse.json({ error: 'Metadata file must be a .jsonl file' }, { status: 400 });
    }

    const apiKey = getOpenAIApiKey();
    const supabase = getSupabaseClient();

    // Read questions file
    const questionsJsonl = await questionsFile.text();

    const questionsLines = questionsJsonl.trim().split('\n').filter(line => line.trim());
    const questionsMap = new Map<string, { question: string; generationId: string }>();
    
    for (const line of questionsLines) {
      try {
        const parsed = JSON.parse(line);
        // Extract question from user message (remove brand/model/generation suffix)
        const userContent = parsed.body.messages[1].content;
        // Remove the " - Brand Model Generation" suffix if present
        const question = userContent.split(' - ')[0];
        // Extract generation_id from custom_id: answer-{generationId}-{index}
        const customId = parsed.custom_id || '';
        const match = customId.match(/^answer-(.+?)-(\d+)$/);
        const generationId = match ? match[1] : null;
        
        if (generationId) {
          questionsMap.set(customId, { question, generationId });
        }
      } catch (e) {
        console.error('Failed to parse question line:', e);
      }
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

    // Map answers to questions by custom_id
    const qaPairs: Array<{ question: string; answer: string; index: number; generationId?: string }> = [];
    let index = 0;
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
            index: index++,
            generationId: questionData.generationId,
          });
        }
      }
    }

    // Get all unique generation IDs from qaPairs
    const extractedGenerationIds = [...new Set(qaPairs.map(qa => qa.generationId).filter(Boolean))];
    
    if (extractedGenerationIds.length === 0) {
      return NextResponse.json({ error: 'No generation IDs found in questions file' }, { status: 400 });
    }

    // Fetch all generation data with model and brand info
    const { data: generationsData, error: generationsError } = await supabase
      .from('model_generations')
      .select('id, name, slug, generation_code, car_model_id, car_models!inner(id, name, slug, brand_id, car_brands!inner(id, name, slug))')
      .in('id', extractedGenerationIds);

    if (generationsError || !generationsData) {
      return NextResponse.json({ error: 'Failed to fetch generation data' }, { status: 500 });
    }

    // Create maps for quick lookup
    const generationsMap = new Map(generationsData.map(g => [g.id, g]));
    const modelsMap = new Map();
    const brandsMap = new Map();
    
    for (const gen of generationsData) {
      const model = (gen.car_models as any);
      if (model && !modelsMap.has(model.id)) {
        modelsMap.set(model.id, model);
      }
      if (model && model.car_brands && !brandsMap.has(model.brand_id)) {
        brandsMap.set(model.brand_id, model.car_brands);
      }
    }

    // Read metadata file if available
    const metadataMap = new Map<string, any>();
    if (metadataFile) {
      try {
        const metadataJsonl = await metadataFile.text();
        const metadataLines = metadataJsonl.trim().split('\n').filter(line => line.trim());
        const metadataResults = metadataLines.map(line => {
          try {
            return JSON.parse(line);
          } catch (e) {
            return null;
          }
        }).filter(item => item !== null);
        for (const result of metadataResults) {
          if (result.error || result.response?.status_code !== 200) {
            continue;
          }
          try {
            const metadata = JSON.parse(result.response?.body?.choices?.[0]?.message?.content || '{}');
            metadataMap.set(result.custom_id, metadata);
          } catch (e) {
            console.error('Failed to parse metadata:', e);
          }
        }
      } catch (err) {
        console.warn('Failed to download metadata, continuing without it:', err);
      }
    }

    if (qaPairs.length === 0) {
      return NextResponse.json({ error: 'No valid Q&A pairs found' }, { status: 400 });
    }

    // Prepare insert data in batches
    // Use larger batches to reduce number of requests (Supabase can handle up to 1000 rows per query)
    // But we use 500 to be safe and avoid timeout issues
    const BATCH_SIZE = 500;
    const insertBatches: any[][] = [];
    const indexNowUrls: string[] = [];

    for (let i = 0; i < qaPairs.length; i++) {
      try {
        const qaPair = qaPairs[i];
        const metadataId = `metadata-${i + 1}`;
        const metadata = metadataMap.get(metadataId) || {};
        
        const { question, answer, generationId: qaGenerationId } = qaPair;
        
        // Get generation data for this question
        const generation = qaGenerationId ? generationsMap.get(qaGenerationId) : null;
        if (!generation) {
          console.warn(`Generation not found for question ${i + 1}, skipping`);
          continue;
        }
        
        // Get model and brand data for this generation
        const model = (generation.car_models as any);
        const brand = model && model.car_brands ? model.car_brands : null;
        const brandSlug = brand?.slug;
        const modelSlug = model?.slug;
        
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
          model_generation_id: generation.id,
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

        if (brandSlug && modelSlug && generation.slug) {
          const url = `https://faultbase.com/${language}/cars/${brandSlug}/${modelSlug}/${generation.slug}/${contentType === 'fault' ? 'faults' : 'manuals'}/${slug}`;
          indexNowUrls.push(url);
        }
      } catch (error) {
        console.error(`Error preparing item ${i + 1}:`, error);
      }
    }

    // Batch insert all data
    const tableName = contentType === 'fault' ? 'car_faults' : 'car_manuals';
    let successCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    // Rate limiting: Supabase has ~120 requests/minute limit
    // We'll process batches with delays to stay under the limit
    const REQUESTS_PER_MINUTE = 100; // Stay well under 120 to be safe
    const DELAY_BETWEEN_BATCHES_MS = Math.ceil((60 * 1000) / REQUESTS_PER_MINUTE); // ~600ms between batches

    for (let batchIndex = 0; batchIndex < insertBatches.length; batchIndex++) {
      const batch = insertBatches[batchIndex];
      if (batch.length === 0) continue;

      let retryCount = 0;
      const maxRetries = 3;
      let batchSuccess = false;

      while (retryCount < maxRetries && !batchSuccess) {
        try {
          const { data: insertedData, error: insertError } = await supabase
            .from(tableName)
            .insert(batch)
            .select('id, slug');

          if (insertError) {
            // Check if it's a rate limit error
            const isRateLimit = insertError.message?.includes('rate limit') || 
                               insertError.message?.includes('too many requests') ||
                               insertError.code === 'PGRST116' ||
                               (insertError as any).status === 429;

            if (isRateLimit && retryCount < maxRetries - 1) {
              // Wait longer before retry (exponential backoff)
              const waitTime = DELAY_BETWEEN_BATCHES_MS * Math.pow(2, retryCount) * 2;
              console.warn(`Rate limit hit for batch ${batchIndex + 1}, waiting ${waitTime}ms before retry ${retryCount + 1}/${maxRetries}`);
              await new Promise(resolve => setTimeout(resolve, waitTime));
              retryCount++;
              continue;
            }

            // If not rate limit or max retries reached, try individual inserts for this batch
            console.warn(`Batch insert failed for batch ${batchIndex + 1}, trying smaller batches:`, insertError.message);
            
            // Split into smaller batches of 100
            const SMALL_BATCH_SIZE = 100;
            for (let i = 0; i < batch.length; i += SMALL_BATCH_SIZE) {
              const smallBatch = batch.slice(i, i + SMALL_BATCH_SIZE);
              try {
                const { error: smallError } = await supabase.from(tableName).insert(smallBatch);
                if (smallError) {
                  // Last resort: individual inserts
                  for (const item of smallBatch) {
                    try {
                      const { error: singleError } = await supabase.from(tableName).insert(item);
                      if (singleError) throw singleError;
                      successCount++;
                    } catch {
                      failedCount++;
                    }
                  }
                } else {
                  successCount += smallBatch.length;
                }
                // Small delay between small batches
                if (i + SMALL_BATCH_SIZE < batch.length) {
                  await new Promise(resolve => setTimeout(resolve, 200));
                }
              } catch (smallError) {
                failedCount += smallBatch.length;
              }
            }
            batchSuccess = true;
          } else {
            successCount += insertedData?.length || batch.length;
            batchSuccess = true;
          }
        } catch (error) {
          const isRateLimit = error instanceof Error && (
            error.message?.includes('rate limit') || 
            error.message?.includes('too many requests')
          );

          if (isRateLimit && retryCount < maxRetries - 1) {
            const waitTime = DELAY_BETWEEN_BATCHES_MS * Math.pow(2, retryCount) * 2;
            console.warn(`Rate limit error for batch ${batchIndex + 1}, waiting ${waitTime}ms before retry ${retryCount + 1}/${maxRetries}`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            retryCount++;
            continue;
          }

          failedCount += batch.length;
          errors.push(`Batch ${batchIndex + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          batchSuccess = true; // Exit retry loop even on error
        }
      }

      // Rate limiting: Add delay between batches to stay under 120 requests/minute
      if (batchIndex < insertBatches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES_MS));
      }
    }

    // Submit IndexNow URLs (non-blocking)
    if (indexNowUrls.length > 0) {
      try {
        const { submitMultipleToIndexNow } = await import('@/lib/submitToIndexNow');
        const INDEXNOW_BATCH_SIZE = 100;
        for (let i = 0; i < indexNowUrls.length; i += INDEXNOW_BATCH_SIZE) {
          const urlBatch = indexNowUrls.slice(i, i + INDEXNOW_BATCH_SIZE);
          submitMultipleToIndexNow(urlBatch).catch(() => {
            // Fail silently - IndexNow is not critical
          });
          if (i + INDEXNOW_BATCH_SIZE < indexNowUrls.length) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }
      } catch (error) {
        console.warn('[IndexNow] Failed to submit URLs:', error);
      }
    }

    return NextResponse.json({
      success: true,
      successCount,
      failed: failedCount,
      total: qaPairs.length,
    });
  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

