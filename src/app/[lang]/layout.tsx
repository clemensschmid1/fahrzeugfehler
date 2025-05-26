import { ReactNode } from 'react';

export default async function LanguageLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: { lang: string };
}) {
  // Ensure lang is a valid value
  const lang = params.lang || 'en';

  return (
    <html lang={lang}>
      <body>
        {children}
      </body>
    </html>
  );
}
