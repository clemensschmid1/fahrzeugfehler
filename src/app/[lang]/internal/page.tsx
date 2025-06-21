'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import InternalAuth from '@/components/InternalAuth';

interface ImportedQuestion {
  question: string;
  answer: string;
  sector: string;
  manufacturer?: string;
  part_type?: string;
  part_series?: string;
}

export default function InternalPage() {
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [previewQuestions, setPreviewQuestions] = useState<ImportedQuestion[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiPromptStatus, setAiPromptStatus] = useState<string | null>(null);
  const [aiPromptLoading, setAiPromptLoading] = useState(false);
  const params = useParams();
  const lang = params.lang as string;

  // New state for raw parsed questions before AI analysis
  const [rawQuestions, setRawQuestions] = useState<ImportedQuestion[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        const lines = content.split('\n').filter(line => line.trim());
        const questions: ImportedQuestion[] = [];

        if (file.name.endsWith('.csv')) {
          // Handle CSV format
          const headers = lines[0].split(',').map(h => h.trim());
          for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim());
            const question: ImportedQuestion = {
              question: values[0] || '',
              answer: values[1] || '',
              sector: values[2] || '',
              manufacturer: values[3] || '',
              part_type: values[4] || '',
              part_series: values[5] || '',
            };
            questions.push(question);
          }
        } else {
          // Handle text format (one question per line)
          for (const line of lines) {
            questions.push({
              question: line,
              answer: '',
              sector: '',
            });
          }
        }

        setImportStatus(`Found ${questions.length} questions to import`);
        setRawQuestions(questions);
      } catch (error) {
        setImportStatus('Error reading file: ' + (error as Error).message);
      }
    };

    reader.readAsText(file);
  };

  function slugify(text: string) {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

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
            language_path: lang
          }]);

        if (error) {
          console.error('Supabase insert error:', error);
          // Continue with other questions, but indicate error
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

  const handleAnalyzeWithAI = async () => {
    if (rawQuestions.length === 0) return;

    setIsAnalyzing(true);
    setImportStatus('Analyzing questions with AI...');

    const analyzedQuestions: ImportedQuestion[] = [];

    for (const rawQuestion of rawQuestions) {
      try {
        const response = await fetch('/api/ask', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            question: rawQuestion.question,
            analyzeOnly: true,
          }),
        });

        if (!response.ok) {
          throw new Error('AI analysis failed');
        }

        const data = await response.json();
        analyzedQuestions.push({
          question: rawQuestion.question,
          answer: data.answer || rawQuestion.answer || '[Answer to be provided]',
          sector: data.sector || rawQuestion.sector || 'General',
          manufacturer: data.manufacturer || rawQuestion.manufacturer || 'Unknown',
          part_type: data.part_type || rawQuestion.part_type || 'Unknown',
          part_series: data.part_series || rawQuestion.part_series || 'Unknown',
        });
      } catch (error: any) {
        console.error('AI analysis error for question:', rawQuestion.question, error);
        // If AI analysis fails, use the raw data with placeholders
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

  // Fetch the current AI prompt on mount
  useEffect(() => {
    fetchAiPrompt();
  }, []);

  const fetchAiPrompt = async () => {
    setAiPromptLoading(true);
    setAiPromptStatus(null);
    const { data, error } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'ai_prompt')
      .single();
    if (error) {
      setAiPromptStatus('Error loading prompt: ' + error.message);
      setAiPrompt('');
    } else {
      setAiPrompt(data?.value || '');
    }
    setAiPromptLoading(false);
  };

  const saveAiPrompt = async () => {
    setAiPromptStatus('Saving...');
    const { error } = await supabase
      .from('settings')
      .upsert([{ key: 'ai_prompt', value: aiPrompt }], { onConflict: 'key' });
    if (error) {
      setAiPromptStatus('Error saving prompt: ' + error.message);
    } else {
      setAiPromptStatus('Prompt saved successfully!');
    }
  };

  return (
    <InternalAuth>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900">Developer Dashboard</h1>
            </div>

            {/* Navigation Links */}
            <div className="flex items-center space-x-4 mb-8">
               <Link 
                href={`/${lang}/internal/drafts`}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                View Drafts and Bin
              </Link>
               <Link
                 href={`/${lang}/internal/bulkimport`}
                 className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
               >
                 Bulk Imports
               </Link>
               <Link
                 href={`/${lang}/internal/comments`}
                 className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
               >
                 Manage Comments
               </Link>
               <Link
                 href={`/${lang}/internal/emails`}
                 className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
               >
                 Email Management
               </Link>
            </div>

            {/* AI Prompt Management Section */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">AI Prompt Management</h2>
              <p className="text-gray-600 mb-2">This is the prompt used for the AI. You can tweak and optimize it to change how the AI responds.</p>
              {aiPromptLoading ? (
                <div className="text-gray-500">Loading prompt...</div>
              ) : (
                <>
                  <textarea
                    className="w-full min-h-[120px] rounded-md border border-gray-300 shadow-sm p-3 text-gray-900 text-base mb-2 focus:ring-blue-500 focus:border-blue-500"
                    value={aiPrompt}
                    onChange={e => setAiPrompt(e.target.value)}
                    placeholder="Enter the AI prompt here..."
                    disabled={aiPromptLoading}
                  />
                  <div className="flex items-center gap-4">
                    <button
                      onClick={saveAiPrompt}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700 transition disabled:opacity-50"
                      disabled={aiPromptLoading}
                    >
                      Save Prompt
                    </button>
                    {aiPromptStatus && <span className="text-sm text-gray-600">{aiPromptStatus}</span>}
                  </div>
                </>
              )}
            </div>

            {/* Bulk Import Section */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Bulk Import</h2>
              <div className="bg-white shadow rounded-lg p-6">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload File (CSV or Text)
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

                {rawQuestions.length > 0 && (
                  <div className="mt-4">
                    <button
                      onClick={handleAnalyzeWithAI}
                      disabled={isAnalyzing}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700 transition disabled:opacity-50"
                    >
                      {isAnalyzing ? 'Analyzing...' : 'Analyze with AI'}
                    </button>
                  </div>
                )}

                {(previewQuestions.length > 0 || isAnalyzing) && (
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
                            {previewQuestions.map((question, index) => (
                              <tr key={index}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{question.question}</td>
                                <td className="px-6 py-4 text-sm text-gray-500">{question.answer}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{question.sector}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{question.manufacturer}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{question.part_type}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{question.part_series}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                    {!isAnalyzing && previewQuestions.length > 0 && (
                      <div className="mt-4">
                        <button
                          onClick={handleImport}
                          disabled={isImporting}
                          className="px-4 py-2 bg-green-600 text-white rounded-md font-semibold hover:bg-green-700 transition disabled:opacity-50"
                        >
                          {isImporting ? 'Importing...' : 'Import Questions'}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {importStatus && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-md">
                    <p className="text-sm text-gray-600">{importStatus}</p>
                  </div>
                )}
              </div>
            </div>

            {/* System Status and Quick Actions */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {/* System Status */}
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">System Status</h3>
                  <div className="mt-5">
                    <dl className="grid grid-cols-1 gap-5">
                      <div className="px-4 py-5 bg-gray-50 shadow rounded-lg overflow-hidden sm:p-6">
                        <dt className="text-sm font-medium text-gray-500 truncate">API Status</dt>
                        <dd className="mt-1 text-3xl font-semibold text-green-600">Online</dd>
                      </div>
                      <div className="px-4 py-5 bg-gray-50 shadow rounded-lg overflow-hidden sm:p-6">
                        <dt className="text-sm font-medium text-gray-500 truncate">Database Status</dt>
                        <dd className="mt-1 text-3xl font-semibold text-green-600">Online</dd>
                      </div>
                    </dl>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Activity</h3>
                  <div className="mt-5">
                    <div className="flow-root">
                      <ul className="-mb-8">
                        <li>
                          <div className="relative pb-8">
                            <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true"></span>
                            <div className="relative flex space-x-3">
                              <div>
                                <span className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center ring-8 ring-white">
                                  <svg className="h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                  </svg>
                                </span>
                              </div>
                              <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                                <div>
                                  <p className="text-sm text-gray-500">System update completed</p>
                                </div>
                                <div className="text-right text-sm whitespace-nowrap text-gray-500">
                                  <time dateTime="2024-03-20">20 minutes ago</time>
                                </div>
                              </div>
                            </div>
                          </div>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </InternalAuth>
  );
} 