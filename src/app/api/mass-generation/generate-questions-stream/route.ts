import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export const runtime = 'nodejs';
export const maxDuration = 600; // 10 minutes

const OPENAI_API_URL = 'https://api.openai.com/v1';

// Fixed batch size - exactly 50 questions per API call as requested
const BATCH_SIZE = 50; // Fixed at 50 questions per API call
const PARALLEL_GENERATIONS = 5; // Process 5 generations in parallel
const PARALLEL_BATCHES_PER_GENERATION = 3; // Process 3 batches per generation in parallel
const DELAY_BETWEEN_BATCHES = 200; // Reduced delay for faster processing

// Quality thresholds - relaxed for better results
const MIN_QUESTION_LENGTH = 10; // Minimum characters (reduced further for edge cases)
const MAX_QUESTION_LENGTH = 250; // Maximum characters (increased from 200)
const MIN_WORDS = 2; // Minimum words (reduced further for edge cases)
const MAX_WORDS = 35; // Maximum words (increased from 30)

// Question validation and cleaning
function validateAndCleanQuestion(question: string, brand: string, model: string, generation: string): { valid: boolean; cleaned: string; reason?: string } {
  let cleaned = question.trim();
  
  // Remove numbering (1., 2., etc.)
  cleaned = cleaned.replace(/^\d+[\.\)]\s*/, '');
  
  // Remove common prefixes
  cleaned = cleaned.replace(/^(Question|Frage|Q|A):\s*/i, '');
  
  // Remove quotes
  cleaned = cleaned.replace(/^["']|["']$/g, '');
  
  // Remove trailing punctuation that shouldn't be there
  cleaned = cleaned.replace(/[;:]+$/, '');
  
  cleaned = cleaned.trim();
  
  // Length checks
  if (cleaned.length < MIN_QUESTION_LENGTH) {
    return { valid: false, cleaned, reason: `Too short (${cleaned.length} < ${MIN_QUESTION_LENGTH} chars)` };
  }
  if (cleaned.length > MAX_QUESTION_LENGTH) {
    return { valid: false, cleaned, reason: `Too long (${cleaned.length} > ${MAX_QUESTION_LENGTH} chars)` };
  }
  
  // Word count checks
  const words = cleaned.split(/\s+/).filter(w => w.length > 0);
  if (words.length < MIN_WORDS) {
    return { valid: false, cleaned, reason: `Too few words (${words.length} < ${MIN_WORDS})` };
  }
  if (words.length > MAX_WORDS) {
    return { valid: false, cleaned, reason: `Too many words (${words.length} > ${MAX_WORDS})` };
  }
  
  // Check for generic questions (not specific to model/generation)
  const brandLower = brand.toLowerCase();
  const modelLower = model.toLowerCase();
  const generationLower = generation.toLowerCase();
  const questionLower = cleaned.toLowerCase();
  
  // Must contain at least brand or model name (unless it's a very specific technical question)
  const hasBrand = questionLower.includes(brandLower);
  const hasModel = questionLower.includes(modelLower);
  const hasGeneration = questionLower.includes(generationLower);
  
  // Allow questions without brand/model if they contain technical terms (error codes, parts, etc.)
  const technicalTerms = /\b(p\d{4}|error code|fault code|warning light|check engine|transmission|engine|brake|battery|electrical|sensor|ecu|obd|problem|issue|fault|error|fix|repair|replace|diagnose)\b/i;
  const hasTechnicalTerm = technicalTerms.test(cleaned);
  
  // Check for too generic patterns (but allow if technical or if question is reasonably specific)
  const genericPatterns = [
    /^what is/i,
    /^how does/i,
    /^tell me about/i,
    /^explain/i,
    /^describe/i,
  ];
  
  const isGeneric = genericPatterns.some(pattern => pattern.test(cleaned)) && !hasBrand && !hasModel && !hasTechnicalTerm;
  // Only reject if it's clearly generic AND doesn't have technical terms AND is very short
  if (isGeneric && cleaned.length < 30) {
    return { valid: false, cleaned, reason: 'Too generic, not specific to model' };
  }
  
  // If no brand/model but has technical term, allow it (might be a general technical question that applies)
  // This is more lenient for edge cases
  
  // Check for question mark (should be a question)
  if (!cleaned.includes('?') && !cleaned.match(/\b(how|what|why|when|where|which|who)\b/i)) {
    // Not a question format, but might be acceptable for search queries
    // Allow it but mark as potentially less ideal
  }
  
  // Check for empty or whitespace-only
  if (!cleaned || cleaned.length === 0) {
    return { valid: false, cleaned, reason: 'Empty after cleaning' };
  }
  
  return { valid: true, cleaned };
}

// Calculate similarity between two questions (simple Levenshtein-based)
function calculateSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const distance = levenshteinDistance(longer.toLowerCase(), shorter.toLowerCase());
  return (longer.length - distance) / longer.length;
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

// Check if question is too similar to existing ones
function isTooSimilar(question: string, existingQuestions: string[], threshold: number = 0.85): boolean {
  const normalized = question.toLowerCase().trim();
  
  for (const existing of existingQuestions) {
    const similarity = calculateSimilarity(normalized, existing.toLowerCase().trim());
    if (similarity >= threshold) {
      return true;
    }
  }
  
  return false;
}

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(supabaseUrl, supabaseKey);
}

function getOpenAIApiKey() {
  const apiKey = process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('Missing OpenAI API key');
  }
  return apiKey;
}

// Helper to send progress update
function sendProgress(data: any) {
  return `data: ${JSON.stringify(data)}\n\n`;
}

// Wrapper function that calls the appropriate generation function with generationId tracking
async function generateQuestionsForGeneration(
  brand: string, 
  model: string, 
  generation: string, 
  generationCode: string | null, 
  totalCount: number, 
  language: 'en' | 'de',
  apiKey: string,
  existingQuestions: Set<string>,
  sendUpdate: (data: any) => void,
  generationId: string,
  contentType: 'fault' | 'manual' = 'fault'
): Promise<string[]> {
  // Create a wrapper for sendUpdate that includes generationId
  const wrappedSendUpdate = (data: any) => {
    const dataWithGenerationId = {
      ...data,
      generationId,
      generationName: `${brand} ${model} ${generation}`,
    };
    sendUpdate(dataWithGenerationId);
  };

  // Get Supabase client for loading prompts
  const supabase = getSupabaseClient();

  if (contentType === 'fault') {
    return await generateFaultQuestionsImproved(
      brand,
      model,
      generation,
      generationCode,
      totalCount,
      language,
      apiKey,
      existingQuestions,
      wrappedSendUpdate,
      generationId,
      supabase
    );
  } else {
    return await generateManualQuestionsImproved(
      brand,
      model,
      generation,
      generationCode,
      totalCount,
      language,
      apiKey,
      existingQuestions,
      wrappedSendUpdate,
      generationId,
      supabase
    );
  }
}

