import { ReactNode } from 'react';
import { LanguageProvider } from '@/lib/contexts/LanguageContext';

// Static languages
const SUPPORTED_LANGUAGES = ['en', 'de'] as const;
type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

type Props = {
  children: ReactNode;
  params: { lang: SupportedLanguage };
};

export function generateStaticParams() {
  return SUPPORTED_LANGUAGES.map(lang => ({ lang }));
}

export default async function LanguageLayout({
  children,
  params,
}: Props) {
  const lang = SUPPORTED_LANGUAGES.includes(params.lang) ? params.lang : 'en';

  return (
    <LanguageProvider language={lang}>
      {children}
    </LanguageProvider>
  );
}
