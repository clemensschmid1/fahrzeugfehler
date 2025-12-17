import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createReadStream } from 'fs';
import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import { Readable } from 'stream';
import { createInterface } from 'readline';
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

export const runtime = 'nodejs';
export const maxDuration = 800; // 13.3 minutes (Vercel limit)

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
  const abortSignal = req.signal; // Support for abort signals
  let isAborted = false;
  
  // Check for abort signal periodically
  const checkAbort = () => {
    if (abortSignal?.aborted) {
      isAborted = true;
      throw new Error('Import cancelled by user');
    }
  };

  try {
    checkAbort();
    
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

    let tempFilePath: string | null = null;

    try {
      if (uploadedFile) {
        // Save uploaded file to temp location for streaming
        console.log(`[Import Embeddings] Processing uploaded file: ${uploadedFile.name}`);
        const arrayBuffer = await uploadedFile.arrayBuffer();
        tempFilePath = join(tmpdir(), `embedding-import-${Date.now()}-${Math.random().toString(36).substring(7)}.jsonl`);
        await writeFile(tempFilePath, Buffer.from(arrayBuffer));
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

        // Download the results file and save to temp location
        console.log(`[Import Embeddings] Downloading results file: ${resultsFileId}`);
        const fileRes = await fetch(`${OPENAI_API_URL}/files/${resultsFileId}/content`, {
          headers: { 'Authorization': `Bearer ${apiKey}` }
        });

        if (!fileRes.ok) {
          const errText = await fileRes.text();
          return NextResponse.json({ error: `Failed to download results file: ${errText}` }, { status: 500 });
        }

        if (!fileRes.body) {
          return NextResponse.json({ error: 'No response body from OpenAI' }, { status: 500 });
        }

        // Stream download to temp file
        tempFilePath = join(tmpdir(), `embedding-import-${Date.now()}-${Math.random().toString(36).substring(7)}.jsonl`);
        const writeStream = createWriteStream(tempFilePath);
        await pipeline(Readable.fromWeb(fileRes.body as any), writeStream);
      }

      // Process file line by line using streams
      console.log(`[Import Embeddings] Processing file: ${tempFilePath}`);
      
      const readStream = createReadStream(tempFilePath, { encoding: 'utf-8' });
      const rl = createInterface({
        input: readStream,
        crlfDelay: Infinity
      });

      // Parse JSONL and extract embeddings - process in batches to avoid memory issues
      const errors: string[] = [];
      let processedCount = 0;
      let failedCount = 0;
      let insertedCount = 0;
      let duplicateCount = 0;

      const PROCESSING_BATCH_SIZE = 1000; // Process and insert in smaller batches to catch errors earlier
      const INSERT_BATCH_SIZE = 500; // Insert into DB in smaller batches
      let currentBatch: Array<{
        faultId: string;
        embedding: number[];
      }> = [];

      // Process lines as they come in
      for await (const line of rl) {
        checkAbort(); // Check for abort signal
        
        const trimmedLine = line.trim();
        if (!trimmedLine) continue;

        processedCount++;
        if (processedCount % 10000 === 0) {
          console.log(`[Import Embeddings] Processed ${processedCount} lines, inserted ${insertedCount}...`);
        }

        try {
          const result = JSON.parse(trimmedLine);
          
          // Check if request was successful
          if (result.response?.status_code !== 200) {
            failedCount++;
            if (errors.length < 50) {
              errors.push(`Request ${result.custom_id} failed: ${result.response?.body?.error?.message || 'Unknown error'}`);
            }
            continue;
          }

          // Extract embedding first
          const embedding = result.response?.body?.data?.[0]?.embedding;

          if (!embedding || !Array.isArray(embedding)) {
            failedCount++;
            if (errors.length < 50) {
              errors.push(`Missing or invalid embedding (custom_id: ${result.custom_id || 'unknown'})`);
            }
            continue;
          }

          if (embedding.length === 0) {
            failedCount++;
            if (errors.length < 50) {
              errors.push(`Empty embedding array (custom_id: ${result.custom_id || 'unknown'})`);
            }
            continue;
          }

          // Extract fault ID from custom_id (format: embedding-answer-{generationId}-{index})
          const customId = result.custom_id || '';
          
          // Parse custom_id format: embedding-answer-{generationId}-{index}
          // We need to find the actual fault_id from the database based on generation_id and index
          let generationId: string | null = null;
          let questionIndex: number | null = null;
          
          const embeddingPrefixMatch = customId.match(/^embedding-answer-(.+?)-(\d+)$/);
          if (embeddingPrefixMatch) {
            generationId = embeddingPrefixMatch[1];
            questionIndex = parseInt(embeddingPrefixMatch[2], 10);
            
            // Log first few successful extractions for debugging
            if (processedCount <= 5) {
              console.log(`[Import Embeddings] Parsed custom_id: ${customId} -> generationId=${generationId}, index=${questionIndex}`);
            }
          } else {
            // Try alternative format: embedding-{fault_id} (direct UUID)
            const directMatch = customId.match(/^embedding-(.+)$/);
            if (directMatch) {
              const potentialFaultId = directMatch[1];
              // Check if it's a valid UUID format
              const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
              if (uuidRegex.test(potentialFaultId)) {
                // It's a direct fault ID
                currentBatch.push({
                  faultId: potentialFaultId,
                  embedding
                });
                if (currentBatch.length <= 3) {
                  console.log(`[Import Embeddings] Direct fault ID: ${potentialFaultId}`);
                }
                continue;
              }
            }
            
            // Invalid format
            failedCount++;
            if (errors.length < 50) {
              errors.push(`Invalid custom_id format: ${customId}. Expected: embedding-answer-{generationId}-{index} or embedding-{uuid}`);
            }
            if (processedCount <= 10) {
              console.warn(`[Import Embeddings] Invalid custom_id format: ${customId}`);
            }
            continue;
          }
          
          if (!generationId || questionIndex === null) {
            failedCount++;
            if (errors.length < 50) {
              errors.push(`Failed to parse custom_id: ${customId}`);
            }
            continue;
          }
          
          // Store generationId and index for batch processing
          // We'll resolve fault IDs in batches for efficiency
          currentBatch.push({
            faultId: `${generationId}:${questionIndex}`, // Temporary format: generationId:index
            embedding,
            generationId, // Store separately for lookup
            questionIndex
          } as any);
          
          // Log batch progress
          if (currentBatch.length === 1 || currentBatch.length % 100 === 0) {
            console.log(`[Import Embeddings] Batch size: ${currentBatch.length}/${PROCESSING_BATCH_SIZE}`);
          }

          // Process batch when it reaches the size limit
          if (currentBatch.length >= PROCESSING_BATCH_SIZE) {
            checkAbort(); // Check for abort signal before processing batch
            console.log(`[Import Embeddings] Processing batch of ${currentBatch.length} embeddings...`);
            try {
              const batchResults = await processEmbeddingBatch(supabase, currentBatch, abortSignal);
              insertedCount += batchResults.inserted;
              duplicateCount += batchResults.duplicates;
              failedCount += batchResults.failed;
              console.log(`[Import Embeddings] Batch results: inserted=${batchResults.inserted}, duplicates=${batchResults.duplicates}, failed=${batchResults.failed}`);
              if (errors.length < 50 && batchResults.errors.length > 0) {
                errors.push(...batchResults.errors.slice(0, 50 - errors.length));
              }
            } catch (batchError) {
              if (isAborted || abortSignal?.aborted) {
                throw new Error('Import cancelled by user');
              }
              console.error(`[Import Embeddings] Error processing batch:`, batchError);
              failedCount += currentBatch.length;
              errors.push(`Error processing batch: ${batchError instanceof Error ? batchError.message : 'Unknown error'}`);
            }
            currentBatch = []; // Clear batch
          }
        } catch (err) {
          failedCount++;
          if (errors.length < 50) {
            errors.push(`Failed to parse line ${processedCount}: ${err instanceof Error ? err.message : 'Unknown error'}`);
          }
        }
      }

      // Process remaining batch
      console.log(`[Import Embeddings] Finished reading file. Current batch size: ${currentBatch.length}, isAborted: ${isAborted}, processedCount: ${processedCount}`);
      if (currentBatch.length > 0 && !isAborted) {
        checkAbort();
        console.log(`[Import Embeddings] Processing final batch of ${currentBatch.length} embeddings...`);
        console.log(`[Import Embeddings] Sample batch entries (first 2):`, currentBatch.slice(0, 2).map(e => ({ 
          faultId: e.faultId, 
          hasEmbedding: !!e.embedding, 
          embeddingLength: e.embedding?.length,
          generationId: (e as any).generationId,
          questionIndex: (e as any).questionIndex
        })));
        try {
          const batchResults = await processEmbeddingBatch(supabase, currentBatch, abortSignal);
          insertedCount += batchResults.inserted;
          duplicateCount += batchResults.duplicates;
          failedCount += batchResults.failed;
          console.log(`[Import Embeddings] Final batch results: inserted=${batchResults.inserted}, duplicates=${batchResults.duplicates}, failed=${batchResults.failed}`);
          if (errors.length < 50 && batchResults.errors.length > 0) {
            errors.push(...batchResults.errors.slice(0, 50 - errors.length));
          }
        } catch (batchError) {
          if (isAborted || abortSignal?.aborted) {
            throw new Error('Import cancelled by user');
          }
          console.error(`[Import Embeddings] Error processing final batch:`, batchError);
          console.error(`[Import Embeddings] Batch error stack:`, batchError instanceof Error ? batchError.stack : 'No stack');
          failedCount += currentBatch.length;
          errors.push(`Error processing final batch: ${batchError instanceof Error ? batchError.message : 'Unknown error'}`);
        }
      } else if (currentBatch.length === 0) {
        console.warn(`[Import Embeddings] No embeddings in final batch to process`);
      } else if (isAborted) {
        console.warn(`[Import Embeddings] Import was aborted, skipping final batch`);
      }

      if (isAborted || abortSignal?.aborted) {
        console.log(`[Import Embeddings] Import cancelled: processed ${processedCount} lines, inserted ${insertedCount} before cancellation`);
        return NextResponse.json({
          success: false,
          cancelled: true,
          processed: processedCount,
          inserted: insertedCount,
          duplicates: duplicateCount,
          failed: failedCount,
          message: 'Import cancelled by user'
        }, { status: 499 }); // 499 Client Closed Request
      }

      console.log(`[Import Embeddings] Completed: processed ${processedCount} lines, inserted ${insertedCount}, duplicates ${duplicateCount}, failed ${failedCount}`);

      return NextResponse.json({
        success: true,
        processed: processedCount,
        inserted: insertedCount,
        duplicates: duplicateCount,
        failed: failedCount,
        errors: errors.slice(0, 10) // Return first 10 errors
      });
    } finally {
      // Clean up temp file
      if (tempFilePath) {
        try {
          await unlink(tempFilePath);
          console.log(`[Import Embeddings] Cleaned up temp file: ${tempFilePath}`);
        } catch (err) {
          console.warn(`[Import Embeddings] Failed to delete temp file: ${err}`);
        }
      }
    }
  } catch (error) {
    console.error('Import embedding batch results error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Helper function to resolve fault IDs from generation IDs and indices
async function resolveFaultIds(
  supabase: ReturnType<typeof getSupabaseClient>,
  generationIdIndexPairs: Array<{ generationId: string; questionIndex: number }>,
  abortSignal?: AbortSignal
): Promise<Map<string, string>> {
  const faultIdMap = new Map<string, string>();
  
  // Group by generation ID for efficient querying
  const byGeneration = new Map<string, number[]>();
  for (const pair of generationIdIndexPairs) {
    if (!byGeneration.has(pair.generationId)) {
      byGeneration.set(pair.generationId, []);
    }
    byGeneration.get(pair.generationId)!.push(pair.questionIndex);
  }
  
  // Cache all generations once to avoid multiple queries
  let allGenerationsCache: Array<{ id: string }> | null = null;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const needsGenerationLookup = Array.from(byGeneration.keys()).some(id => !uuidRegex.test(id));
  
  if (needsGenerationLookup) {
    console.log(`[resolveFaultIds] Fetching all generations for partial ID lookup...`);
    const { data: allGenerations, error: genError } = await supabase
      .from('model_generations')
      .select('id')
      .limit(50000); // Fetch enough to cover all generations
    
    if (genError) {
      console.error(`[resolveFaultIds] Error fetching generations:`, genError);
    } else {
      allGenerationsCache = allGenerations || [];
      console.log(`[resolveFaultIds] Cached ${allGenerationsCache.length} generations for lookup`);
    }
  }
  
  // For each generation, try to find the full UUID first if we only have a partial ID
  for (const [partialGenerationId, indices] of byGeneration) {
    if (abortSignal?.aborted) {
      throw new Error('Import cancelled by user');
    }
    
    let fullGenerationId = partialGenerationId;
    
    // Check if it's a partial ID (not a full UUID)
    if (!uuidRegex.test(partialGenerationId)) {
      console.log(`[resolveFaultIds] Partial generation ID detected: ${partialGenerationId}, searching for full UUID...`);
      
      if (allGenerationsCache && allGenerationsCache.length > 0) {
        // Filter in memory to find UUIDs starting with the partial ID (without dashes)
        const partialIdNoDashes = partialGenerationId.toLowerCase().replace(/-/g, '');
        const matchingGenerations = allGenerationsCache.filter(gen => {
          const fullIdNoDashes = gen.id.toLowerCase().replace(/-/g, '');
          return fullIdNoDashes.startsWith(partialIdNoDashes);
        });
        
        if (matchingGenerations.length === 1) {
          fullGenerationId = matchingGenerations[0].id;
          console.log(`[resolveFaultIds] Found full generation ID: ${fullGenerationId} for partial ${partialGenerationId}`);
        } else if (matchingGenerations.length > 1) {
          console.warn(`[resolveFaultIds] Multiple generations found for partial ID ${partialGenerationId} (${matchingGenerations.length}), using first one`);
          fullGenerationId = matchingGenerations[0].id;
        } else {
          console.warn(`[resolveFaultIds] No generation found for partial ID ${partialGenerationId} (searched ${allGenerationsCache.length} generations)`);
          // Skip this generation - we can't resolve it
          continue;
        }
      } else {
        console.warn(`[resolveFaultIds] No generations cache available for partial ID ${partialGenerationId}`);
        continue;
      }
    }
    
    const maxIndex = Math.max(...indices);
    
    // Fetch ALL faults for this generation, ordered by created_at
    // Supabase has a default limit of 1000, so we need to paginate or remove the limit
    // We'll fetch in batches to handle large numbers of faults
    const allFaults: Array<{ id: string; created_at: string }> = [];
    const FAULT_FETCH_BATCH_SIZE = 1000;
    let offset = 0;
    let hasMore = true;
    
    console.log(`[resolveFaultIds] Fetching faults for generation ${fullGenerationId} (need at least ${maxIndex} faults)...`);
    
    // Fetch ALL faults, not just until maxIndex, because we need to ensure we have all of them
    // Fetch ALL faults for this generation - don't stop early
    while (hasMore) {
      // Fetch in batches to handle large numbers of faults
      const { data: faultsBatch, error } = await supabase
        .from('car_faults')
        .select('id, created_at')
        .eq('model_generation_id', fullGenerationId)
        .order('created_at', { ascending: true })
        .range(offset, offset + FAULT_FETCH_BATCH_SIZE - 1);
      
      if (error) {
        console.error(`[resolveFaultIds] Error fetching faults batch (offset ${offset}):`, error);
        break;
      }
      
      if (!faultsBatch || faultsBatch.length === 0) {
        hasMore = false;
        break;
      }
      
      allFaults.push(...faultsBatch);
      offset += FAULT_FETCH_BATCH_SIZE;
      
      // Log progress every 5000 faults
      if (allFaults.length % 5000 === 0) {
        console.log(`[resolveFaultIds] Fetched ${allFaults.length} faults so far (need at least ${maxIndex})...`);
      }
      
      // If we got less than the batch size, we've reached the end of available faults
      if (faultsBatch.length < FAULT_FETCH_BATCH_SIZE) {
        hasMore = false;
      }
    }
    
    const faults = allFaults;
    
    if (faults.length === 0) {
      console.warn(`[resolveFaultIds] No faults found for generation ${fullGenerationId}`);
      continue;
    }
    
    console.log(`[resolveFaultIds] Found ${faults.length} faults for generation ${fullGenerationId}, max index needed: ${maxIndex}`);
    
    // Log progress every 5000 faults
    if (faults.length >= 5000) {
      console.log(`[resolveFaultIds] Successfully fetched ${faults.length} faults for generation ${fullGenerationId}`);
    }
    
    // Map indices to fault IDs (1-based index -> array index)
    // IMPORTANT: The index in custom_id is 1-based, so index 1 = first fault (array index 0)
    // However, we need to be careful: if faults were created in batches or out of order,
    // we might need to match by creation order within a time window
    let matchedCount = 0;
    for (const index of indices) {
      const arrayIndex = index - 1; // Convert 1-based to 0-based
      if (arrayIndex >= 0 && arrayIndex < faults.length) {
        const key = `${partialGenerationId}:${index}`;
        faultIdMap.set(key, faults[arrayIndex].id);
        matchedCount++;
        if (matchedCount <= 5) {
          console.log(`[resolveFaultIds] Mapped ${key} -> ${faults[arrayIndex].id} (created at ${faults[arrayIndex].created_at})`);
        }
      } else {
        console.warn(`[resolveFaultIds] Index ${index} (array index ${arrayIndex}) out of range for generation ${fullGenerationId} (found ${faults.length} faults, need index ${index})`);
        // Try to find by looking at the last few faults if index is close to the end
        if (index > faults.length && index <= faults.length + 5) {
          console.warn(`[resolveFaultIds] Index ${index} is slightly beyond available faults. This might indicate some faults were skipped during import.`);
        }
      }
    }
    
    if (matchedCount < indices.length) {
      console.warn(`[resolveFaultIds] Only matched ${matchedCount}/${indices.length} indices for generation ${fullGenerationId}`);
    }
  }
  
  console.log(`[resolveFaultIds] Successfully resolved ${faultIdMap.size} fault IDs`);
  return faultIdMap;
}

// Helper function to process a batch of embeddings
async function processEmbeddingBatch(
  supabase: ReturnType<typeof getSupabaseClient>,
  embeddings: Array<{ faultId: string; embedding: number[]; generationId?: string; questionIndex?: number }>,
  abortSignal?: AbortSignal
): Promise<{ inserted: number; duplicates: number; failed: number; errors: string[] }> {
  const INSERT_BATCH_SIZE = 1000;
  let insertedCount = 0;
  let duplicateCount = 0;
  let failedCount = 0;
  const errors: string[] = [];

  console.log(`[processEmbeddingBatch] Processing ${embeddings.length} embeddings...`);

  // First, resolve fault IDs if needed (for generationId:index format)
  const needsResolution = embeddings.some(e => e.faultId.includes(':') && e.generationId && e.questionIndex);
  const faultIdMap = new Map<string, string>();
  
  if (needsResolution) {
    console.log(`[processEmbeddingBatch] Resolving fault IDs from generation IDs and indices...`);
    const generationIdIndexPairs = embeddings
      .filter(e => e.generationId && e.questionIndex)
      .map(e => ({ generationId: e.generationId!, questionIndex: e.questionIndex! }));
    
    const resolvedMap = await resolveFaultIds(supabase, generationIdIndexPairs, abortSignal);
    
    // Copy resolved IDs to faultIdMap
    for (const [key, value] of resolvedMap) {
      faultIdMap.set(key, value);
    }
    
    // Replace temporary faultIds with actual UUIDs
    for (const emb of embeddings) {
      if (emb.faultId.includes(':') && faultIdMap.has(emb.faultId)) {
        emb.faultId = faultIdMap.get(emb.faultId)!;
      }
    }
    
    console.log(`[processEmbeddingBatch] Resolved ${faultIdMap.size} fault IDs`);
  }

  // Fetch text content for all faults in this batch
  const faultIds = embeddings.map(e => e.faultId).filter(id => {
    // Only include valid UUIDs
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
  });
  
  if (faultIds.length === 0) {
    console.warn(`[processEmbeddingBatch] No valid fault IDs found in batch`);
    return { inserted: 0, duplicates: 0, failed: embeddings.length, errors: ['No valid fault IDs found'] };
  }
  
  const FETCH_BATCH_SIZE = 500;
  const faultsMap = new Map<string, { title: string; description?: string }>();
  
  console.log(`[processEmbeddingBatch] Fetching text content for ${faultIds.length} faults...`);
  for (let i = 0; i < faultIds.length; i += FETCH_BATCH_SIZE) {
    checkAbort(abortSignal);
    const batch = faultIds.slice(i, i + FETCH_BATCH_SIZE);
    const { data: faults, error: fetchError } = await supabase
      .from('car_faults')
      .select('id, title, description')
      .in('id', batch);
    
    if (fetchError) {
      console.error(`[processEmbeddingBatch] Error fetching faults:`, fetchError);
      errors.push(`Error fetching faults: ${fetchError.message}`);
    }
    
    if (faults) {
      faults.forEach(f => {
        faultsMap.set(f.id, { title: f.title, description: f.description || undefined });
      });
      console.log(`[processEmbeddingBatch] Fetched ${faults.length} faults (batch ${Math.floor(i / FETCH_BATCH_SIZE) + 1})`);
    }
  }
  
  console.log(`[processEmbeddingBatch] Total faults in map: ${faultsMap.size}`);

  // Filter embeddings to only those with valid fault IDs
  const validEmbeddings = embeddings.filter(e => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(e.faultId) && faultsMap.has(e.faultId);
  });
  
  if (validEmbeddings.length === 0) {
    console.warn(`[processEmbeddingBatch] No valid embeddings with matching faults found`);
    return { inserted: 0, duplicates: 0, failed: embeddings.length, errors: ['No valid embeddings with matching faults'] };
  }
  
  // Insert embeddings in batches
  console.log(`[processEmbeddingBatch] Inserting ${validEmbeddings.length} embeddings in batches of ${INSERT_BATCH_SIZE}...`);
  for (let i = 0; i < validEmbeddings.length; i += INSERT_BATCH_SIZE) {
    checkAbort(abortSignal);
    const batch = validEmbeddings.slice(i, i + INSERT_BATCH_SIZE);
    const insertData = batch.map(emb => {
      const fault = faultsMap.get(emb.faultId);
      const textContent = fault 
        ? `${fault.title}${fault.description ? ` ${fault.description}` : ''}`.trim()
        : '';
      
      return {
        car_fault_id: emb.faultId,
        embedding: emb.embedding,
        text_content: textContent,
      };
    });

    console.log(`[processEmbeddingBatch] Inserting batch ${Math.floor(i / INSERT_BATCH_SIZE) + 1} with ${insertData.length} items...`);
    const { error: insertError, data: insertDataResult } = await supabase
      .from('car_fault_embeddings')
      .insert(insertData)
      .select();

    if (insertError) {
      console.error(`[processEmbeddingBatch] Batch insert error:`, insertError);
      // If batch insert fails, try individual inserts
      if (insertError.code === '23505') {
        // Unique constraint violation - some already exist
        console.log(`[processEmbeddingBatch] Unique constraint violation, trying individual inserts...`);
        for (const item of insertData) {
          try {
            const { error: singleError } = await supabase
              .from('car_fault_embeddings')
              .insert(item);
            
            if (singleError && singleError.code !== '23505') {
              failedCount++;
              if (errors.length < 50) {
                errors.push(`Failed to insert embedding for ${item.car_fault_id}: ${singleError.message}`);
              }
            } else if (singleError && singleError.code === '23505') {
              duplicateCount++;
            } else {
              insertedCount++;
            }
          } catch (err) {
            failedCount++;
            if (errors.length < 50) {
              errors.push(`Exception inserting ${item.car_fault_id}: ${err instanceof Error ? err.message : 'Unknown'}`);
            }
          }
        }
      } else {
        failedCount += batch.length;
        if (errors.length < 50) {
          errors.push(`Batch insert failed: ${insertError.message}`);
        }
      }
    } else {
      insertedCount += batch.length;
      console.log(`[processEmbeddingBatch] Successfully inserted batch ${Math.floor(i / INSERT_BATCH_SIZE) + 1}: ${batch.length} embeddings`);
    }
  }

  return { inserted: insertedCount, duplicates: duplicateCount, failed: failedCount, errors };
}

