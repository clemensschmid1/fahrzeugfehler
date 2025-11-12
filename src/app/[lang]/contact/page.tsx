import type { Metadata } from 'next';
import Link from 'next/link';
import Header from '@/components/Header';
import ContactForm from './ContactForm';

type Params = { lang: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { lang } = await params;
  const siteUrl = 'https://faultbase.com';

  const title = lang === 'de'
    ? 'Kontakt | FAULTBASE'
    : 'Contact | FAULTBASE';
  
  const description = lang === 'de'
    ? 'Kontaktieren Sie uns mit Ihren Ideen, Vorschlägen und Feedback zur Verbesserung von FAULTBASE.'
    : 'Contact us with your ideas, suggestions, and feedback to improve FAULTBASE.';

  const canonicalUrl = `${siteUrl}/${lang}/contact`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        'en': `${siteUrl}/en/contact`,
        'de': `${siteUrl}/de/contact`,
      },
    },
    other: {
        'og:title': title,
        'og:description': description,
        'og:url': canonicalUrl,
    }
  };
}

export default async function ContactPage({ params }: { params: Promise<Params> }) {
  const { lang } = await params;

  const t = (en: string, de: string) => lang === 'de' ? de : en;

  return (
    <>
      <Header />
      <main className="min-h-screen bg-white dark:bg-slate-950 pt-24 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Top Bar with Theme Toggle and Language Switcher */}
          <div className="flex items-center justify-end gap-3 mb-12">
            <Link
              href={`/${lang === 'en' ? 'de' : 'en'}/contact`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
              </svg>
              {lang === 'en' ? 'Deutsch' : 'English'}
            </Link>
          </div>

          {/* Hero Section */}
          <div className="text-center mb-16">
            <h1 className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white mb-6 tracking-tight">
              {t('Contact Us', 'Kontaktieren Sie uns')}
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
              {t(
                'Have ideas to improve FAULTBASE? Found something that needs fixing? Want to share valuable insights? We\'d love to hear from you.',
                'Haben Sie Ideen zur Verbesserung von FAULTBASE? Etwas gefunden, das repariert werden muss? Möchten Sie wertvolle Erkenntnisse teilen? Wir freuen uns von Ihnen zu hören.'
              )}
            </p>
          </div>

          {/* Contact Form Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-lg p-8 sm:p-12">
            <ContactForm lang={lang} />

            {/* Alternative Contact Methods */}
            <div className="mt-12 pt-12 border-t border-slate-200 dark:border-white/10">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
                {t('Other Ways to Reach Us', 'Weitere Kontaktmöglichkeiten')}
              </h2>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
                      {t('Email', 'E-Mail')}
                    </h3>
                    <a 
                      href="mailto:contact@faultbase.com" 
                      className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
                    >
                      contact@faultbase.com
                    </a>
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6 border border-slate-200 dark:border-white/10">
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-3">
                    {t('What We\'re Looking For', 'Wonach wir suchen')}
                  </h3>
                  <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                    <li className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>{t('Bug reports and technical issues', 'Fehlermeldungen und technische Probleme')}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>{t('Ideas for new features or improvements', 'Ideen für neue Funktionen oder Verbesserungen')}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>{t('Suggestions for knowledge base content', 'Vorschläge für Wissensdatenbank-Inhalte')}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>{t('Feedback on user experience', 'Feedback zur Benutzerfreundlichkeit')}</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

