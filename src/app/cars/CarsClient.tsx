'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useState, useMemo, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getBrandLogoUrl } from '@/lib/car-brand-logos';
import { getVisitedCarPages, clearVisitedCarPages } from '@/lib/car-visited-pages';

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
  stats?: {
    totalModels: number;
    totalFaults: number;
  };
  brandCounts?: Map<string, { faults: number }>;
};

type FilterType = 'all' | 'featured' | 'country';
type SortType = 'alphabetical' | 'featured' | 'country';

export default function CarsClient({ brands, stats, brandCounts }: CarsClientProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [sortType, setSortType] = useState<SortType>('featured');
  const [selectedCountry, setSelectedCountry] = useState<string>('all');
  const [recentlyViewed, setRecentlyViewed] = useState<ReturnType<typeof getVisitedCarPages>>([]);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Load recently viewed pages
  useEffect(() => {
    const visited = getVisitedCarPages().filter(page => page.lang === 'de');
    setRecentlyViewed(visited);
  }, []);

  // Get unique countries
  const countries = useMemo(() => {
    const countrySet = new Set(brands.map(b => b.country).filter(Boolean) as string[]);
    return Array.from(countrySet).sort();
  }, [brands]);

  // Filter and sort brands
  const filteredBrands = useMemo(() => {
    let result = brands;

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(brand =>
        brand.name.toLowerCase().includes(query) ||
        brand.country?.toLowerCase().includes(query) ||
        brand.description?.toLowerCase().includes(query)
      );
    }

    // Country filter
    if (selectedCountry !== 'all') {
      result = result.filter(brand => brand.country === selectedCountry);
    }

    // Type filter
    if (filterType === 'featured') {
      result = result.filter(b => b.is_featured);
    }

    // Sort
    if (sortType === 'alphabetical') {
      result = [...result].sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortType === 'country') {
      result = [...result].sort((a, b) => {
        const countryA = a.country || 'zzz';
        const countryB = b.country || 'zzz';
        return countryA.localeCompare(countryB) || a.name.localeCompare(b.name);
      });
    } else {
      // Featured first, then by display_order
      result = [...result].sort((a, b) => {
        if (a.is_featured && !b.is_featured) return -1;
        if (!a.is_featured && b.is_featured) return 1;
        return a.display_order - b.display_order || a.name.localeCompare(b.name);
      });
    }

    return result;
  }, [brands, searchQuery, filterType, sortType, selectedCountry]);

  // Separate featured and regular brands for display - memoized for performance
  const featuredBrands = useMemo(() => 
    filteredBrands.filter(b => b.is_featured),
    [filteredBrands]
  );
  const regularBrands = useMemo(() => 
    filteredBrands.filter(b => !b.is_featured),
    [filteredBrands]
  );

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    // Search is handled by state, no need to navigate
  }, []);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-black font-sans">
      {/* Hero Section - Modern Premium Design */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-black dark:via-slate-950 dark:to-black">
        {/* Enhanced animated background pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.03%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%221.5%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-50"></div>
        {/* Gradient overlays for depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/5 via-transparent to-slate-900/5"></div>
        {/* Subtle animated grid lines */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)',
            backgroundSize: '40px 40px'
          }}></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-24 lg:py-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto"
          >
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black text-white mb-4 sm:mb-6 tracking-tight leading-tight drop-shadow-2xl px-2">
              <span className="bg-gradient-to-r from-white via-slate-100 to-white bg-clip-text text-transparent">
                Auto-Wartung & Reparatur
              </span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-slate-200 dark:text-slate-300 mb-8 sm:mb-10 leading-relaxed max-w-3xl mx-auto drop-shadow-lg px-2">
              Finden Sie Schritt-für-Schritt-Anleitungen, Fehlerlösungen und Wartungshandbücher für Ihr genaues Automodell und Generation.
            </p>

            {/* Professional Search Bar */}
            <motion.form 
              onSubmit={handleSearch} 
              className="max-w-3xl mx-auto mb-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <div className="relative">
                <div className="relative flex items-center bg-white dark:bg-slate-900 rounded-xl shadow-xl border-2 border-slate-200 dark:border-slate-800 overflow-hidden focus-within:border-blue-500/50 dark:focus-within:border-blue-500/50 focus-within:shadow-2xl focus-within:ring-4 focus-within:ring-blue-500/20 transition-all duration-300">
                  <div className="pl-6 pr-2">
                    <svg className="w-6 h-6 text-slate-400 dark:text-slate-500 group-focus-within:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Nach Marke, Modell oder Fehler suchen..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 px-3 sm:px-4 py-4 sm:py-5 text-base sm:text-lg bg-transparent text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none"
                  />
                  {searchQuery && (
                    <motion.button
                      type="button"
                      onClick={clearSearch}
                      className="p-2 min-h-[44px] min-w-[44px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                      aria-label="Suche löschen"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </motion.button>
                  )}
                  <button
                    type="submit"
                    className="px-4 sm:px-6 md:px-8 py-4 sm:py-5 min-h-[44px] bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 text-white font-semibold hover:from-blue-700 hover:to-blue-800 dark:hover:from-blue-800 dark:hover:to-blue-900 transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:scale-105 active:scale-100"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <span className="hidden sm:inline">Suchen</span>
                  </button>
                </div>
              </div>
            </motion.form>

            {/* Professional Stats - Optimized for Large Numbers */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 md:gap-6 max-w-4xl mx-auto text-center">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                whileHover={{ scale: 1.05, y: -2 }}
                className="bg-white/10 dark:bg-white/5 backdrop-blur-md rounded-lg sm:rounded-xl p-4 sm:p-5 md:p-6 border border-white/20 dark:border-white/10 hover:border-white/40 dark:hover:border-white/30 hover:bg-white/15 dark:hover:bg-white/10 transition-all shadow-lg hover:shadow-2xl cursor-default"
              >
                <div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-white mb-1 sm:mb-2 leading-tight bg-gradient-to-br from-white to-slate-200 bg-clip-text text-transparent">{brands.length.toLocaleString()}</div>
                <div className="text-xs sm:text-sm font-semibold text-white/90 uppercase tracking-wide">Automarken</div>
                <div className="text-xs text-white/70 mt-1 hidden sm:block">Verfügbar</div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                whileHover={{ scale: 1.05, y: -2 }}
                className="bg-white/10 dark:bg-white/5 backdrop-blur-md rounded-xl p-5 sm:p-6 border border-white/20 dark:border-white/10 hover:border-white/40 dark:hover:border-white/30 hover:bg-white/15 dark:hover:bg-white/10 transition-all shadow-lg hover:shadow-2xl cursor-default"
              >
                <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-white mb-2 leading-tight bg-gradient-to-br from-white to-slate-200 bg-clip-text text-transparent">{(stats?.totalModels || 0).toLocaleString()}</div>
                <div className="text-xs sm:text-sm font-semibold text-white/90 uppercase tracking-wide">Automodelle</div>
                <div className="text-xs text-white/70 mt-1">Gesamt</div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                whileHover={{ scale: 1.05, y: -2 }}
                className="bg-white/10 dark:bg-white/5 backdrop-blur-md rounded-xl p-5 sm:p-6 border border-white/20 dark:border-white/10 hover:border-white/40 dark:hover:border-white/30 hover:bg-white/15 dark:hover:bg-white/10 transition-all shadow-lg hover:shadow-2xl cursor-default"
              >
                <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-white mb-2 leading-tight bg-gradient-to-br from-white to-slate-200 bg-clip-text text-transparent">{(stats?.totalFaults || 0).toLocaleString()}</div>
                <div className="text-xs sm:text-sm font-semibold text-white/90 uppercase tracking-wide">Fehlerlösungen</div>
                <div className="text-xs text-white/70 mt-1">Verifiziert</div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                whileHover={{ scale: 1.05, y: -2 }}
                className="bg-white/10 dark:bg-white/5 backdrop-blur-md rounded-xl p-5 sm:p-6 border border-white/20 dark:border-white/10 hover:border-white/40 dark:hover:border-white/30 hover:bg-white/15 dark:hover:bg-white/10 transition-all shadow-lg hover:shadow-2xl cursor-default"
              >
                <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-white mb-2 leading-tight bg-gradient-to-br from-white to-slate-200 bg-clip-text text-transparent">{countries.length.toLocaleString()}</div>
                <div className="text-xs sm:text-sm font-semibold text-white/90 uppercase tracking-wide">Länder</div>
                <div className="text-xs text-white/70 mt-1">Weltweit</div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 md:py-16">
        {/* Recently Viewed Section */}
        {recentlyViewed.length > 0 && (
          <div className="mb-8 sm:mb-12">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-3">
              <div>
                <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 dark:text-white mb-1 sm:mb-2">
                  Zuletzt angeschaut
                </h2>
                <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm">
                  Setzen Sie dort fort, wo Sie aufgehört haben
                </p>
              </div>
              <button
                onClick={() => {
                  clearVisitedCarPages();
                  setRecentlyViewed([]);
                }}
                className="text-xs sm:text-sm px-3 py-2 min-h-[44px] text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                title="Verlauf löschen"
              >
                Löschen
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4">
              {recentlyViewed.map((page, index) => (
                <motion.div
                  key={`${page.slug}-${page.type}-${page.generationSlug}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link
                    href={page.url}
                    className="group block h-full"
                  >
                    <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-xl p-4 border-2 border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-600 transition-all duration-200 h-full flex flex-col">
                      {/* Type badge */}
                      <div className="mb-2">
                        <span className="inline-block px-2 py-0.5 text-xs font-bold rounded bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400">
                          Fehler
                        </span>
                      </div>
                      
                      {/* Title */}
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {page.title}
                      </h3>
                      
                      {/* Brand/Model info */}
                      <div className="mt-auto text-xs text-slate-500 dark:text-slate-400 space-y-0.5">
                        <p className="font-semibold">{page.brand}</p>
                        <p>{page.model} {page.generation}</p>
                      </div>
                      
                      {/* Arrow indicator */}
                      <div className="mt-2 flex items-center text-blue-600 dark:text-blue-400 text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                        Ansehen
                        <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

        {/* Professional Filters and Sort Bar */}
        <div className="sticky top-0 z-20 bg-white/95 dark:bg-black/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 mb-6 sm:mb-8 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-3 sm:py-4 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-start sm:items-center justify-between">
            {/* Results count */}
            <div className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400">
              {filteredBrands.length === 0 ? (
                'Keine Marken gefunden'
              ) : (
                <>
                  {filteredBrands.length.toLocaleString()} {filteredBrands.length === 1 ? 'Marke' : 'Marken'}
                </>
              )}
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
              {/* Filter Type */}
              <div className="flex items-center gap-1.5 sm:gap-2">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide hidden sm:inline">
                  Filter:
                </label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as FilterType)}
                  className="px-3 py-2 min-h-[44px] rounded-lg border text-xs sm:text-sm font-semibold bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-slate-300 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:focus:ring-blue-500/50 transition-all cursor-pointer"
                >
                  <option value="all">Alle</option>
                  <option value="featured">Beliebt</option>
                </select>
              </div>

              {/* Country Filter */}
              {countries.length > 0 && (
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide hidden sm:inline">
                    Land:
                  </label>
                  <select
                    value={selectedCountry}
                    onChange={(e) => setSelectedCountry(e.target.value)}
                    className="px-3 py-2 min-h-[44px] rounded-lg border text-xs sm:text-sm font-semibold bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-slate-300 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:focus:ring-blue-500/50 transition-all cursor-pointer"
                  >
                    <option value="all">Alle Länder</option>
                    {countries.map(country => (
                      <option key={country} value={country}>{country}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Sort */}
              <div className="flex items-center gap-1.5 sm:gap-2">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide hidden sm:inline">
                  Sortieren:
                </label>
                <select
                  value={sortType}
                  onChange={(e) => setSortType(e.target.value as SortType)}
                  className="px-3 py-2 min-h-[44px] rounded-lg border text-xs sm:text-sm font-semibold bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-slate-300 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:focus:ring-blue-500/50 transition-all cursor-pointer"
                >
                  <option value="featured">Beliebt zuerst</option>
                  <option value="alphabetical">A-Z</option>
                  <option value="country">Nach Land</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Featured Brands */}
        {featuredBrands.length > 0 && (
          <div className="mb-12 sm:mb-16">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 gap-3">
              <div>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 dark:text-white mb-1 sm:mb-2">
                  Empfohlene Marken
                </h2>
                <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm">
                  Ausgewählte Automarken mit umfassendem Inhalt
                </p>
              </div>
              {regularBrands.length > 0 && (
                <Link
                  href="#all-brands"
                  className="text-blue-600 dark:text-blue-400 font-semibold hover:underline flex items-center gap-1 transition-colors text-sm sm:text-base min-h-[44px]"
                >
                  Alle anzeigen
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {featuredBrands.map((brand, index) => (
                <motion.div
                  key={brand.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                >
                  <Link
                    href={`/cars/${brand.slug}`}
                    className="group block h-full"
                  >
                    <motion.div 
                      className="group relative bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm dark:shadow-lg hover:shadow-xl dark:hover:shadow-2xl transition-all duration-300 border border-slate-200 dark:border-slate-800 hover:border-blue-500/30 dark:hover:border-blue-500/40 h-full flex flex-col overflow-hidden"
                      whileHover={{ y: -4, scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {/* Hover gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/0 via-transparent to-blue-50/0 dark:from-blue-950/0 dark:via-transparent dark:to-blue-950/0 group-hover:from-blue-50/50 group-hover:to-blue-50/30 dark:group-hover:from-blue-950/30 dark:group-hover:to-blue-950/20 transition-all duration-300 pointer-events-none"></div>
                      
                      {/* Featured badge - only show if actually popular (has significant content) */}
                      {false && (
                        <div className="absolute top-3 right-3 z-20">
                          <span className="px-2 py-1 bg-blue-600 text-white text-xs font-bold rounded-full">
                            Beliebt
                          </span>
                        </div>
                      )}
                      
                      {/* Logo */}
                      {(() => {
                        const logoUrl = getBrandLogoUrl(brand.slug, brand.name, brand.logo_url);
                        return logoUrl ? (
                          <div className="mb-4 h-32 flex items-center justify-center relative z-10 bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 rounded-xl p-4 border-2 border-slate-200 dark:border-slate-700 group-hover:border-blue-400 dark:group-hover:border-blue-600 group-hover:shadow-xl dark:group-hover:shadow-blue-900/30 transition-all duration-300 group-hover:bg-gradient-to-br group-hover:from-blue-50/30 group-hover:to-white dark:group-hover:from-blue-950/20 dark:group-hover:to-slate-900">
                            {/* Subtle inner glow */}
                            <div className="absolute inset-1 rounded-lg bg-gradient-to-br from-white/50 to-transparent dark:from-white/5 dark:to-transparent group-hover:from-blue-100/30 dark:group-hover:from-blue-900/20 transition-all duration-300"></div>
                            <img
                              src={logoUrl}
                              alt={`${brand.name} logo`}
                              className="relative max-h-24 max-w-full object-contain filter drop-shadow-md group-hover:scale-110 group-hover:drop-shadow-xl transition-all duration-300 z-10"
                              loading="lazy"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const parent = target.parentElement;
                                if (parent) {
                                  parent.innerHTML = `<span class="text-4xl font-black text-blue-600 dark:text-blue-400/90 z-10 relative">${brand.name.charAt(0)}</span>`;
                                }
                              }}
                            />
                          </div>
                        ) : (
                          <div className="mb-4 h-32 flex items-center justify-center bg-gradient-to-br from-blue-100 via-blue-50 to-blue-100 dark:from-blue-950/40 dark:via-blue-900/30 dark:to-blue-950/40 rounded-xl relative z-10 group-hover:from-blue-200 group-hover:via-blue-100 group-hover:to-blue-200 dark:group-hover:from-blue-900/50 dark:group-hover:via-blue-800/40 dark:group-hover:to-blue-900/50 transition-all duration-300 border-2 border-blue-200/50 dark:border-blue-900/30 group-hover:border-blue-400 dark:group-hover:border-blue-600 group-hover:shadow-xl">
                            <span className="text-5xl font-black text-blue-600 dark:text-blue-400/90 group-hover:scale-110 transition-transform duration-300">
                              {brand.name.charAt(0)}
                            </span>
                          </div>
                        );
                      })()}
                      
                      {/* Brand Name */}
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors relative z-10 group-hover:translate-x-1 duration-300">
                        {brand.name}
                      </h3>
                      
                      {/* Country */}
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
                      
                      {/* Description */}
                      {brand.description && (
                        <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-3 flex-grow leading-relaxed relative z-10 mb-4">
                          {brand.description}
                        </p>
                      )}
                      
                      {/* Additional Info */}
                      <div className="flex items-center gap-3 mb-4 relative z-10 text-xs text-slate-500 dark:text-slate-400">
                        {brand.founded_year && (
                          <div className="flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="font-semibold">{brand.founded_year}</span>
                          </div>
                        )}
                        {brand.country && (
                          <div className="flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span className="font-semibold">{brand.country}</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Content Counts - Professional & Optimized for Large Numbers */}
                      {brandCounts && brandCounts.has(brand.id) && (() => {
                        const counts = brandCounts.get(brand.id)!;
                        return (
                          <div className="mb-4">
                            {counts.faults > 0 && (
                              <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg">
                                <svg className="w-4 h-4 text-slate-600 dark:text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                  {counts.faults.toLocaleString()} Fehler
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      {/* CTA */}
                        <div className="mt-auto flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-700 relative z-10">
                        <div className="flex items-center text-slate-700 dark:text-slate-300 font-semibold text-sm group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-x-1 transition-all duration-300">
                          Modelle durchsuchen
                          <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors duration-300">
                          <span className="font-semibold">Empfohlen</span>
                        </div>
                      </div>
                    </motion.div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* All Brands */}
        <div id="all-brands">
          <div className="mb-6 sm:mb-8">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 dark:text-white mb-1 sm:mb-2">
              Alle Automarken
              </h2>
              <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm">
              Alle verfügbaren Automarken durchsuchen
            </p>
          </div>

          {/* Empty State */}
          {filteredBrands.length === 0 ? (
            <div className="text-center py-16 sm:py-24">
              <div className="max-w-md mx-auto">
                <svg className="w-24 h-24 mx-auto text-slate-300 dark:text-slate-700 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
                  Keine Marken gefunden
                </h3>
                <p className="text-slate-600 dark:text-slate-400 mb-6">
                  Versuchen Sie, Ihre Suche oder Filter anzupassen, um zu finden, wonach Sie suchen.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setFilterType('all');
                    setSelectedCountry('all');
                    setSortType('featured');
                  }}
                  className="inline-flex items-center gap-2 px-6 py-3 min-h-[44px] bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Filter zurücksetzen
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {regularBrands.map((brand, index) => (
                <motion.div
                  key={brand.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: (featuredBrands.length + index) * 0.03 }}
                >
                  <Link
                    href={`/cars/${brand.slug}`}
                    className="group block h-full"
                  >
                    <motion.div 
                      className="group relative bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm dark:shadow-md hover:shadow-xl dark:hover:shadow-2xl transition-all duration-300 border border-slate-200 dark:border-slate-800 hover:border-blue-500/30 dark:hover:border-blue-500/40 h-full flex flex-col overflow-hidden"
                      whileHover={{ y: -3, scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {/* Hover gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/0 via-transparent to-blue-50/0 dark:from-blue-950/0 dark:via-transparent dark:to-blue-950/0 group-hover:from-blue-50/40 group-hover:to-blue-50/20 dark:group-hover:from-blue-950/20 dark:group-hover:to-blue-950/10 transition-all duration-300 pointer-events-none"></div>
                      
                      {/* Logo */}
                      {(() => {
                        const logoUrl = getBrandLogoUrl(brand.slug, brand.name, brand.logo_url);
                        return logoUrl ? (
                          <div className="mb-4 h-24 flex items-center justify-center relative z-10 bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 rounded-xl p-3 border-2 border-slate-200 dark:border-slate-700 group-hover:border-blue-400 dark:group-hover:border-blue-600 group-hover:shadow-xl dark:group-hover:shadow-blue-900/30 transition-all duration-300 group-hover:bg-gradient-to-br group-hover:from-blue-50/30 group-hover:to-white dark:group-hover:from-blue-950/20 dark:group-hover:to-slate-900">
                            {/* Subtle inner glow */}
                            <div className="absolute inset-1 rounded-lg bg-gradient-to-br from-white/50 to-transparent dark:from-white/5 dark:to-transparent group-hover:from-blue-100/30 dark:group-hover:from-blue-900/20 transition-all duration-300"></div>
                            <img
                              src={logoUrl}
                              alt={`${brand.name} logo`}
                              className="relative max-h-18 max-w-full object-contain filter drop-shadow-sm group-hover:scale-110 group-hover:drop-shadow-xl transition-all duration-300 z-10"
                              loading="lazy"
                              decoding="async"
                              fetchPriority="low"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const parent = target.parentElement;
                                if (parent) {
                                  parent.innerHTML = `<span class="text-3xl font-black text-slate-600 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400/90 transition-colors z-10 relative">${brand.name.charAt(0)}</span>`;
                                }
                              }}
                            />
                          </div>
                        ) : (
                          <div className="mb-4 h-24 flex items-center justify-center bg-gradient-to-br from-slate-100 via-slate-50 to-slate-100 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 rounded-xl relative z-10 group-hover:from-blue-100 group-hover:via-blue-50 group-hover:to-blue-100 dark:group-hover:from-blue-950/40 dark:group-hover:via-blue-900/30 dark:group-hover:to-blue-950/40 transition-all duration-300 border-2 border-slate-200/50 dark:border-slate-700/50 group-hover:border-blue-400 dark:group-hover:border-blue-600 group-hover:shadow-xl">
                            <span className="text-4xl font-black text-slate-600 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400/90 group-hover:scale-110 transition-all duration-300">
                              {brand.name.charAt(0)}
                            </span>
                          </div>
                        );
                      })()}
                      
                      {/* Brand Name */}
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400/90 transition-colors relative z-10 group-hover:translate-x-1 duration-300">
                        {brand.name}
                      </h3>
                      
                      {/* Country */}
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
                      
                      {/* Additional Info */}
                      {brand.founded_year && (
                        <div className="flex items-center gap-1.5 mb-3 relative z-10 text-xs text-slate-500 dark:text-slate-400">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="font-semibold">{brand.founded_year}</span>
                        </div>
                      )}
                      
                      {/* Content Counts - Professional & Optimized for Large Numbers */}
                      {brandCounts && brandCounts.has(brand.id) && (() => {
                        const counts = brandCounts.get(brand.id)!;
                        return (
                          <div className="mb-3">
                            {counts.faults > 0 && (
                              <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg">
                                <svg className="w-4 h-4 text-slate-600 dark:text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                  {counts.faults.toLocaleString()} Fehler
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      {/* CTA */}
                      <div className="mt-auto flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-700 relative z-10">
                        <div className="flex items-center text-slate-700 dark:text-slate-300 font-semibold text-sm group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-x-1 transition-all duration-300">
                          Modelle ansehen
                          <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </motion.div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* "Ihre Marke fehlt?" Section - Inspired by heizungs-check.org */}
        <div className="mt-16 sm:mt-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.4 }}
            className="bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 rounded-2xl p-8 sm:p-12 border-2 border-slate-200 dark:border-slate-800 shadow-lg"
          >
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white mb-4">
                Ihre Marke fehlt?
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
                Durchsuchen Sie unsere umfangreiche Datenbank für Lösungen zu allen Automarken. Auch wenn Ihre spezifische Marke noch nicht aufgeführt ist, finden Sie möglicherweise relevante Informationen in unserer Diagnose-Datenbank.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/cars"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-xl hover:scale-105 active:scale-100"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Datenbank durchsuchen
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold rounded-xl transition-all hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-lg"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Kontakt aufnehmen
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

