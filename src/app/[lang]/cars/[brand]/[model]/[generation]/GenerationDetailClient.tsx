'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getBrandLogoUrl } from '@/lib/car-brand-logos';

type CarBrand = {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
};

type CarModel = {
  id: string;
  name: string;
  slug: string;
};

type ModelGeneration = {
  id: string;
  name: string;
  slug: string;
  year_start?: number;
  year_end?: number;
  description?: string;
  generation_code?: string;
  image_url?: string;
};

type CarFault = {
  id: string;
  slug: string;
  title: string;
  description?: string;
  severity?: string;
  difficulty_level?: string;
  error_code?: string;
  affected_component?: string;
  estimated_repair_time?: string;
  parts_required?: string[];
  created_at: string;
};

type CarManual = {
  id: string;
  slug: string;
  title: string;
  description?: string;
  manual_type?: string;
  difficulty_level?: string;
  estimated_time?: string;
  created_at: string;
};

type Props = {
  brand: CarBrand;
  model: CarModel;
  generation: ModelGeneration;
  faults: CarFault[];
  manuals: CarManual[];
  lang: string;
  totalFaults: number;
  totalManuals: number;
  faultPage: number;
  manualPage: number;
  totalFaultPages: number;
  totalManualPages: number;
};

export default function GenerationDetailClient({ 
  brand, 
  model, 
  generation, 
  faults, 
  manuals, 
  lang,
  totalFaults,
  totalManuals,
  faultPage,
  manualPage,
  totalFaultPages,
  totalManualPages,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<'faults' | 'manuals'>('faults');
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
  const [componentFilter, setComponentFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'title' | 'severity'>('recent');
  const t = (en: string, de: string) => lang === 'de' ? de : en;

  // Pagination helper function
  const updatePage = (newPage: number, type: 'faults' | 'manuals') => {
    const params = new URLSearchParams(searchParams.toString());
    if (type === 'faults') {
      params.set('faultPage', newPage.toString());
      if (newPage === 1) params.delete('faultPage');
    } else {
      params.set('manualPage', newPage.toString());
      if (newPage === 1) params.delete('manualPage');
    }
    router.push(`?${params.toString()}`);
  };

  // Pagination component
  const Pagination = ({ currentPage, totalPages, type }: { currentPage: number; totalPages: number; type: 'faults' | 'manuals' }) => {
    if (totalPages <= 1) return null;

    const pages = [];
    const maxVisible = 7;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);

    if (endPage - startPage < maxVisible - 1) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    const startIndex = (currentPage - 1) * 60 + 1;
    const endIndex = Math.min(currentPage * 60, type === 'faults' ? totalFaults : totalManuals);
    const totalItems = type === 'faults' ? totalFaults : totalManuals;

    return (
      <div className="flex flex-col items-center gap-4 py-6">
        {/* Page info */}
        <div className="text-sm text-slate-600 dark:text-slate-400 font-semibold">
          {t(`Showing ${startIndex.toLocaleString()}-${endIndex.toLocaleString()} of ${totalItems.toLocaleString()}`, 
             `Zeige ${startIndex.toLocaleString()}-${endIndex.toLocaleString()} von ${totalItems.toLocaleString()}`)}
        </div>
        
        {/* Pagination controls */}
        <div className="flex items-center justify-center gap-2 flex-wrap">
          {currentPage > 1 && (
            <button
              onClick={() => updatePage(currentPage - 1, type)}
              className="px-4 py-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold hover:border-slate-300 dark:hover:border-slate-600 hover:text-slate-900 dark:hover:text-slate-100 hover:shadow-md transition-all"
            >
              <svg className="w-5 h-5 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              {t('Previous', 'Zurück')}
            </button>
          )}
          
          {startPage > 1 && (
            <>
              <button
                onClick={() => updatePage(1, type)}
                className={`px-4 py-2.5 rounded-lg font-semibold transition-all ${
                  1 === currentPage
                    ? 'bg-slate-900 dark:bg-slate-700 text-white border border-slate-900 dark:border-slate-700 shadow-md'
                    : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-md'
                }`}
              >
                1
              </button>
              {startPage > 2 && <span className="px-2 text-slate-500 dark:text-slate-400 font-bold">...</span>}
            </>
          )}

          {pages.map((page) => (
            <button
              key={page}
              onClick={() => updatePage(page, type)}
              className={`px-4 py-2.5 rounded-lg font-semibold transition-all min-w-[44px] ${
                page === currentPage
                  ? 'bg-slate-900 dark:bg-slate-700 text-white border border-slate-900 dark:border-slate-700 shadow-md'
                  : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-md'
              }`}
            >
              {page}
            </button>
          ))}

          {endPage < totalPages && (
            <>
              {endPage < totalPages - 1 && <span className="px-2 text-slate-500 dark:text-slate-400 font-bold">...</span>}
              <button
                onClick={() => updatePage(totalPages, type)}
                className={`px-4 py-2.5 rounded-lg font-semibold transition-all ${
                  totalPages === currentPage
                    ? 'bg-slate-900 dark:bg-slate-700 text-white border border-slate-900 dark:border-slate-700 shadow-md'
                    : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-md'
                }`}
              >
                {totalPages}
              </button>
            </>
          )}

          {currentPage < totalPages && (
            <button
              onClick={() => updatePage(currentPage + 1, type)}
              className="px-4 py-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold hover:border-slate-300 dark:hover:border-slate-600 hover:text-slate-900 dark:hover:text-slate-100 hover:shadow-md transition-all"
            >
              {t('Next', 'Weiter')}
              <svg className="w-5 h-5 inline-block ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>
      </div>
    );
  };

  // Get unique values for filters
  const uniqueSeverities = Array.from(new Set(faults.map(f => f.severity).filter(Boolean)));
  const uniqueDifficulties = Array.from(new Set([...faults.map(f => f.difficulty_level), ...manuals.map(m => m.difficulty_level)].filter(Boolean)));
  const uniqueComponents = Array.from(new Set(faults.map(f => f.affected_component).filter(Boolean)));

  // Filter and sort faults
  const filteredFaults = faults
    .filter(fault => {
      const matchesSearch = 
        fault.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        fault.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        fault.error_code?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesSeverity = severityFilter === 'all' || fault.severity === severityFilter;
      const matchesDifficulty = difficultyFilter === 'all' || fault.difficulty_level === difficultyFilter;
      const matchesComponent = componentFilter === 'all' || fault.affected_component === componentFilter;
      
      return matchesSearch && matchesSeverity && matchesDifficulty && matchesComponent;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'severity':
          const severityOrder = { 'critical': 0, 'high': 1, 'medium': 2, 'low': 3 };
          const aSeverity = severityOrder[a.severity?.toLowerCase() as keyof typeof severityOrder] ?? 99;
          const bSeverity = severityOrder[b.severity?.toLowerCase() as keyof typeof severityOrder] ?? 99;
          return aSeverity - bSeverity;
        case 'recent':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

  // Filter and sort manuals
  const filteredManuals = manuals
    .filter(manual => {
      const matchesSearch = 
        manual.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        manual.description?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesDifficulty = difficultyFilter === 'all' || manual.difficulty_level === difficultyFilter;
      
      return matchesSearch && matchesDifficulty;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'recent':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

  // Calculate statistics
  const faultStats = {
    total: faults.length,
    bySeverity: {
      critical: faults.filter(f => f.severity?.toLowerCase() === 'critical').length,
      high: faults.filter(f => f.severity?.toLowerCase() === 'high').length,
      medium: faults.filter(f => f.severity?.toLowerCase() === 'medium').length,
      low: faults.filter(f => f.severity?.toLowerCase() === 'low').length,
    },
    byDifficulty: {
      expert: faults.filter(f => f.difficulty_level?.toLowerCase() === 'expert').length,
      hard: faults.filter(f => f.difficulty_level?.toLowerCase() === 'hard').length,
      medium: faults.filter(f => f.difficulty_level?.toLowerCase() === 'medium').length,
      easy: faults.filter(f => f.difficulty_level?.toLowerCase() === 'easy').length,
    }
  };

  const getSeverityColor = (severity?: string) => {
    switch (severity?.toLowerCase()) {
      case 'high': return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700';
      case 'medium': return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700';
      case 'low': return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700';
      default: return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700';
    }
  };

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'expert': return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700';
      case 'hard': return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700';
      case 'medium': return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700';
      case 'easy': return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700';
      default: return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700';
    }
  };

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
              <Link href={`/${lang}/cars/${brand.slug}/${model.slug}`} className="hover:text-white transition-colors">
                {model.name}
              </Link>
              <span>/</span>
              <span className="text-white font-semibold">{generation.name}</span>
            </nav>

            {/* Brand Logo */}
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

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white mb-4 tracking-tight">
              {brand.name} {model.name}
            </h1>
            
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-300 dark:text-slate-400 mb-4">
              {generation.name}
            </h2>

            {(generation.year_start || generation.year_end) && (
              <p className="text-lg text-slate-400 mb-6">
                {generation.year_start} - {generation.year_end || t('Present', 'Heute')}
              </p>
            )}

            {generation.description && (
              <p className="text-lg text-slate-300 dark:text-slate-400 max-w-3xl mx-auto leading-relaxed">
                {generation.description}
              </p>
            )}
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {/* Stats Bar - Professional & Subtle */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-slate-900 rounded-xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all hover:border-slate-300 dark:hover:border-slate-700"
          >
            <div className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white mb-2">{totalFaults.toLocaleString()}</div>
            <div className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">{t('Faults', 'Fehler')}</div>
            <div className="text-xs text-slate-500 dark:text-slate-500 mt-1">{t('Total', 'Gesamt')}</div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-slate-900 rounded-xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all hover:border-slate-300 dark:hover:border-slate-700"
          >
            <div className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white mb-2">{totalManuals.toLocaleString()}</div>
            <div className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">{t('Manuals', 'Anleitungen')}</div>
            <div className="text-xs text-slate-500 dark:text-slate-500 mt-1">{t('Total', 'Gesamt')}</div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-slate-900 rounded-xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all hover:border-slate-300 dark:hover:border-slate-700"
          >
            <div className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white mb-2">{faultStats.bySeverity.high + faultStats.bySeverity.critical}</div>
            <div className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">{t('High Priority', 'Hohe Priorität')}</div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white dark:bg-slate-900 rounded-xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all hover:border-slate-300 dark:hover:border-slate-700"
          >
            <div className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white mb-2">{faultStats.byDifficulty.easy + faultStats.byDifficulty.medium}</div>
            <div className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">{t('Easy Fixes', 'Einfache Reparaturen')}</div>
          </motion.div>
        </div>

        {/* Search and Filters - Enhanced */}
        <div className="mb-10 space-y-6">
          {/* Search Bar */}
          <div className="relative max-w-3xl mx-auto">
            <input
              type="text"
              placeholder={t('Search faults and manuals...', 'Fehler und Anleitungen suchen...')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-6 py-4 sm:py-5 text-lg border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-400 dark:focus:ring-slate-600 focus:border-slate-400 dark:focus:border-slate-600 transition-all shadow-sm hover:shadow-md"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-16 top-1/2 transform -translate-y-1/2 w-6 h-6 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 z-10"
              >
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
            <svg
              className="absolute right-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-slate-400 dark:text-slate-500 z-10"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Filters and Sort - Enhanced */}
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            {activeTab === 'faults' && (
              <>
                {uniqueSeverities.length > 0 && (
                  <select
                    value={severityFilter}
                    onChange={(e) => setSeverityFilter(e.target.value)}
                    className="px-4 py-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-slate-400 dark:focus:ring-slate-600 focus:border-slate-400 dark:focus:border-slate-600 transition-all shadow-sm hover:shadow-md"
                  >
                    <option value="all">{t('All Severities', 'Alle Schweregrade')}</option>
                    {uniqueSeverities.map(severity => (
                      <option key={severity} value={severity}>{severity}</option>
                    ))}
                  </select>
                )}
                {uniqueComponents.length > 0 && (
                  <select
                    value={componentFilter}
                    onChange={(e) => setComponentFilter(e.target.value)}
                    className="px-4 py-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-slate-400 dark:focus:ring-slate-600 focus:border-slate-400 dark:focus:border-slate-600 transition-all shadow-sm hover:shadow-md"
                  >
                    <option value="all">{t('All Components', 'Alle Komponenten')}</option>
                    {uniqueComponents.map(component => (
                      <option key={component} value={component}>{component}</option>
                    ))}
                  </select>
                )}
              </>
            )}
            {uniqueDifficulties.length > 0 && (
              <select
                value={difficultyFilter}
                onChange={(e) => setDifficultyFilter(e.target.value)}
                className="px-4 py-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-slate-400 dark:focus:ring-slate-600 focus:border-slate-400 dark:focus:border-slate-600 transition-all shadow-sm hover:shadow-md"
              >
                <option value="all">{t('All Difficulties', 'Alle Schwierigkeiten')}</option>
                {uniqueDifficulties.map(difficulty => (
                  <option key={difficulty} value={difficulty}>{difficulty}</option>
                ))}
              </select>
            )}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'recent' | 'title' | 'severity')}
              className="px-4 py-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-slate-400 dark:focus:ring-slate-600 focus:border-slate-400 dark:focus:border-slate-600 transition-all shadow-sm hover:shadow-md"
            >
              <option value="recent">{t('Most Recent', 'Neueste')}</option>
              <option value="title">{t('Alphabetical', 'Alphabetisch')}</option>
              {activeTab === 'faults' && <option value="severity">{t('By Severity', 'Nach Schweregrad')}</option>}
            </select>
            {(severityFilter !== 'all' || difficultyFilter !== 'all' || componentFilter !== 'all') && (
              <button
                onClick={() => {
                  setSeverityFilter('all');
                  setDifficultyFilter('all');
                  setComponentFilter('all');
                }}
                className="px-4 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
              >
                {t('Clear Filters', 'Filter zurücksetzen')}
              </button>
            )}
          </div>
        </div>

        {/* Tabs - Professional */}
        <div className="mb-10 flex justify-center">
          <div className="inline-flex bg-slate-100 dark:bg-slate-900 rounded-xl p-1.5 border border-slate-200 dark:border-slate-800 shadow-sm">
            <button
              onClick={() => setActiveTab('faults')}
              className={`px-8 py-3.5 rounded-lg font-semibold text-sm transition-all ${
                activeTab === 'faults'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm border border-slate-200 dark:border-slate-700'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {t('Faults', 'Fehler')} <span className="ml-2 px-2 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-full text-xs font-semibold">{totalFaults.toLocaleString()}</span>
            </button>
            <button
              onClick={() => setActiveTab('manuals')}
              className={`px-8 py-3.5 rounded-lg font-semibold text-sm transition-all ${
                activeTab === 'manuals'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm border border-slate-200 dark:border-slate-700'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {t('Manuals', 'Anleitungen')} <span className="ml-2 px-2 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-full text-xs font-semibold">{totalManuals.toLocaleString()}</span>
            </button>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'faults' ? (
          <div>
            {totalFaultPages > 1 && (
              <div className="mb-8">
                <Pagination currentPage={faultPage} totalPages={totalFaultPages} type="faults" />
              </div>
            )}
            {filteredFaults.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-lg text-slate-500 dark:text-slate-400">
                  {t('No faults found.', 'Keine Fehler gefunden.')}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {filteredFaults.map((fault, index) => (
                  <motion.div
                    key={fault.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.05 }}
                  >
                    <Link
                      href={`/${lang}/cars/${brand.slug}/${model.slug}/${generation.slug}/faults/${fault.slug}`}
                      className="group block h-full"
                    >
                      <div className="group relative bg-white dark:bg-slate-900 rounded-lg p-6 shadow-sm dark:shadow-md hover:shadow-md dark:hover:shadow-lg transition-all duration-300 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 h-full flex flex-col">
                        
                        <div className="flex items-start justify-between mb-4">
                          <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors flex-1 leading-tight pr-2">
                            {fault.title}
                          </h3>
                        </div>

                        {fault.description && (
                          <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-3 mb-5 leading-relaxed">
                            {fault.description}
                          </p>
                        )}

                        <div className="flex flex-wrap gap-2 mb-5">
                          {fault.severity && (
                            <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold border uppercase tracking-wide ${getSeverityColor(fault.severity)}`}>
                              {fault.severity}
                            </span>
                          )}
                          {fault.difficulty_level && (
                            <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold border uppercase tracking-wide ${getDifficultyColor(fault.difficulty_level)}`}>
                              {fault.difficulty_level}
                            </span>
                          )}
                          {fault.error_code && (
                            <span className="px-3 py-1.5 rounded-lg text-xs font-mono font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                              {fault.error_code}
                            </span>
                          )}
                          {fault.affected_component && (
                            <span className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                              {fault.affected_component}
                            </span>
                          )}
                        </div>

                        {/* Additional Info - Professional & Subtle */}
                        <div className="mb-4 space-y-2">
                          {fault.estimated_repair_time && (
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                              <svg className="w-4 h-4 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{fault.estimated_repair_time}</span>
                              <span className="text-xs text-slate-500 dark:text-slate-400">{t('repair time', 'Reparaturzeit')}</span>
                            </div>
                          )}
                          {fault.affected_component && (
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                              <svg className="w-4 h-4 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                              </svg>
                              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{fault.affected_component}</span>
                            </div>
                          )}
                          {fault.parts_required && fault.parts_required.length > 0 && (
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                              <svg className="w-4 h-4 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                              </svg>
                              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                {fault.parts_required.length} {t('parts', 'Teile')}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="mt-auto pt-4 border-t border-slate-200 dark:border-slate-700">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center text-slate-700 dark:text-slate-300 font-semibold text-sm group-hover:text-slate-900 dark:group-hover:text-white group-hover:translate-x-1 transition-all">
                              {t('View Solution', 'Lösung ansehen')}
                              <svg className="w-4 h-4 ml-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </div>
                            {fault.error_code && (
                              <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-mono font-semibold rounded-lg border border-slate-200 dark:border-slate-700">
                                {fault.error_code}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
            {totalFaultPages > 1 && (
              <div className="mt-10">
                <Pagination currentPage={faultPage} totalPages={totalFaultPages} type="faults" />
              </div>
            )}
          </div>
        ) : (
          <div>
            {totalManualPages > 1 && (
              <div className="mb-8">
                <Pagination currentPage={manualPage} totalPages={totalManualPages} type="manuals" />
              </div>
            )}
            {filteredManuals.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-lg text-slate-500 dark:text-slate-400">
                  {t('No manuals found.', 'Keine Anleitungen gefunden.')}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {filteredManuals.map((manual, index) => (
                  <motion.div
                    key={manual.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.05 }}
                  >
                    <Link
                      href={`/${lang}/cars/${brand.slug}/${model.slug}/${generation.slug}/manuals/${manual.slug}`}
                      className="group block h-full"
                    >
                      <div className="group relative bg-white dark:bg-slate-900 rounded-lg p-6 shadow-sm dark:shadow-md hover:shadow-md dark:hover:shadow-lg transition-all duration-300 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 h-full flex flex-col">
                        
                        <div className="flex items-start justify-between mb-4">
                          <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors flex-1 leading-tight pr-2">
                            {manual.title}
                          </h3>
                        </div>

                        {manual.description && (
                          <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-3 mb-5 leading-relaxed">
                            {manual.description}
                          </p>
                        )}

                        <div className="flex flex-wrap gap-2 mb-5">
                          {manual.manual_type && (
                            <span className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 uppercase tracking-wide">
                              {manual.manual_type}
                            </span>
                          )}
                          {manual.difficulty_level && (
                            <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold border uppercase tracking-wide ${getDifficultyColor(manual.difficulty_level)}`}>
                              {manual.difficulty_level}
                            </span>
                          )}
                          {manual.estimated_time && (
                            <span className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                              {manual.estimated_time}
                            </span>
                          )}
                        </div>

                        {/* Additional Info */}
                        {manual.estimated_time && (
                          <div className="mb-4 flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                            <svg className="w-4 h-4 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{manual.estimated_time}</span>
                            <span className="text-xs text-slate-500 dark:text-slate-400">{t('estimated', 'geschätzt')}</span>
                          </div>
                        )}

                        <div className="mt-auto pt-4 border-t border-slate-200 dark:border-slate-700">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center text-slate-700 dark:text-slate-300 font-semibold text-sm group-hover:text-slate-900 dark:group-hover:text-white group-hover:translate-x-1 transition-all">
                              {t('View Manual', 'Anleitung ansehen')}
                              <svg className="w-4 h-4 ml-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </div>
                            {manual.manual_type && (
                              <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700">
                                {manual.manual_type}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
            {totalManualPages > 1 && (
              <div className="mt-10">
                <Pagination currentPage={manualPage} totalPages={totalManualPages} type="manuals" />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

