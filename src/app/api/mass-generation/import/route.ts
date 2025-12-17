import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { createReadStream } from 'fs';
import { createInterface } from 'readline';
import { tmpdir } from 'os';
import { writeFile, unlink } from 'fs/promises';
import { pipeline } from 'stream/promises';
import { Readable } from 'stream';

export const runtime = 'nodejs';
export const maxDuration = 800; // ~13 minutes - Vercel maximum limit (for large imports, consider splitting into smaller batches)

// Memory optimization: Process data in smaller chunks to avoid heap overflow
// Instead of loading all data into arrays, we'll process in chunks

// Memory optimization: Process files in batches to avoid heap overflow
const PROCESSING_BATCH_SIZE = 5000; // Process 5k lines at a time to reduce memory pressure
const MEMORY_SAFE_CHUNK_SIZE = 10000; // Process data in chunks of 10k items to avoid memory overflow

const OPENAI_API_URL = 'https://api.openai.com/v1';

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

// Download and parse JSONL file from OpenAI
async function downloadAndParseJsonl(fileId: string, apiKey: string): Promise<any[]> {
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
      console.error('Failed to parse JSONL line:', e);
      return null;
    }
  }).filter(item => item !== null);
}

function generateSlug(title: string, index: number): string {
  const base = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 80);
  return `${base}-${index}-${Date.now().toString(36)}`;
}

