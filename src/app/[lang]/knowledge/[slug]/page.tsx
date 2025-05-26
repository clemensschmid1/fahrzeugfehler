import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import KnowledgeClient from './KnowledgeClient';

// Falls du eigene Supabase-Typen definieren willst
// import type { Database } from '@/types/supabase';

interface Props {
  params: {
    slug: string;
    lang: string;
  };
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
}

export default async function KnowledgePage({ params }: Props) {
  const { lang, slug } = params;

  // Falls du Database-Typen hast: <Database>
  const supabase = createServerComponentClient({ cookies });

  // Fetch the question (draft first, then live)
  let { data: question, error } = await supabase
    .from('questions')
    .select('*')
    .eq('slug', slug)
    .eq('language_path', lang)
    .eq('status', 'draft')
    .maybeSingle();

  if (!question) {
    const { data: liveData, error: liveError } = await supabase
      .from('questions')
      .select('*')
      .eq('slug', slug)
      .eq('language_path', lang)
      .eq('status', 'live')
      .maybeSingle();
    question = liveData;
    error = liveError;
  }

  if (error || !question) {
    return notFound();
  }

  let relatedQuestions: any[] = [];
  if (question.embedding) {
    const { data: relatedData } = await supabase.rpc('match_questions', {
      query_embedding: question.embedding,
      match_threshold: 0.5,
      match_count: 7,
    });
    relatedQuestions = (relatedData || [])
      .filter((q: any) => q.id !== question.id)
      .slice(0, 6);
  }

  const { data: comments } = await supabase
    .from('comments')
    .select('*')
    .eq('question_id', question.id)
    .order('created_at', { ascending: true });

  return (
    <KnowledgeClient
      question={question}
      relatedQuestions={relatedQuestions}
      comments={comments || []}
      lang={lang}
      slug={slug}
    />
  );
}
