'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function Footer() {
  const params = useParams();
  const lang = params.lang as string || 'en';

  const t = (en: string, de: string) => lang === 'de' ? de : en;

  return (
    <footer className="bg-gray-900 text-white py-12 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Mission Section */}
        <div className="mb-8 pb-8 border-b border-gray-700">
          <div className="max-w-4xl mx-auto text-center">
            <h3 className="text-xl font-semibold text-white mb-4">
              {t('Our Mission', 'Unsere Mission')}
            </h3>
            <div className="space-y-3 text-gray-300 leading-relaxed">
              <p className="text-lg">
                {t(
                  'Infoneva consolidates scattered industrial knowledge into one structured, accessible platform.',
                  'Infoneva konsolidiert verstreutes industrielles Wissen in eine strukturierte, zugängliche Plattform.'
                )}
              </p>
              <p className="text-lg">
                {t(
                  'We deliver hands-on insights – practical, precise, and field-proven.',
                  'Wir liefern praxisnahe Erkenntnisse – praktisch, präzise und erprobt.'
                )}
              </p>
              <p className="text-lg font-medium text-white">
                {t(
                  'Built for people who need real solutions, not theory.',
                  'Entwickelt für Menschen, die echte Lösungen brauchen, nicht Theorie.'
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Copyright and Links */}
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="text-sm text-gray-400 mb-4 md:mb-0">
            © 2024 Infoneva. {t('All rights reserved.', 'Alle Rechte vorbehalten.')}
          </div>
          <div className="flex space-x-6">
            <Link
              href={`/${lang}/privacy`}
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              {t('Privacy Policy', 'Datenschutz')}
            </Link>
            <Link
              href={`/${lang}/impressum`}
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              {t('Impressum', 'Impressum')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
} 