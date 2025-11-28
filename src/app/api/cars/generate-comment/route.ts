import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { targetType, targetTitle, language = 'en' } = await req.json();
    
    if (!targetType || !targetTitle) {
      return NextResponse.json({ error: 'Missing targetType or targetTitle' }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Missing OpenAI API key' }, { status: 500 });
    }

    // Generate natural, realistic comment (less corny, more authentic)
    const systemPrompt = language === 'de'
      ? `Du bist ein echter Autobesitzer, der einen kurzen, hilfreichen Kommentar zu einer Auto-Reparatur oder Wartungsanleitung schreibt.

WICHTIG:
- Schreibe wie ein echter Mensch, nicht wie ein Bot oder Marketing-Text
- Verwende normale, alltägliche Sprache
- Sei konkret und spezifisch, nicht generisch
- Vermeide übertriebene Begeisterung oder künstliche Freundlichkeit
- Keine Emojis, keine Ausrufezeichen am Ende
- 1-3 Sätze, maximal 80 Wörter
- Wenn du eine Erfahrung teilst, mache sie realistisch und glaubwürdig

Schreibe NUR den Kommentar, keine Anführungszeichen, keine Erklärungen.`
      : `You are a real car owner writing a short, helpful comment on a car repair or maintenance guide.

IMPORTANT:
- Write like a real person, not like a bot or marketing copy
- Use normal, everyday language
- Be specific and concrete, not generic
- Avoid excessive enthusiasm or fake friendliness
- No emojis, no exclamation marks at the end
- 1-3 sentences, max 80 words
- If sharing an experience, make it realistic and believable

Write ONLY the comment, no quotes, no explanations.`;

    const userPrompt = targetType === 'fault'
      ? language === 'de'
        ? `Schreibe einen kurzen, realistischen Kommentar zu diesem Problem: "${targetTitle}". Sei spezifisch und natürlich.`
        : `Write a short, realistic comment about this problem: "${targetTitle}". Be specific and natural.`
      : language === 'de'
        ? `Schreibe einen kurzen, realistischen Kommentar zu dieser Anleitung: "${targetTitle}". Sei spezifisch und natürlich.`
        : `Write a short, realistic comment about this guide: "${targetTitle}". Be specific and natural.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // More cost-effective, still high quality
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7, // Balanced for natural but consistent output
        max_tokens: 120, // Shorter comments are more realistic
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({ error: `OpenAI API error: ${errorText}` }, { status: 500 });
    }

    const data = await response.json();
    const comment = data.choices?.[0]?.message?.content?.trim() || '';

    if (!comment) {
      return NextResponse.json({ error: 'No comment generated' }, { status: 500 });
    }

    // Clean up the comment (remove quotes if present)
    const cleanComment = comment.replace(/^["']|["']$/g, '').trim();

    return NextResponse.json({ comment: cleanComment });
  } catch (error) {
    console.error('Error generating comment:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

