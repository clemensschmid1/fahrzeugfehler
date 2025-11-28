import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') || '/en';

  if (code) {
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
            }
          },
        },
      }
    );

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Ensure profile exists (for OAuth users, profile might not be created automatically)
      try {
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', data.user.id)
          .maybeSingle();

        if (!existingProfile) {
          // Create profile for OAuth user
          // Generate username from email or use a default
          const emailUsername = data.user.email?.split('@')[0] || 'user';
          const username = emailUsername.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 20) || 'user';
          
          // Check if username is taken and append number if needed
          let finalUsername = username;
          let counter = 1;
          while (true) {
            const { data: checkProfile } = await supabase
              .from('profiles')
              .select('id')
              .eq('username', finalUsername)
              .maybeSingle();
            
            if (!checkProfile) break;
            finalUsername = `${username}${counter}`;
            counter++;
            if (counter > 999) {
              finalUsername = `user${Date.now()}`;
              break;
            }
          }

          await supabase
            .from('profiles')
            .upsert({
              id: data.user.id,
              username: finalUsername,
              updated_at: new Date().toISOString(),
            });
        }
      } catch (profileError) {
        console.error('Error creating profile in callback:', profileError);
        // Don't fail auth if profile creation fails
      }

      // Successful authentication
      return NextResponse.redirect(new URL(next, request.url));
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(new URL('/en/login?error=auth_failed', request.url));
}

