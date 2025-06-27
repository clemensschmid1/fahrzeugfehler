'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

// Keep the same Question interface
interface Question {
  id: string;
  question: string;
  answer: string;
  sector: string;
  created_at: string;
  slug: string;
  status: 'draft' | 'live' | 'bin';
  header?: string;
  manufacturer?: string;
  part_type?: string;
  part_series?: string;
  embedding?: number[];
  language_path: string;
}

interface KnowledgeClientProps {
  initialQuestions: Question[];
}

export default function KnowledgeClient({ initialQuestions }: KnowledgeClientProps) {
  const params = useParams();
  const lang = params.lang as string;

  const [questions] = useState<Question[]>(initialQuestions.filter(q => q.slug && q.slug !== 'NULL'));
  const [filteredQuestions, setFilteredQuestions] = useState<Question[]>(questions);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter questions based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredQuestions(questions);
    } else {
      const filtered = questions.filter(question => {
        const title = (question.header || question.question).toLowerCase();
        const query = searchQuery.toLowerCase();
        return title.includes(query);
      });
      setFilteredQuestions(filtered);
    }
  }, [searchQuery, questions]);

  const toggleLanguage = lang === 'en' ? 'de' : 'en';
  const toggleLanguageText = lang === 'en' ? 'Deutsch' : 'English';

  const t = (en: string, de: string) => lang === 'de' ? de : en;

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4" aria-label={t("Page navigation", "Seitennavigation")}>
        <header>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 leading-tight">
            {t("Knowledge Base", "Wissensdatenbank")}
          </h1>
          <span className="inline-block bg-indigo-100 text-indigo-700 text-xs font-semibold px-3 py-1 rounded-full shadow-sm">{t("Knowledge Base", "Wissensdatenbank")}</span>
        </header>
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href={`/${lang}`}
            className="inline-flex items-center px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
             <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
            {t("Home", "Startseite")}
          </Link>
          <Link
            href={`/${toggleLanguage}/knowledge`}
            className="inline-flex items-center px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
             <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                </svg>
            {toggleLanguageText}
          </Link>
          <Link
            href={`/${lang}/chat`}
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
            {t("Ask a Question", "Frage stellen")}
          </Link>
        </div>
      </div>

      <div className="mb-8">
        <div className="relative max-w-md mx-auto sm:mx-0 flex items-center">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder={t("Search topics...", "Themen durchsuchen...")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
          <span className="ml-3 inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-indigo-600 text-white" title="Live knowledge pages">
            {questions.filter(q => q.status === 'live').length}
          </span>
        </div>
        {searchQuery && (
          <p className="mt-2 text-sm text-gray-600">
            {t(
              `Found ${filteredQuestions.length} result${filteredQuestions.length !== 1 ? 's' : ''}`,
              `${filteredQuestions.length} Ergebnis${filteredQuestions.length !== 1 ? 'se' : ''} gefunden`
            )}
          </p>
        )}
      </div>

      {filteredQuestions.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredQuestions.map((question) => (
            <Link
              key={question.id}
              href={`/${lang}/knowledge/${question.slug}`}
              className="block p-6 bg-white rounded-xl hover:bg-gray-50 transition-all duration-200 border border-gray-200 hover:shadow-lg hover:border-indigo-300"
            >
               <div className="flex items-start justify-between mb-3">
                    <h2 className="text-lg font-semibold text-gray-900 line-clamp-2 leading-tight">
                      {question.header || question.question}
                    </h2>
                    <svg className="w-5 h-5 text-gray-400 flex-shrink-0 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
              <p className="text-gray-600 text-sm line-clamp-3 mb-4 leading-relaxed">
                {question.answer}
              </p>
              <div className="flex flex-wrap gap-2">
                {question.sector && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {question.sector}
                  </span>
                )}
                {question.manufacturer && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {question.manufacturer}
                  </span>
                )}
                {question.part_type && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    {question.part_type}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      ) : searchQuery ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-lg">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">{t("No Results Found", "Keine Ergebnisse gefunden")}</h2>
          <p className="text-gray-600 mb-6">{t("Try adjusting your search terms or browse all topics.", "Versuchen Sie Ihre Suchbegriffe anzupassen oder durchsuchen Sie alle Themen.")}</p>
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-xl shadow-lg">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">{t("No topics available", "Keine Themen verfügbar")}</h2>
          <p className="text-gray-600">{t("There are currently no topics available in this language.", "In dieser Sprache sind derzeit keine Themen verfügbar.")}</p>
        </div>
      )}
    </>
  );
} 