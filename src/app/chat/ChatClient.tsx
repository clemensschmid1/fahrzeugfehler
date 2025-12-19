/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect, useRef, Suspense, useCallback, memo, useMemo } from 'react';
import { getSupabaseClient } from '@/lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { User } from '@supabase/supabase-js';
import ReactMarkdown from 'react-markdown';
import { motion } from 'framer-motion';
import 'katex/dist/katex.min.css';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { processMarkdownForLatex } from '@/lib/latex-utils';
import { FaSpinner } from 'react-icons/fa';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  created_at: string;
}

interface ConversationMessage {
  id: string;
  question: string;
  answer: string;
  created_at: string;
}

// Memoized MarkdownRenderer
const MarkdownRenderer = memo(({ content }: { content: string }) => {
  const processedContent = useMemo(() => processMarkdownForLatex(content), [content]);
  
  return (
    <ReactMarkdown
      remarkPlugins={[remarkMath]}
      rehypePlugins={[[rehypeKatex, { strict: false }]]}
      components={{
        h1: ({children, ...props}: any) => <h1 className="font-bold text-xl mt-4 mb-2 text-black dark:text-white" {...props}>{children}</h1>,
        h2: ({children, ...props}: any) => <h2 className="font-semibold text-lg mt-4 mb-2 text-black dark:text-white" {...props}>{children}</h2>,
        h3: ({children, ...props}: any) => <h3 className="font-medium text-base mt-3 mb-2 text-black dark:text-white" {...props}>{children}</h3>,
        strong: ({children, ...props}: any) => <strong className="font-bold text-blue-600 dark:text-blue-400" {...props}>{children}</strong>,
        em: ({children, ...props}: any) => <em className="italic text-slate-600 dark:text-slate-400" {...props}>{children}</em>,
        p: ({children, ...props}: any) => <p className="my-2 leading-relaxed text-sm text-black dark:text-white" {...props}>{children}</p>,
        li: ({children, ...props}: any) => <li className="ml-4 my-1 list-inside text-black dark:text-white" {...props}>{children}</li>,
        ol: ({children, ...props}: any) => <ol className="list-decimal ml-6 my-2 text-black dark:text-white" {...props}>{children}</ol>,
        ul: ({children, ...props}: any) => <ul className="list-disc ml-6 my-2 text-black dark:text-white" {...props}>{children}</ul>,
        code({inline, children, ...props}: any) {
          const code = String(children).replace(/\n$/, '');
          if (inline) {
            return <code className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-900 text-blue-600 dark:text-blue-400 rounded text-xs font-mono" {...props}>{children}</code>;
          }
          return (
            <pre className="bg-slate-100 dark:bg-slate-900 border border-black/10 dark:border-white/20 rounded-lg p-3 overflow-x-auto my-3">
              <code className="text-xs font-mono text-black dark:text-white">{code}</code>
            </pre>
          );
        },
        table: ({children, ...props}: any) => (
          <div className="markdown-table-container my-4">
            <table className="markdown-table" {...props}>{children}</table>
          </div>
        ),
        tr: ({children, ...props}: any) => <tr {...props}>{children}</tr>, 
        td: ({children, ...props}: any) => <td {...props}>{children}</td>, 
      } as any}
    >
      {processedContent}
    </ReactMarkdown>
  );
});

MarkdownRenderer.displayName = 'MarkdownRenderer';

