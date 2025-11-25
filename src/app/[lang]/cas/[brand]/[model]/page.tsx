import { createServerClient } from '@supabase/ssr';
import { cookies as getCookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import Header from '@/components/Header';
import { Suspense } from 'react';
import ModelClient from './ModelClient';

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

  const { data: modelData } = await supabase
    .from('car_models')
    .select('name, description, car_brands(name)')
    .eq('slug', model)
    .single();

  if (!modelData) {
    return {
      title: t('Model Not Found', 'Modell nicht gefunden'),
    };
  }

  const brandName = (modelData.car_brands as { name: string })?.name || brand;

  return {
    title: `${modelData.name} - ${brandName} | ${t('Faults & Manuals', 'Fehler & Anleitungen')} | CAS`,
    description: modelData.description || t(
      `Find fixing manuals and fault solutions for ${brandName} ${modelData.name}.`,
      `Finden Sie Reparaturanleitungen und Fehlerlösungen für ${brandName} ${modelData.name}.`
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

export default async function ModelPage({ params }: { params: Promise<Params> }) {
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

  // Fetch brand first to get brand_id
  const brandResult = await supabase
    .from('car_brands')
    .select('id, name, slug')
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
  const modelId = modelData.id;

  // Add brand data to model
  const modelWithBrand = {
    ...modelData,
    car_brands: brandData
  };

  // Fetch faults and manuals with correct model_id
  const [faults, manuals] = await Promise.all([
    supabase
      .from('car_faults')
      .select('*')
      .eq('car_model_id', modelId)
      .eq('language_path', lang)
      .eq('status', 'live')
      .order('created_at', { ascending: false }),
    supabase
      .from('car_manuals')
      .select('*')
      .eq('car_model_id', modelId)
      .eq('language_path', lang)
      .eq('status', 'live')
      .order('display_order', { ascending: true })
      .order('title', { ascending: true })
  ]);

  return (
    <>
      <Header />
      <Suspense fallback={
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
          <div className="max-w-7xl mx-auto px-4 py-16">
            <div className="animate-pulse">
              <div className="h-12 bg-gray-200 rounded w-1/3 mb-8"></div>
              <div className="space-y-6">
                <div className="h-64 bg-gray-200 rounded-lg"></div>
                <div className="h-32 bg-gray-200 rounded-lg"></div>
              </div>
            </div>
          </div>
        </div>
      }>
        <ModelClient
          model={modelWithBrand}
          faults={faults.data || []}
          manuals={manuals.data || []}
          lang={lang}
        />
      </Suspense>
    </>
  );
}

