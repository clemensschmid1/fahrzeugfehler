import { ReactNode } from 'react';
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Footer from '@/components/Footer';
import Script from 'next/script';
import UserSessionProvider from '@/components/UserSessionProvider';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: 'Infoneva: Industrial AI for Manufacturing | Instant Technical Solutions',
    template: '%s | Infoneva',
  },
  description: 'Infoneva provides instant, precise answers for industrial automation. Access a knowledge base trained on thousands of OEM manuals, error codes, and PLC logic.',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-icon.png',
  },
  openGraph: {
    title: 'Infoneva: Industrial AI for Manufacturing',
    description: 'Instant, precise answers for industrial automation.',
    url: 'https://infoneva.com',
    siteName: 'Infoneva',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Infoneva: Industrial AI for Manufacturing',
    description: 'Instant, precise answers for industrial automation.',
  },
};

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: ReactNode;
  params: Promise<{ lang: string }>;
}>) {
  const { lang } = await params;
  return (
    <html lang={lang || 'en'}>
      <head>
        <Script defer data-domain="infoneva.com" src="https://plausible.io/js/script.hash.outbound-links.js"></Script>
        <Script id="plausible-inline">
          {`window.plausible = window.plausible || function() { (window.plausible.q = window.plausible.q || []).push(arguments) }`}
        </Script>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <UserSessionProvider>
          <div className="flex-1">
            {children}
          </div>
          <Footer />
        </UserSessionProvider>
      </body>
    </html>
  );
}
