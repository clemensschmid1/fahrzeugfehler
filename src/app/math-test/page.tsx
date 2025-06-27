'use client';

import ReactMarkdown from 'react-markdown';
import 'katex/dist/katex.min.css';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { processMarkdownForLatex } from '@/lib/latex-utils';

export default function MathTestPage() {
  const testContent = `# Math Test Page

This is a test to verify LaTeX math rendering.

## Test 1: Simple formula
[ E_{kinetic} = \\frac{1}{2} J \\omega^2 ]

## Test 2: User's example
[ I_{motor} = \\frac{P}{\\sqrt{3} \\times V \\times \\text{PF} \\times \\eta} ] Assume PF = 0.85, η = 0.9:

[ I_{motor} = \\frac{7500}{\\sqrt{3} \\times 400 \\times 0.85 \\times 0.9} \\approx 14.2,A ]

## Test 3: Direct LaTeX (should work)
$E = mc^2$

## Test 4: Block math
$$
\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}
$$

## Test 5: Processed content
${processMarkdownForLatex(`[ I_{motor} = \\frac{P}{\\sqrt{3} \\times V \\times \\text{PF} \\times \\eta} ]`)}
`;

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-xl rounded-2xl overflow-hidden">
          <div className="p-8">
            <h1 className="text-3xl font-bold mb-8">Math Rendering Test</h1>
            
            <div className="prose max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkMath]}
                rehypePlugins={[rehypeKatex]}
              >
                {testContent}
              </ReactMarkdown>
            </div>
            
            <div className="mt-8 p-4 bg-gray-100 rounded">
              <h3 className="font-bold mb-2">Raw processed content:</h3>
              <pre className="text-sm overflow-x-auto">
                {processMarkdownForLatex(`[ I_{motor} = \\frac{P}{\\sqrt{3} \\times V \\times \\text{PF} \\times \\eta} ]`)}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 