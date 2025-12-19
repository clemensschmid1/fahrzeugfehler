'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useState, useMemo } from 'react';
import { getBrandLogoUrl } from '@/lib/car-brand-logos';
import { BreadcrumbStructuredData, ItemListStructuredData, FAQPageStructuredData } from '@/components/StructuredData';

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
  year_start?: number;
  year_end?: number;
};

type Fault = {
  id: string;
  slug: string;
  title: string;
  error_code?: string;
  severity?: string;
  difficulty_level?: string;
  affected_component?: string;
  estimated_repair_time?: string;
  model_generation_id?: string;
  model_generations?: {
    id: string;
    name: string;
    slug: string;
    generation_code?: string;
    year_start?: number;
    year_end?: number;
  };
};

type ErrorCodeGroup = {
  code: string;
  faults: Fault[];
  count: number;
  faultsByGeneration: Array<{
    generationId: string;
    generation?: ModelGeneration;
    faults: Fault[];
  }>;
  severities: string[];
  components: string[];
  difficulties: string[];
  mostCommonSeverity?: string;
  mostCommonComponent?: string;
  mostCommonDifficulty?: string;
};

type Props = {
  brand: CarBrand;
  model: CarModel;
  generations: ModelGeneration[];
  errorCodes: ErrorCodeGroup[];
  errorCodesByGeneration: any[]; // For backward compatibility, not used
};

