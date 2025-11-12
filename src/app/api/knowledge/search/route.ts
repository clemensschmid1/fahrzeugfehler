import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const lang = searchParams.get('lang') || 'en';
    const q = searchParams.get('q') || '';
    const limit = parseInt(searchParams.get('limit') || '5', 10);

    if (!q || q.trim().length < 2) {
      return NextResponse.json({ questions: [] });
    }

    // Search in questions2 table
    let query = supabase
      .from('questions2')
      .select('id, slug, header, question, meta_description, manufacturer, sector, part_type')
      .eq('language_path', lang)
      .eq('is_main', true)
      .eq('status', 'live')
      .ilike('header', `%${q.trim()}%`)
      .limit(limit);

    const { data, error } = await query;

    if (error) {
      console.error('Search error:', error);
      return NextResponse.json({ questions: [] });
    }

    // If no results from header search, try question search
    if (!data || data.length === 0) {
      const { data: questionData } = await supabase
        .from('questions2')
        .select('id, slug, header, question, meta_description, manufacturer, sector, part_type')
        .eq('language_path', lang)
        .eq('is_main', true)
        .eq('status', 'live')
        .ilike('question', `%${q.trim()}%`)
        .limit(limit);

      return NextResponse.json({ questions: questionData || [] });
    }

    return NextResponse.json({ questions: data || [] });
  } catch (err) {
    console.error('Search API error:', err);
    return NextResponse.json({ questions: [] });
  }
}


