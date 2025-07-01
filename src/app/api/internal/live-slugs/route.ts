import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export async function GET() {
  const { data, error } = await supabase
    .from('questions')
    .select('slug')
    .eq('status', 'live')
    .eq('is_main', true);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const slugs = (data || []).map((q: { slug: string }) => q.slug).filter(Boolean);
  return NextResponse.json({ slugs });
} 