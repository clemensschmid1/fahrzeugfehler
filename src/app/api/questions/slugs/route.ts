import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

export async function POST(req: Request) {
  try {
    const { questionIds } = await req.json();

    if (!Array.isArray(questionIds) || questionIds.length === 0) {
      return NextResponse.json({ error: 'An array of questionIds is required' }, { status: 400 });
    }

    const supabase = createRouteHandlerClient({ cookies: () => cookies() });

    // Fetch slugs from the questions table for the given question IDs
    const { data, error } = await supabase
      .from('questions')
      .select('id, slug')
      .in('id', questionIds);

    if (error) {
      console.error('Supabase fetch error in /api/questions/slugs:', error);
      throw error;
    }

    // Create a map of questionId to slug
    const slugsMap: { [key: string]: string } = {};
    data.forEach(question => {
      if (question.slug) {
        slugsMap[question.id] = question.slug;
      }
    });

    return NextResponse.json(slugsMap);
  } catch (error: any) {
    console.error('Error fetching slugs:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
} 