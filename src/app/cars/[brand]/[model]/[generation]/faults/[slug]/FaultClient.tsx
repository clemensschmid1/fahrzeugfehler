'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useState, useEffect, useRef, useMemo } from 'react';
import { getSupabaseClient } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';
import { usePathname, useSearchParams } from 'next/navigation';
import ThemeToggle from '@/components/ThemeToggle';

type CarBrand = {
  id: string;
  name: string;
  slug: string;
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
};

type CarFault = {
  id: string;
  slug: string;
  title: string;
  description: string;
  solution: string;
  severity?: string;
  difficulty_level?: string;
  error_code?: string;
  affected_component?: string;
  estimated_repair_time?: string;
  symptoms?: string[];
  diagnostic_steps?: string[];
  tools_required?: string[];
  parts_required?: string[];
  safety_warnings?: string[];
};

type RelatedFault = {
  id: string;
  slug: string;
  title: string;
  error_code?: string;
  similarity?: number;
  brandName?: string;
  modelName?: string;
  generationName?: string;
};

type Comment = {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  user_name?: string | null;
};

type Props = {
  brand: CarBrand;
  model: CarModel;
  generation: ModelGeneration;
  fault: CarFault;
  relatedFaults: RelatedFault[];
  globalRelatedFaults?: RelatedFault[];
  initialComments?: Comment[];
  user?: User | null;
};

