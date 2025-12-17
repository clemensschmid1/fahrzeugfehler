import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { POST as bulkGeneratePOST } from '../bulk-generate/route';
import { POST as bulkGenerateContinuePOST } from '../bulk-generate-continue/route';

export const runtime = 'nodejs';
export const maxDuration = 800; // ~13 minutes - Vercel maximum limit

const OPENAI_API_URL = 'https://api.openai.com/v1';

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(supabaseUrl, supabaseKey);
}

function getOpenAIApiKey() {
  return process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY || '';
}

/**
 * Analyze a failed job to determine the failure reason
 */
async function analyzeJobFailure(job: any, apiKey: string): Promise<{
  category: 'batch_still_running' | 'batch_failed' | 'timeout' | 'other_error' | 'recoverable';
  reason: string;
  canAutoFix: boolean;
  fixAction?: 'restart' | 'continue' | 'check_batch';
}> {
  const errorMessage = job.error_message || '';
  const status = job.status;
  const batch1Id = job.batch1_id;
  const batch2Id = job.batch2_id;

  // Check if batches are still running (most common "false positive" failure)
  if (batch1Id || batch2Id) {
    try {
      if (batch1Id) {
        const batch1Res = await fetch(`${OPENAI_API_URL}/batches/${batch1Id}`, {
          headers: { 'Authorization': `Bearer ${apiKey}` },
        });
        if (batch1Res.ok) {
          const batch1Data = await batch1Res.json();
          const batch1Status = batch1Data.status;
          
          if (['validating', 'in_progress', 'finalizing'].includes(batch1Status)) {
            return {
              category: 'batch_still_running',
              reason: `Batch 1 is still ${batch1Status} - job was marked as failed incorrectly`,
              canAutoFix: true,
              fixAction: 'continue',
            };
          }
          
          if (batch1Status === 'completed' && status !== 'batch1_complete' && status !== 'batch2_created') {
            return {
              category: 'recoverable',
              reason: 'Batch 1 completed but job status not updated - can continue to Batch 2',
              canAutoFix: true,
              fixAction: 'continue',
            };
          }
          
          if (batch1Status === 'failed') {
            return {
              category: 'batch_failed',
              reason: `Batch 1 failed: ${batch1Data.errors?.message || 'Unknown error'}`,
              canAutoFix: true,
              fixAction: 'restart', // Restart the entire job
            };
          }
        }
      }
      
      if (batch2Id) {
        const batch2Res = await fetch(`${OPENAI_API_URL}/batches/${batch2Id}`, {
          headers: { 'Authorization': `Bearer ${apiKey}` },
        });
        if (batch2Res.ok) {
          const batch2Data = await batch2Res.json();
          const batch2Status = batch2Data.status;
          
          if (['validating', 'in_progress', 'finalizing'].includes(batch2Status)) {
            return {
              category: 'batch_still_running',
              reason: `Batch 2 is still ${batch2Status} - job was marked as failed incorrectly`,
              canAutoFix: true,
              fixAction: 'continue',
            };
          }
          
          if (batch2Status === 'completed' && status !== 'batch2_complete' && status !== 'completed') {
            return {
              category: 'recoverable',
              reason: 'Batch 2 completed but job status not updated - can continue to database insertion',
              canAutoFix: true,
              fixAction: 'continue',
            };
          }
          
          if (batch2Status === 'failed') {
            return {
              category: 'batch_failed',
              reason: `Batch 2 failed: ${batch2Data.errors?.message || 'Unknown error'}`,
              canAutoFix: true,
              fixAction: 'restart', // Restart from Batch 2 if Batch 1 is complete
            };
          }
        }
      }
    } catch (err) {
      // If we can't check batch status, continue with other checks
      console.warn(`[Fixer] Could not check batch status for job ${job.id}:`, err);
    }
  }

  // Check for timeout errors
  if (errorMessage.includes('timeout') || errorMessage.includes('polling timeout') || errorMessage.includes('Exceeded maximum polling attempts')) {
    return {
      category: 'timeout',
      reason: 'Job timed out during polling - batches may still be running',
      canAutoFix: true,
      fixAction: 'check_batch', // Check batch status and continue if needed
    };
  }

  // Check for recoverable errors
  if (errorMessage.includes('will be continued via worker') || 
      errorMessage.includes('polling timeout') ||
      errorMessage.includes('Gateway Time-out')) {
    return {
      category: 'recoverable',
      reason: 'Temporary error - can be recovered',
      canAutoFix: true,
      fixAction: 'continue',
    };
  }

  // Other errors - may or may not be recoverable
  return {
    category: 'other_error',
    reason: errorMessage || 'Unknown error',
    canAutoFix: false, // Need manual review
    fixAction: undefined,
  };
}

