'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { RefreshCw, CheckCircle, XCircle, Loader2, Info, Database } from 'lucide-react';

export default function BulkRecoverPage() {
  const params = useParams();
  const lang = params.lang as string;
  const t = (en: string, de: string) => lang === 'de' ? de : en;

  const [isRecovering, setIsRecovering] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [jobId, setJobId] = useState('');

  const handleRecover = async (recoverAll: boolean = false, specificJobId?: string) => {
    if (!recoverAll && !specificJobId && !jobId) {
      setError(t('Please enter a job ID or select "Recover All"', 'Bitte geben Sie eine Job-ID ein oder wählen Sie "Alle wiederherstellen"'));
      return;
    }

    if (recoverAll && !confirm(t('Are you sure you want to recover ALL jobs? This may take a long time.', 'Möchten Sie wirklich ALLE Jobs wiederherstellen? Dies kann sehr lange dauern.'))) {
      return;
    }

    setIsRecovering(true);
    setError(null);
    setResults(null);

    try {
      const response = await fetch('/api/cars/bulk-generate-recover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId: specificJobId || (recoverAll ? undefined : jobId) || undefined,
          recoverAll,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to recover jobs');
      }

      const data = await response.json();
      setResults(data);
    } catch (err: any) {
      setError(err.message || 'Unknown error');
      console.error('Error recovering jobs:', err);
    } finally {
      setIsRecovering(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-slate-900">
      <Header />
      <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-3">
            <Database className="h-10 w-10" />
            {t('Bulk Generation Recovery', 'Massengenerierungs-Wiederherstellung')}
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            {t(
              'Recover jobs from OpenAI Batch API results. This system downloads completed batch results and inserts them into the database, even if the original job was interrupted or failed.',
              'Stellen Sie Jobs aus OpenAI Batch API-Ergebnissen wieder her. Dieses System lädt abgeschlossene Batch-Ergebnisse herunter und fügt sie in die Datenbank ein, auch wenn der ursprüngliche Job unterbrochen oder fehlgeschlagen wurde.'
            )}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6 mb-6">
          <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-1">
                  {t('How It Works', 'Wie es funktioniert')}
                </h3>
                <p className="text-sm text-blue-800 dark:text-blue-400">
                  {t(
                    'This recovery system finds all jobs with OpenAI batch IDs, checks if the batches are completed, downloads the results, and inserts them into the database. Perfect for recovering jobs after server restarts or failures.',
                    'Dieses Wiederherstellungssystem findet alle Jobs mit OpenAI Batch-IDs, prüft, ob die Batches abgeschlossen sind, lädt die Ergebnisse herunter und fügt sie in die Datenbank ein. Perfekt zum Wiederherstellen von Jobs nach Server-Neustarts oder Fehlern.'
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
                {t('Recover Specific Job', 'Bestimmten Job wiederherstellen')}
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={jobId}
                  onChange={(e) => setJobId(e.target.value)}
                  placeholder={t('Enter job ID...', 'Job-ID eingeben...')}
                  className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={() => handleRecover(false, jobId)}
                  disabled={isRecovering || !jobId}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                >
                  {isRecovering ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  {t('Recover Job', 'Job wiederherstellen')}
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
              <button
                onClick={() => handleRecover(true)}
                disabled={isRecovering}
                className="w-full px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                {isRecovering ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <RefreshCw className="h-5 w-5" />
                )}
                {t('Recover All Jobs', 'Alle Jobs wiederherstellen')}
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
            <div className="flex items-start gap-3">
              <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-red-900 dark:text-red-300 mb-1">
                  {t('Error', 'Fehler')}
                </h3>
                <p className="text-sm text-red-800 dark:text-red-400">{error}</p>
              </div>
            </div>
          </div>
        )}

        {results && (
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
            <div className="mb-4 flex items-center gap-3">
              {results.success ? (
                <CheckCircle className="h-6 w-6 text-green-500" />
              ) : (
                <XCircle className="h-6 w-6 text-red-500" />
              )}
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                {t('Recovery Results', 'Wiederherstellungsergebnisse')}
              </h2>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">{t('Total', 'Gesamt')}</p>
                  <p className="text-3xl font-bold text-slate-900 dark:text-white">{results.total}</p>
                </div>
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <p className="text-sm text-green-700 dark:text-green-400 mb-1">{t('Recovered', 'Wiederhergestellt')}</p>
                  <p className="text-3xl font-bold text-green-700 dark:text-green-400">{results.recovered}</p>
                </div>
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <p className="text-sm text-yellow-700 dark:text-yellow-400 mb-1">{t('Skipped', 'Übersprungen')}</p>
                  <p className="text-3xl font-bold text-yellow-700 dark:text-yellow-400">{results.skipped}</p>
                </div>
                <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <p className="text-sm text-red-700 dark:text-red-400 mb-1">{t('Failed', 'Fehlgeschlagen')}</p>
                  <p className="text-3xl font-bold text-red-700 dark:text-red-400">{results.failed}</p>
                </div>
              </div>

              {results.message && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-blue-800 dark:text-blue-400">{results.message}</p>
                  </div>
                </div>
              )}

              {results.errors && results.errors.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2 text-slate-900 dark:text-white">
                    {t('Errors', 'Fehler')}:
                  </h3>
                  <div className="space-y-1 max-h-60 overflow-y-auto">
                    {results.errors.slice(0, 20).map((error: string, idx: number) => (
                      <div key={idx} className="text-sm text-red-600 dark:text-red-400 p-2 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800">
                        {error}
                      </div>
                    ))}
                    {results.errors.length > 20 && (
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                        {t(`... and ${results.errors.length - 20} more errors`, `... und ${results.errors.length - 20} weitere Fehler`)}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
