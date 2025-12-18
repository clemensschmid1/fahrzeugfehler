import { createServerClient } from '@supabase/ssr';
import { cookies as getCookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { Suspense } from 'react';
import FaultClient from '../../faults/[slug]/FaultClient';
import CarPageTracker from '@/components/CarPageTracker';

export const dynamic = 'force-dynamic';
export const revalidate = 600;

type Params = { brand: string; model: string; generation: string; slug: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { brand, model, generation, slug } = await params;
  
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
    .select('name')
    .eq('slug', generation)
    .single();

  // Fetch fault with error_code (must have error_code)
  const { data: faultData } = await supabase
    .from('car_faults')
    .select('title, description, meta_title, meta_description, solution, created_at, error_code, affected_component, severity, difficulty_level, estimated_repair_time')
    .eq('slug', slug)
    .eq('language_path', 'de')
    .eq('status', 'live')
    .not('error_code', 'is', null)
    .maybeSingle();

  if (!brandData || !modelData || !generationData || !faultData) {
    return {
      title: 'Fehlercode nicht gefunden',
    };
  }

  // Use meta_title if available, otherwise construct from title
  const baseTitle = faultData.meta_title || faultData.title;
  const fullTitle = `${baseTitle} | ${brandData.name} ${modelData.name}`;
  const title = fullTitle.length > 60 ? fullTitle.substring(0, 57) + '...' : fullTitle;

  const defaultDescription = `Fehlercode ${faultData.error_code}: Lösung für ${faultData.title} im ${brandData.name} ${modelData.name} ${generationData.name}. Schritt-für-Schritt Anleitung.`;
  const rawDescription = faultData.meta_description || faultData.description || defaultDescription;
  const description = rawDescription.length > 160 ? rawDescription.substring(0, 157) + '...' : rawDescription;

  return {
    title: `${title} | Fahrzeugfehler.de`,
    description,
    keywords: faultData.title ? `${faultData.error_code}, ${faultData.title}, ${brandData.name}, ${modelData.name}, ${generationData.name}, OBD Fehlercode, Diagnosecode, Autoreparatur, Fahrzeugdiagnose` : undefined,
    alternates: {
      canonical: `https://fahrzeugfehler.de/cars/${brand}/${model}/${generation}/error-codes/${slug}`,
    },
    openGraph: {
      title: `${title} | Fahrzeugfehler.de`,
      description,
      type: 'article',
      url: `https://fahrzeugfehler.de/cars/${brand}/${model}/${generation}/error-codes/${slug}`,
      siteName: 'Fahrzeugfehler.de',
      images: [{
        url: `https://fahrzeugfehler.de/icon.svg`,
        width: 1200,
        height: 630,
        alt: faultData.title,
      }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | Fahrzeugfehler.de`,
      description,
      images: [`https://fahrzeugfehler.de/icon.svg`],
    },
  };
}

export default async function ErrorCodePage({ params }: { params: Promise<Params> }) {
  const { brand, model, generation, slug } = await params;
  
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

  // Fetch fault with error_code (must have error_code)
  const faultResult = await supabase
    .from('car_faults')
    .select('*')
    .eq('model_generation_id', generationData.id)
    .eq('slug', slug)
    .eq('language_path', 'de')
    .eq('status', 'live')
    .not('error_code', 'is', null)
    .single();

  if (faultResult.error || !faultResult.data) {
    return notFound();
  }

  const faultData = faultResult.data;

  // Fetch related faults - only those with error codes
  const { data: relatedFaults } = await supabase
    .from('car_faults')
    .select('id, slug, title, description, error_code, severity, difficulty_level, affected_component')
    .eq('model_generation_id', generationData.id)
    .eq('language_path', 'de')
    .eq('status', 'live')
    .not('error_code', 'is', null)
    .neq('id', faultData.id)
    .limit(6);

  // Fetch global related faults (same error code, different generation)
  const { data: globalRelatedFaults } = faultData.error_code ? await supabase
    .from('car_faults')
    .select('id, slug, title, description, error_code, model_generations(name, slug, car_models(slug, car_brands(slug)))')
    .eq('error_code', faultData.error_code)
    .eq('language_path', 'de')
    .eq('status', 'live')
    .neq('id', faultData.id)
    .limit(6) : { data: null };

  // Fetch comments
  const { data: comments } = await supabase
    .from('fault_comments')
    .select('*, profiles(id, email)')
    .eq('fault_id', faultData.id)
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .limit(50);

  // Fetch user
  const { data: { user } } = await supabase.auth.getUser();

  // Structured Data for error code
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: faultData.title,
    description: faultData.description,
    author: {
      '@type': 'Organization',
      name: 'Fahrzeugfehler.de',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Fahrzeugfehler.de',
      logo: {
        '@type': 'ImageObject',
        url: 'https://fahrzeugfehler.de/icon.svg',
      },
    },
    datePublished: faultData.created_at,
    dateModified: faultData.updated_at || faultData.created_at,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://fahrzeugfehler.de/cars/${brand}/${model}/${generation}/error-codes/${slug}`,
    },
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Startseite',
          item: 'https://fahrzeugfehler.de',
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Autos',
          item: 'https://fahrzeugfehler.de/cars',
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: brandData.name,
          item: `https://fahrzeugfehler.de/cars/${brand}`,
        },
        {
          '@type': 'ListItem',
          position: 4,
          name: modelData.name,
          item: `https://fahrzeugfehler.de/cars/${brand}/${model}`,
        },
        {
          '@type': 'ListItem',
          position: 5,
          name: generationData.name,
          item: `https://fahrzeugfehler.de/cars/${brand}/${model}/${generation}`,
        },
        {
          '@type': 'ListItem',
          position: 6,
          name: 'Fehlercodes',
          item: `https://fahrzeugfehler.de/cars/${brand}/${model}/${generation}/error-codes`,
        },
        {
          '@type': 'ListItem',
          position: 7,
          name: faultData.title,
          item: `https://fahrzeugfehler.de/cars/${brand}/${model}/${generation}/error-codes/${slug}`,
        },
      ],
    },
    keywords: `${faultData.error_code}, ${brandData.name}, ${modelData.name}, ${generationData.name}, OBD Fehlercode, Diagnosecode${faultData.error_code ? `, ${faultData.error_code}` : ''}`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <CarPageTracker
        slug={slug}
        title={faultData.title}
        type="error-code"
        brand={brandData.name}
        brandSlug={brandData.slug}
        model={modelData.name}
        modelSlug={modelData.slug}
        generation={generationData.name}
        generationSlug={generationData.slug}
        lang="de"
      />
      <Suspense fallback={
        <div className="min-h-screen bg-white dark:bg-black">
          <div className="max-w-4xl mx-auto px-4 py-16">
            <div className="animate-pulse">
              <div className="h-12 bg-gray-200 rounded w-3/4 mb-8"></div>
              <div className="h-64 bg-gray-200 rounded mb-8"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      }>
        <FaultClient 
          brand={brandData} 
          model={modelData} 
          generation={generationData}
          fault={faultData}
          relatedFaults={relatedFaults || []}
          globalRelatedFaults={globalRelatedFaults || []}
          initialComments={comments || []}
          user={user}
        />
      </Suspense>
    </>
  );
}

