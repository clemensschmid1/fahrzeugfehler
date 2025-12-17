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
  hasFaults?: boolean; // Whether this generation already has faults
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
  step: number | 1.5 | 1.75 | 1.8 | 4.5 | 6;
  title: string;
  description: string;
  status: 'idle' | 'generating' | 'uploading' | 'importing' | 'building' | 'transforming' | 'converting' | 'splitting' | 'complete' | 'error';
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
  results?: { 
    success: number; 
    failed: number;
    embeddings?: { 
      batchId?: string; 
      fileId?: string; 
      filename?: string; 
      entriesCount?: number; 
      total: number; 
      note?: string;
      successful?: number; 
      failed?: number;
    };
    indexNow?: { successful: number; failed: number; total: number };
  } | null;
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
  // Step 5 multiple files support
  step5QuestionsFiles?: File[];
  step5AnswersFiles?: File[];
  step5MetadataFiles?: File[];
  useMultipleFiles?: boolean;
  setUseMultipleFiles?: (value: boolean) => void;
  setStep5QuestionsFiles?: (files: File[]) => void;
  setStep5AnswersFiles?: (files: File[]) => void;
  setStep5MetadataFiles?: (files: File[]) => void;
  // Step 2 file upload
  step2File?: File | null;
  onStep2FileChange?: (file: File | null) => void;
  step1_5JsonlFileUrl?: string | null;
  step1FileUrl?: string | null;
  // Step 1.5 file upload
  questionsFileUrlInput?: {
    accept?: string;
    onChange?: (file: File | null) => void;
    file?: File | null;
  };
  // Step 1.8 split JSONL
  step1_8NumParts?: number;
  setStep1_8NumParts?: (value: number) => void;
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
  step4Statistics?: {
    totalQuestions: number;
    totalAnswers: number;
    successfulPairs: number;
    failedCount: number;
    missingCount: number;
    unmatchedQuestions: number;
    successRate: string;
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
  
  // Step 1 Transform: Transform Prompts to JSON-L
  const [step1TransformStatus, setStep1TransformStatus] = useState<'idle' | 'transforming' | 'complete' | 'error'>('idle');
  const [step1TransformFileUrl, setStep1TransformFileUrl] = useState<string | null>(null);
  const [step1TransformError, setStep1TransformError] = useState<string | null>(null);
  const [step1TransformDetails, setStep1TransformDetails] = useState<{
    totalBatches?: number;
    totalGenerations?: number;
    questionsPerGeneration?: number;
    batchesPerGeneration?: number;
  } | null>(null);
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
  const [step1_5TxtFile, setStep1_5TxtFile] = useState<File | null>(null);
  const [step2Prompts, setStep2Prompts] = useState<{
    systemPrompt: string;
    exampleUserPrompt: string;
    model: string;
    temperature: number;
    maxTokens: number;
    generationContext: { brand: string; model: string; generation: string; generationCode: string | null } | null;
  } | null>(null);

  // Step 1.75: Convert Questions Output to Answers JSONL
  const [step1_75Status, setStep1_75Status] = useState<'idle' | 'converting' | 'complete' | 'error'>('idle');
  const [step1_75AnswersJsonlFileUrl, setStep1_75AnswersJsonlFileUrl] = useState<string | null>(null);
  const [step1_75Error, setStep1_75Error] = useState<string | null>(null);
  const [step1_75QuestionsOutputFile, setStep1_75QuestionsOutputFile] = useState<File | null>(null);
  const [step1_75Details, setStep1_75Details] = useState<{
    totalQuestions?: number;
    totalEntries?: number;
  } | null>(null);

  // Step 1.8: Split Large JSONL File
  const [step1_8Status, setStep1_8Status] = useState<'idle' | 'splitting' | 'complete' | 'error'>('idle');
  const [step1_8Error, setStep1_8Error] = useState<string | null>(null);
  const [step1_8File, setStep1_8File] = useState<File | null>(null);
  const [step1_8NumParts, setStep1_8NumParts] = useState<number>(2);
  const [step1_8Parts, setStep1_8Parts] = useState<Array<{
    filename: string;
    fileUrl: string;
    sizeMB: number;
    lineCount: number;
  }>>([]);
  const [step1_8OriginalSize, setStep1_8OriginalSize] = useState<number | null>(null);

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
  const [step4Statistics, setStep4Statistics] = useState<{
    totalQuestions: number;
    totalAnswers: number;
    successfulPairs: number;
    failedCount: number;
    missingCount: number;
    unmatchedQuestions: number;
    successRate: string;
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
  const [step5AbortController, setStep5AbortController] = useState<AbortController | null>(null);

  // Step 6: Import Embedding Results
  const [step6Status, setStep6Status] = useState<'idle' | 'importing' | 'complete' | 'error' | 'cancelled'>('idle');
  const [step6Error, setStep6Error] = useState<string | null>(null);
  const [step6AbortController, setStep6AbortController] = useState<AbortController | null>(null);
  const [step6Progress, setStep6Progress] = useState<{ processed: number; inserted: number; failed: number; duplicates: number } | null>(null);
  const [step6Results, setStep6Results] = useState<{ processed: number; inserted: number; failed: number; duplicates: number } | null>(null);
  const [step5Results, setStep5Results] = useState<{ 
    success: number; 
    failed: number;
    embeddings?: { 
      batchId?: string; 
      fileId?: string; 
      filename?: string; 
      entriesCount?: number; 
      total: number; 
      note?: string;
      successful?: number; 
      failed?: number;
    };
    indexNow?: { successful: number; failed: number; total: number };
  } | null>(null);
  const [step5Error, setStep5Error] = useState<string | null>(null);
  const [step5QuestionsFile, setStep5QuestionsFile] = useState<File | null>(null);
  const [step5AnswersFile, setStep5AnswersFile] = useState<File | null>(null);
  const [step5MetadataFile, setStep5MetadataFile] = useState<File | null>(null);
  // Support for multiple file groups (for split files)
  const [step5QuestionsFiles, setStep5QuestionsFiles] = useState<File[]>([]);
  const [step5AnswersFiles, setStep5AnswersFiles] = useState<File[]>([]);
  const [step5MetadataFiles, setStep5MetadataFiles] = useState<File[]>([]);
  const [useMultipleFiles, setUseMultipleFiles] = useState(false);

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
      // Load generations
      const { data: gensData, error: gensError } = await supabase
        .from('model_generations')
        .select('id, name, slug, car_model_id, generation_code, year_start, year_end')
        .eq('car_model_id', modelId)
        .order('year_start', { ascending: false });
      
      if (gensError) throw gensError;
      
      // Check which generations already have faults
      const generationIds = (gensData || []).map(g => g.id);
      let generationsWithFaults = new Set<string>();
      
      if (generationIds.length > 0) {
        const { data: faultsData } = await supabase
          .from('car_faults')
          .select('model_generation_id')
          .in('model_generation_id', generationIds)
          .eq('status', 'live');
        
        if (faultsData) {
          generationsWithFaults = new Set(faultsData.map(f => f.model_generation_id).filter(Boolean));
        }
      }
      
      // Mark generations without faults
      const enrichedGenerations = (gensData || []).map(gen => ({
        ...gen,
        hasFaults: generationsWithFaults.has(gen.id),
      }));
      
      setGenerations(enrichedGenerations);
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
      // Load generations
      const { data: gensData, error: gensError } = await supabase
        .from('model_generations')
        .select('id, name, slug, car_model_id, generation_code, year_start, year_end')
        .in('car_model_id', modelIds)
        .order('year_start', { ascending: false });
      
      if (gensError) throw gensError;
      
      // Check which generations already have faults
      const generationIds = (gensData || []).map(g => g.id);
      let generationsWithFaults = new Set<string>();
      
      if (generationIds.length > 0) {
        const { data: faultsData } = await supabase
          .from('car_faults')
          .select('model_generation_id')
          .in('model_generation_id', generationIds)
          .eq('status', 'live');
        
        if (faultsData) {
          generationsWithFaults = new Set(faultsData.map(f => f.model_generation_id).filter(Boolean));
        }
      }
      
      // Mark generations without faults
      const enrichedGenerations = (gensData || []).map(gen => ({
        ...gen,
        hasFaults: generationsWithFaults.has(gen.id),
      }));
      
      setGenerations(enrichedGenerations);
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
              const jsonStr = line.slice(6);
              // Skip empty lines or malformed JSON
              if (!jsonStr || jsonStr.trim() === '') continue;
              
              // Try to parse JSON, skip if it fails (malformed data)
              let data;
              try {
                data = JSON.parse(jsonStr);
              } catch (parseError) {
                // Skip malformed JSON lines silently - don't log to avoid console spam
                // These are usually caused by truncated prompts in progress updates
                continue;
              }
              
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

  // Step 1 Transform: Transform Prompts to JSON-L
  const handleTransformToJsonl = async () => {
    const brandIdsToUse = selectedBrands.length > 0 ? selectedBrands : (selectedBrand ? [selectedBrand] : []);
    
    if (brandIdsToUse.length === 0) {
      setStep1TransformError(t('Please select at least one brand', 'Bitte wählen Sie mindestens eine Marke'));
      return;
    }

    if (selectedGenerations.length === 0) {
      setStep1TransformError(t('Please select at least one generation', 'Bitte wählen Sie mindestens eine Generation'));
      return;
    }

    setStep1TransformStatus('transforming');
    setStep1TransformError(null);
    setStep1TransformDetails(null);

    try {
      const response = await fetch('/api/mass-generation/transform-to-jsonl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandIds: brandIdsToUse,
          generationIds: selectedGenerations,
          contentType,
          language: lang,
          questionsPerGeneration: typeof questionsPerGeneration === 'string' ? parseInt(questionsPerGeneration) || 5000 : questionsPerGeneration || 5000,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to transform prompts to JSON-L');
      }

      const data = await response.json();
      setStep1TransformFileUrl(data.fileUrl);
      setStep1TransformDetails({
        totalBatches: data.totalBatches,
        totalGenerations: data.totalGenerations,
        questionsPerGeneration: data.questionsPerGeneration,
        batchesPerGeneration: data.batchesPerGeneration,
      });
      setStep1TransformStatus('complete');
    } catch (error) {
      console.error('Transform to JSONL error:', error);
      setStep1TransformError(error instanceof Error ? error.message : 'Unknown error');
      setStep1TransformStatus('error');
    }
  };

  // Step 1.75: Convert Questions Output to Answers JSONL
  const handleConvertQuestionsToAnswers = async () => {
    if (!step1_75QuestionsOutputFile) {
      setStep1_75Error(t('Please upload the questions output file from OpenAI Batch API', 'Bitte laden Sie die Fragen-Output-Datei von OpenAI Batch API hoch'));
      return;
    }

    setStep1_75Status('converting');
    setStep1_75Error(null);
    setStep1_75Details(null);

    try {
      const formData = new FormData();
      formData.append('questionsOutputFile', step1_75QuestionsOutputFile);
      formData.append('contentType', contentType);
      formData.append('brandIds', JSON.stringify(selectedBrands.length > 0 ? selectedBrands : (selectedBrand ? [selectedBrand] : [])));
      formData.append('generationIds', JSON.stringify(selectedGenerations));

      const response = await fetch('/api/mass-generation/convert-questions-to-answers-jsonl', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to convert questions output to answers JSONL');
      }

      const data = await response.json();
      setStep1_75AnswersJsonlFileUrl(data.fileUrl);
      setStep1_75Details({
        totalQuestions: data.totalQuestions,
        totalEntries: data.totalEntries,
      });
      setStep1_75Status('complete');
    } catch (error) {
      console.error('Convert questions to answers error:', error);
      setStep1_75Error(error instanceof Error ? error.message : 'Unknown error');
      setStep1_75Status('error');
    }
  };

  // Step 1.8: Split Large JSONL File
  const handleSplitJsonl = async () => {
    if (!step1_8File) {
      setStep1_8Error(t('Please upload a JSONL file to split', 'Bitte laden Sie eine JSONL-Datei zum Aufteilen hoch'));
      return;
    }

    setStep1_8Status('splitting');
    setStep1_8Error(null);
    setStep1_8Parts([]);
    setStep1_8OriginalSize(null);

    try {
      const formData = new FormData();
      
      // Always use the uploaded file
      formData.append('file', step1_8File);
      formData.append('numParts', step1_8NumParts.toString());

      const response = await fetch('/api/mass-generation/split-jsonl', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to split JSONL file');
      }

      const data = await response.json();
      setStep1_8Parts(data.parts || []);
      setStep1_8OriginalSize(data.originalSizeMB);
      setStep1_8Status('complete');
    } catch (error) {
      console.error('Split JSONL error:', error);
      setStep1_8Error(error instanceof Error ? error.message : 'Unknown error');
      setStep1_8Status('error');
    }
  };

  // Step 1.5: Build JSONL from TXT
  const handleBuildJsonl = async () => {
    // Check if we have a file upload or a fileUrl from Step 1
    if (!step1_5TxtFile && (!step1FileUrl || !step1FileUrl.endsWith('.txt'))) {
      setStep1_5Error(t('Please upload a TXT file or complete Step 1 first', 'Bitte laden Sie eine TXT-Datei hoch oder vervollständigen Sie zuerst Schritt 1'));
      return;
    }

    setStep1_5Status('building');
    setStep1_5Error(null);

    try {
      // Get current contentType value
      const currentContentType = contentType || 'fault';
      let response: Response;
      
      if (step1_5TxtFile) {
        // Use uploaded file
        const formData = new FormData();
        formData.append('questionsFile', step1_5TxtFile);
        formData.append('contentType', currentContentType);
        formData.append('brandIds', JSON.stringify(selectedBrands.length > 0 ? selectedBrands : (selectedBrand ? [selectedBrand] : [])));
        formData.append('generationIds', JSON.stringify(selectedGenerations));
        formData.append('questionsPerGeneration', questionsPerGeneration.toString());

        response = await fetch('/api/mass-generation/build-jsonl', {
          method: 'POST',
          body: formData,
        });
      } else {
        // Use fileUrl from Step 1
        response = await fetch('/api/mass-generation/build-jsonl', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            questionsFileUrl: step1FileUrl,
            contentType: currentContentType,
            brandIds: selectedBrands.length > 0 ? selectedBrands : (selectedBrand ? [selectedBrand] : []),
            generationIds: selectedGenerations,
            questionsPerGeneration,
          }),
        });
      }

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
    // Use file from Step 1.75 if available, otherwise require manual file upload or use Step 1.5 file
    if (!step2File && !step1_75AnswersJsonlFileUrl && !step1_5JsonlFileUrl && !step1FileUrl) {
      setStep2Error(t('Please upload a JSONL file or complete Step 1.75 or Step 1.5 first', 'Bitte laden Sie eine JSONL-Datei hoch oder vervollständigen Sie zuerst Schritt 1.75 oder Schritt 1.5'));
      return;
    }

    setStep2Status('uploading');
    setStep2Error(null);

    try {
      const formData = new FormData();
      
      // Use file from Step 1.75 if available, otherwise use manually uploaded file or fileUrl
      if (step2File) {
        formData.append('file', step2File);
        formData.append('batchName', `Answers Batch ${step2File.name.replace('.jsonl', '')}`);
      } else if (step1_75AnswersJsonlFileUrl) {
        // Use file from Step 1.75
        const response = await fetch(step1_75AnswersJsonlFileUrl);
        const blob = await response.blob();
        const fileName = step1_75AnswersJsonlFileUrl.split('/').pop() || 'answers.jsonl';
        formData.append('file', new File([blob], fileName));
        formData.append('batchName', `Answers Batch ${fileName.replace('.jsonl', '')}`);
      } else if (step1_5JsonlFileUrl) {
        // Use file from Step 1.5
        const response = await fetch(step1_5JsonlFileUrl);
        const blob = await response.blob();
        const fileName = step1_5JsonlFileUrl.split('/').pop() || 'questions.jsonl';
        formData.append('file', new File([blob], fileName));
        formData.append('batchName', `Answers Batch ${fileName.replace('.jsonl', '')}`);
      } else if (step1FileUrl) {
        // Use fileUrl
        formData.append('fileUrl', step1FileUrl);
        formData.append('batchName', `Answers Batch ${step1FileUrl.split('/').pop()?.replace('.jsonl', '') || 'questions'}`);
      }
      
      formData.append('contentType', contentType);
      if (selectedBrand) formData.append('brandId', selectedBrand);
      if (selectedModel) formData.append('modelId', selectedModel);
      if (selectedGeneration) formData.append('generationId', selectedGeneration);

      // Set timeout for large file uploads (15 minutes)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15 * 60 * 1000); // 15 minutes

      let response;
      try {
        response = await fetch('/api/mass-generation/submit-batch', {
          method: 'POST',
          body: formData,
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
      } catch (error: any) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError' || controller.signal.aborted) {
          throw new Error(t('Upload timeout. The file is very large. Please wait or try splitting into smaller batches.', 'Upload-Timeout. Die Datei ist sehr groß. Bitte warten Sie oder teilen Sie sie in kleinere Batches auf.'));
        }
        throw error;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || t('Failed to submit batch', 'Fehler beim Senden des Batches'));
      }

      const data = await response.json();
      setStep2BatchId(data.batchId);
      setStep2FileId(data.fileId);
      setStep2Status('complete');
      
      // Add to batches list
      const batchFileName = step2File?.name || step1_75AnswersJsonlFileUrl?.split('/').pop() || step1_5JsonlFileUrl?.split('/').pop() || step1FileUrl?.split('/').pop() || 'batch';
      setBatches(prev => [...prev, {
        id: data.batchId,
        name: data.batchName || `Answers Batch ${batchFileName}`,
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
      
      // Store statistics
      if (data.statistics) {
        setStep4Statistics(data.statistics);
      } else {
        setStep4Statistics(null);
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
    // Note: Generation selection is optional - the system will auto-detect from questions if not provided
    // But we still send empty array if none selected, so backend can attempt auto-detection

    // Check if using multiple files or single files
    const questionsFiles = useMultipleFiles ? (step5QuestionsFiles || []) : (step5QuestionsFile ? [step5QuestionsFile] : []);
    const answersFiles = useMultipleFiles ? (step5AnswersFiles || []) : (step5AnswersFile ? [step5AnswersFile] : []);
    const metadataFiles = useMultipleFiles ? (step5MetadataFiles || []) : (step5MetadataFile ? [step5MetadataFile] : []);

    if (questionsFiles.length === 0) {
      setStep5Error(t('Please upload at least one questions JSONL file', 'Bitte laden Sie mindestens eine Fragen-JSONL-Datei hoch'));
      return;
    }

    if (answersFiles.length === 0) {
      setStep5Error(t('Please upload at least one answers JSONL file', 'Bitte laden Sie mindestens eine Antworten-JSONL-Datei hoch'));
      return;
    }

    if (metadataFiles.length === 0) {
      setStep5Error(t('Please upload at least one metadata JSONL file', 'Bitte laden Sie mindestens eine Metadaten-JSONL-Datei hoch'));
      return;
    }

    // Validate that we have matching counts
    if (questionsFiles.length !== metadataFiles.length || answersFiles.length !== metadataFiles.length) {
      setStep5Error(t('Number of questions, answers, and metadata files must match. Please ensure you have the same number of files for each type.', 'Die Anzahl der Fragen-, Antworten- und Metadaten-Dateien muss übereinstimmen. Bitte stellen Sie sicher, dass Sie die gleiche Anzahl von Dateien für jeden Typ haben.'));
      return;
    }

    setStep5Status('importing');
    setStep5Error(null);
    setStep5Progress({ current: 0, total: 0 });

    // Create AbortController for cancellation
    const abortController = new AbortController();
    setStep5AbortController(abortController);

    try {
      const formData = new FormData();
      
      // Append files based on mode
      if (useMultipleFiles) {
        // Multiple files mode
        questionsFiles.forEach((file) => {
          formData.append('questionsFiles', file);
        });
        answersFiles.forEach((file) => {
          formData.append('answersFiles', file);
        });
        metadataFiles.forEach((file) => {
          formData.append('metadataFiles', file);
        });
      } else {
        // Single file mode (backward compatible)
        formData.append('questionsFile', questionsFiles[0]);
        formData.append('answersFile', answersFiles[0]);
        if (metadataFiles.length > 0) {
          formData.append('metadataFile', metadataFiles[0]);
        }
      }
      
      formData.append('contentType', contentType);
      formData.append('generationIds', JSON.stringify(selectedGenerations));
      formData.append('questionsPerGeneration', questionsPerGeneration.toString());
      formData.append('language', language);
      formData.append('useMultipleFiles', useMultipleFiles.toString());

      const response = await fetch('/api/mass-generation/import', {
        method: 'POST',
        body: formData,
        signal: abortController.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || t('Failed to import', 'Fehler beim Importieren'));
      }

      const data = await response.json();
      setStep5Results({ 
        success: data.success, 
        failed: data.failed,
        embeddings: data.embeddings,
        indexNow: data.indexNow,
      });
      setStep5Progress({ current: data.success + data.failed, total: data.success + data.failed });
      setStep5Status('complete');
      setStep5AbortController(null);
    } catch (error: any) {
      // Don't show error if it was cancelled
      if (error.name === 'AbortError' || abortController.signal.aborted) {
        setStep5Error(t('Import cancelled', 'Import abgebrochen'));
        setStep5Status('error');
      } else {
        console.error('Error importing:', error);
        setStep5Error(error.message || t('Unknown error', 'Unbekannter Fehler'));
        setStep5Status('error');
      }
      setStep5AbortController(null);
    }
  };

  // Cancel import handler
  const handleCancelImport = () => {
    if (step5AbortController) {
      step5AbortController.abort();
      setStep5AbortController(null);
      setStep5Status('error');
      setStep5Error(t('Import cancelled by user', 'Import vom Benutzer abgebrochen'));
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
            <div className="flex gap-3 flex-wrap">
              <Link
                href={`/${lang}/carbulk`}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-700 transition-all text-sm font-medium"
              >
                ← {t('Back to Bulk Generator', 'Zurück zum Bulk-Generator')}
              </Link>
              <Link
                href={`/${lang}/prompts`}
                className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-all text-sm font-medium"
              >
                {t('Prompt Variance Center', 'Prompt-Varianz-Zentrum')} →
              </Link>
            </div>
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
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-slate-900 dark:text-white">
                              {brand?.name} {model?.name} {gen.name}
                              </span>
                              {gen.hasFaults === false && (
                                <span className="text-yellow-500 dark:text-yellow-400 font-bold text-lg" title={t('New generation - no faults yet', 'Neue Generation - noch keine Faults')}>
                                  *
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">
                              {gen.generation_code && `${gen.generation_code} • `}
                              {gen.year_start && gen.year_end ? `${gen.year_start}-${gen.year_end}` : gen.year_start ? `${gen.year_start}-Present` : ''}
                              {gen.hasFaults === false && (
                                <span className="ml-2 text-yellow-600 dark:text-yellow-400 font-medium">
                                  {t('(New)', '(Neu)')}
                                </span>
                              )}
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
        <div className="space-y-4">
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
          
          {/* Step 1 Transform: Transform Prompts to JSON-L */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <StepCard
              step={1}
              title={t('Step 1 Transform: Transform Prompts to JSON-L', 'Schritt 1 Transform: Prompts zu JSON-L konvertieren')}
              description={t('Convert all prompts for selected generations to JSON-L format for OpenAI Batch API. This is faster and more cost-effective than direct API calls.', 'Konvertieren Sie alle Prompts für ausgewählte Generationen in JSON-L-Format für OpenAI Batch API. Dies ist schneller und kostengünstiger als direkte API-Aufrufe.')}
              status={step1TransformStatus}
              error={step1TransformError}
              onAction={handleTransformToJsonl}
              actionLabel={t('Transform To JSON-L', 'Zu JSON-L konvertieren')}
              disabled={(selectedBrands.length === 0 && !selectedBrand) || selectedGenerations.length === 0 || step1TransformStatus === 'transforming'}
              fileUrl={step1TransformFileUrl}
              details={step1TransformDetails ? {
                currentGeneration: `${step1TransformDetails.totalGenerations} generations`,
                totalBatches: step1TransformDetails.totalBatches,
                questionsGenerated: (step1TransformDetails.totalBatches || 0) * 50,
              } : null}
              t={t}
            />
            {step1TransformDetails && (
              <div className="mt-2 text-sm text-gray-600 dark:text-gray-400 px-4">
                {t('Total batches', 'Gesamt Batches')}: {step1TransformDetails.totalBatches} | 
                {t('Generations', 'Generationen')}: {step1TransformDetails.totalGenerations} | 
                {t('Questions per generation', 'Fragen pro Generation')}: {step1TransformDetails.questionsPerGeneration} | 
                {t('Batches per generation', 'Batches pro Generation')}: {step1TransformDetails.batchesPerGeneration}
              </div>
            )}
          </div>
        </div>

        {/* Step 1.5: Build JSONL from TXT - Always visible */}
        <StepCard
          step={1.5}
          title={t('Step 1.5: Build JSONL from TXT', 'Schritt 1.5: JSONL aus TXT erstellen')}
          description={t('Convert TXT questions file to JSONL format for batch processing. Upload a TXT file or use the file from Step 1.', 'TXT-Fragendatei in JSONL-Format für Batch-Verarbeitung konvertieren. Laden Sie eine TXT-Datei hoch oder verwenden Sie die Datei aus Schritt 1.')}
          status={step1_5Status}
          error={step1_5Error}
          onAction={handleBuildJsonl}
          actionLabel={t('Build JSONL', 'JSONL erstellen')}
          disabled={step1_5Status === 'building' || (!step1_5TxtFile && (!step1FileUrl || !step1FileUrl.endsWith('.txt')))}
          fileUrl={step1_5JsonlFileUrl}
          questionsFileUrlInput={{
            accept: '.txt',
            onChange: setStep1_5TxtFile,
            file: step1_5TxtFile,
          }}
          step1FileUrl={step1FileUrl}
          t={t}
        />

        {/* Step 1.75: Convert Questions Output to Answers JSONL */}
        <StepCard
          step={1.75}
          title={t('Step 1.75: Convert Questions Output to Answers JSONL', 'Schritt 1.75: Fragen-Output zu Antworten-JSONL konvertieren')}
          description={t('Convert the questions output file from OpenAI Batch API into the correct format for answer generation. Upload the downloaded questions output file.', 'Konvertieren Sie die Fragen-Output-Datei von OpenAI Batch API in das richtige Format für die Antwort-Generierung. Laden Sie die heruntergeladene Fragen-Output-Datei hoch.')}
          status={step1_75Status}
          error={step1_75Error}
          onAction={handleConvertQuestionsToAnswers}
          actionLabel={t('Convert to Answers JSONL', 'Zu Antworten-JSONL konvertieren')}
          disabled={step1_75Status === 'converting' || !step1_75QuestionsOutputFile}
          fileUrl={step1_75AnswersJsonlFileUrl}
          details={step1_75Details ? {
            questionsGenerated: step1_75Details.totalQuestions,
            totalBatches: step1_75Details.totalEntries,
          } : null}
          questionsFileUrlInput={{
            accept: '.jsonl',
            onChange: (file) => setStep1_75QuestionsOutputFile(file),
            file: step1_75QuestionsOutputFile,
          }}
          t={t}
        />

        {/* Step 1.8: Split Large JSONL File */}
        <StepCard
          step={1.8}
          title={t('Step 1.8: Split Large JSONL File', 'Schritt 1.8: Große JSONL-Datei aufteilen')}
          description={t('Split large JSONL files (>200MB) into smaller parts for OpenAI Batch API. Each part must be under 200MB.', 'Teilen Sie große JSONL-Dateien (>200MB) in kleinere Teile für OpenAI Batch API auf. Jeder Teil muss unter 200MB sein.')}
          status={step1_8Status}
          error={step1_8Error}
          onAction={handleSplitJsonl}
          actionLabel={t('Split File', 'Datei aufteilen')}
          disabled={step1_8Status === 'splitting' || !step1_8File}
          fileUrl={step1_8Parts.length > 0 ? step1_8Parts[0].fileUrl : null}
          details={step1_8Parts.length > 0 ? {
            totalBatches: step1_8Parts.length,
            questionsGenerated: step1_8Parts.reduce((sum, part) => sum + part.lineCount, 0),
          } : null}
          questionsFileUrlInput={{
            accept: '.jsonl',
            onChange: (file) => setStep1_8File(file),
            file: step1_8File,
          }}
          step1_8NumParts={step1_8NumParts}
          setStep1_8NumParts={setStep1_8NumParts}
          t={t}
        />
        
        {/* Info: Split Parts Available */}
        {step1_8Parts.length > 0 && (
          <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <h3 className="text-sm font-semibold text-green-800 dark:text-green-200 mb-2">
              {step1_8Parts.length === 1 
                ? t('✅ File Ready', '✅ Datei bereit')
                : t('✅ File Split into Multiple Parts', '✅ Datei in mehrere Teile aufgeteilt')}
            </h3>
            {step1_8OriginalSize && (
              <p className="text-sm text-green-700 dark:text-green-300 mb-3">
                {t('Original file size', 'Ursprüngliche Dateigröße')}: {step1_8OriginalSize.toFixed(2)} MB → {t('Split into', 'Aufgeteilt in')} {step1_8Parts.length} {t('parts', 'Teile')}
              </p>
            )}
            {step1_8Parts.length > 1 && (
              <p className="text-sm text-green-700 dark:text-green-300 mb-3">
                {t('You need to submit each part separately in Step 2.', 'Sie müssen jeden Teil separat in Schritt 2 einreichen.')}
              </p>
            )}
            <div className="space-y-2">
              {step1_8Parts.map((part, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg border border-green-200 dark:border-green-700 shadow-sm">
                  <div className="flex-1">
                    <div className="font-medium text-slate-900 dark:text-white text-sm">
                      {t('Part', 'Teil')} {index + 1} {step1_8Parts.length > 1 ? `of ${step1_8Parts.length}` : ''}: {part.filename}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {part.sizeMB.toFixed(2)} MB • {part.lineCount.toLocaleString()} {t('lines', 'Zeilen')}
                    </div>
                  </div>
                  <a
                    href={part.fileUrl}
                    download
                    className="ml-4 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm"
                  >
                    {t('Download', 'Herunterladen')}
                  </a>
                </div>
              ))}
            </div>
            {step1_8Parts.length > 0 && (
              <div className="mt-3 pt-3 border-t border-green-200 dark:border-green-700">
                <p className="text-xs text-green-700 dark:text-green-300">
                  {t('💡 Tip', '💡 Tipp')}: {t('You can now use these files in Step 2. The first part will be automatically selected.', 'Sie können diese Dateien jetzt in Schritt 2 verwenden. Der erste Teil wird automatisch ausgewählt.')}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Submit Batch */}
        <StepCard
          step={2}
          title={t('Step 2: Submit Batch to OpenAI', 'Schritt 2: Batch an OpenAI senden')}
          description={t('Upload JSON-L file and create batch job. For large files (>100MB), consider uploading directly to OpenAI Batch API.', 'JSON-L-Datei hochladen und Batch-Job erstellen. Für große Dateien (>100MB) sollten Sie direkt zur OpenAI Batch API hochladen.')}
          status={step2Status}
          error={step2Error}
          onAction={handleSubmitBatch}
          actionLabel={t('Submit Batch', 'Batch senden')}
          disabled={false}
          batchId={step2BatchId}
          step2File={step2File}
          onStep2FileChange={setStep2File}
          step1_5JsonlFileUrl={step1_8Parts.length > 0 ? step1_8Parts[0].fileUrl : (step1_75AnswersJsonlFileUrl || step1_5JsonlFileUrl)}
          step1FileUrl={step1FileUrl}
          step2Prompts={step2Prompts}
          t={t}
        />
        
        {/* Direct Upload Instructions for Large Files */}
        {(step1_75AnswersJsonlFileUrl || step1_5JsonlFileUrl) && (
          <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <h3 className="text-sm font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
              {t('💡 Tip: For Large Files (>100MB)', '💡 Tipp: Für große Dateien (>100MB)')}
            </h3>
            <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-3">
              {t('Upload directly to OpenAI Batch API for faster and more reliable uploads:', 'Laden Sie direkt zur OpenAI Batch API hoch für schnellere und zuverlässigere Uploads:')}
            </p>
            <ol className="text-sm text-yellow-700 dark:text-yellow-300 list-decimal list-inside space-y-1 mb-3">
              <li>{t('Download your JSONL file from Step 1.75 or Step 1.5', 'Laden Sie Ihre JSONL-Datei aus Schritt 1.75 oder Schritt 1.5 herunter')}</li>
              <li>
                {t('Go to', 'Gehen Sie zu')}{' '}
                <a 
                  href="https://platform.openai.com/batch" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline font-semibold"
                >
                  OpenAI Batch API
                </a>
              </li>
              <li>{t('Click "Create batch" and upload your JSONL file', 'Klicken Sie auf "Create batch" und laden Sie Ihre JSONL-Datei hoch')}</li>
              <li>{t('Copy the Batch ID and File ID', 'Kopieren Sie die Batch ID und File ID')}</li>
              <li>{t('Paste them in Step 3 (Check Batch Status)', 'Fügen Sie sie in Schritt 3 (Batch-Status überprüfen) ein')}</li>
            </ol>
            {(step1_75AnswersJsonlFileUrl || step1_5JsonlFileUrl) && (
              <div className="mt-3">
                <a
                  href={step1_75AnswersJsonlFileUrl || step1_5JsonlFileUrl || ''}
                  download
                  className="inline-block px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-sm font-semibold transition-colors"
                >
                  {t('Download JSONL File', 'JSONL-Datei herunterladen')}
                </a>
                <a
                  href="https://platform.openai.com/batch"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-2 inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors"
                >
                  {t('Open OpenAI Batch API', 'OpenAI Batch API öffnen')}
                </a>
              </div>
            )}
          </div>
        )}

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
          step4Statistics={step4Statistics}
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
          onCancel={handleCancelImport}
          canCancel={step5Status === 'importing'}
          step5QuestionsFile={step5QuestionsFile}
          step5AnswersFile={step5AnswersFile}
          step5MetadataFile={step5MetadataFile}
          onStep5QuestionsFileChange={setStep5QuestionsFile}
          onStep5AnswersFileChange={setStep5AnswersFile}
          onStep5MetadataFileChange={setStep5MetadataFile}
          step5QuestionsFiles={step5QuestionsFiles}
          step5AnswersFiles={step5AnswersFiles}
          step5MetadataFiles={step5MetadataFiles}
          useMultipleFiles={useMultipleFiles}
          setUseMultipleFiles={setUseMultipleFiles}
          setStep5QuestionsFiles={setStep5QuestionsFiles}
          setStep5AnswersFiles={setStep5AnswersFiles}
          setStep5MetadataFiles={setStep5MetadataFiles}
          t={t}
        />

        {/* Step 6: Import Embedding Results */}
        <StepCard
          step={6}
          title={t('Step 6: Import Embedding Results', 'Schritt 6: Embedding-Ergebnisse importieren')}
          description={t('Import completed embedding batch results from OpenAI. Upload the output file or use Batch ID.', 'Fertige Embedding-Batch-Ergebnisse von OpenAI importieren. Laden Sie die Output-Datei hoch oder verwenden Sie die Batch-ID.')}
          status={step6Status}
          error={step6Error}
          onAction={() => {}}
          actionLabel=""
          disabled={false}
          t={t}
        />
        <div className="mb-4 space-y-4">
          <div className="bg-gradient-to-br from-blue-50 via-blue-100/50 to-blue-50 dark:from-blue-950/40 dark:via-blue-900/30 dark:to-blue-950/40 rounded-xl p-4 sm:p-5 border border-blue-200 dark:border-blue-800">
            <h3 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-200 mb-3">
              {t('Import Embedding Batch Results', 'Embedding Batch-Ergebnisse importieren')}
            </h3>
            
            <div className="space-y-4">
              {/* Option 1: Upload from Batch ID */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  {t('Option 1: Import from Batch ID', 'Option 1: Von Batch-ID importieren')}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    id="batchIdInput"
                    placeholder={t('Enter Batch ID (e.g., batch_xxx)', 'Batch-ID eingeben (z.B. batch_xxx)')}
                    className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={step6Status === 'importing'}
                  />
                  {step6Status === 'importing' ? (
                    <button
                      onClick={() => {
                        if (step6AbortController) {
                          step6AbortController.abort();
                          setStep6Status('cancelled');
                          setStep6AbortController(null);
                        }
                      }}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors text-sm"
                    >
                      {t('Cancel', 'Abbrechen')}
                    </button>
                  ) : (
                    <button
                      onClick={async () => {
                        const batchId = (document.getElementById('batchIdInput') as HTMLInputElement)?.value;
                        if (!batchId) {
                          setStep6Error(t('Please enter a Batch ID', 'Bitte geben Sie eine Batch-ID ein'));
                          setStep6Status('error');
                          return;
                        }

                        const abortController = new AbortController();
                        setStep6AbortController(abortController);
                        setStep6Status('importing');
                        setStep6Error(null);
                        setStep6Progress({ processed: 0, inserted: 0, failed: 0, duplicates: 0 });
                        setStep6Results(null);

                        try {
                          const response = await fetch('/api/embeddings/import-batch-results', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ batchId }),
                            signal: abortController.signal
                          });

                          const data = await response.json();
                          if (response.status === 499 || data.cancelled) {
                            setStep6Status('cancelled');
                            setStep6Error(t('Import cancelled', 'Import abgebrochen'));
                          } else if (response.ok) {
                            setStep6Status('complete');
                            setStep6Results({
                              processed: data.processed || 0,
                              inserted: data.inserted || 0,
                              failed: data.failed || 0,
                              duplicates: data.duplicates || 0
                            });
                          } else {
                            setStep6Error(data.error || t('Import failed', 'Import fehlgeschlagen'));
                            setStep6Status('error');
                          }
                        } catch (error) {
                          if (error instanceof Error && error.name === 'AbortError') {
                            setStep6Status('cancelled');
                            setStep6Error(t('Import cancelled', 'Import abgebrochen'));
                          } else {
                            setStep6Error(error instanceof Error ? error.message : t('Unknown error', 'Unbekannter Fehler'));
                            setStep6Status('error');
                          }
                        } finally {
                          setStep6AbortController(null);
                        }
                      }}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors text-sm"
                    >
                      {t('Import', 'Importieren')}
                    </button>
                  )}
                </div>
                <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {t('Automatically downloads and imports results from OpenAI using the Batch ID', 'Lädt automatisch Ergebnisse von OpenAI herunter und importiert sie mit der Batch-ID')}
                </div>
              </div>

              {/* Option 2: Upload File */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  {t('Option 2: Upload Batch Output File', 'Option 2: Batch-Output-Datei hochladen')}
                </label>
                <div className="bg-white/80 dark:bg-slate-800/80 rounded-lg p-3 mb-3 border border-blue-200 dark:border-blue-700">
                  <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
                    <p className="font-semibold">{t('How to get the output file:', 'So erhalten Sie die Output-Datei:')}</p>
                    <ol className="list-decimal list-inside space-y-1 ml-2">
                      <li>{t('Go to OpenAI Dashboard → Batches', 'Gehen Sie zu OpenAI Dashboard → Batches')}</li>
                      <li>{t('Find your batch and wait until status is "completed"', 'Finden Sie Ihren Batch und warten Sie, bis der Status "completed" ist')}</li>
                      <li>{t('Click "Download" to get the output JSONL file', 'Klicken Sie auf "Download", um die Output JSONL-Datei zu erhalten')}</li>
                      <li>{t('Upload it below', 'Laden Sie sie unten hoch')}</li>
                    </ol>
                  </div>
                </div>
                <div className="space-y-2">
                  <input
                    type="file"
                    accept=".jsonl"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;

                      const abortController = new AbortController();
                      setStep6AbortController(abortController);
                      setStep6Status('importing');
                      setStep6Error(null);
                      setStep6Progress({ processed: 0, inserted: 0, failed: 0, duplicates: 0 });
                      setStep6Results(null);

                      try {
                        const formData = new FormData();
                        formData.append('file', file);

                        const response = await fetch('/api/embeddings/import-batch-results', {
                          method: 'POST',
                          body: formData,
                          signal: abortController.signal
                        });

                        const data = await response.json();
                        if (response.status === 499 || data.cancelled) {
                          setStep6Status('cancelled');
                          setStep6Error(t('Import cancelled', 'Import abgebrochen'));
                        } else if (response.ok) {
                          setStep6Status('complete');
                          setStep6Results({
                            processed: data.processed || 0,
                            inserted: data.inserted || 0,
                            failed: data.failed || 0,
                            duplicates: data.duplicates || 0
                          });
                        } else {
                          setStep6Error(data.error || t('Import failed', 'Import fehlgeschlagen'));
                          setStep6Status('error');
                        }
                      } catch (error) {
                        if (error instanceof Error && error.name === 'AbortError') {
                          setStep6Status('cancelled');
                          setStep6Error(t('Import cancelled', 'Import abgebrochen'));
                        } else {
                          setStep6Error(error instanceof Error ? error.message : t('Unknown error', 'Unbekannter Fehler'));
                          setStep6Status('error');
                        }
                      } finally {
                        setStep6AbortController(null);
                        // Reset input
                        e.target.value = '';
                      }
                    }}
                    className="block w-full text-sm text-slate-700 dark:text-slate-300 file:mr-4 file:py-3 file:px-6 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 file:cursor-pointer cursor-pointer border-2 border-dashed border-blue-300 dark:border-blue-600 rounded-lg p-4 bg-white/50 dark:bg-slate-800/50 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={step6Status === 'importing'}
                  />
                  {step6Status === 'importing' && (
                    <div className="flex items-center justify-between gap-2">
                      <button
                        onClick={() => {
                          if (step6AbortController) {
                            step6AbortController.abort();
                            setStep6Status('cancelled');
                            setStep6AbortController(null);
                          }
                        }}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors text-sm"
                      >
                        {t('Cancel Import', 'Import abbrechen')}
                      </button>
                      <div className="text-sm text-slate-600 dark:text-slate-400">
                        {t('Processing large file, please wait...', 'Große Datei wird verarbeitet, bitte warten...')}
                      </div>
                    </div>
                  )}
                </div>
                <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 text-center">
                  {t('Upload the completed batch output file (.jsonl) from OpenAI', 'Laden Sie die fertige Batch-Output-Datei (.jsonl) von OpenAI hoch')}
                </div>
              </div>

              {/* Progress Display */}
              {step6Status === 'importing' && (
                <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                    <div className="text-sm font-semibold text-blue-800 dark:text-blue-200">
                      {t('Importing embeddings...', 'Embeddings werden importiert...')}
                    </div>
                  </div>
                  {step6Progress && (
                    <div className="text-xs text-blue-700 dark:text-blue-300 space-y-1 mt-2">
                      <div>{t('Processed:', 'Verarbeitet:')} {step6Progress.processed.toLocaleString()}</div>
                      <div className="text-green-700 dark:text-green-300">{t('Inserted:', 'Eingefügt:')} {step6Progress.inserted.toLocaleString()}</div>
                      {step6Progress.duplicates > 0 && (
                        <div className="text-yellow-700 dark:text-yellow-300">{t('Duplicates:', 'Duplikate:')} {step6Progress.duplicates.toLocaleString()}</div>
                      )}
                      {step6Progress.failed > 0 && (
                        <div className="text-red-700 dark:text-red-300">{t('Failed:', 'Fehlgeschlagen:')} {step6Progress.failed.toLocaleString()}</div>
                      )}
                    </div>
                  )}
                  <div className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                    {t('Large files may take several minutes. Do not close this page.', 'Große Dateien können mehrere Minuten dauern. Bitte schließen Sie diese Seite nicht.')}
                  </div>
                </div>
              )}

              {/* Error Display */}
              {step6Error && (
                <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <div className="text-sm text-red-800 dark:text-red-200">{step6Error}</div>
                </div>
              )}

              {/* Success Display */}
              {step6Status === 'complete' && step6Results && (
                <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <div className="text-sm font-semibold text-green-800 dark:text-green-200 mb-2">
                    {t('Embeddings imported successfully!', 'Embeddings erfolgreich importiert!')}
                  </div>
                  <div className="text-xs text-green-700 dark:text-green-300 space-y-1">
                    <div>{t('Processed:', 'Verarbeitet:')} {step6Results.processed.toLocaleString()}</div>
                    <div className="font-semibold">{t('Successfully inserted:', 'Erfolgreich eingefügt:')} {step6Results.inserted.toLocaleString()}</div>
                    {step6Results.duplicates > 0 && (
                      <div>{t('Duplicates (skipped):', 'Duplikate (übersprungen):')} {step6Results.duplicates.toLocaleString()}</div>
                    )}
                    {step6Results.failed > 0 && (
                      <div className="text-red-700 dark:text-red-300">{t('Failed:', 'Fehlgeschlagen:')} {step6Results.failed.toLocaleString()}</div>
                    )}
                  </div>
                </div>
              )}

              {/* Cancelled Display */}
              {step6Status === 'cancelled' && (
                <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <div className="text-sm text-yellow-800 dark:text-yellow-200">
                    {t('Import cancelled. Partial results may have been saved.', 'Import abgebrochen. Teilweise Ergebnisse wurden möglicherweise gespeichert.')}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
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
  step5QuestionsFiles,
  step5AnswersFiles,
  step5MetadataFiles,
  useMultipleFiles,
  setUseMultipleFiles,
  setStep5QuestionsFiles,
  setStep5AnswersFiles,
  setStep5MetadataFiles,
  step2File,
  onStep2FileChange,
  step1_5JsonlFileUrl,
  step1FileUrl,
  questionsFileUrlInput,
  step4_5MetadataFile,
  onStep4_5MetadataFileChange,
  step4MetadataFileUrl,
  step2Prompts,
  step4Prompts,
  step4Statistics,
  batches,
  onDownloadBatch,
  onCancel,
  canCancel,
  step1_8NumParts,
  setStep1_8NumParts,
  t,
}: StepCardProps) {
  const statusColors = {
    idle: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400',
    generating: 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300',
    uploading: 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300',
    importing: 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300',
    building: 'bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-300',
    transforming: 'bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-300',
    converting: 'bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-300',
    splitting: 'bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-300',
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
               status === 'transforming' ? t('Transforming...', 'Konvertiere...') :
               status === 'converting' ? t('Converting...', 'Konvertiere...') :
               status === 'splitting' ? t('Splitting...', 'Teile auf...') :
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

      {/* Step 1.5: File Upload for TXT Questions */}
      {step === 1.5 && questionsFileUrlInput && (
        <div className="mb-4 space-y-4">
          <FileUpload
            label={t('TXT Questions File', 'TXT-Fragendatei')}
            accept={questionsFileUrlInput.accept || '.txt'}
            file={questionsFileUrlInput.file || null}
            onFileChange={questionsFileUrlInput.onChange || (() => {})}
            required={false}
            t={t}
          />
          {step1FileUrl && step1FileUrl.endsWith('.txt') && !questionsFileUrlInput.file && (
            <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              {t('Or use the file from Step 1', 'Oder verwenden Sie die Datei aus Schritt 1')}: <a href={step1FileUrl} download className="text-blue-600 dark:text-blue-400 hover:underline">{step1FileUrl.split('/').pop()}</a>
            </div>
          )}
        </div>
      )}

      {step === 1.75 && questionsFileUrlInput && (
        <div className="mb-4 space-y-4">
          <FileUpload
            label={t('Questions Output JSONL File (from OpenAI Batch API)', 'Fragen-Output-JSONL-Datei (von OpenAI Batch API)')}
            accept={questionsFileUrlInput.accept || '.jsonl'}
            file={questionsFileUrlInput.file || null}
            onFileChange={questionsFileUrlInput.onChange || (() => {})}
            required={true}
            t={t}
          />
          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            {t('Upload the downloaded questions output file from Step 3 (Check Batch Status)', 'Laden Sie die heruntergeladene Fragen-Output-Datei aus Schritt 3 (Batch-Status überprüfen) hoch')}
          </div>
        </div>
      )}

      {step === 1.8 && questionsFileUrlInput && (
        <div className="mb-4 space-y-4">
          <FileUpload
            label={t('Large JSONL File to Split', 'Große JSONL-Datei zum Aufteilen')}
            accept={questionsFileUrlInput.accept || '.jsonl'}
            file={questionsFileUrlInput.file || null}
            onFileChange={questionsFileUrlInput.onChange || (() => {})}
            required={false}
            t={t}
          />
          
          {/* Number of Parts Selection */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              {t('Number of Parts', 'Anzahl der Teile')}
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min="2"
                max="20"
                value={step1_8NumParts || 2}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 2;
                  setStep1_8NumParts?.(Math.max(2, Math.min(20, value)));
                }}
                className="w-24 px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
              />
              <div className="flex gap-2">
                {[2, 3, 4, 5, 6].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setStep1_8NumParts?.(num)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                      (step1_8NumParts || 2) === num
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {t('Select how many parts to split the file into. Each part must be under 200MB.', 'Wählen Sie aus, in wie viele Teile die Datei aufgeteilt werden soll. Jeder Teil muss unter 200MB sein.')}
            </div>
            <div className="mt-2 p-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded text-xs text-amber-800 dark:text-amber-200">
              <strong>⚠️ {t('Important', 'Wichtig')}:</strong> {t('Files are split evenly by line count (not file size) to maintain alignment. When splitting multiple files (Questions, Answers, Metadata), use the SAME number of parts for all files to ensure lines match correctly.', 'Dateien werden gleichmäßig nach Zeilenanzahl (nicht Dateigröße) aufgeteilt, um die Ausrichtung zu gewährleisten. Wenn Sie mehrere Dateien (Questions, Answers, Metadata) aufteilen, verwenden Sie die GLEICHE Anzahl von Teilen für alle Dateien, damit die Zeilen korrekt übereinstimmen.')}
            </div>
          </div>
          
          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 space-y-2">
            <p>{t('Upload any large JSONL file (>200MB) to split it into smaller parts for OpenAI Batch API.', 'Laden Sie eine große JSONL-Datei (>200MB) hoch, um sie in kleinere Teile für OpenAI Batch API aufzuteilen.')}</p>
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded p-2">
              <strong className="text-blue-800 dark:text-blue-200">💡 {t('Tip', 'Tipp')}:</strong> {t('If you split a Metadata file, you must also split the corresponding Questions file with the same number of parts. Use this tool for both files.', 'Wenn Sie eine Metadata-Datei teilen, müssen Sie auch die entsprechende Questions-Datei mit der gleichen Anzahl von Teilen teilen. Verwenden Sie dieses Tool für beide Dateien.')}
            </div>
          </div>
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

      {/* Step 4: Show Statistics */}
      {step === 4 && step4Statistics && (
        <div className={`mb-4 border-t border-slate-200 dark:border-slate-700 pt-4 ${
          parseFloat(step4Statistics.successRate) < 95 
            ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 rounded-lg p-4' 
            : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 rounded-lg p-4'
        }`}>
          <h4 className="font-semibold text-slate-900 dark:text-white mb-3">
            {t('Matching Statistics', 'Matching-Statistiken')}
          </h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-slate-600 dark:text-slate-400">{t('Total Questions', 'Gesamt Fragen')}:</span>
              <span className="ml-2 font-semibold text-slate-900 dark:text-white">{step4Statistics.totalQuestions.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-slate-600 dark:text-slate-400">{t('Total Answers', 'Gesamt Antworten')}:</span>
              <span className="ml-2 font-semibold text-slate-900 dark:text-white">{step4Statistics.totalAnswers.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-slate-600 dark:text-slate-400">{t('Successful Pairs', 'Erfolgreiche Paare')}:</span>
              <span className="ml-2 font-semibold text-green-600 dark:text-green-400">{step4Statistics.successfulPairs.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-slate-600 dark:text-slate-400">{t('Success Rate', 'Erfolgsrate')}:</span>
              <span className={`ml-2 font-semibold ${
                parseFloat(step4Statistics.successRate) >= 95 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-amber-600 dark:text-amber-400'
              }`}>
                {step4Statistics.successRate}
              </span>
            </div>
            {step4Statistics.failedCount > 0 && (
              <div>
                <span className="text-slate-600 dark:text-slate-400">{t('Failed Answers', 'Fehlgeschlagene Antworten')}:</span>
                <span className="ml-2 font-semibold text-red-600 dark:text-red-400">{step4Statistics.failedCount.toLocaleString()}</span>
              </div>
            )}
            {step4Statistics.unmatchedQuestions > 0 && (
              <div>
                <span className="text-slate-600 dark:text-slate-400">{t('Questions Without Answers', 'Fragen ohne Antworten')}:</span>
                <span className="ml-2 font-semibold text-amber-600 dark:text-amber-400">{step4Statistics.unmatchedQuestions.toLocaleString()}</span>
              </div>
            )}
          </div>
          {parseFloat(step4Statistics.successRate) < 95 && (
            <div className="mt-3 p-3 bg-amber-100 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-700 rounded text-sm text-amber-800 dark:text-amber-200">
              <strong>⚠️ {t('Warning', 'Warnung')}:</strong> {t('Some questions do not have matching answers. When splitting files, make sure to use the same custom_ids in corresponding parts. The system automatically matches by custom_id, not by line position, so missing answers are safely skipped.', 'Einige Fragen haben keine passenden Antworten. Beim Aufteilen von Dateien müssen die gleichen custom_ids in entsprechenden Teilen verwendet werden. Das System matched automatisch über custom_id, nicht über Zeilenposition, sodass fehlende Antworten sicher übersprungen werden.')}
            </div>
          )}
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
          {/* Toggle for multiple files */}
          <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <input
              type="checkbox"
              id="useMultipleFiles"
              checked={useMultipleFiles || false}
              onChange={(e) => setUseMultipleFiles?.(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <label htmlFor="useMultipleFiles" className="text-sm font-semibold text-blue-900 dark:text-blue-200 cursor-pointer">
              {t('Import Multiple Files (up to 10 per type - will be merged automatically)', 'Mehrere Dateien importieren (bis zu 10 pro Typ - werden automatisch zusammengeführt)')}
            </label>
          </div>

          {!useMultipleFiles ? (
            <>
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
            </>
          ) : (
            <>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  {t('Questions JSONL Files', 'Fragen-JSONL-Dateien')} ({(step5QuestionsFiles?.length || 0)}/10 {t('selected', 'ausgewählt')})
                </label>
                <input
                  type="file"
                  accept=".jsonl"
                  multiple
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []).slice(0, 10); // Limit to 10 files
                    setStep5QuestionsFiles?.(files);
                  }}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
                {(step5QuestionsFiles?.length || 0) >= 10 && (
                  <div className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                    {t('Maximum 10 files allowed', 'Maximal 10 Dateien erlaubt')}
                  </div>
                )}
                {(step5QuestionsFiles?.length || 0) > 0 && (
                  <div className="mt-2 space-y-1">
                    {step5QuestionsFiles?.map((file, index) => (
                      <div key={index} className="text-xs text-slate-600 dark:text-slate-400">
                        • {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  {t('Answers JSONL Files', 'Antworten-JSONL-Dateien')} ({(step5AnswersFiles?.length || 0)}/10 {t('selected', 'ausgewählt')})
                </label>
                <input
                  type="file"
                  accept=".jsonl"
                  multiple
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []).slice(0, 10); // Limit to 10 files
                    setStep5AnswersFiles?.(files);
                  }}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
                {(step5AnswersFiles?.length || 0) >= 10 && (
                  <div className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                    {t('Maximum 10 files allowed', 'Maximal 10 Dateien erlaubt')}
                  </div>
                )}
                {(step5AnswersFiles?.length || 0) > 0 && (
                  <div className="mt-2 space-y-1">
                    {step5AnswersFiles?.map((file, index) => (
                      <div key={index} className="text-xs text-slate-600 dark:text-slate-400">
                        • {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  {t('Metadata JSONL Files', 'Metadaten-JSONL-Dateien')} ({(step5MetadataFiles?.length || 0)}/10 {t('selected', 'ausgewählt')})
                </label>
                <input
                  type="file"
                  accept=".jsonl"
                  multiple
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []).slice(0, 10); // Limit to 10 files
                    setStep5MetadataFiles?.(files);
                  }}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
                {(step5MetadataFiles?.length || 0) >= 10 && (
                  <div className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                    {t('Maximum 10 files allowed', 'Maximal 10 Dateien erlaubt')}
                  </div>
                )}
                {(step5MetadataFiles?.length || 0) > 0 && (
                  <div className="mt-2 space-y-1">
                    {step5MetadataFiles?.map((file, index) => (
                      <div key={index} className="text-xs text-slate-600 dark:text-slate-400">
                        • {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded p-2">
            <strong className="text-blue-800 dark:text-blue-200">ℹ️ {t('Info', 'Info')}:</strong> {t('All uploaded files will be automatically merged together. You can upload up to 10 files per type (questions, answers, metadata). The number of files per type does not need to match - all files will be combined into one large dataset for processing.', 'Alle hochgeladenen Dateien werden automatisch zusammengeführt. Sie können bis zu 10 Dateien pro Typ hochladen (Fragen, Antworten, Metadaten). Die Anzahl der Dateien pro Typ muss nicht übereinstimmen - alle Dateien werden zu einem großen Datensatz zusammengeführt und verarbeitet.')}
          </div>
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
            {results.embeddings && (
              <>
                <div className="mt-3 pt-3 border-t border-slate-300 dark:border-slate-600">
                  <div className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    {t('Embeddings', 'Embeddings')}
          </div>
                  <div className="text-xs space-y-1">
                    {results.embeddings.batchId ? (
                      <>
                        <div><strong className="text-blue-600 dark:text-blue-400">{t('Batch ID', 'Batch-ID')}:</strong> {results.embeddings.batchId}</div>
                        <div><strong className="text-slate-600 dark:text-slate-400">{t('Entries', 'Einträge')}:</strong> {results.embeddings.entriesCount?.toLocaleString() || 0} / {results.embeddings.total.toLocaleString()}</div>
                        {results.embeddings.filename && (
                          <div><strong className="text-slate-600 dark:text-slate-400">{t('File', 'Datei')}:</strong> {results.embeddings.filename}</div>
                        )}
                        {results.embeddings.note && (
                          <div className="text-slate-500 dark:text-slate-400 italic mt-1">{results.embeddings.note}</div>
                        )}
                      </>
                    ) : (
                      <>
                        {results.embeddings.successful !== undefined && (
                          <div><strong className="text-green-600 dark:text-green-400">{t('Successful', 'Erfolgreich')}:</strong> {results.embeddings.successful.toLocaleString()} / {results.embeddings.total.toLocaleString()}</div>
                        )}
                        {results.embeddings.failed !== undefined && results.embeddings.failed > 0 && (
                          <div><strong className="text-red-600 dark:text-red-400">{t('Failed', 'Fehlgeschlagen')}:</strong> {results.embeddings.failed.toLocaleString()}</div>
                        )}
                      </>
                    )}
                  </div>
                  {/* Batch Embedding Management Section */}
                  <div className="mt-4 pt-4 border-t-2 border-slate-300 dark:border-slate-600">
                    <div className="bg-gradient-to-br from-blue-50 via-blue-100/50 to-blue-50 dark:from-blue-950/40 dark:via-blue-900/30 dark:to-blue-950/40 rounded-xl p-4 sm:p-5 border border-blue-200 dark:border-blue-800">
                      <h3 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-200 mb-3">
                        {t('Embedding Batch Results', 'Embedding Batch-Ergebnisse')}
                      </h3>
                      
                      {results.embeddings.batchId && (
                        <div className="mb-4 space-y-3">
                          <div className="bg-white/60 dark:bg-slate-800/60 rounded-lg p-3 border border-blue-200 dark:border-blue-700">
                            <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                              {t('Batch ID', 'Batch-ID')}:
                            </div>
                            <div className="text-sm font-mono text-slate-800 dark:text-slate-200 break-all">
                              {results.embeddings.batchId}
                            </div>
                          </div>
                          
                          {results.embeddings.filename && (
                            <div>
                              <a
                                href={results.embeddings.filename.startsWith('/') ? results.embeddings.filename : `/generated/${results.embeddings.filename}`}
                                download
                                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors text-sm"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                {t('Download Input JSONL', 'Input JSONL herunterladen')}
                              </a>
                              <div className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                                {t('Download the JSONL file that was uploaded to OpenAI Batch API', 'Laden Sie die JSONL-Datei herunter, die zu OpenAI Batch API hochgeladen wurde')}
                              </div>
                            </div>
                          )}
                          
                          <button
                            onClick={async () => {
                              try {
                                const response = await fetch('/api/embeddings/import-batch-results', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    batchId: results.embeddings?.batchId
                                  })
                                });
                                const data = await response.json();
                                if (response.ok) {
                                  alert(t(`Successfully imported ${data.inserted} embeddings`, `Erfolgreich ${data.inserted} Embeddings importiert`));
                                } else {
                                  alert(t('Error', 'Fehler') + ': ' + (data.error || 'Unknown error'));
                                }
                              } catch (error) {
                                alert(t('Error', 'Fehler') + ': ' + (error instanceof Error ? error.message : 'Unknown error'));
                              }
                            }}
                            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors text-sm"
                          >
                            {t('Import from Batch ID (Auto)', 'Von Batch-ID importieren (Auto)')}
                          </button>
                          <div className="text-xs text-slate-600 dark:text-slate-400">
                            {t('Automatically downloads and imports results from OpenAI using the Batch ID', 'Lädt automatisch Ergebnisse von OpenAI herunter und importiert sie mit der Batch-ID')}
                          </div>
                        </div>
                      )}
                      
                      {/* Manual File Upload Section - Always visible */}
                      <div className="mt-4 pt-4 border-t border-blue-200 dark:border-blue-700">
                        <div className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                          {t('Manual Upload: OpenAI Batch Output File', 'Manueller Upload: OpenAI Batch Output-Datei')}
                        </div>
                        <div className="bg-white/80 dark:bg-slate-800/80 rounded-lg p-3 mb-3 border border-blue-200 dark:border-blue-700">
                          <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
                            <p className="font-semibold">{t('How to get the output file:', 'So erhalten Sie die Output-Datei:')}</p>
                            <ol className="list-decimal list-inside space-y-1 ml-2">
                              <li>{t('Go to OpenAI Dashboard → Batches', 'Gehen Sie zu OpenAI Dashboard → Batches')}</li>
                              <li>{t('Find your batch (ID shown above if available)', 'Finden Sie Ihren Batch (ID oben angezeigt, falls verfügbar)')}</li>
                              <li>{t('Wait until status is "completed"', 'Warten Sie, bis der Status "completed" ist')}</li>
                              <li>{t('Click "Download" or copy the output_file_id', 'Klicken Sie auf "Download" oder kopieren Sie die output_file_id')}</li>
                              <li>{t('Download the JSONL file from OpenAI', 'Laden Sie die JSONL-Datei von OpenAI herunter')}</li>
                              <li>{t('Upload it below', 'Laden Sie sie unten hoch')}</li>
                            </ol>
                          </div>
                        </div>
                        <div className="relative">
                          <input
                            type="file"
                            accept=".jsonl"
                            id="embedding-batch-output-upload"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              
                              try {
                                const formData = new FormData();
                                formData.append('file', file);
                                
                                const response = await fetch('/api/embeddings/import-batch-results', {
                                  method: 'POST',
                                  body: formData
                                });
                                
                                const data = await response.json();
                                if (response.ok) {
                                  alert(t(`Successfully imported ${data.inserted} embeddings`, `Erfolgreich ${data.inserted} Embeddings importiert`));
                                } else {
                                  alert(t('Error', 'Fehler') + ': ' + (data.error || 'Unknown error'));
                                }
                              } catch (error) {
                                alert(t('Error', 'Fehler') + ': ' + (error instanceof Error ? error.message : 'Unknown error'));
                              }
                              
                              // Reset input
                              e.target.value = '';
                            }}
                            className="block w-full text-sm text-slate-700 dark:text-slate-300 file:mr-4 file:py-3 file:px-6 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 file:cursor-pointer cursor-pointer border-2 border-dashed border-blue-300 dark:border-blue-600 rounded-lg p-4 bg-white/50 dark:bg-slate-800/50"
                          />
                          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 text-center">
                            {t('Upload the completed batch output file (.jsonl) from OpenAI', 'Laden Sie die fertige Batch-Output-Datei (.jsonl) von OpenAI hoch')}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
            {results.indexNow && (
              <>
                <div className="mt-3 pt-3 border-t border-slate-300 dark:border-slate-600">
                  <div className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    {t('IndexNow', 'IndexNow')}
                  </div>
                  <div className="text-xs space-y-1">
                    <div><strong className="text-green-600 dark:text-green-400">{t('Successful', 'Erfolgreich')}:</strong> {results.indexNow.successful.toLocaleString()} / {results.indexNow.total.toLocaleString()}</div>
                    {results.indexNow.failed > 0 && (
                      <div><strong className="text-red-600 dark:text-red-400">{t('Failed', 'Fehlgeschlagen')}:</strong> {results.indexNow.failed.toLocaleString()}</div>
                    )}
                  </div>
                </div>
              </>
            )}
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

