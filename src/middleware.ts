import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// List of supported languages
const supportedLanguages = ['en', 'de'];

export function middleware(request: NextRequest) {
  // Get the pathname of the request (e.g. /, /knowledge, /chat)
  const pathname = request.nextUrl.pathname;

  // Check if the pathname starts with a supported language
  const pathnameHasLanguage = supportedLanguages.some(
    (lang) => pathname.startsWith(`/${lang}/`)
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
    // Skip all internal paths (_next)
    '/((?!_next|api|favicon.ico).*)',
  ],
}; 