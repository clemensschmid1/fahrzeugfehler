import { ReactNode } from 'react';
import { LanguageProvider } from '@/lib/contexts/LanguageContext';

type Props = {
  children: ReactNode;
  params: { lang: string };
};

export default function LanguageLayout({ children, params }: Props) {
  return (
    <LanguageProvider language={params.lang}>
      {children}
    </LanguageProvider>
  );
}
