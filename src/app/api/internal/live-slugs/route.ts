import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get('limit') || '1000'); // Default to 1000, max 5000
  const safeLimit = Math.min(Math.max(limit, 1), 5000); // Ensure between 1 and 5000
  
  const { data, error } = await supabase
    .from('questions')
    .select('slug')
    .eq('status', 'live')
    .eq('is_main', true)
    .limit(safeLimit); // Limit the number of slugs returned

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const slugs = (data || []).map((q: { slug: string }) => q.slug).filter(Boolean);
  return NextResponse.json({ 
    slugs,
    total: slugs.length,
    limit: safeLimit,
    note: 'This is a sample of live slugs. Use ?limit=N to get more.'
  });
} 