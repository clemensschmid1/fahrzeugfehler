'use client';

import { useState } from 'react';
import InternalAuth from '@/components/InternalAuth';
import FileUpload from '@/components/FileUpload';
import { useParams } from 'next/navigation';

type QAResult = {
  question: string;
  answer: string;
  metadata?: any;
  answerUsage?: any;
  metadataUsage?: any;
  answerError?: string;
  metadataError?: string;
};

type StepCardProps = {
  step: number;
  title: string;
  description: string;
  status: 'idle' | 'processing' | 'complete' | 'error';
  error?: string | null;
  onAction: () => void;
  actionLabel: string;
  disabled: boolean;
  fileInput?: {
    accept?: string;
    onChange?: (file: File | null) => void;
    file?: File | null;
  };
  results?: QAResult[];
  t: (en: string, de: string) => string;
};

function StepCard({
  step,
  title,
  description,
  status,
  error,
  onAction,
  actionLabel,
  disabled,
  fileInput,
  results,
  t,
}: StepCardProps) {
  const statusColors = {
    idle: 'bg-gray-100',
    processing: 'bg-blue-100',
    complete: 'bg-green-100',
    error: 'bg-red-100',
  };

  return (
    <div className={`p-6 rounded-lg border-2 ${statusColors[status]} ${error ? 'border-red-500' : 'border-gray-300'}`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold">Step {step}: {title}</h3>
          <p className="text-sm text-gray-600 mt-1">{description}</p>
        </div>
        <div className="text-right">
          <span className={`px-3 py-1 rounded text-sm font-semibold ${
            status === 'complete' ? 'bg-green-500 text-white' :
            status === 'processing' ? 'bg-blue-500 text-white' :
            status === 'error' ? 'bg-red-500 text-white' :
            'bg-gray-300 text-gray-700'
          }`}>
            {status.toUpperCase()}
          </span>
        </div>
      </div>

      {fileInput && (
        <div className="mb-4">
          <FileUpload
            accept={fileInput.accept || '.txt'}
            onFileChange={fileInput.onChange || (() => {})}
            file={fileInput.file || null}
            label="Upload File"
            t={t}
          />
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-300 rounded">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {results && results.length > 0 && (
        <div className="mb-4 space-y-2 max-h-96 overflow-y-auto">
          <h4 className="font-semibold text-sm">Results ({results.length}):</h4>
          {results.map((result, idx) => (
            <div key={idx} className="p-3 bg-white rounded border text-sm">
              <div className="font-medium mb-1">Q: {result.question.substring(0, 100)}...</div>
              {result.answer && (
                <div className="text-green-600 mb-1">✓ Answer generated</div>
              )}
              {result.answerError && (
                <div className="text-red-600 mb-1">✗ Answer error: {result.answerError}</div>
              )}
              {result.metadata && (
                <div className="text-green-600 mb-1">✓ Metadata generated</div>
              )}
              {result.metadataError && (
                <div className="text-red-600 mb-1">✗ Metadata error: {result.metadataError}</div>
              )}
            </div>
          ))}
        </div>
      )}

      <button
        onClick={onAction}
        disabled={disabled}
        className={`w-full py-2 px-4 rounded font-semibold ${
          disabled
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
      >
        {actionLabel}
      </button>
    </div>
  );
}

function TestGenerationContent() {
  const params = useParams();
  const lang = (params?.lang as string) || 'en';
  const t = (en: string, de: string) => lang === 'de' ? de : en;

  // Step 1: Input Questions
  const [questionsText, setQuestionsText] = useState('');
  const [questionsFile, setQuestionsFile] = useState<File | null>(null);
  const [questions, setQuestions] = useState<string[]>([]);
  const [step1Status, setStep1Status] = useState<'idle' | 'processing' | 'complete' | 'error'>('idle');
  const [step1Error, setStep1Error] = useState<string | null>(null);

  // Step 2: Generate Answers (Direct API Calls)
  const [step2Status, setStep2Status] = useState<'idle' | 'processing' | 'complete' | 'error'>('idle');
  const [step2Error, setStep2Error] = useState<string | null>(null);
  const [step2Results, setStep2Results] = useState<QAResult[]>([]);
  const [contentType, setContentType] = useState<'fault' | 'manual'>('fault');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [generation, setGeneration] = useState('');
  const [generationCode, setGenerationCode] = useState('');
  const [generationId, setGenerationId] = useState('');

  // Step 3: Generate Metadata (Direct API Calls)
  const [step3Status, setStep3Status] = useState<'idle' | 'processing' | 'complete' | 'error'>('idle');
  const [step3Error, setStep3Error] = useState<string | null>(null);

  // Step 4: Import to Database
  const [step4Status, setStep4Status] = useState<'idle' | 'processing' | 'complete' | 'error'>('idle');
  const [step4Error, setStep4Error] = useState<string | null>(null);
  const [step4Results, setStep4Results] = useState<{ success: number; failed: number } | null>(null);

  // Step 1: Parse Questions
  const handleParseQuestions = async () => {
    setStep1Status('processing');
    setStep1Error(null);

    try {
      let parsedQuestions: string[] = [];

      if (questionsFile) {
        const text = await questionsFile.text();
        parsedQuestions = text.split('\n').map(q => q.trim()).filter(q => q.length > 0);
      } else if (questionsText.trim()) {
        parsedQuestions = questionsText.split('\n').map(q => q.trim()).filter(q => q.length > 0);
      } else {
        throw new Error('Please provide questions either as text or upload a file');
      }

      if (parsedQuestions.length === 0) {
        throw new Error('No valid questions found');
      }

      setQuestions(parsedQuestions);
      setStep1Status('complete');
    } catch (err: any) {
      setStep1Error(err.message || 'Failed to parse questions');
      setStep1Status('error');
    }
  };

  // Step 2: Generate Answers (Direct API Calls - no batch)
  const handleGenerateAnswers = async () => {
    if (questions.length === 0) {
      setStep2Error('Please parse questions first (Step 1)');
      return;
    }

    setStep2Status('processing');
    setStep2Error(null);
    setStep2Results([]);

    const results: QAResult[] = [];

    try {
      // Process questions one by one with direct API calls
      for (let i = 0; i < questions.length; i++) {
        const question = questions[i];
        
        try {
          const response = await fetch('/api/test-generation/generate-answer', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              question,
              contentType,
              brand: brand || undefined,
              model: model || undefined,
              generation: generation || undefined,
              generationCode: generationCode || undefined,
            }),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || 'Failed to generate answer');
          }

          const data = await response.json();
          results.push({
            question,
            answer: data.answer,
            answerUsage: data.usage,
          });

          // Update UI with progress
          setStep2Results([...results]);
        } catch (err: any) {
          results.push({
            question,
            answer: '',
            answerError: err.message || 'Failed to generate answer',
          });
          setStep2Results([...results]);
        }
      }

      setStep2Status('complete');
    } catch (err: any) {
      setStep2Error(err.message || 'Failed to generate answers');
      setStep2Status('error');
    }
  };

  // Step 3: Generate Metadata (Direct API Calls - no batch)
  const handleGenerateMetadata = async () => {
    if (step2Results.length === 0 || step2Results.some(r => !r.answer)) {
      setStep3Error('Please generate answers first (Step 2)');
      return;
    }

    setStep3Status('processing');
    setStep3Error(null);

    const updatedResults = [...step2Results];

    try {
      // Process each Q&A pair with direct API calls
      for (let i = 0; i < updatedResults.length; i++) {
        const result = updatedResults[i];
        
        if (!result.answer) continue;

        try {
          const response = await fetch('/api/test-generation/generate-metadata', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              question: result.question,
              answer: result.answer,
              contentType,
              brand: brand || undefined,
              model: model || undefined,
              generation: generation || undefined,
            }),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || 'Failed to generate metadata');
          }

          const data = await response.json();
          updatedResults[i] = {
            ...result,
            metadata: data.metadata,
            metadataUsage: data.usage,
          };

          // Update UI with progress
          setStep2Results([...updatedResults]);
        } catch (err: any) {
          updatedResults[i] = {
            ...result,
            metadataError: err.message || 'Failed to generate metadata',
          };
          setStep2Results([...updatedResults]);
        }
      }

      setStep3Status('complete');
    } catch (err: any) {
      setStep3Error(err.message || 'Failed to generate metadata');
      setStep3Status('error');
    }
  };

  // Step 4: Import to Database
  const handleImport = async () => {
    if (step2Results.length === 0) {
      setStep4Error('No results to import');
      return;
    }

    setStep4Status('processing');
    setStep4Error(null);

    try {
      // Check if generationId is provided
      if (!generationId) {
        setStep4Error('Generation ID is required to import to database. Please provide a Generation ID in the settings above, or skip this step if you only want to test the prompts.');
        setStep4Status('error');
        return;
      }

      // Build JSONL files from results
      // Use the format expected by import route: answer-{generationId}-{index}
      const questionsJsonl = step2Results.map((r, i) => JSON.stringify({
        custom_id: `answer-${generationId}-${i + 1}`,
        method: 'POST',
        url: '/v1/chat/completions',
        body: {
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'System prompt' },
            { role: 'user', content: r.question + (brand && model && generation ? ` - ${brand} ${model} ${generation}` : '') }
          ],
        }
      })).join('\n');

      const answersJsonl = step2Results.map((r, i) => JSON.stringify({
        custom_id: `answer-${generationId}-${i + 1}`,
        response: {
          status_code: r.answer ? 200 : 500,
          body: r.answer ? {
            choices: [{
              message: { content: r.answer }
            }]
          } : { error: r.answerError }
        }
      })).join('\n');

      const metadataJsonl = step2Results
        .filter(r => r.metadata)
        .map((r, i) => JSON.stringify({
          custom_id: `answer-${generationId}-${i + 1}`,
          response: {
            status_code: 200,
            body: { choices: [{ message: { content: JSON.stringify(r.metadata) } }] }
          }
        })).join('\n');

      // Create File objects
      const questionsBlob = new Blob([questionsJsonl], { type: 'application/jsonl' });
      const answersBlob = new Blob([answersJsonl], { type: 'application/jsonl' });
      const metadataBlob = new Blob([metadataJsonl], { type: 'application/jsonl' });

      const questionsFile = new File([questionsBlob], 'questions.jsonl', { type: 'application/jsonl' });
      const answersFile = new File([answersBlob], 'answers.jsonl', { type: 'application/jsonl' });
      const metadataFile = new File([metadataBlob], 'metadata.jsonl', { type: 'application/jsonl' });

      const formData = new FormData();
      formData.append('questionsFile', questionsFile);
      formData.append('answersFile', answersFile);
      formData.append('metadataFile', metadataFile);

      const response = await fetch('/api/mass-generation/import', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to import');
      }

      const data = await response.json();
      setStep4Results({ success: data.successCount || 0, failed: data.failedCount || 0 });
      setStep4Status('complete');
    } catch (err: any) {
      setStep4Error(err.message || 'Failed to import');
      setStep4Status('error');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Test Generation</h1>
          <p className="text-gray-600">
            Test and optimize prompts for answer generation and metadata extraction using direct API calls (no batch processing).
          </p>
        </div>

        {/* Settings */}
        <div className="mb-6 p-4 bg-white rounded-lg border">
          <h3 className="font-bold mb-4">Settings</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Content Type:</label>
              <select
                value={contentType}
                onChange={(e) => setContentType(e.target.value as 'fault' | 'manual')}
                className="w-full p-2 border rounded"
              >
                <option value="fault">Fault</option>
                <option value="manual">Manual</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Brand (optional):</label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="e.g., Toyota"
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Model (optional):</label>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="e.g., Corolla"
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Generation (optional):</label>
              <input
                type="text"
                value={generation}
                onChange={(e) => setGeneration(e.target.value)}
                placeholder="e.g., E170 (2013-2019)"
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Generation ID (optional, required for import):</label>
              <input
                type="text"
                value={generationId}
                onChange={(e) => setGenerationId(e.target.value)}
                placeholder="e.g., uuid-from-database (optional)"
                className="w-full p-2 border rounded"
              />
              <p className="text-xs text-gray-500 mt-1">
                Optional: Required only if you want to import to database. Find it in the model_generations table. Leave empty to skip import.
              </p>
            </div>
          </div>
        </div>

        {/* Step 1: Input Questions */}
        <StepCard
          step={1}
          title="Input Questions"
          description="Enter questions (one per line) or upload a TXT file"
          status={step1Status}
          error={step1Error}
          onAction={handleParseQuestions}
          actionLabel="Parse Questions"
          disabled={step1Status === 'processing' || (!questionsText.trim() && !questionsFile)}
          fileInput={{
            accept: '.txt',
            onChange: setQuestionsFile,
            file: questionsFile,
          }}
          t={t}
        />

        <div className="mb-6 p-4 bg-white rounded border">
          <label className="block text-sm font-medium mb-2">Or paste questions here (one per line):</label>
          <textarea
            value={questionsText}
            onChange={(e) => setQuestionsText(e.target.value)}
            placeholder="Enter questions here, one per line..."
            className="w-full h-40 p-3 border rounded font-mono text-sm"
          />
          {questions.length > 0 && (
            <div className="mt-2 text-sm text-gray-600">
              Parsed {questions.length} question(s)
            </div>
          )}
        </div>

        {/* Step 2: Generate Answers */}
        <StepCard
          step={2}
          title="Generate Answers"
          description="Generate answers using direct API calls (same prompts as Mass Generation)"
          status={step2Status}
          error={step2Error}
          onAction={handleGenerateAnswers}
          actionLabel="Generate Answers"
          disabled={step2Status === 'processing' || questions.length === 0}
          results={step2Results}
          t={t}
        />

        {/* Step 3: Generate Metadata */}
        <StepCard
          step={3}
          title="Generate Metadata"
          description="Generate metadata using direct API calls (same prompts as Mass Generation)"
          status={step3Status}
          error={step3Error}
          onAction={handleGenerateMetadata}
          actionLabel="Generate Metadata"
          disabled={step3Status === 'processing' || step2Results.length === 0 || step2Results.every(r => !r.answer)}
          results={step2Results}
          t={t}
        />

        {/* Step 4: Import to Database */}
        <div className="mb-6 p-6 bg-white rounded-lg border-2 border-gray-300">
          <h3 className="text-xl font-bold mb-4">Step 4: Import to Database</h3>
          <p className="text-sm text-gray-600 mb-4">Import questions, answers, and metadata into the database</p>

          {step4Error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-300 rounded">
              <p className="text-sm text-red-700">{step4Error}</p>
            </div>
          )}

          <button
            onClick={handleImport}
            disabled={step4Status === 'processing' || step2Results.length === 0}
            className={`w-full py-2 px-4 rounded font-semibold ${
              step4Status === 'processing' || step2Results.length === 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {step4Status === 'processing' ? 'Importing...' : 'Import to Database'}
          </button>

          {step4Results && (
            <div className="mt-4 p-4 bg-green-50 border border-green-300 rounded">
              <h4 className="font-bold mb-2">Import Results:</h4>
              <p className="text-sm">✅ Success: {step4Results.success}</p>
              <p className="text-sm">❌ Failed: {step4Results.failed}</p>
            </div>
          )}
        </div>

        {/* Display Results */}
        {step2Results.length > 0 && (
          <div className="mt-6 p-6 bg-white rounded-lg border">
            <h3 className="text-xl font-bold mb-4">Results Preview</h3>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {step2Results.map((result, idx) => (
                <div key={idx} className="p-4 border rounded">
                  <div className="font-bold mb-2">Question {idx + 1}:</div>
                  <div className="text-sm mb-3">{result.question}</div>
                  
                  {result.answer && (
                    <div className="mb-3">
                      <div className="font-bold mb-1">Answer:</div>
                      <div className="text-sm bg-gray-50 p-3 rounded max-h-40 overflow-y-auto">
                        <pre className="whitespace-pre-wrap text-xs">{result.answer.substring(0, 500)}...</pre>
                      </div>
                    </div>
                  )}

                  {result.metadata && (
                    <div className="mb-3">
                      <div className="font-bold mb-1">Metadata:</div>
                      <div className="text-sm bg-blue-50 p-3 rounded max-h-40 overflow-y-auto">
                        <pre className="whitespace-pre-wrap text-xs">{JSON.stringify(result.metadata, null, 2)}</pre>
                      </div>
                    </div>
                  )}

                  {result.answerError && (
                    <div className="text-red-600 text-sm">Answer Error: {result.answerError}</div>
                  )}

                  {result.metadataError && (
                    <div className="text-red-600 text-sm">Metadata Error: {result.metadataError}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function TestGenerationPage() {
  return (
    <InternalAuth>
      <TestGenerationContent />
    </InternalAuth>
  );
}
