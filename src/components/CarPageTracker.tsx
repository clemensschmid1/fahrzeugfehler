'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { addVisitedCarPage } from '@/lib/car-visited-pages';

interface CarPageTrackerProps {
  slug: string;
  title: string;
  type: 'fault' | 'manual';
  brand: string;
  brandSlug: string;
  model: string;
  modelSlug: string;
  generation: string;
  generationSlug: string;
  lang: 'en' | 'de';
}

/**
 * Component to track car page visits
 * Should be placed on car fault and manual pages
 */
export default function CarPageTracker({
  slug,
  title,
  type,
  brand,
  brandSlug,
  model,
  modelSlug,
  generation,
  generationSlug,
  lang,
}: CarPageTrackerProps) {
  const pathname = usePathname();
  
  useEffect(() => {
    // Only track if we're on the actual page (not during navigation)
    const url = pathname || `/${lang}/cars/${brandSlug}/${modelSlug}/${generationSlug}/${type === 'fault' ? 'faults' : 'manuals'}/${slug}`;
    
    addVisitedCarPage({
      slug,
      title,
      url,
      type,
      brand,
      brandSlug,
      model,
      modelSlug,
      generation,
      generationSlug,
      lang: lang as 'en' | 'de',
    });
  }, [slug, title, type, brand, brandSlug, model, modelSlug, generation, generationSlug, lang, pathname]);
  
  // This component doesn't render anything
  return null;
}













