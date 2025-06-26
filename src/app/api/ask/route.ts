import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkRateLimit } from '@/lib/ratelimiter';
import { sanitizeAnswer } from '@/lib/sanitize';
import { isOutputUnsafe } from '@/lib/safety';
import { checkGeoblock } from '@/lib/geoblock';
import { ReadableStream } from 'web-streams-polyfill/ponyfill';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Supabase environment variables are missing. Check .env.local.');
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OpenAI API key is missing. Check .env.local.');
}

// Multi-language prompt injection filter
const BANNED_PHRASES = [
  // ENGLISH
  "ignore previous",
  "disregard previous instructions",
  "pretend to be",
  "you are now",
  "forget all instructions",
  "override your rules",
  "jailbreak",
  "bypass filter",
  "as an ai",
  "you must obey",
  "you were told",
  "system prompt",
  "inner monologue",
  "act as",
  // GERMAN
  "vergiss alle anweisungen",
  "tu so als ob",
  "du bist jetzt",
  "handle als",
  "umgehe die filter",
  "du musst antworten",
  "ignoriere vorherige",
  "systemanweisung",
  // SPANISH
  "olvida todas las instrucciones",
  "ignora lo anterior",
  "actúa como",
  "eres ahora",
  "burlar el filtro",
  "debes obedecer",
  "prompt del sistema",
  // FRENCH
  "oublie toutes les instructions",
  "ignore les instructions précédentes",
  "fais semblant d'être",
  "tu es maintenant",
  "contourne le filtre",
  "tu dois obéir",
  "invite système"
];

function containsBannedPhrase(input: string): boolean {
  const lower = input.toLowerCase();
  return BANNED_PHRASES.some(phrase => lower.includes(phrase));
}

async function streamOpenAIGPT4Answer(question: string, conversationContext?: Array<{ role: string; content: string }>) {
  let messages: Array<{ role: string; content: string }> = [];
  if (conversationContext && conversationContext.length > 0) {
    messages = [...conversationContext];
  }
  messages.push({
    role: 'user',
    content: `You are an expert-level intelligence system and technician writing for a technical knowledge base.\n\nYour main purpose is to perfectly answer any question. You should act professional and also handle more general questions incredibly well.\nYour **technical depth** is very important. You are made to use your full potential to be as helpful as possible.\nYour answers should reflect a *deep level of understanding* of problems. Do not mention AI, do not refer to yourself, and do not simulate a human persona.\n\nYour primary goal: deliver **highly helpful** answers that go significantly beyond surface-level help.\n\n### Critical rules:\n- Do **not** make up facts\n- Acknowledge uncertainty when needed\n- Always answer *concretely*\n- Do **not** add fluff like "I hope this helps" or "please let me know"\n- Never reference yourself or say "I"\n- Use **concise, precise, unambiguous** language\n- Do not generalize — give **hard technical answers**, not vague suggestions\n\nThe target audience is a highly competent individual looking for exact answers under time pressure. Focus on **explanation and resolution** with *real data, concrete steps, and edge-case insight*.\n\nQuestion: ${question}`
  });
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4.1-2025-04-14',
      messages,
      max_tokens: 1500,
      temperature: 0.35,
      stream: true,
    }),
  });
  if (!response.body) throw new Error('No response body from OpenAI');
  // Log headers for debugging
  console.log('[OpenAI API Streaming Headers]', JSON.stringify(Object.fromEntries(response.headers.entries())));
  return response.body;
}

async function getOpenAIGPT4Answer(question: string, conversationContext?: Array<{ role: string; content: string }>): Promise<string> {
  let messages: Array<{ role: string; content: string }> = [];
  if (conversationContext && conversationContext.length > 0) {
    messages = [...conversationContext];
  }
  messages.push({
    role: 'user',
    content: `Your main purpose is to perfectly answer any question. You should act professional and also handle more general questions incredibly well.\n          Your **technical depth** is very important. You are made to use your full potential to be as helpful as possible.\nYour answers should reflect a *deep level of understanding* of problems. Do not mention AI, do not refer to yourself, and do not simulate a human persona.\n\nYour primary goal: deliver **highly helpful** answers that go significantly beyond surface-level help.\n\n\n\n### Critical rules:\n- Do **not** make up facts\n- Acknowledge uncertainty when needed\n- Always answer *concretely*\n- Do **not** add fluff like "I hope this helps" or "please let me know"\n- Never reference yourself or say "I"\n- Use **concise, precise, unambiguous** language\n- Do not generalize — give **hard technical answers**, not vague suggestions\n\nThe target audience is a highly competent individual looking for exact answers under time pressure. Focus on **explanation and resolution** with *real data, concrete steps, and edge-case insight*.\n*.\n\nQuestion: ${question}`
  });
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4.1-2025-04-14',
      messages,
      max_tokens: 1500,
      temperature: 0.35,
      stream: false,
    }),
  });
  const data = await response.json();
  console.log('[OpenAI API Response]', JSON.stringify(data));
  if (data.error) {
    throw new Error(data.error.message || 'OpenAI API error');
  }
  return data.choices?.[0]?.message?.content?.trim() || "";
}

