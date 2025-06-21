import sanitizeHtml from 'sanitize-html';

export function sanitizeAnswer(text: string): string {
  return sanitizeHtml(text, {
    allowedTags: ['p', 'b', 'i', 'em', 'ul', 'ol', 'li', 'code', 'strong'],
    allowedAttributes: {},
    allowedStyles: {},
    disallowedTagsMode: 'discard',
    // No attributes or styles allowed
  });
} 