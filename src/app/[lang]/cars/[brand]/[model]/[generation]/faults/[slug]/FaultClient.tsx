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
};

type RelatedFault = {
  id: string;
  slug: string;
  title: string;
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
  lang: string;
  initialComments?: Comment[];
  user?: User | null;
};

export default function FaultClient({ brand, model, generation, fault, relatedFaults, lang, initialComments = [], user }: Props) {
  const t = (en: string, de: string) => lang === 'de' ? de : en;
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [copied, setCopied] = useState(false);
  const [showTOC, setShowTOC] = useState(false);
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [commentError, setCommentError] = useState<string | null>(null);
  
  const supabase = useMemo(() => getSupabaseClient(), []);
  const formMountTime = useRef<number>(Date.now());

  useEffect(() => {
    formMountTime.current = Date.now();
  }, []);

  // Clean solution to remove redundant symptoms/diagnostic steps sections
  const cleanSolution = useMemo(() => {
    let cleaned = fault.solution;
    
    // Remove symptoms section if it exists in markdown (since we show it in summary box)
    if (fault.symptoms && fault.symptoms.length > 0) {
      // Remove markdown headings and content for symptoms
      cleaned = cleaned.replace(/###?\s*Symptoms?[\s\S]*?(?=###|##|$)/gi, '');
      cleaned = cleaned.replace(/##\s*Symptoms?[\s\S]*?(?=##|$)/gi, '');
    }
    
    // Remove diagnostic steps section if it exists in markdown (since we show it in summary box)
    if (fault.diagnostic_steps && fault.diagnostic_steps.length > 0) {
      // Remove markdown headings and content for diagnostic steps
      cleaned = cleaned.replace(/###?\s*Diagnostic\s+Steps?[\s\S]*?(?=###|##|$)/gi, '');
      cleaned = cleaned.replace(/##\s*Diagnostic\s+Steps?[\s\S]*?(?=##|$)/gi, '');
      cleaned = cleaned.replace(/###?\s*Diagnosis[\s\S]*?(?=###|##|$)/gi, '');
    }
    
    // Clean up multiple consecutive newlines
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
    
    return cleaned.trim();
  }, [fault.solution, fault.symptoms, fault.diagnostic_steps]);

  // Language switcher URL
  const otherLang = lang === 'en' ? 'de' : 'en';
  const currentPath = pathname || '';
  const langSwitchUrl = currentPath.replace(`/${lang}/`, `/${otherLang}/`) + (searchParams?.toString() ? `?${searchParams.toString()}` : '');
  
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

  const handleCommentSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmitting) return;
    if (newComment.length > 1000) {
      setCommentError(lang === 'de' ? 'Maximal 1000 Zeichen erlaubt.' : 'Maximum 1000 characters allowed.');
      return;
    }
    const now = Date.now();
    const delta = now - formMountTime.current;
    if (delta < 3000) {
      setError(t('Please wait at least 3 seconds before submitting your comment.', 'Bitte warten Sie mindestens 3 Sekunden, bevor Sie Ihren Kommentar absenden.'));
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
        let errorMsg = t('Failed to post comment', 'Kommentar konnte nicht gepostet werden');
        try {
          const errorData = await response.json();
          errorMsg = errorData.error || errorMsg;
        } catch {
          errorMsg = t('Failed to post comment (invalid response)', 'Kommentar konnte nicht gepostet werden (ungültige Antwort)');
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
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Breadcrumb - Mobile optimized */}
            <nav className="mb-4 sm:mb-6 flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm text-slate-400 overflow-x-auto pb-2 -mx-4 sm:mx-0 px-4 sm:px-0">
              <Link href={`/${lang}`} className="hover:text-white transition-colors whitespace-nowrap">
                {t('Home', 'Startseite')}
              </Link>
              <span className="flex-shrink-0">/</span>
              <Link href={`/${lang}/cars`} className="hover:text-white transition-colors whitespace-nowrap">
                {t('Cars', 'Autos')}
              </Link>
              <span className="flex-shrink-0">/</span>
              <Link href={`/${lang}/cars/${brand.slug}`} className="hover:text-white transition-colors whitespace-nowrap truncate max-w-[80px] sm:max-w-none">
                {brand.name}
              </Link>
              <span className="flex-shrink-0">/</span>
              <Link href={`/${lang}/cars/${brand.slug}/${model.slug}`} className="hover:text-white transition-colors whitespace-nowrap truncate max-w-[80px] sm:max-w-none">
                {model.name}
              </Link>
              <span className="flex-shrink-0">/</span>
              <Link href={`/${lang}/cars/${brand.slug}/${model.slug}/${generation.slug}`} className="hover:text-white transition-colors whitespace-nowrap truncate max-w-[80px] sm:max-w-none">
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
              {/* Language Switcher */}
              <Link
                href={langSwitchUrl}
                className="px-3 py-1.5 sm:px-4 sm:py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-semibold transition-all flex items-center gap-1.5 sm:gap-2 backdrop-blur-sm text-xs sm:text-sm"
                title={lang === 'en' ? 'Deutsch' : 'English'}
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                </svg>
                <span className="hidden sm:inline">{otherLang.toUpperCase()}</span>
              </Link>
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
                    {t('Copied!', 'Kopiert!')}
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    {t('Copy Link', 'Link kopieren')}
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
                <span className="hidden sm:inline">{t('Print', 'Drucken')}</span>
              </button>
              {tocItems.length > 0 && (
                <button
                  onClick={() => setShowTOC(!showTOC)}
                  className="px-3 py-1.5 sm:px-4 sm:py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-semibold transition-all flex items-center gap-1.5 sm:gap-2 backdrop-blur-sm text-xs sm:text-sm"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                  <span className="hidden sm:inline">{t('Table of Contents', 'Inhaltsverzeichnis')}</span>
                </button>
              )}
            </div>

            {/* Badges - Mobile optimized */}
            <div className="flex flex-wrap gap-2 sm:gap-3">
              {fault.severity && (
                <span className={`px-3 py-1 rounded-lg text-sm font-bold border ${getSeverityColor(fault.severity)}`}>
                  {t('Severity', 'Schweregrad')}: {fault.severity}
                </span>
              )}
              {fault.difficulty_level && (
                <span className={`px-3 py-1 rounded-lg text-sm font-bold border ${getDifficultyColor(fault.difficulty_level)}`}>
                  {t('Difficulty', 'Schwierigkeit')}: {fault.difficulty_level}
                </span>
              )}
              {fault.error_code && (
                <span className="px-3 py-1 rounded-lg text-sm font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  {t('Error Code', 'Fehlercode')}: {fault.error_code}
                </span>
              )}
              {fault.estimated_repair_time && (
                <span className="px-3 py-1 rounded-lg text-sm font-semibold bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-900/30">
                  ⏱️ {fault.estimated_repair_time}
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
              {t('Table of Contents', 'Inhaltsverzeichnis')}
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
            <span>{readingTime} {t('min read', 'Min. Lesezeit')}</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>{wordCount} {t('words', 'Wörter')}</span>
          </div>
        </div>
        {/* Quick Overview Cards - Compact Summary - Mobile optimized */}
        <div className="mb-6 sm:mb-8 grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          {/* Problem Description - Compact */}
          {fault.description && (
            <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                {t('Overview', 'Übersicht')}
              </h3>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-sm">
                {fault.description}
              </p>
            </div>
          )}

          {/* Quick Stats */}
          <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
              {t('Quick Info', 'Schnellinfo')}
            </h3>
            <div className="space-y-2 text-sm">
              {fault.affected_component && (
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">{t('Component', 'Komponente')}:</span>
                  <span className="text-slate-900 dark:text-white font-medium">{fault.affected_component}</span>
                </div>
              )}
              {fault.estimated_repair_time && (
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">{t('Time', 'Zeit')}:</span>
                  <span className="text-slate-900 dark:text-white font-medium">{fault.estimated_repair_time}</span>
                </div>
              )}
            </div>
          </div>
        </div>

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
                  {t('Symptoms', 'Symptome')}
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
                  {t('Diagnostic Steps', 'Diagnoseschritte')}
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
              {t('Solution', 'Lösung')}
            </h2>
            <div className="prose prose-slate dark:prose-invert max-w-none prose-sm sm:prose-base">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({children}) => <h1 id={`heading-${children?.toString().toLowerCase().replace(/\s+/g, '-')}`} className="text-2xl font-bold mt-6 mb-4 text-slate-900 dark:text-white scroll-mt-20">{children}</h1>,
                  h2: ({children}) => <h2 id={`heading-${children?.toString().toLowerCase().replace(/\s+/g, '-')}`} className="text-xl font-bold mt-5 mb-3 text-slate-900 dark:text-white scroll-mt-20">{children}</h2>,
                  h3: ({children}) => <h3 id={`heading-${children?.toString().toLowerCase().replace(/\s+/g, '-')}`} className="text-lg font-semibold mt-4 mb-2 text-slate-800 dark:text-slate-200 scroll-mt-20">{children}</h3>,
                  p: ({children}) => <p className="mb-4 text-slate-700 dark:text-slate-300 leading-relaxed">{children}</p>,
                  ul: ({children}) => <ul className="list-disc list-inside mb-4 space-y-2 text-slate-700 dark:text-slate-300">{children}</ul>,
                  ol: ({children}) => <ol className="list-decimal list-inside mb-4 space-y-2 text-slate-700 dark:text-slate-300">{children}</ol>,
                  li: ({children}) => <li className="ml-4">{children}</li>,
                  strong: ({children}) => <strong className="font-bold text-slate-900 dark:text-white">{children}</strong>,
                  code: ({children}) => <code className="bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded text-sm font-mono">{children}</code>,
                }}
              >
                {cleanSolution}
              </ReactMarkdown>
            </div>
          </div>
        )}

        {/* Tools Required - Mobile optimized */}
        {fault.tools_required && fault.tools_required.length > 0 && (
          <div className="mb-6 sm:mb-8 p-4 sm:p-6 bg-amber-50 dark:bg-amber-950/20 rounded-xl sm:rounded-2xl border border-amber-200 dark:border-amber-900/30">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-3 sm:mb-4 flex items-center gap-2">
              <svg className="w-6 h-6 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {t('Tools Required', 'Benötigte Werkzeuge')}
            </h2>
            <div className="flex flex-wrap gap-2">
              {fault.tools_required.map((tool, index) => (
                <span key={index} className="px-3 py-1.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-medium">
                  {tool}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Additional Info - Mobile optimized */}
        <div className="mb-6 sm:mb-8 p-4 sm:p-6 bg-slate-50 dark:bg-slate-900 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-800">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-3 sm:mb-4">
            {t('Additional Information', 'Zusätzliche Informationen')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            {fault.affected_component && (
              <div>
                <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                  {t('Affected Component', 'Betroffene Komponente')}:
                </span>
                <p className="text-slate-900 dark:text-white font-medium">{fault.affected_component}</p>
              </div>
            )}
            {fault.estimated_repair_time && (
              <div>
                <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                  {t('Estimated Repair Time', 'Geschätzte Reparaturzeit')}:
                </span>
                <p className="text-slate-900 dark:text-white font-medium">{fault.estimated_repair_time}</p>
              </div>
            )}
            {fault.difficulty_level && (
              <div>
                <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                  {t('Difficulty Level', 'Schwierigkeitsgrad')}:
                </span>
                <p className="text-slate-900 dark:text-white font-medium capitalize">{fault.difficulty_level}</p>
              </div>
            )}
            {fault.severity && (
              <div>
                <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                  {t('Severity', 'Schweregrad')}:
                </span>
                <p className="text-slate-900 dark:text-white font-medium capitalize">{fault.severity}</p>
              </div>
            )}
          </div>
        </div>

        {/* Related Faults */}
        {relatedFaults.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
              {t('Related Faults', 'Ähnliche Fehler')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {relatedFaults.map((related) => (
                <Link
                  key={related.id}
                  href={`/${lang}/cars/${brand.slug}/${model.slug}/${generation.slug}/faults/${related.slug}`}
                  className="group block p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-red-500 dark:hover:border-red-500/50 transition-all"
                >
                  <h3 className="font-semibold text-slate-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                    {related.title}
                  </h3>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Social Sharing */}
        <div className="mt-8 sm:mt-12 p-4 sm:p-6 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-3 sm:mb-4">
            {t('Share this solution', 'Diese Lösung teilen')}
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
              <span className="hidden sm:inline">{t('Email', 'E-Mail')}</span>
            </button>
          </div>
        </div>

        {/* Comments Section */}
        <div className="mt-12 pt-12 border-t border-slate-200 dark:border-white/10">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-6">{t("Comments", "Kommentare")}</h2>
          {!user ? (
            <div className="text-center mb-8 p-6 sm:p-8 bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-white/10 rounded-2xl">
              <svg className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-4 text-slate-400 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p className="text-slate-700 dark:text-slate-300 text-base sm:text-lg mb-4 font-medium">{t("Sign in to share your thoughts", "Melden Sie sich an, um Ihre Gedanken zu teilen")}</p>
              <Link
                href={`/${lang}/login`}
                className="inline-flex items-center gap-2 px-5 py-2.5 sm:px-6 sm:py-3 bg-red-600 dark:bg-red-500 text-white rounded-xl font-medium hover:bg-red-700 dark:hover:bg-red-600 transition-all duration-200 shadow-sm hover:shadow-md text-sm sm:text-base"
              >
                {t("Sign In", "Anmelden")}
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
                    placeholder={t('Share your thoughts...', 'Teilen Sie Ihre Gedanken mit...')}
                    className="w-full px-3 py-2.5 sm:px-4 sm:py-3 border border-slate-300 dark:border-white/20 rounded-xl shadow-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm sm:text-base resize-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 transition-all"
                    rows={4}
                    maxLength={1000}
                  />
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {newComment.length}/1000 {t('characters', 'Zeichen')}
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
                          {t('Posting...', 'Wird gepostet...')}
                        </span>
                      ) : (
                        t('Post Comment', 'Kommentar posten')
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
              const displayName = comment.user_name || t('Anonymous User', 'Anonymer Benutzer');
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
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-white font-semibold text-xs sm:text-sm shadow-sm">
                        {initials}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                        <span className="font-semibold text-slate-900 dark:text-white text-sm sm:text-base">{displayName}</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          {new Date(comment.created_at).toLocaleDateString(lang === 'de' ? 'de-DE' : 'en-US', {
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
                <p className="text-slate-500 dark:text-slate-400 text-base sm:text-lg font-medium">{t("No comments yet", "Noch keine Kommentare")}</p>
                {!user && (
                  <p className="text-slate-400 dark:text-slate-500 text-sm mt-2">{t("Be the first to share your thoughts", "Seien Sie der Erste, der Ihre Gedanken teilt")}</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Back Button */}
        <div className="mt-8 sm:mt-12">
          <Link
            href={`/${lang}/cars/${brand.slug}/${model.slug}/${generation.slug}`}
            className="inline-flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 md:px-6 md:py-3 bg-red-600 dark:bg-red-500 text-white rounded-xl font-semibold hover:bg-red-700 dark:hover:bg-red-600 transition-all text-sm sm:text-base shadow-sm hover:shadow-md"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            {t('Back to Generation', 'Zurück zur Generation')}
          </Link>
        </div>
      </div>
    </div>
  );
}

