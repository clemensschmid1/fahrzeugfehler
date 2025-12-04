'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { addVisitedPage } from '@/lib/visited-pages';

interface VisitedPageTrackerProps {
  slug: string;
  title: string;
  type: 'knowledge' | 'news';
  lang: 'en' | 'de';
}

/**
 * Component to track page visits
 * Should be placed on knowledge article pages and news article pages
 */
export default function VisitedPageTracker({ slug, title, type, lang }: VisitedPageTrackerProps) {
  const pathname = usePathname();
  
  useEffect(() => {
    // Only track if we're on the actual page (not during navigation)
    const url = pathname || `/${lang}/${type === 'knowledge' ? 'knowledge' : 'news'}/${slug}`;
    
    addVisitedPage({
      slug,
      title,
      url,
      type,
      lang,
    });
  }, [slug, title, type, lang, pathname]);
  
  // This component doesn't render anything
  return null;
}


