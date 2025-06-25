import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Supabase config
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET() {
  try {
    const { data: jobs, error } = await supabase
      .from('bulk_import_jobs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('[Status] Error fetching jobs:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ jobs: jobs || [] });
  } catch (error) {
    console.error('[Status] Unexpected error:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
} 