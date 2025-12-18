'use client';

import Link from 'next/link';
import { useParams, usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { createBrowserClient } from '@supabase/ssr';
import ThemeToggle from './ThemeToggle';

export default function Header() {
  const pathname = usePathname();
  const isChatPage = pathname?.startsWith('/chat');
  const isNewsPage = pathname?.startsWith('/news');
  const isContactPage = pathname?.startsWith('/contact');
  const isPrivacyPage = pathname?.startsWith('/privacy');
  const isImpressumPage = pathname?.startsWith('/impressum');
  const isProfilePage = pathname?.startsWith('/profile');
  const isCarsPage = pathname?.startsWith('/cars');
  const isSignupPage = pathname?.startsWith('/signup');
  const isLoginPage = pathname?.startsWith('/login');
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      // Disable Realtime to prevent warnings and reduce bundle size
      realtime: {
        params: {
          eventsPerSecond: 0,
        },
      },
    }
  );

  useEffect(() => {
    if (!menuOpen) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [menuOpen]);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
      } catch {
        setUser(null);
      }
    };
    fetchUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const isReviewsPage = pathname?.startsWith('/reviews');
  
  // Show header on all pages
  // Always show header - removed conditional rendering

  const isHomePage = pathname === '/';

  return (
    <motion.header
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={`w-full backdrop-blur-md border-b transition-all duration-300 ${
        isHomePage 
          ? 'bg-white/80 dark:bg-black/80 border-slate-200/50 dark:border-white/10 shadow-sm' 
          : 'bg-white dark:bg-black border-black/10 dark:border-white/20 shadow-sm'
      } sticky top-0 z-50`}
      role="banner"
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 flex items-center justify-between gap-2 sm:gap-4 h-12 sm:h-14 md:h-16 relative">
        {/* Mobile Menu Button - Left side on mobile */}
        <button
          aria-label="Menü öffnen"
          className={`md:hidden p-1.5 sm:p-2 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-all duration-200 min-h-[36px] min-w-[36px] sm:min-h-[44px] sm:min-w-[44px] flex items-center justify-center flex-shrink-0 ${
            menuOpen 
              ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400' 
              : 'hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-white'
          }`}
          onClick={() => setMenuOpen(v => !v)}
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
        >
          <span className="sr-only">Menü öffnen</span>
          {menuOpen ? (
            <svg width="20" height="20" className="sm:w-[22px] sm:h-[22px]" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          ) : (
            <svg width="20" height="20" className="sm:w-[22px] sm:h-[22px]" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          )}
        </button>

        {/* Logo - Centered on mobile, left on desktop */}
        <Link
          href="/"
          className="flex items-center gap-1.5 sm:gap-2 md:gap-2.5 group flex-shrink-0 min-w-0 md:flex-1"
          aria-label="Fahrzeugfehler.de Startseite"
        >
          <div className="relative flex-shrink-0">
            <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 bg-gradient-to-br from-blue-600 to-blue-700 dark:from-blue-500 dark:to-blue-600 rounded-full shadow-md shadow-blue-500/30 group-hover:scale-110 transition-transform duration-300"></div>
            <div className="absolute inset-0 w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 bg-blue-400 rounded-full animate-ping opacity-20"></div>
          </div>
          <span className="font-mono font-black text-sm sm:text-base md:text-xl lg:text-2xl xl:text-3xl text-slate-900 dark:text-white tracking-tighter group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200 leading-tight">
            <span className="hidden sm:inline">Fahrzeugfehler</span>
            <span className="sm:hidden text-xs sm:text-sm">FAHRZEUGFEHLER</span>
            <span className="text-blue-600 dark:text-blue-400">.de</span>
          </span>
        </Link>

        {/* Spacer for layout - Desktop only */}
        <div className="hidden md:block flex-1"></div>
        <nav className="flex items-center gap-2 sm:gap-3 flex-shrink-0 relative">
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            <Link
              href="/news"
              className={`group relative px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
                isNewsPage 
                  ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30' 
                  : 'text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
              }`}
              tabIndex={0}
            >
              <span className="relative z-10 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
                NEWS
              </span>
            </Link>
            <div className="px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-2">
              <ThemeToggle />
            </div>
            {!isCarsPage && (
              <Link
                href="/cars"
                className="group relative px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                tabIndex={0}
              >
                <span className="relative z-10 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                  Fahrzeuge
                </span>
              </Link>
            )}
          </div>

          {/* User Profile Link - Desktop */}
          {user && (
            <Link
              href="/profile"
              className={`hidden md:flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200 ${
                isProfilePage
                  ? 'bg-blue-100 dark:bg-blue-900/50 border-2 border-blue-500 dark:border-blue-400'
                  : 'bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/50 hover:border-blue-300 dark:hover:border-blue-700'
              }`}
              aria-label="Benutzerprofil"
            >
              <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </Link>
          )}
          
          {/* Mobile dropdown menu - Fixed positioning */}
          {menuOpen && (
            <>
              {/* Backdrop */}
              <div 
                className="fixed inset-0 bg-black/20 dark:bg-black/40 z-40 md:hidden"
                onClick={() => setMenuOpen(false)}
                aria-hidden="true"
              />
              <motion.div
                id="mobile-menu"
                ref={menuRef}
                initial={{ opacity: 0, x: -20, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -20, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="fixed left-3 top-[3.5rem] sm:top-[4rem] md:top-[4.5rem] w-[calc(100vw-1.5rem)] sm:w-80 max-w-[360px] rounded-2xl shadow-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-2 border-slate-200 dark:border-white/20 z-50 flex flex-col py-2 overflow-hidden"
              >
                <Link
                  href="/news"
                  className="group relative block px-4 py-3.5 text-slate-700 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg text-base font-bold transition-colors min-h-[48px] flex items-center"
                  tabIndex={0}
                  onClick={() => setMenuOpen(false)}
                >
                  <span className="flex items-center gap-3 w-full">
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                    </svg>
                    <span className="flex-1">NEWS</span>
                    <svg className="w-4 h-4 text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                </Link>
                <div className="px-4 py-3.5 flex items-center justify-between min-h-[48px]">
                  <span className="text-slate-700 dark:text-white text-base font-semibold">Dark Mode</span>
                  <ThemeToggle />
                </div>
                {!isCarsPage && (
                  <Link
                    href="/cars"
                    className="group relative block px-4 py-3.5 text-slate-700 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg text-base font-bold transition-colors min-h-[48px] flex items-center"
                    tabIndex={0}
                    onClick={() => setMenuOpen(false)}
                  >
                    <span className="flex items-center gap-3 w-full">
                      <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                      </svg>
                      <span className="flex-1">Fahrzeuge</span>
                      <svg className="w-4 h-4 text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                  </Link>
                )}
                {user && (
                  <>
                    <div className="border-t border-slate-200 dark:border-white/10 my-1"></div>
                    <Link
                      href="/profile"
                      className="block px-4 py-3.5 text-slate-700 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg text-base font-semibold transition-colors min-h-[48px] flex items-center"
                      tabIndex={0}
                      onClick={() => setMenuOpen(false)}
                    >
                      <span className="flex items-center gap-3 w-full">
                        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span className="flex-1">Profil</span>
                      </span>
                    </Link>
                  </>
                )}
              </motion.div>
            </>
          )}
        </nav>
      </div>
    </motion.header>
  );
} 