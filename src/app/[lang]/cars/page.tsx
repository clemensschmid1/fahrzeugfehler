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
      canonical: `https://faultbase.com/${lang}/cars`,
      languages: {
        'en': 'https://faultbase.com/en/cars',
        'de': 'https://faultbase.com/de/cars',
      },
    },
    openGraph: {
      type: 'website',
      title: t('Cars - Car Maintenance & Repair Guides | All Brands', 'Autos - Wartungs- & Reparaturanleitungen | Alle Marken'),
      description: t(
        'Find fixing manuals and fault solutions for all car brands and models. Comprehensive car maintenance and repair guides with step-by-step instructions.',
        'Finden Sie Reparaturanleitungen und Fehlerlösungen für alle Automarken und Modelle. Umfassende Auto-Wartungs- und Reparaturanleitungen mit Schritt-für-Schritt-Anweisungen.'
      ),
      url: `https://faultbase.com/${lang}/cars`,
      siteName: 'FAULTBASE',
    },
    twitter: {
      card: 'summary_large_image',
      title: t('Cars - Car Maintenance & Repair Guides | All Brands', 'Autos - Wartungs- & Reparaturanleitungen | Alle Marken'),
      description: t(
        'Find fixing manuals and fault solutions for all car brands and models.',
        'Finden Sie Reparaturanleitungen und Fehlerlösungen für alle Automarken und Modelle.'
      ),
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

  // Fetch statistics in parallel for better performance
  const [modelsResult, faultsResult, manualsResult] = await Promise.allSettled([
    supabase
      .from('car_models')
      .select('id', { count: 'exact', head: true }),
    supabase
      .from('car_faults')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'live'),
    supabase
      .from('car_manuals')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'live'),
  ]);

  const stats = {
    totalModels: modelsResult.status === 'fulfilled' ? (modelsResult.value.count || 0) : 0,
    totalFaults: faultsResult.status === 'fulfilled' ? (faultsResult.value.count || 0) : 0,
    totalManuals: manualsResult.status === 'fulfilled' ? (manualsResult.value.count || 0) : 0,
  };

  // Fetch fault/manual counts per brand efficiently
  let brandCountsMap = new Map<string, { faults: number; manuals: number }>();
  
  try {
    // Try RPC function first (if it exists)
    const rpcResult = await supabase.rpc('get_brand_content_counts');
    if (rpcResult.data && !rpcResult.error) {
      brandCountsMap = new Map(
        rpcResult.data.map((bc: any) => [bc.brand_id, { faults: bc.faults_count || 0, manuals: bc.manuals_count || 0 }])
      );
    } else {
      throw new Error('RPC not available');
    }
  } catch {
    // Fallback: manual query if RPC doesn't exist
    const brandIds = (brands || []).map(b => b.id);
    if (brandIds.length > 0) {
      // Get all models for these brands
      const { data: allModels } = await supabase
        .from('car_models')
        .select('id, brand_id')
        .in('brand_id', brandIds);

      if (allModels && allModels.length > 0) {
        const modelIds = allModels.map(m => m.id);
        
        // Get all generations for these models
        const { data: allGenerations } = await supabase
          .from('model_generations')
          .select('id, car_model_id')
          .in('car_model_id', modelIds);

        const generationIds = allGenerations?.map(g => g.id) || [];

        // Count faults per brand - use efficient aggregation
        // Query faults by model_id first
        const { data: faultsByModel } = await supabase
          .from('car_faults')
          .select('car_model_id')
          .eq('status', 'live')
          .in('car_model_id', modelIds);

        // Query faults by generation_id
        const { data: faultsByGeneration } = generationIds.length > 0 ? await supabase
          .from('car_faults')
          .select('model_generation_id')
          .eq('status', 'live')
          .in('model_generation_id', generationIds) : { data: null };

        // Combine results (avoid duplicates by using Set)
        const faultsData = [
          ...(faultsByModel || []).map(f => ({ car_model_id: f.car_model_id, model_generation_id: null })),
          ...(faultsByGeneration || []).map(f => ({ car_model_id: null, model_generation_id: f.model_generation_id }))
        ];

        // Count manuals per brand - same approach
        const { data: manualsByModel } = await supabase
          .from('car_manuals')
          .select('car_model_id')
          .eq('status', 'live')
          .in('car_model_id', modelIds);

        const { data: manualsByGeneration } = generationIds.length > 0 ? await supabase
          .from('car_manuals')
          .select('model_generation_id')
          .eq('status', 'live')
          .in('model_generation_id', generationIds) : { data: null };

        const manualsData = [
          ...(manualsByModel || []).map(m => ({ car_model_id: m.car_model_id, model_generation_id: null })),
          ...(manualsByGeneration || []).map(m => ({ car_model_id: null, model_generation_id: m.model_generation_id }))
        ];

        // Create lookup maps for efficiency
        const generationToModelMap = new Map<string, string>();
        allGenerations?.forEach(gen => {
          generationToModelMap.set(gen.id, gen.car_model_id);
        });

        const modelToBrandMap = new Map<string, string>();
        allModels.forEach(model => {
          modelToBrandMap.set(model.id, model.brand_id);
        });

        // Aggregate counts by brand
        const countsByBrand: Record<string, { faults_count: number; manuals_count: number }> = {};
        brandIds.forEach(id => {
          countsByBrand[id] = { faults_count: 0, manuals_count: 0 };
        });

        // Count faults efficiently
        if (faultsData) {
          for (const fault of faultsData) {
            let modelId: string | null = null;
            if (fault.car_model_id) {
              modelId = fault.car_model_id;
            } else if (fault.model_generation_id) {
              modelId = generationToModelMap.get(fault.model_generation_id) || null;
            }
            if (modelId) {
              const brandId = modelToBrandMap.get(modelId);
              if (brandId && countsByBrand[brandId]) {
                countsByBrand[brandId].faults_count++;
              }
            }
          }
        }

        // Count manuals efficiently
        if (manualsData) {
          for (const manual of manualsData) {
            let modelId: string | null = null;
            if (manual.car_model_id) {
              modelId = manual.car_model_id;
            } else if (manual.model_generation_id) {
              modelId = generationToModelMap.get(manual.model_generation_id) || null;
            }
            if (modelId) {
              const brandId = modelToBrandMap.get(modelId);
              if (brandId && countsByBrand[brandId]) {
                countsByBrand[brandId].manuals_count++;
              }
            }
          }
        }

        brandCountsMap = new Map(
          brandIds.map(id => [id, { faults: countsByBrand[id]?.faults_count || 0, manuals: countsByBrand[id]?.manuals_count || 0 }])
        );
      }
    }
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
        <CarsClient brands={brands || []} lang={lang} stats={stats} brandCounts={brandCountsMap} />
      </Suspense>
    </>
  );
}

