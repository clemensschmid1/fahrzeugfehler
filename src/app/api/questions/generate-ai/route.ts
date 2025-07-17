import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const { prompt, count = 20, language = 'en', model = 'gpt-4o' } = await req.json();
    if (!prompt || typeof prompt !== 'string') {
      return new NextResponse('Missing or invalid prompt', { status: 400 });
    }
    const apiKey = process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY;
    if (!apiKey) {
      return new NextResponse('Missing OpenAI API key', { status: 500 });
    }
    const systemPrompt =
      language === 'de'
        ? `Du bist ein Experte für technische Wissensdatenbanken. Generiere ${count} hochwertige, einzigartige, präzise, technische Fragen zum Thema: "${prompt}". Gib nur die Fragen aus, eine pro Zeile, mit normalen Leerzeichen und korrekter Formatierung. Keine Nummerierung, keine Antworten, keine Wiederholungen, keine Einleitung, keine doppelten Fragen. Schreibe normale, lesbare Sätze.`
        : `You are an expert in technical knowledge bases. Generate ${count} high-quality, unique, precise, technical questions about: "${prompt}". Output only the questions, one per line, with proper spacing and normal sentence formatting. No numbering, no answers, no introduction, no duplicates. Write normal, readable sentences with proper spaces between words.`;
    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
        ],
        temperature: 0.7,
        max_tokens: 3000,
      }),
    });
    if (!openaiRes.ok) {
      const err = await openaiRes.text();
      return new NextResponse('OpenAI error: ' + err, { status: 500 });
    }
    const data = await openaiRes.json();
    const content = data.choices?.[0]?.message?.content?.trim();
    if (!content) {
      return new NextResponse('No questions generated', { status: 500 });
    }
    
    // Log the raw AI output for debugging
    console.log('=== AI Question Generation Debug ===');
    console.log('Prompt:', prompt);
    console.log('Language:', language);
    console.log('Count requested:', count);
    console.log('Model used:', model);
    console.log('Raw AI output:');
    console.log(content);
    console.log('=== End Raw AI Output ===');
    
    // Split into lines and remove blank lines only
    const lines = content
      .split('\n')
      .map((line: string) => line.trim())
      .filter((line: string) => line.length > 0);
    
    console.log('=== Generation Results ===');
    console.log(`Total questions generated: ${lines.length}`);
    console.log('=== End Generation Results ===');
    
    // Return questions directly without database operations
    const responseData = {
      questions: lines.join('\n'),
    };
    
    return new NextResponse(JSON.stringify(responseData), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'x-ai-model-used': model,
      },
    });
  } catch (err: unknown) {
    if (err instanceof Error) {
    return new NextResponse('Server error: ' + err.message, { status: 500 });
    }
    return new NextResponse('Server error: An unknown error occurred', { status: 500 });
  }
} 