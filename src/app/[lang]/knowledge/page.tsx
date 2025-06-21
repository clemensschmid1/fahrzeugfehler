import { createServerClient } from '@supabase/ssr';
import { cookies as getCookies } from 'next/headers';
import type { Metadata } from 'next';
import KnowledgeClient from './KnowledgeClient';

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

type Params = { lang: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { lang } = await params;
  const siteUrl = 'https://infoneva.com';

  const title = lang === 'de'
    ? 'Wissensdatenbank | Infoneva'
    : 'Knowledge Base | Infoneva';
  
  const description = lang === 'de'
    ? 'Durchsuchen Sie unsere Sammlung von technischen Artikeln, Lösungen und Anleitungen für die industrielle Automatisierung.'
    : 'Browse our collection of technical articles, solutions, and guides for industrial automation.';

  const canonicalUrl = `${siteUrl}/${lang}/knowledge`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        'en': `${siteUrl}/en/knowledge`,
        'de': `${siteUrl}/de/knowledge`,
      },
    },
    other: {
        'og:title': title,
        'og:description': description,
        'og:url': canonicalUrl,
    }
  };
}

export default async function KnowledgePage({ params }: { params: Promise<Params> }) {
  const { lang } = await params;
  
  const cookieStore = await getCookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Ignore errors in Server Components
          }
        },
      },
    }
  );

  let questions: Question[] = [];
  let error: string | null = null;
  let loading = true;

  try {
    const { data, error: dbError } = await supabase
      .from('questions')
      .select('*')
      .eq('language_path', lang)
      .in('status', ['live', 'draft']) // Fetch both live and draft
      .eq('is_main', true)
      .order('created_at', { ascending: false });

    if (dbError) {
      console.error('Error fetching questions:', dbError);
      throw new Error(dbError.message);
    }
    
    questions = data || [];

  } catch (e) {
    const fetchErr = e as Error;
    console.error('Error in fetchQuestions:', fetchErr);
    error = fetchErr.message;
  } finally {
    loading = false;
  }
  
  const t = (en: string, de: string) => lang === 'de' ? de : en;

  // Generate structured data for the page
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: t('Knowledge Base', 'Wissensdatenbank'),
    description: t('Browse our collection of technical articles, solutions, and guides for industrial automation.', 'Durchsuchen Sie unsere Sammlung von technischen Artikeln, Lösungen und Anleitungen für die industrielle Automatisierung.'),
    url: `https://infoneva.com/${lang}/knowledge`,
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: questions.map((question, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'Article',
          headline: question.header || question.question,
          url: `https://infoneva.com/${lang}/knowledge/${question.slug}`
        }
      }))
    }
  };

  return (
    <article className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      {/* Add JSON-LD script to the page */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <div className="max-w-6xl mx-auto">
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
        ) : (
          <KnowledgeClient initialQuestions={questions} />
        )}
      </div>
    </article>
  );
} 