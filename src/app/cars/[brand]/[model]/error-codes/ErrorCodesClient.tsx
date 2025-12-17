'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useState, useMemo } from 'react';
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
  generation_code?: string;
};

type Fault = {
  id: string;
  slug: string;
  title: string;
  error_code?: string;
  severity?: string;
  difficulty_level?: string;
  affected_component?: string;
  model_generation_id?: string;
  model_generations?: {
    id: string;
    name: string;
    slug: string;
    generation_code?: string;
  };
};

type ErrorCodeGroup = {
  code: string;
  faults: Fault[];
  count: number;
};

type Props = {
  brand: CarBrand;
  model: CarModel;
  generations: ModelGeneration[];
  errorCodes: ErrorCodeGroup[];
};

export default function ErrorCodesClient({ brand, model, generations, errorCodes }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGeneration, setSelectedGeneration] = useState<string>('all');

  // Filter error codes based on search and generation
  const filteredErrorCodes = useMemo(() => {
    return errorCodes.filter(group => {
      const matchesSearch = 
        group.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        group.faults.some(f => 
          f.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          f.affected_component?.toLowerCase().includes(searchQuery.toLowerCase())
        );
      
      const matchesGeneration = 
        selectedGeneration === 'all' ||
        group.faults.some(f => f.model_generation_id === selectedGeneration);
      
      return matchesSearch && matchesGeneration;
    });
  }, [errorCodes, searchQuery, selectedGeneration]);

  const getSeverityColor = (severity?: string) => {
    switch (severity?.toLowerCase()) {
      case 'critical': return 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-700';
      case 'high': return 'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      case 'medium': return 'bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';
      case 'low': return 'bg-gray-50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700';
      default: return 'bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    }
  };

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'expert': return 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-700';
      case 'hard': return 'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      case 'medium': return 'bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';
      case 'easy': return 'bg-gray-50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700';
      default: return 'bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';
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
              <Link href="/" className="hover:text-white transition-colors">
                Startseite
              </Link>
              <span>/</span>
              <Link href="/cars" className="hover:text-white transition-colors">
                Autos
              </Link>
              <span>/</span>
              <Link href={`/cars/${brand.slug}`} className="hover:text-white transition-colors">
                {brand.name}
              </Link>
              <span>/</span>
              <Link href={`/cars/${brand.slug}/${model.slug}`} className="hover:text-white transition-colors">
                {model.name}
              </Link>
              <span>/</span>
              <span className="text-white font-semibold">Fehlercodes</span>
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
                    <div className="absolute inset-0 bg-gradient-to-r from-white/30 via-white/20 to-white/30 rounded-3xl blur-3xl -z-10 animate-pulse"></div>
                    <div className="absolute inset-0 bg-white/10 rounded-3xl blur-2xl -z-10 group-hover:bg-white/20 transition-all duration-500"></div>
                    
                    <div className="relative bg-gradient-to-br from-white/15 via-white/10 to-white/5 dark:from-white/10 dark:via-white/5 dark:to-white/0 backdrop-blur-xl rounded-3xl p-5 sm:p-7 md:p-9 border-2 border-white/30 dark:border-white/20 shadow-2xl group-hover:border-white/40 dark:group-hover:border-white/30 transition-all duration-500 group-hover:shadow-[0_0_40px_rgba(255,255,255,0.3)]">
                      <div className="absolute inset-2 rounded-2xl border border-white/10 dark:border-white/5"></div>
                      
                      <img
                        src={logoUrl}
                        alt={`${brand.name} logo`}
                        className="relative h-20 sm:h-24 md:h-28 object-contain filter drop-shadow-[0_0_30px_rgba(0,0,0,0.5)] group-hover:scale-105 transition-transform duration-500"
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
              Fehlercodes
            </h1>
            
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-300 dark:text-slate-400 mb-6">
              {brand.name} {model.name}
            </h2>

            <p className="text-lg text-slate-300 dark:text-slate-400 max-w-3xl mx-auto leading-relaxed">
              Übersicht aller Diagnosecodes und Fehlercodes für {brand.name} {model.name}
            </p>

            {/* Stats */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-400 mt-8">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="font-semibold text-white">{errorCodes.length.toLocaleString()}</span>
                <span>verschiedene Fehlercodes</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span className="font-semibold text-white">{errorCodes.reduce((sum, group) => sum + group.count, 0).toLocaleString()}</span>
                <span>Fehlerlösungen</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {/* Search and Filter */}
        <div className="mb-10 space-y-6">
          {/* Search Bar */}
          <div className="relative max-w-3xl mx-auto">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-transparent to-blue-500/10 rounded-xl blur-xl"></div>
            <input
              type="text"
              placeholder="Fehlercode oder Beschreibung suchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="relative w-full px-6 py-4 sm:py-5 text-lg border-2 border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 focus:border-transparent transition-all shadow-lg"
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

          {/* Generation Filter */}
          {generations.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-3">
              <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                Nach Generation filtern:
              </span>
              <button
                onClick={() => setSelectedGeneration('all')}
                className={`px-4 py-2 rounded-lg font-bold text-sm border-2 transition-all duration-200 ${
                  selectedGeneration === 'all'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-lg scale-105'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:border-blue-500 dark:hover:border-blue-500'
                }`}
              >
                Alle Generationen
              </button>
              {generations.map((gen) => (
                <button
                  key={gen.id}
                  onClick={() => setSelectedGeneration(gen.id)}
                  className={`px-4 py-2 rounded-lg font-bold text-sm border-2 transition-all duration-200 ${
                    selectedGeneration === gen.id
                      ? 'bg-blue-600 text-white border-blue-600 shadow-lg scale-105'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:border-blue-500 dark:hover:border-blue-500'
                  }`}
                >
                  {gen.generation_code || gen.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Error Codes Grid */}
        {filteredErrorCodes.length === 0 ? (
          <div className="text-center py-16">
            <svg className="w-24 h-24 mx-auto text-slate-300 dark:text-slate-700 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
              Keine Fehlercodes gefunden
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              Versuchen Sie, Ihre Suche anzupassen.
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Suche zurücksetzen
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredErrorCodes.map((group, index) => (
              <motion.div
                key={group.code}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                className="bg-white dark:bg-slate-900 rounded-xl p-6 border-2 border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500/50 hover:shadow-xl transition-all duration-300"
              >
                {/* Error Code Header */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                      {group.code}
                    </h3>
                    <span className="px-3 py-1 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 text-xs font-bold rounded-full border border-blue-200 dark:border-blue-800">
                      {group.count} {group.count === 1 ? 'Fehler' : 'Fehler'}
                    </span>
                  </div>
                </div>

                {/* Faults List */}
                <div className="space-y-3">
                  {group.faults
                    .filter(f => selectedGeneration === 'all' || f.model_generation_id === selectedGeneration)
                    .map((fault) => {
                      const generation = fault.model_generations;
                      const faultUrl = generation?.slug
                        ? `/cars/${brand.slug}/${model.slug}/${generation.slug}/faults/${fault.slug}`
                        : null;

                      return (
                        <div key={fault.id} className="border border-slate-200 dark:border-slate-700 rounded-lg p-3 hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
                          {faultUrl ? (
                            <Link href={faultUrl} className="group block">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 mb-1">
                                    {fault.title}
                                  </h4>
                                  {generation && (
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                      {generation.generation_code || generation.name}
                                    </p>
                                  )}
                                </div>
                                <svg className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 flex-shrink-0 mt-0.5 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </div>
                              <div className="flex flex-wrap gap-1.5 mt-2">
                                {fault.severity && (
                                  <span className={`px-2 py-0.5 rounded text-xs font-semibold border uppercase ${getSeverityColor(fault.severity)}`}>
                                    {fault.severity}
                                  </span>
                                )}
                                {fault.difficulty_level && (
                                  <span className={`px-2 py-0.5 rounded text-xs font-semibold border uppercase ${getDifficultyColor(fault.difficulty_level)}`}>
                                    {fault.difficulty_level}
                                  </span>
                                )}
                                {fault.affected_component && (
                                  <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                    {fault.affected_component}
                                  </span>
                                )}
                              </div>
                            </Link>
                          ) : (
                            <div>
                              <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                                {fault.title}
                              </h4>
                              {generation && (
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                  {generation.generation_code || generation.name}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

