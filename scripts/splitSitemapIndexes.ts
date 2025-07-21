#!/usr/bin/env tsx
import fs from 'fs';
import path from 'path';

const PUBLIC_DIR = path.join(__dirname, '../public');
const SITEMAP_PATTERN = /^sitemap-(\d+)\.xml$/;
const INDEXES_PER_FILE = 10;

function getSitemapFiles(): string[] {
  return fs.readdirSync(PUBLIC_DIR)
    .filter(f => SITEMAP_PATTERN.test(f))
    .sort((a, b) => {
      const aNum = parseInt(a.match(SITEMAP_PATTERN)![1], 10);
      const bNum = parseInt(b.match(SITEMAP_PATTERN)![1], 10);
      return aNum - bNum;
    });
}

function makeIndexXml(sitemapFiles: string[]): string {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapFiles.map(f => `  <sitemap><loc>https://infoneva.com/${f}</loc></sitemap>`).join('\n')}\n</sitemapindex>\n`;
}

function makeRootIndexXml(indexFiles: string[]): string {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${indexFiles.map(f => `  <sitemap><loc>https://infoneva.com/${f}</loc></sitemap>`).join('\n')}\n</sitemapindex>\n`;
}

function main() {
  const sitemapFiles = getSitemapFiles();
  if (sitemapFiles.length === 0) {
    console.error('No sitemap-*.xml files found in public/.');
    process.exit(1);
  }

  // Group into sets of 10
  const indexFiles: string[] = [];
  for (let i = 0; i < sitemapFiles.length; i += INDEXES_PER_FILE) {
    const group = sitemapFiles.slice(i, i + INDEXES_PER_FILE);
    const indexName = `sitemap-index-${Math.floor(i / INDEXES_PER_FILE)}.xml`;
    const indexXml = makeIndexXml(group);
    fs.writeFileSync(path.join(PUBLIC_DIR, indexName), indexXml, { encoding: 'utf8' });
    indexFiles.push(indexName);
    console.log(`Wrote ${indexName} for sitemaps: ${group.join(', ')}`);
  }

  // Write root sitemap.xml referencing all index files
  const rootXml = makeRootIndexXml(indexFiles);
  fs.writeFileSync(path.join(PUBLIC_DIR, 'sitemap.xml'), rootXml, { encoding: 'utf8' });
  console.log(`Wrote root sitemap.xml referencing: ${indexFiles.join(', ')}`);
}

main(); 