import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const { question, answer, questionType, brand, model, generation } = await req.json();
    
    if (!question || !answer) {
      return NextResponse.json({ error: 'Missing question or answer' }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Missing OpenAI API key' }, { status: 500 });
    }

    // Use gpt-4o-mini for cost optimization (16.7x cheaper), can be overridden via env var
    const openaiModel = process.env.OPENAI_MODEL_METADATA || 'gpt-4o-mini';

    // Build context-aware metadata prompt
    const context = brand && model && generation 
      ? `This is about ${brand} ${model} ${generation}. `
      : '';

    const metadataPrompt = questionType === 'fault'
      ? `You are an expert automotive technician and SEO specialist. Generate comprehensive metadata for a car fault/solution page.

Context: ${context}

Question/Problem: ${question}
Solution: ${answer.substring(0, 2000)}

Return **ONLY valid JSON** (no markdown, no code blocks, no explanations).

**REQUIRED fields (never null):**
- severity: "low" | "medium" | "high" | "critical"
- difficulty_level: "easy" | "medium" | "hard" | "expert"
- meta_title: Short, SEO-optimized title (50-60 characters, includes brand/model if context provided)
- meta_description: 1-2 sentences for SEO (150-160 characters, no markdown)
- seo_score: Integer 1-99 (assess SEO optimization: keyword relevance, search intent match, structure)
- content_score: Integer 1-99 (assess content quality: detail, accuracy, practical relevance, step-by-step clarity)

**REQUIRED fields (must extract from solution, infer if not explicit):**
- symptoms: Array of symptom strings (MUST extract from solution or infer from problem description, minimum 2-3 symptoms)
- diagnostic_steps: Array of diagnostic step strings (MUST extract from solution, minimum 3-5 steps)
- tools_required: Array of required tools (MUST extract from solution, minimum 2-3 tools)
- affected_component: Main component affected (MUST infer from problem, e.g., "Engine", "Transmission", "Brakes", "Electrical", "Cooling System", "Fuel System")
- estimated_repair_time: String (MUST estimate based on solution complexity, e.g., "1-2 hours", "2-4 hours", "4-8 hours")

**STRONGLY PREFERRED fields (extract if present, otherwise null):**
- error_code: OBD-II or manufacturer error codes (e.g., "P0301", "P0420", "P0420, P0430")

**Extraction rules (CRITICAL - these fields are REQUIRED for sortability):**
- symptoms: MUST extract ALL symptoms mentioned in solution. If solution doesn't explicitly list symptoms, infer them from the problem description. Minimum 2-3 symptoms. Examples: ["Check engine light", "Rough idle", "Loss of power", "Stalling", "Poor fuel economy"]
- diagnostic_steps: MUST extract ALL diagnostic steps from solution. Break down the solution into clear diagnostic procedures. Minimum 3-5 steps. Examples: ["Scan for error codes", "Check spark plugs", "Test ignition coils", "Inspect fuel injectors", "Check compression"]
- tools_required: MUST extract ALL tools mentioned in solution. If tools aren't explicitly mentioned, infer standard tools needed for this type of repair. Minimum 2-3 tools. Examples: ["OBD-II scanner", "Spark plug socket", "Multimeter", "Socket set", "Torque wrench"]
- affected_component: MUST identify the main component. If unclear, infer from problem description and solution content.
- estimated_repair_time: MUST provide realistic time estimate based on solution steps and complexity.
- Extract error codes from question/solution (P-codes, manufacturer codes)
- Infer severity from problem description (safety issues = critical/high, minor = low)
- Infer difficulty from solution complexity
- Generate meta_title: Include key terms like error code, component, brand/model. Keep it concise and search-friendly.
- Score seo_score: Higher if includes specific error codes, brand/model, clear search intent (70-90 for good content, 50-70 for average, below 50 for poor)
- Score content_score: Higher if detailed, step-by-step, accurate, practical (80-95 for excellent, 70-80 for good, 60-70 for average, below 60 for poor)

**Scoring Guidelines:**
- seo_score: Assess keyword optimization, search intent match, title/description quality. Good technical content should score 70-90.
- content_score: Assess detail level, accuracy, step-by-step clarity, practical value. Comprehensive guides should score 80-95.

Example output (NOTE: symptoms, diagnostic_steps, tools_required are REQUIRED, not optional):
{
  "severity": "high",
  "difficulty_level": "medium",
  "error_code": "P0301",
  "affected_component": "Engine",
  "symptoms": ["Check engine light", "Rough idle", "Engine misfire", "Loss of power", "Poor fuel economy"],
  "diagnostic_steps": ["Scan for error codes using OBD-II scanner", "Check spark plugs for wear or fouling", "Test ignition coils with multimeter", "Inspect spark plug wires", "Check compression in affected cylinder"],
  "tools_required": ["OBD-II scanner", "Spark plug socket set", "Multimeter", "Compression tester", "Basic hand tools"],
  "estimated_repair_time": "2-4 hours",
  "meta_title": "P0301 Cylinder 1 Misfire Fix - ${model || 'Car'} Repair Guide",
  "meta_description": "Learn how to diagnose and fix P0301 cylinder 1 misfire in ${model || 'your vehicle'}. Step-by-step guide with diagnostic procedures and repair instructions.",
  "seo_score": 85,
  "content_score": 88
}`
      : `You are an expert automotive technician and SEO specialist. Generate comprehensive metadata for a car maintenance/repair manual page.

Context: ${context}

Title/Procedure: ${question}
Content: ${answer.substring(0, 2000)}

Return **ONLY valid JSON** (no markdown, no code blocks, no explanations).

**REQUIRED fields (never null):**
- difficulty_level: "easy" | "medium" | "hard" | "expert"
- manual_type: "maintenance" | "repair" | "diagnostic" | "parts" | "specifications" | "other"
- meta_title: Short, SEO-optimized title (50-60 characters, includes brand/model if context provided)
- meta_description: 1-2 sentences for SEO (150-160 characters, no markdown)

**STRONGLY PREFERRED fields (extract if present, otherwise null):**
- estimated_time: String (e.g., "30 minutes", "1-2 hours", "2-4 hours")
- tools_required: Array of required tools
- parts_required: Array of required parts/components

**Extraction rules:**
- Classify manual type from content
- Infer difficulty from procedure complexity
- Extract time estimates from content
- List all tools mentioned
- List all parts/components mentioned
- Generate meta_title: Include procedure type, brand/model. Keep it concise and search-friendly.

Example output:
{
  "difficulty_level": "easy",
  "manual_type": "maintenance",
  "estimated_time": "30 minutes",
  "tools_required": ["Socket set", "Oil filter wrench", "Drain pan"],
  "parts_required": ["Engine oil", "Oil filter"],
  "meta_title": "How to Change Engine Oil - ${model || 'Car'} Guide",
  "meta_description": "Step-by-step guide to changing engine oil in ${model || 'your vehicle'}. Includes tools needed, parts required, and detailed instructions."
}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: openaiModel, // Using gpt-4o-mini for cost optimization (16.7x cheaper)
        messages: [
          { role: 'system', content: 'You are an expert at extracting structured metadata from automotive technical content. Always return valid JSON only. Be precise with scores and ensure all required fields are present.' },
          { role: 'user', content: metadataPrompt }
        ],
        temperature: 0.2, // Lower temperature for more consistent, accurate metadata
        max_tokens: 1500, // Increased for comprehensive metadata
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({ error: `OpenAI error: ${errorText}` }, { status: 500 });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim();
    
    if (!content) {
      return NextResponse.json({ error: 'No metadata generated' }, { status: 500 });
    }

    // Extract JSON from response
    let metadata: Record<string, unknown>;
    try {
      // Try to parse as JSON directly
      metadata = JSON.parse(content);
    } catch {
      // Try to extract JSON from markdown code blocks
      const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/) || content.match(/(\{[\s\S]*\})/);
      if (jsonMatch) {
        metadata = JSON.parse(jsonMatch[1]);
      } else {
        throw new Error('Could not parse metadata JSON');
      }
    }

    return NextResponse.json({ metadata });
  } catch (error) {
    console.error('Metadata generation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

