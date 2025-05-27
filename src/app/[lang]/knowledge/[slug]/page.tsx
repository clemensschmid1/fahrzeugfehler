import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import KnowledgeClient from './KnowledgeClient';
import type { Database } from '@/lib/database.types';
import type { Metadata } from 'next';

type Params = { slug: string; lang: string };

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: decodeURIComponent(slug),
  };
}

export default async function KnowledgePage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { lang, slug } = await params;
  const supabase = createServerComponentClient<Database>({ cookies });

  // Frage laden (Draft oder Live)
  const { data: draft } = await supabase
    .from('questions')
    .select('*')
    .eq('slug', slug)
    .eq('language', lang)
    .eq('status', 'draft')
    .maybeSingle();

  let question = draft;

  if (!question) {
    const { data: live } = await supabase
      .from('questions')
      .select('*')
      .eq('slug', slug)
      .eq('language', lang)
      .eq('status', 'live')
      .maybeSingle();

    question = live;
  }

  if (!question) return notFound();

  // Related Questions
  type RelatedQuestion = {
    id: string;
    slug: string;
    question: string;
    similarity: number;
  };

  let relatedQuestions: RelatedQuestion[] = [];

  if (question.embedding) {
    const { data: relatedData } = await supabase.rpc('match_questions', {
      query_embedding: question.embedding,
      match_threshold: 0.5,
      match_count: 7,
    });

    relatedQuestions = (relatedData ?? [])
      .filter((q: unknown): q is RelatedQuestion => {
        if (
          typeof q === 'object' &&
          q !== null &&
          'id' in q &&
          'slug' in q &&
          'question' in q &&
          'similarity' in q
        ) {
          const r = q as Record<string, unknown>;
          return (
            typeof r.id === 'string' &&
            typeof r.slug === 'string' &&
            typeof r.question === 'string' &&
            typeof r.similarity === 'number' &&
            r.id !== question.id
          );
        }
        return false;
      })
      .slice(0, 6);
  }

  // Kommentare
  const { data: comments } = await supabase
    .from('comments')
    .select('*')
    .eq('question_id', question.id)
    .order('created_at', { ascending: true });

  return (
    <KnowledgeClient
      question={question}
      relatedQuestions={relatedQuestions}
      comments={comments ?? []}
      lang={lang}
      slug={slug}
    />
  );
}
