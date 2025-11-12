import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkRateLimit } from '@/lib/ratelimiter';
import { sanitizeAnswer } from '@/lib/sanitize';
import { isOutputUnsafe } from '@/lib/safety';
import { checkGeoblock } from '@/lib/geoblock';
// Remove polyfill import - use native ReadableStream

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

    // Helper function to save question to database with retry logic
    const saveQuestionToDatabase = async (
      questionText: string,
      answerText: string,
      lang: string,
      convId: string | null | undefined,
      parentId: string | null | undefined,
      isMainQuestion: boolean
    ): Promise<{ id: string; slug: string | null } | null> => {
      // Validate required fields
      if (!questionText || !questionText.trim()) {
        console.error('[saveQuestionToDatabase] Missing or empty question');
        return null;
      }
      if (!answerText || !answerText.trim()) {
        console.error('[saveQuestionToDatabase] Missing or empty answer');
        return null;
      }
      if (!lang) {
        console.error('[saveQuestionToDatabase] Missing language');
        return null;
      }

      // Safety check
      if (isOutputUnsafe(answerText)) {
        console.warn('[saveQuestionToDatabase] Unsafe output detected, skipping save');
        return null;
      }

      const sanitizedAnswer = sanitizeAnswer(answerText);
      
      // Determine conversation_id
      let finalConversationId: string | null = null;
      if (convId) {
        finalConversationId = convId;
      } else if (parentId) {
        const { data: parentQuestion, error: parentError } = await supabase
          .from('questions2')
          .select('conversation_id')
          .eq('id', parentId)
          .maybeSingle();
        if (!parentError && parentQuestion?.conversation_id) {
          finalConversationId = parentQuestion.conversation_id;
        }
      }

      const isMain = typeof isMainQuestion === 'boolean' ? isMainQuestion : !parentId;

      // Generate metadata BEFORE inserting (like bulk import does)
      let metadata: Record<string, unknown> = {};
      let embedding: number[] | null = null;
      let generatedSlug: string | null = null;
      
      if (!isBulkImport) {
        try {
          console.log('[saveQuestionToDatabase] Generating metadata and embedding...');
          
          // Generate embedding
          try {
            const embeddingRes = await fetch('https://api.openai.com/v1/embeddings', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                model: 'text-embedding-ada-002',
                input: `${questionText} ${sanitizedAnswer}`,
              })
            });
            if (embeddingRes.ok) {
              const embeddingData = await embeddingRes.json();
              embedding = embeddingData.data[0].embedding;
            }
          } catch (err) {
            console.error('[saveQuestionToDatabase] Embedding generation failed (non-critical):', err);
          }

          // Generate metadata
          const metadataPrompt = `Generate metadata for the following technical question and answer.  
Return **ONLY valid JSON** (no markdown, no code blocks, no explanations, no extra text).

**The following fields are REQUIRED and must ALWAYS be filled with the best possible value (never null or empty):**
- content_score (integer 1–10)
- expertise_score (integer 1–10)
- helpfulness_score (integer 1–10)
- seo_slug (URL-friendly, 5–8 words, unique for this question)
- header (short, clear, human-readable)
- meta_description (1–2 sentences, no markdown)

**The following fields are STRONGLY PREFERRED and should be filled if possible, otherwise use null:**
- manufacturer (MUST be a SINGLE string, not an array. If multiple manufacturers are mentioned, use the PRIMARY/MOST RELEVANT one here, and put others in manufacturer_mentions array)
- manufacturer_mentions (array of strings - use this for additional manufacturers mentioned)
- part_type
- part_series
- sector
- error_code
- question_type
- confidentiality_flag (boolean, TRUE or FALSE)
- complexity_level

**For all fields:**
- Do not omit any fields; always include all fields in the output.
- Use concise values or lists, not full sentences (except meta_description).
- Do not include markdown, code blocks, or any text before or after the JSON.

Question: ${questionText}
Answer: ${sanitizedAnswer.substring(0, 2000)}`;

          const metadataRes = await fetch("https://api.openai.com/v1/chat/completions", {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model: 'gpt-3.5-turbo',
              messages: [{ role: 'user', content: metadataPrompt }],
              temperature: 0.35,
              max_tokens: 1000
            })
          });

          if (metadataRes.ok) {
            const metadataData = await metadataRes.json();
            const content = metadataData.choices?.[0]?.message?.content?.trim();
            if (content) {
              const cleaned = content.replace(/```json|```/g, '').trim();
              const firstBrace = cleaned.indexOf('{');
              if (firstBrace !== -1) {
                let depth = 0;
                let end = -1;
                for (let i = firstBrace; i < cleaned.length; i++) {
                  if (cleaned[i] === '{') depth++;
                  if (cleaned[i] === '}') depth--;
                  if (depth === 0) {
                    end = i + 1;
                    break;
                  }
                }
                if (end !== -1) {
                  const jsonStr = cleaned.slice(firstBrace, end);
                  metadata = JSON.parse(jsonStr);
                  
                  // Process metadata
                  const arrayFields = ['related_slugs', 'affected_components', 'application_area', 'relevant_standards', 'communication_protocols', 'manufacturer_mentions', 'risk_keywords', 'tools_involved', 'related_processes'];
                  for (const key of Object.keys(metadata)) {
                    if (typeof metadata[key] === 'string') {
                      metadata[key] = (metadata[key] as string).trim();
                      if ((metadata[key] as string) === '') metadata[key] = null;
                    }
                    if (arrayFields.includes(key)) {
                      if (typeof metadata[key] === 'string') {
                        // Try to parse as JSON array first
                        try {
                          const parsed = JSON.parse(metadata[key] as string);
                          metadata[key] = Array.isArray(parsed) ? parsed : (metadata[key] as string).split(',').map(s => s.trim()).filter(Boolean);
                        } catch {
                          metadata[key] = (metadata[key] as string).split(',').map(s => s.trim()).filter(Boolean);
                        }
                      }
                      if (!Array.isArray(metadata[key])) metadata[key] = [];
                      // Allow more items for manufacturer_mentions, limit others to 2
                      const limit = key === 'manufacturer_mentions' ? 10 : 2;
                      if (Array.isArray(metadata[key])) metadata[key] = (metadata[key] as unknown[]).slice(0, limit);
                    }
                    // Ensure manufacturer is NOT an array - convert to string if needed
                    if (key === 'manufacturer' && Array.isArray(metadata[key])) {
                      metadata[key] = (metadata[key] as string[])[0] || null;
                    }
                    if (metadata[key] === undefined) metadata[key] = null;
                  }
                  
                  generatedSlug = (metadata.seo_slug as string) || null;
                  if (!generatedSlug) {
                    generatedSlug = questionText.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').substring(0, 60);
                  }
                }
              }
            }
          }
          console.log('[saveQuestionToDatabase] Metadata generation completed');
        } catch (err) {
          console.error('[saveQuestionToDatabase] Metadata generation error (non-critical, will insert without metadata):', err);
        }
      }

      const now = new Date().toISOString();
      const insertData: Record<string, unknown> = {
        question: questionText.trim(),
        answer: sanitizedAnswer,
        meta_generated: !isBulkImport && Object.keys(metadata).length > 0,
        parent_id: parentId || null,
        conversation_id: finalConversationId || null,
        status: 'live' as const,
        language_path: lang,
        created_at: now,
        last_updated: now,
        is_main: isMain,
      };

      // Add metadata fields if generated
      if (Object.keys(metadata).length > 0) {
        insertData.header = metadata.header ?? null;
        insertData.meta_description = metadata.meta_description ?? null;
        
        // Handle manufacturer - if it's an array, take the first one and put rest in manufacturer_mentions
        let manufacturerValue: string | null = null;
        let manufacturerMentionsArray: string[] = [];
        if (metadata.manufacturer) {
          if (Array.isArray(metadata.manufacturer)) {
            manufacturerValue = metadata.manufacturer[0] || null;
            manufacturerMentionsArray = metadata.manufacturer.slice(1);
          } else if (typeof metadata.manufacturer === 'string') {
            // Check if it's a JSON array string
            try {
              const parsed = JSON.parse(metadata.manufacturer);
              if (Array.isArray(parsed)) {
                manufacturerValue = parsed[0] || null;
                manufacturerMentionsArray = parsed.slice(1);
              } else {
                manufacturerValue = metadata.manufacturer;
              }
            } catch {
              manufacturerValue = metadata.manufacturer;
            }
          } else {
            manufacturerValue = String(metadata.manufacturer);
          }
        }
        insertData.manufacturer = manufacturerValue;
        
        // Combine with existing manufacturer_mentions if any
        if (metadata.manufacturer_mentions && Array.isArray(metadata.manufacturer_mentions)) {
          manufacturerMentionsArray = [...manufacturerMentionsArray, ...metadata.manufacturer_mentions];
        }
        if (manufacturerMentionsArray.length > 0) {
          insertData.manufacturer_mentions = manufacturerMentionsArray;
        }
        insertData.part_type = metadata.part_type ?? null;
        insertData.part_series = metadata.part_series ?? null;
        insertData.sector = metadata.sector ?? null;
        insertData.error_code = metadata.error_code ?? null;
        insertData.question_type = metadata.question_type ?? null;
        insertData.complexity_level = metadata.complexity_level ?? null;
        insertData.confidentiality_flag = metadata.confidentiality_flag ?? false;
        insertData.content_score = metadata.content_score ?? null;
        insertData.expertise_score = metadata.expertise_score ?? null;
        insertData.helpfulness_score = metadata.helpfulness_score ?? null;
        insertData.voltage = metadata.voltage ?? null;
        insertData.current = metadata.current ?? null;
        insertData.power_rating = metadata.power_rating ?? null;
        insertData.machine_type = metadata.machine_type ?? null;
        insertData.application_area = metadata.application_area ?? null;
        insertData.product_category = metadata.product_category ?? null;
        insertData.electrical_type = metadata.electrical_type ?? null;
        insertData.control_type = metadata.control_type ?? null;
        insertData.relevant_standards = metadata.relevant_standards ?? null;
        insertData.mounting_type = metadata.mounting_type ?? null;
        insertData.cooling_method = metadata.cooling_method ?? null;
        insertData.communication_protocols = metadata.communication_protocols ?? null;
        insertData.manufacturer_mentions = metadata.manufacturer_mentions ?? null;
        insertData.risk_keywords = metadata.risk_keywords ?? null;
        insertData.tools_involved = metadata.tools_involved ?? null;
        insertData.installation_context = metadata.installation_context ?? null;
        insertData.sensor_type = metadata.sensor_type ?? null;
        insertData.mechanical_component = metadata.mechanical_component ?? null;
        insertData.industry_tag = metadata.industry_tag ?? null;
        insertData.maintenance_relevance = metadata.maintenance_relevance ?? false;
        insertData.failure_mode = metadata.failure_mode ?? null;
        insertData.software_context = metadata.software_context ?? null;
        
        if (generatedSlug) {
          insertData.slug = generatedSlug;
        }
        
        if (embedding) {
          insertData.embedding = embedding;
        }
      }

      // Retry logic: try up to 3 times
      let lastError: Error | null = null;
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          console.log(`[saveQuestionToDatabase] Attempt ${attempt}: Inserting into questions2`, {
            questionLength: questionText.trim().length,
            answerLength: sanitizedAnswer.length,
            lang,
            isMain,
            hasParentId: !!parentId,
            hasConversationId: !!finalConversationId,
            status: 'live'
          });
          
          const { data: inserted, error: insertError } = await supabase
            .from('questions2')
            .insert(insertData)
            .select('id, slug')
            .single();

          if (insertError) {
            console.error(`[saveQuestionToDatabase] Insert error on attempt ${attempt}:`, {
              message: insertError.message,
              code: insertError.code,
              details: insertError.details,
              hint: insertError.hint
            });
            throw new Error(`Database insert error: ${insertError.message} (code: ${insertError.code || 'unknown'})`);
          }

          if (!inserted?.id) {
            throw new Error('Database insert succeeded but no ID returned');
          }

          console.log(`[saveQuestionToDatabase] Successfully saved question ${inserted.id} on attempt ${attempt} with meta_generated=${insertData.meta_generated}`);

          return { id: inserted.id, slug: inserted.slug || null };
        } catch (error) {
          lastError = error as Error;
          console.error(`[saveQuestionToDatabase] Attempt ${attempt} failed:`, error);
          if (attempt < 3) {
            // Wait before retry (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
          }
        }
      }

      console.error('[saveQuestionToDatabase] All retry attempts failed:', lastError);
      return null;
    };

    // Decide streaming vs non-streaming
    if (!isBulkImport && !isSaveOnly && req.headers.get('accept') === 'text/event-stream') {
      // Streaming for chat
      try {
        const openaiStream = await streamOpenAIGPT4Answer(question, conversation_context);
        if (!openaiStream) {
          throw new Error('No response stream from OpenAI');
        }
        
        let fullAnswer = '';
        let savePromise: Promise<{ id: string; slug: string | null } | null> | null = null;
        const reader = openaiStream.getReader();
        const stream = new ReadableStream({
          async pull(controller) {
            try {
              const { value, done } = await reader.read();
              if (done) {
                try { reader.releaseLock(); } catch {}
                
                // Save to database BEFORE closing the stream (synchronous wait)
                if (fullAnswer && fullAnswer.trim()) {
                  savePromise = saveQuestionToDatabase(
                    question,
                    fullAnswer,
                    language,
                    conversation_id,
                    parent_id,
                    is_main ?? false
                  );
                  
                  try {
                    const saved = await savePromise;
                    if (saved?.id) {
                      console.log(`[ask route] Successfully saved question ${saved.id} during streaming`);
                    } else {
                      console.error('[ask route] Failed to save question during streaming');
                    }
                  } catch (saveError) {
                    console.error('[ask route] Critical error saving question during streaming:', saveError);
                  }
                } else {
                  console.warn('[ask route] Empty answer received, skipping save');
                }
                
                controller.close();
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
            } catch (err) {
              try { reader.cancel(); } catch {}
              try { reader.releaseLock(); } catch {}
              
              // Try to save even if streaming failed
              if (fullAnswer && fullAnswer.trim()) {
                console.warn('[ask route] Streaming error, attempting emergency save');
                saveQuestionToDatabase(
                  question,
                  fullAnswer,
                  language,
                  conversation_id,
                  parent_id,
                  is_main ?? false
                ).catch(saveErr => {
                  console.error('[ask route] Emergency save also failed:', saveErr);
                });
              }
              
              controller.error(err);
            }
          },
          cancel() {
            try { reader.cancel(); } catch {}
            try { reader.releaseLock(); } catch {}
            
            // Try to save even if stream is cancelled
            if (fullAnswer && fullAnswer.trim()) {
              console.warn('[ask route] Stream cancelled, attempting emergency save');
              saveQuestionToDatabase(
                question,
                fullAnswer,
                language,
                conversation_id,
                parent_id,
                is_main ?? false
              ).catch(saveErr => {
                console.error('[ask route] Emergency save after cancel failed:', saveErr);
              });
            }
          }
        });
        return new Response(stream, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache, no-transform',
            'Connection': 'close',
            'Transfer-Encoding': 'chunked',
            'X-Accel-Buffering': 'no',
            'Vary': 'Accept',
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

      // For bulk import, always generate a new conversation_id
      let conversationIdToUse: string | null | undefined = conversation_id;
      if (isBulkImport) {
        conversationIdToUse = crypto.randomUUID();
      }

      // Save to database using the helper function
      const saved = await saveQuestionToDatabase(
        question,
        sanitizedAnswer,
        language,
        conversationIdToUse,
        parent_id,
        is_main ?? false
      );

      if (!saved) {
        // If save failed after all retries, log but don't fail the request for non-bulk imports
        // (user already got their answer)
        if (!isBulkImport) {
          console.error('[ask route] Failed to save question after all retries in non-streaming path');
        } else {
          // For bulk import, fail hard
          throw new Error('Failed to save question to database after all retries');
        }
      }

      // Return the response
      return new NextResponse(
        JSON.stringify({ 
          id: saved?.id || null, 
          slug: saved?.slug || null,
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
