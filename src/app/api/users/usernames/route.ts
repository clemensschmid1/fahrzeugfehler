import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

export async function POST(req: Request) {
  try {
    const { userIds } = await req.json();

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ error: 'An array of userIds is required' }, { status: 400 });
    }

    const supabase = createRouteHandlerClient({ cookies: () => cookies() });

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
  } catch (error: any) {
    console.error('Error fetching usernames:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
} 