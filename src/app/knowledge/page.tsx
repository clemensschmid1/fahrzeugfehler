'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function KnowledgePage() {
  const [questions, setQuestions] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/knowledge/index')
      .then(res => res.json())
      .then(setQuestions);
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Knowledge Base</h1>
      <ul className="space-y-3">
        {questions.map(q => (
          <li key={q.slug}>
            <Link href={`/knowledge/${q.slug}`} className="text-blue-600 hover:underline">
              {q.question}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
} 