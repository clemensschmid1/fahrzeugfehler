import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

function getOpenAIApiKey() {
  const apiKey = process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('Missing OpenAI API key');
  }
  return apiKey;
}

/**
 * This endpoint generates a direct upload URL for OpenAI.
 * However, OpenAI doesn't support presigned URLs for file uploads.
 * Instead, we'll return instructions for direct upload.
 */
export async function POST(req: Request) {
  try {
    const { filename, contentType = 'fault' } = await req.json();

    if (!filename) {
      return NextResponse.json({ error: 'Missing filename' }, { status: 400 });
    }

    // OpenAI doesn't support presigned URLs, but we can provide instructions
    // for direct client-side upload using the API key
    // However, exposing the API key to the client is a security risk
    
    // Better approach: Return instructions for manual upload
    return NextResponse.json({
      success: true,
      message: 'For large files, upload directly to OpenAI Batch API',
      instructions: {
        step1: 'Go to https://platform.openai.com/batch',
        step2: 'Click "Create batch"',
        step3: 'Upload your JSONL file directly',
        step4: 'Copy the file ID and batch ID',
        step5: 'Use those IDs in Step 3 (Check Batch Status)',
      },
      directUploadUrl: 'https://platform.openai.com/batch',
    });
  } catch (error) {
    console.error('Get OpenAI upload URL error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}









