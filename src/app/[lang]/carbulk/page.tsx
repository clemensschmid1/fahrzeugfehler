'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import InternalAuth from '@/components/InternalAuth';
import { getSupabaseClient } from '@/lib/supabase';
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

  // State declarations
  const [brands, setBrands] = useState<CarBrand[]>([]);
  const [models, setModels] = useState<CarModel[]>([]);
  const [generations, setGenerations] = useState<ModelGeneration[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [selectedGeneration, setSelectedGeneration] = useState<string>('');
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [selectedGenerations, setSelectedGenerations] = useState<string[]>([]);
  const [generationMode, setGenerationMode] = useState<'single' | 'multiple'>('single');
  const [contentType, setContentType] = useState<'fault' | 'manual'>('fault');
  const [count, setCount] = useState<number>(100);
  const [language, setLanguage] = useState<'en' | 'de'>('en');
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeJobs, setActiveJobs] = useState<Array<{
    id: string;
    brand: string;
    model: string;
    generation: string;
    contentType: string;
    count: number;
    status: string;
    progress: number;
    total: number;
    createdAt: string;
    currentStage?: string;
    successCount?: number;
    failedCount?: number;
    batch1Id?: string;
    batch2Id?: string;
    batch1Status?: string;
    batch2Status?: string;
  }>>([]);
  const [progress, setProgress] = useState<{ current: number; total: number; stage: string } | null>(null);
  const [results, setResults] = useState<{ success: number; failed: number; errors: string[] } | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [estimatedTime, setEstimatedTime] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [model, setModel] = useState<string>('gpt-4o');
  const [batchInfo, setBatchInfo] = useState<{ batch1Id?: string; batch2Id?: string; batch1Status?: string; batch2Status?: string; requestCounts?: any } | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [costBreakdown, setCostBreakdown] = useState<{ estimated: number; actual?: number; savings?: number } | null>(null);
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
  const [loadingBrands, setLoadingBrands] = useState(true);
  const [loadingModels, setLoadingModels] = useState(false);
  const [loadingGenerations, setLoadingGenerations] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);

  const supabase = useMemo(() => {
    try {
      return getSupabaseClient();
    } catch (error: any) {
      console.error('Failed to initialize Supabase client:', error);
      return null;
    }
  }, []);

  // Derived values
  const selectedBrandData = brands.find(b => b.id === selectedBrand);
  const selectedModelData = models.find(m => m.id === selectedModel);
  const selectedGenerationData = generations.find(g => g.id === selectedGeneration);
  const estimatedCost = count * 0.015;
  const elapsedTime = startTime ? ((Date.now() - startTime) / 1000) : 0;
  const remainingTime = estimatedTime && startTime ? Math.max(0, (estimatedTime - (Date.now() - startTime)) / 1000) : null;

  // Load functions
  const loadBrands = async () => {
    if (!supabase) {
      console.error('Supabase client not available');
      setLoadingBrands(false);
      return;
    }
    
    try {
      setLoadingBrands(true);
      setError(null); // Clear any previous errors
      const { data, error } = await supabase
        .from('car_brands')
        .select('id, name, slug')
        .order('name');
      
      if (error) {
        console.error('Supabase error loading brands:', error);
        throw error;
      }
      
      if (data) {
        setBrands(data);
        console.log(`Loaded ${data.length} brands`);
      } else {
        setBrands([]);
        console.warn('No brands returned from database');
      }
    } catch (err: any) {
      console.error('Error loading brands:', err);
      setError(t('Failed to load brands', 'Fehler beim Laden der Marken') + (err?.message ? `: ${err.message}` : ''));
      setBrands([]); // Set empty array on error
    } finally {
      setLoadingBrands(false);
    }
  };

  const loadModels = async (brandId: string) => {
    if (!supabase) {
      console.error('Supabase client not available');
      setLoadingModels(false);
      return;
    }
    
    try {
      setLoadingModels(true);
      const { data, error } = await supabase
        .from('car_models')
        .select('id, name, slug, brand_id')
        .eq('brand_id', brandId)
        .order('name');
      
      if (error) throw error;
      if (data) {
        setModels(data);
      } else {
        setModels([]);
      }
    } catch (err) {
      console.error('Error loading models:', err);
      setError(t('Failed to load models', 'Fehler beim Laden der Modelle'));
      setModels([]);
    } finally {
      setLoadingModels(false);
    }
  };

  const loadGenerations = async (modelId: string) => {
    if (!supabase) {
      console.error('Supabase client not available');
      setLoadingGenerations(false);
      return;
    }
    
    try {
      setLoadingGenerations(true);
      const { data, error } = await supabase
        .from('model_generations')
        .select('id, name, slug, car_model_id, generation_code, year_start, year_end')
        .eq('car_model_id', modelId)
        .order('year_start', { ascending: false });
      
      if (error) throw error;
      if (data) {
        setGenerations(data);
      } else {
        setGenerations([]);
      }
    } catch (err) {
      console.error('Error loading generations:', err);
      setError(t('Failed to load generations', 'Fehler beim Laden der Generationen'));
      setGenerations([]);
    } finally {
      setLoadingGenerations(false);
    }
  };

  const loadAllModelsForBrands = async (brandIds: string[]) => {
    if (!supabase || brandIds.length === 0) {
      setLoadingModels(false);
      if (brandIds.length === 0) {
        setModels([]);
      }
      return;
    }
    
    try {
      setLoadingModels(true);
      const { data, error } = await supabase
        .from('car_models')
        .select('id, name, slug, brand_id')
        .in('brand_id', brandIds)
        .order('name');
      
      if (error) throw error;
      if (data) {
        setModels(data);
      } else {
        setModels([]);
      }
    } catch (err) {
      console.error('Error loading models:', err);
      setError(t('Failed to load models', 'Fehler beim Laden der Modelle'));
      setModels([]);
    } finally {
      setLoadingModels(false);
    }
  };

  const loadAllGenerationsForModels = async (modelIds: string[]) => {
    if (!supabase || modelIds.length === 0) {
      setLoadingGenerations(false);
      if (modelIds.length === 0) {
        setGenerations([]);
      }
      return;
    }
    
    try {
      setLoadingGenerations(true);
      const { data, error } = await supabase
        .from('model_generations')
        .select('id, name, slug, car_model_id, generation_code, year_start, year_end')
        .in('car_model_id', modelIds)
        .order('year_start', { ascending: false });
      
      if (error) throw error;
      if (data) {
        setGenerations(data);
      } else {
        setGenerations([]);
      }
    } catch (err) {
      console.error('Error loading generations:', err);
      setError(t('Failed to load generations', 'Fehler beim Laden der Generationen'));
      setGenerations([]);
    } finally {
      setLoadingGenerations(false);
    }
  };

  const loadActiveJobs = async () => {
    if (!supabase) {
      console.error('Supabase client not available');
      setActiveJobs([]);
      return;
    }
    
    try {
      // Fetch jobs without joins (foreign keys not set up)
      const { data: jobs, error } = await supabase
        .from('car_bulk_generation_jobs')
        .select('id, count, content_type, status, progress_current, progress_total, current_stage, success_count, failed_count, created_at, brand_id, model_id, generation_id, batch1_id, batch2_id, batch1_status, batch2_status')
        .in('status', ['pending', 'processing', 'batch1_created', 'batch1_complete', 'batch2_created', 'batch2_complete', 'completed', 'failed'])
        .order('created_at', { ascending: false })
        .limit(50);

      // Handle table not existing error gracefully
      if (error) {
        // Check if it's a "table doesn't exist" error (various formats)
        const isTableMissing = 
          error.code === '42P01' || 
          error.code === 'PGRST116' ||
          error.message?.includes('does not exist') ||
          error.message?.includes('relation') ||
          (error as any).status === 404 ||
          (error as any).statusCode === 404;
        
        if (isTableMissing) {
          // Table doesn't exist yet - this is fine, just set empty array silently
          setActiveJobs([]);
          return;
        }
        throw error;
      }
      
      if (!jobs || jobs.length === 0) {
        setActiveJobs([]);
        return;
      }

      // Fetch related data separately
      const brandIds = [...new Set(jobs.map((j: any) => j.brand_id).filter(Boolean))];
      const modelIds = [...new Set(jobs.map((j: any) => j.model_id).filter(Boolean))];
      const generationIds = [...new Set(jobs.map((j: any) => j.generation_id).filter(Boolean))];

      const [brandsData, modelsData, generationsData] = await Promise.all([
        brandIds.length > 0 
          ? supabase.from('car_brands').select('id, name').in('id', brandIds)
          : Promise.resolve({ data: [], error: null }),
        modelIds.length > 0 
          ? supabase.from('car_models').select('id, name').in('id', modelIds)
          : Promise.resolve({ data: [], error: null }),
        generationIds.length > 0 
          ? supabase.from('model_generations').select('id, name').in('id', generationIds)
          : Promise.resolve({ data: [], error: null }),
      ]).catch((err) => {
        // If any query fails, return empty data
        console.warn('Error fetching related data for jobs:', err);
        return [
          { data: [], error: err },
          { data: [], error: err },
          { data: [], error: err },
        ];
      });

      const brandsMap = new Map((brandsData.data || []).map((b: any) => [b.id, b.name]));
      const modelsMap = new Map((modelsData.data || []).map((m: any) => [m.id, m.name]));
      const generationsMap = new Map((generationsData.data || []).map((g: any) => [g.id, g.name]));

      setActiveJobs(jobs.map((job: any) => ({
        id: job.id,
        brand: brandsMap.get(job.brand_id) || 'Unknown',
        model: modelsMap.get(job.model_id) || 'Unknown',
        generation: generationsMap.get(job.generation_id) || 'Unknown',
        contentType: job.content_type,
        count: job.count,
        status: job.status,
        progress: job.progress_current || 0,
        total: job.progress_total || job.count,
        createdAt: job.created_at,
        currentStage: job.current_stage,
        successCount: job.success_count,
        failedCount: job.failed_count,
        batch1Id: job.batch1_id,
        batch2Id: job.batch2_id,
        batch1Status: job.batch1_status,
        batch2Status: job.batch2_status,
      })));
    } catch (err: any) {
      // Check if it's a table missing error (various formats including 404)
      const isTableMissing = 
        err?.code === '42P01' || 
        err?.code === 'PGRST116' ||
        err?.status === 404 ||
        err?.statusCode === 404 ||
        err?.message?.includes('does not exist') ||
        err?.message?.includes('relation');
      
      // Only log non-table-missing errors with better error details
      if (!isTableMissing) {
        const errorDetails = {
          message: err?.message || 'Unknown error',
          code: err?.code || 'NO_CODE',
          status: err?.status || err?.statusCode,
          name: err?.name,
          stack: err?.stack?.substring(0, 200), // First 200 chars of stack
        };
        console.error('Error loading active jobs:', errorDetails, err);
      }
      // Set empty array on any error to prevent UI issues
      setActiveJobs([]);
    }
  };

  // useEffect hooks
  useEffect(() => {
    if (supabase) {
      loadBrands();
    }
  }, [supabase]);

  useEffect(() => {
    if (generationMode === 'single') {
      if (selectedBrand) {
        loadModels(selectedBrand);
      } else {
        setModels([]);
        setGenerations([]);
        setSelectedModel('');
        setSelectedGeneration('');
      }
    } else {
      if (selectedBrands.length > 0) {
        loadAllModelsForBrands(selectedBrands);
      } else {
        setModels([]);
        setGenerations([]);
        setSelectedModels([]);
        setSelectedGenerations([]);
      }
    }
  }, [selectedBrand, selectedBrands, generationMode]);

  useEffect(() => {
    if (generationMode === 'single') {
      if (selectedModel) {
        loadGenerations(selectedModel);
      } else {
        setGenerations([]);
        setSelectedGeneration('');
      }
    } else {
      if (selectedModels.length > 0) {
        loadAllGenerationsForModels(selectedModels);
      } else {
        setGenerations([]);
        setSelectedGenerations([]);
      }
    }
  }, [selectedModel, selectedModels, generationMode]);

  useEffect(() => {
    let mounted = true;
    
    const checkAndLoad = async () => {
      if (!mounted) return;
      try {
        await loadActiveJobs();
      } catch (err) {
        // Silently fail - table might not exist or other transient errors
        console.error('Error in active jobs polling:', err);
      }
    };
    
    // Initial load
    checkAndLoad();
    
    // Poll every 10 seconds (reduced from 5 to minimize requests)
    const interval = setInterval(checkAndLoad, 10000);
    
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [supabase]); // Add supabase as dependency

  // Handler functions
  const handleCancel = () => {
    if (window.confirm(t('Are you sure you want to cancel this generation? The current batch jobs will continue processing on OpenAI, but no new items will be inserted.', 'Sind Sie sicher, dass Sie diese Generierung abbrechen möchten? Die aktuellen Batch-Jobs werden auf OpenAI weiterverarbeitet, aber es werden keine neuen Artikel eingefügt.'))) {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      setIsGenerating(false);
      setProgress(null);
      setError(t('Generation cancelled', 'Generierung abgebrochen'));
    }
  };

  const handleGenerateMultiple = async () => {
    if (selectedGenerations.length === 0) {
      setError(t('Please select at least one generation', 'Bitte wählen Sie mindestens eine Generation'));
      return;
    }

    if (count < 1 || count > 50000) {
      setError(t('Count must be between 1 and 50,000', 'Anzahl muss zwischen 1 und 50.000 liegen'));
      return;
    }

    const jobs = selectedGenerations.map(genId => {
      const gen = generations.find(g => g.id === genId);
      if (!gen) return null;
      
      const model = models.find(m => m.id === gen.car_model_id);
      if (!model) return null;
      
      const brand = brands.find(b => b.id === model.brand_id);
      if (!brand) return null;
      
      return {
        brandId: brand.id,
        modelId: model.id,
        generationId: gen.id,
        contentType,
        count,
        language,
      };
    }).filter(Boolean) as Array<{
      brandId: string;
      modelId: string;
      generationId: string;
      contentType: string;
      count: number;
      language: string;
    }>;

    if (jobs.length === 0) {
      setError(t('No valid jobs to create', 'Keine gültigen Jobs zum Erstellen'));
      return;
    }

    setError(null);
    setIsGenerating(true);

    try {
      const response = await fetch('/api/cars/bulk-generate-multiple', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobs }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || t('Failed to create jobs', 'Fehler beim Erstellen der Jobs'));
      }

      const data = await response.json();
      await loadActiveJobs();
      setError(null);
      setIsGenerating(false);
      
      alert(t(`Successfully created ${data.jobIds.length} job(s)! They are now processing in the background.`, `Erfolgreich ${data.jobIds.length} Job(s) erstellt! Sie werden jetzt im Hintergrund verarbeitet.`));
    } catch (error: any) {
      console.error('Multiple generation error:', error);
      setError(t('Generation failed: ', 'Generierung fehlgeschlagen: ') + (error instanceof Error ? error.message : t('Unknown error', 'Unbekannter Fehler')));
      setIsGenerating(false);
    }
  };

  const handleGenerate = async () => {
    if (generationMode === 'single') {
      if (!selectedBrand || !selectedModel || !selectedGeneration) {
        setError(t('Please select brand, model, and generation', 'Bitte wählen Sie Marke, Modell und Generation'));
        return;
      }
    } else {
      return handleGenerateMultiple();
    }

    if (count < 1 || count > 50000) {
      setError(t('Count must be between 1 and 50,000', 'Anzahl muss zwischen 1 und 50.000 liegen'));
      return;
    }

    setError(null);
    setIsGenerating(true);
    setStartTime(Date.now());
    setProgress({ current: 0, total: count, stage: t('Initializing Batch API...', 'Initialisiere Batch API...') });
    setResults(null);
    setBatchInfo(null);
    setModel('gpt-4o');
    setEstimatedTime((count * 0.1 + 5) * 60 * 1000);

    abortControllerRef.current = new AbortController();

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
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || t('Generation failed', 'Generierung fehlgeschlagen'));
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error(t('No response stream', 'Kein Antwort-Stream'));
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
              
              if (data.jobId) setJobId(data.jobId);
              if (data.model) setModel(data.model);
              
              if (data.batch1Id || data.batch2Id) {
                setBatchInfo(prev => ({
                  ...prev,
                  batch1Id: data.batch1Id || prev?.batch1Id,
                  batch2Id: data.batch2Id || prev?.batch2Id,
                  batch1Status: data.batch1Status || prev?.batch1Status,
                  batch2Status: data.batch2Status || prev?.batch2Status,
                  requestCounts: data.requestCounts || prev?.requestCounts,
                }));
              }
              
              if (data.summary) {
                const estimated = count * 0.015 * 0.5;
                const actual = data.summary.batch1RequestCounts?.total && data.summary.batch2RequestCounts?.total
                  ? ((data.summary.batch1RequestCounts.total * 0.005) + (data.summary.batch2RequestCounts.total * 0.0025)) * 0.5
                  : undefined;
                setCostBreakdown({
                  estimated,
                  actual,
                  savings: actual ? estimated - actual : undefined,
                });
              }
              
              if (data.progress) {
                if (data.progress.current !== undefined && data.progress.total !== undefined) {
                  setProgress({ 
                    current: data.progress.current, 
                    total: data.progress.total, 
                    stage: data.progress.stage || 'Processing...' 
                  });
                } else if (data.progress.stage) {
                  setProgress(prev => prev ? { ...prev, stage: data.progress.stage } : { current: 0, total: count, stage: data.progress.stage });
                }
              }
              
              if (data.result) {
                if (data.result.success) successCount++;
                else {
                  failedCount++;
                  if (data.result.error) errors.push(data.result.error);
                }
                setProgress(prev => prev ? { ...prev, current: successCount + failedCount } : { current: successCount + failedCount, total: count, stage: 'Processing...' });
              }
              
              if (data.complete) {
                setResults({ 
                  success: data.summary?.success || successCount, 
                  failed: data.summary?.failed || failedCount, 
                  errors: data.summary?.errors || errors 
                });
                setIsGenerating(false);
                setStartTime(null);
                setEstimatedTime(null);
                abortControllerRef.current = null;
                
                if (selectedBrandData && selectedModelData && selectedGenerationData) {
                  const newGen = {
                    id: Date.now().toString(),
                    brand: selectedBrandData.name,
                    model: selectedModelData.name,
                    generation: selectedGenerationData.name,
                    contentType,
                    count,
                    success: data.summary?.success || successCount,
                    failed: data.summary?.failed || failedCount,
                    createdAt: new Date().toISOString(),
                  };
                  setRecentGenerations(prev => [newGen, ...prev.slice(0, 9)]);
                }
                return;
              }
              
              if (data.error) {
                throw new Error(data.error);
              }
            } catch (e) {
              console.warn('Failed to parse SSE data:', e, line);
            }
          }
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        setError(t('Generation cancelled', 'Generierung abgebrochen'));
      } else {
        console.error('Generation error:', error);
        setError(t('Generation failed: ', 'Generierung fehlgeschlagen: ') + (error instanceof Error ? error.message : t('Unknown error', 'Unbekannter Fehler')));
      }
      setIsGenerating(false);
      setProgress(null);
      abortControllerRef.current = null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-black dark:to-slate-950 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">
              {t('Car Bulk Content Generator', 'Auto-Bulk-Inhaltsgenerator')}
            </h1>
            <Link
              href={`/${lang}/carinternal`}
              className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-700 transition-all text-sm font-medium"
            >
              ← {t('Back to Car Internal', 'Zurück zu Car Internal')}
            </Link>
          </div>
          <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base">
            {t(
              'Generate 100-1000 car faults or manuals at once using AI. Cost-efficient batch processing with real-time progress tracking.',
              'Generieren Sie 100-1000 Auto-Fehler oder Anleitungen auf einmal mit KI. Kosteneffiziente Batch-Verarbeitung mit Echtzeit-Fortschrittsanzeige.'
            )}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-lg">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
                aria-label={t('Close', 'Schließen')}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
            <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">{t('Model', 'Modell')}</div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{model}</div>
            <div className="text-xs text-slate-500 dark:text-slate-500 mt-1">{t('OpenAI Batch API', 'OpenAI Batch API')}</div>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
            <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">{t('Estimated Cost', 'Geschätzte Kosten')}</div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {costBreakdown?.actual ? `$${costBreakdown.actual.toFixed(2)}` : `$${(estimatedCost * 0.5).toFixed(2)}`}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-500 mt-1">
              {costBreakdown?.savings && costBreakdown.savings > 0 ? (
                <span className="text-green-600 dark:text-green-400">
                  {t('Saved', 'Gespart')}: ${costBreakdown.savings.toFixed(2)} ({t('50% discount', '50% Rabatt')})
                </span>
              ) : (
                t('50% discount', '50% Rabatt')
              )}
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
            <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">{t('Estimated Time', 'Geschätzte Zeit')}</div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {estimatedTime ? `${Math.ceil(estimatedTime / 1000 / 60)}m` : '--'}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-500 mt-1">{t('Batch processing', 'Batch-Verarbeitung')}</div>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
            <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">{t('Items to Generate', 'Zu generierende Artikel')}</div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{count}</div>
            <div className="text-xs text-slate-500 dark:text-slate-500 mt-1">{contentType === 'fault' ? t('Faults', 'Fehler') : t('Manuals', 'Anleitungen')}</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 mb-8 shadow-lg">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">{t('Generation Mode', 'Generierungsmodus')}</h2>
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => {
                setGenerationMode('single');
                // Preserve single selections when switching back
                if (selectedBrands.length === 1) {
                  setSelectedBrand(selectedBrands[0]);
                }
                if (selectedModels.length === 1) {
                  setSelectedModel(selectedModels[0]);
                }
                if (selectedGenerations.length === 1) {
                  setSelectedGeneration(selectedGenerations[0]);
                }
                setSelectedBrands([]);
                setSelectedModels([]);
                setSelectedGenerations([]);
              }}
              className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all ${
                generationMode === 'single'
                  ? 'bg-red-600 text-white shadow-lg'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700'
              }`}
            >
              {t('Single Generation', 'Einzelne Generierung')}
            </button>
            <button
              onClick={() => {
                setGenerationMode('multiple');
                // Preserve single selections when switching to multiple mode
                if (selectedBrand && !selectedBrands.includes(selectedBrand)) {
                  setSelectedBrands([selectedBrand]);
                }
                if (selectedModel && !selectedModels.includes(selectedModel)) {
                  setSelectedModels([selectedModel]);
                }
                if (selectedGeneration && !selectedGenerations.includes(selectedGeneration)) {
                  setSelectedGenerations([selectedGeneration]);
                }
                setSelectedBrand('');
                setSelectedModel('');
                setSelectedGeneration('');
              }}
              className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all ${
                generationMode === 'multiple'
                  ? 'bg-red-600 text-white shadow-lg'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700'
              }`}
            >
              {t('Multiple Generations (Bulk)', 'Mehrere Generationen (Bulk)')}
            </button>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {generationMode === 'multiple' 
              ? t('Select multiple brands, models, and generations to generate content for all combinations in parallel.', 'Wählen Sie mehrere Marken, Modelle und Generationen aus, um Inhalte für alle Kombinationen parallel zu generieren.')
              : t('Generate content for a single brand, model, and generation.', 'Generieren Sie Inhalte für eine einzelne Marke, ein Modell und eine Generation.')
            }
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 mb-8 shadow-lg">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">{t('Generation Settings', 'Generierungseinstellungen')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                {t('Content Type', 'Inhaltstyp')}
              </label>
              <select
                value={contentType}
                onChange={(e) => setContentType(e.target.value as 'fault' | 'manual')}
                disabled={isGenerating}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
                disabled={isGenerating}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="en">English</option>
                <option value="de">Deutsch</option>
              </select>
            </div>

            {generationMode === 'single' ? (
              <>
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
                    disabled={isGenerating || loadingBrands}
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">{loadingBrands ? t('Loading...', 'Lade...') : t('Select Brand', 'Marke auswählen')}</option>
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
                    disabled={!selectedBrand || isGenerating || loadingModels}
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white disabled:opacity-50 focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all disabled:cursor-not-allowed"
                  >
                    <option value="">{loadingModels ? t('Loading...', 'Lade...') : t('Select Model', 'Modell auswählen')}</option>
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
                    disabled={!selectedModel || isGenerating || loadingGenerations}
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white disabled:opacity-50 focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all disabled:cursor-not-allowed"
                  >
                    <option value="">{loadingGenerations ? t('Loading...', 'Lade...') : t('Select Generation', 'Generation auswählen')}</option>
                    {generations.map(gen => (
                      <option key={gen.id} value={gen.id}>
                        {gen.name} {gen.generation_code ? `(${gen.generation_code})` : ''} {gen.year_start && gen.year_end ? `[${gen.year_start}-${gen.year_end}]` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            ) : (
              <>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    {t('Select Brands', 'Marken auswählen')} ({selectedBrands.length} {t('selected', 'ausgewählt')})
                  </label>
                  <div className="max-h-48 overflow-y-auto border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 p-2 mb-4">
                    {brands.length === 0 ? (
                      <p className="text-sm text-slate-500 dark:text-slate-400 p-4 text-center">
                        {loadingBrands ? t('Loading...', 'Lade...') : t('No brands available', 'Keine Marken verfügbar')}
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {brands.map(brand => {
                          const isSelected = selectedBrands.includes(brand.id);
                          return (
                            <label
                              key={brand.id}
                              className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all ${
                                isSelected
                                  ? 'bg-red-50 dark:bg-red-950/20 border-2 border-red-300 dark:border-red-800'
                                  : 'bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedBrands([...selectedBrands, brand.id]);
                                  } else {
                                    const newBrands = selectedBrands.filter(id => id !== brand.id);
                                    setSelectedBrands(newBrands);
                                    // Remove models and generations from deselected brand
                                    const modelsToRemove = models.filter(m => m.brand_id === brand.id).map(m => m.id);
                                    setSelectedModels(selectedModels.filter(id => !modelsToRemove.includes(id)));
                                    const gensToRemove = generations.filter(g => modelsToRemove.includes(g.car_model_id)).map(g => g.id);
                                    setSelectedGenerations(selectedGenerations.filter(id => !gensToRemove.includes(id)));
                                  }
                                }}
                                disabled={isGenerating}
                                className="w-5 h-5 text-red-600 border-slate-300 rounded focus:ring-red-500"
                              />
                              <div className="font-medium text-slate-900 dark:text-white">
                                {brand.name}
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    {t('Select Models', 'Modelle auswählen')} ({selectedModels.length} {t('selected', 'ausgewählt')})
                  </label>
                  <div className="max-h-48 overflow-y-auto border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 p-2 mb-4">
                    {models.length === 0 ? (
                      <p className="text-sm text-slate-500 dark:text-slate-400 p-4 text-center">
                        {selectedBrands.length === 0 
                          ? t('Select brands first to see models', 'Wählen Sie zuerst Marken aus, um Modelle zu sehen')
                          : loadingModels 
                            ? t('Loading...', 'Lade...')
                            : t('No models available for selected brands', 'Keine Modelle für ausgewählte Marken verfügbar')
                        }
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {models.map(model => {
                          const brand = brands.find(b => b.id === model.brand_id);
                          const isSelected = selectedModels.includes(model.id);
                          return (
                            <label
                              key={model.id}
                              className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all ${
                                isSelected
                                  ? 'bg-red-50 dark:bg-red-950/20 border-2 border-red-300 dark:border-red-800'
                                  : 'bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedModels([...selectedModels, model.id]);
                                  } else {
                                    const newModels = selectedModels.filter(id => id !== model.id);
                                    setSelectedModels(newModels);
                                    // Remove generations from deselected model
                                    const gensToRemove = generations.filter(g => g.car_model_id === model.id).map(g => g.id);
                                    setSelectedGenerations(selectedGenerations.filter(id => !gensToRemove.includes(id)));
                                  }
                                }}
                                disabled={isGenerating || !selectedBrands.includes(model.brand_id)}
                                className="w-5 h-5 text-red-600 border-slate-300 rounded focus:ring-red-500"
                              />
                              <div className="flex-1">
                                <div className="font-medium text-slate-900 dark:text-white">
                                  {brand?.name} {model.name}
                                </div>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    {t('Select Generations', 'Generationen auswählen')} ({selectedGenerations.length} {t('selected', 'ausgewählt')})
                  </label>
                  <div className="max-h-64 overflow-y-auto border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 p-2">
                    {generations.length === 0 ? (
                      <p className="text-sm text-slate-500 dark:text-slate-400 p-4 text-center">
                        {selectedModels.length === 0
                          ? t('Select models first to see generations', 'Wählen Sie zuerst Modelle aus, um Generationen zu sehen')
                          : loadingGenerations
                            ? t('Loading...', 'Lade...')
                            : t('No generations available for selected models', 'Keine Generationen für ausgewählte Modelle verfügbar')
                        }
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {generations.map(gen => {
                          const model = models.find(m => m.id === gen.car_model_id);
                          const brand = model ? brands.find(b => b.id === model.brand_id) : null;
                          const isSelected = selectedGenerations.includes(gen.id);
                          
                          return (
                            <label
                              key={gen.id}
                              className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                                isSelected
                                  ? 'bg-red-50 dark:bg-red-950/20 border-2 border-red-300 dark:border-red-800'
                                  : 'bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedGenerations([...selectedGenerations, gen.id]);
                                  } else {
                                    setSelectedGenerations(selectedGenerations.filter(id => id !== gen.id));
                                  }
                                }}
                                disabled={isGenerating || !selectedModels.includes(gen.car_model_id)}
                                className="w-5 h-5 text-red-600 border-slate-300 rounded focus:ring-red-500"
                              />
                              <div className="flex-1">
                                <div className="font-medium text-slate-900 dark:text-white">
                                  {brand?.name} {model?.name} {gen.name}
                                </div>
                                <div className="text-xs text-slate-500 dark:text-slate-400">
                                  {gen.generation_code && `${gen.generation_code} • `}
                                  {gen.year_start && gen.year_end ? `${gen.year_start}-${gen.year_end}` : ''}
                                </div>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  {selectedGenerations.length > 0 && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                      {t('Will generate', 'Wird generieren')} {count} {contentType === 'fault' ? t('faults', 'Fehler') : t('manuals', 'Anleitungen')} {t('for each of', 'für jede der')} {selectedGenerations.length} {t('selected generations', 'ausgewählten Generationen')} = {count * selectedGenerations.length} {t('total items', 'Artikel insgesamt')}
                    </p>
                  )}
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                {t('Count', 'Anzahl')} (1-50,000)
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="1"
                  max="3000"
                  step="10"
                  value={Math.min(count, 3000)}
                  onChange={(e) => setCount(parseInt(e.target.value))}
                  disabled={isGenerating}
                  className="flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <input
                  type="number"
                  min="1"
                  max="50000"
                  value={count}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 1;
                    setCount(Math.max(1, Math.min(50000, val)));
                  }}
                  disabled={isGenerating}
                  className="w-32 px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-center focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {t('Batch API supports up to 50,000 items with 50% cost savings', 'Batch API unterstützt bis zu 50.000 Artikel mit 50% Kosteneinsparung')}
              </div>
            </div>
          </div>

          {selectedBrandData && selectedModelData && selectedGenerationData && generationMode === 'single' && (
            <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-lg border border-blue-200 dark:border-blue-900/30">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>{t('Target:', 'Ziel:')}</strong> {selectedBrandData.name} {selectedModelData.name} {selectedGenerationData.name}
                  {selectedGenerationData.generation_code && ` (${selectedGenerationData.generation_code})`}
                </p>
              </div>
            </div>
          )}

          <div className="flex gap-4">
            <button
              onClick={handleGenerate}
              disabled={isGenerating || (generationMode === 'single' && (!selectedBrand || !selectedModel || !selectedGeneration)) || (generationMode === 'multiple' && selectedGenerations.length === 0)}
              className="flex-1 px-6 py-4 bg-gradient-to-r from-red-600 to-red-700 dark:from-red-500 dark:to-red-600 text-white rounded-lg font-bold hover:from-red-700 hover:to-red-800 dark:hover:from-red-600 dark:hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:transform-none"
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
            {isGenerating && (
              <button
                onClick={handleCancel}
                className="px-6 py-4 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg font-bold hover:bg-red-200 dark:hover:bg-red-900/50 transition-all shadow-lg border-2 border-red-300 dark:border-red-800 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                {t('Cancel Generation', 'Generierung abbrechen')}
              </button>
            )}
          </div>
        </div>

        {activeJobs.length > 0 && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 mb-8 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {t('Active Jobs', 'Aktive Jobs')} ({activeJobs.length})
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={async (e) => {
                    e.preventDefault();
                    try {
                      const pendingCount = activeJobs.filter(j => j.status === 'pending').length;
                      if (pendingCount > 0) {
                        const response = await fetch('/api/cars/bulk-generate-worker', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                        });
                        if (response.ok) {
                          const data = await response.json();
                          console.log('[Worker] Triggered:', data);
                        }
                      }
                      await loadActiveJobs();
                    } catch (err) {
                      console.error('Error triggering worker:', err);
                    }
                  }}
                  className="px-4 py-2 text-sm bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/30 transition-all font-medium"
                  title={t('Process pending jobs immediately', 'Pending Jobs sofort verarbeiten')}
                >
                  {t('Process Pending', 'Pending verarbeiten')}
                </button>
                <button
                  onClick={async (e) => {
                    e.preventDefault();
                    try {
                      await loadActiveJobs();
                    } catch (err) {
                      console.error('Error refreshing active jobs:', err);
                    }
                  }}
                  className="px-4 py-2 text-sm bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                >
                  {t('Refresh', 'Aktualisieren')}
                </button>
              </div>
            </div>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {activeJobs.map((job) => {
                const statusColors: Record<string, string> = {
                  pending: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300',
                  processing: 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300',
                  batch1_created: 'bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-300',
                  batch1_complete: 'bg-indigo-100 dark:bg-indigo-900/20 text-indigo-800 dark:text-indigo-300',
                  batch2_created: 'bg-pink-100 dark:bg-pink-900/20 text-pink-800 dark:text-pink-300',
                  batch2_complete: 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300',
                  completed: 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-300',
                  failed: 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300',
                };
                
                const progressPercent = job.total > 0 ? (job.progress / job.total) * 100 : 0;
                
                return (
                  <div
                    key={job.id}
                    className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800/50"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {job.brand} {job.model} {job.generation}
                        </div>
                        <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                          {job.count} {job.contentType === 'fault' ? t('faults', 'Fehler') : t('manuals', 'Anleitungen')} • {t('Language', 'Sprache')}: {job.contentType === 'fault' ? 'en' : 'de'}
                        </div>
                        {job.currentStage && (
                          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            {job.currentStage}
                          </div>
                        )}
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[job.status] || 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-300'}`}>
                        {job.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                    
                    {(job.batch1Id || job.batch2Id) && (
                      <div className="mb-3 p-2 bg-blue-50 dark:bg-blue-950/20 rounded border border-blue-200 dark:border-blue-800">
                        <div className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">
                          {t('Batch Status', 'Batch-Status')}
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          {job.batch1Id && (
                            <div>
                              <div className="text-blue-600 dark:text-blue-400 font-medium">Batch 1</div>
                              <div className="text-blue-500 dark:text-blue-500 font-mono text-[10px] break-all">{job.batch1Id.substring(0, 20)}...</div>
                              {job.batch1Status && (
                                <div className="text-blue-500 dark:text-blue-500">{job.batch1Status}</div>
                              )}
                            </div>
                          )}
                          {job.batch2Id && (
                            <div>
                              <div className="text-blue-600 dark:text-blue-400 font-medium">Batch 2</div>
                              <div className="text-blue-500 dark:text-blue-500 font-mono text-[10px] break-all">{job.batch2Id.substring(0, 20)}...</div>
                              {job.batch2Status && (
                                <div className="text-blue-500 dark:text-blue-500">{job.batch2Status}</div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400 mb-1">
                        <span>
                          {job.progress} / {job.total}
                          {job.successCount !== undefined && job.failedCount !== undefined && (
                            <span className="ml-2">
                              ({job.successCount} {t('success', 'erfolgreich')}, {job.failedCount} {t('failed', 'fehlgeschlagen')})
                            </span>
                          )}
                        </span>
                        <span>{Math.round(progressPercent)}%</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-red-600 to-red-500 dark:from-red-500 dark:to-red-400 h-2 rounded-full transition-all"
                          style={{ width: `${Math.min(100, progressPercent)}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-500 mt-2">
                      {t('Started', 'Gestartet')}: {new Date(job.createdAt).toLocaleString()}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {progress && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 mb-8 shadow-lg">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
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
            
            {jobId && (
              <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                <div className="text-xs text-slate-600 dark:text-slate-400 mb-1">{t('Job ID', 'Job-ID')}</div>
                <div className="text-sm font-mono text-slate-900 dark:text-slate-100 break-all">{jobId}</div>
                <div className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                  {t('This job is saved and will continue even if you close this page.', 'Dieser Job wird gespeichert und läuft weiter, auch wenn Sie diese Seite schließen.')}
                </div>
              </div>
            )}
            
            {batchInfo && (batchInfo.batch1Id || batchInfo.batch2Id) && (
              <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-900/30">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm font-semibold text-blue-900 dark:text-blue-200">{t('Batch Status', 'Batch-Status')}</div>
                  <div className="text-xs text-blue-600 dark:text-blue-400">
                    {t('OpenAI Batch API', 'OpenAI Batch API')}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {batchInfo.batch1Id && (
                    <div className="p-3 bg-white dark:bg-slate-900/50 rounded border border-blue-200 dark:border-blue-800">
                      <div className="text-blue-700 dark:text-blue-300 font-medium mb-1">Batch 1: {t('Answers', 'Antworten')}</div>
                      <div className="text-blue-600 dark:text-blue-400 font-mono text-[10px] break-all mb-2">{batchInfo.batch1Id}</div>
                      {batchInfo.batch1Status && (
                        <div className="text-blue-500 dark:text-blue-500 mb-1">
                          <span className="font-medium">{t('Status:', 'Status:')}</span> {batchInfo.batch1Status}
                        </div>
                      )}
                      {batchInfo.requestCounts && (
                        <div className="text-blue-500 dark:text-blue-500">
                          <span className="font-medium">{t('Progress:', 'Fortschritt:')}</span> {batchInfo.requestCounts.completed || 0} / {batchInfo.requestCounts.total || 0}
                        </div>
                      )}
                    </div>
                  )}
                  {batchInfo.batch2Id && (
                    <div className="p-3 bg-white dark:bg-slate-900/50 rounded border border-blue-200 dark:border-blue-800">
                      <div className="text-blue-700 dark:text-blue-300 font-medium mb-1">Batch 2: {t('Metadata', 'Metadaten')}</div>
                      <div className="text-blue-600 dark:text-blue-400 font-mono text-[10px] break-all mb-2">{batchInfo.batch2Id}</div>
                      {batchInfo.batch2Status && (
                        <div className="text-blue-500 dark:text-blue-500">
                          <span className="font-medium">{t('Status:', 'Status:')}</span> {batchInfo.batch2Status}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
            
            <div className="mb-4">
              <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400 mb-2">
                <span className="font-medium">{progress.stage}</span>
                {progress.total > 0 && (
                  <span className="font-bold">{progress.current} / {progress.total} ({Math.round((progress.current / progress.total) * 100)}%)</span>
                )}
              </div>
              {progress.total > 0 && (
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-4 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-red-600 to-red-500 dark:from-red-500 dark:to-red-400 h-4 rounded-full transition-all duration-300 flex items-center justify-end pr-2"
                    style={{ width: `${Math.min(100, (progress.current / progress.total) * 100)}%` }}
                  >
                    {progress.current > 0 && (
                      <span className="text-xs font-bold text-white">{Math.round((progress.current / progress.total) * 100)}%</span>
                    )}
                  </div>
                </div>
              )}
            </div>
            {startTime && progress.total > 0 && (
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
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 mb-8 shadow-lg">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">{t('Results', "Ergebnisse")}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-xl border-2 border-green-200 dark:border-green-900/30">
                <div className="flex items-center gap-3 mb-2">
                  <svg className="w-8 h-8 text-green-600 dark:text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  <svg className="w-8 h-8 text-red-600 dark:text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  <svg className="w-8 h-8 text-blue-600 dark:text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

        {recentGenerations.length > 0 && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-lg">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">{t('Recent Generations', "Letzte Generierungen")}</h2>
            <div className="space-y-2">
              {recentGenerations.map((gen) => (
                <div key={gen.id} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between flex-wrap gap-2">
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

