import MainPageClient from './MainPageClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Fahrzeugfehler.de: Diagnose-Datenbank für Fahrzeugfehler',
  description: 'Umfassende Diagnose-Datenbank für Fahrzeugfehler. Technische Lösungen, Ursachenanalysen und Reparaturhinweise für alle Automarken und Modelle. Professionelle Fehlerdiagnose für Werkstätten und Fahrzeughalter.',
  keywords: [
    'Fahrzeugfehler',
    'Autoreparatur',
    'Fehlerdiagnose',
    'Fahrzeugdiagnose',
    'Reparaturanleitung',
    'Fehlercode',
    'Auto Fehler',
    'Kfz Reparatur',
    'Werkstatt',
    'Fahrzeugtechnik',
    'Diagnose',
    'Fehlerbehebung',
  ],
  openGraph: {
    type: 'website',
    locale: 'de_DE',
    url: 'https://fahrzeugfehler.de',
    siteName: 'Fahrzeugfehler.de',
    title: 'Fahrzeugfehler.de: Diagnose-Datenbank für Fahrzeugfehler',
    description: 'Umfassende Diagnose-Datenbank für Fahrzeugfehler. Technische Lösungen und Ursachenanalysen für alle Automarken und Modelle.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Fahrzeugfehler.de: Diagnose-Datenbank für Fahrzeugfehler',
    description: 'Umfassende Diagnose-Datenbank für Fahrzeugfehler. Technische Lösungen und Ursachenanalysen für alle Automarken und Modelle.',
  },
  alternates: {
    canonical: 'https://fahrzeugfehler.de',
  },
};

export default function Home() {
  return <MainPageClient />;
}
