/**
 * SEO Utility Functions für Google-Optimierung
 */

/**
 * Optimiert Meta Descriptions auf 150-160 Zeichen
 * Schneidet nicht mitten im Wort ab
 */
export function optimizeMetaDescription(text: string, maxLength: number = 160): string {
  if (!text) return '';
  
  // Entferne mehrfache Leerzeichen und trimme
  const cleaned = text.replace(/\s+/g, ' ').trim();
  
  if (cleaned.length <= maxLength) {
    return cleaned;
  }
  
  // Schneide bei letztem Leerzeichen vor maxLength ab
  const truncated = cleaned.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  
  if (lastSpace > 0) {
    return truncated.substring(0, lastSpace) + '...';
  }
  
  return truncated + '...';
}

/**
 * Optimiert Title-Tags auf max. 60 Zeichen
 */
export function optimizeTitle(title: string, maxLength: number = 60): string {
  if (!title) return '';
  
  if (title.length <= maxLength) {
    return title;
  }
  
  // Schneide bei letztem Leerzeichen vor maxLength ab
  const truncated = title.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  
  if (lastSpace > 0) {
    return truncated.substring(0, lastSpace) + '...';
  }
  
  return truncated + '...';
}

/**
 * Erstellt SEO-freundliche Keywords aus Text
 */
export function extractKeywords(text: string, maxKeywords: number = 8): string {
  if (!text) return '';
  
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 4) // Mindestens 5 Zeichen
    .filter((word, index, arr) => arr.indexOf(word) === index) // Deduplizieren
    .slice(0, maxKeywords);
  
  return words.join(', ');
}

/**
 * Validiert Meta Description Länge
 */
export function validateMetaDescription(description: string): { valid: boolean; length: number; message?: string } {
  const length = description.length;
  
  if (length === 0) {
    return { valid: false, length, message: 'Meta Description ist leer' };
  }
  
  if (length < 120) {
    return { valid: false, length, message: 'Meta Description zu kurz (empfohlen: 120-160 Zeichen)' };
  }
  
  if (length > 160) {
    return { valid: false, length, message: 'Meta Description zu lang (max. 160 Zeichen)' };
  }
  
  return { valid: true, length };
}

/**
 * Validiert Title-Tag Länge
 */
export function validateTitle(title: string): { valid: boolean; length: number; message?: string } {
  const length = title.length;
  
  if (length === 0) {
    return { valid: false, length, message: 'Title ist leer' };
  }
  
  if (length > 60) {
    return { valid: false, length, message: 'Title zu lang (max. 60 Zeichen)' };
  }
  
  return { valid: true, length };
}
