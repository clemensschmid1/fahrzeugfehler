'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useState } from 'react';

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
};

export default function GenerationDetailClient({ brand, model, generation, faults, manuals, lang }: Props) {
  const [activeTab, setActiveTab] = useState<'faults' | 'manuals'>('faults');
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
  const [componentFilter, setComponentFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'title' | 'severity'>('recent');
  const t = (en: string, de: string) => lang === 'de' ? de : en;

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
      case 'high': return 'bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900/30';
      case 'medium': return 'bg-orange-100 dark:bg-orange-950/50 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-900/30';
      case 'low': return 'bg-yellow-100 dark:bg-yellow-950/50 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-900/30';
      default: return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    }
  };

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'expert': return 'bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900/30';
      case 'hard': return 'bg-orange-100 dark:bg-orange-950/50 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-900/30';
      case 'medium': return 'bg-yellow-100 dark:bg-yellow-950/50 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-900/30';
      case 'easy': return 'bg-green-100 dark:bg-green-950/50 text-green-700 dark:text-green-400 border-green-200 dark:border-green-900/30';
      default: return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';
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

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white mb-6 tracking-tight">
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/40 dark:to-red-900/30 rounded-xl p-4 border border-red-200 dark:border-red-900/30">
            <div className="text-3xl font-black text-red-600 dark:text-red-400 mb-1">{faults.length}</div>
            <div className="text-xs font-semibold text-red-700 dark:text-red-300">{t('Faults', 'Fehler')}</div>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/40 dark:to-blue-900/30 rounded-xl p-4 border border-blue-200 dark:border-blue-900/30">
            <div className="text-3xl font-black text-blue-600 dark:text-blue-400 mb-1">{manuals.length}</div>
            <div className="text-xs font-semibold text-blue-700 dark:text-blue-300">{t('Manuals', 'Anleitungen')}</div>
          </div>
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/40 dark:to-orange-900/30 rounded-xl p-4 border border-orange-200 dark:border-orange-900/30">
            <div className="text-3xl font-black text-orange-600 dark:text-orange-400 mb-1">{faultStats.bySeverity.high + faultStats.bySeverity.critical}</div>
            <div className="text-xs font-semibold text-orange-700 dark:text-orange-300">{t('High Priority', 'Hohe Priorität')}</div>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/40 dark:to-green-900/30 rounded-xl p-4 border border-green-200 dark:border-green-900/30">
            <div className="text-3xl font-black text-green-600 dark:text-green-400 mb-1">{faultStats.byDifficulty.easy + faultStats.byDifficulty.medium}</div>
            <div className="text-xs font-semibold text-green-700 dark:text-green-300">{t('Easy Fixes', 'Einfache Reparaturen')}</div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          {/* Search Bar */}
          <div className="relative max-w-2xl mx-auto">
            <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 via-transparent to-red-500/10 rounded-xl blur-xl"></div>
            <input
              type="text"
              placeholder={t('Search faults and manuals...', 'Fehler und Anleitungen suchen...')}
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

          {/* Filters and Sort */}
          <div className="flex flex-wrap items-center justify-center gap-4">
            {activeTab === 'faults' && (
              <>
                {uniqueSeverities.length > 0 && (
                  <select
                    value={severityFilter}
                    onChange={(e) => setSeverityFilter(e.target.value)}
                    className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
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
                    className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
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
                className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
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
              className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
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
                className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              >
                {t('Clear Filters', 'Filter zurücksetzen')}
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-8 flex justify-center">
          <div className="inline-flex bg-slate-100 dark:bg-slate-900 rounded-xl p-1 border border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setActiveTab('faults')}
              className={`px-6 py-3 rounded-lg font-bold transition-all ${
                activeTab === 'faults'
                  ? 'bg-white dark:bg-slate-800 text-red-600 dark:text-red-400 shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {t('Faults', 'Fehler')} ({faults.length})
            </button>
            <button
              onClick={() => setActiveTab('manuals')}
              className={`px-6 py-3 rounded-lg font-bold transition-all ${
                activeTab === 'manuals'
                  ? 'bg-white dark:bg-slate-800 text-red-600 dark:text-red-400 shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {t('Manuals', 'Anleitungen')} ({manuals.length})
            </button>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'faults' ? (
          <div>
            {filteredFaults.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-lg text-slate-500 dark:text-slate-400">
                  {t('No faults found.', 'Keine Fehler gefunden.')}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-lg dark:shadow-xl hover:shadow-2xl dark:hover:shadow-red-900/20 transition-all duration-300 border border-slate-200 dark:border-slate-800 hover:border-red-500 dark:hover:border-red-500/50 h-full flex flex-col">
                        <div className="flex items-start justify-between mb-3">
                          <h3 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400/90 transition-colors flex-1">
                            {fault.title}
                          </h3>
                        </div>

                        {fault.description && (
                          <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2 mb-4 leading-relaxed">
                            {fault.description}
                          </p>
                        )}

                        <div className="flex flex-wrap gap-2 mb-4">
                          {fault.severity && (
                            <span className={`px-2 py-1 rounded-lg text-xs font-bold border ${getSeverityColor(fault.severity)}`}>
                              {fault.severity}
                            </span>
                          )}
                          {fault.difficulty_level && (
                            <span className={`px-2 py-1 rounded-lg text-xs font-bold border ${getDifficultyColor(fault.difficulty_level)}`}>
                              {fault.difficulty_level}
                            </span>
                          )}
                          {fault.error_code && (
                            <span className="px-2 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                              {fault.error_code}
                            </span>
                          )}
                        </div>

                        <div className="mt-auto flex items-center text-red-600 dark:text-red-400 font-semibold text-sm group-hover:translate-x-1 transition-transform">
                          {t('View Solution', 'Lösung ansehen')}
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
        ) : (
          <div>
            {filteredManuals.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-lg text-slate-500 dark:text-slate-400">
                  {t('No manuals found.', 'Keine Anleitungen gefunden.')}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-lg dark:shadow-xl hover:shadow-2xl dark:hover:shadow-blue-900/20 transition-all duration-300 border border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500/50 h-full flex flex-col">
                        <div className="flex items-start justify-between mb-3">
                          <h3 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400/90 transition-colors flex-1">
                            {manual.title}
                          </h3>
                        </div>

                        {manual.description && (
                          <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2 mb-4 leading-relaxed">
                            {manual.description}
                          </p>
                        )}

                        <div className="flex flex-wrap gap-2 mb-4">
                          {manual.manual_type && (
                            <span className="px-2 py-1 rounded-lg text-xs font-semibold bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-900/30">
                              {manual.manual_type}
                            </span>
                          )}
                          {manual.difficulty_level && (
                            <span className={`px-2 py-1 rounded-lg text-xs font-bold border ${getDifficultyColor(manual.difficulty_level)}`}>
                              {manual.difficulty_level}
                            </span>
                          )}
                          {manual.estimated_time && (
                            <span className="px-2 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                              {manual.estimated_time}
                            </span>
                          )}
                        </div>

                        <div className="mt-auto flex items-center text-blue-600 dark:text-blue-400 font-semibold text-sm group-hover:translate-x-1 transition-transform">
                          {t('View Manual', 'Anleitung ansehen')}
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
        )}
      </div>
    </div>
  );
}

