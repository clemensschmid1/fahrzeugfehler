#!/usr/bin/env node

/**
 * IndexNow Verification Script
 * 
 * This script verifies that your IndexNow setup is correct:
 * 1. Checks if indexnow.json is accessible
 * 2. Checks if the key file is accessible
 * 3. Tests a single URL submission
 * 
 * Usage: npx tsx scripts/verifyIndexNow.ts
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

// Load .env.local file if it exists
try {
  const envPath = join(process.cwd(), '.env.local');
  if (existsSync(envPath)) {
    const envFile = readFileSync(envPath, 'utf-8');
    envFile.split('\n').forEach(line => {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('#') && trimmedLine.includes('=')) {
        const [key, ...valueParts] = trimmedLine.split('=');
        const value = valueParts.join('=').replace(/^["']|["']$/g, '');
        if (key && value) {
          process.env[key.trim()] = value.trim();
        }
      }
    });
  }
} catch (error) {
  // .env.local doesn't exist or can't be read, that's okay
}

const INDEXNOW_KEY = process.env.INDEXNOW_KEY || '19b8bc246b244733843ff32b3d426207';
const HOST = 'fahrzeugfehler.de';
const KEY_LOCATION = `https://${HOST}/${INDEXNOW_KEY}.txt`;
const KEY_FILE_URL = `https://${HOST}/${INDEXNOW_KEY}.txt`;

async function checkUrl(url: string): Promise<{ accessible: boolean; status?: number; error?: string }> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return {
      accessible: response.ok,
      status: response.status,
    };
  } catch (error) {
    return {
      accessible: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function testIndexNowSubmission(): Promise<boolean> {
  const testUrl = `https://${HOST}/en/knowledge/test-indexnow-verification`;
  
  const payload = {
    host: HOST,
    key: INDEXNOW_KEY,
    keyLocation: KEY_FILE_URL, // Must point to .txt file, not .json
    urlList: [testUrl],
  };

  try {
    console.log(`\n🧪 Testing IndexNow API submission...`);
    console.log(`   URL: ${testUrl}`);
    console.log(`   Host: ${HOST}`);
    console.log(`   Key: ${INDEXNOW_KEY.substring(0, 8)}...`);
    
    const response = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      console.log(`   ✅ Submission successful (status: ${response.status})`);
      return true;
    } else {
      const errorText = await response.text();
      console.log(`   ❌ Submission failed (status: ${response.status})`);
      console.log(`   Error: ${errorText.substring(0, 200)}`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Network error: ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

async function main() {
  console.log('🔍 Verifying IndexNow Setup for faultbase.com\n');
  console.log(`📋 Configuration:`);
  console.log(`   Host: ${HOST}`);
  console.log(`   Key: ${INDEXNOW_KEY}`);
  console.log(`   Key Location: ${KEY_LOCATION}`);
  console.log(`   Key File URL: ${KEY_FILE_URL}`);

  // Check indexnow.json accessibility (optional metadata file)
  const indexnowJsonUrl = `https://${HOST}/indexnow.json`;
  console.log(`\n1️⃣  Checking indexnow.json accessibility (optional metadata file)...`);
  const indexnowCheck = await checkUrl(indexnowJsonUrl);
  if (indexnowCheck.accessible) {
    console.log(`   ✅ indexnow.json is accessible (status: ${indexnowCheck.status})`);
  } else {
    console.log(`   ⚠️  indexnow.json is not accessible (this is optional)`);
    console.log(`      Status: ${indexnowCheck.status || 'N/A'}`);
  }

  // Check key file accessibility
  console.log(`\n2️⃣  Checking key file accessibility...`);
  const keyFileCheck = await checkUrl(KEY_FILE_URL);
  if (keyFileCheck.accessible) {
    console.log(`   ✅ Key file is accessible (status: ${keyFileCheck.status})`);
    
    // Try to fetch and verify content
    try {
      const response = await fetch(KEY_FILE_URL);
      const content = await response.text();
      if (content.trim() === INDEXNOW_KEY) {
        console.log(`   ✅ Key file content matches`);
      } else {
        console.log(`   ⚠️  Key file content mismatch`);
        console.log(`      Expected: ${INDEXNOW_KEY}`);
        console.log(`      Got: ${content.trim()}`);
      }
    } catch (error) {
      console.log(`   ⚠️  Could not read content: ${error instanceof Error ? error.message : String(error)}`);
    }
  } else {
    console.log(`   ❌ Key file is NOT accessible`);
    console.log(`      Status: ${keyFileCheck.status || 'N/A'}`);
    console.log(`      Error: ${keyFileCheck.error || 'Unknown'}`);
    console.log(`      Make sure the file exists at public/${INDEXNOW_KEY}.txt`);
    console.log(`      and middleware allows access`);
  }

  // Test IndexNow API submission
  const submissionSuccess = await testIndexNowSubmission();

  // Summary
  console.log(`\n📊 Verification Summary:`);
  console.log(`   Key file (.txt): ${keyFileCheck.accessible ? '✅ Accessible' : '❌ Not accessible'}`);
  console.log(`   API submission: ${submissionSuccess ? '✅ Working' : '❌ Failed'}`);

  if (keyFileCheck.accessible && submissionSuccess) {
    console.log(`\n🎉 All checks passed! IndexNow setup looks good.`);
    console.log(`\n💡 Next steps:`);
    console.log(`   1. Verify the key ${INDEXNOW_KEY} is registered in Bing Webmaster Tools for ${HOST}`);
    console.log(`   2. Run: npm run bulk-indexnow`);
    console.log(`   3. Check Bing Webmaster Tools in 24-48 hours for indexing status`);
  } else {
    console.log(`\n⚠️  Some checks failed. Please fix the issues above.`);
    if (!keyFileCheck.accessible) {
      console.log(`\n   Fix key file:`);
      console.log(`   - Ensure public/${INDEXNOW_KEY}.txt exists`);
      console.log(`   - Ensure middleware.ts allows access to ${INDEXNOW_KEY}.txt`);
      console.log(`   - Deploy and verify: ${KEY_FILE_URL}`);
    }
    if (!submissionSuccess) {
      console.log(`\n   Fix API submission:`);
      console.log(`   - Verify the key is correct in Bing Webmaster Tools`);
      console.log(`   - Ensure both key files are accessible`);
      console.log(`   - Check API rate limits`);
    }
  }
}

main()
  .then(() => {
    console.log('\n🏁 Verification complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Verification failed:', error);
    process.exit(1);
  });

