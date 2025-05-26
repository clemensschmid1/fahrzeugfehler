import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    const { questionId, voteType } = await req.json();
    const supabase = createRouteHandlerClient({ cookies });

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user already voted
    const { data: existingVote } = await supabase
      .from('votes')
      .select('*')
      .eq('question_id', questionId)
      .eq('user_id', user.id)
      .single();

    if (existingVote) {
      // Update existing vote
      const { error: updateError } = await supabase
        .from('votes')
        .update({ vote_type: voteType })
        .eq('id', existingVote.id);

      if (updateError) throw updateError;
    } else {
      // Insert new vote
      const { error: insertError } = await supabase
        .from('votes')
        .insert({
          question_id: questionId,
          user_id: user.id,
          vote_type: voteType
        });

      if (insertError) throw insertError;
    }

    // Get updated vote counts
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
      userVote: voteType
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

    const supabase = createRouteHandlerClient({ cookies });

    // Get vote counts
    const { data: votes, error: votesError } = await supabase
      .from('votes')
      .select('vote_type')
      .eq('question_id', questionId);

    if (votesError) throw votesError;

    const totalVotes = votes.length;
    const upvotes = votes.filter(v => v.vote_type).length;
    const percentage = totalVotes > 0 ? Math.round((upvotes / totalVotes) * 100) : 0;

    // Get user's vote if logged in
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