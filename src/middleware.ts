import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// List of supported languages
const supportedLanguages = ['en', 'de'];

// List of static files that should not be redirected
const staticFiles = [
  'sitemap.xml',
  'robots.txt',
  'BingSiteAuth.xml',
  'indexnow.json',
  'f1e87098a0d4d83cba61dfe7295ba303.txt',
  'sitemap-0.xml',
  'sitemap-1.xml',
  'sitemap-2.xml',
  'sitemap-3.xml',
  'sitemap-4.xml',
  'sitemap-5.xml',
  'sitemap-6.xml',
  'sitemap-7.xml',
  'sitemap-8.xml',
  'sitemap-9.xml',
];

export function middleware(request: NextRequest) {
  // Get the pathname of the request (e.g. /, /knowledge, /chat)
  const pathname = request.nextUrl.pathname;

  // Check if this is a static file that should not be redirected
  const isStaticFile = staticFiles.some(file => pathname === `/${file}`);
  if (isStaticFile) {
    return NextResponse.next();
  }

  // Check if the pathname starts with a supported language
  const pathnameHasLanguage = supportedLanguages.some(
    (lang) => pathname === `/${lang}` || pathname.startsWith(`/${lang}/`)
  );

  // If the pathname already has a language prefix, continue
  if (pathnameHasLanguage) {
    return NextResponse.next();
  }

  // Special handling for /login, /signup, and /internal routes
  if (pathname === '/login' || pathname === '/signup' || pathname.startsWith('/internal')) {
    // Get the preferred language from the request headers
    const acceptLanguage = request.headers.get('accept-language');
    let preferredLanguage = 'en'; // Default to English

    if (acceptLanguage) {
      // Parse the Accept-Language header
      const languages = acceptLanguage.split(',').map((lang) => {
        const [language, quality = '1'] = lang.trim().split(';q=');
        return {
          language: language.split('-')[0], // Get the primary language code
          quality: parseFloat(quality),
        };
      });

      // Sort languages by quality
      languages.sort((a, b) => b.quality - a.quality);

      // Find the first supported language
      const matchedLanguage = languages.find((lang) =>
        supportedLanguages.includes(lang.language)
      );

      if (matchedLanguage) {
        preferredLanguage = matchedLanguage.language;
      }
    }

    // Redirect to the language-prefixed path
    return NextResponse.redirect(
      new URL(`/${preferredLanguage}${pathname}`, request.url)
    );
  }

  // Get the preferred language from the request headers
  const acceptLanguage = request.headers.get('accept-language');
  let preferredLanguage = 'en'; // Default to English

  if (acceptLanguage) {
    // Parse the Accept-Language header
    const languages = acceptLanguage.split(',').map((lang) => {
      const [language, quality = '1'] = lang.trim().split(';q=');
      return {
        language: language.split('-')[0], // Get the primary language code
        quality: parseFloat(quality),
      };
    });

    // Sort languages by quality
    languages.sort((a, b) => b.quality - a.quality);

    // Find the first supported language
    const matchedLanguage = languages.find((lang) =>
      supportedLanguages.includes(lang.language)
    );

    if (matchedLanguage) {
      preferredLanguage = matchedLanguage.language;
    }
  }

  // Redirect to the language-prefixed path
  return NextResponse.redirect(
    new URL(`/${preferredLanguage}${pathname}`, request.url)
  );
}

// Configure the middleware to run on specific paths
export const config = {
  matcher: [
    // Skip all internal paths (_next), API routes, static files, and favicon
    '/((?!_next|api|favicon.ico|sitemap.xml|sitemap-0.xml|sitemap-1.xml|sitemap-2.xml|sitemap-3.xml|sitemap-4.xml|sitemap-5.xml|sitemap-6.xml|sitemap-7.xml|sitemap-8.xml|sitemap-9.xml|robots.txt|BingSiteAuth.xml|indexnow.json|f1e87098a0d4d83cba61dfe7295ba303.txt).*)',
  ],
}; 