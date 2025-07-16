import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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
    const { question } = await req.json();
    
    if (!question || typeof question !== 'string') {
      return NextResponse.json({ error: 'Missing or invalid question' }, { status: 400 });
    }

    const normalizedQuestion = question.toLowerCase().trim();
    
    // Check for exact match in questions table
    const { data: exactMatch, error: exactError } = await supabase
      .from('questions')
      .select('id, question')
      .ilike('question', normalizedQuestion)
      .maybeSingle();

    if (exactError) {
      console.error('Database error checking exact match:', exactError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    if (exactMatch) {
      return NextResponse.json({ 
        isDuplicate: true, 
        matchType: 'exact',
        existingId: exactMatch.id 
      });
    }

    // Check for similar questions (fuzzy match)
    const { data: similarMatches, error: similarError } = await supabase
      .from('questions')
      .select('id, question')
      .or(`question.ilike.%${normalizedQuestion}%,question.ilike.${normalizedQuestion}%`)
      .limit(5);

    if (similarError) {
      console.error('Database error checking similar matches:', similarError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    // Check if any similar matches are close enough (simple similarity check)
    const isSimilar = similarMatches?.some(match => {
      const matchNormalized = match.question.toLowerCase().trim();
      const similarity = calculateSimilarity(normalizedQuestion, matchNormalized);
      return similarity > 0.8; // 80% similarity threshold
    });

    if (isSimilar) {
      return NextResponse.json({ 
        isDuplicate: true, 
        matchType: 'similar',
        similarQuestions: similarMatches 
      });
    }

    // Check generated_questions table for duplicates
    const questionHash = await createQuestionHash(question);
    const { data: generatedMatch, error: generatedError } = await supabase
      .from('generated_questions')
      .select('id, question_text')
      .eq('question_hash', questionHash)
      .maybeSingle();

    if (generatedError) {
      console.error('Database error checking generated questions:', generatedError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    if (generatedMatch) {
      return NextResponse.json({ 
        isDuplicate: true, 
        matchType: 'generated',
        existingId: generatedMatch.id 
      });
    }

    return NextResponse.json({ 
      isDuplicate: false 
    });

  } catch (error) {
    console.error('[check-duplicate] Error:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

// Simple similarity calculation using Levenshtein distance
function calculateSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const distance = levenshteinDistance(longer, shorter);
  return (longer.length - distance) / longer.length;
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
} 