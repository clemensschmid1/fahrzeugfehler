/**
 * Professional, Apple-like main page redesign
 */
import Link from 'next/link';
import type { Metadata } from 'next';

type Params = { lang: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { lang } = await params;
  const siteUrl = 'https://infoneva.com';

  const title = lang === 'de'
    ? 'Infoneva: Technische KI für echte Antworten'
    : 'Infoneva: Technical AI for Real Answers';

  const description = lang === 'de'
    ? 'Infoneva liefert sofortige, präzise Antworten für Technik. Zugriff auf eine Wissensdatenbank, die auf tausenden Seiten basiert.'
    : 'Infoneva provides instant, precise answers for tech. Access a knowledge base built from thousands of pages.';

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
  const { lang } = await params;

  // Text content
  const headline = lang === 'de'
    ? 'Technische KI. Echte Antworten.'
    : 'Technical AI. Real Answers.';
  const subline = lang === 'de'
    ? 'Ihr intelligenter Assistent für alles rund um Technik.'
    : 'Your intelligent assistant for everything tech.';
  const valueProp = lang === 'de'
    ? 'Wir verarbeiten tausende Handbücher, Anleitungen und Forenbeiträge, um Ihnen sofort präzise Antworten zu liefern – ohne Floskeln, ohne Lärm.'
    : 'We process thousands of manuals, guides, and forums to deliver fast, precise answers—no fluff, no noise.';
  const cta = lang === 'de' ? 'Frage stellen' : 'Ask a question';
  const knowledge = lang === 'de' ? 'Wissensdatenbank' : 'Browse Knowledge';

  const steps = [
    {
      title: lang === 'de' ? 'Tausende Seiten gelesen' : 'Thousands of Pages Read',
      desc: lang === 'de'
        ? 'Unsere KI analysiert und strukturiert riesige Mengen an technischen Dokumenten, damit Sie es nicht müssen.'
        : 'Our AI reads and structures massive amounts of technical documentation so you dont have to.'
    },
    {
      title: lang === 'de' ? 'Strukturierte Antworten' : 'Structured Answers',
      desc: lang === 'de'
        ? 'Jede Antwort ist klar, nachvollziehbar und mit relevanten Wissensseiten verlinkt.'
        : 'Every answer is clear, actionable, and linked to relevant knowledge pages.'
    },
    {
      title: lang === 'de' ? 'Ständig wachsend' : 'Always Growing',
      desc: lang === 'de'
        ? 'Unsere Wissensbasis wird täglich erweitert und verbessert.'
        : 'Our knowledge base grows and improves every day.'
    }
  ];

  const whyDifferent = lang === 'de'
    ? 'Nicht nur ein weiterer Chatbot. Wir bauen ein lebendiges, strukturiertes Wissens-Ökosystem.'
    : 'Not just another chatbot. Were building a living, structured knowledge ecosystem.';
  const noAds = lang === 'de'
    ? 'Keine Werbung. Keine Ablenkung. Nur Antworten.'
    : 'No ads. No distractions. Just answers.';

  const forUsers = lang === 'de'
    ? 'Über Google gefunden? Lesezeichen setzen. Morgen sind wir größer. Bessere Antwort? Vorschlagen. Wir aktualisieren das System. Testen? Suchleiste nutzen. Probier alles.'
    : `Found us through Google? Bookmark us. We'll be bigger tomorrow.

Have a better answer? Suggest it.

Want to test us? Try anything.`;

  const note = lang === 'de'
    ? 'Wir sind in der frühen Entwicklung – das heißt, die Qualität schwankt noch. Aber wir werden schnell besser – und sind lieber transparent als perfekt.'
    : 'Were in early development. Quality may vary, but were improving fast.';

  return (
    <main className="min-h-screen bg-white flex flex-col items-center justify-center px-4 py-12 font-sans">
      {/* Language Toggle Button - Top Right */}
      <div className="absolute top-4 right-4">
        <Link
          href={`/${lang === 'en' ? 'de' : 'en'}`}
          className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-200 transition-colors shadow-sm"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
          </svg>
          {lang === 'en' ? 'Deutsch' : 'English'}
        </Link>
      </div>

      {/* Hero Section */}
      <section className="w-full max-w-3xl mx-auto flex flex-col items-center text-center gap-8 mt-16 mb-20">
        <h1 className="text-6xl font-extrabold text-gray-900 tracking-tight leading-tight mb-4">
          {headline}
        </h1>
        <p className="text-2xl text-gray-700 font-light mb-2">{subline}</p>
        <p className="text-lg text-gray-500 max-w-2xl mb-8">{valueProp}</p>
        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
          <Link
            href={`/${lang}/chat`}
            className="inline-block px-8 py-4 bg-white text-gray-900 text-lg font-semibold rounded-xl shadow border border-gray-200 hover:bg-gray-100 transition-all focus:outline-none focus:ring-2 focus:ring-gray-300"
          >
            {cta}
          </Link>
          <Link
            href={`/${lang}/knowledge`}
            className="inline-block px-8 py-4 bg-white text-gray-900 text-lg font-semibold rounded-xl shadow border border-gray-200 hover:bg-gray-100 transition-all focus:outline-none focus:ring-2 focus:ring-gray-300"
          >
            {knowledge}
          </Link>
        </div>
      </section>

      {/* How it works / Value Section */}
      <section className="w-full max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
        {steps.map((step, i) => (
          <div key={i} className="bg-gray-50 rounded-2xl shadow-sm border border-gray-100 p-10 flex flex-col items-center">
            <span className="text-2xl font-bold text-gray-900 mb-3">{step.title}</span>
            <p className="text-gray-600 text-lg text-center">{step.desc}</p>
          </div>
        ))}
      </section>

      {/* Why We're Different */}
      <section className="w-full max-w-2xl mx-auto flex flex-col gap-4 text-center mb-16 bg-gray-50 rounded-xl border border-gray-100 shadow-sm p-10">
        <p className="text-2xl text-gray-900 font-bold mb-2">{whyDifferent}</p>
        <p className="text-gray-700 text-lg">{noAds}</p>
      </section>

      {/* For Users */}
      <section className="w-full max-w-2xl mx-auto flex flex-col gap-4 text-center mb-16">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8">
          <p className="text-lg text-gray-800 whitespace-pre-line">{forUsers}</p>
        </div>
      </section>

      {/* Note / Disclaimer */}
      <section className="w-full max-w-2xl mx-auto flex flex-col gap-4 text-center mb-8">
        <div className="bg-yellow-50 border-l-4 border-yellow-400 rounded-xl p-6 text-left">
          <span className="block text-yellow-800 font-bold mb-2">{lang === 'de' ? 'Hinweis' : 'Note'}</span>
          <span className="text-yellow-900 whitespace-pre-line">{note}</span>
        </div>
      </section>
    </main>
  );
} 