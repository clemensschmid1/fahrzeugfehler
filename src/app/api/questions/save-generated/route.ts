import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Removed edge runtime to avoid build-time evaluation issues
// This route will use Node.js runtime instead

// Helper function to get Supabase client at runtime (prevents build-time errors)
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient(supabaseUrl, supabaseAnonKey);
}

// Function to create a hash for fast duplicate checking using Web Crypto API
async function createQuestionHash(question: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(question.toLowerCase().trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

export async function POST(req: Request) {
  try {
    const { questions, language, prompt, ai_model, export_filename } = await req.json();
    
    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return new NextResponse('Missing or invalid questions array', { status: 400 });
    }

    if (!language || !prompt || !ai_model) {
      return new NextResponse('Missing required fields: language, prompt, ai_model', { status: 400 });
    }

    const now = new Date().toISOString();
    
    // Prepare data for batch insert
    const questionsToInsert = await Promise.all(questions.map(async (question: string) => ({
      question_text: question.trim(),
      question_hash: await createQuestionHash(question),
      language,
      generated_at: now,
      exported_at: now,
      export_filename: export_filename || `questions_${new Date().toISOString().split('T')[0]}.txt`,
      prompt_used: prompt,
      ai_model_used: ai_model,
    })));

    // Get Supabase client at runtime
    const supabase = getSupabaseClient();

    // Insert questions into database
    const { data, error } = await supabase
      .from('generated_questions')
      .insert(questionsToInsert)
      .select('id, question_text');

    if (error) {
      console.error('Database error saving questions:', error);
      return new NextResponse('Database error: ' + error.message, { status: 500 });
    }

    console.log(`=== Saved ${questions.length} questions to database ===`);
    console.log('Export filename:', export_filename);
    console.log('Language:', language);
    console.log('AI Model:', ai_model);
    console.log('Prompt used:', prompt);
    console.log('=== End Save Log ===');

    return new NextResponse(JSON.stringify({
      success: true,
      savedCount: data?.length || 0,
      message: `Successfully saved ${data?.length || 0} questions to database`
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (err: unknown) {
    console.error('Error saving questions:', err);
    return new NextResponse('Server error: ' + (err as Error).message, { status: 500 });
  }
} 