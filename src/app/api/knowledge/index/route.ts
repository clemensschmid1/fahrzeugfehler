import { NextResponse } from 'next/server';

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
    const content = gptData.choices?.[0]?.message?.content;

    if (!content) {
      return NextResponse.json({ error: 'Failed to get content from OpenAI' }, { status: 500 });
    }

    const parsed = JSON.parse(content);

    return NextResponse.json(parsed);
  } catch (err) {
    const error = err as Error;
    return NextResponse.json({ error: error.message || 'Unknown error' }, { status: 500 });
  }
}
