'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

interface ImportedQuestion {
  question: string;
  answer: string;
  sector: string;
  manufacturer?: string;
  part_type?: string;
  part_series?: string;
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default function BulkImportPage() {
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [previewQuestions, setPreviewQuestions] = useState<ImportedQuestion[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [rawQuestions, setRawQuestions] = useState<ImportedQuestion[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [editingCell, setEditingCell] = useState<{ rowIndex: number; field: keyof ImportedQuestion } | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportStatus('Reading file...');
    setPreviewQuestions([]);
    setRawQuestions([]); // Clear previous raw data

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        const lines = content.split('\n').filter(line => line.trim());
        
        const questions: ImportedQuestion[] = [];
        for (const line of lines) {
          const parts = line.split(',').map(part => part.trim());
          if (parts.length >= 6) {
            questions.push({
              question: parts[0],
              answer: parts[1],
              sector: parts[2] || 'General',
              manufacturer: parts[3] || 'Unknown',
              part_type: parts[4] || 'Unknown',
              part_series: parts[5] || 'Unknown'
            });
          } else if (parts.length > 0) {
             questions.push({
              question: parts[0],
              answer: parts[1] || '[Answer to be provided]',
              sector: parts[2] || 'General',
              manufacturer: 'Unknown',
              part_type: 'Unknown',
              part_series: 'Unknown'
            });
          }
        }

        setPreviewQuestions([]); // Clear preview initially
        setRawQuestions(questions); // Store raw data
        setImportStatus(`File parsed. Found ${questions.length} questions. Analyze with AI to enrich data.`);
      } catch (error) {
        setImportStatus('Error reading file: ' + (error as Error).message);
      }
    };

    reader.readAsText(file);
  };

  const handleAnalyzeWithAI = async () => {
    if (rawQuestions.length === 0) return;

    setIsAnalyzing(true);
    setImportStatus('Analyzing questions with AI...');
    const analyzedQuestions: ImportedQuestion[] = [];

    for (const rawQuestion of rawQuestions) {
      try {
        const res = await fetch('/api/ask', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question: rawQuestion.question }),
        });

        if (!res.ok) {
          throw new Error('AI analysis failed');
        }

        const aiData = await res.json();

        analyzedQuestions.push({
          question: rawQuestion.question,
          answer: aiData.answer || rawQuestion.answer || '[Answer to be provided]',
          sector: aiData.sector || rawQuestion.sector || 'General',
          manufacturer: aiData.manufacturer || rawQuestion.manufacturer || 'Unknown',
          part_type: aiData.part_type || rawQuestion.part_type || 'Unknown',
          part_series: aiData.part_series || rawQuestion.part_series || 'Unknown',
        });

      } catch (error: any) {
        console.error('AI analysis error for question:', rawQuestion.question, error);
        analyzedQuestions.push({
          question: rawQuestion.question,
          answer: rawQuestion.answer || '[Answer to be provided]',
          sector: rawQuestion.sector || 'General',
          manufacturer: rawQuestion.manufacturer || 'Unknown',
          part_type: rawQuestion.part_type || 'Unknown',
          part_series: rawQuestion.part_series || 'Unknown',
        });
        setImportStatus('Warning: AI analysis failed for some questions.');
      }
    }

    setPreviewQuestions(analyzedQuestions);
    setImportStatus(`AI analysis complete. Ready to import ${analyzedQuestions.length} questions.`);
    setIsAnalyzing(false);
  };

  const handleImport = async () => {
    if (previewQuestions.length === 0) return;

    setIsImporting(true);
    setImportStatus('Importing questions...');

    try {
      for (const question of previewQuestions) {
        const slug = slugify(question.question);
        const { error } = await supabase
          .from('questions')
          .insert([{
            question: question.question,
            answer: question.answer,
            sector: question.sector,
            manufacturer: question.manufacturer,
            part_type: question.part_type,
            part_series: question.part_series,
            slug,
            created_at: new Date().toISOString(),
            status: 'draft',
          }]);

        if (error) {
          console.error('Supabase insert error:', error);
          setImportStatus(`Error importing some questions: ${error.message}`);
        }
      }

      setImportStatus(`Successfully imported ${previewQuestions.length} questions`);
      setPreviewQuestions([]);
      setRawQuestions([]);
    } catch (error: any) {
      setImportStatus('Error importing questions: ' + error.message);
    } finally {
      setIsImporting(false);
    }
  };

  const handleCellChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, rowIndex: number, field: keyof ImportedQuestion) => {
    const newValue = e.target.value;
    setPreviewQuestions(prevQuestions =>
      prevQuestions.map((q, index) =>
        index === rowIndex ? { ...q, [field]: newValue } : q
      )
    );
  };

  const handleCellClick = (rowIndex: number, field: keyof ImportedQuestion) => {
    setEditingCell({ rowIndex, field });
  };

  const handleCellBlur = () => {
    setEditingCell(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold text-gray-900">Bulk Import Questions</h1>
            <Link 
              href="/internal"
              className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-600 hover:underline"
            >
              Back to Developer Dashboard
            </Link>
          </div>

          <p className="text-gray-600 mb-4">Upload a CSV (question,answer,sector,manufacturer,part_type,part_series) or text file (each line as a question) to import multiple knowledge entries at once. Imported questions will initially be saved as drafts.</p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload File
              </label>
              <input
                type="file"
                accept=".csv,.txt"
                onChange={handleFileUpload}
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100"
              />
            </div>

            {importStatus && (
              <div className="text-sm text-gray-600">
                {importStatus}
              </div>
            )}

            {rawQuestions.length > 0 && previewQuestions.length === 0 && !isAnalyzing && ( // Show Analyze button after file upload
               <div className="mt-4">
                 <p className="text-gray-700 mb-2">File parsed. Analyze with AI to enrich data before importing.</p>
                 <button
                   onClick={handleAnalyzeWithAI}
                   disabled={isAnalyzing}
                   className="px-4 py-2 bg-green-600 text-white rounded-md font-semibold hover:bg-green-700 transition disabled:opacity-50"
                 >
                   Analyze with AI ({rawQuestions.length} questions)
                 </button>
               </div>
            )}

            {(previewQuestions.length > 0 || isAnalyzing) && ( // Show preview/analyzing status
              <div className="mt-4">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Preview</h3>
                {isAnalyzing ? (
                  <div className="text-gray-500">Analyzing... Please wait.</div>
                ) : (
                <div className="max-h-60 overflow-y-auto border rounded-md">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Question</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Answer</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sector</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Manufacturer</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Part Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Part Series</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {previewQuestions.map((q, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 text-sm text-gray-900">{q.question}</td>
                          {(['answer', 'sector', 'manufacturer', 'part_type', 'part_series'] as (keyof ImportedQuestion)[]).map(field => (
                            <td 
                              key={field}
                              className="px-6 py-4 text-sm text-gray-900 cursor-pointer hover:bg-gray-100"
                              onClick={() => handleCellClick(index, field)}
                            >
                              {editingCell?.rowIndex === index && editingCell?.field === field ? (
                                <input
                                  type="text"
                                  value={q[field] || ''}
                                  onChange={(e) => handleCellChange(e, index, field)}
                                  onBlur={handleCellBlur}
                                  autoFocus
                                  className="w-full p-1 border rounded"
                                />
                              ) : (
                                q[field] || '[Click to Edit]'
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                )}
                <button
                  onClick={handleImport}
                  disabled={isImporting || isAnalyzing || previewQuestions.length === 0}
                  className="mt-4 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300"
                >
                  {isImporting ? 'Importing...' : 'Import Questions'}
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
} 