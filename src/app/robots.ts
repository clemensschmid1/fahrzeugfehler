import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://fahrzeugfehler.de';
  
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/internal/',
          '/api/',
          '/login',
          '/signup',
          '/profile',
          '/admin/',
          '/en/',
          '/de/',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: [
          '/internal/',
          '/api/',
          '/login',
          '/signup',
          '/profile',
          '/admin/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}

