import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Server-side API route for submitting URLs to IndexNow
 * This avoids CORS issues by making the request from the server
 */
export async function POST(req: NextRequest) {
  try {
    const { url, urls } = await req.json();

    // Configuration
    const INDEXNOW_KEY = process.env.INDEXNOW_KEY || '19b8bc246b244733843ff32b3d426207';
    const HOST = process.env.INDEXNOW_HOST || 'faultbase.com';
    // IndexNow key location must be accessible at the root domain
    const KEY_LOCATION = `https://${HOST}/${INDEXNOW_KEY}.txt`;
    
    // Don't proceed if key is not configured
    if (!INDEXNOW_KEY || INDEXNOW_KEY === 'REPLACE_WITH_YOUR_KEY') {
      return NextResponse.json(
        { success: false, message: 'IndexNow key not configured' },
        { status: 400 }
      );
    }
    
    // Verify key file is accessible (for debugging - non-blocking)
    try {
      const keyFileUrl = KEY_LOCATION;
      const keyCheck = await fetch(keyFileUrl, { method: 'HEAD' });
      if (!keyCheck.ok) {
        console.warn(`[IndexNow] Warning: Key file may not be accessible at ${keyFileUrl} (status: ${keyCheck.status})`);
      } else {
        console.log(`[IndexNow] Key file verified at ${keyFileUrl}`);
      }
    } catch (error) {
      console.warn(`[IndexNow] Could not verify key file accessibility:`, error);
    }

    // Determine URL list
    let urlList: string[] = [];
    if (url) {
      urlList = [url];
    } else if (urls && Array.isArray(urls)) {
      urlList = urls;
    } else {
      return NextResponse.json(
        { success: false, message: 'URL or URLs array required' },
        { status: 400 }
      );
    }

    // Validate all URLs are from the same host
    const validUrls = urlList.filter(urlStr => {
      try {
        const urlObj = new URL(urlStr);
        const hostname = urlObj.hostname.replace(/^www\./, '');
        return hostname === HOST || hostname === `www.${HOST}`;
      } catch {
        return false;
      }
    });

    if (validUrls.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No valid URLs to submit' },
        { status: 400 }
      );
    }

    // Extract hostname from first URL
    let hostToUse = HOST;
    try {
      const firstUrl = new URL(validUrls[0]);
      hostToUse = firstUrl.hostname.replace(/^www\./, '');
    } catch {
      // Use default HOST
    }

    const payload = {
      host: hostToUse,
      key: INDEXNOW_KEY,
      keyLocation: KEY_LOCATION,
      urlList: validUrls,
    };

    // Submit to IndexNow API
    // IndexNow accepts POST requests to multiple endpoints
    // We'll try both api.indexnow.org and bing.com/indexnow for better reliability
    const endpoints = [
      'https://api.indexnow.org/indexnow',
      'https://www.bing.com/indexnow',
    ];

    let lastError: any = null;
    let successCount = 0;

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (response.ok || response.status === 202) {
          // 202 Accepted is also a success for IndexNow
          successCount++;
          console.log(`[IndexNow] Successfully submitted to ${endpoint}: ${validUrls.length} URLs`);
        } else {
          const errorText = await response.text().catch(() => '');
          console.warn(`[IndexNow] Failed to submit to ${endpoint}: ${response.status} - ${errorText}`);
          lastError = { status: response.status, error: errorText };
        }
      } catch (error: any) {
        console.warn(`[IndexNow] Error submitting to ${endpoint}:`, error);
        lastError = error;
      }
    }

    // If at least one submission succeeded, return success
    if (successCount > 0) {
      return NextResponse.json({
        success: true,
        message: `Successfully submitted ${validUrls.length} URL(s) to IndexNow (${successCount}/${endpoints.length} endpoints)`,
        submittedCount: validUrls.length,
        endpointsSucceeded: successCount,
      });
    } else {
      // All endpoints failed
      return NextResponse.json(
        {
          success: false,
          message: 'Failed to submit to all IndexNow endpoints',
          error: lastError?.error || lastError?.message || 'Unknown error',
        },
        { status: lastError?.status || 500 }
      );
    }
  } catch (error: any) {
    console.error('[IndexNow API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error',
        error: error.message,
      },
      { status: 500 }
    );
  }
}

