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
  description?: string;
};

type ErrorCode = {
  code: string;
  meaning: string;
  faults: Array<{
    id: string;
    slug: string;
    title: string;
    description?: string;
    severity?: string;
    difficulty_level?: string;
    affected_component?: string;
    estimated_repair_time?: string;
    symptoms?: string[];
    diagnostic_steps?: string[];
    tools_required?: string[];
    parts_required?: string[];
  }>;
  count: number;
  severity?: string;
  affectedComponent?: string;
  difficultyLevel?: string;
  estimatedRepairTime?: string;
  symptoms: string[];
  diagnosticSteps: string[];
  toolsRequired: string[];
  partsRequired: string[];
};

type Props = {
  brand: CarBrand;
  model: CarModel;
  generation: ModelGeneration;
  errorCodes: ErrorCode[];
  totalErrorCodes: number;
};

export default function GenerationErrorCodesClient({ brand, model, generation, errorCodes, totalErrorCodes }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedComponent, setSelectedComponent] = useState<string>('all');

  // Get unique values for filters
  const uniqueSeverities = Array.from(new Set(errorCodes.map(ec => ec.severity).filter(Boolean)));
  const uniqueComponents = Array.from(new Set(errorCodes.map(ec => ec.affectedComponent).filter(Boolean)));

  // Filter error codes
  const filteredErrorCodes = useMemo(() => {
    return errorCodes.filter(errorCode => {
      const matchesSearch = 
        errorCode.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        errorCode.meaning.toLowerCase().includes(searchQuery.toLowerCase()) ||
        errorCode.affectedComponent?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        errorCode.faults.some(f => 
          f.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          f.description?.toLowerCase().includes(searchQuery.toLowerCase())
        );
      
      const matchesSeverity = selectedSeverity === 'all' || errorCode.severity === selectedSeverity;
      const matchesComponent = selectedComponent === 'all' || errorCode.affectedComponent === selectedComponent;
      
      return matchesSearch && matchesSeverity && matchesComponent;
    });
  }, [errorCodes, searchQuery, selectedSeverity, selectedComponent]);

  const getSeverityColor = (severity?: string) => {
    switch (severity?.toLowerCase()) {
      case 'critical': return 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800';
      case 'high': return 'bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800';
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
    { name: generation.generation_code || generation.name, url: `https://fahrzeugfehler.de/cars/${brand.slug}/${model.slug}/${generation.slug}` },
    { name: 'Fehlercodes', url: `https://fahrzeugfehler.de/cars/${brand.slug}/${model.slug}/${generation.slug}/error-codes` },
  ];

  // Prepare ItemList structured data for all error codes (all faults with error codes)
  const errorCodesListItems = errorCodes.flatMap(ec => 
    ec.faults.map(fault => ({
      name: `${ec.code}: ${fault.title}`,
      description: ec.meaning,
      url: `https://fahrzeugfehler.de/cars/${brand.slug}/${model.slug}/${generation.slug}/error-codes/${fault.slug}`,
    }))
  );

  // Prepare FAQ structured data
  const faqs = [
    {
      question: `Was sind die häufigsten Fehlercodes beim ${brand.name} ${model.name} ${generation.generation_code || generation.name}?`,
      answer: `Die häufigsten Fehlercodes beim ${brand.name} ${model.name} ${generation.generation_code || generation.name} umfassen OBD-II Codes wie P0300 (Zylinderfehlzündung), P0171/P0172 (Kraftstoffgemisch), P0420 (Katalysator) sowie BMW-spezifische Codes wie 279C (Kennfeldthermostat) und 8F (DMTL Tankleckage). Auf dieser Seite finden Sie eine vollständige Übersicht aller ${totalErrorCodes} Fehlercodes mit Bedeutung und Lösungen.`,
    },
    {
      question: `Wie kann ich Fehlercodes beim ${brand.name} ${model.name} ${generation.generation_code || generation.name} auslesen?`,
      answer: `Fehlercodes können mit einem OBD-II Diagnosegerät ausgelesen werden. Stecken Sie das Gerät in den OBD-II Anschluss (meist unter dem Armaturenbrett) und starten Sie die Diagnose. Die Codes werden dann angezeigt und können auf dieser Seite nachgeschlagen werden.`,
    },
    {
      question: `Was bedeutet ein Fehlercode beim ${brand.name} ${model.name} ${generation.generation_code || generation.name}?`,
      answer: `Jeder Fehlercode hat eine spezifische Bedeutung. OBD-II Codes (P0xxx) sind standardisiert, während BMW-spezifische Codes (z.B. 279C, 8F) herstellerspezifisch sind. Auf dieser Seite finden Sie für jeden der ${totalErrorCodes} Fehlercodes eine detaillierte Beschreibung, mögliche Ursachen und Lösungsvorschläge.`,
    },
    {
      question: `Kann ich Fehlercodes beim ${brand.name} ${model.name} ${generation.generation_code || generation.name} selbst beheben?`,
      answer: `Die Behebung hängt vom Fehlercode und der Schwierigkeit ab. Einfache Codes (z.B. P0135 - Lambda-Sonde Heizung) können oft selbst behoben werden, während komplexe Codes (z.B. 100 - Steuergerät Mikroprozessor) Fachwissen erfordern. Jeder Fehlercode auf dieser Seite enthält eine Schwierigkeitsbewertung und geschätzte Reparaturzeit.`,
    },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <BreadcrumbStructuredData items={breadcrumbItems} />
      <ItemListStructuredData
        name={`Fehlercodes ${brand.name} ${model.name} ${generation.generation_code || generation.name}`}
        description={`Vollständige Liste aller ${totalErrorCodes} Fehlercodes für ${brand.name} ${model.name} ${generation.generation_code || generation.name} mit Bedeutung und Lösungen`}
        items={errorCodesListItems}
      />
      <FAQPageStructuredData faqs={faqs} />
      
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
            <nav className="mb-4 sm:mb-6 flex items-center justify-center flex-wrap space-x-2 text-xs sm:text-sm text-slate-400 px-2" aria-label="Breadcrumb">
              <Link href="/" className="hover:text-white transition-colors">
                Startseite
              </Link>
              <span aria-hidden="true">/</span>
              <Link href="/cars" className="hover:text-white transition-colors">
                Autos
              </Link>
              <span aria-hidden="true">/</span>
              <Link href={`/cars/${brand.slug}`} className="hover:text-white transition-colors">
                {brand.name}
              </Link>
              <span aria-hidden="true">/</span>
              <Link href={`/cars/${brand.slug}/${model.slug}`} className="hover:text-white transition-colors">
                {model.name}
              </Link>
              <span aria-hidden="true">/</span>
              <Link href={`/cars/${brand.slug}/${model.slug}/${generation.slug}`} className="hover:text-white transition-colors">
                {generation.generation_code || generation.name}
              </Link>
              <span aria-hidden="true">/</span>
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
              {brand.name} {model.name} {generation.generation_code || generation.name}
            </h2>

            {(generation.year_start || generation.year_end) && (
              <p className="text-sm sm:text-base md:text-lg text-slate-400 mb-4 sm:mb-6 px-2">
                {generation.year_start} - {generation.year_end || 'Heute'}
              </p>
            )}

            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 mt-6 sm:mt-8">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="font-semibold text-white">{errorCodes.length.toLocaleString()}</span>
                <span className="text-slate-300">Fehlercodes</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span className="font-semibold text-white">{errorCodes.reduce((sum, ec) => sum + ec.count, 0).toLocaleString()}</span>
                <span className="text-slate-300">Fehlerlösungen</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 md:py-16">
        {/* Search and Filter */}
        <div className="mb-8 sm:mb-10 space-y-4 sm:space-y-6">
          {/* Search Bar */}
          <div className="relative max-w-3xl mx-auto">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-transparent to-blue-500/10 rounded-xl blur-xl"></div>
            <input
              type="text"
              placeholder="Fehlercode oder Bedeutung suchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="relative w-full px-4 sm:px-6 py-3 sm:py-4 md:py-5 text-base sm:text-lg border-2 border-slate-300 dark:border-slate-700 rounded-lg sm:rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 focus:border-transparent transition-all shadow-lg min-h-[44px]"
              aria-label="Fehlercode oder Bedeutung suchen"
            />
            <svg
              className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 sm:w-6 sm:h-6 text-slate-400 dark:text-slate-500 z-10"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 px-2">
            {uniqueSeverities.length > 0 && (
              <>
                <span className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 w-full sm:w-auto text-center sm:text-left mb-2 sm:mb-0">
                  Schweregrad:
                </span>
                <button
                  onClick={() => setSelectedSeverity('all')}
                  className={`px-3 sm:px-4 py-2 rounded-lg font-bold text-xs sm:text-sm border-2 transition-all duration-200 min-h-[44px] ${
                    selectedSeverity === 'all'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-lg scale-105'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:border-blue-500 dark:hover:border-blue-500'
                  }`}
                  aria-pressed={selectedSeverity === 'all'}
                  aria-label="Alle Schweregrade anzeigen"
                >
                  Alle
                </button>
                {uniqueSeverities.map((severity) => (
                  <button
                    key={severity}
                    onClick={() => setSelectedSeverity(severity!)}
                    className={`px-3 sm:px-4 py-2 rounded-lg font-bold text-xs sm:text-sm border-2 transition-all duration-200 min-h-[44px] ${
                      selectedSeverity === severity
                        ? 'bg-blue-600 text-white border-blue-600 shadow-lg scale-105'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:border-blue-500 dark:hover:border-blue-500'
                    }`}
                    aria-pressed={selectedSeverity === severity}
                    aria-label={`Nur ${severity} anzeigen`}
                  >
                    {severity}
                  </button>
                ))}
              </>
            )}
            {uniqueComponents.length > 0 && (
              <>
                <span className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 w-full sm:w-auto text-center sm:text-left mb-2 sm:mb-0 ml-4">
                  Komponente:
                </span>
                <select
                  value={selectedComponent}
                  onChange={(e) => setSelectedComponent(e.target.value)}
                  className="px-3 sm:px-4 py-2 min-h-[44px] border-2 border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 focus:border-blue-500 dark:focus:border-blue-600 transition-all shadow-sm hover:shadow-md"
                  aria-label="Komponente filtern"
                >
                  <option value="all">Alle Komponenten</option>
                  {uniqueComponents.map(component => (
                    <option key={component} value={component}>{component}</option>
                  ))}
                </select>
              </>
            )}
          </div>
        </div>

        {/* Error Codes Grid */}
        {filteredErrorCodes.length === 0 ? (
          <div className="text-center py-12 sm:py-16" role="status" aria-live="polite">
            <svg className="w-20 h-20 sm:w-24 sm:h-24 mx-auto text-slate-300 dark:text-slate-700 mb-4 sm:mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-2 sm:mb-3 px-4">
              {errorCodes.length === 0 
                ? 'Keine Fehlercodes verfügbar'
                : 'Keine Fehlercodes gefunden'}
            </h3>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mb-4 sm:mb-6 px-4">
              {errorCodes.length === 0
                ? `Für ${brand.name} ${model.name} ${generation.generation_code || generation.name} sind noch keine Fehlercodes in der Datenbank vorhanden.`
                : searchQuery || selectedSeverity !== 'all' || selectedComponent !== 'all'
                ? 'Versuchen Sie, Ihre Suche oder Filter anzupassen.'
                : 'Keine Fehlercodes gefunden.'}
            </p>
            {(searchQuery || selectedSeverity !== 'all' || selectedComponent !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedSeverity('all');
                  setSelectedComponent('all');
                }}
                className="inline-flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 min-h-[44px] bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors text-sm sm:text-base"
                aria-label="Filter zurücksetzen"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Filter zurücksetzen
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {filteredErrorCodes.map((errorCode, index) => (
              <motion.div
                key={errorCode.code}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                className="bg-white dark:bg-slate-900 rounded-lg sm:rounded-xl p-5 sm:p-6 border-2 border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500/50 hover:shadow-xl transition-all duration-300"
              >
                {/* Error Code Header */}
                <div className="mb-4">
                  <div className="flex items-start justify-between mb-3 gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono break-all mb-2" id={`error-code-${errorCode.code}`}>
                        {errorCode.code}
                      </h3>
                      <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
                        {errorCode.meaning}
                      </p>
                    </div>
                    {errorCode.count > 1 && (
                      <span className="px-2 sm:px-3 py-1 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 text-xs font-bold rounded-full border border-blue-200 dark:border-blue-800 flex-shrink-0" aria-label={`${errorCode.count} Fehlerlösungen`}>
                        {errorCode.count}
                      </span>
                    )}
                  </div>
                </div>

                {/* Metadata Tags */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {errorCode.severity && (
                    <span className={`px-2 sm:px-3 py-1 rounded-lg text-xs font-semibold border uppercase ${getSeverityColor(errorCode.severity)}`} aria-label={`Schweregrad: ${errorCode.severity}`}>
                      {errorCode.severity}
                    </span>
                  )}
                  {errorCode.difficultyLevel && (
                    <span className={`px-2 sm:px-3 py-1 rounded-lg text-xs font-semibold border uppercase ${getDifficultyColor(errorCode.difficultyLevel)}`} aria-label={`Schwierigkeit: ${errorCode.difficultyLevel}`}>
                      {errorCode.difficultyLevel}
                    </span>
                  )}
                  {errorCode.affectedComponent && (
                    <span className="px-2 sm:px-3 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700" aria-label={`Betroffene Komponente: ${errorCode.affectedComponent}`}>
                      {errorCode.affectedComponent}
                    </span>
                  )}
                  {errorCode.estimatedRepairTime && (
                    <span className="px-2 sm:px-3 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      ⏱ {errorCode.estimatedRepairTime}
                    </span>
                  )}
                </div>

                {/* Symptoms */}
                {errorCode.symptoms.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-2">Symptome:</h4>
                    <ul className="list-disc list-inside space-y-1 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                      {errorCode.symptoms.slice(0, 3).map((symptom, idx) => (
                        <li key={idx}>{symptom}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Faults List */}
                <div className="space-y-2 sm:space-y-3 border-t border-slate-200 dark:border-slate-700 pt-4 mt-4" role="list" aria-labelledby={`error-code-${errorCode.code}`}>
                  {errorCode.faults.map((fault) => {
                    const faultUrl = `/cars/${brand.slug}/${model.slug}/${generation.slug}/error-codes/${fault.slug}`;
                    return (
                      <div key={fault.id} className="border border-slate-200 dark:border-slate-700 rounded-lg p-3 sm:p-4 hover:border-blue-300 dark:hover:border-blue-700 transition-colors" role="listitem">
                        <Link href={faultUrl} className="group block">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 mb-1">
                                {fault.title}
                              </h4>
                              {fault.description && (
                                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                                  {fault.description}
                                </p>
                              )}
                            </div>
                            <svg className="w-5 h-5 text-slate-400 dark:text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 flex-shrink-0 mt-0.5 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </Link>
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

