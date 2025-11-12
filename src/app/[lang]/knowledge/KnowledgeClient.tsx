'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

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
  manufacturer_mentions?: string[];
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
  _similarity?: number; // Added for similarity sort
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
  referenceQuestion?: Question;
  similarityMode?: boolean;
  similaritySort?: string;
}

// Simple skeleton component
function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-200 rounded ${className}`} />;
}

export default function KnowledgeClient({ questions, totalAvailable, page, pageSize, totalPages, sort, sector, manufacturer, complexity, partType, q, lang, filterOptions, voltage, current, power_rating, machine_type, application_area, product_category, control_type, industry_tag, referenceQuestion, similarityMode, similaritySort }: KnowledgeClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [filterOpen, setFilterOpen] = useState(false);
  const [searchInput, setSearchInput] = useState(q || '');

  const toggleLanguage = lang === 'en' ? 'de' : 'en';
  const toggleLanguageText = lang === 'en' ? 'English' : 'Deutsch';

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

  // Helper to highlight search term in a string
  function highlightText(text: string, term: string) {
    if (!term) return text;
    try {
      const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
      return text.split(regex).map((part, i) =>
        regex.test(part)
          ? <mark key={i} style={{ background: '#fef08a', fontWeight: 700 }}>{part}</mark>
          : part
      );
    } catch {
      return text;
    }
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

  // Show reference question banner if in similarity mode
  const showReferenceBanner = similarityMode && referenceQuestion;

  // If in similarity mode, sort questions by similaritySort
  let sortedQuestions = questions;
  if (similarityMode) {
    sortedQuestions = [...questions].sort((a, b) => {
      if (similaritySort === 'asc') return (a._similarity ?? -1) - (b._similarity ?? -1);
      return (b._similarity ?? -1) - (a._similarity ?? -1);
    });
  }

  return (
    <motion.div
      className="min-h-screen bg-white dark:bg-black font-sans relative"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 16 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 pt-20 sm:pt-24">
        {showReferenceBanner && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex-1">
              <div className="text-xs text-red-700 dark:text-red-400 font-black uppercase tracking-wider mb-1">{t('Sorting by similarity to:', 'Sortiert nach Ähnlichkeit zu:')}</div>
              <div className="text-base sm:text-lg font-black text-black dark:text-white">{referenceQuestion?.header || referenceQuestion?.question}</div>
              <div className="text-slate-600 dark:text-slate-400 text-sm mt-1 line-clamp-2">{referenceQuestion?.question}</div>
            </div>
            <Link href={`/${lang}/knowledge/${referenceQuestion?.slug}`} className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-sm font-bold mt-2 sm:mt-0 underline" style={{whiteSpace: 'nowrap'}}>
              {t('View page', 'Seite ansehen')}
            </Link>
          </div>
        )}
        {/* Similarity sort controls */}
        {similarityMode && (
          <div className="mb-4 flex gap-2 items-center">
            <span className="text-xs font-black text-black dark:text-white uppercase tracking-wider">{t('Sort by similarity:', 'Nach Ähnlichkeit sortieren:')}</span>
            <button
              onClick={() => updateParams({ similaritySort: 'desc' }, false)}
              className={`px-3 py-1.5 rounded-lg border-2 text-xs font-bold transition-all focus:outline-none focus:ring-4 focus:ring-red-500/20 ${similaritySort === 'desc' ? 'bg-red-600 dark:bg-red-500 text-white border-red-600 dark:border-red-500 shadow-lg' : 'bg-white dark:bg-black text-black dark:text-white border-black/10 dark:border-white/20 hover:border-red-500 dark:hover:border-red-500'}`}
              aria-pressed={similaritySort === 'desc'}
            >
              {t('Highest', 'Höchste')}
            </button>
            <button
              onClick={() => updateParams({ similaritySort: 'asc' }, false)}
              className={`px-3 py-1.5 rounded-lg border-2 text-xs font-bold transition-all focus:outline-none focus:ring-4 focus:ring-red-500/20 ${similaritySort === 'asc' ? 'bg-red-600 dark:bg-red-500 text-white border-red-600 dark:border-red-500 shadow-lg' : 'bg-white dark:bg-black text-black dark:text-white border-black/10 dark:border-white/20 hover:border-red-500 dark:hover:border-red-500'}`}
              aria-pressed={similaritySort === 'asc'}
            >
              {t('Lowest', 'Niedrigste')}
            </button>
          </div>
        )}
        <motion.div
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4 relative z-10"
          aria-label={t("Page navigation", "Seitennavigation")}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
        <header className="mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-black dark:text-white mb-3 sm:mb-4 leading-tight tracking-tight" tabIndex={0} aria-label={t('Knowledge Base', 'Wissensdatenbank')}>
            {t("Knowledge Hub", "Wissenszentrum")}
          </h1>
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 mb-6">
            {t("Browse solutions for industrial automation faults", "Durchsuchen Sie Lösungen für industrielle Automatisierungsfehler")}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={`/${lang}/chat`}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 dark:bg-red-500 text-white rounded-lg font-bold hover:bg-red-700 dark:hover:bg-red-600 transition-all duration-200 shadow-lg hover:shadow-xl"
              aria-label={t('Ask a Question', 'Frage stellen')}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              {t("Diagnose Now", "Jetzt diagnostizieren")}
            </Link>
          </div>
        </header>
        </motion.div>

        {/* Mobile: Sticky collapsed filter bar */}
        <div className="sm:hidden sticky top-0 z-30 relative mb-6">
          <div className="bg-white dark:bg-black border-2 border-black/10 dark:border-white/20 py-3 px-3 flex items-center justify-between gap-2 rounded-lg">
            <div className="flex flex-wrap items-center gap-2 overflow-x-auto">
              <span className="font-black text-black dark:text-white text-xs uppercase tracking-wider">{t('Filters', 'Filter')}</span>
              {filterSummaries.length > 0 && (
                <div className="flex flex-wrap items-center gap-1 text-xs">
                  {filterSummaries.map((f) => (
                    <span key={f.param} className="inline-flex items-center bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 px-2 py-0.5 rounded-lg font-bold border border-red-200 dark:border-red-800">
                      {f.label}: <span className="ml-1">{f.value}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={() => setFilterOpen(true)}
              className="ml-auto px-3 py-1.5 rounded-lg border-2 border-black/10 dark:border-white/20 bg-white dark:bg-black text-black dark:text-white text-xs font-bold hover:border-red-500 dark:hover:border-red-500 focus:outline-none focus:ring-4 focus:ring-red-500/20 transition-all"
              aria-label={t('Open sort and filter menu', 'Sortier- und Filtermenü öffnen')}
              aria-expanded={filterOpen}
            >
              <svg className="w-4 h-4 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" /></svg>
              {t('Show', 'Anzeigen')}
            </button>
          </div>
          {/* Slide-down filter panel */}
          {filterOpen && (
            <div className="fixed inset-0 z-40 bg-black bg-opacity-30" onClick={() => setFilterOpen(false)} aria-label={t('Close filter overlay', 'Filter-Overlay schließen')}></div>
          )}
          <AnimatePresence>
            {filterOpen && (
              <motion.div
                className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-black border-b-2 border-black/10 dark:border-white/20 shadow-xl p-4 rounded-b-lg backdrop-blur-sm"
                initial={{ y: -100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -100, opacity: 0 }}
                transition={{ duration: 0.25 }}
                role="dialog"
                aria-modal="true"
                aria-label={t('Sort and filter menu', 'Sortier- und Filtermenü')}
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="font-black text-lg text-black dark:text-white uppercase tracking-wider">{t('Sort & Filter', 'Sortieren & Filtern')}</span>
                  <button
                    onClick={() => setFilterOpen(false)}
                    className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 focus:outline-none focus:ring-4 focus:ring-red-500/20 transition-colors"
                    aria-label={t('Close sort and filter menu', 'Sortier- und Filtermenü schließen')}
                  >
                    <svg className="w-6 h-6 text-black dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
                {/* --- All filter/sort controls (copied from desktop, but vertical) --- */}
                <div className="flex flex-col gap-4">
                  {/* Sort buttons */}
                  <div className="flex gap-2 mb-3">
                    <button
                      onClick={() => { updateParams({ sort: 'date-desc' }, true); setFilterOpen(false); }}
                      className={`flex-1 px-3 py-2 rounded-lg border-2 text-xs font-bold transition-all focus:outline-none focus:ring-4 focus:ring-red-500/20 ${sort === 'date-desc' ? 'bg-red-600 dark:bg-red-500 text-white border-red-600 dark:border-red-500 shadow-lg' : 'bg-white dark:bg-black text-black dark:text-white border-black/10 dark:border-white/20 hover:border-red-500 dark:hover:border-red-500'}`}
                      aria-pressed={sort === 'date-desc'}
                    >
                      {t('Newest', 'Neueste')}
                    </button>
                    <button
                      onClick={() => { updateParams({ sort: 'date-asc' }, true); setFilterOpen(false); }}
                      className={`flex-1 px-3 py-2 rounded-lg border-2 text-xs font-bold transition-all focus:outline-none focus:ring-4 focus:ring-red-500/20 ${sort === 'date-asc' ? 'bg-red-600 dark:bg-red-500 text-white border-red-600 dark:border-red-500 shadow-lg' : 'bg-white dark:bg-black text-black dark:text-white border-black/10 dark:border-white/20 hover:border-red-500 dark:hover:border-red-500'}`}
                      aria-pressed={sort === 'date-asc'}
                    >
                      {t('Oldest', 'Älteste')}
                    </button>
                  </div>
                  {/* All dropdowns, stacked */}
                  <div className="grid grid-cols-1 gap-2">
                    {/* Repeat all dropdowns vertically, same as desktop but full width */}
                    {/* Sector dropdown */}
                    <select
                      value={sector || ''}
                      onChange={e => { updateParams({ sector: e.target.value }, true); setFilterOpen(false); }}
                      className="w-full px-3 py-2 rounded-lg border-2 text-xs font-bold bg-white dark:bg-black text-black dark:text-white border-black/10 dark:border-white/20 focus:outline-none focus:ring-4 focus:ring-red-500/20 transition-all"
                      aria-label={t('Filter by sector', 'Nach Sektor filtern')}
                    >
                      <option value="">{t('All Sectors', 'Alle Sektoren')}</option>
                      {filterOptions.sectors.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.value} ({opt.count})</option>
                      ))}
                    </select>
                    {/* Manufacturer dropdown */}
                    <select
                      value={manufacturer || ''}
                      onChange={e => { updateParams({ manufacturer: e.target.value }, true); setFilterOpen(false); }}
                      className="w-full px-3 py-2 rounded-lg border-2 text-xs font-bold bg-white dark:bg-black text-black dark:text-white border-black/10 dark:border-white/20 focus:outline-none focus:ring-4 focus:ring-red-500/20 transition-all"
                      aria-label={t('Filter by manufacturer', 'Nach Hersteller filtern')}
                    >
                      <option value="">{t('All Manufacturers', 'Alle Hersteller')}</option>
                      {filterOptions.manufacturers.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.value} ({opt.count})</option>
                      ))}
                    </select>
                    {/* Complexity dropdown */}
                    <select
                      value={complexity || ''}
                      onChange={e => { updateParams({ complexity: e.target.value }, true); setFilterOpen(false); }}
                      className="w-full px-3 py-2 rounded-lg border-2 text-xs font-bold bg-white dark:bg-black text-black dark:text-white border-black/10 dark:border-white/20 focus:outline-none focus:ring-4 focus:ring-red-500/20 transition-all"
                      aria-label={t('Filter by complexity', 'Nach Komplexität filtern')}
                    >
                      <option value="">{t('All Complexities', 'Alle Komplexitätsgrade')}</option>
                      {filterOptions.complexities.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.value} ({opt.count})</option>
                      ))}
                    </select>
                    {/* Part Type dropdown */}
                    <select
                      value={partType || ''}
                      onChange={e => { updateParams({ partType: e.target.value }, true); setFilterOpen(false); }}
                      className="w-full px-3 py-2 rounded-lg border-2 text-xs font-bold bg-white dark:bg-black text-black dark:text-white border-black/10 dark:border-white/20 focus:outline-none focus:ring-4 focus:ring-red-500/20 transition-all"
                      aria-label={t('Filter by part type', 'Nach Teiltyp filtern')}
                    >
                      <option value="">{t('All Part Types', 'Alle Teiletypen')}</option>
                      {filterOptions.partTypes.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.value} ({opt.count})</option>
                      ))}
                    </select>
                    {/* Voltage dropdown */}
                    <select
                      value={voltage || ''}
                      onChange={e => { updateParams({ voltage: e.target.value }, true); setFilterOpen(false); }}
                      className="w-full px-3 py-2 rounded-lg border-2 text-xs font-bold bg-white dark:bg-black text-black dark:text-white border-black/10 dark:border-white/20 focus:outline-none focus:ring-4 focus:ring-red-500/20 transition-all"
                      aria-label={t('Filter by voltage', 'Nach Spannung filtern')}
                    >
                      <option value="">{t('All Voltages', 'Alle Spannungen')}</option>
                      {filterOptions.voltages.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.value} ({opt.count})</option>
                      ))}
                    </select>
                    {/* Current dropdown */}
                    <select
                      value={current || ''}
                      onChange={e => { updateParams({ current: e.target.value }, true); setFilterOpen(false); }}
                      className="w-full px-3 py-2 rounded-lg border-2 text-xs font-bold bg-white dark:bg-black text-black dark:text-white border-black/10 dark:border-white/20 focus:outline-none focus:ring-4 focus:ring-red-500/20 transition-all"
                      aria-label={t('Filter by current', 'Nach Strom filtern')}
                    >
                      <option value="">{t('All Currents', 'Alle Ströme')}</option>
                      {filterOptions.currents.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.value} ({opt.count})</option>
                      ))}
                    </select>
                    {/* Power Rating dropdown */}
                    <select
                      value={power_rating || ''}
                      onChange={e => { updateParams({ power_rating: e.target.value }, true); setFilterOpen(false); }}
                      className="w-full px-3 py-2 rounded-lg border-2 text-xs font-bold bg-white dark:bg-black text-black dark:text-white border-black/10 dark:border-white/20 focus:outline-none focus:ring-4 focus:ring-red-500/20 transition-all"
                      aria-label={t('Filter by power rating', 'Nach Leistung filtern')}
                    >
                      <option value="">{t('All Power Ratings', 'Alle Leistungsgrade')}</option>
                      {filterOptions.power_ratings.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.value} ({opt.count})</option>
                      ))}
                    </select>
                    {/* Machine Type dropdown */}
                    <select
                      value={machine_type || ''}
                      onChange={e => { updateParams({ machine_type: e.target.value }, true); setFilterOpen(false); }}
                      className="w-full px-3 py-2 rounded-lg border-2 text-xs font-bold bg-white dark:bg-black text-black dark:text-white border-black/10 dark:border-white/20 focus:outline-none focus:ring-4 focus:ring-red-500/20 transition-all"
                      aria-label={t('Filter by machine type', 'Nach Maschinentyp filtern')}
                    >
                      <option value="">{t('All Machine Types', 'Alle Maschinentypen')}</option>
                      {filterOptions.machine_types.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.value} ({opt.count})</option>
                      ))}
                    </select>
                    {/* Application Area dropdown */}
                    <select
                      value={application_area || ''}
                      onChange={e => { updateParams({ application_area: e.target.value }, true); setFilterOpen(false); }}
                      className="w-full px-3 py-2 rounded-lg border-2 text-xs font-bold bg-white dark:bg-black text-black dark:text-white border-black/10 dark:border-white/20 focus:outline-none focus:ring-4 focus:ring-red-500/20 transition-all"
                      aria-label={t('Filter by application area', 'Nach Anwendungsbereich filtern')}
                    >
                      <option value="">{t('All Application Areas', 'Alle Anwendungsbereiche')}</option>
                      {filterOptions.application_areas.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.value} ({opt.count})</option>
                      ))}
                    </select>
                    {/* Product Category dropdown */}
                    <select
                      value={product_category || ''}
                      onChange={e => { updateParams({ product_category: e.target.value }, true); setFilterOpen(false); }}
                      className="w-full px-3 py-2 rounded-lg border-2 text-xs font-bold bg-white dark:bg-black text-black dark:text-white border-black/10 dark:border-white/20 focus:outline-none focus:ring-4 focus:ring-red-500/20 transition-all"
                      aria-label={t('Filter by product category', 'Nach Produktkategorie filtern')}
                    >
                      <option value="">{t('All Product Categories', 'Alle Produktkategorien')}</option>
                      {filterOptions.product_categories.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.value} ({opt.count})</option>
                      ))}
                    </select>
                    {/* Control Type dropdown */}
                    <select
                      value={control_type || ''}
                      onChange={e => { updateParams({ control_type: e.target.value }, true); setFilterOpen(false); }}
                      className="w-full px-3 py-2 rounded-lg border-2 text-xs font-bold bg-white dark:bg-black text-black dark:text-white border-black/10 dark:border-white/20 focus:outline-none focus:ring-4 focus:ring-red-500/20 transition-all"
                      aria-label={t('Filter by control type', 'Nach Regelungstyp filtern')}
                    >
                      <option value="">{t('All Control Types', 'Alle Regelungstypen')}</option>
                      {filterOptions.control_types.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.value} ({opt.count})</option>
                      ))}
                    </select>
                    {/* Industry Tag dropdown */}
                    <select
                      value={industry_tag || ''}
                      onChange={e => { updateParams({ industry_tag: e.target.value }, true); setFilterOpen(false); }}
                      className="w-full px-3 py-2 rounded-lg border-2 text-xs font-bold bg-white dark:bg-black text-black dark:text-white border-black/10 dark:border-white/20 focus:outline-none focus:ring-4 focus:ring-red-500/20 transition-all"
                      aria-label={t('Filter by industry tag', 'Nach Industrie-Tag filtern')}
                    >
                      <option value="">{t('All Industry Tags', 'Alle Industrie-Tags')}</option>
                      {filterOptions.industry_tags.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.value} ({opt.count})</option>
                      ))}
                    </select>
                  </div>
                  {/* Reset button */}
                  <button
                    onClick={() => { updateParams({ sector: '', manufacturer: '', complexity: '', partType: '', voltage: '', current: '', power_rating: '', machine_type: '', application_area: '', product_category: '', control_type: '', industry_tag: '', sort: 'date-desc', q: '' }, true); setFilterOpen(false); }}
                    className="mt-3 w-full px-3 py-2 rounded-lg border-2 border-black/10 dark:border-white/20 bg-white dark:bg-black text-black dark:text-white text-xs font-bold hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 hover:border-red-500 dark:hover:border-red-500 transition-all focus:outline-none focus:ring-4 focus:ring-red-500/20"
                    title={t('Reset all filters', 'Alle Filter zurücksetzen')}
                    aria-label={t('Reset all filters', 'Alle Filter zurücksetzen')}
                  >
                    {t('Reset', 'Zurücksetzen')}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
      </div>

        {/* Desktop: Always expanded sticky filter bar */}
        <motion.div
          className="sticky top-0 z-20 bg-white dark:bg-black border-2 border-black/10 dark:border-white/20 mb-6 sm:mb-8 py-4 px-4 flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-lg hidden sm:flex relative"
          role="region"
          aria-label={t('Filter and sort controls', 'Filter- und Sortierleiste')}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {filterSummaries.length > 0 && (
            <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
              <span className="font-bold text-black dark:text-white text-xs uppercase tracking-wider">{t('Active Filters:', 'Aktive Filter:')}</span>
              {filterSummaries.map((f) => (
                <span key={f.param} className="inline-flex items-center bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 px-2.5 py-1 rounded-lg font-bold border border-red-200 dark:border-red-800 text-xs">
                  {f.label}: <span className="ml-1">{f.value}</span>
                </span>
              ))}
              <button
                onClick={() => updateParams({ manufacturer: '', sector: '', partType: '', complexity: '', voltage: '', current: '', power_rating: '', machine_type: '', application_area: '', product_category: '', control_type: '', industry_tag: '' }, true)}
                className="ml-1 px-2.5 py-1 rounded-lg bg-white dark:bg-black text-black dark:text-white hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 border-2 border-black/10 dark:border-white/20 text-xs font-bold transition-colors"
                aria-label={t('Reset filter', 'Filter zurücksetzen')}
              >
                {t('Clear All', 'Alle löschen')}
              </button>
            </div>
          )}
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs text-black dark:text-white font-black uppercase tracking-wider">{t('Sort:', 'Sortieren:')}</span>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => updateParams({ sort: 'date-desc' }, true)}
                className={`px-3 py-1.5 rounded-lg border-2 text-xs font-bold transition-all focus:outline-none focus:ring-4 focus:ring-red-500/20 ${sort === 'date-desc' ? 'bg-red-600 dark:bg-red-500 text-white border-red-600 dark:border-red-500 shadow-lg' : 'bg-white dark:bg-black text-black dark:text-white border-black/10 dark:border-white/20 hover:border-red-500 dark:hover:border-red-500'}`}
                aria-pressed={sort === 'date-desc'}
                aria-label={t('Sort by newest', 'Nach neuestem sortieren')}
              >
                {t('Newest', 'Neueste')}
              </button>
              <button
                onClick={() => updateParams({ sort: 'date-asc' }, true)}
                className={`px-3 py-1.5 rounded-lg border-2 text-xs font-bold transition-all focus:outline-none focus:ring-4 focus:ring-red-500/20 ${sort === 'date-asc' ? 'bg-red-600 dark:bg-red-500 text-white border-red-600 dark:border-red-500 shadow-lg' : 'bg-white dark:bg-black text-black dark:text-white border-black/10 dark:border-white/20 hover:border-red-500 dark:hover:border-red-500'}`}
                aria-pressed={sort === 'date-asc'}
                aria-label={t('Sort by oldest', 'Nach ältestem sortieren')}
              >
                {t('Oldest', 'Älteste')}
              </button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            {/* Sector dropdown */}
            <div className="relative">
              <motion.select
                value={sector || ''}
                onChange={e => updateParams({ sector: e.target.value }, true)}
                className="px-3 py-1.5 rounded-lg border-2 text-xs font-bold bg-white dark:bg-black text-black dark:text-white border-black/10 dark:border-white/20 hover:border-red-500 dark:hover:border-red-500 focus:outline-none focus:ring-4 focus:ring-red-500/20 transition-all"
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
                className="px-3 py-1.5 rounded-lg border-2 text-xs font-bold bg-white dark:bg-black text-black dark:text-white border-black/10 dark:border-white/20 hover:border-red-500 dark:hover:border-red-500 focus:outline-none focus:ring-4 focus:ring-red-500/20 transition-all"
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
                className="px-3 py-1.5 rounded-lg border-2 text-xs font-bold bg-white dark:bg-black text-black dark:text-white border-black/10 dark:border-white/20 hover:border-red-500 dark:hover:border-red-500 focus:outline-none focus:ring-4 focus:ring-red-500/20 transition-all"
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
                className="px-3 py-1.5 rounded-lg border-2 text-xs font-bold bg-white dark:bg-black text-black dark:text-white border-black/10 dark:border-white/20 hover:border-red-500 dark:hover:border-red-500 focus:outline-none focus:ring-4 focus:ring-red-500/20 transition-all"
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
                className="px-3 py-1.5 rounded-lg border-2 text-xs font-bold bg-white dark:bg-black text-black dark:text-white border-black/10 dark:border-white/20 hover:border-red-500 dark:hover:border-red-500 focus:outline-none focus:ring-4 focus:ring-red-500/20 transition-all"
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
                className="px-3 py-1.5 rounded-lg border-2 text-xs font-bold bg-white dark:bg-black text-black dark:text-white border-black/10 dark:border-white/20 hover:border-red-500 dark:hover:border-red-500 focus:outline-none focus:ring-4 focus:ring-red-500/20 transition-all"
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
                className="px-3 py-1.5 rounded-lg border-2 text-xs font-bold bg-white dark:bg-black text-black dark:text-white border-black/10 dark:border-white/20 hover:border-red-500 dark:hover:border-red-500 focus:outline-none focus:ring-4 focus:ring-red-500/20 transition-all"
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
                className="px-3 py-1.5 rounded-lg border-2 text-xs font-bold bg-white dark:bg-black text-black dark:text-white border-black/10 dark:border-white/20 hover:border-red-500 dark:hover:border-red-500 focus:outline-none focus:ring-4 focus:ring-red-500/20 transition-all"
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
                className="px-3 py-1.5 rounded-lg border-2 text-xs font-bold bg-white dark:bg-black text-black dark:text-white border-black/10 dark:border-white/20 hover:border-red-500 dark:hover:border-red-500 focus:outline-none focus:ring-4 focus:ring-red-500/20 transition-all"
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
                className="px-3 py-1.5 rounded-lg border-2 text-xs font-bold bg-white dark:bg-black text-black dark:text-white border-black/10 dark:border-white/20 hover:border-red-500 dark:hover:border-red-500 focus:outline-none focus:ring-4 focus:ring-red-500/20 transition-all"
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
                className="px-3 py-1.5 rounded-lg border-2 text-xs font-bold bg-white dark:bg-black text-black dark:text-white border-black/10 dark:border-white/20 hover:border-red-500 dark:hover:border-red-500 focus:outline-none focus:ring-4 focus:ring-red-500/20 transition-all"
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
                className="px-3 py-1.5 rounded-lg border-2 text-xs font-bold bg-white dark:bg-black text-black dark:text-white border-black/10 dark:border-white/20 hover:border-red-500 dark:hover:border-red-500 focus:outline-none focus:ring-4 focus:ring-red-500/20 transition-all"
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

        {/* Search bar - Enhanced */}
        <motion.div
          className="mb-6 sm:mb-8 relative z-10"
          role="search"
          aria-label={t('Search knowledge', 'Wissen durchsuchen')}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="relative max-w-3xl flex items-center gap-3">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder={t("Search fault solutions...", "Fehlerlösungen suchen...")}
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    updateParams({ q: searchInput }, true);
                  }
                }}
                className="block w-full pl-11 pr-4 py-3.5 border-2 border-black/10 dark:border-white/20 rounded-lg leading-5 bg-white dark:bg-black placeholder-slate-500 dark:placeholder-slate-400 text-black dark:text-white focus:outline-none focus:ring-4 focus:ring-red-500/20 focus:border-red-500 dark:focus:border-red-500 transition-all font-medium"
                aria-label={t('Search fault solutions', 'Fehlerlösungen suchen')}
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-3 py-2 rounded-lg text-xs font-black bg-white dark:bg-black border-2 border-black/10 dark:border-white/20 text-black dark:text-white font-mono" title="Total available fault solutions" aria-label={t('Total available fault solutions', 'Verfügbare Fehlerlösungen insgesamt')}>
                {totalAvailable}
              </span>
              {searchInput && (
                <button
                  onClick={() => { setSearchInput(''); updateParams({ q: '' }, true); }}
                  className="p-2 rounded-lg border-2 border-black/10 dark:border-white/20 hover:border-red-500 dark:hover:border-red-500 transition-colors"
                  aria-label={t('Clear search', 'Suche löschen')}
                >
                  <svg className="w-4 h-4 text-black dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
          {q && (
            <p className="mt-3 text-sm font-medium text-black dark:text-white">
              {t(
                `Found ${questions.length} solution${questions.length !== 1 ? 's' : ''}`,
                `${questions.length} Lösung${questions.length !== 1 ? 'en' : ''} gefunden`
              )}
            </p>
          )}
        </motion.div>

        {/* Knowledge cards grid */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10"
          role="list"
          aria-label={t('Fault solutions', 'Fehlerlösungen')}
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.08 } },
          }}
        >
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white dark:bg-black rounded-lg border-2 border-black/10 dark:border-white/20 p-5 sm:p-6 flex flex-col animate-pulse">
                <Skeleton className="h-5 sm:h-6 w-2/3 mb-3 bg-slate-200 dark:bg-slate-800" />
                <Skeleton className="h-4 w-full mb-2 bg-slate-200 dark:bg-slate-800" />
                <Skeleton className="h-4 w-5/6 mb-2 bg-slate-200 dark:bg-slate-800" />
                <div className="flex gap-2 mt-auto pt-4 border-t-2 border-black/10 dark:border-white/20">
                  <Skeleton className="h-5 w-16 rounded-lg bg-slate-200 dark:bg-slate-800" />
                  <Skeleton className="h-5 w-20 rounded-lg bg-slate-200 dark:bg-slate-800" />
                </div>
              </div>
            ))
          ) : sortedQuestions.length > 0 ? (
            <AnimatePresence>
              {sortedQuestions.map((q) => (
                <motion.div
                  key={q.id}
                  className="group bg-white dark:bg-black border-2 border-black/10 dark:border-white/20 rounded-lg p-5 sm:p-6 flex flex-col hover:shadow-xl hover:border-red-500 dark:hover:border-red-500 transition-all duration-200"
                  role="listitem"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 16 }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                >
                  <Link href={`/${lang}/knowledge/${q.slug}`} className="text-base sm:text-lg font-black text-black hover:text-red-600 dark:text-white dark:hover:text-red-400 transition-colors mb-3 line-clamp-2 leading-snug" aria-label={q.question} tabIndex={0}>
                    {highlightText(q.header ? q.header : q.question, searchInput)}
                  </Link>
                  <div className="text-slate-600 dark:text-slate-400 text-sm mb-4 line-clamp-2 leading-relaxed">{q.question}</div>
                  <div className="flex flex-wrap gap-2 mt-auto pt-4 border-t-2 border-black/10 dark:border-white/20 items-center">
                    {q.sector && <span className="inline-block bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-xs font-bold px-2.5 py-1 rounded-lg border border-red-200 dark:border-red-800">{q.sector}</span>}
                    {(() => {
                      // Collect all manufacturers (from manufacturer field and manufacturer_mentions)
                      const manufacturers: string[] = [];
                      if (q.manufacturer) {
                        try {
                          const parsed = JSON.parse(q.manufacturer);
                          if (Array.isArray(parsed)) {
                            manufacturers.push(...parsed);
                          } else {
                            manufacturers.push(q.manufacturer);
                          }
                        } catch {
                          manufacturers.push(q.manufacturer);
                        }
                      }
                      if (q.manufacturer_mentions && Array.isArray(q.manufacturer_mentions)) {
                        manufacturers.push(...q.manufacturer_mentions);
                      }
                      // Remove duplicates
                      const uniqueManufacturers = Array.from(new Set(manufacturers.filter(Boolean)));
                      
                      return uniqueManufacturers.slice(0, 3).map((mfg) => (
                        <Link
                          key={`${q.id}-${mfg}`}
                          href={`/${lang}/knowledge?manufacturer=${encodeURIComponent(mfg)}&page=1`}
                          className="inline-block bg-white dark:bg-black text-black dark:text-white hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 text-xs font-bold px-2.5 py-1 rounded-lg border-2 border-black/10 dark:border-white/20 hover:border-red-500 dark:hover:border-red-500 transition-all"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {mfg}
                        </Link>
                      ));
                    })()}
                    {q.part_type && <span className="inline-block bg-white dark:bg-black text-black dark:text-white text-xs font-bold px-2.5 py-1 rounded-lg border-2 border-black/10 dark:border-white/20">{q.part_type}</span>}
                    {q.application_area && Array.isArray(q.application_area) && q.application_area.slice(0, 2).map((area) => (
                      <span key={`${q.id}-${area}`} className="inline-block bg-white dark:bg-black text-black dark:text-white text-xs font-bold px-2.5 py-1 rounded-lg border-2 border-black/10 dark:border-white/20">
                        {area}
                      </span>
                    ))}
                    <span className="inline-block text-slate-500 dark:text-slate-400 text-xs font-medium ml-auto">{new Date(q.created_at).toLocaleDateString(lang === 'de' ? 'de-DE' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                    {similarityMode && typeof q._similarity === 'number' && (
                      <span className="inline-block bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-xs font-black px-2.5 py-1 rounded-lg border-2 border-amber-200 dark:border-amber-800">Similarity: {Math.round(q._similarity * 100)}%</span>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          ) : (
            <div className="col-span-full text-center py-16 sm:py-20" role="status" aria-live="polite">
              <div className="w-16 h-16 mx-auto mb-6 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="block text-lg sm:text-xl font-black text-black dark:text-white mb-2">{t('No fault solutions found', 'Keine Fehlerlösungen gefunden')}</span>
              <span className="block text-sm text-slate-600 dark:text-slate-400 mb-4">{t('Try adjusting your filters or search terms.', 'Versuchen Sie, Ihre Filter oder Suchbegriffe zu ändern.')}</span>
              <button
                onClick={() => updateParams({ q: '', sector: '', manufacturer: '', complexity: '', partType: '', voltage: '', current: '', power_rating: '', machine_type: '', application_area: '', product_category: '', control_type: '', industry_tag: '' }, true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 dark:bg-red-500 text-white rounded-lg font-bold hover:bg-red-700 dark:hover:bg-red-600 transition-all"
              >
                {t('Clear All Filters', 'Alle Filter löschen')}
              </button>
            </div>
          )}
        </motion.div>

        {/* Pagination controls */}
        <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative z-10">
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs font-bold text-black dark:text-white uppercase tracking-wider mr-2">{t('Per Page:', 'Pro Seite:')}</span>
            {[30, 60, 100].map((size) => (
              <button
                key={size}
                onClick={() => updateParams({ pageSize: size }, true)}
                className={`px-3 py-1.5 rounded-lg border-2 text-xs font-bold transition-all duration-200 ${pageSize === size ? 'bg-red-600 dark:bg-red-500 text-white border-red-600 dark:border-red-500 shadow-lg' : 'bg-white dark:bg-black text-black dark:text-white border-black/10 dark:border-white/20 hover:border-red-500 dark:hover:border-red-500'}`}
              >
                {size}
              </button>
          ))}
        </div>
          <div className="flex flex-wrap gap-2 items-center justify-center">
            <button
              onClick={() => updateParams({ page: page - 1 })}
              className="px-4 py-2 rounded-lg border-2 text-sm font-bold transition-all duration-200 bg-white dark:bg-black text-black dark:text-white border-black/10 dark:border-white/20 hover:border-red-500 dark:hover:border-red-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-black/10 dark:disabled:hover:border-white/20"
              disabled={page === 1}
            >
              {t('Previous', 'Zurück')}
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).slice(Math.max(0, page - 3), Math.min(totalPages, page + 2)).map((p) => (
              <button
                key={p}
                onClick={() => updateParams({ page: p })}
                className={`px-4 py-2 rounded-lg border-2 text-sm font-bold transition-all duration-200 ${page === p ? 'bg-red-600 dark:bg-red-500 text-white border-red-600 dark:border-red-500 shadow-lg' : 'bg-white dark:bg-black text-black dark:text-white border-black/10 dark:border-white/20 hover:border-red-500 dark:hover:border-red-500'}`}
                disabled={page === p}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => updateParams({ page: page + 1 })}
              className="px-4 py-2 rounded-lg border-2 text-sm font-bold transition-all duration-200 bg-white dark:bg-black text-black dark:text-white border-black/10 dark:border-white/20 hover:border-red-500 dark:hover:border-red-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-black/10 dark:disabled:hover:border-white/20"
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