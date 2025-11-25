import { ReactNode } from 'react';
import { LanguageWrapper } from '@/components/LanguageWrapper';

const SUPPORTED_LANGUAGES = ['en', 'de'] as const;
type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];

export function generateStaticParams() {
  return SUPPORTED_LANGUAGES.map(lang => ({ lang }));
}

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
