import { createClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';

type PageProps = {
  params: { slug: string }
};

export default async function KnowledgeDetail({ params }: PageProps) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .eq('slug', params.slug)
    .single();

  if (error || !data) {
    // Next.js native 404 handling
    notFound(); // Optional: can also use your custom div if you prefer
    // return <div className="p-6 text-red-600">Not found.</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-2">{data.question}</h1>
      <p className="mb-4">{data.answer}</p>
      <div className="text-sm text-gray-600">
        <p><b>Manufacturer:</b> {data.manufacturer}</p>
        <p><b>Part Type:</b> {data.part_type}</p>
        <p><b>Series:</b> {data.part_series}</p>
        <p><b>Sector:</b> {data.sector}</p>
        <p><b>Related Slugs:</b> {data.related_slugs?.join(', ')}</p>
      </div>
    </div>
  );
} 