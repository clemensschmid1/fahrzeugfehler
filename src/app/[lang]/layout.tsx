import { ReactNode } from 'react';
import { LanguageProvider } from '@/lib/contexts/LanguageContext';

const SUPPORTED_LANGUAGES = ['en', 'de'] as const;
type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export function generateStaticParams() {
  return SUPPORTED_LANGUAGES.map(lang => ({ lang }));
}

export default function LanguageLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: { lang: SupportedLanguage };
}) {
  const lang = SUPPORTED_LANGUAGES.includes(params.lang) ? params.lang : 'en';

  return (
    <LanguageProvider language={lang}>
      {children}
    </LanguageProvider>
  );
}
