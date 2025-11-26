import { NextResponse } from 'next/server';

const OPENAI_API_URL = 'https://api.openai.com/v1';

// Helper function for runtime check
function getOpenAIApiKey() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('Missing OpenAI API key');
  }
  return process.env.OPENAI_API_KEY;
}

export async function POST(req: Request) {
  try {
    // If this is a cancel request
    const url = new URL(req.url);
    if (url.pathname.endsWith('/cancel')) {
      const { batchId } = await req.json();
      if (!batchId) return NextResponse.json({ error: 'Missing batchId' }, { status: 400 });
      const res = await fetch(`${OPENAI_API_URL}/batches/${batchId}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getOpenAIApiKey()}`,
          'Content-Type': 'application/json'
        }
      });
      if (!res.ok) {
        const errText = await res.text();
        return NextResponse.json({ error: 'Failed to cancel batch: ' + errText }, { status: 500 });
      }
      const data = await res.json();
      return NextResponse.json(data);
    }
    // Otherwise, this is a batch creation request
    const { questions, prompt, model, metadata } = await req.json();
    if (!Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json({ error: 'No questions provided' }, { status: 400 });
    }
    if (questions.length > 10000) {
      return NextResponse.json({ error: 'Too many questions (max 10,000)' }, { status: 400 });
    }
    if (typeof prompt !== 'string' || prompt.length < 10) {
      return NextResponse.json({ error: 'Prompt is too short or missing' }, { status: 400 });
    }
    if (typeof model !== 'string' || !model.startsWith('gpt-')) {
      return NextResponse.json({ error: 'Invalid model' }, { status: 400 });
    }
    // Remove duplicates and trim
    const uniqueQuestions = Array.from(new Set(questions.map(q => q.trim()).filter(Boolean)));
    if (uniqueQuestions.length === 0) {
      return NextResponse.json({ error: 'No valid questions after cleaning' }, { status: 400 });
    }
    // Convert to JSONL
    const jsonlLines = uniqueQuestions.map((q, i) => JSON.stringify({
      custom_id: `request-${i + 1}`,
      method: 'POST',
      url: '/v1/chat/completions',
      body: {
        model,
        messages: [
          { role: 'system', content: prompt },
          { role: 'user', content: q }
        ]
      }
    }));
    const jsonlContent = jsonlLines.join('\n');
    // Upload file to OpenAI
    const fileRes = await fetch(`${OPENAI_API_URL}/files`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: createFormData(jsonlContent, 'questions.jsonl')
    });
    if (!fileRes.ok) {
      const errText = await fileRes.text();
      return NextResponse.json({ error: 'File upload failed: ' + errText }, { status: 500 });
    }
    const fileData = await fileRes.json();
    const input_file_id = fileData.id;
    // Create batch job
    const batchBody: unknown = {
      input_file_id,
      endpoint: '/v1/chat/completions',
      completion_window: '24h'
    };
    if (metadata && typeof metadata === 'object') {
      (batchBody as Record<string, unknown>).metadata = metadata;
    }
    const batchRes = await fetch(`${OPENAI_API_URL}/batches`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(batchBody)
    });
    if (!batchRes.ok) {
      const errText = await batchRes.text();
      return NextResponse.json({ error: 'Batch creation failed: ' + errText }, { status: 500 });
    }
    const batchData = await batchRes.json();
    return NextResponse.json({
      batchId: batchData.id,
      status: batchData.status,
      input_file_id,
      batch: batchData
    });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const batchId = searchParams.get('batchId');
  const fileId = searchParams.get('fileId');
  const list = searchParams.get('list');
  const limit = searchParams.get('limit') || '20';
  const after = searchParams.get('after');

  // /list endpoint
  if (list) {
    try {
      let url = `${OPENAI_API_URL}/batches?limit=${limit}`;
      if (after) url += `&after=${after}`;
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}` }
      });
      if (!res.ok) {
        const errText = await res.text();
        return NextResponse.json({ error: 'Failed to list batches: ' + errText }, { status: 500 });
      }
      const data = await res.json();
      return NextResponse.json(data);
    } catch (err) {
      return NextResponse.json({ error: (err as Error).message }, { status: 500 });
    }
  }

  // /status endpoint
  if (batchId) {
    try {
      const res = await fetch(`${OPENAI_API_URL}/batches/${batchId}`, {
        headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}` }
      });
      if (!res.ok) {
        const errText = await res.text();
        return NextResponse.json({ error: 'Failed to fetch batch status: ' + errText }, { status: 500 });
      }
      const data = await res.json();
      // Return key info for UI
      return NextResponse.json({
        id: data.id,
        status: data.status,
        created_at: data.created_at,
        input_file_id: data.input_file_id,
        output_file_id: data.output_file_id || null,
        error_file_id: data.error_file_id || null,
        ...data
      });
    } catch (err) {
      return NextResponse.json({ error: (err as Error).message }, { status: 500 });
    }
  }

  // /download endpoint
  if (fileId) {
    try {
      const res = await fetch(`${OPENAI_API_URL}/files/${fileId}/content`, {
        headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}` }
      });
      if (!res.ok) {
        const errText = await res.text();
        return new Response('Failed to download file: ' + errText, { status: 500 });
      }
      // Stream the file to the client
      return new Response(res.body, {
        status: 200,
        headers: {
          'Content-Type': 'application/octet-stream',
          'Content-Disposition': `attachment; filename="${fileId}.jsonl"`
        }
      });
    } catch (err) {
      return new Response('Download failed: ' + (err as Error).message, { status: 500 });
    }
  }

  // If neither param is present
  return NextResponse.json({ error: 'Missing batchId, fileId, or list parameter' }, { status: 400 });
}

function createFormData(content: string, filename: string): FormData {
  const form = new FormData();
  form.append('purpose', 'batch');
  form.append('file', new Blob([content], { type: 'text/plain' }), filename);
  return form;
} 