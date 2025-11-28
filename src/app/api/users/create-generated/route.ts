import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  try {
    const { email, username } = await req.json();
    
    if (!email || !username) {
      return NextResponse.json({ error: 'Missing email or username' }, { status: 400 });
    }

    // Use service role key for admin access
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Missing Supabase configuration' }, { status: 500 });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: crypto.randomUUID(), // Random password
      email_confirm: true,
      user_metadata: {
        auto_generated: true,
        generated_at: new Date().toISOString(),
      },
    });

    if (authError || !authData.user) {
      return NextResponse.json({ error: authError?.message || 'Failed to create user' }, { status: 400 });
    }

    // Check if profile already exists (might be created by trigger)
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id, username')
      .eq('id', authData.user.id)
      .maybeSingle();

    if (existingProfile) {
      // Profile already exists, just update the username if needed
      if (existingProfile.username !== username) {
        const { error: updateError } = await supabaseAdmin
          .from('profiles')
          .update({ username })
          .eq('id', authData.user.id);

        if (updateError) {
          console.error('Error updating profile username:', updateError);
        }
      }
    } else {
      // Create profile if it doesn't exist
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: authData.user.id,
          username: username,
        });

      if (profileError) {
        // If profile creation fails and it's not a duplicate key error, delete the auth user
        if (!profileError.message.includes('duplicate key') && !profileError.message.includes('unique constraint')) {
          await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
        }
        // For duplicate key errors, the profile might have been created by a trigger
        // So we'll just return success with the existing profile
        if (profileError.message.includes('duplicate key') || profileError.message.includes('unique constraint')) {
          // Profile was likely created by a trigger, fetch it
          const { data: triggerProfile } = await supabaseAdmin
            .from('profiles')
            .select('id, username')
            .eq('id', authData.user.id)
            .single();

          if (triggerProfile) {
            // Update username if needed
            if (triggerProfile.username !== username) {
              await supabaseAdmin
                .from('profiles')
                .update({ username })
                .eq('id', authData.user.id);
            }
          }
        } else {
          return NextResponse.json({ error: profileError.message }, { status: 400 });
        }
      }
    }

    // Track in generated_profiles table
    const { error: trackError } = await supabaseAdmin
      .from('generated_profiles')
      .insert({
        id: authData.user.id,
        username: username,
        email: email,
        generated_at: new Date().toISOString(),
        comments_count: 0,
        is_active: true,
      });

    // Don't fail if tracking fails (non-critical)
    if (trackError) {
      console.warn('Failed to track generated profile:', trackError);
    }

    return NextResponse.json({
      user: {
        id: authData.user.id,
        email: authData.user.email,
      },
      username,
    });
  } catch (error) {
    console.error('Error creating generated user:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

