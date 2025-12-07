import { createServerClient } from '@supabase/ssr';
import { cookies as getCookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import Header from '@/components/Header';
import { Suspense } from 'react';
import BrandClient from './BrandClient';

export const dynamic = 'force-dynamic';
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
    .select('name, description')
    .eq('slug', brand)
    .single();

  if (!brandData) {
    return {
      title: t('Brand Not Found', 'Marke nicht gefunden'),
    };
  }

  return {
    title: `${brandData.name} - ${t('Car Models', 'Automodelle')} | Cars`,
    description: brandData.description || t(
      `Find fixing manuals and fault solutions for ${brandData.name} car models.`,
      `Finden Sie Reparaturanleitungen und Fehlerlösungen für ${brandData.name} Automodelle.`
    ),
    alternates: {
      canonical: `https://infoneva.com/${lang}/cars/${brand}`,
      languages: {
        'en': `https://infoneva.com/en/cars/${brand}`,
        'de': `https://infoneva.com/de/cars/${brand}`,
      },
    },
  };
}

export default async function BrandPage({ params }: { params: Promise<Params> }) {
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

  // Fetch brand first
  const brandResult = await supabase
    .from('car_brands')
    .select('*')
    .eq('slug', brand)
    .single();

  if (brandResult.error || !brandResult.data) {
    return notFound();
  }

  const brandData = brandResult.data;

  // Then fetch models for this brand
  const modelsResult = await supabase
    .from('car_models')
    .select('*')
    .eq('brand_id', brandData.id)
    .order('display_order', { ascending: true })
    .order('name', { ascending: true });

  const models = modelsResult.data || [];

  // Fetch fault/manual counts for this brand
  const modelIds = models.map(m => m.id);
  let brandFaultsCount = 0;
  let brandManualsCount = 0;

  if (modelIds.length > 0) {
    // Get all generations for these models
    const { data: allGenerations } = await supabase
      .from('model_generations')
      .select('id, car_model_id')
      .in('car_model_id', modelIds);

    const generationIds = allGenerations?.map(g => g.id) || [];

    // Count faults: either by model_id or generation_id
    const { count: faultsCount } = await supabase
      .from('car_faults')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'live')
      .or(`car_model_id.in.(${modelIds.join(',')}),model_generation_id.in.(${generationIds.length > 0 ? generationIds.join(',') : 'null'})`);

    // Count manuals: either by model_id or generation_id
    const { count: manualsCount } = await supabase
      .from('car_manuals')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'live')
      .or(`car_model_id.in.(${modelIds.join(',')}),model_generation_id.in.(${generationIds.length > 0 ? generationIds.join(',') : 'null'})`);

    brandFaultsCount = faultsCount || 0;
    brandManualsCount = manualsCount || 0;
  }

  return (
    <>
      <Header />
      <Suspense fallback={
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
          <div className="max-w-7xl mx-auto px-4 py-16">
            <div className="animate-pulse">
              <div className="h-12 bg-gray-200 rounded w-1/3 mb-8"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-64 bg-gray-200 rounded-lg"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      }>
        <BrandClient brand={brandData} models={models} lang={lang} faultsCount={brandFaultsCount} manualsCount={brandManualsCount} />
      </Suspense>
    </>
  );
}

