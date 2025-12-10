'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useState, useMemo, useEffect } from 'react';
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
  lang: string;
  stats?: {
    totalModels: number;
    totalFaults: number;
    totalManuals: number;
  };
  brandCounts?: Map<string, { faults: number; manuals: number }>;
};

type FilterType = 'all' | 'featured' | 'country';
type SortType = 'alphabetical' | 'featured' | 'country';

export default function CarsClient({ brands, lang, stats, brandCounts }: CarsClientProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [sortType, setSortType] = useState<SortType>('featured');
  const [selectedCountry, setSelectedCountry] = useState<string>('all');
  const [recentlyViewed, setRecentlyViewed] = useState<ReturnType<typeof getVisitedCarPages>>([]);
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = (en: string, de: string) => lang === 'de' ? de : en;

  // Load recently viewed pages
  useEffect(() => {
    const visited = getVisitedCarPages().filter(page => page.lang === lang);
    setRecentlyViewed(visited);
  }, [lang]);

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

  // Separate featured and regular brands for display
  const featuredBrands = filteredBrands.filter(b => b.is_featured);
  const regularBrands = filteredBrands.filter(b => !b.is_featured);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Search is handled by state, no need to navigate
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black font-sans">
      {/* Hero Section - Modern Premium Design */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-black dark:via-slate-950 dark:to-black">
        {/* Animated background pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.02%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%221%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-40"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto"
          >
            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black text-white mb-6 tracking-tight leading-tight">
              {t('Car Maintenance & Repair', 'Auto-Wartung & Reparatur')}
            </h1>
            <p className="text-lg sm:text-xl lg:text-2xl text-slate-300 dark:text-slate-400 mb-10 leading-relaxed">
              {t(
                'Find step-by-step guides, fault solutions, and maintenance manuals for your exact car model and generation.',
                'Finden Sie Schritt-für-Schritt-Anleitungen, Fehlerlösungen und Wartungshandbücher für Ihr genaues Automodell und Generation.'
              )}
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
                <div className="relative flex items-center bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 overflow-hidden focus-within:border-slate-300 dark:focus-within:border-slate-700 focus-within:shadow-xl transition-all duration-300">
                  <div className="pl-6 pr-2">
                    <svg className="w-6 h-6 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder={t('Search by brand, model, or fault...', 'Nach Marke, Modell oder Fehler suchen...')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 px-4 py-5 text-base sm:text-lg bg-transparent text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none"
                  />
                  {searchQuery && (
                    <motion.button
                      type="button"
                      onClick={clearSearch}
                      className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                      aria-label={t('Clear search', 'Suche löschen')}
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
                    className="px-6 sm:px-8 py-5 bg-slate-900 dark:bg-slate-800 text-white font-semibold hover:bg-slate-800 dark:hover:bg-slate-700 transition-all flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <span className="hidden sm:inline">{t('Search', 'Suchen')}</span>
                  </button>
                </div>
              </div>
            </motion.form>

            {/* Professional Stats - Optimized for Large Numbers */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6 max-w-5xl mx-auto text-center">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white/10 dark:bg-white/5 backdrop-blur-md rounded-xl p-5 sm:p-6 border border-white/20 dark:border-white/10 hover:border-white/30 dark:hover:border-white/20 transition-all shadow-lg hover:shadow-xl"
              >
                <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-white mb-2 leading-tight">{brands.length.toLocaleString()}</div>
                <div className="text-xs sm:text-sm font-semibold text-white/90 uppercase tracking-wide">{t('Car Brands', 'Automarken')}</div>
                <div className="text-xs text-white/70 mt-1">{t('Available', 'Verfügbar')}</div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="bg-white/10 dark:bg-white/5 backdrop-blur-md rounded-xl p-5 sm:p-6 border border-white/20 dark:border-white/10 hover:border-white/30 dark:hover:border-white/20 transition-all shadow-lg hover:shadow-xl"
              >
                <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-white mb-2 leading-tight">{(stats?.totalModels || 0).toLocaleString()}</div>
                <div className="text-xs sm:text-sm font-semibold text-white/90 uppercase tracking-wide">{t('Car Models', 'Automodelle')}</div>
                <div className="text-xs text-white/70 mt-1">{t('Total', 'Gesamt')}</div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white/10 dark:bg-white/5 backdrop-blur-md rounded-xl p-5 sm:p-6 border border-white/20 dark:border-white/10 hover:border-white/30 dark:hover:border-white/20 transition-all shadow-lg hover:shadow-xl"
              >
                <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-white mb-2 leading-tight">{(stats?.totalFaults || 0).toLocaleString()}</div>
                <div className="text-xs sm:text-sm font-semibold text-white/90 uppercase tracking-wide">{t('Fault Solutions', 'Fehlerlösungen')}</div>
                <div className="text-xs text-white/70 mt-1">{t('Verified', 'Verifiziert')}</div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="bg-white/10 dark:bg-white/5 backdrop-blur-md rounded-xl p-5 sm:p-6 border border-white/20 dark:border-white/10 hover:border-white/30 dark:hover:border-white/20 transition-all shadow-lg hover:shadow-xl"
              >
                <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-white mb-2 leading-tight">{(stats?.totalManuals || 0).toLocaleString()}</div>
                <div className="text-xs sm:text-sm font-semibold text-white/90 uppercase tracking-wide">{t('Manuals', 'Anleitungen')}</div>
                <div className="text-xs text-white/70 mt-1">{t('Step-by-Step', 'Schritt-für-Schritt')}</div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white/10 dark:bg-white/5 backdrop-blur-md rounded-xl p-5 sm:p-6 border border-white/20 dark:border-white/10 hover:border-white/30 dark:hover:border-white/20 transition-all shadow-lg hover:shadow-xl"
              >
                <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-white mb-2 leading-tight">{countries.length.toLocaleString()}</div>
                <div className="text-xs sm:text-sm font-semibold text-white/90 uppercase tracking-wide">{t('Countries', 'Länder')}</div>
                <div className="text-xs text-white/70 mt-1">{t('Worldwide', 'Weltweit')}</div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {/* Recently Viewed Section */}
        {recentlyViewed.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mb-2">
                  {t('Recently Viewed', 'Zuletzt angeschaut')}
                </h2>
                <p className="text-slate-600 dark:text-slate-400 text-sm">
                  {t('Continue where you left off', 'Setzen Sie dort fort, wo Sie aufgehört haben')}
                </p>
              </div>
              <button
                onClick={() => {
                  clearVisitedCarPages();
                  setRecentlyViewed([]);
                }}
                className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                title={t('Clear history', 'Verlauf löschen')}
              >
                {t('Clear', 'Löschen')}
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
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
                    <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-xl p-4 border-2 border-slate-200 dark:border-slate-700 hover:border-red-400 dark:hover:border-red-600 transition-all duration-200 h-full flex flex-col">
                      {/* Type badge */}
                      <div className="mb-2">
                        <span className={`inline-block px-2 py-0.5 text-xs font-bold rounded ${
                          page.type === 'fault' 
                            ? 'bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-400' 
                            : 'bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400'
                        }`}>
                          {page.type === 'fault' ? t('Fault', 'Fehler') : t('Manual', 'Anleitung')}
                        </span>
                      </div>
                      
                      {/* Title */}
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2 line-clamp-2 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                        {page.title}
                      </h3>
                      
                      {/* Brand/Model info */}
                      <div className="mt-auto text-xs text-slate-500 dark:text-slate-400 space-y-0.5">
                        <p className="font-semibold">{page.brand}</p>
                        <p>{page.model} {page.generation}</p>
                      </div>
                      
                      {/* Arrow indicator */}
                      <div className="mt-2 flex items-center text-red-600 dark:text-red-400 text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                        {t('View', 'Ansehen')}
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
        <div className="sticky top-0 z-20 bg-white dark:bg-black border-b border-slate-200 dark:border-slate-800 mb-8 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-4 backdrop-blur-sm">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            {/* Results count */}
            <div className="text-sm font-semibold text-slate-600 dark:text-slate-400">
              {filteredBrands.length === 0 ? (
                t('No brands found', 'Keine Marken gefunden')
              ) : (
                <>
                  {filteredBrands.length.toLocaleString()} {filteredBrands.length === 1 ? t('brand', 'Marke') : t('brands', 'Marken')}
                </>
              )}
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Filter Type */}
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                  {t('Filter', 'Filter')}:
                </label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as FilterType)}
                  className="px-3 py-1.5 rounded-lg border text-xs font-semibold bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-400 dark:focus:ring-slate-600 transition-all"
                >
                  <option value="all">{t('All', 'Alle')}</option>
                  <option value="featured">{t('Featured', 'Beliebt')}</option>
                </select>
              </div>

              {/* Country Filter */}
              {countries.length > 0 && (
                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                    {t('Country', 'Land')}:
                  </label>
                  <select
                    value={selectedCountry}
                    onChange={(e) => setSelectedCountry(e.target.value)}
                    className="px-3 py-1.5 rounded-lg border text-xs font-semibold bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-400 dark:focus:ring-slate-600 transition-all"
                  >
                    <option value="all">{t('All Countries', 'Alle Länder')}</option>
                    {countries.map(country => (
                      <option key={country} value={country}>{country}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Sort */}
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                  {t('Sort', 'Sortieren')}:
                </label>
                <select
                  value={sortType}
                  onChange={(e) => setSortType(e.target.value as SortType)}
                  className="px-3 py-1.5 rounded-lg border text-xs font-semibold bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-400 dark:focus:ring-slate-600 transition-all"
                >
                  <option value="featured">{t('Featured First', 'Beliebt zuerst')}</option>
                  <option value="alphabetical">{t('A-Z', 'A-Z')}</option>
                  <option value="country">{t('By Country', 'Nach Land')}</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Featured Brands */}
        {featuredBrands.length > 0 && (
          <div className="mb-16">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white mb-2">
                  {t('Featured Brands', 'Empfohlene Marken')}
                </h2>
                <p className="text-slate-600 dark:text-slate-400 text-sm">
                  {t('Selected car brands with comprehensive content', 'Ausgewählte Automarken mit umfassendem Inhalt')}
                </p>
              </div>
              {regularBrands.length > 0 && (
                <Link
                  href="#all-brands"
                  className="text-red-600 dark:text-red-400 font-semibold hover:underline flex items-center gap-1 transition-colors"
                >
                  {t('View All', 'Alle anzeigen')}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {featuredBrands.map((brand, index) => (
                <motion.div
                  key={brand.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                >
                  <Link
                    href={`/${lang}/cars/${brand.slug}`}
                    className="group block h-full"
                  >
                    <motion.div 
                      className="group relative bg-white dark:bg-slate-900 rounded-lg p-6 shadow-sm dark:shadow-lg hover:shadow-md dark:hover:shadow-xl transition-all duration-300 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 h-full flex flex-col"
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      
                      {/* Featured badge - only show if actually popular (has significant content) */}
                      {false && (
                        <div className="absolute top-3 right-3 z-20">
                          <span className="px-2 py-1 bg-red-600 text-white text-xs font-bold rounded-full">
                            {t('Popular', 'Beliebt')}
                          </span>
                        </div>
                      )}
                      
                      {/* Logo */}
                      {(() => {
                        const logoUrl = getBrandLogoUrl(brand.slug, brand.name, brand.logo_url);
                        return logoUrl ? (
                          <div className="mb-4 h-32 flex items-center justify-center relative z-10 bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 rounded-xl p-4 border-2 border-slate-200 dark:border-slate-700 group-hover:border-red-400 dark:group-hover:border-red-600 group-hover:shadow-lg dark:group-hover:shadow-red-900/20 transition-all duration-300">
                            {/* Subtle inner glow */}
                            <div className="absolute inset-1 rounded-lg bg-gradient-to-br from-white/50 to-transparent dark:from-white/5 dark:to-transparent"></div>
                            <img
                              src={logoUrl}
                              alt={`${brand.name} logo`}
                              className="relative max-h-24 max-w-full object-contain filter drop-shadow-md group-hover:scale-110 group-hover:drop-shadow-lg transition-all duration-300"
                              loading="lazy"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const parent = target.parentElement;
                                if (parent) {
                                  parent.innerHTML = `<span class="text-4xl font-black text-red-600 dark:text-red-400/90">${brand.name.charAt(0)}</span>`;
                                }
                              }}
                            />
                          </div>
                        ) : (
                          <div className="mb-4 h-32 flex items-center justify-center bg-gradient-to-br from-red-100 via-red-50 to-red-100 dark:from-red-950/40 dark:via-red-900/30 dark:to-red-950/40 rounded-xl relative z-10 group-hover:from-red-200 group-hover:via-red-100 group-hover:to-red-200 dark:group-hover:from-red-900/50 dark:group-hover:via-red-800/40 dark:group-hover:to-red-900/50 transition-all duration-300 border-2 border-red-200/50 dark:border-red-900/30 group-hover:border-red-300 dark:group-hover:border-red-700 group-hover:shadow-lg">
                            <span className="text-5xl font-black text-red-600 dark:text-red-400/90 group-hover:scale-110 transition-transform duration-300">
                              {brand.name.charAt(0)}
                            </span>
                          </div>
                        );
                      })()}
                      
                      {/* Brand Name */}
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors relative z-10">
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
                                  {counts.faults.toLocaleString()} {t('Faults', 'Fehler')}
                                </span>
                                {counts.manuals > 0 && (
                                  <span className="text-xs text-slate-500 dark:text-slate-400 ml-auto">
                                    + {counts.manuals.toLocaleString()} {t('Manuals', 'Anleitungen')}
                                  </span>
                                )}
                              </div>
                            )}
                            {counts.faults === 0 && counts.manuals > 0 && (
                              <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg">
                                <svg className="w-4 h-4 text-slate-600 dark:text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{counts.manuals.toLocaleString()} {t('Manuals', 'Anleitungen')}</span>
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      {/* CTA */}
                      <div className="mt-auto flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-700">
                        <div className="flex items-center text-slate-700 dark:text-slate-300 font-semibold text-sm group-hover:text-slate-900 dark:group-hover:text-white group-hover:translate-x-1 transition-all">
                          {t('Browse Models', 'Modelle durchsuchen')}
                          <svg className="w-4 h-4 ml-1 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
                          <span className="font-semibold">{t('Featured', 'Empfohlen')}</span>
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
          <div className="mb-8">
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white mb-2">
              {t('All Car Brands', 'Alle Automarken')}
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm">
              {t('Browse all available car brands', 'Alle verfügbaren Automarken durchsuchen')}
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
                  {t('No brands found', 'Keine Marken gefunden')}
                </h3>
                <p className="text-slate-600 dark:text-slate-400 mb-6">
                  {t(
                    'Try adjusting your search or filters to find what you\'re looking for.',
                    'Versuchen Sie, Ihre Suche oder Filter anzupassen, um zu finden, wonach Sie suchen.'
                  )}
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setFilterType('all');
                    setSelectedCountry('all');
                    setSortType('featured');
                  }}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  {t('Clear Filters', 'Filter zurücksetzen')}
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {regularBrands.map((brand, index) => (
                <motion.div
                  key={brand.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: (featuredBrands.length + index) * 0.03 }}
                >
                  <Link
                    href={`/${lang}/cars/${brand.slug}`}
                    className="group block h-full"
                  >
                    <div className="bg-white dark:bg-slate-900 rounded-lg p-6 shadow-sm dark:shadow-md hover:shadow-md dark:hover:shadow-lg transition-all duration-200 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 h-full flex flex-col">
                      
                      {/* Logo */}
                      {(() => {
                        const logoUrl = getBrandLogoUrl(brand.slug, brand.name, brand.logo_url);
                        return logoUrl ? (
                          <div className="mb-4 h-24 flex items-center justify-center relative z-10 bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 rounded-xl p-3 border-2 border-slate-200 dark:border-slate-700 group-hover:border-red-400 dark:group-hover:border-red-600 group-hover:shadow-md dark:group-hover:shadow-red-900/20 transition-all duration-300">
                            {/* Subtle inner glow */}
                            <div className="absolute inset-1 rounded-lg bg-gradient-to-br from-white/50 to-transparent dark:from-white/5 dark:to-transparent"></div>
                            <img
                              src={logoUrl}
                              alt={`${brand.name} logo`}
                              className="relative max-h-18 max-w-full object-contain filter drop-shadow-sm group-hover:scale-105 group-hover:drop-shadow-md transition-all duration-300"
                              loading="lazy"
                              decoding="async"
                              fetchPriority="low"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const parent = target.parentElement;
                                if (parent) {
                                  parent.innerHTML = `<span class="text-3xl font-black text-slate-600 dark:text-slate-300 group-hover:text-red-600 dark:group-hover:text-red-400/90 transition-colors">${brand.name.charAt(0)}</span>`;
                                }
                              }}
                            />
                          </div>
                        ) : (
                          <div className="mb-4 h-24 flex items-center justify-center bg-gradient-to-br from-slate-100 via-slate-50 to-slate-100 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 rounded-xl relative z-10 group-hover:from-red-100 group-hover:via-red-50 group-hover:to-red-100 dark:group-hover:from-red-950/40 dark:group-hover:via-red-900/30 dark:group-hover:to-red-950/40 transition-all duration-300 border-2 border-slate-200/50 dark:border-slate-700/50 group-hover:border-red-300 dark:group-hover:border-red-700 group-hover:shadow-md">
                            <span className="text-4xl font-black text-slate-600 dark:text-slate-300 group-hover:text-red-600 dark:group-hover:text-red-400/90 group-hover:scale-110 transition-all duration-300">
                              {brand.name.charAt(0)}
                            </span>
                          </div>
                        );
                      })()}
                      
                      {/* Brand Name */}
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 group-hover:text-red-600 dark:group-hover:text-red-400/90 transition-colors relative z-10">
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
                                  {counts.faults.toLocaleString()} {t('Faults', 'Fehler')}
                                </span>
                                {counts.manuals > 0 && (
                                  <span className="text-xs text-slate-500 dark:text-slate-400 ml-auto">
                                    + {counts.manuals.toLocaleString()} {t('Manuals', 'Anleitungen')}
                                  </span>
                                )}
                              </div>
                            )}
                            {counts.faults === 0 && counts.manuals > 0 && (
                              <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg">
                                <svg className="w-4 h-4 text-slate-600 dark:text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{counts.manuals.toLocaleString()} {t('Manuals', 'Anleitungen')}</span>
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      {/* CTA */}
                      <div className="mt-auto flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-700">
                        <div className="flex items-center text-slate-700 dark:text-slate-300 font-semibold text-sm group-hover:text-slate-900 dark:group-hover:text-white group-hover:translate-x-1 transition-all">
                          {t('View Models', 'Modelle ansehen')}
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

