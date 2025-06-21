import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
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

    // Get user agent and IP for metadata
    const userAgent = req.headers.get('user-agent') || 'unknown';
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
               req.headers.get('cf-connecting-ip') || 
               'unknown';

    // Store the email in the emails table
    const { error } = await supabase
      .from('emails')
      .insert([{
        email: email.toLowerCase().trim(),
        type: 'signup_notification',
        status: 'pending',
        metadata: {
          source: 'signup_form',
          user_agent: userAgent,
          ip_address: ip,
          timestamp: new Date().toISOString()
        }
      }]);

    if (error) {
      console.error('Error saving email to database:', error);
      
      // Fallback: log the email request
      console.log('Signup notification request (fallback):', { 
        email, 
        timestamp: new Date().toISOString(),
        error: error.message 
      });
      
      return NextResponse.json({ 
        success: true,
        message: 'Email logged (database error occurred)'
      });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Email saved successfully'
    });

  } catch (error: any) {
    console.error('Error handling signup notification:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 