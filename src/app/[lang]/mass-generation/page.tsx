'use client';

import { useState, useEffect, useMemo } from 'react';
import InternalAuth from '@/components/InternalAuth';
import { getSupabaseClient } from '@/lib/supabase';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import FileUpload from '@/components/FileUpload';

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

type BatchStatus = {
  id: string;
  status: string;
  request_counts?: {
    total: number;
    completed: number;
    failed: number;
  };
  output_file_id?: string;
  error_file_id?: string;
};

type BatchProgress = {
  batchNumber: number;
  status: 'pending' | 'running' | 'complete' | 'error';
  questionsGenerated: number;
  rawQuestions: number;
  invalidQuestions: number;
  responseTime?: number;
  tokensUsed?: number;
  prompt?: string;
  error?: string;
};

type GenerationProgressDetail = {
  generationId: string;
  generationName: string;
  brand: string;
  model: string;
  generation: string;
  totalBatches: number;
  completedBatches: number;
  questionsGenerated: number;
  totalQuestions: number;
  apiCalls: number;
  batches: Map<number, BatchProgress>;
};

type StepCardProps = {
  step: number | 1.5 | 4.5;
  title: string;
  description: string;
  status: 'idle' | 'generating' | 'uploading' | 'importing' | 'building' | 'complete' | 'error';
  error?: string | null;
  progress?: { current: number; total: number } | null;
  onAction: () => void;
  actionLabel: string;
  disabled: boolean;
  onCancel?: () => void;
  canCancel?: boolean;
  fileUrl?: string | null;
  batchId?: string | null;
  batchStatus?: BatchStatus | null;
  autoRefresh?: boolean;
  onAutoRefreshChange?: (value: boolean) => void;
  results?: { success: number; failed: number } | null;
  details?: {
    currentGeneration?: string;
    currentBatch?: number;
    totalBatches?: number;
    apiCalls?: number;
    totalApiCalls?: number;
    questionsGenerated?: number;
    duplicatesRemoved?: number;
    currentPrompt?: string;
    lastApiCall?: {
      batchNumber: number;
      responseTime: number;
      tokensUsed: number;
      questionsGenerated: number;
    };
  } | null;
  generationProgress?: Map<string, GenerationProgressDetail> | null;
  // Step 4 file uploads
  step4QuestionsFile?: File | null;
  step4AnswersFile?: File | null;
  onStep4QuestionsFileChange?: (file: File | null) => void;
  onStep4AnswersFileChange?: (file: File | null) => void;
  // Step 5 file uploads
  step5QuestionsFile?: File | null;
  step5AnswersFile?: File | null;
  step5MetadataFile?: File | null;
  onStep5QuestionsFileChange?: (file: File | null) => void;
  onStep5AnswersFileChange?: (file: File | null) => void;
  onStep5MetadataFileChange?: (file: File | null) => void;
  // Step 2 file upload
  step2File?: File | null;
  onStep2FileChange?: (file: File | null) => void;
  step1_5JsonlFileUrl?: string | null;
  step1FileUrl?: string | null;
  // Step 4.5 file upload
  step4_5MetadataFile?: File | null;
  onStep4_5MetadataFileChange?: (file: File | null) => void;
  step4MetadataFileUrl?: string | null;
  // Prompts for display
  step2Prompts?: {
    systemPrompt: string;
    exampleUserPrompt: string;
    model: string;
    temperature: number;
    maxTokens: number;
    generationContext: { brand: string; model: string; generation: string; generationCode: string | null } | null;
  } | null;
  step4Prompts?: {
    systemPrompt: string;
    exampleUserPrompt: string;
    model: string;
    temperature: number;
    maxTokens: number;
    responseFormat: string;
    generationContext: { brand: string; model: string; generation: string } | null;
  } | null;
  // Step 3 batches list
  batches?: Array<{
    id: string;
    name: string;
    status: string;
    type: 'answers' | 'metadata';
    createdAt: string;
    completedAt?: string;
    requestCounts?: { total: number; completed: number; failed: number };
    outputFileId?: string;
    errorFileId?: string;
    metadata?: any;
  }>;
  onDownloadBatch?: (batchId: string, fileId?: string) => void;
  t: (en: string, de: string) => string;
};

export default function MassGenerationPage() {
  return (
    <InternalAuth>
      <MassGenerationContent />
    </InternalAuth>
  );
}

