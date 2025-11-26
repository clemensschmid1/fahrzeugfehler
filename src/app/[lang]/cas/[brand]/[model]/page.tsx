import { createServerClient } from '@supabase/ssr';
import { cookies as getCookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import Header from '@/components/Header';
import { Suspense } from 'react';
import GenerationListClient from './GenerationListClient';

export const dynamic = 'force-dynamic';
export const revalidate = 600;

type Params = { lang: string; brand: string; model: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { lang, brand, model } = await params;
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
    .select('name, slug')
    .eq('slug', brand)
    .single();

  const { data: modelData } = await supabase
    .from('car_models')
    .select('name, description')
    .eq('slug', model)
    .single();

  if (!brandData || !modelData) {
    return {
      title: t('Model Not Found', 'Modell nicht gefunden'),
    };
  }

  return {
    title: `${brandData.name} ${modelData.name} - ${t('All Generations', 'Alle Generationen')} | CAS`,
    description: modelData.description || t(
      `Browse all generations of ${brandData.name} ${modelData.name}. Find specific faults and manuals for your exact model year.`,
      `Durchsuchen Sie alle Generationen des ${brandData.name} ${modelData.name}. Finden Sie spezifische Fehler und Anleitungen für Ihr genaues Modelljahr.`
    ),
    alternates: {
      canonical: `https://infoneva.com/${lang}/cas/${brand}/${model}`,
      languages: {
        'en': `https://infoneva.com/en/cas/${brand}/${model}`,
        'de': `https://infoneva.com/de/cas/${brand}/${model}`,
      },
    },
  };
}

export default async function ModelGenerationsPage({ params }: { params: Promise<Params> }) {
  const { lang, brand, model } = await params;
  
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
  const brandResult = await supabase
    .from('car_brands')
    .select('*')
    .eq('slug', brand)
    .single();

  if (brandResult.error || !brandResult.data) {
    return notFound();
  }

  const brandData = brandResult.data;

  // Fetch model
  const modelResult = await supabase
    .from('car_models')
    .select('*')
    .eq('brand_id', brandData.id)
    .eq('slug', model)
    .single();

  if (modelResult.error || !modelResult.data) {
    return notFound();
  }

  const modelData = modelResult.data;

  // Fetch all generations for this model
  const generationsResult = await supabase
    .from('model_generations')
    .select('*')
    .eq('car_model_id', modelData.id)
    .order('year_start', { ascending: false });

  const generations = generationsResult.data || [];

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
                  <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      }>
        <GenerationListClient 
          brand={brandData} 
          model={modelData} 
          generations={generations} 
          lang={lang} 
        />
      </Suspense>
    </>
  );
}
