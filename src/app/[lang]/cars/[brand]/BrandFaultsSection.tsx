'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

type Fault = {
  id: string;
  slug: string;
  title: string;
  description?: string;
  error_code?: string;
  severity?: string;
  model_generation_id?: string;
  car_models?: {
    id: string;
    name: string;
    slug: string;
    model_generations?: {
      id: string;
      name: string;
      slug: string;
      generation_code?: string;
    }[];
  };
};

type BrandFaultsSectionProps = {
  brandSlug: string;
  brandName: string;
  lang: string;
  initialFaults: Fault[];
  totalCount: number;
};

const FAULTS_PER_PAGE = 60;

export default function BrandFaultsSection({ 
  brandSlug, 
  brandName, 
  lang, 
  initialFaults, 
  totalCount 
}: BrandFaultsSectionProps) {
  const [faults, setFaults] = useState<Fault[]>(initialFaults);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialFaults.length < totalCount);
  const t = (en: string, de: string) => lang === 'de' ? de : en;

  const loadMore = async () => {
    if (loading || !hasMore) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/cars/${brandSlug}/faults?page=${page + 1}&limit=${FAULTS_PER_PAGE}&lang=${lang}`);
      if (response.ok) {
        const data = await response.json();
        setFaults(prev => [...prev, ...data.faults]);
        setPage(prev => prev + 1);
        setHasMore(data.faults.length === FAULTS_PER_PAGE && faults.length + data.faults.length < totalCount);
      }
    } catch (error) {
      console.error('Error loading more faults:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-16">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2">
            {t('All Faults', 'Alle Fehler')} - {brandName}
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            {t(`Showing ${faults.length} of ${totalCount.toLocaleString()} faults`, `Zeige ${faults.length} von ${totalCount.toLocaleString()} Fehlern`)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {faults.map((fault, index) => {
          const model = fault.car_models;
          const generation = model?.model_generations?.[0];
          const modelSlug = model?.slug;
          const generationSlug = generation?.slug;
          
          // Build URL: /cars/{brand}/{model}/{generation}/faults/{slug}
          const faultUrl = modelSlug && generationSlug
            ? `/${lang}/cars/${brandSlug}/${modelSlug}/${generationSlug}/faults/${fault.slug}`
            : null;

          return (
            <motion.div
              key={fault.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              {faultUrl ? (
                <Link href={faultUrl} className="group block h-full">
                  <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm rounded-xl p-6 border-2 border-slate-200 dark:border-slate-800 hover:border-red-500/50 dark:hover:border-red-500/50 hover:shadow-xl transition-all duration-300 h-full flex flex-col hover:scale-105">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors line-clamp-2 flex-1">
                        {fault.title}
                      </h3>
                    </div>
                    
                    {fault.error_code && (
                      <div className="mb-3 flex items-center gap-2 px-3 py-1.5 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                        <span className="text-xs font-mono font-bold text-red-600 dark:text-red-400">
                          {fault.error_code}
                        </span>
                      </div>
                    )}
                    
                    {fault.description && (
                      <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2 mb-4 flex-grow">
                        {fault.description}
                      </p>
                    )}
                    
                    <div className="mt-auto pt-4 border-t border-slate-200 dark:border-slate-700">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                          {model && (
                            <>
                              <span className="font-semibold">{model.name}</span>
                              {generation && (
                                <>
                                  <span>•</span>
                                  <span>{generation.generation_code || generation.name}</span>
                                </>
                              )}
                            </>
                          )}
                        </div>
                        <div className="flex items-center text-red-600 dark:text-red-400 font-bold group-hover:translate-x-1 transition-transform">
                          {t('View', 'Ansehen')}
                          <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ) : (
                <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm rounded-xl p-6 border-2 border-slate-200 dark:border-slate-800 h-full flex flex-col">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3">
                    {fault.title}
                  </h3>
                  {fault.description && (
                    <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2">
                      {fault.description}
                    </p>
                  )}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {hasMore && (
        <div className="mt-12 text-center">
          <button
            onClick={loadMore}
            disabled={loading}
            className="px-8 py-4 bg-gradient-to-r from-red-600 to-red-700 dark:from-red-500 dark:to-red-600 text-white font-bold rounded-xl hover:from-red-700 hover:to-red-800 dark:hover:from-red-600 dark:hover:to-red-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? t('Loading...', 'Lade...') : t('Load More', 'Mehr laden')}
          </button>
        </div>
      )}
    </section>
  );
}

