import { NextResponse } from 'next/server';

export const runtime = 'edge';
export const maxDuration = 60;

const OPENAI_API_URL = 'https://api.openai.com/v1';

function getOpenAIApiKey() {
  const apiKey = process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('Missing OpenAI API key');
  }
  return apiKey;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const fileId = searchParams.get('fileId');
    const batchId = searchParams.get('batchId');

    if (!fileId && !batchId) {
      return NextResponse.json({ error: 'Missing fileId or batchId parameter' }, { status: 400 });
    }

    const apiKey = getOpenAIApiKey();
    let outputFileId = fileId;

    // If batchId provided, get output file ID from batch
    if (batchId && !fileId) {
      const batchRes = await fetch(`${OPENAI_API_URL}/batches/${batchId}`, {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });

      if (!batchRes.ok) {
        return NextResponse.json({ error: 'Failed to fetch batch' }, { status: batchRes.status });
      }

      const batchData = await batchRes.json();
      outputFileId = batchData.output_file_id;

      if (!outputFileId) {
        return NextResponse.json({ error: 'Batch not completed or no output file available' }, { status: 400 });
      }
    }

    // Download file from OpenAI
    const fileRes = await fetch(`${OPENAI_API_URL}/files/${outputFileId}/content`, {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    });

    if (!fileRes.ok) {
      return NextResponse.json({ error: 'Failed to download file' }, { status: fileRes.status });
    }

    const fileContent = await fileRes.text();

    // Get batch info for filename
    let filename = `batch-output-${outputFileId}.jsonl`;
    if (batchId) {
      const batchRes = await fetch(`${OPENAI_API_URL}/batches/${batchId}`, {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });
      if (batchRes.ok) {
        const batchData = await batchRes.json();
        const batchName = batchData.metadata?.batchName || `batch-${batchId}`;
        filename = `${batchName}-output.jsonl`;
      }
    }

    return new Response(fileContent, {
      status: 200,
      headers: {
        'Content-Type': 'application/jsonl',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Download batch output error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

