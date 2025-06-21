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
  seo_score: integer from 1 to 99 (Evaluate how well the question and answer are optimized for technical search intent within industrial automation. Consider keyword usage, relevance to real problems, structure, and clarity. Penalize off-topic or generic content.),
  header: string,
  status: string,
  parent_id: string | null,
  meta_description: string (max 155 characters, high-CTR industrial tone),
  content_score: integer from 1 to 99 (Evaluate how detailed, technically accurate, and practically relevant the content is. High scores require clear, step-by-step solutions or structured analysis of industrial systems, components, or processes.),
  expertise_score: integer from 1 to 99 (Evaluate the demonstrated technical depth, use of precise terminology, and understanding of industry-level challenges. Penalize vague, consumer-level, or non-technical explanations.),
  helpfulness_score: integer from 1 to 99 (Evaluate how actionable and technically useful the answer is for engineers, technicians, or maintenance specialists in real-world industrial scenarios. Answers should solve a concrete technical issue or clearly guide through a troubleshooting or configuration task.)
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
    // eslint-disable-next-line prefer-const
    let metadata = JSON.parse(cleaned);

    // Quality score thresholds
    const SCORE_THRESHOLDS = {
      seo_score: 50,
      content_score: 70,
      expertise_score: 60,
      helpfulness_score: 40
    };

    // Check if any score is below threshold and set status accordingly
    const failedScores = [];
    for (const [scoreField, threshold] of Object.entries(SCORE_THRESHOLDS)) {
      const score = metadata[scoreField];
      if (score !== null && score !== undefined && score < threshold) {
        failedScores.push(`${scoreField}: ${score} < ${threshold}`);
      }
    }

    if (failedScores.length > 0) {
      console.log('[generate-metadata] Quality check failed:', failedScores.join(', '));
      metadata.status = 'bin';
    } else {
      metadata.status = 'live';
    }

    const allFields = [
      'seo_slug', 'manufacturer', 'part_type', 'part_series', 'sector', 'related_slugs', 'question_type',
      'affected_components', 'error_code', 'complexity_level', 'related_processes', 'confidentiality_flag',
      'seo_score', 'header', 'status', 'parent_id', 'meta_description',
      'content_score', 'expertise_score', 'helpfulness_score',
    ];
    for (const field of allFields) {
      if (!(field in metadata)) metadata[field] = null;
    }

    // Ensure slug is unique
    // eslint-disable-next-line prefer-const
    let baseSlug = metadata.seo_slug || null;
    let uniqueSlug = baseSlug;
    if (uniqueSlug) {
      let counter = 1;
      while (true) {
        const { data: existing, error: slugError } = await supabase
          .from('questions')
          .select('id')
          .eq('slug', uniqueSlug)
          .neq('id', id)
          .maybeSingle();
        if (slugError) throw slugError;
        if (!existing) break;
        uniqueSlug = `${baseSlug}${counter}`;
        counter++;
      }
    }
    metadata.slug = uniqueSlug;
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
    console.log('[generate-metadata] content_score:', metadata.content_score);
    console.log('[generate-metadata] expertise_score:', metadata.expertise_score);
    console.log('[generate-metadata] helpfulness_score:', metadata.helpfulness_score);
    console.log('[generate-metadata] final_status:', metadata.status);
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
  } catch (error) {
    const err = error as Error;
    console.log('[generate-metadata] Caught error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
