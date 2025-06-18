import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Supabase environment variables are missing. Check .env.local.');
}
if (!process.env.OPENAI_API_KEY) {
  throw new Error('OpenAI API key is missing. Check .env.local.');
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Helper to detect language
async function detectLanguage(text: string) {
  const prompt = `Detect the language of the following text. Respond ONLY with 'en' or 'de' based on the ISO 639-1 code:\n\nText:\n${text}`;
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini-2024-07-18',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1
    })
  });
  const data = await response.json();
  const lang = data.choices?.[0]?.message?.content?.trim().toLowerCase();
  return lang === 'de' ? 'de' : 'en';
}

// Function to generate embedding
async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const openaiRes = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'text-embedding-ada-002',
        input: text,
      })
    });

    if (!openaiRes.ok) {
      const errorBody = await openaiRes.json();
      console.error('OpenAI Embedding API error:', errorBody);
      throw new Error('Failed to generate embedding from OpenAI');
    }

    const openaiData = await openaiRes.json();
    return openaiData.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
}

export async function POST(req: Request) {
  try {
    const { id } = await req.json();
    console.log('[generate-metadata] Received ID:', id);
    if (!id) return NextResponse.json({ error: 'Missing question id' }, { status: 400 });

    const { data: questionRow, error: fetchError } = await supabase
      .from('questions')
      .select('id, question, answer')
      .eq('id', id)
      .single();
    if (fetchError || !questionRow) {
      console.log('[generate-metadata] Question not found for ID:', id);
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    const { question, answer } = questionRow;

    const language = await detectLanguage(`${question} ${answer}`);
    const embedding = await generateEmbedding(`${question} ${answer}`);

    const prompt = `Given the following question and answer, generate ONLY the metadata fields for a technical knowledge base. Respond ONLY with valid JSON.

Question: ${question}

Answer: ${answer}

Return this JSON:
{
  seo_slug: string,
  manufacturer: string | null,
  part_type: string | null,
  part_series: string | null,
  sector: string | null,
  related_slugs: string[] | null,
  question_type: string | null,
  affected_components: string[] | null,
  error_code: string | null,
  complexity_level: string | null,
  related_processes: string[] | null,
  confidentiality_flag: boolean,
  seo_score: number (from 1 to 99 based on the estimated seo score of the question and answer. 99 is a completely perfect text for having a high page ranking.),
  header: string,
  status: string,
  parent_id: string | null,
  meta_description: string (max 155 characters, high-CTR industrial tone)
}`;

    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini-2024-07-18',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.4
      })
    });

    if (!openaiRes.ok) throw new Error('Failed to get response from OpenAI');
    const data = await openaiRes.json();
    const content = data.choices?.[0]?.message?.content?.trim();
    if (!content) throw new Error('No metadata from OpenAI');

    const cleaned = content.replace(/```json|```/g, '').trim();
    let metadata = JSON.parse(cleaned);

    metadata.status = 'live';

    const allFields = [
      'seo_slug', 'manufacturer', 'part_type', 'part_series', 'sector', 'related_slugs', 'question_type',
      'affected_components', 'error_code', 'complexity_level', 'related_processes', 'confidentiality_flag',
      'seo_score', 'header', 'status', 'parent_id', 'meta_description'
    ];
    for (const field of allFields) {
      if (!(field in metadata)) metadata[field] = null;
    }

    metadata.slug = metadata.seo_slug || null;
    delete metadata.seo_slug;

    metadata.language = language;
    metadata.language_path = language;

    if (typeof metadata.parent_id !== 'string' || !/^[0-9a-fA-F-]{36}$/.test(metadata.parent_id)) {
      metadata.parent_id = null;
    }

    if (metadata.meta_description && metadata.meta_description.length > 155) {
      metadata.meta_description = metadata.meta_description.substring(0, 155).trim();
    }

    console.log('[generate-metadata] language:', language);
    console.log('[generate-metadata] seo_score:', metadata.seo_score);
    console.log('[generate-metadata] metadata:', { ...metadata, embedding: 'generated' });

    const { error: updateError } = await supabase.from('questions').update({
      ...metadata,
      embedding,
      meta_generated: true
    }).eq('id', id);
    if (updateError) {
      console.log('[generate-metadata] Update error:', updateError);
      throw updateError;
    }

    return NextResponse.json({ success: true, metadata: { ...metadata, embedding: 'generated' } });
  } catch (error: any) {
    console.log('[generate-metadata] Caught error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
