import { ReactNode } from 'react';
import { LanguageWrapper } from '@/components/LanguageWrapper';

const SUPPORTED_LANGUAGES = ['en', 'de'] as const;
type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export async function generateStaticParams() {
  return SUPPORTED_LANGUAGES.map(lang => ({ lang }));
}

export default async function LanguageLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang: rawLang } = await params;
  const lang: SupportedLanguage = SUPPORTED_LANGUAGES.includes(rawLang as SupportedLanguage)
    ? rawLang as SupportedLanguage
    : 'en';

  return (
    <LanguageWrapper lang={lang}>
      {children}
    </LanguageWrapper>
  );
}
