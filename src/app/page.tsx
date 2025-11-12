import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.03%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%221%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20 dark:opacity-40"></div>
      
      {/* Theme Toggle */}
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>
      
      {/* Hero Section */}
      <section className="w-full max-w-5xl mx-auto flex flex-col items-center text-center gap-12 relative z-10">
        {/* Brand */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
          <span className="text-red-600 dark:text-red-400 font-mono text-sm tracking-wider uppercase font-bold">FAULTBASE</span>
        </div>
        
        <h1 className="text-5xl sm:text-7xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
          When machines fail,
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-orange-600 to-yellow-600 dark:from-red-400 dark:via-orange-400 dark:to-yellow-400">
            we know why.
          </span>
        </h1>
        
        <p className="text-xl sm:text-2xl text-slate-700 dark:text-slate-300 max-w-4xl leading-relaxed">
          The industrial knowledge hub that transforms fault codes into instant solutions. 
          <br className="hidden sm:block" />
          <span className="text-slate-900 dark:text-white font-semibold">No guesswork. No downtime. Just answers.</span>
        </p>
        
        <div className="flex flex-col sm:flex-row gap-6 w-full justify-center items-center">
          <Link
            href="/en/chat"
            className="group inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-red-600 to-red-700 text-white text-lg font-bold rounded-2xl shadow-2xl hover:from-red-500 hover:to-red-600 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-red-500/50 transform hover:scale-105"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Diagnose Now
          </Link>
          <Link
            href="/en/knowledge"
            className="group inline-flex items-center gap-3 px-10 py-5 bg-white dark:bg-white/10 backdrop-blur-sm text-slate-700 dark:text-white text-lg font-semibold rounded-2xl border border-slate-200 dark:border-white/20 hover:bg-slate-50 dark:hover:bg-white/20 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-slate-300 dark:focus:ring-white/30"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            Browse Knowledge
          </Link>
        </div>
        
        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>3 free queries • No signup required</span>
        </div>
      </section>

      {/* Stats Section */}
      <section className="w-full max-w-6xl mx-auto mt-20 grid grid-cols-1 sm:grid-cols-3 gap-8 relative z-10">
        <div className="group bg-white dark:bg-white/5 backdrop-blur-sm rounded-3xl border border-slate-200 dark:border-white/10 p-8 text-center hover:bg-slate-50 dark:hover:bg-white/10 transition-all duration-300">
          <div className="text-4xl font-black text-red-600 dark:text-red-400 mb-3 group-hover:scale-110 transition-transform">10K+</div>
          <div className="text-slate-900 dark:text-white font-bold text-lg mb-2">Fault Codes</div>
          <p className="text-slate-600 dark:text-slate-300 text-sm">
            From Siemens to ABB, Allen-Bradley to Schneider Electric
          </p>
        </div>
        <div className="group bg-white dark:bg-white/5 backdrop-blur-sm rounded-3xl border border-slate-200 dark:border-white/10 p-8 text-center hover:bg-slate-50 dark:hover:bg-white/10 transition-all duration-300">
          <div className="text-4xl font-black text-orange-600 dark:text-orange-400 mb-3 group-hover:scale-110 transition-transform">50K+</div>
          <div className="text-slate-900 dark:text-white font-bold text-lg mb-2">Solutions</div>
          <p className="text-slate-600 dark:text-slate-300 text-sm">
            Field-tested fixes from maintenance logs and OEM manuals
          </p>
        </div>
        <div className="group bg-white dark:bg-white/5 backdrop-blur-sm rounded-3xl border border-slate-200 dark:border-white/10 p-8 text-center hover:bg-slate-50 dark:hover:bg-white/10 transition-all duration-300">
          <div className="text-4xl font-black text-yellow-600 dark:text-yellow-400 mb-3 group-hover:scale-110 transition-transform">2.3s</div>
          <div className="text-slate-900 dark:text-white font-bold text-lg mb-2">Avg Response</div>
          <p className="text-slate-600 dark:text-slate-300 text-sm">
            Lightning-fast diagnosis when every second counts
          </p>
        </div>
      </section>

      {/* Value Props */}
      <section className="w-full max-w-5xl mx-auto mt-20 grid grid-cols-1 lg:grid-cols-2 gap-8 relative z-10">
        <div className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-500/10 dark:to-orange-500/10 backdrop-blur-sm rounded-3xl border border-red-200 dark:border-red-500/20 p-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Precision Diagnosis</h3>
          </div>
          <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
            Input a fault code, get the exact solution. No generic responses, no AI hallucinations. 
            Just proven fixes from thousands of real-world scenarios.
          </p>
        </div>
        
        <div className="bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-orange-500/10 dark:to-yellow-500/10 backdrop-blur-sm rounded-3xl border border-orange-200 dark:border-orange-500/20 p-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Instant Access</h3>
          </div>
          <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
            No waiting for support tickets. No digging through PDFs. 
            Get answers in seconds, not hours. Your production line can't wait.
          </p>
        </div>
      </section>

      {/* Social Proof */}
      <section className="w-full max-w-4xl mx-auto mt-20 text-center relative z-10">
        <div className="bg-white dark:bg-white/5 backdrop-blur-sm rounded-3xl border border-slate-200 dark:border-white/10 p-8">
          <p className="text-slate-700 dark:text-slate-300 text-lg mb-6">
            "Finally, a tool that speaks the language of industrial automation."
          </p>
          <div className="flex items-center justify-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-orange-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">M</span>
            </div>
            <div className="text-left">
              <div className="text-slate-900 dark:text-white font-semibold">Mike Chen</div>
              <div className="text-slate-500 dark:text-slate-400 text-sm">Senior Controls Engineer</div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
