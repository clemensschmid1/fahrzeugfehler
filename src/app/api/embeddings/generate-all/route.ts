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

export async function POST(req: Request) {
  try {
    const { batchSize = 50, offset = 0, language = null } = await req.json();
    
    const supabase = getSupabaseClient();
    const apiKey = getOpenAIApiKey();

    // Fetch faults that don't have embeddings yet
    // First, get all fault IDs that already have embeddings
    const { data: existingEmbeddings } = await supabase
      .from('car_fault_embeddings')
      .select('car_fault_id');
    
    const existingIds = existingEmbeddings?.map(e => e.car_fault_id) || [];
    
    // Build query for faults without embeddings
    let query = supabase
      .from('car_faults')
      .select('id, title, description')
      .eq('status', 'live');
    
    if (existingIds.length > 0) {
      query = query.not('id', 'in', `(${existingIds.map(id => `"${id}"`).join(',')})`);
    }

    if (language) {
      query = query.eq('language_path', language);
    }

    const { data: faults, error: fetchError } = await query
      .range(offset, offset + batchSize - 1)
      .order('created_at', { ascending: true });

    if (fetchError) {
      console.error('Error fetching faults:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch faults' }, { status: 500 });
    }

    if (!faults || faults.length === 0) {
      return NextResponse.json({
        success: true,
        processed: 0,
        message: 'No more faults to process',
      });
    }

    const results = [];
    let successCount = 0;
    let failureCount = 0;

    // Process faults in smaller batches to avoid rate limits
    for (const fault of faults) {
      try {
        // Check if embedding already exists
        const { data: existingEmbedding } = await supabase
          .from('car_fault_embeddings')
          .select('id')
          .eq('car_fault_id', fault.id)
          .single();

        // Prepare text content for embedding (title + description)
        const textContent = `${fault.title}${fault.description ? ` ${fault.description}` : ''}`.trim();

        if (!textContent) {
          results.push({ faultId: fault.id, success: false, error: 'No text content to embed' });
          failureCount++;
          continue;
        }

        // Generate embedding
        const embedding = await generateEmbedding(textContent);

        // Save or update embedding
        if (existingEmbedding) {
          const { error: updateError } = await supabase
            .from('car_fault_embeddings')
            .update({
              embedding: embedding, // Pass array directly for pgvector
              text_content: textContent,
              updated_at: new Date().toISOString(),
            })
            .eq('car_fault_id', fault.id);

          if (updateError) {
            results.push({ faultId: fault.id, success: false, error: updateError.message });
            failureCount++;
            continue;
          }
        } else {
          const { error: insertError } = await supabase
            .from('car_fault_embeddings')
            .insert({
              car_fault_id: fault.id,
              embedding: embedding, // Pass array directly for pgvector
              text_content: textContent,
            });

          if (insertError) {
            results.push({ faultId: fault.id, success: false, error: insertError.message });
            failureCount++;
            continue;
          }
        }

        results.push({ faultId: fault.id, success: true });
        successCount++;

        // Rate limiting: small delay between embeddings
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        results.push({
          faultId: fault.id,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        failureCount++;
      }
    }

    return NextResponse.json({
      success: true,
      processed: faults.length,
      successful: successCount,
      failed: failureCount,
      results,
      nextOffset: offset + faults.length,
      hasMore: faults.length === batchSize,
    });
  } catch (error) {
    console.error('Generate all embeddings error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

