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
  model_generations?: {
    id: string;
    name: string;
    slug: string;
    generation_code?: string;
  };
};

type Generation = {
  id: string;
  name: string;
  slug: string;
  generation_code?: string;
};

type ModelFaultsSectionProps = {
  brandSlug: string;
  modelSlug: string;
  modelName: string;
  generations: Generation[];
  initialFaults: Fault[];
  totalCount: number;
  selectedGenerationId?: string | null;
};

const FAULTS_PER_PAGE = 60;

export default function ModelFaultsSection({ 
  brandSlug,
  modelSlug,
  modelName,
  generations,
  initialFaults, 
  totalCount,
  selectedGenerationId = null
}: ModelFaultsSectionProps) {
  const [faults, setFaults] = useState<Fault[]>(initialFaults);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialFaults.length < totalCount);
  const [selectedGenId, setSelectedGenId] = useState<string | null>(selectedGenerationId);

  // Reload faults when generation filter changes
  useEffect(() => {
    const loadFaults = async () => {
      setLoading(true);
      setPage(1);
      try {
        const url = selectedGenId
          ? `/api/cars/${brandSlug}/${modelSlug}/faults?generationId=${selectedGenId}&page=1&limit=${FAULTS_PER_PAGE}&lang=de`
          : `/api/cars/${brandSlug}/${modelSlug}/faults?page=1&limit=${FAULTS_PER_PAGE}&lang=de`;
        
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          setFaults(data.faults || []);
          setHasMore(data.faults.length === FAULTS_PER_PAGE && data.faults.length < data.totalCount);
        }
      } catch (error) {
        console.error('Error loading faults:', error);
      } finally {
        setLoading(false);
      }
    };

    loadFaults();
  }, [selectedGenId, brandSlug, modelSlug]);

  const loadMore = async () => {
    if (loading || !hasMore) return;
    
    setLoading(true);
    try {
      const url = selectedGenId
        ? `/api/cars/${brandSlug}/${modelSlug}/faults?generationId=${selectedGenId}&page=${page + 1}&limit=${FAULTS_PER_PAGE}&lang=de`
        : `/api/cars/${brandSlug}/${modelSlug}/faults?page=${page + 1}&limit=${FAULTS_PER_PAGE}&lang=de`;
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setFaults(prev => [...prev, ...data.faults]);
        setPage(prev => prev + 1);
        setHasMore(data.faults.length === FAULTS_PER_PAGE && faults.length + data.faults.length < data.totalCount);
      }
    } catch (error) {
      console.error('Error loading more faults:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectedGeneration = selectedGenId 
    ? generations.find(g => g.id === selectedGenId)
    : null;

  return (
    <section className="py-16">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2">
            Fehler - {modelName}
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            {selectedGeneration
              ? `Zeige ${faults.length} von ${totalCount.toLocaleString()} Fehlern für ${selectedGeneration.generation_code || selectedGeneration.name}`
              : `Zeige ${faults.length} von ${totalCount.toLocaleString()} Fehlern für alle Generationen`}
          </p>
        </div>
      </div>

      {/* Generation Filter Buttons */}
      {generations.length > 0 && (
        <div className="mb-8">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
              Nach Generation filtern:
            </span>
            <button
              onClick={() => setSelectedGenId(null)}
              className={`px-4 py-2 rounded-lg font-bold text-sm border-2 transition-all duration-200 ${
                selectedGenId === null
                  ? 'bg-blue-600 text-white border-blue-600 shadow-lg scale-105'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:border-blue-500 dark:hover:border-blue-500'
              }`}
            >
              Alle Generationen
            </button>
            {generations.map((gen) => (
              <button
                key={gen.id}
                onClick={() => setSelectedGenId(gen.id)}
                className={`px-4 py-2 rounded-lg font-bold text-sm border-2 transition-all duration-200 ${
                  selectedGenId === gen.id
                    ? 'bg-blue-600 text-white border-blue-600 shadow-lg scale-105'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:border-blue-500 dark:hover:border-blue-500'
                }`}
              >
                {gen.generation_code || gen.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {loading && faults.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse"></div>
          ))}
        </div>
      ) : faults.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-xl text-slate-600 dark:text-slate-400">
            Keine Fehler gefunden
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {faults.map((fault, index) => {
              const generation = fault.model_generations;
              const generationSlug = generation?.slug;
              
              // Build URL: /cars/{brand}/{model}/{generation}/faults/{slug}
              const faultUrl = generationSlug
                ? `/cars/${brandSlug}/${modelSlug}/${generationSlug}/faults/${fault.slug}`
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
                      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm rounded-xl p-6 border-2 border-slate-200 dark:border-slate-800 hover:border-blue-500/50 dark:hover:border-blue-500/50 hover:shadow-xl transition-all duration-300 h-full flex flex-col hover:scale-105">
                        <div className="flex items-start justify-between mb-3">
                          <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 flex-1">
                            {fault.title}
                          </h3>
                        </div>
                        
                        {fault.error_code && (
                          <div className="mb-3 flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                            <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">
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
                            {generation && (
                              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                                <span>{generation.generation_code || generation.name}</span>
                              </div>
                            )}
                            <div className="flex items-center text-blue-600 dark:text-blue-400 font-bold group-hover:translate-x-1 transition-transform">
                              Ansehen
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
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-500 dark:to-blue-600 text-white font-bold rounded-xl hover:from-blue-700 hover:to-blue-800 dark:hover:from-blue-600 dark:hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Lade...' : 'Mehr laden'}
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}

