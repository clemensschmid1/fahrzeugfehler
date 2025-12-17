'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useState } from 'react';

type CarBrand = {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  description?: string;
  country?: string;
  founded_year?: number;
};

type CarModel = {
  id: string;
  brand_id: string;
  name: string;
  slug: string;
  year_start?: number;
  year_end?: number;
  description?: string;
  image_url?: string;
};

type ModelGeneration = {
  id: string;
  car_model_id: string;
  name: string;
  slug: string;
  year_start?: number;
  year_end?: number;
  description?: string;
  generation_code?: string;
  image_url?: string;
  is_featured: boolean;
  display_order: number;
};

type Props = {
  brand: CarBrand;
  model: CarModel;
  generations: ModelGeneration[];
  lang: string;
};

export default function GenerationListClient({ brand, model, generations, lang }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const t = (en: string, de: string) => lang === 'de' ? de : en;

  // Filter generations based on search
  const filteredGenerations = generations.filter(gen =>
    gen.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    gen.generation_code?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Separate featured and regular generations
  const featuredGenerations = filteredGenerations.filter(g => g.is_featured);
  const regularGenerations = filteredGenerations.filter(g => !g.is_featured);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 dark:from-blue-950 dark:via-blue-900 dark:to-blue-950">
        <div className="absolute inset-0 bg-gradient-to-br from-black/20 via-transparent to-black/10 dark:from-black/40 dark:via-transparent dark:to-black/20"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_70%)] dark:bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.05),transparent_70%)]"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            {/* Breadcrumb */}
            <nav className="mb-6 flex items-center justify-center space-x-2 text-sm text-blue-100">
              <Link href={`/${lang}`} className="hover:text-white transition-colors">
                {t('Home', 'Startseite')}
              </Link>
              <span>/</span>
              <Link href={`/${lang}/cas`} className="hover:text-white transition-colors">
                {t('CAS', 'CAS')}
              </Link>
              <span>/</span>
              <Link href={`/${lang}/cas/${brand.slug}`} className="hover:text-white transition-colors">
                {brand.name}
              </Link>
              <span>/</span>
              <span className="font-semibold">{model.name}</span>
            </nav>

            {brand.logo_url && (
              <div className="mb-6 flex justify-center">
                <img
                  src={brand.logo_url}
                  alt={brand.name}
                  className="h-16 object-contain"
                />
              </div>
            )}

            <h1 className="text-5xl sm:text-6xl font-black text-white mb-4 tracking-tight drop-shadow-lg dark:drop-shadow-2xl">
              <span className="bg-gradient-to-r from-white via-blue-50 to-white dark:from-white dark:via-blue-100 dark:to-white bg-clip-text text-transparent">
                {brand.name} {model.name}
              </span>
            </h1>

            <p className="text-xl text-blue-50 dark:text-blue-100 mb-4 max-w-2xl mx-auto leading-relaxed drop-shadow-md">
              {t('Select Your Generation', 'Wählen Sie Ihre Generation')}
            </p>

            {model.description && (
              <p className="text-lg text-blue-50 dark:text-blue-100/90 max-w-2xl mx-auto">
                {model.description}
              </p>
            )}
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Quick Navigation */}
        <div className="mb-8 flex flex-wrap gap-4 justify-center">
          <Link
            href={`/${lang}/cas`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-800/80 dark:backdrop-blur-sm rounded-lg text-sm font-semibold text-slate-700 dark:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-700/80 hover:text-blue-600 dark:hover:text-blue-400 transition-all border border-slate-200 dark:border-zinc-700/50 dark:shadow-lg"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            {t('All Brands', 'Alle Marken')}
          </Link>
          <Link
            href={`/${lang}/cas/${brand.slug}`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-800/80 dark:backdrop-blur-sm rounded-lg text-sm font-semibold text-slate-700 dark:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-700/80 hover:text-blue-600 dark:hover:text-blue-400 transition-all border border-slate-200 dark:border-zinc-700/50 dark:shadow-lg"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            {t('Back to', 'Zurück zu')} {brand.name}
          </Link>
        </div>

        {/* Search Bar */}
        {generations.length > 3 && (
          <div className="mb-12">
            <div className="relative max-w-2xl mx-auto">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-transparent to-blue-500/5 dark:from-blue-500/10 dark:via-transparent dark:to-blue-500/10 rounded-xl blur-xl"></div>
              <input
                type="text"
                placeholder={t('Search generations...', 'Generationen suchen...')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="relative w-full px-6 py-4 text-lg border-2 border-slate-300 dark:border-zinc-700/50 rounded-xl bg-white dark:bg-zinc-800/80 dark:backdrop-blur-sm text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 focus:border-transparent transition-all shadow-sm dark:shadow-xl"
              />
              <svg
                className="absolute right-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-slate-400 dark:text-zinc-500 z-10"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        )}

        {/* Featured Generations */}
        {featuredGenerations.length > 0 && (
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-zinc-100 mb-8">
              {t('Popular Generations', 'Beliebte Generationen')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredGenerations.map((generation, index) => (
                <motion.div
                  key={generation.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                >
                  <Link
                    href={`/${lang}/cas/${brand.slug}/${model.slug}/${generation.slug}`}
                    className="group block h-full"
                  >
                    <div className="group relative bg-white dark:bg-zinc-800/90 dark:backdrop-blur-sm rounded-2xl overflow-hidden shadow-lg dark:shadow-2xl hover:shadow-2xl dark:hover:shadow-blue-900/20 transition-all duration-300 border border-slate-200 dark:border-zinc-700/50 hover:border-blue-500 dark:hover:border-blue-500/50 h-full flex flex-col">
                      <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-blue-500/10 to-transparent rounded-full blur-2xl group-hover:from-blue-500/20 dark:group-hover:from-blue-500/30 transition-opacity z-0"></div>
                      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-slate-50/50 dark:to-zinc-900/50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      
                      {generation.image_url ? (
                        <div className="relative h-48 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-zinc-800 dark:to-zinc-700 overflow-hidden">
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-black/5 to-transparent dark:from-black/40 dark:via-black/10 dark:to-transparent z-10"></div>
                          <img
                            src={generation.image_url}
                            alt={generation.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                        </div>
                      ) : (
                        <div className="h-48 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-950/40 dark:to-blue-900/30 flex items-center justify-center relative overflow-hidden border-b border-blue-200/50 dark:border-blue-900/30">
                          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent dark:from-blue-500/20 dark:to-transparent"></div>
                          <span className="text-6xl font-black text-blue-600 dark:text-blue-400/90 relative z-10 group-hover:scale-110 transition-transform duration-300 drop-shadow-lg">
                            {generation.generation_code || generation.name.charAt(0)}
                          </span>
                        </div>
                      )}

                      <div className="p-6 flex-grow flex flex-col relative z-10">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="text-2xl font-bold text-slate-900 dark:text-zinc-100 group-hover:text-red-600 dark:group-hover:text-red-400/90 transition-colors">
                            {generation.name}
                          </h3>
                          <span className="ml-2 px-2 py-1 bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400/90 text-xs font-bold rounded-lg border border-red-200/50 dark:border-red-900/30">
                            {t('Featured', 'Empfohlen')}
                          </span>
                        </div>

                        {(generation.year_start || generation.year_end) && (
                          <div className="flex items-center gap-1.5 mb-3">
                            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <p className="text-sm text-slate-500 dark:text-zinc-400 font-medium">
                              {generation.year_start} - {generation.year_end || t('Present', 'Heute')}
                            </p>
                          </div>
                        )}

                        {generation.description && (
                          <p className="text-sm text-slate-600 dark:text-zinc-300 line-clamp-3 flex-grow mb-4 leading-relaxed">
                            {generation.description}
                          </p>
                        )}

                        <div className="mt-auto flex items-center text-blue-600 dark:text-blue-400 font-semibold text-sm group-hover:translate-x-1 transition-transform">
                          {t('View Faults & Manuals', 'Fehler & Anleitungen ansehen')}
                          <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* All Generations */}
        <div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-zinc-100 mb-8">
            {t('All Generations', 'Alle Generationen')}
          </h2>
          {regularGenerations.length === 0 && filteredGenerations.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-lg text-slate-500 dark:text-zinc-400">
                {t('No generations found.', 'Keine Generationen gefunden.')}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {regularGenerations.map((generation, index) => (
                <motion.div
                  key={generation.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: (featuredGenerations.length + index) * 0.05 }}
                >
                  <Link
                    href={`/${lang}/cas/${brand.slug}/${model.slug}/${generation.slug}`}
                    className="group block h-full"
                  >
                    <div className="bg-white dark:bg-zinc-800/90 dark:backdrop-blur-sm rounded-2xl overflow-hidden shadow-md dark:shadow-xl hover:shadow-xl dark:hover:shadow-blue-900/10 transition-all duration-300 border border-slate-200 dark:border-zinc-700/50 hover:border-blue-500 dark:hover:border-blue-500/50 h-full flex flex-col">
                      {generation.image_url ? (
                        <div className="relative h-40 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-zinc-800 dark:to-zinc-700 overflow-hidden">
                          <img
                            src={generation.image_url}
                            alt={generation.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      ) : (
                        <div className="h-40 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-zinc-800 dark:to-zinc-700 flex items-center justify-center border-b border-slate-200/50 dark:border-zinc-700/50">
                          <span className="text-4xl font-black text-slate-600 dark:text-zinc-300">
                            {generation.generation_code || generation.name.charAt(0)}
                          </span>
                        </div>
                      )}

                      <div className="p-5 flex-grow flex flex-col">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-zinc-100 mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400/90 transition-colors">
                          {generation.name}
                        </h3>

                        {(generation.year_start || generation.year_end) && (
                          <p className="text-xs text-slate-500 dark:text-zinc-400 mb-3">
                            {generation.year_start} - {generation.year_end || t('Present', 'Heute')}
                          </p>
                        )}

                        <div className="mt-auto flex items-center text-blue-600 dark:text-blue-400 font-semibold text-sm group-hover:translate-x-1 transition-transform">
                          {t('View Details', 'Details ansehen')}
                          <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

