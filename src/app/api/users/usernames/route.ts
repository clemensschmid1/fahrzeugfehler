import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    const { userIds } = await req.json();

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ error: 'An array of userIds is required' }, { status: 400 });
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

    // Fetch usernames from the profiles table for the given user IDs
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username')
      .in('id', userIds);

    if (error) {
      console.error('Supabase fetch error in /api/users/usernames:', error);
      throw error;
    }

    // Create a map of userId to username
    const usernamesMap: { [key: string]: string } = {};
    data.forEach(profile => {
      if (profile.username) {
        usernamesMap[profile.id] = profile.username;
      }
    });

    return NextResponse.json(usernamesMap);
  } catch (error) {
    const err = error as Error;
    console.error('Error fetching usernames:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
} 