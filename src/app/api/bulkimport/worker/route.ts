import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Supabase config - USE SERVICE ROLE KEY FOR ADMIN-LEVEL ACCESS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Processing parameters - reduced for Vercel timeout
const MAX_QUESTIONS_PER_BATCH = 5; // Process only 5 questions per worker call
const ANALYZE_BATCH_DELAY = 1; // Reduced delay between batches
const MAX_REQUESTS_PER_WINDOW = 9;
const WINDOW_SECONDS = 56;

interface BulkImportJob {
  id: string;
  filename: string;
  status: string;
  file_url: string;
  result?: BulkImportResult[];
  error_message?: string;
  created_at?: string;
  updated_at?: string;
  total_questions?: number;
  processed_questions?: number;
  // Add more fields as needed, but do not use [key: string]: any;
}

interface BulkImportResult {
  question: string;
  status: string;
}

export async function POST(req: Request) {
  try {
    let body: { maxRequestsPerWindow?: number, windowSeconds?: number } = {};
    try {
      // The request body might be empty if called from a simple trigger.
      body = await req.json();
    } catch {
      console.log('[Worker] Could not parse request body, using default rate limits.');
    }
    const { maxRequestsPerWindow, windowSeconds } = body;

    console.log('[Worker] Fetching next job...');
    // 1. Try to find an existing 'processing' job first
    const { data, error } = await supabase
      .from('bulk_import_jobs')
      .select('*')
      .eq('status', 'processing')
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle<BulkImportJob>();
    
    let job = data;
    const fetchError = error;

    if (fetchError) {
      console.error('[Worker] Error fetching processing job:', fetchError.message);
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    // 2. If no 'processing' job, find the next 'pending' job
    if (!job) {
      console.log('[Worker] No processing jobs found, looking for pending jobs...');
      const { data: pendingJob, error: fetchPendingError } = await supabase
        .from('bulk_import_jobs')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle<BulkImportJob>();
      
      if (fetchPendingError) {
        console.error('[Worker] Error fetching pending job:', fetchPendingError.message);
        return NextResponse.json({ error: fetchPendingError.message }, { status: 500 });
      }
      job = pendingJob;
    }

    if (!job) {
      console.log('[Worker] No pending or processing jobs found.');
      return NextResponse.json({ message: 'No pending jobs' });
    }
    
    console.log(`[Worker] Found job: ${job.id}, file: ${job.filename}, status: ${job.status}`);
    
    // Mark job as processing if it's new
    if (job.status === 'pending') {
      await supabase.from('bulk_import_jobs').update({ 
        status: 'processing', 
        updated_at: new Date().toISOString() 
      }).eq('id', job.id);
      job.status = 'processing';
    }
    
    try {
      const result = await processJobBatch(job, { maxRequestsPerWindow, windowSeconds });
      
      const currentProcessedCount = (job.processed_questions || 0) + result.processedInThisBatch;

      if (result.completed) {
        // Job is fully completed
        await supabase.from('bulk_import_jobs').update({
          status: 'done',
          result: result.results,
          processed_questions: currentProcessedCount,
          updated_at: new Date().toISOString(),
        }).eq('id', job.id);
        console.log(`[Worker] Job ${job.id} completed successfully.`);
        return NextResponse.json({ 
          success: true, 
          jobId: job.id, 
          completed: true,
          processed: result.results.length 
        });
      } else {
        // Job is partially completed, more work to do
        await supabase.from('bulk_import_jobs').update({
          result: result.results,
          processed_questions: currentProcessedCount,
          updated_at: new Date().toISOString(),
        }).eq('id', job.id);
        console.log(`[Worker] Job ${job.id} partially processed. ${result.processedInThisBatch} questions processed in this batch.`);
        return NextResponse.json({ 
          success: true, 
          jobId: job.id, 
          completed: false,
          processedInThisBatch: result.processedInThisBatch,
          totalProcessed: currentProcessedCount
        });
      }
    } catch (error: unknown) {
      const err = error as Error;
      console.error(`[Worker] Error processing job ${job.id}:`, err.message);
      await supabase.from('bulk_import_jobs').update({
        status: 'error',
        error_message: err.message,
        updated_at: new Date().toISOString(),
      }).eq('id', job.id);
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
  } catch (outerError) {
    console.error('[Worker] Unexpected error:', outerError);
    return NextResponse.json({ error: (outerError as Error).message }, { status: 500 });
  }
}

// Process a batch of questions for a job
async function processJobBatch(
  job: BulkImportJob, 
  params: { maxRequestsPerWindow?: number; windowSeconds?: number }
): Promise<{
  completed: boolean;
  results: BulkImportResult[];
  processedInThisBatch: number;
}> {
  const { 
    maxRequestsPerWindow = MAX_REQUESTS_PER_WINDOW, 
    windowSeconds = WINDOW_SECONDS 
  } = params;

  try {
    // Use the storage path directly from the DB
    const filePath = job.file_url;
    if (!filePath || filePath.includes('http') || filePath.includes('example.com')) {
      const errorMsg = 'Invalid file path in job: ' + filePath;
      console.error('[Worker]', errorMsg);
      throw new Error(errorMsg);
    }
    
    console.log(`[Worker] Downloading file from storage path: ${filePath}`);
    const { data: fileData, error: downloadError } = await supabase.storage.from('bulk-import').download(filePath);
    if (downloadError) {
      console.error('[Worker] File download error:', downloadError.message);
      throw new Error('Failed to download file: ' + downloadError.message);
    }
    
    const text = await fileData.text();
    const allQuestions = text.split('\n').map(q => q.trim()).filter(Boolean);
    
    // Update total questions if not set
    if (!job.total_questions) {
      await supabase.from('bulk_import_jobs').update({ total_questions: allQuestions.length }).eq('id', job.id);
      job.total_questions = allQuestions.length;
    }
    
    console.log(`[Worker] Total questions: ${allQuestions.length}, already processed: ${job.processed_questions || 0}`);
    
    // Get questions to process in this batch
    const startIndex = job.processed_questions || 0;
    const endIndex = Math.min(startIndex + MAX_QUESTIONS_PER_BATCH, allQuestions.length);
    const questionsToProcess = allQuestions.slice(startIndex, endIndex);
    
    if (questionsToProcess.length === 0) {
      return { completed: true, results: job.result || [], processedInThisBatch: 0 };
    }
    
    console.log(`[Worker] Processing batch of ${questionsToProcess.length} questions (${startIndex + 1}-${endIndex})`);
    
    // Initialize results array if not exists
    const existingResults = job.result || [];
    const newResults: BulkImportResult[] = [];
    
    // Process questions in this batch
    let requestsInWindow = 0;
    let windowStart = Date.now();
    
    for (let i = 0; i < questionsToProcess.length; i++) {
      const question = questionsToProcess[i];
      
      // Check rate limit
      if (requestsInWindow >= maxRequestsPerWindow) {
        const now = Date.now();
        const elapsed = (now - windowStart) / 1000;
        if (elapsed < windowSeconds) {
          const waitTime = windowSeconds - elapsed;
          console.log(`[Worker] API cap reached, waiting ${waitTime.toFixed(1)}s...`);
          await new Promise(res => setTimeout(res, waitTime * 1000));
        }
        requestsInWindow = 0;
        windowStart = Date.now();
      }
      
      try {
        // Call the ask API
        const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'https://infoneva.com'}/api/ask`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Bulk-Import': 'true',
          },
          body: JSON.stringify({ 
            question, 
            language: 'en',
            submitDeltaMs: 5000 
          }),
        });
        
        if (!response.ok) {
          let errorMsg = `API call failed with status ${response.status}`;
          try {
            const errorData = await response.json();
            errorMsg = errorData.error || errorMsg;
          } catch {
            try {
              const errorText = await response.text();
              errorMsg = errorText || errorMsg;
            } catch {}
          }
          throw new Error(errorMsg);
        }
        // API call successful, no need to parse response for bulk import
        newResults.push({ question, status: 'success' });
        console.log(`[Worker] Processed question ${startIndex + i + 1}: ${question.substring(0, 50)}...`);
        
        requestsInWindow++;
        
        // Small delay between requests
        if (i < questionsToProcess.length - 1) {
          await new Promise(res => setTimeout(res, ANALYZE_BATCH_DELAY * 1000));
        }
        
      } catch (error) {
        console.error(`[Worker] Error processing question "${question}":`, error);
        newResults.push({ question, status: 'error' });
        requestsInWindow++;
      }
    }
    
    // Combine existing and new results
    const allResults = [...existingResults, ...newResults];
    
    // Check if job is completed
    const completed = endIndex >= allQuestions.length;
    
    return {
      completed,
      results: allResults,
      processedInThisBatch: questionsToProcess.length
    };
    
  } catch (err) {
    console.error('[Worker] Error in processJobBatch:', err);
    throw err;
  }
} 