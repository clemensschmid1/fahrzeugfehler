import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Supabase config
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { jobId } = await req.json();
    
    if (!jobId) {
      return NextResponse.json({ error: 'Job ID is required' }, { status: 400 });
    }

    console.log(`[Cleanup] Starting cleanup for job: ${jobId}`);

    // Get the job details to find the creation time
    const { data: job, error: jobError } = await supabase
      .from('bulk_import_jobs')
      .select('created_at, filename')
      .eq('id', jobId)
      .single();

    if (jobError || !job) {
      console.error('[Cleanup] Job not found:', jobError?.message);
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    console.log(`[Cleanup] Found job created at: ${job.created_at}`);

    // Delete all questions created after this job's creation time
    // This will delete all questions created during this bulk import session
    const { data: deletedQuestions, error: deleteError } = await supabase
      .from('questions')
      .delete()
      .gte('created_at', job.created_at)
      .select('id');

    if (deleteError) {
      console.error('[Cleanup] Error deleting questions:', deleteError.message);
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    const deletedCount = deletedQuestions?.length || 0;
    console.log(`[Cleanup] Deleted ${deletedCount} questions for job ${jobId}`);

    // Mark the job as cancelled
    await supabase
      .from('bulk_import_jobs')
      .update({ 
        status: 'cancelled',
        error_message: `Cancelled by user. Deleted ${deletedCount} questions.`,
        updated_at: new Date().toISOString()
      })
      .eq('id', jobId);

    return NextResponse.json({ 
      success: true, 
      deletedCount,
      jobId,
      filename: job.filename
    });

  } catch (error) {
    console.error('[Cleanup] Unexpected error:', error);
    return NextResponse.json({ 
      error: (error as Error).message || 'An internal server error occurred.' 
    }, { status: 500 });
  }
} 