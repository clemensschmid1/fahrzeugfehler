import { Metadata } from 'next';
import ReviewsClient from './ReviewsClient';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

type Params = { lang: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { lang } = await params;
  const siteUrl = 'https://faultbase.com';

  const title = lang === 'de'
    ? 'Bewertungen | Faultbase'
    : 'Reviews | Faultbase';

  const description = lang === 'de'
    ? 'Lesen Sie Bewertungen von Ingenieuren und Technikern, die Faultbase nutzen. Teilen Sie Ihre Erfahrungen mit unserer Plattform.'
    : 'Read reviews from engineers and technicians using Faultbase. Share your experience with our platform.';

  return {
    title,
    description,
    alternates: {
      canonical: `${siteUrl}/${lang}/reviews`,
    },
  };
}

export default async function ReviewsPage({ params }: { params: Promise<Params> }) {
  const { lang } = await params;
  
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

  // Fetch approved reviews
  const { data: reviews } = await supabase
    .from('reviews')
    .select('*')
    .eq('language_path', lang)
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .limit(100);

  // Get user session
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <ReviewsClient 
      lang={lang} 
      initialReviews={reviews || []} 
      user={user}
    />
  );
}

