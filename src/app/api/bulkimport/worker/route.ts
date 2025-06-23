import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Supabase config
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
const BUCKET = 'bulk-import';

// Default processing parameters
const MAX_CONCURRENCY = 9;
const ANALYZE_BATCH_DELAY = 5.8; // seconds
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
  // Add more fields as needed, but do not use [key: string]: any;
}

interface BulkImportResult {
  question: string;
  status: string;
}

async function processJob(job: BulkImportJob) {
  // Download file from Supabase Storage
  const filePath = job.file_url.split(`/${BUCKET}/`)[1];
  const { data: fileData, error: downloadError } = await supabase.storage.from(BUCKET).download(filePath);
  if (downloadError) throw new Error('Failed to download file: ' + downloadError.message);
  const text = await fileData.text();
  const questions = text.split('\n').map(q => q.trim()).filter(Boolean);

  // Store total_questions in the job record
  await supabase.from('bulk_import_jobs').update({ total_questions: questions.length }).eq('id', job.id);

  // Processing logic (simulate API calls)
  let current = 0;
  const total = questions.length;
  let requestsInWindow = 0;
  let windowStart = Date.now();
  const results: BulkImportResult[] = [];

  while (current < total) {
    if (requestsInWindow >= MAX_REQUESTS_PER_WINDOW) {
      const now = Date.now();
      const elapsed = (now - windowStart) / 1000;
      if (elapsed < WINDOW_SECONDS) {
        await new Promise(res => setTimeout(res, (WINDOW_SECONDS - elapsed) * 1000));
      }
      requestsInWindow = 0;
      windowStart = Date.now();
    }
    const batch = questions.slice(current, current + Math.min(MAX_CONCURRENCY, MAX_REQUESTS_PER_WINDOW - requestsInWindow));
    // Simulate processing each question (replace with real API calls)
    await Promise.all(batch.map(async (question) => {
      // Here you would call your /api/ask and /api/questions/generate-metadata endpoints
      // For now, just simulate a delay
      await new Promise(res => setTimeout(res, 100));
      results.push({ question, status: 'success' });
    }));
    current += batch.length;
    requestsInWindow += batch.length;
    if (current < total) {
      await new Promise(res => setTimeout(res, ANALYZE_BATCH_DELAY * 1000));
    }
  }
  return results;
}

export async function POST() {
  try {
    console.log('[Worker] Fetching next pending job...');
    const { data: job, error: fetchError } = await supabase
      .from('bulk_import_jobs')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle<BulkImportJob>();
    if (fetchError) {
      console.error('[Worker] Error fetching job:', fetchError.message);
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }
    if (!job) {
      console.log('[Worker] No pending jobs found.');
      return NextResponse.json({ message: 'No pending jobs' });
    }
    console.log(`[Worker] Found job: ${job.id}, file: ${job.filename}`);
    // Mark job as processing
    await supabase.from('bulk_import_jobs').update({ status: 'processing', updated_at: new Date().toISOString() }).eq('id', job.id);
    try {
      const results = await processJobWithLogging(job);
      await supabase.from('bulk_import_jobs').update({
        status: 'done',
        result: results,
        updated_at: new Date().toISOString(),
      }).eq('id', job.id);
      console.log(`[Worker] Job ${job.id} processed successfully.`);
      return NextResponse.json({ success: true, jobId: job.id, processed: results.length });
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

// Add a wrapper for processJob with logging
async function processJobWithLogging(job: BulkImportJob) {
  try {
    // Use the storage path directly from the DB
    const filePath = job.file_url;
    if (!filePath || filePath.includes('http') || filePath.includes('example.com')) {
      const errorMsg = 'Invalid file path in job: ' + filePath;
      console.error('[Worker]', errorMsg);
      await supabase.from('bulk_import_jobs').update({
        status: 'error',
        error_message: errorMsg,
        updated_at: new Date().toISOString(),
      }).eq('id', job.id);
      // Do not throw, just return so the worker can continue
      return [];
    }
    console.log(`[Worker] Downloading file from storage path: ${filePath}`);
    const { data: fileData, error: downloadError } = await supabase.storage.from('bulk-import').download(filePath);
    if (downloadError) {
      console.error('[Worker] File download error:', downloadError.message);
      throw new Error('Failed to download file: ' + downloadError.message);
    }
    const text = await fileData.text();
    const questions = text.split('\n').map(q => q.trim()).filter(Boolean);
    console.log(`[Worker] Parsed ${questions.length} questions from file.`);
    await supabase.from('bulk_import_jobs').update({ total_questions: questions.length }).eq('id', job.id);
    // Simulate processing
    let current = 0;
    const total = questions.length;
    let requestsInWindow = 0;
    let windowStart = Date.now();
    const results: BulkImportResult[] = [];
    while (current < total) {
      if (requestsInWindow >= MAX_REQUESTS_PER_WINDOW) {
        const now = Date.now();
        const elapsed = (now - windowStart) / 1000;
        if (elapsed < WINDOW_SECONDS) {
          console.log(`[Worker] API cap reached, waiting ${WINDOW_SECONDS - elapsed}s...`);
          await new Promise(res => setTimeout(res, (WINDOW_SECONDS - elapsed) * 1000));
        }
        requestsInWindow = 0;
        windowStart = Date.now();
      }
      const batch = questions.slice(current, current + Math.min(MAX_CONCURRENCY, MAX_REQUESTS_PER_WINDOW - requestsInWindow));
      await Promise.all(batch.map(async (question) => {
        await new Promise(res => setTimeout(res, 100));
        results.push({ question, status: 'success' });
      }));
      current += batch.length;
      requestsInWindow += batch.length;
      if (current < total) {
        await new Promise(res => setTimeout(res, ANALYZE_BATCH_DELAY * 1000));
      }
    }
    return results;
  } catch (err) {
    console.error('[Worker] Error in processJobWithLogging:', err);
    throw err;
  }
} 