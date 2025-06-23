'use client';

import { useState, useEffect, useRef, Suspense, useCallback } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { User } from '@supabase/supabase-js';
import ReactMarkdown from 'react-markdown';

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

function ChatPageContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const lang = params.lang as string;

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [freeLimitReached, setFreeLimitReached] = useState(false);
  const [freeQuestionsCount, setFreeQuestionsCount] = useState<number>(0);
  const [showMetaDisclaimer, setShowMetaDisclaimer] = useState(false);
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const formMountTime = useRef<number>(Date.now());
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    formMountTime.current = Date.now();
  }, []);

  // Translation helper function
  const t = (en: string, de: string) => lang === 'de' ? de : en;

  // Generate UUID for conversation_id
  const generateConversationId = (): string => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  // Load conversation history from Supabase
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
        console.log('Chat page - Session:', session);
        setUser(session?.user || null);
      } catch (error) {
        console.error('Auth check failed:', error);
        setUser(null);
      }
    };

    fetchUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Chat page - Auth state change:', event, session);
      setUser(session?.user || null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  // Handle prefill parameters and conversation_id from URL
  useEffect(() => {
    const prefillQuestion = searchParams.get('prefill_question');
    const prefillAnswer = searchParams.get('prefill_answer');
    const urlConversationId = searchParams.get('conversation_id');
    
    if (urlConversationId) {
      // Load conversation history if conversation_id is provided
      setConversationId(urlConversationId);
      loadConversationHistory(urlConversationId);
    } else if (prefillQuestion && prefillAnswer) {
      // Handle prefill parameters for new conversations
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
      
      // Update URL with new conversation_id
      try {
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.set('conversation_id', newConversationId);
        newUrl.searchParams.delete('prefill_question');
        newUrl.searchParams.delete('prefill_answer');
        router.replace(newUrl.pathname + newUrl.search);
      } catch (err) {
        console.error('Failed to parse URL for prefill:', err);
        setError('An internal error occurred while starting a new chat. Please refresh the page.');
      }
    } else {
      // New chat without any context
      const newConversationId = generateConversationId();
      setConversationId(newConversationId);
      setMessages([]);
      
      // Update URL with new conversation_id
      try {
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.set('conversation_id', newConversationId);
        router.replace(newUrl.pathname + newUrl.search);
      } catch (err) {
        console.error('Failed to parse URL for new chat (no context):', err);
        setError('An internal error occurred while starting a new chat. Please refresh the page.');
      }
    }
  }, [searchParams, router, loadConversationHistory]);

  // Check free question limit for unauthenticated users
  useEffect(() => {
    if (!user) {
      const count = parseInt(localStorage.getItem('free_questions_count') || '0', 10);
      setFreeQuestionsCount(count);
      if (count >= 3) setFreeLimitReached(true);
    } else {
      setFreeLimitReached(false);
    }
  }, [user]);

  // Auto-expand textarea as user types
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [input]);

  const handleNewChat = () => {
    const newConversationId = generateConversationId();
    setConversationId(newConversationId);
    setMessages([]);
    setInput('');
    setError(null);
    
    // Update URL with new conversation_id
    try {
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set('conversation_id', newConversationId);
      newUrl.searchParams.delete('prefill_question');
      newUrl.searchParams.delete('prefill_answer');
      router.replace(newUrl.pathname + newUrl.search);
    } catch (err) {
      console.error('Failed to parse URL for new chat:', err);
      setError('An internal error occurred while starting a new chat. Please refresh the page.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    if (input.length > 1000) {
      setError(lang === 'de' ? 'Maximal 1000 Zeichen erlaubt.' : 'Maximum 1000 characters allowed.');
      return;
    }
    const now = Date.now();
    const delta = now - formMountTime.current;
    if (delta < 3000) {
      setError(lang === 'de' ? 'Bitte warten Sie mindestens 3 Sekunden, bevor Sie Ihre Frage absenden.' : 'Please wait at least 3 seconds before submitting your question.');
      return;
    }
    if (!user) {
      const count = parseInt(localStorage.getItem('free_questions_count') || '0', 10);
      if (count >= 3) {
        setFreeLimitReached(true);
        setError(lang === 'de' ? 'Sie haben Ihr Kontingent von 3 kostenlosen Fragen erreicht. Bitte registrieren Sie sich, um unbegrenzt weiterzufragen.' : 'You have used up your 3 free questions. Please sign up to continue asking unlimited questions.');
        return;
      } else {
        const newCount = count + 1;
        localStorage.setItem('free_questions_count', newCount.toString());
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
      // Prepare conversation context for the API
      const conversationContext = messages.map(msg => ({
        role: msg.role,
        content: msg.content,
      }));

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
        }),
      });

      if (!response.ok) {
        let errorMsg = 'API request failed';
        try {
          const errorData = await response.json();
          errorMsg = errorData.error || errorMsg;
        } catch {}
        setError(errorMsg);
        setIsLoading(false);
        return;
      }

      // Streaming response handling
      const reader = response.body?.getReader();
      if (!reader) {
        setError('No response body from server.');
        setIsLoading(false);
        return;
      }
      let assistantContent = '';
      const assistantId = Date.now().toString();
      let done = false;
      let buffer = '';
      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        if (value) {
          buffer += new TextDecoder().decode(value);
          // OpenAI streams as data: {"id":..., "choices":...}\n\n
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const jsonStr = line.replace('data: ', '').trim();
              if (jsonStr === '[DONE]') continue;
              try {
                const parsed = JSON.parse(jsonStr);
                const delta = parsed.choices?.[0]?.delta?.content || parsed.choices?.[0]?.message?.content || '';
                if (delta) {
                  assistantContent += delta;
                  setMessages(prev => {
                    // If last message is assistant and has this id, update it
                    if (prev.length > 0 && prev[prev.length - 1].role === 'assistant' && prev[prev.length - 1].id === assistantId) {
                      return [
                        ...prev.slice(0, -1),
                        { ...prev[prev.length - 1], content: assistantContent },
                      ];
                    } else {
                      // Otherwise, add a new assistant message
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
                // Ignore JSON parse errors for incomplete chunks
              }
            }
          }
        }
      }
      setIsLoading(false);
      // Show disclaimer that metadata is being generated
      setShowMetaDisclaimer(true);
      setTimeout(() => setShowMetaDisclaimer(false), 10000);
    } catch (error) {
      const err = error as Error;
      setError(err.message);
    }
  };

  return (
    <article className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <nav className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-6" aria-label={t("Page navigation", "Seitennavigation")}>
          <header className="text-center sm:text-left">
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3 leading-tight">
              {t("Technical AI", "Technische KI")}
            </h1>
            <p className="text-slate-600 text-lg">
              {t("Get expert answers to your technical questions", "Erhalten Sie Expertenantworten auf Ihre technischen Fragen")}
            </p>
            <span className="inline-block bg-blue-100 text-blue-800 text-sm font-semibold px-4 py-2 rounded-full shadow-sm mt-3">
              {t("AI Assistant", "KI-Assistent")}
            </span>
          </header>
          
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Language Toggle Button */}
            <Link
              href={`/${lang === 'en' ? 'de' : 'en'}/chat`}
              className="inline-flex items-center justify-center px-6 py-3 bg-white text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-all duration-200 shadow-lg hover:shadow-xl border border-slate-200 hover:border-slate-300"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
              </svg>
              {lang === 'en' ? 'Deutsch' : 'English'}
            </Link>
            <Link
              href={`/${lang}/knowledge`}
              className="inline-flex items-center justify-center px-6 py-3 bg-white text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-all duration-200 shadow-lg hover:shadow-xl border border-slate-200 hover:border-slate-300"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              {t("Knowledge Base", "Wissensdatenbank")}
            </Link>
          </div>
        </nav>

        <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
          <div className="p-6 pb-4">
            <div className="space-y-6 mb-6 max-h-[65vh] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100">
              {messages.length === 0 && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">
                    {t("Start a conversation", "Starten Sie ein Gespräch")}
                  </h3>
                </div>
              )}
              
              {messages.map((message, index) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  } animate-in fade-in duration-300`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl p-5 shadow-lg ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white shadow-blue-200'
                        : 'bg-slate-100 text-slate-900 shadow-slate-200'
                    }`}
                  >
                    {message.role === 'assistant' ? (
                      <>
                        <div className="prose prose-blue max-w-none">
                          <ReactMarkdown
                            components={{
                              h1: (props) => <h1 className="font-geist font-bold text-2xl mt-4 mb-2" style={{fontFamily: 'Geist, Inter, Arial, sans-serif'}} {...props} />,
                              h2: (props) => <h2 className="font-geist font-semibold text-xl mt-4 mb-2" style={{fontFamily: 'Geist, Inter, Arial, sans-serif'}} {...props} />,
                              h3: (props) => <h3 className="font-geist font-medium text-lg mt-4 mb-2" style={{fontFamily: 'Geist, Inter, Arial, sans-serif'}} {...props} />,
                              strong: (props) => <strong className="font-bold text-blue-800" {...props} />,
                              em: (props) => <em className="italic text-blue-700" {...props} />,
                              p: (props) => <p className="my-3 leading-relaxed text-base" {...props} />,
                              li: (props) => <li className="sm:ml-4 ml-2 my-1 sm:pl-1 pl-0 list-inside" {...props} />,
                              ol: (props) => <ol className="list-decimal sm:ml-6 ml-2 my-2" {...props} />,
                              ul: (props) => <ul className="list-disc sm:ml-6 ml-2 my-2" {...props} />,
                              code: (props) => <code className="bg-slate-200 px-1 rounded text-sm" {...props} />,
                            }}
                          >
                            {message.content}
                          </ReactMarkdown>
                        </div>
                        {showMetaDisclaimer && index === messages.length - 1 && (
                          <div className="mt-3 text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                            This answer is being internally evaluated for quality and metadata. It may take a few seconds before it appears in the knowledge base.
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="whitespace-pre-wrap text-base leading-relaxed">{message.content}</p>
                    )}
                    <div className={`text-xs mt-3 opacity-70 ${
                      message.role === 'user' ? 'text-blue-100' : 'text-slate-500'
                    }`}>
                      {new Date(message.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start animate-in fade-in duration-300">
                  <div className="bg-slate-100 text-slate-900 rounded-2xl p-5 shadow-lg">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce"></div>
                      <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                      <span className="text-sm text-slate-600 ml-2">
                        {t("AI is thinking...", "KI denkt nach...")}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {freeLimitReached && !user && (
              <div className="mb-6 p-4 bg-yellow-50 text-yellow-900 border border-yellow-200 rounded-xl shadow-sm">
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-medium">
                    {lang === 'de'
                      ? 'Sie haben Ihr Kontingent von 3 kostenlosen Fragen erreicht. Bitte registrieren Sie sich, um unbegrenzt weiterzufragen.'
                      : 'You have used up your 3 free questions. Please sign up to continue asking unlimited questions.'}
                  </span>
                </div>
              </div>
            )}

            {error && (
              <div className="mb-6 p-4 bg-red-50 text-red-800 border border-red-200 rounded-xl shadow-sm">
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-medium">{error}</span>
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-slate-200 p-6 bg-slate-50">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <div className="flex-1 relative">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={t("Type your question...", "Frage eingeben...")}
                  className="w-full px-5 py-3 text-base border border-slate-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition-all duration-200 bg-white text-gray-900 resize-none min-h-[48px] max-h-40"
                  disabled={isLoading || (freeLimitReached && !user)}
                  maxLength={1000}
                  rows={1}
                  aria-label={t("Type your question...", "Frage eingeben...")}
                />
              </div>
              <button
                type="submit"
                disabled={isLoading || !input.trim() || (freeLimitReached && !user)}
                className="px-4 py-2 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md flex items-center text-sm"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                {t("Send", "Senden")}
              </button>
            </form>
            
            {!user && !freeLimitReached && (
              <div className="mt-4 p-3 bg-blue-50 text-blue-800 border border-blue-200 rounded-xl text-sm">
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>
                    {t(
                      `You have ${3 - freeQuestionsCount} free questions remaining. Sign up for unlimited access.`,
                      `Sie haben noch ${3 - freeQuestionsCount} kostenlose Fragen übrig. Registrieren Sie sich für unbegrenzten Zugang.`
                    )}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* New Chat link below chat area, only if there are messages */}
        {messages.length > 0 && (
          <div className="flex justify-end mt-2">
            <button
              type="button"
              onClick={handleNewChat}
              className="text-blue-600 underline font-medium text-sm hover:text-blue-800 transition-colors"
            >
              {t('Start a new Chat', 'Neue Konversation')}
            </button>
          </div>
        )}
        {/* Disclaimer */}
        <div className="mt-8 text-center">
          <span className="text-xs text-gray-500 opacity-70">
            This answer was generated automatically. Please verify with official documentation where necessary.
          </span>
        </div>
      </div>
    </article>
  );
}

export default function ChatClient() {
  const params = useParams();
  const lang = params.lang as string;
  
  return (
    <Suspense fallback={<div>{lang === 'de' ? 'Lädt...' : 'Loading...'}</div>}>
      <ChatPageContent />
    </Suspense>
  );
} 