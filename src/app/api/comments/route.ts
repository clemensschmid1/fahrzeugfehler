import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// This client is not used in the POST/GET handlers below and can be removed.
// If you need a global client for other purposes, ensure it's configured correctly.
// const supabase = createClient(
//   process.env.NEXT_PUBLIC_SUPABASE_URL!,
//   process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
// );

export async function POST(req: Request) {
  try {
    console.log('POST /api/comments received');
    const { questionId, content } = await req.json();
    console.log('POST /api/comments data:', { questionId, content });

    const cookieStore = await cookies();
    const supabaseAuth = createServerClient(
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
    console.log('POST /api/comments Supabase client created');

    console.log('POST /api/comments attempting getUser...');
    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();
    console.log('POST /api/comments getUser result - user:', user, 'error:', userError);

    if (userError || !user) {
      console.error('Unauthorized access attempt in POST:', userError?.message || 'No user');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Insert the comment using the request-scoped client
    console.log('POST /api/comments user authenticated (', user.id, '), inserting comment...', { questionId, content });
    const { data, error } = await supabaseAuth
      .from('comments')
      .insert({
        question_id: questionId,
        user_id: user.id,
        content: content
      })
      .select(`
        id,
        content,
        created_at,
        question_id,
        user_id
      `)
      .single();

    if (error) {
        console.error('Supabase insert error in POST:', error);
        throw error;
    }

    console.log('Comment posted successfully:', data);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error creating comment:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    console.log('GET /api/comments received');
    const { searchParams } = new URL(req.url);
    const questionId = searchParams.get('questionId');
    const status = searchParams.get('status');

    console.log('GET /api/comments questionId:', questionId, 'status:', status);

    if (!questionId) {
      console.error('GET comments error: Question ID is required');
      return NextResponse.json({ error: 'Question ID is required' }, { status: 400 });
    }

    const cookieStore = await cookies();
    const supabaseAuth = createServerClient(
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
    console.log('GET /api/comments Supabase client created');

    // Fetch comments and join with profiles to get the username
    console.log('GET /api/comments attempting fetch from DB...');
    let query = supabaseAuth
      .from('comments')
      .select(`
        id,
        content,
        created_at,
        question_id,
        user_id,
        status
      `)
      .eq('question_id', questionId);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
        console.error('Supabase fetch error in GET:', error);
        throw error;
    }

    console.log(`Fetched ${data?.length} comments for question ${questionId} with status ${status || 'any'}`);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error fetching comments:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
} 