import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

// Supabase config
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const BUCKET = 'bulk-import';

export async function POST(req: Request) {
  try {
    // Parse multipart form data
    const formData = await req.formData();
    const files = formData.getAll('files');
    console.log('[Submit] Received files:', files.map(f => f && typeof f === 'object' && 'name' in f ? f.name : typeof f));
    if (!files || files.length === 0) {
      console.error('[Submit] No files uploaded');
      return NextResponse.json({ error: 'No files uploaded' }, { status: 400 });
    }

    const results = [];
    for (const file of files) {
      if (!(file instanceof File)) {
        console.error('[Submit] Not a File instance:', file);
        continue;
      }
      if (!file.name.endsWith('.txt')) {
        console.error('[Submit] File does not end with .txt:', file.name);
        continue;
      }
      const fileId = uuidv4();
      const storagePath = `${fileId}_${file.name}`;
      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(storagePath, file, { contentType: 'text/plain' });
      if (uploadError) {
        console.error('[Submit] Upload error:', uploadError.message);
        results.push({ file: file.name, error: uploadError.message });
        continue;
      }
      // Validate the uploaded file URL
      const publicUrl = supabase.storage.from(BUCKET).getPublicUrl(storagePath).data.publicUrl;
      if (!publicUrl || !publicUrl.includes('supabase.co/storage/v1/object/public/bulk-import/')) {
        console.error('[Submit] Invalid Supabase Storage URL:', publicUrl);
        results.push({ file: file.name, error: 'Invalid Supabase Storage URL' });
        continue;
      }
      // Store only the storage path in the DB
      const { error: jobError } = await supabase.from('bulk_import_jobs').insert({
        filename: file.name,
        status: 'pending',
        file_url: storagePath, // just the path
        // Optionally: user_id: ...
      });
      if (jobError) {
        console.error('[Submit] Error inserting job:', jobError.message);
        results.push({ file: file.name, error: jobError.message });
        continue;
      }
      console.log(`[Submit] Job created for file ${file.name}`);
      results.push({ file: file.name, status: 'pending' });
    }
    return NextResponse.json({ success: true, results });
  } catch (error) {
    console.error('[Submit] Unexpected error:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
} 