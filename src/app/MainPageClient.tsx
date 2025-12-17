'use client';

import Link from 'next/link';
import { useState, useEffect, useRef, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Reviews Carousel Component
interface ReviewItem {
  id?: string;
  rating: number;
  review_text?: string;
  text: string;
  author: string;
  title: string;
  created_at?: string;
}

const ReviewsCarousel = memo(function ReviewsCarousel({ reviews }: { reviews: ReviewItem[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Minimum swipe distance (in px)
  const minSwipeDistance = 50;

  useEffect(() => {
    if (isPaused || reviews.length === 0) return;
    const interval = setInterval(() => {
      setDirection(1);
      setCurrentIndex((prev) => (prev + 1) % reviews.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [reviews.length, isPaused]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        setDirection(-1);
        setCurrentIndex((prev) => (prev - 1 + reviews.length) % reviews.length);
      } else if (e.key === 'ArrowRight') {
        setDirection(1);
        setCurrentIndex((prev) => (prev + 1) % reviews.length);
      }
    };
    window.addEventListener('keydown', handleKeyPress, { passive: true });
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [reviews.length]);

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      setDirection(1);
      setCurrentIndex((prev) => (prev + 1) % reviews.length);
    }
    if (isRightSwipe) {
      setDirection(-1);
      setCurrentIndex((prev) => (prev - 1 + reviews.length) % reviews.length);
    }
  };

  const goToSlide = (index: number) => {
    if (index > currentIndex) {
      setDirection(1);
    } else {
      setDirection(-1);
    }
    setCurrentIndex(index);
  };

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
    }),
  };

  if (reviews.length === 0) return null;

  return (
    <div
      className="relative w-full"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <AnimatePresence initial={false} custom={direction} mode="wait">
        <motion.div
          key={currentIndex}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { type: 'spring', stiffness: 300, damping: 30 },
            opacity: { duration: 0.2 },
          }}
          className="w-full"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <div className="bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 rounded-2xl p-6 sm:p-8 md:p-10 border-2 border-slate-200 dark:border-slate-700 shadow-xl">
            <div className="flex items-center gap-2 mb-4">
              {[...Array(5)].map((_, i) => (
                <svg
                  key={i}
                  className={`w-5 h-5 ${
                    i < reviews[currentIndex].rating
                      ? 'text-yellow-400'
                      : 'text-slate-300 dark:text-slate-600'
                  }`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <p className="text-lg sm:text-xl text-slate-700 dark:text-slate-300 mb-4 leading-relaxed">
              "{reviews[currentIndex].text || reviews[currentIndex].review_text}"
            </p>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-900 dark:text-white text-base sm:text-lg">
                  {reviews[currentIndex].author}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {reviews[currentIndex].title}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation dots */}
      {reviews.length > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {reviews.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentIndex
                  ? 'bg-blue-600 dark:bg-blue-400 w-8'
                  : 'bg-slate-300 dark:bg-slate-600'
              }`}
              aria-label={`Go to review ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Navigation arrows */}
      {reviews.length > 1 && (
        <>
          <button
            onClick={() => {
              setDirection(-1);
              setCurrentIndex((prev) => (prev - 1 + reviews.length) % reviews.length);
            }}
            className="absolute left-2 sm:left-0 top-1/2 -translate-y-1/2 sm:-translate-x-4 md:-translate-x-6 bg-white dark:bg-slate-800 rounded-full p-2 min-h-[44px] min-w-[44px] shadow-lg hover:shadow-xl transition-all border-2 border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500"
            aria-label="Previous review"
          >
            <svg className="w-5 h-5 text-slate-700 dark:text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={() => {
              setDirection(1);
              setCurrentIndex((prev) => (prev + 1) % reviews.length);
            }}
            className="absolute right-2 sm:right-0 top-1/2 -translate-y-1/2 sm:translate-x-4 md:translate-x-6 bg-white dark:bg-slate-800 rounded-full p-2 min-h-[44px] min-w-[44px] shadow-lg hover:shadow-xl transition-all border-2 border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500"
            aria-label="Next review"
          >
            <svg className="w-5 h-5 text-slate-700 dark:text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}
    </div>
  );
});

ReviewsCarousel.displayName = 'ReviewsCarousel';

export default function MainPageClient() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Text content - now hardcoded to German
  const headline = 'Fahrzeugfehler diagnostizieren,';
  const subline = 'Ursachen analysieren.';
  const tagline = 'Technische Diagnose-Datenbank für Fahrzeugfehler';
  const valueProp = 'Umfassende Diagnose-Datenbank für Fahrzeugfehler. Technische Lösungen, Ursachenanalysen und Reparaturhinweise für alle Automarken und Modelle.';
  const cta = 'Diagnose starten';
  const searchPlaceholder = 'z.B. BMW 3er G20, Motor ruckelt, Fehlercode P0302...';

  const stats = [
    {
      number: '50K+',
      label: 'Fahrzeugfehler',
      desc: 'Dokumentierte Fehlerfälle für alle Automarken'
    },
    {
      number: '200+',
      label: 'Automarken',
      desc: 'Von Audi bis Volvo'
    },
    {
      number: '1000+',
      label: 'Automodelle',
      desc: 'Umfassende Abdeckung'
    },
  ];

  const features = [
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: 'Strukturierte Lösungen',
      description: 'Klare Schritt-für-Schritt-Anleitungen für jeden Fehler'
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      title: 'Technische Dokumentation',
      description: 'Detaillierte Informationen für Werkstätten und Techniker'
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      ),
      title: 'Systematische Suche',
      description: 'Schnelle Fehlersuche nach Marke, Modell oder Fehlercode'
    },
  ];

  const howItWorks = [
    {
      step: '1',
      title: 'Fahrzeug auswählen',
      description: 'Wählen Sie Marke, Modell und Generation Ihres Fahrzeugs'
    },
    {
      step: '2',
      title: 'Fehler finden',
      description: 'Durchsuchen Sie die Datenbank nach Ihrem spezifischen Problem'
    },
    {
      step: '3',
      title: 'Lösung anwenden',
      description: 'Folgen Sie der strukturierten Anleitung zur Fehlerbehebung'
    },
  ];

  const reviews: ReviewItem[] = [
    {
      rating: 5,
      text: 'Sehr hilfreich für die Fehlersuche. Die strukturierten Lösungen sind genau das, was ich als Kfz-Meister brauche.',
      author: 'Michael K.',
      title: 'Kfz-Meister'
    },
    {
      rating: 5,
      text: 'Endlich eine seriöse Quelle für Fahrzeugdiagnose. Kein Marketing-Gerede, nur technische Fakten.',
      author: 'Thomas M.',
      title: 'Fahrzeughalter'
    },
    {
      rating: 5,
      text: 'Die Datenbank ist umfassend und die Lösungen sind präzise. Perfekt für die tägliche Arbeit in der Werkstatt.',
      author: 'Andreas S.',
      title: 'Werkstattbesitzer'
    },
  ];

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/cars?search=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-black dark:via-slate-950 dark:to-black">
        {/* Background patterns */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.03%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%221%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-50"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-slate-500/5"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 lg:py-28">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black text-white mb-3 sm:mb-4 md:mb-6 tracking-tight leading-tight">
              {headline}
              <br />
              <span className="bg-gradient-to-r from-blue-400 via-blue-300 to-slate-300 bg-clip-text text-transparent">
                {subline}
              </span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-slate-300 dark:text-slate-400 mb-6 sm:mb-8 md:mb-10 max-w-3xl mx-auto px-2">
              {tagline}
            </p>
            <p className="text-sm sm:text-base md:text-lg text-slate-400 dark:text-slate-500 mb-8 sm:mb-10 md:mb-12 max-w-2xl mx-auto px-2">
              {valueProp}
            </p>

            {/* Search Bar */}
            <motion.form
              onSubmit={handleSearch}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="max-w-3xl mx-auto mb-8 sm:mb-10"
            >
              <div className="relative flex items-center bg-white dark:bg-slate-900 rounded-xl shadow-xl border-2 border-slate-200 dark:border-slate-800 overflow-hidden focus-within:border-blue-500/50 dark:focus-within:border-blue-500/50 focus-within:shadow-2xl focus-within:ring-4 focus-within:ring-blue-500/20 transition-all duration-300">
                <div className="pl-6 pr-2">
                  <svg className="w-6 h-6 text-slate-400 dark:text-slate-500 group-focus-within:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setIsSearchFocused(false)}
                  placeholder={searchPlaceholder}
                  className="flex-1 px-3 sm:px-4 py-4 sm:py-5 md:py-6 text-base sm:text-lg md:text-xl bg-transparent text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none"
                />
                <button
                  type="submit"
                  className="px-4 sm:px-6 md:px-8 py-4 sm:py-5 min-h-[44px] bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 text-white font-semibold hover:from-blue-700 hover:to-blue-800 dark:hover:from-blue-800 dark:hover:to-blue-900 transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:scale-105 active:scale-100"
                >
                  <span className="hidden sm:inline">Suchen</span>
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>
              {isSearchFocused && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className="mt-4 pt-4 border-t border-slate-200/40 dark:border-white/5 overflow-hidden"
                >
                  <p className="text-xs font-mono text-slate-500 dark:text-slate-400">
                    → Diagnose-Abfrage starten
                  </p>
                </motion.div>
              )}
            </motion.form>

            {/* CTA Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              <Link
                href="/cars"
                className="inline-flex items-center gap-2 sm:gap-3 px-6 sm:px-8 py-3 sm:py-4 min-h-[44px] bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition-all backdrop-blur-sm border-2 border-white/20 hover:border-white/40 text-base sm:text-lg md:text-xl"
              >
                {cta}
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Promotional Banner Section */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-slate-800 dark:from-blue-800 dark:via-blue-900 dark:to-slate-900 py-8 sm:py-12 md:py-16 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%221%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-50"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="inline-block px-4 py-2 bg-white/20 dark:bg-white/10 backdrop-blur-sm rounded-full mb-4 sm:mb-6 border border-white/30">
              <span className="text-sm sm:text-base font-bold text-white">🚗 Professionelle Diagnose-Datenbank</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white mb-3 sm:mb-4 md:mb-6 tracking-tight">
              Technische Lösungen für alle Fahrzeugfehler
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-white/90 dark:text-white/80 mb-6 sm:mb-8 max-w-3xl mx-auto leading-relaxed">
              Von Werkstätten empfohlen. Schritt-für-Schritt-Anleitungen, Fehlercode-Analysen und professionelle Diagnoseverfahren für alle Automarken und Modelle.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center">
              <Link
                href="/cars"
                className="inline-flex items-center justify-center gap-2 sm:gap-3 px-6 sm:px-8 py-3 sm:py-4 min-h-[44px] bg-white text-blue-600 rounded-xl font-bold transition-all shadow-xl hover:shadow-2xl hover:scale-105 active:scale-100 text-sm sm:text-base md:text-lg"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                Automarken durchsuchen
              </Link>
              <Link
                href="/chat"
                className="inline-flex items-center justify-center gap-2 sm:gap-3 px-6 sm:px-8 py-3 sm:py-4 min-h-[44px] bg-white/10 hover:bg-white/20 backdrop-blur-sm border-2 border-white/30 hover:border-white/50 text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-xl hover:scale-105 active:scale-100 text-sm sm:text-base md:text-lg"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Fragen stellen
              </Link>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 py-8 sm:py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + index * 0.1, duration: 0.6 }}
                className="text-center"
              >
                <div className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white mb-2">
                  {stat.number}
                </div>
                <div className="text-lg sm:text-xl font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {stat.label}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  {stat.desc}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-12 sm:py-16 md:py-20 bg-white dark:bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.4 }}
            className="text-center mb-8 sm:mb-12 md:mb-20"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-black text-black dark:text-white mb-3 sm:mb-4 tracking-tight px-2">
              Technische Eigenschaften
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-slate-700 dark:text-slate-300 max-w-2xl mx-auto px-4">
              Strukturierte Diagnose-Datenbank für professionelle Anwendung
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: index * 0.1, duration: 0.4 }}
                className="p-5 sm:p-6 md:p-8 bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 rounded-xl sm:rounded-2xl border-2 border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-600 transition-all shadow-lg hover:shadow-xl"
              >
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400 mb-3 sm:mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-900 dark:text-white mb-2 sm:mb-3">
                  {feature.title}
                </h3>
                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="py-12 sm:py-16 md:py-20 bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.4 }}
            className="text-center mb-8 sm:mb-12 md:mb-20"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-black text-black dark:text-white mb-3 sm:mb-4 tracking-tight px-2">
              Technische Diagnose-Datenbank
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-slate-700 dark:text-slate-300 max-w-2xl mx-auto px-4">
              Strukturierte Informationen für Werkstätten und Fahrzeughalter
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
            {howItWorks.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: index * 0.1, duration: 0.4 }}
                className="relative"
              >
                <div className="absolute -top-3 -left-3 sm:-top-4 sm:-left-4 w-12 h-12 sm:w-16 sm:h-16 bg-blue-600 dark:bg-blue-500 rounded-full flex items-center justify-center text-white font-black text-lg sm:text-2xl shadow-lg">
                  {item.step}
                </div>
                <div className="p-5 sm:p-6 md:p-8 bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl border-2 border-slate-200 dark:border-slate-700 shadow-lg hover:shadow-xl transition-all h-full">
                  <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-900 dark:text-white mb-2 sm:mb-3 mt-3 sm:mt-4">
                    {item.title}
                  </h3>
                  <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Categories Section - Inspired by heizungs-check.org */}
      <div className="py-12 sm:py-16 md:py-20 bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.4 }}
            className="text-center mb-8 sm:mb-12 md:mb-16"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-black dark:text-white mb-3 sm:mb-4 tracking-tight px-2">
              Durchsuchen nach Kategorie
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-slate-700 dark:text-slate-300 max-w-2xl mx-auto px-4">
              Strukturierte Zugänge zu Fehlerlösungen und Diagnoseinformationen
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8 max-w-6xl mx-auto">
            {/* Automarken Kategorie */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: 0.1, duration: 0.4 }}
            >
              <Link
                href="/cars"
                className="group block h-full"
              >
                <div className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl p-6 sm:p-8 border-2 border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500/50 shadow-lg hover:shadow-xl transition-all duration-300 h-full">
                  <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-2xl sm:text-3xl">
                      🚗
                    </div>
                    <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      Automarken
                    </h3>
                  </div>
                  <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mb-4 sm:mb-6 leading-relaxed">
                    Fehlercodes nach Marke. Umfassende Übersicht aller Automarken mit detaillierten Fehlerlösungen.
                  </p>
                  <div className="flex items-center text-blue-600 dark:text-blue-400 font-bold group-hover:translate-x-2 transition-transform text-sm sm:text-base">
                    Marken ansehen
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>
            </motion.div>

            {/* Fehlercodes Kategorie */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: 0.2, duration: 0.4 }}
            >
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/20 rounded-xl sm:rounded-2xl p-6 sm:p-8 border-2 border-blue-200 dark:border-blue-800/50 shadow-lg h-full">
                <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-200 dark:bg-blue-900/50 rounded-xl flex items-center justify-center text-2xl sm:text-3xl">
                    🔧
                  </div>
                  <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 dark:text-white">
                    Fehlercodes
                  </h3>
                </div>
                <p className="text-sm sm:text-base text-slate-700 dark:text-slate-300 mb-4 sm:mb-6 leading-relaxed font-medium">
                  Diagnosecodes und Fehlercodes nach Modell. Systematische Übersicht aller Fehlercodes mit technischen Lösungen für jedes Automodell.
                </p>
                <div className="space-y-2">
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-semibold">
                    Verfügbar für alle Modelle:
                  </p>
                  <ul className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 space-y-1">
                    <li className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Gruppiert nach Fehlercode
                    </li>
                    <li className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Filterbar nach Generation
                    </li>
                    <li className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Direkte Links zu Lösungen
                    </li>
                  </ul>
                </div>
                <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-blue-200 dark:border-blue-800/50">
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-3">
                    Wählen Sie eine Marke und ein Modell, um die Fehlercode-Übersicht zu sehen.
                  </p>
                  <Link
                    href="/cars"
                    className="inline-flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 min-h-[44px] bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white font-bold rounded-lg sm:rounded-xl transition-all shadow-md hover:shadow-lg text-sm sm:text-base"
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                    Zu Automarken
                  </Link>
                </div>
              </div>
            </motion.div>

            {/* Chat/Fragen Kategorie */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: 0.3, duration: 0.4 }}
            >
              <Link
                href="/chat"
                className="group block h-full"
              >
                <div className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl p-6 sm:p-8 border-2 border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500/50 shadow-lg hover:shadow-xl transition-all duration-300 h-full">
                  <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-2xl sm:text-3xl">
                      💬
                    </div>
                    <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      Fragen stellen
                    </h3>
                  </div>
                  <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mb-4 sm:mb-6 leading-relaxed">
                    Stellen Sie Fragen zu Fahrzeugproblemen und erhalten Sie strukturierte Antworten.
                  </p>
                  <div className="flex items-center text-blue-600 dark:text-blue-400 font-bold group-hover:translate-x-2 transition-transform text-sm sm:text-base">
                    Fragen stellen
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="py-12 sm:py-16 md:py-20 bg-white dark:bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.4 }}
            className="text-center mb-8 sm:mb-12 md:mb-20"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-black text-black dark:text-white mb-3 sm:mb-4 tracking-tight px-2">
              Was unsere Nutzer sagen
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-slate-700 dark:text-slate-300 max-w-2xl mx-auto px-4">
              Bewertungen von Werkstätten, Technikern und Fahrzeughaltern
            </p>
          </motion.div>
          
          <div className="max-w-4xl mx-auto">
            <ReviewsCarousel reviews={reviews} />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="text-center mt-12"
          >
            <Link
              href="/reviews"
              className="inline-flex items-center gap-2 sm:gap-3 px-6 sm:px-8 py-3 sm:py-4 min-h-[44px] bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border-2 border-slate-300/60 dark:border-white/10 text-slate-900 dark:text-white text-base sm:text-lg font-bold rounded-xl sm:rounded-2xl hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-xl transition-all duration-200 group"
            >
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
              Alle Bewertungen anzeigen
            </Link>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

