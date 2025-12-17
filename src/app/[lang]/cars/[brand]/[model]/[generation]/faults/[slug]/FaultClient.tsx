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

  // Language switcher URL - removed, site is German-only
  
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
                className="px-3 py-1.5 sm:px-4 sm:py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-semibold transition-all flex items-center gap-1.5 sm:gap-2 backdrop-blur-sm text-xs sm:text-sm"
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
                className="px-3 py-1.5 sm:px-4 sm:py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-semibold transition-all flex items-center gap-1.5 sm:gap-2 backdrop-blur-sm text-xs sm:text-sm"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                <span className="hidden sm:inline">Drucken</span>
              </button>
              <button
                onClick={handleExportPDF}
                className="px-3 py-1.5 sm:px-4 sm:py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-semibold transition-all flex items-center gap-1.5 sm:gap-2 backdrop-blur-sm text-xs sm:text-sm"
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
                  className="px-3 py-1.5 sm:px-4 sm:py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-semibold transition-all flex items-center gap-1.5 sm:gap-2 backdrop-blur-sm text-xs sm:text-sm"
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
                  className={`block text-slate-700 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 transition-colors ${
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
        {/* Critical Safety Warning */}
        {(fault.severity === 'critical' || fault.severity === 'high') && (
          <div className="mb-6 sm:mb-8 p-5 sm:p-6 bg-red-50 dark:bg-red-950/30 border-2 border-red-500 dark:border-red-600 rounded-xl sm:rounded-2xl">
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <h3 className="text-lg font-bold text-red-900 dark:text-red-300 mb-2">
                  ⚠️ Sicherheitshinweis
                </h3>
                <p className="text-red-800 dark:text-red-200 leading-relaxed">
                  Dieses Problem erfordert sofortige Aufmerksamkeit. Wenn Sie nicht erfahren in der Autoreparatur sind, konsultieren Sie einen professionellen Mechaniker. Arbeiten an kritischen Systemen kann gefährlich sein.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Problem Statement - Enhanced & Improved */}
        {fault.description && (
          <div className="mb-8 sm:mb-10 p-6 sm:p-8 bg-gradient-to-br from-red-50 via-orange-50 to-amber-50 dark:from-red-950/30 dark:via-orange-950/20 dark:to-amber-950/20 rounded-2xl border-2 border-red-200 dark:border-red-800/50 shadow-lg">
            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 bg-red-100 dark:bg-red-900/50 rounded-xl shadow-sm flex-shrink-0">
                <svg className="w-6 h-6 sm:w-7 sm:h-7 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="flex-1">
                <h2 className="text-2xl sm:text-3xl font-black text-red-900 dark:text-red-200 mb-4 flex items-center gap-2">
                  <span>Problembeschreibung</span>
                </h2>
                <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm rounded-xl p-5 sm:p-6 border border-red-200/50 dark:border-red-800/30">
                  <p className="text-slate-800 dark:text-slate-200 leading-relaxed text-lg sm:text-xl font-medium">
                  {fault.description}
                </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Reference Cards - Error Code, Component, Repair Time */}
        <div className="mb-6 sm:mb-8 grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
          {fault.error_code && (
            <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-900/30">
              <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-2">
                Fehlercode
              </div>
              <code className="text-lg font-mono font-bold text-blue-900 dark:text-blue-200 bg-blue-100 dark:bg-blue-900/50 px-2 py-1 rounded">
                {fault.error_code}
              </code>
            </div>
          )}
          {fault.affected_component && (
            <div className="p-4 bg-purple-50 dark:bg-purple-950/30 rounded-xl border border-purple-200 dark:border-purple-900/30">
              <div className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider mb-2">
                Komponente
              </div>
              <div className="text-base font-semibold text-purple-900 dark:text-purple-200">
                {fault.affected_component}
              </div>
            </div>
          )}
          {fault.estimated_repair_time && (
            <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-xl border border-green-200 dark:border-green-900/30">
              <div className="text-xs font-semibold text-green-600 dark:text-green-400 uppercase tracking-wider mb-2">
                Reparaturzeit
              </div>
              <div className="text-base font-semibold text-green-900 dark:text-green-200 flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {fault.estimated_repair_time}
              </div>
            </div>
          )}
        </div>


        {/* Safety Warnings - Before Solution */}
        {fault.safety_warnings && fault.safety_warnings.length > 0 && (
          <div className="mb-6 sm:mb-8 p-5 sm:p-6 bg-red-50 dark:bg-red-950/30 border-2 border-red-500 dark:border-red-600 rounded-xl sm:rounded-2xl">
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-red-900 dark:text-red-300 mb-3">
                  Sicherheitshinweise
                </h3>
                <ul className="space-y-2">
                  {fault.safety_warnings.map((warning, index) => (
                    <li key={index} className="text-red-800 dark:text-red-200 leading-relaxed flex items-start gap-2">
                      <span className="text-red-600 dark:text-red-400 font-bold flex-shrink-0 mt-0.5">⚠</span>
                      <span>{warning}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Symptoms & Diagnostic Steps - Side by Side - Mobile optimized */}
        {(fault.symptoms && fault.symptoms.length > 0) || (fault.diagnostic_steps && fault.diagnostic_steps.length > 0) ? (
          <div className="mb-6 sm:mb-8 grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            {/* Symptoms */}
            {fault.symptoms && fault.symptoms.length > 0 && (
              <div className="p-5 bg-red-50 dark:bg-red-950/20 rounded-xl border border-red-200 dark:border-red-900/30">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  Symptome
                </h2>
                <ul className="space-y-2">
                  {fault.symptoms.map((symptom, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                      <span className="text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0">•</span>
                      <span>{symptom}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Diagnostic Steps */}
            {fault.diagnostic_steps && fault.diagnostic_steps.length > 0 && (
              <div className="p-5 bg-blue-50 dark:bg-blue-950/20 rounded-xl border border-blue-200 dark:border-blue-900/30">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
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

        {/* Solution - Cleaned (without redundant sections) - Mobile optimized */}
        {cleanSolution && (
          <div className="mb-6 sm:mb-8 p-4 sm:p-6 bg-green-50 dark:bg-green-950/20 rounded-xl sm:rounded-2xl border border-green-200 dark:border-green-900/30">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-3 sm:mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 dark:text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Lösung
            </h2>
            <div className="prose prose-slate dark:prose-invert max-w-none prose-sm sm:prose-base">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({children}) => <h1 id={`heading-${children?.toString().toLowerCase().replace(/\s+/g, '-')}`} className="text-2xl font-bold mt-6 mb-4 text-slate-900 dark:text-white scroll-mt-20 border-b border-slate-200 dark:border-slate-700 pb-2">{children}</h1>,
                  h2: ({children}) => <h2 id={`heading-${children?.toString().toLowerCase().replace(/\s+/g, '-')}`} className="text-xl font-bold mt-6 mb-3 text-slate-900 dark:text-white scroll-mt-20 flex items-center gap-2">
                    <span className="w-1 h-6 bg-green-600 dark:bg-green-500 rounded-full"></span>
                    {children}
                  </h2>,
                  h3: ({children}) => <h3 id={`heading-${children?.toString().toLowerCase().replace(/\s+/g, '-')}`} className="text-lg font-semibold mt-5 mb-2 text-slate-800 dark:text-slate-200 scroll-mt-20">{children}</h3>,
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
                  blockquote: ({children}) => (
                    <blockquote className="border-l-4 border-blue-500 dark:border-blue-400 pl-4 py-2 my-4 bg-blue-50 dark:bg-blue-950/20 italic text-slate-700 dark:text-slate-300">
                      {children}
                    </blockquote>
                  ),
                  table: ({children}) => (
                    <div className="overflow-x-auto my-4">
                      <table className="min-w-full border-collapse border border-slate-300 dark:border-slate-700">
                        {children}
                      </table>
                    </div>
                  ),
                  th: ({children}) => (
                    <th className="border border-slate-300 dark:border-slate-700 px-4 py-2 bg-slate-100 dark:bg-slate-800 font-semibold text-left">
                      {children}
                    </th>
                  ),
                  td: ({children}) => (
                    <td className="border border-slate-300 dark:border-slate-700 px-4 py-2">
                      {children}
                    </td>
                  ),
                }}
              >
                {cleanSolution}
              </ReactMarkdown>
            </div>
          </div>
        )}

        {/* Verification Steps - New Section */}
        {cleanSolution && (
          <div className="mb-6 sm:mb-8 p-5 sm:p-6 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl sm:rounded-2xl border border-emerald-200 dark:border-emerald-900/30">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <svg className="w-6 h-6 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Überprüfung
            </h2>
            <p className="text-slate-700 dark:text-slate-300 mb-4 leading-relaxed">
              Nach Abschluss der Reparatur überprüfen Sie, ob das Problem behoben wurde:
            </p>
            <ul className="space-y-3 text-slate-700 dark:text-slate-300">
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Testen Sie die betroffene Komponente, um sicherzustellen, dass sie ordnungsgemäß funktioniert</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Überprüfen Sie auf Fehlercodes oder Warnleuchten</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Überwachen Sie das Fahrzeug einige Tage lang, um sicherzustellen, dass das Problem nicht erneut auftritt</span>
              </li>
            </ul>
          </div>
        )}

        {/* Prevention Tips - New Section */}
        <div className="mb-6 sm:mb-8 p-5 sm:p-6 bg-indigo-50 dark:bg-indigo-950/20 rounded-xl sm:rounded-2xl border border-indigo-200 dark:border-indigo-900/30">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <svg className="w-6 h-6 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Vorbeugung
          </h2>
          <p className="text-slate-700 dark:text-slate-300 mb-4 leading-relaxed">
            Um zu verhindern, dass dieses Problem erneut auftritt:
          </p>
          <ul className="space-y-3 text-slate-700 dark:text-slate-300">
            <li className="flex items-start gap-3">
              <span className="text-indigo-600 dark:text-indigo-400 font-bold flex-shrink-0">•</span>
              <span>Befolgen Sie den empfohlenen Wartungsplan des Herstellers</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-indigo-600 dark:text-indigo-400 font-bold flex-shrink-0">•</span>
              <span>Beheben Sie Warnzeichen frühzeitig, bevor sie zu größeren Problemen werden</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-indigo-600 dark:text-indigo-400 font-bold flex-shrink-0">•</span>
              <span>Verwenden Sie qualitativ hochwertige Teile und Flüssigkeiten, die für Ihr Fahrzeug empfohlen werden</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-indigo-600 dark:text-indigo-400 font-bold flex-shrink-0">•</span>
              <span>Führen Sie detaillierte Aufzeichnungen über alle Reparaturen und Wartungen</span>
            </li>
          </ul>
        </div>

        {/* Tools & Equipment Required - With Checkboxes */}
        {fault.tools_required && fault.tools_required.length > 0 && (
          <div className="mb-6 sm:mb-8 p-5 sm:p-6 bg-amber-50 dark:bg-amber-950/20 rounded-xl sm:rounded-2xl border border-amber-200 dark:border-amber-900/30">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <svg className="w-6 h-6 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Benötigte Werkzeuge & Ausrüstung
            </h2>
            <ul className="space-y-3">
              {fault.tools_required.map((tool, index) => (
                <li key={index} className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    className="w-5 h-5 text-amber-600 dark:text-amber-400 bg-white dark:bg-slate-800 border-2 border-amber-300 dark:border-amber-700 rounded focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-400 cursor-pointer flex-shrink-0"
                    readOnly
                  />
                  <span className="text-base font-medium">{tool}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Parts Required - With Checkboxes */}
        {fault.parts_required && fault.parts_required.length > 0 && (
          <div className="mb-6 sm:mb-8 p-5 sm:p-6 bg-indigo-50 dark:bg-indigo-950/20 rounded-xl sm:rounded-2xl border border-indigo-200 dark:border-indigo-900/30">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <svg className="w-6 h-6 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
              Benötigte Teile
            </h2>
            <ul className="space-y-3">
              {fault.parts_required.map((part, index) => (
                <li key={index} className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    className="w-5 h-5 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-800 border-2 border-indigo-300 dark:border-indigo-700 rounded focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 cursor-pointer flex-shrink-0"
                    readOnly
                  />
                  <span className="text-base font-medium">{part}</span>
                </li>
              ))}
            </ul>
          </div>
        )}


        {/* Additional Information - Enhanced with all metadata */}
        <div className="mb-6 sm:mb-8 p-4 sm:p-6 bg-slate-50 dark:bg-slate-900 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-800">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-3 sm:mb-4">
            Zusätzliche Informationen
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {fault.error_code && (
              <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-900/30">
                <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider block mb-1">
                  Fehlercode
                </span>
                <code className="text-base font-mono font-bold text-blue-900 dark:text-blue-200">
                  {fault.error_code}
                </code>
              </div>
            )}
            {fault.affected_component && (
              <div className="p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg border border-purple-200 dark:border-purple-900/30">
                <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider block mb-1">
                  Komponente
                </span>
                <p className="text-base font-semibold text-purple-900 dark:text-purple-200">{fault.affected_component}</p>
              </div>
            )}
            {fault.estimated_repair_time && (
              <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-900/30">
                <span className="text-xs font-semibold text-green-600 dark:text-green-400 uppercase tracking-wider block mb-1">
                  Reparaturzeit
                </span>
                <p className="text-base font-semibold text-green-900 dark:text-green-200 flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {fault.estimated_repair_time}
                </p>
              </div>
            )}
            {fault.difficulty_level && (
              <div className="p-3 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg border border-yellow-200 dark:border-yellow-900/30">
                <span className="text-xs font-semibold text-yellow-600 dark:text-yellow-400 uppercase tracking-wider block mb-1">
                  Schwierigkeit
                </span>
                <p className="text-base font-semibold text-yellow-900 dark:text-yellow-200 capitalize">{fault.difficulty_level}</p>
              </div>
            )}
            {fault.severity && (
              <div className="p-3 bg-orange-50 dark:bg-orange-950/30 rounded-lg border border-orange-200 dark:border-orange-900/30">
                <span className="text-xs font-semibold text-orange-600 dark:text-orange-400 uppercase tracking-wider block mb-1">
                  Schweregrad
                </span>
                <p className="text-base font-semibold text-orange-900 dark:text-orange-200 capitalize">{fault.severity}</p>
              </div>
            )}
            {fault.tools_required && fault.tools_required.length > 0 && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-900/30">
                <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider block mb-1">
                  Werkzeuge
                </span>
                <p className="text-base font-semibold text-amber-900 dark:text-amber-200">
                  {fault.tools_required.length} Artikel
                </p>
              </div>
            )}
            {fault.parts_required && fault.parts_required.length > 0 && (
              <div className="p-3 bg-indigo-50 dark:bg-indigo-950/30 rounded-lg border border-indigo-200 dark:border-indigo-900/30">
                <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block mb-1">
                  Teile
                </span>
                <p className="text-base font-semibold text-indigo-900 dark:text-indigo-200">
                  {fault.parts_required.length} Artikel
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Related Faults - Enhanced with Vector Similarity */}
        {(relatedFaults.length > 0 || globalRelatedFaults.length > 0 || isLoadingRelatedFaults) && (
          <section 
            className="mb-8"
            aria-label="Ähnliche Fehler"
            itemScope
            itemType="https://schema.org/ItemList"
          >
            <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white" itemProp="name">
                Ähnliche Fehler
              </h2>
              
              {/* Scope Toggle Buttons */}
              <nav 
                className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 rounded-lg p-1 shadow-inner"
                aria-label="Ähnliche Fehler nach Bereich filtern"
                role="tablist"
              >
                <button
                  onClick={() => setRelatedFaultsScope('generation')}
                  disabled={relatedFaults.length === 0}
                  role="tab"
                  aria-selected={relatedFaultsScope === 'generation'}
                  aria-controls="related-faults-generation"
                  aria-label="Nur Fehler aus dieser Generation anzeigen"
                  className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${
                    relatedFaultsScope === 'generation'
                      ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  } ${relatedFaults.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    Diese Generation
                    {relatedFaults.length > 0 && (
                      <span className="ml-1 px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded text-xs font-bold" aria-label="Anzahl ähnlicher Fehler">
                        {relatedFaults.length}
                      </span>
                    )}
                  </span>
                </button>
                <button
                  onClick={() => {
                    setRelatedFaultsScope('global');
                    // Load global faults if not already loaded
                    if (loadedGlobalFaults.length === 0 && !isLoadingRelatedFaults) {
                      loadGlobalRelatedFaults();
                    }
                  }}
                  role="tab"
                  aria-selected={relatedFaultsScope === 'global'}
                  aria-controls="related-faults-global"
                  aria-label="Fehler aus allen Generationen anzeigen"
                  className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${
                    relatedFaultsScope === 'global'
                      ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Alle Generationen
                    {loadedGlobalFaults.length > 0 && (
                      <span className="ml-1 px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded text-xs font-bold" aria-label="Anzahl ähnlicher Fehler">
                        {loadedGlobalFaults.length}
                      </span>
                    )}
                  </span>
                </button>
              </nav>
            </div>

            {isLoadingRelatedFaults && (
              <div className="text-center py-12" role="status" aria-live="polite">
                <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-red-600 dark:border-red-400" aria-hidden="true"></div>
                <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">Lade ähnliche Fehler...</p>
              </div>
            )}

            {!isLoadingRelatedFaults && (
              <>
                {relatedFaultsScope === 'generation' && relatedFaults.length === 0 && (
                  <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                    Keine ähnlichen Fehler in dieser Generation gefunden.
                  </div>
                )}
                {relatedFaultsScope === 'global' && loadedGlobalFaults.length === 0 && (
                  <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                    Keine ähnlichen Fehler in allen Generationen gefunden.
                  </div>
                )}
                {((relatedFaultsScope === 'generation' && relatedFaults.length > 0) || (relatedFaultsScope === 'global' && loadedGlobalFaults.length > 0)) && (
                  <ol className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" itemScope itemType="https://schema.org/ItemList">
                    {(relatedFaultsScope === 'generation' ? relatedFaults : loadedGlobalFaults).map((related, index) => {
                      // Debug: Log first fault to see similarity value
                      if (index === 0) {
                        console.log(`[Related Faults ${relatedFaultsScope}] First fault:`, {
                          id: related.id,
                          title: related.title,
                          similarity: related.similarity,
                          similarityType: typeof related.similarity,
                        });
                      }
                      
                      // Determine URL based on whether it's from same generation or global
                      const isSameGeneration = !related.generationName || related.generationName === generation.name;
                      const href = isSameGeneration
                        ? `/cars/${brand.slug}/${model.slug}/${generation.slug}/faults/${related.slug}`
                        : `/cars/${related.brandName?.toLowerCase().replace(/\s+/g, '-')}/${related.modelName?.toLowerCase().replace(/\s+/g, '-')}/${related.generationName?.toLowerCase().replace(/\s+/g, '-')}/faults/${related.slug}`;
                      
                      // Format similarity to 2 decimal places (e.g., 95.23%)
                      // Always show similarity if available, even if 0
                      // Handle both number and string formats
                      let similarityValue: number | null = null;
                      
                      if (related.similarity !== undefined && related.similarity !== null) {
                        if (typeof related.similarity === 'number') {
                          similarityValue = related.similarity;
                        } else if (typeof related.similarity === 'string') {
                          similarityValue = parseFloat(related.similarity);
                        }
                      }
                      
                      const similarityPercent = similarityValue !== null && !isNaN(similarityValue) && similarityValue >= 0 && similarityValue <= 1
                        ? parseFloat((similarityValue * 100).toFixed(2))
                        : null;
                      
                      const similarityColor = similarityPercent !== null
                        ? similarityPercent >= 85 
                          ? 'text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-950/40 border-green-300 dark:border-green-800'
                          : similarityPercent >= 75
                          ? 'text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800'
                          : similarityPercent >= 70
                          ? 'text-yellow-700 dark:text-yellow-300 bg-yellow-100 dark:bg-yellow-950/40 border-yellow-300 dark:border-yellow-800'
                          : 'text-orange-700 dark:text-orange-300 bg-orange-100 dark:bg-orange-950/40 border-orange-300 dark:border-orange-800'
                        : 'text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700';
                      
                      return (
                        <li 
                          key={related.id}
                          className="list-none"
                          itemProp="itemListElement"
                          itemScope
                          itemType="https://schema.org/ListItem"
                        >
                          <meta itemProp="position" content={String(index + 1)} />
                          <Link
                            href={href}
                            className="group block p-6 bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800 rounded-xl border-2 border-slate-200 dark:border-slate-800 hover:border-red-500 dark:hover:border-red-500/50 transition-all shadow-md hover:shadow-xl hover:scale-[1.02]"
                            itemProp="url"
                            aria-label={`Fehler anzeigen: ${related.title}`}
                          >
                            <article itemScope itemType="https://schema.org/Article">
                              <meta itemProp="headline" content={related.title} />
                              <meta itemProp="name" content={related.title} />
                              <div className="flex items-start justify-between gap-3 mb-3">
                                <h3 className="font-bold text-lg text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors flex-1 leading-tight" itemProp="headline">
                                  {related.title}
                                </h3>
                                {similarityPercent !== null ? (
                                  <div 
                                    className={`px-3 py-1.5 rounded-lg text-sm font-black border-2 ${similarityColor} flex-shrink-0 min-w-[75px] text-center shadow-sm`}
                                    aria-label={`Ähnlichkeit: ${similarityPercent.toFixed(2)}%`}
                                    title={`Ähnlichkeit: ${similarityPercent.toFixed(2)}%`}
                                  >
                                    <span aria-hidden="true">{similarityPercent.toFixed(2)}%</span>
                                  </div>
                                ) : (
                                  <div 
                                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-300 dark:border-slate-700 flex-shrink-0 min-w-[75px] text-center"
                                    aria-label="Ähnlichkeit nicht verfügbar"
                                  >
                                    <span aria-hidden="true">N/A</span>
                                  </div>
                                )}
                              </div>
                          
                              {!isSameGeneration && (related.brandName || related.modelName || related.generationName) && (
                                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-2 mb-3" itemProp="about" itemScope itemType="https://schema.org/Vehicle">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                  </svg>
                                  <span className="font-semibold" itemProp="brand">{related.brandName}</span>
                                  <span className="font-semibold" itemProp="model">{related.modelName}</span>
                                  {related.generationName && (
                                    <span className="text-slate-400 dark:text-slate-500" itemProp="name">• {related.generationName}</span>
                                  )}
                                </div>
                              )}
                          
                              {similarityPercent !== null && (
                                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700" aria-label={`Ähnlichkeitsübereinstimmung: ${similarityPercent.toFixed(2)}%`}>
                                  <div className="flex items-center gap-3">
                                    <div className="flex-1 h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden shadow-inner" role="progressbar" aria-valuenow={similarityPercent} aria-valuemin={0} aria-valuemax={100}                                     aria-label={`Ähnlichkeit: ${similarityPercent.toFixed(2)}%`}>
                                      <div 
                                        className={`h-full rounded-full transition-all duration-500 ${
                                          similarityPercent >= 85 
                                            ? 'bg-gradient-to-r from-green-500 to-green-600 dark:from-green-400 dark:to-green-500'
                                            : similarityPercent >= 75
                                            ? 'bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-400 dark:to-blue-500'
                                            : similarityPercent >= 70
                                            ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 dark:from-yellow-400 dark:to-yellow-500'
                                            : 'bg-gradient-to-r from-orange-500 to-orange-600 dark:from-orange-400 dark:to-orange-500'
                                        }`}
                                        style={{ width: `${similarityPercent}%` }}
                                        aria-hidden="true"
                                      />
                                    </div>
                                    <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold whitespace-nowrap">
                                      Übereinstimmung
                                    </span>
                                  </div>
                                </div>
                              )}
                            </article>
                          </Link>
                        </li>
                      );
                    })}
                  </ol>
                )}
              </>
            )}
          </section>
        )}

        {/* Social Sharing */}
        <div className="mt-8 sm:mt-12 p-4 sm:p-6 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-3 sm:mb-4">
            Diese Lösung teilen
          </h3>
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <button
              onClick={() => handleShare('twitter')}
              className="px-3 py-1.5 sm:px-4 sm:py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition-all flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"/>
              </svg>
              <span className="hidden sm:inline">Twitter</span>
            </button>
            <button
              onClick={() => handleShare('facebook')}
              className="px-3 py-1.5 sm:px-4 sm:py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg font-semibold transition-all flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              <span className="hidden sm:inline">Facebook</span>
            </button>
            <button
              onClick={() => handleShare('linkedin')}
              className="px-3 py-1.5 sm:px-4 sm:py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
              <span className="hidden sm:inline">LinkedIn</span>
            </button>
            <button
              onClick={() => handleShare('whatsapp')}
              className="px-3 py-1.5 sm:px-4 sm:py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold transition-all flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
              </svg>
              <span className="hidden sm:inline">WhatsApp</span>
            </button>
            <button
              onClick={() => handleShare('email')}
              className="px-3 py-1.5 sm:px-4 sm:py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg font-semibold transition-all flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span className="hidden sm:inline">E-Mail</span>
            </button>
          </div>
        </div>

        {/* Comments Section */}
        <div className="mt-12 pt-12 border-t border-slate-200 dark:border-white/10">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-6">Kommentare</h2>
          {!user ? (
            <div className="text-center mb-8 p-6 sm:p-8 bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-white/10 rounded-2xl">
              <svg className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-4 text-slate-400 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p className="text-slate-700 dark:text-slate-300 text-base sm:text-lg mb-4 font-medium">Melden Sie sich an, um Ihre Gedanken zu teilen</p>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-5 py-2.5 sm:px-6 sm:py-3 bg-blue-600 dark:bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-700 dark:hover:bg-blue-600 transition-all duration-200 shadow-sm hover:shadow-md text-sm sm:text-base"
              >
                Anmelden
              </Link>
            </div>
          ) : (
            <form onSubmit={handleCommentSubmit} className="mb-8 bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-white/10 rounded-2xl p-4 sm:p-6">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-white font-semibold text-xs sm:text-sm flex-shrink-0 shadow-sm">
                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Teilen Sie Ihre Gedanken mit..."
                    className="w-full px-3 py-2.5 sm:px-4 sm:py-3 border border-slate-300 dark:border-white/20 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base resize-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 transition-all"
                    rows={4}
                    maxLength={1000}
                  />
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {newComment.length}/1000 Zeichen
                    </span>
                    <button
                      type="submit"
                      disabled={isSubmitting || !newComment.trim()}
                      className="px-4 py-2 sm:px-5 sm:py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-medium rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md text-sm sm:text-base"
                    >
                      {isSubmitting ? (
                        <span className="flex items-center gap-2">
                          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Wird gepostet...
                        </span>
                      ) : (
                        'Kommentar posten'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          )}

          {error && (
            <div className="mb-4 p-3 sm:p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-400 text-sm">
              {error}
            </div>
          )}
          {commentError && (
            <div className="mb-4 p-3 sm:p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-400 text-sm">
              {commentError}
            </div>
          )}
          <div className="space-y-4">
            {comments.map((comment) => {
              const displayName = comment.user_name || 'Anonymer Benutzer';
              const initials = displayName
                .split(' ')
                .map((n: string) => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2);
              
              return (
                <div key={comment.id} className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-2xl p-4 sm:p-6 hover:shadow-md transition-all duration-200">
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-blue-500 to-slate-500 flex items-center justify-center text-white font-semibold text-xs sm:text-sm shadow-sm">
                        {initials}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                        <span className="font-semibold text-slate-900 dark:text-white text-sm sm:text-base">{displayName}</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          {new Date(comment.created_at).toLocaleDateString('de-DE', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap text-sm sm:text-base">{comment.content}</p>
                    </div>
                  </div>
                </div>
              );
            })}
            {comments.length === 0 && (
              <div className="text-center py-12 sm:py-16">
                <svg className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-slate-300 dark:text-slate-700 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p className="text-slate-500 dark:text-slate-400 text-base sm:text-lg font-medium">Noch keine Kommentare</p>
                {!user && (
                  <p className="text-slate-400 dark:text-slate-500 text-sm mt-2">Seien Sie der Erste, der Ihre Gedanken teilt</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Back Button */}
        <div className="mt-8 sm:mt-12">
          <Link
            href={`/cars/${brand.slug}/${model.slug}/${generation.slug}`}
            className="inline-flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 md:px-6 md:py-3 bg-blue-600 dark:bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-700 dark:hover:bg-blue-600 transition-all text-sm sm:text-base shadow-sm hover:shadow-md"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Zurück zur Generation
          </Link>
        </div>
      </div>
    </div>
  );
}

