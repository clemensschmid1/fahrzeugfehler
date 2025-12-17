#!/usr/bin/env node

/**
 * Clean Next.js and TurboPack cache to free up disk space
 * Usage: node scripts/clean-cache.js [--all]
 */

const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const nextCacheDir = path.join(projectRoot, '.next', 'cache');
const turboCacheDir = path.join(projectRoot, '.next', 'cache', 'turbo');
const nodeModulesCache = path.join(projectRoot, 'node_modules', '.cache');
const turboGlobalCache = process.env.TURBOPACK_CACHE_DIR || 
  path.join(require('os').homedir(), '.turbo');

function getDirSize(dirPath) {
  if (!fs.existsSync(dirPath)) return 0;
  
  let size = 0;
  try {
    const files = fs.readdirSync(dirPath);
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stats = fs.statSync(filePath);
      if (stats.isDirectory()) {
        size += getDirSize(filePath);
      } else {
        size += stats.size;
      }
    }
  } catch (err) {
    // Ignore errors
  }
  return size;
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

function deleteDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    console.log(`  ⏭️  ${dirPath} - does not exist`);
    return false;
  }
  
  try {
    fs.rmSync(dirPath, { recursive: true, force: true });
    console.log(`  ✅ Deleted: ${dirPath}`);
    return true;
  } catch (err) {
    console.error(`  ❌ Error deleting ${dirPath}:`, err.message);
    return false;
  }
}

function main() {
  const cleanAll = process.argv.includes('--all');
  
  console.log('🧹 Cleaning Next.js and TurboPack cache...\n');
  
  let totalFreed = 0;
  
  // Check sizes before deletion
  const dirs = [
    { path: nextCacheDir, name: 'Next.js Cache' },
    { path: turboCacheDir, name: 'TurboPack Cache' },
    { path: nodeModulesCache, name: 'Node Modules Cache' },
  ];
  
  if (cleanAll) {
    dirs.push({ path: turboGlobalCache, name: 'TurboPack Global Cache' });
  }
  
  console.log('📊 Cache sizes before cleanup:');
  dirs.forEach(dir => {
    const size = getDirSize(dir.path);
    if (size > 0) {
      console.log(`  ${dir.name}: ${formatBytes(size)}`);
      totalFreed += size;
    }
  });
  
  console.log(`\n🗑️  Total cache size: ${formatBytes(totalFreed)}\n`);
  
  if (totalFreed === 0) {
    console.log('✨ No cache to clean!');
    return;
  }
  
  // Delete caches
  console.log('Deleting caches...\n');
  dirs.forEach(dir => {
    deleteDir(dir.path);
  });
  
  // Also clean .next/build if --all
  if (cleanAll) {
    const buildDir = path.join(projectRoot, '.next', 'build');
    deleteDir(buildDir);
  }
  
  console.log(`\n✨ Cleaned ${formatBytes(totalFreed)} of cache!`);
  console.log('\n💡 Tip: Run "npm run dev" to rebuild cache.');
}

main();

