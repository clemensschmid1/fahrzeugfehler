import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    const { questionId, voteType } = await req.json();
    const booleanVoteType = voteType === 'up';

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

    const { data: existingVote } = await supabase
      .from('votes')
      .select('*')
      .eq('question_id', questionId)
      .eq('user_id', user.id)
      .single();

    if (existingVote) {
      const { error: updateError } = await supabase
        .from('votes')
        .update({ vote_type: booleanVoteType })
        .eq('id', existingVote.id);

      if (updateError) throw updateError;
    } else {
      const { error: insertError } = await supabase
        .from('votes')
        .insert({
          question_id: questionId,
          user_id: user.id,
          vote_type: booleanVoteType
        });

      if (insertError) throw insertError;
    }

    const { data: votes, error: votesError } = await supabase
      .from('votes')
      .select('vote_type')
      .eq('question_id', questionId);

    if (votesError) throw votesError;

    const totalVotes = votes.length;
    const upvotes = votes.filter(v => v.vote_type).length;
    const percentage = totalVotes > 0 ? Math.round((upvotes / totalVotes) * 100) : 0;

    return NextResponse.json({
      totalVotes,
      upvotes,
      percentage,
      userVote: booleanVoteType
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

    const { data: votes, error: votesError } = await supabase
      .from('votes')
      .select('vote_type')
      .eq('question_id', questionId);

    if (votesError) throw votesError;

    const totalVotes = votes.length;
    const upvotes = votes.filter(v => v.vote_type).length;
    const percentage = totalVotes > 0 ? Math.round((upvotes / totalVotes) * 100) : 0;

    const { data: { user } } = await supabase.auth.getUser();
    let userVote = null;

    if (user) {
      const { data: userVoteData } = await supabase
        .from('votes')
        .select('vote_type')
        .eq('question_id', questionId)
        .eq('user_id', user.id)
        .single();

      if (userVoteData) {
        userVote = userVoteData.vote_type;
      }
    }

    return NextResponse.json({
      totalVotes,
      upvotes,
      percentage,
      userVote
    });

  } catch (error: any) {
    console.error('Error fetching votes:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
