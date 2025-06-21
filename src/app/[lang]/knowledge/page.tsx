'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { sanitizeAnswer } from '@/lib/sanitize';

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

export default function KnowledgePage() {
  const params = useParams();
  const lang = params.lang as string;

  const [questions, setQuestions] = useState<Question[]>([]);
  const [filteredQuestions, setFilteredQuestions] = useState<Question[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        // First try to get draft questions
        let { data, error } = await supabase
          .from('questions')
          .select('*')
          .eq('language_path', lang)
          .eq('status', 'draft')
          .eq('is_main', true)
          .order('created_at', { ascending: false });

        // If no draft questions found, try to get live questions
        if (!data || data.length === 0) {
          const { data: liveData, error: liveError } = await supabase
            .from('questions')
            .select('*')
            .eq('language_path', lang)
            .eq('status', 'live')
            .eq('is_main', true)
            .order('created_at', { ascending: false });
          
          data = liveData;
          error = liveError;
        }

        if (error) {
          console.error('Error fetching questions:', error);
          setError(error.message);
          return;
        }

        setQuestions(data || []);
        setFilteredQuestions(data || []);
      } catch (err: any) {
        console.error('Error in fetchQuestions:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (lang) {
      fetchQuestions();
    }
  }, [lang]);

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

  // Generate structured data for the page
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: lang === 'de' ? 'Wissensdatenbank' : 'Knowledge Base',
    description: lang === 'de' ? 'Eine Sammlung von industriellem Wissen und Antworten' : 'A collection of industrial knowledge and answers',
    url: `https://your-domain.com/${lang}/knowledge`,
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: questions.map((question, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'Article',
          headline: question.question,
          description: question.answer,
          url: `https://your-domain.com/${lang}/knowledge/${question.slug}`
        }
      }))
    }
  };

  const toggleLanguage = lang === 'en' ? 'de' : 'en';
  const toggleLanguageText = lang === 'en' ? 'Deutsch' : 'English';

  // Translation helper function
  const t = (en: string, de: string) => lang === 'de' ? de : en;

  return (
    <>
      <script type="application/ld+json">
        {sanitizeAnswer(JSON.stringify(structuredData))}
      </script>
      <article className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Header with Language Toggle */}
          <nav className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4" aria-label={t("Page navigation", "Seitennavigation")}>
            <header>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 leading-tight">
                {t("Knowledge Base", "Wissensdatenbank")}
              </h1>
              <span className="inline-block bg-indigo-100 text-indigo-700 text-xs font-semibold px-3 py-1 rounded-full shadow-sm">{t("Knowledge Base", "Wissensdatenbank")}</span>
            </header>
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Home Button */}
              <Link
                href={`/${lang}`}
                className="inline-flex items-center px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                {t("Home", "Startseite")}
              </Link>
              {/* Language Toggle Button */}
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
          </nav>

          {/* Search Bar */}
          <div className="mb-8">
            <div className="relative max-w-md mx-auto sm:mx-0">
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

          {error ? (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
              <strong className="font-bold">{t("Error:", "Fehler:")} </strong>
              <span className="block sm:inline">{error}</span>
            </div>
          ) : loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-4 text-gray-600">{t("Loading...", "Lädt...")}</p>
            </div>
          ) : filteredQuestions.length > 0 ? (
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
              <button
                onClick={() => setSearchQuery('')}
                className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                {t("Clear Search", "Suche löschen")}
              </button>
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-xl shadow-lg">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">{t("No Knowledge Entries Found", "Keine Wissenseinträge gefunden")}</h2>
              <p className="text-gray-600 mb-6">{t("Be the first to contribute to our knowledge base!", "Seien Sie der Erste, der zu unserer Wissensdatenbank beiträgt!")}</p>
              <Link
                href={`/${lang}/chat`}
                className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                {t("Ask a Question", "Frage stellen")}
              </Link>
            </div>
          )}
        </div>
      </article>
    </>
  );
} 