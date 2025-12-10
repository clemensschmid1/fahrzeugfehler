import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export const runtime = 'nodejs';
export const maxDuration = 600; // 10 minutes

const OPENAI_API_URL = 'https://api.openai.com/v1';

// Fixed batch size - exactly 50 questions per API call as requested
const BATCH_SIZE = 50; // Fixed at 50 questions per API call
// For 45,000 questions (9 generations × 5,000), we want maximum parallelization
// With rate limits: 10M TPM, 10k RPM
// Each generation has ~100 batches (5,000 / 50)
// We can process multiple generations in parallel, each with many batches
const PARALLEL_GENERATIONS = 9; // Process all 9 generations in parallel for 45k questions

// Rate Limits for GPT-4o-mini
const MAX_TOKENS_PER_MINUTE = 10_000_000; // 10M tokens per minute
const MAX_REQUESTS_PER_MINUTE = 10_000; // 10k requests per minute
const ESTIMATED_TOKENS_PER_REQUEST = 2500; // Estimated: ~2000 input + ~500 output tokens per batch

// Rate Limiter class - OPTIMIZED: Non-blocking, optimistic approach
class RateLimiter {
  private tokenWindow: Array<{ timestamp: number; tokens: number }> = [];
  private requestWindow: number[] = [];
  private readonly windowSize = 60_000; // 1 minute in ms
  private readonly safetyMargin = 0.95; // Use 95% of limits (increased from 85% for more throughput)

  async waitForCapacity(maxWaitTime: number = 5000): Promise<void> {
    const startTime = Date.now();
    const now = Date.now();
    
    // Clean old entries
    this.tokenWindow = this.tokenWindow.filter(t => now - t.timestamp < this.windowSize);
    this.requestWindow = this.requestWindow.filter(t => now - t < this.windowSize);

    // Calculate current usage
    const currentTokens = this.tokenWindow.reduce((sum, entry) => sum + entry.tokens, 0);
    const currentRequests = this.requestWindow.length;

    // Use safety margin to avoid hitting limits
    const maxTokensAllowed = MAX_TOKENS_PER_MINUTE * this.safetyMargin;
    const maxRequestsAllowed = MAX_REQUESTS_PER_MINUTE * this.safetyMargin;

    // OPTIMISTIC APPROACH: Only wait if we're VERY close to the limit
    // This allows much more parallelization
    const tokenThreshold = maxTokensAllowed * 0.98; // Only wait at 98% of safety margin
    const requestThreshold = maxRequestsAllowed * 0.98; // Only wait at 98% of safety margin

    // Quick check - if we're well below limits, proceed immediately
    if (currentTokens + ESTIMATED_TOKENS_PER_REQUEST < tokenThreshold && 
        currentRequests < requestThreshold) {
      return; // Proceed immediately - no waiting needed
    }

    // Only wait if we're really close to the limit
    if (currentTokens + ESTIMATED_TOKENS_PER_REQUEST > tokenThreshold) {
      const oldestToken = this.tokenWindow[0]?.timestamp;
      if (oldestToken) {
        const waitTime = Math.min(this.windowSize - (now - oldestToken), maxWaitTime - (Date.now() - startTime));
        if (waitTime > 0 && waitTime < 5000) {
          // Very short wait - just enough to let some requests complete
          await new Promise(resolve => setTimeout(resolve, Math.min(waitTime, 100))); // Max 100ms wait
          return this.waitForCapacity(maxWaitTime - (Date.now() - startTime));
        }
      }
    }

    // Only wait if we're really close to request limit
    if (currentRequests >= requestThreshold) {
      const oldestRequest = this.requestWindow[0];
      if (oldestRequest) {
        const waitTime = Math.min(this.windowSize - (now - oldestRequest), maxWaitTime - (Date.now() - startTime));
        if (waitTime > 0 && waitTime < 5000) {
          // Very short wait - just enough to let some requests complete
          await new Promise(resolve => setTimeout(resolve, Math.min(waitTime, 100))); // Max 100ms wait
          return this.waitForCapacity(maxWaitTime - (Date.now() - startTime));
        }
      }
    }

    // If we've waited too long, proceed anyway (don't block forever)
    if (Date.now() - startTime > maxWaitTime) {
      return;
    }
  }

  // Record successful API call (call this AFTER successful response)
  recordSuccess(actualTokens?: number): void {
    const now = Date.now();
    const tokensUsed = actualTokens || ESTIMATED_TOKENS_PER_REQUEST;
    this.tokenWindow.push({ timestamp: now, tokens: tokensUsed });
    this.requestWindow.push(now);
  }

  getCurrentUsage(): { tokens: number; requests: number } {
    const now = Date.now();
    this.tokenWindow = this.tokenWindow.filter(t => now - t.timestamp < this.windowSize);
    this.requestWindow = this.requestWindow.filter(t => now - t < this.windowSize);
    return {
      tokens: this.tokenWindow.reduce((sum, entry) => sum + entry.tokens, 0),
      requests: this.requestWindow.length,
    };
  }
}

