import type { Metadata } from 'next';
import { Suspense } from 'react';
import ChatClient from './ChatClient';
import Header from '@/components/Header';

type Params = { lang: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { lang } = await params;
  const siteUrl = 'https://faultbase.com';

  const title = lang === 'de'
    ? 'KI-Chat für die Industrie | FAULTBASE'
    : 'Industrial AI Chat | FAULTBASE';
  
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

function ChatLoadingFallback() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-lg overflow-hidden">
          <div className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-3/4"></div>
              <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/2"></div>
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
      <Suspense fallback={<div className="h-16 bg-white dark:bg-black border-b border-black/10 dark:border-white/20"></div>}>
        <Header />
      </Suspense>
      <main>
        <Suspense fallback={<ChatLoadingFallback />}>
          <ChatClient />
        </Suspense>
      </main>
    </>
  );
}
