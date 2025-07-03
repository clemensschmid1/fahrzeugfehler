import { ReactNode } from 'react';
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Footer from '@/components/Footer';
import Script from 'next/script';
import UserSessionProvider from '@/components/UserSessionProvider';
import { Analytics } from '@vercel/analytics/next';
import { headers } from 'next/headers';

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
  verification: {
    google: 'your-google-verification-code',
  },
};

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  // Try to get lang from pathname (e.g. /en/..., /de/...)
  let lang = 'en';
  if (typeof window === 'undefined') {
    // On server, try to parse from headers
    const headersList = await headers();
    let pathname = headersList.get('x-invoke-path') || '';
    if (!pathname && process.env.NEXT_PUBLIC_SITE_URL) {
      try {
        pathname = new URL(process.env.NEXT_PUBLIC_SITE_URL).pathname;
      } catch {}
    }
    if (pathname.startsWith('/de')) lang = 'de';
    else if (pathname.startsWith('/en')) lang = 'en';
  } else {
    // On client, use window.location.pathname
    const pathname = window.location.pathname;
    if (pathname.startsWith('/de')) lang = 'de';
    else if (pathname.startsWith('/en')) lang = 'en';
  }
  return (
    <html lang={lang} className={`${geistSans.variable} ${geistMono.variable}`}>
      <head>
        <Script defer data-domain="infoneva.com" src="https://plausible.io/js/script.js"></Script>
        <Script id="plausible-inline">
          {`window.plausible = window.plausible || function() { (window.plausible.q = window.plausible.q || []).push(arguments) }`}
        </Script>
        <Script
          id="adsense-script"
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9438397722476631"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
        <meta name="msvalidate.01" content="04FC17AA84330E866FDBF4F1C78EFD59" />
      </head>
      <body className="antialiased">
        <UserSessionProvider>
          <div className="flex-1">
            {children}
          </div>
          <Footer />
        </UserSessionProvider>
        <Analytics />
      </body>
    </html>
  );
}
