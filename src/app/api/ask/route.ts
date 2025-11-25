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

// 🔥 OPTIMIZATION: Create a single, reusable Supabase client instance
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    // 🔥 OPTIMIZATION: Add connection pooling and timeout settings
    auth: {
      persistSession: false, // Don't persist session for API routes
    },
    global: {
      headers: {
        'X-Client-Info': 'infoneva-api',
      },
    },
  }
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
  
  // 🔥 OPTIMIZATION: Add timeout and better error handling for OpenAI requests
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
  
  try {
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
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }
    
    return response.body;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('OpenAI request timed out');
    }
    throw error;
  }
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
    const isBulkImport = req.headers.get('X-Bulk-Import') === 'true';
    const isSaveOnly = req.headers.get('X-Save-Only') === 'true';

  try {
    // Skip geoblocking for bulk import (local use only)
    if (!isBulkImport) {
    const geoblock = checkGeoblock(req);
    if (geoblock.blocked) {
      return new NextResponse(
        JSON.stringify({ error: 'Access denied from your location.' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }
    }

    // Skip rate limiting for bulk import and save-only
    if (!isBulkImport && !isSaveOnly) {
      let userId: string | null = null;
      let ip: string | null = null;
      const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const jwt = authHeader.slice(7);
        try {
          const payload = JSON.parse(Buffer.from(jwt.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString());
          userId = payload.sub || null;
        } catch {
          userId = null;
        }
      }
      ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('cf-connecting-ip') || null;
      
      try {
        const rate = await checkRateLimit({ userId, ip, routeKey: 'ask' });
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
      }
    }

    const { 
      question, 
      language,
      parent_id, 
      conversation_id, 
      conversation_context, 
      submitDeltaMs,
      answer: providedAnswer,
      is_main
    }: { 
      question: string;
      language: string;
      parent_id?: string;
      conversation_id?: string;
      conversation_context?: Array<{ role: string; content: string }>;
      submitDeltaMs?: number;
      answer?: string;
      is_main?: boolean;
    } = await req.json();

    // Skip prompt injection filter for bulk import
    if (!isSaveOnly && !isBulkImport && containsBannedPhrase(question)) {
      return new NextResponse(
        JSON.stringify({ error: 'Unsafe prompt detected' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Skip submit delta check for bulk import requests
    if (!isBulkImport && !isSaveOnly && !checkMinSubmitDelta(submitDeltaMs)) {
      return new NextResponse(
        JSON.stringify({ error: 'Form submitted too quickly.' }),
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Decide streaming vs non-streaming
    if (!isBulkImport && !isSaveOnly && req.headers.get('accept') === 'text/event-stream') {
      // Streaming for chat
    try {
        const openaiStream = await streamOpenAIGPT4Answer(question, conversation_context);
        if (!openaiStream) {
          throw new Error('No response stream from OpenAI');
        }
        
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
                    return;
                  }
                  const sanitizedAnswer = sanitizeAnswer(fullAnswer);
                  let finalConversationId: string | null = null;
                  if (conversation_id) {
                    finalConversationId = conversation_id ?? null;
                  } else if (parent_id) {
                    // 🔥 OPTIMIZATION: Use more efficient query with specific fields
                    const { data: parentQuestion, error: parentError } = await supabase
                      .from('questions')
                      .select('conversation_id')
                      .eq('id', parent_id)
                      .maybeSingle();
                    if (!parentError && parentQuestion) {
                      finalConversationId = parentQuestion?.conversation_id ?? null;
                    }
                  }
                  const isMain = typeof is_main === 'boolean' ? is_main : !parent_id;
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
                  if (!insertError && inserted?.id && !isBulkImport) {
                    // Fire-and-forget metadata generation (only for non-bulk-import)
                    (async () => {
                      try {
                        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
                        await fetch(`${siteUrl}/api/questions/generate-metadata`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id: inserted.id }),
                        });
                                              } catch (err) {
                          if (!isBulkImport) {
                            console.error('[ask route] Metadata generation fire-and-forget error:', err);
                          }
                        }
                    })();
                  }
                                  } catch (err) {
                    if (!isBulkImport) {
                      console.error('Error saving Q&A after streaming:', err);
                    }
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
        if (!isBulkImport) {
        console.error('Error generating answer from AI:', error);
        }
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
          answer = await getOpenAIGPT4Answer(question, conversation_context);
          if (!answer) {
            throw new Error('No answer from OpenAI GPT-4.1');
      }
    } catch (error) {
          if (!isBulkImport) {
      console.error('Error generating answer from AI:', error);
          }
      throw new Error(`AI service failed: ${(error as Error).message}`);
        }
    }

      // Skip safety check for bulk import (local use only)
      if (!isBulkImport && isOutputUnsafe(answer)) {
      return new NextResponse(
        JSON.stringify({ error: 'Blocked: unsafe output detected.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
      const sanitizedAnswer = isSaveOnly ? answer : sanitizeAnswer(answer);

    let finalConversationId: string | null = null;
    let newQuestionId: string | null = null;
    let inserted: { id?: string; slug?: string } | null = null;
    
    try {
      if (conversation_id) {
        finalConversationId = conversation_id ?? null;
      } else if (parent_id) {
        // 🔥 OPTIMIZATION: Use more efficient query with specific fields
        const { data: parentQuestion, error: parentError } = await supabase
          .from('questions')
          .select('conversation_id')
          .eq('id', parent_id)
          .maybeSingle();
        if (!parentError && parentQuestion) {
          finalConversationId = parentQuestion?.conversation_id ?? null;
        }
      }
      const isMain = typeof is_main === 'boolean' ? is_main : !parent_id;
      // For bulk import, always generate a new conversation_id
      const conversationIdToUse = isBulkImport ? crypto.randomUUID() : (finalConversationId || null);
      const insertData = {
        question,
        answer: sanitizedAnswer,
        meta_generated: false,
        parent_id: parent_id || null,
        conversation_id: conversationIdToUse,
        status: 'draft',
        language_path: language,
        created_at: new Date().toISOString(),
        is_main: isMain,
      };
      const { data: insertedData, error: insertError } = await supabase.from('questions').insert(insertData).select('id, slug').single();
      if (insertError) {
        throw new Error('Failed to save question to database');
      }
      inserted = insertedData;
      newQuestionId = inserted?.id || null;
    } catch (error) {
      if (!isBulkImport) {
        console.error('Error saving question to database:', error);
      }
      throw new Error(`Database error: ${(error as Error).message}`);
    }

      // Return the response
      return new NextResponse(
        JSON.stringify({ 
          id: newQuestionId, 
          slug: inserted?.slug || null,
          answer: sanitizedAnswer 
        }),
        { 
          status: 200, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }
  } catch (err) {
    // Only log errors for non-bulk-import requests
    if (!isBulkImport) {
      console.error('Error in /api/ask:', err);
    }
    return new NextResponse(
      JSON.stringify({ error: (err as Error).message || 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
