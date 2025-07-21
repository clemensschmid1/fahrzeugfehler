"use client";

import { useEffect, useState } from 'react';
import InternalAuth from '@/components/InternalAuth';

interface CheckResult {
  missingInSitemap: string[];
  extraInSitemap: string[];
  loading: boolean;
  error: string | null;
}

function getSlugFromUrl(url: string): string | null {
  // Match /en/knowledge/[slug] or /de/knowledge/[slug]
  const match = url.match(/\/(en|de)\/knowledge\/([^/]+)/);
  return match ? match[2] : null;
}

export default function SitemapCheckPage() {
  const [result, setResult] = useState<CheckResult>({
    missingInSitemap: [],
    extraInSitemap: [],
    loading: true,
    error: null,
  });

  const [stats, setStats] = useState({
    totalUrls: 0,
    enKnowledge: 0,
    deKnowledge: 0,
    nonKnowledge: 0,
  });

  useEffect(() => {
    async function checkSitemap() {
      setResult(r => ({ ...r, loading: true, error: null }));
      try {
        // Fetch sitemap index XML
        const indexRes = await fetch('/sitemap.xml');
        if (!indexRes.ok) throw new Error('Failed to fetch sitemap index');
        const indexText = await indexRes.text();
        const parser = new window.DOMParser();
        const indexDoc = parser.parseFromString(indexText, 'application/xml');
        const sitemapLocs = Array.from(indexDoc.getElementsByTagName('loc')).map(el => el.textContent || '');
        // Fetch all child sitemaps and aggregate URLs
        const locs: string[] = [];
        for (const sitemapUrl of sitemapLocs) {
          try {
            const res = await fetch(sitemapUrl.replace('https://infoneva.com', ''));
            if (!res.ok) continue;
            const xmlText = await res.text();
            const xmlDoc = parser.parseFromString(xmlText, 'application/xml');
            locs.push(...Array.from(xmlDoc.getElementsByTagName('loc')).map(el => el.textContent || ''));
          } catch {
            // skip on error
          }
        }
        // Stats
        const totalUrls = locs.length;
        const enKnowledge = locs.filter(url => url.startsWith('/en/knowledge/') || url.startsWith('https://infoneva.com/en/knowledge/')).length;
        const deKnowledge = locs.filter(url => url.startsWith('/de/knowledge/') || url.startsWith('https://infoneva.com/de/knowledge/')).length;
        const nonKnowledge = locs.filter(url => !/\/(en|de)\/knowledge\//.test(url)).length;
        setStats({ totalUrls, enKnowledge, deKnowledge, nonKnowledge });
        // Only keep /en/knowledge/ and /de/knowledge/ URLs
        const sitemapSlugs = new Set(
          locs
            .map(getSlugFromUrl)
            .filter((slug): slug is string => Boolean(slug))
        );
        // Fetch live slugs from API
        const liveRes = await fetch('/api/internal/live-slugs');
        if (!liveRes.ok) throw new Error('Failed to fetch live slugs');
        const { slugs } = (await liveRes.json()) as { slugs: string[] };
        const liveSlugs = new Set(slugs);
        // Compare
        const missingInSitemap = Array.from(liveSlugs).filter(slug => !sitemapSlugs.has(slug));
        const extraInSitemap = Array.from(sitemapSlugs).filter(slug => !liveSlugs.has(slug));
        setResult({ missingInSitemap, extraInSitemap, loading: false, error: null });
      } catch (err: unknown) {
        let errorMsg = 'Unknown error';
        if (err instanceof Error) errorMsg = err.message;
        setResult(r => ({ ...r, loading: false, error: errorMsg }));
      }
    }
    checkSitemap();
  }, []);

  return (
    <InternalAuth>
      <div className="bg-neutral-900 min-h-screen max-w-[100vw] w-full mx-auto py-12 px-2 md:px-8">
        <h1 className="text-3xl font-bold mb-6 text-white">Sitemap Consistency Check</h1>
        <div className="mb-8 p-4 rounded-xl border border-gray-700 bg-neutral-800">
          {result.loading && <p className="text-gray-200">Checking sitemap...</p>}
          {result.error && <p className="text-red-400">Error: {result.error}</p>}
          {!result.loading && !result.error && (
            <>
              <h2 className="text-xl font-semibold text-white mb-2">Sitemap Stats</h2>
              <ul className="mb-4 text-gray-200">
                <li><span className="font-bold">Total URLs in sitemap:</span> {stats.totalUrls}</li>
                <li><span className="font-bold">/en/knowledge/ pages:</span> {stats.enKnowledge}</li>
                <li><span className="font-bold">/de/knowledge/ pages:</span> {stats.deKnowledge}</li>
                <li><span className="font-bold">Non-knowledge pages:</span> {stats.nonKnowledge}</li>
              </ul>
              <h2 className="text-xl font-semibold text-white mb-2">Results</h2>
              <div className="mb-4">
                <span className="font-bold text-gray-100">Live slugs missing from sitemap:</span>
                {result.missingInSitemap.length === 0 ? (
                  <span className="text-green-400 ml-2">None 🎉</span>
                ) : (
                  <ul className="text-yellow-300 list-disc ml-6">
                    {result.missingInSitemap.map(slug => (
                      <li key={slug}>{slug}</li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <span className="font-bold text-gray-100">Sitemap slugs not live in Supabase:</span>
                {result.extraInSitemap.length === 0 ? (
                  <span className="text-green-400 ml-2">None 🎉</span>
                ) : (
                  <ul className="text-pink-300 list-disc ml-6">
                    {result.extraInSitemap.map(slug => (
                      <li key={slug}>{slug}</li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </InternalAuth>
  );
} 