export async function POST(req: Request) {
  try {
    // Get base URL from request headers for server-side API calls
    const protocol = req.headers.get('x-forwarded-proto') || 'http';
    const host = req.headers.get('host') || 'localhost:3000';
    const baseUrl = `${protocol}://${host}`;
    
    const formData = await req.formData();
    const useMultipleFiles = formData.get('useMultipleFiles') === 'true';
    
    // Support both single files and multiple files
    let questionsFiles: File[] = [];
    let answersFiles: File[] = [];
    let metadataFiles: File[] = [];
    
    if (useMultipleFiles) {
      // Get all files from FormData arrays
      const questionsFilesList = formData.getAll('questionsFiles') as File[];
      const answersFilesList = formData.getAll('answersFiles') as File[];
      const metadataFilesList = formData.getAll('metadataFiles') as File[];
      
      questionsFiles = questionsFilesList.filter(f => f && f.name);
      answersFiles = answersFilesList.filter(f => f && f.name);
      metadataFiles = metadataFilesList.filter(f => f && f.name);
      
      // Validate at least one file of each type
      if (questionsFiles.length === 0) {
        return NextResponse.json({ error: 'Missing questionsFiles' }, { status: 400 });
      }
      if (answersFiles.length === 0) {
        return NextResponse.json({ error: 'Missing answersFiles' }, { status: 400 });
      }
      if (metadataFiles.length === 0) {
        return NextResponse.json({ error: 'Missing metadataFiles' }, { status: 400 });
      }
      
      // Validate max 10 files per type
      if (questionsFiles.length > 10) {
        return NextResponse.json({ error: 'Maximum 10 questions files allowed' }, { status: 400 });
      }
      if (answersFiles.length > 10) {
        return NextResponse.json({ error: 'Maximum 10 answers files allowed' }, { status: 400 });
      }
      if (metadataFiles.length > 10) {
        return NextResponse.json({ error: 'Maximum 10 metadata files allowed' }, { status: 400 });
      }
      
      // Note: We no longer require matching counts - all files will be merged together
    } else {
      // Single file mode (backward compatible)
    const questionsFile = formData.get('questionsFile') as File;
    const answersFile = formData.get('answersFile') as File;
    const metadataFile = formData.get('metadataFile') as File | null;

    if (!questionsFile) {
      return NextResponse.json({ error: 'Missing questionsFile' }, { status: 400 });
    }
    if (!answersFile) {
      return NextResponse.json({ error: 'Missing answersFile' }, { status: 400 });
    }

      questionsFiles = [questionsFile];
      answersFiles = [answersFile];
      metadataFiles = metadataFile ? [metadataFile] : [];
    }
    
    const contentType = (formData.get('contentType') as string) || 'fault';
    const generationIdsStr = formData.get('generationIds') as string;
    const generationIds = generationIdsStr ? JSON.parse(generationIdsStr) : [];
    const questionsPerGeneration = parseInt(formData.get('questionsPerGeneration') as string) || 0;
    const language = (formData.get('language') as string) || 'en';

    // Validate all files are JSONL
    for (const file of [...questionsFiles, ...answersFiles, ...metadataFiles]) {
      if (!file.name.endsWith('.jsonl')) {
        return NextResponse.json({ error: `File ${file.name} must be a .jsonl file` }, { status: 400 });
      }
    }

    const apiKey = getOpenAIApiKey();
    const supabase = getSupabaseClient();

    // MEMORY OPTIMIZATION: Save files to temp location first, then process with streaming
    // This prevents loading entire files into memory at once
    const tempDir = tmpdir();
    const tempFiles: string[] = [];
    
    // Helper to save File to temp location
    async function saveFileToTemp(file: File, prefix: string): Promise<string> {
      const tempPath = join(tempDir, `${prefix}-${Date.now()}-${Math.random().toString(36).substring(7)}.jsonl`);
      const arrayBuffer = await file.arrayBuffer();
      await writeFile(tempPath, Buffer.from(arrayBuffer));
      tempFiles.push(tempPath);
      return tempPath;
    }
    
    // Save all files to temp location (prevents memory issues with large files)
    const questionsFilePaths: string[] = [];
    const answersFilePaths: string[] = [];
    const metadataFilePaths: string[] = [];
    
    console.log('[Import] Saving files to temp location...');
    for (const file of questionsFiles) {
      questionsFilePaths.push(await saveFileToTemp(file, 'questions'));
    }
    for (const file of answersFiles) {
      answersFilePaths.push(await saveFileToTemp(file, 'answers'));
    }
    for (const file of metadataFiles) {
      metadataFilePaths.push(await saveFileToTemp(file, 'metadata'));
    }
    
    // Process files using streaming to avoid memory overflow
    const allQuestionsLines: string[] = [];
    const allAnswersLines: string[] = [];
    const allMetadataResults: any[] = [];
    
    // Process questions files with streaming
    for (const filePath of questionsFilePaths) {
      const rl = createInterface({ input: createReadStream(filePath) });
      let batch: string[] = [];
      
      for await (const line of rl) {
        const trimmed = line.trim();
        if (trimmed) {
          batch.push(trimmed);
          // Process in batches to avoid memory buildup
          if (batch.length >= PROCESSING_BATCH_SIZE) {
            allQuestionsLines.push(...batch);
            batch = []; // Clear batch
          }
        }
      }
      if (batch.length > 0) {
        allQuestionsLines.push(...batch);
      }
      rl.close();
    }
    
    // Process answers files with streaming
    for (const filePath of answersFilePaths) {
      const rl = createInterface({ input: createReadStream(filePath) });
      let batch: string[] = [];
      
      for await (const line of rl) {
        const trimmed = line.trim();
        if (trimmed) {
          batch.push(trimmed);
          if (batch.length >= PROCESSING_BATCH_SIZE) {
            allAnswersLines.push(...batch);
            batch = [];
          }
        }
      }
      if (batch.length > 0) {
        allAnswersLines.push(...batch);
      }
      rl.close();
    }
    
    // Process metadata files with streaming
    for (const filePath of metadataFilePaths) {
      const rl = createInterface({ input: createReadStream(filePath) });
      let batch: any[] = [];
      
      for await (const line of rl) {
        const trimmed = line.trim();
        if (trimmed) {
          try {
            const parsed = JSON.parse(trimmed);
            batch.push(parsed);
            if (batch.length >= PROCESSING_BATCH_SIZE) {
              allMetadataResults.push(...batch);
              batch = [];
            }
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }
      if (batch.length > 0) {
        allMetadataResults.push(...batch);
      }
      rl.close();
    }
    
    // Cleanup temp files
    for (const tempPath of tempFiles) {
      try {
        await unlink(tempPath);
      } catch (e) {
        // Ignore cleanup errors
      }
    }
    
    console.log(`[Import] Merged ${questionsFiles.length} questions files (${allQuestionsLines.length} lines), ${answersFiles.length} answers files (${allAnswersLines.length} lines), ${metadataFiles.length} metadata files (${allMetadataResults.length} entries)`);
    
    // Process combined data
    const questionsMap = new Map<string, { 
      question: string; 
      generationId?: string;
      generationInfo?: { brand?: string; model?: string; generation?: string; generationCode?: string };
    }>();
    
    // Fetch all brands from database for better brand detection
    const { data: allBrands } = await supabase
      .from('car_brands')
      .select('name');
    
    const knownBrands = new Set((allBrands || []).map(b => b.name.toLowerCase()));
    const knownBrandsList = Array.from(knownBrands);
    
    // Function to extract brand, model, and generation from question text
    // Format examples:
    // - "why does my BMW 3 Series G20/G21 (2019-2024) engine shake"
    // - "how to fix P0302 on my BMW 3 Series G20/G21 (2019-2024)"
    // - "CRUISE CONTROL not working on BMW X3"
    // - "question - BMW 3 Series G20/G21" (suffix format)
    const extractGenerationInfo = (questionText: string): { brand?: string; model?: string; generation?: string; generationCode?: string } => {
      // First, try to extract from suffix format: "question - Brand Model Generation (G20/G21)"
      const suffixMatch = questionText.match(/\s*-\s*([^-]+)$/);
      if (suffixMatch) {
        const suffix = suffixMatch[1].trim();
        
        // Pattern 1: "BMW 3 Series G20/G21 (2019-2024)" - generation code at end, year range in parentheses
        const pattern1 = /^([A-Z][a-zA-Z]+)\s+(.+?)\s+([A-Z]\d+(\/[A-Z]\d+)?)\s*\([^)]+\)$/;
        const match1 = suffix.match(pattern1);
        if (match1 && knownBrands.has(match1[1].toLowerCase())) {
          return {
            brand: match1[1],
            model: match1[2].trim(),
            generation: match1[3],
            generationCode: match1[3]
          };
        }
        
        // Pattern 2: "BMW 3 Series (G20/G21)" - generation code in parentheses
        const pattern2 = /^([A-Z][a-zA-Z]+)\s+(.+?)\s+\(([A-Z]\d+(\/[A-Z]\d+)?)\)$/;
        const match2 = suffix.match(pattern2);
        if (match2 && knownBrands.has(match2[1].toLowerCase())) {
          return {
            brand: match2[1],
            model: match2[2].trim(),
            generation: match2[3],
            generationCode: match2[3]
          };
        }
        
        // Pattern 3: "BMW 3 Series G20/G21" - generation code at end, no parentheses
        const pattern3 = /^([A-Z][a-zA-Z]+)\s+(.+?)\s+([A-Z]\d+(\/[A-Z]\d+)?)$/;
        const match3 = suffix.match(pattern3);
        if (match3 && knownBrands.has(match3[1].toLowerCase())) {
          return {
            brand: match3[1],
            model: match3[2].trim(),
            generation: match3[3],
            generationCode: match3[3]
          };
        }
        
        // Pattern 4: "BMW 3 Series" - no generation code, but we have brand/model
        const pattern4 = /^([A-Z][a-zA-Z]+)\s+(.+)$/;
        const match4 = suffix.match(pattern4);
        if (match4 && knownBrands.has(match4[1].toLowerCase())) {
          return {
            brand: match4[1],
            model: match4[2].trim()
          };
        }
      }
      
      // Search for known brands anywhere in the text (not just at the beginning)
      let bestMatch: { brand?: string; model?: string; generation?: string; generationCode?: string } | null = null;
      let bestMatchPosition = Infinity;
      
      for (const brandName of knownBrandsList) {
        const brandRegex = new RegExp(`\\b${brandName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
        const brandMatch = questionText.match(brandRegex);
        
        if (brandMatch) {
          const brandIndex = brandMatch.index || 0;
          const brand = brandMatch[0];
          
          // Extract text after the brand
          const afterBrand = questionText.substring(brandIndex + brand.length);
          
          // Try to find model and generation code after the brand
          // Pattern 1: "BMW 3 Series G20/G21 (2019-2024)" or "BMW X3" or "BMW 5 Series F10/F11"
          const pattern1 = /\s+(\d+\s+Series|X\d+|[\dA-Z]+\s+[A-Z]+\w*|[A-Z][a-zA-Z\s]+?)\s+([A-Z]\d+(\/[A-Z]\d+)?)(?:\s*\([^)]+\))?/i;
          const match1 = afterBrand.match(pattern1);
          if (match1) {
            const genCode = match1[2];
            if (genCode && !genCode.match(/^\d{4}/)) {
              const candidate = {
                brand: brand.charAt(0).toUpperCase() + brand.slice(1).toLowerCase(),
                model: match1[1].trim(),
                generation: genCode,
                generationCode: genCode
              };
              if (brandIndex < bestMatchPosition) {
                bestMatch = candidate;
                bestMatchPosition = brandIndex;
              }
              continue;
            }
          }
          
          // Pattern 2: "BMW 3 Series (G20/G21)" - generation code in parentheses
          const pattern2 = /\s+(\d+\s+Series|X\d+|[\dA-Z]+\s+[A-Z]+\w*|[A-Z][a-zA-Z\s]+?)\s+\(([A-Z]\d+(\/[A-Z]\d+)?)\)/i;
          const match2 = afterBrand.match(pattern2);
          if (match2) {
            const genCode = match2[2];
            if (genCode && !genCode.match(/^\d{4}/)) {
              const candidate = {
                brand: brand.charAt(0).toUpperCase() + brand.slice(1).toLowerCase(),
                model: match2[1].trim(),
                generation: genCode,
                generationCode: genCode
              };
              if (brandIndex < bestMatchPosition) {
                bestMatch = candidate;
                bestMatchPosition = brandIndex;
              }
              continue;
            }
          }
          
          // Pattern 3: "BMW X3" or "BMW 3 Series" - model only, no generation code
          const pattern3 = /\s+(X\d+|\d+\s+Series|[\dA-Z]+\s+[A-Z]+\w*|[A-Z][a-zA-Z]+)(?:\s+\([^)]+\))?/i;
          const match3 = afterBrand.match(pattern3);
          if (match3) {
            const modelPart = match3[1].trim();
            // Make sure we're not matching something like "2019-2024" or common words
            if (!modelPart.match(/^\d{4}/) && 
                !['on', 'my', 'the', 'a', 'an', 'is', 'are', 'was', 'were', 'not', 'working', 'light', 'engine', 'service'].includes(modelPart.toLowerCase())) {
              const candidate = {
                brand: brand.charAt(0).toUpperCase() + brand.slice(1).toLowerCase(),
                model: modelPart
              };
              if (brandIndex < bestMatchPosition) {
                bestMatch = candidate;
                bestMatchPosition = brandIndex;
              }
            }
          }
        }
      }
      
      if (bestMatch) {
        return bestMatch;
      }
      
      // Fallback: Try original patterns if brand search didn't work
      // Pattern 1: "BMW 3 Series G20/G21 (2019-2024)" - with year range
      const pattern1 = /\b([A-Z][a-zA-Z]+)\s+(\d+\s+Series|\d+\s+[A-Z]+\w*|[A-Z][a-zA-Z\s]+?)\s+([A-Z]\d+(\/[A-Z]\d+)?)\s*\([^)]+\)/;
      const match1 = questionText.match(pattern1);
      if (match1 && knownBrands.has(match1[1].toLowerCase())) {
        const genCode = match1[3];
        if (genCode && !genCode.match(/^\d{4}/)) {
          return {
            brand: match1[1],
            model: match1[2].trim(),
            generation: genCode,
            generationCode: genCode
          };
        }
      }
      
      // Pattern 2: "BMW 3 Series G20/G21" - generation code without parentheses
      const pattern2 = /\b([A-Z][a-zA-Z]+)\s+(\d+\s+Series|\d+\s+[A-Z]+\w*|[A-Z][a-zA-Z\s]+?)\s+([A-Z]\d+(\/[A-Z]\d+)?)\b/;
      const match2 = questionText.match(pattern2);
      if (match2 && knownBrands.has(match2[1].toLowerCase())) {
        const genCode = match2[3];
        if (genCode && !genCode.match(/^\d{4}/)) {
          const afterMatch = questionText.substring(questionText.indexOf(match2[0]) + match2[0].length);
          if (!afterMatch.match(/^\s*\(\d{4}/)) {
            return {
              brand: match2[1],
              model: match2[2].trim(),
              generation: genCode,
              generationCode: genCode
            };
          }
        }
      }
      
      // Pattern 3: "BMW 3 Series (G20/G21)" - generation code in parentheses
      const pattern3 = /\b([A-Z][a-zA-Z]+)\s+(\d+\s+Series|\d+\s+[A-Z]+\w*|[A-Z][a-zA-Z\s]+?)\s+\(([A-Z]\d+(\/[A-Z]\d+)?)\)/;
      const match3 = questionText.match(pattern3);
      if (match3 && knownBrands.has(match3[1].toLowerCase())) {
        const genCode = match3[3];
        if (genCode && !genCode.match(/^\d{4}/)) {
          return {
            brand: match3[1],
            model: match3[2].trim(),
            generation: genCode,
            generationCode: genCode
          };
        }
      }
      
      // Pattern 4: "BMW 3 Series" - brand and model only (no generation code)
      const pattern4 = /\b([A-Z][a-zA-Z]+)\s+(\d+\s+Series|X\d+|\d+\s+[A-Z]+\w*|[A-Z][a-zA-Z\s]+?)(?:\s+\([^)]+\))?/;
      const match4 = questionText.match(pattern4);
      if (match4 && knownBrands.has(match4[1].toLowerCase())) {
        const modelPart = match4[2].trim();
        if (!modelPart.match(/^\d{4}/)) {
          return {
            brand: match4[1],
            model: modelPart
          };
        }
      }
      
      // If nothing found, return empty
      return {};
    };

    // MEMORY OPTIMIZATION: Process questions in chunks
    console.log(`[Import] Processing ${allQuestionsLines.length} questions...`);
    let processedQuestions = 0;
    while (allQuestionsLines.length > 0) {
      // Process chunk
      const chunk = allQuestionsLines.splice(0, MEMORY_SAFE_CHUNK_SIZE);
      
      for (const line of chunk) {
        try {
          const parsed = JSON.parse(line);
          // Extract question from user message
          const userContent = parsed.body?.messages?.[1]?.content || parsed.body?.messages?.[0]?.content || '';
          if (!userContent) {
            console.warn('[Import] No user content found in question line:', line.substring(0, 100));
            continue;
          }
          // Remove the " - Brand Model Generation" suffix if present, but keep it for extraction
          const questionParts = userContent.split(' - ');
          const question = questionParts[0];
          const suffix = questionParts[1] || '';
          
          // Extract generation info - prioritize suffix, but also try full userContent as fallback
          let generationInfo = extractGenerationInfo(userContent);
          
          // If nothing found and we have a suffix, try extracting just from suffix
          if ((!generationInfo.brand || !generationInfo.model) && suffix) {
            const suffixInfo = extractGenerationInfo(`dummy - ${suffix}`);
            if (suffixInfo.brand && suffixInfo.model) {
              generationInfo = suffixInfo;
            }
          }
          
          // Extract generation_id from custom_id: answer-{generationId}-{index}
          const customId = parsed.custom_id || '';
          const match = customId.match(/^answer-(.+?)-(\d+)$/);
          const partialGenerationId = match ? match[1] : null;
          
          questionsMap.set(customId, { 
            question, 
            generationId: partialGenerationId || undefined,
            generationInfo // Store extracted info for later matching
          });
          processedQuestions++;
        } catch (e) {
          console.error('[Import] Failed to parse question line:', e, 'Line:', line.substring(0, 100));
        }
      }
      
      // Force garbage collection after each chunk
      if (global.gc) {
        global.gc();
      }
    }
    console.log(`[Import] Processed ${processedQuestions} questions into map`);

    // MEMORY OPTIMIZATION: Process answers in chunks
    console.log(`[Import] Processing ${allAnswersLines.length} answers...`);
    const answers: any[] = [];
    while (allAnswersLines.length > 0) {
      // Process chunk
      const chunk = allAnswersLines.splice(0, MEMORY_SAFE_CHUNK_SIZE);
      
      for (const line of chunk) {
        try {
          const parsed = JSON.parse(line);
          if (parsed) {
            answers.push(parsed);
          }
        } catch (e) {
          // Skip invalid JSON
        }
      }
      
      // Force garbage collection after each chunk
      if (global.gc) {
        global.gc();
      }
    }
    console.log(`[Import] Processed ${answers.length} answers`);

    // CRITICAL: Map answers to questions by custom_id - this is the core matching logic
    // We MUST track custom_id through the entire process to prevent misalignment
    const qaPairs: Array<{ 
      question: string; 
      answer: string; 
      customId: string; // CRITICAL: Store custom_id for later matching with metadata
      index: number; 
      generationId?: string; 
      generationInfo?: { brand?: string; model?: string; generation?: string; generationCode?: string } 
    }> = [];
    let index = 0;
    const matchedCustomIds = new Set<string>();
    const unmatchedAnswers: string[] = [];
    const failedAnswers: string[] = [];
    
    for (const answerResult of answers) {
      const customId = answerResult.custom_id;
      
      // Track failed answers
      if (answerResult.error || answerResult.response?.status_code !== 200) {
        failedAnswers.push(customId || '(missing custom_id)');
        continue;
      }

      if (!customId) {
        console.warn('[Import] Answer result missing custom_id, skipping');
        continue;
      }

      const questionData = questionsMap.get(customId);
      
      if (!questionData) {
        unmatchedAnswers.push(customId);
        continue;
      }

      // CRITICAL: Check for duplicate custom_ids (should never happen, but safety check)
      if (matchedCustomIds.has(customId)) {
        console.error(`[Import] CRITICAL ERROR: Duplicate custom_id detected: ${customId}. This would cause data corruption.`);
        return NextResponse.json({
          error: `Duplicate custom_id detected: ${customId}. This indicates a serious data integrity issue. Please check your input files.`,
          duplicateCustomId: customId
        }, { status: 400 });
      }
      
      matchedCustomIds.add(customId);
      
        const answer = answerResult.response?.body?.choices?.[0]?.message?.content;
        if (answer) {
          qaPairs.push({
            question: questionData.question,
            answer: answer.trim(),
          customId: customId, // CRITICAL: Store custom_id for metadata matching
            index: index++,
            generationId: questionData.generationId,
          generationInfo: questionData.generationInfo,
          });
        }
      }

    // Log matching statistics
    if (unmatchedAnswers.length > 0) {
      console.warn(`[Import] ${unmatchedAnswers.length} answers have no matching question (custom_ids: ${unmatchedAnswers.slice(0, 5).join(', ')}${unmatchedAnswers.length > 5 ? '...' : ''})`);
    }
    if (failedAnswers.length > 0) {
      console.warn(`[Import] ${failedAnswers.length} answers failed in batch (custom_ids: ${failedAnswers.slice(0, 5).join(', ')}${failedAnswers.length > 5 ? '...' : ''})`);
    }
    
    const matchRate = questionsMap.size > 0 
      ? ((qaPairs.length / questionsMap.size) * 100).toFixed(1)
      : '0';
    
    if (parseFloat(matchRate) < 95 && questionsMap.size > 100) {
      console.warn(`[Import] WARNING: Only ${matchRate}% of questions have matching answers (${qaPairs.length}/${questionsMap.size}). This may indicate a mismatch in custom_ids.`);
    }

    // Determine which generation IDs to use
    let extractedGenerationIds: string[] = [];
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    
    if (generationIds && generationIds.length > 0) {
      // Use the generation IDs provided from the frontend (selectedGenerations)
      const validFrontendIds = generationIds.filter(id => uuidRegex.test(id));
      const invalidFrontendIds = generationIds.filter(id => !uuidRegex.test(id));
      
      if (invalidFrontendIds.length > 0) {
        console.warn('[Import] Invalid UUID format in frontend generation IDs:', invalidFrontendIds);
      }
      
      if (validFrontendIds.length === 0) {
        return NextResponse.json({ 
          error: 'No valid UUID generation IDs provided',
          details: `All generation IDs must be valid UUIDs. Found ${invalidFrontendIds.length} invalid ID(s). Please select valid generations in the frontend.`
        }, { status: 400 });
      }
      
      extractedGenerationIds = validFrontendIds;
      console.log('[Import] Using generation IDs from frontend:', extractedGenerationIds.length, 'generations');
      
      // Assign generation IDs to QA pairs
      if (extractedGenerationIds.length > 1 && qaPairs.length > 0) {
        // Multiple generations: distribute QA pairs evenly
        const pairsPerGeneration = Math.ceil(qaPairs.length / extractedGenerationIds.length);
        let currentGenerationIndex = 0;
        let pairsAssignedToCurrentGen = 0;
        
        for (let i = 0; i < qaPairs.length; i++) {
          if (pairsAssignedToCurrentGen >= pairsPerGeneration && currentGenerationIndex < extractedGenerationIds.length - 1) {
            currentGenerationIndex++;
            pairsAssignedToCurrentGen = 0;
          }
          qaPairs[i].generationId = extractedGenerationIds[currentGenerationIndex];
          pairsAssignedToCurrentGen++;
        }
      } else if (extractedGenerationIds.length === 1) {
        // Single generation: assign to all pairs
        for (const qaPair of qaPairs) {
          qaPair.generationId = extractedGenerationIds[0];
        }
      }
    } else {
      // Auto-detect generations from question content
      console.log('[Import] No generation IDs from frontend, attempting auto-detection from questions...');
      
      // Collect all unique brand/model/generation combinations from questions
      const generationInfoSet = new Set<string>();
      const generationInfoList: Array<{ brand?: string; model?: string; generation?: string; generationCode?: string }> = [];
      
      for (const qaPair of qaPairs) {
        if (qaPair.generationInfo) {
          const { brand, model, generationCode } = qaPair.generationInfo;
          // Accept entries with brand+model even without generationCode (we'll use fuzzy matching)
          if (brand && model) {
            const key = generationCode 
              ? `${brand}|${model}|${generationCode}` 
              : `${brand}|${model}`;
            if (!generationInfoSet.has(key)) {
              generationInfoSet.add(key);
              generationInfoList.push(qaPair.generationInfo);
            }
          }
        }
      }
      
      if (generationInfoList.length === 0) {
        // Try to get more info about what was extracted
        const extractedSamples = qaPairs
          .filter(qa => qa.generationInfo)
          .slice(0, 5)
          .map(qa => qa.generationInfo);
        
        console.log('[Import] Sample extracted generation info:', extractedSamples);
        
        return NextResponse.json({ 
          error: 'Could not auto-detect generation information',
          details: `Unable to extract brand/model/generation information from questions. Found ${qaPairs.length} QA pairs but could not extract valid generation info. Please select generations in Step 1 before importing, or ensure your questions contain generation information in the format "question - BMW 3 Series G20/G21".`
        }, { status: 400 });
      }
      
      console.log('[Import] Found generation info in questions:', generationInfoList.length, 'unique combinations');
      console.log('[Import] Sample generation info found:', generationInfoList.slice(0, 5).map(g => `${g.brand} ${g.model} ${g.generationCode}`));
      
      // Fetch all generations from database to match against
      const { data: allGenerations, error: allGenerationsError } = await supabase
        .from('model_generations')
        .select('id, name, slug, generation_code, car_models!inner(id, name, slug, car_brands!inner(id, name, slug))');
      
      if (allGenerationsError || !allGenerations) {
        console.error('[Import] Failed to fetch all generations:', allGenerationsError);
        return NextResponse.json({ 
          error: 'Failed to fetch generations from database',
          details: 'Could not load generation data for auto-matching. Please select generations in Step 1 before importing.'
        }, { status: 500 });
      }
      
      console.log('[Import] Loaded', allGenerations.length, 'generations from database');
      console.log('[Import] Sample database generations:', allGenerations.slice(0, 5).map(g => {
        const brand = (g.car_models as any)?.car_brands?.name;
        const model = (g.car_models as any)?.name;
        return `${brand} ${model} ${g.generation_code || g.name}`;
      }));
      
      // Create a map of generation codes to generation IDs with multiple matching strategies
      const generationCodeMap = new Map<string, string>();
      const generationCodeOnlyMap = new Map<string, Array<{ id: string; brand: string; model: string }>>();
      
      for (const gen of allGenerations) {
        const brand = (gen.car_models as any)?.car_brands?.name;
        const model = (gen.car_models as any)?.name;
        const genCode = gen.generation_code || gen.name;
        const genName = gen.name;
        
        if (brand && model) {
          // Normalize brand/model names (remove extra spaces, handle variations)
          const normalizedBrand = brand.trim().toLowerCase();
          const normalizedModel = model.trim().toLowerCase();
          
          // Try multiple generation code formats
          const genCodes = [genCode, genName].filter(Boolean);
          
          for (const code of genCodes) {
            if (!code) continue;
            
            // Full key: brand|model|code
            const key1 = `${normalizedBrand}|${normalizedModel}|${code}`;
            const key2 = `${brand}|${model}|${code}`;
            generationCodeMap.set(key1, gen.id);
            generationCodeMap.set(key2, gen.id);
            
            // Model variations (e.g., "3 Series" vs "3-Series" vs "3Series")
            const modelVariations = [
              normalizedModel,
              normalizedModel.replace(/\s+/g, ''),
              normalizedModel.replace(/\s+/g, '-'),
              normalizedModel.replace(/\s+/g, '_'),
            ];
            
            for (const modelVar of modelVariations) {
              const key = `${normalizedBrand}|${modelVar}|${code}`;
              generationCodeMap.set(key, gen.id);
            }
            
            // Generation code only (for disambiguation later)
            if (code.length >= 2) {
              if (!generationCodeOnlyMap.has(code)) {
                generationCodeOnlyMap.set(code, []);
              }
              generationCodeOnlyMap.get(code)!.push({ id: gen.id, brand: normalizedBrand, model: normalizedModel });
            }
          }
        }
      }
      
      // Match QA pairs to generations with improved matching
      let matchedCount = 0;
      const unmatchedSamples: Array<{ brand?: string; model?: string; generationCode?: string }> = [];
      
      for (const qaPair of qaPairs) {
        if (qaPair.generationInfo) {
          const { brand, model, generationCode } = qaPair.generationInfo;
          // Try matching even if generationCode is missing (we'll use fuzzy matching)
          if (brand && model) {
            // Normalize input
            const normalizedBrand = brand.trim().toLowerCase();
            const normalizedModel = model.trim().toLowerCase();
            
            let matchedId: string | undefined;
            
            // If we have a generation code, try exact matching first
            if (generationCode) {
              // Try multiple matching strategies
              const keysToTry = [
                `${normalizedBrand}|${normalizedModel}|${generationCode}`,
                `${brand}|${model}|${generationCode}`,
                `${normalizedBrand}|${normalizedModel.replace(/\s+/g, '')}|${generationCode}`,
                `${normalizedBrand}|${normalizedModel.replace(/\s+/g, '-')}|${generationCode}`,
                `${normalizedBrand}|${normalizedModel.replace(/\s+/g, '_')}|${generationCode}`,
              ];
              
              for (const key of keysToTry) {
                matchedId = generationCodeMap.get(key);
                if (matchedId && uuidRegex.test(matchedId)) {
                  break;
                }
              }
              
              // If still not matched, try generation code only (if unique)
              if (!matchedId && generationCodeOnlyMap.has(generationCode)) {
                const candidates = generationCodeOnlyMap.get(generationCode)!;
                // If only one candidate with matching brand/model, use it
                const matchingCandidates = candidates.filter(c => 
                  c.brand === normalizedBrand && 
                  (c.model === normalizedModel || c.model.includes(normalizedModel) || normalizedModel.includes(c.model))
                );
                
                if (matchingCandidates.length === 1) {
                  matchedId = matchingCandidates[0].id;
                } else if (candidates.length === 1) {
                  // Only one generation with this code, use it
                  matchedId = candidates[0].id;
                }
              }
            }
            
            // If still not matched, try fuzzy matching by brand/model only (ignore generation code)
            if (!matchedId) {
              // Find all generations with matching brand and model
              const brandModelMatches: Array<{ id: string; genCode: string; score: number }> = [];
              for (const gen of allGenerations) {
                const dbBrand = ((gen.car_models as any)?.car_brands?.name || '').toLowerCase().trim();
                const dbModel = ((gen.car_models as any)?.name || '').toLowerCase().trim();
                
                // More flexible brand matching (handle variations like "Mercedes-Benz" vs "Mercedes")
                const brandMatches = dbBrand === normalizedBrand || 
                                   dbBrand.includes(normalizedBrand) || 
                                   normalizedBrand.includes(dbBrand) ||
                                   (normalizedBrand === 'mercedes' && dbBrand.includes('mercedes')) ||
                                   (dbBrand === 'mercedes' && normalizedBrand.includes('mercedes'));
                
                if (brandMatches) {
                  // More flexible model matching
                  const modelMatches = dbModel === normalizedModel || 
                                     dbModel.includes(normalizedModel) || 
                                     normalizedModel.includes(dbModel) ||
                                     dbModel.replace(/\s+/g, '') === normalizedModel.replace(/\s+/g, '') ||
                                     dbModel.replace(/\s+/g, '-') === normalizedModel.replace(/\s+/g, '-') ||
                                     dbModel.replace(/\s+/g, '_') === normalizedModel.replace(/\s+/g, '_');
                  
                  if (modelMatches) {
                    // Calculate a match score (exact matches score higher)
                    let score = 0;
                    if (dbBrand === normalizedBrand) score += 10;
                    if (dbModel === normalizedModel) score += 10;
                    if (dbModel.includes(normalizedModel) || normalizedModel.includes(dbModel)) score += 5;
                    
                    brandModelMatches.push({
                      id: gen.id,
                      genCode: gen.generation_code || gen.name || '',
                      score
                    });
                  }
                }
              }
              
              // Sort by score (best matches first)
              brandModelMatches.sort((a, b) => b.score - a.score);
              
              // If only one match, use it
              if (brandModelMatches.length === 1) {
                matchedId = brandModelMatches[0].id;
                console.log(`[Import] Fuzzy matched ${brand} ${model} ${generationCode || '(no code)'} to ${brandModelMatches[0].genCode}`);
              } else if (brandModelMatches.length > 1 && generationCode) {
                // Multiple matches - try to match by generation code similarity
                const genCodeLower = generationCode.toLowerCase();
                const bestMatch = brandModelMatches.find(m => {
                  const mGenCode = m.genCode.toLowerCase();
                  return mGenCode.includes(genCodeLower) || 
                         genCodeLower.includes(mGenCode) ||
                         mGenCode === genCodeLower ||
                         // Handle cases like "F10/F11" matching "F10"
                         (genCodeLower.includes('/') && mGenCode === genCodeLower.split('/')[0]) ||
                         (!genCodeLower.includes('/') && mGenCode.includes(genCodeLower));
                });
                if (bestMatch) {
                  matchedId = bestMatch.id;
                  console.log(`[Import] Matched ${brand} ${model} ${generationCode} to ${bestMatch.genCode} (from ${brandModelMatches.length} candidates)`);
                } else {
                  // If no exact generation code match, use the highest scoring one
                  matchedId = brandModelMatches[0].id;
                  console.log(`[Import] Multiple matches for ${brand} ${model} ${generationCode}, using best: ${brandModelMatches[0].genCode}`);
                }
              } else if (brandModelMatches.length > 1 && !generationCode) {
                // Multiple matches without generation code - use the highest scoring one
                matchedId = brandModelMatches[0].id;
                console.log(`[Import] Multiple matches for ${brand} ${model} (no code), using best: ${brandModelMatches[0].genCode}`);
              }
            }
            
            if (matchedId && uuidRegex.test(matchedId)) {
              qaPair.generationId = matchedId;
              matchedCount++;
            } else {
              // Collect samples of unmatched items for debugging
              if (unmatchedSamples.length < 10) {
                unmatchedSamples.push({ brand, model, generationCode });
              }
            }
          }
        }
      }
      
      if (unmatchedSamples.length > 0) {
        console.log('[Import] Sample unmatched generation info:', unmatchedSamples);
      }
      
      // Collect all matched generation IDs
      extractedGenerationIds = [...new Set(qaPairs.map(qa => qa.generationId).filter((id): id is string => Boolean(id) && uuidRegex.test(id)))];
    
    if (extractedGenerationIds.length === 0) {
      return NextResponse.json({ 
          error: 'Could not match questions to generations',
          details: `Found ${generationInfoList.length} generation combination(s) in questions but could not match them to database generations. Please select generations in Step 1 before importing. Found combinations: ${generationInfoList.slice(0, 3).map(g => `${g.brand} ${g.model} ${g.generationCode}`).join(', ')}`
      }, { status: 400 });
    }

      console.log('[Import] Auto-matched', matchedCount, 'QA pairs to', extractedGenerationIds.length, 'generations');
      
      // Remove QA pairs that couldn't be matched
      const unmatchedPairs = qaPairs.filter(qa => !qa.generationId);
      if (unmatchedPairs.length > 0) {
        console.warn('[Import]', unmatchedPairs.length, 'QA pairs could not be matched to generations and will be skipped');
      }
    }

    // Filter out QA pairs without valid generation IDs
    const validQaPairs = qaPairs.filter(qa => qa.generationId && uuidRegex.test(qa.generationId));
    const invalidQaPairs = qaPairs.filter(qa => !qa.generationId || !uuidRegex.test(qa.generationId));
    
    if (invalidQaPairs.length > 0) {
      console.warn('[Import]', invalidQaPairs.length, 'QA pairs without valid generation IDs will be skipped');
    }
    
    if (validQaPairs.length === 0) {
      return NextResponse.json({ 
        error: 'No valid QA pairs found',
        details: `All ${qaPairs.length} QA pairs could not be matched to valid generations. Please ensure your questions contain generation information or select generations in Step 1.`
      }, { status: 400 });
    }
    
    console.log('[Import] Using generation IDs:', extractedGenerationIds.length, 'generations');
    console.log('[Import] Questions map size:', questionsMap.size);
    console.log('[Import] Valid QA pairs count:', validQaPairs.length);
    console.log('[Import] Invalid QA pairs count:', invalidQaPairs.length);
    
    // Use validQaPairs for all further processing
    const qaPairsToProcess = validQaPairs;

    // Validate that all generation IDs are valid UUIDs before querying database
    // uuidRegex is already defined above, reuse it
    const validGenerationIds = extractedGenerationIds.filter(id => uuidRegex.test(id));
    const invalidGenerationIds = extractedGenerationIds.filter(id => !uuidRegex.test(id));
    
    if (invalidGenerationIds.length > 0) {
      console.warn('[Import] Invalid UUID format in generation IDs (will be skipped):', invalidGenerationIds);
    }
    
    if (validGenerationIds.length === 0) {
      return NextResponse.json({ 
        error: 'No valid UUID generation IDs found',
        details: `All generation IDs must be valid UUIDs. Found ${invalidGenerationIds.length} invalid ID(s) (e.g., ${invalidGenerationIds.slice(0, 3).join(', ')}). Please ensure you have selected generations in the frontend before importing, as the custom_ids in the JSONL files only contain partial IDs.`
      }, { status: 400 });
    }

    // Fetch all generation data with model and brand info
    // Try with inner join first, fallback to left join if needed
    let { data: generationsData, error: generationsError } = await supabase
      .from('model_generations')
      .select('id, name, slug, generation_code, car_model_id, car_models!inner(id, name, slug, brand_id, car_brands!inner(id, name, slug))')
      .in('id', validGenerationIds);

    // If inner join fails (e.g., missing relationships), try without inner join
    if (generationsError || !generationsData || generationsData.length === 0) {
      console.warn('[Import] Inner join failed, trying without inner join constraint');
      const fallbackResult = await supabase
        .from('model_generations')
        .select('id, name, slug, generation_code, car_model_id, car_models(id, name, slug, brand_id, car_brands(id, name, slug))')
        .in('id', validGenerationIds);
      
      if (!fallbackResult.error && fallbackResult.data && fallbackResult.data.length > 0) {
        generationsData = fallbackResult.data;
        generationsError = null;
      } else if (generationsError) {
        // Use original error
        generationsError = generationsError;
      } else {
        generationsError = fallbackResult.error;
      }
    }

    if (generationsError) {
      console.error('[Import] Supabase error:', generationsError);
      return NextResponse.json({ 
        error: 'Failed to fetch generation data', 
        details: generationsError.message || 'Unknown database error',
        generationIds: extractedGenerationIds,
        hint: 'Please check the console logs for more details'
      }, { status: 500 });
    }

    if (!generationsData || generationsData.length === 0) {
      console.error('[Import] No generation data returned for IDs:', extractedGenerationIds);
      return NextResponse.json({ 
        error: 'No generation data found for the provided generation IDs', 
        generationIds: extractedGenerationIds,
        hint: 'Please verify that the generation IDs in your files are correct and exist in the database. Check the console for extracted IDs.'
      }, { status: 404 });
    }

    // Check if all generation IDs were found
    const foundIds = new Set(generationsData.map(g => g.id));
    const missingIds = extractedGenerationIds.filter(id => !foundIds.has(id));
    
    if (missingIds.length > 0) {
      console.warn('[Import] Some generation IDs were not found:', missingIds);
      // Continue anyway, but log the warning
    }

    // Create maps for quick lookup
    const generationsMap = new Map(generationsData.map(g => [g.id, g]));
    
    // CRITICAL: Create a map from partial UUID to full UUID for custom_id matching
    // The custom_id contains partial UUIDs (e.g., "answer-34430dcc-1"), we need to match them to full UUIDs
    const partialIdToFullIdMap = new Map<string, string>();
    for (const gen of generationsData) {
      const fullId = gen.id;
      // Remove dashes from UUID for partial matching
      const idWithoutDashes = fullId.replace(/-/g, '');
      // Create multiple partial keys (first 8, 12, 16 chars) for flexible matching
      partialIdToFullIdMap.set(idWithoutDashes.substring(0, 8), fullId);
      partialIdToFullIdMap.set(idWithoutDashes.substring(0, 12), fullId);
      partialIdToFullIdMap.set(idWithoutDashes.substring(0, 16), fullId);
      // Also try with dashes removed from partial ID
      const partialWithDashes = fullId.substring(0, 8);
      partialIdToFullIdMap.set(partialWithDashes.replace(/-/g, ''), fullId);
    }
    
    const modelsMap = new Map();
    const brandsMap = new Map();
    
    for (const gen of generationsData) {
      const model = (gen.car_models as any);
      if (model && !modelsMap.has(model.id)) {
        modelsMap.set(model.id, model);
      }
      if (model && model.car_brands && !brandsMap.has(model.brand_id)) {
        brandsMap.set(model.brand_id, model.car_brands);
      }
    }

    // CRITICAL: Process metadata files and map by custom_id
    // Metadata custom_id format: metadata-{generationId}-{index}
    // We need to convert this back to answer-{generationId}-{index} for matching with qaPairs
    const metadataMap = new Map<string, any>();
    const metadataCustomIdToAnswerCustomId = new Map<string, string>();
    const failedMetadata: string[] = [];
    const invalidMetadataCustomIds: string[] = [];
    
    if (allMetadataResults.length > 0) {
          try {
        for (const result of allMetadataResults) {
          const metadataCustomId = result.custom_id;
          
          if (!metadataCustomId) {
            console.warn('[Import] Metadata result missing custom_id, skipping');
            continue;
          }
          
          if (result.error || result.response?.status_code !== 200) {
            failedMetadata.push(metadataCustomId);
            continue;
          }
          
          // Validate metadata custom_id format: should be metadata-{generationId}-{index}
          if (!metadataCustomId.match(/^metadata-.+-\d+$/)) {
            invalidMetadataCustomIds.push(metadataCustomId);
            console.warn(`[Import] Invalid metadata custom_id format: ${metadataCustomId}`);
            continue;
          }
          
          try {
            const metadata = JSON.parse(result.response?.body?.choices?.[0]?.message?.content || '{}');
            
            // Convert metadata custom_id to answer custom_id for matching
            // Format: metadata-{generationId}-{index} -> answer-{generationId}-{index}
            const answerCustomId = metadataCustomId.replace(/^metadata-/, 'answer-');
            metadataMap.set(answerCustomId, metadata);
            metadataCustomIdToAnswerCustomId.set(metadataCustomId, answerCustomId);
          } catch (e) {
            console.error('[Import] Failed to parse metadata:', e, 'custom_id:', metadataCustomId);
          }
        }
        
        // Log metadata processing statistics
        if (failedMetadata.length > 0) {
          console.warn(`[Import] ${failedMetadata.length} metadata entries failed (custom_ids: ${failedMetadata.slice(0, 5).join(', ')}${failedMetadata.length > 5 ? '...' : ''})`);
        }
        if (invalidMetadataCustomIds.length > 0) {
          console.warn(`[Import] ${invalidMetadataCustomIds.length} metadata entries have invalid custom_id format (custom_ids: ${invalidMetadataCustomIds.slice(0, 5).join(', ')}${invalidMetadataCustomIds.length > 5 ? '...' : ''})`);
        }
      } catch (err) {
        console.warn('[Import] Failed to process metadata, continuing without it:', err);
      }
    }

    if (qaPairsToProcess.length === 0) {
      return NextResponse.json({ error: 'No valid Q&A pairs found' }, { status: 400 });
    }

    // Prepare insert data in batches
    // Use larger batches to reduce number of requests (Supabase can handle up to 1000 rows per query)
    // But we use 500 to be safe and avoid timeout issues
    const BATCH_SIZE = 1000; // Reduced batch size to avoid Supabase/Cloudflare 500 errors (1000 is safer than 3000)
    const insertBatches: any[][] = [];
    const indexNowUrls: string[] = [];

    // Helper function to extract metadata from solution text as fallback
    function extractMetadataFromSolution(answer: string, question: string): any {
      const extracted: any = {
        symptoms: [],
        diagnostic_steps: [],
        tools_required: [],
        parts_required: [],
        safety_warnings: [],
        estimated_repair_time: null,
        error_code: null,
      };

      // Extract error code from question or answer
      const errorCodeMatch = (question + ' ' + answer).match(/\bP\d{4}(?:[,-]\s*P\d{4})*\b/i);
      if (errorCodeMatch) {
        extracted.error_code = errorCodeMatch[0].toUpperCase();
      }

      // Extract symptoms from "## Symptoms" section
      const symptomsMatch = answer.match(/##\s*Symptoms?[\s\S]*?(?=##|$)/i);
      if (symptomsMatch) {
        const symptomsText = symptomsMatch[0];
        const symptomLines = symptomsText.split('\n').filter(line => {
          const trimmed = line.trim();
          return trimmed && (trimmed.startsWith('-') || trimmed.startsWith('*') || /^\d+\./.test(trimmed)) && 
                 !trimmed.match(/^##|^###/); // Exclude markdown headers
        });
        extracted.symptoms = symptomLines.map(line => {
          return line.replace(/^[-*\d.\s]+/, '').trim();
        }).filter(s => s.length > 0 && s.length < 200); // Filter out very long lines (likely headers)
      }

      // Extract diagnostic steps from "## Diagnostic Steps" section
      const diagnosticMatch = answer.match(/##\s*Diagnostic\s+Steps?[\s\S]*?(?=##|$)/i);
      if (diagnosticMatch) {
        const diagnosticText = diagnosticMatch[0];
        const stepLines = diagnosticText.split('\n').filter(line => {
          const trimmed = line.trim();
          return trimmed && (trimmed.startsWith('-') || trimmed.startsWith('*') || /^\d+\./.test(trimmed)) &&
                 !trimmed.match(/^##|^###/); // Exclude markdown headers
        });
        extracted.diagnostic_steps = stepLines.map(line => {
          // Remove numbering/bullets but keep the step text
          return line.replace(/^[-*\d.\s]+/, '').trim();
        }).filter(s => s.length > 0 && s.length < 300); // Filter out very long lines
      }

      // Extract tools from "**Tools Required:**" section (most common format)
      const toolsSectionMatch = answer.match(/\*\*Tools\s+Required:\*\*[\s\S]*?(?=\*\*|##|$)/i);
      if (toolsSectionMatch) {
        const toolsText = toolsSectionMatch[0];
        const toolLines = toolsText.split('\n').filter(line => {
          const trimmed = line.trim();
          return trimmed && (trimmed.startsWith('-') || trimmed.startsWith('*')) && 
                 !trimmed.match(/^##|^###|\*\*/); // Exclude headers
        });
        extracted.tools_required = toolLines.map(line => {
          return line.replace(/^[-*\s]+/, '').trim();
        }).filter(t => t.length > 0 && t.length < 100);
      }
      
      // Also try "## Tools" or "Tools Required" sections
      if (extracted.tools_required.length === 0) {
        const toolsMatch = answer.match(/(?:##\s*Tools|Tools\s+Required|Tools\s+&?\s+Equipment)[\s\S]*?(?=##|$)/i);
        if (toolsMatch) {
          const toolsText = toolsMatch[0];
          const toolLines = toolsText.split('\n').filter(line => {
            const trimmed = line.trim();
            return trimmed && (trimmed.startsWith('-') || trimmed.startsWith('*') || /^\d+\./.test(trimmed));
          });
          extracted.tools_required = toolLines.map(line => {
            return line.replace(/^[-*\d.\s]+/, '').trim();
          }).filter(t => t.length > 0 && t.length < 100);
        }
      }
      
      // Extract tools from solution steps (e.g., "**Tools Required:** Socket set, torque wrench")
      if (extracted.tools_required.length === 0) {
        const toolsInSteps = answer.match(/\*\*Tools\s+Required:\*\*\s*([^\n]+)/i) ||
                            answer.match(/Tools\s+Required[:\s]+([^\n]+)/i);
        if (toolsInSteps) {
          const toolsList = toolsInSteps[1].split(/[,;]/).map(t => t.trim()).filter(t => t.length > 0);
          extracted.tools_required = toolsList;
        }
      }
      
      // Extract common tools from solution text if still empty
      if (extracted.tools_required.length === 0) {
        const commonTools = ['OBD-II scanner', 'Multimeter', 'Socket set', 'Torque wrench', 'Compression tester', 'Fuel pressure gauge', 'Spark plug socket', 'Wrench', 'Screwdriver', 'Fuel injector cleaning kit', 'Compression gauge'];
        const foundTools = commonTools.filter(tool => 
          answer.toLowerCase().includes(tool.toLowerCase())
        );
        if (foundTools.length > 0) {
          extracted.tools_required = foundTools;
        }
      }

      // Extract parts from "**Parts Required:**" section (most common format)
      const partsSectionMatch = answer.match(/\*\*Parts\s+Required:\*\*[\s\S]*?(?=\*\*|##|$)/i);
      if (partsSectionMatch) {
        const partsText = partsSectionMatch[0];
        const partLines = partsText.split('\n').filter(line => {
          const trimmed = line.trim();
          return trimmed && (trimmed.startsWith('-') || trimmed.startsWith('*')) &&
                 !trimmed.match(/^##|^###|\*\*/); // Exclude headers
        });
        extracted.parts_required = partLines.map(line => {
          return line.replace(/^[-*\s]+/, '').trim();
        }).filter(p => p.length > 0 && p.length < 100);
      }
      
      // Also try "## Parts" section
      if (extracted.parts_required.length === 0) {
        const partsMatch = answer.match(/##\s*Parts[\s\S]*?(?=##|$)/i);
        if (partsMatch) {
          const partsText = partsMatch[0];
          const partLines = partsText.split('\n').filter(line => {
            const trimmed = line.trim();
            return trimmed && (trimmed.startsWith('-') || trimmed.startsWith('*') || /^\d+\./.test(trimmed));
          });
          extracted.parts_required = partLines.map(line => {
            return line.replace(/^[-*\d.\s]+/, '').trim();
          }).filter(p => p.length > 0 && p.length < 100);
        }
      }
      
      // Also extract parts mentioned in solution steps (e.g., "Replace with new spark plug")
      if (extracted.parts_required.length === 0) {
        const partsKeywords = ['spark plug', 'ignition coil', 'fuel injector', 'brake pad', 'brake rotor', 'air filter', 'oil filter', 'battery', 'sensor', 'gasket', 'seal', 'fuel pump', 'transmission fluid', 'brake fluid'];
        const foundParts: string[] = [];
        for (const keyword of partsKeywords) {
          if (answer.toLowerCase().includes(keyword.toLowerCase()) && 
              (answer.toLowerCase().includes('replace') || answer.toLowerCase().includes('new') || answer.toLowerCase().includes('install') || answer.toLowerCase().includes('required'))) {
            // Capitalize first letter of each word
            foundParts.push(keyword.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '));
          }
        }
        if (foundParts.length > 0) {
          extracted.parts_required = [...new Set(foundParts)]; // Remove duplicates
        }
      }

      // Extract safety warnings from "**Safety Warnings:**" section
      const safetyMatch = answer.match(/\*\*Safety\s+Warnings?:\*\*[\s\S]*?(?=\*\*|$)/i) ||
                         answer.match(/##\s*Safety[\s\S]*?(?=##|$)/i);
      if (safetyMatch) {
        const safetyText = safetyMatch[0];
        const warningLines = safetyText.split('\n').filter(line => {
          const trimmed = line.trim();
          return trimmed && (trimmed.startsWith('-') || trimmed.startsWith('*') || trimmed.startsWith('⚠'));
        });
        extracted.safety_warnings = warningLines.map(line => {
          return line.replace(/^[-*\d⚠.\s]+/, '').trim();
        }).filter(w => w.length > 0);
      }

      // Extract estimated repair time
      const timeMatch = answer.match(/\*\*Estimated\s+Repair\s+Time:\*\*\s*([^\n]+)/i) ||
                       answer.match(/Estimated\s+Repair\s+Time[:\s]+([^\n]+)/i) ||
                       answer.match(/(\d+[-–]\d+\s+hours?)/i) ||
                       answer.match(/(\d+\s+hours?)/i);
      if (timeMatch) {
        extracted.estimated_repair_time = timeMatch[1]?.trim() || timeMatch[0]?.trim();
      }

      return extracted;
    }

    // CRITICAL: Match metadata by custom_id, NOT by index!
    // Using index would cause misalignment if any entries are missing
    let qaPairsWithMetadata = 0;
    let qaPairsWithoutMetadata = 0;
    
    for (let i = 0; i < qaPairsToProcess.length; i++) {
      try {
        const qaPair = qaPairsToProcess[i];
        
        // CRITICAL: Use custom_id for matching, not index
        // The custom_id format is: answer-{generationId}-{index}
        // Metadata is stored with the same key (converted from metadata-{generationId}-{index})
        const metadataId = qaPair.customId; // Use the stored custom_id from qaPair
        let metadata = metadataMap.get(metadataId) || {};
        
        if (Object.keys(metadata).length > 0) {
          qaPairsWithMetadata++;
        } else if (allMetadataResults.length > 0) {
          qaPairsWithoutMetadata++;
          // Only log first few to avoid spam
          if (qaPairsWithoutMetadata <= 5) {
            console.warn(`[Import] No metadata found for custom_id: ${metadataId} (this is expected if metadata batch had failures)`);
          }
        }
        
        const { question, answer, generationId: qaGenerationId, customId } = qaPair;
        
        // CRITICAL: Resolve generation ID from custom_id if qaGenerationId is partial
        // The custom_id format is: answer-{partialGenerationId}-{index}
        // We need to match the partial ID to a full UUID from the selected generations
        let resolvedGenerationId = qaGenerationId;
        
        if (customId && (!resolvedGenerationId || !uuidRegex.test(resolvedGenerationId))) {
          // Extract partial generation ID from custom_id
          const customIdMatch = customId.match(/^answer-(.+?)-(\d+)$/);
          if (customIdMatch) {
            const partialId = customIdMatch[1];
            // Remove dashes from partial ID for matching
            const partialIdClean = partialId.replace(/-/g, '');
            
            // Try to find full UUID by matching partial ID
            // Try different lengths (8, 12, 16 chars)
            for (const length of [16, 12, 8]) {
              if (partialIdClean.length >= length) {
                const key = partialIdClean.substring(0, length);
                const fullId = partialIdToFullIdMap.get(key);
                if (fullId) {
                  resolvedGenerationId = fullId;
                  console.log(`[Import] Resolved partial ID ${partialId} to full UUID ${fullId} for custom_id ${customId}`);
                  break;
                }
              }
            }
            
            // If still not found, try direct lookup in generationsMap by partial match
            if (!resolvedGenerationId || !uuidRegex.test(resolvedGenerationId)) {
              for (const [fullId, gen] of generationsMap.entries()) {
                const fullIdClean = fullId.replace(/-/g, '');
                if (fullIdClean.startsWith(partialIdClean) || partialIdClean.startsWith(fullIdClean.substring(0, 8))) {
                  resolvedGenerationId = fullId;
                  console.log(`[Import] Matched partial ID ${partialId} to full UUID ${fullId} via direct lookup`);
                  break;
                }
              }
            }
          }
        }
        
        // Validate resolved generation ID
        if (!resolvedGenerationId || !uuidRegex.test(resolvedGenerationId)) {
          console.warn(`[Import] Could not resolve generation ID for custom_id ${customId}, qaGenerationId: ${qaGenerationId}, skipping question ${i + 1}`);
          continue;
        }
        
        // Get generation data for this question using resolved ID
        const generation = generationsMap.get(resolvedGenerationId);
        if (!generation) {
          console.warn(`[Import] Generation not found for resolved ID ${resolvedGenerationId} (custom_id: ${customId}), skipping question ${i + 1}`);
          continue;
        }
        
        // Get model and brand data for this generation
        const model = (generation.car_models as any);
        const brand = model && model.car_brands ? model.car_brands : null;
        const brandSlug = brand?.slug;
        const modelSlug = model?.slug;
        
        // Fallback: Extract metadata from solution if arrays are empty
        if (contentType === 'fault') {
          const fallbackMetadata = extractMetadataFromSolution(answer, question);
          
          // Merge fallback data if metadata arrays are empty
          if (!metadata.symptoms || metadata.symptoms.length === 0) {
            metadata.symptoms = fallbackMetadata.symptoms;
          }
          if (!metadata.diagnostic_steps || metadata.diagnostic_steps.length === 0) {
            metadata.diagnostic_steps = fallbackMetadata.diagnostic_steps;
          }
          if (!metadata.tools_required || metadata.tools_required.length === 0) {
            metadata.tools_required = fallbackMetadata.tools_required;
          }
          if (!metadata.parts_required || metadata.parts_required.length === 0) {
            metadata.parts_required = fallbackMetadata.parts_required;
          }
          if (!metadata.safety_warnings || metadata.safety_warnings.length === 0) {
            metadata.safety_warnings = fallbackMetadata.safety_warnings;
          }
          if (!metadata.estimated_repair_time) {
            metadata.estimated_repair_time = fallbackMetadata.estimated_repair_time;
          }
          if (!metadata.error_code && fallbackMetadata.error_code) {
            metadata.error_code = fallbackMetadata.error_code;
          }
        }
        
        if (!metadata.meta_title && question) {
          metadata.meta_title = question.length > 60 ? question.substring(0, 60).trim() + '...' : question.trim();
        }
        if (!metadata.meta_description && answer) {
          metadata.meta_description = answer.split('\n\n')[0]?.substring(0, 200) || question.substring(0, 200);
        }

        const slug = generateSlug(question, i);
        const title = question.length > 100 ? question.substring(0, 100).trim() + '...' : question.trim();
        const description = metadata.meta_description || answer.split('\n\n')[0]?.substring(0, 200) || question;

        // Note: Duplicate check will be done in batch before insert for better performance

        const insertData: any = {
          model_generation_id: generation.id,
          slug,
          title,
          description,
          language_path: language,
          status: 'live',
          ...(contentType === 'fault' ? {
            solution: answer,
            severity: metadata.severity || 'medium',
            difficulty_level: metadata.difficulty_level || 'medium',
            error_code: metadata.error_code || null,
            affected_component: metadata.affected_component || null,
            symptoms: metadata.symptoms || [],
            diagnostic_steps: metadata.diagnostic_steps || [],
            tools_required: metadata.tools_required || [],
            parts_required: metadata.parts_required || [],
            safety_warnings: metadata.safety_warnings || [],
            estimated_repair_time: metadata.estimated_repair_time || null,
            meta_title: metadata.meta_title || title,
            meta_description: metadata.meta_description || description,
            seo_score: metadata.seo_score || null,
            content_score: metadata.content_score || null,
          } : {
            content: answer,
            manual_type: metadata.manual_type || 'repair',
            difficulty_level: metadata.difficulty_level || 'medium',
            estimated_time: metadata.estimated_time || null,
            tools_required: metadata.tools_required || [],
            parts_required: metadata.parts_required || [],
            meta_title: metadata.meta_title || title,
            meta_description: metadata.meta_description || description,
          }),
        };

        const batchIndex = Math.floor(i / BATCH_SIZE);
        if (!insertBatches[batchIndex]) {
          insertBatches[batchIndex] = [];
        }
        insertBatches[batchIndex].push(insertData);

        if (brandSlug && modelSlug && generation.slug) {
          const url = `https://faultbase.com/${language}/cars/${brandSlug}/${modelSlug}/${generation.slug}/${contentType === 'fault' ? 'faults' : 'manuals'}/${slug}`;
          indexNowUrls.push(url);
        }
      } catch (error) {
        console.error(`Error preparing item ${i + 1}:`, error);
      }
    }

    // Batch check for duplicates before inserting (more efficient than checking one by one)
    const tableName = contentType === 'fault' ? 'car_faults' : 'car_manuals';
    
    // Collect all slugs grouped by generation_id and language for batch duplicate check
    const slugsByGenerationLang = new Map<string, Set<string>>();
    for (const batch of insertBatches) {
      for (const item of batch) {
        const key = `${item.model_generation_id}|${item.language_path}`;
        if (!slugsByGenerationLang.has(key)) {
          slugsByGenerationLang.set(key, new Set());
        }
        slugsByGenerationLang.get(key)!.add(item.slug);
      }
    }
    
    // Batch query for existing slugs
    const existingSlugsSet = new Set<string>();
    for (const [key, slugs] of slugsByGenerationLang) {
      const [generationId, lang] = key.split('|');
      const slugArray = Array.from(slugs);
      
      if (slugArray.length > 0) {
        const { data: existing } = await supabase
          .from(tableName)
          .select('slug')
          .eq('model_generation_id', generationId)
          .eq('language_path', lang)
          .in('slug', slugArray);
        
        if (existing) {
          for (const item of existing) {
            existingSlugsSet.add(`${generationId}|${item.slug}|${lang}`);
          }
        }
      }
    }
    
    // Remove duplicates from insert batches
    let skippedDuplicates = 0;
    for (let batchIndex = 0; batchIndex < insertBatches.length; batchIndex++) {
      const originalLength = insertBatches[batchIndex].length;
      insertBatches[batchIndex] = insertBatches[batchIndex].filter(item => {
        const key = `${item.model_generation_id}|${item.slug}|${item.language_path}`;
        return !existingSlugsSet.has(key);
      });
      skippedDuplicates += originalLength - insertBatches[batchIndex].length;
    }
    
    if (skippedDuplicates > 0) {
      console.log(`[Import] Skipped ${skippedDuplicates} duplicate entries before insert`);
    }
    
    let successCount = 0;
    let failedCount = 0;
    const errors: string[] = [];
    const insertedFaultIds: string[] = []; // Collect IDs for embedding generation

    // Rate limiting: Supabase has ~120 requests/minute limit, but we can use larger batches
    // Process batches in parallel groups for maximum speed
    const PARALLEL_BATCHES = 10; // Process 10 batches in parallel (aggressive parallelization)
    const REQUESTS_PER_MINUTE = 115; // Stay just under 120 limit (more aggressive)
    // Delay between parallel groups: we send PARALLEL_BATCHES requests at once
    // With 10 parallel batches, we need ~5.2 seconds between groups to stay under limit
    const DELAY_BETWEEN_PARALLEL_GROUPS_MS = Math.ceil((60 * 1000) / REQUESTS_PER_MINUTE) * PARALLEL_BATCHES; // ~5.2 seconds

    // Process batches in parallel groups
    for (let groupStart = 0; groupStart < insertBatches.length; groupStart += PARALLEL_BATCHES) {
      const batchGroup = insertBatches.slice(groupStart, groupStart + PARALLEL_BATCHES);
      
      // Process all batches in this group in parallel
      const groupPromises = batchGroup.map(async (batch, groupIndex) => {
        const batchIndex = groupStart + groupIndex;
        if (batch.length === 0) return { success: true, count: 0 };

      let retryCount = 0;
      const maxRetries = 3;
      let batchSuccess = false;
        let insertedData: any[] = [];

      while (retryCount < maxRetries && !batchSuccess) {
        try {
            const result = await supabase
            .from(tableName)
            .insert(batch)
            .select('id, slug');

            if (result.error) {
              // Check if it's a rate limit error or server error
              const errorMessage = result.error.message || '';
              const isRateLimit = errorMessage.includes('rate limit') || 
                                 errorMessage.includes('too many requests') ||
                                 result.error.code === 'PGRST116' ||
                                 (result.error as any).status === 429;
              
              const isServerError = (result.error as any).status === 500 ||
                                   errorMessage.includes('Internal server error') ||
                                   errorMessage.includes('<!DOCTYPE html>') ||
                                   errorMessage.includes('Cloudflare');

              if ((isRateLimit || isServerError) && retryCount < maxRetries - 1) {
              // Wait longer before retry (exponential backoff)
                const waitTime = 2000 * Math.pow(2, retryCount); // 2s, 4s, 8s (longer for server errors)
                console.warn(`Error (${isRateLimit ? 'rate limit' : 'server error'}) for batch ${batchIndex + 1}, waiting ${waitTime}ms before retry ${retryCount + 1}/${maxRetries}`);
              await new Promise(resolve => setTimeout(resolve, waitTime));
              retryCount++;
              continue;
            }

              // If not rate limit/server error or max retries reached, try smaller batches
              console.warn(`Batch insert failed for batch ${batchIndex + 1}, trying smaller batches:`, errorMessage.substring(0, 200));
            
              // Split into smaller batches of 250 (more conservative to avoid Supabase 500 errors)
              const SMALL_BATCH_SIZE = 250;
            for (let i = 0; i < batch.length; i += SMALL_BATCH_SIZE) {
              const smallBatch = batch.slice(i, i + SMALL_BATCH_SIZE);
              try {
                  const smallResult = await supabase
                    .from(tableName)
                    .insert(smallBatch)
                    .select('id, slug');
                    
                  if (smallResult.error) {
                    // Last resort: even smaller batches of 100
                    const TINY_BATCH_SIZE = 100;
                    for (let j = 0; j < smallBatch.length; j += TINY_BATCH_SIZE) {
                      const tinyBatch = smallBatch.slice(j, j + TINY_BATCH_SIZE);
                      const tinyResult = await supabase
                        .from(tableName)
                        .insert(tinyBatch)
                        .select('id, slug');
                      
                      if (!tinyResult.error && tinyResult.data) {
                        insertedData.push(...tinyResult.data);
                    }
                  }
                  } else if (smallResult.data) {
                    insertedData.push(...smallResult.data);
                }
              } catch (smallError) {
                  // Continue with next batch
              }
            }
            batchSuccess = true;
            } else if (result.data) {
              insertedData = result.data;
            batchSuccess = true;
          }
        } catch (error) {
          const isRateLimit = error instanceof Error && (
            error.message?.includes('rate limit') || 
            error.message?.includes('too many requests')
          );

          if (isRateLimit && retryCount < maxRetries - 1) {
              const waitTime = 1000 * Math.pow(2, retryCount);
            console.warn(`Rate limit error for batch ${batchIndex + 1}, waiting ${waitTime}ms before retry ${retryCount + 1}/${maxRetries}`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            retryCount++;
            continue;
          }

          batchSuccess = true; // Exit retry loop even on error
        }
      }

        // Return results for aggregation outside parallel processing
        return { 
          success: insertedData && insertedData.length > 0, 
          count: insertedData?.length || 0,
          faultIds: contentType === 'fault' ? (insertedData?.map((item: any) => item.id) || []) : [],
          failed: insertedData && insertedData.length > 0 ? 0 : batch.length
        };
      });

      // Wait for all batches in this group to complete
      const groupResults = await Promise.all(groupPromises);
      
      // Aggregate results from this parallel group
      for (const result of groupResults) {
        successCount += result.count;
        failedCount += result.failed;
        if (result.faultIds && result.faultIds.length > 0) {
          insertedFaultIds.push(...result.faultIds);
        }
      }
      
      const groupSuccess = groupResults.reduce((sum, r) => sum + r.count, 0);
      const totalProcessed = successCount + failedCount;
      const progressPercent = Math.round((totalProcessed / qaPairsToProcess.length) * 100);
      console.log(`[Import] Parallel group ${Math.floor(groupStart / PARALLEL_BATCHES) + 1}/${Math.ceil(insertBatches.length / PARALLEL_BATCHES)}: ${groupSuccess} items inserted (Total: ${successCount} success, ${failedCount} failed, ${progressPercent}% complete)`);

      // Reduced delay between parallel groups for faster processing
      // Only delay if we're not at the last group
      if (groupStart + PARALLEL_BATCHES < insertBatches.length) {
        // Use a smaller delay - we're already batching aggressively
        await new Promise(resolve => setTimeout(resolve, Math.max(1000, DELAY_BETWEEN_PARALLEL_GROUPS_MS / 2))); // At least 1s, but half of calculated delay
      }
    }

    // Generate embeddings via OpenAI Batch API (async, non-blocking)
    let embeddingBatchInfo: { batchId?: string; fileId?: string; filename?: string; entriesCount?: number } | null = null;
    
    if (insertedFaultIds.length > 0 && contentType === 'fault') {
      // Small delay to ensure all faults are committed to database
      console.log('[Import] Waiting 2 seconds for database to commit inserts before creating embedding batch...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Filter out invalid UUIDs
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const validFaultIds = insertedFaultIds.filter(id => {
        return typeof id === 'string' && uuidRegex.test(id);
      });
      
      if (validFaultIds.length !== insertedFaultIds.length) {
        console.warn(`[Import] Filtered out ${insertedFaultIds.length - validFaultIds.length} invalid UUIDs from embedding batch`);
      }

      if (validFaultIds.length > 0) {
        try {
          // Create embedding batch JSONL from questions file(s) and submit to OpenAI Batch API
          const embeddingBatchUrl = `${baseUrl}/api/embeddings/generate-batch-jsonl`;
          console.log(`[Import] Creating embedding batch from questions file(s) for ${validFaultIds.length} faults...`);
          
          // Send questions file(s) directly instead of faultIds
          const embeddingFormData = new FormData();
          if (useMultipleFiles) {
            questionsFiles.forEach(file => embeddingFormData.append('questionsFiles', file));
          } else {
            // Get questionsFile from the single file mode
            const singleQuestionsFile = questionsFiles.length > 0 ? questionsFiles[0] : null;
            if (singleQuestionsFile) {
              embeddingFormData.append('questionsFile', singleQuestionsFile);
            }
          }
          
          const embeddingBatchResponse = await fetch(embeddingBatchUrl, {
        method: 'POST',
            body: embeddingFormData,
          });

          if (embeddingBatchResponse.ok) {
            const batchData = await embeddingBatchResponse.json();
            embeddingBatchInfo = {
              batchId: batchData.batchId,
              fileId: batchData.fileId,
              filename: batchData.filename,
              entriesCount: batchData.entriesCount
            };
            console.log(`[Import] Embedding batch created: ${batchData.batchId} (${batchData.entriesCount} entries, file: ${batchData.filename})`);
          } else {
            const errorText = await embeddingBatchResponse.text().catch(() => 'Unknown error');
            console.warn(`[Import] Failed to create embedding batch:`, errorText.substring(0, 200));
          }
        } catch (error) {
          console.error(`[Import] Error creating embedding batch:`, error);
        }
      }
    }

    // Submit IndexNow URLs in batches with retry logic
    let indexNowSuccessCount = 0;
    let indexNowFailedCount = 0;
    
    if (indexNowUrls.length > 0) {
      try {
        const { submitMultipleToIndexNow } = await import('@/lib/submitToIndexNow');
        const INDEXNOW_BATCH_SIZE = 100; // IndexNow API limit is 10,000, but we batch smaller for reliability
        
        console.log(`[Import] Submitting ${indexNowUrls.length} URLs to IndexNow in ${Math.ceil(indexNowUrls.length / INDEXNOW_BATCH_SIZE)} batches`);
        
        for (let i = 0; i < indexNowUrls.length; i += INDEXNOW_BATCH_SIZE) {
          const urlBatch = indexNowUrls.slice(i, i + INDEXNOW_BATCH_SIZE);
          let retryCount = 0;
          const maxRetries = 3;
          let batchSuccess = false;

          while (retryCount < maxRetries && !batchSuccess) {
            try {
              await submitMultipleToIndexNow(urlBatch);
              indexNowSuccessCount += urlBatch.length;
              batchSuccess = true;
              console.log(`[Import] IndexNow batch ${Math.floor(i / INDEXNOW_BATCH_SIZE) + 1}: ${urlBatch.length} URLs submitted successfully`);
            } catch (error) {
              retryCount++;
              if (retryCount < maxRetries) {
                const waitTime = 1000 * retryCount; // Exponential backoff: 1s, 2s, 3s
                console.warn(`[Import] IndexNow batch ${Math.floor(i / INDEXNOW_BATCH_SIZE) + 1} failed, retrying in ${waitTime}ms (${retryCount}/${maxRetries})`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
              } else {
                console.error(`[Import] IndexNow batch ${Math.floor(i / INDEXNOW_BATCH_SIZE) + 1} failed after ${maxRetries} retries`);
                indexNowFailedCount += urlBatch.length;
              }
            }
          }

          // Small delay between batches
          if (i + INDEXNOW_BATCH_SIZE < indexNowUrls.length) {
            await new Promise(resolve => setTimeout(resolve, 200));
          }
        }

        console.log(`[Import] IndexNow submission complete: ${indexNowSuccessCount} successful, ${indexNowFailedCount} failed`);
      } catch (error) {
        console.error('[Import] Failed to submit URLs to IndexNow:', error);
        indexNowFailedCount = indexNowUrls.length;
      }
    }

    return NextResponse.json({
      success: true,
      successCount,
      failed: failedCount,
      total: qaPairsToProcess.length,
      embeddings: {
        batchId: embeddingBatchInfo?.batchId,
        fileId: embeddingBatchInfo?.fileId,
        filename: embeddingBatchInfo?.filename,
        entriesCount: embeddingBatchInfo?.entriesCount || 0,
        total: insertedFaultIds.length,
        note: embeddingBatchInfo ? 'Embeddings submitted to OpenAI Batch API. Use /api/embeddings/import-batch-results when batch completes.' : 'No embedding batch created'
      },
      indexNow: {
        successful: indexNowSuccessCount,
        failed: indexNowFailedCount,
        total: indexNowUrls.length,
      },
    });
  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

