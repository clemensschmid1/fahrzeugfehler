import { createServerClient } from '@supabase/ssr';
import { cookies as getCookies } from 'next/headers';
import { Metadata } from 'next';
import Header from '@/components/Header';
import { Suspense } from 'react';
import CarsClient from './CarsClient';

export const dynamic = 'force-dynamic';
export const revalidate = 600;

type Params = { lang: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { lang } = await params;
  const t = (en: string, de: string) => lang === 'de' ? de : en;
  
  return {
    title: t('Cars - Car Maintenance & Repair Guides | All Brands', 'Autos - Wartungs- & Reparaturanleitungen | Alle Marken'),
    description: t(
      'Find fixing manuals and fault solutions for all car brands and models. Comprehensive car maintenance and repair guides with step-by-step instructions.',
      'Finden Sie Reparaturanleitungen und Fehlerlösungen für alle Automarken und Modelle. Umfassende Auto-Wartungs- und Reparaturanleitungen mit Schritt-für-Schritt-Anweisungen.'
    ),
    alternates: {
      canonical: `https://infoneva.com/${lang}/cars`,
      languages: {
        'en': 'https://infoneva.com/en/cars',
        'de': 'https://infoneva.com/de/cars',
      },
    },
  };
}

export default async function CarsPage({ params }: { params: Promise<Params> }) {
  const { lang } = await params;
  
  const cookieStore = await getCookies();
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
            // Ignore
          }
        },
      },
    }
  );

  // Fetch all car brands
  const { data: brands, error } = await supabase
    .from('car_brands')
    .select('*')
    .order('display_order', { ascending: true })
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching car brands:', error);
  }

  return (
    <>
      <Header />
      <Suspense fallback={
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
          <div className="max-w-7xl mx-auto px-4 py-16">
            <div className="animate-pulse">
              <div className="h-12 bg-gray-200 rounded w-1/3 mb-8"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      }>
        <CarsClient brands={brands || []} lang={lang} />
      </Suspense>
    </>
  );
}

