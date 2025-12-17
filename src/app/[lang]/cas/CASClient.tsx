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
  is_featured: boolean;
  display_order: number;
};

type CASClientProps = {
  brands: CarBrand[];
  lang: string;
};

export default function CASClient({ brands, lang }: CASClientProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const t = (en: string, de: string) => lang === 'de' ? de : en;

  // Filter brands based on search
  const filteredBrands = brands.filter(brand =>
    brand.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    brand.country?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Separate featured and regular brands
  const featuredBrands = filteredBrands.filter(b => b.is_featured);
  const regularBrands = filteredBrands.filter(b => !b.is_featured);

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
            <h1 className="text-5xl sm:text-6xl font-black text-white mb-4 tracking-tight drop-shadow-lg dark:drop-shadow-2xl">
              <span className="bg-gradient-to-r from-white via-blue-50 to-white dark:from-white dark:via-blue-100 dark:to-white bg-clip-text text-transparent">
                CAS
              </span>
            </h1>
            <p className="text-xl sm:text-2xl text-blue-50 dark:text-blue-100 mb-8 font-semibold drop-shadow-md">
              {t('Car Assistance System', 'Auto-Assistenz-System')}
            </p>
            <p className="text-lg text-blue-50 dark:text-blue-100/90 max-w-2xl mx-auto leading-relaxed drop-shadow-sm">
              {t(
                'Find fixing manuals and fault solutions for all car brands and models. Comprehensive car maintenance and repair guides.',
                'Finden Sie Reparaturanleitungen und Fehlerlösungen für alle Automarken und Modelle. Umfassende Auto-Wartungs- und Reparaturanleitungen.'
              )}
            </p>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Quick Navigation */}
        <div className="mb-8 flex flex-wrap gap-4 justify-center">
          <Link
            href={`/${lang}/chat`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-800/80 dark:backdrop-blur-sm rounded-lg text-sm font-semibold text-slate-700 dark:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-700/80 hover:text-blue-600 dark:hover:text-blue-400 transition-all border border-slate-200 dark:border-zinc-700/50 dark:shadow-lg"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            {t('Ask Question', 'Frage stellen')}
          </Link>
          <Link
            href={`/${lang}/knowledge`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-800/80 dark:backdrop-blur-sm rounded-lg text-sm font-semibold text-slate-700 dark:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-700/80 hover:text-blue-600 dark:hover:text-blue-400 transition-all border border-slate-200 dark:border-zinc-700/50 dark:shadow-lg"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            {t('Knowledge Base', 'Wissensbasis')}
          </Link>
          <Link
            href={`/${lang}/news`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-800/80 dark:backdrop-blur-sm rounded-lg text-sm font-semibold text-slate-700 dark:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-700/80 hover:text-blue-600 dark:hover:text-blue-400 transition-all border border-slate-200 dark:border-zinc-700/50 dark:shadow-lg"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
            {t('News', 'News')}
          </Link>
        </div>
        {/* Search Bar */}
        <div className="mb-12">
          <div className="relative max-w-2xl mx-auto">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-transparent to-blue-500/5 dark:from-blue-500/10 dark:via-transparent dark:to-blue-500/10 rounded-xl blur-xl"></div>
            <input
              type="text"
              placeholder={t('Search car brands...', 'Automarken suchen...')}
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

        {/* Featured Brands */}
        {featuredBrands.length > 0 && (
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-zinc-100 mb-8">
              {t('Featured Brands', 'Empfohlene Marken')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {featuredBrands.map((brand, index) => (
                <motion.div
                  key={brand.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                >
                  <Link
                    href={`/${lang}/cas/${brand.slug}`}
                    className="group block h-full"
                  >
                    <div className="group relative bg-white dark:bg-zinc-800/90 dark:backdrop-blur-sm rounded-2xl p-6 shadow-lg dark:shadow-2xl hover:shadow-2xl dark:hover:shadow-blue-900/20 transition-all duration-300 border border-slate-200 dark:border-zinc-700/50 hover:border-blue-500 dark:hover:border-blue-500/50 h-full flex flex-col overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/5 to-transparent rounded-full blur-2xl group-hover:from-blue-500/10 dark:group-hover:from-blue-500/20 transition-opacity"></div>
                      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-slate-50/50 dark:to-zinc-900/50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      {brand.logo_url ? (
                        <div className="mb-4 h-24 flex items-center justify-center relative z-10">
                          <img
                            src={brand.logo_url}
                            alt={brand.name}
                            className="max-h-20 max-w-full object-contain filter group-hover:scale-110 transition-transform duration-300"
                          />
                        </div>
                      ) : (
                        <div className="mb-4 h-24 flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-950/40 dark:to-blue-900/30 rounded-xl relative z-10 group-hover:from-blue-200 group-hover:to-blue-300 dark:group-hover:from-blue-900/50 dark:group-hover:to-blue-800/40 transition-all border border-blue-200/50 dark:border-blue-900/30">
                          <span className="text-4xl font-black text-blue-600 dark:text-blue-400/90">
                            {brand.name.charAt(0)}
                          </span>
                        </div>
                      )}
                      <h3 className="text-xl font-bold text-slate-900 dark:text-zinc-100 mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors relative z-10">
                        {brand.name}
                      </h3>
                      {brand.country && (
                        <div className="flex items-center gap-1.5 mb-2 relative z-10">
                          <svg className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <p className="text-sm text-slate-500 dark:text-zinc-400 font-medium">
                            {brand.country}
                          </p>
                        </div>
                      )}
                      {brand.description && (
                        <p className="text-sm text-slate-600 dark:text-zinc-300 line-clamp-3 flex-grow leading-relaxed relative z-10">
                          {brand.description}
                        </p>
                      )}
                      <div className="mt-4 flex items-center text-blue-600 dark:text-blue-400/90 font-semibold text-sm group-hover:translate-x-1 transition-transform relative z-10">
                        {t('View Models', 'Modelle ansehen')}
                        <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* All Brands */}
        <div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-zinc-100 mb-8">
            {t('All Car Brands', 'Alle Automarken')}
          </h2>
          {regularBrands.length === 0 && filteredBrands.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-lg text-slate-500 dark:text-zinc-400">
                {t('No brands found.', 'Keine Marken gefunden.')}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {regularBrands.map((brand, index) => (
                <motion.div
                  key={brand.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: (featuredBrands.length + index) * 0.05 }}
                >
                  <Link
                    href={`/${lang}/cas/${brand.slug}`}
                    className="group block h-full"
                  >
                    <div className="group relative bg-white dark:bg-zinc-800/90 dark:backdrop-blur-sm rounded-2xl p-6 shadow-md dark:shadow-xl hover:shadow-xl dark:hover:shadow-blue-900/10 transition-all duration-300 border border-slate-200 dark:border-zinc-700/50 hover:border-blue-500 dark:hover:border-blue-500/50 h-full flex flex-col overflow-hidden">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-slate-500/5 to-transparent rounded-full blur-xl group-hover:from-blue-500/10 dark:group-hover:from-blue-500/20 transition-opacity"></div>
                      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-slate-50/30 dark:to-zinc-900/30 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      {brand.logo_url ? (
                        <div className="mb-4 h-20 flex items-center justify-center relative z-10">
                          <img
                            src={brand.logo_url}
                            alt={brand.name}
                            className="max-h-16 max-w-full object-contain filter group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      ) : (
                        <div className="mb-4 h-20 flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-zinc-800 dark:to-zinc-700 rounded-xl relative z-10 group-hover:from-blue-100 group-hover:to-blue-200 dark:group-hover:from-blue-950/40 dark:group-hover:to-blue-900/30 transition-all border border-slate-200/50 dark:border-zinc-700/50">
                          <span className="text-3xl font-black text-slate-600 dark:text-zinc-300 group-hover:text-blue-600 dark:group-hover:text-blue-400/90 transition-colors">
                            {brand.name.charAt(0)}
                          </span>
                        </div>
                      )}
                      <h3 className="text-lg font-bold text-slate-900 dark:text-zinc-100 mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400/90 transition-colors relative z-10">
                        {brand.name}
                      </h3>
                      {brand.country && (
                        <div className="flex items-center gap-1.5 mb-2 relative z-10">
                          <svg className="w-3 h-3 text-slate-400 dark:text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium">
                            {brand.country}
                          </p>
                        </div>
                      )}
                      <div className="mt-auto flex items-center text-blue-600 dark:text-blue-400 font-semibold text-sm group-hover:translate-x-1 transition-transform relative z-10">
                        {t('View Models', 'Modelle ansehen')}
                        <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
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

