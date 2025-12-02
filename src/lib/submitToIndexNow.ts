/**
 * Submits a URL to Bing IndexNow for immediate indexing
 * This function is non-blocking and fails silently if submission fails
 */

interface IndexNowPayload {
  host: string;
  key: string;
  keyLocation: string;
  url: string;
}

export async function submitToIndexNow(url: string): Promise<void> {
  // Configuration - try environment variable first, then fallback to hardcoded key
  const INDEXNOW_KEY = process.env.INDEXNOW_KEY || '19b8bc246b244733843ff32b3d426207';
  const HOST = 'faultbase.com';
  const KEY_LOCATION = `https://faultbase.com/${INDEXNOW_KEY}.txt`;

  // Don't proceed if key is not configured
  if (!INDEXNOW_KEY || INDEXNOW_KEY === 'REPLACE_WITH_YOUR_KEY') {
    console.log('[IndexNow] Key not configured, skipping submission for:', url);
    return;
  }

  const payload: IndexNowPayload = {
    host: HOST,
    key: INDEXNOW_KEY,
    keyLocation: KEY_LOCATION,
    url: url,
  };

  try {
    console.log('[IndexNow] Submitting URL for indexing:', url);
    
    const response = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      console.log('[IndexNow] Successfully submitted URL for indexing:', url);
    } else {
      console.warn('[IndexNow] Failed to submit URL, status:', response.status, 'URL:', url);
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

  // Configuration - try environment variable first, then fallback to hardcoded key
  const INDEXNOW_KEY = process.env.INDEXNOW_KEY || '19b8bc246b244733843ff32b3d426207';
  const HOST = 'faultbase.com';
  const KEY_LOCATION = `https://faultbase.com/${INDEXNOW_KEY}.txt`;

  // Don't proceed if key is not configured
  if (!INDEXNOW_KEY || INDEXNOW_KEY === 'REPLACE_WITH_YOUR_KEY') {
    console.log('[IndexNow] Key not configured, skipping batch submission for', urls.length, 'URLs');
    return;
  }

  const payload = {
    host: HOST,
    key: INDEXNOW_KEY,
    keyLocation: KEY_LOCATION,
    urlList: urls,
  };

  try {
    console.log('[IndexNow] Submitting', urls.length, 'URLs for indexing');
    
    const response = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      console.log('[IndexNow] Successfully submitted', urls.length, 'URLs for indexing');
    } else {
      console.warn('[IndexNow] Failed to submit URLs, status:', response.status);
    }
  } catch (error) {
    // Fail silently - don't let IndexNow errors affect the user experience
    console.warn('[IndexNow] Error submitting URLs for indexing:', error);
  }
} 