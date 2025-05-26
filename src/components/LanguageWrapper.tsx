'use client';

import { ReactNode } from 'react';
import { LanguageProvider } from '@/lib/contexts/LanguageContext';

type LanguageWrapperProps = {
  children: ReactNode;
  lang: string;
};

export function LanguageWrapper({ children, lang }: LanguageWrapperProps) {
  return (
    <LanguageProvider language={lang}>
      {children}
    </LanguageProvider>
  );
} 