import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    const { questionId } = await req.json();

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
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
               req.headers.get('cf-connecting-ip') || 
               'unknown';
    
    const userId = user?.id || null;
    const identifier = userId || ip;

    // Check if user/IP already has an upvote for this question
    const { data: existingVote } = await supabase
      .from('votes')
      .select('*')
      .eq('question_id', questionId)
      .eq('vote_type', true) // Only check for upvotes (true)
      .eq(userId ? 'user_id' : 'ip_address', identifier)
      .single();

    if (existingVote) {
      // User/IP has already upvoted - remove the vote (toggle off)
      const { error: deleteError } = await supabase
        .from('votes')
        .delete()
        .eq('question_id', questionId)
        .eq('vote_type', true)
        .eq(userId ? 'user_id' : 'ip_address', identifier);

      if (deleteError) throw deleteError;
    } else {
      // User/IP hasn't upvoted - add an upvote
      const voteData: {
        question_id: string,
        vote_type: boolean,
        user_id?: string,
        ip_address?: string
      } = {
        question_id: questionId,
        vote_type: true // true = upvote
      };
      
      if (userId) {
        voteData.user_id = userId;
      } else {
        voteData.ip_address = ip;
      }

      const { error: insertError } = await supabase
        .from('votes')
        .insert(voteData);

      if (insertError) throw insertError;
    }

    // Get updated vote counts
    const { data: votes, error: votesError } = await supabase
      .from('votes')
      .select('vote_type')
      .eq('question_id', questionId)
      .eq('vote_type', true); // Only count upvotes

    if (votesError) throw votesError;

    const upvotes = votes.length;
    const hasUserUpvoted = existingVote ? false : true; // If we deleted, user no longer has upvoted; if we inserted, user now has upvoted

    return NextResponse.json({
      upvotes,
      hasUserUpvoted
    });

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

    // Get total upvotes for this question
    const { data: votes, error: votesError } = await supabase
      .from('votes')
      .select('vote_type')
      .eq('question_id', questionId)
      .eq('vote_type', true); // Only count upvotes

    if (votesError) throw votesError;

    const upvotes = votes.length;

    // Check if current user/IP has upvoted
    let hasUserUpvoted = false;
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
            .eq('vote_type', true) // Only check for upvotes
            .single();

          hasUserUpvoted = !!userVoteData;
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
        .eq('vote_type', true) // Only check for upvotes
        .single();

      hasUserUpvoted = !!ipVoteData;
    }

    return NextResponse.json({
      upvotes,
      hasUserUpvoted
    });

  } catch (error) {
    const err = error as Error;
    console.error('Error fetching votes:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
