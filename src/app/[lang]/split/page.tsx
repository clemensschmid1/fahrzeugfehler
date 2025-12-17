'use client';

import { useState } from 'react';
import InternalAuth from '@/components/InternalAuth';
import FileUpload from '@/components/FileUpload';
import { useParams } from 'next/navigation';

export default function SplitPage() {
  const params = useParams();
  const lang = params.lang as string;

  // Translation helper function
  const t = (en: string, de: string) => lang === 'de' ? de : en;

  // State management
  const [file, setFile] = useState<File | null>(null);
  const [numParts, setNumParts] = useState<number>(2);
  const [status, setStatus] = useState<'idle' | 'splitting' | 'complete' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [parts, setParts] = useState<Array<{
    filename: string;
    fileUrl: string;
    sizeMB: number;
    lineCount: number;
  }>>([]);
  const [originalSize, setOriginalSize] = useState<number | null>(null);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);

  const handleSplit = async () => {
    // Validation
    if (!file) {
      setError(t('Please upload a JSONL file to split', 'Bitte laden Sie eine JSONL-Datei zum Aufteilen hoch'));
      return;
    }

    if (numParts < 2 || numParts > 20) {
      setError(t('Number of parts must be between 2 and 20', 'Die Anzahl der Teile muss zwischen 2 und 20 liegen'));
      return;
    }

    // Reset state
    setStatus('splitting');
    setError(null);
    setParts([]);
    setOriginalSize(null);
    setProgress({ current: 0, total: 100 });

    try {
      // Show initial progress
      setProgress({ current: 10, total: 100 });

      // Prepare form data
      const formData = new FormData();
      formData.append('file', file);
      formData.append('numParts', numParts.toString());

      // Update progress
      setProgress({ current: 30, total: 100 });

      // Call API
      const response = await fetch('/api/mass-generation/split-jsonl', {
        method: 'POST',
        body: formData,
      });

      setProgress({ current: 70, total: 100 });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || t('Failed to split JSONL file', 'Fehler beim Aufteilen der JSONL-Datei'));
      }

      const data = await response.json();

      // Validate response
      if (!data.success) {
        throw new Error(data.error || t('Split operation failed', 'Aufteilen fehlgeschlagen'));
      }

      if (!data.parts || data.parts.length === 0) {
        throw new Error(t('No parts were created', 'Es wurden keine Teile erstellt'));
      }

      // Set results
      setParts(data.parts);
      setOriginalSize(data.originalSizeMB || null);
      setProgress({ current: 100, total: 100 });
      setStatus('complete');

      console.log(`[Split] Successfully split file into ${data.parts.length} parts`);
    } catch (error) {
      console.error('[Split] Split error:', error);
      setError(error instanceof Error ? error.message : t('Unknown error', 'Unbekannter Fehler'));
      setStatus('error');
      setProgress(null);
    }
  };

  return (
    <InternalAuth>
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {t('Split Large JSONL File', 'Große JSONL-Datei aufteilen')}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {t('Split large JSONL files into smaller parts for OpenAI Batch API. Files are split evenly by line count to maintain alignment.', 'Teilen Sie große JSONL-Dateien in kleinere Teile für OpenAI Batch API auf. Dateien werden gleichmäßig nach Zeilenanzahl aufgeteilt, um die Ausrichtung zu gewährleisten.')}
            </p>
          </div>

          {/* Main Card */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 mb-6">
            {/* File Upload */}
            <div className="mb-6">
              <FileUpload
                label={t('JSONL File to Split', 'JSONL-Datei zum Aufteilen')}
                accept=".jsonl"
                file={file}
                onFileChange={(newFile) => {
                  setFile(newFile);
                  // Reset results when new file is selected
                  if (newFile) {
                    setParts([]);
                    setOriginalSize(null);
                    setError(null);
                    setStatus('idle');
                  }
                }}
                required={true}
                t={t}
              />
              {file && (
                <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  {t('File selected', 'Datei ausgewählt')}: <span className="font-medium">{file.name}</span> ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                </div>
              )}
            </div>

            {/* Number of Parts Selection */}
            <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">
                {t('Number of Parts', 'Anzahl der Teile')}
              </label>
              
              {/* Quick Select Buttons */}
              <div className="flex items-center gap-3 mb-3">
                <div className="flex gap-2 flex-wrap">
                  {[2, 3, 4, 5, 6, 8, 10].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setNumParts(num)}
                      className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
                        numParts === num
                          ? 'bg-blue-600 text-white shadow-md scale-105'
                          : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-slate-300 dark:border-slate-600'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
                
                {/* Custom Input */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-600 dark:text-slate-400">{t('Custom', 'Benutzerdefiniert')}:</span>
                  <input
                    type="number"
                    min="2"
                    max="20"
                    value={numParts}
                    onChange={(e) => {
                      const value = parseInt(e.target.value, 10);
                      if (!isNaN(value) && value >= 2 && value <= 20) {
                        setNumParts(value);
                      }
                    }}
                    className="w-20 px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t('Select how many parts to split the file into (2-20). Each part will have approximately the same number of lines.', 'Wählen Sie, in wie viele Teile die Datei aufgeteilt werden soll (2-20). Jeder Teil hat ungefähr die gleiche Anzahl von Zeilen.')}
              </p>
            </div>

            {/* Action Button */}
            <div className="mb-4">
              <button
                onClick={handleSplit}
                disabled={status === 'splitting' || !file}
                className={`w-full px-6 py-3 rounded-lg font-semibold text-white transition-all ${
                  status === 'splitting' || !file
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg'
                }`}
              >
                {status === 'splitting' ? t('Splitting...', 'Wird aufgeteilt...') : t('Split File', 'Datei aufteilen')}
              </button>
            </div>

            {/* Progress Bar */}
            {progress && (
              <div className="mb-4">
                <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400 mb-1">
                  <span>{t('Progress', 'Fortschritt')}</span>
                  <span>{progress.current}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2.5">
                  <div
                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${(progress.current / progress.total) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}
          </div>

          {/* Results: Split Parts */}
          {parts.length > 0 && (
            <div className="mt-4 p-5 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-300 dark:border-green-700 rounded-xl shadow-lg">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-green-900 dark:text-green-100 mb-1">
                    {parts.length === 1 
                      ? t('✅ File Ready', '✅ Datei bereit')
                      : t('✅ File Successfully Split', '✅ Datei erfolgreich aufgeteilt')}
                  </h3>
                  {originalSize && (
                    <p className="text-sm text-green-700 dark:text-green-300">
                      {t('Original', 'Original')}: <span className="font-semibold">{originalSize.toFixed(2)} MB</span> → {t('Split into', 'Aufgeteilt in')} <span className="font-semibold">{parts.length}</span> {t('parts', 'Teile')}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {parts.length}
                  </div>
                  <div className="text-xs text-green-600 dark:text-green-400">
                    {t('parts', 'Teile')}
                  </div>
                </div>
              </div>

              {/* Parts List */}
              <div className="space-y-3 mb-4">
                {parts.map((part, index) => (
                  <div 
                    key={index} 
                    className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-lg border-2 border-green-200 dark:border-green-700 shadow-md hover:shadow-lg transition-shadow"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="flex-shrink-0 w-8 h-8 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full flex items-center justify-center text-sm font-bold">
                          {index + 1}
                        </span>
                        <div className="font-semibold text-slate-900 dark:text-white text-sm truncate">
                          {part.filename}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-slate-400 ml-10">
                        <span className="flex items-center gap-1">
                          <span className="font-medium">{part.sizeMB.toFixed(2)}</span> MB
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="font-medium">{part.lineCount.toLocaleString()}</span> {t('lines', 'Zeilen')}
                        </span>
                      </div>
                    </div>
                    <a
                      href={part.fileUrl}
                      download
                      className="ml-4 flex-shrink-0 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm hover:shadow-md"
                    >
                      {t('Download', 'Herunterladen')}
                    </a>
                  </div>
                ))}
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-3 p-3 bg-white/50 dark:bg-slate-800/50 rounded-lg border border-green-200 dark:border-green-700 mb-4">
                <div className="text-center">
                  <div className="text-lg font-bold text-green-700 dark:text-green-300">
                    {parts.reduce((sum, part) => sum + part.lineCount, 0).toLocaleString()}
                  </div>
                  <div className="text-xs text-green-600 dark:text-green-400">
                    {t('Total Lines', 'Gesamt Zeilen')}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-green-700 dark:text-green-300">
                    {parts.reduce((sum, part) => sum + part.sizeMB, 0).toFixed(2)}
                  </div>
                  <div className="text-xs text-green-600 dark:text-green-400">
                    {t('Total Size (MB)', 'Gesamt Größe (MB)')}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-green-700 dark:text-green-300">
                    {(parts.reduce((sum, part) => sum + part.sizeMB, 0) / parts.length).toFixed(2)}
                  </div>
                  <div className="text-xs text-green-600 dark:text-green-400">
                    {t('Avg Size (MB)', 'Ø Größe (MB)')}
                  </div>
                </div>
              </div>

              {/* Important Note */}
              {parts.length > 1 && (
                <div className="p-3 bg-amber-50 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-700 rounded-lg">
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    <strong>⚠️ {t('Important', 'Wichtig')}:</strong> {t('You need to submit each part separately in Step 2. Use the same number of parts when splitting related files (Questions, Answers, Metadata) to maintain alignment.', 'Sie müssen jeden Teil separat in Schritt 2 einreichen. Verwenden Sie die gleiche Anzahl von Teilen beim Aufteilen verwandter Dateien (Questions, Answers, Metadata), um die Ausrichtung zu gewährleisten.')}
                  </p>
                </div>
              )}

              {/* Success Tip */}
              <div className="mt-4 pt-4 border-t border-green-300 dark:border-green-700">
                <p className="text-sm text-green-700 dark:text-green-300">
                  <strong>💡 {t('Tip', 'Tipp')}:</strong> {t('These files are ready to use in Step 2. Each part can be uploaded separately to OpenAI Batch API.', 'Diese Dateien sind bereit für Schritt 2. Jeder Teil kann separat zur OpenAI Batch API hochgeladen werden.')}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </InternalAuth>
  );
}


