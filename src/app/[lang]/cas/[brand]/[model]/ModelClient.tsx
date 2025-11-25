'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

type CarBrand = {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
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
  is_featured: boolean;
  display_order: number;
  car_brands: CarBrand;
};

type CarFault = {
  id: string;
  car_model_id: string;
  slug: string;
  title: string;
  description: string;
  solution: string;
  language_path: string;
  status: string;
  error_code?: string;
  affected_component?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  frequency?: string;
  symptoms?: string[];
  diagnostic_steps?: string[];
  tools_required?: string[];
  estimated_repair_time?: string;
  difficulty_level?: 'easy' | 'medium' | 'hard' | 'expert';
  meta_description?: string;
  created_at: string;
};

type CarManual = {
  id: string;
  car_model_id: string;
  title: string;
  slug: string;
  content: string;
  language_path: string;
  status: string;
  manual_type?: 'maintenance' | 'repair' | 'diagnostic' | 'parts' | 'specifications' | 'other';
  section?: string;
  page_number?: number;
  difficulty_level?: 'easy' | 'medium' | 'hard' | 'expert';
  estimated_time?: string;
  tools_required?: string[];
  parts_required?: string[];
  created_at: string;
};

type ModelClientProps = {
  model: CarModel;
  faults: CarFault[];
  manuals: CarManual[];
  lang: string;
};

