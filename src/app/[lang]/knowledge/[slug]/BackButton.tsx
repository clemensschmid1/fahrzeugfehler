"use client";
import { useRouter } from 'next/navigation';

export default function BackButton({ lang }: { lang: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => router.back()}
      className="inline-flex items-center px-4 py-2 bg-white text-slate-700 font-medium rounded-lg border border-slate-200 shadow-sm hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
    >
      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
      </svg>
      {lang === 'de' ? 'Zurück zur Wissensdatenbank' : 'Back to Knowledge Base'}
    </button>
  );
} 