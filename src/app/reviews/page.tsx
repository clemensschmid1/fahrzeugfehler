import type { Metadata } from 'next';
import ReviewsClient from './ReviewsClient';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const metadata: Metadata = {
  title: 'Bewertungen | Fahrzeugfehler.de',
  description: 'Lesen Sie Bewertungen von Autobesitzern und Mechanikern, die Fahrzeugfehler.de nutzen. Teilen Sie Ihre Erfahrungen mit unserer Plattform.',
  alternates: {
    canonical: 'https://fahrzeugfehler.de/reviews',
  },
};

export default async function ReviewsPage() {
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
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );

  // Fetch approved reviews (German only)
  const { data: reviews } = await supabase
    .from('reviews')
    .select('*')
    .eq('language_path', 'de')
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .limit(100);

  // Get user session
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <ReviewsClient 
      initialReviews={reviews || []} 
      user={user}
    />
  );
}


