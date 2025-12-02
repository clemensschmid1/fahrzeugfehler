import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';
import { readFileSync, existsSync } from 'fs';
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

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://faultbase.com';
const BATCH_SIZE = 10;
const DELAY_MS = 1500;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function sleep(ms: number) {
  return new Promise(res => setTimeout(res, ms));
}

async function main() {
  console.log('🔎 Looking for questions with missing metadata...');
  console.log('⚠️  NOTE: This script now uses questions2 table. For better features, use bulkPageGeneration.ts');
  const { data: questions, error } = await supabase
    .from('questions2')
    .select('id, question, answer, meta_generated, slug')
    .eq('meta_generated', false)
    .not('question', 'is', null)
    .not('answer', 'is', null);

  if (error) {
    console.error('❌ Error fetching questions:', error);
    process.exit(1);
  }

  if (!questions || questions.length === 0) {
    console.log('✅ No questions missing metadata. All caught up!');
    return;
  }

  console.log(`📝 Found ${questions.length} questions missing metadata.`);

  let successCount = 0;
  let failureCount = 0;

  for (let i = 0; i < questions.length; i += BATCH_SIZE) {
    const batch = questions.slice(i, i + BATCH_SIZE);
    const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(questions.length / BATCH_SIZE);
    
    console.log(`\n📦 Processing batch ${batchNumber}/${totalBatches} (${batch.length} questions)...`);
    
    const results = await Promise.all(batch.map(async (q) => {
      try {
        const res = await fetch(`${SITE_URL}/api/questions/generate-metadata`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: q.id }),
        });
        if (!res.ok) {
          const err = await res.text();
          console.error(`   ❌ ${q.slug || q.id.substring(0, 8)}: ${res.status} - ${err.substring(0, 100)}`);
          return false;
        } else {
          console.log(`   ✅ ${q.slug || q.id.substring(0, 8)}`);
          return true;
        }
      } catch (err) {
        console.error(`   ❌ ${q.slug || q.id.substring(0, 8)}:`, err instanceof Error ? err.message : String(err));
        return false;
      }
    }));
    
    successCount += results.filter(r => r).length;
    failureCount += results.filter(r => !r).length;
    
    if (i + BATCH_SIZE < questions.length) {
      console.log(`⏳ Waiting ${DELAY_MS}ms before next batch...`);
      await sleep(DELAY_MS);
    }
  }
  
  console.log(`\n📊 Summary: ${successCount} succeeded, ${failureCount} failed`);
  console.log('🎉 Metadata catch-up complete!');
}

main().catch(err => {
  console.error('❌ Script error:', err);
  process.exit(1);
}); 