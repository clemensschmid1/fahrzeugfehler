import { ReactNode } from 'react';
import { LanguageWrapper } from '@/components/LanguageWrapper';

// Static languages
const SUPPORTED_LANGUAGES = ['en', 'de'] as const;
type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

// This is required by Next.js 15 for static optimization
export async function generateStaticParams() {
  return SUPPORTED_LANGUAGES.map(lang => ({ lang }));
}

// The layout must be async in Next.js 15 when using dynamic params
export default async function LanguageLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: { lang: string };
}) {
  // Validate the language parameter
  const lang = SUPPORTED_LANGUAGES.includes(params.lang as SupportedLanguage)
    ? params.lang
    : 'en';

  return (
    <LanguageWrapper lang={lang}>
      {children}
    </LanguageWrapper>
  );
}
