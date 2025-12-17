import { createServerClient } from '@supabase/ssr';
import { cookies as getCookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import Header from '@/components/Header';
import { Suspense } from 'react';
import BrandClient from './BrandClient';

// Use static generation with ISR for better performance
export const revalidate = 600; // 10 minutes cache

type Params = { brand: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { brand } = await params;
  
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
      title: 'Marke nicht gefunden',
    };
  }

  return {
    title: `${brandData.name} - Automodelle | Fahrzeugfehler.de`,
    description: brandData.description || `Finden Sie Reparaturanleitungen und Fehlerlösungen für ${brandData.name} Automodelle.`,
    alternates: {
      canonical: `https://fahrzeugfehler.de/cars/${brand}`,
    },
  };
}

export default async function BrandPage({ params }: { params: Promise<Params> }) {
  const { brand } = await params;
  
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

  // Fetch brand first - only select needed fields for performance
  const brandResult = await supabase
    .from('car_brands')
    .select('id, name, slug, logo_url, description, country, founded_year, is_featured, display_order')
    .eq('slug', brand)
    .single();

  if (brandResult.error || !brandResult.data) {
    return notFound();
  }

  const brandData = brandResult.data;

  // Then fetch models for this brand - only select needed fields for performance
  const modelsResult = await supabase
    .from('car_models')
    .select('id, brand_id, name, slug, year_start, year_end, description, image_url, sprite_3d_url, production_numbers, is_featured, display_order')
    .eq('brand_id', brandData.id)
    .order('display_order', { ascending: true })
    .order('name', { ascending: true });

  const models = modelsResult.data || [];

  // Fetch fault/manual counts for this brand - OPTIMIZED with timeouts
  const modelIds = models.map(m => m.id);
  let brandFaultsCount = 0;
  let brandManualsCount = 0;

  // Only fetch counts if we have models, and use timeouts to prevent slow queries
  if (modelIds.length > 0) {
    try {
      // Use Promise.race with timeout for all count queries
      const countsPromise = Promise.allSettled([
        // Get generations count (simplified - just count, don't fetch all)
        Promise.race([
          supabase
            .from('model_generations')
            .select('id', { count: 'exact', head: true })
            .in('car_model_id', modelIds),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 1500))
        ]).catch(() => ({ count: 0 })),
        
        // Count faults with timeout
        Promise.race([
          supabase
            .from('car_faults')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'live')
            .in('car_model_id', modelIds), // Simplified - only count by model_id for speed
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 1500))
        ]).catch(() => ({ count: 0 })),
        
        // Count manuals with timeout
        Promise.race([
          supabase
            .from('car_manuals')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'live')
            .in('car_model_id', modelIds), // Simplified - only count by model_id for speed
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 1500))
        ]).catch(() => ({ count: 0 }))
      ]);

      const counts = await Promise.race([
        countsPromise,
        new Promise<Array<{ status: string; value?: { count: number } }>>((resolve) => 
          setTimeout(() => resolve([
            { status: 'fulfilled', value: { count: 0 } },
            { status: 'fulfilled', value: { count: 0 } },
            { status: 'fulfilled', value: { count: 0 } }
          ]), 2000) // Max 2 seconds total
        )
      ]);

      // Extract counts safely
      const faultsResult = counts[1];
      const manualsResult = counts[2];
      
      brandFaultsCount = faultsResult.status === 'fulfilled' ? (faultsResult.value?.count || 0) : 0;
      brandManualsCount = manualsResult.status === 'fulfilled' ? (manualsResult.value?.count || 0) : 0;
    } catch (error) {
      // Silently fail - page works without counts
      console.error('Error fetching brand counts:', error);
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-64 bg-gray-200 rounded-lg"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      }>
        <BrandClient brand={brandData} models={models} faultsCount={brandFaultsCount} manualsCount={brandManualsCount} />
      </Suspense>
    </>
  );
}

