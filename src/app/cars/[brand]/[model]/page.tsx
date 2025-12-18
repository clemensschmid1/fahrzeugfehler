import { createServerClient } from '@supabase/ssr';
import { cookies as getCookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { Suspense } from 'react';
import GenerationListClient from './GenerationListClient';

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
      title: 'Modell nicht gefunden',
    };
  }

  const defaultDescription = `Alle Generationen des ${brandData.name} ${modelData.name}. Spezifische Fehler und Anleitungen für jedes Modelljahr.`;
  const description = modelData.description 
    ? (modelData.description.length > 160 ? modelData.description.substring(0, 157) + '...' : modelData.description)
    : defaultDescription;
  
  return {
    title: `${brandData.name} ${modelData.name} Generationen`,
    description,
    alternates: {
      canonical: `https://fahrzeugfehler.de/cars/${brand}/${model}`,
    },
    openGraph: {
      type: 'website',
      title: `${brandData.name} ${modelData.name} Generationen`,
      description,
      url: `https://fahrzeugfehler.de/cars/${brand}/${model}`,
      siteName: 'Fahrzeugfehler.de',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${brandData.name} ${modelData.name} Generationen`,
      description,
    },
  };
}

export default async function ModelGenerationsPage({ params }: { params: Promise<Params> }) {
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

  // Fetch model with production numbers
  const modelResult = await supabase
    .from('car_models')
    .select('*, production_numbers')
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

  // Fetch total fault count for this model across all generations
  const generationIds = generations.map(g => g.id);
  let totalFaultsCount = 0;
  let initialFaults: any[] = [];

  if (generationIds.length > 0 || modelData.id) {
    // Count faults: either by model_id or generation_id - hardcode to 'de'
    const { count: faultsCount } = await supabase
      .from('car_faults')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'live')
      .eq('language_path', 'de') // Hardcoded to 'de'
      .or(`car_model_id.eq.${modelData.id},model_generation_id.in.(${generationIds.length > 0 ? generationIds.join(',') : 'null'})`);

    totalFaultsCount = faultsCount || 0;

    // Fetch initial faults (first 60) for display
    if (totalFaultsCount > 0) {
      try {
        // Use localhost in development, or construct URL properly
        const baseUrl = process.env.NODE_ENV === 'development' 
          ? 'http://localhost:3000'
          : (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000');
        
        const response = await fetch(`${baseUrl}/api/cars/${brand}/${model}/faults?page=1&limit=60&lang=de`, {
          cache: 'no-store'
        });
        if (response.ok) {
          const data = await response.json();
          initialFaults = data.faults || [];
        }
      } catch (error) {
        console.error('Error fetching initial faults:', error);
        // Silently fail - page will still work without initial faults
      }
    }
  }

  return (
    <>
      <Suspense fallback={
        <div className="min-h-screen bg-white dark:bg-black">
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
          totalFaultsCount={totalFaultsCount}
          initialFaults={initialFaults}
        />
      </Suspense>
    </>
  );
}

