const { createClient } = require('@supabase/supabase-js');

// Load environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gogegwnsjhbeqfvzgprs.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdvZ2Vnd25zamhiZXFmdnpncHJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU1MDg2ODgsImV4cCI6MjA2MTA4NDY4OH0.kf04_zNNKHLK0Q9s02lEuZ5jjSgvCCUPrZ7NeUgvjZ4';

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: 'https://infoneva.com',
  generateRobotsTxt: true,
  changefreq: 'daily',
  priority: 0.7,
  sitemapSize: 1000,
  
  // Exclude internal routes, auth pages, and API endpoints
  exclude: [
    '/internal', 
    '/internal/*', 
    '/internal/promptcheck',
    '/en/internal/promptcheck',
    '/de/internal/promptcheck',
    '/login', 
    '/signup', 
    '/profile',
    '/api/*',
    '/developer',
    '/debug-math',
  ],

  // Configure robots.txt
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
      },
      {
        userAgent: '*',
        disallow: [
          '/internal/', 
          '/internal/promptcheck',
          '/en/internal/promptcheck',
          '/de/internal/promptcheck',
          '/login', 
          '/signup', 
          '/profile',
          '/api/',
        ],
      },
    ],
  },
  
  // Function to generate alternate hreflang links
  transform: async (config, path) => {
    // Exclude root path from transform
    if (path === '/') {
      return null;
    }

    const defaultLang = 'en';
    const otherLang = 'de';

    // Check if the path is a knowledge article
    if (path.startsWith(`/${defaultLang}/knowledge/`) || path.startsWith(`/${otherLang}/knowledge/`)) {
      return null; // These are handled by additionalPaths
    }

    // Skip internal routes
    if (path.includes('/internal/') || path.includes('/login') || path.includes('/signup') || path.includes('/profile')) {
      return null;
    }

    // Generate proper hreflang URLs
    let enPath, dePath;
    
    if (path.startsWith(`/${defaultLang}/`)) {
      enPath = path;
      dePath = path.replace(`/${defaultLang}/`, `/${otherLang}/`);
    } else if (path.startsWith(`/${otherLang}/`)) {
      dePath = path;
      enPath = path.replace(`/${otherLang}/`, `/${defaultLang}/`);
    } else {
      // For paths without language prefix, add both
      enPath = `/${defaultLang}${path}`;
      dePath = `/${otherLang}${path}`;
    }

    return {
      loc: path,
      changefreq: config.changefreq,
      priority: config.priority,
      lastmod: config.autoLastmod ? new Date().toISOString() : undefined,
      alternateRefs: [
        { href: `${config.siteUrl}${enPath}`, hreflang: 'en' },
        { href: `${config.siteUrl}${dePath}`, hreflang: 'de' },
      ],
    };
  },
  
  // Function to dynamically add paths from the database
  additionalPaths: async (config) => {
    // 🔥 OPTIMIZATION: Use pagination and limit to avoid timeouts
    async function fetchQuestionsWithLimit(limit = 5000) {
      const all = [];
      let from = 0;
      const batchSize = 1000;
      let totalFetched = 0;
      
      while (totalFetched < limit) {
        const { data, error } = await supabase
          .from('questions')
          .select('slug, updated_at, language_path')
          .eq('status', 'live')
          .eq('is_main', true)
          .range(from, from + batchSize - 1);
          
        if (error) {
          console.error('SITEMAP ERROR:', error);
          break; // Stop on error instead of throwing
        }
        
        if (!data || data.length === 0) break;
        
        all.push(...data);
        totalFetched += data.length;
        
        if (data.length < batchSize) break;
        from += batchSize;
        
        // Safety check to prevent infinite loops
        if (totalFetched >= limit) break;
      }
      
      return all;
    }

    try {
      // 🔥 OPTIMIZATION: Limit to 5000 questions to avoid timeout
      const questions = await fetchQuestionsWithLimit(5000);
      const results = [];
      
      for (const question of questions) {
        if (question.language_path === 'en') {
          const enPath = `/en/knowledge/${question.slug}`;
          results.push({
            loc: enPath,
            changefreq: 'weekly',
            priority: 0.8,
            lastmod: new Date(question.updated_at).toISOString(),
            alternateRefs: [
              { href: `${config.siteUrl}${enPath}`, hreflang: 'en' },
            ],
          });
        } else if (question.language_path === 'de') {
          const dePath = `/de/knowledge/${question.slug}`;
          results.push({
            loc: dePath,
            changefreq: 'weekly',
            priority: 0.8,
            lastmod: new Date(question.updated_at).toISOString(),
            alternateRefs: [
              { href: `${config.siteUrl}${dePath}`, hreflang: 'de' },
            ],
          });
        }
      }
      
      console.log('SITEMAP DEBUG: additionalPaths results count:', results.length);
      return results;
    } catch (error) {
      console.error('SITEMAP CRITICAL ERROR:', error);
      // Return empty array instead of crashing the build
      return [];
    }
  },
}; 