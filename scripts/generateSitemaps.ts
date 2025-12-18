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
  console.log('🔄 Generating sitemap for fahrzeugfehler.de (German-only)...');
  
  // Clean up old sitemap files FIRST, before Vercel processes them
  if (fs.existsSync(PUBLIC_DIR)) {
    const existingFiles = fs.readdirSync(PUBLIC_DIR)
      .filter(f => /^sitemap-\d+\.xml$/.test(f));
    
    if (existingFiles.length > 0) {
      console.log(`🗑️  Cleaning up ${existingFiles.length} old sitemap files...`);
      for (const oldFile of existingFiles) {
        const oldFilePath = path.join(PUBLIC_DIR, oldFile);
        try {
          fs.unlinkSync(oldFilePath);
          console.log(`   Removed ${oldFile}`);
        } catch (error) {
          // Ignore errors if file doesn't exist
        }
      }
    }
  }
  
  const allUrls: UrlWithDate[] = [];
  const baseUrl = 'https://fahrzeugfehler.de';
  const now = new Date().toISOString().split('T')[0]; // Current date in YYYY-MM-DD format
  const seenUrls = new Set<string>(); // Track URLs to prevent duplicates
  
  // Add main pages with high priority
  console.log('📄 Adding main pages...');
  allUrls.push({ url: `${baseUrl}/`, priority: 1.0, changefreq: 'daily' });
  allUrls.push({ url: `${baseUrl}/cars`, priority: 0.9, changefreq: 'daily' });
  allUrls.push({ url: `${baseUrl}/news`, priority: 0.9, changefreq: 'daily' });
  allUrls.push({ url: `${baseUrl}/chat`, priority: 0.8, changefreq: 'daily' });
  allUrls.push({ url: `${baseUrl}/reviews`, priority: 0.7, changefreq: 'weekly' });
  allUrls.push({ url: `${baseUrl}/contact`, priority: 0.6, changefreq: 'monthly' });
  allUrls.push({ url: `${baseUrl}/privacy`, priority: 0.5, changefreq: 'yearly' });
  allUrls.push({ url: `${baseUrl}/impressum`, priority: 0.5, changefreq: 'yearly' });
  
  // Add Cars pages (brands, models, generations, error-codes, faults)
  console.log('🔄 Fetching Cars data for sitemap...');
  try {
    // Fetch all car brands with pagination
    const allBrands: Array<{ slug: string; updated_at?: string; created_at?: string }> = [];
    let brandsFrom = 0;
    const brandsBatchSize = 1000;
    
    while (true) {
      const { data: brands, error: brandsError } = await supabase
        .from('car_brands')
        .select('slug, updated_at, created_at')
        .range(brandsFrom, brandsFrom + brandsBatchSize - 1);
    
      if (brandsError) {
        console.error('⚠️  Error fetching brands:', brandsError);
        break;
      }
      
      if (!brands || brands.length === 0) {
        break;
      }
      
      allBrands.push(...brands);
      console.log(`📊 Fetched ${brands.length} brands (total: ${allBrands.length})`);
      
      if (brands.length < brandsBatchSize) {
        break;
      }
      
      brandsFrom += brandsBatchSize;
    }
    
    if (allBrands.length > 0) {
      for (const brand of allBrands) {
        const url = `${baseUrl}/cars/${brand.slug}`;
        
        if (!seenUrls.has(url)) {
          seenUrls.add(url);
          const lastmod = brand.updated_at 
            ? new Date(brand.updated_at).toISOString().split('T')[0]
            : brand.created_at 
            ? new Date(brand.created_at).toISOString().split('T')[0]
            : now;
          allUrls.push({
            url,
            lastmod,
            priority: 0.8,
            changefreq: 'weekly'
          });
        }
      }
      
      // Fetch all car models with pagination
      const allModels: Array<{ slug: string; updated_at?: string; created_at?: string; car_brands: any }> = [];
      let modelsFrom = 0;
      const modelsBatchSize = 1000;
      
      while (true) {
        const { data: models, error: modelsError } = await supabase
          .from('car_models')
          .select('slug, updated_at, created_at, car_brands(slug)')
          .range(modelsFrom, modelsFrom + modelsBatchSize - 1);
      
        if (modelsError) {
          console.error('⚠️  Error fetching models:', modelsError);
          break;
        }
        
        if (!models || models.length === 0) {
          break;
        }
        
        allModels.push(...models);
        console.log(`📊 Fetched ${models.length} models (total: ${allModels.length})`);
        
        if (models.length < modelsBatchSize) {
          break;
        }
        
        modelsFrom += modelsBatchSize;
      }
      
      if (allModels.length > 0) {
        for (const model of allModels) {
          const carBrands = model.car_brands as unknown as { slug: string } | { slug: string }[];
          const brandSlug = Array.isArray(carBrands) ? carBrands[0]?.slug : carBrands?.slug;
          if (!brandSlug) continue;
          
          const modelUrl = `${baseUrl}/cars/${brandSlug}/${model.slug}`;
          const errorCodesUrl = `${baseUrl}/cars/${brandSlug}/${model.slug}/error-codes`;
          
          // Add model page
          if (!seenUrls.has(modelUrl)) {
            seenUrls.add(modelUrl);
            const lastmod = model.updated_at 
              ? new Date(model.updated_at).toISOString().split('T')[0]
              : model.created_at 
              ? new Date(model.created_at).toISOString().split('T')[0]
              : now;
            allUrls.push({
              url: modelUrl,
              lastmod,
              priority: 0.7,
              changefreq: 'weekly'
            });
          }
          
          // Add error-codes page for this model
          if (!seenUrls.has(errorCodesUrl)) {
            seenUrls.add(errorCodesUrl);
            const lastmod = model.updated_at 
              ? new Date(model.updated_at).toISOString().split('T')[0]
              : model.created_at 
              ? new Date(model.created_at).toISOString().split('T')[0]
              : now;
            allUrls.push({
              url: errorCodesUrl,
              lastmod,
              priority: 0.7,
              changefreq: 'weekly'
            });
          }
        }
      }
      
      // Fetch all model generations with pagination
      const allGenerations: Array<{ slug: string; updated_at?: string; created_at?: string; car_models: any }> = [];
      let generationsFrom = 0;
      const generationsBatchSize = 1000;
      
      while (true) {
        const { data: generations, error: generationsError } = await supabase
          .from('model_generations')
          .select('slug, updated_at, created_at, car_models(slug, car_brands(slug))')
          .range(generationsFrom, generationsFrom + generationsBatchSize - 1);
      
        if (generationsError) {
          console.error('⚠️  Error fetching generations:', generationsError);
          break;
        }
        
        if (!generations || generations.length === 0) {
          break;
        }
        
        allGenerations.push(...generations);
        console.log(`📊 Fetched ${generations.length} generations (total: ${allGenerations.length})`);
        
        if (generations.length < generationsBatchSize) {
          break;
        }
        
        generationsFrom += generationsBatchSize;
      }
      
      if (allGenerations.length > 0) {
        for (const generation of allGenerations) {
          const carModels = generation.car_models as unknown as { slug: string; car_brands: { slug: string } | { slug: string }[] } | { slug: string; car_brands: { slug: string } | { slug: string }[] }[];
          const modelData = Array.isArray(carModels) ? carModels[0] : carModels;
          if (!modelData) continue;
          
          const carBrands = modelData.car_brands as unknown as { slug: string } | { slug: string }[];
          const brandSlug = Array.isArray(carBrands) ? carBrands[0]?.slug : carBrands?.slug;
          if (!brandSlug) continue;
          
          // Add generation detail page
          const generationUrl = `${baseUrl}/cars/${brandSlug}/${modelData.slug}/${generation.slug}`;
          if (!seenUrls.has(generationUrl)) {
            seenUrls.add(generationUrl);
            const lastmod = generation.updated_at 
              ? new Date(generation.updated_at).toISOString().split('T')[0]
              : generation.created_at 
              ? new Date(generation.created_at).toISOString().split('T')[0]
              : now;
            addUrl(generationUrl, 0.6, 'weekly', lastmod);
          }
          
          // Add error-codes page for this generation (automatically available for ALL generations)
          const generationErrorCodesUrl = `${baseUrl}/cars/${brandSlug}/${modelData.slug}/${generation.slug}/error-codes`;
          if (!seenUrls.has(generationErrorCodesUrl)) {
            seenUrls.add(generationErrorCodesUrl);
            const lastmod = generation.updated_at 
              ? new Date(generation.updated_at).toISOString().split('T')[0]
              : generation.created_at 
              ? new Date(generation.created_at).toISOString().split('T')[0]
              : now;
            addUrl(generationErrorCodesUrl, 0.7, 'weekly', lastmod);
          }
        }
      }
      
      // Fetch all car faults with pagination (only German, status live)
      const { count: totalFaultsCount, error: countError } = await supabase
        .from('car_faults')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'live')
        .eq('language_path', 'de');
      
      if (countError) {
        console.error('⚠️  Error counting faults:', countError);
      } else {
        console.log(`📊 Total live German faults in database: ${totalFaultsCount || 0}`);
      }
      
      const allFaults: Array<{ slug: string; updated_at?: string; created_at?: string; model_generation_id: string; model_generations?: any }> = [];
      let faultsFrom = 0;
      const faultsBatchSize = 1000;
      let consecutiveEmptyBatches = 0;
      const maxConsecutiveEmptyBatches = 3;
      let useSimplifiedQuery = false;
      
      // Try with full join query first, fallback to simplified if needed
      while (true) {
        let faults: any[] | null = null;
        let faultsError: any = null;
        
        if (!useSimplifiedQuery) {
          // Try full query with joins (include error_code to determine URL path)
          const result = await supabase
            .from('car_faults')
            .select('slug, updated_at, created_at, model_generation_id, error_code, model_generations(slug, car_models(slug, car_brands(slug)))')
            .eq('status', 'live')
            .eq('language_path', 'de')
            .order('id', { ascending: true })
            .range(faultsFrom, faultsFrom + faultsBatchSize - 1);
          
          faults = result.data;
          faultsError = result.error;
          
          // If we get a complex query error, switch to simplified query
          if (faultsError && (faultsError.message?.includes('timeout') || faultsError.message?.includes('too complex') || faultsError.code === 'PGRST116')) {
            console.log('⚠️  Complex query failed, switching to simplified query method...');
            useSimplifiedQuery = true;
            faultsFrom = 0; // Reset to start over with simplified query
            continue;
          }
        } else {
          // Simplified query: fetch faults first, then fetch generation data separately (include error_code)
          const result = await supabase
            .from('car_faults')
            .select('slug, updated_at, created_at, model_generation_id, error_code')
            .eq('status', 'live')
            .eq('language_path', 'de')
            .order('id', { ascending: true })
            .range(faultsFrom, faultsFrom + faultsBatchSize - 1);
          
          faults = result.data;
          faultsError = result.error;
          
          // If we have faults, fetch their generation data in a separate query
          if (faults && faults.length > 0) {
            const generationIds = [...new Set(faults.map(f => f.model_generation_id).filter(Boolean))];
            
            if (generationIds.length > 0) {
              const { data: generationsData } = await supabase
                .from('model_generations')
                .select('id, slug, car_models(slug, car_brands(slug))')
                .in('id', generationIds);
              
              // Create a map for quick lookup
              const generationMap = new Map();
              if (generationsData) {
                for (const gen of generationsData) {
                  generationMap.set(gen.id, gen);
                }
              }
              
              // Attach generation data to faults
              for (const fault of faults) {
                if (fault.model_generation_id && generationMap.has(fault.model_generation_id)) {
                  fault.model_generations = generationMap.get(fault.model_generation_id);
                }
              }
            }
          }
        }
      
        if (faultsError) {
          console.error('⚠️  Error fetching faults:', faultsError);
          consecutiveEmptyBatches++;
          if (consecutiveEmptyBatches >= maxConsecutiveEmptyBatches) {
            console.log('⚠️  Too many consecutive errors, stopping fault fetch');
            break;
          }
          faultsFrom += faultsBatchSize;
          continue;
        }
        
        if (!faults || faults.length === 0) {
          consecutiveEmptyBatches++;
          if (consecutiveEmptyBatches >= maxConsecutiveEmptyBatches) {
            console.log('✅ Reached end of faults data');
            break;
          }
          faultsFrom += faultsBatchSize;
          continue;
        }
        
        consecutiveEmptyBatches = 0; // Reset counter on successful fetch
        allFaults.push(...faults);
        console.log(`📊 Fetched ${faults.length} faults (total: ${allFaults.length}${totalFaultsCount ? ` / ${totalFaultsCount}` : ''})`);
        
        if (faults.length < faultsBatchSize) {
          console.log('✅ Reached end of faults data');
          break;
        }
        
        faultsFrom += faultsBatchSize;
        
        // Safety check: if we've fetched more than expected, log a warning
        if (totalFaultsCount && allFaults.length > totalFaultsCount * 1.1) {
          console.warn(`⚠️  Fetched more faults (${allFaults.length}) than expected (${totalFaultsCount}), stopping to prevent infinite loop`);
          break;
        }
      }
      
      // Log final count comparison
      if (totalFaultsCount) {
        if (allFaults.length < totalFaultsCount) {
          console.warn(`⚠️  WARNING: Fetched ${allFaults.length} faults but database has ${totalFaultsCount} live faults. Missing ${totalFaultsCount - allFaults.length} faults from sitemap.`);
        } else if (allFaults.length === totalFaultsCount) {
          console.log(`✅ Successfully fetched all ${allFaults.length} live faults`);
        } else {
          console.warn(`⚠️  WARNING: Fetched ${allFaults.length} faults but database has ${totalFaultsCount} live faults. There may be duplicates.`);
        }
      }
      
      if (allFaults.length > 0) {
        for (const fault of allFaults) {
          if (!fault.slug) continue;
          
          const generationData = fault.model_generations as unknown as { slug: string; car_models: { slug: string; car_brands: { slug: string } | { slug: string }[] } | { slug: string; car_brands: { slug: string } | { slug: string }[] }[] } | { slug: string; car_models: { slug: string; car_brands: { slug: string } | { slug: string }[] } | { slug: string; car_brands: { slug: string } | { slug: string }[] }[] }[];
          const genData = Array.isArray(generationData) ? generationData[0] : generationData;
          if (!genData) continue;
          
          const modelData = genData.car_models as unknown as { slug: string; car_brands: { slug: string } | { slug: string }[] } | { slug: string; car_brands: { slug: string } | { slug: string }[] }[];
          const model = Array.isArray(modelData) ? modelData[0] : modelData;
          if (!model) continue;
          
          const carBrands = model.car_brands as unknown as { slug: string } | { slug: string }[];
          const brandSlug = Array.isArray(carBrands) ? carBrands[0]?.slug : carBrands?.slug;
          if (!brandSlug) continue;
          
          // Check if fault has error_code to determine URL path
          const faultWithErrorCode = fault as any;
          const hasErrorCode = faultWithErrorCode.error_code !== null && faultWithErrorCode.error_code !== undefined;
          
          const url = hasErrorCode 
            ? `${baseUrl}/cars/${brandSlug}/${model.slug}/${genData.slug}/error-codes/${fault.slug}`
            : `${baseUrl}/cars/${brandSlug}/${model.slug}/${genData.slug}/faults/${fault.slug}`;
          
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
      
      console.log(`✅ Added ${allBrands.length} brands, ${allModels.length} models, ${allGenerations.length} generations, and ${allFaults.length} faults to sitemap`);
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
  
  // Clean up any remaining old sitemap files that are beyond our new count
  // (This is a safety check - we already cleaned up at the start)
  if (fs.existsSync(PUBLIC_DIR)) {
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
        try {
          fs.unlinkSync(oldFilePath);
          console.log(`🗑️  Removed old ${oldFile}`);
        } catch (error) {
          // Ignore errors if file doesn't exist
        }
      }
    }
  }
  
  console.log(`\n🎉 Successfully generated ${totalSitemaps} sitemap files:`);
  sitemapFiles.forEach(file => console.log(`   - ${file}`));
  console.log(`📊 Total URLs: ${allUrls.length}`);
  console.log(`📊 URLs per sitemap: ${SITEMAP_SIZE}`);
  
  return sitemapFiles;
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
