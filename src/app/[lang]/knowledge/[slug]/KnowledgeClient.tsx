'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { User } from '@supabase/supabase-js';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import 'katex/dist/katex.min.css';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

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
  conversation_id?: string | null;
};

type RelatedQuestion = {
  id: string;
  question: string;
  slug: string;
  similarity: number;
};

type FollowUpQuestion = {
  id: string;
  question: string;
  answer: string;
  created_at: string;
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
  followUpQuestions: FollowUpQuestion[];
  relatedQuestions: RelatedQuestion[];
  initialComments: Comment[];
  initialVotes: { up: number; down: number };
  initialUserVote: 'up' | 'down' | null;
  lang: string;
  user: User | null; // User data from server
};

export default function KnowledgeClient({ question, followUpQuestions, relatedQuestions, initialComments, initialVotes, initialUserVote, lang, user }: KnowledgeClientProps) {
  const [comments, setComments] = useState<Comment[]>(initialComments || []);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [commentError, setCommentError] = useState<string | null>(null);

  // Voting state initialized from props - only track upvotes now
  const [upvotes, setUpvotes] = useState<number>(initialVotes.up);
  const [hasUserUpvoted, setHasUserUpvoted] = useState<boolean>(initialUserVote === 'up');
  const [isVoting, setIsVoting] = useState(false);

  const formMountTime = useRef<number>(Date.now());

  useEffect(() => {
    formMountTime.current = Date.now();
  }, []);

  // Translation helper function
  const t = (en: string, de: string) => lang === 'de' ? de : en;

  const handleUpvote = async () => {
    setIsVoting(true);
    try {
      const res = await fetch('/api/votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId: question.id }),
      });
      if (res.ok) {
        const data = await res.json();
        setUpvotes(data.upvotes || 0);
        setHasUserUpvoted(data.hasUserUpvoted || false);
      }
    } catch (e) {
      console.error('Error voting:', e); // Add logging for voting errors
    } finally {
      setIsVoting(false);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmitting) return;
    if (newComment.length > 1000) {
      setCommentError(lang === 'de' ? 'Maximal 1000 Zeichen erlaubt.' : 'Maximum 1000 characters allowed.');
      return;
    }
    const now = Date.now();
    const delta = now - formMountTime.current;
    if (delta < 3000) {
      setError('Please wait at least 3 seconds before submitting your comment.');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    setCommentError(null);
    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: question.id,
          content: newComment,
          submitDeltaMs: delta,
        }),
      });
      console.log('Comment API response:', response);
      if (!response.ok) {
        let errorMsg = 'Failed to post comment';
        try {
          const errorData = await response.json();
          errorMsg = errorData.error || errorMsg;
        } catch {
          errorMsg = 'Failed to post comment (invalid response)';
        }
        throw new Error(errorMsg);
      }
      const newCommentData = await response.json();
      setComments(prev => [...prev, newCommentData]);
      setNewComment('');
    } catch (err) {
      const anError = err as Error;
      console.error('Error posting comment:', anError);
      setError(anError.message);
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
                {t("Back to Knowledge Base", "Zurück zur Wissensdatenbank")}
              </Link>
              <div className="flex items-center gap-4">
                <Link
                  href={`/${lang}/chat`}
                  className="inline-flex items-center bg-blue-600 text-white rounded px-4 py-2 hover:bg-blue-700 transition-colors"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  {t("Ask a Question", "Frage stellen")}
              </Link>
              {question.status === 'draft' && (
                <span className="px-3 py-1 text-sm font-medium text-yellow-800 bg-yellow-100 rounded-full">
                    {t("Draft", "Entwurf")}
                </span>
              )}
              </div>
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-4">{question.header || question.question}</h1>

            {/* Show the original question asked */}
            <div className="mb-4">
              <span className="block text-gray-500 text-sm mb-1">{t("Question asked:", "Gestellte Frage:")}</span>
              <div className="text-lg font-semibold text-gray-800">{question.question}</div>
            </div>

            {/* Pronounced Answer Segment */}
            <div className="relative my-8 p-4 sm:p-6 rounded-2xl bg-gradient-to-br from-blue-50 via-white to-indigo-50 border-2 border-blue-200 shadow-xl">
              <span className="absolute -top-4 left-4 bg-blue-600 text-white text-xs font-semibold px-3 py-1 rounded-full shadow">{t('AI Answer', 'KI-Antwort')}</span>
              <div className="prose prose-lg max-w-none font-geist" style={{fontFamily: 'Geist, Inter, Arial, sans-serif'}}>
                <ReactMarkdown
                  remarkPlugins={[remarkGfm, remarkMath]}
                  rehypePlugins={[rehypeKatex]}
                  components={{
                    h1: (props) => <h1 className="font-geist font-bold text-2xl mt-4 mb-2 text-black" style={{fontFamily: 'Geist, Inter, Arial, sans-serif'}} {...props} />, 
                    h2: (props) => <h2 className="font-geist font-semibold text-xl mt-4 mb-2 text-black" style={{fontFamily: 'Geist, Inter, Arial, sans-serif'}} {...props} />, 
                    h3: (props) => <h3 className="font-geist font-medium text-lg mt-4 mb-2 text-blue-900" style={{fontFamily: 'Geist, Inter, Arial, sans-serif'}} {...props} />, 
                    strong: (props) => <strong className="font-bold text-black" {...props} />, 
                    em: (props) => <em className="italic text-black" {...props} />, 
                    p: (props) => <p className="my-3 leading-relaxed text-base text-black" {...props} />, 
                    li: (props) => <li className="sm:ml-4 ml-2 my-1 sm:pl-1 pl-0 list-inside text-black" {...props} />, 
                    ol: (props) => <ol className="list-decimal sm:ml-6 ml-2 my-2 text-black" {...props} />, 
                    ul: (props) => <ul className="list-disc sm:ml-6 ml-2 my-2 text-black" {...props} />, 
                    code: (props) => <code className="bg-slate-200 px-1 rounded text-sm font-geist text-black" style={{fontFamily: 'GeistMono, Geist, Inter, Arial, monospace'}} {...props} />, 
                    table: (props) => (
                      <div className="overflow-x-auto w-full my-4">
                        <table className="min-w-max" {...props} />
                      </div>
                    ),
                    thead: (props) => <thead className="bg-blue-100 text-blue-900 font-semibold" {...props} />, 
                    tbody: (props) => <tbody {...props} />, 
                    th: (props) => <th className="px-4 py-2 border-b border-blue-200 text-left" {...props} />, 
                    tr: (props) => <tr className="even:bg-blue-50" {...props} />, 
                    td: (props) => <td className="px-4 py-2 border-b border-blue-100 text-black align-top" {...props} />, 
                  }}
                >
                  {question.answer}
                </ReactMarkdown>
              </div>
            </div>

            {/* Ask Follow-up Button */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <Link
                href={`/${lang}/chat?prefill_question=${encodeURIComponent(question.question)}&prefill_answer=${encodeURIComponent(question.answer)}${question.conversation_id ? `&conversation_id=${question.conversation_id}` : ''}`}
                className="inline-flex items-center bg-blue-600 text-white rounded px-4 py-2 hover:bg-blue-700 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                {t("Ask Follow-up", "Nachfrage stellen")}
              </Link>
            </div>

            {/* Voting UI */}
            <div className="mt-6 flex items-center gap-4">
              <button
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                  hasUserUpvoted 
                    ? 'bg-green-100 border-green-400 text-green-700 hover:bg-green-200' 
                    : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
                }`}
                disabled={isVoting}
                onClick={handleUpvote}
              >
                <span className="text-lg">👍</span>
                <span className="font-medium">{upvotes}</span>
                <span className="text-sm">
                  {upvotes === 1 ? t('upvote', 'Upvote') : t('upvotes', 'Upvotes')}
                </span>
              </button>
            </div>

            <div className="mt-8 pt-8 border-t">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">{t("Details", "Details")}</h2>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {question.manufacturer && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">{t("Manufacturer", "Hersteller")}</dt>
                    <dd className="mt-1 text-sm text-gray-900">{question.manufacturer}</dd>
                  </div>
                )}
                {question.part_type && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">{t("Part Type", "Teiletyp")}</dt>
                    <dd className="mt-1 text-sm text-gray-900">{question.part_type}</dd>
                  </div>
                )}
                {question.part_series && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">{t("Part Series", "Teileserie")}</dt>
                    <dd className="mt-1 text-sm text-gray-900">{question.part_series}</dd>
                  </div>
                )}
                {question.sector && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">{t("Sector", "Sektor")}</dt>
                    <dd className="mt-1 text-sm text-gray-900">{question.sector}</dd>
                  </div>
                )}
              </dl>
            </div>

            <div className="mt-8 pt-8 border-t">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">{t("Related Questions", "Ähnliche Fragen")}</h2>
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
                        {t("Similarity:", "Ähnlichkeit:")} {Math.round(related.similarity)}%
                      </p>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">{t("No related questions found.", "Keine ähnlichen Fragen gefunden.")}</p>
              )}
            </div>

            <div className="mt-8 pt-8 border-t">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">{t("Comments", "Kommentare")}</h2>
              {!user ? (
                <div className="text-center mb-8 p-6 bg-gray-50 rounded-lg shadow-inner">
                  <p className="text-gray-700 text-lg mb-4">{t("Sign in to share your thoughts!", "Melden Sie sich an, um Ihre Gedanken zu teilen!")}</p>
                  <Link
                    href={`/${lang}/login`}
                    className="inline-block px-8 py-3 bg-indigo-600 text-white rounded-lg shadow-lg hover:bg-indigo-700 transition-colors duration-200 text-lg font-semibold transform hover:scale-105"
                  >
                    {t("Please sign in to leave a comment.", "Bitte melden Sie sich an, um einen Kommentar zu hinterlassen.")}
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleCommentSubmit} className="mb-6">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder={t('Add a comment...', 'Kommentar hinzufügen...')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base resize-none"
                    rows={3}
                    maxLength={1000}
                  />
                  <button
                    type="submit"
                    disabled={isSubmitting || !newComment.trim()}
                    className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? t('Posting...', 'Wird gepostet...') : t('Post Comment', 'Kommentar posten')}
                  </button>
                </form>
              )}

              {error && <div className="text-red-600 mb-2">{error}</div>}
              {commentError && <div className="text-red-600 mb-2">{commentError}</div>}
              <div className="space-y-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">{comment.user_name ? comment.user_name : t('User', 'Benutzer')}</span>
                      <span className="text-sm text-gray-500">
                        {new Date(comment.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-gray-700">{comment.content}</p>
                  </div>
                ))}
                {comments.length === 0 && <p className="text-gray-500">{t("No comments yet.", "Noch keine Kommentare.")}</p>}
              </div>
            </div>

            {/* Follow-up Questions */}
            {followUpQuestions.length > 0 && (
              <div className="mt-8 pt-8 border-t border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">{t("Follow-up Questions", "Nachfragen")}</h2>
                <div className="space-y-8">
                  {followUpQuestions.map((followUp, index) => (
                    <div key={followUp.id} className="bg-gray-50 rounded-lg p-6">
                      <div className="mb-4">
                        <span className="block text-gray-500 text-sm mb-1">{t("Follow-up", "Nachfrage")} #{index + 1}</span>
                        <div className="text-lg font-semibold text-gray-800">{followUp.question}</div>
                      </div>
                      <div className="prose prose-sm max-w-none">
                        {followUp.answer.split('\n').map((paragraph, pIndex) => (
                          <p key={pIndex} className="mb-3 text-gray-700">{paragraph}</p>
                        ))}
                      </div>
                      <div className="mt-4 text-xs text-gray-500">
                        {new Date(followUp.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Disclaimer */}
            <div className="mt-10 text-center">
              <span className="text-xs text-gray-500 opacity-70">
                This answer was generated automatically. Please verify with official documentation where necessary.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 