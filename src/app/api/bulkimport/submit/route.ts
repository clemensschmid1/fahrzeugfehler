import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

// Supabase config
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const BUCKET = 'bulk-import';

export async function POST(req: Request) {
  try {
    // Parse multipart form data
    const formData = await req.formData();
    const files = formData.getAll('files');
    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files uploaded' }, { status: 400 });
    }

    const results = [];
    for (const file of files) {
      if (!(file instanceof File)) continue;
      if (!file.name.endsWith('.txt')) continue;
      const fileId = uuidv4();
      const storagePath = `${fileId}_${file.name}`;
      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(storagePath, file, { contentType: 'text/plain' });
      if (uploadError) {
        results.push({ file: file.name, error: uploadError.message });
        continue;
      }
      const fileUrl = supabase.storage.from(BUCKET).getPublicUrl(storagePath).data.publicUrl;
      // Insert job into DB
      const { data: job, error: jobError } = await supabase.from('bulk_import_jobs').insert({
        filename: file.name,
        status: 'pending',
        file_url: fileUrl,
        // Optionally: user_id: ...
      }).select().single();
      if (jobError) {
        results.push({ file: file.name, error: jobError.message });
        continue;
      }
      results.push({ file: file.name, jobId: job.id, status: job.status });
    }
    return NextResponse.json({ success: true, results });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
} 