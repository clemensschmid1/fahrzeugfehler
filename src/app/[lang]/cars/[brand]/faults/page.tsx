import { createServerClient } from '@supabase/ssr';
import { cookies as getCookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import Header from '@/components/Header';
import { Suspense } from 'react';
import BrandFaultsSection from '../BrandFaultsSection';

export const revalidate = 600;

type Params = { lang: string; brand: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { lang, brand } = await params;
  const t = (en: string, de: string) => lang === 'de' ? de : en;
  
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

  const { data: brandData } = await supabase
    .from('car_brands')
    .select('name')
    .eq('slug', brand)
    .single();

  if (!brandData) {
    return {
      title: t('Brand Not Found', 'Marke nicht gefunden'),
    };
  }

  return {
    title: `${brandData.name} - ${t('All Faults', 'Alle Fehler')} | FAULTBASE`,
    description: t(
      `Find all car fault solutions for ${brandData.name}. Comprehensive fault codes, diagnostic guides, and repair instructions.`,
      `Finden Sie alle Auto-Fehlerlösungen für ${brandData.name}. Umfassende Fehlercodes, Diagnoseanleitungen und Reparaturanweisungen.`
    ),
  };
}

export default async function BrandFaultsPage({ params }: { params: Promise<Params> }) {
  const { lang, brand } = await params;
  
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

  // Fetch brand
  const { data: brandData, error: brandError } = await supabase
    .from('car_brands')
    .select('id, name, slug')
    .eq('slug', brand)
    .single();

  if (brandError || !brandData) {
    return notFound();
  }

  // Fetch initial faults (first 60)
  const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/cars/${brand}/faults?page=1&limit=60&lang=${lang}`, {
    cache: 'no-store'
  });

  let initialFaults: any[] = [];
  let totalCount = 0;

  if (response.ok) {
    const data = await response.json();
    initialFaults = data.faults || [];
    totalCount = data.totalCount || 0;
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <Suspense fallback={
            <div className="animate-pulse">
              <div className="h-12 bg-gray-200 rounded w-1/3 mb-8"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-64 bg-gray-200 rounded-lg"></div>
                ))}
              </div>
            </div>
          }>
            <BrandFaultsSection 
              brandSlug={brandData.slug}
              brandName={brandData.name}
              lang={lang}
              initialFaults={initialFaults}
              totalCount={totalCount}
            />
          </Suspense>
        </div>
      </div>
    </>
  );
}

