import { ReactNode } from 'react';
import { LanguageProvider } from '@/lib/contexts/LanguageContext';

const SUPPORTED_LANGUAGES = ['en', 'de'] as const;
type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];

type Props = {
  children: ReactNode;
  params: { lang: SupportedLanguage };
};

export function generateStaticParams() {
  return SUPPORTED_LANGUAGES.map(lang => ({ lang }));
}

export default function LanguageLayout({ children, params }: Props) {
  const lang = SUPPORTED_LANGUAGES.includes(params.lang)
    ? params.lang
    : 'en';

  return (
    <html lang={lang}>
      <body className="min-h-screen bg-white">
        <LanguageProvider language={lang}>
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
