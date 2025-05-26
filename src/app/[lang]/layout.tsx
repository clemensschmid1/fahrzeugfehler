import { ReactNode } from 'react';

export default function LanguageLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: { lang: string };
}) {
  // Destructure lang safely (used internally only)
  const lang = typeof params?.lang === 'string' ? params.lang : 'en';

  return (
    <html lang="en">{/* keep static to prevent hydration mismatches */}
      <body className="min-h-screen bg-white">{children}</body>
    </html>
  );
}
