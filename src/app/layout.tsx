import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ReactNode } from "react";
import Script from "next/script";
import { headers } from "next/headers";
import { ThemeProvider } from "@/lib/contexts/ThemeContext";
import UserSessionProvider from "@/components/UserSessionProvider";
import Footer from "@/components/Footer";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import ClientClarityInit from "@/components/ClientClarityInit";
import { OrganizationStructuredData, WebsiteStructuredData } from "@/components/StructuredData";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://fahrzeugfehler.de"),
  title: {
    default: "Fahrzeugfehler.de: Diagnose-Datenbank für Fahrzeugfehler",
    template: "%s | Fahrzeugfehler.de",
  },
  description:
    "Umfassende Diagnose-Datenbank für Fahrzeugfehler. Technische Lösungen und Ursachenanalysen für alle Automarken und Modelle.",
  keywords: [
    "Fahrzeugfehler",
    "Autoreparatur",
    "Fehlerdiagnose",
    "Fahrzeugdiagnose",
    "Reparaturanleitung",
    "Fehlercode",
    "Auto Fehler",
    "Kfz Reparatur",
    "Werkstatt",
    "Fahrzeugtechnik",
  ],
  authors: [{ name: "Fahrzeugfehler.de Redaktion" }],
  creator: "Fahrzeugfehler.de",
  publisher: "Fahrzeugfehler.de",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
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
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION,
    other: {
      'msvalidate.01': '04FC17AA84330E866FDBF4F1C78EFD59',
    },
  },
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/apple-icon.svg', type: 'image/svg+xml' },
    ],
  },
};

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  // Site is German only
  const lang = 'de';
  return (
    <html lang={lang} className={`${geistSans.variable} ${geistMono.variable}`} suppressHydrationWarning>
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
        {/* Google Ads Conversion Tracking */}
        <Script
          id="google-ads-gtag-src"
          src="https://www.googletagmanager.com/gtag/js?id=AW-17794505631"
          strategy="afterInteractive"
          async
        />
        <Script id="google-ads-gtag-inline" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'AW-17794505631');
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
        <Script defer data-domain="fahrzeugfehler.de" src="https://plausible.io/js/script.js" strategy="lazyOnload"></Script>
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
        {/* Matomo */}
        <Script id="matomo-tracking" strategy="afterInteractive">
          {`
            var _paq = window._paq = window._paq || [];
            /* tracker methods like "setCustomDimension" should be called before "trackPageView" */
            _paq.push(['trackPageView']);
            _paq.push(['enableLinkTracking']);
            (function() {
              var u="https://fahrzeugfehler.matomo.cloud/";
              _paq.push(['setTrackerUrl', u+'matomo.php']);
              _paq.push(['setSiteId', '1']);
              var d=document, g=d.createElement('script'), s=d.getElementsByTagName('script')[0];
              g.async=true; g.src='https://cdn.matomo.cloud/fahrzeugfehler.matomo.cloud/matomo.js'; s.parentNode.insertBefore(g,s);
            })();
          `}
        </Script>
        {/* End Matomo Code */}
        {/* ContentSquare */}
        <Script
          src="https://t.contentsquare.net/uxa/469e33c68e5d9.js"
          strategy="afterInteractive"
        />
        {/* End ContentSquare */}
        <style suppressHydrationWarning dangerouslySetInnerHTML={{__html: `
          /* Force theme styles */
          html:not(.dark) {
            color-scheme: light;
          }
          html.dark {
            color-scheme: dark;
          }
        `}} />
      </head>
      <body className="antialiased">
        <Script id="theme-init" strategy="beforeInteractive">
          {`
            (function() {
              try {
                const stored = localStorage.getItem('fahrzeugfehler-theme');
                // Default to light mode (bright mode) - ignore system preference
                const theme = stored === 'dark' || stored === 'light' ? stored : 'light';
                const root = document.documentElement;
                root.classList.remove('dark');
                if (theme === 'dark') {
                  root.classList.add('dark');
                  root.style.setProperty('--background', '#0a0a0a');
                  root.style.setProperty('--foreground', '#ededed');
                } else {
                  root.style.setProperty('--background', '#ffffff');
                  root.style.setProperty('--foreground', '#171717');
                }
              } catch (e) {}
            })();
          `}
        </Script>
        <ThemeProvider>
          <UserSessionProvider>
            <OrganizationStructuredData />
            <WebsiteStructuredData />
            <Header />
            <div className="flex-1">
              {children}
            </div>
            <Footer />
          </UserSessionProvider>
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
        <ClientClarityInit />
        {/* SimpleAnalytics - 100% privacy-first analytics */}
        <Script
          async
          src="https://scripts.simpleanalyticscdn.com/latest.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
