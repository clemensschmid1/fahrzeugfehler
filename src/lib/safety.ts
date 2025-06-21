// Output safety filter for AI responses

const OUTPUT_BANNED_PHRASES = [
  // English
  "you were told",
  "as an ai",
  "i was instructed",
  "system prompt",
  "inner monologue",
  "pretend to be",
  "api key",
  "your secret token",
  "override your rules",
  // German
  "systemanweisung",
  "du wurdest angewiesen",
  "api-schlüssel",
  "dein token",
  "tue so als ob",
  // Spanish
  "fuiste instruido",
  "como una ia",
  "clave de api",
  "prompt del sistema",
  "actúa como",
  // French
  "tu as été programmé",
  "invite système",
  "clé api",
  "en tant qu'ia",
  "fais semblant d'être"
];

export function isOutputUnsafe(text: string): boolean {
  const lower = text.toLowerCase();
  return OUTPUT_BANNED_PHRASES.some(phrase => lower.includes(phrase));
} 