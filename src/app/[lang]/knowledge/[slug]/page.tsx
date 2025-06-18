import { createServerClient } from '@supabase/ssr';
import { cookies as getCookies } from 'next/headers';
import { notFound } from 'next/navigation';
import KnowledgeClient from './KnowledgeClient';
import type { Database } from '@/lib/database.types';
import type { Metadata } from 'next';

// Types
type Params = { slug: string; lang: string };

type Question = Omit<Database['public']['Tables']['questions']['Row'], 'status'> & {
  embedding?: number[] | null;
  conversation_id: string | null;
  parent_id: string | null;
  meta_description?: string | null;
  status: 'Draft' | 'Published';
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

type Vote = {
  vote_type: boolean;
  user_id: string;
};

type Comment = Database['public']['Tables']['comments']['Row'];

export const dynamic = 'force-dynamic';

// ✅ Fix: async param support
export async function generateMetadata({ params }: { params: Promise<Params>; }): Promise<Metadata> {
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
    ? `${questionData.header} | Solution & Analysis | Infoneva`
    : `${decodeURIComponent(slug)} | Infoneva`;

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

export default async function KnowledgePage({ params }: { params: Promise<Params>; }) {
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

  // Get the current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError) {
    console.error('Error fetching user:', userError);
  }

  // 🔍 Try Draft
  const { data: draft, error: draftError } = await supabase
    .from('questions')
    .select('*')
    .eq('slug', slug)
    .eq('language_path', lang) // ✅ korrektes Feld
    .eq('status', 'draft')
    .maybeSingle();

  if (draftError) {
    console.error('Error fetching draft:', draftError);
    return notFound();
  }

  let question: Question | null = draft as Question | null;

  if (!question) {
    const { data: published, error: publishedError } = await supabase
      .from('questions')
      .select('*')
      .eq('slug', slug)
      .eq('language_path', lang) // ✅ korrektes Feld
      .eq('status', 'live')
      .maybeSingle();

    if (publishedError) {
      console.error('Error fetching published question:', publishedError);
      return notFound();
    }

    question = published as Question | null;
  }

  if (!question) return notFound();

  // 🔄 Follow-up Questions
  let followUpQuestions: FollowUpQuestion[] = [];
  if (question.conversation_id) {
    const { data: followUpData, error: followUpError } = await supabase
      .from('questions')
      .select('id, question, answer, created_at')
      .eq('conversation_id', question.conversation_id)
      .eq('language_path', lang)
      .eq('status', 'live')
      .neq('id', question.id)
      .order('created_at', { ascending: true });

    if (followUpError) {
      console.error('Error fetching follow-up questions:', followUpError);
    } else if (followUpData) {
      followUpQuestions = followUpData as FollowUpQuestion[];
    }
  }

  // 🔁 Related Questions
  let relatedQuestions: RelatedQuestion[] = [];
  if (question.embedding) {
    const { data: relatedData, error: relatedError } = await supabase.rpc('match_questions', {
      query_embedding: question.embedding,
      match_threshold: 0.5,
      match_count: 7,
    });

    if (!relatedError && relatedData) {
      // Filter the results to only include questions with the same language and status='live'
      const filteredRelatedData = relatedData.filter((q: any) => 
        q.language_path === lang && 
        q.status === 'live' &&
        q.id !== question.id
      );

      relatedQuestions = filteredRelatedData
        .filter((q: unknown): q is RelatedQuestion => {
          if (
            typeof q === 'object' &&
            q !== null &&
            'id' in q &&
            'slug' in q &&
            'question' in q &&
            'similarity' in q
          ) {
            const r = q as Record<string, unknown>;
            return (
              typeof r.id === 'string' &&
              typeof r.slug === 'string' &&
              typeof r.question === 'string' &&
              typeof r.similarity === 'number'
            );
          }
          return false;
        })
        .slice(0, 6);
    }
  }

  // 💬 Comments
  const { data: comments, error: commentsError } = await supabase
    .from('comments')
    .select('*')
    .eq('question_id', question.id)
    .order('created_at', { ascending: true });

  if (commentsError) {
    console.error('Error fetching comments:', commentsError);
  }

  // 👍 Votes
  const { data: votesData, error: votesError } = await supabase
    .from('votes')
    .select('vote_type, user_id')
    .eq('question_id', question.id)
    .eq('vote_type', true); // Only count upvotes

  const votes: Vote[] = votesData ?? [];

  if (votesError) {
    console.error('Error fetching votes:', votesError);
  }

  const upvotes = votes.length;
  const initialVotes = { up: upvotes, down: 0 }; // No downvotes

  let initialUserVote: 'up' | 'down' | null = null;
  if (user) {
    const userVoteData = votes.find(v => v.user_id === user.id);
    if (userVoteData) {
      initialUserVote = 'up'; // Only upvotes exist now
    }
  }

  return (
    <KnowledgeClient
      question={question}
      followUpQuestions={followUpQuestions}
      relatedQuestions={relatedQuestions}
      initialComments={comments ?? []}
      initialVotes={initialVotes}
      initialUserVote={initialUserVote}
      lang={lang}
      slug={slug}
      user={user}
    />
  );
}
