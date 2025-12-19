'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { getSupabaseClient } from '@/lib/supabase';

interface Review {
  id: string;
  user_id?: string;
  username?: string;
  rating: number;
  review_text: string;
  created_at: string;
  job_title?: string;
}

interface ReviewsClientProps {
  initialReviews: Review[];
  user: { id: string; email?: string } | null;
}

export default function ReviewsClient({ initialReviews, user }: ReviewsClientProps) {
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [currentPage, setCurrentPage] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    rating: 5,
    review_text: '',
    job_title: '',
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

  const supabase = useMemo(() => getSupabaseClient(), []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      window.location.href = '/signup';
      return;
    }

    if (!formData.review_text.trim()) {
      setSubmitError('Bitte geben Sie Ihre Bewertung ein.');
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

      const { error } = await supabase
        .from('reviews')
        .insert({
          user_id: user.id,
          username: profile?.username || user.email?.split('@')[0] || 'Anonym',
          rating: formData.rating,
          review_text: formData.review_text.trim(),
          job_title: formData.job_title.trim() || null,
          language_path: 'de',
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
      });

      // Refresh reviews after a delay
      setTimeout(() => {
        fetchReviews();
        setSubmitSuccess(false);
      }, 2000);
    } catch (error: unknown) {
      const err = error as Error;
      console.error('Error submitting review:', err);
      setSubmitError(err.message || 'Bewertung konnte nicht gesendet werden. Bitte versuchen Sie es erneut.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const fetchReviews = async () => {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('language_path', 'de')
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
    return new Intl.DateTimeFormat('de-DE', {
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

  const getRatingLabel = (rating: number) => {
    switch (rating) {
      case 5: return 'Ausgezeichnet';
      case 4: return 'Sehr Gut';
      case 3: return 'Gut';
      case 2: return 'Befriedigend';
      case 1: return 'Schlecht';
      default: return '';
    }
  };

  return (
    <main className="pt-24 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Tech Background Pattern */}
      <div className="fixed inset-0 opacity-[0.02] dark:opacity-[0.03] pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 2px, currentColor 2px, currentColor 4px),
                            repeating-linear-gradient(90deg, transparent, transparent 2px, currentColor 2px, currentColor 4px)`,
        }}></div>
      </div>
      
      <div className="max-w-7xl mx-auto relative">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8 sm:mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-full mb-6">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 tracking-wider uppercase">
              Nutzerbewertungen
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black text-slate-900 dark:text-white mb-6 tracking-tight">
            Bewertungen
          </h1>
          <p className="text-lg sm:text-xl lg:text-2xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto leading-relaxed">
            Sehen Sie, was Autobesitzer und Mechaniker über Fahrzeugfehler.de sagen
          </p>
        </motion.div>

        {/* Statistics Section */}
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
              <div className="absolute top-0 left-0 w-24 h-24 bg-gradient-to-br from-blue-500/10 to-transparent rounded-br-full"></div>
              <div className="absolute bottom-0 right-0 w-24 h-24 bg-gradient-to-tl from-blue-500/10 to-transparent rounded-tl-full"></div>
              
              <div className="relative">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                  <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Statistiken
                  </span>
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                </div>
                
                <div className="grid grid-cols-2 gap-6 sm:gap-8 max-w-2xl mx-auto">
                  {/* Total Reviews */}
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <svg className="w-5 h-5 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <span className="text-xs font-mono font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Bewertungen
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
                        Ø Bewertung
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

        {/* Review Form */}
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
            <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-blue-500/5 to-transparent rounded-br-full"></div>
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-tl from-blue-500/5 to-transparent rounded-tl-full"></div>
            
            <div className="relative">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                  Teilen Sie Ihre Erfahrung
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
                    Bitte melden Sie sich an, um eine Bewertung zu hinterlassen
                  </p>
                  <Link
                    href="/signup"
                    className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    Anmelden
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Rating */}
                  <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-6 border border-slate-200 dark:border-white/5">
                    <label className="block text-sm font-bold text-slate-900 dark:text-white mb-4 uppercase tracking-wider">
                      Bewertung
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
                      {getRatingLabel(formData.rating)}
                    </div>
                  </div>

                  {/* Review Text */}
                  <div>
                    <label htmlFor="review_text" className="block text-sm font-bold text-slate-900 dark:text-white mb-3 uppercase tracking-wider">
                      Ihre Bewertung
                    </label>
                    <div className="relative">
                      <textarea
                        id="review_text"
                        value={formData.review_text}
                        onChange={(e) => setFormData({ ...formData, review_text: e.target.value })}
                        rows={6}
                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-300 dark:border-white/20 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none font-medium"
                        placeholder="Teilen Sie Ihre Erfahrung mit Fahrzeugfehler.de..."
                        required
                      />
                      <div className="absolute bottom-3 right-3 text-xs font-mono text-slate-400 dark:text-slate-500">
                        {formData.review_text.length} Zeichen
                      </div>
                    </div>
                  </div>

                  {/* Optional Fields */}
                  <div>
                    <label htmlFor="job_title" className="block text-sm font-semibold text-slate-900 dark:text-white mb-3">
                      Berufsbezeichnung (Optional)
                    </label>
                    <input
                      id="job_title"
                      type="text"
                      value={formData.job_title}
                      onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-white/20 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      placeholder="z.B. Kfz-Mechaniker"
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="group relative w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-slate-400 disabled:to-slate-500 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:scale-100 disabled:cursor-not-allowed overflow-hidden"
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      {isSubmitting ? (
                        <>
                          <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Wird gesendet...
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                          Bewertung absenden
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
                        Vielen Dank! Ihre Bewertung wurde eingereicht und wartet auf Freigabe.
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
                Noch keine Bewertungen. Seien Sie der Erste!
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
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 via-blue-600 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                
                <div className="relative flex items-start gap-4 sm:gap-6">
                  {/* Avatar */}
                  <div className="relative w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0 shadow-xl group-hover:scale-110 transition-transform duration-300">
                    <span className="text-white font-bold text-lg sm:text-xl">
                      {getInitials(review.username)}
                    </span>
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-slate-800"></div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                      <div className="flex-1">
                        <h3 className="font-black text-slate-900 dark:text-white text-lg sm:text-xl mb-1">
                          {review.username || 'Anonym'}
                        </h3>
                        {review.job_title && (
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 dark:bg-slate-700 rounded-lg text-xs font-mono font-semibold text-slate-700 dark:text-slate-300">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                              {review.job_title}
                            </span>
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
              className="px-4 py-2 rounded-xl border-2 border-slate-300 dark:border-white/20 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold font-mono text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:border-blue-500 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-all disabled:hover:border-slate-300 dark:disabled:hover:border-white/20 disabled:hover:text-slate-700 dark:disabled:hover:text-slate-300"
            >
              <svg className="w-4 h-4 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
              Zurück
            </button>

            {/* Page Numbers */}
            <div className="flex items-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-10 h-10 rounded-xl border-2 font-bold font-mono text-sm transition-all ${
                    currentPage === page
                      ? 'border-blue-500 bg-blue-500 text-white shadow-lg scale-110'
                      : 'border-slate-300 dark:border-white/20 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-blue-500 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400'
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
              className="px-4 py-2 rounded-xl border-2 border-slate-300 dark:border-white/20 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold font-mono text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:border-blue-500 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-all disabled:hover:border-slate-300 dark:disabled:hover:border-white/20 disabled:hover:text-slate-700 dark:disabled:hover:text-slate-300"
            >
              Weiter
              <svg className="w-4 h-4 inline-block ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </motion.div>
        )}
      </div>
    </main>
  );
}


