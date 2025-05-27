import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import KnowledgeClient from './KnowledgeClient';
import type { Database } from '@/lib/database';

interface Props {
  params: {
    slug: string;
    lang: string;
  };
}

interface RelatedQuestion {
  id: string;
  question: string;
  slug: string;
  similarity: number;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
}

export default async function KnowledgePage({ params }: Props) {
  const { lang, slug } = params;
  const supabase = createServerComponentClient<Database>({ cookies });

  // Fetch the question (draft or live)
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

  let relatedQuestions: RelatedQuestion[] = [];
  if (question.embedding) {
    const { data: relatedData } = await supabase.rpc('match_questions', {
      query_embedding: question.embedding,
      match_threshold: 0.5,
      match_count: 7,
    });

    relatedQuestions = (relatedData || [])
      .filter((q: any): q is RelatedQuestion => q && q.id !== question.id && typeof q.similarity === 'number')
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
      comments={(comments || []) as Comment[]}
      lang={lang}
      slug={slug}
    />
  );
}
