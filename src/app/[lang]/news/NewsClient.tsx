'use client';

import Link from 'next/link';
import { useState } from 'react';
import { NewsArticle } from '@/content/news';

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

function getPreviewText(content: string, maxLength: number = 300): string {
  const text = content.replace(/\n\n/g, ' ').replace(/\*\*/g, '').trim();
  if (text.length <= maxLength) return text;
  const truncated = text.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  return truncated.substring(0, lastSpace) + '...';
}

interface NewsClientProps {
  articles: NewsArticle[];
  lang: 'en' | 'de';
}

export default function NewsClient({ articles, lang }: NewsClientProps) {
  const [viewMode, setViewMode] = useState<'feed' | 'grid'>('feed');

  return (
    <>
      {/* View toggle */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 flex items-center justify-between">
        <div className="text-sm font-medium text-slate-600 dark:text-slate-400">
          {articles.length} {lang === 'de' ? 'Artikel' : articles.length === 1 ? 'article' : 'articles'}
        </div>
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-white/5 rounded-full p-1.5 border border-slate-200 dark:border-white/10">
          <button
            onClick={() => setViewMode('feed')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
              viewMode === 'feed'
                ? 'bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              {lang === 'de' ? 'Feed' : 'Feed'}
            </span>
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
              viewMode === 'grid'
                ? 'bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              {lang === 'de' ? 'Raster' : 'Grid'}
            </span>
          </button>
        </div>
      </div>

      {/* Articles */}
      {articles.length === 0 ? (
        <div className="text-center py-24">
          <p className="text-slate-500 dark:text-slate-400 text-lg">
            {lang === 'de' ? 'Keine Artikel verfügbar.' : 'No articles available.'}
          </p>
        </div>
      ) : viewMode === 'feed' ? (
        /* Feed View - Single Column */
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 pb-24">
          {articles.map((article) => {
            const readingTime = estimateReadingTime(article.content);
            const previewText = getPreviewText(article.content, 350);
            return (
              <Link
                key={article.slug}
                href={`/${lang}/news/${article.slug}`}
                className="group block"
              >
                <article className="bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-300 dark:border-white/5 p-8 sm:p-10 hover:border-slate-400 dark:hover:border-white/10 hover:shadow-xl transition-all duration-300">
                  {/* Meta information */}
                  <div className="flex items-center gap-4 text-xs font-medium text-slate-500 dark:text-slate-400 mb-5">
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
                  <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white mb-4 leading-tight group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                    {article.title}
                  </h2>

                  {/* Excerpt */}
                  <p className="text-lg sm:text-xl text-slate-700 dark:text-slate-300 mb-5 leading-relaxed font-medium">
                    {article.excerpt}
                  </p>

                  {/* Preview text */}
                  <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 leading-relaxed mb-8 line-clamp-4">
                    {previewText}
                  </p>

                  {/* Tags and read more */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-6 border-t border-slate-200 dark:border-white/5">
                    {article.tags && article.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {article.tags.map(tag => (
                          <span
                            key={tag}
                            className="px-3 py-1.5 rounded-full bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 text-xs font-medium border border-slate-200 dark:border-white/10"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    <span className="text-sm font-semibold text-red-600 dark:text-red-400 group-hover:translate-x-1 inline-flex items-center gap-2 transition-transform">
                      {lang === 'de' ? 'Weiterlesen' : 'Read article'}
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                  </div>
                </article>
              </Link>
            );
          })}
        </div>
      ) : (
        /* Grid View - 3 Columns */
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {articles.map((article) => {
              const readingTime = estimateReadingTime(article.content);
              return (
                <Link
                  key={article.slug}
                  href={`/${lang}/news/${article.slug}`}
                  className="group block"
                >
                  <article className="h-full flex flex-col bg-white dark:bg-slate-900/50 rounded-3xl border border-slate-300 dark:border-white/5 p-8 hover:border-slate-400 dark:hover:border-white/10 hover:shadow-xl transition-all duration-300">
                    {/* Date and reading time */}
                    <div className="flex items-center gap-4 text-xs font-medium text-slate-500 dark:text-slate-400 mb-6">
                      <time dateTime={article.publishedAt}>
                        {formatDate(article.publishedAt, lang)}
                      </time>
                      <span>•</span>
                      <span>{readingTime} {lang === 'de' ? 'Min' : 'min'} {lang === 'de' ? 'Lesezeit' : 'read'}</span>
                    </div>

                    {/* Title */}
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4 leading-tight group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                      {article.title}
                    </h2>

                    {/* Excerpt */}
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-6 flex-grow line-clamp-3">
                      {article.excerpt}
                    </p>

                    {/* Tags and read more */}
                    <div className="flex items-center justify-between mt-auto pt-6 border-t border-slate-100 dark:border-white/5">
                      {article.tags && article.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {article.tags.slice(0, 2).map(tag => (
                            <span
                              key={tag}
                              className="px-3 py-1 rounded-full bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 text-xs font-medium"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      <span className="text-sm font-semibold text-red-600 dark:text-red-400 group-hover:translate-x-1 inline-block transition-transform">
                        {lang === 'de' ? 'Lesen' : 'Read'} →
                      </span>
                    </div>
                  </article>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}

