import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { NextRequest } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 600; // 10 minutes - increased for AI question generation

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(supabaseUrl, supabaseKey);
}

/**
 * Submit multiple bulk generation jobs
 * Each job will be processed independently via the regular bulk-generate endpoint
 */
export async function POST(req: Request) {
  try {
    const { jobs } = await req.json();

    if (!Array.isArray(jobs) || jobs.length === 0) {
      return NextResponse.json({ error: 'Jobs array is required' }, { status: 400 });
    }

    if (jobs.length > 100) {
      return NextResponse.json({ error: 'Maximum 100 jobs per request' }, { status: 400 });
    }

    const supabase = getSupabaseClient();
    const createdJobs: string[] = [];

    // Validate and create job records
    for (const job of jobs) {
      const { brandId, modelId, generationId, contentType, count, language } = job;

      if (!brandId || !modelId || !generationId || !contentType || !count) {
        continue; // Skip invalid jobs
      }

      if (count < 1 || count > 50000) {
        continue; // Skip invalid counts
      }

      // Create job record (gracefully handle if table doesn't exist)
      try {
        const { data: newJob, error: jobError } = await supabase
          .from('car_bulk_generation_jobs')
          .insert({
            brand_id: brandId,
            model_id: modelId,
            generation_id: generationId,
            content_type: contentType,
            language: language || 'en',
            count,
            status: 'pending',
            progress_total: count,
          })
          .select('id')
          .single();

        if (!jobError && newJob) {
          createdJobs.push(newJob.id);
        } else if (jobError) {
          // If table doesn't exist, log warning but continue
          if (jobError.code === '42P01' || jobError.message?.includes('does not exist')) {
            console.warn('car_bulk_generation_jobs table does not exist. Run migration: supabase_migrations/create_car_bulk_generation_jobs_table.sql');
            // Continue without job tracking - jobs will still process
          }
        }
      } catch (err: any) {
        // Table might not exist - continue without job tracking
        if (err?.code === '42P01' || err?.message?.includes('does not exist')) {
          console.warn('car_bulk_generation_jobs table does not exist. Job tracking disabled.');
        } else {
          console.error('Error creating job record:', err);
        }
      }
    }

    if (createdJobs.length === 0) {
      return NextResponse.json({ error: 'No valid jobs created' }, { status: 400 });
    }

    // Start processing jobs asynchronously (fire and forget)
    // Jobs will be processed via bulk-generate endpoint in background
    // Note: Processing happens asynchronously, so we return immediately
    // Process ALL jobs aggressively in parallel
    processJobsAsync(createdJobs).catch(err => {
      console.error('Error processing jobs asynchronously:', err);
    });
    
    // Also trigger worker immediately to process any pending jobs
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 
                    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
    fetch(`${baseUrl}/api/cars/bulk-generate-worker`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }).catch(() => {}); // Ignore errors - worker might not be available

    return NextResponse.json({
      success: true,
      jobIds: createdJobs,
      message: `Created ${createdJobs.length} job(s). Processing in background. Jobs will continue even if you close the browser. Use the Worker endpoint to check status.`,
    });
  } catch (error: any) {
    console.error('Multiple bulk generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create jobs' },
      { status: 500 }
    );
  }
}

/**
 * Check OpenAI batch limit before creating new batches
 * OpenAI allows max 50 concurrent batches (validating, in_progress, finalizing)
 */
async function checkBatchLimit(apiKey: string): Promise<{ canProceed: boolean; activeCount: number; maxAllowed: number }> {
  try {
    const response = await fetch('https://api.openai.com/v1/batches?limit=100', {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    });
    
    if (response.ok) {
      const data = await response.json();
      const activeBatches = data.data?.filter((b: any) => 
        ['validating', 'in_progress', 'finalizing'].includes(b.status)
      ) || [];
      
      const maxAllowed = 50; // OpenAI's limit
      const activeCount = activeBatches.length;
      
      return {
        canProceed: activeCount < maxAllowed,
        activeCount,
        maxAllowed,
      };
    }
  } catch (error) {
    console.warn('[Batch Limit] Failed to check batch limit:', error);
  }
  
  // If check fails, allow proceeding (fail open)
  return { canProceed: true, activeCount: 0, maxAllowed: 50 };
}

/**
 * Process jobs asynchronously by calling the bulk-generate endpoint for each
 * Jobs are processed with batch limit checking to avoid exceeding OpenAI's 50 concurrent batch limit
 */
async function processJobsAsync(jobIds: string[]) {
  // NO LIMITS - process ALL jobs in parallel immediately!
  console.log(`[Bulk Multiple] Processing ALL ${jobIds.length} jobs in parallel (no limits, no delays!)...`);
  
  // Process ALL jobs in parallel - no batching, no waiting, no limits!
  await Promise.all(
    jobIds.map(jobId => processSingleJob(jobId))
  );
  
  console.log(`[Bulk Multiple] All ${jobIds.length} jobs started in parallel!`);
}

