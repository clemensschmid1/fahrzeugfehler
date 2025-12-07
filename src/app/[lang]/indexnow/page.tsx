'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

export default function IndexNowPage() {
  const params = useParams();
  const lang = params.lang as string;
  const t = (en: string, de: string) => lang === 'de' ? de : en;

  const [type, setType] = useState<'faults' | 'manuals' | 'all'>('all');
  const [language, setLanguage] = useState<'en' | 'de'>('en');
  const [limit, setLimit] = useState<number>(100);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [results, setResults] = useState<{
    submitted: number;
    failed: number;
    errors: string[];
    total: number;
  } | null>(null);
  const [urls, setUrls] = useState<string[]>([]);
  const [isLoadingUrls, setIsLoadingUrls] = useState(false);
  const [verification, setVerification] = useState<{
    keyFile: { accessible: boolean; matches: boolean };
    api: { testSuccess: boolean; testError: string };
    status: string;
  } | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSubmittingAll, setIsSubmittingAll] = useState(false);
  const [submitAllResults, setSubmitAllResults] = useState<{
    submitted: number;
    failed: number;
    total: number;
    message: string;
  } | null>(null);

  const submitAllToIndexNow = async () => {
    if (!confirm(t(
      'This will submit ALL URLs from the database to IndexNow. This may take a long time. Continue?',
      'Dies wird ALLE URLs aus der Datenbank an IndexNow senden. Dies kann lange dauern. Fortfahren?'
    ))) {
      return;
    }

    setIsSubmittingAll(true);
    setSubmitAllResults(null);

    try {
      const response = await fetch('/api/indexnow/submit-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, language }),
      });

      if (!response.ok) {
        throw new Error('Submission failed');
      }

      const data = await response.json();
      setSubmitAllResults(data);
    } catch (error) {
      console.error('Submit all error:', error);
      alert(t('Submission failed', 'Übermittlung fehlgeschlagen') + ': ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsSubmittingAll(false);
    }
  };

  const loadUrls = async () => {
    setIsLoadingUrls(true);
    try {
      const response = await fetch(`/api/indexnow?type=${type}&language=${language}&limit=${limit}`);
      if (!response.ok) throw new Error('Failed to load URLs');
      const data = await response.json();
      setUrls(data.urls || []);
    } catch (error) {
      console.error('Error loading URLs:', error);
      alert(t('Failed to load URLs', 'URLs konnten nicht geladen werden'));
    } finally {
      setIsLoadingUrls(false);
    }
  };

  const submitToIndexNow = async () => {
    if (urls.length === 0) {
      alert(t('Please load URLs first', 'Bitte laden Sie zuerst URLs'));
      return;
    }

    setIsSubmitting(true);
    setResults(null);

    try {
      const response = await fetch('/api/indexnow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls, type }),
      });

      if (!response.ok) {
        throw new Error('Submission failed');
      }

      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error('Submission error:', error);
      alert(t('Submission failed', 'Übermittlung fehlgeschlagen') + ': ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const verifyIndexNow = async () => {
    setIsVerifying(true);
    try {
      const response = await fetch('/api/indexnow/verify');
      if (!response.ok) throw new Error('Verification failed');
      const data = await response.json();
      setVerification(data);
    } catch (error) {
      console.error('Verification error:', error);
      alert(t('Verification failed', 'Verifizierung fehlgeschlagen'));
    } finally {
      setIsVerifying(false);
    }
  };

  useEffect(() => {
    verifyIndexNow();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-black dark:to-slate-950 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-2">
          IndexNow Submission
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mb-8">
          {t(
            'Submit URLs to Microsoft IndexNow for immediate search engine indexing.',
            'URLs an Microsoft IndexNow übermitteln für sofortige Suchmaschinen-Indizierung.'
          )}
        </p>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 mb-8 shadow-lg">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
            {t('Configuration', 'Konfiguration')}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                {t('Content Type', "Inhaltstyp")}
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as 'faults' | 'manuals' | 'all')}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="all">{t('All', "Alle")}</option>
                <option value="faults">{t('Faults', "Fehler")}</option>
                <option value="manuals">{t('Manuals', "Anleitungen")}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                {t('Language', "Sprache")}
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as 'en' | 'de')}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="en">English</option>
                <option value="de">Deutsch</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                {t('Limit', "Limit")}
              </label>
              <input
                type="number"
                min="1"
                max="10000"
                value={limit}
                onChange={(e) => setLimit(Math.max(1, Math.min(10000, parseInt(e.target.value) || 100)))}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={loadUrls}
              disabled={isLoadingUrls}
              className="px-6 py-3 bg-blue-600 dark:bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 transition-all"
            >
              {isLoadingUrls ? t('Loading...', "Lade...") : t('Load URLs', "URLs laden")}
            </button>
            <button
              onClick={submitToIndexNow}
              disabled={isSubmitting || urls.length === 0}
              className="px-6 py-3 bg-green-600 dark:bg-green-500 text-white rounded-lg font-semibold hover:bg-green-700 dark:hover:bg-green-600 disabled:opacity-50 transition-all"
            >
              {isSubmitting ? t('Submitting...', "Übermittle...") : t('Submit to IndexNow', "An IndexNow übermitteln")}
            </button>
          </div>

          {/* Submit All Section */}
          <div className="mt-8 pt-8 border-t border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
              {t('Submit All URLs', "Alle URLs übermitteln")}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              {t(
                'Submit ALL URLs from the database to IndexNow. Use this if submissions failed during bulk generation. This may take a long time for large volumes.',
                'Übermittle ALLE URLs aus der Datenbank an IndexNow. Verwende dies, wenn Übermittlungen während der Bulk-Generierung fehlgeschlagen sind. Dies kann bei großen Volumen lange dauern.'
              )}
            </p>
            <button
              onClick={submitAllToIndexNow}
              disabled={isSubmittingAll}
              className="px-6 py-3 bg-orange-600 dark:bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-700 dark:hover:bg-orange-600 disabled:opacity-50 transition-all"
            >
              {isSubmittingAll ? t('Submitting All...', "Übermittle alle...") : t('Submit All URLs to IndexNow', "Alle URLs an IndexNow übermitteln")}
            </button>
            {submitAllResults && (
              <div className="mt-4 p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-900/30">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">{submitAllResults.submitted}</div>
                    <div className="text-sm text-green-700 dark:text-green-300">{t('Submitted', "Übermittelt")}</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-600 dark:text-red-400">{submitAllResults.failed}</div>
                    <div className="text-sm text-red-700 dark:text-red-300">{t('Failed', "Fehlgeschlagen")}</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{submitAllResults.total}</div>
                    <div className="text-sm text-blue-700 dark:text-blue-300">{t('Total', "Gesamt")}</div>
                  </div>
                </div>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{submitAllResults.message}</p>
              </div>
            )}
          </div>

          {urls.length > 0 && (
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-900/30">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>{t('Loaded:', "Geladen:")}</strong> {urls.length} {t('URLs', "URLs")}
              </p>
            </div>
          )}
        </div>

        {results && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 shadow-lg">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
              {t('Results', "Ergebnisse")}
            </h2>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">{results.submitted}</div>
                <div className="text-sm text-green-700 dark:text-green-300">{t('Submitted', "Übermittelt")}</div>
              </div>
              <div className="p-4 bg-red-50 dark:bg-red-950/20 rounded-lg">
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">{results.failed}</div>
                <div className="text-sm text-red-700 dark:text-red-300">{t('Failed', "Fehlgeschlagen")}</div>
              </div>
              <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{results.total}</div>
                <div className="text-sm text-blue-700 dark:text-blue-300">{t('Total', "Gesamt")}</div>
              </div>
            </div>
            {results.errors.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  {t('Errors', "Fehler")}:
                </h3>
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {results.errors.map((error, i) => (
                    <div key={i} className="text-xs text-red-600 dark:text-red-400 p-2 bg-red-50 dark:bg-red-950/20 rounded">
                      {error}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="mt-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              {t('Verification', "Verifizierung")}
            </h2>
            <button
              onClick={verifyIndexNow}
              disabled={isVerifying}
              className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 transition-all"
            >
              {isVerifying ? t('Verifying...', "Verifiziere...") : t('Verify', "Verifizieren")}
            </button>
          </div>

          {verification ? (
            <div className="space-y-4">
              <div className={`p-4 rounded-lg border-2 ${
                verification.status === 'working'
                  ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900/30'
                  : 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/30'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  {verification.status === 'working' ? (
                    <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                  <span className={`font-bold ${
                    verification.status === 'working'
                      ? 'text-green-700 dark:text-green-300'
                      : 'text-red-700 dark:text-red-300'
                  }`}>
                    {verification.status === 'working' ? t('IndexNow is Working!', "IndexNow funktioniert!") : t('IndexNow Needs Configuration', "IndexNow benötigt Konfiguration")}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-2">{t('Key File', "Schlüsseldatei")}</h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2">
                      {verification.keyFile.accessible ? (
                        <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                      <span className={verification.keyFile.accessible ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}>
                        {verification.keyFile.accessible ? t('Accessible', "Zugänglich") : t('Not Accessible', "Nicht zugänglich")}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {verification.keyFile.matches ? (
                        <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                      <span className={verification.keyFile.matches ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}>
                        {verification.keyFile.matches ? t('Content Matches', "Inhalt stimmt überein") : t('Content Mismatch', "Inhalt stimmt nicht überein")}
                      </span>
                    </div>
                    <a
                      href="https://faultbase.com/19b8bc246b244733843ff32b3d426207.txt"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:underline text-xs break-all"
                    >
                      https://faultbase.com/19b8bc246b244733843ff32b3d426207.txt
                    </a>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-2">{t('API Test', "API-Test")}</h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2">
                      {verification.api.testSuccess ? (
                        <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                      <span className={verification.api.testSuccess ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}>
                        {verification.api.testSuccess ? t('API Working', "API funktioniert") : t('API Error', "API-Fehler")}
                      </span>
                    </div>
                    {verification.api.testError && (
                      <div className="text-xs text-red-600 dark:text-red-400">
                        {verification.api.testError}
                      </div>
                    )}
                    <div className="text-xs text-slate-500 dark:text-slate-500">
                      https://api.indexnow.org/indexnow
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
              {t('Click "Verify" to check IndexNow configuration', "Klicken Sie auf \"Verifizieren\", um die IndexNow-Konfiguration zu überprüfen")}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

