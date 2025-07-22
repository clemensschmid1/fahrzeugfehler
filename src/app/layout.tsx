import { ReactNode } from 'react';
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Footer from '@/components/Footer';
import Script from 'next/script';
import UserSessionProvider from '@/components/UserSessionProvider';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { headers } from 'next/headers';
import ClientClarityInit from '@/components/ClientClarityInit';

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
        {/* Google tag (gtag.js) */}
        <Script
          id="google-gtag-src"
          src="https://www.googletagmanager.com/gtag/js?id=G-HQBPXZ8LHX"
          strategy="afterInteractive"
          async
        />
        <Script id="google-gtag-inline" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-HQBPXZ8LHX');
          `}
        </Script>
        {/* Bing Clarity tracking code */}
        <Script id="bing-clarity-inline" strategy="afterInteractive">
          {`
            (function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i+"?ref=bwt";
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "sigphxs9mi");
          `}
        </Script>
        <Script defer data-domain="infoneva.com" src="https://plausible.io/js/script.js" strategy="lazyOnload"></Script>
        <Script id="plausible-inline" strategy="lazyOnload">
          {`window.plausible = window.plausible || function() { (window.plausible.q = window.plausible.q || []).push(arguments) }`}
        </Script>
        <Script
          id="adsense-script"
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9438397722476631"
          crossOrigin="anonymous"
          strategy="lazyOnload"
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
        <SpeedInsights />
        <ClientClarityInit />
      </body>
    </html>
  );
}
