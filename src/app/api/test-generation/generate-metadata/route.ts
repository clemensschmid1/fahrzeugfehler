import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

function getOpenAIApiKey() {
  const apiKey = process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('Missing OpenAI API key');
  }
  return apiKey;
}

export async function POST(req: Request) {
  try {
    const { question, answer, contentType = 'fault', brand, model, generation } = await req.json();

    if (!question || !answer) {
      return NextResponse.json({ error: 'Missing question or answer' }, { status: 400 });
    }

    const apiKey = getOpenAIApiKey();
    const MODEL_METADATA = process.env.BATCH_MODEL_METADATA || 'gpt-4o-mini';

    const context = brand && model && generation
      ? `This is about ${brand} ${model} ${generation}.`
      : '';

    // Build comprehensive metadata prompt - same as Mass Generation
    const systemPrompt = contentType === 'fault'
      ? `You are an expert automotive technician and SEO specialist. Extract comprehensive metadata from a car fault/solution page.

Context: ${context}

Question/Problem: ${question}
Solution: ${answer.substring(0, 4000)}

**CRITICAL EXTRACTION RULES:**

1. **symptoms** (REQUIRED - Array, minimum 3-6 items):
   - Extract ALL symptoms from the "Symptoms" section of the solution
   - If no explicit Symptoms section, infer from problem description and solution content
   - Each symptom should be a distinct string
   - Examples: ["Check engine light illuminated", "Rough idle", "Loss of power", "Engine stalling", "Poor fuel economy", "Increased emissions"]
   - NO duplicates - each symptom must be unique

2. **diagnostic_steps** (REQUIRED - Array, minimum 3-7 items):
   - Extract ALL steps from the "Diagnostic Steps" section
   - Each step should be a complete, actionable instruction
   - Examples: ["Scan for error codes using OBD-II scanner", "Check spark plugs for wear or fouling", "Test ignition coils with multimeter", "Inspect spark plug wires", "Check compression in affected cylinder"]
   - NO duplicates - each step must be unique

3. **tools_required** (REQUIRED - Array, minimum 3-8 items):
   - Extract from "Tools Required" section OR from solution text
   - Include ALL tools mentioned throughout the solution
   - Examples: ["OBD-II scanner", "Spark plug socket set", "Multimeter", "Compression tester", "Socket set", "Torque wrench", "Fuel pressure gauge"]
   - NO duplicates - each tool must be unique

4. **affected_component** (REQUIRED - String):
   - Identify the MAIN component/system affected
   - Options: "Engine", "Transmission", "Brakes", "Electrical", "Cooling System", "Fuel System", "Exhaust System", "Suspension", "Steering", "HVAC", "Body/Interior"
   - Infer from problem description and solution if not explicit

5. **estimated_repair_time** (REQUIRED - String):
   - Extract from solution if mentioned
   - Otherwise, estimate based on solution complexity:
     * Simple (1-3 steps): "1-2 hours"
     * Medium (4-7 steps): "2-4 hours"
     * Complex (8+ steps): "4-8 hours"
   - Format: "X-Y hours" or "X hours"

6. **error_code** (PREFERRED - String or null):
   - Extract OBD-II codes (P-codes) or manufacturer codes
   - Examples: "P0301", "P0420", "P0420, P0430", "P0171"
   - Can be null if no error codes mentioned

7. **severity** (REQUIRED - "low" | "medium" | "high" | "critical"):
   - Assess based on problem impact:
     * "critical": Safety issues, engine failure, brake failure
     * "high": Major performance issues, drivability problems
     * "medium": Moderate issues, warning lights, reduced performance
     * "low": Minor issues, maintenance items

8. **difficulty_level** (REQUIRED - "easy" | "medium" | "hard" | "expert"):
   - Assess based on solution complexity:
     * "easy": Simple procedures, basic tools, no special knowledge
     * "medium": Moderate procedures, standard tools, some technical knowledge
     * "hard": Complex procedures, specialized tools, advanced knowledge
     * "expert": Very complex, requires professional equipment/expertise

9. **meta_title** (REQUIRED - String, 50-60 characters):
   - SEO-optimized title
   - Include: error code (if available), component, brand/model (if context provided)
   - Format: "[Error Code] [Component] [Issue] - [Brand] [Model] [Type]"
   - Examples: "P0301 Cylinder 1 Misfire Fix - Toyota Corolla Repair Guide"

10. **meta_description** (REQUIRED - String, 150-160 characters):
    - 1-2 sentences for SEO
    - Include key terms: error code, component, brand/model, action
    - No markdown, plain text
    - Example: "Learn how to diagnose and fix P0301 cylinder 1 misfire in Toyota Corolla. Step-by-step guide with diagnostic procedures and repair instructions."

11. **seo_score** (REQUIRED - Integer 1-99):
    - Assess SEO optimization:
      * 80-95: Excellent (specific error codes, brand/model, clear search intent, optimized title/description)
      * 70-79: Good (good keywords, clear intent)
      * 60-69: Average (basic optimization)
      * Below 60: Poor (lacks key SEO elements)

12. **content_score** (REQUIRED - Integer 1-99):
    - Assess content quality:
      * 85-95: Excellent (highly detailed, step-by-step, accurate, practical, well-structured)
      * 75-84: Good (detailed, clear steps, accurate)
      * 65-74: Average (adequate detail, some steps)
      * Below 65: Poor (lacks detail, unclear steps)

Return **ONLY valid JSON** (no markdown, no code blocks, no explanations).

Example output format (as JSON object):
- severity: "high" | "medium" | "low" | "critical"
- difficulty_level: "easy" | "medium" | "hard" | "expert"
- error_code: string or null (e.g., "P0301")
- affected_component: string (e.g., "Engine")
- symptoms: array of strings (minimum 3-6 items)
- diagnostic_steps: array of strings (minimum 3-7 items)
- tools_required: array of strings (minimum 3-8 items)
- estimated_repair_time: string (e.g., "2-4 hours")
- meta_title: string (50-60 characters)
- meta_description: string (150-160 characters)
- seo_score: integer (1-99)
- content_score: integer (1-99)`
      : `You are an expert automotive technician and SEO specialist. Extract comprehensive metadata from a car manual/maintenance page.

Context: ${context}

Question/Procedure: ${question}
Content: ${answer.substring(0, 3000)}

**CRITICAL EXTRACTION RULES:**

1. **tools_required** (REQUIRED - Array, minimum 3-8 items):
   - Extract from "Tools Required" section OR from content text
   - Include ALL tools mentioned throughout the content
   - Examples: ["Socket set", "Torque wrench", "Multimeter", "Drain pan", "Funnel"]
   - NO duplicates - each tool must be unique

2. **parts_required** (REQUIRED - Array, if applicable):
   - Components, fluids, or parts needed
   - Include quantities and specifications when relevant
   - Can be empty array if no parts needed

3. **estimated_time** (REQUIRED - String):
   - Extract from content if mentioned
   - Otherwise, estimate based on procedure complexity
   - Format: "X-Y hours" or "X hours"

4. **difficulty_level** (REQUIRED - "easy" | "medium" | "hard" | "expert"):
   - Assess based on procedure complexity
   - "easy": Simple procedures, basic tools
   - "medium": Moderate procedures, standard tools
   - "hard": Complex procedures, specialized tools
   - "expert": Very complex, requires professional equipment

5. **meta_title** (REQUIRED - String, 50-60 characters):
   - SEO-optimized title
   - Include: procedure type, brand/model (if context provided)
   - Format: "[Procedure] - [Brand] [Model] Guide"

6. **meta_description** (REQUIRED - String, 150-160 characters):
   - 1-2 sentences for SEO
   - Include key terms: procedure, brand/model, action
   - No markdown, plain text

7. **seo_score** (REQUIRED - Integer 1-99):
   - Assess SEO optimization

8. **content_score** (REQUIRED - Integer 1-99):
   - Assess content quality

Return **ONLY valid JSON** (no markdown, no code blocks, no explanations).`;

    const userPrompt = `Extract metadata from this ${contentType === 'fault' ? 'fault description' : 'manual'}:

Question: ${question}

Answer: ${answer.substring(0, 3000)}${context ? `\n\n${context}` : ''}

Return ONLY the JSON object, no other text.`;

    // Make direct API call (not batch)
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL_METADATA,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 2000,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({ error: `OpenAI API error: ${errorText}` }, { status: response.status });
    }

    const data = await response.json();
    const metadataText = data.choices?.[0]?.message?.content?.trim();
    
    if (!metadataText) {
      return NextResponse.json({ error: 'No metadata generated' }, { status: 500 });
    }

    // Parse JSON response
    let metadata: any;
    try {
      metadata = JSON.parse(metadataText);
    } catch (e) {
      return NextResponse.json({ error: 'Failed to parse metadata JSON' }, { status: 500 });
    }

    return NextResponse.json({ 
      metadata,
      usage: data.usage,
      model: data.model,
      systemPrompt,
      userPrompt,
    });
  } catch (error) {
    console.error('Metadata generation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

