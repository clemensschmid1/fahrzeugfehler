import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// List of static files that should not be processed
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

  // CRITICAL: Check for static files FIRST - these must be accessible without redirect
  // Any .txt file in public/ should be served directly
  if (pathname.endsWith('.txt')) {
    return NextResponse.next();
  }
  
  // Allow PNG images and JSONL files from generated directory
  if (pathname.startsWith('/generated/') && (pathname.endsWith('.png') || pathname.endsWith('.jsonl'))) {
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

  // Redirect old language-prefixed URLs to new structure (remove /en or /de)
  if (pathname.startsWith('/en/') || pathname.startsWith('/de/')) {
    const newPath = pathname.replace(/^\/(en|de)/, '');
    return NextResponse.redirect(new URL(newPath || '/', request.url));
  }
  
  if (pathname === '/en' || pathname === '/de') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // No language redirect needed - site is German only
  return NextResponse.next();
}

// Configure the middleware to run on specific paths
export const config = {
  matcher: [
    // Skip all internal paths (_next), API routes, static files, favicon, .txt files, and generated files
    // IndexNow key files are .txt files, so excluding all .txt prevents redirects
    // The middleware function itself checks for .txt files first, but we also exclude them from matcher
    '/((?!_next|api|favicon\\.ico|sitemap.*\\.xml|.*\\.txt$|generated/.*\\.png$|generated/.*\\.jsonl$).*)',
  ],
}; 