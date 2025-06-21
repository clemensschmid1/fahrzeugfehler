import Link from 'next/link';
import type { Metadata } from 'next';

type Params = { lang: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { lang } = await params;
  const siteUrl = 'https://infoneva.com';

  const title = lang === 'de'
    ? 'Infoneva: Industrielle KI für die Fertigung | Sofortige technische Lösungen'
    : 'Infoneva: Industrial AI for Manufacturing | Instant Technical Solutions';

  const description = lang === 'de'
    ? 'Infoneva bietet sofortige, präzise Antworten für industrielle Automatisierung. Greifen Sie auf eine Wissensdatenbank zu, die auf Tausenden von OEM-Handbüchern, Fehlercodes und SPS-Logik basiert.'
    : 'Infoneva provides instant, precise answers for industrial automation. Access a knowledge base trained on thousands of OEM manuals, error codes, and PLC logic.';

  const canonicalUrl = `${siteUrl}/${lang}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        'en': `${siteUrl}/en`,
        'de': `${siteUrl}/de`,
      },
    },
    other: {
      'og:title': title,
      'og:description': description,
      'og:url': canonicalUrl,
      'og:site_name': 'Infoneva',
    },
  };
}

export default async function MainPage({ params }: { params: Promise<Params> }) {
  // SSR-safe: get language from params
  const { lang } = await params;

  // Headlines
  const headline = lang === 'de'
    ? 'Industrielle Intelligenz, keine Spielerei.'
    : 'Industrial intelligence, not just AI.';
  const subline = lang === 'de'
    ? 'Infoneva verarbeitet tausende Handbücher, Fehlercodes und Steuerungstabellen, um präzise Antworten in Sekunden zu liefern.'
    : 'Infoneva digests thousands of manuals, error codes and control-logic tables to deliver precise answers in seconds.';
  const cta = lang === 'de' ? 'Frage stellen' : 'Ask a question';
  const demo = lang === 'de' ? 'Teste drei Anfragen gratis.' : 'Try three queries free.';

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex flex-col items-center justify-center px-4 py-12">
      {/* Language Toggle Button - Top Right */}
      <div className="absolute top-4 right-4">
        <Link
          href={`/${lang === 'en' ? 'de' : 'en'}`}
          className="inline-flex items-center px-4 py-2 bg-white text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
          </svg>
          {lang === 'en' ? 'Deutsch' : 'English'}
        </Link>
      </div>

      {/* Hero Section */}
      <section className="w-full max-w-3xl mx-auto flex flex-col items-center text-center gap-8">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
          {headline}
        </h1>
        <p className="text-lg sm:text-xl text-slate-700 max-w-2xl">
          {subline}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
          <Link
            href={`/${lang}/chat`}
            className="inline-block px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-xl shadow-lg hover:bg-blue-700 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {cta}
          </Link>
          <Link
            href={`/${lang}/knowledge`}
            className="inline-block px-8 py-4 bg-white text-blue-700 text-lg font-semibold rounded-xl shadow-lg border border-blue-200 hover:bg-blue-50 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {lang === 'de' ? 'Wissensdatenbank' : 'Knowledge Base'}
          </Link>
        </div>
        <span className="text-base text-slate-500 mt-2">{demo}</span>
      </section>

      {/* Trust/Facts Section */}
      <section className="w-full max-w-3xl mx-auto mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
        <div className="bg-white rounded-2xl shadow-md border border-slate-100 p-6 flex flex-col items-center">
          <span className="text-2xl font-bold text-blue-700 mb-2">{lang === 'de' ? 'Datenstärke' : 'Data Pedigree'}</span>
          <p className="text-slate-700 text-base">
            {lang === 'de'
              ? 'Trainiert auf tausenden OEM-Handbüchern, Feldprotokollen und Fehlerdaten.'
              : 'Trained on thousands of OEM manuals, field logs, and error datasets.'}
          </p>
        </div>
        <div className="bg-white rounded-2xl shadow-md border border-slate-100 p-6 flex flex-col items-center">
          <span className="text-2xl font-bold text-blue-700 mb-2">{lang === 'de' ? 'Echte Use Cases' : 'Real Use Cases'}</span>
          <p className="text-slate-700 text-base">
            {lang === 'de'
              ? 'Wartung, Inbetriebnahme, Fehlerdiagnose – sofortige Lösungen für Drives, SPS & PROFINET.'
              : 'Maintenance, commissioning, troubleshooting—instant solutions for drives, PLCs & PROFINET.'}
          </p>
        </div>
        <div className="bg-white rounded-2xl shadow-md border border-slate-100 p-6 flex flex-col items-center">
          <span className="text-2xl font-bold text-blue-700 mb-2">{lang === 'de' ? 'Sekundenschnell' : 'Real-Time'}</span>
          <p className="text-slate-700 text-base">
            {lang === 'de'
              ? 'Antworten in Echtzeit. Keine Wartezeit, keine Floskeln – nur Lösungen.'
              : 'Answers in real time. No waiting, no small talk—just solutions.'}
          </p>
        </div>
      </section>

      {/* Alt Headlines Section */}
      <section className="w-full max-w-3xl mx-auto mt-16 flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row gap-6">
          <div className="flex-1 bg-slate-50 rounded-xl p-6 border border-slate-100">
            <span className="block text-lg font-semibold text-slate-800 mb-2">
              {lang === 'de' ? 'Fehlerdiagnose. Rebooted.' : 'Diagnostics. Rebooted.'}
            </span>
            <span className="block text-slate-600">
              {lang === 'de'
                ? 'Von SEW-Antrieben bis Siemens ET200SP – Infoneva löst komplexe Systemfehler sofort.'
                : 'From SEW drives to Siemens ET200SP, Infoneva resolves complex system errors on the spot.'}
            </span>
          </div>
          <div className="flex-1 bg-slate-50 rounded-xl p-6 border border-slate-100">
            <span className="block text-lg font-semibold text-slate-800 mb-2">
              {lang === 'de' ? 'Eingabe: Fehlercode. Ausgabe: Lösung.' : 'Input: error code. Output: solution.'}
            </span>
            <span className="block text-slate-600">
              {lang === 'de'
                ? 'Keine KI-Spielerei. Infoneva spricht die Sprache Ihrer Maschine.'
                : 'No AI gimmicks. Infoneva speaks your machine\'s language.'}
            </span>
          </div>
        </div>
      </section>
    </main>
  );
} 