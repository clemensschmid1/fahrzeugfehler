import { createServerClient } from '@supabase/ssr';
import { cookies as getCookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import Header from '@/components/Header';
import { Suspense } from 'react';
import FaultClient from './FaultClient';
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

  // Fetch fault
  const { data: faultData } = await supabase
    .from('car_faults')
    .select('title, description, meta_title, meta_description, solution, created_at, error_code, affected_component, severity, difficulty_level, estimated_repair_time')
    .eq('slug', slug)
    .eq('language_path', 'de')
    .eq('status', 'live')
    .maybeSingle();

  if (!brandData || !modelData || !generationData || !faultData) {
    return {
      title: 'Fehler nicht gefunden',
    };
  }

  // Use meta_title if available, otherwise construct from title
  const title = faultData.meta_title 
    ? `${faultData.meta_title} | ${brandData.name} ${modelData.name} ${generationData.name}`
    : `${faultData.title} | ${brandData.name} ${modelData.name} ${generationData.name}`;

  const description = faultData.meta_description || faultData.description || `Lösung für ${faultData.title} im ${brandData.name} ${modelData.name} ${generationData.name}`;

  return {
    title: `${title} | Fahrzeugfehler.de`,
    description,
    keywords: faultData.title ? `${faultData.title}, ${brandData.name}, ${modelData.name}, ${generationData.name}, Autoreparatur, Fahrzeugdiagnose, Fehlerdiagnose` : undefined,
    alternates: {
      canonical: `https://fahrzeugfehler.de/cars/${brand}/${model}/${generation}/faults/${slug}`,
    },
    openGraph: {
      title: `${title} | Fahrzeugfehler.de`,
      description,
      type: 'article',
      url: `https://fahrzeugfehler.de/cars/${brand}/${model}/${generation}/faults/${slug}`,
      siteName: 'Fahrzeugfehler.de',
      images: [{
        url: `https://fahrzeugfehler.de/logo.png`,
        width: 1200,
        height: 630,
        alt: faultData.title,
      }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | Fahrzeugfehler.de`,
      description,
    },
  };
}

export default async function FaultPage({ params }: { params: Promise<Params> }) {
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

  // Fetch fault
  const faultResult = await supabase
    .from('car_faults')
    .select('*')
    .eq('model_generation_id', generationData.id)
    .eq('slug', slug)
    .eq('language_path', 'de')
    .eq('status', 'live')
    .single();

  if (faultResult.error || !faultResult.data) {
    return notFound();
  }

  const faultData = faultResult.data;

  // Fetch related faults - simplified (no embeddings for now)
  const relatedFaultsResult = await supabase
    .from('car_faults')
    .select('id, slug, title')
    .eq('model_generation_id', generationData.id)
    .eq('language_path', 'de')
    .eq('status', 'live')
    .neq('id', faultData.id)
    .limit(6);

  const relatedFaults = relatedFaultsResult.data || [];
  const globalRelatedFaults: Array<{ id: string; slug: string; title: string; similarity?: number; brandName?: string; modelName?: string; generationName?: string }> = [];

  // Fetch user for comments
  const { data: { user } } = await supabase.auth.getUser().catch(() => ({ data: { user: null }, error: null }));

  // Fetch comments
  const commentsResult = await supabase
    .from('car_comments')
    .select('*')
    .eq('car_fault_id', faultData.id)
    .order('created_at', { ascending: false });

  // Fetch usernames for comments
  const userIds = commentsResult.data?.map(c => c.user_id).filter(Boolean) || [];
  const usernamesMap: Record<string, string | null> = {};
  
  if (userIds.length > 0) {
    const uniqueUserIds = [...new Set(userIds)];
    const profilesResult = await supabase
      .from('profiles')
      .select('id, username')
      .in('id', uniqueUserIds);
    
    if (profilesResult.data) {
      profilesResult.data.forEach(profile => {
        usernamesMap[profile.id] = profile.username || null;
      });
    }
  }

  const comments = (commentsResult.data || []).map(c => ({
    ...c,
    user_name: usernamesMap[c.user_id] || null,
  }));

  // Generate JSON-LD structured data for SEO
  const baseUrl = 'https://fahrzeugfehler.de';
  const pageUrl = `${baseUrl}/cars/${brand}/${model}/${generation}/faults/${slug}`;
  
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": faultData.title,
    "description": faultData.meta_description || faultData.description,
    "url": pageUrl,
    "image": `${baseUrl}/logo.png`,
    "datePublished": faultData.created_at || new Date().toISOString(),
    "dateModified": faultData.created_at || new Date().toISOString(),
    "author": {
      "@type": "Organization",
      "name": "Fahrzeugfehler.de",
      "url": baseUrl
    },
    "publisher": {
      "@type": "Organization",
      "name": "Fahrzeugfehler.de",
      "url": baseUrl,
      "logo": {
        "@type": "ImageObject",
        "url": `${baseUrl}/logo.png`
      }
    },
    "mainEntity": {
      "@type": "Question",
      "name": faultData.title,
      "text": faultData.title,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faultData.solution || faultData.description,
        "author": {
          "@type": "Organization",
          "name": "Fahrzeugfehler.de Redaktion"
        }
      }
    },
    "about": {
      "@type": "Vehicle",
      "name": `${brandData.name} ${modelData.name} ${generationData.name}`,
      "brand": {
        "@type": "Brand",
        "name": brandData.name
      },
      "model": modelData.name
    },
    ...(faultData.error_code ? {
      "identifier": {
        "@type": "PropertyValue",
        "name": "Error Code",
        "value": faultData.error_code
      }
    } : {}),
    ...(faultData.affected_component ? {
      "category": faultData.affected_component
    } : {}),
    "inLanguage": "de",
    "keywords": `${faultData.title}, ${brandData.name}, ${modelData.name}, ${generationData.name}, Autoreparatur, Fahrzeugdiagnose, Fehlerdiagnose${faultData.error_code ? `, ${faultData.error_code}` : ''}`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Header />
      <CarPageTracker
        slug={slug}
        title={faultData.title}
        type="fault"
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
          relatedFaults={relatedFaults}
          globalRelatedFaults={globalRelatedFaults}
          initialComments={comments}
          user={user}
        />
      </Suspense>
    </>
  );
}

