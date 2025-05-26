// src/app/[lang]/layout.tsx

import type { ReactNode } from 'react'

export default function LanguageLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: { lang: string };
}) {
  const lang = params.lang ?? 'en';

  return (
    <html lang={lang}>
      <body>{children}</body>
    </html>
  );
}
