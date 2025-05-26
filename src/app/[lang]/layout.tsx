import { ReactNode } from 'react';
import { LanguageWrapper } from '@/components/LanguageWrapper';

const SUPPORTED_LANGUAGES = ['en', 'de'] as const;
type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export async function generateStaticParams() {
  return SUPPORTED_LANGUAGES.map(lang => ({ lang }));
}

export default function LanguageLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: any; // ← FIX: Let Next handle its internal weirdness
}) {
  const lang: SupportedLanguage = SUPPORTED_LANGUAGES.includes(params.lang)
    ? params.lang
    : 'en';

  return (
    <LanguageWrapper lang={lang}>
      {children}
    </LanguageWrapper>
  );
}
