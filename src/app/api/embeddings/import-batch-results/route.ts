import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const maxDuration = 600; // 10 minutes

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

export async function POST(req: Request) {
  try {
    // Check if it's a file upload (FormData) or JSON request
    const contentType = req.headers.get('content-type') || '';
    let batchId: string | undefined;
    let fileId: string | undefined;
    let uploadedFile: File | undefined;

    if (contentType.includes('multipart/form-data')) {
      // Handle file upload
      const formData = await req.formData();
      uploadedFile = formData.get('file') as File | null || undefined;
      
      if (!uploadedFile) {
        return NextResponse.json({ error: 'Missing file upload' }, { status: 400 });
      }
    } else {
      // Handle JSON request (batchId or fileId)
      const body = await req.json();
      batchId = body.batchId;
      fileId = body.fileId;

      if (!batchId && !fileId) {
        return NextResponse.json({ error: 'Missing batchId, fileId, or file upload' }, { status: 400 });
      }
    }

    const apiKey = getOpenAIApiKey();
    const supabase = getSupabaseClient();

    let jsonlContent: string;

    if (uploadedFile) {
      // Read uploaded file directly
      console.log(`[Import Embeddings] Processing uploaded file: ${uploadedFile.name}`);
      const arrayBuffer = await uploadedFile.arrayBuffer();
      jsonlContent = Buffer.from(arrayBuffer).toString('utf-8');
    } else {
      // If batchId provided, download results from batch
      // If fileId provided, download the output file directly
      let resultsFileId: string;
      let batchStatus: string;

      if (batchId) {
        // Get batch status and output file
        const batchRes = await fetch(`${OPENAI_API_URL}/batches/${batchId}`, {
          headers: { 'Authorization': `Bearer ${apiKey}` }
        });

        if (!batchRes.ok) {
          const errText = await batchRes.text();
          return NextResponse.json({ error: `Failed to get batch: ${errText}` }, { status: 500 });
        }

        const batchData = await batchRes.json();
        batchStatus = batchData.status;

        if (batchStatus !== 'completed') {
          return NextResponse.json({ 
            error: `Batch is not completed yet. Status: ${batchStatus}`,
            status: batchStatus
          }, { status: 400 });
        }

        if (!batchData.output_file_id) {
          return NextResponse.json({ error: 'Batch has no output file yet' }, { status: 400 });
        }

        resultsFileId = batchData.output_file_id;
      } else {
        // Use fileId directly (assume it's the output file)
        resultsFileId = fileId!;
      }

      // Download the results file
      console.log(`[Import Embeddings] Downloading results file: ${resultsFileId}`);
      const fileRes = await fetch(`${OPENAI_API_URL}/files/${resultsFileId}/content`, {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });

      if (!fileRes.ok) {
        const errText = await fileRes.text();
        return NextResponse.json({ error: `Failed to download results file: ${errText}` }, { status: 500 });
      }

      jsonlContent = await fileRes.text();
    }
    const lines = jsonlContent.trim().split('\n').filter(line => line.trim());

    console.log(`[Import Embeddings] Processing ${lines.length} embedding results...`);

    // Parse JSONL and extract embeddings
    const embeddings: Array<{
      faultId: string;
      embedding: number[];
      textContent: string;
    }> = [];

    const errors: string[] = [];
    let successCount = 0;
    let failedCount = 0;

    for (const line of lines) {
      try {
        const result = JSON.parse(line);
        
        // Check if request was successful
        if (result.response?.status_code !== 200) {
          failedCount++;
          errors.push(`Request ${result.custom_id} failed: ${result.response?.body?.error?.message || 'Unknown error'}`);
          continue;
        }

        // Extract fault ID from custom_id (format: embedding-{fault_id})
        const customId = result.custom_id || '';
        const faultIdMatch = customId.match(/^embedding-(.+)$/);
        
        if (!faultIdMatch) {
          failedCount++;
          errors.push(`Invalid custom_id format: ${customId}`);
          continue;
        }

        const faultId = faultIdMatch[1];
        const embedding = result.response?.body?.data?.[0]?.embedding;

        if (!embedding || !Array.isArray(embedding)) {
          failedCount++;
          errors.push(`Missing or invalid embedding for ${faultId}`);
          continue;
        }

        // Get text content from metadata or reconstruct from fault
        // We'll fetch it from database if needed, but for now use a placeholder
        embeddings.push({
          faultId,
          embedding,
          textContent: '' // Will be fetched from database if needed
        });
      } catch (err) {
        failedCount++;
        errors.push(`Failed to parse line: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }

    // Fetch text content for all faults in batches
    console.log(`[Import Embeddings] Fetching text content for ${embeddings.length} faults...`);
    const faultIds = embeddings.map(e => e.faultId);
    const FETCH_BATCH_SIZE = 500;
    
    for (let i = 0; i < faultIds.length; i += FETCH_BATCH_SIZE) {
      const batch = faultIds.slice(i, i + FETCH_BATCH_SIZE);
      const { data: faults } = await supabase
        .from('car_faults')
        .select('id, title, description')
        .in('id', batch);
      
      if (faults) {
        const faultsMap = new Map(faults.map(f => [f.id, f]));
        for (const emb of embeddings) {
          const fault = faultsMap.get(emb.faultId);
          if (fault) {
            emb.textContent = `${fault.title}${fault.description ? ` ${fault.description}` : ''}`.trim();
          }
        }
      }
    }

    // Batch insert embeddings into Supabase
    console.log(`[Import Embeddings] Inserting ${embeddings.length} embeddings into database...`);
    const INSERT_BATCH_SIZE = 1000;
    let insertedCount = 0;
    let duplicateCount = 0;

    for (let i = 0; i < embeddings.length; i += INSERT_BATCH_SIZE) {
      const batch = embeddings.slice(i, i + INSERT_BATCH_SIZE);
      const insertData = batch.map(emb => ({
        car_fault_id: emb.faultId,
        embedding: emb.embedding,
        text_content: emb.textContent,
      }));

      const { error: insertError } = await supabase
        .from('car_fault_embeddings')
        .insert(insertData);

      if (insertError) {
        // If batch insert fails, try individual inserts
        if (insertError.code === '23505') {
          // Unique constraint violation - some already exist
          for (const item of insertData) {
            try {
              const { error: singleError } = await supabase
                .from('car_fault_embeddings')
                .insert(item);
              
              if (singleError && singleError.code !== '23505') {
                failedCount++;
                errors.push(`Failed to insert embedding for ${item.car_fault_id}: ${singleError.message}`);
              } else if (singleError && singleError.code === '23505') {
                duplicateCount++;
              } else {
                insertedCount++;
              }
            } catch (err) {
              failedCount++;
              errors.push(`Exception inserting ${item.car_fault_id}: ${err instanceof Error ? err.message : 'Unknown'}`);
            }
          }
        } else {
          failedCount += batch.length;
          errors.push(`Batch insert failed: ${insertError.message}`);
        }
      } else {
        insertedCount += batch.length;
      }
    }

    return NextResponse.json({
      success: true,
      processed: lines.length,
      inserted: insertedCount,
      duplicates: duplicateCount,
      failed: failedCount,
      errors: errors.slice(0, 10) // Return first 10 errors
    });
  } catch (error) {
    console.error('Import embedding batch results error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

