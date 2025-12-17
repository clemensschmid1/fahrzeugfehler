import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const maxDuration = 600; // 10 minutes

const OPENAI_API_URL = 'https://api.openai.com/v1';

function getOpenAIApiKey() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not set');
  }
  return apiKey;
}

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase credentials');
  }
  
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

// Submit multiple URLs to IndexNow in batch (much faster)
async function submitToIndexNowBatch(urls: string[]): Promise<number> {
  if (urls.length === 0) return 0;
  
  try {
    const INDEXNOW_KEY = process.env.INDEXNOW_KEY || '19b8bc246b244733843ff32b3d426207';
    const HOST = process.env.INDEXNOW_HOST || 'fahrzeugfehler.de';
    const KEY_LOCATION = `https://${HOST}/${INDEXNOW_KEY}.txt`;

    if (!INDEXNOW_KEY || INDEXNOW_KEY === 'REPLACE_WITH_YOUR_KEY') {
      return 0;
    }

    // Validate URLs
    const validUrls = urls.filter(url => {
      try {
        const urlObj = new URL(url);
        return urlObj.hostname.replace(/^www\./, '') === HOST;
      } catch {
        return false;
      }
    });

    if (validUrls.length === 0) return 0;

    const payload = {
      host: HOST,
      key: INDEXNOW_KEY,
      keyLocation: KEY_LOCATION,
      urlList: validUrls,
    };

    // Try both endpoints
    const endpoints = [
      'https://api.indexnow.org/indexnow',
      'https://www.bing.com/indexnow',
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (response.ok || response.status === 202) {
          return validUrls.length;
        }
      } catch (error) {
        // Continue to next endpoint
      }
    }

    return 0;
  } catch (error) {
    return 0;
  }
}

