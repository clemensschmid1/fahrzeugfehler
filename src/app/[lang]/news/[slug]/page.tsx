import { notFound } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import { newsArticles } from '@/content/news';

function estimateReadingTime(content: string): number {
  const wordsPerMinute = 200;
  const words = content.split(/\s+/).length;
  return Math.ceil(words / wordsPerMinute);
}

function formatDate(dateString: string, lang: 'en' | 'de'): string {
  const date = new Date(dateString);
  return date.toLocaleDateString(lang === 'de' ? 'de-DE' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default async function NewsArticlePage({ params }: { params: Promise<{ lang: 'en' | 'de'; slug: string }> }) {
  const { lang, slug } = await params;
  const article = newsArticles.find(a => a.lang === lang && a.slug === slug);
  if (!article) return notFound();

  const toggleLang = lang === 'en' ? 'de' : 'en';
  const toggleLangText = lang === 'en' ? 'Deutsch' : 'English';

  // Find corresponding article in other language by matching title (simplified - in production use a mapping)
  const slugMap: Record<string, Record<string, string>> = {
    'welcome-to-fault-based-news': { de: 'willkommen-bei-fault-based-news' },
    'willkommen-bei-fault-based-news': { en: 'welcome-to-fault-based-news' },
    'ethercat-vs-profinet-industrial-protocols': { de: 'ethercat-vs-profinet-industrieprotokolle' },
    'ethercat-vs-profinet-industrieprotokolle': { en: 'ethercat-vs-profinet-industrial-protocols' },
  };
  
  const otherLangSlug = slugMap[slug]?.[toggleLang];
  const otherLangArticle = otherLangSlug 
    ? newsArticles.find(a => a.lang === toggleLang && a.slug === otherLangSlug)
    : undefined;
  const readingTime = estimateReadingTime(article.content);

  return (
    <>
      <Header />
      <main className="min-h-screen bg-white dark:bg-slate-950">
        {/* Top bar */}
        <div className="sticky top-0 z-30 bg-white dark:bg-slate-950 backdrop-blur-xl border-b border-slate-200 dark:border-white/5 shadow-sm">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
            <Link
              href={`/${lang}/news`}
              className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              {lang === 'de' ? 'Zurück zur Übersicht' : 'Back to News'}
            </Link>
            <div className="flex items-center gap-4">
              {otherLangArticle && (
                <Link
                  href={`/${toggleLang}/news/${otherLangArticle.slug}`}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-200 dark:hover:bg-white/10 transition-all duration-200"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                  </svg>
                  {toggleLangText}
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Article content */}
        <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          {/* Header */}
          <header className="mb-12">
            {/* Meta information */}
            <div className="flex items-center gap-4 text-sm font-medium text-slate-500 dark:text-slate-400 mb-8">
              <time dateTime={article.publishedAt}>
                {formatDate(article.publishedAt, lang)}
              </time>
              <span>•</span>
              <span>{readingTime} {lang === 'de' ? 'Min' : 'min'} {lang === 'de' ? 'Lesezeit' : 'read'}</span>
              {article.author && (
                <>
                  <span>•</span>
                  <span>{article.author}</span>
                </>
              )}
            </div>

            {/* Title */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-slate-900 dark:text-white tracking-tight leading-none mb-6">
              {article.title}
            </h1>

            {/* Tags */}
            {article.tags && article.tags.length > 0 && (
              <div className="flex flex-wrap gap-3">
                {article.tags.map(tag => (
                  <span
                    key={tag}
                    className="px-4 py-1.5 rounded-full bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 text-sm font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </header>

          {/* Content */}
          <div className="prose prose-lg prose-slate dark:prose-invert max-w-none">
            <div className="text-lg sm:text-xl leading-relaxed text-slate-700 dark:text-slate-300 space-y-6">
              {article.content.split('\n\n').map((para, i) => (
                <p key={i} className="leading-relaxed">
                  {para}
                </p>
              ))}
            </div>
          </div>

          {/* Footer */}
          <footer className="mt-16 pt-12 border-t border-slate-200 dark:border-white/5">
            <div className="flex items-center justify-between">
              <Link
                href={`/${lang}/news`}
                className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                {lang === 'de' ? 'Zurück zur Übersicht' : 'Back to News'}
              </Link>
              {otherLangArticle && (
                <Link
                  href={`/${toggleLang}/news/${otherLangArticle.slug}`}
                  className="inline-flex items-center gap-2 text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
                >
                  {lang === 'de' ? 'Auf Englisch lesen' : 'Read in German'}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                  </svg>
                </Link>
              )}
            </div>
          </footer>
        </article>
      </main>
    </>
  );
}
