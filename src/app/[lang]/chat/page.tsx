import type { Metadata } from 'next';
import { Suspense } from 'react';
import ChatClient from './ChatClient';
import Header from '@/components/Header';

type Params = { lang: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { lang } = await params;
  const siteUrl = 'https://infoneva.com';

  const title = lang === 'de'
    ? 'KI-Chat für die Industrie | Infoneva'
    : 'Industrial AI Chat | Infoneva';
  
  const description = lang === 'de'
    ? 'Stellen Sie Ihre technischen Fragen zu industrieller Automatisierung und erhalten Sie sofortige, präzise Antworten von unserer KI.'
    : 'Ask your technical questions about industrial automation and get instant, accurate answers from our AI.';

  const canonicalUrl = `${siteUrl}/${lang}/chat`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        'en': `${siteUrl}/en/chat`,
        'de': `${siteUrl}/de/chat`,
      },
    },
    other: {
        'og:title': title,
        'og:description': description,
        'og:url': canonicalUrl,
    }
  };
}

// 🔥 OPTIMIZATION: Loading component for better perceived performance
function ChatLoadingFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-3xl shadow-2xl border border-blue-100 overflow-hidden">
          <div className="flex items-center gap-2 bg-blue-50 border-b border-blue-100 px-6 py-3">
            <div className="w-5 h-5 bg-blue-200 rounded animate-pulse"></div>
            <div className="h-4 bg-blue-200 rounded w-64 animate-pulse"></div>
          </div>
          <div className="p-6">
            <div className="space-y-6">
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                  <div className="w-8 h-8 bg-blue-200 rounded"></div>
                </div>
                <div className="h-6 bg-gray-200 rounded w-48 mx-auto mb-2 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-32 mx-auto animate-pulse"></div>
              </div>
            </div>
            <div className="border-t border-slate-200 p-6 bg-slate-50">
              <div className="flex gap-2 items-end">
                <div className="flex-1 h-12 bg-gray-200 rounded-2xl animate-pulse"></div>
                <div className="w-12 h-12 bg-blue-200 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default async function ChatPage() {
  return (
    <>
      <Header />
      <main>
        <Suspense fallback={<ChatLoadingFallback />}>
          <ChatClient />
        </Suspense>
      </main>
    </>
  );
} 