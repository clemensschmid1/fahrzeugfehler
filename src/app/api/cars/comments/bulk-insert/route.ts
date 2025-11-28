import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  try {
    const { comments } = await req.json();
    
    if (!Array.isArray(comments) || comments.length === 0) {
      return NextResponse.json({ error: 'Comments array is required' }, { status: 400 });
    }

    // Use service role key for admin access (bypasses RLS)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Missing Supabase configuration' }, { status: 500 });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Validate all comments before inserting
    for (const comment of comments) {
      if (!comment.user_id || !comment.content || (!comment.car_fault_id && !comment.car_manual_id)) {
        return NextResponse.json({ 
          error: 'Invalid comment data. Each comment must have user_id, content, and either car_fault_id or car_manual_id' 
        }, { status: 400 });
      }

      if (comment.content.trim().length === 0 || comment.content.length > 1000) {
        return NextResponse.json({ 
          error: 'Comment content must be between 1 and 1000 characters' 
        }, { status: 400 });
      }
    }

    // Insert all comments
    const insertData = comments.map(comment => ({
      user_id: comment.user_id,
      content: comment.content.trim(),
      car_fault_id: comment.car_fault_id || null,
      car_manual_id: comment.car_manual_id || null,
      status: 'live',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    const { data, error } = await supabaseAdmin
      .from('car_comments')
      .insert(insertData)
      .select('id, user_id');

    if (error) {
      console.error('Error inserting comments:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Update generated_profiles stats
    const userIds = [...new Set(comments.map(c => c.user_id))];
    for (const userId of userIds) {
      const userCommentCount = comments.filter(c => c.user_id === userId).length;
      const { data: profile } = await supabaseAdmin
        .from('generated_profiles')
        .select('comments_count')
        .eq('id', userId)
        .single();

      if (profile) {
        await supabaseAdmin
          .from('generated_profiles')
          .update({
            last_used_at: new Date().toISOString(),
            comments_count: (profile.comments_count || 0) + userCommentCount,
          })
          .eq('id', userId);
      }
    }

    return NextResponse.json({ 
      success: true, 
      inserted: data?.length || 0,
      commentIds: data?.map(c => c.id) || []
    });
  } catch (error) {
    console.error('Error in bulk insert:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

