import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const filename = searchParams.get('filename');

    if (!filename) {
      return NextResponse.json({ error: 'Missing filename parameter' }, { status: 400 });
    }

    // Security: Only allow files from generated directory
    if (filename.includes('..') || (!filename.endsWith('.jsonl') && !filename.endsWith('.txt'))) {
      return NextResponse.json({ error: 'Invalid filename' }, { status: 400 });
    }

    const filePath = join(process.cwd(), 'public', 'generated', filename);

    // Check if file exists
    if (!existsSync(filePath)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Read and return the file
    const fileContent = await readFile(filePath, 'utf-8');

    const contentType = filename.endsWith('.txt') 
      ? 'text/plain' 
      : 'application/jsonl';
    
    return new Response(fileContent, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Download file error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