async function processSingleJob(jobId: string) {
  try {
    // Fetch job details
    const supabase = getSupabaseClient();
    const { data: job, error } = await supabase
      .from('car_bulk_generation_jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (error || !job) {
      console.error(`Failed to fetch job ${jobId}:`, error);
      return;
    }

    // Update status to processing
    try {
      await supabase
        .from('car_bulk_generation_jobs')
        .update({ status: 'processing', started_at: new Date().toISOString() })
        .eq('id', jobId);
    } catch (e: any) {
      // Silently fail if table doesn't exist
      if (e?.code !== '42P01' && !e?.message?.includes('does not exist')) {
        console.error(`Failed to update job ${jobId} status:`, e);
      }
    }

    // Call the regular bulk-generate endpoint internally
    // In development, always use localhost. In production, use the configured URL
    let baseUrl = 'http://127.0.0.1:3000'; // Default to localhost for development
    
    // Check if we're in development mode
    const isDevelopment = process.env.NODE_ENV === 'development' || 
                         !process.env.VERCEL_URL || 
                         process.env.VERCEL_ENV === 'development';
    
    if (isDevelopment) {
      // Always use localhost in development, even if NEXT_PUBLIC_SITE_URL is set
      if (process.env.PORT) {
        baseUrl = `http://127.0.0.1:${process.env.PORT}`;
      } else {
        baseUrl = 'http://127.0.0.1:3000';
      }
    } else {
      // Production: use configured URL
      if (process.env.NEXT_PUBLIC_SITE_URL) {
        baseUrl = process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '');
      } else if (process.env.VERCEL_URL) {
        baseUrl = `https://${process.env.VERCEL_URL}`;
      }
    }
    
    const apiUrl = `${baseUrl}/api/cars/bulk-generate`;
    console.log(`[Bulk Multiple] Calling bulk-generate for job ${jobId} at ${apiUrl}`);
    
    // Try calling the handler directly first (if possible)
    // Otherwise use HTTP fetch with retries
    let lastError: Error | null = null;
    const maxRetries = 3;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Use HTTP fetch with extended timeout for AI question generation
        // AI question generation can take several minutes for large batches (1000+ questions)
        // Increased timeout: 15 minutes for question generation + batch creation
        // The actual batch processing happens asynchronously via OpenAI Batch API
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15 * 60 * 1000); // 15 minutes
        
        try {
          const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'User-Agent': 'Faultbase-Internal/1.0',
              'X-Internal-Request': 'true',
              'Host': new URL(baseUrl).hostname, // Add Host header
            },
            body: JSON.stringify({
              brandId: job.brand_id,
              modelId: job.model_id,
              generationId: job.generation_id,
              contentType: job.content_type,
              count: job.count,
              language: job.language,
              jobId: job.id,
            }),
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            const contentType = response.headers.get('content-type');
            let errorText = '';
            
            if (contentType?.includes('application/json')) {
              try {
                const errorJson = await response.json();
                errorText = errorJson.error || JSON.stringify(errorJson);
              } catch {
                errorText = await response.text();
              }
            } else {
              errorText = await response.text();
              // Check if it's a 404 HTML page
              if (errorText.includes('404') || errorText.includes('This page could not be found') || errorText.includes('<!DOCTYPE html>')) {
                throw new Error(`API route returned 404. The route /api/cars/bulk-generate may not be accessible. URL: ${apiUrl}. This usually means the route file doesn't exist or Next.js hasn't compiled it yet.`);
              } else if (errorText.length > 500) {
                errorText = errorText.substring(0, 500) + '... (truncated)';
              }
            }
            
            // Don't retry on 4xx errors (except 429 rate limit)
            if (response.status >= 400 && response.status < 500 && response.status !== 429) {
              throw new Error(`Job ${jobId} failed with status ${response.status}: ${errorText}`);
            }
            
            // Retry on 5xx errors and 429 rate limits
            throw new Error(`Job ${jobId} failed with status ${response.status}: ${errorText}`);
          }

          // For streaming responses, consume the stream
          const reader = response.body?.getReader();
          if (reader) {
            const decoder = new TextDecoder();
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              decoder.decode(value, { stream: true });
            }
          }
          
          // Success
          return;
        } finally {
          clearTimeout(timeoutId);
        }
      } catch (fetchError: any) {
        lastError = fetchError;
        
        // Don't retry on certain errors
        if (fetchError.message?.includes('404') || 
            fetchError.message?.includes('API route returned 404') ||
            fetchError.name === 'AbortError') {
          throw fetchError;
        }
        
        // Wait before retrying (exponential backoff)
        if (attempt < maxRetries) {
          const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
          console.log(`[Bulk Multiple] Retry ${attempt}/${maxRetries} for job ${jobId} after ${waitTime}ms: ${fetchError.message}`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    }
    
    // All retries failed
    if (lastError) {
      if (lastError.message?.includes('ECONNREFUSED') || lastError.message?.includes('ENOTFOUND') || lastError.message?.includes('getaddrinfo')) {
        throw new Error(`Job ${jobId} failed: Cannot connect to API at ${apiUrl} after ${maxRetries} attempts. Make sure the Next.js dev server is running on port 3000. Error: ${lastError.message}`);
      }
      throw lastError;
    }
    
    throw new Error(`Job ${jobId} failed: Unknown error after ${maxRetries} attempts`);
  } catch (error: any) {
    console.error(`Error processing job ${jobId}:`, error);
    
          // Update job status to failed
          try {
            const supabase = getSupabaseClient();
            await supabase
              .from('car_bulk_generation_jobs')
              .update({
                status: 'failed',
                error_message: error.message || 'Unknown error',
                updated_at: new Date().toISOString(),
              })
              .eq('id', jobId);
          } catch (e: any) {
            // Silently fail if table doesn't exist
            if (e?.code !== '42P01' && !e?.message?.includes('does not exist')) {
              console.error(`Failed to update job ${jobId} failure status:`, e);
            }
          }
  }
}
