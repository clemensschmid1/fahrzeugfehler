import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { requireUser } from '@/lib/auth';
import { checkGeoblock } from '@/lib/geoblock';

function checkMinSubmitDelta(delta: number | undefined, minMs = 3000) {
  if (typeof delta !== 'number' || delta < minMs) {
    return false;
  }
  return true;
}

export async function POST(req: Request) {
  try {
    // Geoblocking
    const geoblock = checkGeoblock(req);
    if (geoblock.blocked) {
      return new NextResponse(
        JSON.stringify({ error: 'Access denied from your location.' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Auth guard
    const user = await requireUser();
    if (!user) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { carFaultId, carManualId, content, submitDeltaMs } = await req.json();
    
    if (!checkMinSubmitDelta(submitDeltaMs)) {
      return NextResponse.json({ error: 'Form submitted too quickly.' }, { status: 429 });
    }

    // Validate that exactly one ID is provided
    if ((!carFaultId && !carManualId) || (carFaultId && carManualId)) {
      return NextResponse.json({ error: 'Either carFaultId or carManualId must be provided, but not both.' }, { status: 400 });
    }

    if (!content || content.trim().length === 0 || content.length > 1000) {
      return NextResponse.json({ error: 'Comment must be between 1 and 1000 characters.' }, { status: 400 });
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
              // Ignore
            }
          },
        },
      }
    );

    // Insert the comment
    const insertData: any = {
      user_id: user.id,
      content: content.trim(),
      status: 'live',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (carFaultId) {
      insertData.car_fault_id = carFaultId;
    } else {
      insertData.car_manual_id = carManualId;
    }

    const { data, error } = await supabaseAuth
      .from('car_comments')
      .insert(insertData)
      .select(`
        id,
        content,
        created_at,
        car_fault_id,
        car_manual_id,
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

    const user_name = profile?.username || null;
    const responseData = { ...data, user_name };

    return NextResponse.json(responseData);
  } catch (error) {
    const err = error as Error;
    console.error('Error creating car comment:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

interface CarCommentWithProfile {
  id: string;
  content: string;
  created_at: string;
  car_fault_id: string | null;
  car_manual_id: string | null;
  user_id: string;
  status: string;
  profiles: {
    username: string | null;
  } | null;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const carFaultId = searchParams.get('carFaultId');
    const carManualId = searchParams.get('carManualId');
    const status = searchParams.get('status');

    if (!carFaultId && !carManualId) {
      return NextResponse.json({ error: 'Either carFaultId or carManualId is required' }, { status: 400 });
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
              // Ignore
            }
          },
        },
      }
    );

    // Build query
    let query = supabaseAuth
      .from('car_comments')
      .select(`
        id,
        content,
        created_at,
        car_fault_id,
        car_manual_id,
        user_id,
        status,
        profiles!left(username)
      `);

    if (carFaultId) {
      query = query.eq('car_fault_id', carFaultId);
    } else {
      query = query.eq('car_manual_id', carManualId);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase fetch error in GET:', error);
      throw error;
    }

    // Map user_name for each comment and filter out 'binned' comments
    const commentsWithUserName = ((data as unknown as CarCommentWithProfile[]) || [])
      .filter((comment) => comment.status !== 'binned')
      .map((comment) => ({
        ...comment,
        user_name: comment.profiles?.username || null,
      }));

    return NextResponse.json(commentsWithUserName);
  } catch (error) {
    const err = error as Error;
    console.error('Error fetching car comments:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

