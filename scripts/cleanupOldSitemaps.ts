#!/usr/bin/env tsx
import fs from 'fs';
import path from 'path';

const PUBLIC_DIR = path.join(__dirname, '../public');

function cleanupOldSitemaps() {
  console.log('🧹 Cleaning up old sitemap files before build...');
  
  if (!fs.existsSync(PUBLIC_DIR)) {
    console.log('⚠️  Public directory does not exist, skipping cleanup');
    return;
  }
  
  try {
    const existingFiles = fs.readdirSync(PUBLIC_DIR)
      .filter(f => /^sitemap-\d+\.xml$/.test(f));
    
    if (existingFiles.length > 0) {
      console.log(`🗑️  Found ${existingFiles.length} old sitemap files to remove...`);
      let removedCount = 0;
      
      for (const oldFile of existingFiles) {
        const oldFilePath = path.join(PUBLIC_DIR, oldFile);
        try {
          fs.unlinkSync(oldFilePath);
          removedCount++;
          console.log(`   ✓ Removed ${oldFile}`);
        } catch (error) {
          console.log(`   ⚠️  Could not remove ${oldFile}: ${error}`);
        }
      }
      
      console.log(`✅ Cleaned up ${removedCount} old sitemap files`);
    } else {
      console.log('✅ No old sitemap files found');
    }
  } catch (error) {
    console.log('⚠️  Error during cleanup:', error);
    // Don't fail the build if cleanup fails
  }
}

cleanupOldSitemaps();

