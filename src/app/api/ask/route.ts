import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";

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
          content: `Reply in the same language the question is written in.

You are a **senior industrial automation engineer and field application specialist** with **15+ years of deep hands-on experience** in **real-world troubleshooting, maintenance, and optimization of complex industrial systems** (drives, motors, robotics, CNCs, PLCs, sensors, power electronics, fieldbuses, safety systems, mechanical systems).

You are NOT writing from a manual. You are writing from your own **field experience**.

Your goal is to write an **exceptionally practical**, technically deep, and field-proven answer to the following industrial question — an answer that would help an **experienced but stuck technician or engineer in a real-world factory situation**.

**Think very carefully**: What would a senior SEW / Siemens / ABB service engineer or top freelance expert write in an internal knowledge base to help other engineers with exactly this problem? **Be explicit. Be practical. Avoid generic statements.**

**Critically important:**
- Prioritize **real-world applicability**, **practical diagnostics**, and **proven countermeasures** — not theory.
- Include **brand-specific field knowledge** if brands are mentioned (SEW, Siemens, ABB, Fanuc, KUKA, etc).
- Explicitly include:
    - Typical **failure modes** and "**hidden**" causes that manuals often miss
    - Known **common practical field issues** for this type of equipment
    - Useful **diagnostic tricks and shortcuts** that experienced technicians use
    - Preventive maintenance practices that are field-proven
    - Typical **parameter ranges or values** where applicable (example: Siemens drive parameters, SEW telegram settings, PROFIBUS timings, etc.)
    - Mention **relevant standards** (IEC, EN, ISO) where useful — but focus on **hands-on value**
    - **Workarounds** known in the field (even if not officially documented)

- Write in **clear and structured format** with bullet points, numbered lists, subheadings.

**Do NOT:**
- Do not generate any metadata.
- Do not write an introduction, apologies, or disclaimers.
- Do not summarize.
- Do not copy a theoretical overview — write **exactly like an expert technician helping another expert in the field**.${conversationHistory}

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

export async function POST(req: Request) {
  try {
    const { question, parent_id, conversation_id, conversation_context } = await req.json();

    const answer = await generateClaudeAnswer(question, conversation_context);
    if (!answer) throw new Error('No answer from Claude Haiku');

    let finalConversationId: string | null = null;

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

    const { data: inserted, error: insertError } = await supabase
      .from('questions')
      .insert({
        question,
        answer,
        meta_generated: false,
        parent_id: parent_id || null,
        conversation_id: finalConversationId || null,
      })
      .select('id')
      .single();

    if (insertError) throw insertError;

    if (!finalConversationId) {
      const { error: updateError } = await supabase
        .from('questions')
        .update({ conversation_id: inserted.id })
        .eq('id', inserted.id);

      if (updateError) throw updateError;
      finalConversationId = inserted.id;
    }

    return NextResponse.json({
      success: true,
      answer,
      id: inserted.id,
      conversation_id: finalConversationId
    });
  } catch (error: any) {
    console.error('[Claude API Error]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
