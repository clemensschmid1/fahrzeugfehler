'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

interface HeaderSearchProps {
  lang: string;
}

interface FilterOptions {
  sectors: { value: string; count: number }[];
  manufacturers: { value: string; count: number }[];
  complexities: { value: string; count: number }[];
  partTypes: { value: string; count: number }[];
}

export default function HeaderSearch({ lang }: HeaderSearchProps) {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    sectors: [],
    manufacturers: [],
    complexities: [],
    partTypes: [],
  });
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    sector: '',
    manufacturer: '',
    complexity: '',
    partType: '',
    voltage: '',
    current: '',
    power_rating: '',
    machine_type: '',
    application_area: '',
    product_category: '',
    control_type: '',
    industry_tag: '',
  });
  const filterRef = useRef<HTMLDivElement>(null);

  const t = (en: string, de: string) => lang === 'de' ? de : en;

  const fetchFilterOptions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('lang', lang);
      if (searchInput.trim()) params.set('q', searchInput.trim());
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.set(key, value);
      });

      const response = await fetch(`/api/knowledge/filter-options?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setFilterOptions(data);
      }
    } catch (error) {
      console.error('Error fetching filter options:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch filter options when filter panel opens
  useEffect(() => {
    if (filterOpen && filterOptions.sectors.length === 0 && !loading) {
      fetchFilterOptions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterOpen]);

  // Close filter panel when clicking outside
  useEffect(() => {
    if (!filterOpen) return;
    function handleClick(e: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [filterOpen]);

  // Navigate to knowledge base with search and filters
  const navigateToKnowledge = (searchQuery?: string, newFilters?: Partial<typeof filters>) => {
    const params = new URLSearchParams();
    
    if (searchQuery !== undefined) {
      if (searchQuery.trim()) {
        params.set('q', searchQuery.trim());
      }
    } else if (searchInput.trim()) {
      params.set('q', searchInput.trim());
    }

    const activeFilters = newFilters || filters;
    Object.entries(activeFilters).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      }
    });

    const queryString = params.toString();
    router.push(`/${lang}/knowledge${queryString ? `?${queryString}` : ''}`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigateToKnowledge();
  };

  const handleFilterChange = async (key: keyof typeof filters, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    // Fetch updated options
    const params = new URLSearchParams();
    params.set('lang', lang);
    if (searchInput.trim()) params.set('q', searchInput.trim());
    Object.entries(newFilters).forEach(([k, v]) => {
      if (v) params.set(k, v);
    });
    
    try {
      const response = await fetch(`/api/knowledge/filter-options?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setFilterOptions(data);
      }
    } catch (error) {
      console.error('Error fetching updated filter options:', error);
    }
    
    // Auto-apply filters when changed
    navigateToKnowledge(searchInput, newFilters);
  };

  const resetFilters = () => {
    setFilters({
      sector: '',
      manufacturer: '',
      complexity: '',
      partType: '',
      voltage: '',
      current: '',
      power_rating: '',
      machine_type: '',
      application_area: '',
      product_category: '',
      control_type: '',
      industry_tag: '',
    });
    setSearchInput('');
    router.push(`/${lang}/knowledge`);
  };

  const activeFilterCount = Object.values(filters).filter(v => v).length;

  return (
    <div className="flex items-center gap-2 relative">
      {/* Search Bar */}
      <form onSubmit={handleSearch} className="relative flex-1 max-w-md">
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder={t('Search knowledge base...', 'Wissensdatenbank durchsuchen...')}
          className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 dark:border-white/20 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm transition-all"
        />
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <button
          type="submit"
          className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg transition-colors"
          aria-label={t('Search', 'Suchen')}
        >
          {t('Search', 'Suchen')}
        </button>
      </form>

      {/* Filter Button */}
      <div className="relative" ref={filterRef}>
        <button
          onClick={() => setFilterOpen(!filterOpen)}
          className={`relative px-4 py-2 rounded-lg border text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-red-500 ${
            filterOpen || activeFilterCount > 0
              ? 'bg-red-600 text-white border-red-600 shadow-md'
              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-white border-slate-300 dark:border-white/20 hover:bg-slate-50 dark:hover:bg-slate-700'
          }`}
          aria-label={t('Open filters', 'Filter öffnen')}
          aria-expanded={filterOpen}
        >
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            <span className="hidden sm:inline">{t('Filters', 'Filter')}</span>
            {activeFilterCount > 0 && (
              <span className="bg-white/20 text-white px-1.5 py-0.5 rounded-full text-xs font-bold">
                {activeFilterCount}
              </span>
            )}
          </div>
        </button>

        {/* Filter Panel */}
        <AnimatePresence>
          {filterOpen && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
                onClick={() => setFilterOpen(false)}
                aria-hidden="true"
              />
              {/* Panel */}
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute right-0 top-full mt-2 w-80 max-h-[80vh] overflow-y-auto bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl shadow-xl z-50 p-4"
                role="dialog"
                aria-modal="true"
                aria-label={t('Filter options', 'Filteroptionen')}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    {t('Filter & Sort', 'Filtern & Sortieren')}
                  </h3>
                  <button
                    onClick={() => setFilterOpen(false)}
                    className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                    aria-label={t('Close filters', 'Filter schließen')}
                  >
                    <svg className="w-5 h-5 text-slate-600 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-3">
                  {loading && (
                    <div className="text-center py-4 text-slate-500 dark:text-slate-400 text-sm">
                      {t('Loading filters...', 'Filter werden geladen...')}
                    </div>
                  )}

                  {/* Sector */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      {t('Sector', 'Sektor')}
                    </label>
                    <select
                      value={filters.sector}
                      onChange={(e) => handleFilterChange('sector', e.target.value)}
                      disabled={loading}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-white/20 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                    >
                      <option value="">{t('All Sectors', 'Alle Sektoren')}</option>
                      {filterOptions.sectors.map(opt => (
                        <option key={opt.value} value={opt.value}>
                          {opt.value} ({opt.count})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Manufacturer */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      {t('Manufacturer', 'Hersteller')}
                    </label>
                    <select
                      value={filters.manufacturer}
                      onChange={(e) => handleFilterChange('manufacturer', e.target.value)}
                      disabled={loading}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-white/20 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                    >
                      <option value="">{t('All Manufacturers', 'Alle Hersteller')}</option>
                      {filterOptions.manufacturers.map(opt => (
                        <option key={opt.value} value={opt.value}>
                          {opt.value} ({opt.count})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Complexity */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      {t('Complexity', 'Komplexität')}
                    </label>
                    <select
                      value={filters.complexity}
                      onChange={(e) => handleFilterChange('complexity', e.target.value)}
                      disabled={loading}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-white/20 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                    >
                      <option value="">{t('All Complexities', 'Alle Komplexitätsgrade')}</option>
                      {filterOptions.complexities.map(opt => (
                        <option key={opt.value} value={opt.value}>
                          {opt.value} ({opt.count})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Part Type */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      {t('Part Type', 'Teiletyp')}
                    </label>
                    <select
                      value={filters.partType}
                      onChange={(e) => handleFilterChange('partType', e.target.value)}
                      disabled={loading}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-white/20 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                    >
                      <option value="">{t('All Part Types', 'Alle Teiletypen')}</option>
                      {filterOptions.partTypes.map(opt => (
                        <option key={opt.value} value={opt.value}>
                          {opt.value} ({opt.count})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Quick link to knowledge base for full filtering */}
                  <div className="pt-3 border-t border-slate-200 dark:border-white/10">
                    <Link
                      href={`/${lang}/knowledge`}
                      className="block w-full text-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition-colors"
                      onClick={() => setFilterOpen(false)}
                    >
                      {t('View Full Filters', 'Alle Filter anzeigen')}
                    </Link>
                  </div>

                  {/* Reset Button */}
                  {activeFilterCount > 0 && (
                    <button
                      onClick={resetFilters}
                      className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      {t('Reset Filters', 'Filter zurücksetzen')}
                    </button>
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

