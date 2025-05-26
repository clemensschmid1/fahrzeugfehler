import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: Request) {
  const { question } = await req.json();

  const prompt = `
You are an industrial support assistant. A user asks an industrial question.

Your job is to:
1. Answer the question clearly.
2. Suggest an SEO slug (5–8 words, URL-friendly).
3. Identify the manufacturer, part_type, part_series, sector.
4. Suggest 3 related question slugs.

Respond in JSON format:

{
  "answer": "...",
  "seo_slug": "...",
  "manufacturer": "...",
  "part_type": "...",
  "part_series": "...",
  "sector": "...",
  "related_slugs": ["...", "...", "..."]
}

Question: ${question}
`;

  const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.4
    })
  });

  const openaiData = await openaiRes.json();
  const text = openaiData.choices?.[0]?.message?.content;

  if (!text) return NextResponse.json({ error: 'No response from GPT' }, { status: 500 });

  const parsed = JSON.parse(text);

  const { error } = await supabase.from('questions').insert({
    question,
    answer: parsed.answer,
    slug: parsed.seo_slug,
    manufacturer: parsed.manufacturer,
    part_type: parsed.part_type,
    part_series: parsed.part_series,
    sector: parsed.sector,
    related_slugs: parsed.related_slugs
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