// Load prompts from database for a generation
async function loadGenerationPrompts(
  supabase: any,
  generationId: string,
  contentType: 'fault' | 'manual',
  language: 'en' | 'de'
): Promise<Array<{
  prompt_order: number;
  system_prompt: string;
  user_prompt_template: string;
  model: string;
  temperature: number;
  max_tokens: number;
}>> {
  try {
    const { data, error } = await supabase
      .from('generation_prompts')
      .select('prompt_order, system_prompt, user_prompt_template, model, temperature, max_tokens')
      .eq('generation_id', generationId)
      .eq('content_type', contentType)
      .eq('language', language)
      .eq('is_active', true)
      .order('prompt_order');
    
    if (error) {
      console.error('Error loading prompts:', error);
      return [];
    }
    
    return data || [];
  } catch (err) {
    console.error('Error loading prompts:', err);
    return [];
  }
}

// Get prompt for a specific batch (rotates every 5 batches)
function getPromptForBatch(
  prompts: Array<{ prompt_order: number; system_prompt: string; user_prompt_template: string; model: string; temperature: number; max_tokens: number }>,
  batchNumber: number,
  brand: string,
  model: string,
  generation: string,
  generationCode: string | null,
  totalBatches: number
): {
  systemPrompt: string;
  userPrompt: string;
  model: string;
  temperature: number;
  maxTokens: number;
} {
  // If no custom prompts, return default
  if (prompts.length === 0) {
    return {
      systemPrompt: '',
      userPrompt: '',
      model: 'gpt-4o-mini',
      temperature: 0.8,
      maxTokens: 4000,
    };
  }
  
  // Rotate prompt every 5 batches: batch 1-5 use prompt 1, batch 6-10 use prompt 2, etc.
  const promptIndex = Math.floor((batchNumber - 1) / 5) % prompts.length;
  const selectedPrompt = prompts[promptIndex];
  
  // Replace placeholders in user prompt template
  const userPrompt = selectedPrompt.user_prompt_template
    .replace(/{brand}/g, brand)
    .replace(/{model}/g, model)
    .replace(/{generation}/g, generation)
    .replace(/{generationCode}/g, generationCode || '')
    .replace(/{batchNumber}/g, batchNumber.toString())
    .replace(/{totalBatches}/g, totalBatches.toString());
  
  return {
    systemPrompt: selectedPrompt.system_prompt,
    userPrompt,
    model: selectedPrompt.model,
    temperature: selectedPrompt.temperature,
    maxTokens: selectedPrompt.max_tokens,
  };
}

