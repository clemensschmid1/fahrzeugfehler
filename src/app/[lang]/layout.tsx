import { ReactNode } from 'react';
import { LanguageWrapper } from '@/components/LanguageWrapper';
import { cookies } from 'next/headers';

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
  const resolvedParams = await params;
  
  const lang: SupportedLanguage = SUPPORTED_LANGUAGES.includes(resolvedParams.lang as SupportedLanguage)
    ? resolvedParams.lang as SupportedLanguage
    : 'en';

  return (
    <LanguageWrapper lang={lang}>
      {children}
    </LanguageWrapper>
  );
}
