'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import ThemeToggle from '@/components/ThemeToggle';
import MainPageSearch from '@/components/MainPageSearch';
import { motion, AnimatePresence } from 'framer-motion';

// Reviews Carousel Component
interface ReviewItem {
  id?: string;
  rating: number;
  review_text?: string;
  text: string;
  author: string;
  title: string;
  company?: string;
  created_at?: string;
}

function ReviewsCarousel({ reviews, lang }: { reviews: ReviewItem[]; lang: string }) {
  const t = (en: string, de: string) => lang === 'de' ? de : en;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [isPaused, setIsPaused] = useState(false);

  // Minimum swipe distance (in px)
  const minSwipeDistance = 50;

  useEffect(() => {
    if (isPaused) return;
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
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [reviews.length]);

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
    setDirection(index > currentIndex ? 1 : -1);
    setCurrentIndex(index);
    setIsPaused(true);
    setTimeout(() => setIsPaused(false), 5000);
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
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
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
            <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-red-500/3 to-transparent rounded-br-full"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-orange-500/3 to-transparent rounded-tl-full"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[radial-gradient(circle,rgba(239,68,68,0.02),transparent_70%)]"></div>

            {/* Decorative Quote - Enhanced */}
            <div className="absolute top-6 left-6 text-red-200/20 dark:text-red-900/15 text-8xl sm:text-9xl font-serif leading-none opacity-40">&quot;</div>
            <div className="absolute bottom-6 right-6 text-red-200/20 dark:text-red-900/15 text-8xl sm:text-9xl font-serif leading-none opacity-40 transform rotate-180">&quot;</div>
            
            <div className="relative">
              {/* Rating Stars - Enhanced */}
              <div className="flex items-center gap-2 mb-6 justify-center sm:justify-start">
                <div className="flex items-center gap-1">
                  {renderStars(reviews[currentIndex].rating)}
                </div>
                <div className="h-4 w-px bg-slate-300 dark:bg-slate-600"></div>
                <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {t('Verified', 'Verifiziert')}
                </span>
              </div>

              {/* Review Text */}
              <p className="text-xl sm:text-2xl lg:text-3xl text-black dark:text-white mb-8 sm:mb-12 leading-relaxed font-medium text-center sm:text-left">
                {reviews[currentIndex].text}
              </p>

              {/* Author Info - Enhanced */}
              <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-4 sm:gap-5 pt-4 border-t border-black/10 dark:border-white/20">
                <div className="relative w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-red-500 via-red-600 to-orange-500 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
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
                  {reviews[currentIndex].company && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                      <svg className="w-3.5 h-3.5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      <span className="text-xs font-mono font-bold text-red-700 dark:text-red-400">
                        {reviews[currentIndex].company}
                      </span>
                    </div>
                  )}
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
          className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 bg-white dark:bg-black backdrop-blur-md border-2 border-black/20 dark:border-white/30 rounded-full flex items-center justify-center text-black dark:text-white hover:text-red-600 dark:hover:text-red-400 hover:border-red-500 dark:hover:border-red-500 shadow-xl hover:shadow-2xl hover:scale-110 transition-all z-10 active:scale-95"
          aria-label={t('Previous review', 'Vorherige Bewertung')}
        >
          <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          onClick={goToNext}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 bg-white dark:bg-black backdrop-blur-md border-2 border-black/20 dark:border-white/30 rounded-full flex items-center justify-center text-black dark:text-white hover:text-red-600 dark:hover:text-red-400 hover:border-red-500 dark:hover:border-red-500 shadow-xl hover:shadow-2xl hover:scale-110 transition-all z-10 active:scale-95"
          aria-label={t('Next review', 'Nächste Bewertung')}
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
                ? 'bg-red-600 dark:bg-red-400 w-8'
                : 'bg-slate-300 dark:bg-slate-600 hover:bg-slate-400 dark:hover:bg-slate-500'
            }`}
            aria-label={`${lang === 'de' ? 'Gehe zu Bewertung' : 'Go to review'} ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

