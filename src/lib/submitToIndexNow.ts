/**
 * Submits a URL to Bing IndexNow for immediate indexing
 * This function is non-blocking and fails silently if submission fails
 */

interface IndexNowPayload {
  host: string;
  key: string;
  keyLocation: string;
  urlList: string[];
}

export async function submitToIndexNow(url: string): Promise<void> {
  // Use server-side API route to avoid CORS issues
  try {
    // Determine base URL - use absolute URL in server context, relative in client context
    let apiUrl = '/api/indexnow/submit';
    if (typeof window === 'undefined') {
      // Server-side: use environment variable or default
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 
                (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
      apiUrl = `${baseUrl}/api/indexnow/submit`;
    }
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    });

    if (response.ok) {
      const result = await response.json();
      console.log('[IndexNow] Successfully submitted URL for indexing:', url);
    } else {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      console.warn('[IndexNow] Failed to submit URL, status:', response.status, 'URL:', url, 'Error:', errorData.message);
    }
  } catch (error) {
    // Fail silently - don't let IndexNow errors affect the user experience
    console.warn('[IndexNow] Error submitting URL for indexing:', error, 'URL:', url);
  }
}

/**
 * Submits multiple URLs to Bing IndexNow in batch
 * This function is non-blocking and fails silently if submission fails
 */
export async function submitMultipleToIndexNow(urls: string[]): Promise<void> {
  if (urls.length === 0) return;

  // Use server-side API route to avoid CORS issues
  try {
    // Determine base URL - use absolute URL in server context, relative in client context
    let apiUrl = '/api/indexnow/submit';
    if (typeof window === 'undefined') {
      // Server-side: use environment variable or default
      // In development, always use localhost
      const isDevelopment = process.env.NODE_ENV === 'development' || !process.env.VERCEL_URL;
      if (isDevelopment) {
        const port = process.env.PORT || '3000';
        apiUrl = `http://localhost:${port}/api/indexnow/submit`;
      } else {
        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 
                  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
        apiUrl = `${baseUrl}/api/indexnow/submit`;
      }
    }
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ urls }),
    });

    if (response.ok) {
      const result = await response.json();
      if (result.success) {
        console.log(`[IndexNow] Successfully submitted ${result.submittedCount || urls.length} URLs to ${result.endpointsSucceeded || 1} endpoint(s)`);
      } else {
        console.warn('[IndexNow] API returned non-success:', result.message || 'Unknown error');
      }
    } else {
      // Better error handling for 404 - reduce log spam for large batches
      if (response.status === 404) {
        // Only log first few 404s to avoid spam
        if (urls.length <= 100) {
          const errorData = await response.json().catch(() => ({ message: 'Route not found' }));
          console.warn(`[IndexNow] Route not found (404). Check if /api/indexnow/submit exists. URL: ${apiUrl}. Error:`, errorData.message || errorData.error);
        } else {
          // For large batches, only log once per 1000 URLs
          if (urls.length % 1000 < 100) {
            console.warn(`[IndexNow] Route not found (404) for batch. URL: ${apiUrl}. This will be retried later via /api/indexnow/submit-all`);
          }
        }
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        console.warn('[IndexNow] Failed to submit URLs, status:', response.status, 'URLs:', urls.length, 'Error:', errorData.message || errorData.error);
      }
    }
  } catch (error) {
    // Fail silently - don't let IndexNow errors affect the user experience
    console.warn('[IndexNow] Error submitting URLs for indexing:', error);
  }
} 