export async function POST(req: Request) {
  try {
    const { batchSize = 500, offset = 0, skipIndexNow = false, concurrency = 50 } = await req.json();
    
    const supabase = getSupabaseClient();

    // Get faults without embeddings using a more reliable approach
    // First, get a batch of live faults with their relations
    const { data: allFaults, error: fetchError } = await supabase
      .from('car_faults')
      .select(`
        id,
        title,
        description,
        slug,
        language_path,
        model_generations!inner(
          slug,
          car_models!inner(
            slug,
            car_brands!inner(slug)
          )
        )
      `)
      .eq('status', 'live')
      .range(offset, offset + batchSize * 2 - 1) // Get more to filter
      .order('created_at', { ascending: true });

    if (fetchError) {
      console.error('Error fetching faults:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch faults' }, { status: 500 });
    }

    if (!allFaults || allFaults.length === 0) {
      return NextResponse.json({
        success: true,
        processed: 0,
        message: 'No more faults to process',
        hasMore: false,
      });
    }

    // Get all existing embedding IDs in one query
    const faultIds = allFaults.map(f => f.id);
    const { data: existingEmbeddings } = await supabase
      .from('car_fault_embeddings')
      .select('car_fault_id')
      .in('car_fault_id', faultIds);

    const existingIds = new Set(existingEmbeddings?.map(e => e.car_fault_id) || []);

    // Filter to only faults without embeddings
    const faults = allFaults.filter(fault => !existingIds.has(fault.id)).slice(0, batchSize);

    if (fetchError) {
      console.error('Error fetching faults:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch faults' }, { status: 500 });
    }

    if (!faults || faults.length === 0) {
      return NextResponse.json({
        success: true,
        processed: 0,
        message: 'No more faults to process',
        hasMore: false,
      });
    }

    // Process faults in parallel batches
    const processFault = async (fault: any) => {
      try {
        // Double-check that embedding doesn't exist (race condition protection)
        const { data: existingCheck } = await supabase
          .from('car_fault_embeddings')
          .select('id')
          .eq('car_fault_id', fault.id)
          .single();

        if (existingCheck) {
          return { 
            faultId: fault.id, 
            success: false, 
            error: 'Embedding already exists (race condition)',
            url: null,
          };
        }

        // Prepare text content for embedding (title + description)
        const textContent = `${fault.title}${fault.description ? ` ${fault.description}` : ''}`.trim();

        if (!textContent) {
          return { 
            faultId: fault.id, 
            success: false, 
            error: 'No text content to embed',
            url: null,
          };
        }

        // Generate embedding
        const embedding = await generateEmbedding(textContent);

        // Insert embedding with conflict handling
        const { error: insertError } = await supabase
          .from('car_fault_embeddings')
          .insert({
            car_fault_id: fault.id,
            embedding: embedding,
            text_content: textContent,
          });

        if (insertError) {
          // Check if it's a unique constraint violation (already exists)
          if (insertError.code === '23505' || insertError.message?.includes('duplicate') || insertError.message?.includes('unique')) {
            return { 
              faultId: fault.id, 
              success: false, 
              error: 'Embedding already exists',
              url: null,
            };
          }
          return { 
            faultId: fault.id, 
            success: false, 
            error: insertError.message || 'Database error',
            url: null,
          };
        }

        // Build URL for IndexNow submission (collect URLs, submit in batch later)
        let url: string | null = null;
        if (!skipIndexNow) {
          try {
            const gen = fault.model_generations as any;
            if (gen && gen.car_models && gen.car_models.car_brands) {
              const langPath = fault.language_path || 'en';
              // Nur deutsche URLs (kein lang-Parameter mehr)
              url = `https://fahrzeugfehler.de/cars/${gen.car_models.car_brands.slug}/${gen.car_models.slug}/${gen.slug}/faults/${fault.slug}`;
            }
          } catch (error) {
            // Ignore
          }
        }

        return { 
          faultId: fault.id, 
          success: true,
          url,
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`[Embed Error] Fault ${fault.id}:`, errorMessage);
        return {
          faultId: fault.id,
          success: false,
          error: errorMessage,
          url: null,
        };
      }
    };

    // Process in parallel with concurrency limit
    const results = [];
    let successCount = 0;
    let failureCount = 0;
    const indexNowUrls: string[] = [];

    // Process in chunks with concurrency limit
    for (let i = 0; i < faults.length; i += concurrency) {
      const chunk = faults.slice(i, i + concurrency);
      const chunkResults = await Promise.all(chunk.map(processFault));
      
      for (const result of chunkResults) {
        results.push({
          faultId: result.faultId,
          success: result.success,
          error: result.error,
          indexNowSubmitted: false, // Will be set after batch submission
        });
        
        if (result.success) {
          successCount++;
          if (result.url) {
            indexNowUrls.push(result.url);
          }
        } else {
          failureCount++;
        }
      }
    }

    // Submit all IndexNow URLs in one batch (MUCH faster!)
    let indexNowSuccessCount = 0;
    let indexNowFailureCount = 0;
    
    if (!skipIndexNow && indexNowUrls.length > 0) {
      // Submit in batches of 100 (IndexNow limit is 10k, but we batch smaller for reliability)
      const indexNowBatchSize = 100;
      for (let i = 0; i < indexNowUrls.length; i += indexNowBatchSize) {
        const batch = indexNowUrls.slice(i, i + indexNowBatchSize);
        const submitted = await submitToIndexNowBatch(batch);
        indexNowSuccessCount += submitted;
        indexNowFailureCount += (batch.length - submitted);
      }
      
      // Update results with IndexNow status
      let urlIndex = 0;
      for (const result of results) {
        if (result.success && urlIndex < indexNowUrls.length) {
          result.indexNowSubmitted = urlIndex < indexNowSuccessCount;
          urlIndex++;
        }
      }
    }

    // Log error summary for debugging
    if (failureCount > 0) {
      const errorCounts: Record<string, number> = {};
      results.forEach(r => {
        if (!r.success && r.error) {
          errorCounts[r.error] = (errorCounts[r.error] || 0) + 1;
        }
      });
      console.error('[Embed Batch] Error summary:', errorCounts);
    }

    return NextResponse.json({
      success: true,
      processed: faults.length,
      successful: successCount,
      failed: failureCount,
      indexNowSuccessful: indexNowSuccessCount,
      indexNowFailed: indexNowFailureCount,
      results: results.slice(0, 100), // Limit results in response to avoid huge payloads
      nextOffset: offset + allFaults.length, // Use allFaults length for proper pagination
      hasMore: allFaults.length >= batchSize * 2, // Check if we got full batch
    });
  } catch (error) {
    console.error('Embed and index error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

