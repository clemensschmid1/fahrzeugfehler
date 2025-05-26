import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: Request) {
  try {
    const { question } = await req.json();

    const prompt = `
You are an industrial assistant. For the following question, provide:
- a detailed answer,
- an SEO slug (5–8 URL-friendly words),
- the manufacturer,
- part type,
- part series,
- sector,
- 3 related question slugs.

Return only JSON with keys: answer, seo_slug, manufacturer, part_type, part_series, sector, related_slugs[].

Question: ${question}
`;

    const gptRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.4,
      }),
    });

    const gptData = await gptRes.json();
    const parsed = JSON.parse(gptData.choices?.[0]?.message?.content || '{}');

    const { error } = await supabase.from('questions').insert({
      question,
      answer: parsed.answer,
      slug: parsed.seo_slug,
      manufacturer: parsed.manufacturer,
      part_type: parsed.part_type,
      part_series: parsed.part_series,
      sector: parsed.sector,
      related_slugs: parsed.related_slugs,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Unknown error' }, { status: 500 });
  }
}
