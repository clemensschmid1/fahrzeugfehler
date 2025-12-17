import { ReactNode } from 'react';
import { LanguageWrapper } from '@/components/LanguageWrapper';
// ThemeProvider is applied at the root layout

const SUPPORTED_LANGUAGES = ['en', 'de'] as const;
type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];

// Exclude internal routes from static generation
export function generateStaticParams() {
  // Only generate for non-internal routes
  // Internal routes are handled dynamically
  return SUPPORTED_LANGUAGES.map(lang => ({ lang }));
}

// Prevent static generation for internal routes
export const dynamicParams = true;

export default async function LangLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ lang: SupportedLanguage }>;
}) {
  const { lang } = await params;
  return (
    <LanguageWrapper lang={lang}>
      {children}
    </LanguageWrapper>
  );
}
