import { createServerClient } from '@supabase/ssr';
import { cookies as getCookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import KnowledgeClient from './KnowledgeClient';
import type { Database } from '@/lib/database.types';
import type { Metadata } from 'next';
import Header from '@/components/Header';

// Types
type Question = Omit<Database['public']['Tables']['questions']['Row'], 'status'> & {
  embedding?: number[] | null;
  conversation_id: string | null;
  parent_id: string | null;
  meta_description?: string | null;
  status: 'Draft' | 'Published';
  sector?: string;
  is_main?: boolean;
  ip_address?: string;
};

type FollowUpQuestion = {
  id: string;
  question: string;
  answer: string;
  created_at: string;
};

type RelatedQuestion = {
  id: string;
  slug: string;
  question: string;
  similarity: number;
};

type Comment = {
  id: string;
  question_id: string;
  content: string;
  created_at: string;
  // Add other fields as needed based on your DB schema
};

export const dynamic = 'force-dynamic';
export const revalidate = 600;

// Helper to return 410 Gone
function gone(): never {
  // This will throw and stop rendering, similar to notFound()
  throw new Response('410 Gone', { status: 410 });
}

// ✅ Fix: async param support
export async function generateMetadata({ params }: { params: Promise<{ slug: string; lang: string }> }): Promise<Metadata> {
  const { slug, lang } = await params;
  
  const cookieStore = await getCookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );

  // Try to fetch the question to get metadata
  let questionData: { header?: string; question?: string; answer?: string; meta_description?: string; created_at?: string } | null = null;
  
  // Try Draft first
  const { data: draft } = await supabase
    .from('questions')
    .select('header, question, answer, meta_description, created_at')
    .eq('slug', slug)
    .eq('language_path', lang)
    .eq('status', 'draft')
    .maybeSingle();

  if (draft) {
    questionData = draft;
  } else {
    // Try published
    const { data: published } = await supabase
      .from('questions')
      .select('header, question, answer, meta_description, created_at')
      .eq('slug', slug)
      .eq('language_path', lang)
      .eq('status', 'live')
      .maybeSingle();

    if (published) {
      questionData = published;
    }
  }

  // Generate title
  const title = questionData?.header 
    ? `${questionData.header} | Solution & Analysis`
    : decodeURIComponent(slug);

  // Generate description
  let description = '';
  if (questionData?.meta_description) {
    description = questionData.meta_description;
  } else if (questionData?.answer) {
    // Truncate answer to ~150 characters without cutting words mid-way
    const cleanAnswer = questionData.answer.replace(/\s+/g, ' ').trim();
    if (cleanAnswer.length <= 150) {
      description = cleanAnswer;
    } else {
      const truncated = cleanAnswer.substring(0, 150);
      const lastSpace = truncated.lastIndexOf(' ');
      description = lastSpace > 0 ? truncated.substring(0, lastSpace) + '...' : truncated + '...';
    }
  }

  // Generate canonical URL
  const canonicalUrl = `https://infoneva.com/${lang}/knowledge/${slug}`;

  // Extract keywords from question
  const extractKeywords = (text: string): string => {
    if (!text) return '';
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 4)
      .filter((word, index, arr) => arr.indexOf(word) === index) // deduplicate
      .slice(0, 8); // limit to 8 keywords
    return words.join(', ');
  };

  const keywords = extractKeywords(questionData?.question || questionData?.header || '');

  // Generate JSON-LD structured data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "QAPage",
    "mainEntity": {
      "@type": "Question",
      "name": questionData?.question,
      "text": questionData?.question,
      "dateCreated": questionData?.created_at || new Date().toISOString(),
      "acceptedAnswer": {
        "@type": "Answer",
        "text": questionData?.answer,
        "dateCreated": questionData?.created_at || new Date().toISOString()
      }
    }
  };

  return {
    title: title,
    description: description,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        'en': `https://infoneva.com/en/knowledge/${slug}`,
        'de': `https://infoneva.com/de/knowledge/${slug}`,
      },
    },
    other: {
      'og:type': 'article',
      'og:title': title,
      'og:description': description,
      'og:url': canonicalUrl,
      'og:site_name': 'Infoneva',
      'article:published_time': questionData?.created_at || new Date().toISOString(),
      'article:author': 'Infoneva',
      'keywords': keywords,
      'json-ld': JSON.stringify(jsonLd),
    },
  };
}

