import { createServerClient } from '@supabase/ssr';
import { cookies as getCookies } from 'next/headers';
import { Metadata } from 'next';
import Header from '@/components/Header';
import { Suspense } from 'react';
import CarsClient from './CarsClient';

// Use static generation with ISR for better performance
export const revalidate = 600; // 10 minutes cache

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Autos - Wartungs- & Reparaturanleitungen | Alle Marken',
    description: 'Finden Sie Reparaturanleitungen und Fehlerlösungen für alle Automarken und Modelle. Umfassende Auto-Wartungs- und Reparaturanleitungen mit Schritt-für-Schritt-Anweisungen.',
    alternates: {
      canonical: 'https://fahrzeugfehler.de/cars',
    },
    openGraph: {
      type: 'website',
      title: 'Autos - Wartungs- & Reparaturanleitungen | Alle Marken',
      description: 'Finden Sie Reparaturanleitungen und Fehlerlösungen für alle Automarken und Modelle. Umfassende Auto-Wartungs- und Reparaturanleitungen mit Schritt-für-Schritt-Anweisungen.',
      url: 'https://fahrzeugfehler.de/cars',
      siteName: 'Fahrzeugfehler.de',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Autos - Wartungs- & Reparaturanleitungen | Alle Marken',
      description: 'Finden Sie Reparaturanleitungen und Fehlerlösungen für alle Automarken und Modelle.',
    },
  };
}

export default async function CarsPage() {
  
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
      // Disable Realtime to prevent warnings and reduce bundle size
      realtime: {
        params: {
          eventsPerSecond: 0,
        },
      },
    }
  );

  // Fetch all car brands first (most important data)
  const { data: brands, error } = await supabase
    .from('car_brands')
    .select('id, name, slug, logo_url, description, country, founded_year, is_featured, display_order')
    .order('display_order', { ascending: true })
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching car brands:', error);
  }

  // Fetch statistics with very aggressive timeouts - fail fast if slow
  // These are optional stats, page works without them
  const statsPromise = Promise.allSettled([
    Promise.race([
      supabase.from('car_models').select('id', { count: 'exact', head: true }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 2000)) // 2 second timeout
    ]).catch(() => ({ count: 0 })),
    Promise.race([
      supabase.from('car_faults').select('id', { count: 'exact', head: true }).eq('status', 'live'),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 2000)) // 2 second timeout
    ]).catch(() => ({ count: 0 })),
  ]).then(([modelsResult, faultsResult]) => ({
    totalModels: modelsResult.status === 'fulfilled' ? ((modelsResult.value as any)?.count || 0) : 0,
    totalFaults: faultsResult.status === 'fulfilled' ? ((faultsResult.value as any)?.count || 0) : 0,
  })).catch(() => ({
    totalModels: 0,
    totalFaults: 0,
  }));

  // Don't wait for stats - render page immediately
  const stats = await Promise.race([
    statsPromise,
    new Promise<{ totalModels: number; totalFaults: number }>((resolve) => 
      setTimeout(() => resolve({ totalModels: 0, totalFaults: 0 }), 3000) // Max 3 seconds total
    )
  ]);

  // Fetch fault counts per brand - OPTIMIZED: Skip if RPC not available
  // This prevents 60+ second load times when RPC function doesn't exist
  let brandCountsMap = new Map<string, { faults: number }>();
  
  // Only try RPC if it exists - don't wait for timeout
  try {
    const rpcResult = await Promise.race([
      supabase.rpc('get_brand_content_counts'),
      new Promise((_, reject) => setTimeout(() => reject(new Error('RPC timeout')), 2000)) // 2 second timeout
    ]) as any;
    
    if (rpcResult?.data && !rpcResult?.error) {
      brandCountsMap = new Map(
        rpcResult.data.map((bc: any) => [bc.brand_id, { faults: bc.faults_count || 0 }])
      );
    }
  } catch (error) {
    // Silently skip - page works without counts
    // This prevents long load times when RPC doesn't exist
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
        <CarsClient brands={brands || []} stats={stats} brandCounts={brandCountsMap} />
      </Suspense>
    </>
  );
}

