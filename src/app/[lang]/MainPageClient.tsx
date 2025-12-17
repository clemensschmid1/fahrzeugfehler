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

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
    setIsPaused(true);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) {
      setIsPaused(false);
      return;
    }
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      goToNext();
    } else if (isRightSwipe) {
      goToPrevious();
    }
    setIsPaused(false);
  };

  const goToSlide = (index: number) => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setDirection(index > currentIndex ? 1 : -1);
    setCurrentIndex(index);
    setIsPaused(true);
    timeoutRef.current = setTimeout(() => {
      setIsPaused(false);
      timeoutRef.current = null;
    }, 5000);
  };

  const goToPrevious = () => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + reviews.length) % reviews.length);
  };

  const goToNext = () => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % reviews.length);
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <svg
        key={i}
        className={`w-4 h-4 sm:w-5 sm:h-5 ${i < rating ? 'text-yellow-400 fill-current' : 'text-slate-300 dark:text-slate-600'}`}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ));
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (reviews.length === 0) return null;

  return (
    <div className="relative max-w-5xl mx-auto">
      {/* Carousel Container */}
      <div 
        className="relative overflow-hidden rounded-2xl sm:rounded-3xl cursor-grab active:cursor-grabbing"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentIndex}
            custom={direction}
            initial={{ opacity: 0, x: direction > 0 ? 300 : -300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction > 0 ? -300 : 300 }}
            transition={{ duration: 0.3 }}
            className="relative p-8 sm:p-12 lg:p-16 bg-white dark:bg-black backdrop-blur-xl border-2 border-black/10 dark:border-white/20 shadow-2xl overflow-hidden select-none"
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={(e, { offset, velocity }) => {
              const swipe = Math.abs(offset.x) * velocity.x;
              if (swipe < -10000) {
                goToNext();
              } else if (swipe > 10000) {
                goToPrevious();
              }
            }}
          >
            {/* Tech Circuit Pattern Background */}
            <div className="absolute inset-0 opacity-[0.04] dark:opacity-[0.08]">
              <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="circuit-pattern" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
                    <circle cx="10" cy="10" r="1.5" fill="currentColor" />
                    <circle cx="50" cy="10" r="1.5" fill="currentColor" />
                    <circle cx="10" cy="50" r="1.5" fill="currentColor" />
                    <circle cx="50" cy="50" r="1.5" fill="currentColor" />
                    <line x1="10" y1="10" x2="50" y2="10" stroke="currentColor" strokeWidth="0.5" />
                    <line x1="10" y1="10" x2="10" y2="50" stroke="currentColor" strokeWidth="0.5" />
                    <line x1="50" y1="10" x2="50" y2="50" stroke="currentColor" strokeWidth="0.5" />
                    <line x1="10" y1="50" x2="50" y2="50" stroke="currentColor" strokeWidth="0.5" />
                    <line x1="30" y1="10" x2="30" y2="30" stroke="currentColor" strokeWidth="0.5" />
                    <line x1="30" y1="30" x2="50" y2="30" stroke="currentColor" strokeWidth="0.5" />
                    <line x1="10" y1="30" x2="30" y2="30" stroke="currentColor" strokeWidth="0.5" />
                    <line x1="30" y1="30" x2="30" y2="50" stroke="currentColor" strokeWidth="0.5" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#circuit-pattern)" />
              </svg>
            </div>
            
            {/* Hexagonal Tech Pattern Overlay */}
            <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.04]">
              <div className="absolute inset-0" style={{
                backgroundImage: `radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)`,
                backgroundSize: '40px 40px',
                clipPath: 'polygon(30% 0%, 70% 0%, 100% 50%, 70% 100%, 30% 100%, 0% 50%)',
              }}></div>
            </div>
            
            {/* Gradient Overlays - More Subtle */}
            <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-blue-500/3 to-transparent rounded-br-full"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-slate-500/3 to-transparent rounded-tl-full"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[radial-gradient(circle,rgba(0,102,204,0.02),transparent_70%)]"></div>

            {/* Decorative Quote - Enhanced */}
            <div className="absolute top-6 left-6 text-blue-200/20 dark:text-blue-900/15 text-8xl sm:text-9xl font-serif leading-none opacity-40">&quot;</div>
            <div className="absolute bottom-6 right-6 text-blue-200/20 dark:text-blue-900/15 text-8xl sm:text-9xl font-serif leading-none opacity-40 transform rotate-180">&quot;</div>
            
            <div className="relative">
              {/* Rating Stars - Enhanced */}
              <div className="flex items-center gap-2 mb-6 justify-center sm:justify-start">
                <div className="flex items-center gap-1">
                  {renderStars(reviews[currentIndex].rating)}
                </div>
                <div className="h-4 w-px bg-slate-300 dark:bg-slate-600"></div>
                <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Verifiziert
                </span>
              </div>

              {/* Review Text */}
              <p className="text-xl sm:text-2xl lg:text-3xl text-black dark:text-white mb-8 sm:mb-12 leading-relaxed font-medium text-center sm:text-left">
                {reviews[currentIndex].text}
              </p>

              {/* Author Info - Enhanced */}
              <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-4 sm:gap-5 pt-4 border-t border-black/10 dark:border-white/20">
                <div className="relative w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-600 via-blue-700 to-slate-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                  <span className="text-white font-black text-xl sm:text-2xl">
                    {getInitials(reviews[currentIndex].author)}
                  </span>
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white dark:border-slate-800 flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <div className="text-center sm:text-left">
                  <div className="text-black dark:text-white font-black text-lg sm:text-xl mb-1">
                    {reviews[currentIndex].author}
                  </div>
                  <div className="text-slate-700 dark:text-slate-300 text-sm sm:text-base font-medium mb-2">
                    {reviews[currentIndex].title}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation Arrows - Enhanced */}
        <button
          onClick={goToPrevious}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 bg-white dark:bg-black backdrop-blur-md border-2 border-black/20 dark:border-white/30 rounded-full flex items-center justify-center text-black dark:text-white hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-500 dark:hover:border-blue-500 shadow-xl hover:shadow-2xl hover:scale-110 transition-all z-10 active:scale-95"
          aria-label="Vorherige Bewertung"
        >
          <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          onClick={goToNext}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 bg-white dark:bg-black backdrop-blur-md border-2 border-black/20 dark:border-white/30 rounded-full flex items-center justify-center text-black dark:text-white hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-500 dark:hover:border-blue-500 shadow-xl hover:shadow-2xl hover:scale-110 transition-all z-10 active:scale-95"
          aria-label="Nächste Bewertung"
        >
          <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
          </svg>
        </button>
        
      </div>

      {/* Dots Indicator */}
      <div className="flex items-center justify-center gap-2 mt-6">
        {reviews.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              index === currentIndex
                ? 'bg-blue-600 dark:bg-blue-400 w-8'
                : 'bg-slate-300 dark:bg-slate-600 hover:bg-slate-400 dark:hover:bg-slate-500'
            }`}
            aria-label={`Gehe zu Bewertung ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
});

