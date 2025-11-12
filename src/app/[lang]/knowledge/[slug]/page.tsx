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
  user_id?: string;
  user_name?: string | null;
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
    .from('questions2')
    .select('header, question, answer, meta_description, created_at, last_updated')
    .eq('slug', slug)
    .eq('language_path', lang)
    .eq('status', 'draft')
    .maybeSingle();

  if (draft) {
    questionData = draft;
  } else {
    // Try published
    const { data: published } = await supabase
      .from('questions2')
      .select('header, question, answer, meta_description, created_at, last_updated')
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

  // Generate JSON-LD structured data with author information
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "QAPage",
    "mainEntity": {
      "@type": "Question",
      "name": questionData?.question,
      "text": questionData?.question,
      "dateCreated": questionData?.created_at || new Date().toISOString(),
      "author": {
        "@type": "Organization",
        "name": "FAULTBASE",
        "url": "https://faultbase.com"
      },
      "acceptedAnswer": {
        "@type": "Answer",
        "text": questionData?.answer,
        "dateCreated": questionData?.created_at || new Date().toISOString(),
        "author": {
          "@type": "Organization",
          "name": "FAULTBASE Editorial Team",
          "url": "https://faultbase.com"
        }
      }
    },
    "publisher": {
      "@type": "Organization",
      "name": "FAULTBASE",
      "url": "https://faultbase.com",
      "logo": {
        "@type": "ImageObject",
        "url": "https://faultbase.com/logo.png"
      }
    },
    "datePublished": questionData?.created_at || new Date().toISOString(),
    "dateModified": (questionData as any)?.last_updated || questionData?.created_at || new Date().toISOString()
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
      'article:modified_time': questionData?.last_updated || questionData?.created_at || new Date().toISOString(),
      'article:author': 'FAULTBASE Editorial Team',
      'article:publisher': 'FAULTBASE',
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
      .from('questions2')
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
  // Fetch ALL comments for this question (matching profile page query style)
  // Then fetch usernames separately to avoid JOIN issues
  const commentsResult = await supabase
    .from('comments')
    .select('*')
    .eq('question_id', question.id)
    .order('created_at', { ascending: false }); // Newest first
  
  // Log if there's an error or if comments exist
  if (commentsResult.error) {
    console.error('Error fetching comments:', commentsResult.error);
  } else {
    console.log(`Found ${commentsResult.data?.length || 0} comments for question ${question.id}`);
  }
  
  // Fetch usernames for all comment user_ids
  const userIds = commentsResult.data?.map(c => c.user_id).filter(Boolean) || [];
  let usernamesMap: Record<string, string | null> = {};
  
  if (userIds.length > 0) {
    const uniqueUserIds = [...new Set(userIds)];
    const profilesResult = await supabase
      .from('profiles')
      .select('id, username')
      .in('id', uniqueUserIds);
    
    if (profilesResult.data) {
      profilesResult.data.forEach(profile => {
        usernamesMap[profile.id] = profile.username || null;
      });
    }
  }
  
  // 🔥 OPTIMIZATION: Fetch follow-up and related questions in parallel
  const [followUpResult, relatedResult] = await Promise.allSettled([
    // Follow-up questions - ONLY show if they have the same conversation_id AND are not main questions
    question.conversation_id ? 
      supabase
        .from('questions2')
        .select('id, question, answer, created_at, conversation_id, is_main')
        .eq('conversation_id', question.conversation_id)
        .eq('language_path', lang)
        .eq('status', 'live')
        .neq('id', question.id)
        .eq('is_main', false) // Only show actual follow-ups, not main questions
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

  // Process follow-up questions - ensure they're in the same conversation and properly ordered
  let followUpQuestions: FollowUpQuestion[] = [];
  if (followUpResult.status === 'fulfilled' && followUpResult.value.data && question.conversation_id) {
    // Double-check that all follow-ups have the same conversation_id and filter out any that don't
    const validFollowUps = (followUpResult.value.data as any[])
      .filter((q: any) => q.conversation_id === question.conversation_id && q.is_main === false)
      .sort((a: any, b: any) => {
        // Sort by created_at ascending to show in chronological order
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        return dateA - dateB;
      })
      .map((q: any) => ({
        id: q.id,
        question: q.question,
        answer: q.answer,
        created_at: q.created_at,
      }));
    followUpQuestions = validFollowUps;
  }

  // Process related questions
  let relatedQuestions: RelatedQuestion[] = [];
  if (relatedResult.status === 'fulfilled' && relatedResult.value.data) {
    relatedQuestions = (relatedResult.value.data as RelatedQuestion[])
      .filter((q) => q.id !== question.id)
      .slice(0, 6);
  }

  // Process comments - exclude only 'binned' status
  // This includes: 'live', NULL (old comments), and any other status except 'binned'
  let comments: Comment[] = [];
  if (commentsResult.data) {
    comments = (commentsResult.data as any[])
      .filter(c => c.status !== 'binned') // Filter out only binned comments
      .map(c => ({
        id: c.id,
        content: c.content,
        created_at: c.created_at,
        user_id: c.user_id,
        user_name: usernamesMap[c.user_id] || null,
      }));
  }
  
  console.log(`Processed ${comments.length} comments (filtered from ${commentsResult.data?.length || 0} total)`);

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
