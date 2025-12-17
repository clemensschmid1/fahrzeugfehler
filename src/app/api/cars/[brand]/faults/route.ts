import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const revalidate = 300;

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(supabaseUrl, supabaseKey);
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ brand: string }> }
) {
  try {
    const { brand } = await params;
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '60');
    const lang = searchParams.get('lang') || 'en';

    const supabase = getSupabaseClient();

    // First, get the brand ID
    const { data: brandData, error: brandError } = await supabase
      .from('car_brands')
      .select('id')
      .eq('slug', brand)
      .single();

    if (brandError || !brandData) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
    }

    // Get all models for this brand
    const { data: models, error: modelsError } = await supabase
      .from('car_models')
      .select('id')
      .eq('brand_id', brandData.id);

    if (modelsError || !models) {
      return NextResponse.json({ error: 'Failed to fetch models' }, { status: 500 });
    }

    const modelIds = models.map(m => m.id);
    if (modelIds.length === 0) {
      return NextResponse.json({ faults: [], totalCount: 0 });
    }

    // Get all generations for these models
    const { data: generations, error: generationsError } = await supabase
      .from('model_generations')
      .select('id')
      .in('car_model_id', modelIds);

    if (generationsError) {
      return NextResponse.json({ error: 'Failed to fetch generations' }, { status: 500 });
    }

    const generationIds = (generations || []).map(g => g.id);

    // Count total faults for this brand
    const { count: totalCount } = await supabase
      .from('car_faults')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'live')
      .eq('language_path', lang)
      .or(generationIds.length > 0 
        ? `model_generation_id.in.(${generationIds.join(',')})` 
        : 'model_generation_id.is.null'
      );

    // Fetch faults with pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data: faults, error: faultsError } = await supabase
      .from('car_faults')
      .select(`
        id,
        slug,
        title,
        description,
        error_code,
        severity,
        model_generation_id,
        car_models!inner(
          id,
          name,
          slug,
          model_generations!inner(
            id,
            name,
            slug,
            generation_code
          )
        )
      `)
      .eq('status', 'live')
      .eq('language_path', lang)
      .or(generationIds.length > 0 
        ? `model_generation_id.in.(${generationIds.join(',')})` 
        : 'model_generation_id.is.null'
      )
      .order('created_at', { ascending: false })
      .range(from, to);

    if (faultsError) {
      return NextResponse.json({ error: 'Failed to fetch faults', details: faultsError.message }, { status: 500 });
    }

    return NextResponse.json({
      faults: faults || [],
      totalCount: totalCount || 0,
      page,
      limit,
      hasMore: (faults?.length || 0) === limit && (from + (faults?.length || 0)) < (totalCount || 0)
    });

  } catch (error) {
    console.error('[Brand Faults API] Error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

