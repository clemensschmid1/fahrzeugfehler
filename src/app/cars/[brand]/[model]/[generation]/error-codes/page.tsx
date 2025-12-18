import { createServerClient } from '@supabase/ssr';
import { cookies as getCookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { Suspense } from 'react';
import GenerationErrorCodesClient from './GenerationErrorCodesClient';

// Use dynamic rendering - this page is available for ALL generations automatically
export const dynamic = 'force-dynamic';
export const dynamicParams = true;
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

  // Fetch generation with year info
  const { data: generationData } = await supabase
    .from('model_generations')
    .select('id, name, generation_code, description, meta_title, meta_description, year_start, year_end')
    .eq('slug', generation)
    .single();

  if (!brandData || !modelData || !generationData) {
    return {
      title: 'Fehlercodes nicht gefunden',
    };
  }

  // Fetch error codes count for metadata
  const generationId = generationData?.id;
  const { count: errorCodesCount } = generationId ? await supabase
    .from('car_faults')
    .select('*', { count: 'exact', head: true })
    .eq('model_generation_id', generationId)
    .eq('language_path', 'de')
    .eq('status', 'live')
    .not('error_code', 'is', null) : { count: null };

  const generationName = generationData.generation_code || generationData.name;
  const yearRange = generationData.year_start && generationData.year_end 
    ? `${generationData.year_start}-${generationData.year_end}`
    : generationData.year_start 
    ? `ab ${generationData.year_start}`
    : '';
  const errorCodesCountText = errorCodesCount ? `${errorCodesCount} Fehlercodes` : 'alle Fehlercodes';
  
  const baseTitle = `Fehlercodes ${brandData.name} ${modelData.name} ${generationName} - Übersicht & Bedeutung`;
  const title = baseTitle.length > 60 ? baseTitle.substring(0, 57) + '...' : baseTitle;
  const description = `Vollständige Übersicht aller ${errorCodesCountText} für ${brandData.name} ${modelData.name} ${generationName}${yearRange ? ` (${yearRange})` : ''}. Bedeutung, Ursachen, Symptome und Lösungen für jeden OBD-Diagnosecode. Professionelle Fehlerdiagnose für Werkstätten und Autobesitzer.`;

  // Extended keywords for better SEO
  const keywords = [
    `Fehlercodes ${brandData.name} ${modelData.name} ${generationName}`,
    `${generationName} Fehlercodes`,
    `${brandData.name} ${modelData.name} Diagnosecodes`,
    `${brandData.name} ${modelData.name} ${generationName} Fehlercodes`,
    `OBD Fehlercodes ${brandData.name} ${modelData.name}`,
    'Fehlercode Bedeutung',
    'Diagnosecodes Übersicht',
    'OBD2 Fehlercodes',
    'Fahrzeugdiagnose',
    'Fehlercode Liste',
    `${generationName} OBD Codes`,
    `${brandData.name} Fehlercodes`,
    'Auto Fehlercodes',
    'Kfz Diagnosecodes',
  ];

  const canonicalUrl = `https://fahrzeugfehler.de/cars/${brand}/${model}/${generation}/error-codes`;

  return {
    title: `${title} | Fahrzeugfehler.de`,
    description: description.length > 160 ? description.substring(0, 157) + '...' : description,
    keywords,
    authors: [{ name: 'Fahrzeugfehler.de Redaktion' }],
    creator: 'Fahrzeugfehler.de',
    publisher: 'Fahrzeugfehler.de',
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      type: 'website',
      locale: 'de_DE',
      url: canonicalUrl,
      siteName: 'Fahrzeugfehler.de',
      title: `${title} | Fahrzeugfehler.de`,
      description: description.length > 200 ? description.substring(0, 197) + '...' : description,
      images: [
        {
          url: `https://fahrzeugfehler.de/icon.svg`,
          width: 512,
          height: 512,
          alt: `${brandData.name} ${modelData.name} ${generationName} Fehlercodes`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | Fahrzeugfehler.de`,
      description: description.length > 200 ? description.substring(0, 197) + '...' : description,
      images: [`https://fahrzeugfehler.de/icon.svg`],
    },
    other: {
      'article:published_time': new Date().toISOString(),
      'article:modified_time': new Date().toISOString(),
    },
  };
}

export default async function GenerationErrorCodesPage({ params }: { params: Promise<Params> }) {
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

  // Fetch all faults with error codes for THIS SPECIFIC generation
  const faultsResult = await supabase
    .from('car_faults')
    .select(`
      id,
      slug,
      title,
      description,
      error_code,
      severity,
      difficulty_level,
      affected_component,
      estimated_repair_time
    `)
    .eq('model_generation_id', generationData.id)
    .eq('language_path', 'de')
    .eq('status', 'live')
    .not('error_code', 'is', null)
    .order('error_code', { ascending: true });

  if (faultsResult.error) {
    console.error('Error fetching faults:', faultsResult.error);
  }

  const faults = faultsResult.data || [];
  
  // Debug logging (only in development)
  if (process.env.NODE_ENV === 'development') {
    console.log('[Error Codes Page] Generation ID:', generationData.id);
    console.log('[Error Codes Page] Generation slug:', generationData.slug);
    console.log('[Error Codes Page] Fetched faults count:', faults.length);
    if (faults.length > 0) {
      console.log('[Error Codes Page] Sample fault:', faults[0]);
    } else {
      // Check if generation exists and has any faults at all
      const allFaultsCheck = await supabase
        .from('car_faults')
        .select('id, error_code, status, language_path')
        .eq('model_generation_id', generationData.id)
        .limit(5);
      console.log('[Error Codes Page] All faults for generation (any status/lang):', allFaultsCheck.data?.length || 0);
      if (allFaultsCheck.data && allFaultsCheck.data.length > 0) {
        console.log('[Error Codes Page] Sample faults (any):', allFaultsCheck.data);
      }
    }
  }

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

  // Convert to array structure with meaning/description
  const errorCodes = Array.from(errorCodesMap.entries())
    .map(([code, faults]) => {
      // Get the most comprehensive fault description as the "meaning"
      const primaryFault = faults[0];
      const meaning = primaryFault.description || primaryFault.title;
      
      return {
        code,
        meaning,
        faults,
        count: faults.length,
        severity: primaryFault.severity,
        affectedComponent: primaryFault.affected_component,
        difficultyLevel: primaryFault.difficulty_level,
        estimatedRepairTime: primaryFault.estimated_repair_time,
        symptoms: [],
        diagnosticSteps: [],
        toolsRequired: [],
        partsRequired: [],
      };
    })
    .sort((a, b) => a.code.localeCompare(b.code));

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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-64 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse">
                  <div className="p-6 space-y-3">
                    <div className="h-8 bg-slate-300 dark:bg-slate-700 rounded w-1/3"></div>
                    <div className="h-4 bg-slate-300 dark:bg-slate-700 rounded w-full"></div>
                    <div className="h-4 bg-slate-300 dark:bg-slate-700 rounded w-5/6"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      }>
        <GenerationErrorCodesClient 
          brand={brandData} 
          model={modelData}
          generation={generationData}
          errorCodes={errorCodes}
        />
      </Suspense>
    </>
  );
}

