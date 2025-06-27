/* eslint-disable react/no-unescaped-entities */
'use client';

import ReactMarkdown from 'react-markdown';
import 'katex/dist/katex.min.css';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { processMarkdownForLatex } from '@/lib/latex-utils';
import { useEffect, useState } from 'react';

export default function DebugMathPage() {
  const [katexHtml, setKatexHtml] = useState<string>('');

  useEffect(() => {
    console.log('Debug page loaded');
    console.log('KaTeX CSS should be loaded');
    
    // Check if KaTeX is available
    if (typeof window !== 'undefined') {
      if (window.katex) {
        console.log('KaTeX is available globally');
        
        // Try direct KaTeX rendering
        try {
          const html = window.katex.renderToString('\\frac{V_{DC(on)}}{I_{brake}}', {
            throwOnError: false,
            displayMode: false
          });
          setKatexHtml(html);
          console.log('Direct KaTeX rendering successful:', html);
        } catch (error) {
          console.error('Direct KaTeX rendering failed:', error);
        }
      } else {
        console.log('KaTeX is NOT available globally');
      }
    }
  }, []);

  const testContent = `# Math Debug Test

## Test 1: Direct LaTeX (should work)
$ R = \\frac{V_{DC(on)}}{I_{brake}} $

## Test 2: Bracket syntax (should be converted)
[ I_{motor} = \\frac{P}{\\sqrt{3} \\times V \\times \\text{PF} \\times \\eta} ]

## Test 3: Processed bracket syntax
${processMarkdownForLatex(`[ I_{motor} = \\frac{P}{\\sqrt{3} \\times V \\times \\text{PF} \\times \\eta} ]`)}

## Test 4: User&apos;s exact text
Formula:
$ R = \\frac{V_{DC(on)}}{I_{brake}} $

But, Ibrake (braking current) is limited by the resistor and the VFD&apos;s chopper circuit. The resistor must be low enough to absorb the regenerated energy, but high enough not to exceed the chopper&apos;s current rating.

Minimum Resistor Value (safety for chopper): $ R_{min} = \\frac{V_{DC(on)}}{I_{chopper,max}} $

Ichopper max: Find in VFD manual; typically 1.5–2 × motor rated current.
Motor Full Load Current (FLC): $ I_{motor} = \\frac{P}{\\sqrt{3} \\times V \\times \\text{PF} \\times \\eta} $ Assume PF = 0.85, η = 0.9:

$ I_{motor} = \\frac{7500}{\\sqrt{3} \\times 400 \\times 0.85 \\times 0.9} \\approx 14.2,A $

Assume chopper max = 1.5 × FLC ≈ 21 A

$ R_{min} = \\frac{750}{21} \\approx 35.7,\\Omega $

Practical resistor values are often in the range of 30–50 Ω for this size.
Check VFD manual for absolute minimum allowed value.

## Test 5: Block math
$$
\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}
$$

## Test 6: Simple inline
$E = mc^2$

## Test 7: More complex fractions
$\\frac{a + b}{c + d} = \\frac{1}{2}$

## Test 8: Greek letters
$\\alpha, \\beta, \\gamma, \\delta, \\epsilon, \\theta, \\lambda, \\mu, \\pi, \\sigma, \\phi, \\omega$
`;

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-xl rounded-2xl overflow-hidden">
          <div className="p-8">
            <h1 className="text-3xl font-bold mb-8">Math Debug Test</h1>
            
            <div className="prose max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkMath]}
                rehypePlugins={[[rehypeKatex, { strict: false }]]}
              >
                {testContent}
              </ReactMarkdown>
            </div>
            
            <div className="mt-8 p-4 bg-yellow-100 rounded">
              <h3 className="font-bold mb-2">Direct KaTeX Test:</h3>
              <p>This should show a rendered fraction: <span dangerouslySetInnerHTML={{ __html: katexHtml }} /></p>
              <p>Raw HTML: <code>{katexHtml}</code></p>
            </div>
            
            <div className="mt-8 p-4 bg-gray-100 rounded">
              <h3 className="font-bold mb-2">Raw processed content for bracket syntax:</h3>
              <pre className="text-sm overflow-x-auto">
                {processMarkdownForLatex(`[ I_{motor} = \\frac{P}{\\sqrt{3} \\times V \\times \\text{PF} \\times \\eta} ]`)}
              </pre>
            </div>

            <div className="mt-8 p-4 bg-blue-100 rounded">
              <h3 className="font-bold mb-2">CSS Check:</h3>
              <p>If you see this text styled normally, CSS is loading.</p>
              <p>If math formulas appear as plain text (like {'$E = mc^2$'}), then KaTeX CSS is not working.</p>
              <p>If math formulas appear as rendered math symbols, then everything is working!</p>
            </div>

            <div className="mt-8 p-4 bg-green-100 rounded">
              <h3 className="font-bold mb-2">Expected Behavior:</h3>
              <p>• Test 1 should show a fraction with V_DC(on) and I_brake</p>
              <p>• Test 2 should show the bracket syntax as plain text (not converted)</p>
              <p>• Test 3 should show the processed bracket syntax as a rendered fraction</p>
              <p>• Test 4 should show all the user's formulas as rendered math</p>
              <p>• Test 5 should show a centered block math formula</p>
              <p>• Test 6 should show E = mc² as rendered math</p>
            </div>

            <div className="mt-8 p-4 bg-red-100 rounded">
              <h3 className="font-bold mb-2">Debug Info:</h3>
              <p>Check browser console for debug messages.</p>
              <p>If math is not rendering, try refreshing the page.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 