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
  { params }: { params: Promise<{ brand: string; model: string }> }
) {
  try {
    const { brand, model } = await params;
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '60');
    const lang = searchParams.get('lang') || 'en';
    const generationId = searchParams.get('generationId');

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

    // Get the model ID
    const { data: modelData, error: modelError } = await supabase
      .from('car_models')
      .select('id')
      .eq('slug', model)
      .eq('brand_id', brandData.id)
      .single();

    if (modelError || !modelData) {
      return NextResponse.json({ error: 'Model not found' }, { status: 404 });
    }

    // Build query for faults
    let query = supabase
      .from('car_faults')
      .select(`
        id,
        slug,
        title,
        description,
        error_code,
        severity,
        model_generation_id,
        model_generations!inner(
          id,
          name,
          slug,
          generation_code
        )
      `, { count: 'exact' })
      .eq('status', 'live')
      .eq('language_path', lang)
      .eq('car_models.id', modelData.id);

    // Filter by generation if specified
    if (generationId) {
      query = query.eq('model_generation_id', generationId);
    } else {
      // Get all generations for this model to filter faults
      const { data: generations } = await supabase
        .from('model_generations')
        .select('id')
        .eq('car_model_id', modelData.id);

      if (generations && generations.length > 0) {
        const generationIds = generations.map(g => g.id);
        query = query.in('model_generation_id', generationIds);
      } else {
        // No generations, return empty
        return NextResponse.json({ faults: [], totalCount: 0 });
      }
    }

    // Count total faults
    const { count: totalCount } = await query;

    // Fetch faults with pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data: faults, error: faultsError } = await query
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
    console.error('[Model Faults API] Error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