export default function ErrorCodesClient({ brand, model, generations, errorCodes }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGeneration, setSelectedGeneration] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedComponent, setSelectedComponent] = useState<string>('all');

  // Get unique values for filters
  const uniqueSeverities = useMemo(() => {
    const severities = new Set<string>();
    errorCodes.forEach(group => {
      group.severities.forEach(s => severities.add(s));
    });
    return Array.from(severities);
  }, [errorCodes]);

  const uniqueComponents = useMemo(() => {
    const components = new Set<string>();
    errorCodes.forEach(group => {
      group.components.forEach(c => components.add(c));
    });
    return Array.from(components);
  }, [errorCodes]);

  // Filter error codes
  const filteredErrorCodes = useMemo(() => {
    return errorCodes.filter(group => {
      // Search filter
      const matchesSearch = 
        group.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        group.faults.some(f => 
          f.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          f.affected_component?.toLowerCase().includes(searchQuery.toLowerCase())
        );
      
      // Generation filter
      const matchesGeneration = 
        selectedGeneration === 'all' ||
        group.faults.some(f => f.model_generation_id === selectedGeneration);
      
      // Severity filter
      const matchesSeverity = 
        selectedSeverity === 'all' ||
        group.severities.includes(selectedSeverity);
      
      // Component filter
      const matchesComponent = 
        selectedComponent === 'all' ||
        group.components.includes(selectedComponent);
      
      return matchesSearch && matchesGeneration && matchesSeverity && matchesComponent;
    }).map(group => ({
      ...group,
      // Filter faults within the group based on generation filter
      faults: selectedGeneration === 'all' 
        ? group.faults 
        : group.faults.filter(f => f.model_generation_id === selectedGeneration),
    }));
  }, [errorCodes, searchQuery, selectedGeneration, selectedSeverity, selectedComponent]);

  const getSeverityColor = (severity?: string) => {
    switch (severity?.toLowerCase()) {
      case 'critical': return 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800';
      case 'high': return 'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      case 'medium': return 'bg-yellow-50 dark:bg-yellow-950/30 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800';
      case 'low': return 'bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800';
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

  // Breadcrumb items for structured data
  const breadcrumbItems = [
    { name: 'Startseite', url: 'https://fahrzeugfehler.de' },
    { name: 'Autos', url: 'https://fahrzeugfehler.de/cars' },
    { name: brand.name, url: `https://fahrzeugfehler.de/cars/${brand.slug}` },
    { name: model.name, url: `https://fahrzeugfehler.de/cars/${brand.slug}/${model.slug}` },
    { name: 'Fehlercodes', url: `https://fahrzeugfehler.de/cars/${brand.slug}/${model.slug}/error-codes` },
  ];

  // Prepare ItemList structured data
  const errorCodesListItems = errorCodes.flatMap(group => 
    group.faults.map(fault => {
      const generation = fault.model_generations;
      const url = generation?.slug
        ? `https://fahrzeugfehler.de/cars/${brand.slug}/${model.slug}/${generation.slug}/error-codes/${fault.slug}`
        : `https://fahrzeugfehler.de/cars/${brand.slug}/${model.slug}/error-codes`;
      return {
        name: `${group.code}: ${fault.title}`,
        description: fault.affected_component || group.code,
        url,
      };
    })
  );

  // Prepare FAQ structured data
  const faqs = [
    {
      question: `Was sind die häufigsten Fehlercodes beim ${brand.name} ${model.name}?`,
      answer: `Die häufigsten Fehlercodes beim ${brand.name} ${model.name} umfassen OBD-II Codes wie P0300 (Zylinderfehlzündung), P0171/P0172 (Kraftstoffgemisch), P0420 (Katalysator) sowie herstellerspezifische Codes. Auf dieser Seite finden Sie eine vollständige Übersicht aller ${errorCodes.length} verschiedenen Fehlercodes mit Bedeutung und Lösungen für alle Generationen des Modells.`,
    },
    {
      question: `Wie kann ich Fehlercodes beim ${brand.name} ${model.name} auslesen?`,
      answer: `Fehlercodes können mit einem OBD-II Diagnosegerät ausgelesen werden. Stecken Sie das Gerät in den OBD-II Anschluss (meist unter dem Armaturenbrett) und starten Sie die Diagnose. Die Codes werden dann angezeigt und können auf dieser Seite nachgeschlagen werden.`,
    },
    {
      question: `Was bedeutet ein Fehlercode beim ${brand.name} ${model.name}?`,
      answer: `Jeder Fehlercode hat eine spezifische Bedeutung. OBD-II Codes (P0xxx) sind standardisiert, während herstellerspezifische Codes modellabhängig sind. Auf dieser Seite finden Sie für jeden der ${errorCodes.length} Fehlercodes eine detaillierte Beschreibung, mögliche Ursachen und Lösungsvorschläge für alle Generationen.`,
    },
    {
      question: `Welche Generationen des ${brand.name} ${model.name} haben welche Fehlercodes?`,
      answer: `Auf dieser Seite sehen Sie alle Fehlercodes für alle Generationen des ${brand.name} ${model.name}. Jeder Fehlercode zeigt, in welchen Generationen er auftritt. Sie können nach Generation filtern, um nur die Fehlercodes einer bestimmten Generation anzuzeigen.`,
    },
  ];

  const totalFaults = errorCodes.reduce((sum, group) => sum + group.count, 0);

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <BreadcrumbStructuredData items={breadcrumbItems} />
      <ItemListStructuredData items={errorCodesListItems} />
      <FAQPageStructuredData faqs={faqs} />
      
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-black dark:via-slate-950 dark:to-black">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.02%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%221%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-40"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            {/* Breadcrumb */}
            <nav className="mb-6 sm:mb-8 flex items-center justify-center flex-wrap space-x-1 sm:space-x-2 text-xs sm:text-sm text-slate-400 px-2 overflow-x-auto pb-2">
              <Link href="/" className="hover:text-white transition-colors whitespace-nowrap">
                Startseite
              </Link>
              <span className="flex-shrink-0">/</span>
              <Link href="/cars" className="hover:text-white transition-colors whitespace-nowrap">
                Autos
              </Link>
              <span className="flex-shrink-0">/</span>
              <Link href={`/cars/${brand.slug}`} className="hover:text-white transition-colors whitespace-nowrap truncate max-w-[80px] sm:max-w-none">
                {brand.name}
              </Link>
              <span className="flex-shrink-0">/</span>
              <Link href={`/cars/${brand.slug}/${model.slug}`} className="hover:text-white transition-colors whitespace-nowrap truncate max-w-[80px] sm:max-w-none">
                {model.name}
              </Link>
              <span className="flex-shrink-0">/</span>
              <span className="text-white font-semibold whitespace-nowrap">Fehlercodes</span>
            </nav>

            {/* Brand Logo */}
            {(() => {
              const logoUrl = getBrandLogoUrl(brand.slug, brand.name, brand.logo_url);
              return logoUrl ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, y: -20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2, type: "spring", stiffness: 100 }}
                  className="mb-8 sm:mb-10 flex justify-center"
                >
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-white/30 via-white/20 to-white/30 rounded-3xl blur-3xl -z-10 animate-pulse"></div>
                    <div className="absolute inset-0 bg-white/10 rounded-3xl blur-2xl -z-10 group-hover:bg-white/20 transition-all duration-500"></div>
                    
                    <div className="relative bg-gradient-to-br from-white/15 via-white/10 to-white/5 dark:from-white/10 dark:via-white/5 dark:to-white/0 backdrop-blur-xl rounded-3xl p-5 sm:p-7 md:p-9 border-2 border-white/30 dark:border-white/20 shadow-2xl group-hover:border-white/40 dark:group-hover:border-white/30 transition-all duration-500 group-hover:shadow-[0_0_40px_rgba(255,255,255,0.3)]">
                      <div className="absolute inset-2 rounded-2xl border border-white/10 dark:border-white/5"></div>
                      
                      <Image
                        src={logoUrl}
                        alt={`${brand.name} logo`}
                        width={200}
                        height={200}
                        className="relative h-20 sm:h-24 md:h-28 w-auto object-contain filter drop-shadow-[0_0_30px_rgba(0,0,0,0.5)] group-hover:scale-105 transition-transform duration-500"
                        loading="eager"
                        quality={90}
                        priority
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

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white mb-3 sm:mb-4 tracking-tight px-2">
              Fehlercodes Übersicht
            </h1>
            
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-300 dark:text-slate-400 mb-4 sm:mb-6 px-2">
              {brand.name} {model.name}
            </h2>

            <p className="text-base sm:text-lg text-slate-300 dark:text-slate-400 max-w-3xl mx-auto leading-relaxed px-2 mb-6 sm:mb-8">
              Vollständige Übersicht aller Fehlercodes für alle Generationen des {brand.name} {model.name}
            </p>

            {/* Stats */}
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs sm:text-sm text-slate-400 px-2">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="font-semibold text-white">{errorCodes.length.toLocaleString()}</span>
                <span className="hidden sm:inline">verschiedene Fehlercodes</span>
                <span className="sm:hidden">Codes</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span className="font-semibold text-white">{totalFaults.toLocaleString()}</span>
                <span>Fehlerlösungen</span>
              </div>
              {generations.length > 0 && (
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                  <span className="font-semibold text-white">{generations.length}</span>
                  <span className="hidden sm:inline">Generationen</span>
                  <span className="sm:hidden">Gen.</span>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 md:py-16">
        {/* Search and Filters */}
        <div className="mb-8 sm:mb-12 space-y-4 sm:space-y-6">
          {/* Search Bar */}
          <div className="relative max-w-3xl mx-auto">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-transparent to-blue-500/10 rounded-xl blur-xl"></div>
            <input
              type="text"
              placeholder="Fehlercode oder Beschreibung suchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="relative w-full px-4 sm:px-6 py-3 sm:py-4 md:py-5 text-base sm:text-lg border-2 border-slate-300 dark:border-slate-700 rounded-lg sm:rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 focus:border-transparent transition-all shadow-lg min-h-[44px]"
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

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-center justify-center">
            {/* Generation Filter */}
            {generations.length > 0 && (
              <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
                <span className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 w-full sm:w-auto text-center sm:text-left">
                  Generation:
                </span>
                <button
                  onClick={() => setSelectedGeneration('all')}
                  className={`px-3 sm:px-4 py-2 rounded-lg font-bold text-xs sm:text-sm border-2 transition-all duration-200 min-h-[44px] ${
                    selectedGeneration === 'all'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-lg scale-105'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:border-blue-500 dark:hover:border-blue-500'
                  }`}
                >
                  Alle
                </button>
                {generations.map((gen) => (
                  <button
                    key={gen.id}
                    onClick={() => setSelectedGeneration(gen.id)}
                    className={`px-3 sm:px-4 py-2 rounded-lg font-bold text-xs sm:text-sm border-2 transition-all duration-200 min-h-[44px] ${
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

            {/* Severity Filter */}
            {uniqueSeverities.length > 0 && (
              <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
                <span className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 w-full sm:w-auto text-center sm:text-left">
                  Schweregrad:
                </span>
                <button
                  onClick={() => setSelectedSeverity('all')}
                  className={`px-3 sm:px-4 py-2 rounded-lg font-bold text-xs sm:text-sm border-2 transition-all duration-200 min-h-[44px] ${
                    selectedSeverity === 'all'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-lg scale-105'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:border-blue-500 dark:hover:border-blue-500'
                  }`}
                >
                  Alle
                </button>
                {uniqueSeverities.map((severity) => (
                  <button
                    key={severity}
                    onClick={() => setSelectedSeverity(severity)}
                    className={`px-3 sm:px-4 py-2 rounded-lg font-bold text-xs sm:text-sm border-2 transition-all duration-200 min-h-[44px] uppercase ${getSeverityColor(severity)} ${
                      selectedSeverity === severity
                        ? 'shadow-lg scale-105 border-current'
                        : 'hover:border-blue-500 dark:hover:border-blue-500'
                    }`}
                  >
                    {severity}
                  </button>
                ))}
              </div>
            )}

            {/* Component Filter */}
            {uniqueComponents.length > 0 && (
              <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
                <span className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 w-full sm:w-auto text-center sm:text-left">
                  Komponente:
                </span>
                <button
                  onClick={() => setSelectedComponent('all')}
                  className={`px-3 sm:px-4 py-2 rounded-lg font-bold text-xs sm:text-sm border-2 transition-all duration-200 min-h-[44px] ${
                    selectedComponent === 'all'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-lg scale-105'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:border-blue-500 dark:hover:border-blue-500'
                  }`}
                >
                  Alle
                </button>
                {uniqueComponents.slice(0, 5).map((component) => (
                  <button
                    key={component}
                    onClick={() => setSelectedComponent(component)}
                    className={`px-3 sm:px-4 py-2 rounded-lg font-bold text-xs sm:text-sm border-2 transition-all duration-200 min-h-[44px] ${
                      selectedComponent === component
                        ? 'bg-blue-600 text-white border-blue-600 shadow-lg scale-105'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:border-blue-500 dark:hover:border-blue-500'
                    }`}
                  >
                    {component.length > 20 ? component.substring(0, 17) + '...' : component}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Error Codes Grid */}
        {filteredErrorCodes.length === 0 ? (
          <div className="text-center py-12 sm:py-16">
            <svg className="w-20 h-20 sm:w-24 sm:h-24 mx-auto text-slate-300 dark:text-slate-700 mb-4 sm:mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-2 sm:mb-3 px-4">
              {errorCodes.length === 0 
                ? 'Keine Fehlercodes verfügbar'
                : 'Keine Fehlercodes gefunden'}
            </h3>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mb-4 sm:mb-6 px-4">
              {errorCodes.length === 0
                ? `Für ${brand.name} ${model.name} sind noch keine Fehlercodes in der Datenbank vorhanden.`
                : 'Versuchen Sie, Ihre Suche oder Filter anzupassen.'}
            </p>
            {(searchQuery || selectedGeneration !== 'all' || selectedSeverity !== 'all' || selectedComponent !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedGeneration('all');
                  setSelectedSeverity('all');
                  setSelectedComponent('all');
                }}
                className="inline-flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 min-h-[44px] bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors text-sm sm:text-base"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Alle Filter zurücksetzen
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            {filteredErrorCodes.map((group, index) => {
              // Get unique generations for this error code
              const uniqueGenerations = Array.from(new Map(
                group.faults.map(f => {
                  const gen = f.model_generations;
                  return gen ? [gen.id, gen] : null;
                }).filter(Boolean) as Array<[string, NonNullable<Fault['model_generations']>]>
              ).values());

              return (
                <motion.div
                  key={group.code}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.03 }}
                  className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl p-5 sm:p-6 border-2 border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500/50 hover:shadow-xl transition-all duration-300"
                >
                  {/* Error Code Header */}
                  <div className="mb-4 sm:mb-5">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 dark:text-white font-mono break-all mb-2">
                          {group.code}
                        </h3>
                        {/* Generations Badge */}
                        {uniqueGenerations.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-2">
                            {uniqueGenerations.slice(0, 3).map((gen) => (
                              <span
                                key={gen.id}
                                className="inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                              >
                                {gen.generation_code || gen.name}
                              </span>
                            ))}
                            {uniqueGenerations.length > 3 && (
                              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
                                +{uniqueGenerations.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      <span className="px-3 py-1.5 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 text-xs sm:text-sm font-bold rounded-full border border-blue-200 dark:border-blue-800 flex-shrink-0 whitespace-nowrap">
                        {group.count} {group.count === 1 ? 'Fehler' : 'Fehler'}
                      </span>
                    </div>

                    {/* Quick Info Tags */}
                    <div className="flex flex-wrap gap-1.5">
                      {group.mostCommonSeverity && (
                        <span className={`px-2 py-1 rounded text-xs font-semibold border uppercase ${getSeverityColor(group.mostCommonSeverity)}`}>
                          {group.mostCommonSeverity}
                        </span>
                      )}
                      {group.mostCommonDifficulty && (
                        <span className={`px-2 py-1 rounded text-xs font-semibold border uppercase ${getDifficultyColor(group.mostCommonDifficulty)}`}>
                          {group.mostCommonDifficulty}
                        </span>
                      )}
                      {group.mostCommonComponent && (
                        <span className="px-2 py-1 rounded text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 line-clamp-1">
                          {group.mostCommonComponent}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Faults List */}
                  <div className="space-y-2 sm:space-y-3">
                    {group.faults.slice(0, 5).map((fault) => {
                      const generation = fault.model_generations;
                      const faultUrl = generation?.slug
                        ? `/cars/${brand.slug}/${model.slug}/${generation.slug}/error-codes/${fault.slug}`
                        : null;

                      return (
                        <div key={fault.id} className="border border-slate-200 dark:border-slate-700 rounded-lg p-3 sm:p-4 hover:border-blue-300 dark:hover:border-blue-700 transition-colors bg-slate-50/50 dark:bg-slate-800/30">
                          {faultUrl ? (
                            <Link href={faultUrl} className="group block">
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <div className="flex-1 min-w-0">
                                  <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 mb-1">
                                    {fault.title}
                                  </h4>
                                  {generation && (
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                      {generation.generation_code || generation.name}
                                      {generation.year_start && generation.year_end && ` (${generation.year_start}-${generation.year_end})`}
                                      {generation.year_start && !generation.year_end && ` (ab ${generation.year_start})`}
                                    </p>
                                  )}
                                </div>
                                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 dark:text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 flex-shrink-0 mt-0.5 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                {fault.severity && (
                                  <span className={`px-1.5 sm:px-2 py-0.5 rounded text-xs font-semibold border uppercase ${getSeverityColor(fault.severity)}`}>
                                    {fault.severity}
                                  </span>
                                )}
                                {fault.difficulty_level && (
                                  <span className={`px-1.5 sm:px-2 py-0.5 rounded text-xs font-semibold border uppercase ${getDifficultyColor(fault.difficulty_level)}`}>
                                    {fault.difficulty_level}
                                  </span>
                                )}
                                {fault.affected_component && (
                                  <span className="px-1.5 sm:px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 line-clamp-1">
                                    {fault.affected_component}
                                  </span>
                                )}
                              </div>
                            </Link>
                          ) : (
                            <div>
                              <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mb-1">
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
                    {group.faults.length > 5 && (
                      <div className="text-center pt-2">
                        <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
                          +{group.faults.length - 5} weitere Fehlerlösungen
                        </span>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
