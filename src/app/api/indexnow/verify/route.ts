import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const INDEXNOW_KEY = process.env.INDEXNOW_KEY || '19b8bc246b244733843ff32b3d426207';
    const HOST = 'fahrzeugfehler.de';
    const KEY_FILE_URL = `https://${HOST}/${INDEXNOW_KEY}.txt`;
    const KEY_LOCATION = `https://${HOST}/${INDEXNOW_KEY}.txt`;

    // Check if key file is accessible
    let keyFileAccessible = false;
    let keyFileContent = '';
    try {
      const keyResponse = await fetch(KEY_FILE_URL, { method: 'HEAD' });
      keyFileAccessible = keyResponse.ok;
      if (keyResponse.ok) {
        const contentResponse = await fetch(KEY_FILE_URL);
        keyFileContent = await contentResponse.text();
      }
    } catch (error) {
      console.error('Error checking key file:', error);
    }

    // Test IndexNow API with a test URL (use homepage as it definitely exists)
    const testUrl = `https://${HOST}/en`;
    let apiTestSuccess = false;
    let apiTestError = '';

    try {
      // Extract hostname from test URL
      const testUrlObj = new URL(testUrl);
      const hostToUse = testUrlObj.hostname.replace(/^www\./, '');

      const payload = {
        host: hostToUse,
        key: INDEXNOW_KEY,
        keyLocation: KEY_LOCATION,
        urlList: [testUrl],
      };

      const response = await fetch('https://api.indexnow.org/indexnow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      apiTestSuccess = response.ok;
      if (!response.ok) {
        let errorText = '';
        try {
          errorText = await response.text();
        } catch {
          errorText = 'Could not read error response';
        }
        apiTestError = `Status: ${response.status} ${response.statusText}${errorText ? ` - ${errorText.substring(0, 200)}` : ''}`;
        console.error('[IndexNow Verify] API Error:', {
          status: response.status,
          statusText: response.statusText,
          errorText,
          payload: JSON.stringify(payload),
        });
      } else {
        console.log('[IndexNow Verify] API Success:', payload);
      }
    } catch (error) {
      apiTestError = error instanceof Error ? error.message : 'Unknown error';
    }

    return NextResponse.json({
      key: INDEXNOW_KEY,
      keyFile: {
        url: KEY_FILE_URL,
        accessible: keyFileAccessible,
        content: keyFileContent.trim(),
        matches: keyFileContent.trim() === INDEXNOW_KEY,
      },
      api: {
        endpoint: 'https://api.indexnow.org/indexnow',
        testSuccess: apiTestSuccess,
        testError: apiTestError,
      },
      status: keyFileAccessible && apiTestSuccess ? 'working' : 'error',
      message: keyFileAccessible && apiTestSuccess
        ? 'IndexNow is properly configured and working'
        : 'IndexNow configuration needs attention',
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

