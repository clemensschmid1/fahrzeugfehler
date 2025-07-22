#!/usr/bin/env tsx
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const PUBLIC_DIR = path.join(__dirname, '../public');
const SITEMAP_SIZE = 1000; // 1000 URLs per sitemap file

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gogegwnsjhbeqfvzgprs.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdvZ2Vnd25zamhiZXFmdnpncHJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU1MDg2ODgsImV4cCI6MjA2MTA4NDY4OH0.kf04_zNNKHLK0Q9s02lEuZ5jjSgvCCUPrZ7NeUgvjZ4'
);

function makeSitemapXml(urls: string[]): string {
  const urlEntries = urls.map(url => `  <url>
    <loc>${url}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>
`;
}

async function generateSitemaps() {
  console.log('🔄 Fetching all live questions from database...');
  
  try {
    // Fetch all live questions with pagination to avoid timeouts
    const allQuestions: Array<{ slug: string; language_path: string }> = [];
    let from = 0;
    const batchSize = 1000;
    
    while (true) {
      console.log(`📥 Fetching batch starting from ${from}...`);
      
      const { data, error } = await supabase
        .from('questions')
        .select('slug, language_path')
        .eq('status', 'live')
        .eq('is_main', true)
        .range(from, from + batchSize - 1);
      
      if (error) {
        console.error('❌ Database error:', error);
        break;
      }
      
      if (!data || data.length === 0) {
        console.log('✅ No more data to fetch');
        break;
      }
      
      allQuestions.push(...data);
      console.log(`📊 Fetched ${data.length} questions (total: ${allQuestions.length})`);
      
      if (data.length < batchSize) {
        console.log('✅ Reached end of data');
        break;
      }
      
      from += batchSize;
    }
    
    console.log(`\n📈 Total questions found: ${allQuestions.length}`);
    
    // Generate URLs for each question
    const allUrls: string[] = [];
    
    for (const question of allQuestions) {
      if (question.language_path === 'en') {
        allUrls.push(`https://infoneva.com/en/knowledge/${question.slug}`);
      } else if (question.language_path === 'de') {
        allUrls.push(`https://infoneva.com/de/knowledge/${question.slug}`);
      }
    }
    
    console.log(`🌐 Total URLs generated: ${allUrls.length}`);
    
    // Split URLs into sitemap files
    const sitemapFiles: string[] = [];
    const totalSitemaps = Math.ceil(allUrls.length / SITEMAP_SIZE);
    
    console.log(`📁 Creating ${totalSitemaps} sitemap files...`);
    
    for (let i = 0; i < totalSitemaps; i++) {
      const startIndex = i * SITEMAP_SIZE;
      const endIndex = Math.min(startIndex + SITEMAP_SIZE, allUrls.length);
      const urlsForThisSitemap = allUrls.slice(startIndex, endIndex);
      
      const sitemapXml = makeSitemapXml(urlsForThisSitemap);
      const filename = `sitemap-${i}.xml`;
      const filepath = path.join(PUBLIC_DIR, filename);
      
      fs.writeFileSync(filepath, sitemapXml, { encoding: 'utf8' });
      sitemapFiles.push(filename);
      
      console.log(`✅ Created ${filename} with ${urlsForThisSitemap.length} URLs`);
    }
    
    // Clean up old sitemap files that are no longer needed
    const existingFiles = fs.readdirSync(PUBLIC_DIR)
      .filter(f => /^sitemap-\d+\.xml$/.test(f))
      .sort((a, b) => {
        const aNum = parseInt(a.match(/sitemap-(\d+)\.xml/)![1], 10);
        const bNum = parseInt(b.match(/sitemap-(\d+)\.xml/)![1], 10);
        return aNum - bNum;
      });
    
    // Remove files that are beyond our new count
    for (const oldFile of existingFiles) {
      const fileNum = parseInt(oldFile.match(/sitemap-(\d+)\.xml/)![1], 10);
      if (fileNum >= totalSitemaps) {
        const oldFilePath = path.join(PUBLIC_DIR, oldFile);
        fs.unlinkSync(oldFilePath);
        console.log(`🗑️  Removed old ${oldFile}`);
      }
    }
    
    console.log(`\n🎉 Successfully generated ${totalSitemaps} sitemap files:`);
    sitemapFiles.forEach(file => console.log(`   - ${file}`));
    console.log(`📊 Total URLs: ${allUrls.length}`);
    console.log(`📊 URLs per sitemap: ${SITEMAP_SIZE}`);
    
    return sitemapFiles;
    
  } catch (error) {
    console.error('❌ Error generating sitemaps:', error);
    throw error;
  }
}

// Run the script
generateSitemaps()
  .then(() => {
    console.log('\n✅ Sitemap generation complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Sitemap generation failed:', error);
    process.exit(1);
  }); 