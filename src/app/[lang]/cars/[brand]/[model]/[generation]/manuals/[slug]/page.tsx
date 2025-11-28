import { createServerClient } from '@supabase/ssr';
import { cookies as getCookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import Header from '@/components/Header';
import { Suspense } from 'react';
import ManualClient from './ManualClient';

export const dynamic = 'force-dynamic';
export const revalidate = 600;

type Params = { lang: string; brand: string; model: string; generation: string; slug: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { lang, brand, model, generation, slug } = await params;
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
    .select('name')
    .eq('slug', generation)
    .single();

  // Fetch manual
  const { data: manualData } = await supabase
    .from('car_manuals')
    .select('title, description, meta_title, meta_description')
    .eq('slug', slug)
    .eq('language_path', lang)
    .eq('status', 'live')
    .maybeSingle();

  if (!brandData || !modelData || !generationData || !manualData) {
    return {
      title: t('Manual Not Found', 'Anleitung nicht gefunden'),
    };
  }

  // Use meta_title if available, otherwise construct from title
  const title = manualData.meta_title 
    ? `${manualData.meta_title} | ${brandData.name} ${modelData.name} ${generationData.name}`
    : `${manualData.title} | ${brandData.name} ${modelData.name} ${generationData.name}`;

  const description = manualData.meta_description || manualData.description || t(
    `${manualData.title} guide for ${brandData.name} ${modelData.name} ${generationData.name}`,
    `${manualData.title} Anleitung für ${brandData.name} ${modelData.name} ${generationData.name}`
  );

  return {
    title: `${title} | Cars`,
    description,
    alternates: {
      canonical: `https://infoneva.com/${lang}/cars/${brand}/${model}/${generation}/manuals/${slug}`,
      languages: {
        'en': `https://infoneva.com/en/cars/${brand}/${model}/${generation}/manuals/${slug}`,
        'de': `https://infoneva.com/de/cars/${brand}/${model}/${generation}/manuals/${slug}`,
      },
    },
  };
}

export default async function ManualPage({ params }: { params: Promise<Params> }) {
  const { lang, brand, model, generation, slug } = await params;
  
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

  // Fetch manual
  const manualResult = await supabase
    .from('car_manuals')
    .select('*')
    .eq('model_generation_id', generationData.id)
    .eq('slug', slug)
    .eq('language_path', lang)
    .eq('status', 'live')
    .single();

  if (manualResult.error || !manualResult.data) {
    return notFound();
  }

  const manualData = manualResult.data;

  // Fetch related manuals for the same generation
  const relatedManualsResult = await supabase
    .from('car_manuals')
    .select('id, slug, title')
    .eq('model_generation_id', generationData.id)
    .eq('language_path', lang)
    .eq('status', 'live')
    .neq('id', manualData.id)
    .limit(6);

  const relatedManuals = relatedManualsResult.data || [];

  // Fetch user for comments
  const { data: { user } } = await supabase.auth.getUser().catch(() => ({ data: { user: null }, error: null }));

  // Fetch comments
  const commentsResult = await supabase
    .from('car_comments')
    .select('*')
    .eq('car_manual_id', manualData.id)
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

  return (
    <>
      <Header />
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
        <ManualClient 
          brand={brandData} 
          model={modelData} 
          generation={generationData}
          manual={manualData}
          relatedManuals={relatedManuals}
          lang={lang}
          initialComments={comments}
          user={user}
        />
      </Suspense>
    </>
  );
}