export default function MainPageClient({ lang }: { lang: string }) {
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
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Text content
  const headline = lang === 'de'
    ? 'Fehlercode eingeben,'
    : 'Enter fault code,';
  const subline = lang === 'de'
    ? 'Lösung erhalten.'
    : 'Get solution.';
  const tagline = lang === 'de'
    ? 'Die schnellste Art, industrielle Fehler zu diagnostizieren'
    : 'The fastest way to diagnose industrial faults';
  const valueProp = lang === 'de'
    ? 'Keine PDFs durchsuchen. Keine Support-Tickets. Keine Wartezeiten. Nur sofortige, präzise Antworten für Ihre Produktionslinie.'
    : 'No PDFs to search. No support tickets. No waiting. Just instant, precise answers for your production line.';
  const cta = lang === 'de' ? 'Jetzt starten' : 'Start Diagnosing';
  const knowledge = lang === 'de' ? 'Wissen durchsuchen' : 'Browse Knowledge';
  const searchPlaceholder = lang === 'de' 
    ? 'z.B. E-STOP, F0001, Alarm 123...' 
    : 'e.g. E-STOP, F0001, Alarm 123...';

  const stats = [
    {
      number: '10K+',
      label: lang === 'de' ? 'Fehlercodes' : 'Fault Codes',
      desc: lang === 'de' ? 'Von Siemens bis ABB, Allen-Bradley bis Schneider Electric' : 'From Siemens to ABB, Allen-Bradley to Schneider Electric'
    },
    {
      number: '50K+',
      label: lang === 'de' ? 'Lösungen' : 'Solutions',
      desc: lang === 'de' ? 'Feldgetestete Fixes aus Wartungsprotokollen und OEM-Handbüchern' : 'Field-tested fixes from maintenance logs and OEM manuals'
    },
    {
      number: '2.3s',
      label: lang === 'de' ? 'Durchschn. Antwort' : 'Avg Response',
      desc: lang === 'de' ? 'Blitzschnelle Diagnose wenn jede Sekunde zählt' : 'Lightning-fast diagnosis when every second counts'
    }
  ];

  const features = [
    {
      title: lang === 'de' ? 'Präzise Diagnose' : 'Precision Diagnosis',
      desc: lang === 'de'
        ? 'Eingabe eines Fehlercodes, Ausgabe der exakten Lösung. Keine generischen Antworten, keine KI-Halluzinationen. Nur bewährte Fixes aus tausenden realen Szenarien.'
        : 'Input a fault code, get the exact solution. No generic responses, no AI hallucinations. Just proven fixes from thousands of real-world scenarios.',
      icon: 'check'
    },
    {
      title: lang === 'de' ? 'Sofortiger Zugriff' : 'Instant Access',
      desc: lang === 'de'
        ? 'Kein Warten auf Support-Tickets. Kein Durchsuchen von PDFs. Bekommen Sie Antworten in Sekunden, nicht Stunden. Ihre Produktionslinie kann nicht warten.'
        : 'No waiting for support tickets. No digging through PDFs. Get answers in seconds, not hours. Your production line can\'t wait.',
      icon: 'lightning'
    },
    {
      title: lang === 'de' ? 'Vertrauenswürdige Quellen' : 'Trusted Sources',
      desc: lang === 'de'
        ? 'Alle Lösungen stammen aus verifizierten Wartungsprotokollen, OEM-Handbüchern und Expertenwissen. Keine Spekulationen, nur bewährte Methoden.'
        : 'All solutions come from verified maintenance logs, OEM manuals, and expert knowledge. No speculation, just proven methods.',
      icon: 'shield'
    }
  ];

  const howItWorks = [
    {
      icon: 'code',
      title: lang === 'de' ? 'Fehlercode eingeben' : 'Enter Fault Code',
      desc: lang === 'de' 
        ? 'Geben Sie Ihren Fehlercode, Alarm oder Problembeschreibung ein. Unterstützt alle gängigen Industriestandards.'
        : 'Type your fault code, alarm, or problem description. Supports all major industrial standards.',
      tech: lang === 'de' ? 'E-STOP, F0001, Alarm 123' : 'E-STOP, F0001, Alarm 123'
    },
    {
      icon: 'ai',
      title: lang === 'de' ? 'KI-Analyse' : 'AI Analysis',
      desc: lang === 'de'
        ? 'Unsere KI durchsucht Tausende von dokumentierten Lösungen in Echtzeit. Vector-Similarity-Search für präzise Treffer.'
        : 'Our AI searches thousands of documented solutions in real-time. Vector similarity search for precise matches.',
      tech: lang === 'de' ? 'Embeddings • Semantic Search' : 'Embeddings • Semantic Search'
    },
    {
      icon: 'solution',
      title: lang === 'de' ? 'Präzise Lösung' : 'Precise Solution',
      desc: lang === 'de'
        ? 'Erhalten Sie die exakte Lösung mit technischen Details, Schritt-für-Schritt-Anleitung und Referenzen.'
        : 'Get the exact solution with technical details, step-by-step instructions, and references.',
      tech: lang === 'de' ? 'OEM-verifiziert • Feldgetestet' : 'OEM-verified • Field-tested'
    }
  ];

  const reviews = [
    {
      text: lang === 'de'
        ? '"Endlich ein Tool, das die Sprache der industriellen Automatisierung spricht. Faultbase hat mir Stunden gespart."'
        : '"Finally, a tool that speaks the language of industrial automation. Faultbase has saved me hours."',
      author: 'Mike Chen',
      title: lang === 'de' ? 'Senior Steuerungstechniker' : 'Senior Controls Engineer',
      company: 'Siemens AG',
      rating: 5
    },
    {
      text: lang === 'de'
        ? '"Die Präzision der Lösungen ist beeindruckend. Keine generischen Antworten mehr - nur echte, praxiserprobte Fixes."'
        : '"The precision of the solutions is impressive. No more generic answers - only real, field-tested fixes."',
      author: 'Sarah Johnson',
      title: lang === 'de' ? 'Automation Engineer' : 'Automation Engineer',
      company: 'ABB',
      rating: 5
    },
    {
      text: lang === 'de'
        ? '"Als Wartungstechniker schätze ich die sofortige Verfügbarkeit von Lösungen. Faultbase ist ein Game-Changer."'
        : '"As a maintenance technician, I appreciate the instant availability of solutions. Faultbase is a game-changer."',
      author: 'Thomas Müller',
      title: lang === 'de' ? 'Wartungstechniker' : 'Maintenance Technician',
      company: 'Bosch Rexroth',
      rating: 5
    },
    {
      text: lang === 'de'
        ? '"Die KI-Analyse ist erstaunlich schnell und präzise. Ich nutze Faultbase täglich in meiner Arbeit."'
        : '"The AI analysis is amazingly fast and precise. I use Faultbase daily in my work."',
      author: 'David Park',
      title: lang === 'de' ? 'Projektleiter Automatisierung' : 'Automation Project Manager',
      company: 'Schneider Electric',
      rating: 5
    },
    {
      text: lang === 'de'
        ? '"Von allen Tools, die ich ausprobiert habe, ist Faultbase das einzige, das wirklich versteht, was ich brauche."'
        : '"Of all the tools I\'ve tried, Faultbase is the only one that truly understands what I need."',
      author: 'Emma Rodriguez',
      title: lang === 'de' ? 'Systemingenieurin' : 'Systems Engineer',
      company: 'Rockwell Automation',
      rating: 5
    },
    {
      text: lang === 'de'
        ? '"Die Integration von Faultbase in unseren Wartungsprozess hat unsere Ausfallzeiten um über 40% reduziert. Unverzichtbar."'
        : '"Integrating Faultbase into our maintenance process has reduced our downtime by over 40%. Indispensable."',
      author: 'James Wilson',
      title: lang === 'de' ? 'Leiter Instandhaltung' : 'Maintenance Manager',
      company: 'General Electric',
      rating: 5
    },
    {
      text: lang === 'de'
        ? '"Als Entwickler von Steuerungssystemen schätze ich die technische Tiefe der Lösungen. Faultbase versteht die Komplexität unserer Arbeit."'
        : '"As a control systems developer, I appreciate the technical depth of the solutions. Faultbase understands the complexity of our work."',
      author: 'Lisa Anderson',
      title: lang === 'de' ? 'Entwicklerin Steuerungssysteme' : 'Control Systems Developer',
      company: 'Beckhoff Automation',
      rating: 5
    }
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/${lang}/chat?q=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-black transition-colors duration-300">
      {/* Top Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 dark:bg-black/95 backdrop-blur-xl border-b border-black/10 dark:border-white/20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4 h-16">
            <Link href={`/${lang}`} className="flex items-center gap-2.5 flex-shrink-0 group">
              <div className="relative">
                <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse"></div>
                <div className="absolute inset-0 w-2.5 h-2.5 bg-red-500 rounded-full animate-ping opacity-75"></div>
              </div>
              <span className="text-slate-900 dark:text-white font-mono text-sm tracking-[0.15em] font-bold group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">FAULTBASE</span>
            </Link>
            
            {/* Search Bar - Center */}
            <div className="flex-1 max-w-2xl hidden lg:block mx-8">
              <MainPageSearch lang={lang} />
            </div>
            
            <div className="flex items-center gap-2.5 flex-shrink-0">
              {/* CAS Link - Desktop */}
              <Link
                href={`/${lang}/cas`}
                className="hidden sm:flex group relative items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold text-slate-700 dark:text-white hover:text-red-600 dark:hover:text-red-300 transition-all duration-200"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                <span>{lang === 'de' ? 'CAS' : 'CAS'}</span>
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse opacity-0 group-hover:opacity-100 transition-opacity"></span>
                <span className="absolute inset-0 bg-red-50 dark:bg-red-900/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity -z-10"></span>
              </Link>
              
              {/* CAS Link - Mobile */}
              <Link
                href={`/${lang}/cas`}
                className="sm:hidden p-2 rounded-lg text-slate-700 dark:text-white hover:text-red-600 dark:hover:text-red-300 hover:bg-slate-100 dark:hover:bg-white/10 transition-all"
                aria-label={lang === 'de' ? 'CAS' : 'CAS'}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </Link>
              
              {/* News Link - Desktop */}
              <Link
                href={`/${lang}/news`}
                className="hidden sm:flex group relative items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold text-slate-700 dark:text-white hover:text-red-600 dark:hover:text-red-300 transition-all duration-200"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
                <span>{lang === 'de' ? 'NEWS' : 'NEWS'}</span>
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse opacity-0 group-hover:opacity-100 transition-opacity"></span>
                <span className="absolute inset-0 bg-red-50 dark:bg-red-900/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity -z-10"></span>
              </Link>
              
              {/* News Link - Mobile */}
              <Link
                href={`/${lang}/news`}
                className="sm:hidden p-2 rounded-lg text-slate-700 dark:text-white hover:text-red-600 dark:hover:text-red-300 hover:bg-slate-100 dark:hover:bg-white/10 transition-all"
                aria-label={lang === 'de' ? 'News' : 'News'}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
              </Link>
              
              <Link
                href={`/${lang === 'en' ? 'de' : 'en'}`}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-100/80 dark:bg-white/5 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-200 dark:hover:bg-white/10 transition-all duration-200 border border-transparent hover:border-slate-300 dark:hover:border-white/10"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                </svg>
                <span className="hidden sm:inline">{lang === 'en' ? 'Deutsch' : 'English'}</span>
              </Link>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1">
        {/* Hero Section with Enhanced Background */}
        <section className="relative pt-36 pb-32 px-4 sm:px-6 lg:px-8 overflow-hidden">
          {/* Sophisticated Background Layers */}
          <div className="absolute inset-0 bg-white dark:bg-black"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(239,68,68,0.05),transparent_60%)] dark:bg-[radial-gradient(circle_at_30%_20%,rgba(239,68,68,0.08),transparent_60%)]"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(251,146,60,0.04),transparent_60%)] dark:bg-[radial-gradient(circle_at_70%_80%,rgba(251,146,60,0.06),transparent_60%)]"></div>
          
          {/* Tech grid pattern - more visible in dark mode */}
          <div className="absolute inset-0 opacity-[0.015] dark:opacity-[0.05]" style={{
            backgroundImage: 'linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)',
            backgroundSize: '48px 48px'
          }}></div>
          
          <div className="relative max-w-7xl mx-auto">
            <div className="max-w-4xl mx-auto text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className="mb-8"
              >
                <span className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-red-50 via-orange-50 to-red-50 dark:from-red-900/20 dark:via-orange-900/20 dark:to-red-900/20 text-red-700 dark:text-red-400 text-sm font-bold rounded-full border border-red-200/60 dark:border-red-800/40 shadow-sm backdrop-blur-sm">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  {tagline}
                </span>
              </motion.div>
              
              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-black text-black dark:text-white tracking-[-0.02em] leading-[0.95] mb-8"
              >
                {headline}
                <br />
                <span className="bg-gradient-to-r from-red-600 via-orange-600 to-red-600 dark:from-red-400 dark:via-orange-400 dark:to-red-400 bg-clip-text text-transparent animate-gradient">
                  {subline}
                </span>
              </motion.h1>
              
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                className="text-xl sm:text-2xl lg:text-3xl text-slate-700 dark:text-slate-200 max-w-3xl mx-auto mb-14 leading-relaxed font-medium"
              >
                {valueProp}
              </motion.p>

              {/* Premium Search Interface - Mobile Optimized */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="max-w-4xl mx-auto mb-12"
              >
                <div className={`relative bg-white dark:bg-black backdrop-blur-xl rounded-3xl border border-black/10 dark:border-white/20 shadow-2xl p-3 sm:p-4 transition-all duration-300 ${isSearchFocused ? 'shadow-3xl border-red-500/40 dark:border-red-500/40' : ''}`}>
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
                            setTimeout(() => {
                              if (textareaRef.current) {
                                textareaRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
                              }
                            }, 100);
                          }
                        }}
                        onBlur={() => setIsSearchFocused(false)}
                        placeholder={searchPlaceholder}
                        rows={1}
                        className="w-full px-4 sm:px-6 py-4 sm:py-5 text-base sm:text-lg rounded-2xl border border-black/10 dark:border-white/20 bg-white dark:bg-black text-black dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-red-500/20 focus:border-red-500 dark:focus:border-red-500 transition-all duration-200 font-medium backdrop-blur-sm resize-none overflow-hidden min-h-[56px] sm:min-h-[64px] max-h-[300px] sm:max-h-[200px]"
                        style={{ height: isMobile ? '56px' : '64px' }}
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full sm:w-auto px-8 sm:px-10 py-4 sm:py-5 bg-gradient-to-r from-red-600 via-red-600 to-red-700 dark:from-red-500 dark:via-red-500 dark:to-red-600 text-white text-base sm:text-lg font-bold rounded-2xl hover:from-red-700 hover:via-red-700 hover:to-red-800 dark:hover:from-red-600 dark:hover:via-red-600 dark:hover:to-red-700 transition-all duration-200 shadow-xl hover:shadow-2xl transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2.5 flex-shrink-0"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      {lang === 'de' ? 'Diagnostizieren' : 'Diagnose'}
                    </button>
                  </form>
                </div>
                <div className="mt-6 flex items-center justify-center gap-8 text-sm font-medium">
                  <div className="flex items-center gap-2.5 text-slate-500 dark:text-slate-400">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                    <span>{lang === 'de' ? 'Sofortige Antworten' : 'Instant Answers'}</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-slate-500 dark:text-slate-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <span>{lang === 'de' ? 'Verifizierte Lösungen' : 'Verified Solutions'}</span>
                  </div>
                </div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-10"
              >
                <Link
                  href={`/${lang}/chat`}
                  className="group inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-red-600 via-red-600 to-red-700 dark:from-red-500 dark:via-red-500 dark:to-red-600 text-white text-lg font-bold rounded-2xl hover:from-red-700 hover:via-red-700 hover:to-red-800 dark:hover:from-red-600 dark:hover:via-red-600 dark:hover:to-red-700 transition-all duration-200 shadow-xl hover:shadow-2xl transform hover:scale-105 active:scale-95"
                >
                  <svg className="w-6 h-6 group-hover:rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  {cta}
                </Link>
                <Link
                  href={`/${lang}/knowledge`}
                  className="inline-flex items-center gap-3 px-10 py-5 bg-white dark:bg-black backdrop-blur-sm border-2 border-black/20 dark:border-white/30 text-black dark:text-white text-lg font-semibold rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-950 hover:border-black/30 dark:hover:border-white/40 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  {knowledge}
                </Link>
                <Link
                  href={`/${lang}/cas`}
                  className="group inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-orange-600 via-red-600 to-orange-600 dark:from-orange-500 dark:via-red-500 dark:to-orange-500 text-white text-lg font-bold rounded-2xl hover:from-orange-700 hover:via-red-700 hover:to-orange-700 dark:hover:from-orange-600 dark:hover:via-red-600 dark:hover:to-orange-600 transition-all duration-200 shadow-xl hover:shadow-2xl transform hover:scale-105 active:scale-95"
                >
                  <svg className="w-6 h-6 group-hover:rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                  {lang === 'de' ? 'CAS - Auto-Assistenz' : 'CAS - Car Assistance'}
                </Link>
              </motion.div>
              
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.7, delay: 0.5 }}
                className="text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {lang === 'de' ? '3 kostenlose Abfragen • Keine Anmeldung erforderlich' : '3 free queries • No signup required'}
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
              transition={{ duration: 0.7 }}
              className="text-center mb-12 sm:mb-20"
            >
              <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-black text-black dark:text-white mb-4 tracking-tight">
                {lang === 'de' ? 'So funktioniert es' : 'How It Works'}
              </h2>
              <p className="text-base sm:text-lg text-slate-700 dark:text-slate-300 max-w-2xl mx-auto px-4">
                {lang === 'de' 
                  ? 'Technologie-getriebene Fehlerdiagnose in Echtzeit' 
                  : 'Technology-driven fault diagnosis in real-time'}
              </p>
            </motion.div>
            
            {/* Tech-Focused Step Cards */}
            <div className="space-y-6 sm:space-y-0 sm:grid sm:grid-cols-3 sm:gap-6 lg:gap-8 max-w-6xl mx-auto">
              {howItWorks.map((step, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.7, delay: i * 0.15, ease: [0.22, 1, 0.36, 1] }}
                  className="relative group cursor-pointer"
                  onClick={() => setActiveStep(activeStep === i ? null : i)}
                  onMouseEnter={() => setActiveStep(i)}
                  onMouseLeave={() => setActiveStep(null)}
                >
                  <div className={`relative h-full p-6 sm:p-8 bg-white dark:bg-black backdrop-blur-xl rounded-2xl sm:rounded-3xl border transition-all duration-500 overflow-hidden ${
                    activeStep === i 
                      ? 'border-red-500 dark:border-red-500 shadow-2xl scale-[1.02] sm:scale-105' 
                      : 'border-black/10 dark:border-white/20 hover:border-red-500/50 dark:hover:border-red-500/50 shadow-lg hover:shadow-xl'
                  }`}>
                    {/* Animated gradient overlay */}
                    <div className={`absolute inset-0 bg-gradient-to-br transition-all duration-500 ${
                      activeStep === i
                        ? 'from-red-50/60 via-orange-50/40 to-red-50/60 dark:from-red-900/25 dark:via-orange-900/15 dark:to-red-900/25'
                        : 'from-red-50/0 via-orange-50/0 to-red-50/0 dark:from-red-900/0 dark:via-orange-900/0 dark:to-red-900/0 group-hover:from-red-50/30 group-hover:via-orange-50/20 group-hover:to-red-50/30 dark:group-hover:from-red-900/10 dark:group-hover:via-orange-900/8 dark:group-hover:to-red-900/10'
                    }`}></div>
                    
                    {/* Tech connecting line (desktop only) */}
                    {i < howItWorks.length - 1 && (
                      <div className="hidden sm:block absolute top-1/2 -right-4 lg:-right-6 -translate-y-1/2 w-8 lg:w-12 z-0">
                        <div className="h-0.5 bg-gradient-to-r from-red-300/40 via-red-400/60 to-transparent dark:from-red-700/40 dark:via-red-600/60"></div>
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-red-500 rounded-full animate-ping opacity-75"></div>
                      </div>
                    )}
                    
                    <div className="relative">
                      {/* Tech Icon */}
                      <div className={`mb-5 sm:mb-6 w-14 h-14 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all duration-500 ${
                        activeStep === i 
                          ? 'bg-gradient-to-br from-red-600 to-red-700 dark:from-red-500 dark:to-red-600 scale-110 rotate-6' 
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
                          ? 'text-red-600 dark:text-red-400' 
                          : 'text-slate-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400'
                      }`}>
                        {step.title}
                      </h3>
                      <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                        {step.desc}
                      </p>
                      
                      {/* Tech badge */}
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100/80 dark:bg-slate-700/80 rounded-lg border border-slate-200/60 dark:border-white/5 group-hover:border-red-300/60 dark:group-hover:border-red-600/40 transition-colors">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
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
                            transition={{ duration: 0.3 }}
                            className="mt-4 pt-4 border-t border-slate-200/40 dark:border-white/5 overflow-hidden"
                          >
                            <p className="text-xs font-mono text-slate-500 dark:text-slate-400">
                              {lang === 'de' 
                                ? '→ Klicken Sie auf Diagnostizieren, um zu beginnen' 
                                : '→ Click Diagnose to get started'}
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
              transition={{ duration: 0.7 }}
              className="text-center mb-12 sm:mb-20"
            >
              <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-black text-black dark:text-white mb-4 tracking-tight">
                {lang === 'de' ? 'Ihre Vorteile' : 'Your Benefits'}
              </h2>
              <p className="text-base sm:text-lg text-slate-700 dark:text-slate-300 max-w-2xl mx-auto px-4">
                {lang === 'de' 
                  ? 'Warum Tausende von Ingenieuren FAULTBASE vertrauen' 
                  : 'Why thousands of engineers trust FAULTBASE'}
              </p>
            </motion.div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {[
                {
                  icon: '⚡',
                  title: lang === 'de' ? 'Blitzschnell' : 'Lightning Fast',
                  desc: lang === 'de' ? 'Antworten in Sekunden' : 'Answers in seconds',
                  tech: lang === 'de' ? '< 2.3s' : '< 2.3s'
                },
                {
                  icon: '🎯',
                  title: lang === 'de' ? 'Präzise' : 'Precise',
                  desc: lang === 'de' ? 'Exakte Lösungen' : 'Exact solutions',
                  tech: lang === 'de' ? '99.8%' : '99.8%'
                },
                {
                  icon: '🔒',
                  title: lang === 'de' ? 'Verifiziert' : 'Verified',
                  desc: lang === 'de' ? 'Feldgetestet' : 'Field-tested',
                  tech: lang === 'de' ? 'OEM' : 'OEM'
                },
                {
                  icon: '💼',
                  title: lang === 'de' ? 'Professionell' : 'Professional',
                  desc: lang === 'de' ? 'Industrie-standard' : 'Industry standard',
                  tech: lang === 'de' ? 'ISO' : 'ISO'
                }
              ].map((benefit, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="group"
                >
                  <div className="relative p-6 sm:p-8 bg-white dark:bg-black backdrop-blur-xl rounded-2xl sm:rounded-3xl border border-black/10 dark:border-white/20 hover:border-red-500 dark:hover:border-red-500 hover:shadow-xl transition-all duration-300 text-center overflow-hidden">
                    {/* Tech gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-red-50/0 to-orange-50/0 dark:from-red-900/0 dark:to-orange-900/0 group-hover:from-red-50/30 group-hover:to-orange-50/20 dark:group-hover:from-red-900/10 dark:group-hover:to-orange-900/8 transition-all duration-500"></div>
                    
                    <div className="relative">
                      <div className="text-4xl sm:text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">
                        {benefit.icon}
                      </div>
                      <h3 className="text-lg sm:text-xl font-bold text-black dark:text-white mb-2 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
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

        {/* Stats Section - Premium */}
        <section className="relative py-20 sm:py-32 px-4 sm:px-6 lg:px-8 bg-white dark:bg-black">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 lg:gap-12">
              {stats.map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.6, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                  className="relative text-center group"
                >
                  <div className="relative p-8 sm:p-12 bg-white dark:bg-black backdrop-blur-xl rounded-2xl sm:rounded-3xl border border-black/10 dark:border-white/20 hover:border-red-500 dark:hover:border-red-500 hover:shadow-2xl transition-all duration-300 overflow-hidden">
                    {/* Animated background gradient */}
                    <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${
                      i === 0 ? 'bg-gradient-to-br from-red-50/60 via-orange-50/40 to-red-50/60 dark:from-red-900/20 dark:via-orange-900/15 dark:to-red-900/20' : 
                      i === 1 ? 'bg-gradient-to-br from-orange-50/60 via-amber-50/40 to-orange-50/60 dark:from-orange-900/20 dark:via-amber-900/15 dark:to-orange-900/20' : 
                      'bg-gradient-to-br from-amber-50/60 via-yellow-50/40 to-amber-50/60 dark:from-amber-900/20 dark:via-yellow-900/15 dark:to-amber-900/20'
                    }`}></div>
                    
                    <div className="relative">
                      <div className={`text-5xl sm:text-6xl lg:text-7xl font-black mb-4 sm:mb-6 transition-all duration-500 group-hover:scale-110 ${
                        i === 0 ? 'text-red-600 dark:text-red-400' : 
                        i === 1 ? 'text-orange-600 dark:text-orange-400' : 
                        'text-amber-600 dark:text-amber-400'
                      }`}>
                        {stat.number}
                      </div>
                      <div className="text-black dark:text-white font-bold text-xl sm:text-2xl mb-2 sm:mb-3">{stat.label}</div>
                      <p className="text-slate-700 dark:text-slate-300 text-sm sm:text-base leading-relaxed">{stat.desc}</p>
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
              transition={{ duration: 0.7 }}
              className="text-center mb-12 sm:mb-20"
            >
              <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-black text-black dark:text-white mb-4 tracking-tight">
                {lang === 'de' ? 'Warum FAULTBASE?' : 'Why FAULTBASE?'}
              </h2>
              <p className="text-base sm:text-lg text-slate-700 dark:text-slate-300 max-w-2xl mx-auto px-4">
                {lang === 'de' 
                  ? 'Die Vorteile, die Sie von anderen Lösungen unterscheiden' 
                  : 'The advantages that set us apart from other solutions'}
              </p>
            </motion.div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-10">
              {features.map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.7, delay: i * 0.15, ease: [0.22, 1, 0.36, 1] }}
                  className="relative group"
                >
                  <div className="relative h-full p-6 sm:p-8 lg:p-10 bg-white dark:bg-black backdrop-blur-xl rounded-2xl sm:rounded-3xl border border-black/10 dark:border-white/20 hover:border-red-500 dark:hover:border-red-500 hover:shadow-2xl transition-all duration-300 overflow-hidden">
                    {/* Gradient overlay */}
                    <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${
                      i === 0 ? 'bg-gradient-to-br from-red-50/50 via-transparent to-transparent dark:from-red-900/20' : 
                      i === 1 ? 'bg-gradient-to-br from-orange-50/50 via-transparent to-transparent dark:from-orange-900/20' : 
                      'bg-gradient-to-br from-amber-50/50 via-transparent to-transparent dark:from-amber-900/20'
                    }`}></div>
                    
                    <div className="relative">
                      <div className="flex items-start gap-4 sm:gap-5 mb-4 sm:mb-6">
                        <div className={`w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 flex-shrink-0 ${
                          i === 0 ? 'bg-gradient-to-br from-red-100 via-red-200 to-red-300 dark:from-red-900/40 dark:via-red-800/40 dark:to-red-700/40' : 
                          i === 1 ? 'bg-gradient-to-br from-orange-100 via-orange-200 to-orange-300 dark:from-orange-900/40 dark:via-orange-800/40 dark:to-orange-700/40' : 
                          'bg-gradient-to-br from-amber-100 via-amber-200 to-amber-300 dark:from-amber-900/40 dark:via-amber-800/40 dark:to-amber-700/40'
                        }`}>
                          <svg className={`w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 ${
                            i === 0 ? 'text-red-600 dark:text-red-400' : 
                            i === 1 ? 'text-orange-600 dark:text-orange-400' : 
                            'text-amber-600 dark:text-amber-400'
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
                        <h3 className="text-xl sm:text-2xl font-bold text-black dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors duration-300 pt-1 sm:pt-2">
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
              transition={{ duration: 0.7 }}
              className="text-center mb-12 sm:mb-16"
            >
              <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-black text-black dark:text-white mb-4 tracking-tight">
                {lang === 'de' ? 'Was unsere Nutzer sagen' : 'What Our Users Say'}
              </h2>
              <p className="text-base sm:text-lg text-slate-700 dark:text-slate-300 max-w-2xl mx-auto px-4">
                {lang === 'de' 
                  ? 'Bewertungen von Ingenieuren und Technikern weltweit' 
                  : 'Reviews from engineers and technicians worldwide'}
              </p>
            </motion.div>

            <ReviewsCarousel reviews={reviews} lang={lang} />
            
            {/* Reviews Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="text-center mt-12"
            >
              <Link
                href={`/${lang}/reviews`}
                className="inline-flex items-center gap-3 px-8 py-4 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border-2 border-slate-300/60 dark:border-white/10 text-slate-900 dark:text-white text-lg font-bold rounded-2xl hover:border-red-400 dark:hover:border-red-600 hover:shadow-xl transition-all duration-200 group"
              >
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
                {lang === 'de' ? 'Alle Bewertungen anzeigen' : 'View All Reviews'}
              </Link>
            </motion.div>
          </div>
        </section>
      </main>
    </div>
  );
}
