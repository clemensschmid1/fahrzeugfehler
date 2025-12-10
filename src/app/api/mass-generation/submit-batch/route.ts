import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';

export const runtime = 'nodejs';
export const maxDuration = 600; // 10 minutes for large file uploads

const OPENAI_API_URL = 'https://api.openai.com/v1';

function getOpenAIApiKey() {
  const apiKey = process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('Missing OpenAI API key');
  }
  return apiKey;
}

// Create FormData for file upload
function createFormData(content: string, filename: string): FormData {
  // Ensure filename ends with .jsonl
  const jsonlFilename = filename.endsWith('.jsonl') ? filename : `${filename}.jsonl`;
  
  // Clean content: remove empty lines and ensure proper JSONL format
  const cleanedContent = content
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join('\n');
  
  const form = new FormData();
  form.append('purpose', 'batch');
  // Use text/plain or application/x-ndjson for JSONL
  form.append('file', new Blob([cleanedContent], { type: 'text/plain' }), jsonlFilename);
  return form;
}

export async function POST(req: Request) {
  try {
    // Check if it's FormData (file upload) or JSON (fileUrl)
    const contentTypeHeader = req.headers.get('content-type') || '';
    let fileUrl: string | null = null;
    let file: File | null = null;
    let batchName: string | null = null;
    let contentType = 'fault';
    let brandId: string | null = null;
    let modelId: string | null = null;
    let generationId: string | null = null;

    // Check for FormData - the boundary parameter indicates multipart/form-data
    if (contentTypeHeader.includes('multipart/form-data') || contentTypeHeader.includes('boundary=')) {
      const formData = await req.formData();
      file = formData.get('file') as File;
      batchName = formData.get('batchName') as string | null;
      contentType = (formData.get('contentType') as string) || 'fault';
      brandId = formData.get('brandId') as string | null;
      modelId = formData.get('modelId') as string | null;
      generationId = formData.get('generationId') as string | null;
      
      if (!file) {
        return NextResponse.json({ error: 'Missing file in FormData' }, { status: 400 });
      }
    } else {
      const body = await req.json();
      fileUrl = body.fileUrl;
      batchName = body.batchName || null;
      contentType = body.contentType || 'fault';
      brandId = body.brandId || null;
      modelId = body.modelId || null;
      generationId = body.generationId || null;
    }

    if (!fileUrl && !file) {
      return NextResponse.json({ error: 'Missing fileUrl or file' }, { status: 400 });
    }

    let jsonlContent: string;
    let filename: string;
    
    if (file) {
      // Read from uploaded file
      jsonlContent = await file.text();
      filename = file.name;
      // Generate batch name from filename if not provided
      if (!batchName) {
        const baseName = filename.replace('.jsonl', '').replace(/[^a-zA-Z0-9-_]/g, '_');
        batchName = `Batch ${baseName}`;
      }
    } else {
      // Read from fileUrl
      filename = fileUrl!.replace('/generated/', '');
      const filePath = join(process.cwd(), 'public', 'generated', filename);
      try {
        jsonlContent = await readFile(filePath, 'utf-8');
      } catch (err) {
        return NextResponse.json({ error: 'File not found' }, { status: 404 });
      }
    }

    // Validate and clean JSONL content
    const lines = jsonlContent.split('\n').filter(l => l.trim().length > 0);
    if (lines.length === 0) {
      return NextResponse.json({ error: 'JSONL file is empty' }, { status: 400 });
    }

    // Validate each line is valid JSON
    const validLines: string[] = [];
    for (const line of lines) {
      try {
        const parsed = JSON.parse(line);
        // Validate required fields for OpenAI Batch API
        if (!parsed.custom_id || !parsed.method || !parsed.url || !parsed.body) {
          console.error('Invalid JSONL line - missing required fields:', Object.keys(parsed));
          continue;
        }
        // Validate body structure
        if (!parsed.body.model || !parsed.body.messages || !Array.isArray(parsed.body.messages)) {
          console.error('Invalid JSONL line - invalid body structure:', parsed.body);
          continue;
        }
        validLines.push(line);
      } catch (e) {
        console.error('Invalid JSON in line:', line.substring(0, 100), e);
        continue;
      }
    }

    if (validLines.length === 0) {
      return NextResponse.json({ error: 'No valid JSONL lines found in file' }, { status: 400 });
    }

    const cleanedJsonlContent = validLines.join('\n');
    const apiKey = getOpenAIApiKey();

    // Calculate file size for timeout estimation
    const fileSizeMB = (cleanedJsonlContent.length / (1024 * 1024)).toFixed(2);
    console.log(`[Submit Batch] Uploading file: ${filename}, size: ${fileSizeMB} MB, lines: ${validLines.length}`);

    // Set timeout based on file size (1 minute per 10 MB, minimum 5 minutes, maximum 10 minutes)
    const uploadTimeout = Math.min(Math.max(parseFloat(fileSizeMB) * 6 * 1000, 5 * 60 * 1000), 10 * 60 * 1000);
    const uploadController = new AbortController();
    const uploadTimeoutId = setTimeout(() => uploadController.abort(), uploadTimeout);

    try {
      // Upload file to OpenAI with extended timeout
      const fileRes = await fetch(`${OPENAI_API_URL}/files`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}` },
        body: createFormData(cleanedJsonlContent, filename),
        signal: uploadController.signal,
      });

      clearTimeout(uploadTimeoutId);

      if (!fileRes.ok) {
        const errorText = await fileRes.text();
        return NextResponse.json({ error: `File upload failed: ${errorText}` }, { status: 500 });
      }
    } catch (error: any) {
      clearTimeout(uploadTimeoutId);
      if (error.name === 'AbortError' || uploadController.signal.aborted) {
        return NextResponse.json({ 
          error: `Upload timeout after ${Math.round(uploadTimeout / 1000 / 60)} minutes. File is too large (${fileSizeMB} MB). Consider splitting into smaller batches.` 
        }, { status: 408 });
      }
      throw error;
    }

    const fileData = await fileRes.json();
    const inputFileId = fileData.id;

    // Check for concurrent batch limit (OpenAI allows max 50 concurrent batches)
    const batchesController = new AbortController();
    const batchesTimeoutId = setTimeout(() => batchesController.abort(), 30000); // 30 seconds
    
    let activeBatchesRes;
    try {
      activeBatchesRes = await fetch(`${OPENAI_API_URL}/batches?limit=100`, {
        headers: { 'Authorization': `Bearer ${apiKey}` },
        signal: batchesController.signal,
      });
      clearTimeout(batchesTimeoutId);
    } catch (error: any) {
      clearTimeout(batchesTimeoutId);
      // Non-critical, continue anyway
      console.warn('[Submit Batch] Failed to check active batches:', error.message);
      activeBatchesRes = null;
    }
    
    if (activeBatchesRes.ok) {
      const batchesData = await activeBatchesRes.json();
      const activeBatches = batchesData.data?.filter((b: any) => 
        ['validating', 'in_progress', 'finalizing'].includes(b.status)
      ) || [];
      
      if (activeBatches.length >= 50) {
        return NextResponse.json({ 
          error: `OpenAI batch limit reached: ${activeBatches.length}/50 active batches. Please wait and try again later.` 
        }, { status: 429 });
      }
      
      console.log(`[Batch Limit] Active batches: ${activeBatches.length}/50`);
    }

    // Create batch job with timeout
    const batchController = new AbortController();
    const batchTimeoutId = setTimeout(() => batchController.abort(), 60000); // 60 seconds
    
    let batchRes;
    try {
      batchRes = await fetch(`${OPENAI_API_URL}/batches`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          input_file_id: inputFileId,
          endpoint: '/v1/chat/completions',
          completion_window: '24h',
          metadata: {
            type: 'answers',
            contentType,
            brandId,
            modelId,
            generationId,
            batchName: batchName || filename,
          }
        }),
        signal: batchController.signal,
      });
      clearTimeout(batchTimeoutId);
    } catch (error: any) {
      clearTimeout(batchTimeoutId);
      if (error.name === 'AbortError' || batchController.signal.aborted) {
        return NextResponse.json({ 
          error: 'Batch creation timeout. The file was uploaded successfully. Please check OpenAI dashboard for batch status.' 
        }, { status: 408 });
      }
      throw error;
    }

    if (!batchRes.ok) {
      const errorText = await batchRes.text();
      return NextResponse.json({ error: `Batch creation failed: ${errorText}` }, { status: 500 });
    }

    const batchData = await batchRes.json();

    return NextResponse.json({
      success: true,
      batchId: batchData.id,
      fileId: inputFileId,
      status: batchData.status,
    });
  } catch (error) {
    console.error('Submit batch error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

