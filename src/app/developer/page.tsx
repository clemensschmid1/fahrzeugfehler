'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import 'katex/dist/katex.min.css';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { processMarkdownForLatex } from '@/lib/latex-utils';

export default function DeveloperPage() {
  const testContent = `
# Table and LaTeX Formatting Demo

## Beautiful Tables

Here's a sample table with the new blue transparent fade styling:

| Component | Voltage | Current | Power |
|-----------|---------|---------|-------|
| Motor | 24V DC | 2.5A | 60W |
| Controller | 12V DC | 1.2A | 14.4W |
| Sensor | 5V DC | 0.1A | 0.5W |
| Display | 3.3V DC | 0.05A | 0.165W |

## LaTeX Functions

Here are some example LaTeX functions that will be automatically detected and formatted:

The resistance formula: [ R = \\frac{V_{DC(on)}}{I_{brake}} ]

Power calculation: [ P = V \\times I ]

Voltage divider: [ V_{out} = V_{in} \\times \\frac{R_2}{R_1 + R_2} ]

Current through a resistor: [ I = \\frac{V}{R} ]

## Mixed Content

You can combine tables and LaTeX functions:

| Parameter | Formula | Value |
|-----------|---------|-------|
| Resistance | [ R = \\frac{V}{I} ] | 10Ω |
| Power | [ P = I^2 \\times R ] | 25W |
| Efficiency | [ \\eta = \\frac{P_{out}}{P_{in}} \\times 100\\% ] | 85% |

## Code Blocks

\`\`\`javascript
// This won't be processed for LaTeX
const voltage = 24;
const current = 2.5;
const power = voltage * current; // [ P = V \\times I ]
\`\`\`

## Regular Text

This is regular text that won't be affected by the LaTeX processing, but tables will still be beautifully formatted.
`;

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-xl rounded-2xl overflow-hidden">
          <div className="p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Developer Demo: Table & LaTeX Formatting</h1>
            
            <div className="prose prose-lg max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeKatex]}
                components={{
                  h1: (props) => <h1 className="font-geist font-bold text-2xl mt-4 mb-2 text-black" style={{fontFamily: 'Geist, Inter, Arial, sans-serif'}} {...props} />, 
                  h2: (props) => <h2 className="font-geist font-semibold text-xl mt-4 mb-2 text-black" style={{fontFamily: 'Geist, Inter, Arial, sans-serif'}} {...props} />, 
                  h3: (props) => <h3 className="font-geist font-medium text-lg mt-4 mb-2 text-blue-900" style={{fontFamily: 'Geist, Inter, Arial, sans-serif'}} {...props} />, 
                  strong: (props) => <strong className="font-bold text-black" {...props} />, 
                  em: (props) => <em className="italic text-black" {...props} />, 
                  p: (props) => <p className="my-3 leading-relaxed text-base text-black" {...props} />, 
                  li: (props) => <li className="sm:ml-4 ml-2 my-1 sm:pl-1 pl-0 list-inside text-black" {...props} />, 
                  ol: (props) => <ol className="list-decimal sm:ml-6 ml-2 my-2 text-black" {...props} />, 
                  ul: (props) => <ul className="list-disc sm:ml-6 ml-2 my-2 text-black" {...props} />, 
                  code: (props) => <code className="bg-slate-200 px-1 rounded text-sm font-geist text-black" style={{fontFamily: 'GeistMono, Geist, Inter, Arial, monospace'}} {...props} />, 
                  table: (props) => (
                    <div className="markdown-table-container">
                      <table className="markdown-table" {...props} />
                    </div>
                  ),
                  thead: (props) => <thead {...props} />, 
                  tbody: (props) => <tbody {...props} />, 
                  th: (props) => <th {...props} />, 
                  tr: (props) => <tr {...props} />, 
                  td: (props) => <td {...props} />, 
                }}
              >
                {processMarkdownForLatex(testContent)}
              </ReactMarkdown>
            </div>

            <div className="mt-8 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">Features Demonstrated:</h3>
              <ul className="text-blue-800 space-y-1">
                <li>• Beautiful tables with blue transparent fade effect</li>
                <li>• Automatic LaTeX function detection in square brackets</li>
                <li>• Responsive design for mobile devices</li>
                <li>• Hover effects and smooth transitions</li>
                <li>• Proper code block handling (LaTeX processing skipped)</li>
                    </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 