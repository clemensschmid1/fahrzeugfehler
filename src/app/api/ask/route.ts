import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Typ für OpenAI Response
type OpenAIResponse = {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
};

// Supabase Client initialisieren
// console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
// console.log('Supabase Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Supabase environment variables are missing. Check .env.local.');
}

// Check for OpenAI API key
if (!process.env.OPENAI_API_KEY) {
  throw new Error('OpenAI API key is missing. Check .env.local.');
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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

const detectLanguage = async (text: string): Promise<string> => {
  const prompt = `Detect the language of the following text. Respond with only the ISO 639-1 language code (e.g., 'en' for English, 'de' for German):

Text: ${text}`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1
    })
  });

  const data = await response.json();
  const language = data.choices?.[0]?.message?.content?.trim().toLowerCase() || 'en';
  return language;
};

const generateHeader = async (question: string, language: string): Promise<string> => {
  const prompt = `Generate a concise, SEO-friendly header for the following question. The header should be in the same language as the question:

Question: ${question}
Language: ${language}

Respond with only the header text.`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.4
    })
  });

  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() || question;
};

export async function POST(req: Request) {
  try {
    const { question } = await req.json();

    // Detect language first
    const language = await detectLanguage(question);
    
    // Generate header in the detected language
    const header = await generateHeader(question, language);

    const prompt = `
You are a senior industrial field technician and technical documentation specialist with deep expertise in real-world troubleshooting, failure analysis, and industrial component behavior.

A user is asking a highly specific technical question related to industrial equipment, parts, or system behavior.

Your task is to write a **highly detailed**, **field-ready**, and **technically precise** answer for experienced technicians and engineers who need real guidance to understand, diagnose, and resolve the issue.

The answer must:
- Be factually accurate and **immediately applicable in a real-world scenario**
- Include **clear, step-by-step instructions**, precise **parameter references**, and common **misconfigurations**
- Mention **component behavior under stress**, typical **failure causes**, and **detection methods**
- Reference **known error codes**, software tools (e.g. MOVITOOLS, TIA Portal), or service procedures where applicable
- Include a **technical safety notice** where appropriate
- Use a clear, structured tone, like internal support documentation or service bulletins
- **Avoid repetition**, **generic phrasing**, and vague statements – speak as an expert would to a colleague in the field

Then:
1. Suggest a short, SEO-optimized slug (5–8 words, URL-friendly)
2. Identify the values for: manufacturer, part_type, part_series, sector, question_type, affected_components, error_code, complexity_level, related_processes
3. Suggest 3 related question slugs (based on probable search behavior or context)

Respond in valid JSON format:

{
  "answer": "...",
  "seo_slug": "...",
  "manufacturer": "...",
  "part_type": "...",
  "part_series": "...",
  "sector": "...",
  "related_slugs": ["...", "...", "..."],
  "question_type": "...",
  "affected_components": "...",
  "error_code": "...",
  "complexity_level": "...",
  "related_processes": "..."
}

Question: ${question}
Language: ${language}
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

    if (!openaiRes.ok) {
      throw new Error('Failed to get response from OpenAI');
    }

    const data = await openaiRes.json();
    const responseContent = data.choices[0]?.message?.content;
    
    if (!responseContent) {
      throw new Error('No response content from OpenAI');
    }

    // Clean the response content by removing control characters
    const cleanContent = responseContent.replace(/[\x00-\x1F\x7F-\x9F]/g, '');
    
    try {
      // Parse the JSON response
      const parsedResponse = JSON.parse(cleanContent);
      const { answer, seo_slug, manufacturer, part_type, part_series, sector, related_slugs, question_type,
        affected_components,
        error_code,
        complexity_level,
        related_processes, } = parsedResponse;

      // Generate embedding for the question
      const embedding = await generateEmbedding(question);

      // Insert the question into the database
      const { error: insertError } = await supabase.from('questions').insert({
        question,
        answer,
        slug: seo_slug,
        manufacturer,
        part_type,
        part_series,
        sector,
        related_slugs,
        question_type,
        affected_components,
        error_code,
        complexity_level,
        related_processes,
        language,
        language_path: language,
        header,
        embedding,
        status: 'draft'
      });

      if (insertError) {
        console.error('Error inserting question:', insertError);
        throw insertError;
      }

      // Create a stream for the answer content
      const stream = new ReadableStream({
        start(controller) {
          // Stream the answer content
          controller.enqueue(new TextEncoder().encode(answer));
          controller.close();
        }
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      });
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      console.error('Raw response:', responseContent);
      throw new Error('Failed to parse AI response');
    }
  } catch (error: any) {
    console.error('Error in POST /api/ask:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

