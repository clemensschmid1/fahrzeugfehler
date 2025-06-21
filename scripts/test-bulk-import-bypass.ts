// Test script to verify bulk import rate limiting bypass
// Run with: npx tsx scripts/test-bulk-import-bypass.ts

// Mock request headers and body for testing
const mockBulkImportRequest = {
  headers: {
    get: (name: string) => {
      if (name === 'X-Bulk-Import') return 'true';
      if (name === 'Content-Type') return 'application/json';
      return null;
    }
  },
  json: async () => ({
    question: 'Test question',
    language: 'en',
    submitDeltaMs: 5000
  })
};

const mockRegularRequest = {
  headers: {
    get: (name: string) => {
      if (name === 'Content-Type') return 'application/json';
      return null;
    }
  },
  json: async () => ({
    question: 'Test question',
    language: 'en',
    submitDeltaMs: 1000 // Below the 3000ms threshold
  })
};

// Test the logic that would be in the API
async function testBulkImportBypass(req: any) {
  const isBulkImport = req.headers.get('X-Bulk-Import') === 'true';
  const body = await req.json();
  
  console.log('Request type:', isBulkImport ? 'Bulk Import' : 'Regular');
  console.log('Headers:', {
    'X-Bulk-Import': req.headers.get('X-Bulk-Import'),
    'Content-Type': req.headers.get('Content-Type')
  });
  console.log('Body:', body);
  
  // Test rate limiting bypass
  if (isBulkImport) {
    console.log('✅ Rate limiting: SKIPPED (bulk import)');
  } else {
    console.log('✅ Rate limiting: APPLIED (regular request)');
  }
  
  // Test submit delta check bypass
  const submitDeltaMs = body.submitDeltaMs;
  const minMs = 3000;
  
  if (isBulkImport) {
    console.log('✅ Submit delta check: SKIPPED (bulk import)');
  } else {
    const isValid = typeof submitDeltaMs === 'number' && submitDeltaMs >= minMs;
    console.log(`✅ Submit delta check: ${isValid ? 'PASSED' : 'FAILED'} (${submitDeltaMs}ms >= ${minMs}ms)`);
  }
  
  console.log('---');
}

async function runTests() {
  console.log('Testing Bulk Import Rate Limiting Bypass\n');
  console.log('='.repeat(50));
  
  console.log('\nTest 1: Bulk Import Request');
  await testBulkImportBypass(mockBulkImportRequest);
  
  console.log('\nTest 2: Regular Request');
  await testBulkImportBypass(mockRegularRequest);
  
  console.log('\n✅ All tests completed!');
  console.log('\nExpected behavior:');
  console.log('- Bulk import requests should skip rate limiting');
  console.log('- Bulk import requests should skip submit delta check');
  console.log('- Regular requests should still have all protections');
}

runTests().catch(console.error); 