import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://infoneva.com';
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
  const { data: questions, error } = await supabase
    .from('questions')
    .select('id, question, meta_generated')
    .eq('meta_generated', false);

  if (error) {
    console.error('❌ Error fetching questions:', error);
    process.exit(1);
  }

  if (!questions || questions.length === 0) {
    console.log('✅ No questions missing metadata. All caught up!');
    return;
  }

  console.log(`📝 Found ${questions.length} questions missing metadata.`);

  for (let i = 0; i < questions.length; i += BATCH_SIZE) {
    const batch = questions.slice(i, i + BATCH_SIZE);
    await Promise.all(batch.map(async (q) => {
      try {
        const res = await fetch(`${SITE_URL}/api/questions/generate-metadata`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: q.id }),
        });
        if (!res.ok) {
          const err = await res.text();
          console.error(`❌ Metadata generation failed for ID ${q.id}:`, err);
        } else {
          console.log(`✅ Metadata generated for ID ${q.id}`);
        }
      } catch (err) {
        console.error(`❌ Error for ID ${q.id}:`, err);
      }
    }));
    if (i + BATCH_SIZE < questions.length) {
      console.log(`⏳ Waiting ${DELAY_MS}ms before next batch...`);
      await sleep(DELAY_MS);
    }
  }
  console.log('🎉 Metadata catch-up complete!');
}

main().catch(err => {
  console.error('❌ Script error:', err);
  process.exit(1);
}); 