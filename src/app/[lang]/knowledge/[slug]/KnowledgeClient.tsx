/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useRef, useEffect, memo, useMemo } from 'react';
import Link from 'next/link';
import { User } from '@supabase/supabase-js';
import { getSupabaseClient } from '@/lib/supabase';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import 'katex/dist/katex.min.css';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { processMarkdownForLatex } from '@/lib/latex-utils';
import { visit } from 'unist-util-visit';

type Question = {
  id: string;
  slug: string; // <-- Add this line
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
  voltage?: string;
  current?: string;
  power_rating?: string;
  machine_type?: string;
  application_area?: string[];
  product_category?: string;
  electrical_type?: string;
  control_type?: string;
  relevant_standards?: string[];
  mounting_type?: string;
  cooling_method?: string;
  communication_protocols?: string[];
  manufacturer_mentions?: string[];
  risk_keywords?: string[];
  tools_involved?: string[];
  installation_context?: string;
  sensor_type?: string;
  mechanical_component?: string;
  industry_tag?: string;
  maintenance_relevance?: boolean;
  failure_mode?: string;
  software_context?: string;
  created_at: string;
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
  lang: string;
  user: User | null; // User data from server
};

const MarkdownRenderer = memo(({ content }: { content: string }) => {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkMath]}
      rehypePlugins={[[rehypeKatex, { strict: false }]]}
      components={{
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        h1: ({children, ...props}: any) => <h1 className="font-geist font-bold text-2xl mt-4 mb-2 text-slate-900 dark:text-white" style={{fontFamily: 'Geist, Inter, Arial, sans-serif'}} {...props}>{children}</h1>, 
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        h2: ({children, ...props}: any) => <h2 className="font-geist font-semibold text-xl mt-4 mb-2 text-slate-900 dark:text-white" style={{fontFamily: 'Geist, Inter, Arial, sans-serif'}} {...props}>{children}</h2>, 
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        h3: ({children, ...props}: any) => <h3 className="font-geist font-medium text-lg mt-4 mb-2 text-blue-900 dark:text-blue-300" style={{fontFamily: 'Geist, Inter, Arial, sans-serif'}} {...props}>{children}</h3>, 
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        strong: ({children, ...props}: any) => <strong className="font-bold text-slate-900 dark:text-white" {...props}>{children}</strong>, 
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        em: ({children, ...props}: any) => <em className="italic text-slate-900 dark:text-white" {...props}>{children}</em>, 
        p: ({node, children, ...props}: any) => {
          // Recursively check for any block code child (not just direct child)
          let hasBlockCode = false;
          visit(node, (n: any) => {
            if (n.tagName === 'code' && !n.properties?.inline) {
              hasBlockCode = true;
            }
          });
          if (hasBlockCode) {
            return <>{children}</>;
          }
          return <p className="my-3 leading-relaxed text-base text-slate-900 dark:text-slate-200" {...props}>{children}</p>;
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        li: ({children, ...props}: any) => <li className="sm:ml-4 ml-2 my-1 sm:pl-1 pl-0 list-inside text-slate-900 dark:text-slate-200" {...props}>{children}</li>, 
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ol: ({children, ...props}: any) => <ol className="list-decimal sm:ml-6 ml-2 my-2 text-slate-900 dark:text-slate-200" {...props}>{children}</ol>, 
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ul: ({children, ...props}: any) => <ul className="list-disc sm:ml-6 ml-2 my-2 text-slate-900 dark:text-slate-200" {...props}>{children}</ul>, 
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        code({inline, children, ...props}: any) {
          const code = String(children).replace(/\n$/, '');
          if (inline) {
            return <code className="markdown-inline-code" {...props}>{children}</code>;
          }
          const lines = code.split('\n');
          return (
            <pre className="markdown-code-block" style={{borderTop: lines.length > 8 ? '3px solid #c7d6f9' : undefined}}>
              <code>{code}</code>
            </pre>
          );
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        table: ({children, ...props}: any) => (
          <div className="markdown-table-container">
            <table className="markdown-table" {...props}>{children}</table>
          </div>
        ),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        tr: ({children, ...props}: any) => <tr {...props}>{children}</tr>, 
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        td: ({children, ...props}: any) => <td {...props}>{children}</td>, 
      } as any}
    >
      {processMarkdownForLatex(content)}
    </ReactMarkdown>
  );
});

