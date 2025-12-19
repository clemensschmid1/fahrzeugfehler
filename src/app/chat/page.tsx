import type { Metadata } from 'next';
import { Suspense } from 'react';
import ChatClient from './ChatClient';

export async function generateMetadata(): Promise<Metadata> {
  const siteUrl = 'https://fahrzeugfehler.de';

  const title = 'Fragen stellen | Fahrzeugfehler.de';
  
  const description = 'Stellen Sie Ihre technischen Fragen zu Fahrzeugfehlern und erhalten Sie sofortige, präzise Antworten.';

  const canonicalUrl = `${siteUrl}/chat`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: 'Fahrzeugfehler.de',
      type: 'website',
      locale: 'de_DE',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
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
    <main>
      <Suspense fallback={<ChatLoadingFallback />}>
        <ChatClient />
      </Suspense>
    </main>
  );
}

