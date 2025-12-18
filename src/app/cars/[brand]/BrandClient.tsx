'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useState, memo } from 'react';
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
  faultsCount?: number;
  manualsCount?: number;
};

const BrandClient = memo(function BrandClient({ brand, models, faultsCount = 0, manualsCount = 0 }: BrandClientProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Debug: Log models in development
  if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
    console.log(`[BrandClient] Received ${models.length} models for brand ${brand.name}`);
  }

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
      {/* Hero Section - Professional & Modern */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-black dark:via-slate-950 dark:to-black">
        {/* Enhanced background patterns */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.03%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%221%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-50"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-slate-500/5"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 md:py-28">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            {/* Breadcrumb */}
            <nav className="mb-4 sm:mb-6 flex items-center justify-center flex-wrap space-x-2 text-xs sm:text-sm text-slate-400 px-2">
              <Link href="/" className="hover:text-white transition-colors">
                Startseite
              </Link>
              <span>/</span>
              <Link href="/cars" className="hover:text-white transition-colors">
                Autos
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
                    
                    {/* Logo container with professional styling */}
                    <div className="relative bg-gradient-to-br from-white/20 via-white/15 to-white/10 dark:from-white/15 dark:via-white/10 dark:to-white/5 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 lg:p-10 border-2 border-white/40 dark:border-white/30 shadow-2xl group-hover:border-white/50 dark:group-hover:border-white/40 transition-all duration-500 group-hover:shadow-[0_0_50px_rgba(255,255,255,0.4)] group-hover:scale-105">
                      {/* Inner glow ring */}
                      <div className="absolute inset-2 rounded-xl sm:rounded-2xl border border-white/20 dark:border-white/10"></div>
                      {/* Subtle shine effect */}
                      <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-transparent rounded-2xl sm:rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                      
                      <Image
                        src={logoUrl}
                        alt={`${brand.name} logo`}
                        width={300}
                        height={200}
                        className="relative h-20 sm:h-28 md:h-36 lg:h-44 xl:h-52 w-auto object-contain filter drop-shadow-[0_0_40px_rgba(0,0,0,0.6)] group-hover:scale-110 transition-transform duration-500"
                        loading="eager"
                        quality={90}
                        unoptimized={logoUrl.startsWith('http')}
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
            
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black text-white mb-4 sm:mb-6 tracking-tight px-2">
              {brand.name}
            </h1>
            
            {brand.description && (
              <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-slate-300 dark:text-slate-400 mb-3 sm:mb-4 max-w-3xl mx-auto leading-relaxed px-2">
                {brand.description}
              </p>
            )}
            
            {brand.country && (
              <p className="text-sm sm:text-base md:text-lg text-slate-400 mb-4 sm:mb-6 px-2">
                {brand.country}
                {brand.founded_year && ` • ${brand.founded_year}`}
              </p>
            )}

            {/* Brand Stats */}
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs sm:text-sm text-slate-400 px-2">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <span className="font-semibold text-white">{models.length}</span>
                <span>Modelle</span>
              </div>
              {faultsCount > 0 && (
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span className="font-semibold text-white">{faultsCount.toLocaleString()}</span>
                  <span>Fehlerlösungen</span>
                </div>
              )}
              {manualsCount > 0 && (
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  <span className="font-semibold text-white">{manualsCount.toLocaleString()}</span>
                  <span>Anleitungen</span>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {/* Professional Statistics Bar - Enhanced */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4 md:gap-6 mb-8 sm:mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="group bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm rounded-xl p-5 sm:p-6 border-2 border-slate-200 dark:border-slate-800 shadow-lg hover:shadow-xl hover:border-blue-500/30 dark:hover:border-blue-500/30 transition-all text-center hover:scale-105"
          >
            <div className="text-4xl sm:text-5xl font-black bg-gradient-to-br from-blue-600 to-blue-700 dark:from-blue-400 dark:to-blue-500 bg-clip-text text-transparent mb-2 group-hover:scale-110 transition-transform">{models.length.toLocaleString()}</div>
            <div className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Automodelle</div>
            <div className="text-xs text-slate-500 dark:text-slate-500 mt-1">Gesamt verfügbar</div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="group bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm rounded-xl p-5 sm:p-6 border-2 border-slate-200 dark:border-slate-800 shadow-lg hover:shadow-xl hover:border-slate-500/30 dark:hover:border-slate-500/30 transition-all text-center hover:scale-105"
          >
            <div className="text-4xl sm:text-5xl font-black bg-gradient-to-br from-slate-600 to-slate-700 dark:from-slate-400 dark:to-slate-500 bg-clip-text text-transparent mb-2 group-hover:scale-110 transition-transform">{faultsCount.toLocaleString()}</div>
            <div className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors">Fehlerlösungen</div>
            <div className="text-xs text-slate-500 dark:text-slate-500 mt-1">Verifiziert</div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="group bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm rounded-xl p-5 sm:p-6 border-2 border-slate-200 dark:border-slate-800 shadow-lg hover:shadow-xl hover:border-gray-500/30 dark:hover:border-gray-500/30 transition-all text-center hover:scale-105"
          >
            <div className="text-4xl sm:text-5xl font-black bg-gradient-to-br from-gray-600 to-gray-700 dark:from-gray-400 dark:to-gray-500 bg-clip-text text-transparent mb-2 group-hover:scale-110 transition-transform">{manualsCount.toLocaleString()}</div>
            <div className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors">Anleitungen</div>
            <div className="text-xs text-slate-500 dark:text-slate-500 mt-1">Schritt-für-Schritt</div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="group bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm rounded-xl p-5 sm:p-6 border-2 border-slate-200 dark:border-slate-800 shadow-lg hover:shadow-xl hover:border-slate-500/30 dark:hover:border-slate-500/30 transition-all text-center hover:scale-105"
          >
            <div className="text-4xl sm:text-5xl font-black bg-gradient-to-br from-slate-600 to-slate-700 dark:from-slate-400 dark:to-slate-500 bg-clip-text text-transparent mb-2 group-hover:scale-110 transition-transform">{featuredModels.length}</div>
            <div className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors">Empfohlene Modelle</div>
            <div className="text-xs text-slate-500 dark:text-slate-500 mt-1">Beliebt</div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="group bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm rounded-xl p-5 sm:p-6 border-2 border-slate-200 dark:border-slate-800 shadow-lg hover:shadow-xl hover:border-blue-500/30 dark:hover:border-blue-500/30 transition-all text-center hover:scale-105"
          >
            <div className="text-4xl sm:text-5xl font-black bg-gradient-to-br from-blue-600 to-blue-700 dark:from-blue-400 dark:to-blue-500 bg-clip-text text-transparent mb-2 group-hover:scale-110 transition-transform">
              {models.filter(m => m.year_start && m.year_start >= 2010).length}
            </div>
            <div className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Modern (2010+)</div>
            <div className="text-xs text-slate-500 dark:text-slate-500 mt-1">Aktuell</div>
          </motion.div>
        </div>
        {/* Professional Search Bar - Enhanced */}
        <div className="mb-8 sm:mb-12">
          <div className="relative max-w-2xl mx-auto">
            <input
              type="text"
              placeholder="Automodelle suchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 sm:px-6 py-3 sm:py-4 text-base sm:text-lg border-2 border-slate-300 dark:border-slate-700 rounded-lg sm:rounded-xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-4 focus:ring-blue-500/20 dark:focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-500 transition-all shadow-lg hover:shadow-xl min-h-[44px]"
            />
            <svg
              className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 sm:w-6 sm:h-6 text-slate-400 dark:text-slate-500 z-10"
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
          <div className="mb-12 sm:mb-16">
            <div className="flex items-center justify-between mb-6 sm:mb-8">
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                Empfohlene Modelle
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
              {featuredModels.map((model, index) => (
                <motion.div
                  key={model.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                >
                  <Link
                    href={`/cars/${brand.slug}/${model.slug}`}
                    className="group block h-full"
                  >
                    <motion.div 
                      className="group relative rounded-2xl overflow-hidden shadow-xl dark:shadow-2xl hover:shadow-2xl dark:hover:shadow-[0_20px_60px_rgba(0,0,0,0.4)] transition-all duration-500 border-2 border-slate-200 dark:border-slate-800 hover:border-blue-500/50 dark:hover:border-blue-500/50 bg-white dark:bg-slate-900 h-full flex flex-col"
                      whileHover={{ y: -8, scale: 1.03 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {/* Professional Image Display for All Brands */}
                      {(() => {
                        const imageUrl = getModelImageUrl(brand.slug, model.slug, model.image_url);
                        return imageUrl ? (
                          <div className="relative h-56 sm:h-64 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent dark:from-black/70 dark:via-black/30 dark:to-transparent z-10"></div>
                            <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                            <Image
                              src={imageUrl}
                              alt={`${model.name} - ${brand.name}`}
                              fill
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                              className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                              loading="lazy"
                              quality={85}
                              unoptimized={imageUrl.startsWith('http')}
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const parent = target.parentElement;
                                if (parent) {
                                  parent.innerHTML = `
                                    <div class="h-full bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-950/40 dark:to-blue-900/30 flex items-center justify-center">
                                      <span class="text-6xl font-black text-blue-600 dark:text-blue-400/90 drop-shadow-lg">
                                        ${model.name.charAt(0)}
                                      </span>
                                    </div>
                                  `;
                                }
                              }}
                            />
                            {model.is_featured && (
                              <div className="absolute top-4 right-4 z-20">
                                <span className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-500 dark:to-blue-600 text-white text-xs font-black rounded-full shadow-xl border-2 border-white/50">
                                  Empfohlen
                                </span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="h-56 sm:h-64 bg-gradient-to-br from-blue-100 via-blue-200 to-blue-300 dark:from-blue-950/40 dark:via-blue-900/30 dark:to-blue-800/20 flex items-center justify-center relative overflow-hidden border-b border-blue-200/50 dark:border-blue-900/30">
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent dark:from-blue-500/20 dark:via-blue-500/10 dark:to-transparent"></div>
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_rgba(0,0,0,0.1)_100%)]"></div>
                            <span className="text-7xl sm:text-8xl font-black text-blue-600 dark:text-blue-400/90 relative z-10 group-hover:scale-110 transition-transform duration-300 drop-shadow-2xl">
                              {model.name.charAt(0)}
                            </span>
                          </div>
                        );
                      })()}
                      
                      <div className="p-6 flex-grow flex flex-col relative z-10 bg-gradient-to-b from-transparent to-white/50 dark:to-slate-900/50">
                        {/* Model name */}
                        <div className="flex items-start justify-between mb-3">
                          <h3 className="text-2xl sm:text-3xl font-black leading-tight transition-colors text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                            {model.name}
                          </h3>
                        </div>
                        
                        {(model.year_start || model.year_end) && (
                          <div className="flex items-center gap-1.5 mb-3">
                            <svg className="w-4 h-4 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                              {model.year_start && model.year_end
                                ? `${model.year_start} - ${model.year_end}`
                                : model.year_start
                                ? `Ab ${model.year_start}`
                                : model.year_end
                                ? `Bis ${model.year_end}`
                                : ''}
                            </p>
                          </div>
                        )}
                        
                        {model.description && (
                          <p className="text-sm line-clamp-3 flex-grow mb-4 leading-relaxed text-slate-600 dark:text-slate-300">
                            {model.description}
                          </p>
                        )}

                        {model.production_numbers && (
                          <div className="mb-4 flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                            <svg className="w-4 h-4 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{model.production_numbers}</span>
                            <span className="text-xs ml-1 text-slate-500 dark:text-slate-400">produziert</span>
                          </div>
                        )}
                        
                        <div className="mt-auto pt-4 border-t border-slate-200 dark:border-slate-700">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center font-bold text-sm group-hover:translate-x-1 transition-transform duration-300 text-blue-600 dark:text-blue-400">
                              Generationen ansehen
                              <svg className="w-4 h-4 ml-1.5 group-hover:translate-x-0.5 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                              </svg>
                            </div>
                            {(model.year_start || model.year_end) && (
                              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
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

        {/* All Faults Section */}
        {faultsCount > 0 && (
          <div className="mb-16">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2">
                  Alle Fehler - {brand.name}
                </h2>
                <p className="text-slate-600 dark:text-slate-400">
                  {faultsCount.toLocaleString()} Fehlerlösungen verfügbar
                </p>
              </div>
              <Link
                href={`/cars/${brand.slug}/faults`}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-500 dark:to-blue-600 text-white font-bold rounded-xl hover:from-blue-700 hover:to-blue-800 dark:hover:from-blue-600 dark:hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Alle ansehen
              </Link>
            </div>
          </div>
        )}

        {/* All Models */}
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mb-6 sm:mb-8">
            Alle Modelle
          </h2>
          {regularModels.length === 0 && featuredModels.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <svg className="w-16 h-16 sm:w-24 sm:h-24 mx-auto text-slate-300 dark:text-slate-700 mb-4 sm:mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-2 sm:mb-3 px-2">
                {models.length === 0 ? 'Keine Modelle vorhanden' : 'Keine Modelle gefunden'}
              </h3>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mb-4 sm:mb-6 px-4">
                {models.length === 0 
                  ? 'Für diese Marke sind noch keine Modelle in der Datenbank vorhanden.'
                  : 'Versuchen Sie, Ihre Suche anzupassen.'}
              </p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="inline-flex items-center gap-2 px-6 py-3 min-h-[44px] bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Suche zurücksetzen
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {regularModels.map((model, index) => (
                <motion.div
                  key={model.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: (featuredModels.length + index) * 0.05 }}
                >
                  <Link
                    href={`/cars/${brand.slug}/${model.slug}`}
                    className="group block h-full"
                  >
                    <div className="group relative bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm rounded-xl overflow-hidden shadow-lg dark:shadow-xl hover:shadow-xl dark:hover:shadow-2xl transition-all duration-300 border-2 border-slate-200 dark:border-slate-800 hover:border-blue-500/30 dark:hover:border-blue-500/30 h-full flex flex-col hover:scale-105">
                      
                      {(() => {
                        const imageUrl = getModelImageUrl(brand.slug, model.slug, model.image_url);
                        return imageUrl ? (
                          <div className="relative h-44 sm:h-48 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent dark:from-black/60 dark:via-black/20 dark:to-transparent z-10"></div>
                            <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            <Image
                              src={imageUrl}
                              alt={`${model.name} - ${brand.name}`}
                              fill
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                              className="object-cover group-hover:scale-110 transition-transform duration-500 ease-out"
                              loading="lazy"
                              quality={85}
                              unoptimized={imageUrl.startsWith('http')}
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
                      
                      <div className="p-5 flex-grow flex flex-col relative z-10">
                        <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-tight">
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
                                ? `Ab ${model.year_start}`
                                : model.year_end
                                ? `Bis ${model.year_end}`
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
                            <div className="flex items-center text-blue-600 dark:text-blue-400 font-bold text-sm group-hover:translate-x-1 transition-all">
                              Generationen ansehen
                              <svg className="w-4 h-4 ml-1.5 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

