import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase environment variables');
}
if (!process.env.OPENAI_API_KEY) {
  throw new Error('OpenAI API key is missing. Check .env.local.');
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Minimal embedding generation
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
      throw new Error('Failed to generate embedding from OpenAI');
    }

    const openaiData = await openaiRes.json();
    return openaiData.data[0].embedding;
  } catch (error) {
    throw error;
  }
}

export async function POST(req: Request) {
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: 'Missing question id' }, { status: 400 });

    // Add a small delay to ensure the insert transaction is committed
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const { data: questionRow, error: fetchError } = await supabase
      .from('questions2')
      .select('id, question, answer')
      .eq('id', id)
      .single();
    
    if (fetchError) {
      console.error('[generate-metadata] Error fetching question:', fetchError);
      return NextResponse.json({ 
        error: 'Question not found', 
        details: fetchError.message,
        code: fetchError.code 
      }, { status: 404 });
    }
    
    if (!questionRow) {
      console.error('[generate-metadata] Question not found for id:', id);
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    const { question, answer } = questionRow;

    // Generate embedding
    const embedding = await generateEmbedding(`${question} ${answer}`);

    // Generate metadata with all fields (emphasize most important fields)
    const prompt = `Generate metadata for the following technical question and answer.  
Return **ONLY valid JSON** (no markdown, no code blocks, no explanations, no extra text).

**The following fields are REQUIRED and must ALWAYS be filled with the best possible value (never null or empty):**
- content_score (integer 1–10)
- expertise_score (integer 1–10)
- helpfulness_score (integer 1–10)
- seo_slug (URL-friendly, 5–8 words, unique for this question)
- header (short, clear, human-readable)
- meta_description (1–2 sentences, no markdown)

**The following fields are STRONGLY PREFERRED and should be filled if possible, otherwise use null:**
- manufacturer
- part_type
- part_series
- sector
- error_code
- question_type
- confidentiality_flag (boolean, TRUE or FALSE)
- complexity_level

**For all fields:**
- Do not omit any fields; always include all fields in the output.
- Use concise values or lists, not full sentences (except meta_description).
- Do not include markdown, code blocks, or any text before or after the JSON.

**Example structure:**
{
  "content_score": 9,
  "expertise_score": 8,
  "helpfulness_score": 9,
  "seo_slug": "causes-of-signal-loss-ifm-sensors",
  "header": "Causes of Signal Loss in IFM Sensors",
  "meta_description": "Explore the technical factors contributing to signal loss in IFM sensors, including target material, sensing distance, alignment, and environmental factors.",
  "manufacturer": "IFM",
  "part_type": "Sensor",
  "part_series": "OG Series",
  "sector": "Industrial Automation",
  "error_code": null,
  "question_type": "Troubleshooting",
  "confidentiality_flag": false,
  "complexity_level": "Intermediate"
}`;

    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo', // Faster model
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.35,
        max_tokens: 1000 // Increased to prevent truncation
      })
    });

    if (!openaiRes.ok) throw new Error('Failed to get response from OpenAI');
    const data = await openaiRes.json();
    const content = data.choices?.[0]?.message?.content?.trim();
    if (!content) throw new Error('No metadata from OpenAI');

    const cleaned = content.replace(/```json|```/g, '').trim();
    let metadata: Record<string, unknown>;
    try {
      metadata = extractFirstJson(cleaned);
      // Post-processing: trim, limit arrays, ensure types
      const arrayFields = [
        'related_slugs', 'affected_components', 'application_area', 'relevant_standards',
        'communication_protocols', 'manufacturer_mentions', 'risk_keywords', 'tools_involved', 'related_processes'
      ];
      for (const key of Object.keys(metadata)) {
        if (typeof metadata[key] === 'string') {
          metadata[key] = metadata[key].trim();
          if (metadata[key] === '') metadata[key] = null;
        }
        if (arrayFields.includes(key)) {
          if (typeof metadata[key] === 'string') {
            // Convert comma-separated string to array
            metadata[key] = metadata[key].split(',').map(s => s.trim()).filter(Boolean);
          }
          if (!Array.isArray(metadata[key])) metadata[key] = [];
          // Limit to 2 entries
          if (Array.isArray(metadata[key])) metadata[key] = (metadata[key] as unknown[]).slice(0, 2);
          if (Array.isArray(metadata[key]) && metadata[key].length === 0) metadata[key] = [];
        }
        if (typeof metadata[key] === 'boolean') {
          // already correct
        }
        if (metadata[key] === undefined) metadata[key] = null;
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error('[generate-metadata] JSON parse error. Raw response:', cleaned, err.message);
        return NextResponse.json({ error: err.message, raw: cleaned }, { status: 500 });
      }
      if (typeof err === 'string') {
        console.error('[generate-metadata] JSON parse error. Raw response:', cleaned, err);
        return NextResponse.json({ error: err, raw: cleaned }, { status: 500 });
      }
      const errorMsg = String(err);
      console.error('[generate-metadata] JSON parse error. Raw response:', cleaned, errorMsg);
      return NextResponse.json({ error: errorMsg, raw: cleaned }, { status: 500 });
    }

    // Fallback: ensure slug is always present
    if (!metadata.seo_slug || typeof metadata.seo_slug !== 'string' || !metadata.seo_slug.trim()) {
      metadata.seo_slug =
        question.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').substring(0, 60) ||
        'question-' + id.substring(0, 8);
    }

    // Map all fields to DB columns, fallback to null/default if missing
    const defaultMetadata = {
      manufacturer: metadata.manufacturer ?? null,
      part_type: metadata.part_type ?? null,
      part_series: metadata.part_series ?? null,
      sector: metadata.sector ?? null,
      related_slugs: metadata.related_slugs ?? null,
      question_type: metadata.question_type ?? null,
      affected_components: metadata.affected_components ?? null,
      error_code: metadata.error_code ?? null,
      complexity_level: metadata.complexity_level ?? null,
      related_processes: metadata.related_processes ?? null,
      confidentiality_flag: metadata.confidentiality_flag ?? false,
      parent_id: metadata.parent_id ?? null,
      voltage: metadata.voltage ?? null,
      current: metadata.current ?? null,
      power_rating: metadata.power_rating ?? null,
      machine_type: metadata.machine_type ?? null,
      application_area: metadata.application_area ?? null,
      product_category: metadata.product_category ?? null,
      electrical_type: metadata.electrical_type ?? null,
      control_type: metadata.control_type ?? null,
      relevant_standards: metadata.relevant_standards ?? null,
      mounting_type: metadata.mounting_type ?? null,
      cooling_method: metadata.cooling_method ?? null,
      communication_protocols: metadata.communication_protocols ?? null,
      manufacturer_mentions: metadata.manufacturer_mentions ?? null,
      risk_keywords: metadata.risk_keywords ?? null,
      tools_involved: metadata.tools_involved ?? null,
      installation_context: metadata.installation_context ?? null,
      sensor_type: metadata.sensor_type ?? null,
      mechanical_component: metadata.mechanical_component ?? null,
      industry_tag: metadata.industry_tag ?? null,
      maintenance_relevance: metadata.maintenance_relevance ?? false,
      failure_mode: metadata.failure_mode ?? null,
      software_context: metadata.software_context ?? null,
      seo_score: metadata.seo_score ?? null,
      content_score: metadata.content_score ?? null,
      expertise_score: metadata.expertise_score ?? null,
      helpfulness_score: metadata.helpfulness_score ?? null,
      header: metadata.header ?? null,
      meta_description: metadata.meta_description ?? null,
      status: metadata.status ?? 'live',
      language: metadata.language ?? 'en',
      seo_slug: metadata.seo_slug,
    };

    // Ensure slug is unique (simplified)
    let uniqueSlug = defaultMetadata.seo_slug;
    let counter = 1;
    while (counter <= 5) { // Limit retries
      const { data: existing } = await supabase
        .from('questions2')
        .select('id')
        .eq('slug', uniqueSlug)
        .neq('id', id)
        .maybeSingle();
      if (!existing) break;
      uniqueSlug = `${defaultMetadata.seo_slug}-${counter}`;
      counter++;
    }
    defaultMetadata.seo_slug = uniqueSlug;

    // Update the question with metadata and embedding
    const { error: updateError } = await supabase
      .from('questions2')
      .update({
        ...defaultMetadata,
        slug: defaultMetadata.seo_slug,
        embedding,
        meta_generated: true,
        last_updated: new Date().toISOString()
      })
      .eq('id', id);

    if (updateError) {
      throw new Error('Failed to update question with metadata');
    }

    return NextResponse.json({ 
      success: true, 
      metadata: defaultMetadata
    });

  } catch (error) {
    let errorMsg = 'Unknown error';
    if (error instanceof Error) {
      errorMsg = error.message;
    } else if (typeof error === 'string') {
      errorMsg = error;
    } else {
      errorMsg = String(error);
    }
    console.error('[generate-metadata] Error:', errorMsg);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

// Utility: Extract first valid JSON object from a string
function extractFirstJson(str: string): Record<string, unknown> {
  // Find the first {...} block
  const firstBrace = str.indexOf('{');
  if (firstBrace === -1) throw new Error('No opening brace found');
  let depth = 0;
  let end = -1;
  for (let i = firstBrace; i < str.length; i++) {
    if (str[i] === '{') depth++;
    if (str[i] === '}') depth--;
    if (depth === 0) {
      end = i + 1;
      break;
    }
  }
  if (end === -1) throw new Error('No closing brace found');
  const jsonStr = str.slice(firstBrace, end);
  return JSON.parse(jsonStr);
}
