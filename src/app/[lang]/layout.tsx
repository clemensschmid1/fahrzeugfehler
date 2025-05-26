import { ReactNode } from 'react';
import { LanguageProvider } from '@/lib/contexts/LanguageContext';

// Static languages
const SUPPORTED_LANGUAGES = ['en', 'de'] as const;
type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export async function generateStaticParams() {
  return SUPPORTED_LANGUAGES.map(lang => ({ lang }));
}

interface LayoutParams {
  params: { lang: SupportedLanguage };
  children: ReactNode;
}

export default function LanguageLayout({ children, params }: LayoutParams) {
  const lang = SUPPORTED_LANGUAGES.includes(params.lang) ? params.lang : 'en';

  return (
    <LanguageProvider language={lang}>
      {children}
    </LanguageProvider>
  );
}
