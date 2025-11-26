'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function Footer() {
  const params = useParams();
  const lang = params.lang as string || 'en';

  const t = (en: string, de: string) => lang === 'de' ? de : en;

  return (
    <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-white/10 py-8 sm:py-12 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Tech-focused Footer */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-col items-center md:items-start gap-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <div className="text-sm font-mono font-bold text-slate-900 dark:text-white tracking-wider">
                © 2025 FAULTBASE
              </div>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              {t('All rights reserved.', 'Alle Rechte vorbehalten.')}
            </div>
            <div className="text-xs text-slate-400 dark:text-slate-500 font-mono mt-1">
              {t('v2.0.0', 'v2.0.0')} • {t('Production', 'Produktion')}
            </div>
          </div>
          <div className="flex flex-wrap justify-center gap-4 md:gap-6">
            <Link
              href={`/${lang}/contact`}
              className="text-sm text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors font-medium font-mono"
            >
              {t('Contact', 'Kontakt')}
            </Link>
            <Link
              href={`/${lang}/privacy`}
              className="text-sm text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors font-medium font-mono"
            >
              {t('Privacy', 'Datenschutz')}
            </Link>
            <Link
              href={`/${lang}/impressum`}
              className="text-sm text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors font-medium font-mono"
            >
              {t('Impressum', 'Impressum')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
