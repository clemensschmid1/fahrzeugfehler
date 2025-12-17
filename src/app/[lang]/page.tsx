/**
 * Fahrzeugfehler.de: Technische Diagnose-Datenbank
 */
import MainPageClient from './MainPageClient';
import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  const siteUrl = 'https://fahrzeugfehler.de';

  const title = 'Fahrzeugfehler.de: Diagnose-Datenbank für Fahrzeugfehler';
  const description = 'Umfassende Diagnose-Datenbank für Fahrzeugfehler. Technische Lösungen, Ursachenanalysen und Reparaturhinweise für alle Automarken und Modelle.';
  const canonicalUrl = siteUrl;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    other: {
      'og:title': title,
      'og:description': description,
      'og:url': canonicalUrl,
      'og:site_name': 'Fahrzeugfehler.de',
    },
  };
}

export default async function MainPage() {
  return <MainPageClient />;
}