export default function ModelClient({ model, faults, manuals, lang }: ModelClientProps) {
  const [activeTab, setActiveTab] = useState<'faults' | 'manuals'>('faults');
  const [selectedFault, setSelectedFault] = useState<CarFault | null>(null);
  const [selectedManual, setSelectedManual] = useState<CarManual | null>(null);
  const [faultFilter, setFaultFilter] = useState<'all' | 'low' | 'medium' | 'high' | 'critical'>('all');
  const [manualFilter, setManualFilter] = useState<'all' | 'maintenance' | 'repair' | 'diagnostic' | 'parts' | 'specifications' | 'other'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'severity' | 'difficulty'>('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const t = (en: string, de: string) => lang === 'de' ? de : en;

  const brand = model.car_brands;

  // Filter and sort faults
  const filteredFaults = faults.filter(fault => {
    if (faultFilter !== 'all' && fault.severity !== faultFilter) return false;
    if (searchQuery && !fault.title.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !fault.description.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  }).sort((a, b) => {
    if (sortBy === 'severity') {
      const severityOrder = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1 };
      return (severityOrder[b.severity as keyof typeof severityOrder] || 0) - 
             (severityOrder[a.severity as keyof typeof severityOrder] || 0);
    }
    if (sortBy === 'difficulty') {
      const difficultyOrder = { 'expert': 4, 'hard': 3, 'medium': 2, 'easy': 1 };
      return (difficultyOrder[b.difficulty_level as keyof typeof difficultyOrder] || 0) - 
             (difficultyOrder[a.difficulty_level as keyof typeof difficultyOrder] || 0);
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  // Filter and sort manuals
  const filteredManuals = manuals.filter(manual => {
    if (manualFilter !== 'all' && manual.manual_type !== manualFilter) return false;
    if (searchQuery && !manual.title.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !manual.content.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  }).sort((a, b) => {
    if (sortBy === 'difficulty') {
      const difficultyOrder = { 'expert': 4, 'hard': 3, 'medium': 2, 'easy': 1 };
      return (difficultyOrder[b.difficulty_level as keyof typeof difficultyOrder] || 0) - 
             (difficultyOrder[a.difficulty_level as keyof typeof difficultyOrder] || 0);
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-600 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-white';
      case 'low': return 'bg-green-500 text-white';
      default: return 'bg-slate-500 text-white';
    }
  };

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case 'expert': return 'bg-red-600 text-white';
      case 'hard': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-white';
      case 'easy': return 'bg-green-500 text-white';
      default: return 'bg-slate-500 text-white';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-red-600 via-red-700 to-red-800 dark:from-red-950 dark:via-red-900 dark:to-red-950">
        <div className="absolute inset-0 bg-gradient-to-br from-black/20 via-transparent to-black/10 dark:from-black/40 dark:via-transparent dark:to-black/20"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_70%)] dark:bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.05),transparent_70%)]"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            {/* Breadcrumb */}
            <nav className="mb-6 flex items-center justify-center space-x-2 text-sm text-red-100">
              <Link
                href={`/${lang}`}
                className="hover:text-white transition-colors"
              >
                {t('Home', 'Startseite')}
              </Link>
              <span>/</span>
              <Link
                href={`/${lang}/cas`}
                className="hover:text-white transition-colors"
              >
                {t('CAS', 'CAS')}
              </Link>
              <span>/</span>
              <Link
                href={`/${lang}/cas/${brand.slug}`}
                className="hover:text-white transition-colors"
              >
                {brand.name}
              </Link>
              <span>/</span>
              <span className="font-semibold">{model.name}</span>
            </nav>
            
            {/* Quick Navigation */}
            <div className="mb-6 flex flex-wrap gap-3 justify-center">
              <Link
                href={`/${lang}/cas`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 dark:bg-white/5 rounded-lg text-sm font-semibold text-red-50 dark:text-red-100/90 hover:bg-white/20 dark:hover:bg-white/10 transition-all backdrop-blur-sm border border-white/10 dark:border-white/5"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                {t('All Brands', 'Alle Marken')}
              </Link>
              <Link
                href={`/${lang}/cas/${brand.slug}`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 dark:bg-white/5 rounded-lg text-sm font-semibold text-red-50 dark:text-red-100/90 hover:bg-white/20 dark:hover:bg-white/10 transition-all backdrop-blur-sm border border-white/10 dark:border-white/5"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                {t('Back to', 'Zurück zu')} {brand.name}
              </Link>
            </div>

            {model.image_url && (
              <div className="mb-6 flex justify-center">
                <div className="relative h-48 w-full max-w-md">
                  <img
                    src={model.image_url}
                    alt={model.name}
                    className="h-full w-full object-contain"
                  />
                </div>
              </div>
            )}
            <h1 className="text-5xl sm:text-6xl font-black text-white mb-4 tracking-tight drop-shadow-lg dark:drop-shadow-2xl">
              <span className="bg-gradient-to-r from-white via-red-50 to-white dark:from-white dark:via-red-100 dark:to-white bg-clip-text text-transparent">
                {model.name}
              </span>
            </h1>
            <p className="text-2xl text-red-50 dark:text-red-100 mb-2 drop-shadow-md font-semibold">
              {brand.name}
            </p>
            {(model.year_start || model.year_end) && (
              <p className="text-lg text-red-50 dark:text-red-100/90">
                {model.year_start && model.year_end
                  ? `${model.year_start} - ${model.year_end}`
                  : model.year_start
                  ? `${t('From', 'Ab')} ${model.year_start}`
                  : model.year_end
                  ? `${t('Until', 'Bis')} ${model.year_end}`
                  : ''}
              </p>
            )}
            {model.description && (
              <p className="text-lg text-red-50 dark:text-red-100/90 mt-4 max-w-2xl mx-auto leading-relaxed">
                {model.description}
              </p>
            )}
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Quick Navigation */}
        <div className="mb-8 flex flex-wrap gap-4 justify-center">
          <Link
            href={`/${lang}/cas`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-800/80 dark:backdrop-blur-sm rounded-lg text-sm font-semibold text-slate-700 dark:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-700/80 hover:text-red-600 dark:hover:text-red-400 transition-all border border-slate-200 dark:border-zinc-700/50 dark:shadow-lg"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            {t('All Brands', 'Alle Marken')}
          </Link>
          <Link
            href={`/${lang}/cas/${brand.slug}`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-800/80 dark:backdrop-blur-sm rounded-lg text-sm font-semibold text-slate-700 dark:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-700/80 hover:text-red-600 dark:hover:text-red-400 transition-all border border-slate-200 dark:border-zinc-700/50 dark:shadow-lg"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            {t('Back to', 'Zurück zu')} {brand.name}
          </Link>
          <Link
            href={`/${lang}/chat`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-800/80 dark:backdrop-blur-sm rounded-lg text-sm font-semibold text-slate-700 dark:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-700/80 hover:text-red-600 dark:hover:text-red-400 transition-all border border-slate-200 dark:border-zinc-700/50 dark:shadow-lg"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            {t('Ask Question', 'Frage stellen')}
          </Link>
          <Link
            href={`/${lang}/knowledge`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-800/80 dark:backdrop-blur-sm rounded-lg text-sm font-semibold text-slate-700 dark:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-700/80 hover:text-red-600 dark:hover:text-red-400 transition-all border border-slate-200 dark:border-zinc-700/50 dark:shadow-lg"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            {t('Knowledge Base', 'Wissensbasis')}
          </Link>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/40 dark:to-red-900/30 dark:backdrop-blur-sm rounded-xl p-6 border border-red-200 dark:border-red-900/30 hover:shadow-lg dark:hover:shadow-red-900/20 transition-all duration-300"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-700 dark:text-red-300/90 mb-1">
                  {t('Faults & Solutions', 'Fehler & Lösungen')}
                </p>
                <p className="text-3xl font-black text-red-600 dark:text-red-400/90">
                  {faults.length}
                </p>
                <p className="text-xs text-red-600/70 dark:text-red-400/60 mt-1">
                  {filteredFaults.length} {t('visible', 'sichtbar')}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-200 dark:bg-red-950/50 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform border border-red-300/50 dark:border-red-900/30">
                <svg className="w-6 h-6 text-red-600 dark:text-red-400/90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/40 dark:to-blue-900/30 dark:backdrop-blur-sm rounded-xl p-6 border border-blue-200 dark:border-blue-900/30 hover:shadow-lg dark:hover:shadow-blue-900/20 transition-all duration-300"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700 dark:text-blue-300/90 mb-1">
                  {t('Fixing Manuals', 'Reparaturanleitungen')}
                </p>
                <p className="text-3xl font-black text-blue-600 dark:text-blue-400/90">
                  {manuals.length}
                </p>
                <p className="text-xs text-blue-600/70 dark:text-blue-400/60 mt-1">
                  {filteredManuals.length} {t('visible', 'sichtbar')}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-200 dark:bg-blue-950/50 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform border border-blue-300/50 dark:border-blue-900/30">
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400/90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/40 dark:to-green-900/30 dark:backdrop-blur-sm rounded-xl p-6 border border-green-200 dark:border-green-900/30 hover:shadow-lg dark:hover:shadow-green-900/20 transition-all duration-300"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700 dark:text-green-300/90 mb-1">
                  {t('Total Resources', 'Gesamtressourcen')}
                </p>
                <p className="text-3xl font-black text-green-600 dark:text-green-400/90">
                  {faults.length + manuals.length}
                </p>
                <p className="text-xs text-green-600/70 dark:text-green-400/60 mt-1">
                  {t('Available now', 'Jetzt verfügbar')}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-200 dark:bg-green-950/50 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform border border-green-300/50 dark:border-green-900/30">
                <svg className="w-6 h-6 text-green-600 dark:text-green-400/90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Search and Filter Bar */}
        <div className="mb-6 space-y-4">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 via-transparent to-red-500/5 dark:from-red-500/10 dark:via-transparent dark:to-red-500/10 rounded-xl blur-xl"></div>
            <input
              type="text"
              placeholder={t('Search faults and manuals...', 'Fehler und Anleitungen suchen...')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="relative w-full px-6 py-4 text-lg border-2 border-slate-300 dark:border-zinc-700/50 rounded-xl bg-white dark:bg-zinc-800/80 dark:backdrop-blur-sm text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500 dark:focus:ring-red-600 focus:border-transparent transition-all shadow-sm dark:shadow-xl"
            />
            <svg
              className="absolute right-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-slate-400 dark:text-zinc-500 z-10"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          
          <div className="flex flex-wrap items-center gap-4">
            {activeTab === 'faults' && (
              <div className="flex items-center gap-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-zinc-200">
                  {t('Filter by Severity', 'Nach Schweregrad filtern')}:
                </label>
                <select
                  value={faultFilter}
                  onChange={(e) => setFaultFilter(e.target.value as typeof faultFilter)}
                  className="px-4 py-2 border border-slate-300 dark:border-zinc-700/50 rounded-lg bg-white dark:bg-zinc-800/80 dark:backdrop-blur-sm text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-red-500 dark:focus:ring-red-600 shadow-sm dark:shadow-lg"
                >
                  <option value="all">{t('All Severities', 'Alle Schweregrade')}</option>
                  <option value="critical">{t('Critical', 'Kritisch')}</option>
                  <option value="high">{t('High', 'Hoch')}</option>
                  <option value="medium">{t('Medium', 'Mittel')}</option>
                  <option value="low">{t('Low', 'Niedrig')}</option>
                </select>
              </div>
            )}
            
            {activeTab === 'manuals' && (
              <div className="flex items-center gap-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-zinc-200">
                  {t('Filter by Type', 'Nach Typ filtern')}:
                </label>
                <select
                  value={manualFilter}
                  onChange={(e) => setManualFilter(e.target.value as typeof manualFilter)}
                  className="px-4 py-2 border border-slate-300 dark:border-zinc-700/50 rounded-lg bg-white dark:bg-zinc-800/80 dark:backdrop-blur-sm text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 shadow-sm dark:shadow-lg"
                >
                  <option value="all">{t('All Types', 'Alle Typen')}</option>
                  <option value="maintenance">{t('Maintenance', 'Wartung')}</option>
                  <option value="repair">{t('Repair', 'Reparatur')}</option>
                  <option value="diagnostic">{t('Diagnostic', 'Diagnose')}</option>
                  <option value="parts">{t('Parts', 'Teile')}</option>
                  <option value="specifications">{t('Specifications', 'Spezifikationen')}</option>
                </select>
              </div>
            )}
            
            <div className="flex items-center gap-2 ml-auto">
              <label className="text-sm font-semibold text-slate-700 dark:text-zinc-200">
                {t('Sort by', 'Sortieren nach')}:
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="px-4 py-2 border border-slate-300 dark:border-zinc-700/50 rounded-lg bg-white dark:bg-zinc-800/80 dark:backdrop-blur-sm text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-red-500 dark:focus:ring-red-600 shadow-sm dark:shadow-lg"
              >
                <option value="newest">{t('Newest First', 'Neueste zuerst')}</option>
                {activeTab === 'faults' && (
                  <>
                    <option value="severity">{t('Severity', 'Schweregrad')}</option>
                    <option value="difficulty">{t('Difficulty', 'Schwierigkeit')}</option>
                  </>
                )}
                {activeTab === 'manuals' && (
                  <option value="difficulty">{t('Difficulty', 'Schwierigkeit')}</option>
                )}
              </select>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-8 border-b border-slate-300 dark:border-zinc-700/50">
          <div className="flex space-x-8">
            <button
              onClick={() => {
                setActiveTab('faults');
                setSelectedFault(null);
                setSelectedManual(null);
                setSearchQuery('');
              }}
              className={`py-4 px-2 border-b-2 font-semibold text-lg transition-colors relative ${
                activeTab === 'faults'
                  ? 'border-red-600 dark:border-red-500 text-red-600 dark:text-red-400/90'
                  : 'border-transparent text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-300'
              }`}
            >
              {t('Faults & Solutions', 'Fehler & Lösungen')}
              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-bold ${
                activeTab === 'faults'
                  ? 'bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-300/90 border border-red-200/50 dark:border-red-900/30'
                  : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400'
              }`}>
                {filteredFaults.length}
              </span>
            </button>
            <button
              onClick={() => {
                setActiveTab('manuals');
                setSelectedFault(null);
                setSelectedManual(null);
                setSearchQuery('');
              }}
              className={`py-4 px-2 border-b-2 font-semibold text-lg transition-colors relative ${
                activeTab === 'manuals'
                  ? 'border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-400/90'
                  : 'border-transparent text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-300'
              }`}
            >
              {t('Fixing Manuals', 'Reparaturanleitungen')}
              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-bold ${
                activeTab === 'manuals'
                  ? 'bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300/90 border border-blue-200/50 dark:border-blue-900/30'
                  : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400'
              }`}>
                {filteredManuals.length}
              </span>
            </button>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'faults' && (
          <div>
            {selectedFault ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-zinc-800/90 dark:backdrop-blur-sm rounded-2xl shadow-xl dark:shadow-2xl p-8 mb-6 border border-slate-200 dark:border-zinc-700/50"
              >
                <button
                  onClick={() => setSelectedFault(null)}
                  className="mb-6 flex items-center text-slate-600 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400/90 transition-colors"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  {t('Back to Faults List', 'Zurück zur Fehlerliste')}
                </button>
                <h2 className="text-3xl font-bold text-slate-900 dark:text-zinc-100 mb-4">
                  {selectedFault.title}
                </h2>
                {selectedFault.error_code && (
                  <div className="mb-4">
                    <span className="inline-block px-3 py-1 bg-slate-200 dark:bg-zinc-700/80 text-slate-800 dark:text-zinc-200 rounded-lg text-sm font-semibold border border-slate-300/50 dark:border-zinc-600/50">
                      {t('Error Code', 'Fehlercode')}: {selectedFault.error_code}
                    </span>
                  </div>
                )}
                {selectedFault.severity && (
                  <div className="mb-4">
                    <span className={`inline-block px-3 py-1 rounded-lg text-sm font-semibold ${getSeverityColor(selectedFault.severity)} shadow-sm dark:shadow-lg`}>
                      {t('Severity', 'Schweregrad')}: {selectedFault.severity.toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="prose dark:prose-invert max-w-none mb-6">
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-zinc-100 mb-2">
                    {t('Description', 'Beschreibung')}
                  </h3>
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm, remarkMath]}
                    rehypePlugins={[[rehypeKatex, { strict: false }]]}
                  >
                    {selectedFault.description}
                  </ReactMarkdown>
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-zinc-100 mb-2 mt-6">
                    {t('Solution', 'Lösung')}
                  </h3>
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm, remarkMath]}
                    rehypePlugins={[[rehypeKatex, { strict: false }]]}
                  >
                    {selectedFault.solution}
                  </ReactMarkdown>
                </div>
                {selectedFault.symptoms && selectedFault.symptoms.length > 0 && (
                  <div className="mt-6 p-4 bg-slate-50 dark:bg-zinc-800/50 rounded-lg border border-slate-200 dark:border-zinc-700/50">
                    <h4 className="font-semibold text-slate-900 dark:text-zinc-100 mb-2">
                      {t('Symptoms', 'Symptome')}:
                    </h4>
                    <ul className="list-disc list-inside space-y-1 text-slate-700 dark:text-zinc-300">
                      {selectedFault.symptoms.map((symptom, idx) => (
                        <li key={idx}>{symptom}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {selectedFault.diagnostic_steps && selectedFault.diagnostic_steps.length > 0 && (
                  <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-900/30">
                    <h4 className="font-semibold text-slate-900 dark:text-zinc-100 mb-2">
                      {t('Diagnostic Steps', 'Diagnoseschritte')}:
                    </h4>
                    <ol className="list-decimal list-inside space-y-2 text-slate-700 dark:text-zinc-300">
                      {selectedFault.diagnostic_steps.map((step, idx) => (
                        <li key={idx}>{step}</li>
                      ))}
                    </ol>
                  </div>
                )}
                {selectedFault.tools_required && selectedFault.tools_required.length > 0 && (
                  <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg border border-yellow-200 dark:border-yellow-900/30">
                    <h4 className="font-semibold text-slate-900 dark:text-zinc-100 mb-2">
                      {t('Tools Required', 'Benötigte Werkzeuge')}:
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedFault.tools_required.map((tool, idx) => (
                        <span key={idx} className="px-3 py-1 bg-yellow-200 dark:bg-yellow-900/40 text-yellow-900 dark:text-yellow-200 rounded-lg text-sm border border-yellow-300/50 dark:border-yellow-800/30">
                          {tool}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {selectedFault.estimated_repair_time && (
                  <div className="mt-6 p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-900/30">
                    <p className="text-slate-700 dark:text-zinc-300">
                      <span className="font-semibold">{t('Estimated Repair Time', 'Geschätzte Reparaturzeit')}:</span> {selectedFault.estimated_repair_time}
                    </p>
                  </div>
                )}
              </motion.div>
            ) : (
              <div className="space-y-6">
                {filteredFaults.length === 0 ? (
                  <div className="text-center py-16 bg-white dark:bg-zinc-800/90 dark:backdrop-blur-sm rounded-2xl shadow-lg dark:shadow-2xl border border-slate-200 dark:border-zinc-700/50">
                    <svg className="w-16 h-16 mx-auto text-slate-400 dark:text-zinc-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-lg font-semibold text-slate-700 dark:text-zinc-300 mb-2">
                      {searchQuery || faultFilter !== 'all' 
                        ? t('No faults match your filters.', 'Keine Fehler entsprechen Ihren Filtern.')
                        : t('No faults found for this model.', 'Keine Fehler für dieses Modell gefunden.')}
                    </p>
                    {(searchQuery || faultFilter !== 'all') && (
                      <button
                        onClick={() => {
                          setSearchQuery('');
                          setFaultFilter('all');
                        }}
                        className="text-red-600 dark:text-red-400/90 hover:underline text-sm font-medium"
                      >
                        {t('Clear filters', 'Filter zurücksetzen')}
                      </button>
                    )}
                  </div>
                ) : (
                  filteredFaults.map((fault, index) => (
                    <motion.div
                      key={fault.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.05 }}
                    >
                      <div
                        onClick={() => setSelectedFault(fault)}
                        className="group relative bg-white dark:bg-zinc-800/90 dark:backdrop-blur-sm rounded-2xl shadow-lg dark:shadow-2xl hover:shadow-xl dark:hover:shadow-red-900/20 p-6 cursor-pointer transition-all duration-300 border border-slate-200 dark:border-zinc-700/50 hover:border-red-500 dark:hover:border-red-500/50 overflow-hidden"
                      >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-red-500/5 to-transparent rounded-full blur-2xl group-hover:from-red-500/10 dark:group-hover:from-red-500/20 transition-opacity"></div>
                        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-slate-50/50 dark:to-zinc-900/50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="flex items-start justify-between mb-4 relative z-10">
                          <h3 className="text-2xl font-bold text-slate-900 dark:text-zinc-100 flex-grow group-hover:text-red-600 dark:group-hover:text-red-400/90 transition-colors">
                            {fault.title}
                          </h3>
                          {fault.severity && (
                            <span className={`ml-4 px-3 py-1.5 rounded-lg text-xs font-bold ${getSeverityColor(fault.severity)} shadow-sm dark:shadow-lg`}>
                              {fault.severity.toUpperCase()}
                            </span>
                          )}
                        </div>
                        {fault.error_code && (
                          <div className="flex items-center gap-2 mb-3 relative z-10">
                            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <p className="text-sm text-slate-500 dark:text-zinc-400">
                              {t('Error Code', 'Fehlercode')}: <span className="font-mono font-semibold text-slate-700 dark:text-zinc-200">{fault.error_code}</span>
                            </p>
                          </div>
                        )}
                        <p className="text-slate-600 dark:text-zinc-300 line-clamp-3 mb-4 leading-relaxed relative z-10">
                          {fault.description}
                        </p>
                        {fault.affected_component && (
                          <div className="flex items-center gap-2 mb-2 relative z-10">
                            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <p className="text-sm text-slate-500 dark:text-zinc-400">
                              {t('Affected Component', 'Betroffene Komponente')}: <span className="font-semibold text-slate-700 dark:text-zinc-200">{fault.affected_component}</span>
                            </p>
                          </div>
                        )}
                        <div className="flex items-center text-red-600 dark:text-red-400/90 font-semibold text-sm mt-4 group-hover:translate-x-1 transition-transform relative z-10">
                          {t('View Solution', 'Lösung ansehen')}
                          <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'manuals' && (
          <div>
            {selectedManual ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-zinc-800/90 dark:backdrop-blur-sm rounded-2xl shadow-xl dark:shadow-2xl p-8 mb-6 border border-slate-200 dark:border-zinc-700/50"
              >
                <button
                  onClick={() => setSelectedManual(null)}
                  className="mb-6 flex items-center text-slate-600 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400/90 transition-colors"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  {t('Back to Manuals List', 'Zurück zur Anleitungsliste')}
                </button>
                <h2 className="text-3xl font-bold text-slate-900 dark:text-zinc-100 mb-4">
                  {selectedManual.title}
                </h2>
                {selectedManual.manual_type && (
                  <div className="mb-4">
                    <span className="inline-block px-3 py-1 bg-blue-200 dark:bg-blue-950/50 text-blue-900 dark:text-blue-200 rounded-lg text-sm font-semibold border border-blue-300/50 dark:border-blue-900/30 shadow-sm dark:shadow-lg">
                      {selectedManual.manual_type.toUpperCase()}
                    </span>
                  </div>
                )}
                {selectedManual.difficulty_level && (
                  <div className="mb-4">
                    <span className={`inline-block px-3 py-1 rounded-lg text-sm font-semibold ${getDifficultyColor(selectedManual.difficulty_level)} shadow-sm dark:shadow-lg`}>
                      {t('Difficulty', 'Schwierigkeit')}: {selectedManual.difficulty_level.toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="prose dark:prose-invert max-w-none mb-6">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm, remarkMath]}
                    rehypePlugins={[[rehypeKatex, { strict: false }]]}
                  >
                    {selectedManual.content}
                  </ReactMarkdown>
                </div>
                {selectedManual.tools_required && selectedManual.tools_required.length > 0 && (
                  <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg border border-yellow-200 dark:border-yellow-900/30">
                    <h4 className="font-semibold text-slate-900 dark:text-zinc-100 mb-2">
                      {t('Tools Required', 'Benötigte Werkzeuge')}:
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedManual.tools_required.map((tool, idx) => (
                        <span key={idx} className="px-3 py-1 bg-yellow-200 dark:bg-yellow-900/40 text-yellow-900 dark:text-yellow-200 rounded-lg text-sm border border-yellow-300/50 dark:border-yellow-800/30">
                          {tool}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {selectedManual.parts_required && selectedManual.parts_required.length > 0 && (
                  <div className="mt-6 p-4 bg-purple-50 dark:bg-purple-950/30 rounded-lg border border-purple-200 dark:border-purple-900/30">
                    <h4 className="font-semibold text-slate-900 dark:text-zinc-100 mb-2">
                      {t('Parts Required', 'Benötigte Teile')}:
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedManual.parts_required.map((part, idx) => (
                        <span key={idx} className="px-3 py-1 bg-purple-200 dark:bg-purple-900/40 text-purple-900 dark:text-purple-200 rounded-lg text-sm border border-purple-300/50 dark:border-purple-800/30">
                          {part}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {selectedManual.estimated_time && (
                  <div className="mt-6 p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-900/30">
                    <p className="text-slate-700 dark:text-zinc-300">
                      <span className="font-semibold">{t('Estimated Time', 'Geschätzte Zeit')}:</span> {selectedManual.estimated_time}
                    </p>
                  </div>
                )}
              </motion.div>
            ) : (
              <div className="space-y-6">
                {filteredManuals.length === 0 ? (
                  <div className="text-center py-16 bg-white dark:bg-zinc-800/90 dark:backdrop-blur-sm rounded-2xl shadow-lg dark:shadow-2xl border border-slate-200 dark:border-zinc-700/50">
                    <svg className="w-16 h-16 mx-auto text-slate-400 dark:text-zinc-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    <p className="text-lg font-semibold text-slate-700 dark:text-zinc-300 mb-2">
                      {searchQuery || manualFilter !== 'all'
                        ? t('No manuals match your filters.', 'Keine Anleitungen entsprechen Ihren Filtern.')
                        : t('No manuals found for this model.', 'Keine Anleitungen für dieses Modell gefunden.')}
                    </p>
                    {(searchQuery || manualFilter !== 'all') && (
                      <button
                        onClick={() => {
                          setSearchQuery('');
                          setManualFilter('all');
                        }}
                        className="text-blue-600 dark:text-blue-400/90 hover:underline text-sm font-medium"
                      >
                        {t('Clear filters', 'Filter zurücksetzen')}
                      </button>
                    )}
                  </div>
                ) : (
                  filteredManuals.map((manual, index) => (
                    <motion.div
                      key={manual.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.05 }}
                    >
                      <div
                        onClick={() => setSelectedManual(manual)}
                        className="group relative bg-white dark:bg-zinc-800/90 dark:backdrop-blur-sm rounded-2xl shadow-lg dark:shadow-2xl hover:shadow-xl dark:hover:shadow-blue-900/20 p-6 cursor-pointer transition-all duration-300 border border-slate-200 dark:border-zinc-700/50 hover:border-blue-500 dark:hover:border-blue-500/50 overflow-hidden"
                      >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/5 to-transparent rounded-full blur-2xl group-hover:from-blue-500/10 dark:group-hover:from-blue-500/20 transition-opacity"></div>
                        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-blue-50/50 dark:to-zinc-900/50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="flex items-start justify-between mb-4 relative z-10">
                          <h3 className="text-2xl font-bold text-slate-900 dark:text-zinc-100 flex-grow group-hover:text-blue-600 dark:group-hover:text-blue-400/90 transition-colors">
                            {manual.title}
                          </h3>
                          {manual.manual_type && (
                            <span className="ml-4 px-3 py-1.5 bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300/90 rounded-lg text-xs font-bold shadow-sm dark:shadow-lg border border-blue-200/50 dark:border-blue-900/30">
                              {manual.manual_type.toUpperCase()}
                            </span>
                          )}
                        </div>
                        {manual.section && (
                          <div className="flex items-center gap-2 mb-3 relative z-10">
                            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <p className="text-sm text-slate-500 dark:text-zinc-400">
                              {t('Section', 'Abschnitt')}: <span className="font-semibold text-slate-700 dark:text-zinc-200">{manual.section}</span>
                            </p>
                          </div>
                        )}
                        <div className="prose dark:prose-invert max-w-none relative z-10">
                          <div className="text-slate-600 dark:text-zinc-300 line-clamp-3 leading-relaxed">
                            {manual.content.substring(0, 300)}...
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-4 relative z-10">
                          {manual.difficulty_level && (
                            <span className={`inline-block px-3 py-1.5 rounded-lg text-xs font-bold ${getDifficultyColor(manual.difficulty_level)} shadow-sm dark:shadow-lg`}>
                              {t('Difficulty', 'Schwierigkeit')}: {manual.difficulty_level.toUpperCase()}
                            </span>
                          )}
                          <div className="flex items-center text-blue-600 dark:text-blue-400/90 font-semibold text-sm group-hover:translate-x-1 transition-transform ml-auto">
                            {t('Read Manual', 'Anleitung lesen')}
                            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

