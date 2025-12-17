'use client';

import Link from 'next/link';
import { useParams, usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { createBrowserClient } from '@supabase/ssr';

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
  
  // Show header on all main pages
  if (!(isChatPage || isNewsPage || isContactPage || isPrivacyPage || isImpressumPage || isProfilePage || isReviewsPage || isCarsPage || isSignupPage || isLoginPage)) return null;
  
  // Fix missing dependency
  // eslint-disable-next-line react-hooks/exhaustive-deps

  return (
    <motion.header
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="w-full bg-white dark:bg-black backdrop-blur-sm border-b border-black/10 dark:border-white/20"
      role="banner"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 h-16">
        <Link
          href="/"
          className="flex items-center gap-3 text-2xl font-black text-slate-900 dark:text-white tracking-tight hover:text-blue-600 dark:hover:text-blue-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-lg px-2 py-1 transition-colors flex-shrink-0"
          aria-label="Fahrzeugfehler.de Startseite"
        >
          <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
          <span className="font-mono tracking-wider">Fahrzeugfehler.de</span>
        </Link>
        {/* Spacer for layout */}
        <div className="flex-1"></div>
        <nav className="flex items-center gap-4 flex-shrink-0">
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/news"
              className="group relative px-4 py-2 rounded-lg text-sm font-bold text-slate-700 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-all"
              tabIndex={0}
            >
              <span className="relative z-10 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
                NEWS
              </span>
              <span className="absolute inset-0 bg-blue-50 dark:bg-blue-900/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"></span>
            </Link>
            <Link
              href="/chat"
              className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-700 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10 hover:text-blue-600 dark:hover:text-blue-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-all"
              tabIndex={0}
            >
              FRAGEN
            </Link>
            <Link
              href="/cars"
              className={`group relative px-4 py-2 rounded-lg text-sm font-bold text-slate-700 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-all ${
                isCarsPage ? 'text-blue-600 dark:text-blue-400' : ''
              }`}
              tabIndex={0}
            >
              <span className="relative z-10 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                Fahrzeuge
              </span>
              <span className="absolute inset-0 bg-blue-50 dark:bg-blue-900/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"></span>
            </Link>
          </div>

          {/* User Profile Link - Desktop */}
          {user && (
            <Link
              href="/profile"
              className="hidden md:flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 border-2 border-blue-300 dark:border-blue-700 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
              aria-label="Benutzerprofil"
            >
              <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </Link>
          )}

          {/* Mobile Menu Button */}
          <button
            aria-label="Menü öffnen"
            className="md:hidden p-2 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 hover:bg-slate-100 dark:hover:bg-white/10 transition"
            onClick={() => setMenuOpen(v => !v)}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
          >
            <span className="sr-only">Menü öffnen</span>
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-700 dark:text-white" viewBox="0 0 24 24"><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
          </button>
          
          {/* Mobile dropdown menu */}
          {menuOpen && (
            <motion.div
              id="mobile-menu"
              ref={menuRef}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="absolute right-4 top-16 mt-2 w-56 rounded-xl shadow-lg bg-white dark:bg-slate-800 backdrop-blur-sm border border-slate-200 dark:border-white/10 z-50 flex flex-col py-2"
            >
              <Link
                href="/news"
                className="group relative block px-4 py-3 text-slate-700 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 rounded-lg text-base font-bold transition-colors"
                tabIndex={0}
                onClick={() => setMenuOpen(false)}
              >
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                  </svg>
                  NEWS
                  <span className="ml-auto text-xs font-mono text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                    →
                  </span>
                </span>
                <span className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 rounded-r-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
              </Link>
              <Link
                href="/chat"
                className="block px-4 py-3 text-slate-700 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg text-base font-semibold transition-colors"
                tabIndex={0}
                onClick={() => setMenuOpen(false)}
              >
                FRAGEN
              </Link>
              <Link
                href="/cars"
                className={`group relative block px-4 py-3 text-slate-700 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 rounded-lg text-base font-bold transition-colors ${
                  isCarsPage ? 'text-blue-600 dark:text-blue-400' : ''
                }`}
                tabIndex={0}
                onClick={() => setMenuOpen(false)}
              >
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                  Fahrzeuge
                  <span className="ml-auto text-xs font-mono text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                    →
                  </span>
                </span>
                <span className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 rounded-r-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
              </Link>
              {user && (
                <>
                  <div className="border-t border-slate-200 dark:border-white/10 my-2"></div>
                  <Link
                    href="/profile"
                    className="block px-4 py-3 text-slate-700 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg text-base font-semibold transition-colors"
                    tabIndex={0}
                    onClick={() => setMenuOpen(false)}
                  >
                    Profil
                  </Link>
                </>
              )}
            </motion.div>
          )}
        </nav>
      </div>
    </motion.header>
  );
} 