'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export default function BulkFixerPage() {
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [fixing, setFixing] = useState(false);
  const [fixResults, setFixResults] = useState<any>(null);

  const loadAnalysis = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/cars/bulk-generate-fixer', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to load analysis: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      setAnalysis(data);
    } catch (err: any) {
      console.error('Error loading analysis:', err);
      alert(`Failed to load analysis: ${err.message || 'Unknown error'}`);
      setAnalysis({ total: 0, autoFixable: 0, manualReview: 0, categories: {} });
    } finally {
      setLoading(false);
    }
  };

  const fixAll = async () => {
    if (!confirm(`Fix all ${analysis?.autoFixable || 0} auto-fixable jobs?`)) {
      return;
    }

    setFixing(true);
    try {
      const response = await fetch('/api/cars/bulk-generate-fixer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fixAll: true }),
      });
      const data = await response.json();
      setFixResults(data);
      await loadAnalysis(); // Reload analysis
    } catch (err) {
      console.error('Error fixing jobs:', err);
      alert('Failed to fix jobs');
    } finally {
      setFixing(false);
    }
  };

  const fixCategory = async (category: string) => {
    const count = analysis?.categories[category]?.count || 0;
    if (!confirm(`Fix all ${count} jobs in category "${category}"?`)) {
      return;
    }

    setFixing(true);
    try {
      const response = await fetch('/api/cars/bulk-generate-fixer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category }),
      });
      const data = await response.json();
      setFixResults(data);
      await loadAnalysis(); // Reload analysis
    } catch (err) {
      console.error('Error fixing jobs:', err);
      alert('Failed to fix jobs');
    } finally {
      setFixing(false);
    }
  };

  const fixJob = async (jobId: string) => {
    setFixing(true);
    try {
      const response = await fetch('/api/cars/bulk-generate-fixer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId }),
      });
      const data = await response.json();
      setFixResults(data);
      await loadAnalysis(); // Reload analysis
    } catch (err) {
      console.error('Error fixing job:', err);
      alert('Failed to fix job');
    } finally {
      setFixing(false);
    }
  };

  useEffect(() => {
    loadAnalysis();
  }, []);

  const categoryColors: Record<string, string> = {
    batch_still_running: 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300',
    batch_failed: 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300',
    timeout: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300',
    recoverable: 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300',
    other_error: 'bg-gray-100 dark:bg-gray-900/20 text-gray-800 dark:text-gray-300',
  };

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-slate-900">
      <Header />
      <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
            Bulk Generation Job Fixer
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Analyze and automatically fix failed bulk generation jobs
          </p>
        </div>

        <div className="mb-6 flex gap-4">
          <button
            onClick={loadAnalysis}
            disabled={loading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? 'Loading...' : 'Refresh Analysis'}
          </button>
          {analysis && analysis.autoFixable > 0 && (
            <button
              onClick={fixAll}
              disabled={fixing}
              className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {fixing ? 'Fixing...' : `Fix All (${analysis.autoFixable})`}
            </button>
          )}
        </div>

        {fixResults && (
          <div className={`mb-6 p-4 rounded-lg ${fixResults.success ? 'bg-green-100 dark:bg-green-900/20' : 'bg-red-100 dark:bg-red-900/20'}`}>
            <h3 className="font-bold mb-2">
              {fixResults.success ? '✓ Fix Results' : '✗ Fix Failed'}
            </h3>
            <p>{fixResults.message}</p>
            {fixResults.fixed > 0 && (
              <p className="mt-2 text-green-700 dark:text-green-400">
                Fixed: {fixResults.fixed} | Failed: {fixResults.failed}
              </p>
            )}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-slate-600 dark:text-slate-400">Analyzing failed jobs...</p>
          </div>
        ) : analysis && analysis.total > 0 ? (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-100 dark:bg-slate-800 p-6 rounded-lg">
                <div className="text-3xl font-bold text-slate-900 dark:text-white">{analysis.total}</div>
                <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">Total Failed Jobs</div>
              </div>
              <div className="bg-green-100 dark:bg-green-900/20 p-6 rounded-lg">
                <div className="text-3xl font-bold text-green-700 dark:text-green-400">{analysis.autoFixable}</div>
                <div className="text-sm text-green-600 dark:text-green-400 mt-1">Auto-Fixable</div>
              </div>
              <div className="bg-yellow-100 dark:bg-yellow-900/20 p-6 rounded-lg">
                <div className="text-3xl font-bold text-yellow-700 dark:text-yellow-400">{analysis.manualReview}</div>
                <div className="text-sm text-yellow-600 dark:text-yellow-400 mt-1">Need Manual Review</div>
              </div>
            </div>

            {/* Category Breakdown */}
            <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Failure Categories</h2>
              <div className="space-y-3">
                {Object.entries(analysis.categories || {}).map(([category, data]: [string, any]) => (
                  <div key={category} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${categoryColors[category] || categoryColors.other_error}`}>
                        {category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                      <span className="text-slate-600 dark:text-slate-400">
                        {data.count} job{data.count !== 1 ? 's' : ''}
                      </span>
                    </div>
                    {data.jobs[0]?.canAutoFix && (
                      <button
                        onClick={() => fixCategory(category)}
                        disabled={fixing}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        {fixing ? 'Fixing...' : `Fix All (${data.count})`}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Job Details */}
            <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Job Details</h2>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {Object.entries(analysis.categories || {}).flatMap(([category, data]: [string, any]) =>
                  data.jobs.map((job: any) => (
                    <div key={job.id} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${categoryColors[category] || categoryColors.other_error}`}>
                              {category.replace(/_/g, ' ')}
                            </span>
                            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                              {job.id.substring(0, 8)}...
                            </span>
                          </div>
                          <p className="text-sm text-slate-700 dark:text-slate-300 mb-1">{job.reason}</p>
                          {job.errorMessage && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                              Error: {job.errorMessage.substring(0, 100)}...
                            </p>
                          )}
                          <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                            Created: {new Date(job.createdAt).toLocaleString()}
                          </p>
                        </div>
                        {job.canAutoFix && (
                          <button
                            onClick={() => fixJob(job.id)}
                            disabled={fixing}
                            className="ml-4 px-3 py-1 bg-green-600 text-white rounded text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                          >
                            Fix
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        ) : analysis && analysis.total === 0 ? (
          <div className="text-center py-12 bg-green-50 dark:bg-green-900/10 rounded-lg">
            <div className="text-4xl mb-4">✓</div>
            <h3 className="text-xl font-semibold text-green-700 dark:text-green-400 mb-2">
              No Failed Jobs!
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              All jobs are running successfully or have completed.
            </p>
          </div>
        ) : null}
      </main>
      <Footer />
    </div>
  );
}

