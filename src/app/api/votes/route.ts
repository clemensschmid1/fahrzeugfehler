import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    const { questionId, voteType } = await req.json();

    if (!questionId) {
      return NextResponse.json({ error: 'Question ID is required' }, { status: 400 });
    }
    if (voteType !== 'up' && voteType !== 'down') {
      return NextResponse.json({ error: 'voteType must be "up" or "down"' }, { status: 400 });
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

    let user = null;
    try {
      const { data: { user: userData }, error: userError } = await supabase.auth.getUser();
      if (userError) {
        // Don't log AuthSessionMissingError as it's expected for unauthenticated users
        if (userError.message !== 'Auth session missing!') {
          console.error('Error fetching user in votes API:', userError);
        }
      } else {
        user = userData;
      }
    } catch (error) {
      const err = error as Error;
      // Don't log AuthSessionMissingError as it's expected for unauthenticated users
      if (err.message !== 'Auth session missing!') {
        console.error('Auth session error in votes API:', err);
      }
      // Continue without user - this is normal for unauthenticated users
    }
    
    // Get IP address for unauthenticated users
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      req.headers.get('cf-connecting-ip') ||
      req.headers.get('fly-client-ip') ||
      req.headers.get('x-vercel-forwarded-for') ||
      '127.0.0.1';
    
    const userId = user?.id || null;
    const identifier = userId || ip;

    // Check if user/IP already has any vote for this question
    const { data: existingVote } = await supabase
      .from('votes')
      .select('*')
      .eq('question_id', questionId)
      .eq(userId ? 'user_id' : 'ip_address', identifier)
      .maybeSingle();

    // If same vote clicked again => remove (toggle off)
    if (existingVote && ((voteType === 'up' && existingVote.vote_type === true) || (voteType === 'down' && existingVote.vote_type === false))) {
      const { error: deleteError } = await supabase
        .from('votes')
        .delete()
        .eq('id', existingVote.id);
      if (deleteError) throw deleteError;
    } else {
      // Remove opposite vote if exists, then insert new vote
      if (existingVote) {
        const { error: removeOppError } = await supabase
          .from('votes')
          .delete()
          .eq('id', existingVote.id);
        if (removeOppError) throw removeOppError;
      }
      const voteData: {
        question_id: string,
        vote_type: boolean,
        user_id?: string,
        ip_address?: string
      } = {
        question_id: questionId,
        vote_type: voteType === 'up'
      };
      if (userId) voteData.user_id = userId; else voteData.ip_address = ip;
      const { error: insertError } = await supabase.from('votes').insert(voteData);
      if (insertError) throw insertError;
    }

    // Get updated vote counts
    const { data: votes, error: votesError } = await supabase
      .from('votes')
      .select('vote_type')
      .eq('question_id', questionId)
    

    if (votesError) throw votesError;

    const upvotes = votes.filter(v => v.vote_type === true).length;
    const downvotes = votes.filter(v => v.vote_type === false).length;

    // Compute current user's vote
    let userVote: 'up' | 'down' | null = null;
    const { data: currentVote } = await supabase
      .from('votes')
      .select('vote_type')
      .eq('question_id', questionId)
      .eq(userId ? 'user_id' : 'ip_address', identifier)
      .maybeSingle();
    if (currentVote) userVote = currentVote.vote_type ? 'up' : 'down';

    return NextResponse.json({ upvotes, downvotes, userVote });

  } catch (error) {
    const err = error as Error;
    console.error('Error handling vote:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const questionId = searchParams.get('questionId');

    if (!questionId) {
      return NextResponse.json({ error: 'Question ID is required' }, { status: 400 });
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

    // Get votes for this question
    const { data: votes, error: votesError } = await supabase
      .from('votes')
      .select('vote_type')
      .eq('question_id', questionId);

    if (votesError) throw votesError;

    const upvotes = votes.filter(v => v.vote_type === true).length;
    const downvotes = votes.filter(v => v.vote_type === false).length;

    // Check if current user/IP has upvoted
    let userVote: 'up' | 'down' | null = null;
    let user = null;

    try {
      const { data: { user: userData }, error: userError } = await supabase.auth.getUser();
      if (userError) {
        // Don't log AuthSessionMissingError as it's expected for unauthenticated users
        if (userError.message !== 'Auth session missing!') {
          console.error('Error fetching user in votes API:', userError);
        }
      } else {
        user = userData;
        if (user) {
          const { data: userVoteData } = await supabase
            .from('votes')
            .select('vote_type')
            .eq('question_id', questionId)
            .eq('user_id', user.id)
            .maybeSingle();
          if (userVoteData) userVote = userVoteData.vote_type ? 'up' : 'down';
        }
      }
    } catch (error) {
      const err = error as Error;
      // Don't log AuthSessionMissingError as it's expected for unauthenticated users
      if (err.message !== 'Auth session missing!') {
        console.error('Auth session error in votes API:', err);
      }
      // Continue without user - this is normal for unauthenticated users
    }

    if (!user) {
      // Check by IP address for unauthenticated users
      const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                 req.headers.get('cf-connecting-ip') || 
                 'unknown';
      
      const { data: ipVoteData } = await supabase
        .from('votes')
        .select('vote_type')
        .eq('question_id', questionId)
        .eq('ip_address', ip)
        .maybeSingle();

      if (ipVoteData) userVote = ipVoteData.vote_type ? 'up' : 'down';
    }

    return NextResponse.json({ upvotes, downvotes, userVote });

  } catch (error) {
    const err = error as Error;
    console.error('Error fetching votes:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