MarkdownRenderer.displayName = 'MarkdownRenderer';

export default function KnowledgeClient({ question, followUpQuestions, relatedQuestions, initialComments, lang, user }: KnowledgeClientProps) {
  const [comments, setComments] = useState<Comment[]>(initialComments || []);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [commentError, setCommentError] = useState<string | null>(null);
  const [upvotes, setUpvotes] = useState<number>(0);
  const [downvotes, setDownvotes] = useState<number>(0);
  const [userVote, setUserVote] = useState<'up' | 'down' | null>(null);
  const [isVoting, setIsVoting] = useState<boolean>(false);

  const supabase = useMemo(() => getSupabaseClient(), []);

  const formMountTime = useRef<number>(Date.now());

  useEffect(() => {
    formMountTime.current = Date.now();
  }, []);

  // Load initial votes state
  useEffect(() => {
    let aborted = false;
    async function loadVotes() {
      try {
        const res = await fetch(`/api/votes?questionId=${encodeURIComponent(question.id)}`);
        if (!res.ok) return;
        const data = await res.json();
        if (!aborted) {
          setUpvotes(data.upvotes ?? 0);
          setDownvotes(data.downvotes ?? 0);
          setUserVote(data.userVote ?? null);
        }
      } catch {}
    }
    loadVotes();
    return () => { aborted = true; };
  }, [question.id]);

  async function handleUpvoteToggle() {
    if (isVoting) return;
    setIsVoting(true);
    try {
      const res = await fetch('/api/votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId: question.id, voteType: 'up' })
      });
      if (!res.ok) throw new Error('Failed to vote');
      const data = await res.json();
      setUpvotes(data.upvotes ?? 0);
      setDownvotes(data.downvotes ?? 0);
      setUserVote(data.userVote ?? null);
    } catch {
      // Non-blocking: ignore
    } finally {
      setIsVoting(false);
    }
  }

  async function handleDownvoteToggle() {
    if (isVoting) return;
    setIsVoting(true);
    try {
      const res = await fetch('/api/votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId: question.id, voteType: 'down' })
      });
      if (!res.ok) throw new Error('Failed to vote');
      const data = await res.json();
      setUpvotes(data.upvotes ?? 0);
      setDownvotes(data.downvotes ?? 0);
      setUserVote(data.userVote ?? null);
    } catch {
      // Non-blocking: ignore
    } finally {
      setIsVoting(false);
    }
  }

  // Translation helper function
  const t = (en: string, de: string) => lang === 'de' ? de : en;

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
      // Ensure the comment includes user_name for immediate display
      if (newCommentData && !newCommentData.user_name && user?.email) {
        // If username not provided, try to get it from profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', user.id)
          .single();
        newCommentData.user_name = profile?.username || null;
      }
      setComments(prev => [newCommentData, ...prev]); // Add to beginning for newest first
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
    <div className="min-h-screen bg-white dark:bg-slate-950 pt-24 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section - Minimalistic */}
        <div className="mb-12">
          {question.status === 'draft' && (
            <div className="mb-4">
              <span className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-full">
                {t("Draft", "Entwurf")}
              </span>
            </div>
          )}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 dark:text-white mb-6 leading-tight tracking-tight">
            {question.header || question.question}
          </h1>
          
          {/* Human Authorship Metadata */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 dark:text-slate-400 mb-4">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span>{t('Reviewed by FAULTBASE Editorial Team', 'Überprüft vom FAULTBASE Redaktionsteam')}</span>
            </div>
            <span>•</span>
            <time dateTime={question.created_at} className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>{t('Published', 'Veröffentlicht')} {new Date(question.created_at).toLocaleDateString(lang === 'de' ? 'de-DE' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </time>
            {(question as any).last_updated && new Date((question as any).last_updated).getTime() !== new Date(question.created_at).getTime() && (
              <>
                <span>•</span>
                <time dateTime={(question as any).last_updated} className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>{t('Updated', 'Aktualisiert')} {new Date((question as any).last_updated).toLocaleDateString(lang === 'de' ? 'de-DE' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </time>
              </>
            )}
            {(question as any).update_count && (question as any).update_count > 0 && (
              <>
                <span>•</span>
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{t('Regularly maintained', 'Regelmäßig gewartet')}</span>
                </span>
              </>
            )}
          </div>

          {question.header && question.header !== question.question && (
            <div className="mb-8 pt-4 border-t border-slate-200 dark:border-white/10">
              <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">{question.question}</p>
            </div>
          )}
        </div>

        {/* Answer Section - Clean and minimalistic */}
        <div className="mb-12">
          <div className="relative bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-3xl p-8 sm:p-12 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('Solution', 'Lösung')}</span>
            </div>
            <div className="prose prose-lg max-w-none dark:prose-invert" style={{fontFamily: 'Geist, Inter, Arial, sans-serif'}}>
              <MarkdownRenderer content={question.answer} />
            </div>
            <div className="mt-8 pt-6 border-t border-slate-200 dark:border-white/10 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
              <div className="flex flex-wrap items-center gap-4">
                <span>{t('Verified by industrial automation experts', 'Verifiziert von Experten für industrielle Automatisierung')}</span>
                {(question as any).reviewed_at && (
                  <span>• {t('Editorially reviewed', 'Redaktionell geprüft')}</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>{t('Quality assured', 'Qualitätsgeprüft')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Feedback Section - Minimalistic */}
        <div className="mb-12 flex items-center gap-4">
          <button
            onClick={handleUpvoteToggle}
            disabled={isVoting}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
              userVote === 'up' 
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md' 
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-white/10'
            }`}
            aria-pressed={userVote === 'up'}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
            {t('Helpful', 'Hilfreich')}
            <span className="text-xs opacity-70">({upvotes})</span>
          </button>
          <button
            onClick={handleDownvoteToggle}
            disabled={isVoting}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
              userVote === 'down' 
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md' 
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-white/10'
            }`}
            aria-pressed={userVote === 'down'}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            {t('Not helpful', 'Nicht hilfreich')}
            <span className="text-xs opacity-70">({downvotes})</span>
          </button>
        </div>

        {/* Action Button */}
        <div className="mb-12">
          <Link
            href={`/${lang}/chat?prefill_question=${encodeURIComponent(question.question)}&prefill_answer=${encodeURIComponent(question.answer)}${question.conversation_id ? `&conversation_id=${question.conversation_id}` : ''}`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-medium hover:bg-slate-800 dark:hover:bg-slate-100 transition-all duration-200 shadow-sm hover:shadow-md"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            {t("Ask Follow-up Question", "Nachfrage stellen")}
          </Link>
        </div>

        {/* Technical Details Section */}
        <div className="mb-12">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{t("Technical Details", "Technische Details")}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">{t('Click any detail to find similar solutions', 'Klicken Sie auf ein Detail, um ähnliche Lösungen zu finden')}</p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-white/10 rounded-2xl p-6 sm:p-8">
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
              {/* Render all details as clickable links to filtered knowledge page */}
              {question.manufacturer && (
                <div className="pb-4 border-b border-slate-200 dark:border-white/5 last:border-0">
                  <dt className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">{t("Manufacturer", "Hersteller")}</dt>
                  <dd className="text-base text-slate-900 dark:text-white">
                    {(() => {
                      // Handle manufacturer - could be string, array string, or array
                      let manufacturers: string[] = [];
                      if (typeof question.manufacturer === 'string') {
                        try {
                          const parsed = JSON.parse(question.manufacturer);
                          manufacturers = Array.isArray(parsed) ? parsed : [question.manufacturer];
                        } catch {
                          manufacturers = [question.manufacturer];
                        }
                      } else if (Array.isArray(question.manufacturer)) {
                        manufacturers = question.manufacturer;
                      } else {
                        manufacturers = [String(question.manufacturer)];
                      }
                      
                      return (
                        <div className="flex flex-wrap gap-2">
                          {manufacturers.map((mfg, idx) => (
                            <Link 
                              key={idx} 
                              href={`/${lang}/knowledge?manufacturer=${encodeURIComponent(mfg)}&page=1`} 
                              className="hover:text-red-600 dark:hover:text-red-400 transition-colors font-medium"
                            >
                              {mfg}
                            </Link>
                          ))}
                        </div>
                      );
                    })()}
                  </dd>
                </div>
              )}
              {question.part_type && (
                <div className="pb-4 border-b border-slate-200 dark:border-white/5 last:border-0">
                  <dt className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">{t("Part Type", "Teiletyp")}</dt>
                  <dd className="text-base text-slate-900 dark:text-white">
                    <Link href={`/${lang}/knowledge?partType=${encodeURIComponent(question.part_type)}&page=1`} className="hover:text-red-600 dark:hover:text-red-400 transition-colors font-medium">{question.part_type}</Link>
                  </dd>
                </div>
              )}
              {question.part_series && (
                <div className="pb-4 border-b border-slate-200 dark:border-white/5 last:border-0">
                  <dt className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">{t("Part Series", "Teileserie")}</dt>
                  <dd className="text-base text-slate-900 dark:text-white">
                    <Link href={`/${lang}/knowledge?part_series=${encodeURIComponent(question.part_series)}&page=1`} className="hover:text-red-600 dark:hover:text-red-400 transition-colors font-medium">{question.part_series}</Link>
                  </dd>
                </div>
              )}
              {question.sector && (
                <div className="pb-4 border-b border-slate-200 dark:border-white/5 last:border-0">
                  <dt className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">{t("Sector", "Sektor")}</dt>
                  <dd className="text-base text-slate-900 dark:text-white">
                    <Link href={`/${lang}/knowledge?sector=${encodeURIComponent(question.sector)}&page=1`} className="hover:text-red-600 dark:hover:text-red-400 transition-colors font-medium">{question.sector}</Link>
                  </dd>
                </div>
              )}
              {question.voltage && (
                <div className="pb-4 border-b border-slate-200 dark:border-white/5 last:border-0">
                  <dt className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">{t("Voltage", "Spannung")}</dt>
                  <dd className="text-base text-slate-900 dark:text-white">
                    <Link href={`/${lang}/knowledge?voltage=${encodeURIComponent(question.voltage)}&page=1`} className="hover:text-red-600 dark:hover:text-red-400 transition-colors font-medium">{question.voltage}</Link>
                  </dd>
                </div>
              )}
              {question.current && (
                <div className="pb-4 border-b border-slate-200 dark:border-white/5 last:border-0">
                  <dt className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">{t("Current", "Strom")}</dt>
                  <dd className="text-base text-slate-900 dark:text-white">
                    <Link href={`/${lang}/knowledge?current=${encodeURIComponent(question.current)}&page=1`} className="hover:text-red-600 dark:hover:text-red-400 transition-colors font-medium">{question.current}</Link>
                  </dd>
                </div>
              )}
              {question.power_rating && (
                <div className="pb-4 border-b border-slate-200 dark:border-white/5 last:border-0">
                  <dt className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">{t("Power Rating", "Leistung")}</dt>
                  <dd className="text-base text-slate-900 dark:text-white">
                    <Link href={`/${lang}/knowledge?power_rating=${encodeURIComponent(question.power_rating)}&page=1`} className="hover:text-red-600 dark:hover:text-red-400 transition-colors font-medium">{question.power_rating}</Link>
                  </dd>
                </div>
              )}
              {question.machine_type && (
                <div className="pb-4 border-b border-slate-200 dark:border-white/5 last:border-0">
                  <dt className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">{t("Machine Type", "Maschinentyp")}</dt>
                  <dd className="text-base text-slate-900 dark:text-white">
                    <Link href={`/${lang}/knowledge?machine_type=${encodeURIComponent(question.machine_type)}&page=1`} className="hover:text-red-600 dark:hover:text-red-400 transition-colors font-medium">{question.machine_type}</Link>
                  </dd>
                </div>
              )}
              {Array.isArray(question.application_area) && question.application_area.length > 0 && (
                <div className="pb-4 border-b border-slate-200 dark:border-white/5 last:border-0">
                  <dt className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">{t("Application Area", "Anwendungsbereich")}</dt>
                  <dd className="text-base text-slate-900 dark:text-white flex flex-wrap gap-2">
                    {question.application_area.map((val) => (
                      <Link key={val} href={`/${lang}/knowledge?application_area=${encodeURIComponent(val)}&page=1`} className="hover:text-red-600 dark:hover:text-red-400 transition-colors font-medium">
                        {val}
                      </Link>
                    ))}
                  </dd>
                </div>
              )}
              {!Array.isArray(question.application_area) && question.application_area && (
                <div className="pb-4 border-b border-slate-200 dark:border-white/5 last:border-0">
                  <dt className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">{t("Application Area", "Anwendungsbereich")}</dt>
                  <dd className="text-base text-slate-900 dark:text-white">
                    <Link href={`/${lang}/knowledge?application_area=${encodeURIComponent(question.application_area)}&page=1`} className="hover:text-red-600 dark:hover:text-red-400 transition-colors font-medium">
                      {question.application_area}
                    </Link>
                  </dd>
                </div>
              )}
              {question.product_category && (
                <div className="pb-4 border-b border-slate-200 dark:border-white/5 last:border-0">
                  <dt className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">{t("Product Category", "Produktkategorie")}</dt>
                  <dd className="text-base text-slate-900 dark:text-white">
                    <Link href={`/${lang}/knowledge?product_category=${encodeURIComponent(question.product_category)}&page=1`} className="hover:text-red-600 dark:hover:text-red-400 transition-colors font-medium">{question.product_category}</Link>
                  </dd>
                </div>
              )}
              {question.electrical_type && (
                <div className="pb-4 border-b border-slate-200 dark:border-white/5 last:border-0">
                  <dt className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">{t("Electrical Type", "Stromart")}</dt>
                  <dd className="text-base text-slate-900 dark:text-white">
                    <Link href={`/${lang}/knowledge?electrical_type=${encodeURIComponent(question.electrical_type)}&page=1`} className="hover:text-red-600 dark:hover:text-red-400 transition-colors font-medium">{question.electrical_type}</Link>
                  </dd>
                </div>
              )}
              {question.control_type && (
                <div className="pb-4 border-b border-slate-200 dark:border-white/5 last:border-0">
                  <dt className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">{t("Control Type", "Regelungstyp")}</dt>
                  <dd className="text-base text-slate-900 dark:text-white">
                    <Link href={`/${lang}/knowledge?control_type=${encodeURIComponent(question.control_type)}&page=1`} className="hover:text-red-600 dark:hover:text-red-400 transition-colors font-medium">{question.control_type}</Link>
                  </dd>
                </div>
              )}
              {question.relevant_standards && question.relevant_standards.length > 0 && (
                <div className="pb-4 border-b border-slate-200 dark:border-white/5 last:border-0">
                  <dt className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">{t("Relevant Standards", "Relevante Normen")}</dt>
                  <dd className="text-base text-slate-900 dark:text-white flex flex-wrap gap-2">
                    {question.relevant_standards.map((val) => (
                      <Link key={val} href={`/${lang}/knowledge?relevant_standards=${encodeURIComponent(val)}&page=1`} className="hover:text-red-600 dark:hover:text-red-400 transition-colors font-medium">
                        {val}
                      </Link>
                    ))}
                  </dd>
                </div>
              )}
              {question.mounting_type && (
                <div className="pb-4 border-b border-slate-200 dark:border-white/5 last:border-0">
                  <dt className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">{t("Mounting Type", "Montageart")}</dt>
                  <dd className="text-base text-slate-900 dark:text-white">
                    <Link href={`/${lang}/knowledge?mounting_type=${encodeURIComponent(question.mounting_type)}&page=1`} className="hover:text-red-600 dark:hover:text-red-400 transition-colors font-medium">{question.mounting_type}</Link>
                  </dd>
                </div>
              )}
              {question.cooling_method && (
                <div className="pb-4 border-b border-slate-200 dark:border-white/5 last:border-0">
                  <dt className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">{t("Cooling Method", "Kühlmethode")}</dt>
                  <dd className="text-base text-slate-900 dark:text-white">
                    <Link href={`/${lang}/knowledge?cooling_method=${encodeURIComponent(question.cooling_method)}&page=1`} className="hover:text-red-600 dark:hover:text-red-400 transition-colors font-medium">{question.cooling_method}</Link>
                  </dd>
                </div>
              )}
              {question.communication_protocols && question.communication_protocols.length > 0 && (
                <div className="pb-4 border-b border-slate-200 dark:border-white/5 last:border-0">
                  <dt className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">{t("Communication Protocols", "Kommunikationsprotokolle")}</dt>
                  <dd className="text-base text-slate-900 dark:text-white flex flex-wrap gap-2">
                    {question.communication_protocols.map((val) => (
                      <Link key={val} href={`/${lang}/knowledge?communication_protocols=${encodeURIComponent(val)}&page=1`} className="hover:text-red-600 dark:hover:text-red-400 transition-colors font-medium">
                        {val}
                      </Link>
                    ))}
                  </dd>
                </div>
              )}
              {question.manufacturer_mentions && question.manufacturer_mentions.length > 0 && (
                <div className="pb-4 border-b border-slate-200 dark:border-white/5 last:border-0">
                  <dt className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">{t("Manufacturer Mentions", "Erwähnte Hersteller")}</dt>
                  <dd className="text-base text-slate-900 dark:text-white flex flex-wrap gap-2">
                    {question.manufacturer_mentions.map((val) => (
                      <Link key={val} href={`/${lang}/knowledge?manufacturer_mentions=${encodeURIComponent(val)}&page=1`} className="hover:text-red-600 dark:hover:text-red-400 transition-colors font-medium">
                        {val}
                      </Link>
                    ))}
                  </dd>
                </div>
              )}
              {question.risk_keywords && question.risk_keywords.length > 0 && (
                <div className="pb-4 border-b border-slate-200 dark:border-white/5 last:border-0">
                  <dt className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">{t("Risk Keywords", "Risiko-Schlagwörter")}</dt>
                  <dd className="text-base text-slate-900 dark:text-white flex flex-wrap gap-2">
                    {question.risk_keywords.map((val) => (
                      <Link key={val} href={`/${lang}/knowledge?risk_keywords=${encodeURIComponent(val)}&page=1`} className="hover:text-red-600 dark:hover:text-red-400 transition-colors font-medium">
                        {val}
                      </Link>
                    ))}
                  </dd>
                </div>
              )}
              {question.tools_involved && question.tools_involved.length > 0 && (
                <div className="pb-4 border-b border-slate-200 dark:border-white/5 last:border-0">
                  <dt className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">{t("Tools Involved", "Verwendete Werkzeuge")}</dt>
                  <dd className="text-base text-slate-900 dark:text-white flex flex-wrap gap-2">
                    {question.tools_involved.map((val) => (
                      <Link key={val} href={`/${lang}/knowledge?tools_involved=${encodeURIComponent(val)}&page=1`} className="hover:text-red-600 dark:hover:text-red-400 transition-colors font-medium">
                        {val}
                      </Link>
                    ))}
                  </dd>
                </div>
              )}
              {question.installation_context && (
                <div className="pb-4 border-b border-slate-200 dark:border-white/5 last:border-0">
                  <dt className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">{t("Installation Context", "Installationskontext")}</dt>
                  <dd className="text-base text-slate-900 dark:text-white">
                    <Link href={`/${lang}/knowledge?installation_context=${encodeURIComponent(question.installation_context)}&page=1`} className="hover:text-red-600 dark:hover:text-red-400 transition-colors font-medium">{question.installation_context}</Link>
                  </dd>
                </div>
              )}
              {question.sensor_type && (
                <div className="pb-4 border-b border-slate-200 dark:border-white/5 last:border-0">
                  <dt className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">{t("Sensor Type", "Sensortyp")}</dt>
                  <dd className="text-base text-slate-900 dark:text-white">
                    <Link href={`/${lang}/knowledge?sensor_type=${encodeURIComponent(question.sensor_type)}&page=1`} className="hover:text-red-600 dark:hover:text-red-400 transition-colors font-medium">{question.sensor_type}</Link>
                  </dd>
                </div>
              )}
              {question.mechanical_component && (
                <div className="pb-4 border-b border-slate-200 dark:border-white/5 last:border-0">
                  <dt className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">{t("Mechanical Component", "Mechanisches Bauteil")}</dt>
                  <dd className="text-base text-slate-900 dark:text-white">
                    <Link href={`/${lang}/knowledge?mechanical_component=${encodeURIComponent(question.mechanical_component)}&page=1`} className="hover:text-red-600 dark:hover:text-red-400 transition-colors font-medium">{question.mechanical_component}</Link>
                  </dd>
                </div>
              )}
              {question.industry_tag && (
                <div className="pb-4 border-b border-slate-200 dark:border-white/5 last:border-0">
                  <dt className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">{t("Industry Tag", "Industrie-Tag")}</dt>
                  <dd className="text-base text-slate-900 dark:text-white">
                    <Link href={`/${lang}/knowledge?industry_tag=${encodeURIComponent(question.industry_tag)}&page=1`} className="hover:text-red-600 dark:hover:text-red-400 transition-colors font-medium">{question.industry_tag}</Link>
                  </dd>
                </div>
              )}
              {typeof question.maintenance_relevance === 'boolean' && (
                <div className="pb-4 border-b border-slate-200 dark:border-white/5 last:border-0">
                  <dt className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">{t("Maintenance Relevance", "Wartungsrelevanz")}</dt>
                  <dd className="text-base text-slate-900 dark:text-white font-medium">{question.maintenance_relevance ? t('Yes', 'Ja') : t('No', 'Nein')}</dd>
                </div>
              )}
              {question.failure_mode && (
                <div className="pb-4 border-b border-slate-200 dark:border-white/5 last:border-0">
                  <dt className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">{t("Failure Mode", "Fehlermodus")}</dt>
                  <dd className="text-base text-slate-900 dark:text-white">
                    <Link href={`/${lang}/knowledge?failure_mode=${encodeURIComponent(question.failure_mode)}&page=1`} className="hover:text-red-600 dark:hover:text-red-400 transition-colors font-medium">{question.failure_mode}</Link>
                  </dd>
                </div>
              )}
              {question.software_context && (
                <div className="pb-4 border-b border-slate-200 dark:border-white/5 last:border-0">
                  <dt className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">{t("Software Context", "Software-Kontext")}</dt>
                  <dd className="text-base text-slate-900 dark:text-white">
                    <Link href={`/${lang}/knowledge?software_context=${encodeURIComponent(question.software_context)}&page=1`} className="hover:text-red-600 dark:hover:text-red-400 transition-colors font-medium">{question.software_context}</Link>
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </div>

        {/* Related Questions Section */}
        {relatedQuestions.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{t('Related Questions', 'Verwandte Fragen')}</h2>
              <Link href={`/${lang}/knowledge?similarTo=${question.slug}`} className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors">
                {t('See all', 'Alle anzeigen')} →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {relatedQuestions.map((related) => (
                <Link
                  key={related.id}
                  href={`/${question.language_path}/knowledge/${related.slug}`}
                  className="group block bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-white/10 rounded-2xl p-6 transition-all duration-200 hover:shadow-lg hover:border-slate-300 dark:hover:border-white/20"
                  tabIndex={0}
                  aria-label={related.question}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold text-slate-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors line-clamp-2 leading-snug">{related.question}</h3>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      {t("Similarity", "Ähnlichkeit")}: {Math.round(related.similarity)}%
                    </span>
                    <svg className="w-4 h-4 text-slate-400 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Comments Section */}
        <div className="mb-12 pt-12 border-t border-slate-200 dark:border-white/10">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">{t("Comments", "Kommentare")}</h2>
          {!user ? (
            <div className="text-center mb-8 p-8 bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-white/10 rounded-2xl">
              <svg className="w-12 h-12 mx-auto mb-4 text-slate-400 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p className="text-slate-700 dark:text-slate-300 text-lg mb-4 font-medium">{t("Sign in to share your thoughts", "Melden Sie sich an, um Ihre Gedanken zu teilen")}</p>
              <Link
                href={`/${lang}/login`}
                className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-medium hover:bg-slate-800 dark:hover:bg-slate-100 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                {t("Sign In", "Anmelden")}
              </Link>
            </div>
          ) : (
            <form onSubmit={handleCommentSubmit} className="mb-8 bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-white/10 rounded-2xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0 shadow-sm">
                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="flex-1">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder={t('Share your thoughts...', 'Teilen Sie Ihre Gedanken mit...')}
                    className="w-full px-4 py-3 border border-slate-300 dark:border-white/20 rounded-xl shadow-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 text-base resize-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 transition-all"
                    rows={4}
                    maxLength={1000}
                  />
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {newComment.length}/1000 {t('characters', 'Zeichen')}
                    </span>
                    <button
                      type="submit"
                      disabled={isSubmitting || !newComment.trim()}
                      className="px-5 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-medium rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
                    >
                      {isSubmitting ? (
                        <span className="flex items-center gap-2">
                          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          {t('Posting...', 'Wird gepostet...')}
                        </span>
                      ) : (
                        t('Post Comment', 'Kommentar posten')
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          )}

          {error && (
            <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-400 text-sm">
              {error}
            </div>
          )}
          {commentError && (
            <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-400 text-sm">
              {commentError}
            </div>
          )}
          <div className="space-y-4">
            {comments.map((comment) => {
              const displayName = comment.user_name || t('Anonymous User', 'Anonymer Benutzer');
              const initials = displayName
                .split(' ')
                .map((n: string) => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2);
              
              return (
                <div key={comment.id} className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-2xl p-6 hover:shadow-md transition-all duration-200">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                        {initials}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-slate-900 dark:text-white">{displayName}</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap ml-2">
                          {new Date(comment.created_at).toLocaleDateString(lang === 'de' ? 'de-DE' : 'en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{comment.content}</p>
                    </div>
                  </div>
                </div>
              );
            })}
            {comments.length === 0 && (
              <div className="text-center py-16">
                <svg className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-700 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p className="text-slate-500 dark:text-slate-400 text-lg font-medium">{t("No comments yet", "Noch keine Kommentare")}</p>
                {!user && (
                  <p className="text-slate-400 dark:text-slate-500 text-sm mt-2">{t("Be the first to share your thoughts", "Seien Sie der Erste, der Ihre Gedanken teilt")}</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Follow-up Questions */}
        {followUpQuestions.length > 0 && (
          <div className="mb-12 pt-12 border-t border-slate-200 dark:border-white/10">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">{t("Follow-up Questions", "Nachfragen")}</h2>
            <div className="space-y-6">
              {followUpQuestions.map((followUp, index) => (
                <div key={followUp.id} className="bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-white/10 rounded-2xl p-6 sm:p-8">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 text-sm font-semibold">
                      {index + 1}
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{followUp.question}</h3>
                  </div>
                  <div className="prose prose-lg max-w-none dark:prose-invert" style={{fontFamily: 'Geist, Inter, Arial, sans-serif'}}>
                    <MarkdownRenderer content={followUp.answer} />
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-200 dark:border-white/10 text-xs text-slate-500 dark:text-slate-400">
                    {new Date(followUp.created_at).toLocaleDateString(lang === 'de' ? 'de-DE' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 