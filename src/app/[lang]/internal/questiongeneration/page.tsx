"use client";
import InternalAuth from '@/components/InternalAuth';
import { useState } from 'react';

// Client Components are automatically dynamic, no need to export these

function parseTxtFile(content: string): string[] {
  return content
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.length > 0);
}

function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export default function QuestionGenerationPage() {
  // Merge files state
  const [mergedQuestions, setMergedQuestions] = useState<string[]>([]);
  const [mergeLog, setMergeLog] = useState<string[]>([]);

  const [prompt, setPrompt] = useState("");
  const [topic, setTopic] = useState("");
  const [language, setLanguage] = useState("en");
  const [count, setCount] = useState<number | undefined>(undefined);
  const [model, setModel] = useState("gpt-4.1-2025-04-14");

  // New: Store all generations, each with its own status
  const [generations, setGenerations] = useState<{
    id: string;
    prompt: string;
    topic: string;
    language: string;
    count?: number;
    model: string;
    modelUsed?: string;
    questions: string;
    status: 'loading' | 'done' | 'error';
    error?: string;
  }[]>([]);

  // Handle new generation submission
  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    const id = uuidv4();
    const fullPrompt = topic ? `${topic}: ${prompt}` : prompt;
    // Add new generation with status 'loading'
    setGenerations(prev => [
      ...prev,
      {
        id,
        prompt: fullPrompt,
        topic,
        language,
        count,
        model,
        questions: '',
        status: 'loading',
      }
    ]);
    // Start fetch in background
    (async () => {
      try {
        const body: { prompt: string; language: string; model: string; count?: number } = { prompt: fullPrompt, language, model };
        if (count !== undefined) body.count = count;
        const res = await fetch("/api/questions/generate-ai", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error(await res.text());
        const data: { questions: string } = await res.json();
        const usedModel = res.headers.get('x-ai-model-used') || model;
        setGenerations(prev => prev.map(g =>
          g.id === id
            ? { ...g, questions: data.questions, status: 'done', modelUsed: usedModel }
            : g
        ));
      } catch (err: unknown) {
        setGenerations(prev => prev.map(g =>
          g.id === id
            ? { ...g, status: 'error', error: err instanceof Error ? err.message : 'Unknown error' }
            : g
        ));
      }
    })();
  }

  // Remove a generation
  function handleRemoveGeneration(id: string) {
    setGenerations(prev => prev.filter(g => g.id !== id));
  }

  // Clear all generations
  function handleClearAllGenerations() {
    setGenerations([]);
  }

  // Download all questions from all generations
  function handleDownloadAllAnswers() {
    if (generations.length === 0) {
      alert('No generated answers to download.');
      return;
    }
    // Collect all questions, split by line, deduplicate, trim
    const allQuestions = generations
      .filter(g => g.status === 'done')
      .flatMap(g => parseTxtFile(g.questions))
      .map(q => q.trim())
      .filter(q => q.length > 0);
    const uniqueQuestions = Array.from(new Set(allQuestions));
    const content = uniqueQuestions.join('\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `all_generated_questions_${new Date().toISOString().split('T')[0]}.txt`;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  }

  function handleMergeFiles(event: React.ChangeEvent<HTMLInputElement>) {
    const fileList = event.target.files;
    if (!fileList) return;
    setMergeLog([]);
    let allQuestions: string[] = [];
    const fileNames: string[] = [];
    let filesProcessed = 0;
    Array.from(fileList).forEach(file => {
      const reader = new FileReader();
      reader.onload = e => {
        const content = e.target?.result as string;
        const questions = parseTxtFile(content);
        allQuestions = allQuestions.concat(questions);
        fileNames.push(file.name);
        filesProcessed++;
        if (filesProcessed === fileList.length) {
          // Deduplicate and trim
          const unique = Array.from(new Set(allQuestions.map(q => q.trim()))).filter(q => q.length > 0);
          setMergedQuestions(unique);
          setMergeLog([`Merged ${fileList.length} files: ${fileNames.join(', ')}`, `Total questions: ${unique.length}`]);
        }
      };
      reader.readAsText(file);
    });
  }

  function handleDownloadMerged() {
    if (!mergedQuestions.length) {
      alert('No merged questions to download. Please upload and merge files first.');
      return;
    }
    
    try {
      const content = mergedQuestions.join('\n');
      const blob = new Blob([content], { 
        type: 'text/plain;charset=utf-8' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `merged_questions_${new Date().toISOString().split('T')[0]}.txt`;
      a.style.display = 'none';
      
      // Add to DOM, click, and cleanup
      document.body.appendChild(a);
      a.click();
      
      // Cleanup after a short delay to ensure download starts
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
      
    } catch (error) {
      console.error('Merged download failed:', error);
      alert('Download failed. Please copy the merged questions manually.');
    }
  }

  const lastGen = generations.length > 0 ? generations[generations.length - 1] : undefined;

  return (
    <InternalAuth>
      {/* Merge Questions Segment */}
      <div className="max-w-2xl mx-auto py-8 px-4 mb-10 bg-white border border-gray-200 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-3">Merge Question Files</h2>
        <p className="text-gray-600 mb-2">Upload multiple <b>.txt</b> files (one question per line). This will merge all questions into a single deduplicated file.</p>
        <input type="file" accept=".txt" multiple onChange={handleMergeFiles} className="mb-3" />
        {mergeLog.length > 0 && (
          <div className="mb-2 text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded p-2">
            {mergeLog.map((l, i) => <div key={i}>{l}</div>)}
          </div>
        )}
        {mergedQuestions.length > 0 && (
          <div className="mb-2">
            <b>Preview (first 10 questions):</b>
            <pre className="bg-gray-50 border border-gray-200 rounded p-2 text-xs max-h-40 overflow-auto">{mergedQuestions.slice(0, 10).join('\n')}{mergedQuestions.length > 10 ? '\n...and more' : ''}</pre>
            <button onClick={handleDownloadMerged} className="mt-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">Download Merged File</button>
          </div>
        )}
      </div>
      <div className="max-w-2xl mx-auto py-12 px-4">
        <h1 className="text-3xl font-bold mb-6">Internal: Question Generation</h1>
        <p className="text-gray-600 mb-4">Generate high-quality technical questions for bulk import. Review, edit, and export as .txt for import. Each question will be on its own line.</p>
        <form onSubmit={handleGenerate} className="space-y-4 mb-6">
          <div>
            <label className="block font-medium mb-1">Topic / Seed (optional)</label>
            <input
              type="text"
              className="w-full border rounded px-3 py-2"
              value={topic}
              onChange={e => setTopic(e.target.value)}
              placeholder="e.g. Frequency converters, robotics, etc."
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Prompt / Focus</label>
            <textarea
              className="w-full border rounded px-3 py-2 min-h-[80px] font-mono"
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              required
              placeholder="e.g. Generate questions about safety features, applications, etc."
              rows={4}
            />
          </div>
          <div className="flex gap-4 flex-wrap">
            <div>
              <label className="block font-medium mb-1">Language</label>
              <select
                className="border rounded px-2 py-1"
                value={language}
                onChange={e => setLanguage(e.target.value)}
              >
                <option value="en">English</option>
                <option value="de">Deutsch</option>
              </select>
            </div>
            <div>
              <label className="block font-medium mb-1">Count <span className="text-xs text-gray-500">(optional)</span></label>
              <input
                type="number"
                min={1}
                max={100}
                className="border rounded px-2 py-1 w-20"
                value={count === undefined ? '' : count}
                onChange={e => {
                  const val = e.target.value;
                  setCount(val === '' ? undefined : Number(val));
                }}
                placeholder="Default"
              />
              <span className="block text-xs text-gray-500 mt-1">Output limit: 1024 tokens (OpenAI API)</span>
            </div>
            <div>
              <label className="block font-medium mb-1">AI Model</label>
              <select
                className="border rounded px-2 py-1"
                value={model}
                onChange={e => setModel(e.target.value)}
              >
                <option value="gpt-4.1-2025-04-14">gpt-4.1-2025-04-14 (default, ask API)</option>
                <option value="gpt-4o">gpt-4o</option>
                <option value="gpt-4">gpt-4</option>
                <option value="gpt-3.5-turbo">gpt-3.5-turbo</option>
              </select>
            </div>
            <div className="flex items-end">
              <span className="text-xs text-gray-500 ml-2">Current model: <span className="font-semibold text-indigo-700">{lastGen?.modelUsed || model}</span></span>
            </div>
          </div>
          <button
            type="submit"
            className="bg-indigo-600 text-white px-6 py-2 rounded font-semibold hover:bg-indigo-700 disabled:opacity-50"
            disabled={!prompt}
          >
            Generate Questions
          </button>
        </form>
        {/* New: List of all generations */}
        {generations.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-2">All Generated Answers</h2>
            <button
              type="button"
              className="mb-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 mr-2"
              onClick={handleDownloadAllAnswers}
            >
              Download All as .txt
            </button>
            <button
              type="button"
              className="mb-2 bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
              onClick={handleClearAllGenerations}
            >
              Clear All
            </button>
            <div className="space-y-4 mt-4">
              {generations.map(g => (
                <div key={g.id} className="border border-gray-200 rounded p-3 bg-gray-50">
                  <div className="flex justify-between items-center mb-1">
                    <div className="font-semibold text-sm text-gray-700">Prompt:</div>
                    <button
                      type="button"
                      className="text-xs text-red-600 hover:underline"
                      onClick={() => handleRemoveGeneration(g.id)}
                    >
                      Remove
                    </button>
                  </div>
                  <div className="text-xs text-gray-800 mb-2 whitespace-pre-line">{g.prompt}</div>
                  <div className="font-semibold text-sm text-gray-700 mb-1">Questions:</div>
                  {g.status === 'loading' && (
                    <div className="text-blue-600 text-xs mb-2">Generating...</div>
                  )}
                  {g.status === 'error' && (
                    <div className="text-red-600 text-xs mb-2">Error: {g.error}</div>
                  )}
                  <pre className="bg-white border border-gray-100 rounded p-2 text-xs max-h-32 overflow-auto">{g.questions}</pre>
                  {g.modelUsed && (
                    <div className="text-xs text-gray-500 mt-1">Model used: {g.modelUsed}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </InternalAuth>
  );
} 