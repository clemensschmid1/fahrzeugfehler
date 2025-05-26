'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
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

interface RelatedQuestion {
  id: string;
  question: string;
  slug: string;
  similarity: number;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
}

interface VoteStats {
  upvotes: number;
  downvotes: number;
  userVote: boolean | null;
}

export default function KnowledgePage() {
  const params = useParams();
  const slug = params.slug as string;
  const lang = params.lang as string;

  const [question, setQuestion] = useState<Question | null>(null);
  const [relatedQuestions, setRelatedQuestions] = useState<RelatedQuestion[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [usernamesMap, setUsernamesMap] = useState<{[key: string]: string}>({});
  const [voteStats, setVoteStats] = useState<VoteStats | null>(null);
  const [isVoting, setIsVoting] = useState(false);
  const supabase = createClientComponentClient();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user || null);
      } catch (error) {
        console.log('Auth check failed:', error);
        setUser(null);
      }
    };

    fetchUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    const fetchQuestion = async () => {
      try {
        // First try to get the question with draft status
        let { data, error } = await supabase
          .from('questions')
          .select('*')
          .eq('slug', slug)
          .eq('language_path', lang)
          .eq('status', 'draft')
          .maybeSingle();

        // If no draft question found, try to get a live question
        if (!data) {
          const { data: liveData, error: liveError } = await supabase
            .from('questions')
            .select('*')
            .eq('slug', slug)
            .eq('language_path', lang)
            .eq('status', 'live')
            .maybeSingle();
          
          data = liveData;
          error = liveError;
        }

        if (error) {
          console.error('Error fetching question:', error);
          setError(error.message);
          return;
        }

        if (!data) {
          console.error('No question found for slug:', slug);
          setError('Question not found');
          return;
        }

        setQuestion(data);

        // Fetch related questions
        const { data: relatedData, error: relatedError } = await supabase
          .rpc('match_questions', {
            query_embedding: data.embedding,
            match_threshold: 0.5,
            match_count: 7
          });

        if (relatedError) {
          console.error('Error fetching related questions:', relatedError);
          return;
        }

        // Filter out the current question and limit to 6
        const filteredRelatedQuestions = (relatedData || [])
          .filter((q: RelatedQuestion) => q.id !== data.id)
          .slice(0, 6);

        setRelatedQuestions(filteredRelatedQuestions);

        // Fetch comments
        const response = await fetch(`/api/comments?questionId=${data.id}&status=live`);
        if (!response.ok) throw new Error('Failed to fetch comments');
        const commentsData: Comment[] = await response.json();
        setComments(commentsData);

        // Fetch usernames for unique user_ids in comments
        const uniqueUserIds = Array.from(new Set(commentsData.map(comment => comment.user_id).filter(Boolean)));
        if (uniqueUserIds.length > 0) {
          try {
            const usernamesResponse = await fetch('/api/users/usernames', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userIds: uniqueUserIds }),
            });

            if (!usernamesResponse.ok) {
              console.error('Failed to fetch usernames');
            } else {
              const fetchedUsernamesMap = await usernamesResponse.json();
              setUsernamesMap(fetchedUsernamesMap);
            }
          } catch (usernameFetchError) {
            console.error('Error fetching usernames:', usernameFetchError);
          }
        }

      } catch (err: any) {
        console.error('Error in fetchQuestion:', err);
        setError(err.message);
      }
    };

    if (slug && lang) {
      fetchQuestion();
    }
  }, [slug, lang, supabase]);

  // Add new useEffect for fetching votes
  useEffect(() => {
    const fetchVotes = async () => {
      if (!question?.id) return;
      
      try {
        const response = await fetch(`/api/votes?questionId=${question.id}`);
        if (!response.ok) throw new Error('Failed to fetch votes');
        const data = await response.json();
        setVoteStats(data);
      } catch (err) {
        console.error('Error fetching votes:', err);
      }
    };

    fetchVotes();
  }, [question?.id]);

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError('Please sign in to comment');
      return;
    }
    if (!newComment.trim()) {
      setError('Comment content cannot be empty.');
      return;
    }
    if (!question?.id) {
      setError('Cannot post comment: Question ID not available.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          questionId: question.id,
          content: newComment.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to post comment');
      }

      const newCommentData = await response.json();
      setComments([newCommentData, ...comments]);
      setNewComment('');
    } catch (err: any) {
      console.error('Error posting comment:', err);
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVote = async (voteType: boolean) => {
    if (!question?.id || !user) return;
    
    setIsVoting(true);
    try {
      const response = await fetch('/api/votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: question.id,
          voteType
        })
      });

      if (!response.ok) throw new Error('Failed to submit vote');
      const data = await response.json();
      setVoteStats(data);
    } catch (err) {
      console.error('Error submitting vote:', err);
      setError('Failed to submit vote');
    } finally {
      setIsVoting(false);
    }
  };

  // Generate structured data for the page
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: question?.question,
    description: question?.answer,
    datePublished: question?.created_at,
    author: {
      '@type': 'Organization',
      name: 'Industrial AI Support'
    },
    publisher: {
      '@type': 'Organization',
      name: 'Industrial AI Support',
      logo: {
        '@type': 'ImageObject',
        url: 'https://your-domain.com/logo.png'
      }
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://your-domain.com/${lang}/knowledge/${slug}`
    },
    about: {
      '@type': 'Thing',
      name: question?.part_type || 'Industrial Equipment',
      manufacturer: {
        '@type': 'Organization',
        name: question?.manufacturer || 'Various Manufacturers'
      }
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
                {question?.header || question?.question || 'Knowledge Entry'}
              </h1>
              <span className="inline-block bg-indigo-100 text-indigo-700 text-xs font-semibold px-3 py-1 rounded-full shadow-sm">Knowledge Entry</span>
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
              <Link
                href={`/${lang}/knowledge`}
                className="inline-flex items-center text-indigo-600 hover:text-indigo-800"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Knowledge Base
              </Link>
            </div>
          </nav>

          {error ? (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
              <strong className="font-bold">Error: </strong>
              <span className="block sm:inline">{error}</span>
            </div>
          ) : question ? (
            <>
              <main className="bg-white rounded-2xl shadow-xl p-8 mb-8">
                <div className="prose prose-lg max-w-none">
                  <div className="mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Question</h2>
                    <p className="text-gray-800 text-lg">{question.question}</p>
                  </div>

                  <div className="mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Answer</h2>
                    <div className="text-gray-800 text-lg whitespace-pre-wrap">{question.answer}</div>
                  </div>

                  {/* Metadata Section */}
                  <div className="bg-gray-50 rounded-xl p-6 mb-8">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Details</h3>
                    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {question.manufacturer && (
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Manufacturer</dt>
                          <dd className="mt-1 text-sm text-gray-900">{question.manufacturer}</dd>
                        </div>
                      )}
                      {question.part_type && (
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Part Type</dt>
                          <dd className="mt-1 text-sm text-gray-900">{question.part_type}</dd>
                        </div>
                      )}
                      {question.part_series && (
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Part Series</dt>
                          <dd className="mt-1 text-sm text-gray-900">{question.part_series}</dd>
                        </div>
                      )}
                      {question.sector && (
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Sector</dt>
                          <dd className="mt-1 text-sm text-gray-900">{question.sector}</dd>
                        </div>
                      )}
                    </dl>
                  </div>

                  {/* Voting Section */}
                  <div className="flex items-center space-x-4 mb-8">
                    <button
                      onClick={() => handleVote(true)}
                      disabled={isVoting || !user}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
                        voteStats?.userVote === true
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                      } transition-colors`}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                      <span>{voteStats?.upvotes || 0}</span>
                    </button>
                    <button
                      onClick={() => handleVote(false)}
                      disabled={isVoting || !user}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
                        voteStats?.userVote === false
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                      } transition-colors`}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                      <span>{voteStats?.downvotes || 0}</span>
                    </button>
                  </div>

                  {/* Related Questions Section */}
                  <section className="mb-10" aria-labelledby="related-heading">
                    <h2 id="related-heading" className="text-lg text-indigo-700 font-semibold mb-4">Related Questions</h2>
                    {relatedQuestions.length > 0 ? (
                      <div className="space-y-4">
                        {relatedQuestions.map((related) => (
                          <Link
                            key={related.id}
                            href={`/${lang}/knowledge/${related.slug}`}
                            className="block p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors border border-gray-200"
                          >
                            <div className="flex items-center justify-between gap-4">
                              <h3 className="text-lg font-medium text-gray-900 flex-grow">{related.question}</h3>
                              <div className="flex items-center gap-3 flex-shrink-0">
                                <span className="text-sm font-semibold text-gray-700">
                                  {Math.round(related.similarity * 100)}%
                                </span>
                                <div className="w-24 bg-gray-200 rounded-full h-2.5 overflow-hidden">
                                  <div
                                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-600"
                                    style={{ width: `${Math.round(related.similarity * 100)}%` }}
                                  >
                                  </div>
                                </div>
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <div className="text-gray-500 ml-2">
                        {question?.status === 'draft' ? (
                          'Related questions will appear here once this entry is published.'
                        ) : (
                          'No related questions found.'
                        )}
                      </div>
                    )}
                  </section>

                  {/* Comments Section */}
                  <section className="mt-12 border-t pt-8 bg-white p-6 rounded-lg shadow-xl">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-4">Comments</h2>

                    {user ? (
                      <form onSubmit={handleCommentSubmit} className="mb-8 p-6 bg-gray-50 rounded-lg shadow-inner">
                        <textarea
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          placeholder="Add a comment..."
                          className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700"
                          rows={4}
                        />
                        <div className="mt-4 flex justify-end">
                          <button
                            type="submit"
                            disabled={isSubmitting || !newComment.trim()}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-base font-semibold transition-colors duration-200"
                          >
                            {isSubmitting ? 'Posting...' : 'Post Comment'}
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div className="text-center mb-8 p-6 bg-gray-50 rounded-lg shadow-inner">
                        <p className="text-gray-700 text-lg mb-4">Sign in to share your thoughts!</p>
                        <Link
                          href="/login"
                          className="inline-block px-8 py-3 bg-indigo-600 text-white rounded-lg shadow-lg hover:bg-indigo-700 transition-colors duration-200 text-lg font-semibold transform hover:scale-105"
                        >
                          Please sign in to leave a comment.
                        </Link>
                      </div>
                    )}

                    {error && (
                      <div className="mb-6 p-4 bg-red-100 text-red-800 border border-red-200 rounded-lg">
                        {error}
                      </div>
                    )}

                    <div className="space-y-4">
                      {comments.map((comment) => (
                        <div key={comment.id} className="bg-white p-5 rounded-lg shadow border border-gray-200">
                          <div className="flex items-center justify-between mb-2">
                            <div className="font-semibold text-gray-900">
                              {usernamesMap[comment.user_id] || 'Anonymous'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {new Date(comment.created_at).toLocaleDateString()} at {new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                          <p className="text-gray-800 mt-2">{comment.content}</p>
                        </div>
                      ))}
                      {comments.length === 0 && (
                        <div className="text-gray-600 text-center py-8 bg-white rounded-lg shadow border border-gray-100">
                          No comments yet. Be the first to comment!
                        </div>
                      )}
                    </div>
                  </section>
                </div>
              </main>
            </>
          ) : (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading...</p>
            </div>
          )}
        </div>
      </article>
    </>
  );
} 