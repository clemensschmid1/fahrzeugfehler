import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import { checkRateLimit } from '@/lib/ratelimiter';
import { sanitizeAnswer } from '@/lib/sanitize';
import { isOutputUnsafe } from '@/lib/safety';
import { checkGeoblock } from '@/lib/geoblock';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Supabase environment variables are missing. Check .env.local.');
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !process.env.AWS_REGION) {
  throw new Error('AWS environment variables are missing. Check .env.local.');
}

const bedrockClient = new BedrockRuntimeClient({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

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

async function generateClaudeAnswer(question: string, conversationContext?: Array<{ role: string; content: string }>): Promise<string> {
  const modelId = "anthropic.claude-3-haiku-20240307-v1:0";

  let conversationHistory = '';
  if (conversationContext && conversationContext.length > 0) {
    conversationHistory = '\n\n**Previous conversation context:**\n' + 
      conversationContext.map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`).join('\n');
  }

  const command = new InvokeModelCommand({
    modelId,
    contentType: "application/json",
    accept: "application/json",
    body: JSON.stringify({
      anthropic_version: "bedrock-2023-05-31",
      messages: [
        {
          role: "user",
          content: `You are an expert-level industrial field technician writing for an internal technical knowledge base used by other technicians in real-world environments.

Your answers should reflect *deep system-level understanding* of SEW, Siemens, and ABB industrial drive systems. Do not mention AI, do not refer to yourself, and do not simulate a human persona.

Your primary goal: deliver **highly actionable, deeply technical, and field-proven troubleshooting instructions** that go significantly beyond surface-level help.

### Priorities:

- Focus on **realistic root causes**, including **subtle failure patterns**, **aging effects**, and **external system interactions**
- Include **exact measurement values**, e.g., DC bus voltage thresholds, resistance ranges, parameter values (P108, P300, etc.)
- Always reference **relevant drive parameters**, and link them to symptoms (e.g., "If P500 drops below 470 VDC for more than 30 ms, F602 will trigger")
- Include **diagnostic techniques** used in the field:
  - Oscilloscope ripple analysis
  - Comparison of phase currents
  - Logging data from MOVITOOLS or Starter
  - Signal tracing to input/output stages
  - Inspection of relay circuits, braking units, comms telegrams

### Structure:

1. **Typical causes**
   - Include internal & external issues
   - Reference thresholds, parameter numbers, symptom behavior
2. **Step-by-step diagnostics**
   - Logical priority
   - Mention tools (multimeter, oscilloscope, insulation tester)
   - Identify failure indicators (e.g., asymmetric ripple, spike patterns)
3. **Field tricks & known hidden issues**
   - Share insider knowledge: common mistakes, intermittent problems, overlooked root causes
   - Mention vendor-specific quirks, maintenance shortcuts, hidden dependencies
4. **Preventive actions** (optional but encouraged)

### Critical rules:
- Do **not** add fluff like "I hope this helps" or "please let me know"
- Never reference yourself or say "I"
- Use **concise, precise, unambiguous** language
- Do not generalize — give **hard technical answers**, not vague suggestions

The target audience is a highly competent technician looking for exact answers under time pressure. Assume they already understand theory — focus on **fast diagnosis and resolution** with *real data, concrete steps, and edge-case insight*.

Question:

${conversationHistory}

Question: ${question}`,
        },
      ],
      max_tokens: 1500,
      temperature: 0.35,
    }),
  });

  const response = await bedrockClient.send(command);
  const responseBody = await response.body.transformToString();
  const data = JSON.parse(responseBody);
  return data?.content?.[0]?.text?.trim() || "";
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

    // --- Rate limiting ---
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
    console.log('Rate limit check passed.');
    // --- End rate limiting ---

    console.log('3. Parsing request body...');
    const { 
      question, 
      language,
      parent_id, 
      conversation_id, 
      conversation_context, 
      submitDeltaMs 
    }: { 
      question: string;
      language: string;
      parent_id?: string;
      conversation_id?: string;
      conversation_context?: Array<{ role: string; content: string }>;
      submitDeltaMs?: number;
    } = await req.json();
    console.log('Request body parsed successfully:', { question, language, conversation_id });

    // Prompt injection filter
    console.log('4. Checking for banned phrases...');
    if (containsBannedPhrase(question)) {
      return new NextResponse(
        JSON.stringify({ error: 'Unsafe prompt detected' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    if (!checkMinSubmitDelta(submitDeltaMs)) {
      console.warn('Form submitted too quickly.');
      return new NextResponse(
        JSON.stringify({ error: 'Form submitted too quickly.' }),
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      );
    }
    console.log('Security checks passed.');

    let answer = '';
    try {
      console.log('5. Generating answer with Claude Haiku...');
      answer = await generateClaudeAnswer(question, conversation_context);
      if (!answer) {
        console.error('No answer returned from Claude Haiku.');
        throw new Error('No answer from Claude Haiku');
      }
      console.log('Answer generated successfully.');
    } catch (error) {
      console.error('Error generating answer from AI:', error);
      throw new Error(`AI service failed: ${(error as Error).message}`);
    }

    console.log('6. Sanitizing and checking safety of the answer...');
    if (isOutputUnsafe(answer)) {
      console.warn('Unsafe output detected:', answer);
      return new NextResponse(
        JSON.stringify({ error: 'Blocked: unsafe output detected.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    const sanitizedAnswer = sanitizeAnswer(answer);
    console.log('Answer sanitized and checked.');

    let finalConversationId: string | null = null;
    let newQuestionId: string | null = null;
    
    try {
      console.log('7. Saving question and answer to the database...');
      if (conversation_id) {
        finalConversationId = conversation_id;
      } else if (parent_id) {
        const { data: parentQuestion, error: parentError } = await supabase
          .from('questions')
          .select('conversation_id')
          .eq('id', parent_id)
          .single();

        if (parentError) throw new Error(`Error fetching parent question: ${parentError.message}`);
        if (!parentQuestion) throw new Error('Parent question not found');
        
        finalConversationId = parentQuestion.conversation_id;
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

      const { data: newQuestion, error: insertError } = await supabase
        .from('questions')
        .insert(insertData)
        .select('id')
        .single();

      if (insertError) {
        console.error('Supabase insert error:', insertError);
        throw new Error(`Database insert failed: ${insertError.message}`);
      }
      
      newQuestionId = newQuestion.id;
      console.log('Question saved to DB with ID:', newQuestionId);
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
  } catch (error) {
    const err = error as Error;
    console.error('[API/ASK ERROR]', err.message);
    return new NextResponse(
      JSON.stringify({ error: err.message || 'An internal server error occurred.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
