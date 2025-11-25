#!/usr/bin/env tsx
import fs from 'fs';
import path from 'path';

const PUBLIC_DIR = path.join(__dirname, '../public');
const SITEMAP_PATTERN = /^sitemap-(\d+)\.xml$/;

function getSitemapFiles(): string[] {
  return fs.readdirSync(PUBLIC_DIR)
    .filter(f => SITEMAP_PATTERN.test(f))
    .sort((a, b) => {
      const aNum = parseInt(a.match(SITEMAP_PATTERN)![1], 10);
      const bNum = parseInt(b.match(SITEMAP_PATTERN)![1], 10);
      return aNum - bNum;
    });
}

function makeRootSitemapIndex(sitemapFiles: string[]): string {
  const baseUrl = 'https://faultbase.com';
  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapFiles.map(f => `  <sitemap><loc>${baseUrl}/${f}</loc></sitemap>`).join('\n')}
</sitemapindex>
`;
}

function main() {
  const sitemapFiles = getSitemapFiles();
  if (sitemapFiles.length === 0) {
    console.log('⚠️  No sitemap-*.xml files found in public/.');
    console.log('⚠️  This is normal if sitemap generation was skipped during build');
    console.log('✅ Build will continue - sitemaps can be generated manually if needed');
    process.exit(0); // Exit with success to not fail the build
  }

  // 🔥 SEO BEST PRACTICE: Create single sitemap.xml pointing to all child sitemaps
  // This is what Google and Bing prefer - no nested indexes
  const rootXml = makeRootSitemapIndex(sitemapFiles);
  fs.writeFileSync(path.join(PUBLIC_DIR, 'sitemap.xml'), rootXml, { encoding: 'utf8' });
  
  console.log(`✅ Created sitemap.xml with ${sitemapFiles.length} child sitemaps:`);
  sitemapFiles.forEach(file => console.log(`   - ${file}`));
  
  // Clean up old index files if they exist
  const oldIndexFiles = ['sitemap-index-0.xml', 'sitemap-index-1.xml'];
  oldIndexFiles.forEach(file => {
    const filePath = path.join(PUBLIC_DIR, file);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`🗑️  Removed old ${file}`);
    }
  });
  
  console.log('\n🎯 SEO OPTIMIZED: Single sitemap index pointing to all child sitemaps');
  console.log('📊 Total URLs: ~' + (sitemapFiles.length * 1000) + ' (1000 per sitemap)');
}

main(); 