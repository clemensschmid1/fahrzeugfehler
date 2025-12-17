'use client';

import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-white/10 py-8 sm:py-12 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Tech-focused Footer */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-col items-center md:items-start gap-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
              <div className="text-sm font-mono font-bold text-slate-900 dark:text-white tracking-wider">
                © 2025 Fahrzeugfehler.de
              </div>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              Alle Rechte vorbehalten.
            </div>
            <div className="text-xs text-slate-400 dark:text-slate-500 font-mono mt-1">
              v2.0.0 • Produktion
            </div>
          </div>
          <div className="flex flex-col items-center md:items-end gap-4">
            <div className="flex flex-wrap justify-center gap-4 md:gap-6">
              <Link
                href="/contact"
                className="text-sm text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium font-mono"
              >
                Kontakt
              </Link>
              <Link
                href="/privacy"
                className="text-sm text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium font-mono"
              >
                Datenschutz
              </Link>
              <Link
                href="/impressum"
                className="text-sm text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium font-mono"
              >
                Impressum
              </Link>
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400 max-w-md text-center md:text-right">
              ⚠️ Hinweis: Bei komplexen Problemen, Sicherheitsrelevanz oder Unklarheit sollten Sie immer einen qualifizierten Fachmann kontaktieren.
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
