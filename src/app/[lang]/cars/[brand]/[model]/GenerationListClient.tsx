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
  production_numbers?: string;
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
    <div className="min-h-screen bg-white dark:bg-black">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-black dark:via-slate-950 dark:to-black">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.02%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%221%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-40"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            {/* Breadcrumb */}
            <nav className="mb-6 flex items-center justify-center space-x-2 text-sm text-slate-400">
              <Link href={`/${lang}`} className="hover:text-white transition-colors">
                {t('Home', 'Startseite')}
              </Link>
              <span>/</span>
              <Link href={`/${lang}/cars`} className="hover:text-white transition-colors">
                {t('Cars', 'Autos')}
              </Link>
              <span>/</span>
              <Link href={`/${lang}/cars/${brand.slug}`} className="hover:text-white transition-colors">
                {brand.name}
              </Link>
              <span>/</span>
              <span className="text-white font-semibold">{model.name}</span>
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

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white mb-6 tracking-tight">
              {brand.name} {model.name}
            </h1>

            <p className="text-xl sm:text-2xl text-slate-300 dark:text-slate-400 mb-4 max-w-3xl mx-auto leading-relaxed">
              {t('Select Your Generation', 'Wählen Sie Ihre Generation')}
            </p>

            {model.description && (
              <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-4">
                {model.description}
              </p>
            )}

            {/* Model Stats */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-400">
              {model.production_numbers && (
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <span className="font-semibold text-white">{model.production_numbers}</span>
                  <span>{t('produced', 'produziert')}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <span className="font-semibold text-white">{generations.length}</span>
                <span>{t('generations', 'Generationen')}</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Statistics Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/40 dark:to-red-900/30 rounded-xl p-4 border border-red-200 dark:border-red-900/30 text-center">
            <div className="text-3xl font-black text-red-600 dark:text-red-400 mb-1">{generations.length}</div>
            <div className="text-xs font-semibold text-red-700 dark:text-red-300">{t('Generations', 'Generationen')}</div>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/40 dark:to-blue-900/30 rounded-xl p-4 border border-blue-200 dark:border-blue-900/30 text-center">
            <div className="text-3xl font-black text-blue-600 dark:text-blue-400 mb-1">{model.production_numbers || '—'}</div>
            <div className="text-xs font-semibold text-blue-700 dark:text-blue-300">{t('Total Produced', 'Gesamt produziert')}</div>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/40 dark:to-green-900/30 rounded-xl p-4 border border-green-200 dark:border-green-900/30 text-center">
            <div className="text-3xl font-black text-green-600 dark:text-green-400 mb-1">
              {generations.filter(g => g.year_start && g.year_start >= 2010).length}
            </div>
            <div className="text-xs font-semibold text-green-700 dark:text-green-300">{t('Modern (2010+)', 'Modern (2010+)')}</div>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/40 dark:to-purple-900/30 rounded-xl p-4 border border-purple-200 dark:border-purple-900/30 text-center">
            <div className="text-3xl font-black text-purple-600 dark:text-purple-400 mb-1">
              {generations.filter(g => !g.year_end).length}
            </div>
            <div className="text-xs font-semibold text-purple-700 dark:text-purple-300">{t('Current Production', 'Aktuelle Produktion')}</div>
          </div>
        </div>
        {/* Search Bar */}
        {generations.length > 3 && (
          <div className="mb-12">
            <div className="relative max-w-2xl mx-auto">
              <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 via-transparent to-red-500/10 rounded-xl blur-xl"></div>
              <input
                type="text"
                placeholder={t('Search generations...', 'Generationen suchen...')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="relative w-full px-6 py-4 text-lg border-2 border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 dark:focus:ring-red-600 focus:border-transparent transition-all shadow-lg"
              />
              <svg
                className="absolute right-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-slate-400 dark:text-slate-500 z-10"
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
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-black text-slate-900 dark:text-white">
                {t('Popular Generations', 'Beliebte Generationen')}
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredGenerations.map((generation, index) => (
                <motion.div
                  key={generation.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                >
                  <Link
                    href={`/${lang}/cars/${brand.slug}/${model.slug}/${generation.slug}`}
                    className="group block h-full"
                  >
                    <div className="group relative bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-lg dark:shadow-2xl hover:shadow-2xl dark:hover:shadow-red-900/20 transition-all duration-300 border border-slate-200 dark:border-slate-800 hover:border-red-500 dark:hover:border-red-500/50 h-full flex flex-col">
                      <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-red-500/10 to-transparent rounded-full blur-2xl group-hover:from-red-500/20 dark:group-hover:from-red-500/30 transition-opacity z-0"></div>
                      
                      {generation.image_url ? (
                        <div className="relative h-48 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 overflow-hidden">
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-black/5 to-transparent dark:from-black/40 dark:via-black/10 dark:to-transparent z-10"></div>
                          <img
                            src={generation.image_url}
                            alt={generation.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                        </div>
                      ) : (
                        <div className="h-48 bg-gradient-to-br from-red-100 to-red-200 dark:from-red-950/40 dark:to-red-900/30 flex items-center justify-center relative overflow-hidden border-b border-red-200/50 dark:border-red-900/30">
                          <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-transparent dark:from-red-500/20 dark:to-transparent"></div>
                          <span className="text-6xl font-black text-red-600 dark:text-red-400/90 relative z-10 group-hover:scale-110 transition-transform duration-300 drop-shadow-lg">
                            {generation.generation_code || generation.name.charAt(0)}
                          </span>
                        </div>
                      )}

                      <div className="p-6 flex-grow flex flex-col relative z-10">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="text-2xl font-bold text-slate-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400/90 transition-colors">
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
                            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                              {generation.year_start} - {generation.year_end || t('Present', 'Heute')}
                            </p>
                          </div>
                        )}

                        {generation.description && (
                          <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-3 flex-grow mb-4 leading-relaxed">
                            {generation.description}
                          </p>
                        )}

                        {generation.generation_code && (
                          <div className="mb-3">
                            <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-mono rounded border border-slate-200 dark:border-slate-700">
                              {generation.generation_code}
                            </span>
                          </div>
                        )}

                        <div className="mt-auto flex items-center text-red-600 dark:text-red-400 font-semibold text-sm group-hover:translate-x-1 transition-transform">
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
          <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-8">
            {t('All Generations', 'Alle Generationen')}
          </h2>
          {regularGenerations.length === 0 && filteredGenerations.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-lg text-slate-500 dark:text-slate-400">
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
                    href={`/${lang}/cars/${brand.slug}/${model.slug}/${generation.slug}`}
                    className="group block h-full"
                  >
                    <div className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-md dark:shadow-xl hover:shadow-xl dark:hover:shadow-red-900/10 transition-all duration-300 border border-slate-200 dark:border-slate-800 hover:border-red-500 dark:hover:border-red-500/50 h-full flex flex-col">
                      {generation.image_url ? (
                        <div className="relative h-40 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 overflow-hidden">
                          <img
                            src={generation.image_url}
                            alt={generation.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      ) : (
                        <div className="h-40 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center border-b border-slate-200/50 dark:border-slate-700/50">
                          <span className="text-4xl font-black text-slate-600 dark:text-slate-300">
                            {generation.generation_code || generation.name.charAt(0)}
                          </span>
                        </div>
                      )}

                      <div className="p-5 flex-grow flex flex-col">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 group-hover:text-red-600 dark:group-hover:text-red-400/90 transition-colors">
                          {generation.name}
                        </h3>

                        {(generation.year_start || generation.year_end) && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                            {generation.year_start} - {generation.year_end || t('Present', 'Heute')}
                          </p>
                        )}

                        <div className="mt-auto flex items-center text-red-600 dark:text-red-400 font-semibold text-sm group-hover:translate-x-1 transition-transform">
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

