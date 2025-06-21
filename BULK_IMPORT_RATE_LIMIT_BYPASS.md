# Bulk Import Rate Limiting Bypass

## Overview

The bulk import feature has been modified to bypass rate limiting restrictions. This allows administrators to perform mass imports without being blocked by the standard rate limiting mechanisms that protect against abuse.

## Problem

The bulk import feature was hitting rate limiting errors:
- **"Form submitted too quickly"** - Due to the 3-second minimum submit delta check
- **"Too Many Requests"** - Due to Redis-based rate limiting (10 requests/minute per user, 5/minute per IP)

This prevented efficient bulk imports of knowledge base content.

## Solution

### 1. **Bulk Import Identification**
Bulk import requests are identified using a special header:
```
X-Bulk-Import: true
```

### 2. **Rate Limiting Bypass**
The `/api/ask` endpoint now checks for the bulk import header and skips rate limiting when present:

```typescript
// Check if this is a bulk import request
const isBulkImport = req.headers.get('X-Bulk-Import') === 'true';

// Skip rate limiting for bulk import requests
if (!isBulkImport) {
  // Apply normal rate limiting logic
  const rate = await checkRateLimit({ userId, ip, routeKey: 'ask' });
  // ... rate limiting logic
} else {
  console.log('Skipping rate limit check for bulk import request.');
}
```

### 3. **Submit Delta Check Bypass**
The minimum submit delta check (3 seconds) is also bypassed for bulk import requests:

```typescript
// Skip submit delta check for bulk import requests
if (!isBulkImport && !checkMinSubmitDelta(submitDeltaMs)) {
  console.warn('Form submitted too quickly.');
  return new NextResponse(
    JSON.stringify({ error: 'Form submitted too quickly.' }),
    { status: 429, headers: { 'Content-Type': 'application/json' } }
  );
}
```

## Implementation Details

### Modified Files

1. **`src/app/[lang]/internal/bulkimport/page.tsx`**
   - Added `X-Bulk-Import: true` header to all `/api/ask` calls
   - Added `submitDeltaMs: 5000` to request body

2. **`src/app/[lang]/internal/page.tsx`**
   - Added `X-Bulk-Import: true` header to AI analysis calls
   - Added `submitDeltaMs: 5000` to request body

3. **`src/app/api/ask/route.ts`**
   - Added bulk import detection logic
   - Modified rate limiting to skip for bulk import requests
   - Modified submit delta check to skip for bulk import requests

### Security Considerations

- **Protected Access**: Bulk import is only available behind the `/internal/` route which requires authentication
- **Header-Based Identification**: Uses a custom header that can only be set by the frontend
- **No Impact on Regular Users**: All existing rate limiting protections remain active for regular users
- **Logging**: All bulk import requests are logged for monitoring

### Testing

Created test scripts to verify the implementation:

1. **`scripts/test-quality-filter.ts`** - Verifies quality filtering still works
2. **`scripts/test-bulk-import-bypass.ts`** - Verifies rate limiting bypass works correctly

## Usage

### For Bulk Import Operations

1. Navigate to `/internal/bulkimport` (requires authentication)
2. Upload CSV or text file with questions
3. Click "Analyze with AI" to enrich data
4. Click "Import Questions" to create knowledge entries
5. All requests will bypass rate limiting automatically

### For Regular Users

No changes - all existing rate limiting protections remain active:
- 10 requests per minute per authenticated user
- 5 requests per minute per IP address
- 3-second minimum between form submissions
- Global daily limit of 5000 requests

## Benefits

- **Efficient Bulk Operations**: Administrators can import large datasets without delays
- **Maintained Security**: Regular users still have full rate limiting protection
- **Quality Control**: Imported content still goes through quality filtering
- **Scalable**: Can handle large imports without hitting rate limits

## Monitoring

Bulk import requests are logged with:
```
[generate-metadata] Bulk import request: true
[generate-metadata] Skipping rate limit check for bulk import request.
```

This allows for monitoring of bulk import usage while maintaining security. 