function MassGenerationContent() {
  const params = useParams();
  const lang = params.lang as string;
  const t = (en: string, de: string) => lang === 'de' ? de : en;

  // State declarations
  const [brands, setBrands] = useState<CarBrand[]>([]);
  const [models, setModels] = useState<CarModel[]>([]);
  const [generations, setGenerations] = useState<ModelGeneration[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [selectedGeneration, setSelectedGeneration] = useState<string>('');
  const [selectedGenerations, setSelectedGenerations] = useState<string[]>([]);
  const [selectAllGenerations, setSelectAllGenerations] = useState<boolean>(false);
  const [questionsPerGeneration, setQuestionsPerGeneration] = useState<number>(5000);
  const [contentType, setContentType] = useState<'fault' | 'manual'>('fault');
  const [language, setLanguage] = useState<'en' | 'de'>('en');
  const [loadingBrands, setLoadingBrands] = useState(true);

  // Step 1: Question Generation
  const [step1Status, setStep1Status] = useState<'idle' | 'generating' | 'complete' | 'error'>('idle');
  const [step1Progress, setStep1Progress] = useState<{ current: number; total: number } | null>(null);
  const [step1FileUrl, setStep1FileUrl] = useState<string | null>(null);
  const [step1Error, setStep1Error] = useState<string | null>(null);
  const [step1Details, setStep1Details] = useState<{
    currentGeneration?: string;
    currentBatch?: number;
    totalBatches?: number;
    apiCalls?: number;
    totalApiCalls?: number;
    questionsGenerated?: number;
    duplicatesRemoved?: number;
    currentPrompt?: string;
    lastApiCall?: {
      batchNumber: number;
      responseTime: number;
      tokensUsed: number;
      questionsGenerated: number;
    };
  } | null>(null);
  
  // Detailed generation tracking per generation
  const [generationProgress, setGenerationProgress] = useState<Map<string, {
    generationId: string;
    generationName: string;
    brand: string;
    model: string;
    generation: string;
    totalBatches: number;
    completedBatches: number;
    questionsGenerated: number;
    totalQuestions: number;
    apiCalls: number;
    batches: Map<number, {
      batchNumber: number;
      status: 'pending' | 'running' | 'complete' | 'error';
      questionsGenerated: number;
      rawQuestions: number;
      invalidQuestions: number;
      responseTime?: number;
      tokensUsed?: number;
      prompt?: string;
      error?: string;
    }>;
  }>>(new Map());

  // Step 1.5: Build JSONL from TXT
  const [step1_5Status, setStep1_5Status] = useState<'idle' | 'building' | 'complete' | 'error'>('idle');
  const [step1_5JsonlFileUrl, setStep1_5JsonlFileUrl] = useState<string | null>(null);
  const [step1_5Error, setStep1_5Error] = useState<string | null>(null);
  const [step2Prompts, setStep2Prompts] = useState<{
    systemPrompt: string;
    exampleUserPrompt: string;
    model: string;
    temperature: number;
    maxTokens: number;
    generationContext: { brand: string; model: string; generation: string; generationCode: string | null } | null;
  } | null>(null);

  // Step 2: Submit Batch
  const [step2Status, setStep2Status] = useState<'idle' | 'uploading' | 'complete' | 'error'>('idle');
  const [step2BatchId, setStep2BatchId] = useState<string | null>(null);
  const [step2FileId, setStep2FileId] = useState<string | null>(null);
  const [step2Error, setStep2Error] = useState<string | null>(null);
  const [step2File, setStep2File] = useState<File | null>(null);

  // Step 3: Check Status
  const [step3Status, setStep3Status] = useState<BatchStatus | null>(null);
  const [step3AutoRefresh, setStep3AutoRefresh] = useState(false);

  // Step 4: Build Metadata JSONL (interactive - always available)
  const [step4Status, setStep4Status] = useState<'idle' | 'building' | 'complete' | 'error'>('idle');
  const [step4MetadataFileUrl, setStep4MetadataFileUrl] = useState<string | null>(null);
  const [step4Error, setStep4Error] = useState<string | null>(null);
  const [step4QuestionsFile, setStep4QuestionsFile] = useState<File | null>(null);
  const [step4AnswersFile, setStep4AnswersFile] = useState<File | null>(null);
  const [step4Prompts, setStep4Prompts] = useState<{
    systemPrompt: string;
    exampleUserPrompt: string;
    model: string;
    temperature: number;
    maxTokens: number;
    responseFormat: string;
    generationContext: { brand: string; model: string; generation: string } | null;
  } | null>(null);

  // Step 4.5: Submit Metadata Batch
  const [step4_5Status, setStep4_5Status] = useState<'idle' | 'uploading' | 'complete' | 'error'>('idle');
  const [step4_5BatchId, setStep4_5BatchId] = useState<string | null>(null);
  const [step4_5Error, setStep4_5Error] = useState<string | null>(null);
  const [step4_5MetadataFile, setStep4_5MetadataFile] = useState<File | null>(null);
  
  // Batch tracking for Step 3
  const [batches, setBatches] = useState<Array<{
    id: string;
    name: string;
    status: string;
    type: 'answers' | 'metadata';
    createdAt: string;
    completedAt?: string;
    requestCounts?: { total: number; completed: number; failed: number };
    outputFileId?: string;
    errorFileId?: string;
    metadata?: any;
  }>>([]);

  // Step 5: Import
  const [step5Status, setStep5Status] = useState<'idle' | 'importing' | 'complete' | 'error'>('idle');
  const [step5Progress, setStep5Progress] = useState<{ current: number; total: number } | null>(null);
  const [step5Results, setStep5Results] = useState<{ success: number; failed: number } | null>(null);
  const [step5Error, setStep5Error] = useState<string | null>(null);
  const [step5QuestionsFile, setStep5QuestionsFile] = useState<File | null>(null);
  const [step5AnswersFile, setStep5AnswersFile] = useState<File | null>(null);
  const [step5MetadataFile, setStep5MetadataFile] = useState<File | null>(null);

  const supabase = useMemo(() => {
    try {
      return getSupabaseClient();
    } catch (error: any) {
      console.error('Failed to initialize Supabase client:', error);
      return null;
    }
  }, []);

  // Load functions
  const loadBrands = async () => {
    if (!supabase) {
      setLoadingBrands(false);
      return;
    }
    
    try {
      setLoadingBrands(true);
      const { data, error } = await supabase
        .from('car_brands')
        .select('id, name, slug')
        .order('name');
      
      if (error) throw error;
      setBrands(data || []);
    } catch (err) {
      console.error('Error loading brands:', err);
      setBrands([]);
    } finally {
      setLoadingBrands(false);
    }
  };

  const loadModels = async (brandId: string) => {
    if (!supabase || !brandId) {
      setModels([]);
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('car_models')
        .select('id, name, slug, brand_id')
        .eq('brand_id', brandId)
        .order('name');
      
      if (error) throw error;
      setModels(data || []);
    } catch (err) {
      console.error('Error loading models:', err);
      setModels([]);
    }
  };

  const loadAllModelsForBrands = async (brandIds: string[]) => {
    if (!supabase || brandIds.length === 0) {
      if (brandIds.length === 0) {
        setModels([]);
      }
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('car_models')
        .select('id, name, slug, brand_id')
        .in('brand_id', brandIds)
        .order('name');
      
      if (error) throw error;
      setModels(data || []);
    } catch (err) {
      console.error('Error loading models:', err);
      setModels([]);
    }
  };

  const loadGenerations = async (modelId: string) => {
    if (!supabase || !modelId) {
      setGenerations([]);
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('model_generations')
        .select('id, name, slug, car_model_id, generation_code, year_start, year_end')
        .eq('car_model_id', modelId)
        .order('year_start', { ascending: false });
      
      if (error) throw error;
      setGenerations(data || []);
    } catch (err) {
      console.error('Error loading generations:', err);
      setGenerations([]);
    }
  };

  const loadAllGenerationsForModels = async (modelIds: string[]) => {
    if (!supabase || modelIds.length === 0) {
      if (modelIds.length === 0) {
        setGenerations([]);
      }
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('model_generations')
        .select('id, name, slug, car_model_id, generation_code, year_start, year_end')
        .in('car_model_id', modelIds)
        .order('year_start', { ascending: false });
      
      if (error) throw error;
      setGenerations(data || []);
    } catch (err) {
      console.error('Error loading generations:', err);
      setGenerations([]);
    }
  };

  useEffect(() => {
    if (supabase) {
      loadBrands();
    }
  }, [supabase]);

  useEffect(() => {
    if (selectedBrands.length > 0) {
      loadAllModelsForBrands(selectedBrands);
    } else if (selectedBrand) {
      loadModels(selectedBrand);
    } else {
      setModels([]);
      setGenerations([]);
    }
  }, [selectedBrand, selectedBrands]);

  useEffect(() => {
    if (selectedBrands.length > 0) {
      // Load all generations for all models of selected brands
      const modelIds = models.filter(m => selectedBrands.includes(m.brand_id)).map(m => m.id);
      if (modelIds.length > 0) {
        loadAllGenerationsForModels(modelIds);
      } else {
        setGenerations([]);
      }
    } else if (selectedModel) {
      loadGenerations(selectedModel);
      setSelectedGenerations([]);
    } else {
      setGenerations([]);
      setSelectedGenerations([]);
    }
  }, [selectedModel, selectedBrands, models]);

  // Handle "Select All Generations" toggle
  useEffect(() => {
    if (selectAllGenerations && generations.length > 0) {
      setSelectedGenerations(generations.map(g => g.id));
    } else if (!selectAllGenerations && selectedGenerations.length === generations.length) {
      setSelectedGenerations([]);
    }
  }, [selectAllGenerations, generations]);

  // Auto-refresh batch status
  useEffect(() => {
    if (step3AutoRefresh && step2BatchId) {
      const interval = setInterval(() => {
        handleCheckStatus();
      }, 10000); // Check every 10 seconds
      return () => clearInterval(interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step3AutoRefresh, step2BatchId]);

  // AbortController for canceling Step 1 generation
  const [step1AbortController, setStep1AbortController] = useState<AbortController | null>(null);

  // Step 1: Cancel Generation
  const handleCancelGeneration = () => {
    if (step1AbortController) {
      step1AbortController.abort();
      setStep1AbortController(null);
      setStep1Status('error');
      setStep1Error(t('Generation cancelled by user', 'Generierung vom Benutzer abgebrochen'));
    }
  };

  // Step 1: Generate Questions with Streaming
  const handleGenerateQuestions = async () => {
    const brandIdsToUse = selectedBrands.length > 0 ? selectedBrands : (selectedBrand ? [selectedBrand] : []);
    
    if (brandIdsToUse.length === 0) {
      setStep1Error(t('Please select at least one brand', 'Bitte wählen Sie mindestens eine Marke'));
      return;
    }

    if (selectedGenerations.length === 0) {
      setStep1Error(t('Please select at least one generation', 'Bitte wählen Sie mindestens eine Generation'));
      return;
    }

    if (questionsPerGeneration < 1 || questionsPerGeneration > 50000) {
      setStep1Error(t('Questions per generation must be between 1 and 50,000', 'Fragen pro Generation müssen zwischen 1 und 50.000 liegen'));
      return;
    }

    const totalCount = selectedGenerations.length * questionsPerGeneration;
    if (totalCount > 50000) {
      setStep1Error(t('Total questions (generations × questions per generation) cannot exceed 50,000', 'Gesamtfragen (Generationen × Fragen pro Generation) dürfen 50.000 nicht überschreiten'));
      return;
    }

    setStep1Status('generating');
    setStep1Error(null);
    setStep1Progress({ current: 0, total: totalCount });
    setStep1Details(null);
    setGenerationProgress(new Map()); // Reset generation progress

    // Create AbortController for cancellation
    const abortController = new AbortController();
    setStep1AbortController(abortController);

    try {
      const response = await fetch('/api/mass-generation/generate-questions-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandIds: brandIdsToUse,
          generationIds: selectedGenerations,
          contentType,
          questionsPerGeneration,
          language,
        }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        throw new Error(t('Failed to start question generation', 'Fehler beim Starten der Fragengenerierung'));
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error(t('Failed to read response stream', 'Fehler beim Lesen des Antwort-Streams'));
      }

      while (true) {
        // Check if cancelled
        if (abortController.signal.aborted) {
          reader.cancel();
          break;
        }

        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              switch (data.type) {
                case 'init':
                  setStep1Details({
                    totalApiCalls: data.estimatedApiCalls,
                    apiCalls: 0,
                  });
                  break;
                
                case 'generation_start':
                  // Initialize generation progress tracking
                  setGenerationProgress(prev => {
                    const newMap = new Map(prev);
                    newMap.set(data.generationId, {
                      generationId: data.generationId,
                      generationName: `${data.brand} ${data.model} ${data.generation}`,
                      brand: data.brand,
                      model: data.model,
                      generation: data.generation,
                      totalBatches: data.totalBatches,
                      completedBatches: 0,
                      questionsGenerated: 0,
                      totalQuestions: data.totalQuestions,
                      apiCalls: 0,
                      batches: new Map(),
                    });
                    return newMap;
                  });
                  setStep1Details(prev => ({
                    ...prev,
                    currentGeneration: `${data.brand} ${data.model} ${data.generation}`,
                    currentBatch: 0,
                    totalBatches: data.totalBatches,
                    currentPrompt: data.prompt,
                  }));
                  break;
                
                case 'api_call_start':
                  // Update batch status to running
                  setGenerationProgress(prev => {
                    const newMap = new Map(prev);
                    const gen = newMap.get(data.generationId);
                    if (gen) {
                      const batches = new Map(gen.batches);
                      batches.set(data.batchNumber, {
                        batchNumber: data.batchNumber,
                        status: 'running',
                        questionsGenerated: 0,
                        rawQuestions: 0,
                        invalidQuestions: 0,
                        prompt: data.fullPrompt || data.systemPrompt + '\n\n' + data.userPrompt,
                      });
                      newMap.set(data.generationId, {
                        ...gen,
                        batches,
                      });
                    }
                    return newMap;
                  });
                  setStep1Details(prev => ({
                    ...prev,
                    currentBatch: data.batchNumber,
                    totalBatches: data.totalBatches,
                    currentPrompt: data.fullPrompt || data.systemPrompt + '\n\n' + data.userPrompt,
                  }));
                  break;
                
                case 'api_call_complete':
                  // Update batch status to complete
                  setGenerationProgress(prev => {
                    const newMap = new Map(prev);
                    const gen = newMap.get(data.generationId);
                    if (gen) {
                      const batches = new Map(gen.batches);
                      const existingBatch = batches.get(data.batchNumber) || {
                        batchNumber: data.batchNumber,
                        status: 'complete' as const,
                        questionsGenerated: 0,
                        rawQuestions: 0,
                        invalidQuestions: 0,
                      };
                      batches.set(data.batchNumber, {
                        ...existingBatch,
                        status: 'complete',
                        questionsGenerated: data.questionsGenerated,
                        rawQuestions: data.rawQuestionsGenerated || data.questionsGenerated,
                        invalidQuestions: data.invalidQuestions || 0,
                        responseTime: data.responseTime,
                        tokensUsed: data.tokensUsed,
                      });
                      newMap.set(data.generationId, {
                        ...gen,
                        completedBatches: gen.completedBatches + 1,
                        questionsGenerated: data.totalQuestionsSoFar || (gen.questionsGenerated + data.questionsGenerated),
                        apiCalls: gen.apiCalls + 1,
                        batches,
                      });
                    }
                    return newMap;
                  });
                  setStep1Details(prev => ({
                    ...prev,
                    apiCalls: (prev?.apiCalls || 0) + 1,
                    questionsGenerated: data.totalQuestionsSoFar,
                    lastApiCall: {
                      batchNumber: data.batchNumber,
                      responseTime: data.responseTime,
                      tokensUsed: data.tokensUsed,
                      questionsGenerated: data.questionsGenerated,
                    },
                  }));
                  setStep1Progress({
                    current: data.totalQuestionsSoFar,
                    total: totalCount,
                  });
                  break;
                
                case 'validation_results':
                  // Update batch with validation results
                  setGenerationProgress(prev => {
                    const newMap = new Map(prev);
                    const gen = newMap.get(data.generationId);
                    if (gen) {
                      const batches = new Map(gen.batches);
                      const existingBatch = batches.get(data.batchNumber);
                      if (existingBatch) {
                        batches.set(data.batchNumber, {
                          ...existingBatch,
                          questionsGenerated: data.valid,
                          invalidQuestions: data.invalid,
                        });
                      }
                      newMap.set(data.generationId, {
                        ...gen,
                        batches,
                      });
                    }
                    return newMap;
                  });
                  break;
                
                case 'generation_complete':
                  setGenerationProgress(prev => {
                    const newMap = new Map(prev);
                    const gen = newMap.get(data.generationId);
                    if (gen) {
                      newMap.set(data.generationId, {
                        ...gen,
                        questionsGenerated: data.totalQuestions,
                        apiCalls: data.totalApiCalls || gen.apiCalls,
                      });
                    }
                    return newMap;
                  });
                  setStep1Details(prev => ({
                    ...prev,
                    duplicatesRemoved: data.duplicatesRemoved,
                    totalApiCalls: data.totalApiCalls,
                  }));
                  break;
                
                case 'complete':
                  setStep1FileUrl(data.fileUrl);
                  setStep1Status('complete');
                  setStep1Progress({ current: data.count, total: totalCount });
                  setStep1AbortController(null); // Clear abort controller on completion
                  break;
                
                case 'error':
                  // Mark batch as error if generationId is provided
                  if (data.generationId) {
                    setGenerationProgress(prev => {
                      const newMap = new Map(prev);
                      const gen = newMap.get(data.generationId);
                      if (gen && data.batchNumber) {
                        const batches = new Map(gen.batches);
                        batches.set(data.batchNumber, {
                          batchNumber: data.batchNumber,
                          status: 'error',
                          questionsGenerated: 0,
                          rawQuestions: 0,
                          invalidQuestions: 0,
                          error: data.error,
                        });
                        newMap.set(data.generationId, {
                          ...gen,
                          batches,
                        });
                      }
                      return newMap;
                    });
                  }
                  if (data.error && !data.generationId) {
                    throw new Error(data.error);
                  }
                  break;
              }
            } catch (e) {
              console.error('Error parsing SSE data:', e);
            }
          }
        }
      }
    } catch (error: any) {
      console.error('Error generating questions:', error);
      // Don't show error if it was cancelled
      if (error.name === 'AbortError' || abortController.signal.aborted) {
        setStep1Error(t('Generation cancelled', 'Generierung abgebrochen'));
      } else {
        setStep1Error(error.message || t('Unknown error', 'Unbekannter Fehler'));
      }
      setStep1Status('error');
      setStep1AbortController(null);
    }
  };

  // Step 1.5: Build JSONL from TXT
  const handleBuildJsonl = async () => {
    if (!step1FileUrl || !step1FileUrl.endsWith('.txt')) {
      setStep1_5Error(t('Please complete Step 1 first and ensure it generated a TXT file', 'Bitte vervollständigen Sie zuerst Schritt 1 und stellen Sie sicher, dass eine TXT-Datei generiert wurde'));
      return;
    }

    setStep1_5Status('building');
    setStep1_5Error(null);

    try {
      const response = await fetch('/api/mass-generation/build-jsonl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionsFileUrl: step1FileUrl,
          contentType,
          brandIds: selectedBrands.length > 0 ? selectedBrands : (selectedBrand ? [selectedBrand] : []),
          generationIds: selectedGenerations,
          questionsPerGeneration,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || t('Failed to build JSONL', 'Fehler beim Erstellen des JSONL'));
      }

      const data = await response.json();
      setStep1_5JsonlFileUrl(data.fileUrl);
      if (data.prompts) {
        setStep2Prompts(data.prompts);
      }
      setStep1_5Status('complete');
    } catch (error: any) {
      console.error('Error building JSONL:', error);
      setStep1_5Error(error.message || t('Unknown error', 'Unbekannter Fehler'));
      setStep1_5Status('error');
    }
  };

  // Step 2: Submit Batch
  const handleSubmitBatch = async () => {
    // Require manual file upload
    if (!step2File) {
      setStep2Error(t('Please upload a JSONL file', 'Bitte laden Sie eine JSONL-Datei hoch'));
      return;
    }

    setStep2Status('uploading');
    setStep2Error(null);

    try {
      const formData = new FormData();
      formData.append('file', step2File);
      formData.append('contentType', contentType);
      formData.append('batchName', `Answers Batch ${step2File.name.replace('.jsonl', '')}`);
      if (selectedBrand) formData.append('brandId', selectedBrand);
      if (selectedModel) formData.append('modelId', selectedModel);
      if (selectedGeneration) formData.append('generationId', selectedGeneration);

      const response = await fetch('/api/mass-generation/submit-batch', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || t('Failed to submit batch', 'Fehler beim Senden des Batches'));
      }

      const data = await response.json();
      setStep2BatchId(data.batchId);
      setStep2FileId(data.fileId);
      setStep2Status('complete');
      
      // Add to batches list
      setBatches(prev => [...prev, {
        id: data.batchId,
        name: data.batchName || `Answers Batch ${step2File.name}`,
        status: data.status,
        type: 'answers',
        createdAt: new Date().toISOString(),
        metadata: { contentType, brandId: selectedBrand, modelId: selectedModel, generationId: selectedGeneration },
      }]);
    } catch (error: any) {
      console.error('Error submitting batch:', error);
      setStep2Error(error.message || t('Unknown error', 'Unbekannter Fehler'));
      setStep2Status('error');
    }
  };

  // Step 3: Check Status
  const handleCheckStatus = async () => {
    if (!step2BatchId) {
      return;
    }

    try {
      const response = await fetch(`/api/mass-generation/check-status?batchId=${step2BatchId}`);
      if (!response.ok) {
        throw new Error(t('Failed to check status', 'Fehler beim Überprüfen des Status'));
      }

      const data = await response.json();
      setStep3Status(data);
    } catch (error: any) {
      console.error('Error checking status:', error);
    }
  };

  // Step 4: Build Metadata JSONL (interactive - combines questions and answers)
  const handleBuildMetadataJsonl = async () => {
    if (!step4QuestionsFile) {
      setStep4Error(t('Please upload a questions JSONL file', 'Bitte laden Sie eine Fragen-JSONL-Datei hoch'));
      return;
    }

    if (!step4AnswersFile) {
      setStep4Error(t('Please upload an answers JSONL file', 'Bitte laden Sie eine Antworten-JSONL-Datei hoch'));
      return;
    }

    setStep4Status('building');
    setStep4Error(null);

    try {
      // Upload both files
      const formData = new FormData();
      formData.append('questionsFile', step4QuestionsFile);
      formData.append('answersFile', step4AnswersFile);
      formData.append('contentType', contentType);
      formData.append('generationIds', JSON.stringify(selectedGenerations));

      const response = await fetch('/api/mass-generation/build-metadata-jsonl', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || t('Failed to build metadata JSONL', 'Fehler beim Erstellen der Metadaten-JSONL'));
      }

      const data = await response.json();
      setStep4MetadataFileUrl(data.fileUrl);
      if (data.prompts) {
        setStep4Prompts(data.prompts);
      }
      setStep4Status('complete');
    } catch (error: any) {
      console.error('Error building metadata JSONL:', error);
      setStep4Error(error.message || t('Unknown error', 'Unbekannter Fehler'));
      setStep4Status('error');
    }
  };

  // Step 4.5: Submit Metadata Batch to OpenAI
  const handleSubmitMetadataBatch = async () => {
    // Try to get file from upload or from step4MetadataFileUrl
    let fileToUse: File | null = step4_5MetadataFile;
    
    if (!fileToUse && step4MetadataFileUrl) {
      try {
        const response = await fetch(step4MetadataFileUrl);
        const blob = await response.blob();
        const filename = step4MetadataFileUrl.split('/').pop() || 'metadata.jsonl';
        fileToUse = new File([blob], filename, { type: 'application/jsonl' });
      } catch (err) {
        console.error('Failed to fetch file from URL:', err);
      }
    }

    if (!fileToUse) {
      setStep4_5Error(t('Please upload a metadata JSONL file', 'Bitte laden Sie eine Metadaten-JSONL-Datei hoch'));
      return;
    }

    setStep4_5Status('uploading');
    setStep4_5Error(null);

    try {
      const formData = new FormData();
      formData.append('file', fileToUse);
      formData.append('contentType', contentType);
      formData.append('batchName', `Metadata Batch ${fileToUse.name.replace('.jsonl', '')}`);
      if (selectedBrand) formData.append('brandId', selectedBrand);
      if (selectedModel) formData.append('modelId', selectedModel);
      if (selectedGeneration) formData.append('generationId', selectedGeneration);

      const response = await fetch('/api/mass-generation/submit-batch', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorData: any = {};
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText || 'Unknown error' };
        }
        console.error('Submit batch error response:', errorData);
        throw new Error(errorData.error || errorText || t('Failed to submit metadata batch', 'Fehler beim Senden des Metadaten-Batches'));
      }

      const data = await response.json();
      setStep4_5BatchId(data.batchId);
      
      // Add to batches list
      setBatches(prev => [...prev, {
        id: data.batchId,
        name: data.batchName || `Metadata Batch ${fileToUse.name}`,
        status: data.status,
        type: 'metadata',
        createdAt: new Date().toISOString(),
        metadata: { contentType, brandId: selectedBrand, modelId: selectedModel, generationId: selectedGeneration },
      }]);
      
      setStep4_5Status('complete');
    } catch (error: any) {
      console.error('Error submitting metadata batch:', error);
      setStep4_5Error(error.message || t('Unknown error', 'Unbekannter Fehler'));
      setStep4_5Status('error');
    }
  };

  // Step 5: Import
  const handleImport = async () => {
    if (!step5QuestionsFile) {
      setStep5Error(t('Please upload a questions JSONL file', 'Bitte laden Sie eine Fragen-JSONL-Datei hoch'));
      return;
    }

    if (!step5AnswersFile) {
      setStep5Error(t('Please upload an answers JSONL file', 'Bitte laden Sie eine Antworten-JSONL-Datei hoch'));
      return;
    }

    if (!step5MetadataFile) {
      setStep5Error(t('Please upload a metadata JSONL file', 'Bitte laden Sie eine Metadaten-JSONL-Datei hoch'));
      return;
    }

    setStep5Status('importing');
    setStep5Error(null);
    setStep5Progress({ current: 0, total: 0 });

    try {
      const formData = new FormData();
      formData.append('questionsFile', step5QuestionsFile);
      formData.append('answersFile', step5AnswersFile);
      formData.append('metadataFile', step5MetadataFile);
      formData.append('contentType', contentType);
      formData.append('generationIds', JSON.stringify(selectedGenerations));
      formData.append('questionsPerGeneration', questionsPerGeneration.toString());
      formData.append('language', language);

      const response = await fetch('/api/mass-generation/import', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || t('Failed to import', 'Fehler beim Importieren'));
      }

      const data = await response.json();
      setStep5Results({ success: data.success, failed: data.failed });
      setStep5Progress({ current: data.success + data.failed, total: data.success + data.failed });
      setStep5Status('complete');
    } catch (error: any) {
      console.error('Error importing:', error);
      setStep5Error(error.message || t('Unknown error', 'Unbekannter Fehler'));
      setStep5Status('error');
    }
  };

  const selectedBrandData = brands.find(b => b.id === selectedBrand);
  const selectedModelData = models.find(m => m.id === selectedModel);
  const selectedGenerationData = generations.find(g => g.id === selectedGeneration);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-black dark:to-slate-950 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">
              {t('Mass Generation', 'Massen-Generierung')}
            </h1>
            <Link
              href={`/${lang}/carbulk`}
              className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-700 transition-all text-sm font-medium"
            >
              ← {t('Back to Bulk Generator', 'Zurück zum Bulk-Generator')}
            </Link>
          </div>
          <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base">
            {t(
              'Scalable mass generation system for processing up to 1 million pages. Process in steps: Generate questions, submit batches, check status, generate metadata, and import.',
              'Skalierbares Massen-Generierungssystem für die Verarbeitung von bis zu 1 Million Seiten. Verarbeiten Sie in Schritten: Fragen generieren, Batches senden, Status überprüfen, Metadaten generieren und importieren.'
            )}
          </p>
        </div>

        {/* Configuration */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 mb-8 shadow-lg">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">{t('Configuration', 'Konfiguration')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                {t('Content Type', 'Inhaltstyp')}
              </label>
              <select
                value={contentType}
                onChange={(e) => setContentType(e.target.value as 'fault' | 'manual')}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
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
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="en">English</option>
                <option value="de">Deutsch</option>
              </select>
            </div>

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
                                const gensToRemove = generations.filter(g => modelsToRemove.includes(g.car_model_id)).map(g => g.id);
                                setSelectedGenerations(selectedGenerations.filter(id => !gensToRemove.includes(id)));
                              }
                            }}
                            disabled={loadingBrands}
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
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t('Select one or more brands. All models and generations from selected brands will be available.', 'Wählen Sie eine oder mehrere Marken aus. Alle Modelle und Generationen der ausgewählten Marken werden verfügbar sein.')}
              </p>
            </div>

            <div className="md:col-span-2">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  {t('Select Generations', 'Generationen auswählen')} ({selectedGenerations.length} {t('selected', 'ausgewählt')})
                </label>
                {generations.length > 0 && (
                  <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectAllGenerations}
                      onChange={(e) => {
                        setSelectAllGenerations(e.target.checked);
                        if (e.target.checked) {
                          setSelectedGenerations(generations.map(g => g.id));
                        } else {
                          setSelectedGenerations([]);
                        }
                      }}
                      className="w-4 h-4 text-red-600 border-slate-300 rounded focus:ring-red-500"
                    />
                    <span className="font-medium">{t('Select All', 'Alle auswählen')} ({generations.length})</span>
                  </label>
                )}
              </div>
              <div className="max-h-64 overflow-y-auto border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 p-2">
                {generations.length === 0 ? (
                  <p className="text-sm text-slate-500 dark:text-slate-400 p-4 text-center">
                    {selectedBrands.length === 0
                      ? t('Select brands first to see generations', 'Wählen Sie zuerst Marken aus, um Generationen zu sehen')
                      : t('No generations available for selected brands', 'Keine Generationen für ausgewählte Marken verfügbar')}
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
                            disabled={selectedBrands.length === 0 && !selectedBrand}
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
                  {t('Total questions', 'Gesamtfragen')}: {selectedGenerations.length} {t('generations', 'Generationen')} × {questionsPerGeneration.toLocaleString()} = {(selectedGenerations.length * questionsPerGeneration).toLocaleString()} {t('questions', 'Fragen')}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                {t('Questions per Generation', 'Fragen pro Generation')} (max: 50,000)
              </label>
              <input
                type="number"
                min="1"
                max="50000"
                value={questionsPerGeneration}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 1;
                  setQuestionsPerGeneration(Math.max(1, Math.min(50000, val)));
                }}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {t('Each selected generation will get this many questions', 'Jede ausgewählte Generation erhält diese Anzahl Fragen')}
              </div>
            </div>
          </div>
        </div>

        {/* Step 1: Generate Questions */}
        <StepCard
          step={1}
          title={t('Step 1: Generate Questions', 'Schritt 1: Fragen generieren')}
          description={t('Generate questions and save as JSON-L file', 'Fragen generieren und als JSON-L-Datei speichern')}
          status={step1Status}
          error={step1Error}
          progress={step1Progress}
          onAction={handleGenerateQuestions}
          actionLabel={t('Generate Questions', 'Fragen generieren')}
          disabled={(selectedBrands.length === 0 && !selectedBrand) || selectedGenerations.length === 0}
          onCancel={handleCancelGeneration}
          canCancel={step1Status === 'generating'}
          fileUrl={step1FileUrl}
          details={step1Details}
          generationProgress={generationProgress}
          t={t}
        />

        {/* Step 1.5: Build JSONL from TXT */}
        {step1FileUrl && step1FileUrl.endsWith('.txt') && (
          <StepCard
            step={1.5}
            title={t('Step 1.5: Build JSONL from TXT', 'Schritt 1.5: JSONL aus TXT erstellen')}
            description={t('Convert TXT questions file to JSONL format for batch processing', 'TXT-Fragendatei in JSONL-Format für Batch-Verarbeitung konvertieren')}
            status={step1_5Status}
            error={step1_5Error}
            onAction={handleBuildJsonl}
            actionLabel={t('Build JSONL', 'JSONL erstellen')}
            disabled={step1Status !== 'complete'}
            fileUrl={step1_5JsonlFileUrl}
            t={t}
          />
        )}

        {/* Step 2: Submit Batch */}
        <StepCard
          step={2}
          title={t('Step 2: Submit Batch to OpenAI', 'Schritt 2: Batch an OpenAI senden')}
          description={t('Upload JSON-L file and create batch job', 'JSON-L-Datei hochladen und Batch-Job erstellen')}
          status={step2Status}
          error={step2Error}
          onAction={handleSubmitBatch}
          actionLabel={t('Submit Batch', 'Batch senden')}
          disabled={false}
          batchId={step2BatchId}
          step2File={step2File}
          onStep2FileChange={setStep2File}
          step1_5JsonlFileUrl={step1_5JsonlFileUrl}
          step1FileUrl={step1FileUrl}
          step2Prompts={step2Prompts}
          t={t}
        />

        {/* Step 3: Check Status */}
        <StepCard
          step={3}
          title={t('Step 3: Check Batch Status', 'Schritt 3: Batch-Status überprüfen')}
          description={t('Monitor batch processing status', 'Batch-Verarbeitungsstatus überwachen')}
          status={step3Status?.status === 'completed' ? 'complete' : step3Status ? 'generating' : 'idle'}
          onAction={handleCheckStatus}
          actionLabel={t('Check Status', 'Status überprüfen')}
          disabled={batches.length === 0 && !step2BatchId}
          batchStatus={step3Status}
          autoRefresh={step3AutoRefresh}
          onAutoRefreshChange={setStep3AutoRefresh}
          batches={batches}
          onDownloadBatch={async (batchId, fileId) => {
            const url = `/api/mass-generation/download-batch-output?batchId=${batchId}${fileId ? `&fileId=${fileId}` : ''}`;
            window.open(url, '_blank');
          }}
          t={t}
        />

        {/* Step 4: Build Metadata JSONL (Interactive) */}
        <StepCard
          step={4}
          title={t('Step 4: Build Metadata JSONL', 'Schritt 4: Metadaten-JSONL erstellen')}
          description={t('Combine questions JSONL and answers JSONL to create metadata batch file', 'Fragen-JSONL und Antworten-JSONL kombinieren, um Metadaten-Batch-Datei zu erstellen')}
          status={step4Status}
          error={step4Error}
          onAction={handleBuildMetadataJsonl}
          actionLabel={t('Build Metadata JSONL', 'Metadaten-JSONL erstellen')}
          disabled={false}
          fileUrl={step4MetadataFileUrl}
          step4QuestionsFile={step4QuestionsFile}
          step4AnswersFile={step4AnswersFile}
          onStep4QuestionsFileChange={setStep4QuestionsFile}
          onStep4AnswersFileChange={setStep4AnswersFile}
          step4Prompts={step4Prompts}
          t={t}
        />

        {/* Step 4.5: Submit Metadata Batch */}
        <StepCard
          step={4.5}
          title={t('Step 4.5: Submit Metadata Batch', 'Schritt 4.5: Metadaten-Batch senden')}
          description={t('Upload metadata JSONL file and create batch job at OpenAI', 'Metadaten-JSONL-Datei hochladen und Batch-Job bei OpenAI erstellen')}
          status={step4_5Status}
          error={step4_5Error}
          onAction={handleSubmitMetadataBatch}
          actionLabel={t('Submit Metadata Batch', 'Metadaten-Batch senden')}
          disabled={false}
          batchId={step4_5BatchId}
          step4_5MetadataFile={step4_5MetadataFile}
          onStep4_5MetadataFileChange={setStep4_5MetadataFile}
          step4MetadataFileUrl={step4MetadataFileUrl}
          t={t}
        />

        {/* Step 5: Import */}
        <StepCard
          step={5}
          title={t('Step 5: Import to Database', 'Schritt 5: In Datenbank importieren')}
          description={t('Efficiently import all data into the system', 'Alle Daten effizient ins System importieren')}
          status={step5Status}
          error={step5Error}
          progress={step5Progress}
          onAction={handleImport}
          actionLabel={t('Import Data', 'Daten importieren')}
          disabled={false}
          results={step5Results}
          step5QuestionsFile={step5QuestionsFile}
          step5AnswersFile={step5AnswersFile}
          step5MetadataFile={step5MetadataFile}
          onStep5QuestionsFileChange={setStep5QuestionsFile}
          onStep5AnswersFileChange={setStep5AnswersFile}
          onStep5MetadataFileChange={setStep5MetadataFile}
          t={t}
        />
      </div>
    </div>
  );
}

