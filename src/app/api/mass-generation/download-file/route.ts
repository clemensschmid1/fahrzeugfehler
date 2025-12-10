import { NextResponse } from 'next/server';
import { createReadStream, statSync } from 'fs';
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

    // Get file stats for Content-Length header
    const stats = statSync(filePath);
    const fileSize = stats.size;

    // Use streaming for large files to avoid memory issues
    // Convert Node.js stream to Web ReadableStream
    const fileStream = createReadStream(filePath, { encoding: 'utf-8' });
    
    const readableStream = new ReadableStream({
      start(controller) {
        fileStream.on('data', (chunk) => {
          controller.enqueue(new TextEncoder().encode(chunk));
        });
        fileStream.on('end', () => {
          controller.close();
        });
        fileStream.on('error', (err) => {
          controller.error(err);
        });
      },
      cancel() {
        fileStream.destroy();
      }
    });

    const contentType = filename.endsWith('.txt') 
      ? 'text/plain' 
      : 'application/jsonl';
    
    // Return streaming response
    return new Response(readableStream, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': fileSize.toString(),
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