export default function FaultClient({ brand, model, generation, fault, relatedFaults, globalRelatedFaults = [], initialComments = [], user }: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [copied, setCopied] = useState(false);
  const [showTOC, setShowTOC] = useState(false);
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [commentError, setCommentError] = useState<string | null>(null);
  const [relatedFaultsScope, setRelatedFaultsScope] = useState<'generation' | 'global'>('generation');
  const [isLoadingRelatedFaults, setIsLoadingRelatedFaults] = useState(false);
  
  const supabase = useMemo(() => getSupabaseClient(), []);
  const formMountTime = useRef<number>(Date.now());
  const [loadedGlobalFaults, setLoadedGlobalFaults] = useState<RelatedFault[]>(globalRelatedFaults);
  
  // Update loadedGlobalFaults when globalRelatedFaults prop changes
  useEffect(() => {
    if (globalRelatedFaults.length > 0) {
      setLoadedGlobalFaults(globalRelatedFaults);
    }
  }, [globalRelatedFaults]);
  
  // Load global related faults on demand
  const loadGlobalRelatedFaults = async () => {
    if (isLoadingRelatedFaults) return;
    
    setIsLoadingRelatedFaults(true);
    try {
      const response = await fetch('/api/embeddings/find-similar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          faultId: fault.id,
          scope: 'global',
          matchThreshold: 0.7,
          matchCount: 6,
          language: 'de',
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: errorText || `HTTP ${response.status}` };
        }
        console.error('[Related Faults] Failed to load global faults:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
        });
        return;
      }
      
      const data = await response.json();
      
      if (data.error) {
        console.error('[Related Faults] API returned error:', data.error);
        return;
      }
      
      if (data.success && data.results && data.results.length > 0) {
        setLoadedGlobalFaults(data.results.map((f: any) => ({
          id: f.id,
          slug: f.slug,
          title: f.title,
          similarity: typeof f.similarity === 'number' ? f.similarity : parseFloat(f.similarity || '0'),
          brandName: f.brand_name,
          modelName: f.model_name,
          generationName: f.generation_name,
        })));
      } else {
        console.warn('[Related Faults] No global results found:', {
          success: data.success,
          count: data.count,
          resultsLength: data.results?.length,
          data,
        });
      }
    } catch (error) {
      console.error('[Related Faults] Failed to load global related faults:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
    } finally {
      setIsLoadingRelatedFaults(false);
    }
  };

  useEffect(() => {
    formMountTime.current = Date.now();
  }, []);

  // Clean solution to remove redundant sections (symptoms, diagnostic steps, verification, prevention tips)
  // These are displayed separately, so we remove them from the solution text
  const cleanSolution = useMemo(() => {
    let cleaned = fault.solution;
    
    // Remove symptoms section if it exists in markdown (since we show it separately)
    if (fault.symptoms && fault.symptoms.length > 0) {
      cleaned = cleaned.replace(/###?\s*Symptoms?[\s\S]*?(?=###|##|$)/gi, '');
      cleaned = cleaned.replace(/##\s*Symptoms?[\s\S]*?(?=##|$)/gi, '');
    }
    
    // Remove diagnostic steps section if it exists in markdown (since we show it separately)
    if (fault.diagnostic_steps && fault.diagnostic_steps.length > 0) {
      cleaned = cleaned.replace(/###?\s*Diagnostic\s+Steps?[\s\S]*?(?=###|##|$)/gi, '');
      cleaned = cleaned.replace(/##\s*Diagnostic\s+Steps?[\s\S]*?(?=##|$)/gi, '');
      cleaned = cleaned.replace(/###?\s*Diagnosis[\s\S]*?(?=###|##|$)/gi, '');
    }
    
    // Remove verification section (we show it separately)
    cleaned = cleaned.replace(/###?\s*Verification[\s\S]*?(?=###|##|$)/gi, '');
    cleaned = cleaned.replace(/##\s*Verification[\s\S]*?(?=##|$)/gi, '');
    
    // Remove prevention tips section (we show it separately)
    cleaned = cleaned.replace(/###?\s*Prevention\s+Tips?[\s\S]*?(?=###|##|$)/gi, '');
    cleaned = cleaned.replace(/##\s*Prevention\s+Tips?[\s\S]*?(?=##|$)/gi, '');
    cleaned = cleaned.replace(/###?\s*Prevention[\s\S]*?(?=###|##|$)/gi, '');
    
    // Remove problem statement if it appears in solution (we show it separately)
    cleaned = cleaned.replace(/###?\s*Problem\s+Statement[\s\S]*?(?=###|##|$)/gi, '');
    cleaned = cleaned.replace(/##\s*Problem\s+Statement[\s\S]*?(?=##|$)/gi, '');
    
    // Clean up multiple consecutive newlines
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
    
    return cleaned.trim();
  }, [fault.solution, fault.symptoms, fault.diagnostic_steps]);
  
  // Calculate reading time (average 200 words per minute)
  const wordCount = fault.solution.split(/\s+/).length;
  const readingTime = Math.ceil(wordCount / 200);

  // Extract headings for table of contents
  const headings = fault.solution.match(/^#{1,3}\s+(.+)$/gm) || [];
  const tocItems = headings.map((h, i) => {
    const level = h.match(/^#+/)?.[0].length || 1;
    const text = h.replace(/^#+\s+/, '');
    const id = `heading-${i}`;
    return { level, text, id };
  });

  useEffect(() => {
    // Add IDs to headings in the rendered content
    const headings = document.querySelectorAll('.prose h1, .prose h2, .prose h3');
    headings.forEach((heading, index) => {
      if (!heading.id) {
        heading.id = `heading-${index}`;
      }
    });
  }, [fault.solution]);

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = async () => {
    try {
      const pdfUrl = `/api/faults/${fault.slug}/pdf?brand=${brand.slug}&model=${model.slug}&generation=${generation.slug}`;
      
      // Open PDF HTML in new window with print dialog
      const newWindow = window.open(pdfUrl, '_blank');
      if (!newWindow) {
        alert('Bitte erlauben Sie Pop-ups für diese Seite');
        return;
      }
      
      // Wait for window to load, then trigger print (which allows saving as PDF)
      newWindow.onload = () => {
        setTimeout(() => {
          newWindow.print();
        }, 500);
      };
    } catch (error) {
      console.error('PDF export error:', error);
      alert('Fehler beim Exportieren des PDFs');
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmitting) return;
    if (newComment.length > 1000) {
      setCommentError('Maximal 1000 Zeichen erlaubt.');
      return;
    }
    const now = Date.now();
    const delta = now - formMountTime.current;
    if (delta < 3000) {
      setError('Bitte warten Sie mindestens 3 Sekunden, bevor Sie Ihren Kommentar absenden.');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    setCommentError(null);
    try {
      const response = await fetch('/api/cars/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          carFaultId: fault.id,
          content: newComment,
          submitDeltaMs: delta,
        }),
      });
      if (!response.ok) {
        let errorMsg = 'Kommentar konnte nicht gepostet werden';
        try {
          const errorData = await response.json();
          errorMsg = errorData.error || errorMsg;
        } catch {
          errorMsg = 'Kommentar konnte nicht gepostet werden (ungültige Antwort)';
        }
        throw new Error(errorMsg);
      }
      const newCommentData = await response.json();
      if (newCommentData && !newCommentData.user_name && user?.email) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', user.id)
          .single();
        newCommentData.user_name = profile?.username || null;
      }
      setComments(prev => [newCommentData, ...prev]);
      setNewComment('');
    } catch (err) {
      const anError = err as Error;
      console.error('Error posting comment:', anError);
      setError(anError.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleShare = async (platform: string) => {
    const url = window.location.href;
    const title = fault.title;
    const text = `${fault.title} - ${brand.name} ${model.name} ${generation.name}`;

    switch (platform) {
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, '_blank');
        break;
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
        break;
      case 'linkedin':
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
        break;
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`, '_blank');
        break;
      case 'email':
        window.location.href = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(text + '\n\n' + url)}`;
        break;
    }
  };

  const getSeverityColor = (severity?: string) => {
    switch (severity?.toLowerCase()) {
      case 'high': case 'critical': return 'bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900/30';
      case 'medium': return 'bg-yellow-100 dark:bg-yellow-950/50 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-900/30';
      case 'low': return 'bg-green-100 dark:bg-green-950/50 text-green-700 dark:text-green-400 border-green-200 dark:border-green-900/30';
      default: return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    }
  };

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'expert': return 'bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900/30';
      case 'hard': return 'bg-slate-100 dark:bg-slate-950/50 text-slate-700 dark:text-slate-400 border-slate-200 dark:border-slate-900/30';
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
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Breadcrumb - Mobile optimized */}
            <nav className="mb-4 sm:mb-6 flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm text-slate-400 overflow-x-auto pb-2 -mx-4 sm:mx-0 px-4 sm:px-0">
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
              <Link href={`/cars/${brand.slug}/${model.slug}/${generation.slug}`} className="hover:text-white transition-colors whitespace-nowrap truncate max-w-[80px] sm:max-w-none">
                {generation.name}
              </Link>
              <span className="flex-shrink-0">/</span>
              <span className="text-white font-semibold truncate max-w-[120px] sm:max-w-none">{fault.title}</span>
            </nav>

            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-black text-white mb-2 sm:mb-3 md:mb-4 tracking-tight leading-tight">
              {fault.title}
            </h1>
            
            <p className="text-base sm:text-lg md:text-xl text-slate-300 dark:text-slate-400 mb-3 sm:mb-4 md:mb-6">
              {brand.name} {model.name} {generation.name}
            </p>

            {/* Action Buttons - Mobile optimized */}
            <div className="flex flex-wrap gap-1.5 sm:gap-2 md:gap-3 mb-3 sm:mb-4 md:mb-6">
              {/* Dark Mode Toggle */}
              <div className="px-3 py-1.5 sm:px-4 sm:py-2 bg-white/10 hover:bg-white/20 rounded-lg backdrop-blur-sm flex items-center">
                <ThemeToggle />
              </div>
              <button
                onClick={handleCopyLink}
                className="px-3 py-1.5 sm:px-4 sm:py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-semibold transition-all flex items-center gap-1.5 sm:gap-2 backdrop-blur-sm text-xs sm:text-sm min-h-[44px]"
              >
                {copied ? (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Kopiert!
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Link kopieren
                  </>
                )}
              </button>
              <button
                onClick={handlePrint}
                className="px-3 py-1.5 sm:px-4 sm:py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-semibold transition-all flex items-center gap-1.5 sm:gap-2 backdrop-blur-sm text-xs sm:text-sm min-h-[44px]"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                <span className="hidden sm:inline">Drucken</span>
              </button>
              <button
                onClick={handleExportPDF}
                className="px-3 py-1.5 sm:px-4 sm:py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-semibold transition-all flex items-center gap-1.5 sm:gap-2 backdrop-blur-sm text-xs sm:text-sm min-h-[44px]"
                title="Als PDF exportieren"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="hidden sm:inline">PDF</span>
              </button>
              {tocItems.length > 0 && (
                <button
                  onClick={() => setShowTOC(!showTOC)}
                  className="px-3 py-1.5 sm:px-4 sm:py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-semibold transition-all flex items-center gap-1.5 sm:gap-2 backdrop-blur-sm text-xs sm:text-sm min-h-[44px]"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                  <span className="hidden sm:inline">Inhaltsverzeichnis</span>
                </button>
              )}
            </div>

            {/* Badges - Enhanced and Prominent */}
            <div className="flex flex-wrap gap-2 sm:gap-3 mb-4">
              {fault.severity && (
                <span className={`px-4 py-2 rounded-xl text-sm font-black border-2 uppercase tracking-wide ${getSeverityColor(fault.severity)} shadow-sm`}>
                  Schweregrad: {fault.severity}
                </span>
              )}
              {fault.difficulty_level && (
                <span className={`px-4 py-2 rounded-xl text-sm font-black border-2 uppercase tracking-wide ${getDifficultyColor(fault.difficulty_level)} shadow-sm`}>
                  Schwierigkeit: {fault.difficulty_level}
                </span>
              )}
              {fault.error_code && (
                <span className="px-4 py-2 rounded-xl text-sm font-bold bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-2 border-blue-200 dark:border-blue-900/50 shadow-sm font-mono">
                  Fehlercode: {fault.error_code}
                </span>
              )}
              {fault.estimated_repair_time && (
                <span className="px-4 py-2 rounded-xl text-sm font-bold bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-2 border-blue-200 dark:border-blue-900/50 shadow-sm flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {fault.estimated_repair_time}
                </span>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Main Content - Mobile optimized */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 md:py-12">
        {/* Table of Contents */}
        {showTOC && tocItems.length > 0 && (
          <div className="mb-8 p-6 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
              Inhaltsverzeichnis
            </h2>
            <nav className="space-y-2">
              {tocItems.map((item, index) => (
                <a
                  key={index}
                  href={`#${item.id}`}
                  className={`block text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors ${
                    item.level === 1 ? 'font-semibold' : item.level === 2 ? 'ml-4' : 'ml-8'
                  }`}
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                >
                  {item.text}
                </a>
              ))}
            </nav>
          </div>
        )}

        {/* Reading Time & Stats */}
        <div className="mb-8 flex flex-wrap items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{readingTime} Min. Lesezeit</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>{wordCount} Wörter</span>
          </div>
        </div>

        {/* Problem Statement */}
        {fault.description && (
          <div className="mb-8 p-6 bg-gradient-to-br from-red-50 via-orange-50 to-amber-50 dark:from-red-950/30 dark:via-orange-950/20 dark:to-amber-950/20 rounded-2xl border-2 border-red-200 dark:border-red-800/50">
            <h2 className="text-2xl font-black text-red-900 dark:text-red-200 mb-4">
              Problembeschreibung
            </h2>
            <p className="text-slate-800 dark:text-slate-200 leading-relaxed text-lg font-medium">
              {fault.description}
            </p>
          </div>
        )}

        {/* Symptoms & Diagnostic Steps */}
        {(fault.symptoms && fault.symptoms.length > 0) || (fault.diagnostic_steps && fault.diagnostic_steps.length > 0) ? (
          <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            {fault.symptoms && fault.symptoms.length > 0 && (
              <div className="p-5 bg-red-50 dark:bg-red-950/20 rounded-xl border border-red-200 dark:border-red-900/30">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-3">
                  Symptome
                </h2>
                <ul className="space-y-2">
                  {fault.symptoms.map((symptom, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                      <span className="text-red-600 dark:text-red-400 mt-0.5">•</span>
                      <span>{symptom}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {fault.diagnostic_steps && fault.diagnostic_steps.length > 0 && (
              <div className="p-5 bg-blue-50 dark:bg-blue-950/20 rounded-xl border border-blue-200 dark:border-blue-900/30">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-3">
                  Diagnoseschritte
                </h2>
                <ol className="space-y-2">
                  {fault.diagnostic_steps.map((step, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-600 dark:bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-xs">
                        {index + 1}
                      </span>
                      <span className="pt-0.5">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        ) : null}

        {/* Solution */}
        {cleanSolution && (
          <div className="mb-8 p-6 bg-green-50 dark:bg-green-950/20 rounded-2xl border border-green-200 dark:border-green-900/30">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Lösung
            </h2>
            <div className="prose prose-slate dark:prose-invert max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({children}) => <h1 className="text-2xl font-bold mt-6 mb-4 text-slate-900 dark:text-white">{children}</h1>,
                  h2: ({children}) => <h2 className="text-xl font-bold mt-6 mb-3 text-slate-900 dark:text-white">{children}</h2>,
                  h3: ({children}) => <h3 className="text-lg font-semibold mt-5 mb-2 text-slate-800 dark:text-slate-200">{children}</h3>,
                  p: ({children}) => <p className="mb-4 text-slate-700 dark:text-slate-300 leading-relaxed">{children}</p>,
                  ul: ({children}) => <ul className="list-disc list-outside mb-4 space-y-2 text-slate-700 dark:text-slate-300 ml-6">{children}</ul>,
                  ol: ({children}) => <ol className="list-decimal list-outside mb-4 space-y-3 text-slate-700 dark:text-slate-300 ml-6">{children}</ol>,
                  li: ({children}) => <li className="leading-relaxed">{children}</li>,
                  strong: ({children}) => <strong className="font-bold text-slate-900 dark:text-white">{children}</strong>,
                  code: ({node, inline, ...props}: any) => {
                    const isInline = inline !== false;
                    return isInline ? (
                      <code className="bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded text-sm font-mono text-red-600 dark:text-red-400" {...props} />
                    ) : (
                      <code className="block bg-slate-900 dark:bg-slate-950 text-slate-100 p-4 rounded-lg overflow-x-auto text-sm font-mono my-4 border border-slate-700" {...props} />
                    );
                  },
                }}
              >
                {cleanSolution}
              </ReactMarkdown>
            </div>
          </div>
        )}

        {/* Related Faults */}
        {relatedFaults.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
              Ähnliche Fehler
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {relatedFaults.slice(0, 6).map((relatedFault) => {
                // Determine URL based on whether fault has error_code
                const relatedFaultWithErrorCode = relatedFault as RelatedFault & { error_code?: string };
                const relatedFaultUrl = relatedFaultWithErrorCode.error_code
                  ? `/cars/${brand.slug}/${model.slug}/${generation.slug}/error-codes/${relatedFault.slug}`
                  : `/cars/${brand.slug}/${model.slug}/${generation.slug}/faults/${relatedFault.slug}`;
                
                return (
                <Link
                  key={relatedFault.id}
                  href={relatedFaultUrl}
                  className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
                >
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
                    {relatedFault.title}
                  </h3>
                  {relatedFault.similarity && (
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Ähnlichkeit: {Math.round(relatedFault.similarity * 100)}%
                    </p>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

