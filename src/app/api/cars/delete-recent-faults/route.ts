import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const maxDuration = 300;

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(supabaseUrl, supabaseKey);
}

export async function POST(req: Request) {
  try {
    const { count } = await req.json();
    const deleteCount = count || 74025; // Default to 74,025 if not specified
    
    if (!deleteCount || deleteCount <= 0) {
      return NextResponse.json({ error: 'Invalid count. Must be a positive number.' }, { status: 400 });
    }

    const supabase = getSupabaseClient();

    console.log(`[Delete] Starting deletion of last ${deleteCount} faults...`);

    // Get the IDs of the last N faults ordered by created_at DESC
    const { data: faultsToDelete, error: fetchError } = await supabase
      .from('car_faults')
      .select('id')
      .order('created_at', { ascending: false })
      .limit(deleteCount);

    if (fetchError) {
      console.error('[Delete] Error fetching faults:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch faults', details: fetchError.message }, { status: 500 });
    }

    if (!faultsToDelete || faultsToDelete.length === 0) {
      return NextResponse.json({ 
        message: 'No faults found to delete',
        deleted: 0 
      });
    }

    const faultIds = faultsToDelete.map(f => f.id);
    console.log(`[Delete] Found ${faultIds.length} faults to delete`);

    // Delete in batches to avoid overwhelming the database
    const BATCH_SIZE = 1000;
    let deletedCount = 0;
    let failedCount = 0;

    for (let i = 0; i < faultIds.length; i += BATCH_SIZE) {
      const batch = faultIds.slice(i, i + BATCH_SIZE);
      
      try {
        const { error: deleteError } = await supabase
          .from('car_faults')
          .delete()
          .in('id', batch);

        if (deleteError) {
          console.error(`[Delete] Error deleting batch ${i / BATCH_SIZE + 1}:`, deleteError);
          failedCount += batch.length;
        } else {
          deletedCount += batch.length;
          console.log(`[Delete] Deleted batch ${i / BATCH_SIZE + 1}/${Math.ceil(faultIds.length / BATCH_SIZE)}: ${batch.length} faults (Total: ${deletedCount})`);
        }
      } catch (error) {
        console.error(`[Delete] Exception deleting batch ${i / BATCH_SIZE + 1}:`, error);
        failedCount += batch.length;
      }

      // Small delay between batches to avoid rate limiting
      if (i + BATCH_SIZE < faultIds.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return NextResponse.json({
      message: `Deletion completed`,
      requested: deleteCount,
      found: faultIds.length,
      deleted: deletedCount,
      failed: failedCount
    });

  } catch (error) {
    console.error('[Delete] Unexpected error:', error);
    return NextResponse.json({ 
      error: 'Unexpected error during deletion',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

