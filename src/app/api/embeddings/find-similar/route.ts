import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const maxDuration = 60; // 1 minute

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase credentials');
  }
  
  return createClient(supabaseUrl, supabaseKey);
}

function getOpenAIApiKey() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not set');
  }
  return apiKey;
}

// Generate embedding using OpenAI's cheapest model
async function generateEmbedding(text: string): Promise<number[]> {
  const apiKey = getOpenAIApiKey();
  
  const response = await fetch('https://api.openai.com/v1/embeddings', {
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
    const { 
      faultId, 
      searchText, 
      scope = 'generation', // 'generation' or 'global'
      matchThreshold = 0.7,
      matchCount = 6,
      language = 'en',
    } = await req.json();

    if (!faultId && !searchText) {
      return NextResponse.json({ error: 'Missing faultId or searchText' }, { status: 400 });
    }

    const supabase = getSupabaseClient();
    let queryEmbedding: number[];

    if (faultId) {
      // Get embedding from existing fault
      const { data: faultEmbedding, error: embeddingError } = await supabase
        .from('car_fault_embeddings')
        .select('embedding')
        .eq('car_fault_id', faultId)
        .single();

      if (embeddingError || !faultEmbedding?.embedding) {
        return NextResponse.json({ 
          error: 'Fault embedding not found. Please generate embeddings first.' 
        }, { status: 404 });
      }

      // Convert PostgreSQL vector to array
      // Handle both array format and PostgreSQL vector format
      let embeddingValue = faultEmbedding.embedding;
      
      if (Array.isArray(embeddingValue)) {
        queryEmbedding = embeddingValue;
      } else if (typeof embeddingValue === 'string') {
        // If it's a string, try to parse it
        try {
          const parsed = JSON.parse(embeddingValue);
          if (Array.isArray(parsed)) {
            queryEmbedding = parsed;
          } else {
            // If parsing fails, try to extract numbers from string
            const numbers = embeddingValue.match(/[\d.-]+/g);
            if (numbers && numbers.length > 0) {
              queryEmbedding = numbers.map(Number);
            } else {
              throw new Error('Could not parse embedding string');
            }
          }
        } catch {
          // If parsing fails, try to extract numbers from string
          const numbers = embeddingValue.match(/[\d.-]+/g);
          if (numbers && numbers.length > 0) {
            queryEmbedding = numbers.map(Number);
          } else {
            throw new Error('Could not parse embedding string');
          }
        }
      } else {
        // If it's a PostgreSQL vector type, convert it
        queryEmbedding = (embeddingValue as any).toArray?.() || Array.from(embeddingValue as any);
      }
      
      if (!Array.isArray(queryEmbedding) || queryEmbedding.length === 0) {
        console.error('[Find Similar] Invalid embedding format:', {
          type: typeof embeddingValue,
          value: typeof embeddingValue === 'string' ? embeddingValue.substring(0, 100) : embeddingValue,
        });
        throw new Error('Invalid embedding format');
      }
      
      // Validate embedding dimensions (should be 1536 for text-embedding-3-small)
      if (queryEmbedding.length !== 1536) {
        console.warn(`[Find Similar] Embedding has unexpected length: ${queryEmbedding.length}, expected 1536`);
      }
    } else if (searchText) {
      // Generate embedding from search text
      queryEmbedding = await generateEmbedding(searchText);
    } else {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    // Get fault data to determine generation_id if scope is 'generation'
    let generationId: string | null = null;
    if (scope === 'generation' && faultId) {
      const { data: fault } = await supabase
        .from('car_faults')
        .select('model_generation_id')
        .eq('id', faultId)
        .single();
      
      if (fault) {
        generationId = fault.model_generation_id;
      }
    }

    // Perform similarity search
    // Supabase vector type expects the array directly, not as a string
    let similarFaults;
    if (scope === 'global') {
      // Global search across all generations
      const { data, error } = await supabase.rpc(
        'match_car_faults_global',
        {
          query_embedding: queryEmbedding, // Pass array directly, not as string
          match_threshold: matchThreshold,
          match_count: matchCount,
          filter_language: language,
          exclude_fault_id: faultId || null,
        }
      );

      if (error) {
        console.error('Global similarity search error:', error);
        return NextResponse.json({ error: `Search failed: ${error.message}` }, { status: 500 });
      }

      similarFaults = (data || []).map((f: any) => ({
        ...f,
        similarity: typeof f.similarity === 'number' ? f.similarity : parseFloat(f.similarity || '0'),
      }));
    } else {
      // Generation-specific search
      if (!generationId) {
        return NextResponse.json({ 
          error: 'Generation ID required for generation-scoped search' 
        }, { status: 400 });
      }

      const { data, error } = await supabase.rpc(
        'match_car_faults',
        {
          query_embedding: queryEmbedding, // Pass array directly, not as string
          match_threshold: matchThreshold,
          match_count: matchCount,
          filter_generation_id: generationId,
          filter_language: language,
          exclude_fault_id: faultId || null,
        }
      );

      if (error) {
        console.error('Generation similarity search error:', error);
        return NextResponse.json({ error: `Search failed: ${error.message}` }, { status: 500 });
      }

      similarFaults = (data || []).map((f: any) => ({
        ...f,
        similarity: typeof f.similarity === 'number' ? f.similarity : parseFloat(f.similarity || '0'),
      }));
    }

    return NextResponse.json({
      success: true,
      scope,
      count: similarFaults.length,
      results: similarFaults,
    });
  } catch (error) {
    console.error('Find similar faults error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

