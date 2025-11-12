'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

interface MainPageSearchProps {
  lang: string;
}

interface SearchResult {
  id: string;
  slug: string;
  header?: string;
  question: string;
  meta_description?: string;
  manufacturer?: string;
  sector?: string;
  part_type?: string;
}

export default function MainPageSearch({ lang }: MainPageSearchProps) {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  const t = (en: string, de: string) => lang === 'de' ? de : en;

  // Debounced search
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (searchInput.trim().length >= 2) {
      setIsSearching(true);
      debounceTimer.current = setTimeout(async () => {
        try {
          const apiResponse = await fetch(
            `/api/knowledge/search?q=${encodeURIComponent(searchInput.trim())}&lang=${lang}&limit=5`
          );
          if (apiResponse.ok) {
            const data = await apiResponse.json();
            setResults(data.questions || []);
          } else {
            setResults([]);
          }
        } catch (error) {
          console.error('Search error:', error);
          setResults([]);
        } finally {
          setIsSearching(false);
        }
      }, 300);
    } else {
      setResults([]);
      setIsSearching(false);
    }

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [searchInput, lang]);

  // Close results when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      router.push(`/${lang}/knowledge?q=${encodeURIComponent(searchInput.trim())}&page=1`);
      setShowResults(false);
    }
  };

  const handleResultClick = (slug: string) => {
    router.push(`/${lang}/knowledge/${slug}`);
    setShowResults(false);
    setSearchInput('');
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-2xl">
      <form onSubmit={handleSubmit} className="relative">
        <input
          type="text"
          value={searchInput}
          onChange={(e) => {
            setSearchInput(e.target.value);
            setShowResults(true);
          }}
          onFocus={() => setShowResults(true)}
          placeholder={t('Search knowledge base...', 'Wissensdatenbank durchsuchen...')}
          className="w-full pl-12 pr-24 py-3 rounded-xl border-2 border-slate-300 dark:border-white/20 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-4 focus:ring-red-500/20 focus:border-red-500 dark:focus:border-red-400 transition-all shadow-sm hover:shadow-md"
        />
        <svg
          className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <button
          type="submit"
          className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm"
        >
          {t('Search', 'Suchen')}
        </button>
      </form>

      {/* Search Results Dropdown */}
      <AnimatePresence>
        {showResults && searchInput.trim().length >= 2 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full mt-2 w-full bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-white/10 rounded-xl shadow-2xl z-50 max-h-96 overflow-y-auto"
          >
            {isSearching ? (
              <div className="p-6 text-center text-slate-500 dark:text-slate-400">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-red-600"></div>
                <p className="mt-2 text-sm">{t('Searching...', 'Suche...')}</p>
              </div>
            ) : results.length > 0 ? (
              <>
                <div className="p-3 border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900/50">
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    {t('Search Results', 'Suchergebnisse')} ({results.length})
                  </p>
                </div>
                <div className="divide-y divide-slate-200 dark:divide-white/10">
                  {results.map((result) => (
                    <button
                      key={result.id}
                      onClick={() => handleResultClick(result.slug)}
                      className="w-full text-left p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group"
                    >
                      <h4 className="font-semibold text-slate-900 dark:text-white mb-1 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors line-clamp-1">
                        {result.header || result.question}
                      </h4>
                      {result.meta_description && (
                        <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mb-2">
                          {result.meta_description}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-2 mt-2">
                        {result.manufacturer && (
                          <span className="text-xs px-2 py-0.5 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full">
                            {result.manufacturer}
                          </span>
                        )}
                        {result.sector && (
                          <span className="text-xs px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-full">
                            {result.sector}
                          </span>
                        )}
                        {result.part_type && (
                          <span className="text-xs px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-full">
                            {result.part_type}
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
                <div className="p-3 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900/50">
                  <Link
                    href={`/${lang}/knowledge?q=${encodeURIComponent(searchInput.trim())}&page=1`}
                    className="block text-center text-sm font-semibold text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
                    onClick={() => setShowResults(false)}
                  >
                    {t('View all results →', 'Alle Ergebnisse anzeigen →')}
                  </Link>
                </div>
              </>
            ) : searchInput.trim().length >= 2 ? (
              <div className="p-6 text-center text-slate-500 dark:text-slate-400">
                <p className="text-sm">{t('No results found', 'Keine Ergebnisse gefunden')}</p>
                <Link
                  href={`/${lang}/chat?q=${encodeURIComponent(searchInput.trim())}`}
                  className="mt-3 inline-block text-sm font-semibold text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
                  onClick={() => setShowResults(false)}
                >
                  {t('Ask AI instead →', 'KI fragen →')}
                </Link>
              </div>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

