'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

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
          .order('created_at', { ascending: false });

        // If no draft questions found, try to get live questions
        if (!data || data.length === 0) {
          const { data: liveData, error: liveError } = await supabase
            .from('questions')
            .select('*')
            .eq('language_path', lang)
            .eq('status', 'live')
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

  // Generate structured data for the page
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Knowledge Base',
    description: 'A collection of industrial knowledge and answers',
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

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <article className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <nav className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4" aria-label="Page navigation">
            <header>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 leading-tight">
                Knowledge Base
              </h1>
              <span className="inline-block bg-indigo-100 text-indigo-700 text-xs font-semibold px-3 py-1 rounded-full shadow-sm">Knowledge Base</span>
            </header>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href={`/${lang}/chat`}
                className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                Ask a Question
              </Link>
            </div>
          </nav>

          {error ? (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
              <strong className="font-bold">Error: </strong>
              <span className="block sm:inline">{error}</span>
            </div>
          ) : loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading...</p>
            </div>
          ) : questions.length > 0 ? (
            <div className="space-y-4">
              {questions.map((question) => (
                <Link
                  key={question.id}
                  href={`/${lang}/knowledge/${question.slug}`}
                  className="block p-6 bg-white rounded-xl hover:bg-gray-50 transition-colors border border-gray-200"
                >
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">{question.header || question.question}</h2>
                  <p className="text-gray-600 line-clamp-2">{question.answer}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
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
          ) : (
            <div className="text-center py-12 bg-white rounded-xl shadow-lg">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">No Knowledge Entries Found</h2>
              <p className="text-gray-600 mb-6">Be the first to contribute to our knowledge base!</p>
              <Link
                href={`/${lang}/chat`}
                className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                Ask a Question
              </Link>
            </div>
          )}
        </div>
      </article>
    </>
  );
} 