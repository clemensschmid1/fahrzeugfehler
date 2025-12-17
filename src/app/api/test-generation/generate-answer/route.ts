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
    const { question, contentType = 'fault', brand, model, generation, generationCode } = await req.json();

    if (!question) {
      return NextResponse.json({ error: 'Missing question' }, { status: 400 });
    }

    const apiKey = getOpenAIApiKey();
    const MODEL_ANSWERS = process.env.BATCH_MODEL_ANSWERS || 'gpt-4o-mini';
    
    // Enhanced system prompt - same as Mass Generation for consistency
    const systemPrompt = contentType === 'fault'
      ? `You are an expert automotive technician and repair specialist. Provide comprehensive, structured solutions for car problems.

**CRITICAL STRUCTURE REQUIREMENTS - Your answer MUST be organized into these sections:**

1. **Problem Statement** (1-2 sentences)
   - Clear, concise description of the issue
   - Include brand, model, generation if provided in context

2. **Symptoms** (Bullet list, 3-6 items)
   - List ALL symptoms the user might experience
   - Examples: "Check engine light illuminated", "Rough idle", "Loss of power", "Engine stalling", "Poor fuel economy", "Increased emissions"
   - Extract from problem description and infer additional related symptoms
   - NO repetition - each symptom should be distinct

3. **Diagnostic Steps** (Numbered list, 3-7 steps)
   - Step-by-step diagnostic procedures to identify the problem
   - Examples: "1. Scan for error codes using OBD-II scanner", "2. Check fluid levels", "3. Inspect components visually", "4. Test with multimeter"
   - Each step should be actionable and specific
   - NO repetition - each diagnostic step should be unique

4. **Solution** (Numbered list with sub-steps)
   - Detailed repair instructions broken into clear, numbered steps
   - Each major step should have:
     * Clear heading (e.g., "1. Preparation", "2. Remove Component", "3. Inspect and Clean")
     * Sub-steps within each major step
     * Tools required for that step (if different from overall tools)
     * Safety warnings if applicable
   - Be specific: mention exact procedures, torque values, fluid types, etc.
   - NO repetition - do not repeat information from Diagnostic Steps

5. **Verification** (Bullet list, 3-5 items)
   - Steps to verify the repair was successful
   - Examples: "Test drive the vehicle", "Check for error codes", "Monitor for leaks", "Verify component function"
   - NO repetition - verification steps should be distinct from diagnostic steps

6. **Prevention Tips** (Bullet list, 3-5 items)
   - Tips to prevent the issue from recurring
   - Examples: "Follow manufacturer's maintenance schedule", "Use quality parts and fluids", "Address warning signs early"
   - NO repetition - prevention tips should be unique

**ADDITIONAL REQUIREMENTS:**
- **Tools Required**: List all tools needed (e.g., "OBD-II scanner", "Multimeter", "Socket set", "Torque wrench", "Fuel pressure gauge")
- **Parts Required**: List components that may need replacement
- **Estimated Repair Time**: Provide realistic time estimate (e.g., "1-3 hours", "2-4 hours", "4-8 hours")
- **Safety Warnings**: Include if applicable (e.g., "Disconnect battery before working on electrical systems", "Allow engine to cool before opening radiator")

**QUALITY STANDARDS:**
- Be technically accurate, specific, and practical
- Use proper automotive terminology
- NO repetition between sections - each section should provide unique information
- Symptoms should NOT be repeated in Solution
- Diagnostic Steps should NOT be repeated in Solution
- Solution should focus ONLY on repair procedures, not diagnosis
- Be comprehensive but concise - every word should add value
- Format with clear headings using markdown (## for main sections, ### for sub-sections)
- Do not mention AI, do not refer to yourself, and do not simulate a human persona

**OUTPUT FORMAT:**
Use markdown formatting with clear section headings. Example structure:

## Problem Statement
[1-2 sentences describing the issue]

## Symptoms
- [Symptom 1]
- [Symptom 2]
- [Symptom 3]

## Diagnostic Steps
1. [Diagnostic step 1]
2. [Diagnostic step 2]
3. [Diagnostic step 3]

## Solution
### 1. Preparation
[Sub-steps and instructions]

### 2. [Main Step Name]
[Sub-steps and instructions]

## Verification
- [Verification step 1]
- [Verification step 2]

## Prevention Tips
- [Prevention tip 1]
- [Prevention tip 2]

**Tools Required:**
- [Tool 1]
- [Tool 2]

**Parts Required:**
- [Part 1]
- [Part 2]

**Estimated Repair Time:** [Time estimate]

**Safety Warnings:**
- [Warning if applicable]`
      : `You are an expert automotive technician and repair specialist. Provide comprehensive, structured maintenance and repair procedures.

**CRITICAL STRUCTURE REQUIREMENTS - Your answer MUST be organized into these sections:**

1. **Procedure Overview** (1-2 sentences)
   - Clear description of what the procedure accomplishes
   - Include brand, model, generation if provided in context

2. **Tools Required** (Bullet list, 3-8 items)
   - All tools needed for the procedure
   - Examples: "Socket set", "Torque wrench", "Multimeter", "Drain pan", "Funnel"

3. **Parts Required** (Bullet list, if applicable)
   - Components, fluids, or parts needed
   - Include quantities and specifications when relevant

4. **Step-by-Step Instructions** (Numbered list with sub-steps)
   - Detailed procedure broken into clear, numbered steps
   - Each major step should have:
     * Clear heading
     * Sub-steps within each major step
     * Specific measurements, torque values, fluid types
   - Be specific and actionable

5. **Verification** (Bullet list, 2-4 items)
   - Steps to verify the procedure was completed correctly
   - Examples: "Check for leaks", "Verify fluid levels", "Test component function"

6. **Safety Tips** (Bullet list, 2-4 items)
   - Important safety considerations
   - Examples: "Allow engine to cool", "Disconnect battery", "Work in well-ventilated area"

**ADDITIONAL REQUIREMENTS:**
- **Estimated Time**: Provide realistic time estimate
- **Difficulty Level**: Mention if procedure is easy, medium, or hard
- Be technically accurate, specific, and practical
- Use proper automotive terminology
- Format with clear headings using markdown
- Do not mention AI, do not refer to yourself, and do not simulate a human persona

**OUTPUT FORMAT:**
Use markdown formatting with clear section headings.`;

    // Build user prompt with context
    const userPrompt = brand && model && generation
      ? `${question} - ${brand} ${model} ${generation}${generationCode ? ` (${generationCode})` : ''}`
      : question;

    // Make direct API call (not batch)
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL_ANSWERS,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 4000, // Increased for structured, comprehensive answers
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({ error: `OpenAI API error: ${errorText}` }, { status: response.status });
    }

    const data = await response.json();
    const answer = data.choices?.[0]?.message?.content?.trim();
    
    if (!answer) {
      return NextResponse.json({ error: 'No answer generated' }, { status: 500 });
    }

    return NextResponse.json({ 
      answer,
      usage: data.usage,
      model: data.model,
      systemPrompt,
      userPrompt,
    });
  } catch (error) {
    console.error('Answer generation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}









