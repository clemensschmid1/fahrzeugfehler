'use client';

import { useParams } from 'next/navigation';
import Header from '@/components/Header';
import Link from 'next/link';

export default function ImpressumPage() {
  const params = useParams();
  const lang = params.lang as string;

  const t = (en: string, de: string) => lang === 'de' ? de : en;

  return (
    <>
      <Header />
      <main className="min-h-screen bg-white dark:bg-slate-950 pt-24 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Top Bar with Theme Toggle and Language Switcher */}
          <div className="flex items-center justify-end gap-3 mb-8">
            <Link
              href={`/${lang === 'en' ? 'de' : 'en'}/impressum`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
              </svg>
              {lang === 'en' ? 'Deutsch' : 'English'}
            </Link>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-lg overflow-hidden">
            <div className="p-8">
              {/* Title */}
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-8">
                {t("Legal Notice", "Impressum")}
              </h1>

              {/* Legal Content */}
              <div className="prose prose-lg max-w-none dark:prose-invert">
                <div className="mb-8">
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
                    {t("Information in accordance with §5 TMG (Germany) / §25 MedienG (Austria)", "Angaben gemäß §5 TMG (Deutschland) / §25 MedienG (Österreich)")}
                  </h2>
                </div>

                <section className="mb-8">
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
                    {t("Business Owner", "Inhaber")}
                  </h2>
                  <div className="text-slate-700 dark:text-slate-300 space-y-1">
                    <p>Clemens Schmid</p>
                    <p>Mahlgasse 2</p>
                    <p>88339 Bad Waldsee</p>
                    <p>Germany</p>
                  </div>
                </section>

                <section className="mb-8">
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
                    {t("Contact Information", "Kontaktinformationen")}
                  </h2>
                  <div className="text-slate-700 dark:text-slate-300 space-y-2">
                    <p>
                      <span className="font-medium">{t("Phone:", "Telefon:")}</span> +49 1567 9638061
                    </p>
                    <p>
                      <span className="font-medium">{t("Email:", "E-Mail:")}</span>{' '}
                      <a 
                        href="mailto:info@infoneva.com" 
                        className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 underline"
                      >
                        info@infoneva.com
                      </a>
                    </p>
                  </div>
                </section>

                <section className="mb-8">
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
                    {t("Business Information", "Geschäftsinformationen")}
                  </h2>
                  <div className="text-slate-700 dark:text-slate-300 space-y-2">
                    <p>
                      <span className="font-medium">{t("VAT ID:", "USt-IdNr.:")}</span> DE356558857
                    </p>
                    <p>
                      <span className="font-medium">{t("Business Type:", "Rechtsform:")}</span>{' '}
                      {t("Sole proprietorship", "Einzelunternehmen")}
                    </p>
                  </div>
                </section>

                <section className="mb-8">
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
                    {t("Responsible for content according to §55(2) RStV (Germany):", "Verantwortlich für den Inhalt nach §55(2) RStV (Deutschland):")}
                  </h2>
                  <div className="text-slate-700 dark:text-slate-300 space-y-1">
                    <p>Clemens Schmid, {t("address as above", "Anschrift wie oben")}.</p>
                  </div>
                </section>

                <section className="mb-8">
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
                    {t("EU Dispute Resolution", "EU-Streitschlichtung")}
                  </h2>
                  <p className="text-slate-700 dark:text-slate-300 mb-2">
                    {t(
                      "The European Commission provides a platform for online dispute resolution (ODR):",
                      "Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:"
                    )}
                  </p>
                  <p className="text-slate-700 dark:text-slate-300 mb-4">
                    <a 
                      href="https://ec.europa.eu/consumers/odr" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 underline break-all"
                    >
                      https://ec.europa.eu/consumers/odr
                    </a>
                  </p>
                  <p className="text-slate-700 dark:text-slate-300">
                    {t(
                      "Our email address can be found above in the site notice.",
                      "Unsere E-Mail-Adresse finden Sie oben im Impressum."
                    )}
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
                    {t("Consumer Dispute Resolution / Universal Arbitration Board", "Verbraucherstreitbeilegung / Universalschlichtungsstelle")}
                  </h2>
                  <p className="text-slate-700 dark:text-slate-300 mb-2">
                    {t(
                      "We are not willing or obliged to participate in dispute resolution proceedings before a consumer arbitration board.",
                      "Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen."
                    )}
                  </p>
                </section>

                <section className="mt-12 pt-8 border-t border-slate-200 dark:border-white/10">
                  <p className="text-slate-600 dark:text-slate-400 text-sm">
                    © 2024 Infoneva. {t("All rights reserved.", "Alle Rechte vorbehalten.")}
                  </p>
                </section>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
