import { createServerClient } from '@supabase/ssr';
import { cookies as getCookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import Header from '@/components/Header';
import { Suspense } from 'react';
import ErrorCodesClient from './ErrorCodesClient';

// Use static generation with ISR for better performance
export const revalidate = 600; // 10 minutes cache

type Params = { brand: string; model: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { brand, model } = await params;
  
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

  const { data: modelData } = await supabase
    .from('car_models')
    .select('name')
    .eq('slug', model)
    .single();

  if (!brandData || !modelData) {
    return {
      title: 'Fehlercodes nicht gefunden',
    };
  }

  const title = `Fehlercodes - ${brandData.name} ${modelData.name}`;
  const description = `Übersicht aller Fehlercodes für ${brandData.name} ${modelData.name}. Finden Sie Diagnosecodes und Lösungen für Ihr Fahrzeug.`;

  return {
    title: `${title} | Fahrzeugfehler.de`,
    description,
    alternates: {
      canonical: `https://fahrzeugfehler.de/cars/${brand}/${model}/error-codes`,
    },
  };
}

export default async function ErrorCodesPage({ params }: { params: Promise<Params> }) {
  const { brand, model } = await params;
  
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
    .select('id, name, slug, generation_code')
    .eq('car_model_id', modelData.id)
    .order('display_order', { ascending: true })
    .order('year_start', { ascending: false });

  const generations = generationsResult.data || [];

  // Fetch all faults with error codes for this model (across all generations)
  // First get all generation IDs
  const generationIds = generations.length > 0 ? generations.map(g => g.id) : [];
  
  let faultsResult;
  if (generationIds.length > 0) {
    faultsResult = await supabase
      .from('car_faults')
      .select(`
        id,
        slug,
        title,
        error_code,
        severity,
        difficulty_level,
        affected_component,
        model_generation_id,
        model_generations:model_generation_id (
          id,
          name,
          slug,
          generation_code
        )
      `)
      .eq('language_path', 'de')
      .eq('status', 'live')
      .not('error_code', 'is', null)
      .in('model_generation_id', generationIds);
  } else {
    // No generations, return empty array
    faultsResult = { data: [], error: null };
  }

  const faults = faultsResult.data || [];

  // Group faults by error code
  const errorCodesMap = new Map<string, typeof faults>();
  faults.forEach(fault => {
    if (fault.error_code) {
      const code = fault.error_code.trim().toUpperCase();
      if (!errorCodesMap.has(code)) {
        errorCodesMap.set(code, []);
      }
      errorCodesMap.get(code)!.push(fault);
    }
  });

  // Convert to array and sort
  const errorCodes = Array.from(errorCodesMap.entries())
    .map(([code, faults]) => ({
      code,
      faults,
      count: faults.length,
    }))
    .sort((a, b) => a.code.localeCompare(b.code));

  return (
    <>
      <Header />
      <Suspense fallback={
        <div className="min-h-screen bg-white dark:bg-black">
          <div className="max-w-7xl mx-auto px-4 py-16">
            <div className="animate-pulse">
              <div className="h-12 bg-gray-200 rounded w-1/3 mb-8"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      }>
        <ErrorCodesClient 
          brand={brandData} 
          model={modelData}
          generations={generations}
          errorCodes={errorCodes}
        />
      </Suspense>
    </>
  );
}

