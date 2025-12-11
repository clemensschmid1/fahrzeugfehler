'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { getBrandLogoUrl } from '@/lib/car-brand-logos';
import { getModelImageUrl } from '@/lib/car-model-images';

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

type CarModel = {
  id: string;
  brand_id: string;
  name: string;
  slug: string;
  year_start?: number;
  year_end?: number;
  description?: string;
  image_url?: string;
  sprite_3d_url?: string;
  production_numbers?: string;
  is_featured: boolean;
  display_order: number;
};

type BrandClientProps = {
  brand: CarBrand;
  models: CarModel[];
  lang: string;
  faultsCount?: number;
  manualsCount?: number;
};

export default function BrandClient({ brand, models, lang, faultsCount = 0, manualsCount = 0 }: BrandClientProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const t = (en: string, de: string) => lang === 'de' ? de : en;

  // Filter and sort models based on search
  const filteredModels = models
    .filter(model =>
      model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      model.description?.toLowerCase().includes(searchQuery.toLowerCase())
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

  // Separate featured and regular models
  const featuredModels = filteredModels.filter(m => m.is_featured);
  const regularModels = filteredModels.filter(m => !m.is_featured);

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
              <span className="text-white font-semibold">{brand.name}</span>
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
                    <div className="relative bg-gradient-to-br from-white/15 via-white/10 to-white/5 dark:from-white/10 dark:via-white/5 dark:to-white/0 backdrop-blur-xl rounded-3xl p-6 sm:p-8 md:p-10 border-2 border-white/30 dark:border-white/20 shadow-2xl group-hover:border-white/40 dark:group-hover:border-white/30 transition-all duration-500 group-hover:shadow-[0_0_40px_rgba(255,255,255,0.3)]">
                      {/* Inner glow ring */}
                      <div className="absolute inset-2 rounded-2xl border border-white/10 dark:border-white/5"></div>
                      
                      <img
                        src={logoUrl}
                        alt={`${brand.name} logo`}
                        className="relative h-28 sm:h-36 md:h-44 lg:h-52 object-contain filter drop-shadow-[0_0_30px_rgba(0,0,0,0.5)] group-hover:scale-105 transition-transform duration-500"
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
              {brand.name}
            </h1>
            
            {brand.description && (
              <p className="text-xl sm:text-2xl text-slate-300 dark:text-slate-400 mb-4 max-w-3xl mx-auto leading-relaxed">
                {brand.description}
              </p>
            )}
            
            {brand.country && (
              <p className="text-lg text-slate-400 mb-6">
                {brand.country}
                {brand.founded_year && ` • ${brand.founded_year}`}
              </p>
            )}

            {/* Brand Stats */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-400">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <span className="font-semibold text-white">{models.length}</span>
                <span>{t('Models', 'Modelle')}</span>
              </div>
              {faultsCount > 0 && (
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span className="font-semibold text-white">{faultsCount.toLocaleString()}</span>
                  <span>{t('Fault Solutions', 'Fehlerlösungen')}</span>
                </div>
              )}
              {manualsCount > 0 && (
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  <span className="font-semibold text-white">{manualsCount.toLocaleString()}</span>
                  <span>{t('Manuals', 'Anleitungen')}</span>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Enhanced Statistics Bar */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 sm:gap-6 mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-red-50 via-red-100 to-red-50 dark:from-red-950/40 dark:via-red-900/30 dark:to-red-950/40 rounded-2xl p-5 sm:p-6 border-2 border-red-200 dark:border-red-900/30 shadow-lg hover:shadow-xl transition-all text-center"
          >
            <div className="text-4xl sm:text-5xl font-black text-red-600 dark:text-red-400 mb-2">{models.length.toLocaleString()}</div>
            <div className="text-xs sm:text-sm font-bold text-red-700 dark:text-red-300 uppercase tracking-wide">{t('Car Models', 'Automodelle')}</div>
            <div className="text-xs text-red-600/70 dark:text-red-400/70 mt-1">{t('Total Available', 'Gesamt verfügbar')}</div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-gradient-to-br from-orange-50 via-orange-100 to-orange-50 dark:from-orange-950/40 dark:via-orange-900/30 dark:to-orange-950/40 rounded-2xl p-5 sm:p-6 border-2 border-orange-200 dark:border-orange-900/30 shadow-lg hover:shadow-xl transition-all text-center"
          >
            <div className="text-4xl sm:text-5xl font-black text-orange-600 dark:text-orange-400 mb-2">{faultsCount.toLocaleString()}</div>
            <div className="text-xs sm:text-sm font-bold text-orange-700 dark:text-orange-300 uppercase tracking-wide">{t('Fault Solutions', 'Fehlerlösungen')}</div>
            <div className="text-xs text-orange-600/70 dark:text-orange-400/70 mt-1">{t('Verified', 'Verifiziert')}</div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-blue-50 via-blue-100 to-blue-50 dark:from-blue-950/40 dark:via-blue-900/30 dark:to-blue-950/40 rounded-2xl p-5 sm:p-6 border-2 border-blue-200 dark:border-blue-900/30 shadow-lg hover:shadow-xl transition-all text-center"
          >
            <div className="text-4xl sm:text-5xl font-black text-blue-600 dark:text-blue-400 mb-2">{manualsCount.toLocaleString()}</div>
            <div className="text-xs sm:text-sm font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wide">{t('Manuals', 'Anleitungen')}</div>
            <div className="text-xs text-blue-600/70 dark:text-blue-400/70 mt-1">{t('Step-by-Step', 'Schritt-für-Schritt')}</div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-blue-50 via-blue-100 to-blue-50 dark:from-blue-950/40 dark:via-blue-900/30 dark:to-blue-950/40 rounded-2xl p-5 sm:p-6 border-2 border-blue-200 dark:border-blue-900/30 shadow-lg hover:shadow-xl transition-all text-center"
          >
            <div className="text-4xl sm:text-5xl font-black text-blue-600 dark:text-blue-400 mb-2">{featuredModels.length}</div>
            <div className="text-xs sm:text-sm font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wide">{t('Featured Models', 'Empfohlene Modelle')}</div>
            <div className="text-xs text-blue-600/70 dark:text-blue-400/70 mt-1">{t('Popular', 'Beliebt')}</div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-green-50 via-green-100 to-green-50 dark:from-green-950/40 dark:via-green-900/30 dark:to-green-950/40 rounded-2xl p-5 sm:p-6 border-2 border-green-200 dark:border-green-900/30 shadow-lg hover:shadow-xl transition-all text-center"
          >
            <div className="text-4xl sm:text-5xl font-black text-green-600 dark:text-green-400 mb-2">
              {models.filter(m => m.year_start && m.year_start >= 2010).length}
            </div>
            <div className="text-xs sm:text-sm font-bold text-green-700 dark:text-green-300 uppercase tracking-wide">{t('Modern (2010+)', 'Modern (2010+)')}</div>
            <div className="text-xs text-green-600/70 dark:text-green-400/70 mt-1">{t('Recent', 'Aktuell')}</div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gradient-to-br from-purple-50 via-purple-100 to-purple-50 dark:from-purple-950/40 dark:via-purple-900/30 dark:to-purple-950/40 rounded-2xl p-5 sm:p-6 border-2 border-purple-200 dark:border-purple-900/30 shadow-lg hover:shadow-xl transition-all text-center"
          >
            <div className="text-4xl sm:text-5xl font-black text-purple-600 dark:text-purple-400 mb-2">
              {models.filter(m => !m.year_end).length}
            </div>
            <div className="text-xs sm:text-sm font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wide">{t('Current Production', 'Aktuelle Produktion')}</div>
            <div className="text-xs text-purple-600/70 dark:text-purple-400/70 mt-1">{t('Active', 'Aktiv')}</div>
          </motion.div>
        </div>
        {/* Search Bar */}
        <div className="mb-12">
          <div className="relative max-w-2xl mx-auto">
            <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 via-transparent to-red-500/10 rounded-xl blur-xl"></div>
            <input
              type="text"
              placeholder={t('Search car models...', 'Automodelle suchen...')}
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

        {/* Featured Models */}
        {featuredModels.length > 0 && (
          <div className="mb-16">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-black text-slate-900 dark:text-white">
                {t('Featured Models', 'Empfohlene Modelle')}
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredModels.map((model, index) => (
                <motion.div
                  key={model.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                >
                  <Link
                    href={`/${lang}/cars/${brand.slug}/${model.slug}`}
                    className="group block h-full"
                  >
                    <motion.div 
                      className={`group relative rounded-2xl overflow-hidden shadow-2xl dark:shadow-2xl hover:shadow-[0_20px_60px_rgba(0,0,0,0.3)] dark:hover:shadow-[0_20px_60px_rgba(220,38,38,0.2)] transition-all duration-500 border-2 h-full flex flex-col ${
                        brand.slug === 'bmw' 
                          ? 'bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 dark:from-slate-950 dark:via-black dark:to-slate-950 border-slate-600/50 dark:border-slate-700/50 hover:border-slate-500 dark:hover:border-slate-600' 
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-red-500 dark:hover:border-red-500/50'
                      }`}
                      whileHover={{ y: -8, scale: 1.03 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {/* Metallic shine effect for BMW */}
                      {brand.slug === 'bmw' && (
                        <>
                          <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 z-20"></div>
                          <div className="absolute inset-0 bg-[linear-gradient(135deg,transparent_0%,rgba(255,255,255,0.1)_50%,transparent_100%)] opacity-0 group-hover:opacity-100 transition-opacity duration-700 z-20"></div>
                          <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-slate-700/50 via-slate-800/30 to-transparent z-10"></div>
                        </>
                      )}
                      
                      {(() => {
                        const imageUrl = getModelImageUrl(brand.slug, model.slug, model.image_url);
                        return imageUrl ? (
                          <div className={`relative h-56 sm:h-64 overflow-hidden ${
                            brand.slug === 'bmw' 
                              ? 'bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 dark:from-slate-950 dark:via-black dark:to-slate-950' 
                              : 'bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700'
                          }`}>
                            {/* Metallic grille effect overlay for BMW */}
                            {brand.slug === 'bmw' && (
                              <div className="absolute inset-0 z-10">
                                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_30%,_rgba(0,0,0,0.3)_100%)]"></div>
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-20 bg-gradient-to-b from-slate-600/40 via-slate-700/20 to-transparent blur-sm"></div>
                                <div className="absolute top-0 left-1/4 w-1/6 h-16 bg-gradient-to-b from-white/10 to-transparent blur-[2px]"></div>
                                <div className="absolute top-0 right-1/4 w-1/6 h-16 bg-gradient-to-b from-white/10 to-transparent blur-[2px]"></div>
                              </div>
                            )}
                            
                            {/* Gradient overlay for better text readability */}
                            <div className={`absolute inset-0 z-10 ${
                              brand.slug === 'bmw' 
                                ? 'bg-gradient-to-t from-black/70 via-black/30 to-transparent' 
                                : 'bg-gradient-to-t from-black/40 via-black/10 to-transparent dark:from-black/60 dark:via-black/20 dark:to-transparent'
                            }`}></div>
                            
                            {/* Subtle shine effect */}
                            <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                            
                            <img
                              src={imageUrl}
                              alt={`${model.name} - ${brand.name}`}
                              className={`w-full h-full object-cover transition-transform duration-700 ease-out ${
                                brand.slug === 'bmw' 
                                  ? 'brightness-110 contrast-110 group-hover:scale-110 group-hover:brightness-120' 
                                  : 'group-hover:scale-110'
                              }`}
                              loading="lazy"
                              decoding="async"
                              fetchPriority="low"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const parent = target.parentElement;
                                if (parent) {
                                  parent.innerHTML = `
                                    <div class="h-full ${brand.slug === 'bmw' ? 'bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900' : 'bg-gradient-to-br from-red-100 to-red-200 dark:from-red-950/40 dark:to-red-900/30'} flex items-center justify-center">
                                      <span class="text-6xl font-black ${brand.slug === 'bmw' ? 'text-slate-300 dark:text-slate-400' : 'text-red-600 dark:text-red-400/90'} drop-shadow-2xl">
                                        ${model.name.charAt(0)}
                                      </span>
                                    </div>
                                  `;
                                }
                              }}
                            />
                            
                            {/* Featured badge overlay - Metallic for BMW */}
                            {model.is_featured && (
                              <div className="absolute top-4 right-4 z-20">
                                <span className={`px-3 py-1 text-white text-xs font-black rounded-full shadow-xl border-2 ${
                                  brand.slug === 'bmw' 
                                    ? 'bg-gradient-to-br from-slate-600 to-slate-700 border-slate-500/50 shadow-slate-900/50' 
                                    : 'bg-red-600 dark:bg-red-500 border-white/50'
                                }`}>
                                  {t('Featured', 'Empfohlen')}
                                </span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className={`h-56 sm:h-64 flex items-center justify-center relative overflow-hidden border-b ${
                            brand.slug === 'bmw' 
                              ? 'bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 dark:from-slate-950 dark:via-black dark:to-slate-950 border-slate-600/30' 
                              : 'bg-gradient-to-br from-red-100 via-red-200 to-red-300 dark:from-red-950/40 dark:via-red-900/30 dark:to-red-800/20 border-red-200/50 dark:border-red-900/30'
                          }`}>
                            {brand.slug === 'bmw' ? (
                              <>
                                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_40%,_rgba(0,0,0,0.4)_100%)]"></div>
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-24 bg-gradient-to-b from-slate-600/30 via-slate-700/15 to-transparent blur-md"></div>
                                <span className="text-7xl sm:text-8xl font-black text-slate-300 dark:text-slate-400 relative z-10 group-hover:scale-110 transition-transform duration-300 drop-shadow-2xl">
                                  {model.name.charAt(0)}
                                </span>
                              </>
                            ) : (
                              <>
                                <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 via-red-500/5 to-transparent dark:from-red-500/20 dark:via-red-500/10 dark:to-transparent"></div>
                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_rgba(0,0,0,0.1)_100%)]"></div>
                                <span className="text-7xl sm:text-8xl font-black text-red-600 dark:text-red-400/90 relative z-10 group-hover:scale-110 transition-transform duration-300 drop-shadow-2xl">
                                  {model.name.charAt(0)}
                                </span>
                              </>
                            )}
                          </div>
                        );
                      })()}
                      
                      <div className={`p-6 flex-grow flex flex-col relative z-10 ${
                        brand.slug === 'bmw' 
                          ? 'bg-gradient-to-b from-transparent to-slate-800/50 dark:to-black/50' 
                          : 'bg-gradient-to-b from-transparent to-white/50 dark:to-slate-900/50'
                      }`}>
                        <div className="flex items-start justify-between mb-3">
                          <h3 className={`text-2xl sm:text-3xl font-black leading-tight transition-colors ${
                            brand.slug === 'bmw' 
                              ? 'text-slate-100 dark:text-slate-200 group-hover:text-white' 
                              : 'text-slate-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400/90'
                          }`}>
                            {model.name}
                          </h3>
                        </div>
                        
                        {(model.year_start || model.year_end) && (
                          <div className="flex items-center gap-1.5 mb-3">
                            <svg className={`w-4 h-4 ${brand.slug === 'bmw' ? 'text-slate-400 dark:text-slate-500' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <p className={`text-sm font-medium ${
                              brand.slug === 'bmw' 
                                ? 'text-slate-300 dark:text-slate-400' 
                                : 'text-slate-500 dark:text-slate-400'
                            }`}>
                              {model.year_start && model.year_end
                                ? `${model.year_start} - ${model.year_end}`
                                : model.year_start
                                ? `${t('From', 'Ab')} ${model.year_start}`
                                : model.year_end
                                ? `${t('Until', 'Bis')} ${model.year_end}`
                                : ''}
                            </p>
                          </div>
                        )}
                        
                        {model.description && (
                          <p className={`text-sm line-clamp-3 flex-grow mb-4 leading-relaxed ${
                            brand.slug === 'bmw' 
                              ? 'text-slate-300 dark:text-slate-400' 
                              : 'text-slate-600 dark:text-slate-300'
                          }`}>
                            {model.description}
                          </p>
                        )}

                        {model.production_numbers && (
                          <div className={`mb-4 flex items-center gap-2 px-3 py-1.5 rounded-lg border ${
                            brand.slug === 'bmw' 
                              ? 'bg-slate-700/50 dark:bg-slate-800/50 border-slate-600/30 dark:border-slate-700/30' 
                              : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                          }`}>
                            <svg className={`w-4 h-4 ${brand.slug === 'bmw' ? 'text-slate-300 dark:text-slate-400' : 'text-slate-500 dark:text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            <span className={`text-xs font-bold ${brand.slug === 'bmw' ? 'text-slate-200 dark:text-slate-300' : 'text-slate-700 dark:text-slate-300'}`}>{model.production_numbers}</span>
                            <span className={`text-xs ml-1 ${brand.slug === 'bmw' ? 'text-slate-400 dark:text-slate-500' : 'text-slate-500 dark:text-slate-400'}`}>{t('produced', 'produziert')}</span>
                          </div>
                        )}
                        
                        <div className={`mt-auto pt-4 border-t ${
                          brand.slug === 'bmw' 
                            ? 'border-slate-600/30 dark:border-slate-700/30' 
                            : 'border-slate-200 dark:border-slate-700'
                        }`}>
                          <div className="flex items-center justify-between">
                            <div className={`flex items-center font-bold text-sm group-hover:translate-x-1 transition-transform duration-300 ${
                              brand.slug === 'bmw' 
                                ? 'text-slate-200 dark:text-slate-300 group-hover:text-white' 
                                : 'text-red-600 dark:text-red-400'
                            }`}>
                              {t('View Generations', 'Generationen ansehen')}
                              <svg className="w-4 h-4 ml-1.5 group-hover:translate-x-0.5 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                              </svg>
                            </div>
                            {(model.year_start || model.year_end) && (
                              <span className={`text-xs font-semibold ${
                                brand.slug === 'bmw' 
                                  ? 'text-slate-400 dark:text-slate-500' 
                                  : 'text-slate-500 dark:text-slate-400'
                              }`}>
                                {model.year_start || '?'}
                                {model.year_end && model.year_start !== model.year_end && `-${model.year_end}`}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      </motion.div>
                    </Link>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* All Models */}
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-8">
            {t('All Models', 'Alle Modelle')}
          </h2>
          {regularModels.length === 0 && filteredModels.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-lg text-slate-500 dark:text-slate-400">
                {t('No models found.', 'Keine Modelle gefunden.')}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {regularModels.map((model, index) => (
                <motion.div
                  key={model.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: (featuredModels.length + index) * 0.05 }}
                >
                  <Link
                    href={`/${lang}/cars/${brand.slug}/${model.slug}`}
                    className="group block h-full"
                  >
                    <div className="group relative bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-md dark:shadow-xl hover:shadow-2xl dark:hover:shadow-red-900/20 transition-all duration-300 border border-slate-200 dark:border-slate-800 hover:border-red-500 dark:hover:border-red-500/50 h-full flex flex-col">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-red-500/5 to-transparent rounded-full blur-2xl group-hover:from-red-500/10 dark:group-hover:from-red-500/20 transition-opacity z-0"></div>
                      
                      {(() => {
                        const imageUrl = getModelImageUrl(brand.slug, model.slug, model.image_url);
                        return imageUrl ? (
                          <div className="relative h-44 sm:h-48 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-black/5 to-transparent dark:from-black/50 dark:via-black/10 dark:to-transparent z-10"></div>
                            <img
                              src={imageUrl}
                              alt={`${model.name} - ${brand.name}`}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ease-out"
                              loading="lazy"
                              decoding="async"
                              fetchPriority="low"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const parent = target.parentElement;
                                if (parent) {
                                  parent.innerHTML = `
                                    <div class="h-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center">
                                      <span class="text-5xl font-black text-slate-600 dark:text-slate-300 drop-shadow-lg">
                                        ${model.name.charAt(0)}
                                      </span>
                                    </div>
                                  `;
                                }
                              }}
                            />
                          </div>
                        ) : (
                          <div className="h-44 sm:h-48 bg-gradient-to-br from-slate-100 via-slate-200 to-slate-300 dark:from-slate-800 dark:via-slate-700 dark:to-slate-600 flex items-center justify-center relative overflow-hidden border-b border-slate-200/50 dark:border-slate-700/50">
                            <div className="absolute inset-0 bg-gradient-to-br from-slate-500/5 via-transparent to-transparent dark:from-slate-400/10"></div>
                            <span className="text-5xl sm:text-6xl font-black text-slate-600 dark:text-slate-300 relative z-10 group-hover:scale-110 transition-transform duration-300 drop-shadow-lg">
                              {model.name.charAt(0)}
                            </span>
                          </div>
                        );
                      })()}
                      
                      <div className="p-5 flex-grow flex flex-col relative z-10 bg-gradient-to-b from-transparent to-white/30 dark:to-slate-900/30">
                        <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mb-2 group-hover:text-red-600 dark:group-hover:text-red-400/90 transition-colors leading-tight">
                          {model.name}
                        </h3>
                        
                        {(model.year_start || model.year_end) && (
                          <div className="flex items-center gap-1.5 mb-3">
                            <svg className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                              {model.year_start && model.year_end
                                ? `${model.year_start} - ${model.year_end}`
                                : model.year_start
                                ? `${t('From', 'Ab')} ${model.year_start}`
                                : model.year_end
                                ? `${t('Until', 'Bis')} ${model.year_end}`
                                : ''}
                            </p>
                          </div>
                        )}

                        {model.description && (
                          <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2 flex-grow mb-3 leading-relaxed">
                            {model.description}
                          </p>
                        )}

                        {model.production_numbers && (
                          <div className="mb-3 flex items-center gap-2 px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                            <svg className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{model.production_numbers}</span>
                          </div>
                        )}
                        
                        <div className="mt-auto pt-3 border-t border-slate-200 dark:border-slate-700">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center text-red-600 dark:text-red-400/90 font-bold text-sm group-hover:translate-x-1 transition-transform">
                              {t('View Generations', 'Generationen ansehen')}
                              <svg className="w-4 h-4 ml-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                              </svg>
                            </div>
                            {(model.year_start || model.year_end) && (
                              <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                                {model.year_start || '?'}
                                {model.year_end && model.year_start !== model.year_end && `-${model.year_end}`}
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
          )}
        </div>
      </div>
    </div>
  );
}

