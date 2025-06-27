// LaTeX function detection and formatting utilities

/**
 * Detects LaTeX math formulas in text and converts them to proper LaTeX math syntax
 * Examples: [ R = \frac{V_{DC(on)}}{I_{brake}} ] -> $R = \frac{V_{DC(on)}}{I_{brake}}$
 * These will be rendered as real mathematical symbols using remark-math and rehype-katex
 */
export function formatLatexFunctions(text: string): string {
  // Pattern to match LaTeX math formulas in square brackets
  // Matches: [ ... ] where content contains LaTeX math symbols like _, {, }, \, etc.
  const latexPattern = /\[([^\]]*[_{}\\\^][^\]]*)\]/g;
  
  return text.replace(latexPattern, (match, content) => {
    // Convert to proper LaTeX math syntax for remark-math
    return `$${content}$`;
  });
}

/**
 * Processes markdown content to detect and format LaTeX math formulas
 * This should be applied to text content before it goes to ReactMarkdown
 */
export function processMarkdownForLatex(content: string): string {
  // Process the entire content for LaTeX formulas, regardless of context
  return formatLatexFunctions(content);
} 