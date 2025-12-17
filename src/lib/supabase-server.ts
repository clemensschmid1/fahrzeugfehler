import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Creates a Supabase server client with Realtime disabled to prevent warnings
 * Use this helper function instead of calling createServerClient directly
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  
  return createServerClient(
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
            // Ignore - this can happen in Server Components
          }
        },
      },
      // Disable Realtime to prevent warnings and reduce bundle size
      // Realtime is not needed for most server-side operations
      realtime: {
        params: {
          eventsPerSecond: 0,
        },
      },
    }
  );
}

