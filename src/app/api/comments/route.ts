import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { requireUser } from '@/lib/auth';
import { checkGeoblock } from '@/lib/geoblock';

// This client is not used in the POST/GET handlers below and can be removed.
// If you need a global client for other purposes, ensure it's configured correctly.
// const supabase = createClient(
//   process.env.NEXT_PUBLIC_SUPABASE_URL!,
//   process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
// );

function checkMinSubmitDelta(delta: number | undefined, minMs = 3000) {
  if (typeof delta !== 'number' || delta < minMs) {
    return false;
  }
  return true;
}

export async function POST(req: Request) {
  try {
    // --- Geoblocking ---
    const geoblock = checkGeoblock(req);
    if (geoblock.blocked) {
      return new NextResponse(
        JSON.stringify({ error: 'Access denied from your location.' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }
    // --- End geoblocking ---

    // Auth guard
    const user = await requireUser();
    if (!user) {
      return new Response('Unauthorized', { status: 401 });
    }
    console.log('POST /api/comments received');
    const { questionId, content, submitDeltaMs } = await req.json();
    if (!checkMinSubmitDelta(submitDeltaMs)) {
      return NextResponse.json({ error: 'Form submitted too quickly.' }, { status: 429 });
    }
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

    // Insert the comment using the request-scoped client
    // RLS policy should be: WITH CHECK (auth.uid() = user_id)
    console.log('POST /api/comments user authenticated (', user.id, '), inserting comment...', { questionId, content });
    const { data, error } = await supabaseAuth
      .from('comments')
      .insert({
        question_id: questionId,
        user_id: user.id, // Must match auth.uid() for RLS
        content: content,
        status: 'live',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select(`
        id,
        content,
        created_at,
        question_id,
        user_id,
        status
      `)
      .single();

    if (error) {
        console.error('Supabase insert error in POST:', error);
        return NextResponse.json({ error: error.message || 'Insert failed' }, { status: 400 });
    }

    // Fetch the username from profiles
    const { data: profile } = await supabaseAuth
      .from('profiles')
      .select('username')
      .eq('id', user.id)
      .maybeSingle();

    let user_name = null;
    if (profile && profile.username) {
      user_name = profile.username;
    }

    const responseData = { ...data, user_name };

    console.log('Comment posted successfully:', responseData);
    return NextResponse.json(responseData);
  } catch (error) {
    const err = error as Error;
    console.error('Error creating comment:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

// Define the correct type for comments joined with profiles
interface CommentWithProfile {
  id: string;
  content: string;
  created_at: string;
  question_id: string;
  user_id: string;
  status: string;
  profiles: { // This is a single object for a one-to-one join
    username: string | null;
  } | null;
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
    // Use LEFT JOIN so comments without profiles still show
    console.log('GET /api/comments attempting fetch from DB...');
    let query = supabaseAuth
      .from('comments')
      .select(`
        id,
        content,
        created_at,
        question_id,
        user_id,
        status,
        profiles!left(username)
      `)
      .eq('question_id', questionId);

    if (status) {
      query = query.eq('status', status);
    } else {
      // Default: fetch all comments, filter out 'binned' in application code
      // This ensures old comments without status are included
      // Don't filter at query level to avoid excluding NULL status comments
    }
    
    // Note: We'll filter out 'binned' comments in the response mapping below

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
        console.error('Supabase fetch error in GET:', error);
        throw error;
    }

    // Map user_name for each comment and filter out 'binned' comments
    // This includes: 'live', NULL (old comments), and any other status except 'binned'
    const commentsWithUserName = ((data as unknown as CommentWithProfile[]) || [])
      .filter((comment) => comment.status !== 'binned') // Filter out binned comments
      .map((comment) => ({
        ...comment,
        user_name: comment.profiles?.username || null,
      }));

    console.log(`Fetched ${commentsWithUserName?.length} comments for question ${questionId} with status ${status || 'any'}`);
    return NextResponse.json(commentsWithUserName);
  } catch (error) {
    const err = error as Error;
    console.error('Error fetching comments:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
} 