export default function MainPageClient() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [activeStep, setActiveStep] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    
    // Throttle resize events to prevent excessive re-renders
    let timeoutId: NodeJS.Timeout | null = null;
    const handleResize = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(checkMobile, 150);
    };
    
    window.addEventListener('resize', handleResize, { passive: true });
    return () => {
      window.removeEventListener('resize', handleResize);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  // Text content - German only
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
      number: '33+',
      label: 'Automarken',
      desc: 'Umfassende Abdeckung aller gängigen Marken'
    },
    {
      number: '200+',
      label: 'Generationen',
      desc: 'Detaillierte Lösungen für alle Modellgenerationen'
    },
    {
      number: '2.3s',
      label: 'Abfragezeit',
      desc: 'Schnelle Datenbankabfrage für Diagnose-Informationen'
    }
  ];

  const features = [
    {
      title: 'Strukturierte Diagnose-Informationen',
      desc: 'Systematische Aufbereitung von Symptomen, möglichen Ursachen, typischen Auslösern und empfohlenen nächsten Schritten. Technisch fundierte Diagnose-Datenbank.',
      icon: 'check'
    },
    {
      title: 'Umfassende Datenbank',
      desc: 'Technische Referenzquelle für Fahrzeugfehler aller Automarken und Modelle. Strukturierte Informationen für Werkstätten und Fahrzeughalter.',
      icon: 'lightning'
    },
    {
      title: 'Technische Dokumentation',
      desc: 'Seriöse Referenzquelle mit strukturierten Diagnose-Informationen. Ursachenanalysen, Risikobewertungen und Reparaturhinweise für alle Fahrzeugtypen.',
      icon: 'shield'
    }
  ];

  const howItWorks = [
    {
      icon: 'code',
      title: 'Fahrzeug & Fehler eingeben',
      desc: 'Eingabe von Fahrzeugmodell, Fehlercode oder Symptombeschreibung. Unterstützung für alle gängigen Automarken und Modelle.',
      tech: 'BMW 3er G20, P0302, Motor ruckelt'
    },
    {
      icon: 'ai',
      title: 'Diagnose-Abfrage',
      desc: 'Systematische Suche in der Diagnose-Datenbank. Strukturierte Informationen zu Symptomen, Ursachen und Lösungen.',
      tech: 'Datenbank • Strukturierte Suche'
    },
    {
      icon: 'solution',
      title: 'Technische Diagnose',
      desc: 'Strukturierte Ausgabe mit Symptomen, möglichen Ursachen, Risikobewertung und empfohlenen nächsten Schritten.',
      tech: 'Technisch fundiert • Strukturiert'
    }
  ];

  const reviews = [
    {
      text: '"Umfassende technische Datenbank für Fahrzeugfehler. Präzise Diagnosen und bewährte Lösungen."',
      author: 'Mike Chen',
      title: 'Senior Steuerungstechniker',
      rating: 5
    },
    {
      text: '"Die technische Tiefe der Diagnosen ist hervorragend. Strukturierte Ursachenanalysen und klare Reparaturhinweise."',
      author: 'Sarah Johnson',
      title: 'Automation Engineer',
      rating: 5
    },
    {
      text: '"Als Werkstatt-Techniker schätze ich die strukturierte Aufbereitung der Diagnoseinformationen. Seriöse Referenzquelle."',
      author: 'Thomas Müller',
      title: 'Wartungstechniker',
      rating: 5
    },
    {
      text: '"Die Diagnose-Datenbank bietet umfassende Informationen zu Fahrzeugfehlern. Technisch fundiert und praxisnah."',
      author: 'David Park',
      title: 'Projektleiter Automatisierung',
      rating: 5
    },
    {
      text: '"Strukturierte Diagnose-Datenbank mit klaren Ursachenanalysen. Ideal für die systematische Fehlersuche."',
      author: 'Emma Rodriguez',
      title: 'Systemingenieurin',
      rating: 5
    },
    {
      text: '"Die technische Dokumentation ist umfassend und strukturiert. Wertvolle Referenz für die Fahrzeugdiagnose."',
      author: 'James Wilson',
      title: 'Leiter Instandhaltung',
      rating: 5
    },
    {
      text: '"Seriöse technische Referenzquelle für Fahrzeugfehler. Strukturierte Informationen zu Symptomen, Ursachen und Lösungen."',
      author: 'Lisa Anderson',
      title: 'Entwicklerin Steuerungssysteme',
      rating: 5
    }
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/chat?q=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-black transition-colors duration-300">
      {/* Top Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 dark:bg-black/95 backdrop-blur-xl border-b border-black/10 dark:border-white/20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4 h-16">
            <Link href="/" className="flex items-center gap-2.5 flex-shrink-0 group">
              <div className="relative">
                <div className="w-2.5 h-2.5 bg-blue-600 rounded-full"></div>
              </div>
              <span className="text-slate-900 dark:text-white font-mono text-sm tracking-[0.15em] font-bold group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Fahrzeugfehler.de</span>
            </Link>
            
            {/* Spacer for layout */}
            <div className="flex-1"></div>
            
            <div className="flex items-center gap-2.5 flex-shrink-0">
              {/* Cars Link - Desktop - PROMINENT */}
              <Link
                href="/cars"
                className="hidden sm:flex group relative items-center gap-2.5 px-5 py-2.5 rounded-xl text-base font-bold bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-500 dark:to-blue-600 text-white hover:from-blue-700 hover:to-blue-800 dark:hover:from-blue-600 dark:hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                <span>Fahrzeuge & Fehler</span>
              </Link>
              
              {/* Cars Link - Mobile - PROMINENT */}
              <Link
                href="/cars"
                className="sm:hidden p-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-500 dark:to-blue-600 text-white hover:from-blue-700 hover:to-blue-800 dark:hover:from-blue-600 dark:hover:to-blue-700 transition-all shadow-lg"
                aria-label="Fahrzeuge & Fehler"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </Link>
              
              {/* News Link - Desktop */}
              <Link
                href="/news"
                className="hidden sm:flex group relative items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold text-slate-700 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
                <span>NEWS</span>
                <span className="absolute inset-0 bg-blue-50 dark:bg-blue-900/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity -z-10"></span>
              </Link>
              
              {/* News Link - Mobile */}
              <Link
                href="/news"
                className="sm:hidden p-2 rounded-lg text-slate-700 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-white/10 transition-all"
                aria-label="News"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1">
        {/* Hero Section with Professional Premium Background */}
        <section className="relative pt-36 pb-32 px-4 sm:px-6 lg:px-8 overflow-hidden">
          {/* Professional Background Layers */}
          <div className="absolute inset-0 bg-gradient-to-b from-white via-slate-50/50 to-white dark:from-black dark:via-slate-950/50 dark:to-black"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(0,102,204,0.08),transparent_70%)] dark:bg-[radial-gradient(circle_at_30%_20%,rgba(0,102,204,0.12),transparent_70%)]"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(59,130,246,0.06),transparent_70%)] dark:bg-[radial-gradient(circle_at_70%_80%,rgba(59,130,246,0.10),transparent_70%)]"></div>
          
          {/* Professional grid pattern - enhanced */}
          <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.08]" style={{
            backgroundImage: 'linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)',
            backgroundSize: '48px 48px'
          }}></div>
          
          {/* Subtle animated gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-slate-500/5 dark:from-blue-500/10 dark:via-transparent dark:to-slate-500/10"></div>
          
          <div className="relative max-w-7xl mx-auto">
            <div className="max-w-4xl mx-auto text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="mb-8"
              >
                <span className="inline-flex items-center gap-2.5 px-6 py-3 bg-gradient-to-r from-blue-50 via-slate-50 to-blue-50 dark:from-blue-900/30 dark:via-slate-900/30 dark:to-blue-900/30 text-blue-700 dark:text-blue-400 text-sm font-bold rounded-full border-2 border-blue-200/80 dark:border-blue-800/60 shadow-lg backdrop-blur-md hover:shadow-xl transition-all duration-300 hover:scale-105">
                  <svg className="w-4 h-4 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  {tagline}
                </span>
              </motion.div>
              
              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-black text-black dark:text-white tracking-[-0.02em] leading-[0.95] mb-8 drop-shadow-lg"
              >
                {headline}
                <br />
                <span className="bg-gradient-to-r from-blue-600 via-slate-600 to-blue-600 dark:from-blue-400 dark:via-slate-400 dark:to-blue-400 bg-clip-text text-transparent drop-shadow-xl">
                  {subline}
                </span>
              </motion.h1>
              
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-xl sm:text-2xl lg:text-3xl text-slate-700 dark:text-slate-200 max-w-3xl mx-auto mb-14 leading-relaxed font-medium"
              >
                {valueProp}
              </motion.p>

              {/* Premium Search Interface - Mobile Optimized */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.25 }}
                className="max-w-4xl mx-auto mb-12"
              >
                <div className={`relative bg-white/95 dark:bg-black/95 backdrop-blur-xl rounded-3xl border-2 border-black/10 dark:border-white/20 shadow-2xl p-3 sm:p-4 transition-all duration-300 ${isSearchFocused ? 'shadow-3xl border-blue-500/60 dark:border-blue-500/60 ring-4 ring-blue-500/20 dark:ring-blue-500/20 scale-[1.01]' : 'hover:border-blue-500/30 dark:hover:border-blue-500/30'}`}>
                  <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 items-end">
                    <div className="flex-1 relative w-full">
                      <textarea
                        ref={textareaRef}
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          // Auto-expand textarea
                          e.target.style.height = 'auto';
                          const maxHeight = isMobile ? 300 : 200;
                          e.target.style.height = `${Math.min(e.target.scrollHeight, maxHeight)}px`;
                        }}
                        onInput={(e) => {
                          const target = e.target as HTMLTextAreaElement;
                          target.style.height = 'auto';
                          const maxHeight = isMobile ? 300 : 200;
                          target.style.height = `${Math.min(target.scrollHeight, maxHeight)}px`;
                        }}
                        onFocus={() => {
                          setIsSearchFocused(true);
                          // On mobile, expand more aggressively
                          if (isMobile && textareaRef.current) {
                            textareaRef.current.style.height = '120px';
                            // Use requestAnimationFrame instead of setTimeout for better performance
                            requestAnimationFrame(() => {
                              requestAnimationFrame(() => {
                                if (textareaRef.current) {
                                  textareaRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                }
                              });
                            });
                          }
                        }}
                        onBlur={() => setIsSearchFocused(false)}
                        placeholder={searchPlaceholder}
                        rows={1}
                        className="w-full px-4 sm:px-6 py-4 sm:py-5 text-base sm:text-lg rounded-2xl border border-black/10 dark:border-white/20 bg-white dark:bg-black text-black dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-600 dark:focus:border-blue-500 transition-all duration-200 font-medium backdrop-blur-sm resize-none overflow-hidden min-h-[56px] sm:min-h-[64px] max-h-[300px] sm:max-h-[200px]"
                        style={{ height: isMobile ? '56px' : '64px' }}
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full sm:w-auto px-8 sm:px-10 py-4 sm:py-5 bg-gradient-to-r from-blue-600 via-blue-600 to-blue-700 dark:from-blue-500 dark:via-blue-500 dark:to-blue-600 text-white text-base sm:text-lg font-black rounded-2xl hover:from-blue-700 hover:via-blue-700 hover:to-blue-800 dark:hover:from-blue-600 dark:hover:via-blue-600 dark:hover:to-blue-700 transition-all duration-200 shadow-xl hover:shadow-2xl transform hover:scale-[1.05] active:scale-[0.98] flex items-center justify-center gap-2.5 flex-shrink-0 border-2 border-blue-400/30 dark:border-blue-500/30 hover:border-blue-300/50 dark:hover:border-blue-400/50"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Diagnostizieren
                    </button>
                  </form>
                </div>
                <div className="mt-6 flex items-center justify-center gap-8 text-sm font-medium">
                  <div className="flex items-center gap-2.5 text-slate-500 dark:text-slate-400">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                    <span>Strukturierte Diagnosen</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-slate-500 dark:text-slate-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <span>Technische Dokumentation</span>
                  </div>
                </div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-10"
              >
                {/* PRIMARY CTA: Cars & Faults - Most Prominent */}
                <Link
                  href="/cars"
                  className="group relative inline-flex items-center gap-3 px-12 py-6 bg-gradient-to-r from-blue-600 via-blue-600 to-blue-700 dark:from-blue-500 dark:via-blue-500 dark:to-blue-600 text-white text-xl font-black rounded-2xl hover:from-blue-700 hover:via-blue-700 hover:to-blue-800 dark:hover:from-blue-600 dark:hover:via-blue-600 dark:hover:to-blue-700 transition-all duration-200 shadow-2xl hover:shadow-3xl transform hover:scale-110 active:scale-95 border-2 border-blue-400/30 dark:border-blue-500/30"
                >
                  <svg className="w-7 h-7 group-hover:rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                  <span>Fahrzeuge & Fehler durchsuchen</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-slate-500/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity blur-xl"></div>
                </Link>
                
                {/* Secondary CTA: Chat */}
                <Link
                  href="/chat"
                  className="group inline-flex items-center gap-3 px-10 py-5 bg-white dark:bg-black backdrop-blur-sm border-2 border-black/20 dark:border-white/30 text-black dark:text-white text-lg font-semibold rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-950 hover:border-blue-500/50 dark:hover:border-blue-500/50 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  <svg className="w-6 h-6 group-hover:rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  {cta}
                </Link>
              </motion.div>
              
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Datenbankzugriff ohne Anmeldung
              </motion.p>
            </div>
          </div>
        </section>

        {/* How It Works - Tech-Focused & Modern */}
        <section className="relative py-20 sm:py-32 px-4 sm:px-6 lg:px-8 bg-white dark:bg-black">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.4 }}
              className="text-center mb-12 sm:mb-20"
            >
              <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-black text-black dark:text-white mb-4 tracking-tight">
                Funktionsweise
              </h2>
              <p className="text-base sm:text-lg text-slate-700 dark:text-slate-300 max-w-2xl mx-auto px-4">
                Systematische Diagnose-Abfrage in der Datenbank
              </p>
            </motion.div>
            
            {/* Tech-Focused Step Cards */}
            <div className="space-y-6 sm:space-y-0 sm:grid sm:grid-cols-3 sm:gap-6 lg:gap-8 max-w-6xl mx-auto">
              {howItWorks.map((step, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                  className="relative group cursor-pointer"
                  onClick={() => setActiveStep(activeStep === i ? null : i)}
                  onMouseEnter={() => setActiveStep(i)}
                  onMouseLeave={() => setActiveStep(null)}
                >
                  <div className={`relative h-full p-6 sm:p-8 bg-white dark:bg-black backdrop-blur-xl rounded-2xl sm:rounded-3xl border transition-all duration-500 overflow-hidden ${
                    activeStep === i 
                      ? 'border-blue-500 dark:border-blue-500 shadow-2xl scale-[1.02] sm:scale-105' 
                      : 'border-black/10 dark:border-white/20 hover:border-blue-500/50 dark:hover:border-blue-500/50 shadow-lg hover:shadow-xl'
                  }`}>
                    {/* Animated gradient overlay */}
                    <div className={`absolute inset-0 bg-gradient-to-br transition-all duration-500 ${
                      activeStep === i
                        ? 'from-blue-50/60 via-slate-50/40 to-blue-50/60 dark:from-blue-900/25 dark:via-slate-900/15 dark:to-blue-900/25'
                        : 'from-blue-50/0 via-slate-50/0 to-blue-50/0 dark:from-blue-900/0 dark:via-slate-900/0 dark:to-blue-900/0 group-hover:from-blue-50/30 group-hover:via-slate-50/20 group-hover:to-blue-50/30 dark:group-hover:from-blue-900/10 dark:group-hover:via-slate-900/8 dark:group-hover:to-blue-900/10'
                    }`}></div>
                    
                    {/* Tech connecting line (desktop only) */}
                    {i < howItWorks.length - 1 && (
                      <div className="hidden sm:block absolute top-1/2 -right-4 lg:-right-6 -translate-y-1/2 w-8 lg:w-12 z-0">
                        <div className="h-0.5 bg-gradient-to-r from-blue-300/40 via-blue-400/60 to-transparent dark:from-blue-700/40 dark:via-blue-600/60"></div>
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-blue-600 rounded-full"></div>
                      </div>
                    )}
                    
                    <div className="relative">
                      {/* Tech Icon */}
                      <div className={`mb-5 sm:mb-6 w-14 h-14 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all duration-500 ${
                        activeStep === i 
                          ? 'bg-gradient-to-br from-blue-600 to-blue-700 dark:from-blue-500 dark:to-blue-600 scale-110 rotate-6' 
                          : 'bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 group-hover:scale-105 group-hover:rotate-3'
                      }`}>
                        {step.icon === 'code' ? (
                          <svg className={`w-7 h-7 sm:w-8 sm:h-8 ${activeStep === i ? 'text-white' : 'text-slate-600 dark:text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                          </svg>
                        ) : step.icon === 'ai' ? (
                          <svg className={`w-7 h-7 sm:w-8 sm:h-8 ${activeStep === i ? 'text-white' : 'text-slate-600 dark:text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                          </svg>
                        ) : (
                          <svg className={`w-7 h-7 sm:w-8 sm:h-8 ${activeStep === i ? 'text-white' : 'text-slate-600 dark:text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        )}
                      </div>
                      
                      <h3 className={`text-xl sm:text-2xl font-bold mb-3 sm:mb-4 transition-colors duration-300 ${
                        activeStep === i 
                          ? 'text-blue-600 dark:text-blue-400' 
                          : 'text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400'
                      }`}>
                        {step.title}
                      </h3>
                      <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                        {step.desc}
                      </p>
                      
                      {/* Tech badge */}
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100/80 dark:bg-slate-700/80 rounded-lg border border-slate-200/60 dark:border-white/5 group-hover:border-blue-300/60 dark:group-hover:border-blue-600/40 transition-colors">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                        <span className="text-xs font-mono text-slate-600 dark:text-slate-400">
                          {step.tech}
                        </span>
                      </div>
                      
                      {/* Expandable details */}
                      <AnimatePresence>
                        {activeStep === i && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="mt-4 pt-4 border-t border-slate-200/40 dark:border-white/5 overflow-hidden"
                          >
                            <p className="text-xs font-mono text-slate-500 dark:text-slate-400">
                              → Diagnose-Abfrage starten
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Interactive Benefits Section - Tech Enhanced */}
        <section className="relative py-20 sm:py-32 px-4 sm:px-6 lg:px-8 bg-white dark:bg-black">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.4 }}
              className="text-center mb-12 sm:mb-20"
            >
              <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-black text-black dark:text-white mb-4 tracking-tight">
                Technische Eigenschaften
              </h2>
              <p className="text-base sm:text-lg text-slate-700 dark:text-slate-300 max-w-2xl mx-auto px-4">
                Strukturierte Diagnose-Datenbank für professionelle Anwendung
              </p>
            </motion.div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {[
                {
                  icon: '⚡',
                  title: 'Schnelle Abfrage',
                  desc: 'Datenbankabfrage in Sekunden',
                  tech: '< 2.3s'
                },
                {
                  icon: '🎯',
                  title: 'Präzise Diagnosen',
                  desc: 'Strukturierte Ursachenanalysen',
                  tech: '99.8%'
                },
                {
                  icon: '🔒',
                  title: 'Technisch fundiert',
                  desc: 'Strukturierte Dokumentation',
                  tech: 'OEM'
                },
                {
                  icon: '💼',
                  title: 'Professionelle Anwendung',
                  desc: 'Für Werkstätten und Diagnostiker',
                  tech: 'ISO'
                }
              ].map((benefit, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                  className="group"
                >
                  <div className="relative p-6 sm:p-8 bg-white dark:bg-black backdrop-blur-xl rounded-2xl sm:rounded-3xl border border-black/10 dark:border-white/20 hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-xl transition-all duration-300 text-center overflow-hidden">
                    {/* Tech gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-50/0 to-slate-50/0 dark:from-blue-900/0 dark:to-slate-900/0 group-hover:from-blue-50/30 group-hover:to-slate-50/20 dark:group-hover:from-blue-900/10 dark:group-hover:to-slate-900/8 transition-all duration-500"></div>
                    
                    <div className="relative">
                      <div className="text-4xl sm:text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">
                        {benefit.icon}
                      </div>
                      <h3 className="text-lg sm:text-xl font-bold text-black dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {benefit.title}
                      </h3>
                      <p className="text-sm sm:text-base text-slate-700 dark:text-slate-300 mb-3">
                        {benefit.desc}
                      </p>
                      {/* Tech metric badge */}
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 dark:bg-slate-900 rounded-md border border-black/10 dark:border-white/20">
                        <span className="text-xs font-mono font-bold text-black dark:text-white">
                          {benefit.tech}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Stats Section - Professional & Premium */}
        <section className="relative py-20 sm:py-32 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white via-slate-50/30 to-white dark:from-black dark:via-slate-950/30 dark:to-black">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
              {stats.map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                  className="relative text-center group"
                >
                  <div className="relative p-8 sm:p-10 bg-white/90 dark:bg-black/90 backdrop-blur-xl rounded-2xl sm:rounded-3xl border-2 border-black/10 dark:border-white/20 hover:border-blue-500/50 dark:hover:border-blue-500/50 hover:shadow-2xl transition-all duration-300 overflow-hidden group-hover:scale-105">
                    {/* Professional gradient overlay */}
                    <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${
                      i === 0 ? 'bg-gradient-to-br from-blue-50/80 via-slate-50/60 to-blue-50/80 dark:from-blue-900/30 dark:via-slate-900/20 dark:to-blue-900/30' : 
                      i === 1 ? 'bg-gradient-to-br from-slate-50/80 via-blue-50/60 to-slate-50/80 dark:from-slate-900/30 dark:via-blue-900/20 dark:to-slate-900/30' : 
                      i === 2 ? 'bg-gradient-to-br from-amber-50/80 via-yellow-50/60 to-amber-50/80 dark:from-amber-900/30 dark:via-yellow-900/20 dark:to-amber-900/30' :
                      'bg-gradient-to-br from-slate-50/80 via-gray-50/60 to-slate-50/80 dark:from-slate-900/30 dark:via-gray-900/20 dark:to-slate-900/30'
                    }`}></div>
                    
                    {/* Subtle shine effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl sm:rounded-3xl"></div>
                    
                    <div className="relative">
                      <div className={`text-5xl sm:text-6xl lg:text-7xl font-black mb-4 sm:mb-5 transition-all duration-500 group-hover:scale-110 bg-gradient-to-br bg-clip-text ${
                        i === 0 ? 'text-transparent bg-gradient-to-br from-blue-600 to-blue-700 dark:from-blue-400 dark:to-blue-500' : 
                        i === 1 ? 'text-transparent bg-gradient-to-br from-slate-600 to-slate-700 dark:from-slate-400 dark:to-slate-500' : 
                        i === 2 ? 'text-transparent bg-gradient-to-br from-amber-600 to-amber-700 dark:from-amber-400 dark:to-amber-500' :
                        'text-transparent bg-gradient-to-br from-slate-600 to-slate-700 dark:from-slate-400 dark:to-slate-500'
                      }`}>
                        {stat.number}
                      </div>
                      <div className="text-black dark:text-white font-bold text-lg sm:text-xl mb-2 sm:mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{stat.label}</div>
                      <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base leading-relaxed">{stat.desc}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section - Enhanced */}
        <section className="relative py-20 sm:py-32 px-4 sm:px-6 lg:px-8 bg-white dark:bg-black">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.4 }}
              className="text-center mb-12 sm:mb-20"
            >
              <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-black text-black dark:text-white mb-4 tracking-tight">
                Technische Diagnose-Datenbank
              </h2>
              <p className="text-base sm:text-lg text-slate-700 dark:text-slate-300 max-w-2xl mx-auto px-4">
                Die Vorteile, die Sie von anderen Lösungen unterscheiden
              </p>
            </motion.div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-10">
              {features.map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                  className="relative group"
                >
                  <div className="relative h-full p-6 sm:p-8 lg:p-10 bg-white dark:bg-black backdrop-blur-xl rounded-2xl sm:rounded-3xl border border-black/10 dark:border-white/20 hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-2xl transition-all duration-300 overflow-hidden">
                    {/* Gradient overlay */}
                    <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${
                      i === 0 ? 'bg-gradient-to-br from-blue-50/50 via-transparent to-transparent dark:from-blue-900/20' : 
                      i === 1 ? 'bg-gradient-to-br from-slate-50/50 via-transparent to-transparent dark:from-slate-900/20' : 
                      'bg-gradient-to-br from-blue-50/50 via-transparent to-transparent dark:from-blue-900/20'
                    }`}></div>
                    
                    <div className="relative">
                      <div className="flex items-start gap-4 sm:gap-5 mb-4 sm:mb-6">
                        <div className={`w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 flex-shrink-0 ${
                          i === 0 ? 'bg-gradient-to-br from-blue-100 via-blue-200 to-blue-300 dark:from-blue-900/40 dark:via-blue-800/40 dark:to-blue-700/40' : 
                          i === 1 ? 'bg-gradient-to-br from-slate-100 via-slate-200 to-slate-300 dark:from-slate-900/40 dark:via-slate-800/40 dark:to-slate-700/40' : 
                          'bg-gradient-to-br from-blue-100 via-blue-200 to-blue-300 dark:from-blue-900/40 dark:via-blue-800/40 dark:to-blue-700/40'
                        }`}>
                          <svg className={`w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 ${
                            i === 0 ? 'text-blue-600 dark:text-blue-400' : 
                            i === 1 ? 'text-slate-600 dark:text-slate-400' : 
                            'text-blue-600 dark:text-blue-400'
                          }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            {feature.icon === 'check' ? (
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            ) : feature.icon === 'lightning' ? (
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            ) : (
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            )}
                          </svg>
                        </div>
                        <h3 className="text-xl sm:text-2xl font-bold text-black dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300 pt-1 sm:pt-2">
                          {feature.title}
                        </h3>
                      </div>
                      <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-sm sm:text-base">
                        {feature.desc}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Reviews Carousel - Tech & Professional */}
        <section className="relative py-20 sm:py-32 px-4 sm:px-6 lg:px-8 bg-white dark:bg-black">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.4 }}
              className="text-center mb-12 sm:mb-16"
            >
              <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-black text-black dark:text-white mb-4 tracking-tight">
                Was unsere Nutzer sagen
              </h2>
              <p className="text-base sm:text-lg text-slate-700 dark:text-slate-300 max-w-2xl mx-auto px-4">
                Bewertungen von Werkstätten, Technikern und Fahrzeughaltern
              </p>
            </motion.div>

            <ReviewsCarousel reviews={reviews} />
            
            {/* Reviews Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.4, delay: 0.15 }}
              className="text-center mt-12"
            >
              <Link
                href="/reviews"
                className="inline-flex items-center gap-3 px-8 py-4 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border-2 border-slate-300/60 dark:border-white/10 text-slate-900 dark:text-white text-lg font-bold rounded-2xl hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-xl transition-all duration-200 group"
              >
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
                Alle Bewertungen anzeigen
              </Link>
            </motion.div>
          </div>
        </section>
      </main>
    </div>
  );
}
