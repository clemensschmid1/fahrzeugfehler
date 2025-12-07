import { createServerClient } from '@supabase/ssr';
import { cookies as getCookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import Header from '@/components/Header';
import { Suspense } from 'react';
import GenerationDetailClient from './GenerationDetailClient';

export const dynamic = 'force-dynamic';
export const revalidate = 600;

type Params = { lang: string; brand: string; model: string; generation: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { lang, brand, model, generation } = await params;
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

  // Fetch brand
  const { data: brandData } = await supabase
    .from('car_brands')
    .select('name')
    .eq('slug', brand)
    .single();

  // Fetch model
  const { data: modelData } = await supabase
    .from('car_models')
    .select('name')
    .eq('slug', model)
    .single();

  // Fetch generation
  const { data: generationData } = await supabase
    .from('model_generations')
    .select('name, description, meta_title, meta_description')
    .eq('slug', generation)
    .single();

  if (!brandData || !modelData || !generationData) {
    return {
      title: t('Generation Not Found', 'Generation nicht gefunden'),
    };
  }

  const title = generationData.meta_title || `${brandData.name} ${modelData.name} ${generationData.name} - ${t('Faults & Manuals', 'Fehler & Anleitungen')}`;
  const description = generationData.meta_description || generationData.description || t(
    `Find fault solutions and maintenance manuals for ${brandData.name} ${modelData.name} ${generationData.name}.`,
    `Finden Sie Fehlerlösungen und Wartungshandbücher für ${brandData.name} ${modelData.name} ${generationData.name}.`
  );

  return {
    title: `${title} | Cars`,
    description,
    alternates: {
      canonical: `https://infoneva.com/${lang}/cars/${brand}/${model}/${generation}`,
      languages: {
        'en': `https://infoneva.com/en/cars/${brand}/${model}/${generation}`,
        'de': `https://infoneva.com/de/cars/${brand}/${model}/${generation}`,
      },
    },
  };
}

export default async function GenerationDetailPage({ 
  params,
  searchParams 
}: { 
  params: Promise<Params>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { lang, brand, model, generation } = await params;
  const searchParamsResolved = await searchParams;
  const faultPage = parseInt(searchParamsResolved.faultPage as string || '1', 10);
  const manualPage = parseInt(searchParamsResolved.manualPage as string || '1', 10);
  
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

  // Fetch generation
  const generationResult = await supabase
    .from('model_generations')
    .select('*')
    .eq('car_model_id', modelData.id)
    .eq('slug', generation)
    .single();

  if (generationResult.error || !generationResult.data) {
    return notFound();
  }

  const generationData = generationResult.data;

  const pageSize = 60;
  
  // Fetch total counts first
  const { count: totalFaultsCount } = await supabase
    .from('car_faults')
    .select('*', { count: 'exact', head: true })
    .eq('model_generation_id', generationData.id)
    .eq('language_path', lang)
    .eq('status', 'live');

  const { count: totalManualsCount } = await supabase
    .from('car_manuals')
    .select('*', { count: 'exact', head: true })
    .eq('model_generation_id', generationData.id)
    .eq('language_path', lang)
    .eq('status', 'live');

  const totalFaults = totalFaultsCount || 0;
  const totalManuals = totalManualsCount || 0;
  const totalFaultPages = Math.ceil(totalFaults / pageSize);
  const totalManualPages = Math.ceil(totalManuals / pageSize);

  // Fetch faults for this generation with pagination
  const faultsResult = await supabase
    .from('car_faults')
    .select('*')
    .eq('model_generation_id', generationData.id)
    .eq('language_path', lang)
    .eq('status', 'live')
    .order('created_at', { ascending: false })
    .range((faultPage - 1) * pageSize, faultPage * pageSize - 1);

  const faults = faultsResult.data || [];

  // Fetch manuals for this generation with pagination
  const manualsResult = await supabase
    .from('car_manuals')
    .select('*')
    .eq('model_generation_id', generationData.id)
    .eq('language_path', lang)
    .eq('status', 'live')
    .order('created_at', { ascending: false })
    .range((manualPage - 1) * pageSize, manualPage * pageSize - 1);

  const manuals = manualsResult.data || [];

  return (
    <>
      <Header />
      <Suspense fallback={
        <div className="min-h-screen bg-white dark:bg-black">
          <div className="max-w-7xl mx-auto px-4 py-16">
            <div className="animate-pulse">
              <div className="h-12 bg-gray-200 rounded w-1/3 mb-8"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      }>
        <GenerationDetailClient 
          brand={brandData} 
          model={modelData} 
          generation={generationData}
          faults={faults}
          manuals={manuals}
          lang={lang}
          totalFaults={totalFaults}
          totalManuals={totalManuals}
          faultPage={faultPage}
          manualPage={manualPage}
          totalFaultPages={totalFaultPages}
          totalManualPages={totalManualPages}
        />
      </Suspense>
    </>
  );
}

