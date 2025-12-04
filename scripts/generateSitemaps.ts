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

interface UrlWithDate {
  url: string;
  lastmod?: string;
  priority?: number;
  changefreq?: string;
}

function makeSitemapXml(urlsWithData: UrlWithDate[]): string {
  const urlEntries = urlsWithData.map(({ url, lastmod, priority = 0.8, changefreq = 'weekly' }) => {
    const lastmodTag = lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : '';
    return `  <url>
    <loc>${url}</loc>${lastmodTag}
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
  }).join('\n');

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
    const allQuestions: Array<{ slug: string; language_path: string; created_at?: string; last_updated?: string }> = [];
    let from = 0;
    const batchSize = 1000;
    
    while (true) {
      console.log(`📥 Fetching batch starting from ${from}...`);
      
      const { data, error } = await supabase
        .from('questions2')
        .select('slug, language_path')
        .eq('status', 'live')
        .eq('is_main', true)
        .range(from, from + batchSize - 1);
      
      if (error) {
        console.error('❌ Database error:', error);
        console.log('⚠️  Sitemap generation skipped due to database unavailability (this is normal during build)');
        // Exit gracefully - don't fail the build
        return [];
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
    
    // Generate URLs with metadata for each question
    const allUrls: UrlWithDate[] = [];
    const baseUrl = 'https://faultbase.com';
    const now = new Date().toISOString().split('T')[0]; // Current date in YYYY-MM-DD format
    const seenUrls = new Set<string>(); // Track URLs to prevent duplicates
    
    // Add main pages with high priority (exclude internal pages)
    allUrls.push({ url: `${baseUrl}/en`, priority: 1.0, changefreq: 'daily' });
    allUrls.push({ url: `${baseUrl}/de`, priority: 1.0, changefreq: 'daily' });
    allUrls.push({ url: `${baseUrl}/en/knowledge`, priority: 0.9, changefreq: 'daily' });
    allUrls.push({ url: `${baseUrl}/de/knowledge`, priority: 0.9, changefreq: 'daily' });
    allUrls.push({ url: `${baseUrl}/en/news`, priority: 0.9, changefreq: 'daily' });
    allUrls.push({ url: `${baseUrl}/de/news`, priority: 0.9, changefreq: 'daily' });
    allUrls.push({ url: `${baseUrl}/en/reviews`, priority: 0.7, changefreq: 'weekly' });
    allUrls.push({ url: `${baseUrl}/de/reviews`, priority: 0.7, changefreq: 'weekly' });
    allUrls.push({ url: `${baseUrl}/en/chat`, priority: 0.8, changefreq: 'daily' });
    allUrls.push({ url: `${baseUrl}/de/chat`, priority: 0.8, changefreq: 'daily' });
    allUrls.push({ url: `${baseUrl}/en/cars`, priority: 0.9, changefreq: 'daily' });
    allUrls.push({ url: `${baseUrl}/de/cars`, priority: 0.9, changefreq: 'daily' });
    
    // Note: Internal pages (internal/*, carinternal, carbulk) are intentionally excluded from sitemap
    
    // Add knowledge article URLs with lastmod dates (exclude internal pages)
    for (const question of allQuestions) {
      if (!question.slug) continue; // Skip if no slug
      
      // Skip internal pages
      if (question.slug.includes('internal') || question.slug.includes('carinternal')) {
        continue;
      }
      
      let url: string;
      if (question.language_path === 'en') {
        url = `${baseUrl}/en/knowledge/${question.slug}`;
      } else if (question.language_path === 'de') {
        url = `${baseUrl}/de/knowledge/${question.slug}`;
      } else {
        continue; // Skip if language_path is not en or de
      }
      
      // Deduplicate URLs
      if (!seenUrls.has(url)) {
        seenUrls.add(url);
        // Use last_updated if available, otherwise created_at, otherwise current date
        const lastmod = question.last_updated 
          ? new Date(question.last_updated).toISOString().split('T')[0]
          : question.created_at 
          ? new Date(question.created_at).toISOString().split('T')[0]
          : now;
        
        allUrls.push({
          url,
          lastmod,
          priority: 0.8,
          changefreq: 'weekly'
        });
      }
    }
    
    // Add Cars pages (brands, models, generations, faults, manuals)
    console.log('🔄 Fetching Cars data for sitemap...');
    try {
      // Fetch all car brands
      const { data: brands } = await supabase
        .from('car_brands')
        .select('slug, updated_at, created_at');
      
      if (brands && brands.length > 0) {
        for (const brand of brands) {
          const enUrl = `${baseUrl}/en/cars/${brand.slug}`;
          const deUrl = `${baseUrl}/de/cars/${brand.slug}`;
          
          if (!seenUrls.has(enUrl)) {
            seenUrls.add(enUrl);
            const lastmod = brand.updated_at 
              ? new Date(brand.updated_at).toISOString().split('T')[0]
              : brand.created_at 
              ? new Date(brand.created_at).toISOString().split('T')[0]
              : now;
            allUrls.push({
              url: enUrl,
              lastmod,
              priority: 0.8,
              changefreq: 'weekly'
            });
          }
          
          if (!seenUrls.has(deUrl)) {
            seenUrls.add(deUrl);
            const lastmod = brand.updated_at 
              ? new Date(brand.updated_at).toISOString().split('T')[0]
              : brand.created_at 
              ? new Date(brand.created_at).toISOString().split('T')[0]
              : now;
            allUrls.push({
              url: deUrl,
              lastmod,
              priority: 0.8,
              changefreq: 'weekly'
            });
          }
        }
        
        // Fetch all car models
        const { data: models } = await supabase
          .from('car_models')
          .select('slug, updated_at, created_at, car_brands(slug)');
        
        if (models && models.length > 0) {
          for (const model of models) {
            const carBrands = model.car_brands as unknown as { slug: string } | { slug: string }[];
            const brandSlug = Array.isArray(carBrands) ? carBrands[0]?.slug : carBrands?.slug;
            if (!brandSlug) continue;
            
            const enUrl = `${baseUrl}/en/cars/${brandSlug}/${model.slug}`;
            const deUrl = `${baseUrl}/de/cars/${brandSlug}/${model.slug}`;
            
            if (!seenUrls.has(enUrl)) {
              seenUrls.add(enUrl);
              const lastmod = model.updated_at 
                ? new Date(model.updated_at).toISOString().split('T')[0]
                : model.created_at 
                ? new Date(model.created_at).toISOString().split('T')[0]
                : now;
              allUrls.push({
                url: enUrl,
                lastmod,
                priority: 0.7,
                changefreq: 'weekly'
              });
            }
            
            if (!seenUrls.has(deUrl)) {
              seenUrls.add(deUrl);
              const lastmod = model.updated_at 
                ? new Date(model.updated_at).toISOString().split('T')[0]
                : model.created_at 
                ? new Date(model.created_at).toISOString().split('T')[0]
                : now;
              allUrls.push({
                url: deUrl,
                lastmod,
                priority: 0.7,
                changefreq: 'weekly'
              });
            }
          }
        }
        
        // Fetch all model generations
        const { data: generations } = await supabase
          .from('model_generations')
          .select('slug, updated_at, created_at, car_models(slug, car_brands(slug))');
        
        if (generations && generations.length > 0) {
          for (const generation of generations) {
            const carModels = generation.car_models as unknown as { slug: string; car_brands: { slug: string } | { slug: string }[] } | { slug: string; car_brands: { slug: string } | { slug: string }[] }[];
            const modelData = Array.isArray(carModels) ? carModels[0] : carModels;
            if (!modelData) continue;
            
            const carBrands = modelData.car_brands as unknown as { slug: string } | { slug: string }[];
            const brandSlug = Array.isArray(carBrands) ? carBrands[0]?.slug : carBrands?.slug;
            if (!brandSlug) continue;
            
            const enUrl = `${baseUrl}/en/cars/${brandSlug}/${modelData.slug}/${generation.slug}`;
            const deUrl = `${baseUrl}/de/cars/${brandSlug}/${modelData.slug}/${generation.slug}`;
            
            if (!seenUrls.has(enUrl)) {
              seenUrls.add(enUrl);
              const lastmod = generation.updated_at 
                ? new Date(generation.updated_at).toISOString().split('T')[0]
                : generation.created_at 
                ? new Date(generation.created_at).toISOString().split('T')[0]
                : now;
              allUrls.push({
                url: enUrl,
                lastmod,
                priority: 0.6,
                changefreq: 'weekly'
              });
            }
            
            if (!seenUrls.has(deUrl)) {
              seenUrls.add(deUrl);
              const lastmod = generation.updated_at 
                ? new Date(generation.updated_at).toISOString().split('T')[0]
                : generation.created_at 
                ? new Date(generation.created_at).toISOString().split('T')[0]
                : now;
              allUrls.push({
                url: deUrl,
                lastmod,
                priority: 0.6,
                changefreq: 'weekly'
              });
            }
          }
        }
        
        // Fetch all car faults
        const { data: faults } = await supabase
          .from('car_faults')
          .select('slug, language_path, updated_at, created_at, model_generations(slug, car_models(slug, car_brands(slug)))')
          .eq('status', 'live');
        
        if (faults && faults.length > 0) {
          for (const fault of faults) {
            if (!fault.slug || !fault.language_path || (fault.language_path !== 'en' && fault.language_path !== 'de')) continue;
            
            const generationData = fault.model_generations as unknown as { slug: string; car_models: { slug: string; car_brands: { slug: string } | { slug: string }[] } | { slug: string; car_brands: { slug: string } | { slug: string }[] }[] } | { slug: string; car_models: { slug: string; car_brands: { slug: string } | { slug: string }[] } | { slug: string; car_brands: { slug: string } | { slug: string }[] }[] }[];
            const genData = Array.isArray(generationData) ? generationData[0] : generationData;
            if (!genData) continue;
            
            const modelData = genData.car_models as unknown as { slug: string; car_brands: { slug: string } | { slug: string }[] } | { slug: string; car_brands: { slug: string } | { slug: string }[] }[];
            const model = Array.isArray(modelData) ? modelData[0] : modelData;
            if (!model) continue;
            
            const carBrands = model.car_brands as unknown as { slug: string } | { slug: string }[];
            const brandSlug = Array.isArray(carBrands) ? carBrands[0]?.slug : carBrands?.slug;
            if (!brandSlug) continue;
            
            const url = `${baseUrl}/${fault.language_path}/cars/${brandSlug}/${model.slug}/${genData.slug}/faults/${fault.slug}`;
            
            if (!seenUrls.has(url)) {
              seenUrls.add(url);
              const lastmod = fault.updated_at 
                ? new Date(fault.updated_at).toISOString().split('T')[0]
                : fault.created_at 
                ? new Date(fault.created_at).toISOString().split('T')[0]
                : now;
              allUrls.push({
                url,
                lastmod,
                priority: 0.7,
                changefreq: 'monthly'
              });
            }
          }
        }
        
        // Fetch all car manuals
        const { data: manuals } = await supabase
          .from('car_manuals')
          .select('slug, language_path, updated_at, created_at, model_generations(slug, car_models(slug, car_brands(slug)))')
          .eq('status', 'live');
        
        if (manuals && manuals.length > 0) {
          for (const manual of manuals) {
            if (!manual.slug || !manual.language_path || (manual.language_path !== 'en' && manual.language_path !== 'de')) continue;
            
            const generationData = manual.model_generations as unknown as { slug: string; car_models: { slug: string; car_brands: { slug: string } | { slug: string }[] } | { slug: string; car_brands: { slug: string } | { slug: string }[] }[] } | { slug: string; car_models: { slug: string; car_brands: { slug: string } | { slug: string }[] } | { slug: string; car_brands: { slug: string } | { slug: string }[] }[] }[];
            const genData = Array.isArray(generationData) ? generationData[0] : generationData;
            if (!genData) continue;
            
            const modelData = genData.car_models as unknown as { slug: string; car_brands: { slug: string } | { slug: string }[] } | { slug: string; car_brands: { slug: string } | { slug: string }[] }[];
            const model = Array.isArray(modelData) ? modelData[0] : modelData;
            if (!model) continue;
            
            const carBrands = model.car_brands as unknown as { slug: string } | { slug: string }[];
            const brandSlug = Array.isArray(carBrands) ? carBrands[0]?.slug : carBrands?.slug;
            if (!brandSlug) continue;
            
            const url = `${baseUrl}/${manual.language_path}/cars/${brandSlug}/${model.slug}/${genData.slug}/manuals/${manual.slug}`;
            
            if (!seenUrls.has(url)) {
              seenUrls.add(url);
              const lastmod = manual.updated_at 
                ? new Date(manual.updated_at).toISOString().split('T')[0]
                : manual.created_at 
                ? new Date(manual.created_at).toISOString().split('T')[0]
                : now;
              allUrls.push({
                url,
                lastmod,
                priority: 0.7,
                changefreq: 'monthly'
              });
            }
          }
        }
        
        console.log(`✅ Added ${brands.length} brands, ${models?.length || 0} models, ${generations?.length || 0} generations, ${faults?.length || 0} faults, and ${manuals?.length || 0} manuals to sitemap`);
      }
    } catch (error) {
      console.log('⚠️  Cars data fetch failed (this is normal if database is unavailable):', error);
      // Continue without failing - Cars pages will be added in next build
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
    console.log('⚠️  Sitemap generation skipped due to error (this is normal during build)');
    // Return empty array instead of throwing - don't fail the build
    return [];
  }
}

// Run the script
generateSitemaps()
  .then((sitemapFiles) => {
    if (sitemapFiles.length === 0) {
      console.log('\n⚠️  No sitemaps generated (database may be unavailable during build)');
      console.log('✅ Build will continue - sitemaps can be generated manually if needed');
    } else {
      console.log('\n✅ Sitemap generation complete!');
    }
    process.exit(0); // Always exit with success to not fail the build
  })
  .catch((error) => {
    console.error('\n❌ Sitemap generation failed:', error);
    console.log('⚠️  Build will continue - sitemaps can be generated manually if needed');
    process.exit(0); // Exit with success to not fail the build
  }); 