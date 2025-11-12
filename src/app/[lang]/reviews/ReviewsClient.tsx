'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { createBrowserClient } from '@supabase/ssr';
import Header from '@/components/Header';

interface Review {
  id: string;
  user_id?: string;
  username?: string;
  rating: number;
  review_text: string;
  created_at: string;
  job_title?: string;
  company?: string;
}

interface ReviewsClientProps {
  lang: string;
  initialReviews: Review[];
  user: any;
}

export default function ReviewsClient({ lang, initialReviews, user }: ReviewsClientProps) {
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [currentPage, setCurrentPage] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    rating: 5,
    review_text: '',
    job_title: '',
    company: '',
  });

  const reviewsPerPage = 8;
  const maxPages = 5;
  
  // Calculate statistics
  const totalReviews = reviews.length;
  const averageRating = totalReviews > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1)
    : '0.0';
  
  // Pagination logic
  const totalPages = Math.min(Math.ceil(totalReviews / reviewsPerPage), maxPages);
  const startIndex = (currentPage - 1) * reviewsPerPage;
  const endIndex = startIndex + reviewsPerPage;
  const paginatedReviews = reviews.slice(startIndex, endIndex);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const t = (en: string, de: string) => lang === 'de' ? de : en;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      window.location.href = `/${lang}/signup`;
      return;
    }

    if (!formData.review_text.trim()) {
      setSubmitError(t('Please enter your review.', 'Bitte geben Sie Ihre Bewertung ein.'));
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Get user profile for username
      const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .single();

      const { data, error } = await supabase
        .from('reviews')
        .insert({
          user_id: user.id,
          username: profile?.username || user.email?.split('@')[0] || 'Anonymous',
          rating: formData.rating,
          review_text: formData.review_text.trim(),
          job_title: formData.job_title.trim() || null,
          company: formData.company.trim() || null,
          language_path: lang,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;

      setSubmitSuccess(true);
      setFormData({
        rating: 5,
        review_text: '',
        job_title: '',
        company: '',
      });

      // Refresh reviews after a delay
      setTimeout(() => {
        fetchReviews();
        setSubmitSuccess(false);
      }, 2000);
    } catch (error: any) {
      console.error('Error submitting review:', error);
      setSubmitError(error.message || t('Failed to submit review. Please try again.', 'Bewertung konnte nicht gesendet werden. Bitte versuchen Sie es erneut.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const fetchReviews = async () => {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('language_path', lang)
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(100);

    if (!error && data) {
      setReviews(data);
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <svg
        key={i}
        className={`w-5 h-5 ${i < rating ? 'text-yellow-400 fill-current' : 'text-slate-300 dark:text-slate-600'}`}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat(lang === 'de' ? 'de-DE' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  const getInitials = (name?: string) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 transition-colors duration-300">
      <Header />
      
      <main className="pt-24 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Tech Background Pattern */}
        <div className="fixed inset-0 opacity-[0.02] dark:opacity-[0.03] pointer-events-none">
          <div className="absolute inset-0" style={{
            backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 2px, currentColor 2px, currentColor 4px),
                              repeating-linear-gradient(90deg, transparent, transparent 2px, currentColor 2px, currentColor 4px)`,
          }}></div>
        </div>
        
        <div className="max-w-7xl mx-auto relative">
          {/* Header Section - Enhanced */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8 sm:mb-12"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-full mb-6">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-xs font-mono font-bold text-red-600 dark:text-red-400 tracking-wider uppercase">
                {t('User Reviews', 'Nutzerbewertungen')}
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black text-slate-900 dark:text-white mb-6 tracking-tight">
              {t('Reviews', 'Bewertungen')}
            </h1>
            <p className="text-lg sm:text-xl lg:text-2xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto leading-relaxed">
              {t(
                'See what engineers and technicians are saying about Faultbase',
                'Sehen Sie, was Ingenieure und Techniker über Faultbase sagen'
              )}
            </p>
          </motion.div>

          {/* Statistics Section - Professional, Compact, Tech */}
          {totalReviews > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="mb-8 sm:mb-12"
            >
              <div className="relative bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 rounded-2xl border-2 border-slate-200/60 dark:border-white/10 p-6 sm:p-8 shadow-xl overflow-hidden">
                {/* Tech Grid Overlay */}
                <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.03] pointer-events-none">
                  <div className="absolute inset-0" style={{
                    backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 20px, currentColor 20px, currentColor 21px),
                                      repeating-linear-gradient(90deg, transparent, transparent 20px, currentColor 20px, currentColor 21px)`,
                  }}></div>
                </div>
                
                {/* Corner Accents */}
                <div className="absolute top-0 left-0 w-24 h-24 bg-gradient-to-br from-red-500/10 to-transparent rounded-br-full"></div>
                <div className="absolute bottom-0 right-0 w-24 h-24 bg-gradient-to-tl from-orange-500/10 to-transparent rounded-tl-full"></div>
                
                <div className="relative">
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                    <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      {t('Statistics', 'Statistiken')}
                    </span>
                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-6 sm:gap-8 max-w-2xl mx-auto">
                    {/* Total Reviews */}
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <svg className="w-5 h-5 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <span className="text-xs font-mono font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          {t('Reviews', 'Bewertungen')}
                        </span>
                      </div>
                      <div className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
                        {totalReviews}
                      </div>
                    </div>
                    
                    {/* Average Rating */}
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span className="text-xs font-mono font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          {t('Avg Rating', 'Ø Bewertung')}
                        </span>
                      </div>
                      <div className="flex items-center justify-center gap-2">
                        <div className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
                          {averageRating}
                        </div>
                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <svg
                              key={i}
                              className={`w-4 h-4 ${i < Math.round(parseFloat(averageRating)) ? 'text-yellow-400 fill-current' : 'text-slate-300 dark:text-slate-600'}`}
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Review Form - Enhanced */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-12 sm:mb-16"
          >
            <div className="relative bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl rounded-2xl sm:rounded-3xl border border-slate-200/60 dark:border-white/10 p-6 sm:p-8 lg:p-10 shadow-2xl overflow-hidden">
              {/* Tech Grid Overlay */}
              <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05] pointer-events-none">
                <div className="absolute inset-0" style={{
                  backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 20px, currentColor 20px, currentColor 21px),
                                    repeating-linear-gradient(90deg, transparent, transparent 20px, currentColor 20px, currentColor 21px)`,
                }}></div>
              </div>
              
              {/* Corner Accents */}
              <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-red-500/5 to-transparent rounded-br-full"></div>
              <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-tl from-orange-500/5 to-transparent rounded-tl-full"></div>
              
              <div className="relative">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                    {t('Share Your Experience', 'Teilen Sie Ihre Erfahrung')}
                  </h2>
                </div>
              
              {!user ? (
                <div className="text-center py-10 px-6 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-white/5">
                  <div className="w-16 h-16 bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-slate-600 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 mb-6 text-lg font-medium">
                    {t(
                      'Please sign in to leave a review',
                      'Bitte melden Sie sich an, um eine Bewertung zu hinterlassen'
                    )}
                  </p>
                  <Link
                    href={`/${lang}/signup`}
                    className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    {t('Sign In', 'Anmelden')}
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Rating - Enhanced */}
                  <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-6 border border-slate-200 dark:border-white/5">
                    <label className="block text-sm font-bold text-slate-900 dark:text-white mb-4 uppercase tracking-wider">
                      {t('Rating', 'Bewertung')}
                    </label>
                    <div className="flex gap-3">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setFormData({ ...formData, rating: star })}
                          className="group focus:outline-none transition-all duration-200"
                        >
                          <svg
                            className={`w-10 h-10 transition-all duration-200 ${
                              star <= formData.rating
                                ? 'text-yellow-400 fill-current scale-110 drop-shadow-lg'
                                : 'text-slate-300 dark:text-slate-600 group-hover:text-yellow-300 group-hover:scale-105'
                            }`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        </button>
                      ))}
                    </div>
                    <div className="mt-3 text-xs font-mono text-slate-500 dark:text-slate-400">
                      {formData.rating === 5 && t('Excellent', 'Ausgezeichnet')}
                      {formData.rating === 4 && t('Very Good', 'Sehr Gut')}
                      {formData.rating === 3 && t('Good', 'Gut')}
                      {formData.rating === 2 && t('Fair', 'Befriedigend')}
                      {formData.rating === 1 && t('Poor', 'Schlecht')}
                    </div>
                  </div>

                  {/* Review Text - Enhanced */}
                  <div>
                    <label htmlFor="review_text" className="block text-sm font-bold text-slate-900 dark:text-white mb-3 uppercase tracking-wider">
                      {t('Your Review', 'Ihre Bewertung')}
                    </label>
                    <div className="relative">
                      <textarea
                        id="review_text"
                        value={formData.review_text}
                        onChange={(e) => setFormData({ ...formData, review_text: e.target.value })}
                        rows={6}
                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-300 dark:border-white/20 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all resize-none font-medium"
                        placeholder={t(
                          'Share your experience with Faultbase...',
                          'Teilen Sie Ihre Erfahrung mit Faultbase...'
                        )}
                        required
                      />
                      <div className="absolute bottom-3 right-3 text-xs font-mono text-slate-400 dark:text-slate-500">
                        {formData.review_text.length} {t('characters', 'Zeichen')}
                      </div>
                    </div>
                  </div>

                  {/* Optional Fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="job_title" className="block text-sm font-semibold text-slate-900 dark:text-white mb-3">
                        {t('Job Title (Optional)', 'Berufsbezeichnung (Optional)')}
                      </label>
                      <input
                        id="job_title"
                        type="text"
                        value={formData.job_title}
                        onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-white/20 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
                        placeholder={t('e.g. Controls Engineer', 'z.B. Steuerungstechniker')}
                      />
                    </div>
                    <div>
                      <label htmlFor="company" className="block text-sm font-semibold text-slate-900 dark:text-white mb-3">
                        {t('Company (Optional)', 'Unternehmen (Optional)')}
                      </label>
                      <input
                        id="company"
                        type="text"
                        value={formData.company}
                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-white/20 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
                        placeholder={t('e.g. Siemens AG', 'z.B. Siemens AG')}
                      />
                    </div>
                  </div>

                  {/* Submit Button - Enhanced */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="group relative w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:from-slate-400 disabled:to-slate-500 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:scale-100 disabled:cursor-not-allowed overflow-hidden"
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      {isSubmitting ? (
                        <>
                          <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          {t('Submitting...', 'Wird gesendet...')}
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                          {t('Submit Review', 'Bewertung absenden')}
                        </>
                      )}
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                  </button>

                  {/* Success/Error Messages */}
                  <AnimatePresence>
                    {submitSuccess && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl text-green-700 dark:text-green-400"
                      >
                        {t(
                          'Thank you! Your review has been submitted and is pending approval.',
                          'Vielen Dank! Ihre Bewertung wurde eingereicht und wartet auf Freigabe.'
                        )}
                      </motion.div>
                    )}
                    {submitError && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-400"
                      >
                        {submitError}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </form>
              )}
              </div>
            </div>
          </motion.div>

          {/* Reviews List */}
          <div className="space-y-6 mb-12">
            {paginatedReviews.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-slate-500 dark:text-slate-400 text-lg">
                  {t('No reviews yet. Be the first to review!', 'Noch keine Bewertungen. Seien Sie der Erste!')}
                </p>
              </div>
            ) : (
              paginatedReviews.map((review, i) => (
                <motion.div
                  key={review.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: i * 0.05 }}
                  className="group relative bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl rounded-2xl border border-slate-200/60 dark:border-white/10 p-6 sm:p-8 shadow-lg hover:shadow-2xl transition-all overflow-hidden"
                >
                  {/* Tech Pattern Overlay */}
                  <div className="absolute inset-0 opacity-[0.01] dark:opacity-[0.02] group-hover:opacity-[0.02] dark:group-hover:opacity-[0.03] transition-opacity pointer-events-none">
                    <div className="absolute inset-0" style={{
                      backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 10px, currentColor 10px, currentColor 11px)`,
                    }}></div>
                  </div>
                  
                  {/* Left Border Accent */}
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-red-500 via-orange-500 to-red-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  
                  <div className="relative flex items-start gap-4 sm:gap-6">
                    {/* Avatar - Enhanced */}
                    <div className="relative w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-red-500 via-red-600 to-orange-500 rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0 shadow-xl group-hover:scale-110 transition-transform duration-300">
                      <span className="text-white font-bold text-lg sm:text-xl">
                        {getInitials(review.username)}
                      </span>
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-slate-800"></div>
                    </div>

                    {/* Content - Enhanced */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                        <div className="flex-1">
                          <h3 className="font-black text-slate-900 dark:text-white text-lg sm:text-xl mb-1">
                            {review.username || t('Anonymous', 'Anonym')}
                          </h3>
                          {(review.job_title || review.company) && (
                            <div className="flex flex-wrap items-center gap-2">
                              {review.job_title && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 dark:bg-slate-700 rounded-lg text-xs font-mono font-semibold text-slate-700 dark:text-slate-300">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                  </svg>
                                  {review.job_title}
                                </span>
                              )}
                              {review.company && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-xs font-mono font-semibold text-red-700 dark:text-red-400">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                  </svg>
                                  {review.company}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col sm:items-end gap-2">
                          <div className="flex items-center gap-1">
                            {renderStars(review.rating)}
                          </div>
                          <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                            {formatDate(review.created_at)}
                          </span>
                        </div>
                      </div>
                      <div className="relative pl-4 border-l-2 border-slate-200 dark:border-white/10">
                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap text-base sm:text-lg">
                          {review.review_text}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex items-center justify-center gap-2 sm:gap-3"
            >
              {/* Previous Button */}
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 rounded-xl border-2 border-slate-300 dark:border-white/20 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold font-mono text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:border-red-500 dark:hover:border-red-500 hover:text-red-600 dark:hover:text-red-400 transition-all disabled:hover:border-slate-300 dark:disabled:hover:border-white/20 disabled:hover:text-slate-700 dark:disabled:hover:text-slate-300"
              >
                <svg className="w-4 h-4 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                </svg>
                {t('Prev', 'Zurück')}
              </button>

              {/* Page Numbers */}
              <div className="flex items-center gap-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-10 h-10 rounded-xl border-2 font-bold font-mono text-sm transition-all ${
                      currentPage === page
                        ? 'border-red-500 bg-red-500 text-white shadow-lg scale-110'
                        : 'border-slate-300 dark:border-white/20 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-red-500 dark:hover:border-red-500 hover:text-red-600 dark:hover:text-red-400'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              {/* Next Button */}
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 rounded-xl border-2 border-slate-300 dark:border-white/20 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold font-mono text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:border-red-500 dark:hover:border-red-500 hover:text-red-600 dark:hover:text-red-400 transition-all disabled:hover:border-slate-300 dark:disabled:hover:border-white/20 disabled:hover:text-slate-700 dark:disabled:hover:text-slate-300"
              >
                {t('Next', 'Weiter')}
                <svg className="w-4 h-4 inline-block ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}
