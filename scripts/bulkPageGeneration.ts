#!/usr/bin/env node

/**
 * Bulk Page Generation Script
 * 
 * This script generates metadata for all questions in questions2 that don't have it yet.
 * It processes questions in batches with proper error handling, progress tracking, and resume capability.
 * 
 * IMPORTANT: This is a read-write process that updates questions2 with metadata.
 * 
 * Usage: npx tsx scripts/bulkPageGeneration.ts [--limit N] [--resume]
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

// Load .env.local file if it exists
try {
  const envPath = join(process.cwd(), '.env.local');
  if (existsSync(envPath)) {
    const envFile = readFileSync(envPath, 'utf-8');
    envFile.split('\n').forEach(line => {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('#') && trimmedLine.includes('=')) {
        const [key, ...valueParts] = trimmedLine.split('=');
        const value = valueParts.join('=').replace(/^["']|["']$/g, '');
        if (key && value) {
          process.env[key.trim()] = value.trim();
        }
      }
    });
  }
} catch (error) {
  // .env.local doesn't exist or can't be read, that's okay
  console.log('ℹ️  .env.local not found, using environment variables from system');
}

// Configuration
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://faultbase.com';
const BATCH_SIZE = 5; // Smaller batches to avoid rate limits
const DELAY_MS = 2000; // 2 seconds delay between batches
const MAX_RETRIES = 3;
const PROGRESS_FILE = join(process.cwd(), '.bulk-generation-progress.json');

// Parse command line arguments
const args = process.argv.slice(2);
const limitArg = args.find(arg => arg.startsWith('--limit='));
const limit = limitArg ? parseInt(limitArg.split('=')[1], 10) : undefined;
const shouldResume = args.includes('--resume');

interface Progress {
  processedIds: string[];
  failedIds: string[];
  lastRun: string;
  totalFound: number;
}

// Initialize Supabase client
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Make sure to run this script with your .env.local file loaded');
  process.exit(1);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function loadProgress(): Progress | null {
  if (!shouldResume || !existsSync(PROGRESS_FILE)) {
    return null;
  }
  try {
    const content = readFileSync(PROGRESS_FILE, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.warn('⚠️  Could not load progress file, starting fresh');
    return null;
  }
}

function saveProgress(progress: Progress): void {
  try {
    writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2), 'utf-8');
  } catch (error) {
    console.warn('⚠️  Could not save progress file:', error);
  }
}

function clearProgress(): void {
  try {
    if (existsSync(PROGRESS_FILE)) {
      require('fs').unlinkSync(PROGRESS_FILE);
    }
  } catch (error) {
    // Ignore errors
  }
}

async function generateMetadataForQuestion(questionId: string): Promise<boolean> {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(`${SITE_URL}/api/questions/generate-metadata`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: questionId }),
      });

      if (response.ok) {
        return true;
      }

      const errorText = await response.text();
      if (attempt < MAX_RETRIES) {
        console.warn(`⚠️  Attempt ${attempt}/${MAX_RETRIES} failed for ID ${questionId}: ${response.status} - ${errorText.substring(0, 100)}`);
        await sleep(1000 * attempt); // Exponential backoff
      } else {
        console.error(`❌ Failed after ${MAX_RETRIES} attempts for ID ${questionId}: ${response.status} - ${errorText.substring(0, 100)}`);
        return false;
      }
    } catch (error) {
      if (attempt < MAX_RETRIES) {
        console.warn(`⚠️  Attempt ${attempt}/${MAX_RETRIES} network error for ID ${questionId}:`, error instanceof Error ? error.message : String(error));
        await sleep(1000 * attempt);
      } else {
        console.error(`❌ Network error after ${MAX_RETRIES} attempts for ID ${questionId}:`, error instanceof Error ? error.message : String(error));
        return false;
      }
    }
  }
  return false;
}

async function main() {
  console.log('🚀 Starting bulk page generation...');
  console.log(`📡 Using site URL: ${SITE_URL}`);
  
  // Load progress if resuming
  const existingProgress = loadProgress();
  const processedIds = new Set<string>(existingProgress?.processedIds || []);
  const failedIds = new Set<string>(existingProgress?.failedIds || []);

  if (existingProgress) {
    console.log(`📂 Resuming from previous run:`);
    console.log(`   - Already processed: ${processedIds.size}`);
    console.log(`   - Previously failed: ${failedIds.size}`);
    console.log(`   - Last run: ${existingProgress.lastRun}`);
  }

  try {
    // Fetch questions that need metadata generation
    console.log('🔎 Fetching questions that need metadata generation...');
    
    // Build query
    let query = supabase
      .from('questions2')
      .select('id, question, answer, meta_generated, slug, language_path, status')
      .eq('meta_generated', false)
      .not('question', 'is', null)
      .not('answer', 'is', null);

    // If resuming, we'll filter out processed IDs in JavaScript
    // (Supabase doesn't support NOT IN easily, so we filter after fetching)

    // Apply limit if specified
    if (limit) {
      query = query.limit(limit);
    }

    const { data: questions, error } = await query;

    if (error) {
      console.error('❌ Error fetching questions:', error);
      process.exit(1);
    }

    if (!questions || questions.length === 0) {
      if (processedIds.size > 0) {
        console.log('✅ All remaining questions have been processed!');
      } else {
        console.log('✅ No questions need metadata generation. All caught up!');
      }
      clearProgress();
      return;
    }

    console.log(`📝 Found ${questions.length} questions needing metadata generation`);
    
    // Filter out already processed IDs and questions without valid question/answer
    const validQuestions = questions.filter(q => 
      !processedIds.has(q.id) &&
      q.question && 
      q.answer && 
      q.question.trim().length > 0 && 
      q.answer.trim().length > 0
    );

    console.log(`✅ ${validQuestions.length} questions have valid question/answer pairs`);

    if (validQuestions.length === 0) {
      console.log('⚠️  No valid questions to process');
      return;
    }

    // Initialize progress tracking
    const progress: Progress = {
      processedIds: Array.from(processedIds),
      failedIds: Array.from(failedIds),
      lastRun: new Date().toISOString(),
      totalFound: validQuestions.length + processedIds.size
    };

    let successCount = 0;
    let failureCount = 0;

    // Process in batches
    for (let i = 0; i < validQuestions.length; i += BATCH_SIZE) {
      const batch = validQuestions.slice(i, i + BATCH_SIZE);
      const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(validQuestions.length / BATCH_SIZE);

      console.log(`\n📦 Processing batch ${batchNumber}/${totalBatches} (${batch.length} questions)...`);

      // Process batch in parallel
      const batchResults = await Promise.all(
        batch.map(async (q) => {
          const result = await generateMetadataForQuestion(q.id);
          return { id: q.id, success: result, slug: q.slug };
        })
      );

      // Update progress
      for (const result of batchResults) {
        if (result.success) {
          progress.processedIds.push(result.id);
          successCount++;
          console.log(`   ✅ ${result.slug || result.id.substring(0, 8)}`);
        } else {
          progress.failedIds.push(result.id);
          failureCount++;
          console.log(`   ❌ ${result.slug || result.id.substring(0, 8)}`);
        }
      }

      // Save progress after each batch
      saveProgress(progress);

      // Delay between batches (except for the last batch)
      if (i + BATCH_SIZE < validQuestions.length) {
        console.log(`⏳ Waiting ${DELAY_MS}ms before next batch...`);
        await sleep(DELAY_MS);
      }
    }

    // Final summary
    console.log('\n📊 Generation Summary:');
    console.log(`✅ Successfully processed: ${successCount}`);
    console.log(`❌ Failed: ${failureCount}`);
    console.log(`📈 Total processed (this run + previous): ${progress.processedIds.length}`);
    console.log(`📉 Total failed (this run + previous): ${progress.failedIds.length}`);

    if (failureCount > 0) {
      console.log('\n⚠️  Some questions failed. You can run with --resume to retry failed ones.');
      console.log(`   Failed IDs saved to: ${PROGRESS_FILE}`);
    } else if (progress.failedIds.length > 0) {
      console.log('\n⚠️  Previous failures remain. Run with --resume to retry them.');
    } else {
      console.log('\n🎉 All questions processed successfully!');
      clearProgress();
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

// Run the script
main()
  .then(() => {
    console.log('\n🏁 Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  });

