import { ReactNode } from 'react';
import { LanguageProvider } from '@/lib/contexts/LanguageContext';

const SUPPORTED_LANGUAGES = ['en', 'de'] as const;
type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];

// ✅ LayoutProps muss generisch angepasst werden
type LayoutProps = {
  children: ReactNode;
  params: { lang: SupportedLanguage };
};

export async function generateStaticParams() {
  return SUPPORTED_LANGUAGES.map(lang => ({ lang }));
}

export default async function LanguageLayout(props: Promise<LayoutProps>) {
  const { children, params } = await props;

  const lang = SUPPORTED_LANGUAGES.includes(params.lang)
    ? params.lang
    : 'en';

  return (
    <LanguageProvider language={lang}>
      {children}
    </LanguageProvider>
  );
}
