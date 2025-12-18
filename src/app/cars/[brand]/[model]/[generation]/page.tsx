import { createServerClient } from '@supabase/ssr';
import { cookies as getCookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { Suspense } from 'react';
import GenerationDetailClient from './GenerationDetailClient';

// Use static generation with ISR for better performance
export const revalidate = 600; // 10 minutes cache

type Params = { brand: string; model: string; generation: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { brand, model, generation } = await params;
  
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
      title: 'Generation nicht gefunden',
    };
  }

  const baseTitle = generationData.meta_title || `${brandData.name} ${modelData.name} ${generationData.name}`;
  const title = baseTitle.length > 50 ? baseTitle.substring(0, 47) + '...' : baseTitle;
  
  const defaultDescription = `Fehlerlösungen und Wartungshandbücher für ${brandData.name} ${modelData.name} ${generationData.name}. Schritt-für-Schritt Anleitungen.`;
  const rawDescription = generationData.meta_description || generationData.description || defaultDescription;
  const description = rawDescription.length > 160 ? rawDescription.substring(0, 157) + '...' : rawDescription;

  return {
    title: `${title} | Fahrzeugfehler.de`,
    description,
    alternates: {
      canonical: `https://fahrzeugfehler.de/cars/${brand}/${model}/${generation}`,
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
  const { brand, model, generation } = await params;
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
  // IMPORTANT: Only count faults WITHOUT error_code (error codes are shown on separate error-codes page)
  const { count: totalFaultsCount } = await supabase
    .from('car_faults')
    .select('*', { count: 'exact', head: true })
    .eq('model_generation_id', generationData.id)
    .eq('language_path', 'de')
    .eq('status', 'live')
    .is('error_code', null); // Only faults without error codes

  const { count: totalManualsCount } = await supabase
    .from('car_manuals')
    .select('*', { count: 'exact', head: true })
    .eq('model_generation_id', generationData.id)
    .eq('language_path', 'de')
    .eq('status', 'live');

  const totalFaults = totalFaultsCount || 0;
  const totalManuals = totalManualsCount || 0;
  const totalFaultPages = Math.ceil(totalFaults / pageSize);
  const totalManualPages = Math.ceil(totalManuals / pageSize);

  // Fetch faults for this generation with pagination
  // IMPORTANT: Only fetch faults WITHOUT error_code (error codes are shown on separate error-codes page)
  const faultsResult = await supabase
    .from('car_faults')
    .select('*')
    .eq('model_generation_id', generationData.id)
    .eq('language_path', 'de')
    .eq('status', 'live')
    .is('error_code', null) // Only faults without error codes
    .order('created_at', { ascending: false })
    .range((faultPage - 1) * pageSize, faultPage * pageSize - 1);

  const faults = faultsResult.data || [];

  // Fetch manuals for this generation with pagination
  const manualsResult = await supabase
    .from('car_manuals')
    .select('*')
    .eq('model_generation_id', generationData.id)
    .eq('language_path', 'de')
    .eq('status', 'live')
    .order('created_at', { ascending: false })
    .range((manualPage - 1) * pageSize, manualPage * pageSize - 1);

  const manuals = manualsResult.data || [];

  return (
    <>
      <Suspense fallback={
        <div className="min-h-screen bg-white dark:bg-black">
          <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-black dark:via-slate-950 dark:to-black">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
              <div className="text-center animate-pulse">
                <div className="h-12 bg-slate-700 dark:bg-slate-800 rounded w-1/3 mx-auto mb-4"></div>
                <div className="h-8 bg-slate-700 dark:bg-slate-800 rounded w-1/4 mx-auto"></div>
              </div>
            </div>
          </div>
          <div className="max-w-7xl mx-auto px-4 py-16">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-48 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse">
                  <div className="p-6 space-y-3">
                    <div className="h-6 bg-slate-300 dark:bg-slate-700 rounded w-3/4"></div>
                    <div className="h-4 bg-slate-300 dark:bg-slate-700 rounded w-full"></div>
                    <div className="h-4 bg-slate-300 dark:bg-slate-700 rounded w-5/6"></div>
                  </div>
                </div>
              ))}
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

