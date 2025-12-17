'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { getBrandLogoUrl } from '@/lib/car-brand-logos';
import SketchfabViewer from '@/components/SketchfabViewer';
import MinimalCarViewer from '@/components/MinimalCarViewer';
import ModelFaultsSection from './ModelFaultsSection';

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
  totalFaultsCount?: number;
  initialFaults?: any[];
};

export default function GenerationListClient({ brand, model, generations, lang, totalFaultsCount = 0, initialFaults = [] }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const t = (en: string, de: string) => lang === 'de' ? de : en;

  // Filter and sort generations based on search
  const filteredGenerations = generations
    .filter(gen =>
      gen.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      gen.generation_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      gen.description?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      // Featured first
      if (a.is_featured && !b.is_featured) return -1;
      if (!a.is_featured && b.is_featured) return 1;
      // Then by display_order
      if (a.display_order !== b.display_order) {
        return a.display_order - b.display_order;
      }
      // Then by year_start (newest first)
      if (a.year_start && b.year_start) {
        return b.year_start - a.year_start;
      }
      if (a.year_start) return -1;
      if (b.year_start) return 1;
      // Finally alphabetically
      return a.name.localeCompare(b.name);
    });

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

            {(() => {
              const logoUrl = getBrandLogoUrl(brand.slug, brand.name, brand.logo_url);
              return logoUrl ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, y: -20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2, type: "spring", stiffness: 100 }}
                  className="mb-10 flex justify-center"
                >
                  <div className="relative group">
                    {/* Animated glow effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-white/30 via-white/20 to-white/30 rounded-3xl blur-3xl -z-10 animate-pulse"></div>
                    <div className="absolute inset-0 bg-white/10 rounded-3xl blur-2xl -z-10 group-hover:bg-white/20 transition-all duration-500"></div>
                    
                    {/* Logo container with enhanced styling */}
                    <div className="relative bg-gradient-to-br from-white/15 via-white/10 to-white/5 dark:from-white/10 dark:via-white/5 dark:to-white/0 backdrop-blur-xl rounded-3xl p-5 sm:p-7 md:p-9 border-2 border-white/30 dark:border-white/20 shadow-2xl group-hover:border-white/40 dark:group-hover:border-white/30 transition-all duration-500 group-hover:shadow-[0_0_40px_rgba(255,255,255,0.3)]">
                      {/* Inner glow ring */}
                      <div className="absolute inset-2 rounded-2xl border border-white/10 dark:border-white/5"></div>
                      
                      <img
                        src={logoUrl}
                        alt={`${brand.name} logo`}
                        className="relative h-24 sm:h-28 md:h-32 object-contain filter drop-shadow-[0_0_30px_rgba(0,0,0,0.5)] group-hover:scale-105 transition-transform duration-500"
                        loading="eager"
                        decoding="async"
                        fetchPriority="high"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                    </div>
                  </div>
                </motion.div>
              ) : null;
            })()}

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
              {totalFaultsCount > 0 && (
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span className="font-semibold text-white">{totalFaultsCount.toLocaleString()}</span>
                  <span>{t('Fault Solutions', 'Fehlerlösungen')}</span>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {/* 3D Model Viewer - For C-Class - Modern & Minimalistic */}
        {brand.slug.toLowerCase() === 'mercedes-benz' && model.slug.toLowerCase() === 'c-class' && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mb-16"
          >
            <div className="text-center mb-8">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">
                {t('3D Model Viewer', '3D Modell-Viewer')}
              </h2>
              <p className="text-slate-600 dark:text-slate-400 text-lg sm:text-xl max-w-2xl mx-auto">
                {t('Explore the Mercedes-Benz C-Class in stunning 3D detail', 'Erkunden Sie die Mercedes-Benz C-Klasse in beeindruckenden 3D-Details')}
              </p>
            </div>
            <div className="max-w-6xl mx-auto">
              <div className="relative group">
                {/* Subtle glow effect on hover */}
                <div className="absolute -inset-1 bg-gradient-to-r from-red-500/20 via-transparent to-red-500/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <MinimalCarViewer 
                  modelPath="/models/minimal_c_class.obj"
                  className="w-full relative z-10"
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* Statistics Bar - Enhanced */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-red-50 via-red-100 to-red-50 dark:from-red-950/40 dark:via-red-900/30 dark:to-red-950/40 rounded-2xl p-5 sm:p-6 border-2 border-red-200 dark:border-red-900/30 shadow-lg hover:shadow-xl transition-shadow text-center"
          >
            <div className="text-4xl sm:text-5xl font-black text-red-600 dark:text-red-400 mb-2">{generations.length.toLocaleString()}</div>
            <div className="text-sm font-bold text-red-700 dark:text-red-300 uppercase tracking-wide">{t('Generations', 'Generationen')}</div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-gradient-to-br from-orange-50 via-orange-100 to-orange-50 dark:from-orange-950/40 dark:via-orange-900/30 dark:to-orange-950/40 rounded-2xl p-5 sm:p-6 border-2 border-orange-200 dark:border-orange-900/30 shadow-lg hover:shadow-xl transition-shadow text-center"
          >
            <div className="text-4xl sm:text-5xl font-black text-orange-600 dark:text-orange-400 mb-2">{totalFaultsCount.toLocaleString()}</div>
            <div className="text-sm font-bold text-orange-700 dark:text-orange-300 uppercase tracking-wide">{t('Fault Solutions', 'Fehlerlösungen')}</div>
            <div className="text-xs text-orange-600/70 dark:text-orange-400/70 mt-1">{t('All Generations', 'Alle Generationen')}</div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-blue-50 via-blue-100 to-blue-50 dark:from-blue-950/40 dark:via-blue-900/30 dark:to-blue-950/40 rounded-2xl p-5 sm:p-6 border-2 border-blue-200 dark:border-blue-900/30 shadow-lg hover:shadow-xl transition-shadow text-center"
          >
            <div className="text-4xl sm:text-5xl font-black text-blue-600 dark:text-blue-400 mb-2">{model.production_numbers || '—'}</div>
            <div className="text-sm font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wide">{t('Total Produced', 'Gesamt produziert')}</div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-green-50 via-green-100 to-green-50 dark:from-green-950/40 dark:via-green-900/30 dark:to-green-950/40 rounded-2xl p-5 sm:p-6 border-2 border-green-200 dark:border-green-900/30 shadow-lg hover:shadow-xl transition-shadow text-center"
          >
            <div className="text-4xl sm:text-5xl font-black text-green-600 dark:text-green-400 mb-2">
              {generations.filter(g => g.year_start && g.year_start >= 2010).length}
            </div>
            <div className="text-sm font-bold text-green-700 dark:text-green-300 uppercase tracking-wide">{t('Modern (2010+)', 'Modern (2010+)')}</div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gradient-to-br from-purple-50 via-purple-100 to-purple-50 dark:from-purple-950/40 dark:via-purple-900/30 dark:to-purple-950/40 rounded-2xl p-5 sm:p-6 border-2 border-purple-200 dark:border-purple-900/30 shadow-lg hover:shadow-xl transition-shadow text-center"
          >
            <div className="text-4xl sm:text-5xl font-black text-purple-600 dark:text-purple-400 mb-2">
              {generations.filter(g => !g.year_end).length}
            </div>
            <div className="text-sm font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wide">{t('Current Production', 'Aktuelle Produktion')}</div>
          </motion.div>
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
                {t('Featured Generations', 'Empfohlene Generationen')}
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

                      <div className="p-6 sm:p-7 flex-grow flex flex-col relative z-10 bg-gradient-to-b from-transparent to-white/50 dark:to-slate-900/50">
                        <div className="flex items-start justify-between mb-3">
                          <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400/90 transition-colors leading-tight pr-2">
                            {generation.name}
                          </h3>
                          {generation.is_featured && (
                            <span className="ml-2 px-3 py-1 bg-red-600 dark:bg-red-500 text-white text-xs font-black rounded-full shadow-lg border-2 border-white/50 flex-shrink-0">
                              {t('Featured', 'Empfohlen')}
                            </span>
                          )}
                        </div>

                        {(generation.year_start || generation.year_end) && (
                          <div className="flex items-center gap-2 mb-4">
                            <svg className="w-4 h-4 text-slate-400 dark:text-slate-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <p className="text-sm text-slate-600 dark:text-slate-400 font-semibold">
                              {generation.year_start} - {generation.year_end || t('Present', 'Heute')}
                            </p>
                            {generation.year_start && generation.year_end && (
                              <span className="ml-auto px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold rounded-full">
                                {generation.year_end - generation.year_start + 1} {t('years', 'Jahre')}
                              </span>
                            )}
                          </div>
                        )}

                        {generation.generation_code && (
                          <div className="mb-4">
                            <span className="inline-flex items-center px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-mono font-bold rounded-lg border-2 border-slate-200 dark:border-slate-700">
                              {generation.generation_code}
                            </span>
                          </div>
                        )}

                        {generation.description && (
                          <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-3 flex-grow mb-5 leading-relaxed">
                            {generation.description}
                          </p>
                        )}

                        {/* Generation Info Badge */}
                        <div className="mb-4 flex items-center gap-2 flex-wrap">
                          {generation.generation_code && (
                            <span className="inline-flex items-center px-3 py-1.5 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 text-slate-700 dark:text-slate-300 text-xs font-mono font-black rounded-lg border-2 border-slate-300 dark:border-slate-600 shadow-sm">
                              {generation.generation_code}
                            </span>
                          )}
                          {(generation.year_start || generation.year_end) && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              {generation.year_start || '?'}
                              {generation.year_end && generation.year_start !== generation.year_end && `-${generation.year_end}`}
                            </span>
                          )}
                        </div>

                        <div className="mt-auto pt-4 border-t border-slate-200 dark:border-slate-700">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center text-red-600 dark:text-red-400/90 font-bold text-sm group-hover:translate-x-1 transition-transform">
                              {t('View Details', 'Details ansehen')}
                              <svg className="w-4 h-4 ml-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                              </svg>
                            </div>
                            {generation.is_featured && (
                              <span className="px-2 py-0.5 bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-400 text-xs font-bold rounded-full">
                                {t('Featured', 'Empfohlen')}
                              </span>
                            )}
                          </div>
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
            <div className="text-center py-16 sm:py-24">
              <div className="max-w-md mx-auto">
                <svg className="w-24 h-24 mx-auto text-slate-300 dark:text-slate-700 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
                  {t('No generations found', 'Keine Generationen gefunden')}
                </h3>
                <p className="text-slate-600 dark:text-slate-400 mb-6">
                  {t(
                    'Try adjusting your search to find what you\'re looking for.',
                    'Versuchen Sie, Ihre Suche anzupassen, um zu finden, wonach Sie suchen.'
                  )}
                </p>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    {t('Clear Search', 'Suche zurücksetzen')}
                  </button>
                )}
              </div>
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

                      <div className="p-5 flex-grow flex flex-col bg-gradient-to-b from-transparent to-white/30 dark:to-slate-900/30">
                        <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mb-3 group-hover:text-red-600 dark:group-hover:text-red-400/90 transition-colors leading-tight">
                          {generation.name}
                        </h3>

                        {(generation.year_start || generation.year_end) && (
                          <div className="flex items-center gap-1.5 mb-3">
                            <svg className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                              {generation.year_start} - {generation.year_end || t('Present', 'Heute')}
                            </p>
                          </div>
                        )}

                        {/* Generation Info Badge */}
                        <div className="mb-3 flex items-center gap-2 flex-wrap">
                          {generation.generation_code && (
                            <span className="inline-flex items-center px-2.5 py-1 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 text-slate-700 dark:text-slate-300 text-xs font-mono font-black rounded-lg border border-slate-300 dark:border-slate-600">
                              {generation.generation_code}
                            </span>
                          )}
                          {(generation.year_start || generation.year_end) && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-semibold rounded-lg">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              {generation.year_start || '?'}
                              {generation.year_end && generation.year_start !== generation.year_end && `-${generation.year_end}`}
                            </span>
                          )}
                        </div>

                        <div className="mt-auto pt-3 border-t border-slate-200 dark:border-slate-700">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center text-red-600 dark:text-red-400/90 font-bold text-sm group-hover:translate-x-1 transition-transform">
                              {t('View Details', 'Details ansehen')}
                              <svg className="w-4 h-4 ml-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Faults Section */}
        {totalFaultsCount > 0 && (
          <div className="mt-16">
            <ModelFaultsSection
              brandSlug={brand.slug}
              modelSlug={model.slug}
              modelName={model.name}
              lang={lang}
              generations={generations.map(g => ({
                id: g.id,
                name: g.name,
                slug: g.slug,
                generation_code: g.generation_code
              }))}
              initialFaults={initialFaults}
              totalCount={totalFaultsCount}
            />
          </div>
        )}
      </div>
    </div>
  );
}

