import { NextResponse } from 'next/server';

export const runtime = 'edge';
export const maxDuration = 30;

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
    const batchId = searchParams.get('batchId');

    if (!batchId) {
      return NextResponse.json({ error: 'Missing batchId parameter' }, { status: 400 });
    }

    const apiKey = getOpenAIApiKey();

    const res = await fetch(`${OPENAI_API_URL}/batches/${batchId}`, {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    });

    if (!res.ok) {
      const errorText = await res.text();
      return NextResponse.json({ error: `Failed to fetch batch status: ${errorText}` }, { status: res.status });
    }

    const data = await res.json();

    return NextResponse.json({
      id: data.id,
      status: data.status,
      request_counts: data.request_counts,
      output_file_id: data.output_file_id,
      error_file_id: data.error_file_id,
      created_at: data.created_at,
      in_progress_at: data.in_progress_at,
      finalizing_at: data.finalizing_at,
      completed_at: data.completed_at,
      failed_at: data.failed_at,
      expired_at: data.expired_at,
      cancelled_at: data.cancelled_at,
      metadata: data.metadata,
    });
  } catch (error) {
    console.error('Check status error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

