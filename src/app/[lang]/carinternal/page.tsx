'use client';

import { useState, useEffect } from 'react';
import InternalAuth from '@/components/InternalAuth';
import { supabase } from '@/lib/supabase';
import { useParams } from 'next/navigation';
import Link from 'next/link';

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

type Generation = {
  id: string;
  name: string;
  slug: string;
  car_model_id: string;
  year_start?: number | null;
  year_end?: number | null;
};

type CarMetadata = {
  severity?: string;
  difficulty_level?: string;
  error_code?: string;
  affected_component?: string;
  symptoms?: string[];
  diagnostic_steps?: string[];
  tools_required?: string[];
  estimated_repair_time?: string;
  manual_type?: string;
  estimated_time?: string;
  parts_required?: string[];
  meta_title?: string;
  meta_description?: string;
  seo_score?: number;
  content_score?: number;
};

type GeneratedQuestion = {
  id: string;
  question: string;
  status: 'pending' | 'generating' | 'done' | 'error' | 'metadata_pending' | 'metadata_generating' | 'metadata_done';
  answer?: string;
  metadata?: CarMetadata;
  error?: string;
};

function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export default function CarInternalPage() {
  const params = useParams();
  const lang = params.lang as string;
  
  // Translation helper
  const t = (en: string, de: string) => lang === 'de' ? de : en;

  // Brand and Model Selection
  const [brands, setBrands] = useState<CarBrand[]>([]);
  const [selectedBrandId, setSelectedBrandId] = useState<string>('');
  const [models, setModels] = useState<CarModel[]>([]);
  const [selectedModelId, setSelectedModelId] = useState<string>('');
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [selectedGenerationId, setSelectedGenerationId] = useState<string>('');

  // Question Generation
  const [prompt, setPrompt] = useState('');
  const [questionType, setQuestionType] = useState<'fault' | 'manual'>('fault');
  const [generatedQuestions, setGeneratedQuestions] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStatus, setGenerationStatus] = useState<string>('');
  const [shouldStopQuestionGeneration, setShouldStopQuestionGeneration] = useState(false);
  const [questionGenerationAbortController, setQuestionGenerationAbortController] = useState<AbortController | null>(null);
  const [useTestBatch, setUseTestBatch] = useState(false); // Test batch mode (25 questions)

  // Bulk Answer Generation
  const [questionsForAnswers, setQuestionsForAnswers] = useState<GeneratedQuestion[]>([]);
  const [isGeneratingAnswers, setIsGeneratingAnswers] = useState(false);
  const [answerGenerationStatus, setAnswerGenerationStatus] = useState<string>('');
  const [shouldStopGeneration, setShouldStopGeneration] = useState(false);
  const [abortControllers, setAbortControllers] = useState<AbortController[]>([]);
  const [importedItems, setImportedItems] = useState<Array<{ id: string; slug: string; title: string; url: string }>>([]);
  const [autoMode, setAutoMode] = useState(false); // Auto-generate answers after questions
  const [isImporting, setIsImporting] = useState(false);
  const [shouldStopImport, setShouldStopImport] = useState(false);
  const [isGeneratingMetadata, setIsGeneratingMetadata] = useState(false);
  const [metadataGenerationStatus, setMetadataGenerationStatus] = useState<string>('');
  const [shouldStopMetadataGeneration, setShouldStopMetadataGeneration] = useState(false);
  const [enableMetadataGeneration, setEnableMetadataGeneration] = useState(true);
  
  // Batch generation mode
  const [useBatchGeneration, setUseBatchGeneration] = useState(false); // Use OpenAI batch API
  const [batchJobs, setBatchJobs] = useState<Array<{ id: string; type: 'answers' | 'metadata'; status: string; createdAt: string; questionsCount: number }>>([]);
  const [monitoringBatchId, setMonitoringBatchId] = useState<string | null>(null);
  
  // Batch file generation states
  const [batchFiles, setBatchFiles] = useState<Array<{ type: 'questions' | 'answers' | 'metadata'; content: string; filename: string }>>([]);

  // Fetch brands on mount
  useEffect(() => {
    fetchBrands();
  }, []);

  // Fetch models when brand changes
  useEffect(() => {
    if (selectedBrandId) {
      fetchModels(selectedBrandId);
    } else {
      setModels([]);
      setSelectedModelId('');
    }
  }, [selectedBrandId]);

  // Fetch generations when model changes
  useEffect(() => {
    if (selectedModelId) {
      fetchGenerations(selectedModelId);
    } else {
      setGenerations([]);
      setSelectedGenerationId('');
    }
  }, [selectedModelId]);

  async function fetchBrands() {
    const { data, error } = await supabase
      .from('car_brands')
      .select('id, name, slug')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching brands:', error);
    } else {
      setBrands(data || []);
    }
  }

  async function fetchModels(brandId: string) {
    const { data, error } = await supabase
      .from('car_models')
      .select('id, name, slug, brand_id')
      .eq('brand_id', brandId)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching models:', error);
    } else {
      setModels(data || []);
    }
  }

  async function fetchGenerations(modelId: string) {
    const { data, error } = await supabase
      .from('model_generations')
      .select('id, name, slug, car_model_id')
      .eq('car_model_id', modelId)
      .order('year_start', { ascending: false });

    if (error) {
      console.error('Error fetching generations:', error);
    } else {
      setGenerations(data || []);
    }
  }

  async function handleGenerateQuestions(e: React.FormEvent) {
    e.preventDefault();
    
    if (!selectedBrandId || !selectedModelId || !selectedGenerationId) {
      alert('Please select a brand, model, and generation first');
      return;
    }

    setIsGenerating(true);
    setGenerationStatus('Generating 100 questions...');
    setGeneratedQuestions([]);

    try {
      // Get brand and model names for context
      const selectedBrand = brands.find(b => b.id === selectedBrandId);
      const selectedModel = models.find(m => m.id === selectedModelId);
      const selectedGeneration = generations.find(g => g.id === selectedGenerationId);

      if (!selectedBrand || !selectedModel || !selectedGeneration) {
        throw new Error('Selected brand, model, or generation not found');
      }

      // Build enhanced context prompt focused on most searched problems
      const yearRange = selectedGeneration.year_start && selectedGeneration.year_end
        ? ` (${selectedGeneration.year_start}-${selectedGeneration.year_end})`
        : selectedGeneration.year_start
        ? ` (${selectedGeneration.year_start}+)`
        : '';
      
      let contextPrompt = '';
      
      if (prompt.trim()) {
        // Use custom prompt if provided
        contextPrompt = `For ${selectedBrand.name} ${selectedModel.name} ${selectedGeneration.name}${yearRange}: ${prompt}`;
      } else {
        // Auto-generate based on content type
        if (questionType === 'fault') {
          contextPrompt = `Generate the 100 most searched/common problems, faults, and issues for ${selectedBrand.name} ${selectedModel.name} ${selectedGeneration.name}${yearRange}. Focus on real-world problems that car owners actually search for online, such as: engine issues, transmission problems, electrical faults, warning lights, error codes, common breakdowns, performance issues, and maintenance problems. Make each question specific to this exact model and generation. Format: One problem/question per line, no numbering, clear and searchable.`;
        } else {
          contextPrompt = `Generate the 100 most searched/common maintenance procedures, repair guides, and how-to instructions for ${selectedBrand.name} ${selectedModel.name} ${selectedGeneration.name}${yearRange}. Focus on procedures that car owners actually search for, such as: oil changes, brake pad replacement, filter changes, fluid top-ups, part replacements, diagnostic procedures, and routine maintenance. Make each instruction specific to this exact model and generation. Format: One instruction/guide per line, no numbering, clear and actionable.`;
        }
      }

      // Generate questions in batches (Test: 25, Full: 100)
      const targetCount = useTestBatch ? 25 : 100;
      const batchSize = 25;
      const batches = useTestBatch ? 1 : 4;
      const allQuestions: string[] = [];
      const abortController = new AbortController();
      setQuestionGenerationAbortController(abortController);
      setShouldStopQuestionGeneration(false);
      
      setGenerationStatus(t(
        `Generating ${targetCount} questions...`,
        `Generiere ${targetCount} Fragen...`
      ));

      for (let i = 0; i < batches; i++) {
        // Check if user wants to stop
        if (shouldStopQuestionGeneration || abortController.signal.aborted) {
          setGenerationStatus(t(`Generation stopped by user. Generated ${allQuestions.length} questions so far.`, `Generierung vom Benutzer gestoppt. ${allQuestions.length} Fragen bisher generiert.`));
          break;
        }

        setGenerationStatus(t(`Generating batch ${i + 1}/${batches} (${batchSize} questions)...`, `Generiere Batch ${i + 1}/${batches} (${batchSize} Fragen)...`));
        
        const batchPrompt = `${contextPrompt}. Generate exactly ${batchSize} unique questions.`;
        
        try {
          const response = await fetch('/api/questions/generate-ai', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prompt: batchPrompt,
              count: batchSize,
              language: lang,
              model: 'gpt-4o'
            }),
            signal: abortController.signal
          });

          if (!response.ok) {
            if (response.status === 0 || abortController.signal.aborted) {
              throw new Error(t('Generation aborted', 'Generierung abgebrochen'));
            }
            throw new Error(t(`Batch ${i + 1} failed: ${await response.text()}`, `Batch ${i + 1} fehlgeschlagen: ${await response.text()}`));
          }

          const data = await response.json();
          const questions = data.questions.split('\n').filter((q: string) => q.trim().length > 0);
          allQuestions.push(...questions);
        } catch (error) {
          if (error instanceof Error && error.name === 'AbortError') {
            setGenerationStatus(t('Generation aborted by user.', 'Generierung vom Benutzer abgebrochen.'));
            break;
          }
          throw error;
        }
      }

      // Deduplicate
      const uniqueQuestions = Array.from(new Set(allQuestions.map((q: string) => q.trim())));
      setGeneratedQuestions(uniqueQuestions);
      
      if (!shouldStopQuestionGeneration && !abortController.signal.aborted) {
        setGenerationStatus(t(
          `✅ Successfully generated ${uniqueQuestions.length} unique questions! Click "Load Questions for Answer Generation" to proceed.`,
          `✅ Erfolgreich ${uniqueQuestions.length} eindeutige Fragen generiert! Klicken Sie auf "Fragen für Antwortgenerierung laden", um fortzufahren.`
        ));
      }
    } catch (error) {
      console.error('Generation error:', error);
      setGenerationStatus(t(
        `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        `Fehler: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
      ));
    } finally {
      setIsGenerating(false);
      setQuestionGenerationAbortController(null);
      setShouldStopQuestionGeneration(false);
    }
  }

  function handleCopyQuestions() {
    if (generatedQuestions.length === 0) {
      alert('No questions to copy');
      return;
    }
    navigator.clipboard.writeText(generatedQuestions.join('\n'));
    alert(`Copied ${generatedQuestions.length} questions to clipboard!`);
  }

  function handleDownloadQuestions() {
    if (generatedQuestions.length === 0) {
      alert('No questions to download');
      return;
    }
    const content = generatedQuestions.join('\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `car_questions_${new Date().toISOString().split('T')[0]}.txt`;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  }

  function handlePasteQuestions() {
    navigator.clipboard.readText().then(text => {
      const questions = text.split('\n')
        .map(q => q.trim())
        .filter(q => q.length > 0);
      
      setQuestionsForAnswers(questions.map(q => ({
        id: uuidv4(),
        question: q,
        status: 'pending' as const
      })));
      setAnswerGenerationStatus(`Loaded ${questions.length} questions. Ready to generate answers.`);
    }).catch(err => {
      alert('Failed to read from clipboard: ' + err);
    });
  }

  function handleLoadGeneratedQuestions() {
    if (generatedQuestions.length === 0) {
      alert('No questions generated yet. Please generate questions first.');
      return;
    }
    
    setQuestionsForAnswers(generatedQuestions.map(q => ({
      id: uuidv4(),
      question: q,
      status: 'pending' as const
    })));
    setAnswerGenerationStatus(`Loaded ${generatedQuestions.length} generated questions. Ready to generate answers and create pages.`);
  }

  // OpenAI Batch Generation for Answers
  async function handleBatchGenerateAnswers() {
    if (questionsForAnswers.length === 0) {
      alert(t('No questions loaded. Please paste questions first.', 'Keine Fragen geladen. Bitte fügen Sie zuerst Fragen ein.'));
      return;
    }

    const pendingQuestions = questionsForAnswers.filter(q => q.status === 'pending' || q.status === 'generating');
    if (pendingQuestions.length === 0) {
      alert(t('No pending questions to generate.', 'Keine ausstehenden Fragen zum Generieren.'));
      return;
    }

    setIsGeneratingAnswers(true);
    setAnswerGenerationStatus(t('Creating OpenAI batch job...', 'Erstelle OpenAI Batch-Job...'));

    try {
      const selectedBrand = brands.find(b => b.id === selectedBrandId);
      const selectedModel = models.find(m => m.id === selectedModelId);
      const selectedGeneration = generations.find(g => g.id === selectedGenerationId);

      // Build context prompt
      let context = '';
      if (selectedBrand && selectedModel) {
        context = `This is about ${selectedBrand.name} ${selectedModel.name}${selectedGeneration ? ` ${selectedGeneration.name}` : ''}. `;
      }

      const systemPrompt = 'You are an expert automotive technician and repair specialist. Provide detailed, step-by-step solutions for car problems and maintenance procedures.';
      
      // Prepare questions for batch
      const questions = pendingQuestions.map(q => context + q.question);

      // Create batch via API
      const response = await fetch('/api/batch/openai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questions,
          prompt: systemPrompt,
          model: 'gpt-4o',
          metadata: {
            type: 'car_answers',
            brand: selectedBrand?.name,
            model: selectedModel?.name,
            generation: selectedGeneration?.name,
            lang,
            questionType
          }
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Batch creation failed');
      }

      const batchData = await response.json();
      
      // Add to batch jobs list
      setBatchJobs(prev => [...prev, {
        id: batchData.batchId,
        type: 'answers',
        status: batchData.status,
        createdAt: new Date().toISOString(),
        questionsCount: questions.length
      }]);

      // Update questions status
      setQuestionsForAnswers(prev => prev.map(q => 
        pendingQuestions.some(pq => pq.id === q.id)
          ? { ...q, status: 'generating' as const }
          : q
      ));

      setAnswerGenerationStatus(t(
        `✅ Batch job created! ID: ${batchData.batchId}. Status: ${batchData.status}. Monitoring...`,
        `✅ Batch-Job erstellt! ID: ${batchData.batchId}. Status: ${batchData.status}. Überwache...`
      ));

      // Start monitoring
      setMonitoringBatchId(batchData.batchId);
      monitorBatchJob(batchData.batchId, 'answers');
    } catch (error) {
      console.error('Batch generation error:', error);
      setAnswerGenerationStatus(t(
        `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        `Fehler: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
      ));
    } finally {
      setIsGeneratingAnswers(false);
    }
  }

  // Monitor batch job status and download results when complete
  async function monitorBatchJob(batchId: string, type: 'answers' | 'metadata') {
    const maxAttempts = 300; // 5 minutes max (1 second intervals)
    let attempts = 0;

    const checkStatus = async () => {
      try {
        const response = await fetch(`/api/batch/openai?batchId=${batchId}`);
        if (!response.ok) {
          throw new Error('Failed to check batch status');
        }

        const status = await response.json();
        
        // Update batch job status
        setBatchJobs(prev => prev.map(job => 
          job.id === batchId ? { ...job, status: status.status } : job
        ));

        if (status.status === 'completed') {
          // Download results
          if (status.output_file_id) {
            await downloadBatchResults(status.output_file_id, batchId, type);
          }
          setMonitoringBatchId(null);
          return;
        } else if (status.status === 'failed' || status.status === 'expired' || status.status === 'cancelled') {
          setAnswerGenerationStatus(t(
            `Batch job ${status.status}. Check OpenAI dashboard for details.`,
            `Batch-Job ${status.status}. Prüfen Sie das OpenAI-Dashboard für Details.`
          ));
          setMonitoringBatchId(null);
          return;
        }

        // Continue monitoring
        attempts++;
        if (attempts < maxAttempts && !shouldStopGeneration) {
          setTimeout(checkStatus, 2000); // Check every 2 seconds
        } else {
          setAnswerGenerationStatus(t(
            'Batch monitoring timeout. Check status manually.',
            'Batch-Überwachung-Timeout. Status manuell prüfen.'
          ));
          setMonitoringBatchId(null);
        }
      } catch (error) {
        console.error('Error monitoring batch:', error);
        setMonitoringBatchId(null);
      }
    };

    checkStatus();
  }

  // Download and process batch results
  async function downloadBatchResults(fileId: string, batchId: string, type: 'answers' | 'metadata') {
    try {
      setAnswerGenerationStatus(t('Downloading batch results...', 'Lade Batch-Ergebnisse herunter...'));

      const response = await fetch(`/api/batch/openai?fileId=${fileId}`);
      if (!response.ok) {
        throw new Error('Failed to download results');
      }

      const text = await response.text();
      const lines = text.split('\n').filter(l => l.trim());
      
      if (type === 'answers') {
        // Process answer results
        type BatchResult = {
          custom_id: string;
          response?: {
            body?: {
              choices?: Array<{
                message?: {
                  content?: string;
                };
              }>;
            };
          };
        };
        const results: BatchResult[] = [];
        
        for (const line of lines) {
          try {
            const result = JSON.parse(line);
            results.push(result);
          } catch (e) {
            console.error('Error parsing result line:', e);
          }
        }

        // Match results to questions by custom_id
        setQuestionsForAnswers(prev => {
          const updated = [...prev];
          results.forEach((result, index) => {
            const customId = result.custom_id || `request-${index + 1}`;
            const match = customId.match(/request-(\d+)/);
            if (match) {
              const questionIndex = parseInt(match[1]) - 1;
              const question = updated.find((q, idx) => {
                const pending = prev.filter(pq => pq.status === 'pending' || pq.status === 'generating');
                return pending[questionIndex]?.id === q.id;
              });
              
              if (question) {
                const answer = result.response?.body?.choices?.[0]?.message?.content || '';
                const questionIndexInUpdated = updated.findIndex(q => q.id === question.id);
                if (questionIndexInUpdated !== -1) {
                  updated[questionIndexInUpdated] = {
                    ...updated[questionIndexInUpdated],
                    status: 'done',
                    answer
                  };
                }
              }
            }
          });
          return updated;
        });

        setAnswerGenerationStatus(t(
          `✅ Batch completed! Processed ${results.length} answers.`,
          `✅ Batch abgeschlossen! ${results.length} Antworten verarbeitet.`
        ));
      } else if (type === 'metadata') {
        // Process metadata results
        type BatchResult = {
          custom_id: string;
          response?: {
            body?: {
              choices?: Array<{
                message?: {
                  content?: string;
                };
              }>;
            };
          };
        };
        const results: BatchResult[] = [];
        
        for (const line of lines) {
          try {
            const result = JSON.parse(line);
            results.push(result);
          } catch (e) {
            console.error('Error parsing metadata result line:', e);
          }
        }

        // Match results to questions
        setQuestionsForAnswers(prev => {
          const updated = [...prev];
          results.forEach((result, index) => {
            const customId = result.custom_id || `request-${index + 1}`;
            const match = customId.match(/request-(\d+)/);
            if (match) {
              const questionIndex = parseInt(match[1]) - 1;
              const question = updated.find((q, idx) => {
                const pending = prev.filter(pq => pq.status === 'done' || pq.status === 'metadata_pending');
                return pending[questionIndex]?.id === q.id;
              });
              
              if (question) {
                const metadataText = result.response?.body?.choices?.[0]?.message?.content || '';
                try {
                  const metadata = JSON.parse(metadataText);
                  const questionIndexInUpdated = updated.findIndex(q => q.id === question.id);
                  if (questionIndexInUpdated !== -1) {
                    updated[questionIndexInUpdated] = {
                      ...updated[questionIndexInUpdated],
                      status: 'metadata_done',
                      metadata
                    };
                  }
                } catch (e) {
                  console.error('Error parsing metadata JSON:', e);
                }
              }
            }
          });
          return updated;
        });

        setMetadataGenerationStatus(t(
          `✅ Batch metadata completed! Processed ${results.length} items.`,
          `✅ Batch-Metadaten abgeschlossen! ${results.length} Elemente verarbeitet.`
        ));
      }
    } catch (error) {
      console.error('Error processing batch results:', error);
      setAnswerGenerationStatus(t(
        `Error processing results: ${error instanceof Error ? error.message : 'Unknown error'}`,
        `Fehler beim Verarbeiten der Ergebnisse: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
      ));
    }
  }

  async function handleGenerateAnswers() {
    if (questionsForAnswers.length === 0) {
      alert(t('No questions loaded. Please paste questions first.', 'Keine Fragen geladen. Bitte fügen Sie zuerst Fragen ein.'));
      return;
    }

    // Use batch generation if enabled
    if (useBatchGeneration) {
      return handleBatchGenerateAnswers();
    }

    setIsGeneratingAnswers(true);
    setShouldStopGeneration(false);
    setAnswerGenerationStatus(t('Generating answers...', 'Generiere Antworten...'));
    setAbortControllers([]);

    const updatedQuestions = questionsForAnswers.map(q => ({
      ...q,
      status: 'generating' as const
    }));
    setQuestionsForAnswers(updatedQuestions);

    try {
      const selectedBrand = brands.find(b => b.id === selectedBrandId);
      const selectedModel = models.find(m => m.id === selectedModelId);
      const selectedGeneration = generations.find(g => g.id === selectedGenerationId);

      // Process in batches of 35 for faster parallel generation
      const BATCH_SIZE = 35;
      const pendingQuestions = questionsForAnswers.filter(q => q.status === 'pending' || q.status === 'generating');
      
      for (let batchStart = 0; batchStart < pendingQuestions.length; batchStart += BATCH_SIZE) {
        if (shouldStopGeneration) {
          setAnswerGenerationStatus(t(
            `Stopped by user. Processed ${batchStart}/${pendingQuestions.length} questions.`,
            `Vom Benutzer gestoppt. ${batchStart}/${pendingQuestions.length} Fragen verarbeitet.`
          ));
          break;
        }

        const batch = pendingQuestions.slice(batchStart, batchStart + BATCH_SIZE);
        setAnswerGenerationStatus(t(
          `Generating batch ${Math.floor(batchStart / BATCH_SIZE) + 1} (${batchStart + 1}-${Math.min(batchStart + BATCH_SIZE, pendingQuestions.length)}/${pendingQuestions.length})...`,
          `Generiere Batch ${Math.floor(batchStart / BATCH_SIZE) + 1} (${batchStart + 1}-${Math.min(batchStart + BATCH_SIZE, pendingQuestions.length)}/${pendingQuestions.length})...`
        ));

        // Generate all answers in this batch in parallel
        const batchPromises = batch.map(async (question) => {
          try {
            // Build context for the answer
            let context = '';
            if (selectedBrand && selectedModel) {
              context = `This is about ${selectedBrand.name} ${selectedModel.name}${selectedGeneration ? ` ${selectedGeneration.name}` : ''}. `;
            }

            // Create abort controller for this request
            const abortController = new AbortController();
            setAbortControllers(prev => [...prev, abortController]);

            // Use a dedicated car answer generation endpoint that doesn't save to questions2
            const response = await fetch('/api/cars/generate-answer', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                question: context + question.question,
                language: lang,
                brand: selectedBrand?.name,
                model: selectedModel?.name,
                generation: selectedGeneration?.name,
              }),
              signal: abortController.signal
            });

            // Remove controller from list
            setAbortControllers(prev => prev.filter(ac => ac !== abortController));

            if (!response.ok) {
              const errorText = await response.text();
              throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            const data = await response.json();
            const answerText = data.answer || '';
            
            // Save answer to localStorage for backup
            try {
              const savedAnswers = JSON.parse(localStorage.getItem('car_generated_answers') || '[]');
              savedAnswers.push({
                question: question.question,
                answer: answerText,
                generationId: selectedGenerationId,
                questionType,
                lang,
                timestamp: new Date().toISOString()
              });
              // Keep only last 1000 answers
              if (savedAnswers.length > 1000) {
                savedAnswers.splice(0, savedAnswers.length - 1000);
              }
              localStorage.setItem('car_generated_answers', JSON.stringify(savedAnswers));
            } catch (e) {
              console.error('Failed to save answer to localStorage:', e);
            }
            
            setQuestionsForAnswers(prev => prev.map(q => 
              q.id === question.id 
                ? { ...q, status: 'done', answer: answerText }
                : q
            ));
            
            return { success: true, questionId: question.id };
          } catch (error) {
            // Don't mark as error if it was aborted
            if (error instanceof Error && error.name === 'AbortError') {
              setQuestionsForAnswers(prev => prev.map(q => 
                q.id === question.id 
                  ? { ...q, status: 'pending' }
                  : q
              ));
              return { success: false, questionId: question.id, aborted: true };
            } else {
              setQuestionsForAnswers(prev => prev.map(q => 
                q.id === question.id 
                  ? { ...q, status: 'error', error: error instanceof Error ? error.message : 'Unknown error' }
                  : q
              ));
              return { success: false, questionId: question.id, error: error instanceof Error ? error.message : 'Unknown error' };
            }
          }
        });

        // Wait for all requests in this batch to complete
        await Promise.all(batchPromises);

        // Small delay between batches to avoid rate limiting
        if (!shouldStopGeneration && batchStart + BATCH_SIZE < pendingQuestions.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      if (!shouldStopGeneration) {
        const successful = questionsForAnswers.filter(q => q.status === 'done').length;
        setAnswerGenerationStatus(t(
          `Completed! ${successful} answers generated successfully.`,
          `Abgeschlossen! ${successful} Antworten erfolgreich generiert.`
        ));
        
        // Update status to metadata_pending if metadata generation is enabled
        if (enableMetadataGeneration && successful > 0) {
          setQuestionsForAnswers(prev => prev.map(q => 
            q.status === 'done' 
              ? { ...q, status: 'metadata_pending' as const }
              : q
          ));
        }
        
        // If auto mode is enabled, automatically proceed to metadata generation or import
        if (autoMode && successful > 0) {
          if (enableMetadataGeneration) {
            setTimeout(() => {
              handleGenerateMetadata();
            }, 1000);
          } else {
            setTimeout(() => {
              handleBulkImport();
            }, 1000);
          }
        }
      }
    } catch (error) {
      console.error('Answer generation error:', error);
      setAnswerGenerationStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsGeneratingAnswers(false);
      setAbortControllers([]);
    }
  }

  function handleStopGeneration() {
    setShouldStopGeneration(true);
    // Abort all ongoing requests
    abortControllers.forEach(controller => {
      try {
        controller.abort();
      } catch (e) {
        // Ignore errors
      }
    });
    setAbortControllers([]);
    setAnswerGenerationStatus('Stopping generation...');
  }


  // Download answers as JSONL file for batch processing
  function handleDownloadAnswers() {
    const successfulQuestions = questionsForAnswers.filter(q => q.status === 'done' && q.answer);
    if (successfulQuestions.length === 0) {
      alert(t('No answers to download', 'Keine Antworten zum Herunterladen'));
      return;
    }

    const jsonl = successfulQuestions.map((q, i) => {
      const selectedBrand = brands.find(b => b.id === selectedBrandId);
      const selectedModel = models.find(m => m.id === selectedModelId);
      const selectedGeneration = generations.find(g => g.id === selectedGenerationId);
      
      let context = '';
      if (selectedBrand && selectedModel) {
        context = `This is about ${selectedBrand.name} ${selectedModel.name}${selectedGeneration ? ` ${selectedGeneration.name}` : ''}. `;
      }

      return JSON.stringify({
        custom_id: `car-answer-${i + 1}`,
        method: 'POST',
        url: '/v1/chat/completions',
        body: {
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: 'You are an expert automotive technician and repair specialist. Provide detailed, step-by-step solutions for car problems and maintenance procedures.'
            },
            {
              role: 'user',
              content: context + q.question
            }
          ],
          temperature: 0.3,
          max_tokens: 2000,
        },
      });
    }).join('\n');

    const blob = new Blob([jsonl], { type: 'application/jsonl' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `car_answers_${selectedBrand?.slug || 'brand'}_${selectedModel?.slug || 'model'}_${selectedGeneration?.slug || 'generation'}_${new Date().toISOString().split('T')[0]}.jsonl`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Download metadata as JSONL file
  function handleDownloadMetadata() {
    const questionsWithMetadata = questionsForAnswers.filter(q => q.status === 'metadata_done' && q.metadata);
    if (questionsWithMetadata.length === 0) {
      alert(t('No metadata to download', 'Keine Metadaten zum Herunterladen'));
      return;
    }

    const jsonl = questionsWithMetadata.map((q, i) => {
      return JSON.stringify({
        custom_id: `car-metadata-${i + 1}`,
        method: 'POST',
        url: '/v1/chat/completions',
        body: {
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: 'You are an expert at extracting structured metadata from automotive technical content. Always return valid JSON only.'
            },
            {
              role: 'user',
              content: `Generate metadata for: ${q.question.substring(0, 200)}...`
            }
          ],
          temperature: 0.2,
          max_tokens: 1500,
        },
      });
    }).join('\n');

    const blob = new Blob([jsonl], { type: 'application/jsonl' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `car_metadata_${selectedBrand?.slug || 'brand'}_${selectedModel?.slug || 'model'}_${selectedGeneration?.slug || 'generation'}_${new Date().toISOString().split('T')[0]}.jsonl`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Handle file upload for bulk import
  function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        
        if (file.name.endsWith('.jsonl')) {
          // Parse JSONL file (answers or metadata from batch processing)
          const lines = content.split('\n').filter(l => l.trim());
          const parsed: Array<{ question?: string; answer?: string; metadata?: CarMetadata }> = [];
          
          for (const line of lines) {
            try {
              const obj = JSON.parse(line);
              // Check if it's a batch response
              if (obj.response?.body?.choices?.[0]?.message?.content) {
                const answer = obj.response.body.choices[0].message.content;
                // Try to extract question from custom_id or previous context
                parsed.push({ answer });
              } else if (obj.question && obj.answer) {
                // Direct format
                parsed.push({ question: obj.question, answer: obj.answer, metadata: obj.metadata });
              }
            } catch (err) {
              console.error('Error parsing JSONL line:', err);
            }
          }
          
          if (parsed.length > 0) {
            // Load into questionsForAnswers
            const newQuestions: GeneratedQuestion[] = parsed.map((item, index) => ({
              id: crypto.randomUUID(),
              question: item.question || `Imported question ${index + 1}`,
              status: (item.answer ? (item.metadata ? 'metadata_done' : 'done') : 'pending') as GeneratedQuestion['status'],
              answer: item.answer,
              metadata: item.metadata,
            }));
            
            setQuestionsForAnswers(prev => [...prev, ...newQuestions]);
            setAnswerGenerationStatus(t(
              `Loaded ${newQuestions.length} items from file`,
              `${newQuestions.length} Elemente aus Datei geladen`
            ));
          }
        } else if (file.name.endsWith('.txt')) {
          // Parse text file (questions, one per line)
          const questions = content.split('\n').filter(l => l.trim()).map(q => q.trim());
          const newQuestions = questions.map(q => ({
            id: uuidv4(),
            question: q,
            status: 'pending' as const,
          }));
          
          setQuestionsForAnswers(prev => [...prev, ...newQuestions]);
          setAnswerGenerationStatus(t(
            `Loaded ${newQuestions.length} questions from file`,
            `${newQuestions.length} Fragen aus Datei geladen`
          ));
        }
      } catch (error) {
        console.error('Error reading file:', error);
        alert(t('Error reading file', 'Fehler beim Lesen der Datei'));
      }
    };
    
    reader.readAsText(file);
  }

  // Helper function to generate slug from title
  function generateSlug(title: string): string {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 100);
  }

  // Generate metadata for all questions with answers
  async function handleGenerateMetadata() {
    const questionsWithAnswers = questionsForAnswers.filter(q => 
      q.status === 'done' || q.status === 'metadata_pending' || q.status === 'metadata_done'
    );
    
    if (questionsWithAnswers.length === 0) {
      alert(t('No questions with answers to generate metadata for', 'Keine Fragen mit Antworten für Metadaten-Generierung'));
      return;
    }

    setIsGeneratingMetadata(true);
    setShouldStopMetadataGeneration(false);
    setMetadataGenerationStatus(t('Generating metadata...', 'Generiere Metadaten...'));

    const selectedBrand = brands.find(b => b.id === selectedBrandId);
    const selectedModel = models.find(m => m.id === selectedModelId);
    const selectedGeneration = generations.find(g => g.id === selectedGenerationId);

    try {
      let successCount = 0;
      let errorCount = 0;

      // Process in batches of 35 for faster parallel metadata generation
      const BATCH_SIZE = 35;
      const itemsToProcess = questionsWithAnswers.filter(q => 
        q.status === 'done' || q.status === 'metadata_pending'
      ).filter(q => !(q.status === 'metadata_done' && q.metadata));

      for (let batchStart = 0; batchStart < itemsToProcess.length; batchStart += BATCH_SIZE) {
        if (shouldStopMetadataGeneration) {
          setMetadataGenerationStatus(t(
            `Metadata generation stopped. Processed ${batchStart}/${itemsToProcess.length} items.`,
            `Metadaten-Generierung gestoppt. ${batchStart}/${itemsToProcess.length} Elemente verarbeitet.`
          ));
          break;
        }

        const batch = itemsToProcess.slice(batchStart, batchStart + BATCH_SIZE);
        setMetadataGenerationStatus(t(
          `Generating metadata batch ${Math.floor(batchStart / BATCH_SIZE) + 1} (${batchStart + 1}-${Math.min(batchStart + BATCH_SIZE, itemsToProcess.length)}/${itemsToProcess.length})...`,
          `Generiere Metadaten-Batch ${Math.floor(batchStart / BATCH_SIZE) + 1} (${batchStart + 1}-${Math.min(batchStart + BATCH_SIZE, itemsToProcess.length)}/${itemsToProcess.length})...`
        ));

        // Update all to generating status
        setQuestionsForAnswers(prev => prev.map(q => 
          batch.some(b => b.id === q.id) && q.status !== 'metadata_done'
            ? { ...q, status: 'metadata_generating' as const }
            : q
        ));

        // Generate all metadata in this batch in parallel
        const batchPromises = batch.map(async (item) => {
          try {
            const response = await fetch('/api/cars/generate-metadata', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                question: item.question,
                answer: item.answer,
                questionType,
                brand: selectedBrand?.name,
                model: selectedModel?.name,
                generation: selectedGeneration?.name,
              }),
            });

            if (!response.ok) {
              throw new Error(`HTTP ${response.status}: ${await response.text()}`);
            }

            const data = await response.json();
            
            // Update with metadata
            setQuestionsForAnswers(prev => prev.map(q => 
              q.id === item.id 
                ? { ...q, status: 'metadata_done' as const, metadata: data.metadata }
                : q
            ));
            
            return { success: true, questionId: item.id };
          } catch (error) {
            console.error(`Error generating metadata for item:`, error);
            setQuestionsForAnswers(prev => prev.map(q => 
              q.id === item.id 
                ? { ...q, status: 'done' as const, error: error instanceof Error ? error.message : 'Unknown error' }
                : q
            ));
            return { success: false, questionId: item.id, error: error instanceof Error ? error.message : 'Unknown error' };
          }
        });

        // Wait for all requests in this batch to complete
        const results = await Promise.all(batchPromises);
        successCount += results.filter(r => r.success).length;
        errorCount += results.filter(r => !r.success).length;

        // Small delay between batches
        if (!shouldStopMetadataGeneration && batchStart + BATCH_SIZE < itemsToProcess.length) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      if (!shouldStopMetadataGeneration) {
        setMetadataGenerationStatus(t(
          `✅ Metadata generation complete! ${successCount} successful, ${errorCount} errors.`,
          `✅ Metadaten-Generierung abgeschlossen! ${successCount} erfolgreich, ${errorCount} Fehler.`
        ));
        
        // If auto mode, proceed to import
        if (autoMode && successCount > 0) {
          setTimeout(() => {
            handleBulkImport();
          }, 1000);
        }
      }
    } catch (error) {
      console.error('Metadata generation error:', error);
      setMetadataGenerationStatus(t(
        `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        `Fehler: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
      ));
    } finally {
      setIsGeneratingMetadata(false);
      setShouldStopMetadataGeneration(false);
    }
  }

  // Enhanced bulk import with better slug handling and metadata extraction
  async function handleBulkImport() {
    const successfulQuestions = questionsForAnswers.filter(q => 
      (q.status === 'done' || q.status === 'metadata_done') && q.answer
    );
    
    if (successfulQuestions.length === 0) {
      alert(t('No successful answers to import', 'Keine erfolgreichen Antworten zum Importieren'));
      return;
    }

    if (!selectedGenerationId) {
      alert(t('Please select a generation first', 'Bitte wählen Sie zuerst eine Generation aus'));
      return;
    }

    const selectedBrand = brands.find(b => b.id === selectedBrandId);
    const selectedModel = models.find(m => m.id === selectedModelId);
    const selectedGeneration = generations.find(g => g.id === selectedGenerationId);

    const confirmMessage = t(
      `Import ${successfulQuestions.length} ${questionType === 'fault' ? 'faults' : 'manuals'} for ${selectedBrand?.name} ${selectedModel?.name} ${selectedGeneration?.name}?`,
      `${successfulQuestions.length} ${questionType === 'fault' ? 'Fehler' : 'Anleitungen'} für ${selectedBrand?.name} ${selectedModel?.name} ${selectedGeneration?.name} importieren?`
    );
    if (!confirm(confirmMessage)) return;

    setIsImporting(true);
    setShouldStopImport(false);
    setAnswerGenerationStatus(t('Importing to database...', 'Importiere in Datenbank...'));

    try {
      const importedItems: Array<{ id: string; slug: string; title: string; url: string }> = [];
      let successCount = 0;
      let errorCount = 0;

      for (let i = 0; i < successfulQuestions.length; i++) {
        // Check if user wants to stop
        if (shouldStopImport) {
          setAnswerGenerationStatus(t(`Import stopped by user. Processed ${i}/${successfulQuestions.length} items.`, `Import vom Benutzer gestoppt. ${i}/${successfulQuestions.length} Elemente verarbeitet.`));
          break;
        }

        const item = successfulQuestions[i];
        setAnswerGenerationStatus(t(`Importing ${i + 1}/${successfulQuestions.length}...`, `Importiere ${i + 1}/${successfulQuestions.length}...`));

        try {
          // Validate required data
          if (!item.answer || !item.question) {
            throw new Error('Missing answer or question');
          }

          if (!selectedGenerationId) {
            throw new Error('Missing generation ID');
          }

          // Generate unique slug
          let baseSlug = generateSlug(item.question);
          if (!baseSlug || baseSlug.length === 0) {
            baseSlug = `item-${Date.now()}-${i}`;
          }
          let slug = baseSlug;
          let counter = 0;

          // Check if slug exists and make it unique
          while (true) {
            const { data: existing, error: checkError } = await supabase
              .from(questionType === 'fault' ? 'car_faults' : 'car_manuals')
              .select('id')
              .eq('slug', slug)
              .eq('model_generation_id', selectedGenerationId)
              .eq('language_path', lang)
              .maybeSingle();

            if (checkError) {
              console.error('Error checking slug:', checkError);
              throw checkError;
            }

            if (!existing) break; // Slug is unique
            counter++;
            slug = `${baseSlug}-${counter}`;
            if (counter > 1000) {
              slug = `${baseSlug}-${Date.now()}-${i}`;
              break;
            }
          }

          // Extract title (first line or first sentence)
          const title = item.question.length > 100 
            ? item.question.substring(0, 100).trim() + '...'
            : item.question.trim();

          // Extract description (use meta_description from metadata if available, otherwise first paragraph)
          const description = item.metadata?.meta_description 
            || (item.answer?.split('\n\n')[0]?.substring(0, 200) || item.question || '').trim();
          
          if (!description) {
            throw new Error('Description is empty');
          }

          // Prepare insert data - ensure all required fields are present
          const insertData: any = {
            model_generation_id: selectedGenerationId,
            slug: slug.trim(),
            title: title.trim(),
            description: description,
            language_path: lang,
            status: 'live' // Set to 'live' so pages are immediately accessible
          };

          // Add metadata fields if available
          if (item.metadata) {
            if (questionType === 'fault') {
              if (item.metadata.severity) insertData.severity = item.metadata.severity;
              if (item.metadata.difficulty_level) insertData.difficulty_level = item.metadata.difficulty_level;
              if (item.metadata.error_code) insertData.error_code = item.metadata.error_code;
              if (item.metadata.affected_component) insertData.affected_component = item.metadata.affected_component;
              if (item.metadata.symptoms) insertData.symptoms = item.metadata.symptoms;
              if (item.metadata.diagnostic_steps) insertData.diagnostic_steps = item.metadata.diagnostic_steps;
              if (item.metadata.tools_required) insertData.tools_required = item.metadata.tools_required;
              if (item.metadata.estimated_repair_time) insertData.estimated_repair_time = item.metadata.estimated_repair_time;
              if (item.metadata.meta_title) insertData.meta_title = item.metadata.meta_title;
              if (item.metadata.meta_description) insertData.meta_description = item.metadata.meta_description;
              if (item.metadata.seo_score !== undefined && item.metadata.seo_score !== null) insertData.seo_score = item.metadata.seo_score;
              if (item.metadata.content_score !== undefined && item.metadata.content_score !== null) insertData.content_score = item.metadata.content_score;
            } else {
              if (item.metadata.difficulty_level) insertData.difficulty_level = item.metadata.difficulty_level;
              if (item.metadata.manual_type) insertData.manual_type = item.metadata.manual_type;
              if (item.metadata.estimated_time) insertData.estimated_time = item.metadata.estimated_time;
              if (item.metadata.tools_required) insertData.tools_required = item.metadata.tools_required;
              if (item.metadata.parts_required) insertData.parts_required = item.metadata.parts_required;
              if (item.metadata.meta_title) insertData.meta_title = item.metadata.meta_title;
              if (item.metadata.meta_description) insertData.meta_description = item.metadata.meta_description;
            }
          }

          // Validate all required fields
          if (!insertData.model_generation_id) {
            throw new Error('model_generation_id is required');
          }
          if (!insertData.slug || insertData.slug.length === 0) {
            throw new Error('slug is required');
          }
          if (!insertData.title || insertData.title.length === 0) {
            throw new Error('title is required');
          }
          if (!insertData.description || insertData.description.length === 0) {
            throw new Error('description is required');
          }
          if (!insertData.language_path) {
            throw new Error('language_path is required');
          }

          if (questionType === 'fault') {
            insertData.solution = item.answer.trim();
            
            const { data, error } = await supabase
              .from('car_faults')
              .insert(insertData)
              .select('id, slug')
              .single();

            if (error) {
              console.error(`Error inserting fault ${i + 1}:`, {
                error,
                errorMessage: error.message,
                errorDetails: error.details,
                errorHint: error.hint,
                code: error.code,
                insertData: { ...insertData, solution: insertData.solution?.substring(0, 100) + '...' }
              });
              throw new Error(`Database error: ${error.message || JSON.stringify(error)}`);
            }

            if (data) {
              const fullUrl = `https://faultbase.com/${lang}/cars/${selectedBrand?.slug}/${selectedModel?.slug}/${selectedGeneration?.slug}/faults/${data.slug}`;
              
              importedItems.push({
                id: data.id,
                slug: data.slug,
                title,
                url: `/${lang}/cars/${selectedBrand?.slug}/${selectedModel?.slug}/${selectedGeneration?.slug}/faults/${data.slug}`
              });
              
              // Submit to IndexNow for immediate indexing (non-blocking)
              try {
                const { submitToIndexNow } = await import('@/lib/submitToIndexNow');
                submitToIndexNow(fullUrl).catch(err => {
                  console.warn('[IndexNow] Failed to submit car fault URL:', err);
                });
              } catch (err) {
                // Fail silently - don't let IndexNow errors affect the import
                console.warn('[IndexNow] Error importing submitToIndexNow:', err);
              }
              
              successCount++;
            }
          } else {
            insertData.content = item.answer.trim();
            
            const { data, error } = await supabase
              .from('car_manuals')
              .insert(insertData)
              .select('id, slug')
              .single();

            if (error) {
              console.error(`Error inserting manual ${i + 1}:`, {
                error,
                errorMessage: error.message,
                errorDetails: error.details,
                errorHint: error.hint,
                code: error.code,
                insertData: { ...insertData, content: insertData.content?.substring(0, 100) + '...' }
              });
              throw new Error(`Database error: ${error.message || JSON.stringify(error)}`);
            }

            if (data) {
              const fullUrl = `https://faultbase.com/${lang}/cars/${selectedBrand?.slug}/${selectedModel?.slug}/${selectedGeneration?.slug}/manuals/${data.slug}`;
              
              importedItems.push({
                id: data.id,
                slug: data.slug,
                title,
                url: `/${lang}/cars/${selectedBrand?.slug}/${selectedModel?.slug}/${selectedGeneration?.slug}/manuals/${data.slug}`
              });
              
              // Submit to IndexNow for immediate indexing (non-blocking)
              try {
                const { submitToIndexNow } = await import('@/lib/submitToIndexNow');
                submitToIndexNow(fullUrl).catch(err => {
                  console.warn('[IndexNow] Failed to submit car manual URL:', err);
                });
              } catch (err) {
                // Fail silently - don't let IndexNow errors affect the import
                console.warn('[IndexNow] Error importing submitToIndexNow:', err);
              }
              
              successCount++;
            }
          }
        } catch (error) {
          const errorMessage = error instanceof Error 
            ? error.message 
            : typeof error === 'string' 
            ? error 
            : JSON.stringify(error);
          
          console.error(`Error importing item ${i + 1}:`, {
            error,
            errorMessage,
            question: item.question?.substring(0, 50),
            hasAnswer: !!item.answer,
            answerLength: item.answer?.length
          });
          
          // Save failed item to localStorage for recovery
          try {
            const failedItems = JSON.parse(localStorage.getItem('car_failed_imports') || '[]');
            failedItems.push({
              index: i + 1,
              question: item.question,
              answer: item.answer,
              error: errorMessage,
              timestamp: new Date().toISOString()
            });
            localStorage.setItem('car_failed_imports', JSON.stringify(failedItems));
          } catch (e) {
            console.error('Failed to save to localStorage:', e);
          }
          
          errorCount++;
        }
      }

      if (!shouldStopImport) {
        setAnswerGenerationStatus(
          t(
            `✅ Successfully imported ${successCount} items! ${errorCount > 0 ? `(${errorCount} errors)` : ''}`,
            `✅ Erfolgreich ${successCount} Elemente importiert! ${errorCount > 0 ? `(${errorCount} Fehler)` : ''}`
          )
        );
      }
      
      // Store imported items for display
      setImportedItems(importedItems);
      setQuestionsForAnswers([]);
    } catch (error) {
      console.error('Import error:', error);
      setAnswerGenerationStatus(t(
        `Import error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        `Import-Fehler: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
      ));
    } finally {
      setIsImporting(false);
      setShouldStopImport(false);
    }
  }

  const selectedBrand = brands.find(b => b.id === selectedBrandId);
  const selectedModel = models.find(m => m.id === selectedModelId);
  const selectedGeneration = generations.find(g => g.id === selectedGenerationId);

  return (
    <InternalAuth>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('Car Content Generator', 'Auto-Inhaltsgenerator')}</h1>
            <div className="flex gap-4 flex-wrap">
              <Link
                href={`/${lang}/internal`}
                className="text-blue-600 hover:underline text-sm"
              >
                ← {t('Back to Internal', 'Zurück zu Intern')}
              </Link>
              <Link
                href={`/${lang}/carbulk`}
                className="text-red-600 hover:underline text-sm font-semibold"
              >
                {t('Bulk Generator', 'Bulk-Generator')} →
              </Link>
              <Link
                href={`/${lang}/internal/car-comments`}
                className="text-blue-600 hover:underline text-sm"
              >
                {t('Car Comments Generator', 'Auto-Kommentare Generator')} →
              </Link>
            </div>
          </div>

          {/* Workflow Progress Indicator */}
          <div className="bg-white shadow rounded-lg p-6 mb-8">
            <h2 className="text-lg font-semibold mb-4">{t('Workflow Progress', 'Workflow-Fortschritt')}</h2>
            <div className="flex items-center justify-between">
              <div className={`flex items-center ${selectedGenerationId ? 'text-green-600' : 'text-gray-400'}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${selectedGenerationId ? 'bg-green-100' : 'bg-gray-100'}`}>
                  {selectedGenerationId ? '✓' : '1'}
                </div>
                <span className="ml-2 font-medium">{t('Selection', 'Auswahl')}</span>
              </div>
              <div className={`flex-1 h-1 mx-4 ${generatedQuestions.length > 0 ? 'bg-green-500' : 'bg-gray-200'}`}></div>
              <div className={`flex items-center ${generatedQuestions.length > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${generatedQuestions.length > 0 ? 'bg-green-100' : 'bg-gray-100'}`}>
                  {generatedQuestions.length > 0 ? '✓' : '2'}
                </div>
                <span className="ml-2 font-medium">{t('Questions', 'Fragen')}</span>
              </div>
              <div className={`flex-1 h-1 mx-4 ${questionsForAnswers.filter(q => q.status === 'done' || q.status === 'metadata_done').length > 0 ? 'bg-green-500' : 'bg-gray-200'}`}></div>
              <div className={`flex items-center ${questionsForAnswers.filter(q => q.status === 'done' || q.status === 'metadata_done').length > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${questionsForAnswers.filter(q => q.status === 'done' || q.status === 'metadata_done').length > 0 ? 'bg-green-100' : 'bg-gray-100'}`}>
                  {questionsForAnswers.filter(q => q.status === 'done' || q.status === 'metadata_done').length > 0 ? '✓' : '3'}
                </div>
                <span className="ml-2 font-medium">{t('Answers', 'Antworten')}</span>
              </div>
              {enableMetadataGeneration && (
                <>
                  <div className={`flex-1 h-1 mx-4 ${questionsForAnswers.filter(q => q.status === 'metadata_done').length > 0 ? 'bg-green-500' : 'bg-gray-200'}`}></div>
                  <div className={`flex items-center ${questionsForAnswers.filter(q => q.status === 'metadata_done').length > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${questionsForAnswers.filter(q => q.status === 'metadata_done').length > 0 ? 'bg-green-100' : 'bg-gray-100'}`}>
                      {questionsForAnswers.filter(q => q.status === 'metadata_done').length > 0 ? '✓' : '4'}
                    </div>
                    <span className="ml-2 font-medium">{t('Metadata', 'Metadaten')}</span>
                  </div>
                </>
              )}
              <div className={`flex-1 h-1 mx-4 ${importedItems.length > 0 ? 'bg-green-500' : 'bg-gray-200'}`}></div>
              <div className={`flex items-center ${importedItems.length > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${importedItems.length > 0 ? 'bg-green-100' : 'bg-gray-100'}`}>
                  {importedItems.length > 0 ? '✓' : enableMetadataGeneration ? '5' : '4'}
                </div>
                <span className="ml-2 font-medium">{t('Import', 'Import')}</span>
              </div>
            </div>
          </div>

          {/* Statistics Dashboard */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white shadow rounded-lg p-4">
              <div className="text-2xl font-bold text-indigo-600">{generatedQuestions.length}</div>
              <div className="text-sm text-gray-600">{t('Questions Generated', 'Fragen generiert')}</div>
            </div>
            <div className="bg-white shadow rounded-lg p-4">
              <div className="text-2xl font-bold text-green-600">{questionsForAnswers.filter(q => q.status === 'done' || q.status === 'metadata_done').length}</div>
              <div className="text-sm text-gray-600">{t('Answers Ready', 'Antworten bereit')}</div>
            </div>
            {enableMetadataGeneration && (
              <div className="bg-white shadow rounded-lg p-4">
                <div className="text-2xl font-bold text-blue-600">{questionsForAnswers.filter(q => q.status === 'metadata_done').length}</div>
                <div className="text-sm text-gray-600">{t('With Metadata', 'Mit Metadaten')}</div>
              </div>
            )}
            <div className="bg-white shadow rounded-lg p-4">
              <div className="text-2xl font-bold text-purple-600">{importedItems.length}</div>
              <div className="text-sm text-gray-600">{t('Pages Created', 'Seiten erstellt')}</div>
            </div>
          </div>

          {/* Brand and Model Selection */}
          <div className="bg-white shadow rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">1. Select Brand, Model & Generation</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Brand</label>
                <select
                  className="w-full border rounded-md px-3 py-2"
                  value={selectedBrandId}
                  onChange={(e) => setSelectedBrandId(e.target.value)}
                >
                  <option value="">Select Brand</option>
                  {brands.map(brand => (
                    <option key={brand.id} value={brand.id}>{brand.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Model</label>
                <select
                  className="w-full border rounded-md px-3 py-2"
                  value={selectedModelId}
                  onChange={(e) => setSelectedModelId(e.target.value)}
                  disabled={!selectedBrandId}
                >
                  <option value="">Select Model</option>
                  {models.map(model => (
                    <option key={model.id} value={model.id}>{model.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Generation</label>
                <select
                  className="w-full border rounded-md px-3 py-2"
                  value={selectedGenerationId}
                  onChange={(e) => setSelectedGenerationId(e.target.value)}
                  disabled={!selectedModelId}
                >
                  <option value="">Select Generation</option>
                  {generations.map(gen => (
                    <option key={gen.id} value={gen.id}>{gen.name}</option>
                  ))}
                </select>
              </div>
            </div>
            {selectedBrand && selectedModel && (
              <div className="mt-4 p-3 bg-blue-50 rounded-md">
                <p className="text-sm text-blue-800">
                  Selected: <strong>{selectedBrand.name} {selectedModel.name}</strong>
                  {selectedGeneration && <span> - {selectedGeneration.name}</span>}
                </p>
              </div>
            )}
          </div>

          {/* Question Generation */}
          <div className="bg-white shadow rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">2. Generate Questions</h2>
            <form onSubmit={handleGenerateQuestions} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Content Type</label>
                  <select
                    className="w-full border rounded-md px-3 py-2"
                    value={questionType}
                    onChange={(e) => setQuestionType(e.target.value as 'fault' | 'manual')}
                  >
                    <option value="fault">Faults</option>
                    <option value="manual">Manuals</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useTestBatch}
                      onChange={(e) => setUseTestBatch(e.target.checked)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      {t('Test Batch (25 questions)', 'Test-Batch (25 Fragen)')}
                    </span>
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('Prompt (Optional - Auto-generated if empty)', 'Eingabeaufforderung (Optional - Automatisch generiert wenn leer)')}
                </label>
                <textarea
                  className="w-full border rounded-md px-3 py-2 min-h-[100px]"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={t(
                    "Leave empty for auto-generation of most searched problems/guides for the selected generation",
                    "Leer lassen für automatische Generierung der meistgesuchten Probleme/Anleitungen für die ausgewählte Generation"
                  )}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {t(
                    `If empty, will automatically generate the ${useTestBatch ? '25' : '100'} most searched problems/guides for the selected generation.`,
                    `Wenn leer, werden automatisch die ${useTestBatch ? '25' : '100'} meistgesuchten Probleme/Anleitungen für die ausgewählte Generation generiert.`
                  )}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="bg-indigo-600 text-white px-6 py-2 rounded-md font-semibold hover:bg-indigo-700 disabled:opacity-50"
                  disabled={isGenerating || !selectedGenerationId}
                >
                  {isGenerating 
                    ? t('Generating...', 'Generiere...') 
                    : t(`Generate ${useTestBatch ? '25' : '100'} Questions`, `${useTestBatch ? '25' : '100'} Fragen generieren`)}
                </button>
                {isGenerating && (
                  <button
                    type="button"
                    onClick={() => {
                      setShouldStopQuestionGeneration(true);
                      if (questionGenerationAbortController) {
                        questionGenerationAbortController.abort();
                      }
                      setIsGenerating(false);
                      setGenerationStatus(t('Generation cancelled by user.', 'Generierung vom Benutzer abgebrochen.'));
                    }}
                    className="bg-red-600 text-white px-6 py-2 rounded-md font-semibold hover:bg-red-700"
                  >
                    {t('Abort', 'Abbrechen')}
                  </button>
                )}
              </div>
            </form>

            {generationStatus && (
              <div className="mt-4 p-3 bg-gray-50 rounded-md">
                <p className="text-sm text-gray-700">{generationStatus}</p>
              </div>
            )}

            {generatedQuestions.length > 0 && (
              <div className="mt-6">
                <div className="flex gap-2 mb-4 flex-wrap">
                  <button
                    onClick={handleLoadGeneratedQuestions}
                    className="bg-purple-600 text-white px-6 py-2 rounded-md font-semibold hover:bg-purple-700"
                  >
                    Load Questions for Answer Generation ({generatedQuestions.length})
                  </button>
                  <button
                    onClick={handleCopyQuestions}
                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                  >
                    Copy All
                  </button>
                  <button
                    onClick={handleDownloadQuestions}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                  >
                    Download as .txt
                  </button>
                </div>
                <div className="border rounded-md p-4 max-h-96 overflow-auto">
                  <pre className="text-xs whitespace-pre-wrap">{generatedQuestions.join('\n')}</pre>
                </div>
              </div>
            )}
          </div>

          {/* Bulk Answer Generation */}
          <div className="bg-white shadow rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">3. Generate Answers</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-4 mb-4 flex-wrap">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableMetadataGeneration}
                    onChange={(e) => setEnableMetadataGeneration(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    {t('Generate Metadata (Recommended)', 'Metadaten generieren (Empfohlen)')}
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoMode}
                    onChange={(e) => setAutoMode(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    {t('Auto-mode (Generate → Metadata → Import)', 'Auto-Modus (Generieren → Metadaten → Importieren)')}
                  </span>
                </label>
              </div>
              
              <div>
                <p className="text-sm text-gray-600 mb-2">
                  {t('Load questions from Step 2, paste questions, or upload files.', 'Laden Sie Fragen aus Schritt 2, fügen Sie Fragen ein oder laden Sie Dateien hoch.')}
                </p>
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={handlePasteQuestions}
                    className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700"
                  >
                    {t('Paste Questions from Clipboard', 'Fragen aus Zwischenablage einfügen')}
                  </button>
                  <label className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 cursor-pointer">
                    <input
                      type="file"
                      accept=".txt,.jsonl"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    {t('Upload Questions/Answers File', 'Fragen/Antworten-Datei hochladen')}
                  </label>
                </div>
              </div>

              {/* Download buttons */}
              {generatedQuestions.length > 0 && (
                <div className="p-3 bg-blue-50 rounded-md">
                  <p className="text-sm font-semibold text-blue-900 mb-2">{t('Download Questions:', 'Fragen herunterladen:')}</p>
                  <button
                    onClick={handleDownloadQuestions}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm"
                  >
                    {t('Download Questions (.txt)', 'Fragen herunterladen (.txt)')}
                  </button>
                </div>
              )}

              {questionsForAnswers.filter(q => q.status === 'done').length > 0 && (
                <div className="p-3 bg-green-50 rounded-md">
                  <p className="text-sm font-semibold text-green-900 mb-2">{t('Download Answers:', 'Antworten herunterladen:')}</p>
                  <button
                    onClick={handleDownloadAnswers}
                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 text-sm"
                  >
                    {t('Download Answers (.jsonl for Batch)', 'Antworten herunterladen (.jsonl für Batch)')}
                  </button>
                </div>
              )}

              {questionsForAnswers.filter(q => q.status === 'metadata_done').length > 0 && (
                <div className="p-3 bg-purple-50 rounded-md">
                  <p className="text-sm font-semibold text-purple-900 mb-2">{t('Download Metadata:', 'Metadaten herunterladen:')}</p>
                  <button
                    onClick={handleDownloadMetadata}
                    className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 text-sm"
                  >
                    {t('Download Metadata (.jsonl for Batch)', 'Metadaten herunterladen (.jsonl für Batch)')}
                  </button>
                </div>
              )}

              {questionsForAnswers.length > 0 && (
                <>
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={handleGenerateAnswers}
                      className="bg-indigo-600 text-white px-6 py-2 rounded-md font-semibold hover:bg-indigo-700 disabled:opacity-50"
                      disabled={isGeneratingAnswers}
                    >
                      {isGeneratingAnswers ? 'Generating Answers...' : `Generate Answers (${questionsForAnswers.length})`}
                    </button>
                    {isGeneratingAnswers && (
                      <button
                        onClick={handleStopGeneration}
                        className="bg-red-600 text-white px-6 py-2 rounded-md font-semibold hover:bg-red-700"
                      >
                        Stop All
                      </button>
                    )}
                    {enableMetadataGeneration && (
                      <>
                        <button
                          onClick={handleGenerateMetadata}
                          className="bg-blue-600 text-white px-6 py-2 rounded-md font-semibold hover:bg-blue-700 disabled:opacity-50"
                          disabled={isGeneratingAnswers || isGeneratingMetadata || questionsForAnswers.filter(q => q.status === 'done' || q.status === 'metadata_pending').length === 0}
                        >
                          {isGeneratingMetadata 
                            ? t('Generating Metadata...', 'Generiere Metadaten...') 
                            : t('Generate Metadata', 'Metadaten generieren')} ({questionsForAnswers.filter(q => q.status === 'done' || q.status === 'metadata_pending').length})
                        </button>
                        {isGeneratingMetadata && (
                          <button
                            onClick={() => {
                              setShouldStopMetadataGeneration(true);
                              setMetadataGenerationStatus(t('Stopping metadata generation...', 'Metadaten-Generierung wird gestoppt...'));
                            }}
                            className="bg-red-600 text-white px-6 py-2 rounded-md font-semibold hover:bg-red-700"
                          >
                            {t('Stop Metadata Generation', 'Metadaten-Generierung stoppen')}
                          </button>
                        )}
                      </>
                    )}
                    <button
                      onClick={handleBulkImport}
                      className="bg-green-600 text-white px-6 py-2 rounded-md font-semibold hover:bg-green-700 disabled:opacity-50"
                      disabled={isGeneratingAnswers || isGeneratingMetadata || isImporting || questionsForAnswers.filter(q => q.status === 'done' || q.status === 'metadata_done').length === 0}
                    >
                      {isImporting 
                        ? t('Importing...', 'Importiere...') 
                        : t('Create Pages in Database', 'Seiten in Datenbank erstellen')} ({questionsForAnswers.filter(q => q.status === 'done' || q.status === 'metadata_done').length})
                    </button>
                    {isImporting && (
                      <button
                        onClick={() => {
                          setShouldStopImport(true);
                          setAnswerGenerationStatus(t('Stopping import...', 'Import wird gestoppt...'));
                        }}
                        className="bg-red-600 text-white px-6 py-2 rounded-md font-semibold hover:bg-red-700"
                      >
                        {t('Stop Import', 'Import stoppen')}
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setQuestionsForAnswers([]);
                        setAnswerGenerationStatus('');
                      }}
                      className="bg-gray-400 text-white px-4 py-2 rounded-md font-semibold hover:bg-gray-500 disabled:opacity-50"
                      disabled={isGeneratingAnswers}
                    >
                      Clear All
                    </button>
                  </div>

                  {answerGenerationStatus && (
                    <div className="p-3 bg-gray-50 rounded-md">
                      <p className="text-sm text-gray-700">{answerGenerationStatus}</p>
                    </div>
                  )}

                  {metadataGenerationStatus && (
                    <div className="p-3 bg-blue-50 rounded-md">
                      <p className="text-sm text-blue-700">{metadataGenerationStatus}</p>
                    </div>
                  )}

                  <div className="border rounded-md p-4 max-h-96 overflow-auto">
                    <div className="mb-2 flex items-center justify-between">
                      <div className="text-sm text-gray-600">
                        <span className="font-semibold">Status:</span>{' '}
                        <span className="text-green-600">{questionsForAnswers.filter(q => q.status === 'done').length} done</span>
                        {' | '}
                        <span className="text-yellow-600">{questionsForAnswers.filter(q => q.status === 'generating').length} generating</span>
                        {' | '}
                        <span className="text-red-600">{questionsForAnswers.filter(q => q.status === 'error').length} errors</span>
                        {' | '}
                        <span className="text-gray-600">{questionsForAnswers.filter(q => q.status === 'pending').length} pending</span>
                        {enableMetadataGeneration && (
                          <>
                            {' | '}
                            <span className="text-blue-600">{questionsForAnswers.filter(q => q.status === 'metadata_done').length} metadata done</span>
                            {' | '}
                            <span className="text-purple-600">{questionsForAnswers.filter(q => q.status === 'metadata_generating').length} generating metadata</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      {questionsForAnswers.map((item, index) => (
                        <div key={item.id} className="border-b pb-2 last:border-b-0">
                          <div className="flex items-start justify-between mb-1">
                            <span className="text-xs font-semibold text-gray-500">#{index + 1}</span>
                            <span className={`text-xs px-2 py-1 rounded font-semibold ${
                              item.status === 'done' ? 'bg-green-100 text-green-800' :
                              item.status === 'metadata_done' ? 'bg-blue-100 text-blue-800' :
                              item.status === 'metadata_generating' ? 'bg-purple-100 text-purple-800 animate-pulse' :
                              item.status === 'metadata_pending' ? 'bg-gray-100 text-gray-800' :
                              item.status === 'generating' ? 'bg-yellow-100 text-yellow-800 animate-pulse' :
                              item.status === 'error' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {item.status === 'metadata_done' ? 'METADATA DONE' :
                               item.status === 'metadata_generating' ? 'GENERATING METADATA' :
                               item.status === 'metadata_pending' ? 'METADATA PENDING' :
                               item.status.toUpperCase()}
                            </span>
                          </div>
                          <p className="text-sm font-medium mb-1">{item.question}</p>
                          {item.answer && (
                            <details className="mt-1">
                              <summary className="text-xs text-blue-600 cursor-pointer hover:text-blue-800">View Answer</summary>
                              <p className="text-xs text-gray-600 mt-1 whitespace-pre-wrap">{item.answer}</p>
                            </details>
                          )}
                          {item.metadata && (
                            <details className="mt-1">
                              <summary className="text-xs text-purple-600 cursor-pointer hover:text-purple-800">View Metadata</summary>
                              <div className="text-xs text-gray-600 mt-1 space-y-1">
                                {item.metadata.severity && <p><strong>Severity:</strong> {item.metadata.severity}</p>}
                                {item.metadata.difficulty_level && <p><strong>Difficulty:</strong> {item.metadata.difficulty_level}</p>}
                                {item.metadata.error_code && <p><strong>Error Code:</strong> {item.metadata.error_code}</p>}
                                {item.metadata.affected_component && <p><strong>Component:</strong> {item.metadata.affected_component}</p>}
                                {item.metadata.symptoms && item.metadata.symptoms.length > 0 && (
                                  <p><strong>Symptoms:</strong> {item.metadata.symptoms.join(', ')}</p>
                                )}
                                {item.metadata.tools_required && item.metadata.tools_required.length > 0 && (
                                  <p><strong>Tools:</strong> {item.metadata.tools_required.join(', ')}</p>
                                )}
                                {item.metadata.estimated_repair_time && <p><strong>Time:</strong> {item.metadata.estimated_repair_time}</p>}
                                {item.metadata.meta_title && <p><strong>Meta Title:</strong> <span className="font-mono text-xs">{item.metadata.meta_title}</span></p>}
                                {item.metadata.meta_description && <p><strong>Meta Description:</strong> {item.metadata.meta_description}</p>}
                                {item.metadata.seo_score !== undefined && (
                                  <p><strong>SEO Score:</strong> <span className={`font-bold ${item.metadata.seo_score >= 70 ? 'text-green-600' : item.metadata.seo_score >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>{item.metadata.seo_score}/99</span></p>
                                )}
                                {item.metadata.content_score !== undefined && (
                                  <p><strong>Content Score:</strong> <span className={`font-bold ${item.metadata.content_score >= 80 ? 'text-green-600' : item.metadata.content_score >= 70 ? 'text-yellow-600' : 'text-red-600'}`}>{item.metadata.content_score}/99</span></p>
                                )}
                              </div>
                            </details>
                          )}
                          {item.error && (
                            <p className="text-xs text-red-600 mt-1">Error: {item.error}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Recovery Section - Load saved answers */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4 text-yellow-800">
              {t('Recovery: Load Saved Answers', 'Wiederherstellung: Gespeicherte Antworten laden')}
            </h2>
            <p className="text-sm text-yellow-700 mb-4">
              {t(
                'If answers were generated but import failed, you can recover them from local storage.',
                'Wenn Antworten generiert wurden, aber der Import fehlgeschlagen ist, können Sie sie aus dem lokalen Speicher wiederherstellen.'
              )}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  try {
                    const savedAnswers = JSON.parse(localStorage.getItem('car_generated_answers') || '[]');
                    if (savedAnswers.length === 0) {
                      alert(t('No saved answers found.', 'Keine gespeicherten Antworten gefunden.'));
                      return;
                    }
                    
                    // Filter by current generation if available
                    const filtered = selectedGenerationId 
                      ? savedAnswers.filter((a: any) => a.generationId === selectedGenerationId)
                      : savedAnswers;
                    
                    if (filtered.length === 0) {
                      alert(t('No saved answers found for this generation.', 'Keine gespeicherten Antworten für diese Generation gefunden.'));
                      return;
                    }
                    
                    const questions = filtered.map((a: any) => ({
                      id: uuidv4(),
                      question: a.question,
                      answer: a.answer,
                      status: 'done' as const
                    }));
                    
                    setQuestionsForAnswers(questions);
                    setAnswerGenerationStatus(t(
                      `Loaded ${questions.length} saved answers. Ready to import.`,
                      `${questions.length} gespeicherte Antworten geladen. Bereit zum Importieren.`
                    ));
                    alert(t(`Loaded ${questions.length} saved answers!`, `${questions.length} gespeicherte Antworten geladen!`));
                  } catch (e) {
                    console.error('Error loading saved answers:', e);
                    alert(t('Error loading saved answers.', 'Fehler beim Laden gespeicherter Antworten.'));
                  }
                }}
                className="bg-yellow-600 text-white px-4 py-2 rounded-md font-semibold hover:bg-yellow-700"
              >
                {t('Load Saved Answers', 'Gespeicherte Antworten laden')}
              </button>
              <button
                onClick={() => {
                  if (confirm(t('Clear all saved answers?', 'Alle gespeicherten Antworten löschen?'))) {
                    localStorage.removeItem('car_generated_answers');
                    localStorage.removeItem('car_failed_imports');
                    alert(t('Saved answers cleared.', 'Gespeicherte Antworten gelöscht.'));
                  }
                }}
                className="bg-gray-400 text-white px-4 py-2 rounded-md font-semibold hover:bg-gray-500"
              >
                {t('Clear Saved', 'Gespeicherte löschen')}
              </button>
            </div>
          </div>

          {/* Imported Pages Summary */}
          {importedItems.length > 0 && (
            <div className="bg-white shadow rounded-lg p-6 mb-8">
              <h2 className="text-xl font-semibold mb-4 text-green-600">
                ✅ {t('Successfully Created Pages', 'Erfolgreich erstellte Seiten')} ({importedItems.length})
              </h2>
              <div className="space-y-2 max-h-96 overflow-auto">
                {importedItems.map((item, index) => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-900/30">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900 dark:text-white">
                        #{index + 1}: {item.title}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {item.url}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded hover:bg-blue-700 transition-colors"
                      >
                        {t('View', 'Ansehen')}
                      </a>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(`https://faultbase.com${item.url}`);
                          alert('URL copied!');
                        }}
                        className="px-3 py-1.5 bg-slate-600 text-white text-xs font-semibold rounded hover:bg-slate-700 transition-colors"
                      >
                        {t('Copy URL', 'URL kopieren')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => {
                    const allUrls = importedItems.map(item => `https://faultbase.com${item.url}`).join('\n');
                    navigator.clipboard.writeText(allUrls);
                    alert(`Copied ${importedItems.length} URLs to clipboard!`);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700"
                >
                  {t('Copy All URLs', 'Alle URLs kopieren')}
                </button>
                <button
                  onClick={() => setImportedItems([])}
                  className="px-4 py-2 bg-gray-400 text-white rounded-md font-semibold hover:bg-gray-500"
                >
                  {t('Clear List', 'Liste löschen')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </InternalAuth>
  );
}

