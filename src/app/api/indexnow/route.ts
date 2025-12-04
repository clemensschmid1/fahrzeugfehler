import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(supabaseUrl, supabaseKey);
}

// Submit URLs to IndexNow
export async function POST(req: Request) {
  try {
    const { urls, type } = await req.json();

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json({ error: 'URLs array required' }, { status: 400 });
    }

    const INDEXNOW_KEY = process.env.INDEXNOW_KEY || '19b8bc246b244733843ff32b3d426207';
    const HOST = 'faultbase.com';
    const KEY_LOCATION = `https://${HOST}/${INDEXNOW_KEY}.txt`;

    if (!INDEXNOW_KEY || INDEXNOW_KEY === 'REPLACE_WITH_YOUR_KEY') {
      return NextResponse.json({ error: 'IndexNow key not configured' }, { status: 500 });
    }

    // IndexNow API limit is 10,000 URLs per request, but we'll batch in 100 for reliability
    const batchSize = 100;
    const results = {
      submitted: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Validate and filter URLs to ensure they're from the correct host
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
      return NextResponse.json({ error: 'No valid URLs provided (must be from faultbase.com)' }, { status: 400 });
    }

    // Extract hostname from first URL (all should be same)
    let hostToUse = HOST;
    try {
      const firstUrl = new URL(validUrls[0]);
      hostToUse = firstUrl.hostname.replace(/^www\./, '');
    } catch {
      // Use default HOST
    }

    for (let i = 0; i < validUrls.length; i += batchSize) {
      const batch = validUrls.slice(i, i + batchSize);
      
      try {
        // IndexNow accepts both single URL (url field) and multiple URLs (urlList field)
        // We'll use urlList for consistency, even for single URLs
        const payload = {
          host: hostToUse,
          key: INDEXNOW_KEY,
          keyLocation: KEY_LOCATION,
          urlList: batch,
        };

        const response = await fetch('https://api.indexnow.org/indexnow', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          results.submitted += batch.length;
        } else {
          const errorText = await response.text().catch(() => '');
          results.failed += batch.length;
          results.errors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${response.status} ${response.statusText}${errorText ? ` - ${errorText.substring(0, 100)}` : ''}`);
        }
      } catch (error) {
        results.failed += batch.length;
        results.errors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return NextResponse.json({
      success: results.failed === 0,
      submitted: results.submitted,
      failed: results.failed,
      errors: results.errors,
      total: urls.length,
    });
  } catch (error) {
    console.error('IndexNow API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Get recent URLs to submit (for manual trigger)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'all'; // 'faults', 'manuals', 'all'
    const limit = parseInt(searchParams.get('limit') || '100');
    const language = searchParams.get('language') || 'en';

    const supabase = getSupabaseClient();

    const urls: string[] = [];

    if (type === 'faults' || type === 'all') {
      const { data: faults } = await supabase
        .from('car_faults')
        .select(`
          slug,
          language_path,
          model_generations!inner(
            slug,
            car_models!inner(
              slug,
              car_brands!inner(slug)
            )
          )
        `)
        .eq('status', 'live')
        .eq('language_path', language)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (faults) {
        for (const fault of faults) {
          const gen = fault.model_generations as any;
          if (gen && gen.car_models && gen.car_models.car_brands) {
            urls.push(
              `https://faultbase.com/${language}/cars/${gen.car_models.car_brands.slug}/${gen.car_models.slug}/${gen.slug}/faults/${fault.slug}`
            );
          }
        }
      }
    }

    if (type === 'manuals' || type === 'all') {
      const { data: manuals } = await supabase
        .from('car_manuals')
        .select(`
          slug,
          language_path,
          model_generations!inner(
            slug,
            car_models!inner(
              slug,
              car_brands!inner(slug)
            )
          )
        `)
        .eq('status', 'live')
        .eq('language_path', language)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (manuals) {
        for (const manual of manuals) {
          const gen = manual.model_generations as any;
          if (gen && gen.car_models && gen.car_models.car_brands) {
            urls.push(
              `https://faultbase.com/${language}/cars/${gen.car_models.car_brands.slug}/${gen.car_models.slug}/${gen.slug}/manuals/${manual.slug}`
            );
          }
        }
      }
    }

    return NextResponse.json({
      urls,
      count: urls.length,
      type,
      language,
    });
  } catch (error) {
    console.error('IndexNow GET error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

