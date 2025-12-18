#!/usr/bin/env tsx
import fs from 'fs';
import path from 'path';

const PUBLIC_DIR = path.join(__dirname, '../public');
const SITEMAP_INDEX_FILE = path.join(PUBLIC_DIR, 'sitemap.xml');
const BASE_URL = 'https://fahrzeugfehler.de';

function generateSitemapIndex() {
  console.log('🔄 Generating sitemap index...');
  
  if (!fs.existsSync(PUBLIC_DIR)) {
    fs.mkdirSync(PUBLIC_DIR, { recursive: true });
  }
  
  // Find all sitemap files
  const sitemapFiles = fs.readdirSync(PUBLIC_DIR)
    .filter(f => /^sitemap-\d+\.xml$/.test(f))
    .sort((a, b) => {
      const aNum = parseInt(a.match(/sitemap-(\d+)\.xml/)![1], 10);
      const bNum = parseInt(b.match(/sitemap-(\d+)\.xml/)![1], 10);
      return aNum - bNum;
    });
  
  if (sitemapFiles.length === 0) {
    console.log('⚠️  No sitemap files found. Skipping index generation.');
    return;
  }
  
  // Generate sitemap index XML
  const sitemapEntries = sitemapFiles.map(file => 
    `  <sitemap>
    <loc>${BASE_URL}/${file}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
  </sitemap>`
  ).join('\n');
  
  const sitemapIndexXml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapEntries}
</sitemapindex>
`;
  
  fs.writeFileSync(SITEMAP_INDEX_FILE, sitemapIndexXml, { encoding: 'utf8' });
  console.log(`✅ Generated sitemap.xml with ${sitemapFiles.length} sitemap files`);
}

generateSitemapIndex();

