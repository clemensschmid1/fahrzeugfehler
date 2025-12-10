'use client';

import { useState } from 'react';
import InternalAuth from '@/components/InternalAuth';
import { useParams } from 'next/navigation';

type ProcessingStatus = {
  status: 'idle' | 'processing' | 'complete' | 'error' | 'cancelled';
  totalProcessed: number;
  totalSuccessful: number;
  totalFailed: number;
  indexNowSuccessful: number;
  indexNowFailed: number;
  currentBatch: number;
  error?: string;
};

export default function RegenerationPage() {
  return (
    <InternalAuth>
      <RegenerationContent />
    </InternalAuth>
  );
}

function RegenerationContent() {
  const params = useParams();
  const lang = params.lang as string;
  const t = (en: string, de: string) => lang === 'de' ? de : en;

  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus>({
    status: 'idle',
    totalProcessed: 0,
    totalSuccessful: 0,
    totalFailed: 0,
    indexNowSuccessful: 0,
    indexNowFailed: 0,
    currentBatch: 0,
  });

  const [batchSize, setBatchSize] = useState<number>(500);
  const [concurrency, setConcurrency] = useState<number>(50);
  const [skipIndexNow, setSkipIndexNow] = useState<boolean>(false);
  const [isCancelled, setIsCancelled] = useState<boolean>(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [startOffset, setStartOffset] = useState<number>(0);

  const startProcessing = async () => {
    // If status is complete, use totalProcessed as start offset, otherwise use the input field
    const initialOffset = processingStatus.status === 'complete' 
      ? processingStatus.totalProcessed 
      : startOffset;

    if (!confirm(t(
      `This will generate embeddings and submit to IndexNow for all faults that don't have embeddings yet. Starting from offset ${initialOffset.toLocaleString()}. Continue?`,
      `Dies wird Embeddings generieren und an IndexNow senden für alle Faults, die noch keine Embeddings haben. Startet bei Offset ${initialOffset.toLocaleString()}. Fortfahren?`
    ))) {
      return;
    }

    const controller = new AbortController();
    setAbortController(controller);
    setIsCancelled(false);
    
    // If continuing from previous run, keep the totals; otherwise reset
    const shouldReset = processingStatus.status !== 'complete';
    setProcessingStatus({
      status: 'processing',
      totalProcessed: shouldReset ? 0 : processingStatus.totalProcessed,
      totalSuccessful: shouldReset ? 0 : processingStatus.totalSuccessful,
      totalFailed: shouldReset ? 0 : processingStatus.totalFailed,
      indexNowSuccessful: shouldReset ? 0 : processingStatus.indexNowSuccessful,
      indexNowFailed: shouldReset ? 0 : processingStatus.indexNowFailed,
      currentBatch: shouldReset ? 0 : Math.floor(initialOffset / batchSize),
    });

    let offset = initialOffset;
    let hasMore = true;

    try {
      while (hasMore && !isCancelled && !controller.signal.aborted) {
        setProcessingStatus(prev => ({
          ...prev,
          currentBatch: Math.floor(offset / batchSize) + 1,
        }));

        const response = await fetch('/api/regeneration/embed-and-index', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            batchSize,
            offset,
            skipIndexNow,
            concurrency,
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          if (controller.signal.aborted) {
            break;
          }
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          throw new Error(errorData.error || 'Failed to process batch');
        }

        const data = await response.json();

        if (data.message === 'No more faults to process') {
          hasMore = false;
          break;
        }

        setProcessingStatus(prev => ({
          ...prev,
          totalProcessed: prev.totalProcessed + data.processed,
          totalSuccessful: prev.totalSuccessful + data.successful,
          totalFailed: prev.totalFailed + data.failed,
          indexNowSuccessful: prev.indexNowSuccessful + data.indexNowSuccessful,
          indexNowFailed: prev.indexNowFailed + data.indexNowFailed,
        }));

        offset = data.nextOffset;
        hasMore = data.hasMore;

        // No delay between batches for maximum speed
        if (controller.signal.aborted || isCancelled) {
          break;
        }
      }

      if (isCancelled || controller.signal.aborted) {
        setProcessingStatus(prev => ({
          ...prev,
          status: 'cancelled',
        }));
      } else {
        setProcessingStatus(prev => ({
          ...prev,
          status: 'complete',
        }));
      }
    } catch (error: any) {
      if (error.name === 'AbortError' || controller.signal.aborted) {
        setProcessingStatus(prev => ({
          ...prev,
          status: 'cancelled',
        }));
      } else {
        console.error('Processing error:', error);
        setProcessingStatus(prev => ({
          ...prev,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
        }));
      }
    } finally {
      setAbortController(null);
    }
  };

  const cancelProcessing = () => {
    setIsCancelled(true);
    if (abortController) {
      abortController.abort();
    }
  };

  const resetStatus = () => {
    if (abortController) {
      abortController.abort();
    }
    setProcessingStatus({
      status: 'idle',
      totalProcessed: 0,
      totalSuccessful: 0,
      totalFailed: 0,
      indexNowSuccessful: 0,
      indexNowFailed: 0,
      currentBatch: 0,
    });
    setIsCancelled(false);
    setAbortController(null);
    setStartOffset(0);
  };

  const isProcessing = processingStatus.status === 'processing';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-black dark:to-slate-950 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-2">
          {t('Regeneration: Embed & Index', 'Regenerierung: Embed & Index')}
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mb-8">
          {t(
            'Generate embeddings for all faults that don\'t have embeddings yet and submit them to IndexNow.',
            'Generiere Embeddings für alle Faults, die noch keine Embeddings haben, und sende sie an IndexNow.'
          )}
        </p>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 mb-8 shadow-lg">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
            {t('Configuration', 'Konfiguration')}
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                {t('Batch Size', 'Batch-Größe')}
              </label>
              <input
                type="number"
                min="1"
                max="1000"
                value={batchSize}
                onChange={(e) => setBatchSize(parseInt(e.target.value) || 200)}
                disabled={isProcessing}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {t('Number of faults to process per batch (recommended: 500-1000)', 'Anzahl der Faults pro Batch (empfohlen: 500-1000)')}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                {t('Concurrency', 'Parallelität')}
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={concurrency}
                onChange={(e) => setConcurrency(parseInt(e.target.value) || 20)}
                disabled={isProcessing}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {t('Number of faults to process in parallel (recommended: 50-100)', 'Anzahl der parallel zu verarbeitenden Faults (empfohlen: 50-100)')}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                {t('Start Offset', 'Start-Offset')}
              </label>
              <input
                type="number"
                min="0"
                value={startOffset}
                onChange={(e) => setStartOffset(parseInt(e.target.value) || 0)}
                disabled={isProcessing}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {t('Number of faults to skip before starting (0 = start from beginning). If status is "Complete", it will automatically continue from the last processed count.', 'Anzahl der Faults, die übersprungen werden sollen (0 = von Anfang an). Wenn Status "Abgeschlossen" ist, wird automatisch von der letzten verarbeiteten Anzahl fortgesetzt.')}
              </p>
              {processingStatus.status === 'complete' && processingStatus.totalProcessed > 0 && (
                <p className="mt-1 text-sm text-blue-600 dark:text-blue-400 font-medium">
                  {t(`Note: Will automatically start from ${processingStatus.totalProcessed.toLocaleString()} (last processed count)`, `Hinweis: Wird automatisch bei ${processingStatus.totalProcessed.toLocaleString()} (letzte verarbeitete Anzahl) starten`)}
                </p>
              )}
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="skipIndexNow"
                checked={skipIndexNow}
                onChange={(e) => setSkipIndexNow(e.target.checked)}
                disabled={isProcessing}
                className="w-4 h-4 text-red-600 bg-slate-100 border-slate-300 rounded focus:ring-red-500 focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <label htmlFor="skipIndexNow" className="ml-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                {t('Skip IndexNow submission (only generate embeddings)', 'IndexNow-Übermittlung überspringen (nur Embeddings generieren)')}
              </label>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 mb-8 shadow-lg">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
            {t('Status', 'Status')}
          </h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {t('Status', 'Status')}:
              </span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                processingStatus.status === 'idle' ? 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300' :
                processingStatus.status === 'processing' ? 'bg-blue-200 dark:bg-blue-900 text-blue-800 dark:text-blue-200' :
                processingStatus.status === 'complete' ? 'bg-green-200 dark:bg-green-900 text-green-800 dark:text-green-200' :
                processingStatus.status === 'error' ? 'bg-red-200 dark:bg-red-900 text-red-800 dark:text-red-200' :
                'bg-yellow-200 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
              }`}>
                {processingStatus.status === 'idle' ? t('Idle', 'Bereit') :
                 processingStatus.status === 'processing' ? t('Processing...', 'Verarbeitung...') :
                 processingStatus.status === 'complete' ? t('Complete', 'Abgeschlossen') :
                 processingStatus.status === 'error' ? t('Error', 'Fehler') :
                 t('Cancelled', 'Abgebrochen')}
              </span>
            </div>

            {processingStatus.status === 'processing' && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {t('Current Batch', 'Aktueller Batch')}:
                </span>
                <span className="text-sm text-slate-900 dark:text-white">
                  {processingStatus.currentBatch}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {t('Total Processed', 'Gesamt verarbeitet')}:
              </span>
              <span className="text-sm text-slate-900 dark:text-white">
                {processingStatus.totalProcessed.toLocaleString()}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {t('Successful Embeddings', 'Erfolgreiche Embeddings')}:
              </span>
              <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                {processingStatus.totalSuccessful.toLocaleString()}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {t('Failed Embeddings', 'Fehlgeschlagene Embeddings')}:
              </span>
              <span className="text-sm text-red-600 dark:text-red-400 font-medium">
                {processingStatus.totalFailed.toLocaleString()}
              </span>
            </div>

            {!skipIndexNow && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {t('IndexNow Successful', 'IndexNow erfolgreich')}:
                  </span>
                  <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                    {processingStatus.indexNowSuccessful.toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {t('IndexNow Failed', 'IndexNow fehlgeschlagen')}:
                  </span>
                  <span className="text-sm text-red-600 dark:text-red-400 font-medium">
                    {processingStatus.indexNowFailed.toLocaleString()}
                  </span>
                </div>
              </>
            )}

            {processingStatus.error && (
              <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-800 dark:text-red-200 font-medium mb-2">
                  {t('Error', 'Fehler')}: {processingStatus.error}
                </p>
                <p className="text-xs text-red-600 dark:text-red-300">
                  {t('Check the browser console for detailed error messages', 'Prüfe die Browser-Konsole für detaillierte Fehlermeldungen')}
                </p>
              </div>
            )}

            {processingStatus.totalFailed > 0 && (
              <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-sm text-yellow-800 dark:text-yellow-200 font-medium mb-2">
                  {t('Warning: Many failures detected', 'Warnung: Viele Fehler erkannt')}
                </p>
                <p className="text-xs text-yellow-600 dark:text-yellow-300">
                  {t('Failure rate', 'Fehlerquote')}: {((processingStatus.totalFailed / Math.max(processingStatus.totalProcessed, 1)) * 100).toFixed(1)}%
                </p>
                <p className="text-xs text-yellow-600 dark:text-yellow-300 mt-1">
                  {t('Common causes: Embeddings already exist, OpenAI rate limits, or database constraints. Check server logs for details.', 'Häufige Ursachen: Embeddings existieren bereits, OpenAI Rate Limits oder Datenbank-Constraints. Prüfe Server-Logs für Details.')}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-4">
          {processingStatus.status === 'idle' && (
            <button
              onClick={startProcessing}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors shadow-lg hover:shadow-xl"
            >
              {t('Start Processing', 'Verarbeitung starten')}
            </button>
          )}

          {isProcessing && (
            <button
              onClick={cancelProcessing}
              className="px-6 py-3 bg-yellow-600 hover:bg-yellow-700 text-white font-medium rounded-lg transition-colors shadow-lg hover:shadow-xl"
            >
              {t('Cancel', 'Abbrechen')}
            </button>
          )}

          {(processingStatus.status === 'complete' || processingStatus.status === 'error' || processingStatus.status === 'cancelled') && (
            <>
              <button
                onClick={startProcessing}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors shadow-lg hover:shadow-xl"
              >
                {processingStatus.status === 'complete' 
                  ? t('Continue Processing', 'Verarbeitung fortsetzen')
                  : t('Retry', 'Wiederholen')}
              </button>
              <button
                onClick={resetStatus}
                className="px-6 py-3 bg-slate-600 hover:bg-slate-700 text-white font-medium rounded-lg transition-colors shadow-lg hover:shadow-xl"
              >
                {t('Reset', 'Zurücksetzen')}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

