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
  '19b8bc246b244733843ff32b3d426207.txt', // IndexNow key file
];

export function middleware(request: NextRequest) {
  // Get the pathname of the request (e.g. /, /knowledge, /chat)
  const pathname = request.nextUrl.pathname;

  // CRITICAL: Check for .txt files FIRST - IndexNow key files must be accessible without redirect
  // Any .txt file in public/ should be served directly
  if (pathname.endsWith('.txt')) {
    return NextResponse.next();
  }

  // Check if this is a static file that should not be redirected
  // IndexNow key files are 32 hex characters followed by .txt (e.g., /19b8bc246b244733843ff32b3d426207.txt)
  const isIndexNowKeyFile = /^\/[a-f0-9]{32}\.txt$/i.test(pathname);
  const isStaticFile =
    staticFiles.some(file => pathname === `/${file}`) ||
    /^\/sitemap-\d+\.xml$/.test(pathname) ||
    /^\/sitemap-index-\d+\.xml$/.test(pathname) ||
    isIndexNowKeyFile;
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
    // Skip all internal paths (_next), API routes, static files, favicon, and .txt files
    // IndexNow key files are .txt files, so excluding all .txt prevents redirects
    // The middleware function itself checks for .txt files first, but we also exclude them from matcher
    '/((?!_next|api|favicon\\.ico|sitemap.*\\.xml|.*\\.txt$).*)',
  ],
}; 