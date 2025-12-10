import { NextResponse } from 'next/server';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { createWriteStream } from 'fs';
import { join } from 'path';
import { existsSync } from 'fs';

export const runtime = 'nodejs';

function getOpenAIApiKey() {
  const apiKey = process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('Missing OpenAI API key');
  }
  return apiKey;
}

// Download and parse JSONL file from OpenAI
async function downloadAndParseJsonl(fileId: string, apiKey: string): Promise<any[]> {
  const OPENAI_API_URL = 'https://api.openai.com/v1';
  const res = await fetch(`${OPENAI_API_URL}/files/${fileId}/content`, {
    headers: { 'Authorization': `Bearer ${apiKey}` }
  });
  
  if (!res.ok) {
    throw new Error(`Failed to download file: ${res.statusText}`);
  }
  
  const text = await res.text();
  const lines = text.trim().split('\n').filter(line => line.trim());
  return lines.map(line => {
    try {
      return JSON.parse(line);
    } catch (e) {
      console.error('Failed to parse JSONL line:', line);
      return null;
    }
  }).filter(item => item !== null);
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const questionsFile = formData.get('questionsFile') as File;
    const answersFile = formData.get('answersFile') as File;
    const contentType = (formData.get('contentType') as string) || 'fault';
    const generationIdsStr = formData.get('generationIds') as string;
    const generationIds = generationIdsStr ? JSON.parse(generationIdsStr) : [];

    if (!questionsFile) {
      return NextResponse.json({ error: 'Missing questionsFile' }, { status: 400 });
    }

    if (!answersFile) {
      return NextResponse.json({ error: 'Missing answersFile' }, { status: 400 });
    }

    if (!questionsFile.name.endsWith('.jsonl')) {
      return NextResponse.json({ error: 'Questions file must be a .jsonl file' }, { status: 400 });
    }

    if (!answersFile.name.endsWith('.jsonl')) {
      return NextResponse.json({ error: 'Answers file must be a .jsonl file' }, { status: 400 });
    }

    // Read questions file
    const questionsJsonl = await questionsFile.text();
    const questionsLines = questionsJsonl.trim().split('\n').filter(line => line.trim());
    const questionsMap = new Map<string, { question: string; generationId?: string }>();
    
    for (const line of questionsLines) {
      try {
        const parsed = JSON.parse(line);
        const customId = parsed.custom_id || '';
        
        // Extract generation_id from custom_id: answer-{generationId}-{index}
        const match = customId.match(/^answer-(.+?)-(\d+)$/);
        const generationId = match ? match[1] : null;
        
        // Extract question from user message
        const question = parsed.body?.messages?.[1]?.content || '';
        
        if (customId && question) {
          questionsMap.set(customId, { question, generationId: generationId || undefined });
        }
      } catch (e) {
        console.error('Failed to parse question line:', e);
      }
    }

    if (questionsMap.size === 0) {
      return NextResponse.json({ error: 'No valid questions found in file' }, { status: 400 });
    }

    // Read answers file
    const answersJsonl = await answersFile.text();
    const answersLines = answersJsonl.trim().split('\n').filter(line => line.trim());
    const answers = answersLines.map(line => {
      try {
        return JSON.parse(line);
      } catch (e) {
        return null;
      }
    }).filter(item => item !== null);

    if (answers.length === 0) {
      return NextResponse.json({ error: 'No answers found' }, { status: 400 });
    }

    // Map answers to questions by custom_id
    const qaPairs: Array<{ question: string; answer: string; generationId?: string; customId: string }> = [];
    const failedAnswers: string[] = [];
    const missingQuestions: string[] = [];
    const successfulAnswers = new Set<string>();
    
    for (const answerResult of answers) {
      const customId = answerResult.custom_id;
      
      // Track failed answers
      if (answerResult.error || answerResult.response?.status_code !== 200) {
        failedAnswers.push(customId);
        continue;
      }

      const questionData = questionsMap.get(customId);
      
      if (!questionData) {
        missingQuestions.push(customId);
        continue;
      }
      
      const answer = answerResult.response?.body?.choices?.[0]?.message?.content;
      if (answer) {
        qaPairs.push({
          question: questionData.question,
          answer: answer.trim(),
          generationId: questionData.generationId,
          customId,
        });
        successfulAnswers.add(customId);
      }
    }

    // Calculate statistics
    const totalQuestions = questionsMap.size;
    const totalAnswers = answers.length;
    const successfulPairs = qaPairs.length;
    const failedCount = failedAnswers.length;
    const missingCount = missingQuestions.length;
    const unmatchedQuestions = totalQuestions - successfulPairs - missingCount;

    // Log warnings
    if (failedCount > 0) {
      console.warn(`[Build Metadata] ${failedCount} answers failed in batch (custom_ids: ${failedAnswers.slice(0, 5).join(', ')}${failedAnswers.length > 5 ? '...' : ''})`);
    }
    if (missingCount > 0) {
      console.warn(`[Build Metadata] ${missingCount} answers have no matching question (custom_ids: ${missingQuestions.slice(0, 5).join(', ')}${missingQuestions.length > 5 ? '...' : ''})`);
    }
    if (unmatchedQuestions > 0) {
      console.warn(`[Build Metadata] ${unmatchedQuestions} questions have no matching answer`);
    }

    if (qaPairs.length === 0) {
      return NextResponse.json({ 
        error: 'No valid Q&A pairs found',
        statistics: {
          totalQuestions,
          totalAnswers,
          successfulPairs: 0,
          failedCount,
          missingCount,
          unmatchedQuestions,
        }
      }, { status: 400 });
    }

    // Warn if significant number of pairs are missing
    const successRate = (successfulPairs / totalQuestions) * 100;
    if (successRate < 95) {
      console.warn(`[Build Metadata] WARNING: Only ${successRate.toFixed(1)}% of questions have matching answers (${successfulPairs}/${totalQuestions}). This may cause issues when splitting files.`);
    }

    // Fetch generation data for context (if generationIds provided)
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const generationDataMap = new Map<string, { brand: string; model: string; generation: string }>();
    
    if (generationIds.length > 0) {
      const { data: generationsData } = await supabase
        .from('model_generations')
        .select('id, name, car_models!inner(id, name, car_brands!inner(id, name))')
        .in('id', generationIds);

      if (generationsData) {
        for (const gen of generationsData) {
          const model = (gen.car_models as any);
          const brand = model?.car_brands?.[0] || model?.car_brands;
          if (brand && model) {
            generationDataMap.set(gen.id, {
              brand: brand.name,
              model: model.name,
              generation: gen.name,
            });
          }
        }
      }
    }

    // CRITICAL VALIDATION: Ensure all custom_ids are unique and properly formatted
    const customIdSet = new Set<string>();
    const duplicateCustomIds: string[] = [];
    for (const qa of qaPairs) {
      if (customIdSet.has(qa.customId)) {
        duplicateCustomIds.push(qa.customId);
      } else {
        customIdSet.add(qa.customId);
      }
    }
    
    if (duplicateCustomIds.length > 0) {
      console.error(`[Build Metadata] CRITICAL ERROR: Found ${duplicateCustomIds.length} duplicate custom_ids: ${duplicateCustomIds.slice(0, 10).join(', ')}${duplicateCustomIds.length > 10 ? '...' : ''}`);
      return NextResponse.json({
        error: `Duplicate custom_ids detected. This would cause data corruption. Found ${duplicateCustomIds.length} duplicates.`,
        duplicateCustomIds: duplicateCustomIds.slice(0, 20),
        statistics: {
          totalQuestions,
          totalAnswers,
          successfulPairs: qaPairs.length,
          failedCount,
          missingCount,
          unmatchedQuestions,
          successRate: successRate.toFixed(1) + '%',
        }
      }, { status: 400 });
    }

    // Validate custom_id format: should be answer-{generationId}-{index}
    const invalidCustomIds: string[] = [];
    for (const qa of qaPairs) {
      if (!qa.customId || !qa.customId.match(/^answer-.+-\d+$/)) {
        invalidCustomIds.push(qa.customId || '(missing)');
      }
    }
    
    if (invalidCustomIds.length > 0) {
      console.error(`[Build Metadata] CRITICAL ERROR: Found ${invalidCustomIds.length} invalid custom_id formats: ${invalidCustomIds.slice(0, 10).join(', ')}${invalidCustomIds.length > 10 ? '...' : ''}`);
      return NextResponse.json({
        error: `Invalid custom_id format detected. All custom_ids must follow pattern: answer-{generationId}-{index}. Found ${invalidCustomIds.length} invalid IDs.`,
        invalidCustomIds: invalidCustomIds.slice(0, 20),
        statistics: {
          totalQuestions,
          totalAnswers,
          successfulPairs: qaPairs.length,
          failedCount,
          missingCount,
          unmatchedQuestions,
          successRate: successRate.toFixed(1) + '%',
        }
      }, { status: 400 });
    }

    // Create metadata batch JSONL
    const MODEL_METADATA = process.env.BATCH_MODEL_METADATA || 'gpt-4o-mini';
    const batchJsonlLines = qaPairs.map((qa, i) => {
      // CRITICAL: Use the same custom_id from the QA pair to maintain consistency
      const customId = qa.customId;
      const genData = qa.generationId ? generationDataMap.get(qa.generationId) : null;
      const context = genData 
        ? `This is about ${genData.brand} ${genData.model} ${genData.generation}.`
        : '';

      // Build comprehensive metadata prompt - enhanced for structured extraction
      const metadataPrompt = contentType === 'fault'
        ? `You are an expert automotive technician and SEO specialist. Extract COMPREHENSIVE metadata from a car fault/solution page. This metadata will be displayed on a public website, so accuracy and completeness are CRITICAL.

Context: ${context}

Question/Problem: ${qa.question}
Solution: ${qa.answer.substring(0, 4000)}

**MANDATORY EXTRACTION - ALL FIELDS MUST BE EXTRACTED:**

1. **symptoms** (REQUIRED - Array, minimum 3-6 items, NEVER empty):
   - Extract ALL symptoms from the "Symptoms" section of the solution
   - If no explicit Symptoms section, carefully infer from problem description and solution content
   - Look for bullet points, numbered lists, or text describing what the user experiences
   - Each symptom should be a complete, distinct string
   - Examples: ["Check engine light illuminated", "Rough idle", "Loss of power", "Engine stalling", "Poor fuel economy", "Increased emissions", "AC blows warm air after 10 minutes"]
   - NO duplicates - each symptom must be unique
   - If solution mentions "symptoms include" or "you may notice", extract those

2. **diagnostic_steps** (REQUIRED - Array, minimum 3-7 items, NEVER empty):
   - Extract ALL steps from the "Diagnostic Steps" section
   - Look for numbered lists, bullet points, or sequential instructions
   - Each step should be a complete, actionable instruction (not just a tool name)
   - Examples: ["Scan for error codes using OBD-II scanner", "Check spark plugs for wear or fouling", "Test ignition coils with multimeter", "Inspect spark plug wires", "Check compression in affected cylinder", "Test AC pressure switches and relay"]
   - NO duplicates - each step must be unique
   - If solution has "Diagnostic Steps" or "How to diagnose" section, extract all steps

3. **tools_required** (REQUIRED - Array, minimum 3-8 items, NEVER empty):
   - Extract from "Tools Required" section OR from solution text
   - Look for lists of tools, mentions in solution steps, or tool requirements
   - Include ALL tools mentioned throughout the solution (in preparation, steps, etc.)
   - Examples: ["OBD-II scanner", "Spark plug socket set", "Multimeter", "Compression tester", "Socket set", "Torque wrench", "Fuel pressure gauge", "Manifold gauge set", "Vacuum pump"]
   - NO duplicates - each tool must be unique
   - Be thorough - scan entire solution for tool mentions

4. **parts_required** (REQUIRED - Array, minimum 0 items, can be empty if no parts needed):
   - Extract from "Parts Required" section OR from solution text
   - Look for lists of parts, components, fluids, or replacement items
   - Include ALL parts mentioned throughout the solution (in steps, preparation, etc.)
   - Examples: ["Brake pads", "Brake rotors", "Brake fluid", "AC compressor", "Cabin air filter", "Refrigerant canister", "Spark plugs", "Ignition coils"]
   - Can be empty array [] if no parts are needed for the repair
   - NO duplicates - each part must be unique

5. **affected_component** (REQUIRED - String, NEVER null):
   - Identify the MAIN component/system affected
   - Options: "Engine", "Transmission", "Brakes", "Electrical", "Cooling System", "Fuel System", "Exhaust System", "Suspension", "Steering", "HVAC", "Body/Interior"
   - Infer from problem description, solution steps, and component mentions
   - If multiple components, choose the PRIMARY one
   - Examples: For AC issues → "HVAC", For engine misfire → "Engine", For brake problems → "Brakes"

6. **estimated_repair_time** (REQUIRED - String, NEVER null):
   - FIRST: Extract from solution if explicitly mentioned (look for "Estimated Repair Time", "Time:", "Duration:", "Takes", "hours", "minutes")
   - If not found, estimate based on solution complexity:
     * Simple (1-3 major steps, basic tools): "1-2 hours"
     * Medium (4-7 steps, standard tools): "2-4 hours"
     * Complex (8+ steps, specialized tools): "4-8 hours"
     * Very complex (multiple systems, professional equipment): "8+ hours"
   - Format: "X-Y hours" or "X hours" or "X minutes" (for very simple tasks)
   - Be realistic based on actual solution steps

7. **error_code** (PREFERRED - String or null):
   - Extract OBD-II codes (P-codes like P0301, P0420) or manufacturer codes
   - Look for patterns: P followed by 4 digits, or manufacturer-specific codes
   - Examples: "P0301", "P0420", "P0420, P0430", "P0171", "P0300-P0304"
   - Can be null if no error codes mentioned
   - If multiple codes, include all: "P0301, P0302, P0303"

8. **severity** (REQUIRED - "low" | "medium" | "high" | "critical"):
   - Assess based on problem impact and safety:
     * "critical": Safety issues (brake failure, steering failure, engine seizure), complete vehicle breakdown, fire risk
     * "high": Major performance issues (engine won't start, transmission failure, major drivability problems)
     * "medium": Moderate issues (warning lights, reduced performance, AC not working, minor drivability issues)
     * "low": Minor issues (cosmetic, maintenance items, minor inconveniences)
   - Consider: Can vehicle still be driven? Is it dangerous? How severe is the impact?

9. **difficulty_level** (REQUIRED - "easy" | "medium" | "hard" | "expert"):
   - Assess based on solution complexity, tools needed, and knowledge required:
     * "easy": Simple procedures (1-3 steps), basic tools (screwdriver, wrench), no special knowledge, DIY-friendly
     * "medium": Moderate procedures (4-7 steps), standard tools (socket set, multimeter), some technical knowledge, experienced DIY
     * "hard": Complex procedures (8+ steps), specialized tools (OBD-II scanner, compression tester), advanced knowledge, professional recommended
     * "expert": Very complex (multiple systems, calibration needed), professional equipment (diagnostic computers), expert knowledge required, professional only
   - Consider: Number of steps, tool complexity, technical knowledge needed

10. **meta_title** (REQUIRED - String, 50-60 characters):
   - SEO-optimized title for search engines
   - Include: error code (if available), component, brand/model (if context provided), action verb
   - Format: "[Error Code] [Component] [Issue] - [Brand] [Model] [Type]" OR "[Issue] [Brand] [Model] - [Component] Fix"
   - Examples: 
     * "P0301 Cylinder 1 Misfire Fix - Toyota Corolla Repair"
     * "AC Blows Warm Air - Alfa Romeo Giulia HVAC Fix"
     * "Diagnose Fuel Injector Clogged Toyota Corolla"
   - Keep it concise, search-friendly, and descriptive

11. **meta_description** (REQUIRED - String, 150-160 characters):
    - 1-2 sentences for SEO and search result snippets
    - Include key terms: error code (if available), component, brand/model, action, benefit
    - No markdown, plain text only
    - Examples: 
      * "Learn how to diagnose and fix P0301 cylinder 1 misfire in Toyota Corolla. Step-by-step guide with diagnostic procedures and repair instructions."
      * "Complete guide to fixing AC that blows warm air in Alfa Romeo Giulia. Includes symptoms, diagnostic steps, tools required, and repair procedures."
    - Make it compelling and informative

12. **seo_score** (REQUIRED - Integer 1-99):
    - Assess SEO optimization quality:
      * 80-95: Excellent (specific error codes, brand/model, clear search intent, optimized title/description, relevant keywords)
      * 70-79: Good (good keywords, clear intent, decent optimization)
      * 60-69: Average (basic optimization, some keywords)
      * Below 60: Poor (lacks key SEO elements, generic content)
    - Consider: Title quality, description quality, keyword relevance, search intent clarity

13. **content_score** (REQUIRED - Integer 1-99):
    - Assess content quality and usefulness:
      * 85-95: Excellent (highly detailed, step-by-step, accurate, practical, well-structured, comprehensive)
      * 75-84: Good (detailed, clear steps, accurate, useful)
      * 65-74: Average (adequate detail, some steps, basic information)
      * Below 65: Poor (lacks detail, unclear steps, incomplete information)
    - Consider: Detail level, step clarity, accuracy, practical value, structure

14. **safety_warnings** (REQUIRED - Array, minimum 0 items, can be empty if no warnings):
    - Extract from "Safety Warnings" section OR from solution text
    - Look for safety-related warnings, cautions, or important safety notes
    - Include ALL safety warnings mentioned throughout the solution
    - Examples: ["Disconnect battery before working on electrical systems", "Allow engine to cool before opening radiator", "Wear safety glasses when working with chemicals", "Work in well-ventilated area", "Do not smoke near fuel system"]
    - Can be empty array [] if no specific safety warnings are needed
    - NO duplicates - each warning must be unique
    - Be thorough - safety is critical

**CRITICAL REMINDERS:**
- Extract EVERY field - do not skip any
- Arrays must have minimum items as specified
- Strings must never be null (use appropriate defaults if needed)
- Be thorough - scan entire solution for information
- If information is not explicit, make intelligent inferences based on content
- All scores must be realistic integers between 1-99

Return **ONLY valid JSON** (no markdown, no code blocks, no explanations, no additional text).

Example JSON structure (replace with actual extracted values):
{
  "severity": "high",
  "difficulty_level": "medium",
  "error_code": "P0301",
  "affected_component": "Engine",
  "symptoms": ["Check engine light illuminated", "Rough idle", "Engine misfire", "Loss of power", "Poor fuel economy"],
  "diagnostic_steps": ["Scan for error codes using OBD-II scanner", "Check spark plugs for wear or fouling", "Test ignition coils with multimeter", "Inspect spark plug wires", "Check compression in affected cylinder"],
  "tools_required": ["OBD-II scanner", "Spark plug socket set", "Multimeter", "Compression tester", "Socket set", "Torque wrench"],
  "parts_required": ["Spark plugs", "Ignition coils (if defective)"],
  "safety_warnings": ["Disconnect battery before working on electrical systems", "Allow engine to cool before touching components"],
  "estimated_repair_time": "2-4 hours",
  "meta_title": "P0301 Cylinder 1 Misfire Fix - Toyota Corolla Repair",
  "meta_description": "Learn how to diagnose and fix P0301 cylinder 1 misfire in Toyota Corolla. Step-by-step guide with diagnostic procedures and repair instructions.",
  "seo_score": 85,
  "content_score": 88
}`
        : `You are an expert automotive technician and SEO specialist. Generate comprehensive metadata for a car maintenance/repair manual page.

Context: ${context}

Title/Procedure: ${qa.question}
Content: ${qa.answer.substring(0, 2000)}

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
  "meta_title": "How to Change Engine Oil - ${genData?.model || 'Car'} Guide",
  "meta_description": "Step-by-step guide to changing engine oil in ${genData?.model || 'your vehicle'}. Includes tools needed, parts required, and detailed instructions."
}`;

      return {
        custom_id: `metadata-${qa.customId.replace('answer-', '')}`,
        method: 'POST',
        url: '/v1/chat/completions',
        body: {
          model: MODEL_METADATA,
          messages: [
            {
              role: 'system',
              content: 'You are an expert at extracting structured metadata from automotive technical content. Always return valid JSON only. Be precise with scores and ensure all required fields are present.'
            },
            {
              role: 'user',
              content: metadataPrompt
            }
          ],
          temperature: 0.2,
          max_tokens: 2500, // Increased to ensure all fields are extracted
          response_format: { type: 'json_object' }
        }
      };
    });

    // Save metadata JSONL file - write directly to avoid "Invalid string length" error for large files
    const timestamp = Date.now();
    const questionsBaseName = questionsFile.name.replace('.jsonl', '').replace(/[^a-zA-Z0-9-_]/g, '_');
    const metadataFilename = `metadata-${questionsBaseName}-${timestamp}.jsonl`;
    const publicDir = join(process.cwd(), 'public', 'generated');
    
    try {
      await mkdir(publicDir, { recursive: true });
    } catch (err: any) {
      if (err.code !== 'EEXIST') {
        throw err;
      }
    }

    const metadataFilePath = join(publicDir, metadataFilename);
    
    // Write file in chunks to avoid memory issues with very large files
    return new Promise<NextResponse>((resolve, reject) => {
      const writeStream = createWriteStream(metadataFilePath, { encoding: 'utf-8' });
      let isFirstLine = true;
      
      writeStream.on('error', (err) => {
        reject(new Error(`Failed to write metadata file: ${err.message}`));
      });
      
      writeStream.on('finish', () => {
        // Return example prompts for display
        const exampleQa = qaPairs[0];
        const exampleGenData = exampleQa?.generationId ? generationDataMap.get(exampleQa.generationId) : null;
        const context = exampleGenData 
          ? `This is about ${exampleGenData.brand} ${exampleGenData.model} ${exampleGenData.generation}.`
          : '';
        
        const exampleMetadataPrompt = contentType === 'fault'
          ? `You are an expert automotive technician and SEO specialist. Generate comprehensive metadata for a car fault/solution page.

Context: ${context}

Question/Problem: ${exampleQa?.question || 'Example question'}
Solution: ${exampleQa?.answer?.substring(0, 2000) || 'Example solution'}

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
- content_score: Assess detail level, accuracy, step-by-step clarity, practical value. Comprehensive guides should score 80-95.`
          : `You are an expert automotive technician and SEO specialist. Generate comprehensive metadata for a car maintenance/repair manual page.

Context: ${context}

Title/Procedure: ${exampleQa?.question || 'Example procedure'}
Content: ${exampleQa?.answer?.substring(0, 2000) || 'Example content'}

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
- Generate meta_title: Include procedure type, brand/model. Keep it concise and search-friendly.`;
        
        const MODEL_METADATA = 'gpt-4o-mini-2024-07-18';
        
        resolve(NextResponse.json({
          success: true,
          statistics: {
            totalQuestions,
            totalAnswers,
            successfulPairs,
            failedCount,
            missingCount,
            unmatchedQuestions,
            successRate: successRate.toFixed(1) + '%',
          },
          fileUrl: `/generated/${metadataFilename}`,
          filename: metadataFilename,
          count: batchJsonlLines.length,
          qaPairsCount: qaPairs.length,
          prompts: {
            systemPrompt: 'You are an expert at extracting structured metadata from automotive technical content. Always return valid JSON only. Be precise with scores and ensure all required fields are present.',
            exampleUserPrompt: exampleMetadataPrompt,
            model: MODEL_METADATA,
            temperature: 0.2,
            maxTokens: 1500,
            responseFormat: 'json_object',
            generationContext: exampleGenData ? {
              brand: exampleGenData.brand,
              model: exampleGenData.model,
              generation: exampleGenData.generation,
            } : null,
          },
        }));
      });
      
      // Write lines one by one to avoid creating a huge string in memory
      for (let i = 0; i < batchJsonlLines.length; i++) {
        const line = JSON.stringify(batchJsonlLines[i]);
        if (!isFirstLine) {
          writeStream.write('\n');
        }
        writeStream.write(line);
        isFirstLine = false;
      }
      
      writeStream.end();
    });
  } catch (error) {
    console.error('Build metadata JSONL error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

