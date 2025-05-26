import { ReactNode } from 'react';
import { LanguageProvider } from '@/lib/contexts/LanguageContext';

// Define supported languages
const SUPPORTED_LANGUAGES = ['en', 'de'] as const;
type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];

type Props = {
  children: ReactNode;
  params: { lang: SupportedLanguage };
};

// Define static params for build-time optimization
export async function generateStaticParams() {
  return SUPPORTED_LANGUAGES.map(lang => ({ lang }));
}

export default function LanguageLayout({ children, params }: Props) {
  // Ensure we have a valid language
  const lang = SUPPORTED_LANGUAGES.includes(params.lang as SupportedLanguage) 
    ? params.lang 
    : 'en';

  return (
    <LanguageProvider language={lang}>
      {children}
    </LanguageProvider>
  );
}
