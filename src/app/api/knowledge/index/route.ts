import { NextResponse } from 'next/server';

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OpenAI API key is missing. Check .env.local.');
}

export async function POST(req: Request) {
  try {
    const { question } = await req.json();

    if (!question || typeof question !== 'string') {
      return NextResponse.json({ error: 'Question is required and must be a string' }, { status: 400 });
    }

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

    if (!gptRes.ok) {
      const errorText = await gptRes.text();
      return NextResponse.json({ error: `OpenAI API error: ${gptRes.status}` }, { status: 500 });
    }

    const gptData = await gptRes.json();
    const content = gptData.choices?.[0]?.message?.content;

    if (!content) {
      return NextResponse.json({ error: 'Failed to get content from OpenAI' }, { status: 500 });
    }

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch (parseError) {
      return NextResponse.json({ error: 'Failed to parse OpenAI response as JSON' }, { status: 500 });
    }

    return NextResponse.json(parsed);
  } catch (err) {
    const error = err as Error;
    return NextResponse.json({ error: error.message || 'Unknown error' }, { status: 500 });
  }
}
