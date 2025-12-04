'use client';

import { useState, useEffect } from 'react';
import InternalAuth from '@/components/InternalAuth';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { useParams } from 'next/navigation';

type CarBrand = {
  id: string;
  name: string;
  slug: string;
};

type CarModel = {
  id: string;
  name: string;
  slug: string;
  brand_id: string;
};

type ModelGeneration = {
  id: string;
  name: string;
  slug: string;
  car_model_id: string;
  generation_code?: string;
  year_start?: number;
  year_end?: number;
};

export default function CarBulkPage() {
  return (
    <InternalAuth>
      <CarBulkContent />
    </InternalAuth>
  );
}

function CarBulkContent() {
  const params = useParams();
  const lang = params.lang as string;
  const t = (en: string, de: string) => lang === 'de' ? de : en;

  const [brands, setBrands] = useState<CarBrand[]>([]);
  const [models, setModels] = useState<CarModel[]>([]);
  const [generations, setGenerations] = useState<ModelGeneration[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [selectedGeneration, setSelectedGeneration] = useState<string>('');
  const [contentType, setContentType] = useState<'fault' | 'manual'>('fault');
  const [count, setCount] = useState<number>(100);
  const [language, setLanguage] = useState<'en' | 'de'>('en');
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number; stage: string } | null>(null);
  const [results, setResults] = useState<{ success: number; failed: number; errors: string[] } | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [estimatedTime, setEstimatedTime] = useState<number | null>(null);
  const [recentGenerations, setRecentGenerations] = useState<Array<{
    id: string;
    brand: string;
    model: string;
    generation: string;
    contentType: string;
    count: number;
    success: number;
    failed: number;
    createdAt: string;
  }>>([]);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    loadBrands();
  }, []);

  useEffect(() => {
    if (selectedBrand) {
      loadModels(selectedBrand);
    } else {
      setModels([]);
      setGenerations([]);
    }
  }, [selectedBrand]);

  useEffect(() => {
    if (selectedModel) {
      loadGenerations(selectedModel);
    } else {
      setGenerations([]);
    }
  }, [selectedModel]);

  const loadBrands = async () => {
    const { data } = await supabase
      .from('car_brands')
      .select('id, name, slug')
      .order('name');
    if (data) setBrands(data);
  };

  const loadModels = async (brandId: string) => {
    const { data } = await supabase
      .from('car_models')
      .select('id, name, slug, brand_id')
      .eq('brand_id', brandId)
      .order('name');
    if (data) setModels(data);
  };

  const loadGenerations = async (modelId: string) => {
    const { data } = await supabase
      .from('model_generations')
      .select('id, name, slug, car_model_id, generation_code, year_start, year_end')
      .eq('car_model_id', modelId)
      .order('year_start', { ascending: false });
    if (data) setGenerations(data);
  };

  const handleGenerate = async () => {
    if (!selectedBrand || !selectedModel || !selectedGeneration) {
      alert(t('Please select brand, model, and generation', 'Bitte wählen Sie Marke, Modell und Generation'));
      return;
    }

    setIsGenerating(true);
    setStartTime(Date.now());
    setProgress({ current: 0, total: count, stage: t('Initializing...', 'Initialisiere...') });
    setResults(null);
    // Estimate time: ~2-3 seconds per item
    setEstimatedTime(count * 2.5 * 1000);

    try {
      const response = await fetch('/api/cars/bulk-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandId: selectedBrand,
          modelId: selectedModel,
          generationId: selectedGeneration,
          contentType,
          count,
          language,
        }),
      });

      if (!response.ok) {
        throw new Error('Generation failed');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response stream');
      }

      let buffer = '';
      let successCount = 0;
      let failedCount = 0;
      const errors: string[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.progress) {
                setProgress(data.progress);
              }
              if (data.result) {
                if (data.result.success) successCount++;
                else {
                  failedCount++;
                  if (data.result.error) errors.push(data.result.error);
                }
              }
              if (data.complete) {
                const endTime = Date.now();
                const duration = startTime ? ((endTime - startTime) / 1000).toFixed(1) : '0';
                setResults({ success: successCount, failed: failedCount, errors });
                setIsGenerating(false);
                setStartTime(null);
                setEstimatedTime(null);
                
                // Save to recent generations
                if (selectedBrandData && selectedModelData && selectedGenerationData) {
                  const newGen = {
                    id: Date.now().toString(),
                    brand: selectedBrandData.name,
                    model: selectedModelData.name,
                    generation: selectedGenerationData.name,
                    contentType,
                    count,
                    success: successCount,
                    failed: failedCount,
                    createdAt: new Date().toISOString(),
                  };
                  setRecentGenerations(prev => [newGen, ...prev.slice(0, 9)]);
                }
                return;
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (error) {
      console.error('Generation error:', error);
      alert('Generation failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
      setIsGenerating(false);
    }
  };

  const selectedBrandData = brands.find(b => b.id === selectedBrand);
  const selectedModelData = models.find(m => m.id === selectedModel);
  const selectedGenerationData = generations.find(g => g.id === selectedGeneration);

  // Calculate estimated cost (rough estimate: $0.01 per item for content + $0.005 for metadata)
  const estimatedCost = count * 0.015;
  const elapsedTime = startTime ? ((Date.now() - startTime) / 1000) : 0;
  const remainingTime = estimatedTime && startTime ? Math.max(0, (estimatedTime - (Date.now() - startTime)) / 1000) : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-black dark:to-slate-950 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-4xl font-black text-slate-900 dark:text-white">
              {t('Car Bulk Content Generator', 'Auto-Bulk-Inhaltsgenerator')}
            </h1>
            <Link
              href={`/${lang}/carinternal`}
              className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-700 transition-all text-sm font-medium"
            >
              ← {t('Back to Car Internal', 'Zurück zu Car Internal')}
            </Link>
          </div>
          <p className="text-slate-600 dark:text-slate-400">
            {t(
              'Generate 100-1000 car faults or manuals at once using AI. Cost-efficient batch processing with real-time progress tracking.',
              'Generieren Sie 100-1000 Auto-Fehler oder Anleitungen auf einmal mit KI. Kosteneffiziente Batch-Verarbeitung mit Echtzeit-Fortschrittsanzeige.'
            )}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
            <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">{t('Estimated Cost', 'Geschätzte Kosten')}</div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">${estimatedCost.toFixed(2)}</div>
            <div className="text-xs text-slate-500 dark:text-slate-500 mt-1">{t('Approximate', 'Ungefähr')}</div>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
            <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">{t('Estimated Time', 'Geschätzte Zeit')}</div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {estimatedTime ? `${Math.ceil(estimatedTime / 1000 / 60)}m` : '--'}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-500 mt-1">{t('For full batch', 'Für vollständigen Batch')}</div>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
            <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">{t('Items to Generate', 'Zu generierende Artikel')}</div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{count}</div>
            <div className="text-xs text-slate-500 dark:text-slate-500 mt-1">{contentType === 'fault' ? t('Faults', 'Fehler') : t('Manuals', 'Anleitungen')}</div>
          </div>
        </div>

        {/* Main Form */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 mb-8 shadow-lg">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">{t('Generation Settings', 'Generierungseinstellungen')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                {t('Content Type', 'Inhaltstyp')}
              </label>
              <select
                value={contentType}
                onChange={(e) => setContentType(e.target.value as 'fault' | 'manual')}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
              >
                <option value="fault">{t('Faults/Problems', 'Fehler/Probleme')}</option>
                <option value="manual">{t('Manuals/Guides', 'Anleitungen/Handbücher')}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                {t('Language', 'Sprache')}
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as 'en' | 'de')}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
              >
                <option value="en">English</option>
                <option value="de">Deutsch</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                {t('Brand', 'Marke')}
              </label>
              <select
                value={selectedBrand}
                onChange={(e) => {
                  setSelectedBrand(e.target.value);
                  setSelectedModel('');
                  setSelectedGeneration('');
                }}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
              >
                <option value="">{t('Select Brand', 'Marke auswählen')}</option>
                {brands.map(brand => (
                  <option key={brand.id} value={brand.id}>{brand.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                {t('Model', 'Modell')}
              </label>
              <select
                value={selectedModel}
                onChange={(e) => {
                  setSelectedModel(e.target.value);
                  setSelectedGeneration('');
                }}
                disabled={!selectedBrand}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white disabled:opacity-50 focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
              >
                <option value="">{t('Select Model', 'Modell auswählen')}</option>
                {models.map(model => (
                  <option key={model.id} value={model.id}>{model.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                {t('Generation', 'Generation')}
              </label>
              <select
                value={selectedGeneration}
                onChange={(e) => setSelectedGeneration(e.target.value)}
                disabled={!selectedModel}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white disabled:opacity-50 focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
              >
                <option value="">{t('Select Generation', 'Generation auswählen')}</option>
                {generations.map(gen => (
                  <option key={gen.id} value={gen.id}>
                    {gen.name} {gen.year_start && gen.year_end ? `(${gen.year_start}-${gen.year_end})` : gen.year_start ? `(${gen.year_start}+)` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                {t('Count', 'Anzahl')} (100-1000)
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="100"
                  max="1000"
                  step="50"
                  value={count}
                  onChange={(e) => setCount(parseInt(e.target.value))}
                  className="flex-1"
                />
                <input
                  type="number"
                  min="100"
                  max="1000"
                  value={count}
                  onChange={(e) => setCount(Math.max(100, Math.min(1000, parseInt(e.target.value) || 100)))}
                  className="w-24 px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-center focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                />
              </div>
            </div>
          </div>

          {selectedBrandData && selectedModelData && selectedGenerationData && (
            <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-lg border border-blue-200 dark:border-blue-900/30">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>{t('Target:', 'Ziel:')}</strong> {selectedBrandData.name} {selectedModelData.name} {selectedGenerationData.name}
                  {selectedGenerationData.generation_code && ` (${selectedGenerationData.generation_code})`}
                </p>
              </div>
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={isGenerating || !selectedBrand || !selectedModel || !selectedGeneration}
            className="w-full px-6 py-4 bg-gradient-to-r from-red-600 to-red-700 dark:from-red-500 dark:to-red-600 text-white rounded-lg font-bold hover:from-red-700 hover:to-red-800 dark:hover:from-red-600 dark:hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:transform-none"
          >
            {isGenerating ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {t('Generating...', 'Generiere...')}
              </span>
            ) : (
              `${t('Generate', 'Generieren')} ${count} ${contentType === 'fault' ? t('Faults', 'Fehler') : t('Manuals', 'Anleitungen')}`
            )}
          </button>
        </div>

        {progress && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 mb-8 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">{t('Progress', 'Fortschritt')}</h2>
              {startTime && (
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  {t('Elapsed:', 'Verstrichen:')} {Math.floor(elapsedTime / 60)}m {Math.floor(elapsedTime % 60)}s
                  {remainingTime !== null && remainingTime > 0 && (
                    <span className="ml-2">
                      • {t('Remaining:', "Verbleibend:")} {Math.floor(remainingTime / 60)}m {Math.floor(remainingTime % 60)}s
                    </span>
                  )}
                </div>
              )}
            </div>
            <div className="mb-4">
              <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400 mb-2">
                <span className="font-medium">{progress.stage}</span>
                <span className="font-bold">{progress.current} / {progress.total} ({Math.round((progress.current / progress.total) * 100)}%)</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-4 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-red-600 to-red-500 dark:from-red-500 dark:to-red-400 h-4 rounded-full transition-all duration-300 flex items-center justify-end pr-2"
                  style={{ width: `${(progress.current / progress.total) * 100}%` }}
                >
                  {progress.current > 0 && (
                    <span className="text-xs font-bold text-white">{Math.round((progress.current / progress.total) * 100)}%</span>
                  )}
                </div>
              </div>
            </div>
            {startTime && (
              <div className="grid grid-cols-3 gap-4 text-center text-sm">
                <div>
                  <div className="text-slate-600 dark:text-slate-400">{t('Items/sec', 'Artikel/Sek')}</div>
                  <div className="font-bold text-slate-900 dark:text-white">
                    {elapsedTime > 0 ? (progress.current / elapsedTime).toFixed(2) : '0.00'}
                  </div>
                </div>
                <div>
                  <div className="text-slate-600 dark:text-slate-400">{t('Estimated Total', "Geschätzt Gesamt")}</div>
                  <div className="font-bold text-slate-900 dark:text-white">
                    {estimatedTime ? `${Math.ceil(estimatedTime / 1000 / 60)}m` : '--'}
                  </div>
                </div>
                <div>
                  <div className="text-slate-600 dark:text-slate-400">{t('Success Rate', "Erfolgsrate")}</div>
                  <div className="font-bold text-green-600 dark:text-green-400">
                    {progress.current > 0 ? `${Math.round((progress.current / (progress.current + (results?.failed || 0))) * 100)}%` : '--'}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {results && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 mb-8 shadow-lg">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">{t('Results', "Ergebnisse")}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-xl border-2 border-green-200 dark:border-green-900/30">
                <div className="flex items-center gap-3 mb-2">
                  <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <div className="text-3xl font-bold text-green-600 dark:text-green-400">{results.success}</div>
                    <div className="text-sm text-green-700 dark:text-green-300 font-medium">{t('Successful', "Erfolgreich")}</div>
                  </div>
                </div>
                <div className="text-xs text-green-600 dark:text-green-400 mt-2">
                  {((results.success / (results.success + results.failed)) * 100).toFixed(1)}% {t('success rate', "Erfolgsrate")}
                </div>
              </div>
              <div className="p-6 bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/20 dark:to-rose-950/20 rounded-xl border-2 border-red-200 dark:border-red-900/30">
                <div className="flex items-center gap-3 mb-2">
                  <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <div className="text-3xl font-bold text-red-600 dark:text-red-400">{results.failed}</div>
                    <div className="text-sm text-red-700 dark:text-red-300 font-medium">{t('Failed', "Fehlgeschlagen")}</div>
                  </div>
                </div>
                <div className="text-xs text-red-600 dark:text-red-400 mt-2">
                  {((results.failed / (results.success + results.failed)) * 100).toFixed(1)}% {t('failure rate', "Fehlerrate")}
                </div>
              </div>
              <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-xl border-2 border-blue-200 dark:border-blue-900/30">
                <div className="flex items-center gap-3 mb-2">
                  <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <div>
                    <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                      {startTime ? `${((Date.now() - startTime) / 1000 / 60).toFixed(1)}` : '--'}
                    </div>
                    <div className="text-sm text-blue-700 dark:text-blue-300 font-medium">{t('Minutes', "Minuten")}</div>
                  </div>
                </div>
                <div className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                  {t('Total time', "Gesamtzeit")}
                </div>
              </div>
            </div>
            {results.errors.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {t('Errors', "Fehler")} ({results.errors.length}):
                </h3>
                <div className="max-h-64 overflow-y-auto space-y-2 bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                  {results.errors.slice(0, 20).map((error, i) => (
                    <div key={i} className="text-xs text-red-600 dark:text-red-400 p-2 bg-red-50 dark:bg-red-950/20 rounded border border-red-200 dark:border-red-900/30">
                      {error}
                    </div>
                  ))}
                  {results.errors.length > 20 && (
                    <div className="text-xs text-slate-500 dark:text-slate-400 text-center pt-2">
                      {t('... and', "... und")} {results.errors.length - 20} {t('more errors', "weitere Fehler")}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Recent Generations */}
        {recentGenerations.length > 0 && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 shadow-lg">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">{t('Recent Generations', "Letzte Generierungen")}</h2>
            <div className="space-y-2">
              {recentGenerations.map((gen) => (
                <div key={gen.id} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {gen.brand} {gen.model} {gen.generation}
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">
                        {gen.count} {gen.contentType === 'fault' ? t('faults', "Fehler") : t('manuals', "Anleitungen")} • {gen.success} {t('successful', "erfolgreich")} • {gen.failed} {t('failed', "fehlgeschlagen")}
                      </div>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-500">
                      {new Date(gen.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

