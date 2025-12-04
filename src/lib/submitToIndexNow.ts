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

  // Validate URL is from the same host
  try {
    const urlObj = new URL(url);
    if (urlObj.hostname !== HOST && urlObj.hostname !== `www.${HOST}`) {
      console.warn('[IndexNow] URL hostname mismatch:', urlObj.hostname, 'expected:', HOST);
      return;
    }
  } catch (error) {
    console.warn('[IndexNow] Invalid URL format:', url);
    return;
  }

  // Extract hostname from URL to ensure it matches
  let urlHostname: string;
  try {
    const urlObj = new URL(url);
    urlHostname = urlObj.hostname.replace(/^www\./, ''); // Remove www. prefix if present
  } catch (error) {
    console.warn('[IndexNow] Invalid URL format:', url);
    return;
  }

  // Ensure host matches URL hostname
  const hostToUse = urlHostname;

  const payload: IndexNowPayload = {
    host: hostToUse,
    key: INDEXNOW_KEY,
    keyLocation: KEY_LOCATION,
    url: url,
  };

  try {
    console.log('[IndexNow] Submitting URL for indexing:', url, 'Payload:', JSON.stringify(payload));
    
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
      const errorText = await response.text().catch(() => '');
      console.warn('[IndexNow] Failed to submit URL, status:', response.status, 'URL:', url, 'Error:', errorText);
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

  // Validate all URLs are from the same host and filter invalid ones
  const validUrls = urls.filter(url => {
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.replace(/^www\./, '');
      return hostname === HOST;
    } catch {
      return false;
    }
  });

  if (validUrls.length === 0) {
    console.warn('[IndexNow] No valid URLs to submit');
    return;
  }

  // Extract hostname from first URL (all should be same)
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