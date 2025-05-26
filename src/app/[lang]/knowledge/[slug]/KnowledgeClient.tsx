'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

type Question = {
  id: string;
  question: string;
  answer: string;
  header?: string;
  manufacturer?: string;
  part_type?: string;
  part_series?: string;
  sector?: string;
  status?: string;
  language_path: string;
};

type RelatedQuestion = {
  id: string;
  question: string;
  slug: string;
  similarity: number;
};

type Comment = {
  id: string;
  content: string;
  created_at: string;
  user_id?: string;
  user_name?: string;
};

type KnowledgeClientProps = {
  question: Question;
  relatedQuestions: RelatedQuestion[];
  comments: Comment[];
  lang: string;
  slug: string;
};

export default function KnowledgeClient({ question, relatedQuestions, comments: initialComments, lang, slug }: KnowledgeClientProps) {
  const [comments, setComments] = useState<Comment[]>(initialComments || []);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Voting state
  const [votes, setVotes] = useState<{ up: number; down: number }>({ up: 0, down: 0 });
  const [userVote, setUserVote] = useState<'up' | 'down' | null>(null);
  const [isVoting, setIsVoting] = useState(false);

  useEffect(() => {
    // Fetch votes and user vote
    const fetchVotes = async () => {
      try {
        const res = await fetch(`/api/votes?questionId=${question.id}`);
        if (res.ok) {
          const data = await res.json();
          setVotes({ up: data.up || 0, down: data.down || 0 });
          setUserVote(data.userVote || null);
        }
      } catch (e) {
        // ignore
      }
    };
    fetchVotes();
  }, [question.id]);

  const handleVote = async (voteType: 'up' | 'down') => {
    setIsVoting(true);
    try {
      const res = await fetch('/api/votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId: question.id, voteType }),
      });
      if (res.ok) {
        const data = await res.json();
        setVotes({ up: data.up || 0, down: data.down || 0 });
        setUserVote(data.userVote || null);
      }
    } catch (e) {
      // ignore
    } finally {
      setIsVoting(false);
    }
  };

  const totalVotes = votes.up + votes.down;
  const positivePercent = totalVotes > 0 ? Math.round((votes.up / totalVotes) * 100) : 0;

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmitting) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: question.id,
          content: newComment,
        }),
      });
      if (!response.ok) throw new Error('Failed to post comment');
      const newCommentData = await response.json();
      setComments(prev => [...prev, newCommentData]);
      setNewComment('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

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

            {/* Show the original question asked */}
            <div className="mb-4">
              <span className="block text-gray-500 text-sm mb-1">Question asked:</span>
              <div className="text-lg font-semibold text-gray-800">{question.question}</div>
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-4">{question.header || question.question}</h1>
            <div className="prose prose-lg max-w-none">
              {question.answer.split('\n').map((paragraph, index) => (
                <p key={index} className="mb-4">{paragraph}</p>
              ))}
            </div>

            {/* Voting UI */}
            <div className="mt-6 flex items-center gap-4">
              <button
                className={`px-3 py-1 rounded text-lg border ${userVote === 'up' ? 'bg-green-200 border-green-400' : 'bg-gray-100 border-gray-300'}`}
                disabled={isVoting}
                onClick={() => handleVote('up')}
              >
                👍 {votes.up}
              </button>
              <button
                className={`px-3 py-1 rounded text-lg border ${userVote === 'down' ? 'bg-red-200 border-red-400' : 'bg-gray-100 border-gray-300'}`}
                disabled={isVoting}
                onClick={() => handleVote('down')}
              >
                👎 {votes.down}
              </button>
              <span className="ml-2 text-sm text-gray-600">
                {totalVotes > 0 ? `${positivePercent}% positive` : 'No votes yet'}
              </span>
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
              {error && <div className="text-red-600 mb-2">{error}</div>}
              <div className="space-y-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">{comment.user_name || 'User'}</span>
                      <span className="text-sm text-gray-500">
                        {new Date(comment.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-gray-700">{comment.content}</p>
                  </div>
                ))}
                {comments.length === 0 && <p className="text-gray-500">No comments yet.</p>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 