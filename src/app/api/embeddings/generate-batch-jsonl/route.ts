import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes

const OPENAI_API_URL = 'https://api.openai.com/v1';

function getOpenAIApiKey() {
  const apiKey = process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('Missing OpenAI API key');
  }
  return apiKey;
}

// Helper to create FormData for file upload
function createFormData(content: string, filename: string): FormData {
  const formData = new FormData();
  const blob = new Blob([content], { type: 'application/jsonl' });
  formData.append('file', blob, filename);
  formData.append('purpose', 'batch');
  return formData;
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const questionsFile = formData.get('questionsFile') as File | null;
    const questionsFiles = formData.getAll('questionsFiles') as File[];

    if (!questionsFile && (!questionsFiles || questionsFiles.length === 0)) {
      return NextResponse.json({ error: 'Missing questionsFile or questionsFiles' }, { status: 400 });
    }

    const apiKey = getOpenAIApiKey();

    // Read questions file(s) - use single file or multiple files
    const filesToProcess = questionsFile ? [questionsFile] : questionsFiles.filter(f => f && f.name);
    
    console.log(`[Embedding Batch] Processing ${filesToProcess.length} questions file(s)...`);

    const allEmbeddingEntries: Array<{ custom_id: string; text: string; original_custom_id: string }> = [];

    // Process each questions file
    for (const file of filesToProcess) {
      const questionsJsonl = await file.text();
      const questionsLines = questionsJsonl.trim().split('\n').filter(line => line.trim());

      console.log(`[Embedding Batch] Processing ${questionsLines.length} questions from ${file.name}...`);

      for (const line of questionsLines) {
        try {
          const parsed = JSON.parse(line);
          const customId = parsed.custom_id || '';
          
          // Extract question from user message (body.messages[1].content or body.messages[0].content)
          const userContent = parsed.body?.messages?.[1]?.content || parsed.body?.messages?.[0]?.content || '';
          
          if (!userContent || !customId) {
            console.warn(`[Embedding Batch] Skipping line with missing content or custom_id`);
            continue;
          }

          // Remove the " - Brand Model Generation" suffix if present for cleaner embedding
          const questionText = userContent.split(' - ')[0].trim();
          
          if (questionText.length === 0) {
            continue;
          }

          // Use the original custom_id as reference (e.g., "answer-{generationId}-{index}")
          // We'll map this to fault_id later when importing embeddings
          allEmbeddingEntries.push({
            custom_id: `embedding-${customId}`, // e.g., "embedding-answer-{generationId}-{index}"
            text: questionText,
            original_custom_id: customId
          });
        } catch (e) {
          console.error(`[Embedding Batch] Failed to parse question line:`, e);
        }
      }
    }

    if (allEmbeddingEntries.length === 0) {
      return NextResponse.json({ error: 'No valid questions found in files' }, { status: 400 });
    }

    console.log(`[Embedding Batch] Found ${allEmbeddingEntries.length} questions, creating JSONL for OpenAI Batch API...`);

    // Create JSONL for OpenAI Embeddings Batch API
    // Format: Each line is a JSON object with custom_id and params for /v1/embeddings
    // Note: OpenAI Batch API does NOT support metadata field for embeddings endpoint
    const jsonlLines = allEmbeddingEntries.map((entry) => {
      return JSON.stringify({
        custom_id: entry.custom_id,
        method: 'POST',
        url: '/v1/embeddings',
        body: {
          model: 'text-embedding-3-small',
          input: entry.text,
        }
        // metadata is not supported for embeddings endpoint in Batch API
      });
    });

    const jsonlContent = jsonlLines.join('\n');

    // Save to public/generated directory
    const generatedDir = join(process.cwd(), 'public', 'generated');
    await mkdir(generatedDir, { recursive: true });
    
    const timestamp = Date.now();
    const filename = `embeddings-batch-${timestamp}.jsonl`;
    const filepath = join(generatedDir, filename);
    
    await writeFile(filepath, jsonlContent, 'utf-8');
    console.log(`[Embedding Batch] Saved JSONL file: ${filename} (${allEmbeddingEntries.length} entries)`);

    // Upload to OpenAI
    console.log(`[Embedding Batch] Uploading to OpenAI...`);
    const fileRes = await fetch(`${OPENAI_API_URL}/files`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      },
      body: createFormData(jsonlContent, filename)
    });

    if (!fileRes.ok) {
      const errText = await fileRes.text();
      return NextResponse.json({ error: `File upload failed: ${errText}` }, { status: 500 });
    }

    const fileData = await fileRes.json();
    const inputFileId = fileData.id;

    // Check for concurrent batch limit (OpenAI allows max 50 concurrent batches)
    const activeBatchesRes = await fetch(`${OPENAI_API_URL}/batches?limit=100`, {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    });
    
    let activeBatchesCount = 0;
    if (activeBatchesRes.ok) {
      const batchesData = await activeBatchesRes.json();
      const activeBatches = batchesData.data?.filter((b: any) => 
        ['validating', 'in_progress', 'finalizing'].includes(b.status)
      ) || [];
      activeBatchesCount = activeBatches.length;
      
      if (activeBatchesCount >= 50) {
        return NextResponse.json({ 
          error: `OpenAI batch limit reached: ${activeBatchesCount}/50 active batches. Please wait and try again later.`,
          fileId: inputFileId,
          filename,
          fileUrl: `/generated/${filename}`,
          entriesCount: allEmbeddingEntries.length
        }, { status: 429 });
      }
    }

    // Create batch job
    const batchRes = await fetch(`${OPENAI_API_URL}/batches`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        input_file_id: inputFileId,
        endpoint: '/v1/embeddings',
        completion_window: '24h',
        metadata: {
          type: 'embeddings',
          fault_count: String(allEmbeddingEntries.length),
          filename
        }
      })
    });

    if (!batchRes.ok) {
      const errText = await batchRes.text();
      return NextResponse.json({ error: `Batch creation failed: ${errText}` }, { status: 500 });
    }

    const batchData = await batchRes.json();

    return NextResponse.json({
      success: true,
      batchId: batchData.id,
      fileId: inputFileId,
      filename,
      fileUrl: `/generated/${filename}`,
      status: batchData.status,
      entriesCount: allEmbeddingEntries.length,
      activeBatchesCount
    });
  } catch (error) {
    console.error('Generate embedding batch JSONL error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

