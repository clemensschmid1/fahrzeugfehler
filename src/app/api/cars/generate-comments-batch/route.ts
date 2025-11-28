import { NextResponse } from 'next/server';

// Batch generate multiple comments in one API call to reduce costs and improve efficiency
export async function POST(req: Request) {
  try {
    const { requests } = await req.json();
    
    if (!Array.isArray(requests) || requests.length === 0) {
      return NextResponse.json({ error: 'Requests array is required' }, { status: 400 });
    }

    if (requests.length > 20) {
      return NextResponse.json({ error: 'Maximum 20 comments per batch' }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Missing OpenAI API key' }, { status: 500 });
    }

    // Generate all comments in parallel (still individual calls but in parallel for speed)
    // Note: OpenAI doesn't have a true batch API for chat completions, so we parallelize
    const commentPromises = requests.map(async (req: { targetType: string; targetTitle: string; language?: string }) => {
      const { targetType, targetTitle, language = 'en' } = req;

      const systemPrompt = language === 'de'
        ? `Du bist ein echter Autobesitzer, der einen kurzen, hilfreichen Kommentar zu einer Auto-Reparatur oder Wartungsanleitung schreibt. Schreibe wie ein echter Mensch, nicht wie ein Bot. 1-3 Sätze, maximal 80 Wörter. Keine Emojis, keine übertriebene Begeisterung. Schreibe NUR den Kommentar, keine Anführungszeichen.`
        : `You are a real car owner writing a short, helpful comment on a car repair or maintenance guide. Write like a real person, not a bot. 1-3 sentences, max 80 words. No emojis, no excessive enthusiasm. Write ONLY the comment, no quotes.`;

      const userPrompt = targetType === 'fault'
        ? language === 'de'
          ? `Schreibe einen kurzen, realistischen Kommentar zu diesem Problem: "${targetTitle}".`
          : `Write a short, realistic comment about this problem: "${targetTitle}".`
        : language === 'de'
          ? `Schreibe einen kurzen, realistischen Kommentar zu dieser Anleitung: "${targetTitle}".`
          : `Write a short, realistic comment about this guide: "${targetTitle}".`;

      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt }
            ],
            temperature: 0.7,
            max_tokens: 120,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          return { error: `OpenAI API error: ${errorText}` };
        }

        const data = await response.json();
        const comment = data.choices?.[0]?.message?.content?.trim() || '';

        if (!comment) {
          return { error: 'No comment generated' };
        }

        // Clean up the comment
        const cleanComment = comment.replace(/^["']|["']$/g, '').trim();
        return { comment: cleanComment };
      } catch (error) {
        return { error: error instanceof Error ? error.message : 'Unknown error' };
      }
    });

    const results = await Promise.all(commentPromises);

    return NextResponse.json({ comments: results });
  } catch (error) {
    console.error('Error generating comments batch:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

