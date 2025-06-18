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

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user already has an upvote for this question
    const { data: existingVote } = await supabase
      .from('votes')
      .select('*')
      .eq('question_id', questionId)
      .eq('user_id', user.id)
      .eq('vote_type', true) // Only check for upvotes (true)
      .single();

    if (existingVote) {
      // User has already upvoted - remove the vote (toggle off)
      const { error: deleteError } = await supabase
        .from('votes')
        .delete()
        .eq('question_id', questionId)
        .eq('user_id', user.id)
        .eq('vote_type', true);

      if (deleteError) throw deleteError;
    } else {
      // User hasn't upvoted - add an upvote
      const { error: insertError } = await supabase
        .from('votes')
        .insert({
          question_id: questionId,
          user_id: user.id,
          vote_type: true // true = upvote
        });

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

  } catch (error: any) {
    console.error('Error handling vote:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
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

    // Check if current user has upvoted
    const { data: { user } } = await supabase.auth.getUser();
    let hasUserUpvoted = false;

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

    return NextResponse.json({
      upvotes,
      hasUserUpvoted
    });

  } catch (error: any) {
    console.error('Error fetching votes:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
