/**
 * FAULTBASE: Industrial Knowledge Hub
 */
import MainPageClient from './MainPageClient';
import type { Metadata } from 'next';

type Params = { lang: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { lang } = await params;
  const siteUrl = 'https://faultbase.com';

  const title = lang === 'de'
    ? 'FAULTBASE: Industrielles Wissenszentrum für Fehlerdiagnose'
    : 'FAULTBASE: Industrial Knowledge Hub for Fault Diagnosis';

  const description = lang === 'de'
    ? 'FAULTBASE verwandelt Fehlercodes in sofortige Lösungen. Präzise Diagnose für industrielle Automatisierung - keine Wartezeiten, nur Antworten.'
    : 'FAULTBASE transforms fault codes into instant solutions. Precision diagnosis for industrial automation - no downtime, just answers.';

  const canonicalUrl = `${siteUrl}/${lang}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        'en': `${siteUrl}/en`,
        'de': `${siteUrl}/de`,
      },
    },
    other: {
      'og:title': title,
      'og:description': description,
      'og:url': canonicalUrl,
      'og:site_name': 'FAULTBASE',
    },
  };
}

export default async function MainPage({ params }: { params: Promise<Params> }) {
  const { lang } = await params;
  return <MainPageClient lang={lang} />;
}
