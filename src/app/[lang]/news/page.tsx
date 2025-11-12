import Link from 'next/link';
import Header from '@/components/Header';
import { newsArticles } from '@/content/news';
import NewsClient from './NewsClient';

export default async function NewsPage({ params }: { params: Promise<{ lang: 'en' | 'de' }> }) {
  const { lang } = await params;
  const articles = newsArticles
    .filter(a => a.lang === lang)
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  const toggleLang = lang === 'en' ? 'de' : 'en';
  const toggleLangText = lang === 'en' ? 'Deutsch' : 'English';

  return (
    <>
      <Header />
      <main className="min-h-screen bg-white dark:bg-slate-950">
        {/* Top bar with theme toggle and language switcher */}
        <div className="sticky top-0 z-30 bg-white dark:bg-slate-950 backdrop-blur-xl border-b border-slate-200 dark:border-white/5 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
            <Link 
              href={`/${lang}`}
              className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              {lang === 'de' ? 'Zur Startseite' : 'Home'}
            </Link>
            <div className="flex items-center gap-3">
              <Link
                href={`/${toggleLang}/news`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-200 dark:hover:bg-white/10 transition-all duration-200"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                </svg>
                {toggleLangText}
              </Link>
            </div>
          </div>
        </div>

        {/* Hero section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
          <div className="max-w-3xl">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-slate-900 dark:text-white tracking-tight mb-6 leading-none">
              {lang === 'de' ? 'Industrial News' : 'Industrial News'}
            </h1>
            <p className="text-xl sm:text-2xl text-slate-600 dark:text-slate-400 leading-relaxed">
              {lang === 'de'
                ? 'Aktuelle Updates und Insights aus der industriellen Automatisierung.'
                : 'Fresh updates and insights from industrial automation.'}
            </p>
          </div>
        </section>

        {/* Articles - Client component with view toggle */}
        <section className="pt-8">
          <NewsClient articles={articles} lang={lang} />
        </section>
      </main>
    </>
  );
}