/**
 * Fix a failed job based on analysis
 */
async function fixJob(job: any, analysis: { fixAction?: string }, supabase: any, apiKey: string): Promise<{ success: boolean; message: string }> {
  if (!analysis.fixAction) {
    return { success: false, message: 'No fix action available for this job' };
  }

  try {
    if (analysis.fixAction === 'restart') {
      // Restart the entire job
      console.log(`[Fixer] Restarting job ${job.id}...`);
      
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 
        (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
      const request = new Request(`${baseUrl}/api/cars/bulk-generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandId: job.brand_id,
          modelId: job.model_id,
          generationId: job.generation_id,
          contentType: job.content_type,
          count: job.count,
          language: job.language || 'en',
          jobId: job.id, // Use existing job ID
        }),
      });
      
      const response = await bulkGeneratePOST(request);
      
      if (response.ok) {
        await supabase
          .from('car_bulk_generation_jobs')
          .update({
            status: 'processing',
            error_message: null,
            current_stage: 'Restarted by fixer',
            updated_at: new Date().toISOString(),
          })
          .eq('id', job.id);
        
        return { success: true, message: 'Job restarted successfully' };
      } else {
        const errorText = await response.text();
        return { success: false, message: `Failed to restart: ${errorText.substring(0, 200)}` };
      }
    } else if (analysis.fixAction === 'continue') {
      // Continue from current state
      console.log(`[Fixer] Continuing job ${job.id}...`);
      
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 
        (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
      const request = new Request(`${baseUrl}/api/cars/bulk-generate-continue`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: job.id }),
      });
      
      const response = await bulkGenerateContinuePOST(request);
      
      if (response.ok) {
        return { success: true, message: 'Job continuation triggered successfully' };
      } else {
        const errorText = await response.text();
        return { success: false, message: `Failed to continue: ${errorText.substring(0, 200)}` };
      }
    } else if (analysis.fixAction === 'check_batch') {
      // Update status based on batch state
      console.log(`[Fixer] Checking and updating job ${job.id} status...`);
      
      let newStatus = job.status;
      let newStage = 'Checking batch status...';
      
      if (job.batch1_id) {
        const batch1Res = await fetch(`${OPENAI_API_URL}/batches/${job.batch1_id}`, {
          headers: { 'Authorization': `Bearer ${apiKey}` },
        });
        if (batch1Res.ok) {
          const batch1Data = await batch1Res.json();
          if (batch1Data.status === 'completed') {
            newStatus = 'batch1_complete';
            newStage = 'Batch 1 completed - ready for Batch 2';
          } else if (['validating', 'in_progress', 'finalizing'].includes(batch1Data.status)) {
            newStatus = 'batch1_created';
            newStage = `Batch 1 is ${batch1Data.status} - will continue via worker`;
          }
        }
      }
      
      await supabase
        .from('car_bulk_generation_jobs')
        .update({
          status: newStatus,
          current_stage: newStage,
          error_message: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', job.id);
      
      return { success: true, message: `Job status updated to ${newStatus}` };
    }
    
    return { success: false, message: 'Unknown fix action' };
  } catch (err: any) {
    return { success: false, message: `Error fixing job: ${err.message || 'Unknown error'}` };
  }
}

/**
 * GET endpoint - Analyze failed jobs and show statistics
 */
export async function GET() {
  try {
    const supabase = getSupabaseClient();
    const apiKey = getOpenAIApiKey();
    
    // Fetch all failed jobs
    const { data: failedJobs, error } = await supabase
      .from('car_bulk_generation_jobs')
      .select('*')
      .eq('status', 'failed')
      .order('created_at', { ascending: false });
    
    if (error) {
      if (error.code === '42P01') {
        return NextResponse.json({ 
          error: 'Job table does not exist',
          total: 0,
          categories: {},
        });
      }
      throw error;
    }
    
    if (!failedJobs || failedJobs.length === 0) {
      return NextResponse.json({
        success: true,
        total: 0,
        message: 'No failed jobs found',
        categories: {},
        jobs: [],
      });
    }
    
    // Analyze all failed jobs
    const analyses = await Promise.all(
      failedJobs.map(job => analyzeJobFailure(job, apiKey))
    );
    
    // Categorize jobs
    const categories: Record<string, { count: number; jobs: any[] }> = {};
    failedJobs.forEach((job, index) => {
      const analysis = analyses[index];
      const category = analysis.category;
      if (!categories[category]) {
        categories[category] = { count: 0, jobs: [] };
      }
      categories[category].count++;
      categories[category].jobs.push({
        id: job.id,
        reason: analysis.reason,
        canAutoFix: analysis.canAutoFix,
        fixAction: analysis.fixAction,
        errorMessage: job.error_message,
        status: job.status,
        createdAt: job.created_at,
      });
    });
    
    // Count auto-fixable jobs
    const autoFixableCount = analyses.filter(a => a.canAutoFix).length;
    
    return NextResponse.json({
      success: true,
      total: failedJobs.length,
      autoFixable: autoFixableCount,
      manualReview: failedJobs.length - autoFixableCount,
      categories,
      summary: {
        batch_still_running: categories.batch_still_running?.count || 0,
        batch_failed: categories.batch_failed?.count || 0,
        timeout: categories.timeout?.count || 0,
        recoverable: categories.recoverable?.count || 0,
        other_error: categories.other_error?.count || 0,
      },
    });
  } catch (error: any) {
    console.error('Fixer analysis error:', error);
    return NextResponse.json(
      { error: error.message || 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * POST endpoint - Fix failed jobs automatically
 */
export async function POST(req: Request) {
  try {
    const { jobId, fixAll = false, category } = await req.json();
    const supabase = getSupabaseClient();
    const apiKey = getOpenAIApiKey();
    
    let jobsToFix: any[] = [];
    
    if (jobId) {
      // Fix specific job
      const { data: job, error } = await supabase
        .from('car_bulk_generation_jobs')
        .select('*')
        .eq('id', jobId)
        .eq('status', 'failed')
        .single();
      
      if (error || !job) {
        return NextResponse.json({ error: 'Job not found or not failed' }, { status: 404 });
      }
      
      jobsToFix = [job];
    } else if (fixAll) {
      // Fix all auto-fixable jobs
      const { data: failedJobs, error } = await supabase
        .from('car_bulk_generation_jobs')
        .select('*')
        .eq('status', 'failed')
        .order('created_at', { ascending: true });
      
      if (error) {
        throw error;
      }
      
      if (!failedJobs || failedJobs.length === 0) {
        return NextResponse.json({
          success: true,
          message: 'No failed jobs to fix',
          fixed: 0,
          failed: 0,
        });
      }
      
      // Analyze and filter to only auto-fixable jobs
      const analyses = await Promise.all(
        failedJobs.map(job => analyzeJobFailure(job, apiKey))
      );
      
      jobsToFix = failedJobs.filter((_, index) => analyses[index].canAutoFix);
    } else if (category) {
      // Fix jobs in specific category
      const { data: failedJobs, error } = await supabase
        .from('car_bulk_generation_jobs')
        .select('*')
        .eq('status', 'failed')
        .order('created_at', { ascending: true });
      
      if (error) {
        throw error;
      }
      
      // Analyze and filter by category
      const analyses = await Promise.all(
        failedJobs.map(job => analyzeJobFailure(job, apiKey))
      );
      
      jobsToFix = failedJobs.filter((_, index) => 
        analyses[index].category === category && analyses[index].canAutoFix
      );
    } else {
      return NextResponse.json({ error: 'Must provide jobId, fixAll=true, or category' }, { status: 400 });
    }
    
    if (jobsToFix.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No jobs to fix',
        fixed: 0,
        failed: 0,
      });
    }
    
    console.log(`[Fixer] Fixing ${jobsToFix.length} job(s)...`);
    
    // Fix all jobs in parallel
    const results = await Promise.all(
      jobsToFix.map(async (job) => {
        const analysis = await analyzeJobFailure(job, apiKey);
        const fixResult = await fixJob(job, analysis, supabase, apiKey);
        return {
          jobId: job.id,
          success: fixResult.success,
          message: fixResult.message,
          category: analysis.category,
        };
      })
    );
    
    const fixed = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    return NextResponse.json({
      success: true,
      message: `Fixed ${fixed}/${jobsToFix.length} jobs`,
      fixed,
      failed,
      total: jobsToFix.length,
      results: results.slice(0, 20), // Limit results in response
    });
  } catch (error: any) {
    console.error('Fixer error:', error);
    return NextResponse.json(
      { error: error.message || 'Unknown error' },
      { status: 500 }
    );
  }
}




