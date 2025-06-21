import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    const { questionIds } = await req.json();

    if (!Array.isArray(questionIds) || questionIds.length === 0) {
      return NextResponse.json({ error: 'An array of questionIds is required' }, { status: 400 });
    }

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    );

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
  } catch (error) {
    const err = error as Error;
    console.error('Error fetching slugs:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
} 