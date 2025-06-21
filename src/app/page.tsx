import Link from 'next/link';

export default function Home() {
  // English-only main page for root
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex flex-col items-center justify-center px-4 py-12">
      {/* Hero Section */}
      <section className="w-full max-w-3xl mx-auto flex flex-col items-center text-center gap-8">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
          Industrial intelligence, not just AI.
        </h1>
        <p className="text-lg sm:text-xl text-slate-700 max-w-2xl">
          Infoneva digests thousands of manuals, error codes and control-logic tables to deliver precise answers in seconds.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
          <Link
            href="/en/chat"
            className="inline-block px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-xl shadow-lg hover:bg-blue-700 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Ask a question
          </Link>
          <Link
            href="/en/knowledge"
            className="inline-block px-8 py-4 bg-white text-blue-700 text-lg font-semibold rounded-xl shadow-lg border border-blue-200 hover:bg-blue-50 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Knowledge Base
          </Link>
        </div>
        <span className="text-base text-slate-500 mt-2">Try three queries free.</span>
      </section>

      {/* Trust/Facts Section */}
      <section className="w-full max-w-3xl mx-auto mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
        <div className="bg-white rounded-2xl shadow-md border border-slate-100 p-6 flex flex-col items-center">
          <span className="text-2xl font-bold text-blue-700 mb-2">Data Pedigree</span>
          <p className="text-slate-700 text-base">
            Trained on thousands of OEM manuals, field logs, and error datasets.
          </p>
        </div>
        <div className="bg-white rounded-2xl shadow-md border border-slate-100 p-6 flex flex-col items-center">
          <span className="text-2xl font-bold text-blue-700 mb-2">Real Use Cases</span>
          <p className="text-slate-700 text-base">
            Maintenance, commissioning, troubleshooting—instant solutions for drives, PLCs & PROFINET.
          </p>
        </div>
        <div className="bg-white rounded-2xl shadow-md border border-slate-100 p-6 flex flex-col items-center">
          <span className="text-2xl font-bold text-blue-700 mb-2">Real-Time</span>
          <p className="text-slate-700 text-base">
            Answers in real time. No waiting, no small talk—just solutions.
          </p>
        </div>
      </section>

      {/* Alt Headlines Section */}
      <section className="w-full max-w-3xl mx-auto mt-16 flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row gap-6">
          <div className="flex-1 bg-slate-50 rounded-xl p-6 border border-slate-100">
            <span className="block text-lg font-semibold text-slate-800 mb-2">
              Diagnostics. Rebooted.
            </span>
            <span className="block text-slate-600">
              From SEW drives to Siemens ET200SP, Infoneva resolves complex system errors on the spot.
            </span>
          </div>
          <div className="flex-1 bg-slate-50 rounded-xl p-6 border border-slate-100">
            <span className="block text-lg font-semibold text-slate-800 mb-2">
              Input: error code. Output: solution.
            </span>
            <span className="block text-slate-600">
              No AI gimmicks. Infoneva speaks your machine's language.
            </span>
          </div>
        </div>
      </section>
    </main>
  );
}