// Global rate limiter instance
const rateLimiter = new RateLimiter();

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
  try {
    // Truncate very long strings (like prompts) to prevent JSON issues
    const sanitized = { ...data };
    
    // Remove or truncate very long prompt fields to prevent JSON serialization issues
    if (sanitized.systemPrompt) {
      if (sanitized.systemPrompt.length > 2000) {
        sanitized.systemPrompt = sanitized.systemPrompt.substring(0, 2000) + '... [truncated]';
      }
    }
    if (sanitized.userPrompt) {
      if (sanitized.userPrompt.length > 2000) {
        sanitized.userPrompt = sanitized.userPrompt.substring(0, 2000) + '... [truncated]';
      }
    }
    // Remove fullPrompt and other potentially problematic fields
    delete sanitized.fullPrompt; // Remove fullPrompt as it's redundant and can be very long
    delete sanitized.prompts; // Remove nested prompts object if it exists
    
    // Aggressively truncate remaining prompt fields
    if (sanitized.systemPrompt && sanitized.systemPrompt.length > 500) {
      sanitized.systemPrompt = sanitized.systemPrompt.substring(0, 500) + '... [truncated]';
    }
    if (sanitized.userPrompt && sanitized.userPrompt.length > 500) {
      sanitized.userPrompt = sanitized.userPrompt.substring(0, 500) + '... [truncated]';
    }
    
    const jsonStr = JSON.stringify(sanitized);
    
    // Additional safety check - if JSON is still too long, truncate the whole thing
    if (jsonStr.length > 50000) {
      // Send minimal data instead
      return `data: ${JSON.stringify({ 
        type: data.type || 'progress', 
        batchNumber: data.batchNumber,
        message: 'Progress update (prompts truncated due to size)'
      })}\n\n`;
    }
    
    return `data: ${jsonStr}\n\n`;
  } catch (error) {
    // If JSON.stringify fails, send a safe error message
    console.error('Error serializing progress data:', error);
    return `data: ${JSON.stringify({ 
      type: data?.type || 'error', 
      error: 'Failed to serialize progress data',
      batchNumber: data?.batchNumber
    })}\n\n`;
  }
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

