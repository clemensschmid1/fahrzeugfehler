import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { POST as bulkGeneratePOST } from '../bulk-generate/route';

export const runtime = 'nodejs';
export const maxDuration = 800; // ~13 minutes - Vercel maximum limit

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(supabaseUrl, supabaseKey);
}

/**
 * Worker endpoint that checks and continues processing all pending/processing jobs
 * This can be called:
 * - Manually via POST request
 * - Automatically via Vercel Cron Job (configure in vercel.json)
 * - Periodically via external cron service
 * 
 * The worker will:
 * 1. Find all jobs that need processing (batch1_created, batch1_complete, batch2_created, batch2_complete)
 * 2. Check their batch status with OpenAI
 * 3. Continue processing to the next step when batches complete
 */
export async function POST(req: Request) {
  try {
    const supabase = getSupabaseClient();
    
    // Find all jobs that need processing (including pending jobs that should be started)
    // NO LIMIT - process all jobs at once!
    const { data: jobs, error } = await supabase
      .from('car_bulk_generation_jobs')
      .select('*')
      .in('status', ['pending', 'batch1_created', 'batch1_complete', 'batch2_created', 'batch2_complete', 'processing'])
      .order('created_at', { ascending: true });
      // NO LIMIT - process ALL jobs!

    if (error) {
      // If table doesn't exist, return gracefully
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        return NextResponse.json({ 
          success: true, 
          message: 'Job table does not exist yet. Run migration first.',
          processed: 0 
        });
      }
      throw error;
    }

    if (!jobs || jobs.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'No jobs to process',
        processed: 0 
      });
    }

    const processed: string[] = [];
    const errors: string[] = [];

    // Separate pending jobs (need to start) from in-progress jobs (need to continue)
    const pendingJobs = jobs.filter(j => j.status === 'pending');
    const inProgressJobs = jobs.filter(j => j.status !== 'pending');
    
    console.log(`[Worker] Found ${pendingJobs.length} pending jobs and ${inProgressJobs.length} in-progress jobs`);
    
    // Process ALL pending jobs in parallel - no limits, no delays!
    console.log(`[Worker] Starting ${pendingJobs.length} pending jobs in parallel...`);
    await Promise.all(
      pendingJobs.map(async (job) => {
        try {
          console.log(`[Worker] Starting pending job ${job.id} (${job.content_type}, count: ${job.count})`);
          
          // Call the bulk-generate endpoint function directly
          const requestBody = {
            brandId: job.brand_id,
            modelId: job.model_id,
            generationId: job.generation_id,
            contentType: job.content_type,
            count: job.count,
            language: job.language || 'en',
            jobId: job.id,
          };
          
          const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 
            (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
          const request = new Request(`${baseUrl}/api/cars/bulk-generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
          });
          
          const response = await bulkGeneratePOST(request);
          
          if (response.ok) {
            const responseData = await response.json().catch(() => ({}));
            processed.push(job.id);
            console.log(`[Worker] Successfully started pending job ${job.id}`);
          } else {
            const errorText = await response.text();
            const statusText = response.statusText || response.status;
            console.error(`[Worker] Failed to start pending job ${job.id}: ${statusText} (${response.status})`);
            errors.push(`Pending ${job.id}: ${statusText} - ${errorText.substring(0, 200)}`);
          }
        } catch (err: any) {
          console.error(`[Worker] Error starting pending job ${job.id}:`, err);
          errors.push(`Pending ${job.id}: ${err.message || 'Unknown error'}`);
        }
      })
    );
    
    // Process ALL in-progress jobs in parallel - no limits, no delays!
    console.log(`[Worker] Continuing ${inProgressJobs.length} in-progress jobs in parallel...`);
    await Promise.all(
      inProgressJobs.map(async (job) => {
        try {
          console.log(`[Worker] Continuing job ${job.id} (status: ${job.status})`);
          
          const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 
            (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
          const request = new Request(`${baseUrl}/api/cars/bulk-generate-continue`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ jobId: job.id }),
          });
          
          const response = await bulkGenerateContinuePOST(request);

          if (response.ok) {
            processed.push(job.id);
            console.log(`[Worker] Successfully continued job ${job.id}`);
          } else {
            const errorText = await response.text();
            console.error(`[Worker] Failed to continue job ${job.id}: ${response.status} - ${errorText.substring(0, 200)}`);
            errors.push(`Continue ${job.id}: ${errorText.substring(0, 200)}`);
          }
        } catch (err: any) {
          console.error(`[Worker] Error continuing job ${job.id}:`, err);
          errors.push(`Continue ${job.id}: ${err.message || 'Unknown error'}`);
        }
      })
    );

    return NextResponse.json({
      success: true,
      message: `Processed ${processed.length}/${jobs.length} jobs`,
      processed: processed.length,
      total: jobs.length,
      errors: errors.length > 0 ? errors.slice(0, 10) : undefined, // Limit errors in response
    });
  } catch (error: any) {
    console.error('Worker error:', error);
    return NextResponse.json(
      { error: error.message || 'Unknown error', processed: 0 },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint for health check and manual triggering
 */
export async function GET() {
  try {
    const supabase = getSupabaseClient();
    
    const { data: jobs, error } = await supabase
      .from('car_bulk_generation_jobs')
      .select('id, status, current_stage, created_at')
      .in('status', ['pending', 'batch1_created', 'batch1_complete', 'batch2_created', 'batch2_complete', 'processing'])
      .order('created_at', { ascending: true })
      .limit(10);

    if (error && error.code !== '42P01') {
      throw error;
    }

    return NextResponse.json({
      success: true,
      pendingJobs: jobs?.length || 0,
      jobs: jobs || [],
      message: 'Worker is running. Use POST to process jobs.',
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Unknown error' },
      { status: 500 }
    );
  }
}

