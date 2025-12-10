import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const maxDuration = 3600; // 60 minutes for large submissions

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(supabaseUrl, supabaseKey);
}

/**
 * Submit ALL car fault and manual URLs to IndexNow
 * This endpoint fetches all live URLs from the database and submits them in batches
 * Use this if IndexNow submissions failed during bulk generation
 */
export async function POST(req: Request) {
  try {
    const { type, language, limit } = await req.json().catch(() => ({}));
    
    const contentType = type || 'all'; // 'faults', 'manuals', 'all'
    const lang = language || 'all'; // 'en', 'de', 'all'
    const maxLimit = limit ? Math.min(parseInt(limit), 1000000) : 1000000; // Max 1M URLs

    const supabase = getSupabaseClient();
    const urls: string[] = [];

    console.log(`[IndexNow Submit-All] Starting submission for type: ${contentType}, language: ${lang}, max: ${maxLimit}`);

    // Fetch all faults
    if (contentType === 'faults' || contentType === 'all') {
      let query = supabase
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
        .limit(maxLimit);

      if (lang !== 'all') {
        query = query.eq('language_path', lang);
      }

      const { data: faults, error: faultsError } = await query;

      if (faultsError) {
        console.error('[IndexNow Submit-All] Error fetching faults:', faultsError);
      } else if (faults) {
        for (const fault of faults) {
          const gen = fault.model_generations as any;
          if (gen && gen.car_models && gen.car_models.car_brands) {
            const langPath = fault.language_path || 'en';
            urls.push(
              `https://faultbase.com/${langPath}/cars/${gen.car_models.car_brands.slug}/${gen.car_models.slug}/${gen.slug}/faults/${fault.slug}`
            );
          }
        }
        console.log(`[IndexNow Submit-All] Found ${faults.length} faults`);
      }
    }

    // Fetch all manuals
    if (contentType === 'manuals' || contentType === 'all') {
      let query = supabase
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
        .limit(maxLimit);

      if (lang !== 'all') {
        query = query.eq('language_path', lang);
      }

      const { data: manuals, error: manualsError } = await query;

      if (manualsError) {
        console.error('[IndexNow Submit-All] Error fetching manuals:', manualsError);
      } else if (manuals) {
        for (const manual of manuals) {
          const gen = manual.model_generations as any;
          if (gen && gen.car_models && gen.car_models.car_brands) {
            const langPath = manual.language_path || 'en';
            urls.push(
              `https://faultbase.com/${langPath}/cars/${gen.car_models.car_brands.slug}/${gen.car_models.slug}/${gen.slug}/manuals/${manual.slug}`
            );
          }
        }
        console.log(`[IndexNow Submit-All] Found ${manuals?.length || 0} manuals`);
      }
    }

    if (urls.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No URLs found to submit',
        total: 0,
      });
    }

    console.log(`[IndexNow Submit-All] Total URLs to submit: ${urls.length}`);

    // Submit to IndexNow via the submit endpoint in batches
    const { submitMultipleToIndexNow } = await import('@/lib/submitToIndexNow');
    const BATCH_SIZE = 100;
    const results = {
      submitted: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Submit in batches with delays to avoid rate limiting
    for (let i = 0; i < urls.length; i += BATCH_SIZE) {
      const batch = urls.slice(i, i + BATCH_SIZE);
      const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(urls.length / BATCH_SIZE);

      try {
        await submitMultipleToIndexNow(batch);
        results.submitted += batch.length;
        console.log(`[IndexNow Submit-All] Batch ${batchNumber}/${totalBatches} submitted (${batch.length} URLs)`);
      } catch (error: any) {
        results.failed += batch.length;
        const errorMsg = error?.message || 'Unknown error';
        results.errors.push(`Batch ${batchNumber}: ${errorMsg}`);
        console.warn(`[IndexNow Submit-All] Batch ${batchNumber}/${totalBatches} failed:`, errorMsg);
      }

      // Delay between batches (longer for large volumes)
      if (i + BATCH_SIZE < urls.length) {
        const delay = urls.length > 10000 ? 1000 : 500; // 1s for >10k, 500ms otherwise
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    return NextResponse.json({
      success: results.failed === 0,
      submitted: results.submitted,
      failed: results.failed,
      total: urls.length,
      errors: results.errors.slice(0, 50), // Limit errors in response
      message: `Submitted ${results.submitted}/${urls.length} URLs to IndexNow`,
    });
  } catch (error: any) {
    console.error('[IndexNow Submit-All] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Unknown error',
        message: 'Failed to submit URLs to IndexNow',
      },
      { status: 500 }
    );
  }
}