function StepCard({
  step,
  title,
  description,
  status,
  error,
  progress,
  onAction,
  actionLabel,
  disabled,
  fileUrl,
  batchId,
  batchStatus,
  autoRefresh,
  onAutoRefreshChange,
  results,
  details,
  generationProgress,
  step4QuestionsFile,
  step4AnswersFile,
  onStep4QuestionsFileChange,
  onStep4AnswersFileChange,
  step5QuestionsFile,
  step5AnswersFile,
  step5MetadataFile,
  onStep5QuestionsFileChange,
  onStep5AnswersFileChange,
  onStep5MetadataFileChange,
  step2File,
  onStep2FileChange,
  step1_5JsonlFileUrl,
  step1FileUrl,
  step4_5MetadataFile,
  onStep4_5MetadataFileChange,
  step4MetadataFileUrl,
  step2Prompts,
  step4Prompts,
  batches,
  onDownloadBatch,
  onCancel,
  canCancel,
  t,
}: StepCardProps) {
  const statusColors = {
    idle: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400',
    generating: 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300',
    uploading: 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300',
    importing: 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300',
    building: 'bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-300',
    complete: 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300',
    error: 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300',
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 mb-8 shadow-lg">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
              status === 'complete' ? 'bg-green-500 text-white' :
              status === 'error' ? 'bg-red-500 text-white' :
              ['generating', 'uploading', 'importing'].includes(status) ? 'bg-blue-500 text-white animate-pulse' :
              'bg-slate-300 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
            }`}>
              {step}
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">{title}</h3>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[status]}`}>
              {status === 'idle' ? t('Ready', 'Bereit') :
               status === 'generating' ? t('Generating...', 'Generiere...') :
               status === 'uploading' ? t('Uploading...', 'Lade hoch...') :
               status === 'importing' ? t('Importing...', 'Importiere...') :
               status === 'building' ? t('Building...', 'Erstelle...') :
               status === 'complete' ? t('Complete', 'Abgeschlossen') :
               t('Error', 'Fehler')}
            </span>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 ml-13">{description}</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-lg">
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {/* Step 2: File Upload for JSONL */}
      {step === 2 && step2File !== undefined && (
        <div className="mb-4">
          <FileUpload
            label={t('Questions JSONL File', 'Fragen-JSONL-Datei')}
            accept=".jsonl"
            file={step2File || null}
            onFileChange={onStep2FileChange || (() => {})}
            required
            t={t}
          />
          {(step1_5JsonlFileUrl || step1FileUrl) && !step2File && (
            <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              {t('Or use the file from Step 1.5', 'Oder verwenden Sie die Datei aus Schritt 1.5')}: <a href={step1_5JsonlFileUrl || step1FileUrl || ''} download className="text-blue-600 dark:text-blue-400 hover:underline">{(step1_5JsonlFileUrl || step1FileUrl)?.split('/').pop()}</a>
            </div>
          )}
        </div>
      )}

      {/* Step 2: Show Prompts */}
      {step === 2 && step2Prompts && (
        <div className="mb-4 space-y-4 border-t border-slate-200 dark:border-slate-700 pt-4">
          <h4 className="font-semibold text-slate-900 dark:text-white">{t('Answer Generation Prompts', 'Antwort-Generierungs-Prompts')}</h4>
          
          {step2Prompts.generationContext && (
            <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="text-xs font-medium text-blue-900 dark:text-blue-200 mb-1">{t('Generation Context', 'Generation-Kontext')}:</div>
              <div className="text-sm text-blue-800 dark:text-blue-300">
                {step2Prompts.generationContext.brand} {step2Prompts.generationContext.model} {step2Prompts.generationContext.generation}
                {step2Prompts.generationContext.generationCode && ` (${step2Prompts.generationContext.generationCode})`}
              </div>
            </div>
          )}

          <details className="border border-slate-200 dark:border-slate-700 rounded-lg">
            <summary className="p-3 bg-slate-50 dark:bg-slate-800 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 font-medium text-slate-900 dark:text-white">
              {t('System Prompt', 'System-Prompt')} ({step2Prompts.model}, temp: {step2Prompts.temperature}, max_tokens: {step2Prompts.maxTokens})
            </summary>
            <div className="p-4 bg-white dark:bg-slate-900">
              <pre className="text-xs text-slate-700 dark:text-slate-300 overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed">
                {step2Prompts.systemPrompt}
              </pre>
            </div>
          </details>

          <details className="border border-slate-200 dark:border-slate-700 rounded-lg">
            <summary className="p-3 bg-slate-50 dark:bg-slate-800 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 font-medium text-slate-900 dark:text-white">
              {t('Example User Prompt', 'Beispiel-User-Prompt')}
            </summary>
            <div className="p-4 bg-white dark:bg-slate-900">
              <pre className="text-xs text-slate-700 dark:text-slate-300 overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed">
                {step2Prompts.exampleUserPrompt}
              </pre>
            </div>
          </details>
        </div>
      )}

      {/* Step 4: File Uploads for Questions and Answers */}
      {step === 4 && step4QuestionsFile !== undefined && (
        <div className="mb-4 space-y-4">
          <FileUpload
            label={t('Questions JSONL File', 'Fragen-JSONL-Datei')}
            accept=".jsonl"
            file={step4QuestionsFile || null}
            onFileChange={onStep4QuestionsFileChange || (() => {})}
            required
            t={t}
          />
          <FileUpload
            label={t('Answers JSONL File', 'Antworten-JSONL-Datei')}
            accept=".jsonl"
            file={step4AnswersFile || null}
            onFileChange={onStep4AnswersFileChange || (() => {})}
            required
            t={t}
          />
        </div>
      )}

      {/* Step 4: Show Prompts */}
      {step === 4 && step4Prompts && (
        <div className="mb-4 space-y-4 border-t border-slate-200 dark:border-slate-700 pt-4">
          <h4 className="font-semibold text-slate-900 dark:text-white">{t('Metadata Generation Prompts', 'Metadaten-Generierungs-Prompts')}</h4>
          
          {step4Prompts.generationContext && (
            <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="text-xs font-medium text-blue-900 dark:text-blue-200 mb-1">{t('Generation Context', 'Generation-Kontext')}:</div>
              <div className="text-sm text-blue-800 dark:text-blue-300">
                {step4Prompts.generationContext.brand} {step4Prompts.generationContext.model} {step4Prompts.generationContext.generation}
              </div>
            </div>
          )}

          <details className="border border-slate-200 dark:border-slate-700 rounded-lg">
            <summary className="p-3 bg-slate-50 dark:bg-slate-800 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 font-medium text-slate-900 dark:text-white">
              {t('System Prompt', 'System-Prompt')} ({step4Prompts.model}, temp: {step4Prompts.temperature}, max_tokens: {step4Prompts.maxTokens}, format: {step4Prompts.responseFormat})
            </summary>
            <div className="p-4 bg-white dark:bg-slate-900">
              <pre className="text-xs text-slate-700 dark:text-slate-300 overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed">
                {step4Prompts.systemPrompt}
              </pre>
            </div>
          </details>

          <details className="border border-slate-200 dark:border-slate-700 rounded-lg">
            <summary className="p-3 bg-slate-50 dark:bg-slate-800 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 font-medium text-slate-900 dark:text-white">
              {t('Example User Prompt', 'Beispiel-User-Prompt')}
            </summary>
            <div className="p-4 bg-white dark:bg-slate-900">
              <pre className="text-xs text-slate-700 dark:text-slate-300 overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed max-h-96 overflow-y-auto">
                {step4Prompts.exampleUserPrompt}
              </pre>
            </div>
          </details>
        </div>
      )}

      {/* Step 4.5: File Upload for Metadata */}
      {step === 4.5 && step4_5MetadataFile !== undefined && (
        <div className="mb-4">
          <FileUpload
            label={t('Metadata JSONL File', 'Metadaten-JSONL-Datei')}
            accept=".jsonl"
            file={step4_5MetadataFile || null}
            onFileChange={onStep4_5MetadataFileChange || (() => {})}
            required
            t={t}
          />
          {step4MetadataFileUrl && !step4_5MetadataFile && (
            <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              {t('Or use the file from Step 4', 'Oder verwenden Sie die Datei aus Schritt 4')}: <a href={step4MetadataFileUrl} download className="text-blue-600 dark:text-blue-400 hover:underline">{step4MetadataFileUrl.split('/').pop()}</a>
            </div>
          )}
        </div>
      )}

      {/* Step 5: File Uploads for Questions, Answers, and Metadata */}
      {step === 5 && step5QuestionsFile !== undefined && (
        <div className="mb-4 space-y-4">
          <FileUpload
            label={t('Questions JSONL File', 'Fragen-JSONL-Datei')}
            accept=".jsonl"
            file={step5QuestionsFile || null}
            onFileChange={onStep5QuestionsFileChange || (() => {})}
            required
            t={t}
          />
          <FileUpload
            label={t('Answers JSONL File (from OpenAI Batch)', 'Antworten-JSONL-Datei (von OpenAI Batch)')}
            accept=".jsonl"
            file={step5AnswersFile || null}
            onFileChange={onStep5AnswersFileChange || (() => {})}
            required
            t={t}
          />
          <FileUpload
            label={t('Metadata JSONL File (from Metadata Batch)', 'Metadaten-JSONL-Datei (von Metadaten-Batch)')}
            accept=".jsonl"
            file={step5MetadataFile || null}
            onFileChange={onStep5MetadataFileChange || (() => {})}
            required
            t={t}
          />
        </div>
      )}

      {progress && (
        <div className="mb-4">
          <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400 mb-2">
            <span>{progress.current} / {progress.total}</span>
            <span>{Math.round((progress.current / progress.total) * 100)}%</span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
            <div
              className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all"
              style={{ width: `${Math.min(100, (progress.current / progress.total) * 100)}%` }}
            />
          </div>
        </div>
      )}

      {batchStatus && (
        <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-2">
            {t('Batch Status', 'Batch-Status')}
          </div>
          <div className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                <div><strong>{t('Status', 'Status')}:</strong> {batchStatus.status}</div>
                {batchStatus.request_counts && (
                  <>
                    <div><strong>{t('Total', 'Gesamt')}:</strong> {batchStatus.request_counts.total}</div>
                    <div><strong>{t('Completed', 'Abgeschlossen')}:</strong> {batchStatus.request_counts.completed}</div>
                    {batchStatus.request_counts.failed > 0 && (
                      <div><strong>{t('Failed', 'Fehlgeschlagen')}:</strong> {batchStatus.request_counts.failed}</div>
                    )}
                  </>
                )}
                {batchId && (
                  <div className="mt-2 font-mono text-[10px] break-all">
                    <strong>{t('Batch ID', 'Batch-ID')}:</strong> {batchId}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Command Center - Detailed Generation View */}
      {generationProgress && generationProgress.size > 0 && (
        <div className="mb-6 p-8 bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 border-4 border-blue-400 dark:border-blue-600 rounded-2xl shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-1">
              {t('Command Center', 'Kommandoszentrale')} - {t('Generation Progress', 'Generierungsfortschritt')}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {t('Real-time monitoring of question generation per generation', 'Echtzeit-Überwachung der Fragengenerierung pro Generation')}
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {Array.from(generationProgress.values()).reduce((sum, g) => sum + g.completedBatches, 0)} / {Array.from(generationProgress.values()).reduce((sum, g) => sum + g.totalBatches, 0)}
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-400">
                {t('Batches Complete', 'Batches abgeschlossen')}
              </div>
              <div className="text-sm font-medium text-slate-700 dark:text-slate-300 mt-1">
                {Array.from(generationProgress.values()).reduce((sum, g) => sum + g.questionsGenerated, 0).toLocaleString()} / {Array.from(generationProgress.values()).reduce((sum, g) => sum + g.totalQuestions, 0).toLocaleString()} {t('Questions', 'Fragen')}
              </div>
            </div>
          </div>
          
          <div className="space-y-6 max-h-[800px] overflow-y-auto pr-2">
            {Array.from(generationProgress.values()).map((gen) => (
              <div key={gen.generationId} className="bg-white dark:bg-slate-800 rounded-xl border-2 border-slate-300 dark:border-slate-600 p-6 shadow-lg">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                      {gen.generationName}
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div className="bg-slate-50 dark:bg-slate-700/50 p-2 rounded">
                        <div className="text-xs text-slate-500 dark:text-slate-400">{t('Total Questions', 'Gesamtfragen')}</div>
                        <div className="font-bold text-slate-900 dark:text-white">{gen.totalQuestions.toLocaleString()}</div>
                      </div>
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
                        <div className="text-xs text-blue-600 dark:text-blue-400">{t('Generated', 'Generiert')}</div>
                        <div className="font-bold text-blue-700 dark:text-blue-300">{gen.questionsGenerated.toLocaleString()} <span className="text-xs">({Math.round((gen.questionsGenerated / gen.totalQuestions) * 100)}%)</span></div>
                      </div>
                      <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded">
                        <div className="text-xs text-green-600 dark:text-green-400">{t('API Calls', 'API-Aufrufe')}</div>
                        <div className="font-bold text-green-700 dark:text-green-300">{gen.apiCalls} / {gen.totalBatches}</div>
                      </div>
                      <div className="bg-purple-50 dark:bg-purple-900/20 p-2 rounded">
                        <div className="text-xs text-purple-600 dark:text-purple-400">{t('Progress', 'Fortschritt')}</div>
                        <div className="font-bold text-purple-700 dark:text-purple-300">{Math.round((gen.completedBatches / gen.totalBatches) * 100)}%</div>
                      </div>
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <div className="text-lg font-bold text-blue-600 dark:text-blue-400 mb-1">
                      {gen.completedBatches} / {gen.totalBatches}
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-400 mb-2">{t('Batches', 'Batches')}</div>
                    <div className="w-40 bg-slate-200 dark:bg-slate-700 rounded-full h-3">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-300"
                        style={{ width: `${(gen.completedBatches / gen.totalBatches) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
                
                {/* Batch Grid */}
                <div className="mb-4">
                  <div className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    {t('Batch Status Grid', 'Batch-Status-Grid')} ({gen.totalBatches} {t('batches of 50 questions each', 'Batches à 50 Fragen')})
                  </div>
                  <div className="grid grid-cols-5 sm:grid-cols-10 lg:grid-cols-15 gap-2">
                  {Array.from({ length: gen.totalBatches }, (_, i) => i + 1).map((batchNum) => {
                    const batch = gen.batches.get(batchNum);
                    const status = batch?.status || 'pending';
                    return (
                      <div
                        key={batchNum}
                        className={`p-3 rounded-lg text-center text-xs font-bold cursor-pointer transition-all hover:scale-105 ${
                          status === 'complete' 
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-2 border-green-400 dark:border-green-600 shadow-md'
                            : status === 'running'
                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-2 border-blue-500 dark:border-blue-500 animate-pulse shadow-lg'
                            : status === 'error'
                            ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-2 border-red-400 dark:border-red-600'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 border border-slate-300 dark:border-slate-600'
                        }`}
                        title={batch?.prompt ? `Batch ${batchNum}: ${batch.prompt.substring(0, 150)}...` : `Batch ${batchNum}: ${t('Pending', 'Ausstehend')}`}
                      >
                        <div className="font-black text-sm mb-1">{batchNum}</div>
                        {batch && (
                          <div className="text-[10px] space-y-0.5">
                            <div className="font-semibold">{batch.questionsGenerated}Q</div>
                            {batch.invalidQuestions > 0 && (
                              <div className="text-orange-600 dark:text-orange-400 text-[9px]">-{batch.invalidQuestions}</div>
                            )}
                            {batch.responseTime && (
                              <div className="text-[9px] text-slate-500 dark:text-slate-400">{batch.responseTime}ms</div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  </div>
                </div>
                
                {/* Active Batch Details */}
                {Array.from(gen.batches.values()).filter(b => b.status === 'running').map((batch) => (
                  <div key={batch.batchNumber} className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/20 rounded-xl border-2 border-blue-400 dark:border-blue-600 shadow-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-base font-bold text-blue-900 dark:text-blue-200">
                        {t('Batch', 'Batch')} {batch.batchNumber} / {gen.totalBatches} - {t('Currently Running', 'Läuft gerade')} ⚡
                      </div>
                      <div className="text-xs text-blue-700 dark:text-blue-400">
                        {t('Generating 50 questions...', 'Generiere 50 Fragen...')}
                      </div>
                    </div>
                    {batch.prompt && (
                      <details open className="mt-3">
                        <summary className="text-sm font-semibold text-blue-800 dark:text-blue-300 cursor-pointer mb-2 hover:text-blue-900 dark:hover:text-blue-200">
                          {t('View Full Prompt', 'Vollständigen Prompt anzeigen')} ↓
                        </summary>
                        <div className="mt-2 p-4 bg-white dark:bg-slate-800 rounded-lg border border-blue-200 dark:border-blue-700">
                          <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
                            {t('System + User Prompt', 'System- und Benutzer-Prompt')}:
                          </div>
                          <pre className="text-xs text-slate-700 dark:text-slate-300 overflow-x-auto max-h-96 overflow-y-auto whitespace-pre-wrap font-mono leading-relaxed">
                            {batch.prompt}
                          </pre>
                        </div>
                      </details>
                    )}
                  </div>
                ))}
                
                {/* Completed Batch Stats */}
                {Array.from(gen.batches.values()).filter(b => b.status === 'complete').length > 0 && (
                  <details className="mt-3">
                    <summary className="text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                      {t('View Completed Batches', 'Abgeschlossene Batches anzeigen')} ({Array.from(gen.batches.values()).filter(b => b.status === 'complete').length})
                    </summary>
                    <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
                      {Array.from(gen.batches.values())
                        .filter(b => b.status === 'complete')
                        .sort((a, b) => a.batchNumber - b.batchNumber)
                        .map((batch) => (
                          <div key={batch.batchNumber} className="p-2 bg-green-50 dark:bg-green-950/20 rounded text-xs border border-green-200 dark:border-green-800">
                            <div className="font-medium text-green-900 dark:text-green-200">
                              {t('Batch', 'Batch')} {batch.batchNumber}: {batch.questionsGenerated} {t('questions', 'Fragen')}
                              {batch.invalidQuestions > 0 && (
                                <span className="text-orange-600 dark:text-orange-400"> ({batch.invalidQuestions} {t('filtered', 'gefiltert')})</span>
                              )}
                            </div>
                            {batch.responseTime && (
                              <div className="text-green-700 dark:text-green-400 mt-1">
                                {t('Time', 'Zeit')}: {batch.responseTime}ms | {t('Tokens', 'Tokens')}: {batch.tokensUsed?.toLocaleString()}
                              </div>
                            )}
                            {batch.prompt && (
                              <details className="mt-2">
                                <summary className="text-xs font-medium text-green-800 dark:text-green-300 cursor-pointer hover:text-green-900 dark:hover:text-green-200">
                                  {t('View Prompt', 'Prompt anzeigen')} ↓
                                </summary>
                                <div className="mt-2 p-3 bg-white dark:bg-slate-800 rounded border border-green-200 dark:border-green-700">
                                  <pre className="text-[10px] text-slate-700 dark:text-slate-300 overflow-x-auto max-h-48 overflow-y-auto whitespace-pre-wrap font-mono leading-relaxed">
                                    {batch.prompt}
                                  </pre>
                                </div>
                              </details>
                            )}
                          </div>
                        ))}
                    </div>
                  </details>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {details && status === 'generating' && !generationProgress && (
        <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg space-y-3">
          <div className="text-sm font-semibold text-blue-900 dark:text-blue-200">
            {t('Generation Details', 'Generierungsdetails')}
          </div>
          
          {details.currentGeneration && (
            <div className="text-xs">
              <span className="font-medium text-blue-800 dark:text-blue-300">
                {t('Current Generation', 'Aktuelle Generation')}:
              </span>{' '}
              <span className="text-blue-700 dark:text-blue-400">{details.currentGeneration}</span>
            </div>
          )}
          
          {details.currentBatch && details.totalBatches && (
            <div className="text-xs">
              <span className="font-medium text-blue-800 dark:text-blue-300">
                {t('Batch', 'Batch')}:
              </span>{' '}
              <span className="text-blue-700 dark:text-blue-400">
                {details.currentBatch} / {details.totalBatches}
              </span>
            </div>
          )}
          
          {details.apiCalls !== undefined && (
            <div className="text-xs">
              <span className="font-medium text-blue-800 dark:text-blue-300">
                {t('API Calls', 'API-Aufrufe')}:
              </span>{' '}
              <span className="text-blue-700 dark:text-blue-400">
                {details.apiCalls}
                {details.totalApiCalls && ` / ~${details.totalApiCalls}`}
              </span>
            </div>
          )}
          
          {details.questionsGenerated !== undefined && (
            <div className="text-xs">
              <span className="font-medium text-blue-800 dark:text-blue-300">
                {t('Questions Generated', 'Generierte Fragen')}:
              </span>{' '}
              <span className="text-blue-700 dark:text-blue-400">{details.questionsGenerated.toLocaleString()}</span>
            </div>
          )}
          
          {details.duplicatesRemoved !== undefined && details.duplicatesRemoved > 0 && (
            <div className="text-xs">
              <span className="font-medium text-orange-800 dark:text-orange-300">
                {t('Duplicates Removed', 'Duplikate entfernt')}:
              </span>{' '}
              <span className="text-orange-700 dark:text-orange-400">{details.duplicatesRemoved}</span>
            </div>
          )}
          
          {details.lastApiCall && (
            <div className="mt-2 pt-2 border-t border-blue-200 dark:border-blue-800 space-y-1">
              <div className="text-xs font-medium text-blue-800 dark:text-blue-300">
                {t('Last API Call', 'Letzter API-Aufruf')}:
              </div>
              <div className="text-xs text-blue-700 dark:text-blue-400 space-y-0.5 pl-2">
                <div>• {t('Response Time', 'Antwortzeit')}: {details.lastApiCall.responseTime}ms</div>
                <div>• {t('Tokens Used', 'Verwendete Tokens')}: {details.lastApiCall.tokensUsed.toLocaleString()}</div>
                <div>• {t('Questions in Batch', 'Fragen im Batch')}: {details.lastApiCall.questionsGenerated}</div>
              </div>
            </div>
          )}
          
          {details.currentPrompt && (
            <details className="mt-2">
              <summary className="text-xs font-medium text-blue-800 dark:text-blue-300 cursor-pointer">
                {t('View Current Prompt', 'Aktuellen Prompt anzeigen')}
              </summary>
              <pre className="mt-2 p-2 bg-slate-100 dark:bg-slate-800 rounded text-[10px] text-slate-700 dark:text-slate-300 overflow-x-auto max-h-40 overflow-y-auto">
                {details.currentPrompt}
              </pre>
            </details>
          )}
        </div>
      )}

      {fileUrl && (
        <div className="mb-4 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
          <div className="text-sm font-medium text-green-900 dark:text-green-200 mb-2">
            {t('File Generated', 'Datei generiert')}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <a
              href={`/api/mass-generation/download-file?filename=${fileUrl.replace('/generated/', '')}`}
              download
              className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
            >
              {fileUrl.endsWith('.txt') 
                ? t('Download TXT File', 'TXT-Datei herunterladen')
                : t('Download JSONL File', 'JSONL-Datei herunterladen')}
            </a>
            <span className="text-xs text-slate-500 dark:text-slate-400 break-all">
              {fileUrl.replace('/generated/', '')}
            </span>
          </div>
          {details && details.totalApiCalls && (
            <div className="mt-2 text-xs text-green-700 dark:text-green-400">
              {t('Total API Calls', 'Gesamte API-Aufrufe')}: {details.totalApiCalls} | {t('Model', 'Modell')}: gpt-4o-mini | {t('Batch Size', 'Batch-Größe')}: 50
            </div>
          )}
        </div>
      )}

      {results && (
        <div className="mb-4 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
          <div className="text-sm font-medium text-green-900 dark:text-green-200 mb-2">
            {t('Import Results', 'Import-Ergebnisse')}
          </div>
          <div className="text-xs text-green-700 dark:text-green-300 space-y-1">
            <div><strong>{t('Success', 'Erfolgreich')}:</strong> {results.success}</div>
            <div><strong>{t('Failed', 'Fehlgeschlagen')}:</strong> {results.failed}</div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-4">
        <div className="flex gap-3">
          <button
            onClick={onAction}
            disabled={disabled || ['generating', 'uploading', 'importing', 'building'].includes(status)}
            className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 dark:from-red-500 dark:to-red-600 text-white rounded-lg font-bold hover:from-red-700 hover:to-red-800 dark:hover:from-red-600 dark:hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
          >
            {actionLabel}
          </button>
          {canCancel && onCancel && (
            <button
              onClick={onCancel}
              className="px-6 py-3 bg-gradient-to-r from-orange-600 to-orange-700 dark:from-orange-500 dark:to-orange-600 text-white rounded-lg font-bold hover:from-orange-700 hover:to-orange-800 dark:hover:from-orange-600 dark:hover:to-orange-700 transition-all shadow-lg"
            >
              {t('Cancel', 'Abbrechen')}
            </button>
          )}
        </div>
        {onAutoRefreshChange && batchStatus && batchStatus.status !== 'completed' && (
          <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 cursor-pointer">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => onAutoRefreshChange(e.target.checked)}
              className="w-4 h-4"
            />
            {t('Auto-refresh every 10s', 'Alle 10s aktualisieren')}
          </label>
        )}
      </div>
    </div>
  );
}

