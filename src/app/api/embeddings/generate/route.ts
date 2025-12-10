import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const maxDuration = 3600; // 60 minutes for large batches

const OPENAI_API_URL = 'https://api.openai.com/v1';

function getOpenAIApiKey() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not set');
  }
  return apiKey;
}

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase credentials');
  }
  
  // Use same configuration as import route (which works successfully)
  return createClient(supabaseUrl, supabaseKey);
}

// Generate embedding using OpenAI's cheapest model
async function generateEmbedding(text: string): Promise<number[]> {
  const apiKey = getOpenAIApiKey();
  
  const response = await fetch(`${OPENAI_API_URL}/embeddings`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small', // Cheapest embedding model
      input: text,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error: ${errorText}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}

export async function POST(req: Request) {
  try {
    const { faultId, faultIds, batch = false } = await req.json();

    if (!batch && !faultId) {
      return NextResponse.json({ error: 'Missing faultId' }, { status: 400 });
    }

    if (batch && (!faultIds || !Array.isArray(faultIds) || faultIds.length === 0)) {
      return NextResponse.json({ error: 'Missing or invalid faultIds array' }, { status: 400 });
    }

    // Use a single Supabase client for the entire request to avoid connection issues
    const supabase = getSupabaseClient();
    const idsToProcess = batch ? faultIds : [faultId];
    const results = [];

    // For large batches, use parallel processing with high concurrency
    const CONCURRENCY = batch && idsToProcess.length > 100 ? 50 : 10;
    const BATCH_SIZE = 500; // Increased batch size - Supabase can handle this (we import 11k in 60s)
    const PARALLEL_CHUNKS = 1; // Process chunks sequentially to avoid Supabase connection issues, but embeddings are parallel

    // Prepare all chunks first
    const chunks: string[][] = [];
    for (let chunkStart = 0; chunkStart < idsToProcess.length; chunkStart += BATCH_SIZE) {
      chunks.push(idsToProcess.slice(chunkStart, chunkStart + BATCH_SIZE));
    }

    // Process chunks in parallel groups
    for (let chunkGroupStart = 0; chunkGroupStart < chunks.length; chunkGroupStart += PARALLEL_CHUNKS) {
      const chunkGroup = chunks.slice(chunkGroupStart, chunkGroupStart + PARALLEL_CHUNKS);
      
      // Process all chunks in this group in parallel
      const chunkPromises = chunkGroup.map(async (chunk) => {
        const chunkResults: Array<{ faultId: string; success: boolean; error?: string }> = [];
      
      // Fetch all faults in this chunk at once
      // Filter out invalid IDs (must be valid UUIDs)
      const validIds = chunk.filter(id => {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        return typeof id === 'string' && uuidRegex.test(id);
      });
      
      if (validIds.length === 0) {
        console.warn('[Embeddings] No valid UUIDs in chunk, skipping');
        for (const id of chunk) {
          chunkResults.push({ faultId: id, success: false, error: 'Invalid UUID format' });
        }
        return chunkResults;
      }
      
      // Fetch faults - split into smaller batches to avoid connection issues
      let faults: any[] = [];
      let fetchError: any = null;
      const FETCH_BATCH_SIZE = 100; // Smaller batches for fetching to avoid connection issues
      
      for (let i = 0; i < validIds.length; i += FETCH_BATCH_SIZE) {
        const batchIds = validIds.slice(i, i + FETCH_BATCH_SIZE);
        let retryCount = 0;
        const maxRetries = 3;
        let batchSuccess = false;
        
        while (retryCount < maxRetries && !batchSuccess) {
          try {
            const result = await supabase
              .from('car_faults')
              .select('id, title, description')
              .in('id', batchIds);
            
            if (result.error) {
              fetchError = result.error;
              if (retryCount < maxRetries - 1) {
                const waitTime = Math.pow(2, retryCount) * 1000;
                console.warn(`[Embeddings] Fetch batch ${Math.floor(i / FETCH_BATCH_SIZE) + 1} retry ${retryCount + 1}/${maxRetries} after ${waitTime}ms`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
                retryCount++;
                continue;
              }
            } else if (result.data) {
              faults.push(...result.data);
              batchSuccess = true;
            }
          } catch (err) {
            fetchError = err;
            if (retryCount < maxRetries - 1) {
              const waitTime = Math.pow(2, retryCount) * 1000;
              console.warn(`[Embeddings] Fetch batch ${Math.floor(i / FETCH_BATCH_SIZE) + 1} exception, retry ${retryCount + 1}/${maxRetries} after ${waitTime}ms`);
              await new Promise(resolve => setTimeout(resolve, waitTime));
              retryCount++;
            } else {
              batchSuccess = true; // Exit loop even on error
            }
          }
        }
        
        // Small delay between fetch batches
        if (i + FETCH_BATCH_SIZE < validIds.length) {
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }
      
      // If we got some faults, continue (even if not all)
      if (faults.length === 0 && fetchError) {
        fetchError = fetchError || new Error('Failed to fetch any faults');
      } else {
        fetchError = null; // Clear error if we got at least some faults
      }

      if (fetchError) {
        console.error('[Embeddings] Error fetching faults after retries:', fetchError);
        console.error('[Embeddings] Chunk size:', chunk.length, 'Valid IDs:', validIds.length);
        console.error('[Embeddings] Sample IDs:', validIds.slice(0, 5));
        // Mark all as failed
        for (const id of chunk) {
          chunkResults.push({ faultId: id, success: false, error: `Failed to fetch fault: ${fetchError.message || 'Unknown error'}` });
        }
        return chunkResults;
      }
      
      if (!faults || faults.length === 0) {
        console.warn('[Embeddings] No faults found for chunk, IDs may not exist yet');
        for (const id of chunk) {
          chunkResults.push({ faultId: id, success: false, error: 'Fault not found in database' });
        }
        return chunkResults;
      }

      const faultsMap = new Map((faults || []).map(f => [f.id, f]));

      // Get existing embeddings for this chunk (single query - Supabase can handle 500 items)
      // Use the shared Supabase client
      const { data: existingEmbeddings } = await supabase
        .from('car_fault_embeddings')
        .select('car_fault_id')
        .in('car_fault_id', chunk);

      const existingIds = new Set((existingEmbeddings || []).map(e => e.car_fault_id));

      // Process faults in parallel - generate embeddings first, then batch insert
      const generateEmbeddingsForBatch = async (faultIds: string[]) => {
        const results: Array<{ faultId: string; success: boolean; error?: string; embedding?: number[]; textContent?: string }> = [];
        
        // Generate all embeddings in parallel
        const embeddingPromises = faultIds.map(async (faultId) => {
          try {
            const fault = faultsMap.get(faultId);
            if (!fault) {
              return { faultId, success: false, error: 'Fault not found' };
            }

            // Prepare text content for embedding (title + description)
            const textContent = `${fault.title}${fault.description ? ` ${fault.description}` : ''}`.trim();

            if (!textContent) {
              return { faultId, success: false, error: 'No text content to embed' };
            }

            // Generate embedding
            const embedding = await generateEmbedding(textContent);
            return { faultId, success: true, embedding, textContent };
          } catch (error) {
            return {
              faultId,
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error',
            };
          }
        });

        const embeddingResults = await Promise.all(embeddingPromises);
        results.push(...embeddingResults);

        // Batch insert all successful embeddings at once
        const successfulEmbeddings = embeddingResults.filter(r => r.success && r.embedding && r.textContent);
        
        if (successfulEmbeddings.length > 0) {
          const insertData = successfulEmbeddings.map(r => ({
            car_fault_id: r.faultId!,
            embedding: r.embedding!,
            text_content: r.textContent!,
          }));

          // Try batch insert
          const { error: insertError } = await supabase
            .from('car_fault_embeddings')
            .insert(insertData);

          if (insertError) {
            // If batch insert fails (e.g., due to duplicates), try individual inserts
            console.warn(`[Embeddings] Batch insert failed, trying individual inserts: ${insertError.message}`);
            for (const item of insertData) {
              try {
                const { error: singleError } = await supabase
                  .from('car_fault_embeddings')
                  .insert(item);
                
                if (singleError) {
                  // Check if it's a unique constraint error (race condition)
                  if (singleError.code === '23505') {
                    // Find and mark as success
                    const result = results.find(r => r.faultId === item.car_fault_id);
                    if (result) {
                      result.success = true;
                      result.error = 'Embedding already exists (race condition)';
                    }
                  } else {
                    // Find and mark as failed
                    const result = results.find(r => r.faultId === item.car_fault_id);
                    if (result) {
                      result.success = false;
                      result.error = singleError.message;
                    }
                  }
                }
              } catch (err) {
                // Find and mark as failed
                const result = results.find(r => r.faultId === item.car_fault_id);
                if (result) {
                  result.success = false;
                  result.error = err instanceof Error ? err.message : 'Unknown error';
                }
              }
            }
          }
        }

        return results;
      };

      // Process all faults in the chunk with high concurrency for speed
      const faultIdsToProcess = validIds.filter(id => !existingIds.has(id) && faultsMap.has(id));
      
      if (faultIdsToProcess.length === 0) {
        console.log(`[Embeddings] All ${chunk.length} faults in chunk already have embeddings`);
        for (const id of chunk) {
          chunkResults.push({ faultId: id, success: true, error: 'Embedding already exists' });
        }
        return chunkResults;
      }

      // Process in parallel with very high concurrency for maximum speed
      // OpenAI embedding API can handle high concurrency (up to 5000 RPM for text-embedding-3-small)
      // Based on import speed (11k in 60s = ~183/sec), we can be very aggressive
      const EMBEDDING_CONCURRENCY = 1000; // Very high concurrency - OpenAI can handle this
      console.log(`[Embeddings] Processing ${faultIdsToProcess.length} faults with concurrency ${EMBEDDING_CONCURRENCY}`);
      
      // Process all faults in parallel batches
      const allBatches: string[][] = [];
      for (let i = 0; i < faultIdsToProcess.length; i += EMBEDDING_CONCURRENCY) {
        allBatches.push(faultIdsToProcess.slice(i, i + EMBEDDING_CONCURRENCY));
      }
      
      // Process all batches in parallel (no sequential waiting)
      const allBatchPromises = allBatches.map(async (batch, batchIndex) => {
        const batchResults = await generateEmbeddingsForBatch(batch);
        
        // Log progress
        const successful = batchResults.filter(r => r.success).length;
        const failed = batchResults.filter(r => !r.success).length;
        console.log(`[Embeddings] Batch ${batchIndex + 1}/${allBatches.length}: ${successful} successful, ${failed} failed`);
        
        return batchResults;
      });
      
      // Wait for all batches to complete
      const allResults = await Promise.all(allBatchPromises);
      chunkResults.push(...allResults.flat());
      
      return chunkResults;
      });
      
      // Wait for all chunks in this group to complete
      const chunkGroupResults = await Promise.all(chunkPromises);
      results.push(...chunkGroupResults.flat());
      
      // Minimal delay between chunk groups (Supabase can handle high throughput)
      if (chunkGroupStart + PARALLEL_CHUNKS < chunks.length) {
        await new Promise(resolve => setTimeout(resolve, 100)); // Reduced delay
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    return NextResponse.json({
      success: true,
      processed: idsToProcess.length,
      successful: successCount,
      failed: failureCount,
      results,
    });
  } catch (error) {
    console.error('Generate embeddings error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

