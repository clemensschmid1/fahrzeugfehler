'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

// Keep the same Question interface
interface Question {
  id: string;
  question: string;
  answer: string;
  sector: string;
  created_at: string;
  slug: string;
  status: 'draft' | 'live' | 'bin';
  header?: string;
  manufacturer?: string;
  part_type?: string;
  part_series?: string;
  embedding?: number[];
  language_path: string;
  complexity_level?: string;
  voltage?: string;
  current?: string;
  power_rating?: string;
  machine_type?: string;
  application_area?: string[];
  product_category?: string;
  control_type?: string;
  industry_tag?: string;
}

interface KnowledgeClientProps {
  questions: Question[];
  total: number;
  totalAvailable: number;
  page: number;
  pageSize: number;
  totalPages: number;
  sort: string;
  sector: string;
  manufacturer: string;
  complexity: string;
  partType: string;
  q: string;
  lang: string;
  filterOptions: {
    sectors: { value: string; count: number }[];
    manufacturers: { value: string; count: number }[];
    complexities: { value: string; count: number }[];
    partTypes: { value: string; count: number }[];
    voltages: { value: string; count: number }[];
    currents: { value: string; count: number }[];
    power_ratings: { value: string; count: number }[];
    machine_types: { value: string; count: number }[];
    application_areas: { value: string; count: number }[];
    product_categories: { value: string; count: number }[];
    control_types: { value: string; count: number }[];
    industry_tags: { value: string; count: number }[];
  };
  voltage: string;
  current: string;
  power_rating: string;
  machine_type: string;
  application_area: string;
  product_category: string;
  control_type: string;
  industry_tag: string;
}

