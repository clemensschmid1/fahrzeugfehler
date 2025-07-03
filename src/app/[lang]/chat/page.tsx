import type { Metadata } from 'next';
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

export default function ChatPage() {
  return (
    <>
      <Header />
      <main>
        <ChatClient />
      </main>
    </>
  );
} 