function checkMinSubmitDelta(delta: number | undefined, minMs = 3000) {
  if (typeof delta !== 'number' || delta < minMs) {
    return false;
  }
  return true;
}

export async function POST(req: Request) {
  console.log('--- POST /api/ask ---');
  try {
    // Check if this is a bulk import request
    const isBulkImport = req.headers.get('X-Bulk-Import') === 'true';
    const isSaveOnly = req.headers.get('X-Save-Only') === 'true';
    console.log('Bulk import request:', isBulkImport, 'Save-only request:', isSaveOnly);

    // --- Geoblocking ---
    console.log('1. Checking geoblock...');
    const geoblock = checkGeoblock(req);
    if (geoblock.blocked) {
      return new NextResponse(
        JSON.stringify({ error: 'Access denied from your location.' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }
    console.log('Geoblock check passed.');
    // --- End geoblocking ---

    // --- Rate limiting (skip for bulk import and save-only) ---
    if (!isBulkImport && !isSaveOnly) {
      console.log('2. Checking rate limit...');
      let userId: string | null = null;
      let ip: string | null = null;
      // Try to get userId from Supabase JWT (Authorization header)
      const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const jwt = authHeader.slice(7);
        // Parse JWT payload (base64url, no padding)
        try {
          const payload = JSON.parse(Buffer.from(jwt.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString());
          userId = payload.sub || null;
        } catch {
          userId = null;
        }
      }
      // Fallback: get IP from headers (X-Forwarded-For or cf-connecting-ip)
      ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('cf-connecting-ip') || null;

      console.log('Rate limit params:', { userId: !!userId, ip: !!ip, routeKey: 'ask' });
      
      try {
        const rate = await checkRateLimit({ userId, ip, routeKey: 'ask' });
        console.log('Rate limit result:', { allowed: rate.allowed, reason: rate.reason });
        
        if (!rate.allowed) {
          return new NextResponse(
            JSON.stringify({ error: 'Too Many Requests', reason: rate.reason }),
            {
              status: 429,
              headers: {
                'Content-Type': 'application/json',
                ...rate.headers,
                'Retry-After': rate.retryAfter ? Math.ceil((rate.retryAfter - Date.now()) / 1000).toString() : '60',
              },
            }
          );
        }
      } catch (error) {
        console.error('Rate limiting error:', error);
        // Continue without rate limiting if it fails
      }
      
      console.log('Rate limit check passed.');
    } else {
      console.log('2. Skipping rate limit check for bulk import or save-only request.');
    }
    // --- End rate limiting ---

    console.log('3. Parsing request body...');
    const { 
      question, 
      language,
      parent_id, 
      conversation_id, 
      conversation_context, 
      submitDeltaMs,
      answer: providedAnswer
    }: { 
      question: string;
      language: string;
      parent_id?: string;
      conversation_id?: string;
      conversation_context?: Array<{ role: string; content: string }>;
      submitDeltaMs?: number;
      answer?: string;
    } = await req.json();
    console.log('Request body parsed successfully:', { question, language, conversation_id });

    // Prompt injection filter
    console.log('4. Checking for banned phrases...');
    if (!isSaveOnly && containsBannedPhrase(question)) {
      return new NextResponse(
        JSON.stringify({ error: 'Unsafe prompt detected' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Skip submit delta check for bulk import requests
    if (!isBulkImport && !isSaveOnly && !checkMinSubmitDelta(submitDeltaMs)) {
      console.warn('Form submitted too quickly.');
      return new NextResponse(
        JSON.stringify({ error: 'Form submitted too quickly.' }),
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      );
    }
    console.log('Security checks passed.');

    // Decide streaming vs non-streaming
    if (!isBulkImport && !isSaveOnly && req.headers.get('accept') === 'text/event-stream') {
      // Streaming for chat
    try {
        console.log('5. Generating answer with OpenAI GPT-4.1 (streaming)...');
        const openaiStream = await streamOpenAIGPT4Answer(question, conversation_context);
        let fullAnswer = '';
        const reader = openaiStream.getReader();
        const stream = new ReadableStream({
          async pull(controller) {
            const { value, done } = await reader.read();
            if (done) {
              controller.close();
              // After streaming completes, save to Supabase (fire-and-forget)
              (async () => {
                try {
                  if (isOutputUnsafe(fullAnswer)) {
                    console.warn('Unsafe output detected (post-stream):', fullAnswer);
                    return;
                  }
                  const sanitizedAnswer = sanitizeAnswer(fullAnswer);
                  let finalConversationId: string | null = null;
                  if (conversation_id) {
                    finalConversationId = conversation_id ?? null;
                  } else if (parent_id) {
                    const { data: parentQuestion, error: parentError } = await supabase
                      .from('questions')
                      .select('conversation_id')
                      .eq('id', parent_id)
                      .single();
                    if (!parentError && parentQuestion) {
                      finalConversationId = parentQuestion?.conversation_id ?? null;
                    }
                  }
                  const isMain = !parent_id;
                  const insertData = {
                    question,
                    answer: sanitizedAnswer,
                    meta_generated: false,
                    parent_id: parent_id || null,
                    conversation_id: finalConversationId || null,
                    status: 'draft',
                    language_path: language,
                    created_at: new Date().toISOString(),
                    is_main: isMain,
                  };
                  const { data: inserted, error: insertError } = await supabase.from('questions').insert(insertData).select('id').single();
                  if (!insertError && inserted?.id) {
                    // Fire-and-forget metadata generation
                    fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'https://infoneva.com'}/api/questions/generate-metadata`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ id: inserted.id }),
                    }).catch(() => {});
                  }
                  console.log('Question saved to DB after streaming.');
                } catch (err) {
                  console.error('Error saving Q&A after streaming:', err);
                }
              })();
              return;
            }
            // Buffer the streamed content for later DB insert
            const chunk = value ? new TextDecoder().decode(value) : '';
            chunk.split('\n').forEach(line => {
              if (line.startsWith('data: ')) {
                const jsonStr = line.replace('data: ', '').trim();
                if (jsonStr && jsonStr !== '[DONE]') {
                  try {
                    const parsed = JSON.parse(jsonStr);
                    const delta = parsed.choices?.[0]?.delta?.content || parsed.choices?.[0]?.message?.content || '';
                    if (delta) fullAnswer += delta;
                  } catch {}
                }
              }
            });
            controller.enqueue(value);
          }
        });
        return new Response(stream, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          },
        });
      } catch (error) {
        console.error('Error generating answer from AI:', error);
        throw new Error(`AI service failed: ${(error as Error).message}`);
      }
    } else {
      // Non-streaming for bulk import, save-only, and all other cases
      let answer = '';
      if (isSaveOnly) {
        answer = providedAnswer || '';
        if (!answer) {
          return new NextResponse(
            JSON.stringify({ error: 'No answer provided for save-only request.' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
        }
      } else {
        try {
          console.log('5. Generating answer with OpenAI GPT-4.1 (non-streaming)...');
          answer = await getOpenAIGPT4Answer(question, conversation_context);
          if (!answer) {
            console.error('No answer returned from OpenAI GPT-4.1.');
            throw new Error('No answer from OpenAI GPT-4.1');
      }
      console.log('Answer generated successfully.');
    } catch (error) {
      console.error('Error generating answer from AI:', error);
      throw new Error(`AI service failed: ${(error as Error).message}`);
        }
    }

    console.log('6. Sanitizing and checking safety of the answer...');
    if (isOutputUnsafe(answer)) {
      console.warn('Unsafe output detected:', answer);
      return new NextResponse(
        JSON.stringify({ error: 'Blocked: unsafe output detected.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
      const sanitizedAnswer = isSaveOnly ? answer : sanitizeAnswer(answer);
    console.log('Answer sanitized and checked.');

    let finalConversationId: string | null = null;
    let newQuestionId: string | null = null;
    
    try {
      console.log('7. Saving question and answer to the database...');
      if (conversation_id) {
          finalConversationId = conversation_id ?? null;
      } else if (parent_id) {
      const { data: parentQuestion, error: parentError } = await supabase
        .from('questions')
        .select('conversation_id')
        .eq('id', parent_id)
        .single();
          if (parentError || !parentQuestion) throw new Error(`Error fetching parent question: ${parentError?.message || 'Not found'}`);
          finalConversationId = parentQuestion?.conversation_id ?? null;
      }

      // Check if this is the first question in the conversation
      const isMain = !parent_id;

      interface InsertData {
        question: string;
        answer: string;
        meta_generated: boolean;
        parent_id: string | null;
        conversation_id: string | null;
        status: 'draft' | 'live' | 'archived';
        language_path: string;
        created_at: string;
        is_main: boolean;
      }

      // Insert the new question/answer pair
      const insertData: InsertData = {
        question,
        answer: sanitizedAnswer,
        meta_generated: false,
        parent_id: parent_id || null,
        conversation_id: finalConversationId || null,
        status: 'draft',
        language_path: language,
        created_at: new Date().toISOString(),
        is_main: isMain,
      };

        const { data: inserted, error: insertError } = await supabase
        .from('questions')
        .insert(insertData)
      .select('id')
      .single();
        if (insertError || !inserted) {
          console.error('Supabase insert error:', insertError?.message || 'No new question returned');
          throw new Error(`Database insert failed: ${insertError?.message || 'No new question returned'}`);
      }
        newQuestionId = inserted?.id ?? null;
      console.log('Question saved to DB with ID:', newQuestionId);

        if (newQuestionId) {
          fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'https://infoneva.com'}/api/questions/generate-metadata`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: newQuestionId }),
          }).catch(() => {});
        }
    } catch (error) {
        console.error('Error with database operation:', error);
        throw new Error(`Database operation failed: ${(error as Error).message}`);
    }

    console.log('8. Returning response to client.');
    return NextResponse.json({ 
      answer: sanitizedAnswer,
      id: newQuestionId,
      conversation_id: finalConversationId,
    });
    }
  } catch (error) {
    const err = error as Error;
    console.error('[API/ASK ERROR]', err.message);
    return new NextResponse(
      JSON.stringify({ error: err.message || 'An internal server error occurred.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