// Simple skeleton component
function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-200 rounded ${className}`} />;
}

export default function KnowledgeClient({ questions, totalAvailable, page, pageSize, totalPages, sort, sector, manufacturer, complexity, partType, q, lang, filterOptions, voltage, current, power_rating, machine_type, application_area, product_category, control_type, industry_tag }: KnowledgeClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const toggleLanguage = lang === 'en' ? 'de' : 'en';
  const toggleLanguageText = lang === 'en' ? 'Deutsch' : 'English';

  const t = (en: string, de: string) => lang === 'de' ? de : en;

  // Helper to update URL params
  function updateParams(newParams: Record<string, string | number | undefined | null>, resetPage = false) {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(newParams).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') {
        params.delete(key);
      } else {
        params.set(key, String(value));
      }
    });
    if (resetPage) params.set('page', '1');
    router.push(`/${lang}/knowledge?${params.toString()}`);
  }

  // Simulate loading state (replace with real loading logic if needed)
  const loading = !questions || !filterOptions;

  // Determine active filter for summary
  const filterSummaries: { label: string; value: string; param: string }[] = [];
  if (manufacturer) filterSummaries.push({ label: t('Manufacturer', 'Hersteller'), value: manufacturer, param: 'manufacturer' });
  if (sector) filterSummaries.push({ label: t('Sector', 'Sektor'), value: sector, param: 'sector' });
  if (partType) filterSummaries.push({ label: t('Part Type', 'Teiletyp'), value: partType, param: 'partType' });
  if (complexity) filterSummaries.push({ label: t('Complexity', 'Komplexität'), value: complexity, param: 'complexity' });
  if (voltage) filterSummaries.push({ label: t('Voltage', 'Spannung'), value: voltage, param: 'voltage' });
  if (current) filterSummaries.push({ label: t('Current', 'Strom'), value: current, param: 'current' });
  if (power_rating) filterSummaries.push({ label: t('Power Rating', 'Leistung'), value: power_rating, param: 'power_rating' });
  if (machine_type) filterSummaries.push({ label: t('Machine Type', 'Maschinentyp'), value: machine_type, param: 'machine_type' });
  if (application_area) filterSummaries.push({ label: t('Application Area', 'Anwendungsbereich'), value: application_area, param: 'application_area' });
  if (product_category) filterSummaries.push({ label: t('Product Category', 'Produktkategorie'), value: product_category, param: 'product_category' });
  if (control_type) filterSummaries.push({ label: t('Control Type', 'Regelungstyp'), value: control_type, param: 'control_type' });
  if (industry_tag) filterSummaries.push({ label: t('Industry Tag', 'Industrie-Tag'), value: industry_tag, param: 'industry_tag' });
  // Add more filters as needed

  return (
    <motion.div
      className="min-h-screen bg-white font-sans"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 16 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4"
          aria-label={t("Page navigation", "Seitennavigation")}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <header>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-2 leading-tight tracking-tight" tabIndex={0} aria-label={t('Knowledge Base', 'Wissensdatenbank')}>
              {t("Knowledge Base", "Wissensdatenbank")}
            </h1>
            <span className="inline-block bg-indigo-100 text-indigo-700 text-xs font-semibold px-3 py-1 rounded-full shadow-sm mt-1" aria-hidden="true">
              {t("Knowledge Base", "Wissensdatenbank")}
            </span>
          </header>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href={`/${lang}`}
              className="inline-flex items-center px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 shadow-sm transition-colors"
              aria-label={t('Go to Home', 'Zur Startseite')}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              {t("Home", "Startseite")}
            </Link>
            <Link
              href={`/${toggleLanguage}/knowledge`}
              className="inline-flex items-center px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 shadow-sm transition-colors"
              aria-label={t('Switch language', 'Sprache wechseln')}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
              </svg>
              {toggleLanguageText}
            </Link>
            <Link
              href={`/${lang}/chat`}
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-md transition-colors"
              aria-label={t('Ask a Question', 'Frage stellen')}
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              {t("Ask a Question", "Frage stellen")}
            </Link>
          </div>
        </motion.div>

        {/* Sticky filter bar on desktop */}
        <motion.div
          className="sticky top-0 z-20 bg-white border-b border-gray-100 shadow-sm mb-8 py-4 px-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-xl"
          role="region"
          aria-label={t('Filter and sort controls', 'Filter- und Sortierleiste')}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {filterSummaries.length > 0 && (
            <div className="mb-2 flex flex-wrap items-center gap-2 text-sm">
              <span className="font-medium text-gray-700">{t('Filtered by:', 'Gefiltert nach:')}</span>
              {filterSummaries.map((f) => (
                <span key={f.param} className="inline-flex items-center bg-indigo-50 text-indigo-700 px-2 py-1 rounded-full font-semibold">
                  {f.label} = <span className="ml-1 font-bold">{f.value}</span>
                </span>
              ))}
              <button
                onClick={() => updateParams({ manufacturer: '', sector: '', partType: '', complexity: '', voltage: '', current: '', power_rating: '', machine_type: '', application_area: '', product_category: '', control_type: '', industry_tag: '' }, true)}
                className="ml-2 px-2 py-1 rounded bg-gray-100 text-gray-500 hover:bg-red-100 hover:text-red-700 text-xs font-medium transition-colors"
                aria-label={t('Reset filter', 'Filter zurücksetzen')}
              >
                {t('Reset', 'Zurücksetzen')}
              </button>
            </div>
          )}
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-sm text-gray-700 font-semibold">{t('Sort & Filter:', 'Sortieren & Filtern:')}</span>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => updateParams({ sort: 'date-desc' }, true)}
                className={`px-3 py-1 rounded-lg border text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 ${sort === 'date-desc' ? 'bg-indigo-600 text-white border-indigo-600 shadow' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                aria-pressed={sort === 'date-desc'}
                aria-label={t('Sort by newest', 'Nach neuestem sortieren')}
              >
                {t('Date (newest first)', 'Datum (neueste zuerst)')}
              </button>
              <button
                onClick={() => updateParams({ sort: 'date-asc' }, true)}
                className={`px-3 py-1 rounded-lg border text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 ${sort === 'date-asc' ? 'bg-indigo-600 text-white border-indigo-600 shadow' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                aria-pressed={sort === 'date-asc'}
                aria-label={t('Sort by oldest', 'Nach ältestem sortieren')}
              >
                {t('Date (oldest first)', 'Datum (älteste zuerst)')}
              </button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            {/* Sector dropdown */}
            <div className="relative">
              <motion.select
                value={sector || ''}
                onChange={e => updateParams({ sector: e.target.value }, true)}
                className="px-3 py-1 rounded-lg border text-sm font-medium bg-white text-gray-700 border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                aria-label={t('Filter by sector', 'Nach Sektor filtern')}
                whileTap={{ scale: 0.98 }}
                whileHover={{ scale: 1.02 }}
              >
                <option value="">{t('All Sectors', 'Alle Sektoren')}</option>
                {filterOptions.sectors.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.value} ({opt.count})</option>
                ))}
              </motion.select>
            </div>
            {/* Manufacturer dropdown */}
            <div className="relative">
              <motion.select
                value={manufacturer || ''}
                onChange={e => updateParams({ manufacturer: e.target.value }, true)}
                className="px-3 py-1 rounded-lg border text-sm font-medium bg-white text-gray-700 border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                aria-label={t('Filter by manufacturer', 'Nach Hersteller filtern')}
                whileTap={{ scale: 0.98 }}
                whileHover={{ scale: 1.02 }}
              >
                <option value="">{t('All Manufacturers', 'Alle Hersteller')}</option>
                {filterOptions.manufacturers.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.value} ({opt.count})</option>
                ))}
              </motion.select>
            </div>
            {/* Complexity dropdown */}
            <div className="relative">
              <motion.select
                value={complexity || ''}
                onChange={e => updateParams({ complexity: e.target.value }, true)}
                className="px-3 py-1 rounded-lg border text-sm font-medium bg-white text-gray-700 border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                aria-label={t('Filter by complexity', 'Nach Komplexität filtern')}
                whileTap={{ scale: 0.98 }}
                whileHover={{ scale: 1.02 }}
              >
                <option value="">{t('All Complexities', 'Alle Komplexitätsgrade')}</option>
                {filterOptions.complexities.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.value} ({opt.count})</option>
                ))}
              </motion.select>
            </div>
            {/* Part Type dropdown */}
            <div className="relative">
              <motion.select
                value={partType || ''}
                onChange={e => updateParams({ partType: e.target.value }, true)}
                className="px-3 py-1 rounded-lg border text-sm font-medium bg-white text-gray-700 border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                aria-label={t('Filter by part type', 'Nach Teiltyp filtern')}
                whileTap={{ scale: 0.98 }}
                whileHover={{ scale: 1.02 }}
              >
                <option value="">{t('All Part Types', 'Alle Teiletypen')}</option>
                {filterOptions.partTypes.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.value} ({opt.count})</option>
                ))}
              </motion.select>
            </div>
            {/* Voltage dropdown */}
            <div className="relative">
              <motion.select
                value={voltage || ''}
                onChange={e => updateParams({ voltage: e.target.value }, true)}
                className="px-3 py-1 rounded-lg border text-sm font-medium bg-white text-gray-700 border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                aria-label={t('Filter by voltage', 'Nach Spannung filtern')}
                whileTap={{ scale: 0.98 }}
                whileHover={{ scale: 1.02 }}
              >
                <option value="">{t('All Voltages', 'Alle Spannungen')}</option>
                {filterOptions.voltages.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.value} ({opt.count})</option>
                ))}
              </motion.select>
            </div>
            {/* Current dropdown */}
            <div className="relative">
              <motion.select
                value={current || ''}
                onChange={e => updateParams({ current: e.target.value }, true)}
                className="px-3 py-1 rounded-lg border text-sm font-medium bg-white text-gray-700 border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                aria-label={t('Filter by current', 'Nach Strom filtern')}
                whileTap={{ scale: 0.98 }}
                whileHover={{ scale: 1.02 }}
              >
                <option value="">{t('All Currents', 'Alle Ströme')}</option>
                {filterOptions.currents.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.value} ({opt.count})</option>
                ))}
              </motion.select>
            </div>
            {/* Power Rating dropdown */}
            <div className="relative">
              <motion.select
                value={power_rating || ''}
                onChange={e => updateParams({ power_rating: e.target.value }, true)}
                className="px-3 py-1 rounded-lg border text-sm font-medium bg-white text-gray-700 border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                aria-label={t('Filter by power rating', 'Nach Leistung filtern')}
                whileTap={{ scale: 0.98 }}
                whileHover={{ scale: 1.02 }}
              >
                <option value="">{t('All Power Ratings', 'Alle Leistungsgrade')}</option>
                {filterOptions.power_ratings.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.value} ({opt.count})</option>
                ))}
              </motion.select>
            </div>
            {/* Machine Type dropdown */}
            <div className="relative">
              <motion.select
                value={machine_type || ''}
                onChange={e => updateParams({ machine_type: e.target.value }, true)}
                className="px-3 py-1 rounded-lg border text-sm font-medium bg-white text-gray-700 border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                aria-label={t('Filter by machine type', 'Nach Maschinentyp filtern')}
                whileTap={{ scale: 0.98 }}
                whileHover={{ scale: 1.02 }}
              >
                <option value="">{t('All Machine Types', 'Alle Maschinentypen')}</option>
                {filterOptions.machine_types.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.value} ({opt.count})</option>
                ))}
              </motion.select>
            </div>
            {/* Application Area dropdown */}
            <div className="relative">
              <motion.select
                value={application_area || ''}
                onChange={e => updateParams({ application_area: e.target.value }, true)}
                className="px-3 py-1 rounded-lg border text-sm font-medium bg-white text-gray-700 border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                aria-label={t('Filter by application area', 'Nach Anwendungsbereich filtern')}
                whileTap={{ scale: 0.98 }}
                whileHover={{ scale: 1.02 }}
              >
                <option value="">{t('All Application Areas', 'Alle Anwendungsbereiche')}</option>
                {filterOptions.application_areas.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.value} ({opt.count})</option>
                ))}
              </motion.select>
            </div>
            {/* Product Category dropdown */}
            <div className="relative">
              <motion.select
                value={product_category || ''}
                onChange={e => updateParams({ product_category: e.target.value }, true)}
                className="px-3 py-1 rounded-lg border text-sm font-medium bg-white text-gray-700 border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                aria-label={t('Filter by product category', 'Nach Produktkategorie filtern')}
                whileTap={{ scale: 0.98 }}
                whileHover={{ scale: 1.02 }}
              >
                <option value="">{t('All Product Categories', 'Alle Produktkategorien')}</option>
                {filterOptions.product_categories.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.value} ({opt.count})</option>
                ))}
              </motion.select>
            </div>
            {/* Control Type dropdown */}
            <div className="relative">
              <motion.select
                value={control_type || ''}
                onChange={e => updateParams({ control_type: e.target.value }, true)}
                className="px-3 py-1 rounded-lg border text-sm font-medium bg-white text-gray-700 border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                aria-label={t('Filter by control type', 'Nach Regelungstyp filtern')}
                whileTap={{ scale: 0.98 }}
                whileHover={{ scale: 1.02 }}
              >
                <option value="">{t('All Control Types', 'Alle Regelungstypen')}</option>
                {filterOptions.control_types.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.value} ({opt.count})</option>
                ))}
              </motion.select>
            </div>
            {/* Industry Tag dropdown */}
            <div className="relative">
              <motion.select
                value={industry_tag || ''}
                onChange={e => updateParams({ industry_tag: e.target.value }, true)}
                className="px-3 py-1 rounded-lg border text-sm font-medium bg-white text-gray-700 border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                aria-label={t('Filter by industry tag', 'Nach Industrie-Tag filtern')}
                whileTap={{ scale: 0.98 }}
                whileHover={{ scale: 1.02 }}
              >
                <option value="">{t('All Industry Tags', 'Alle Industrie-Tags')}</option>
                {filterOptions.industry_tags.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.value} ({opt.count})</option>
                ))}
              </motion.select>
            </div>
            {/* Reset button */}
            <button
              onClick={() => updateParams({ sector: '', manufacturer: '', complexity: '', partType: '', voltage: '', current: '', power_rating: '', machine_type: '', application_area: '', product_category: '', control_type: '', industry_tag: '', sort: 'date-desc', q: '' }, true)}
              className="ml-2 px-3 py-1 rounded-lg border border-gray-300 bg-gray-50 text-gray-600 text-sm font-medium hover:bg-red-50 hover:text-red-700 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-red-400"
              title={t('Reset all filters', 'Alle Filter zurücksetzen')}
              aria-label={t('Reset all filters', 'Alle Filter zurücksetzen')}
            >
              {t('Reset', 'Zurücksetzen')}
            </button>
          </div>
        </motion.div>

        {/* Search bar */}
        <motion.div
          className="mb-8"
          role="search"
          aria-label={t('Search knowledge', 'Wissen durchsuchen')}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="relative max-w-md mx-auto sm:mx-0 flex items-center">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder={t("Search topics...", "Themen durchsuchen...")}
              value={q}
              onChange={(e) => updateParams({ q: e.target.value }, true)}
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
              aria-label={t('Search topics', 'Themen durchsuchen')}
            />
            <span className="ml-3 inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-indigo-600 text-white shadow" title="Total available knowledge pages" aria-label={t('Total available knowledge pages', 'Verfügbare Wissensseiten insgesamt')}>
              {totalAvailable}
            </span>
          </div>
          {q && (
            <p className="mt-2 text-sm text-gray-600">
              {t(
                `Found ${questions.length} result${questions.length !== 1 ? 's' : ''}`,
                `${questions.length} Ergebnis${questions.length !== 1 ? 'se' : ''} gefunden`
              )}
            </p>
          )}
        </motion.div>

        {/* Knowledge cards grid */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          role="list"
          aria-label={t('Knowledge results', 'Wissens-Ergebnisse')}
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.08 } },
          }}
        >
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-2xl shadow-lg p-6 flex flex-col animate-pulse">
                <Skeleton className="h-6 w-2/3 mb-3" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-5/6 mb-2" />
                <div className="flex gap-2 mt-auto pt-2">
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-5 w-20 rounded-full" />
                </div>
              </div>
            ))
          ) : questions.length > 0 ? (
            <AnimatePresence>
              {questions.map((q) => (
                <motion.div
                  key={q.id}
                  className="bg-white border border-gray-200 rounded-2xl shadow-lg p-6 flex flex-col hover:shadow-xl transition-shadow duration-200"
                  role="listitem"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 16 }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                >
                  <Link href={`/${lang}/knowledge/${q.slug}`} className="text-lg font-semibold text-indigo-700 hover:underline mb-2 truncate" aria-label={q.question} tabIndex={0}>
                    {q.question}
                  </Link>
                  <div className="text-gray-600 text-sm mb-2 line-clamp-3">{q.answer}</div>
                  <div className="flex flex-wrap gap-2 mt-auto pt-2">
                    {q.sector && <span className="inline-block bg-indigo-50 text-indigo-700 text-xs font-medium px-2 py-1 rounded-full">{q.sector}</span>}
                    {q.manufacturer && <span className="inline-block bg-gray-100 text-gray-700 text-xs font-medium px-2 py-1 rounded-full">{q.manufacturer}</span>}
                    {q.part_type && <span className="inline-block bg-gray-100 text-gray-700 text-xs font-medium px-2 py-1 rounded-full">{q.part_type}</span>}
                    {q.application_area && q.application_area.map((area) => (
                      <span key={`${q.id}-${area}`} className="inline-block bg-gray-100 text-gray-700 text-xs font-medium px-2 py-1 rounded-full">
                        {area}
                      </span>
                    ))}
                    <span className="inline-block text-gray-400 text-xs">{new Date(q.created_at).toLocaleDateString()}</span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          ) : (
            <div className="col-span-full text-center text-gray-500 py-16" role="status" aria-live="polite">
              <svg className="mx-auto mb-4 w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L6 21m0 0l-3.75-4M6 21V3m12 0v18m0 0l3.75-4M18 21l-3.75-4" />
              </svg>
              <span className="block text-lg font-semibold">{t('No results found', 'Keine Ergebnisse gefunden')}</span>
              <span className="block text-sm mt-2">{t('Try adjusting your filters or search.', 'Versuchen Sie, Ihre Filter oder die Suche zu ändern.')}</span>
            </div>
          )}
        </motion.div>

        {/* Pagination controls */}
        <div className="mt-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-wrap gap-2 items-center">
            {[30, 60, 100].map((size) => (
              <button
                key={size}
                onClick={() => updateParams({ pageSize: size }, true)}
                className={`px-3 py-1 rounded-lg border text-sm font-medium transition-colors ${pageSize === size ? 'bg-indigo-600 text-white border-indigo-600 shadow' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
              >
                {size} / {t('page', 'Seite')}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1 items-center justify-center">
            <button
              onClick={() => updateParams({ page: page - 1 })}
              className="px-3 py-1 rounded-lg border text-sm font-medium transition-colors bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              disabled={page === 1}
            >
              {t('Previous', 'Zurück')}
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).slice(Math.max(0, page - 3), Math.min(totalPages, page + 2)).map((p) => (
              <button
                key={p}
                onClick={() => updateParams({ page: p })}
                className={`px-3 py-1 rounded-lg border text-sm font-medium transition-colors ${page === p ? 'bg-indigo-600 text-white border-indigo-600 shadow' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                disabled={page === p}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => updateParams({ page: page + 1 })}
              className="px-3 py-1 rounded-lg border text-sm font-medium transition-colors bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              disabled={page === totalPages}
            >
              {t('Next', 'Weiter')}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
} 