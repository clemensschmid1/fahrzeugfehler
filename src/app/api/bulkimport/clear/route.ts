import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST() {
  try {
    console.log('[API/Clear] Clearing pending and processing jobs...');
    
    // We don't delete files from storage, just the jobs from the queue.
    const { error } = await supabase
      .from('bulk_import_jobs')
      .delete()
      .in('status', ['pending', 'processing']);

    if (error) {
      console.error('[API/Clear] Error clearing jobs:', error.message);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    console.log('[API/Clear] Jobs cleared successfully.');
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('[API/Clear] Unexpected error:', error);
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
} 