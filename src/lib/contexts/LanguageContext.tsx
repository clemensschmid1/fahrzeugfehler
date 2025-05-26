'use client';

import { createContext, useContext, ReactNode } from 'react';

type LanguageContextType = {
  language: string;
};

const LanguageContext = createContext<LanguageContextType>({ language: 'en' });

export function LanguageProvider({
  children,
  language,
}: {
  children: ReactNode;
  language: string;
}) {
  return (
    <LanguageContext.Provider value={{ language }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
} 