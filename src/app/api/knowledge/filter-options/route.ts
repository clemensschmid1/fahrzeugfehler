import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const lang = searchParams.get('lang') || 'en';
    const q = searchParams.get('q') || '';
    const sector = searchParams.get('sector') || '';
    const manufacturer = searchParams.get('manufacturer') || '';
    const complexity = searchParams.get('complexity') || '';
    const partType = searchParams.get('partType') || '';

    // Build query
    let query = supabase
      .from('questions')
      .select('sector, manufacturer, complexity_level, part_type')
      .eq('language_path', lang)
      .eq('is_main', true)
      .eq('meta_generated', true);

    // Apply filters
    if (q) query = query.ilike('header', `%${q}%`);
    if (sector) query = query.eq('sector', sector);
    if (manufacturer) query = query.eq('manufacturer', manufacturer);
    if (complexity) query = query.eq('complexity_level', complexity);
    if (partType) query = query.eq('part_type', partType);

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching filter options:', error);
      return NextResponse.json(
        { sectors: [], manufacturers: [], complexities: [], partTypes: [] },
        { status: 200 }
      );
    }

    // Process the data to extract unique values and counts
    const counts: Record<string, Record<string, number>> = {
      sector: {},
      manufacturer: {},
      complexity_level: {},
      part_type: {},
    };

    (data || []).forEach((row: Record<string, unknown>) => {
      Object.keys(counts).forEach(field => {
        const value = row[field];
        if (value && typeof value === 'string') {
          counts[field][value] = (counts[field][value] || 0) + 1;
        }
      });
    });

    // Convert to the expected format
    const convertToOptions = (fieldCounts: Record<string, number>) =>
      Object.entries(fieldCounts)
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
        .slice(0, 10)
        .map(([value, count]) => ({ value, count }));

    const sectors = convertToOptions(counts.sector);
    const manufacturers = convertToOptions(counts.manufacturer);
    const complexities = convertToOptions(counts.complexity_level);
    const partTypes = convertToOptions(counts.part_type);

    return NextResponse.json({
      sectors,
      manufacturers,
      complexities,
      partTypes,
    });
  } catch (error) {
    console.error('Error in filter options API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch filter options' },
      { status: 500 }
    );
  }
}


