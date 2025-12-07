import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const maxDuration = 3600; // 60 minutes for large recovery operations

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

async function checkBatchStatus(batchId: string, apiKey: string) {
  const res = await fetch(`${OPENAI_API_URL}/batches/${batchId}`, {
    headers: { 'Authorization': `Bearer ${apiKey}` },
  });
  if (!res.ok) {
    throw new Error(`Failed to check batch status: ${res.status} ${await res.text()}`);
  }
  return await res.json();
}

async function downloadAndParseJsonl(fileId: string, apiKey: string) {
  const fileRes = await fetch(`${OPENAI_API_URL}/files/${fileId}/content`, {
    headers: { 'Authorization': `Bearer ${apiKey}` },
  });
  if (!fileRes.ok) {
    throw new Error(`Failed to download file: ${fileRes.status}`);
  }
  const text = await fileRes.text();
  return text
    .split('\n')
    .filter(line => line.trim())
    .map(line => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    })
    .filter(item => item !== null);
}

// Import the question generation functions from bulk-generate
import { generateFaultQuestions, generateManualQuestions } from '../bulk-generate/route';

export async function POST(req: Request) {
  try {
    const { jobId, recoverAll = false } = await req.json();
    const supabase = getSupabaseClient();
    const apiKey = getOpenAIApiKey();

    // Find jobs to recover
    let jobs: any[] = [];
    
    if (jobId) {
      // Recover specific job
      const { data: job, error } = await supabase
        .from('car_bulk_generation_jobs')
        .select('*')
        .eq('id', jobId)
        .single();
      
      if (error || !job) {
        return NextResponse.json({ error: 'Job not found' }, { status: 404 });
      }
      jobs = [job];
    } else if (recoverAll) {
      // Recover all jobs with batch IDs that are not completed
      const { data: allJobs, error } = await supabase
        .from('car_bulk_generation_jobs')
        .select('*')
        .or('batch1_id.not.is.null,batch2_id.not.is.null')
        .in('status', ['batch1_created', 'batch1_complete', 'batch2_created', 'batch2_complete', 'processing', 'failed'])
        .order('created_at', { ascending: true });
      
      if (error) {
        throw error;
      }
      jobs = allJobs || [];
    } else {
      return NextResponse.json({ error: 'Either jobId or recoverAll=true required' }, { status: 400 });
    }

    if (jobs.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'No jobs to recover',
        recovered: 0 
      });
    }

    const results = {
      total: jobs.length,
      recovered: 0,
      skipped: 0,
      failed: 0,
      errors: [] as string[],
    };

    console.log(`[Recovery] Processing ${jobs.length} jobs...`);

    for (const job of jobs) {
      try {
        // Fetch brand, model, generation data
        const [brandResult, modelResult, generationResult] = await Promise.all([
          supabase.from('car_brands').select('*').eq('id', job.brand_id).single(),
          supabase.from('car_models').select('*').eq('id', job.model_id).single(),
          supabase.from('model_generations').select('*').eq('id', job.generation_id).single(),
        ]);

        if (brandResult.error || !brandResult.data) {
          results.errors.push(`Job ${job.id}: Brand not found`);
          results.failed++;
          continue;
        }
        if (modelResult.error || !modelResult.data) {
          results.errors.push(`Job ${job.id}: Model not found`);
          results.failed++;
          continue;
        }
        if (generationResult.error || !generationResult.data) {
          results.errors.push(`Job ${job.id}: Generation not found`);
          results.failed++;
          continue;
        }

        const brand = brandResult.data;
        const model = modelResult.data;
        const generation = generationResult.data;

        // Check Batch 1 status
        let batch1Status = null;
        let batch1Results = null;
        let qaPairs: Array<{ question: string; answer: string }> = [];

        if (job.batch1_id) {
          try {
            batch1Status = await checkBatchStatus(job.batch1_id, apiKey);
            
            if (batch1Status.status === 'completed' && batch1Status.output_file_id) {
              // Download Batch 1 results
              batch1Results = await downloadAndParseJsonl(batch1Status.output_file_id, apiKey);
              
              // Regenerate questions to map results
              const questions = job.content_type === 'fault'
                ? await generateFaultQuestions(brand.name, model.name, generation.name, generation.generation_code, job.count, job.language as 'en' | 'de', apiKey)
                : await generateManualQuestions(brand.name, model.name, generation.name, generation.generation_code, job.count, job.language as 'en' | 'de', apiKey);
              
              // Map results to Q&A pairs
              qaPairs = batch1Results
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

              console.log(`[Recovery] Job ${job.id}: Batch 1 completed, ${qaPairs.length} Q&A pairs extracted`);
            } else if (['validating', 'in_progress', 'finalizing'].includes(batch1Status.status)) {
              console.log(`[Recovery] Job ${job.id}: Batch 1 still ${batch1Status.status}, skipping`);
              results.skipped++;
              continue;
            } else {
              console.log(`[Recovery] Job ${job.id}: Batch 1 status: ${batch1Status.status}, skipping`);
              results.skipped++;
              continue;
            }
          } catch (err: any) {
            results.errors.push(`Job ${job.id}: Batch 1 error - ${err.message}`);
            results.failed++;
            continue;
          }
        }

        // Check Batch 2 status
        let batch2Status = null;
        let batch2Results = null;
        let metadataMap = new Map();

        if (job.batch2_id) {
          try {
            batch2Status = await checkBatchStatus(job.batch2_id, apiKey);
            
            if (batch2Status.status === 'completed' && batch2Status.output_file_id) {
              // Download Batch 2 results
              batch2Results = await downloadAndParseJsonl(batch2Status.output_file_id, apiKey);
              
              // Map metadata
              for (const result of batch2Results) {
                if (result.error || result.response?.status_code !== 200) continue;
                try {
                  const metadata = JSON.parse(result.response?.body?.choices?.[0]?.message?.content || '{}');
                  const questionIndex = parseInt(result.custom_id?.replace('metadata-', '') || '0') - 1;
                  if (questionIndex >= 0) {
                    metadataMap.set(questionIndex, metadata);
                  }
                } catch (e) {
                  // Invalid metadata, skip
                }
              }

              console.log(`[Recovery] Job ${job.id}: Batch 2 completed, ${metadataMap.size} metadata entries extracted`);
            } else if (['validating', 'in_progress', 'finalizing'].includes(batch2Status.status)) {
              console.log(`[Recovery] Job ${job.id}: Batch 2 still ${batch2Status.status}, will insert without metadata`);
            } else {
              console.log(`[Recovery] Job ${job.id}: Batch 2 status: ${batch2Status.status}, will insert without metadata`);
            }
          } catch (err: any) {
            console.warn(`[Recovery] Job ${job.id}: Batch 2 error - ${err.message}, continuing without metadata`);
          }
        }

        // If we have Q&A pairs, insert them into database
        if (qaPairs.length > 0) {
          const { submitMultipleToIndexNow } = await import('@/lib/submitToIndexNow');
          const indexNowUrls: string[] = [];
          let inserted = 0;

          for (let i = 0; i < qaPairs.length; i++) {
            const { question, answer } = qaPairs[i];
            const metadata = metadataMap.get(i) || {};

            // Generate slug
            const slug = question
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/^-+|-+$/g, '')
              .substring(0, 100);

            // Insert into database
            const insertData: any = {
              model_generation_id: job.generation_id,
              title: question,
              content: answer,
              slug,
              language_path: job.language,
              status: 'live',
              severity: metadata.severity || 'medium',
              difficulty_level: metadata.difficulty_level || 'medium',
              error_code: metadata.error_code || null,
              affected_component: metadata.affected_component || null,
              symptoms: metadata.symptoms || [],
              diagnostic_steps: metadata.diagnostic_steps || [],
              tools_required: metadata.tools_required || [],
              estimated_repair_time: metadata.estimated_repair_time || null,
              meta_title: metadata.meta_title || question.substring(0, 60),
              meta_description: metadata.meta_description || answer.substring(0, 160),
              seo_score: metadata.seo_score || null,
              content_score: metadata.content_score || null,
            };

            if (job.content_type === 'manual') {
              insertData.manual_type = metadata.manual_type || 'maintenance';
              insertData.estimated_time = metadata.estimated_time || null;
              insertData.parts_required = metadata.parts_required || [];
            }

            const tableName = job.content_type === 'fault' ? 'car_faults' : 'car_manuals';
            const { error: insertError } = await supabase
              .from(tableName)
              .insert(insertData);

            if (insertError) {
              // Check if it's a duplicate (slug already exists)
              if (insertError.code === '23505') {
                console.log(`[Recovery] Job ${job.id}: Skipping duplicate entry: ${slug}`);
              } else {
                results.errors.push(`Job ${job.id}: Insert error for ${slug} - ${insertError.message}`);
              }
            } else {
              inserted++;
              const url = `https://faultbase.com/${job.language}/cars/${brand.slug}/${model.slug}/${generation.slug}/${job.content_type === 'fault' ? 'faults' : 'manuals'}/${slug}`;
              indexNowUrls.push(url);
            }
          }

          // Update job status
          await supabase
            .from('car_bulk_generation_jobs')
            .update({
              status: 'completed',
              batch1_status: batch1Status?.status || job.batch1_status,
              batch2_status: batch2Status?.status || job.batch2_status,
              success_count: inserted,
              failed_count: qaPairs.length - inserted,
              current_stage: `Recovered: ${inserted} entries inserted`,
              completed_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('id', job.id);

          // Submit to IndexNow (non-blocking)
          if (indexNowUrls.length > 0) {
            submitMultipleToIndexNow(indexNowUrls).catch(err => {
              console.warn(`[Recovery] Failed to submit URLs to IndexNow:`, err);
            });
          }

          console.log(`[Recovery] Job ${job.id}: Successfully recovered ${inserted}/${qaPairs.length} entries`);
          results.recovered++;
        } else {
          results.errors.push(`Job ${job.id}: No Q&A pairs to recover`);
          results.failed++;
        }
      } catch (err: any) {
        results.errors.push(`Job ${job.id}: ${err.message || 'Unknown error'}`);
        results.failed++;
        console.error(`[Recovery] Error processing job ${job.id}:`, err);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Recovery complete: ${results.recovered} recovered, ${results.skipped} skipped, ${results.failed} failed`,
      ...results,
    });
  } catch (error: any) {
    console.error('[Recovery] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Unknown error' },
      { status: 500 }
    );
  }
}

