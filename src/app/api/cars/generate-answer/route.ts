import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const { question, language, brand, model, generation } = await req.json();
    
    if (!question) {
      return NextResponse.json({ error: 'Missing question' }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Missing OpenAI API key' }, { status: 500 });
    }

    // Build context-aware prompt
    const context = brand && model && generation 
      ? `You are an expert automotive technician. This question is about ${brand} ${model} ${generation}. `
      : brand && model
      ? `You are an expert automotive technician. This question is about ${brand} ${model}. `
      : 'You are an expert automotive technician. ';

    const systemPrompt = `You are an expert automotive technician and repair specialist. Provide detailed, step-by-step solutions for car problems and maintenance procedures.

Your answers MUST include:
- Detailed step-by-step instructions
- Specific symptoms the user might experience (e.g., "Check engine light", "Rough idle", "Loss of power")
- Diagnostic steps to identify the problem (e.g., "Scan for error codes", "Check fluid levels", "Inspect components")
- Specific tools required (e.g., "OBD-II scanner", "Multimeter", "Socket set", "Torque wrench")
- Parts/components that may need replacement
- Estimated time for the repair/maintenance
- Safety warnings if applicable

Be technically accurate, specific, and practical. Use proper automotive terminology.
Do not mention AI, do not refer to yourself, and do not simulate a human persona.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: context + question }
        ],
        temperature: 0.3,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({ error: `OpenAI error: ${errorText}` }, { status: 500 });
    }

    const data = await response.json();
    const answer = data.choices?.[0]?.message?.content?.trim();
    
    if (!answer) {
      return NextResponse.json({ error: 'No answer generated' }, { status: 500 });
    }

    return NextResponse.json({ answer });
  } catch (error) {
    console.error('Answer generation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

