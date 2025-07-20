'use client';

import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

export default function Header() {
  const params = useParams();
  const pathname = usePathname();
  const lang = params.lang as string || 'en';
  const t = (en: string, de: string) => lang === 'de' ? de : en;
  const isKnowledgePage = pathname?.startsWith(`/${lang}/knowledge`);
  const isChatPage = pathname?.startsWith(`/${lang}/chat`);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Remove all auto-hide/collapsing logic: header is always visible if rendered

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

  // Show header on desktop and mobile for both knowledge and chat pages
  if (!(isKnowledgePage || isChatPage)) return null;

  return (
    <motion.header
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="w-full bg-white/90 backdrop-blur border-b border-gray-200 shadow-sm"
      role="banner"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        <Link
          href={`/${lang}`}
          className="flex items-center text-2xl font-extrabold text-gray-900 tracking-tight hover:text-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-lg px-2 py-1 transition-colors"
          aria-label="Infoneva Home"
        >
          Infoneva
        </Link>
        <nav className="flex items-center gap-2">
          <Link
            href={`/${lang}/knowledge`}
            className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 transition-all"
            tabIndex={0}
          >
            {t('Knowledge Base', 'Wissensdatenbank')}
          </Link>
          <Link
            href={`/${lang}/chat`}
            className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 transition-all"
            tabIndex={0}
          >
            {t('Chat', 'Chat')}
          </Link>
          <button
            aria-label={t('Open menu', 'Menü öffnen')}
            className="p-2 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 hover:bg-indigo-50 transition"
            onClick={() => setMenuOpen(v => !v)}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
          >
            <span className="sr-only">{t('Open menu', 'Menü öffnen')}</span>
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-700" viewBox="0 0 24 24"><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
          </button>
          {menuOpen && (
            <motion.div
              id="mobile-menu"
              ref={menuRef}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="absolute right-4 top-16 mt-2 w-48 rounded-xl shadow-lg bg-white border border-gray-100 z-50 flex flex-col py-2"
            >
              <Link
                href={`/${lang}/knowledge`}
                className="block px-4 py-3 text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg text-base font-medium transition-colors"
                tabIndex={0}
                onClick={() => setMenuOpen(false)}
              >
                {t('Knowledge Base', 'Wissensdatenbank')}
              </Link>
              <Link
                href={`/${lang}/chat`}
                className="block px-4 py-3 text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg text-base font-medium transition-colors"
                tabIndex={0}
                onClick={() => setMenuOpen(false)}
              >
                {t('Chat', 'Chat')}
              </Link>
            </motion.div>
          )}
        </nav>
      </div>
    </motion.header>
  );
} 