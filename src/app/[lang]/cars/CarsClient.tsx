'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

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

type CarsClientProps = {
  brands: CarBrand[];
  lang: string;
};

export default function CarsClient({ brands, lang }: CarsClientProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();
  const t = (en: string, de: string) => lang === 'de' ? de : en;

  // Filter brands based on search
  const filteredBrands = brands.filter(brand =>
    brand.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    brand.country?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Separate featured and regular brands
  const featuredBrands = filteredBrands.filter(b => b.is_featured);
  const regularBrands = filteredBrands.filter(b => !b.is_featured);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/${lang}/cars?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      {/* Hero Section - Premium Design */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-black dark:via-slate-950 dark:to-black">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.02%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%221%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-40"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto"
          >
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white mb-6 tracking-tight">
              {t('Car Maintenance & Repair', 'Auto-Wartung & Reparatur')}
            </h1>
            <p className="text-xl sm:text-2xl text-slate-300 dark:text-slate-400 mb-8 leading-relaxed">
              {t(
                'Find step-by-step guides, fault solutions, and maintenance manuals for your exact car model and generation.',
                'Finden Sie Schritt-für-Schritt-Anleitungen, Fehlerlösungen und Wartungshandbücher für Ihr genaues Automodell und Generation.'
              )}
            </p>

            {/* Premium Search Bar */}
            <form onSubmit={handleSearch} className="max-w-3xl mx-auto mb-12">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 via-orange-500/20 to-red-500/20 rounded-2xl blur-2xl"></div>
                <div className="relative flex items-center bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                  <input
                    type="text"
                    placeholder={t('Search by brand, model, or fault...', 'Nach Marke, Modell oder Fehler suchen...')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 px-6 py-5 text-lg bg-transparent text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="px-8 py-5 bg-gradient-to-r from-red-600 to-red-700 text-white font-bold hover:from-red-700 hover:to-red-800 transition-all flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    {t('Search', 'Suchen')}
                  </button>
                </div>
              </div>
            </form>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-6 max-w-2xl mx-auto text-center">
              <div>
                <div className="text-3xl font-black text-white mb-1">{brands.length}+</div>
                <div className="text-sm text-slate-400">{t('Car Brands', 'Automarken')}</div>
              </div>
              <div>
                <div className="text-3xl font-black text-white mb-1">{t('1000+', '1000+')}</div>
                <div className="text-sm text-slate-400">{t('Solutions', 'Lösungen')}</div>
              </div>
              <div>
                <div className="text-3xl font-black text-white mb-1">{t('500+', '500+')}</div>
                <div className="text-sm text-slate-400">{t('Manuals', 'Anleitungen')}</div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Featured Brands */}
        {featuredBrands.length > 0 && (
          <div className="mb-16">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-black text-slate-900 dark:text-white">
                {t('Popular Brands', 'Beliebte Marken')}
              </h2>
              <Link
                href={`/${lang}/cars#all-brands`}
                className="text-red-600 dark:text-red-400 font-semibold hover:underline flex items-center gap-1"
              >
                {t('View All', 'Alle anzeigen')}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {featuredBrands.map((brand, index) => (
                <motion.div
                  key={brand.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                >
                  <Link
                    href={`/${lang}/cars/${brand.slug}`}
                    className="group block h-full"
                  >
                    <div className="group relative bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-lg dark:shadow-2xl hover:shadow-2xl dark:hover:shadow-red-900/20 transition-all duration-300 border border-slate-200 dark:border-slate-800 hover:border-red-500 dark:hover:border-red-500/50 h-full flex flex-col overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-red-500/5 to-transparent rounded-full blur-2xl group-hover:from-red-500/10 dark:group-hover:from-red-500/20 transition-opacity"></div>
                      
                      {brand.logo_url ? (
                        <div className="mb-4 h-24 flex items-center justify-center relative z-10">
                          <img
                            src={brand.logo_url}
                            alt={brand.name}
                            className="max-h-20 max-w-full object-contain filter group-hover:scale-110 transition-transform duration-300"
                          />
                        </div>
                      ) : (
                        <div className="mb-4 h-24 flex items-center justify-center bg-gradient-to-br from-red-100 to-red-200 dark:from-red-950/40 dark:to-red-900/30 rounded-xl relative z-10 group-hover:from-red-200 group-hover:to-red-300 dark:group-hover:from-red-900/50 dark:group-hover:to-red-800/40 transition-all border border-red-200/50 dark:border-red-900/30">
                          <span className="text-4xl font-black text-red-600 dark:text-red-400/90">
                            {brand.name.charAt(0)}
                          </span>
                        </div>
                      )}
                      
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors relative z-10">
                        {brand.name}
                      </h3>
                      
                      {brand.country && (
                        <div className="flex items-center gap-1.5 mb-3 relative z-10">
                          <svg className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                            {brand.country}
                          </p>
                        </div>
                      )}
                      
                      {brand.description && (
                        <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-3 flex-grow leading-relaxed relative z-10">
                          {brand.description}
                        </p>
                      )}
                      
                      <div className="mt-4 flex items-center text-red-600 dark:text-red-400/90 font-semibold text-sm group-hover:translate-x-1 transition-transform relative z-10">
                        {t('Browse Models', 'Modelle durchsuchen')}
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
        <div id="all-brands">
          <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-8">
            {t('All Car Brands', 'Alle Automarken')}
          </h2>
          {regularBrands.length === 0 && filteredBrands.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-lg text-slate-500 dark:text-slate-400">
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
                    href={`/${lang}/cars/${brand.slug}`}
                    className="group block h-full"
                  >
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-md dark:shadow-xl hover:shadow-xl dark:hover:shadow-red-900/10 transition-all duration-300 border border-slate-200 dark:border-slate-800 hover:border-red-500 dark:hover:border-red-500/50 h-full flex flex-col overflow-hidden">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-slate-500/5 to-transparent rounded-full blur-xl group-hover:from-red-500/10 dark:group-hover:from-red-500/20 transition-opacity"></div>
                      
                      {brand.logo_url ? (
                        <div className="mb-4 h-20 flex items-center justify-center relative z-10">
                          <img
                            src={brand.logo_url}
                            alt={brand.name}
                            className="max-h-16 max-w-full object-contain filter group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      ) : (
                        <div className="mb-4 h-20 flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 rounded-xl relative z-10 group-hover:from-red-100 group-hover:to-red-200 dark:group-hover:from-red-950/40 dark:group-hover:to-red-900/30 transition-all border border-slate-200/50 dark:border-slate-700/50">
                          <span className="text-3xl font-black text-slate-600 dark:text-slate-300 group-hover:text-red-600 dark:group-hover:text-red-400/90 transition-colors">
                            {brand.name.charAt(0)}
                          </span>
                        </div>
                      )}
                      
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 group-hover:text-red-600 dark:group-hover:text-red-400/90 transition-colors relative z-10">
                        {brand.name}
                      </h3>
                      
                      {brand.country && (
                        <div className="flex items-center gap-1.5 mb-2 relative z-10">
                          <svg className="w-3 h-3 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                            {brand.country}
                          </p>
                        </div>
                      )}
                      
                      <div className="mt-auto flex items-center text-red-600 dark:text-red-400 font-semibold text-sm group-hover:translate-x-1 transition-transform relative z-10">
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

