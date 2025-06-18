import { createServerClient } from '@supabase/ssr';
import { cookies as getCookies } from 'next/headers';
import { notFound } from 'next/navigation';
import KnowledgeClient from './KnowledgeClient';
import type { Database } from '@/lib/database.types';
import type { Metadata } from 'next';
import BackButton from './BackButton';

// Types
type Params = { slug: string; lang: string };

type Question = Omit<Database['public']['Tables']['questions']['Row'], 'status'> & {
  embedding?: number[] | null;
  conversation_id: string | null;
  parent_id: string | null;
  meta_description?: string | null;
  status: 'Draft' | 'Published';
  sector?: string;
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
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 py-8 px-2 sm:px-4 lg:px-0">
      <div className="max-w-3xl mx-auto flex flex-col gap-8">
        {/* Top Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-2">
          <div className="flex gap-2">
            <BackButton lang={lang} />
            <a
              href={`/${lang}/chat`}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              {lang === 'de' ? 'Frage stellen' : 'Ask a Question'}
            </a>
          </div>
        </div>

        {/* Main Question Card */}
        <section className="bg-white rounded-2xl shadow-xl border border-slate-100 p-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight break-words">
              {question.header || question.question}
            </h1>
            <div className="flex flex-wrap gap-2 mt-1">
              {question.status === 'Draft' && (
                <span className="inline-block bg-yellow-100 text-yellow-800 text-xs font-medium px-3 py-1 rounded-full">{lang === 'de' ? 'Entwurf' : 'Draft'}</span>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-1 mt-4">
            <span className="text-lg text-slate-700 font-semibold">
              {lang === 'de' ? 'Gestellte Frage:' : 'Question asked:'}
            </span>
            <span className="text-lg font-bold text-slate-800 break-words">{question.question}</span>
          </div>
        </section>

        {/* Answer Section */}
        <section className="bg-slate-50 rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col gap-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-800 mb-3">{lang === 'de' ? 'Antwort' : 'Answer'}</h2>
            <div className="prose prose-lg max-w-none text-slate-800">
              {question.answer.split('\n').map((paragraph, idx) => (
                <p key={idx} className="mb-4 leading-relaxed">{paragraph}</p>
              ))}
            </div>
          </div>
          {/* Upvote Button (moved here) */}
          <div className="flex items-center gap-3 mt-2">
            <button
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors text-base font-medium ${
                initialUserVote === 'up'
                  ? 'bg-green-100 border-green-400 text-green-700 hover:bg-green-200'
                  : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
              }`}
              disabled={!user}
              // onClick logic handled in KnowledgeClient
            >
              <span className="text-lg">👍</span>
              <span className="font-semibold">{initialVotes.up}</span>
              <span className="text-sm">{initialVotes.up === 1 ? (lang === 'de' ? 'Upvote' : 'upvote') : (lang === 'de' ? 'Upvotes' : 'upvotes')}</span>
            </button>
            {!user && (
              <span className="text-xs text-slate-400">{lang === 'de' ? 'Anmelden zum Upvoten' : 'Sign in to upvote'}</span>
            )}
          </div>
          {/* Ask Follow-up Button (directly under answer) */}
          <div className="mt-4">
            <a
              href={`/${lang}/chat?prefill_question=${encodeURIComponent(question.question)}&prefill_answer=${encodeURIComponent(question.answer)}${question.conversation_id ? `&conversation_id=${question.conversation_id}` : ''}`}
              className="inline-flex items-center px-5 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              {lang === 'de' ? 'Nachfrage stellen' : 'Ask Follow-up'}
            </a>
          </div>
        </section>

        {/* Details Section */}
        {(question.manufacturer || question.part_type || question.part_series || question.sector) && (
          <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">{lang === 'de' ? 'Details' : 'Details'}</h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {question.manufacturer && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">{lang === 'de' ? 'Hersteller' : 'Manufacturer'}</dt>
                  <dd className="mt-1 text-sm text-gray-900">{question.manufacturer}</dd>
                </div>
              )}
              {question.part_type && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">{lang === 'de' ? 'Teiletyp' : 'Part Type'}</dt>
                  <dd className="mt-1 text-sm text-gray-900">{question.part_type}</dd>
                </div>
              )}
              {question.part_series && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">{lang === 'de' ? 'Teileserie' : 'Part Series'}</dt>
                  <dd className="mt-1 text-sm text-gray-900">{question.part_series}</dd>
                </div>
              )}
              {question.sector && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">{lang === 'de' ? 'Sektor' : 'Sector'}</dt>
                  <dd className="mt-1 text-sm text-gray-900">{question.sector}</dd>
                </div>
              )}
            </dl>
          </section>
        )}

        {/* Follow-up Questions Section */}
        {followUpQuestions.length > 0 && (
          <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">{lang === 'de' ? 'Nachfragen' : 'Follow-up Questions'}</h2>
            <div className="flex flex-col gap-6">
              {followUpQuestions.map((followUp, idx) => (
                <div key={followUp.id} className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-slate-500">{lang === 'de' ? 'Nachfrage' : 'Follow-up'} #{idx + 1}</span>
                    <span className="text-sm font-medium text-slate-700">{followUp.question}</span>
                  </div>
                  <div className="prose prose-sm text-slate-700">
                    {followUp.answer.split('\n').map((p, i) => (
                      <p key={i} className="mb-2">{p}</p>
                    ))}
                  </div>
                  <div className="mt-2 text-xs text-slate-400">{new Date(followUp.created_at).toLocaleDateString()}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Related Questions Section */}
        <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">{lang === 'de' ? 'Ähnliche Fragen' : 'Related Questions'}</h2>
          {relatedQuestions.length > 0 ? (
            <div className="flex flex-col gap-3">
              {relatedQuestions.map((related) => (
                <a
                  key={related.id}
                  href={`/${question.language_path}/knowledge/${related.slug}`}
                  className="block px-4 py-3 rounded-lg border border-slate-100 bg-slate-50 hover:bg-blue-50 transition-colors text-slate-800"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-base line-clamp-1">{related.question}</span>
                    <span className="text-xs text-slate-500">{lang === 'de' ? 'Ähnlichkeit' : 'Similarity'}: {Math.round(related.similarity)}%</span>
                  </div>
                </a>
              ))}
            </div>
          ) : (
            <p className="text-slate-400 text-sm">{lang === 'de' ? 'Keine ähnlichen Fragen gefunden.' : 'No related questions found.'}</p>
          )}
        </section>

        {/* Comments Section */}
        <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">{lang === 'de' ? 'Kommentare' : 'Comments'}</h2>
          {user ? (
            <form className="mb-6 flex flex-col gap-3">
              <textarea
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                rows={3}
                placeholder={lang === 'de' ? 'Kommentar hinzufügen...' : 'Add a comment...'}
                // value, onChange, onSubmit handled in KnowledgeClient
              />
              <button
                type="submit"
                className="self-end px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                // disabled, loading handled in KnowledgeClient
              >
                {lang === 'de' ? 'Kommentar posten' : 'Post Comment'}
              </button>
            </form>
          ) : (
            <div className="text-center mb-6 p-6 bg-slate-50 rounded-lg border border-slate-100">
              <p className="text-slate-700 text-base mb-2">{lang === 'de' ? 'Melden Sie sich an, um einen Kommentar zu hinterlassen.' : 'Please sign in to leave a comment.'}</p>
              <a
                href={`/${lang}/login`}
                className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {lang === 'de' ? 'Anmelden' : 'Sign In'}
              </a>
            </div>
          )}
          <div className="space-y-4">
            {comments && comments.length > 0 ? (
              comments.map((comment: Comment) => (
                <div key={comment.id} className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-slate-900">{(comment as { user_name?: string }).user_name ? (comment as { user_name?: string }).user_name : (lang === 'de' ? 'Benutzer' : 'User')}</span>
                    <span className="text-xs text-slate-500">{new Date(comment.created_at).toLocaleDateString()}</span>
                  </div>
                  <p className="text-slate-700 text-base">{comment.content}</p>
                </div>
              ))
            ) : (
              <p className="text-slate-400 text-sm">{lang === 'de' ? 'Noch keine Kommentare.' : 'No comments yet.'}</p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
