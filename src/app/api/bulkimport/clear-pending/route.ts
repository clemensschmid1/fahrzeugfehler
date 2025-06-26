import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Supabase config
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST() {
  try {
    console.log('[Clear Pending] Starting to clear all pending jobs...');

    // Get all pending jobs
    const { data: pendingJobs, error: fetchError } = await supabase
      .from('bulk_import_jobs')
      .select('id, filename, file_url, status')
      .in('status', ['pending', 'processing']);

    if (fetchError) {
      console.error('[Clear Pending] Error fetching pending jobs:', fetchError.message);
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    if (!pendingJobs || pendingJobs.length === 0) {
      console.log('[Clear Pending] No pending jobs found');
      return NextResponse.json({ 
        success: true, 
        deletedJobs: 0,
        deletedFiles: 0,
        message: 'No pending jobs found'
      });
    }

    console.log(`[Clear Pending] Found ${pendingJobs.length} pending jobs to delete`);

    let deletedFiles = 0;
    const fileUrlsToDelete: string[] = [];

    // Collect all file URLs to delete
    pendingJobs.forEach(job => {
      if (job.file_url && !job.file_url.includes('http') && !job.file_url.includes('example.com')) {
        fileUrlsToDelete.push(job.file_url);
      }
    });

    // Delete files from Supabase Storage
    if (fileUrlsToDelete.length > 0) {
      console.log(`[Clear Pending] Deleting ${fileUrlsToDelete.length} files from storage`);
      
      const { error: deleteFileError } = await supabase.storage
        .from('bulk-import')
        .remove(fileUrlsToDelete);

      if (deleteFileError) {
        console.error('[Clear Pending] Error deleting files from storage:', deleteFileError.message);
        // Continue with job deletion even if file deletion fails
      } else {
        deletedFiles = fileUrlsToDelete.length;
        console.log(`[Clear Pending] Successfully deleted ${deletedFiles} files from storage`);
      }
    }

    // Delete all pending jobs from database
    const { data: deletedJobs, error: deleteJobError } = await supabase
      .from('bulk_import_jobs')
      .delete()
      .in('status', ['pending', 'processing'])
      .select('id');

    if (deleteJobError) {
      console.error('[Clear Pending] Error deleting jobs:', deleteJobError.message);
      return NextResponse.json({ error: deleteJobError.message }, { status: 500 });
    }

    const deletedJobsCount = deletedJobs?.length || 0;
    console.log(`[Clear Pending] Successfully deleted ${deletedJobsCount} jobs from database`);

    return NextResponse.json({ 
      success: true, 
      deletedJobs: deletedJobsCount,
      deletedFiles,
      message: `Cleared ${deletedJobsCount} pending jobs and ${deletedFiles} files`
    });

  } catch (error) {
    console.error('[Clear Pending] Unexpected error:', error);
    return NextResponse.json({ 
      error: (error as Error).message || 'An internal server error occurred.' 
    }, { status: 500 });
  }
} 