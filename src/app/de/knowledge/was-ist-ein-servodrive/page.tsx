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
  user_name: string;
}

export default function KnowledgePage() {
  const params = useParams();
  const slug = params.slug as string;

  const [question, setQuestion] = useState<Question | null>(null);
  const [relatedQuestions, setRelatedQuestions] = useState<RelatedQuestion[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchQuestion = async () => {
      try {
        // First try to get the question with draft status
        let { data, error } = await supabase
          .from('questions')
          .select('*')
          .eq('slug', slug)
          .eq('status', 'draft')
          .maybeSingle();

        // If no draft question found, try to get a live question
        if (!data) {
          const { data: liveData, error: liveError } = await supabase
            .from('questions')
            .select('*')
            .eq('slug', slug)
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
        const response = await fetch(`/api/comments?questionId=${data.id}`);
        if (!response.ok) throw new Error('Failed to fetch comments');
        const commentsData: Comment[] = await response.json();
        setComments(commentsData);
      } catch (err: any) {
        console.error('Error in fetchQuestion:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchQuestion();
    }
  }, [slug]);

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          questionId: question?.id,
          content: newComment,
        }),
      });

      if (!response.ok) throw new Error('Failed to post comment');

      const newCommentData = await response.json();
      setComments(prev => [...prev, newCommentData]);
      setNewComment('');
    } catch (err: any) {
      console.error('Error posting comment:', err);
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-600">Error: {error}</div>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Question not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-xl rounded-2xl overflow-hidden">
          <div className="p-8">
            <div className="flex items-center justify-between mb-6">
              <Link 
                href={`/${question.language_path}/knowledge`}
                className="text-blue-600 hover:text-blue-800 flex items-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Knowledge Base
              </Link>
              {question.status === 'draft' && (
                <span className="px-3 py-1 text-sm font-medium text-yellow-800 bg-yellow-100 rounded-full">
                  Draft
                </span>
              )}
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-4">{question.header || question.question}</h1>
            
            <div className="prose prose-lg max-w-none">
              {question.answer.split('\n').map((paragraph, index) => (
                <p key={index} className="mb-4">{paragraph}</p>
              ))}
            </div>

            <div className="mt-8 pt-8 border-t">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Details</h2>
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

            <div className="mt-8 pt-8 border-t">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Related Questions</h2>
              {relatedQuestions.length > 0 ? (
                <div className="space-y-4">
                  {relatedQuestions.map((related) => (
                    <Link
                      key={related.id}
                      href={`/${question.language_path}/knowledge/${related.slug}`}
                      className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <h3 className="text-lg font-medium text-gray-900">{related.question}</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        Similarity: {Math.round(related.similarity * 100)}%
                      </p>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No related questions found.</p>
              )}
            </div>

            <div className="mt-8 pt-8 border-t">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Comments</h2>
              <form onSubmit={handleCommentSubmit} className="mb-6">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={4}
                />
                <button
                  type="submit"
                  disabled={isSubmitting || !newComment.trim()}
                  className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Posting...' : 'Post Comment'}
                </button>
              </form>

              <div className="space-y-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">{comment.user_name}</span>
                      <span className="text-sm text-gray-500">
                        {new Date(comment.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-gray-700">{comment.content}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}