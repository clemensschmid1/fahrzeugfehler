/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useRef, useEffect, memo } from 'react';
import Link from 'next/link';
import { User } from '@supabase/supabase-js';
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
        h1: ({children, ...props}: any) => <h1 className="font-geist font-bold text-2xl mt-4 mb-2 text-black" style={{fontFamily: 'Geist, Inter, Arial, sans-serif'}} {...props}>{children}</h1>, 
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        h2: ({children, ...props}: any) => <h2 className="font-geist font-semibold text-xl mt-4 mb-2 text-black" style={{fontFamily: 'Geist, Inter, Arial, sans-serif'}} {...props}>{children}</h2>, 
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        h3: ({children, ...props}: any) => <h3 className="font-geist font-medium text-lg mt-4 mb-2 text-blue-900" style={{fontFamily: 'Geist, Inter, Arial, sans-serif'}} {...props}>{children}</h3>, 
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        strong: ({children, ...props}: any) => <strong className="font-bold text-black" {...props}>{children}</strong>, 
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        em: ({children, ...props}: any) => <em className="italic text-black" {...props}>{children}</em>, 
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
          return <p className="my-3 leading-relaxed text-base text-black" {...props}>{children}</p>;
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        li: ({children, ...props}: any) => <li className="sm:ml-4 ml-2 my-1 sm:pl-1 pl-0 list-inside text-black" {...props}>{children}</li>, 
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ol: ({children, ...props}: any) => <ol className="list-decimal sm:ml-6 ml-2 my-2 text-black" {...props}>{children}</ol>, 
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ul: ({children, ...props}: any) => <ul className="list-disc sm:ml-6 ml-2 my-2 text-black" {...props}>{children}</ul>, 
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

  const formMountTime = useRef<number>(Date.now());

  useEffect(() => {
    formMountTime.current = Date.now();
  }, []);

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
    <div className="min-h-screen bg-gray-50 pt-4 pb-10">
      <div className="w-full max-w-4xl mx-auto px-2 sm:px-6 lg:px-8">
        <div className="bg-white shadow-xl rounded-2xl overflow-hidden">
          <div className="pt-0.5 pb-6 px-4 sm:px-7">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              {question.status === 'draft' && (
                <span className="px-3 py-1 text-sm font-medium text-yellow-800 bg-yellow-100 rounded-full">
                    {t("Draft", "Entwurf")}
                </span>
              )}
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-3 mt-0 leading-tight tracking-tight" style={{marginTop: 0, paddingTop: 0}}>
              {question.header || question.question}
            </h1>

            {/* Show the original question asked */}
            <div className="mb-8">
              <span className="block text-gray-500 text-base mb-2 font-medium">{t("Question asked:", "Gestellte Frage:")}</span>
              <div className="text-xl font-semibold text-gray-800 leading-snug">{question.question}</div>
            </div>

            {/* Pronounced Answer Segment */}
            <div className="relative my-8 p-2 sm:p-6 rounded-2xl bg-gradient-to-br from-blue-50 via-white to-indigo-50 border-2 border-blue-200 shadow-xl">
              <span className="absolute -top-4 left-4 bg-blue-600 text-white text-xs font-semibold px-3 py-1 rounded-full shadow">{t('AI Answer', 'KI-Antwort')}</span>
              <div className="prose prose-lg max-w-none font-geist" style={{fontFamily: 'Geist, Inter, Arial, sans-serif'}}>
                <MarkdownRenderer content={question.answer} />
              </div>
              <div className="absolute bottom-4 right-6 text-xs text-gray-400 select-none">
                {new Date(question.created_at).toLocaleDateString(lang === 'de' ? 'de-DE' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
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

            <div className="mt-8 pt-8">
              <div className="rounded-2xl bg-gradient-to-br from-indigo-50 via-white to-blue-50 border border-indigo-100 shadow-lg p-6">
                <div className="flex items-center gap-2 mb-4">
                  <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V4a2 2 0 10-4 0v1.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                  <span className="text-blue-900 font-medium text-base">{t('Click any detail to search for similar pages by that topic.', 'Klicken Sie auf ein Detail, um nach ähnlichen Seiten zu suchen.')}</span>
            </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">{t("Details", "Details")}</h2>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
                  {/* Render all details as clickable links to filtered knowledge page */}
                {question.manufacturer && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">{t("Manufacturer", "Hersteller")}</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        <Link href={`/${lang}/knowledge?manufacturer=${encodeURIComponent(question.manufacturer)}&page=1`} className="underline text-blue-700 hover:text-blue-900 transition-colors">{question.manufacturer}</Link>
                      </dd>
                  </div>
                )}
                {question.part_type && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">{t("Part Type", "Teiletyp")}</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        <Link href={`/${lang}/knowledge?partType=${encodeURIComponent(question.part_type)}&page=1`} className="underline text-blue-700 hover:text-blue-900 transition-colors">{question.part_type}</Link>
                      </dd>
                  </div>
                )}
                {question.part_series && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">{t("Part Series", "Teileserie")}</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        <Link href={`/${lang}/knowledge?part_series=${encodeURIComponent(question.part_series)}&page=1`} className="underline text-blue-700 hover:text-blue-900 transition-colors">{question.part_series}</Link>
                      </dd>
                  </div>
                )}
                {question.sector && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">{t("Sector", "Sektor")}</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        <Link href={`/${lang}/knowledge?sector=${encodeURIComponent(question.sector)}&page=1`} className="underline text-blue-700 hover:text-blue-900 transition-colors">{question.sector}</Link>
                      </dd>
                    </div>
                  )}
                  {question.voltage && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">{t("Voltage", "Spannung")}</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        <Link href={`/${lang}/knowledge?voltage=${encodeURIComponent(question.voltage)}&page=1`} className="underline text-blue-700 hover:text-blue-900 transition-colors">{question.voltage}</Link>
                      </dd>
                    </div>
                  )}
                  {question.current && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">{t("Current", "Strom")}</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        <Link href={`/${lang}/knowledge?current=${encodeURIComponent(question.current)}&page=1`} className="underline text-blue-700 hover:text-blue-900 transition-colors">{question.current}</Link>
                      </dd>
                    </div>
                  )}
                  {question.power_rating && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">{t("Power Rating", "Leistung")}</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        <Link href={`/${lang}/knowledge?power_rating=${encodeURIComponent(question.power_rating)}&page=1`} className="underline text-blue-700 hover:text-blue-900 transition-colors">{question.power_rating}</Link>
                      </dd>
                    </div>
                  )}
                  {question.machine_type && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">{t("Machine Type", "Maschinentyp")}</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        <Link href={`/${lang}/knowledge?machine_type=${encodeURIComponent(question.machine_type)}&page=1`} className="underline text-blue-700 hover:text-blue-900 transition-colors">{question.machine_type}</Link>
                      </dd>
                    </div>
                  )}
                  {Array.isArray(question.application_area) && question.application_area.length > 0 && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">{t("Application Area", "Anwendungsbereich")}</dt>
                      <dd className="mt-1 text-sm text-gray-900 flex flex-wrap gap-2">
                        {question.application_area.map((val) => (
                          <Link key={val} href={`/${lang}/knowledge?application_area=${encodeURIComponent(val)}&page=1`} className="underline text-blue-700 hover:text-blue-900 transition-colors">
                            {val}
                          </Link>
                        ))}
                      </dd>
                    </div>
                  )}
                  {!Array.isArray(question.application_area) && question.application_area && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">{t("Application Area", "Anwendungsbereich")}</dt>
                      <dd className="mt-1 text-sm text-gray-900 flex flex-wrap gap-2">
                        <Link href={`/${lang}/knowledge?application_area=${encodeURIComponent(question.application_area)}&page=1`} className="underline text-blue-700 hover:text-blue-900 transition-colors">
                          {question.application_area}
                        </Link>
                      </dd>
                    </div>
                  )}
                  {question.product_category && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">{t("Product Category", "Produktkategorie")}</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        <Link href={`/${lang}/knowledge?product_category=${encodeURIComponent(question.product_category)}&page=1`} className="underline text-blue-700 hover:text-blue-900 transition-colors">{question.product_category}</Link>
                      </dd>
                    </div>
                  )}
                  {question.electrical_type && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">{t("Electrical Type", "Stromart")}</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        <Link href={`/${lang}/knowledge?electrical_type=${encodeURIComponent(question.electrical_type)}&page=1`} className="underline text-blue-700 hover:text-blue-900 transition-colors">{question.electrical_type}</Link>
                      </dd>
                    </div>
                  )}
                  {question.control_type && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">{t("Control Type", "Regelungstyp")}</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        <Link href={`/${lang}/knowledge?control_type=${encodeURIComponent(question.control_type)}&page=1`} className="underline text-blue-700 hover:text-blue-900 transition-colors">{question.control_type}</Link>
                      </dd>
                    </div>
                  )}
                  {question.relevant_standards && question.relevant_standards.length > 0 && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">{t("Relevant Standards", "Relevante Normen")}</dt>
                      <dd className="mt-1 text-sm text-gray-900 flex flex-wrap gap-2">
                        {question.relevant_standards.map((val) => (
                          <Link key={val} href={`/${lang}/knowledge?relevant_standards=${encodeURIComponent(val)}&page=1`} className="underline text-blue-700 hover:text-blue-900 transition-colors">
                            {val}
                          </Link>
                        ))}
                      </dd>
                    </div>
                  )}
                  {question.mounting_type && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">{t("Mounting Type", "Montageart")}</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        <Link href={`/${lang}/knowledge?mounting_type=${encodeURIComponent(question.mounting_type)}&page=1`} className="underline text-blue-700 hover:text-blue-900 transition-colors">{question.mounting_type}</Link>
                      </dd>
                    </div>
                  )}
                  {question.cooling_method && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">{t("Cooling Method", "Kühlmethode")}</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        <Link href={`/${lang}/knowledge?cooling_method=${encodeURIComponent(question.cooling_method)}&page=1`} className="underline text-blue-700 hover:text-blue-900 transition-colors">{question.cooling_method}</Link>
                      </dd>
                    </div>
                  )}
                  {question.communication_protocols && question.communication_protocols.length > 0 && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">{t("Communication Protocols", "Kommunikationsprotokolle")}</dt>
                      <dd className="mt-1 text-sm text-gray-900 flex flex-wrap gap-2">
                        {question.communication_protocols.map((val) => (
                          <Link key={val} href={`/${lang}/knowledge?communication_protocols=${encodeURIComponent(val)}&page=1`} className="underline text-blue-700 hover:text-blue-900 transition-colors">
                            {val}
                          </Link>
                        ))}
                      </dd>
                    </div>
                  )}
                  {question.manufacturer_mentions && question.manufacturer_mentions.length > 0 && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">{t("Manufacturer Mentions", "Erwähnte Hersteller")}</dt>
                      <dd className="mt-1 text-sm text-gray-900 flex flex-wrap gap-2">
                        {question.manufacturer_mentions.map((val) => (
                          <Link key={val} href={`/${lang}/knowledge?manufacturer_mentions=${encodeURIComponent(val)}&page=1`} className="underline text-blue-700 hover:text-blue-900 transition-colors">
                            {val}
                          </Link>
                        ))}
                      </dd>
                    </div>
                  )}
                  {question.risk_keywords && question.risk_keywords.length > 0 && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">{t("Risk Keywords", "Risiko-Schlagwörter")}</dt>
                      <dd className="mt-1 text-sm text-gray-900 flex flex-wrap gap-2">
                        {question.risk_keywords.map((val) => (
                          <Link key={val} href={`/${lang}/knowledge?risk_keywords=${encodeURIComponent(val)}&page=1`} className="underline text-blue-700 hover:text-blue-900 transition-colors">
                            {val}
                          </Link>
                        ))}
                      </dd>
                    </div>
                  )}
                  {question.tools_involved && question.tools_involved.length > 0 && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">{t("Tools Involved", "Verwendete Werkzeuge")}</dt>
                      <dd className="mt-1 text-sm text-gray-900 flex flex-wrap gap-2">
                        {question.tools_involved.map((val) => (
                          <Link key={val} href={`/${lang}/knowledge?tools_involved=${encodeURIComponent(val)}&page=1`} className="underline text-blue-700 hover:text-blue-900 transition-colors">
                            {val}
                          </Link>
                        ))}
                      </dd>
                    </div>
                  )}
                  {question.installation_context && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">{t("Installation Context", "Installationskontext")}</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        <Link href={`/${lang}/knowledge?installation_context=${encodeURIComponent(question.installation_context)}&page=1`} className="underline text-blue-700 hover:text-blue-900 transition-colors">{question.installation_context}</Link>
                      </dd>
                    </div>
                  )}
                  {question.sensor_type && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">{t("Sensor Type", "Sensortyp")}</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        <Link href={`/${lang}/knowledge?sensor_type=${encodeURIComponent(question.sensor_type)}&page=1`} className="underline text-blue-700 hover:text-blue-900 transition-colors">{question.sensor_type}</Link>
                      </dd>
                    </div>
                  )}
                  {question.mechanical_component && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">{t("Mechanical Component", "Mechanisches Bauteil")}</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        <Link href={`/${lang}/knowledge?mechanical_component=${encodeURIComponent(question.mechanical_component)}&page=1`} className="underline text-blue-700 hover:text-blue-900 transition-colors">{question.mechanical_component}</Link>
                      </dd>
                    </div>
                  )}
                  {question.industry_tag && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">{t("Industry Tag", "Industrie-Tag")}</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        <Link href={`/${lang}/knowledge?industry_tag=${encodeURIComponent(question.industry_tag)}&page=1`} className="underline text-blue-700 hover:text-blue-900 transition-colors">{question.industry_tag}</Link>
                      </dd>
                    </div>
                  )}
                  {typeof question.maintenance_relevance === 'boolean' && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">{t("Maintenance Relevance", "Wartungsrelevanz")}</dt>
                      <dd className="mt-1 text-sm text-gray-900">{question.maintenance_relevance ? t('Yes', 'Ja') : t('No', 'Nein')}</dd>
                    </div>
                  )}
                  {question.failure_mode && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">{t("Failure Mode", "Fehlermodus")}</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        <Link href={`/${lang}/knowledge?failure_mode=${encodeURIComponent(question.failure_mode)}&page=1`} className="underline text-blue-700 hover:text-blue-900 transition-colors">{question.failure_mode}</Link>
                      </dd>
                    </div>
                  )}
                  {question.software_context && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">{t("Software Context", "Software-Kontext")}</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        <Link href={`/${lang}/knowledge?software_context=${encodeURIComponent(question.software_context)}&page=1`} className="underline text-blue-700 hover:text-blue-900 transition-colors">{question.software_context}</Link>
                      </dd>
                  </div>
                )}
              </dl>
              </div>
            </div>

            <div className="mt-12">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">{t('Related Questions', 'Verwandte Fragen')}</h2>
                <Link href={`/${lang}/knowledge?similarTo=${question.slug}`} className="text-blue-600 hover:underline text-sm font-medium" style={{marginLeft: 'auto'}}>
                  {t('See all related questions', 'Alle verwandten Fragen anzeigen')}
                </Link>
              </div>
              {relatedQuestions.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {relatedQuestions.map((related) => (
                    <Link
                      key={related.id}
                      href={`/${question.language_path}/knowledge/${related.slug}`}
                      className="group block bg-gradient-to-br from-indigo-50 via-white to-blue-50 border border-indigo-100 rounded-2xl shadow-md p-5 transition-all duration-200 hover:shadow-xl hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      tabIndex={0}
                      aria-label={related.question}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 group-hover:bg-indigo-200">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 17l5-5-5-5" /></svg>
                        </span>
                        <span className="text-xs font-semibold bg-blue-100 text-blue-700 px-2 py-1 rounded-full ml-auto">
                          {t("Similarity", "Ähnlichkeit")}: {Math.round(related.similarity)}%
                        </span>
                      </div>
                      <h3 className="text-base font-semibold text-gray-900 group-hover:text-indigo-700 mb-1 line-clamp-2">{related.question}</h3>
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
                <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                  {t("Follow-up Questions", "Nachfragen")}
                </h2>
                <div className="space-y-8">
                  {followUpQuestions.map((followUp, index) => (
                    <div key={followUp.id} className="relative bg-gradient-to-br from-blue-50 via-white to-indigo-50 border-2 border-blue-200 shadow-lg rounded-2xl p-6">
                      <span className="absolute -top-4 left-4 bg-blue-500 text-white text-xs font-semibold px-3 py-1 rounded-full shadow">{t("Follow-up", "Nachfrage")} #{index + 1}</span>
                      <div className="mb-3">
                        <div className="text-lg font-semibold text-gray-800">{followUp.question}</div>
                      </div>
                      <div className="prose prose-lg max-w-none font-geist" style={{fontFamily: 'Geist, Inter, Arial, sans-serif'}}>
                        <MarkdownRenderer content={followUp.answer} />
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