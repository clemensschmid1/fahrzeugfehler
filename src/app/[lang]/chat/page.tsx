'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Send, ArrowLeft, Plus } from 'lucide-react';

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
  const [user, setUser] = useState<any>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Generate UUID for conversation_id
  const generateConversationId = (): string => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  // Load conversation history from Supabase
  const loadConversationHistory = async (convId: string) => {
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
  };

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
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set('conversation_id', newConversationId);
      newUrl.searchParams.delete('prefill_question');
      newUrl.searchParams.delete('prefill_answer');
      router.replace(newUrl.pathname + newUrl.search);
    } else {
      // New chat without any context
      const newConversationId = generateConversationId();
      setConversationId(newConversationId);
      setMessages([]);
      
      // Update URL with new conversation_id
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set('conversation_id', newConversationId);
      router.replace(newUrl.pathname + newUrl.search);
    }
  }, [searchParams, router]);

  const handleNewChat = () => {
    const newConversationId = generateConversationId();
    setConversationId(newConversationId);
    setMessages([]);
    setInput('');
    setError(null);
    
    // Update URL with new conversation_id
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set('conversation_id', newConversationId);
    newUrl.searchParams.delete('prefill_question');
    newUrl.searchParams.delete('prefill_answer');
    router.replace(newUrl.pathname + newUrl.search);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !user) return;

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
        },
        body: JSON.stringify({
          question: input.trim(),
          language: lang,
          conversation_id: conversationId,
          conversation_context: conversationContext,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get response');
      }

      const data = await response.json();
      const answer = data.answer;
      const questionId = data.id;
      const assistantMessage: Message = {
        id: Date.now().toString(),
        content: answer,
        role: 'assistant',
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, assistantMessage]);

      if (questionId) {
        await fetch('/api/questions/generate-metadata', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: questionId }),
        });
      }
    } catch (err: any) {
      console.error('Error in chat:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <article className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <nav className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4" aria-label="Page navigation">
          <header>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 leading-tight">
              Chat with AI
            </h1>
            <span className="inline-block bg-indigo-100 text-indigo-700 text-xs font-semibold px-3 py-1 rounded-full shadow-sm">Chat</span>
          </header>
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleNewChat}
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Chat
            </button>
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

        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
          <div className="space-y-4 mb-6 max-h-[60vh] overflow-y-auto">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-4 ${
                    message.role === 'user'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                  <div className="text-xs mt-2 opacity-75">
                    {new Date(message.created_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-900 rounded-lg p-4">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-100 text-red-800 border border-red-200 rounded-lg">
              {error}
            </div>
          )}

          {user ? (
            <form onSubmit={handleSubmit} className="flex gap-4">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your question..."
                className="flex-1 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Send
              </button>
            </form>
          ) : (
            <div className="text-center p-6 bg-gray-50 rounded-lg">
              <p className="text-gray-700 text-lg mb-4">Please sign in to start chatting!</p>
              <Link
                href={`/${lang}/login`}
                className="inline-block px-8 py-3 bg-indigo-600 text-white rounded-lg shadow-lg hover:bg-indigo-700 transition-colors"
              >
                Sign In
              </Link>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ChatPageContent />
    </Suspense>
  );
} 