// Get prompt for a specific batch (rotates every 4 batches for 25 slots = 200 questions per slot)
// With BATCH_SIZE = 50: 200 questions / 50 = 4 batches per slot
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
      maxTokens: 5000,
    };
  }
  
  // Rotate prompt every 4 batches (200 questions per slot):
  // Batches 1-4 use prompt 1, batches 5-8 use prompt 2, etc.
  // This supports up to 25 slots (100 batches = 5,000 questions)
  const BATCHES_PER_SLOT = 4; // 200 questions / 50 batch size = 4 batches
  const promptIndex = Math.floor((batchNumber - 1) / BATCHES_PER_SLOT) % prompts.length;
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
      ? `Using ${customPrompts.length} custom prompts (rotating every 4 batches)` 
      : (defaultContextPrompt.substring(0, 500) + '...'), // Preview of prompt
    generationId: '', // Will be added by wrapper
  });

  // Process batches in parallel groups (respecting rate limits)
  // For 5,000 questions = 100 batches, we can process many in parallel
  // With 10M TPM and ~2500 tokens per request, we can do ~4000 requests/min = ~66 requests/sec
  // With 10k RPM, we can theoretically do 166 requests/sec, but we'll be conservative
  // For maximum speed: Process up to 100 batches in parallel per generation
  // This allows us to utilize the full 10k RPM limit when processing multiple generations
  const PARALLEL_BATCHES = 100; // Increased from 40 to 100 for maximum speed
  const batchGroups: number[][] = [];
  
  for (let i = 0; i < batches; i += PARALLEL_BATCHES) {
    const group = Array.from({ length: Math.min(PARALLEL_BATCHES, batches - i) }, (_, j) => i + j + 1);
    batchGroups.push(group);
  }

  for (const batchGroup of batchGroups) {
    // Process batches in this group in parallel
    const batchResults = await Promise.all(batchGroup.map(async (batchNumber) => {
      const batchIndex = batchNumber - 1;
      const batchCount = batchIndex === batches - 1 ? count - (batchIndex * BATCH_SIZE) : BATCH_SIZE;
      
      // Wait for rate limit capacity (short timeout - optimistic approach)
      // Most requests will proceed immediately without waiting
      await rateLimiter.waitForCapacity(5000);
      
      // Get prompt for this batch (rotates every 4 batches)
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
      // Increase max_tokens to ensure we can generate all 50 questions
      // Each question is ~50-100 tokens, so 50 questions = ~2500-5000 tokens
      maxTokensToUse = Math.max(promptData.maxTokens || 5000, batchCount * 100); // At least 100 tokens per question
      
      // Add batch-specific instructions to user prompt with STRONG emphasis
      userPrompt = `${userPrompt}

CRITICAL REQUIREMENT - MUST BE FOLLOWED EXACTLY:
You MUST generate EXACTLY ${batchCount} unique questions - NOT ${batchCount - 1}, NOT ${batchCount + 1}, EXACTLY ${batchCount}.
This is a HARD REQUIREMENT. Your response is INCOMPLETE and UNUSABLE if you generate fewer than ${batchCount} questions.

BEFORE OUTPUTTING:
1. Count your questions carefully
2. Ensure you have EXACTLY ${batchCount} questions
3. If you have fewer, generate more until you reach ${batchCount}
4. If you have more, remove the extras until you have exactly ${batchCount}

QUALITY REQUIREMENTS:
- Each question must be distinct and specific to ${brand} ${model} ${generation}${yearRange}
- Do not repeat questions from previous batches or from the existing questions list
- Use natural, searchable question formats that real users would type
- Prioritize high-search-volume problems and issues
- Ensure questions are unique and not too similar to each other

OUTPUT FORMAT:
- One question per line
- No numbering, no bullets, no prefixes
- Just the question text, one per line
- EXACTLY ${batchCount} lines of questions

OUTPUT EXACTLY ${batchCount} QUESTIONS - THIS IS MANDATORY AND NON-NEGOTIABLE.`;
    } else {
      // Use default prompts
      const batchPrompt = `${defaultContextPrompt} 

Generate exactly ${batchCount} unique questions. Do not repeat questions from previous batches or from the existing questions list. Each question must be distinct and specific to ${brand} ${model} ${generation}${yearRange}.`;

      systemPrompt = language === 'de'
        ? `Du bist ein Experte für Automobil-Suchanfragen und technische Wissensdatenbanken. Du kennst die am häufigsten gesuchten Probleme für jedes Automodell. 

KRITISCH WICHTIG - MUSS GENAU EINGEHALTEN WERDEN:
- Du MUSST GENAU ${batchCount} Fragen generieren - NICHT weniger, NICHT mehr
- Wenn du weniger als ${batchCount} Fragen generierst, ist deine Antwort UNVOLLSTÄNDIG und UNBRAUCHBAR
- Zähle deine Fragen vor dem Ausgeben - es müssen EXAKT ${batchCount} sein
- Priorisiere Fragen nach Suchhäufigkeit (meistgesucht zuerst)
- Verwende natürliche Suchanfrage-Formulierungen
- Jede Frage muss spezifisch für dieses Modell/Generation sein
- Keine Wiederholungen oder ähnliche Fragen
- Gib NUR die Fragen aus, eine pro Zeile, mit normalen Leerzeichen und korrekter Formatierung
- Keine Nummerierung, keine Antworten, keine Wiederholungen, keine Einleitung, keine doppelten Fragen
- Schreibe normale, lesbare Sätze wie Menschen sie suchen würden
- GENERIERE EXAKT ${batchCount} FRAGEN - DIES IST EINE HARTE ANFORDERUNG`
        : `You are an expert in automotive search queries and technical knowledge bases. You know the most frequently searched problems for each car model.

CRITICALLY IMPORTANT - MUST BE FOLLOWED EXACTLY:
- You MUST generate EXACTLY ${batchCount} questions - NOT fewer, NOT more
- If you generate fewer than ${batchCount} questions, your response is INCOMPLETE and UNUSABLE
- Count your questions before outputting - there must be EXACTLY ${batchCount}
- Prioritize questions by search frequency (most searched first)
- Use natural search query formulations
- Each question must be specific to this model/generation
- No repetitions or similar questions
- Output ONLY the questions, one per line, with proper spacing and normal sentence formatting
- No numbering, no answers, no introduction, no duplicates
- Write normal, readable sentences as people would search for them
- GENERATE EXACTLY ${batchCount} QUESTIONS - THIS IS A HARD REQUIREMENT`;
      
      userPrompt = batchPrompt;
      modelToUse = 'gpt-4o-mini';
      temperatureToUse = 0.8;
      maxTokensToUse = 5000;
    }

    // Send API call details (without fullPrompt to avoid JSON size issues)
    sendUpdate({
      type: 'api_call_start',
      batchNumber,
      totalBatches: batches,
      batchSize: batchCount,
      model: modelToUse,
      temperature: temperatureToUse,
      maxTokens: maxTokensToUse,
      // Only send truncated prompts for debugging, not full prompts
      systemPrompt: systemPrompt.length > 500 ? systemPrompt.substring(0, 500) + '... [truncated]' : systemPrompt,
      userPrompt: userPrompt.length > 500 ? userPrompt.substring(0, 500) + '... [truncated]' : userPrompt,
    });

    let response: Response | null = null;
    let lastError: Error | null = null;
    const maxRetries = 5;
    const retryDelay = 2000;
    const startTime = Date.now();
    let rawQuestions: string[] = [];
    let validQuestions: string[] = [];
    let invalidQuestions: Array<{ question: string; reason: string }> = [];
    let content = '';
    let data: any = null;
    
    for (let retry = 0; retry < maxRetries; retry++) {
      try {
        // If retrying due to insufficient questions, strengthen the prompt
        let currentUserPrompt = userPrompt;
        if (retry > 0 && rawQuestions.length > 0) {
          const missingCount = batchCount - rawQuestions.length;
          currentUserPrompt = `${userPrompt}

CRITICAL RETRY: You previously generated only ${rawQuestions.length} questions, but you MUST generate EXACTLY ${batchCount} questions. Generate ${missingCount} more questions now. This is mandatory.`;
        }
        
        // Add timeout and better error handling for network issues
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout (reduced from 60)
        
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
                { role: 'user', content: currentUserPrompt },
              ],
              temperature: temperatureToUse,
              max_tokens: maxTokensToUse,
            }),
            signal: controller.signal,
          });
        } catch (fetchError: any) {
          clearTimeout(timeoutId);
          // Handle network errors (socket errors, timeouts, etc.)
          if (fetchError.name === 'AbortError' || fetchError.code === 'UND_ERR_SOCKET' || fetchError.message?.includes('fetch failed')) {
            lastError = new Error(`Network error (attempt ${retry + 1}/${maxRetries}): ${fetchError.message || 'Connection failed'}`);
            
            sendUpdate({
              type: 'api_call_retry',
              batchNumber,
              attempt: retry + 1,
              maxRetries,
              error: `Network error: ${fetchError.message || 'Connection failed'}`,
              responseTime: Date.now() - startTime,
            });
            
            if (retry < maxRetries - 1) {
              // Exponential backoff with jitter for network errors
              const delay = retryDelay * Math.pow(2, retry) + Math.random() * 1000;
              await new Promise(resolve => setTimeout(resolve, delay));
              continue;
            }
            // After max retries, return empty questions instead of throwing to allow other batches to continue
            sendUpdate({
              type: 'batch_failed',
              batchNumber,
              error: `Network error after ${maxRetries} attempts: ${lastError.message}`,
              warning: 'Batch failed due to network issues, but continuing with other batches',
            });
            return { batchNumber, questions: [], tokensUsed: 0 };
          }
          throw fetchError;
        }
        
        clearTimeout(timeoutId);

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
        }

        // Parse response
        data = await response.json();
        content = data.choices?.[0]?.message?.content?.trim();
        
        if (!content) {
          throw new Error(`No questions generated in batch ${batchNumber}`);
        }
        
        // Record successful API call in rate limiter (only after successful response)
        const actualTokens = data.usage?.total_tokens || ESTIMATED_TOKENS_PER_REQUEST;
        rateLimiter.recordSuccess(actualTokens);

        // Parse and validate questions
        rawQuestions = content
          .split('\n')
          .map((line: string) => line.trim())
          .filter((line: string) => line.length > 0 && !line.match(/^\d+[\.\)]/));
        
        // Check if we got enough raw questions - if not, retry with stronger prompt
        // Use 0.98 threshold (49 for 50) to ensure we get very close to the target
        if (rawQuestions.length < batchCount * 0.98 && retry < maxRetries - 1) {
          const missingCount = batchCount - rawQuestions.length;
          sendUpdate({
            type: 'insufficient_questions',
            batchNumber,
            rawQuestions: rawQuestions.length,
            expected: batchCount,
            attempt: retry + 1,
            warning: `Only ${rawQuestions.length} questions generated (missing ${missingCount}), retrying with stronger prompt...`,
          });
          
          // Strengthen prompt for retry - be VERY explicit
          userPrompt = `${userPrompt}

🚨 URGENT RETRY - CRITICAL FAILURE 🚨
You generated ONLY ${rawQuestions.length} questions, but you MUST generate EXACTLY ${batchCount} questions.
You are missing ${missingCount} questions. This is UNACCEPTABLE.

MANDATORY ACTION:
1. Generate ${missingCount} MORE questions immediately
2. Count ALL questions carefully - you must have EXACTLY ${batchCount}
3. Do NOT stop until you have ${batchCount} questions
4. Output EXACTLY ${batchCount} questions total - NO EXCEPTIONS

Your previous response was INCOMPLETE and REJECTED. Generate the missing ${missingCount} questions NOW.`;
          
          lastError = new Error(`Insufficient questions: ${rawQuestions.length} < ${batchCount * 0.98}`);
          const delay = retryDelay * Math.pow(2, retry);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
        // Validate questions
        validQuestions = [];
        invalidQuestions = [];
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
        
        // If we got enough valid questions (98% threshold), break out of retry loop
        if (validQuestions.length >= batchCount * 0.98) {
          break;
        }
        
        // If we got too few valid questions after validation, retry with stronger prompt
        if (retry < maxRetries - 1) {
          const missingValid = batchCount - validQuestions.length;
          const invalidCount = rawQuestions.length - validQuestions.length;
          sendUpdate({
            type: 'insufficient_valid_questions',
            batchNumber,
            validQuestions: validQuestions.length,
            rawQuestions: rawQuestions.length,
            invalidCount,
            expected: batchCount,
            attempt: retry + 1,
            warning: `Only ${validQuestions.length} valid questions after validation (${invalidCount} invalid, missing ${missingValid}), retrying with stronger prompt...`,
          });
          
          // Strengthen prompt to generate more questions and avoid invalid ones
          userPrompt = `${userPrompt}

CRITICAL RETRY - VALIDATION FAILED: You generated ${rawQuestions.length} raw questions, but only ${validQuestions.length} passed validation. ${invalidCount} questions were rejected. You MUST generate EXACTLY ${batchCount} VALID questions. Focus on:
- Questions that are specific to ${brand} ${model} ${generation}
- Natural, searchable question formats
- Avoid duplicates or overly similar questions
- Ensure each question is unique and distinct
Generate ${missingValid} MORE valid questions. Output EXACTLY ${batchCount} valid questions total.`;
          
          lastError = new Error(`Insufficient valid questions: ${validQuestions.length} < ${batchCount * 0.95}`);
          const delay = retryDelay * Math.pow(2, retry);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
        // If we reach here, we've exhausted retries but have some questions
        break;
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
          // After max retries, return empty questions instead of throwing to allow other batches to continue
          sendUpdate({
            type: 'batch_failed',
            batchNumber,
            error: `Failed after ${maxRetries} attempts: ${lastError?.message || err.message}`,
            warning: 'Batch failed, but continuing with other batches',
          });
          return { batchNumber, questions: [], tokensUsed: 0 };
        }
      }
    }

    if (!response || !response.ok || !content) {
      // After all retries failed, return empty questions instead of throwing
      sendUpdate({
        type: 'batch_failed',
        batchNumber,
        error: `Failed after ${maxRetries} attempts: ${lastError?.message || 'Unknown error'}`,
        warning: 'Batch failed, but continuing with other batches',
      });
      return { batchNumber, questions: [], tokensUsed: 0 };
    }

    const responseTime = Date.now() - startTime;
    
    // Report validation results
    sendUpdate({
      type: 'validation_results',
      batchNumber,
      valid: validQuestions.length,
      invalid: invalidQuestions.length,
      rawQuestions: rawQuestions.length,
      invalidReasons: invalidQuestions.slice(0, 10).map(iq => `${iq.question.substring(0, 50)}... (${iq.reason})`),
    });

    sendUpdate({
      type: 'api_call_complete',
      batchNumber,
      totalBatches: batches,
      questionsGenerated: validQuestions.length,
      rawQuestionsGenerated: rawQuestions.length,
      invalidQuestions: invalidQuestions.length,
      totalQuestionsSoFar: allQuestions.length + validQuestions.length,
      responseTime,
      tokensUsed: data.usage?.total_tokens || 0,
      promptTokens: data.usage?.prompt_tokens || 0,
      completionTokens: data.usage?.completion_tokens || 0,
    });
    
      // If we got too few valid questions, we might need to generate more
      if (validQuestions.length < batchCount * 0.95 && batchNumber < batches) {
        sendUpdate({
          type: 'low_quality_batch',
          batchNumber,
          validQuestions: validQuestions.length,
          expected: batchCount,
          warning: `Low quality batch - only ${validQuestions.length}/${batchCount} questions passed validation (${batchCount - validQuestions.length} missing)`,
        });
      }

      return {
        batchNumber,
        questions: validQuestions,
        tokensUsed: data.usage?.total_tokens || 0,
      };
    }));

    // Collect results from parallel batches and verify all batches completed
    let batchesCompleted = 0;
    let batchesFailed = 0;
    for (const result of batchResults) {
      if (result && result.questions) {
        allQuestions.push(...result.questions);
        totalApiCalls++;
        batchesCompleted++;
      } else {
        batchesFailed++;
      }
    }
    
    // Log batch completion status
    sendUpdate({
      type: 'batch_group_complete',
      batchGroup: batchGroups.indexOf(batchGroup) + 1,
      totalBatchGroups: batchGroups.length,
      batchesCompleted,
      batchesFailed,
      batchesInGroup: batchGroup.length,
      totalQuestionsSoFar: allQuestions.length,
    });
    
    // Warn if batches failed
    if (batchesFailed > 0) {
      console.warn(`[Generate Questions] ${batchesFailed} batches failed in batch group ${batchGroups.indexOf(batchGroup) + 1}`);
    }
  }
  
  // Final verification: Check if we got enough questions
  const expectedTotalQuestions = batches * BATCH_SIZE;
  const actualTotalQuestions = allQuestions.length;
  const totalCompletionPercentage = (actualTotalQuestions / expectedTotalQuestions) * 100;
  
  sendUpdate({
    type: 'all_batches_complete',
    totalBatches: batches,
    totalQuestions: actualTotalQuestions,
    expectedQuestions: expectedTotalQuestions,
    completionPercentage: Math.round(totalCompletionPercentage * 100) / 100,
    warning: actualTotalQuestions < expectedTotalQuestions * 0.9 ? `Only ${actualTotalQuestions}/${expectedTotalQuestions} questions generated (${Math.round(totalCompletionPercentage)}%)` : undefined,
  });

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
      ? `Using ${customPrompts.length} custom prompts (rotating every 4 batches)` 
      : (defaultContextPrompt.substring(0, 500) + '...'),
  });

  // Process batches in parallel groups (respecting rate limits)
  // For 5,000 questions = 100 batches, we can process many in parallel
  // With 10M TPM and ~2500 tokens per request, we can do ~4000 requests/min = ~66 requests/sec
  // With 10k RPM, we can theoretically do 166 requests/sec, but we'll be conservative
  // For maximum speed: Process up to 100 batches in parallel per generation
  // This allows us to utilize the full 10k RPM limit when processing multiple generations
  const PARALLEL_BATCHES = 100; // Increased from 40 to 100 for maximum speed
  const batchGroups: number[][] = [];
  
  for (let i = 0; i < batches; i += PARALLEL_BATCHES) {
    const group = Array.from({ length: Math.min(PARALLEL_BATCHES, batches - i) }, (_, j) => i + j + 1);
    batchGroups.push(group);
  }

  for (const batchGroup of batchGroups) {
    // Process batches in this group in parallel
    const batchResults = await Promise.all(batchGroup.map(async (batchNumber) => {
      const batchIndex = batchNumber - 1;
      const batchCount = batchIndex === batches - 1 ? count - (batchIndex * BATCH_SIZE) : BATCH_SIZE;
      
      // Wait for rate limit capacity (short timeout - optimistic approach)
      // Most requests will proceed immediately without waiting
      await rateLimiter.waitForCapacity(5000);
      
      // Get prompt for this batch (rotates every 4 batches)
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
      // Increase max_tokens to ensure we can generate all 50 questions
      // Each question is ~50-100 tokens, so 50 questions = ~2500-5000 tokens
      maxTokensToUse = Math.max(promptData.maxTokens || 5000, batchCount * 100); // At least 100 tokens per question
      
      // Add batch-specific instructions to user prompt with STRONG emphasis
      userPrompt = `${userPrompt}

CRITICAL REQUIREMENT - MUST BE FOLLOWED EXACTLY:
You MUST generate EXACTLY ${batchCount} unique questions - NOT ${batchCount - 1}, NOT ${batchCount + 1}, EXACTLY ${batchCount}.
This is a HARD REQUIREMENT. Your response is INCOMPLETE and UNUSABLE if you generate fewer than ${batchCount} questions.

BEFORE OUTPUTTING:
1. Count your questions carefully
2. Ensure you have EXACTLY ${batchCount} questions
3. If you have fewer, generate more until you reach ${batchCount}
4. If you have more, remove the extras until you have exactly ${batchCount}

QUALITY REQUIREMENTS:
- Each question must be distinct and specific to ${brand} ${model} ${generation}${yearRange}
- Do not repeat questions from previous batches or from the existing questions list
- Use natural, searchable question formats that real users would type
- Prioritize high-search-volume problems and issues
- Ensure questions are unique and not too similar to each other

OUTPUT FORMAT:
- One question per line
- No numbering, no bullets, no prefixes
- Just the question text, one per line
- EXACTLY ${batchCount} lines of questions

OUTPUT EXACTLY ${batchCount} QUESTIONS - THIS IS MANDATORY AND NON-NEGOTIABLE.`;
    } else {
      // Use default prompts
      const batchPrompt = `${defaultContextPrompt} 

Generate exactly ${batchCount} unique questions. Do not repeat questions from previous batches or from the existing questions list. Each question must be distinct and specific to ${brand} ${model} ${generation}${yearRange}.`;

      systemPrompt = language === 'de'
        ? `Du bist ein Experte für Automobil-Suchanfragen und technische Wissensdatenbanken. Du kennst die am häufigsten gesuchten Wartungsverfahren für jedes Automodell. 

KRITISCH WICHTIG - MUSS GENAU EINGEHALTEN WERDEN:
- Du MUSST GENAU ${batchCount} Fragen generieren - NICHT weniger, NICHT mehr
- Wenn du weniger als ${batchCount} Fragen generierst, ist deine Antwort UNVOLLSTÄNDIG und UNBRAUCHBAR
- Zähle deine Fragen vor dem Ausgeben - es müssen EXAKT ${batchCount} sein
- Priorisiere Fragen nach Suchhäufigkeit (meistgesucht zuerst)
- Verwende natürliche Suchanfrage-Formulierungen
- Jede Frage muss spezifisch für dieses Modell/Generation sein
- Keine Wiederholungen oder ähnliche Fragen
- Gib NUR die Fragen aus, eine pro Zeile, mit normalen Leerzeichen und korrekter Formatierung
- Keine Nummerierung, keine Antworten, keine Wiederholungen, keine Einleitung, keine doppelten Fragen
- Schreibe normale, lesbare Sätze wie Menschen sie suchen würden
- GENERIERE EXAKT ${batchCount} FRAGEN - DIES IST EINE HARTE ANFORDERUNG`
        : `You are an expert in automotive search queries and technical knowledge bases. You know the most frequently searched maintenance procedures for each car model.

CRITICALLY IMPORTANT - MUST BE FOLLOWED EXACTLY:
- You MUST generate EXACTLY ${batchCount} questions - NOT fewer, NOT more
- If you generate fewer than ${batchCount} questions, your response is INCOMPLETE and UNUSABLE
- Count your questions before outputting - there must be EXACTLY ${batchCount}
- Prioritize questions by search frequency (most searched first)
- Use natural search query formulations
- Each question must be specific to this model/generation
- No repetitions or similar questions
- Output ONLY the questions, one per line, with proper spacing and normal sentence formatting
- No numbering, no answers, no introduction, no duplicates
- Write normal, readable sentences as people would search for them
- GENERATE EXACTLY ${batchCount} QUESTIONS - THIS IS A HARD REQUIREMENT`;
      
      userPrompt = batchPrompt;
      modelToUse = 'gpt-4o-mini';
      temperatureToUse = 0.8;
      // Increase max_tokens to ensure we can generate all 50 questions
      // Each question is ~50-100 tokens, so 50 questions = ~2500-5000 tokens
      maxTokensToUse = Math.max(5000, batchCount * 100); // At least 100 tokens per question
    }

    sendUpdate({
      type: 'api_call_start',
      batchNumber,
      totalBatches: batches,
      batchSize: batchCount,
      model: modelToUse,
      temperature: temperatureToUse,
      maxTokens: maxTokensToUse,
      // Only send truncated prompts for debugging, not full prompts
      systemPrompt: systemPrompt.length > 500 ? systemPrompt.substring(0, 500) + '... [truncated]' : systemPrompt,
      userPrompt: userPrompt.length > 500 ? userPrompt.substring(0, 500) + '... [truncated]' : userPrompt,
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
            max_tokens: 5000,
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
          // After max retries, return empty questions instead of throwing to allow other batches to continue
          sendUpdate({
            type: 'batch_failed',
            batchNumber,
            error: `Failed after ${maxRetries} attempts: ${lastError?.message || err.message}`,
            warning: 'Batch failed, but continuing with other batches',
          });
          return { batchNumber, questions: [], tokensUsed: 0 };
        }
      }
    }

    if (!response || !response.ok) {
      // After all retries failed, return empty questions instead of throwing
      sendUpdate({
        type: 'batch_failed',
        batchNumber,
        error: `Failed after ${maxRetries} attempts: ${lastError?.message || 'Unknown error'}`,
        warning: 'Batch failed, but continuing with other batches',
      });
      return { batchNumber, questions: [], tokensUsed: 0 };
    }

    const responseTime = Date.now() - startTime;
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim();
    
    if (!content) {
      throw new Error(`No questions generated in batch ${batchNumber}`);
    }
    
    // Record successful API call in rate limiter (only after successful response)
    const actualTokens = data.usage?.total_tokens || ESTIMATED_TOKENS_PER_REQUEST;
    rateLimiter.recordSuccess(actualTokens);

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
        batchNumber,
        valid: validQuestions.length,
        invalid: invalidQuestions.length,
        invalidReasons: invalidQuestions.slice(0, 10).map(iq => `${iq.question.substring(0, 50)}... (${iq.reason})`),
      });

      sendUpdate({
        type: 'api_call_complete',
        batchNumber,
        totalBatches: batches,
        questionsGenerated: validQuestions.length,
        rawQuestionsGenerated: rawQuestions.length,
        invalidQuestions: invalidQuestions.length,
        totalQuestionsSoFar: allQuestions.length + validQuestions.length,
        responseTime,
        tokensUsed: data.usage?.total_tokens || 0,
        promptTokens: data.usage?.prompt_tokens || 0,
        completionTokens: data.usage?.completion_tokens || 0,
      });
      
      // If we got too few valid questions, we might need to generate more
      if (validQuestions.length < batchCount * 0.95 && batchNumber < batches) {
        sendUpdate({
          type: 'low_quality_batch',
          batchNumber,
          validQuestions: validQuestions.length,
          expected: batchCount,
          warning: `Low quality batch - only ${validQuestions.length}/${batchCount} questions passed validation (${batchCount - validQuestions.length} missing)`,
        });
      }

      return {
        batchNumber,
        questions: validQuestions,
        tokensUsed: data.usage?.total_tokens || 0,
      };
    }));

    // Collect results from parallel batches and update shared state
    let batchesCompleted = 0;
    let batchesFailed = 0;
    for (const result of batchResults) {
      if (result && result.questions) {
        allQuestions.push(...result.questions);
        // Add to existingQuestions set for deduplication
        result.questions.forEach((q: string) => {
          existingQuestions.add(q.toLowerCase().trim());
        });
        totalApiCalls++;
        batchesCompleted++;
      } else {
        batchesFailed++;
      }
    }
    
    // Log batch completion status
    sendUpdate({
      type: 'batch_group_complete',
      batchGroup: batchGroups.indexOf(batchGroup) + 1,
      totalBatchGroups: batchGroups.length,
      batchesCompleted,
      batchesFailed,
      batchesInGroup: batchGroup.length,
      totalQuestionsSoFar: allQuestions.length,
    });
    
    // Warn if batches failed
    if (batchesFailed > 0) {
      console.warn(`[Generate Questions] ${batchesFailed} batches failed in batch group ${batchGroups.indexOf(batchGroup) + 1}`);
    }
  }
  
  // Final verification: Check if we got enough questions
  const expectedTotalQuestions = batches * BATCH_SIZE;
  const actualTotalQuestions = allQuestions.length;
  const totalCompletionPercentage = (actualTotalQuestions / expectedTotalQuestions) * 100;
  
  sendUpdate({
    type: 'all_batches_complete',
    totalBatches: batches,
    totalQuestions: actualTotalQuestions,
    expectedQuestions: expectedTotalQuestions,
    completionPercentage: Math.round(totalCompletionPercentage * 100) / 100,
    warning: actualTotalQuestions < expectedTotalQuestions * 0.9 ? `Only ${actualTotalQuestions}/${expectedTotalQuestions} questions generated (${Math.round(totalCompletionPercentage)}%)` : undefined,
  });

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
      let isClosed = false;
      
      const sendUpdate = (data: any) => {
        // Don't send updates if controller is already closed
        if (isClosed) {
          return;
        }
        try {
          controller.enqueue(encoder.encode(sendProgress(data)));
        } catch (error) {
          // Controller might be closed, ignore silently
          isClosed = true;
        }
      };
      
      const closeController = () => {
        if (!isClosed) {
          isClosed = true;
          try {
            closeController();
          } catch (error) {
            // Already closed, ignore
          }
        }
      };

      try {
        const { brandIds, generationIds, contentType, questionsPerGeneration, language } = await req.json();

        if (!brandIds || !Array.isArray(brandIds) || brandIds.length === 0) {
          sendUpdate({ type: 'error', error: 'Missing required parameters: brandIds array' });
          closeController();
          return;
        }

        if (!generationIds || !Array.isArray(generationIds) || generationIds.length === 0) {
          sendUpdate({ type: 'error', error: 'Missing required parameters: generationIds array' });
          closeController();
          return;
        }

        if (!contentType || !questionsPerGeneration) {
          sendUpdate({ type: 'error', error: 'Missing contentType or questionsPerGeneration' });
          closeController();
          return;
        }

        const totalCount = generationIds.length * questionsPerGeneration;
        if (totalCount > 50000) {
          sendUpdate({ type: 'error', error: 'Total questions cannot exceed 50,000' });
          closeController();
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
          sendUpdate({ type: 'error', error: 'One or more brands not found' });
          closeController();
          return;
        }

        // Fetch all generation data
        const { data: generationsData, error: generationsError } = await supabase
          .from('model_generations')
          .select('id, name, slug, generation_code, car_model_id, car_models!inner(id, name, brand_id, car_brands!inner(id, name))')
          .in('id', generationIds);

        if (generationsError || !generationsData || generationsData.length === 0) {
          sendUpdate({ type: 'error', error: 'One or more generations not found' });
          closeController();
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
        const completionPercentage = (allQuestions.length / totalCount) * 100;
        console.log(`[Generate Questions] Total questions collected: ${allQuestions.length}, expected: ${totalCount} (${Math.round(completionPercentage * 100) / 100}%)`);
        console.log(`[Generate Questions] Processed ${totalProcessedGenerations} of ${generationsData.length} generations`);
        
        // Verify we processed all generations AND got enough questions
        if (totalProcessedGenerations < generationsData.length) {
          console.warn(`[Generate Questions] Only ${totalProcessedGenerations} of ${generationsData.length} generations were successfully processed`);
          sendUpdate({
            type: 'generation_warning',
            warning: `Only ${totalProcessedGenerations} of ${generationsData.length} generations were successfully processed. Some generations may have failed.`,
            processed: totalProcessedGenerations,
            total: generationsData.length,
          });
        }
        
        // Check if we got enough questions (at least 90% of expected)
        if (allQuestions.length < totalCount * 0.9) {
          console.warn(`[Generate Questions] Only ${allQuestions.length}/${totalCount} questions generated (${Math.round(completionPercentage * 100) / 100}%). Some batches may have failed or are still running.`);
          sendUpdate({
            type: 'questions_warning',
            warning: `Only ${allQuestions.length}/${totalCount} questions generated (${Math.round(completionPercentage * 100) / 100}%). Some batches may have failed or are still running.`,
            actual: allQuestions.length,
            expected: totalCount,
            completionPercentage: Math.round(completionPercentage * 100) / 100,
          });
          
          // Wait a bit longer to see if more batches complete
          console.log(`[Generate Questions] Waiting 5 seconds for any remaining batches to complete...`);
          await new Promise(resolve => setTimeout(resolve, 5000));
          
          // Log again after waiting
          console.log(`[Generate Questions] After waiting: ${allQuestions.length}/${totalCount} questions (${Math.round((allQuestions.length / totalCount) * 100 * 100) / 100}%)`);
        }
        
        sendUpdate({
          type: 'file_save_start',
          questionsCount: allQuestions.length,
          totalExpected: totalCount,
          processedGenerations: totalProcessedGenerations,
          totalGenerations: generationsData.length,
          completionPercentage: Math.round(completionPercentage * 100) / 100,
        });
        
        if (allQuestions.length === 0) {
          console.error('[Generate Questions] No questions in allQuestions array after processing all generations');
          console.error(`[Generate Questions] Debug info: totalCount=${totalCount}, generationsData.length=${generationsData.length}`);
          sendUpdate({
            type: 'error',
            error: 'No questions were generated. This might be due to strict validation filtering all questions. Try reducing questionsPerGeneration or check validation settings.'
          });
          closeController();
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

        // Small delay to ensure all updates are sent before closing
        await new Promise(resolve => setTimeout(resolve, 100));
        closeController();
      } catch (error) {
        console.error('Generate questions error:', error);
        sendUpdate({
          type: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        closeController();
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