// Improved fault question generation with detailed progress
async function generateFaultQuestionsImproved(
  brand: string, 
  model: string, 
  generation: string, 
  generationCode: string | null, 
  count: number, 
  language: 'en' | 'de',
  apiKey: string,
  existingQuestions: Set<string>,
  sendUpdate: (data: any) => void,
  generationId?: string,
  supabase?: any
): Promise<string[]> {
  const yearRange = generationCode ? ` (${generationCode})` : '';
  
  // Load custom prompts from database if generationId and supabase are provided
  let customPrompts: Array<{ prompt_order: number; system_prompt: string; user_prompt_template: string; model: string; temperature: number; max_tokens: number }> = [];
  if (generationId && supabase) {
    customPrompts = await loadGenerationPrompts(supabase, generationId, 'fault', language);
  }
  
  // Create a list of existing questions (normalized) to avoid duplicates
  const existingQuestionsList = Array.from(existingQuestions).slice(-200);
  
  // Default context prompt (used if no custom prompts)
  const defaultContextPrompt = language === 'en'
    ? `Generate the ${count} MOST SEARCHED and COMMON problems, faults, and issues for ${brand} ${model} ${generation}${yearRange}. 

CRITICAL REQUIREMENTS:
1. Focus on REAL-WORLD problems that car owners ACTUALLY search for online (use search volume data if possible)
2. Prioritize the MOST FREQUENTLY ASKED questions first
3. Each question must be SPECIFIC to this exact model and generation - include model name or generation when relevant
4. Include common error codes (P-codes, manufacturer codes) when relevant
5. Cover: engine issues, transmission problems, electrical faults, warning lights, error codes, common breakdowns, performance issues, diagnostic problems, and maintenance issues
6. Questions should be in natural search query format (how people actually search)
7. NO duplicates or similar questions to these existing ones: ${existingQuestionsList.length > 0 ? existingQuestionsList.slice(0, 50).join('; ') : 'none'}
8. Rank by search frequency - most searched first
9. Each question must be 20-200 characters, 4-30 words, and be a complete, searchable query
10. Avoid generic questions like "What is..." or "How does..." unless they're very specific to this model
11. Use natural language - how real people would search Google or forums

EXAMPLES OF GOOD QUESTIONS:
- "Why does my ${brand} ${model} ${generation} check engine light come on?"
- "${brand} ${model} ${generation} transmission slipping symptoms"
- "How to fix P0301 code ${brand} ${model} ${generation}"
- "${brand} ${model} ${generation} battery drain issue"
- "Common electrical problems ${brand} ${model} ${generation}"

EXAMPLES OF BAD QUESTIONS (AVOID):
- "What is a car?" (too generic)
- "Engine" (too short, not a question)
- "Tell me about cars" (not specific, too generic)

Format: One problem/question per line, no numbering, no prefixes, clear and searchable. Natural language as people would search.`
    : `Generiere die ${count} AM HÄUFIGSTEN GESUCHTEN und HÄUFIGSTEN Probleme, Fehler und Probleme für ${brand} ${model} ${generation}${yearRange}.

KRITISCHE ANFORDERUNGEN:
1. Konzentriere dich auf REALE Probleme, die Autobesitzer TATSÄCHLICH online suchen (verwende Suchvolumen-Daten wenn möglich)
2. Priorisiere die AM HÄUFIGSTEN GESTELLTEN Fragen zuerst
3. Jede Frage muss SPEZIFISCH für dieses genaue Modell und diese Generation sein
4. Beziehe häufige Fehlercodes (P-Codes, Herstellercodes) ein, wenn relevant
5. Abdecken: Motorprobleme, Getriebeprobleme, elektrische Fehler, Warnleuchten, Fehlercodes, häufige Pannen, Leistungsprobleme, Diagnoseprobleme und Wartungsprobleme
6. Fragen sollten im natürlichen Suchanfrage-Format sein (wie Menschen tatsächlich suchen)
7. KEINE Duplikate oder ähnliche Fragen zu diesen bestehenden: ${existingQuestionsList.length > 0 ? existingQuestionsList.slice(0, 50).join('; ') : 'keine'}
8. Sortiere nach Suchhäufigkeit - am häufigsten gesucht zuerst

Format: Ein Problem/Frage pro Zeile, keine Nummerierung, klar und durchsuchbar. Natürliche Sprache wie Menschen suchen würden.`;

  const batches = Math.ceil(count / BATCH_SIZE);
  const allQuestions: string[] = [];
  let totalApiCalls = 0;

  sendUpdate({
    type: 'generation_start',
    brand,
    model,
    generation,
    totalBatches: batches,
    batchSize: BATCH_SIZE,
    totalQuestions: count,
    prompt: customPrompts.length > 0 
      ? `Using ${customPrompts.length} custom prompts (rotating every 5 batches)` 
      : (defaultContextPrompt.substring(0, 500) + '...'), // Preview of prompt
    generationId: '', // Will be added by wrapper
  });

  for (let i = 0; i < batches; i++) {
    const batchNumber = i + 1;
    const batchCount = i === batches - 1 ? count - (i * BATCH_SIZE) : BATCH_SIZE;
    
    // Get prompt for this batch (rotates every 5 batches)
    let systemPrompt: string;
    let userPrompt: string;
    let modelToUse: string;
    let temperatureToUse: number;
    let maxTokensToUse: number;
    
    if (customPrompts.length > 0) {
      // Use custom prompts from database
      const promptData = getPromptForBatch(customPrompts, batchNumber, brand, model, generation, generationCode, batches);
      systemPrompt = promptData.systemPrompt;
      userPrompt = promptData.userPrompt;
      modelToUse = promptData.model;
      temperatureToUse = promptData.temperature;
      maxTokensToUse = promptData.maxTokens;
      
      // Add batch-specific instructions to user prompt
      userPrompt = `${userPrompt}

Generate exactly ${batchCount} unique questions. Do not repeat questions from previous batches or from the existing questions list. Each question must be distinct and specific to ${brand} ${model} ${generation}${yearRange}.`;
    } else {
      // Use default prompts
      const batchPrompt = `${defaultContextPrompt} 

Generate exactly ${batchCount} unique questions. Do not repeat questions from previous batches or from the existing questions list. Each question must be distinct and specific to ${brand} ${model} ${generation}${yearRange}.`;

      systemPrompt = language === 'de'
        ? `Du bist ein Experte für Automobil-Suchanfragen und technische Wissensdatenbanken. Du kennst die am häufigsten gesuchten Probleme für jedes Automodell. Generiere ${batchCount} hochwertige, einzigartige, präzise, technische Fragen zum Thema: "${batchPrompt}". 

WICHTIG: 
- Priorisiere Fragen nach Suchhäufigkeit (meistgesucht zuerst)
- Verwende natürliche Suchanfrage-Formulierungen
- Jede Frage muss spezifisch für dieses Modell/Generation sein
- Keine Wiederholungen oder ähnliche Fragen
- Gib nur die Fragen aus, eine pro Zeile, mit normalen Leerzeichen und korrekter Formatierung. Keine Nummerierung, keine Antworten, keine Wiederholungen, keine Einleitung, keine doppelten Fragen. Schreibe normale, lesbare Sätze wie Menschen sie suchen würden.`
        : `You are an expert in automotive search queries and technical knowledge bases. You know the most frequently searched problems for each car model. Generate ${batchCount} high-quality, unique, precise, technical questions about: "${batchPrompt}".

IMPORTANT:
- Prioritize questions by search frequency (most searched first)
- Use natural search query formulations
- Each question must be specific to this model/generation
- No repetitions or similar questions
- Output only the questions, one per line, with proper spacing and normal sentence formatting. No numbering, no answers, no introduction, no duplicates. Write normal, readable sentences as people would search for them.`;
      
      userPrompt = batchPrompt;
      modelToUse = 'gpt-4o-mini';
      temperatureToUse = 0.8;
      maxTokensToUse = 4000;
    }

    // Send API call details
    sendUpdate({
      type: 'api_call_start',
      batchNumber,
      totalBatches: batches,
      batchSize: batchCount,
      model: modelToUse,
      temperature: temperatureToUse,
      maxTokens: maxTokensToUse,
      systemPrompt: systemPrompt,
      userPrompt: userPrompt,
      fullPrompt: `${systemPrompt}\n\n${userPrompt}`,
    });

    let response: Response | null = null;
    let lastError: Error | null = null;
    const maxRetries = 5;
    const retryDelay = 2000;
    const startTime = Date.now();
    
    for (let retry = 0; retry < maxRetries; retry++) {
      try {
        response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: modelToUse,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
            temperature: temperatureToUse,
            max_tokens: maxTokensToUse,
          }),
        });

        const responseTime = Date.now() - startTime;
        totalApiCalls++;

        if (!response.ok && (response.status >= 500 || response.status === 429)) {
          let errorText = '';
          try {
            errorText = await response.text();
          } catch (e) {
            errorText = `Status ${response.status}`;
          }
          lastError = new Error(`Failed to generate questions batch ${batchNumber} (attempt ${retry + 1}/${maxRetries}): ${response.status} ${errorText.substring(0, 200)}`);
          
          sendUpdate({
            type: 'api_call_retry',
            batchNumber,
            attempt: retry + 1,
            maxRetries,
            error: errorText.substring(0, 200),
            responseTime,
          });
          
          if (retry < maxRetries - 1) {
            const delay = retryDelay * Math.pow(2, retry);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
        } else if (!response.ok) {
          let errorText = '';
          try {
            errorText = await response.text();
          } catch (e) {
            errorText = `Status ${response.status}`;
          }
          throw new Error(`Failed to generate questions batch ${batchNumber}: ${response.status} ${errorText.substring(0, 200)}`);
        } else {
          break;
        }
      } catch (err: any) {
        lastError = err;
        const errorMsg = err.message || String(err);
        const shouldRetry = retry < maxRetries - 1 && (
          errorMsg.includes('fetch') || 
          errorMsg.includes('network') || 
          errorMsg.includes('ECONNREFUSED') || 
          errorMsg.includes('502') || 
          errorMsg.includes('Bad Gateway') ||
          errorMsg.includes('503') ||
          errorMsg.includes('504') ||
          errorMsg.includes('timeout')
        );
        
        if (shouldRetry) {
          const delay = retryDelay * Math.pow(2, retry);
          sendUpdate({
            type: 'api_call_retry',
            batchNumber,
            attempt: retry + 1,
            maxRetries,
            error: errorMsg.substring(0, 200),
          });
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        if (retry === maxRetries - 1) {
          throw lastError || err;
        }
      }
    }

    if (!response || !response.ok) {
      throw lastError || new Error(`Failed to generate questions batch ${batchNumber} after ${maxRetries} attempts`);
    }

    const responseTime = Date.now() - startTime;
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim();
    
    if (!content) {
      throw new Error(`No questions generated in batch ${batchNumber}`);
    }

    // Parse and validate questions
    const rawQuestions = content
      .split('\n')
      .map((line: string) => line.trim())
      .filter((line: string) => line.length > 0 && !line.match(/^\d+[\.\)]/));
    
    const validQuestions: string[] = [];
    const invalidQuestions: Array<{ question: string; reason: string }> = [];
    const existingQuestionsArray = Array.from(existingQuestions);
    
    for (const rawQ of rawQuestions) {
      // Validate and clean
      const validation = validateAndCleanQuestion(rawQ, brand, model, generation);
      
      if (!validation.valid) {
        invalidQuestions.push({ question: rawQ, reason: validation.reason || 'Invalid' });
        continue;
      }
      
      const cleaned = validation.cleaned;
      const normalized = cleaned.toLowerCase().trim();
      
      // Check exact duplicate
      if (existingQuestions.has(normalized)) {
        invalidQuestions.push({ question: cleaned, reason: 'Exact duplicate' });
        continue;
      }
      
      // Check similarity (only check against recent questions for performance)
      const recentQuestions = existingQuestionsArray.slice(-100);
      if (isTooSimilar(cleaned, recentQuestions, 0.85)) {
        invalidQuestions.push({ question: cleaned, reason: 'Too similar to existing question' });
        continue;
      }
      
      validQuestions.push(cleaned);
      existingQuestions.add(normalized);
    }
    
    // Report validation results
    sendUpdate({
      type: 'validation_results',
      batchNumber,
      valid: validQuestions.length,
      invalid: invalidQuestions.length,
      invalidReasons: invalidQuestions.slice(0, 10).map(iq => `${iq.question.substring(0, 50)}... (${iq.reason})`),
    });
    
    allQuestions.push(...validQuestions);

    sendUpdate({
      type: 'api_call_complete',
      batchNumber,
      totalBatches: batches,
      questionsGenerated: validQuestions.length,
      rawQuestionsGenerated: rawQuestions.length,
      invalidQuestions: invalidQuestions.length,
      totalQuestionsSoFar: allQuestions.length,
      responseTime,
      tokensUsed: data.usage?.total_tokens || 0,
      promptTokens: data.usage?.prompt_tokens || 0,
      completionTokens: data.usage?.completion_tokens || 0,
    });
    
    // If we got too few valid questions, we might need to generate more
    if (validQuestions.length < batchCount * 0.7 && i < batches - 1) {
      sendUpdate({
        type: 'low_quality_batch',
        batchNumber,
        validQuestions: validQuestions.length,
        expected: batchCount,
        warning: 'Low quality batch - many questions were filtered',
      });
    }

    if (i < batches - 1) {
      await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
    }
  }

  // Final deduplication and similarity check
  const uniqueQuestions: string[] = [];
  const seenNormalized = new Set<string>();
  const validationReasons: string[] = [];
  
  for (const question of allQuestions) {
    const cleaned = question.trim();
    if (!cleaned) {
      validationReasons.push('Empty after trim');
      continue;
    }
    
    const normalized = cleaned.toLowerCase().trim();
    
    // Skip exact duplicates
    if (seenNormalized.has(normalized)) {
      validationReasons.push('Exact duplicate');
      continue;
    }
    
    // Check similarity against already accepted questions (relax threshold if we have few questions)
    const similarityThreshold = uniqueQuestions.length < count * 0.5 ? 0.90 : 0.80;
    if (isTooSimilar(cleaned, uniqueQuestions, similarityThreshold)) {
      validationReasons.push('Too similar');
      continue;
    }
    
    // Final validation (relax validation if we have few questions)
    const validation = validateAndCleanQuestion(cleaned, brand, model, generation);
    if (!validation.valid) {
      validationReasons.push(validation.reason || 'Invalid');
      // If we have very few questions and this is close to valid, try to accept it anyway
      if (uniqueQuestions.length === 0 && allQuestions.length <= 3 && cleaned.length >= 10) {
        // Accept the cleaned version even if validation failed, but log it
        sendUpdate({
          type: 'validation_warning',
          warning: `Accepting question despite validation failure: ${validation.reason}`,
          question: validation.cleaned.substring(0, 100),
        });
        uniqueQuestions.push(validation.cleaned);
        seenNormalized.add(normalized);
        continue;
      }
      continue;
    }
    
    uniqueQuestions.push(validation.cleaned);
    seenNormalized.add(normalized);
    
    if (uniqueQuestions.length >= count) break;
  }
  
  const finalQuestions = uniqueQuestions.slice(0, count);
  
  // If we got no questions but had raw questions, send a warning with reasons
  if (finalQuestions.length === 0 && allQuestions.length > 0) {
    const reasonCounts = validationReasons.reduce((acc, reason) => {
      acc[reason] = (acc[reason] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    sendUpdate({
      type: 'validation_summary',
      totalRaw: allQuestions.length,
      totalValid: 0,
      rejectionReasons: reasonCounts,
      warning: 'All questions were filtered by validation. Consider relaxing validation rules.',
    });
  }
  
  sendUpdate({
    type: 'final_deduplication',
    before: allQuestions.length,
    after: finalQuestions.length,
    removed: allQuestions.length - finalQuestions.length,
  });

  sendUpdate({
    type: 'generation_complete',
    brand,
    model,
    generation,
    totalQuestions: finalQuestions.length,
    totalApiCalls,
    duplicatesRemoved: allQuestions.length - finalQuestions.length,
  });

  return finalQuestions;
}

// Improved manual question generation with detailed progress
async function generateManualQuestionsImproved(
  brand: string, 
  model: string, 
  generation: string, 
  generationCode: string | null, 
  count: number, 
  language: 'en' | 'de',
  apiKey: string,
  existingQuestions: Set<string>,
  sendUpdate: (data: any) => void,
  generationId?: string,
  supabase?: any
): Promise<string[]> {
  const yearRange = generationCode ? ` (${generationCode})` : '';
  
  // Load custom prompts from database if generationId and supabase are provided
  let customPrompts: Array<{ prompt_order: number; system_prompt: string; user_prompt_template: string; model: string; temperature: number; max_tokens: number }> = [];
  if (generationId && supabase) {
    customPrompts = await loadGenerationPrompts(supabase, generationId, 'manual', language);
  }
  
  const existingQuestionsList = Array.from(existingQuestions).slice(-200);
  
  // Default context prompt (used if no custom prompts)
  const defaultContextPrompt = language === 'en'
    ? `Generate the ${count} MOST SEARCHED and COMMON maintenance procedures, repair guides, and how-to instructions for ${brand} ${model} ${generation}${yearRange}.

CRITICAL REQUIREMENTS:
1. Focus on REAL-WORLD procedures that car owners ACTUALLY search for online (use search volume data if possible)
2. Prioritize the MOST FREQUENTLY ASKED questions first
3. Each instruction must be SPECIFIC to this exact model and generation
4. Cover: oil changes, brake pad replacement, filter changes, fluid top-ups, part replacements, diagnostic procedures, routine maintenance, DIY repairs
5. Instructions should be in natural search query format (how people actually search)
6. NO duplicates or similar questions to these existing ones: ${existingQuestionsList.length > 0 ? existingQuestionsList.slice(0, 50).join('; ') : 'none'}
7. Rank by search frequency - most searched first

Format: One instruction/guide per line, no numbering, clear and actionable. Natural language as people would search.`
    : `Generiere die ${count} AM HÄUFIGSTEN GESUCHTEN und HÄUFIGSTEN Wartungsverfahren, Reparaturanleitungen und Anleitungen für ${brand} ${model} ${generation}${yearRange}.

KRITISCHE ANFORDERUNGEN:
1. Konzentriere dich auf REALE Verfahren, die Autobesitzer TATSÄCHLICH online suchen (verwende Suchvolumen-Daten wenn möglich)
2. Priorisiere die AM HÄUFIGSTEN GESTELLTEN Fragen zuerst
3. Jede Anleitung muss SPEZIFISCH für dieses genaue Modell und diese Generation sein
4. Abdecken: Ölwechsel, Bremsbelagwechsel, Filterwechsel, Flüssigkeitsnachfüllung, Teilewechsel, Diagnoseverfahren, routinemäßige Wartung, DIY-Reparaturen
5. Anleitungen sollten im natürlichen Suchanfrage-Format sein (wie Menschen tatsächlich suchen)
6. KEINE Duplikate oder ähnliche Fragen zu diesen bestehenden: ${existingQuestionsList.length > 0 ? existingQuestionsList.slice(0, 50).join('; ') : 'keine'}
7. Sortiere nach Suchhäufigkeit - am häufigsten gesucht zuerst

Format: Eine Anleitung/Leitfaden pro Zeile, keine Nummerierung, klar und umsetzbar. Natürliche Sprache wie Menschen suchen würden.`;

  const batches = Math.ceil(count / BATCH_SIZE);
  const allQuestions: string[] = [];
  let totalApiCalls = 0;

  sendUpdate({
    type: 'generation_start',
    brand,
    model,
    generation,
    totalBatches: batches,
    batchSize: BATCH_SIZE,
    totalQuestions: count,
    prompt: customPrompts.length > 0 
      ? `Using ${customPrompts.length} custom prompts (rotating every 5 batches)` 
      : (defaultContextPrompt.substring(0, 500) + '...'),
  });

  for (let i = 0; i < batches; i++) {
    const batchNumber = i + 1;
    const batchCount = i === batches - 1 ? count - (i * BATCH_SIZE) : BATCH_SIZE;
    
    // Get prompt for this batch (rotates every 5 batches)
    let systemPrompt: string;
    let userPrompt: string;
    let modelToUse: string;
    let temperatureToUse: number;
    let maxTokensToUse: number;
    
    if (customPrompts.length > 0) {
      // Use custom prompts from database
      const promptData = getPromptForBatch(customPrompts, batchNumber, brand, model, generation, generationCode, batches);
      systemPrompt = promptData.systemPrompt;
      userPrompt = promptData.userPrompt;
      modelToUse = promptData.model;
      temperatureToUse = promptData.temperature;
      maxTokensToUse = promptData.maxTokens;
      
      // Add batch-specific instructions to user prompt
      userPrompt = `${userPrompt}

Generate exactly ${batchCount} unique questions. Do not repeat questions from previous batches or from the existing questions list. Each question must be distinct and specific to ${brand} ${model} ${generation}${yearRange}.`;
    } else {
      // Use default prompts
      const batchPrompt = `${defaultContextPrompt} 

Generate exactly ${batchCount} unique questions. Do not repeat questions from previous batches or from the existing questions list. Each question must be distinct and specific to ${brand} ${model} ${generation}${yearRange}.`;

      systemPrompt = language === 'de'
        ? `Du bist ein Experte für Automobil-Suchanfragen und technische Wissensdatenbanken. Du kennst die am häufigsten gesuchten Wartungsverfahren für jedes Automodell. Generiere ${batchCount} hochwertige, einzigartige, präzise, technische Fragen zum Thema: "${batchPrompt}". 

WICHTIG: 
- Priorisiere Fragen nach Suchhäufigkeit (meistgesucht zuerst)
- Verwende natürliche Suchanfrage-Formulierungen
- Jede Frage muss spezifisch für dieses Modell/Generation sein
- Keine Wiederholungen oder ähnliche Fragen
- Gib nur die Fragen aus, eine pro Zeile, mit normalen Leerzeichen und korrekter Formatierung. Keine Nummerierung, keine Antworten, keine Wiederholungen, keine Einleitung, keine doppelten Fragen. Schreibe normale, lesbare Sätze wie Menschen sie suchen würden.`
        : `You are an expert in automotive search queries and technical knowledge bases. You know the most frequently searched maintenance procedures for each car model. Generate ${batchCount} high-quality, unique, precise, technical questions about: "${batchPrompt}".

IMPORTANT:
- Prioritize questions by search frequency (most searched first)
- Use natural search query formulations
- Each question must be specific to this model/generation
- No repetitions or similar questions
- Output only the questions, one per line, with proper spacing and normal sentence formatting. No numbering, no answers, no introduction, no duplicates. Write normal, readable sentences as people would search for them.`;
      
      userPrompt = batchPrompt;
      modelToUse = 'gpt-4o-mini';
      temperatureToUse = 0.8;
      maxTokensToUse = 4000;
    }

    sendUpdate({
      type: 'api_call_start',
      batchNumber,
      totalBatches: batches,
      batchSize: batchCount,
      model: modelToUse,
      temperature: temperatureToUse,
      maxTokens: maxTokensToUse,
      systemPrompt: systemPrompt,
      userPrompt: userPrompt,
      fullPrompt: `${systemPrompt}\n\n${userPrompt}`,
    });

    let response: Response | null = null;
    let lastError: Error | null = null;
    const maxRetries = 5;
    const retryDelay = 2000;
    const startTime = Date.now();
    
    for (let retry = 0; retry < maxRetries; retry++) {
      try {
        response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: systemPrompt },
            ],
            temperature: 0.8,
            max_tokens: 4000,
          }),
        });

        const responseTime = Date.now() - startTime;
        totalApiCalls++;

        if (!response.ok && (response.status >= 500 || response.status === 429)) {
          let errorText = '';
          try {
            errorText = await response.text();
          } catch (e) {
            errorText = `Status ${response.status}`;
          }
          lastError = new Error(`Failed to generate questions batch ${i + 1} (attempt ${retry + 1}/${maxRetries}): ${response.status} ${errorText.substring(0, 200)}`);
          
          sendUpdate({
            type: 'api_call_retry',
            batchNumber: i + 1,
            attempt: retry + 1,
            maxRetries,
            error: errorText.substring(0, 200),
            responseTime,
          });
          
          if (retry < maxRetries - 1) {
            const delay = retryDelay * Math.pow(2, retry);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
        } else if (!response.ok) {
          let errorText = '';
          try {
            errorText = await response.text();
          } catch (e) {
            errorText = `Status ${response.status}`;
          }
          throw new Error(`Failed to generate questions batch ${i + 1}: ${response.status} ${errorText.substring(0, 200)}`);
        } else {
          break;
        }
      } catch (err: any) {
        lastError = err;
        const errorMsg = err.message || String(err);
        const shouldRetry = retry < maxRetries - 1 && (
          errorMsg.includes('fetch') || 
          errorMsg.includes('network') || 
          errorMsg.includes('ECONNREFUSED') || 
          errorMsg.includes('502') || 
          errorMsg.includes('Bad Gateway') ||
          errorMsg.includes('503') ||
          errorMsg.includes('504') ||
          errorMsg.includes('timeout')
        );
        
        if (shouldRetry) {
          const delay = retryDelay * Math.pow(2, retry);
          sendUpdate({
            type: 'api_call_retry',
            batchNumber: i + 1,
            attempt: retry + 1,
            maxRetries,
            error: errorMsg.substring(0, 200),
          });
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        if (retry === maxRetries - 1) {
          throw lastError || err;
        }
      }
    }

    if (!response || !response.ok) {
      throw lastError || new Error(`Failed to generate questions batch ${i + 1} after ${maxRetries} attempts`);
    }

    const responseTime = Date.now() - startTime;
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim();
    
    if (!content) {
      throw new Error(`No questions generated in batch ${i + 1}`);
    }

    // Parse and validate questions (same as fault questions)
    const rawQuestions = content
      .split('\n')
      .map((line: string) => line.trim())
      .filter((line: string) => line.length > 0 && !line.match(/^\d+[\.\)]/));
    
    const validQuestions: string[] = [];
    const invalidQuestions: Array<{ question: string; reason: string }> = [];
    const existingQuestionsArray = Array.from(existingQuestions);
    
    for (const rawQ of rawQuestions) {
      // Validate and clean
      const validation = validateAndCleanQuestion(rawQ, brand, model, generation);
      
      if (!validation.valid) {
        invalidQuestions.push({ question: rawQ, reason: validation.reason || 'Invalid' });
        continue;
      }
      
      const cleaned = validation.cleaned;
      const normalized = cleaned.toLowerCase().trim();
      
      // Check exact duplicate
      if (existingQuestions.has(normalized)) {
        invalidQuestions.push({ question: cleaned, reason: 'Exact duplicate' });
        continue;
      }
      
      // Check similarity (only check against recent questions for performance)
      const recentQuestions = existingQuestionsArray.slice(-100);
      if (isTooSimilar(cleaned, recentQuestions, 0.85)) {
        invalidQuestions.push({ question: cleaned, reason: 'Too similar to existing question' });
        continue;
      }
      
      validQuestions.push(cleaned);
      existingQuestions.add(normalized);
    }
    
    // Report validation results
    sendUpdate({
      type: 'validation_results',
      batchNumber: i + 1,
      valid: validQuestions.length,
      invalid: invalidQuestions.length,
      invalidReasons: invalidQuestions.slice(0, 10).map(iq => `${iq.question.substring(0, 50)}... (${iq.reason})`),
    });
    
    allQuestions.push(...validQuestions);

    sendUpdate({
      type: 'api_call_complete',
      batchNumber: i + 1,
      totalBatches: batches,
      questionsGenerated: validQuestions.length,
      rawQuestionsGenerated: rawQuestions.length,
      invalidQuestions: invalidQuestions.length,
      totalQuestionsSoFar: allQuestions.length,
      responseTime,
      tokensUsed: data.usage?.total_tokens || 0,
      promptTokens: data.usage?.prompt_tokens || 0,
      completionTokens: data.usage?.completion_tokens || 0,
    });
    
    // If we got too few valid questions, we might need to generate more
    if (validQuestions.length < batchCount * 0.7 && i < batches - 1) {
      sendUpdate({
        type: 'low_quality_batch',
        batchNumber: i + 1,
        validQuestions: validQuestions.length,
        expected: batchCount,
        warning: 'Low quality batch - many questions were filtered',
      });
    }

    if (i < batches - 1) {
      await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
    }
  }

  // Final deduplication and similarity check
  const uniqueQuestions: string[] = [];
  const seenNormalized = new Set<string>();
  const validationReasons: string[] = [];
  
  for (const question of allQuestions) {
    const cleaned = question.trim();
    if (!cleaned) {
      validationReasons.push('Empty after trim');
      continue;
    }
    
    const normalized = cleaned.toLowerCase().trim();
    
    // Skip exact duplicates
    if (seenNormalized.has(normalized)) {
      validationReasons.push('Exact duplicate');
      continue;
    }
    
    // Check similarity against already accepted questions (relax threshold if we have few questions)
    const similarityThreshold = uniqueQuestions.length < count * 0.5 ? 0.90 : 0.80;
    if (isTooSimilar(cleaned, uniqueQuestions, similarityThreshold)) {
      validationReasons.push('Too similar');
      continue;
    }
    
    // Final validation (relax validation if we have few questions)
    const validation = validateAndCleanQuestion(cleaned, brand, model, generation);
    if (!validation.valid) {
      validationReasons.push(validation.reason || 'Invalid');
      // If we have very few questions and this is close to valid, try to accept it anyway
      if (uniqueQuestions.length === 0 && allQuestions.length <= 3 && cleaned.length >= 10) {
        // Accept the cleaned version even if validation failed, but log it
        sendUpdate({
          type: 'validation_warning',
          warning: `Accepting question despite validation failure: ${validation.reason}`,
          question: validation.cleaned.substring(0, 100),
        });
        uniqueQuestions.push(validation.cleaned);
        seenNormalized.add(normalized);
        continue;
      }
      continue;
    }
    
    uniqueQuestions.push(validation.cleaned);
    seenNormalized.add(normalized);
    
    if (uniqueQuestions.length >= count) break;
  }
  
  const finalQuestions = uniqueQuestions.slice(0, count);
  
  // If we got no questions but had raw questions, send a warning with reasons
  if (finalQuestions.length === 0 && allQuestions.length > 0) {
    const reasonCounts = validationReasons.reduce((acc, reason) => {
      acc[reason] = (acc[reason] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    sendUpdate({
      type: 'validation_summary',
      totalRaw: allQuestions.length,
      totalValid: 0,
      rejectionReasons: reasonCounts,
      warning: 'All questions were filtered by validation. Consider relaxing validation rules.',
    });
  }
  
  sendUpdate({
    type: 'final_deduplication',
    before: allQuestions.length,
    after: finalQuestions.length,
    removed: allQuestions.length - finalQuestions.length,
  });

  sendUpdate({
    type: 'generation_complete',
    brand,
    model,
    generation,
    totalQuestions: finalQuestions.length,
    totalApiCalls,
    duplicatesRemoved: allQuestions.length - finalQuestions.length,
  });

  return finalQuestions;
}

export async function POST(req: Request) {
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    async start(controller) {
      const sendUpdate = (data: any) => {
        controller.enqueue(encoder.encode(sendProgress(data)));
      };

      try {
        const { brandIds, generationIds, contentType, questionsPerGeneration, language } = await req.json();

        if (!brandIds || !Array.isArray(brandIds) || brandIds.length === 0) {
          controller.enqueue(encoder.encode(sendProgress({ type: 'error', error: 'Missing required parameters: brandIds array' })));
          controller.close();
          return;
        }

        if (!generationIds || !Array.isArray(generationIds) || generationIds.length === 0) {
          controller.enqueue(encoder.encode(sendProgress({ type: 'error', error: 'Missing required parameters: generationIds array' })));
          controller.close();
          return;
        }

        if (!contentType || !questionsPerGeneration) {
          controller.enqueue(encoder.encode(sendProgress({ type: 'error', error: 'Missing contentType or questionsPerGeneration' })));
          controller.close();
          return;
        }

        const totalCount = generationIds.length * questionsPerGeneration;
        if (totalCount > 50000) {
          controller.enqueue(encoder.encode(sendProgress({ type: 'error', error: 'Total questions cannot exceed 50,000' })));
          controller.close();
          return;
        }

        const apiKey = getOpenAIApiKey();
        const supabase = getSupabaseClient();

        sendUpdate({
          type: 'init',
          totalGenerations: generationIds.length,
          questionsPerGeneration,
          totalQuestions: totalCount,
          batchSize: BATCH_SIZE,
          estimatedApiCalls: Math.ceil(questionsPerGeneration / BATCH_SIZE) * generationIds.length,
        });

        // Fetch all brand data
        const { data: brandsData, error: brandsError } = await supabase
          .from('car_brands')
          .select('id, name, slug')
          .in('id', brandIds);

        if (brandsError || !brandsData || brandsData.length !== brandIds.length) {
          controller.enqueue(encoder.encode(sendProgress({ type: 'error', error: 'One or more brands not found' })));
          controller.close();
          return;
        }

        // Fetch all generation data
        const { data: generationsData, error: generationsError } = await supabase
          .from('model_generations')
          .select('id, name, slug, generation_code, car_model_id, car_models!inner(id, name, brand_id, car_brands!inner(id, name))')
          .in('id', generationIds);

        if (generationsError || !generationsData || generationsData.length === 0) {
          controller.enqueue(encoder.encode(sendProgress({ type: 'error', error: 'One or more generations not found' })));
          controller.close();
          return;
        }

        const brandsMap = new Map(brandsData.map(b => [b.id, b]));
        const allGeneratedQuestions = new Set<string>();
        const MODEL_ANSWERS = process.env.BATCH_MODEL_ANSWERS || 'gpt-4o-mini';
        const systemPrompt = contentType === 'fault'
          ? `You are an expert automotive technician and repair specialist. Provide detailed, step-by-step solutions for car problems and maintenance procedures.

Your answers MUST include:
- Detailed step-by-step instructions
- Specific symptoms the user might experience (e.g., "Check engine light", "Rough idle", "Loss of power", "Stalling", "Poor fuel economy")
- Diagnostic steps to identify the problem (e.g., "Scan for error codes", "Check fluid levels", "Inspect components", "Test with multimeter")
- Specific tools required (e.g., "OBD-II scanner", "Multimeter", "Socket set", "Torque wrench", "Fuel pressure gauge")
- Parts/components that may need replacement
- Estimated time for the repair/maintenance
- Safety warnings if applicable

Be technically accurate, specific, and practical. Use proper automotive terminology.
Do not mention AI, do not refer to yourself, and do not simulate a human persona.
Format your response with clear headings and structured steps. Include sections for: Problem Statement, Symptoms, Diagnostic Steps, Repair Instructions, Verification, and Prevention Tips when applicable.`
          : `You are an expert automotive technician and repair specialist. Provide detailed, step-by-step maintenance and repair procedures.

Your answers MUST include:
- Detailed step-by-step instructions
- Specific tools required (e.g., "Socket set", "Torque wrench", "Multimeter", "Drain pan")
- Parts/components needed
- Estimated time for the procedure
- Safety warnings if applicable
- Diagnostic steps if troubleshooting is needed

Be technically accurate, specific, and practical. Use proper automotive terminology.
Do not mention AI, do not refer to yourself, and do not simulate a human persona.
Format your response with clear headings and structured steps. Include sections for: Procedure Overview, Tools Required, Parts Required, Step-by-Step Instructions, Verification, and Safety Tips when applicable.`;

        // Collect all questions as simple text (one question per line)
        const allQuestions: string[] = [];
        let totalApiCalls = 0;
        let totalProcessedGenerations = 0;

        // Process generations in parallel batches
        for (let genBatchStart = 0; genBatchStart < generationsData.length; genBatchStart += PARALLEL_GENERATIONS) {
          const genBatch = generationsData.slice(genBatchStart, genBatchStart + PARALLEL_GENERATIONS);
          
          const generationPromises = genBatch.map(async (generation): Promise<{ generation: any; questions: string[]; brand: any; model: any } | null> => {
            try {
              const model = (generation.car_models as any);
              const brand = brandsMap.get(model.brand_id);
              
              if (!brand || !model) {
                sendUpdate({
                  type: 'generation_skipped',
                  generationId: generation.id,
                  reason: 'Missing brand or model data',
                });
                return null;
              }

              // Generate questions for this generation with proper ID tracking
              const questions = await generateQuestionsForGeneration(
                brand.name, 
                model.name, 
                generation.name, 
                generation.generation_code, 
                questionsPerGeneration, 
                language, 
                apiKey,
                allGeneratedQuestions,
                sendUpdate,
                generation.id,
                contentType
              );

              return { generation, questions, brand, model };
            } catch (error: any) {
              // Log error but don't fail the entire process
              console.error(`[Generate Questions] Error generating questions for generation ${generation.id}:`, error);
              sendUpdate({
                type: 'generation_error',
                generationId: generation.id,
                generationName: `${(generation.car_models as any)?.name || 'Unknown'} ${generation.name}`,
                error: error.message || 'Unknown error',
                warning: 'Generation failed, but continuing with other generations',
              });
              return null; // Return null instead of throwing
            }
          });

          // Use Promise.allSettled instead of Promise.all to handle errors gracefully
          const results = await Promise.allSettled(generationPromises);
          
          // Extract results from settled promises
          const settledResults = results.map((result, idx) => {
            if (result.status === 'fulfilled') {
              if (result.value !== null) {
                totalProcessedGenerations++;
              }
              return result.value;
            } else {
              // Handle rejected promise
              const generation = genBatch[idx];
              console.error(`[Generate Questions] Generation promise rejected for ${generation.id}:`, result.reason);
              sendUpdate({
                type: 'generation_error',
                generationId: generation.id,
                generationName: `${(generation.car_models as any)?.name || 'Unknown'} ${generation.name}`,
                error: result.reason?.message || 'Promise rejected',
                warning: 'Generation promise rejected, but continuing with other generations',
              });
              return null;
            }
          });

          for (const result of settledResults) {
            if (!result || !result.questions || result.questions.length === 0) {
              if (result) {
                const { generation, brand, model } = result;
                sendUpdate({
                  type: 'generation_empty',
                  generationId: generation.id,
                  generationName: `${brand.name} ${model.name} ${generation.name}`,
                  warning: 'No questions generated for this generation',
                });
              }
              continue;
            }
            
            const { generation, questions, brand, model } = result;
            
            sendUpdate({
              type: 'generation_questions_received',
              generationId: generation.id,
              generationName: `${brand.name} ${model.name} ${generation.name}`,
              questionCount: questions.length,
            });
            
            for (const question of questions) {
              if (!question || question.trim().length === 0) {
                continue;
              }
              
              const trimmedQuestion = question.trim();
              
              // Questions are already deduplicated during generation via allGeneratedQuestions
              // Just add them to allQuestions array (they're already in allGeneratedQuestions)
              // Only check for duplicates within allQuestions itself
              const normalizedQuestion = trimmedQuestion.toLowerCase();
              const alreadyInAllQuestions = allQuestions.some(q => q.toLowerCase() === normalizedQuestion);
              if (!alreadyInAllQuestions) {
                allQuestions.push(trimmedQuestion);
              }
            }
          }

          sendUpdate({
            type: 'generation_batch_complete',
            completed: Math.min(genBatchStart + PARALLEL_GENERATIONS, generationsData.length),
            total: generationsData.length,
            totalQuestionsSoFar: allQuestions.length,
          });
        }

        // Debug: Log how many questions we have
        console.log(`[Generate Questions] Total questions collected: ${allQuestions.length}, expected: ${totalCount}`);
        console.log(`[Generate Questions] Processed ${totalProcessedGenerations} of ${generationsData.length} generations`);
        
        // Verify we processed all generations
        if (totalProcessedGenerations < generationsData.length) {
          console.warn(`[Generate Questions] Only ${totalProcessedGenerations} of ${generationsData.length} generations were successfully processed`);
          sendUpdate({
            type: 'generation_warning',
            warning: `Only ${totalProcessedGenerations} of ${generationsData.length} generations were successfully processed. Some generations may have failed.`,
            processed: totalProcessedGenerations,
            total: generationsData.length,
          });
        }
        
        sendUpdate({
          type: 'file_save_start',
          questionsCount: allQuestions.length,
          totalExpected: totalCount,
          processedGenerations: totalProcessedGenerations,
          totalGenerations: generationsData.length,
        });
        
        if (allQuestions.length === 0) {
          console.error('[Generate Questions] No questions in allQuestions array after processing all generations');
          console.error(`[Generate Questions] Debug info: totalCount=${totalCount}, generationsData.length=${generationsData.length}`);
          controller.enqueue(encoder.encode(sendProgress({
            type: 'error',
            error: 'No questions were generated. This might be due to strict validation filtering all questions. Try reducing questionsPerGeneration or check validation settings.'
          })));
          controller.close();
          return;
        }
        
        // Save file as simple TXT (one question per line)
        const txtContent = allQuestions.join('\n');
        
        const timestamp = Date.now();
        const filename = `questions-${brandIds.length}brands-${generationIds.length}gens-${contentType}-${allQuestions.length}-${timestamp}.txt`;
        const publicDir = join(process.cwd(), 'public', 'generated');
        
        try {
          await mkdir(publicDir, { recursive: true });
        } catch (err: any) {
          if (err.code !== 'EEXIST') {
            throw err;
          }
        }

        const filePath = join(publicDir, filename);
        await writeFile(filePath, txtContent, 'utf-8');
        
        sendUpdate({
          type: 'file_saved',
          filename,
          linesCount: allQuestions.length,
          fileSize: txtContent.length,
        });

        sendUpdate({
          type: 'complete',
          success: true,
          fileUrl: `/generated/${filename}`,
          filename,
          count: allQuestions.length,
          generationsCount: generationIds.length,
          questionsPerGeneration,
          totalApiCalls,
        });

        controller.close();
      } catch (error) {
        console.error('Generate questions error:', error);
        controller.enqueue(encoder.encode(sendProgress({
          type: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        })));
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

