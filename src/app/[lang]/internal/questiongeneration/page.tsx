"use client";
import InternalAuth from '@/components/InternalAuth';
import { useState, useRef } from 'react';

function parseTxtFile(content: string): string[] {
  return content
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.length > 0);
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [questions, setQuestions] = useState("");
  const [modelUsed, setModelUsed] = useState<string>("gpt-4o");
  const [dbDuplicates, setDbDuplicates] = useState<string[]>([]);
  const [uniqueCount, setUniqueCount] = useState(0);
  const [totalGenerated, setTotalGenerated] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setQuestions("");
    setDbDuplicates([]);
    setModelUsed(model);
    try {
      const body: { prompt: string; language: string; model: string; count?: number } = { prompt: topic ? `${topic}: ${prompt}` : prompt, language, model };
      if (count !== undefined) body.count = count;
      const res = await fetch("/api/questions/generate-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(await res.text());
      const data: { questions: string; duplicates: string[]; uniqueCount: number; totalGenerated: number } = await res.json();
      setQuestions(data.questions);
      setDbDuplicates(data.duplicates || []);
      setUniqueCount(data.uniqueCount || 0);
      setTotalGenerated(data.totalGenerated || 0);
      setModelUsed(res.headers.get('x-ai-model-used') || model);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || "Unknown error");
      } else {
        setError("An unexpected error occurred.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleExportTxt() {
    // Save questions to database before exporting
    const lines = questions.split("\n").map(q => q.trim()).filter(q => q.length > 0);
    if (lines.length > 0) {
      try {
        const res = await fetch("/api/questions/save-generated", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            questions: lines,
            language,
            prompt: topic ? `${topic}: ${prompt}` : prompt,
            ai_model: modelUsed,
            export_filename: `questions_${new Date().toISOString().split('T')[0]}.txt`
          }),
        });
        if (!res.ok) {
          console.warn("Failed to save questions to database:", await res.text());
        }
      } catch (err) {
        console.warn("Error saving to database:", err);
      }
    }
    
    const blob = new Blob([questions], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "questions.txt";
    a.click();
    URL.revokeObjectURL(url);
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
    if (!mergedQuestions.length) return;
    const blob = new Blob([mergedQuestions.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'merged_questions.txt';
    a.click();
    URL.revokeObjectURL(url);
  }

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
              <span className="text-xs text-gray-500 ml-2">Current model: <span className="font-semibold text-indigo-700">{modelUsed}</span></span>
            </div>
          </div>
          <button
            type="submit"
            className="bg-indigo-600 text-white px-6 py-2 rounded font-semibold hover:bg-indigo-700 disabled:opacity-50"
            disabled={loading || !prompt}
          >
            {loading ? "Generating..." : "Generate Questions"}
          </button>
        </form>
        {error && <div className="text-red-600 mb-4">{error}</div>}
        {totalGenerated > 0 && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
            <div className="text-sm text-blue-800">
              <strong>Generation Summary:</strong> {totalGenerated} questions generated, {uniqueCount} unique, {dbDuplicates.length} duplicates found in database.
            </div>
          </div>
        )}
        {dbDuplicates.length > 0 && (
          <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded">
            <div className="text-sm text-orange-800">
              <strong>Database Duplicates Found:</strong> {dbDuplicates.length} questions already exist in the database.
            </div>
            <div className="mt-2 text-xs text-orange-700 max-h-20 overflow-y-auto">
              {dbDuplicates.map((q, i) => (
                <div key={i}>• {q}</div>
              ))}
            </div>
          </div>
        )}
        <div className="mb-4">
          <label className="block font-medium mb-1">Generated Questions (one per line, editable)</label>
          <textarea
            ref={textareaRef}
            className="w-full border rounded px-3 py-2 font-mono min-h-[400px] text-sm leading-relaxed"
            value={questions}
            onChange={e => setQuestions(e.target.value)}
            placeholder="Questions will appear here..."
          />
        </div>
        <div className="flex gap-4 mb-4 flex-wrap">
          <button
            type="button"
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            onClick={handleExportTxt}
            disabled={!questions}
          >
            Export as .txt
          </button>
        </div>
      </div>
    </InternalAuth>
  );
} 