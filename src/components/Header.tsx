'use client';

import Link from 'next/link';
import { useParams, usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { getSupabaseClient } from '@/lib/supabase';
import HeaderSearch from './HeaderSearch';
import ThemeToggle from './ThemeToggle';

export default function Header() {
  const params = useParams();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lang = params.lang as string || 'en';
  const t = (en: string, de: string) => lang === 'de' ? de : en;
  const isKnowledgePage = pathname?.startsWith(`/${lang}/knowledge`);
  const isChatPage = pathname?.startsWith(`/${lang}/chat`);
  const isNewsPage = pathname?.startsWith(`/${lang}/news`);
  const isContactPage = pathname?.startsWith(`/${lang}/contact`);
  const isPrivacyPage = pathname?.startsWith(`/${lang}/privacy`);
  const isImpressumPage = pathname?.startsWith(`/${lang}/impressum`);
  const isProfilePage = pathname?.startsWith(`/${lang}/profile`);
  const isCASPage = pathname?.startsWith(`/${lang}/cas`);
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const supabase = useMemo(() => getSupabaseClient(), []);

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
  }, [supabase]);

  const isReviewsPage = pathname?.startsWith(`/${lang}/reviews`);
  
  // Show header on all main pages
  if (!(isKnowledgePage || isChatPage || isNewsPage || isContactPage || isPrivacyPage || isImpressumPage || isProfilePage || isReviewsPage || isCASPage)) return null;
  
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
          href={`/${lang}`}
          className="flex items-center gap-3 text-2xl font-black text-slate-900 dark:text-white tracking-tight hover:text-red-600 dark:hover:text-red-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 rounded-lg px-2 py-1 transition-colors flex-shrink-0"
          aria-label="FAULTBASE Home"
        >
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
          <span className="font-mono tracking-wider">FAULTBASE</span>
        </Link>
        {/* Search Bar - only show on relevant pages, hide on knowledge and CAS pages */}
        {!isKnowledgePage && !isCASPage && (
          <div className="flex-1 max-w-2xl hidden md:block">
            <HeaderSearch lang={lang} />
          </div>
        )}
        <nav className="flex items-center gap-4 flex-shrink-0">
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href={`/${lang}/news`}
              className="group relative px-4 py-2 rounded-lg text-sm font-bold text-slate-700 dark:text-white hover:text-red-600 dark:hover:text-red-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 transition-all"
              tabIndex={0}
            >
              <span className="relative z-10 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
                {t('NEWS', 'NEWS')}
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse opacity-0 group-hover:opacity-100 transition-opacity"></span>
              </span>
              <span className="absolute inset-0 bg-red-50 dark:bg-red-900/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"></span>
            </Link>
            <Link
              href={`/${lang}/chat`}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-700 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10 hover:text-red-600 dark:hover:text-red-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 transition-all"
              tabIndex={0}
            >
              {t('ASK', 'FRAGEN')}
            </Link>
            <Link
              href={`/${lang}/knowledge`}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-700 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10 hover:text-red-600 dark:hover:text-red-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 transition-all"
              tabIndex={0}
            >
              {t('KNOWLEDGE BASE', 'WISSENSBASIS')}
            </Link>
            <Link
              href={`/${lang}/cas`}
              className={`group relative px-4 py-2 rounded-lg text-sm font-bold text-slate-700 dark:text-white hover:text-red-600 dark:hover:text-red-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 transition-all ${
                isCASPage ? 'text-red-600 dark:text-red-400' : ''
              }`}
              tabIndex={0}
            >
              <span className="relative z-10 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                {t('CAS', 'CAS')}
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse opacity-0 group-hover:opacity-100 transition-opacity"></span>
              </span>
              <span className="absolute inset-0 bg-red-50 dark:bg-red-900/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"></span>
            </Link>
          </div>

          {/* User Profile Link - Desktop */}
          {user && (
            <Link
              href={`/${lang}/profile`}
              className="hidden md:flex items-center justify-center w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 border-2 border-red-300 dark:border-red-700 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
              aria-label={t('User Profile', 'Benutzerprofil')}
            >
              <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </Link>
          )}

          {/* Language Switcher - Small Icon */}
          <Link
            href={`/${lang === 'en' ? 'de' : 'en'}${pathname?.replace(`/${lang}`, '') || ''}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition-colors group"
            aria-label={lang === 'en' ? 'Switch to German' : 'Switch to English'}
            title={lang === 'en' ? 'Deutsch' : 'English'}
          >
            <svg className="w-4 h-4 text-slate-600 dark:text-slate-400 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
            </svg>
          </Link>

          {/* Theme Toggle - Desktop */}
          <div className="hidden md:block">
            <ThemeToggle />
          </div>
          
          {/* Mobile Menu Button */}
          <button
            aria-label={t('Open menu', 'Menü öffnen')}
            className="md:hidden p-2 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 hover:bg-slate-100 dark:hover:bg-white/10 transition"
            onClick={() => setMenuOpen(v => !v)}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
          >
            <span className="sr-only">{t('Open menu', 'Menü öffnen')}</span>
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
                href={`/${lang}/news`}
                className="group relative block px-4 py-3 text-slate-700 dark:text-white hover:text-red-600 dark:hover:text-red-300 rounded-lg text-base font-bold transition-colors"
                tabIndex={0}
                onClick={() => setMenuOpen(false)}
              >
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                  </svg>
                  {t('NEWS', 'NEWS')}
                  <span className="ml-auto text-xs font-mono text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    →
                  </span>
                </span>
                <span className="absolute left-0 top-0 bottom-0 w-1 bg-red-500 rounded-r-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
              </Link>
              <Link
                href={`/${lang}/chat`}
                className="block px-4 py-3 text-slate-700 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10 hover:text-red-600 dark:hover:text-red-300 rounded-lg text-base font-semibold transition-colors"
                tabIndex={0}
                onClick={() => setMenuOpen(false)}
              >
                {t('ASK', 'FRAGEN')}
              </Link>
              <Link
                href={`/${lang}/knowledge`}
                className="block px-4 py-3 text-slate-700 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10 hover:text-red-600 dark:hover:text-red-300 rounded-lg text-base font-semibold transition-colors"
                tabIndex={0}
                onClick={() => setMenuOpen(false)}
              >
                {t('KNOWLEDGE BASE', 'WISSENSBASIS')}
              </Link>
              <Link
                href={`/${lang}/cas`}
                className={`group relative block px-4 py-3 text-slate-700 dark:text-white hover:text-red-600 dark:hover:text-red-300 rounded-lg text-base font-bold transition-colors ${
                  isCASPage ? 'text-red-600 dark:text-red-400' : ''
                }`}
                tabIndex={0}
                onClick={() => setMenuOpen(false)}
              >
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                  {t('CAS', 'CAS')}
                  <span className="ml-auto text-xs font-mono text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    →
                  </span>
                </span>
                <span className="absolute left-0 top-0 bottom-0 w-1 bg-red-500 rounded-r-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
              </Link>
              {user && (
                <>
                  <div className="border-t border-slate-200 dark:border-white/10 my-2"></div>
                  <Link
                    href={`/${lang}/profile`}
                    className="block px-4 py-3 text-slate-700 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10 hover:text-red-600 dark:hover:text-red-300 rounded-lg text-base font-semibold transition-colors"
                    tabIndex={0}
                    onClick={() => setMenuOpen(false)}
                  >
                    {t('Profile', 'Profil')}
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