const MessageComponent = memo(({ 
  message, 
  index, 
  showMetaDisclaimer, 
  metaFadeOut, 
  metaWaitSeconds
}: {
  message: Message;
  index: number;
  showMetaDisclaimer: boolean;
  metaFadeOut: boolean;
  metaWaitSeconds: number;
}) => {
  const isLastMessage = index === 0;
  
  return (
    <div
        className={`flex ${
          message.role === 'user' ? 'justify-end' : 'justify-start'
        } mb-4`}
      >
        <div
          className={`max-w-[85%] rounded-lg p-4 ${
            message.role === 'user'
              ? 'bg-blue-600 text-white'
              : 'bg-white dark:bg-black border border-black/10 dark:border-white/20 text-black dark:text-white'
          }`}
      >
        {message.role === 'assistant' ? (
          <>
            <div className="prose prose-slate dark:prose-invert max-w-none">
              <MarkdownRenderer content={message.content} />
            </div>
            {showMetaDisclaimer && isLastMessage && (
              <div
                className={`mt-4 flex flex-col items-start gap-2 transition-all duration-500 ${metaFadeOut ? 'opacity-0 translate-y-2' : 'opacity-100'} bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 w-full`}
              >
                <div className="flex items-center gap-2">
                  <FaSpinner className="animate-spin text-blue-600 dark:text-blue-400 text-lg" />
                  <span className="text-blue-900 dark:text-blue-100 font-medium text-sm">
                    Die Frage wird intern ausgewertet. Bitte warten Sie, bevor Sie diese Seite verlassen. ({Math.min(metaWaitSeconds, 5).toFixed(1)}s / 5s)
                  </span>
                </div>
                <div className="w-full bg-blue-100 dark:bg-blue-900/40 rounded h-2 mt-1">
                  <div
                    className="bg-blue-600 dark:bg-blue-400 h-2 rounded transition-all duration-200"
                    style={{ width: `${Math.min((metaWaitSeconds / 5) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
            )}
          </>
        ) : (
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
        )}
        <div className={`text-xs mt-3 opacity-50 ${
          message.role === 'user' ? 'text-white/80' : 'text-slate-400 dark:text-slate-500'
        }`}>
          {new Date(message.created_at).toLocaleTimeString('de-DE', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
      </div>
    </div>
  );
});

MessageComponent.displayName = 'MessageComponent';

function ChatPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const lang = 'de'; // Hardcode to German

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [freeLimitReached, setFreeLimitReached] = useState(false);
  const [freeQuestionsCount, setFreeQuestionsCount] = useState<number>(0);
  const [showMetaDisclaimer, setShowMetaDisclaimer] = useState(false);
  const [metaPollInterval, setMetaPollInterval] = useState<NodeJS.Timeout | undefined>(undefined);
  const [metaPollTimeout, setMetaPollTimeout] = useState<NodeJS.Timeout | undefined>(undefined);
  const fetchAbortControllerRef = useRef<AbortController | null>(null);
  
  // CRITICAL: Cleanup intervals, timeouts, and fetch requests on unmount
  useEffect(() => {
    return () => {
      if (metaPollInterval) {
        clearInterval(metaPollInterval);
      }
      if (metaPollTimeout) {
        clearTimeout(metaPollTimeout);
      }
      // Abort any ongoing fetch requests
      if (fetchAbortControllerRef.current) {
        fetchAbortControllerRef.current.abort();
        fetchAbortControllerRef.current = null;
      }
    };
  }, [metaPollInterval, metaPollTimeout]);
  const [metaWaitSeconds, setMetaWaitSeconds] = useState(0);
  const [metaFadeOut, setMetaFadeOut] = useState(false);
  
  const supabase = useMemo(() => getSupabaseClient(), []);

  const formMountTime = useRef<number>(Date.now());
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const autoSubmitRef = useRef<boolean>(false);

  useEffect(() => {
    formMountTime.current = Date.now();
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const generateConversationId = (): string => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  const loadConversationHistory = useCallback(async (convId: string) => {
    try {
      const { data: conversationMessages, error } = await supabase
        .from('questions')
        .select('id, question, answer, created_at')
        .eq('conversation_id', convId)
        .order('created_at', { ascending: true })
        .limit(6);

      if (error) {
        console.error('Error loading conversation history:', error);
        return;
      }

      if (conversationMessages && conversationMessages.length > 0) {
        const messageHistory: Message[] = conversationMessages.flatMap((msg: ConversationMessage) => [
          {
            id: `${msg.id}-user`,
            content: msg.question,
            role: 'user' as const,
            created_at: msg.created_at,
          },
          {
            id: `${msg.id}-assistant`,
            content: msg.answer,
            role: 'assistant' as const,
            created_at: msg.created_at,
          },
        ]);

        setMessages(messageHistory);
      }
    } catch (err) {
      console.error('Error loading conversation history:', err);
    }
  }, [supabase]);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user || null);
      } catch (error) {
        console.error('Auth check failed:', error);
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
    const prefillQuestion = searchParams.get('prefill_question');
    const prefillAnswer = searchParams.get('prefill_answer');
    const urlConversationId = searchParams.get('conversation_id');
    const queryParam = searchParams.get('q');
    
    if (urlConversationId) {
      setConversationId(urlConversationId);
      loadConversationHistory(urlConversationId);
    } else if (prefillQuestion && prefillAnswer) {
      const newConversationId = generateConversationId();
      setConversationId(newConversationId);
      
      const questionMessage: Message = {
        id: Date.now().toString(),
        content: prefillQuestion,
        role: 'user',
        created_at: new Date().toISOString(),
      };
      
      const answerMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: prefillAnswer,
        role: 'assistant',
        created_at: new Date().toISOString(),
      };
      
      setMessages([questionMessage, answerMessage]);
      
      try {
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.set('conversation_id', newConversationId);
        newUrl.searchParams.delete('prefill_question');
        newUrl.searchParams.delete('prefill_answer');
        router.replace(newUrl.pathname + newUrl.search);
      } catch (err) {
        console.error('Failed to parse URL for prefill:', err);
        setError('Ein interner Fehler ist aufgetreten. Bitte aktualisieren Sie die Seite.');
      }
    } else {
      const newConversationId = generateConversationId();
      setConversationId(newConversationId);
      setMessages([]);
      
      try {
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.set('conversation_id', newConversationId);
        if (queryParam) {
          // Set the query in the input immediately
          setInput(queryParam);
          // Remove q parameter from URL
          newUrl.searchParams.delete('q');
          router.replace(newUrl.pathname + newUrl.search);
        } else {
          router.replace(newUrl.pathname + newUrl.search);
        }
      } catch (err) {
        console.error('Failed to parse URL for new chat (no context):', err);
        setError('Ein interner Fehler ist aufgetreten. Bitte aktualisieren Sie die Seite.');
      }
    }
  }, [searchParams, router, loadConversationHistory]);

  useEffect(() => {
    if (!user) {
      const count = parseInt(localStorage.getItem('free_questions_count_v2') || '0', 10);
      setFreeQuestionsCount(count);
      if (count >= 3) setFreeLimitReached(true);
    } else {
      setFreeLimitReached(false);
    }
  }, [user]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [input]);

  // Auto-submit query from URL parameter - fixed and improved
  useEffect(() => {
    const queryParam = searchParams.get('q');
    if (queryParam && queryParam.trim() && !autoSubmitRef.current && messages.length === 0 && !isLoading && conversationId) {
      autoSubmitRef.current = true;
      
      // Set input immediately for visual feedback
      setInput(queryParam);
      
      // Use requestAnimationFrame for better timing, then auto-submit
      let timeoutId: NodeJS.Timeout | null = null;
      requestAnimationFrame(() => {
        timeoutId = setTimeout(async () => {
          // Set form mount time to allow immediate submission (bypass 3-second check)
          formMountTime.current = Date.now() - 4000;
          
          // Use queryParam directly - more reliable than state
          const questionText = queryParam.trim();
          if (!questionText) {
            autoSubmitRef.current = false;
            return;
          }
        
        if (questionText.length > 1000) {
          setError('Maximal 1000 Zeichen erlaubt.');
          return;
        }
        
        // Check free limit for non-users
        if (!user) {
          const count = parseInt(localStorage.getItem('free_questions_count_v2') || '0', 10);
          if (count >= 3) {
            setFreeLimitReached(true);
            setError('Sie haben Ihr Kontingent von 3 kostenlosen Fragen erreicht. Bitte registrieren Sie sich, um unbegrenzt weiterzufragen.');
            return;
          } else {
            const newCount = count + 1;
            localStorage.setItem('free_questions_count_v2', newCount.toString());
            setFreeQuestionsCount(newCount);
            if (newCount >= 3) setFreeLimitReached(true);
          }
        }
        
        const userMessage: Message = {
          id: Date.now().toString(),
          content: questionText,
          role: 'user',
          created_at: new Date().toISOString(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);
        setError(null);

        try {
          const conversationContext = messages.map(msg => ({
            role: msg.role,
            content: msg.content,
          }));

          const isFirstQuestion = messages.filter(m => m.role === 'user').length === 0;

          const response = await fetch('/api/ask', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'text/event-stream',
            },
            body: JSON.stringify({
              question: questionText,
              language: lang,
              conversation_id: conversationId,
              conversation_context: conversationContext,
              submitDeltaMs: 4000,
              is_main: isFirstQuestion,
            }),
          });

          if (!response.ok) {
            let errorMsg = 'API-Anfrage fehlgeschlagen';
            try {
              const errorData = await response.json();
              errorMsg = errorData.error || errorMsg;
            } catch {}
            setError(errorMsg);
            setIsLoading(false);
            return;
          }

          if (!response.body) {
            setError('Keine Antwort vom Server.');
            setIsLoading(false);
            return;
          }
          
          const reader = response.body.getReader();
          let assistantContent = '';
          const assistantId = Date.now().toString();
          let done = false;
          let buffer = '';
          
          while (!done) {
            const { value, done: doneReading } = await reader.read();
            done = doneReading;
            if (value) {
              buffer += new TextDecoder().decode(value);
              const lines = buffer.split('\n');
              buffer = lines.pop() || '';
              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  const jsonStr = line.replace('data: ', '').trim();
                  if (jsonStr === '[DONE]') continue;
                  try {
                    const data = JSON.parse(jsonStr);
                    // Process streaming content
                    if (data.content) {
                      assistantContent += data.content;
                      setMessages(prev => {
                        const existing = prev.find(m => m.id === assistantId);
                        if (existing) {
                          return prev.map(m => 
                            m.id === assistantId 
                              ? { ...m, content: assistantContent }
                              : m
                          );
                        }
                        return [...prev, {
                          id: assistantId,
                          content: assistantContent,
                          role: 'assistant' as const,
                          created_at: new Date().toISOString(),
                        }];
                      });
                    }
                  } catch (err) {
                    console.error('Error parsing SSE data:', err);
                  }
                }
              }
            }
          }
          
          setIsLoading(false);
        } catch (err: any) {
          console.error('Auto-submit error:', err);
          setError(err.message || 'Fehler beim automatischen Senden der Frage.');
          setIsLoading(false);
        }
        }, 100);
      });
    }
  }, [searchParams, messages.length, isLoading, conversationId, user, lang, messages]);

  const handleNewChat = () => {
    const newConversationId = generateConversationId();
    setConversationId(newConversationId);
    setMessages([]);
    setInput('');
    setError(null);
    
    try {
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set('conversation_id', newConversationId);
      newUrl.searchParams.delete('prefill_question');
      newUrl.searchParams.delete('prefill_answer');
      router.replace(newUrl.pathname + newUrl.search);
    } catch (err) {
      console.error('Failed to parse URL for new chat:', err);
      setError('Ein interner Fehler ist aufgetreten. Bitte aktualisieren Sie die Seite.');
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim()) return;
    if (input.length > 1000) {
      setError('Maximal 1000 Zeichen erlaubt.');
      return;
    }
    const now = Date.now();
    const delta = now - formMountTime.current;
    if (delta < 3000) {
      setError('Bitte warten Sie mindestens 3 Sekunden, bevor Sie Ihre Frage absenden.');
      return;
    }
    if (!user) {
      const count = parseInt(localStorage.getItem('free_questions_count_v2') || '0', 10);
      if (count >= 3) {
        setFreeLimitReached(true);
        setError('Sie haben Ihr Kontingent von 3 kostenlosen Fragen erreicht. Bitte registrieren Sie sich, um unbegrenzt weiterzufragen.');
        return;
      } else {
        const newCount = count + 1;
        localStorage.setItem('free_questions_count_v2', newCount.toString());
        setFreeQuestionsCount(newCount);
        if (newCount >= 3) setFreeLimitReached(true);
      }
    }
    if (!user) setError(null);

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input.trim(),
      role: 'user',
      created_at: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      const conversationContext = messages.map(msg => ({
        role: msg.role,
        content: msg.content,
      }));

      const isFirstQuestion = messages.filter(m => m.role === 'user').length === 0;

      const response = await fetch('/api/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify({
          question: input.trim(),
          language: lang,
          conversation_id: conversationId,
          conversation_context: conversationContext,
          submitDeltaMs: delta,
          is_main: isFirstQuestion,
        }),
      });

      if (!response.ok) {
        let errorMsg = 'API-Anfrage fehlgeschlagen';
        try {
          const errorData = await response.json();
          errorMsg = errorData.error || errorMsg;
          if (errorData.error) {
            console.error('[Chat Error]', errorData.error);
          }
          if (!errorData.answer) {
            console.warn('[Chat Warning] No answer returned from backend:', errorData);
          }
        } catch {}
        setError(errorMsg);
        setIsLoading(false);
        return;
      }

      if (!response.body) {
        setError('Keine Antwort vom Server.');
        setIsLoading(false);
        return;
      }
      const reader = response.body.getReader();
      let assistantContent = '';
      const assistantId = Date.now().toString();
      let done = false;
      let buffer = '';
      let questionId: string | null = null;
      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        if (value) {
          buffer += new TextDecoder().decode(value);
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const jsonStr = line.replace('data: ', '').trim();
              if (jsonStr === '[DONE]') continue;
              try {
                const parsed = JSON.parse(jsonStr);
                const delta = parsed.choices?.[0]?.delta?.content || parsed.choices?.[0]?.message?.content || '';
                if (parsed.id) questionId = parsed.id;
                if (delta) {
                  assistantContent += delta;
                  setMessages(prev => {
                    if (prev.length > 0 && prev[prev.length - 1].role === 'assistant' && prev[prev.length - 1].id === assistantId) {
                      return [
                        ...prev.slice(0, -1),
                        { ...prev[prev.length - 1], content: assistantContent },
                      ];
                    } else {
                      return [
                        ...prev,
                        {
                          id: assistantId,
                          content: assistantContent,
                          role: 'assistant',
                          created_at: new Date().toISOString(),
                        },
                      ];
                    }
                  });
                }
              } catch {
                // Ignore JSON parse errors
              }
            }
          }
        }
      }
      setIsLoading(false);
      setShowMetaDisclaimer(true);
      if (metaPollInterval) clearInterval(metaPollInterval);
      if (metaPollTimeout) clearTimeout(metaPollTimeout);
      if (questionId) {
        let seconds = 0;
        setMetaWaitSeconds(0);
        setMetaFadeOut(false);
        const interval = setInterval(async () => {
          seconds += 0.2;
          setMetaWaitSeconds(seconds);
          const { data } = await supabase
            .from('questions')
            .select('meta_generated')
            .eq('id', questionId)
            .single();
          if (data?.meta_generated) {
            setMetaFadeOut(true);
            clearInterval(interval);
            if (metaPollTimeout) clearTimeout(metaPollTimeout);
            const hideTimeout = setTimeout(() => setShowMetaDisclaimer(false), 500);
            // Store hideTimeout for cleanup if needed
            setMetaPollTimeout(hideTimeout);
          }
        }, 200);
        setMetaPollInterval(interval);
        const timeout = setTimeout(() => {
          setMetaFadeOut(true);
          clearInterval(interval);
          const hideTimeout = setTimeout(() => setShowMetaDisclaimer(false), 500);
          setMetaPollTimeout(hideTimeout);
        }, 5000);
        setMetaPollTimeout(timeout);
      }
    } catch (error) {
      const err = error as Error;
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black pt-20 pb-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Minimal Hero Section */}
        {messages.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="text-center mb-12 pt-8"
          >
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-black dark:text-white mb-4 tracking-tight">
              Fragen zu Fahrzeugfehlern?
              <br />
              <span className="text-blue-600 dark:text-blue-400">
                Wir helfen Ihnen weiter.
              </span>
            </h1>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 mb-8 max-w-2xl mx-auto">
              Erhalten Sie sofortige, präzise Antworten auf Ihre Fragen zu Fahrzeugfehlern und Fehlercodes.
            </p>
          </motion.div>
        )}

        {/* Chat Container - Minimal & Professional */}
        <div className="bg-white dark:bg-black border border-black/10 dark:border-white/20 rounded-xl shadow-lg overflow-hidden">
          {/* Top Bar - Minimal */}
          {messages.length > 0 && (
            <div className="flex items-center justify-between px-6 py-3 border-b border-black/10 dark:border-white/20">
              <h2 className="text-sm font-bold text-black dark:text-white uppercase tracking-wider">
                Chat
              </h2>
              <button
                onClick={handleNewChat}
                className="text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors uppercase tracking-wider"
              >
                Neu
              </button>
            </div>
          )}

          {/* Messages Area - Clean */}
          <div className="p-6 min-h-[400px] max-h-[65vh] overflow-y-auto">
            {messages.length === 0 && (
              <div className="text-center py-20">
                <div className="w-12 h-12 border-2 border-slate-200 dark:border-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Geben Sie unten Ihre Frage ein
                </p>
              </div>
            )}
            
            {messages.map((message, index) => (
              <MessageComponent
                key={message.id}
                message={message}
                index={index}
                showMetaDisclaimer={showMetaDisclaimer}
                metaFadeOut={metaFadeOut}
                metaWaitSeconds={metaWaitSeconds}
              />
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex items-center space-x-2 px-4 py-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Error Messages */}
          {freeLimitReached && !user && (
            <div className="mx-6 mb-4 p-4 bg-amber-50 dark:bg-amber-900/20 text-amber-900 dark:text-amber-200 border border-amber-200 dark:border-amber-800 rounded-xl">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium text-sm">
                  Sie haben Ihr Kontingent von 3 kostenlosen Fragen erreicht. Bitte registrieren Sie sich, um unbegrenzt weiterzufragen.
                </span>
              </div>
            </div>
          )}

          {error && (
            <div className="mx-6 mb-4 p-4 bg-red-50 dark:bg-red-900/20 text-red-900 dark:text-red-200 border border-red-200 dark:border-red-800 rounded-xl">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium text-sm">{error}</span>
              </div>
            </div>
          )}

          {/* Input Area - Minimal */}
          <div className="border-t border-black/10 dark:border-white/20 p-4">
            {!user && !freeLimitReached && (
              <div className="mb-3 p-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-lg">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 dark:text-slate-400">
                    Noch {3 - freeQuestionsCount} kostenlose Fragen
                  </span>
                  <Link
                    href="/signup"
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                  >
                    Registrieren
                  </Link>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex gap-2">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Stellen Sie Ihre Frage..."
                className="flex-1 w-full px-4 py-3 text-sm border border-black/10 dark:border-white/20 rounded-lg focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 dark:focus:border-blue-500 bg-white dark:bg-black text-black dark:text-white resize-none min-h-[44px] max-h-32 transition-all placeholder-slate-400 dark:placeholder-slate-500"
                disabled={isLoading || (freeLimitReached && !user)}
                maxLength={1000}
                rows={1}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim() || (freeLimitReached && !user)}
                className="px-4 py-3 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center justify-center min-w-[44px] h-[44px]"
              >
                {isLoading ? (
                  <FaSpinner className="w-5 h-5 animate-spin" />
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                )}
              </button>
            </form>

            <p className="mt-3 text-xs text-slate-500 dark:text-slate-400 text-center">
              Antworten kombinieren unsere kuratierte Fahrzeugfehler-Datenbank mit fortgeschrittener KI. Bitte verifizieren Sie kritische Schritte mit Herstellerdokumenten.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ChatClient() {
  return (
    <Suspense fallback={<div>Lädt...</div>}>
      <ChatPageContent />
    </Suspense>
  );
}

