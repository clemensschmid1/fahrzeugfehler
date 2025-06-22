#!/usr/bin/env node

/**
 * Bulk IndexNow Submission Script
 * 
 * This script fetches all existing live knowledge pages from Supabase
 * and submits them to Bing IndexNow for immediate indexing.
 * 
 * IMPORTANT: This is a read-only process that does not modify any data.
 * 
 * Usage: npx tsx scripts/bulkSubmitToIndexNow.ts
 */

import { createClient } from '@supabase/supabase-js';

// Configuration
const INDEXNOW_KEY = process.env.INDEXNOW_KEY || 'REPLACE_WITH_YOUR_INDEXNOW_KEY';
const HOST = 'infoneva.com';
const KEY_LOCATION = 'https://infoneva.com/indexnow.json';
const BATCH_SIZE = 100; // URLs per batch
const BATCH_DELAY_MS = 1000; // 1 second delay between batches
const MAX_RETRIES = 3;

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

interface QuestionRow {
  id: string;
  slug: string;
  language: string;
  status: string;
}

interface IndexNowPayload {
  host: string;
  key: string;
  keyLocation: string;
  urlList: string[];
}

/**
 * Submit a batch of URLs to Bing IndexNow
 */
async function submitBatchToIndexNow(urls: string[], batchNumber: number): Promise<boolean> {
  if (urls.length === 0) return true;

  const payload: IndexNowPayload = {
    host: HOST,
    key: INDEXNOW_KEY,
    keyLocation: KEY_LOCATION,
    urlList: urls,
  };

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`📤 Submitting batch ${batchNumber} (${urls.length} URLs, attempt ${attempt}/${MAX_RETRIES})...`);
      
      const response = await fetch('https://api.indexnow.org/indexnow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        console.log(`✅ Batch ${batchNumber} submitted successfully (${urls.length} URLs)`);
        return true;
      } else {
        const errorText = await response.text();
        console.warn(`⚠️  Batch ${batchNumber} failed with status ${response.status}: ${errorText}`);
        
        if (attempt < MAX_RETRIES) {
          console.log(`🔄 Retrying batch ${batchNumber} in 2 seconds...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    } catch (error) {
      console.warn(`⚠️  Batch ${batchNumber} network error (attempt ${attempt}/${MAX_RETRIES}):`, error);
      
      if (attempt < MAX_RETRIES) {
        console.log(`🔄 Retrying batch ${batchNumber} in 2 seconds...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }

  console.error(`❌ Batch ${batchNumber} failed after ${MAX_RETRIES} attempts`);
  return false;
}

/**
 * Main function to fetch and submit all live knowledge pages
 */
async function bulkSubmitToIndexNow() {
  console.log('🚀 Starting bulk IndexNow submission...');
  console.log(`🔑 Using IndexNow key: ${INDEXNOW_KEY === 'REPLACE_WITH_YOUR_INDEXNOW_KEY' ? 'NOT CONFIGURED' : 'CONFIGURED'}`);
  
  if (INDEXNOW_KEY === 'REPLACE_WITH_YOUR_INDEXNOW_KEY') {
    console.error('❌ Please configure INDEXNOW_KEY in your .env.local file');
    process.exit(1);
  }

  try {
    // Fetch all live questions with their slugs and language
    console.log('📊 Fetching live knowledge pages from Supabase...');
    
    const { data: questions, error } = await supabase
      .from('questions')
      .select('id, slug, language, status')
      .eq('status', 'live')
      .not('slug', 'is', null);

    if (error) {
      console.error('❌ Error fetching questions from Supabase:', error);
      process.exit(1);
    }

    if (!questions || questions.length === 0) {
      console.log('ℹ️  No live questions found with slugs');
      return;
    }

    console.log(`📋 Found ${questions.length} live knowledge pages`);

    // Filter out questions without valid slugs or language
    const validQuestions = questions.filter(q => 
      q.slug && 
      q.language && 
      ['en', 'de'].includes(q.language)
    ) as QuestionRow[];

    console.log(`✅ ${validQuestions.length} questions have valid slugs and language`);

    // Construct URLs
    const urls = validQuestions.map(q => 
      `https://${HOST}/${q.language}/knowledge/${q.slug}`
    );

    console.log(`🔗 Constructed ${urls.length} URLs for submission`);

    // Split URLs into batches
    const batches: string[][] = [];
    for (let i = 0; i < urls.length; i += BATCH_SIZE) {
      batches.push(urls.slice(i, i + BATCH_SIZE));
    }

    console.log(`📦 Split into ${batches.length} batches of up to ${BATCH_SIZE} URLs each`);

    // Submit each batch
    let successfulBatches = 0;
    let totalSubmittedUrls = 0;

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      const batchNumber = i + 1;
      
      const success = await submitBatchToIndexNow(batch, batchNumber);
      
      if (success) {
        successfulBatches++;
        totalSubmittedUrls += batch.length;
      }

      // Add delay between batches (except for the last batch)
      if (i < batches.length - 1) {
        console.log(`⏳ Waiting ${BATCH_DELAY_MS}ms before next batch...`);
        await new Promise(resolve => setTimeout(resolve, BATCH_DELAY_MS));
      }
    }

    // Summary
    console.log('\n📊 Submission Summary:');
    console.log(`✅ Successful batches: ${successfulBatches}/${batches.length}`);
    console.log(`✅ Total URLs submitted: ${totalSubmittedUrls}/${urls.length}`);
    console.log(`❌ Failed batches: ${batches.length - successfulBatches}`);
    
    if (successfulBatches === batches.length) {
      console.log('🎉 All batches submitted successfully!');
    } else {
      console.log('⚠️  Some batches failed. Check the logs above for details.');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

// Run the script
bulkSubmitToIndexNow()
  .then(() => {
    console.log('🏁 Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  }); 