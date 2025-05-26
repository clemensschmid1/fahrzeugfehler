import { notFound } from 'next/navigation';

export default function KnowledgePage({ params }: { params: any }) {
  const { slug, lang } = params;

  if (!slug || typeof slug !== 'string') return notFound();

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold">Knowledge Page</h1>
      <p className="text-gray-700 mt-2">Slug: {slug}</p>
      <p className="text-gray-700">Language: {lang}</p>
    </div>
  );
}