export default async function KnowledgeSlugPage({ params }: { params: Promise<{ lang: string; slug: string }> }) {
  const { lang, slug } = await params;

  const cookieStore = await getCookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );

  // 🔥 OPTIMIZATION: Parallel data fetching for better performance
  const [
    removedResult,
    userResult,
    questionResult,
  ] = await Promise.allSettled([
    // Check removed_slugs first
    supabase
      .from('removed_slugs')
      .select('id')
      .eq('slug', slug)
      .eq('language', lang)
      .maybeSingle(),
    
    // Get the current user (non-blocking)
    supabase.auth.getUser().catch(() => ({ data: { user: null }, error: null })),
    
    // Get the question (draft or published)
    supabase
      .from('questions')
      .select('*')
      .eq('slug', slug)
      .eq('language_path', lang)
      .in('status', ['draft', 'live'])
      .eq('is_main', true)
      .maybeSingle(),
  ]);

  // Handle removed slug
  if (removedResult.status === 'fulfilled' && removedResult.value.data) {
    return gone();
  }

  // Handle user (non-blocking)
  let user = null;
  if (userResult.status === 'fulfilled' && userResult.value.data?.user) {
    user = userResult.value.data.user;
  }

  // Handle question
  if (questionResult.status === 'rejected' || !questionResult.value.data) {
    return notFound();
  }

  const question = questionResult.value.data as Question;
  
  // 🔥 OPTIMIZATION: Fetch comments only after we have the question ID
  const commentsResult = await supabase
    .from('comments')
    .select('*')
    .eq('question_id', question.id)
    .order('created_at', { ascending: true });
  
  // 🔥 OPTIMIZATION: Fetch follow-up and related questions in parallel
  const [followUpResult, relatedResult] = await Promise.allSettled([
    // Follow-up questions
    question.conversation_id ? 
      supabase
        .from('questions')
        .select('id, question, answer, created_at')
        .eq('conversation_id', question.conversation_id)
        .eq('language_path', lang)
        .eq('status', 'live')
        .neq('id', question.id)
        .order('created_at', { ascending: true }) : 
      Promise.resolve({ data: [], error: null }),
    
    // Related questions (only if embedding exists)
    question.embedding ? 
      supabase.rpc('match_questions', {
        query_embedding: question.embedding,
        match_count: 7,
        target_language: lang,
      }) : 
      Promise.resolve({ data: [], error: null })
  ]);

  // Process follow-up questions
  let followUpQuestions: FollowUpQuestion[] = [];
  if (followUpResult.status === 'fulfilled' && followUpResult.value.data) {
    followUpQuestions = followUpResult.value.data as FollowUpQuestion[];
  }

  // Process related questions
  let relatedQuestions: RelatedQuestion[] = [];
  if (relatedResult.status === 'fulfilled' && relatedResult.value.data) {
    relatedQuestions = (relatedResult.value.data as RelatedQuestion[])
      .filter((q) => q.id !== question.id)
      .slice(0, 6);
  }

  // Process comments (filter by question_id)
  let comments: Comment[] = [];
  if (commentsResult.data) {
    comments = commentsResult.data;
  }

  // Pass all data to the client component
  return (
    <>
      <Header />
      <Suspense fallback={
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
              <div className="space-y-4">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                <div className="h-4 bg-gray-200 rounded w-4/6"></div>
              </div>
            </div>
          </div>
        </div>
      }>
        <KnowledgeClient
          question={question}
          followUpQuestions={followUpQuestions}
          relatedQuestions={relatedQuestions}
          initialComments={comments || []}
          lang={lang}
          user={user}
        />
      </Suspense>
    </>
  );
}
