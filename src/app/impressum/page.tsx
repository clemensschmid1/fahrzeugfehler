import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Impressum | Fahrzeugfehler.de',
  description: 'Impressum und rechtliche Angaben zu Fahrzeugfehler.de',
  alternates: {
    canonical: 'https://fahrzeugfehler.de/impressum',
  },
};

export default function ImpressumPage() {
  return (
    <main className="min-h-screen bg-white dark:bg-slate-950 pt-24 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-lg overflow-hidden">
          <div className="p-8">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-8">
              Impressum
            </h1>

            <div className="prose prose-lg max-w-none dark:prose-invert">
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
                  Angaben gemäß §5 TMG (Deutschland) / §25 MedienG (Österreich)
                </h2>
              </div>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
                  Inhaber
                </h2>
                <div className="text-slate-700 dark:text-slate-300 space-y-1">
                  <p>Clemens Schmid</p>
                  <p>Mahlgasse 2</p>
                  <p>88339 Bad Waldsee</p>
                  <p>Deutschland</p>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
                  Kontaktinformationen
                </h2>
                <div className="text-slate-700 dark:text-slate-300 space-y-2">
                  <p>
                    <span className="font-medium">Telefon:</span> +49 1567 9638061
                  </p>
                  <p>
                    <span className="font-medium">E-Mail:</span>{' '}
                    <a 
                      href="mailto:info@fahrzeugfehler.de" 
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline"
                    >
                      info@fahrzeugfehler.de
                    </a>
                  </p>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
                  Geschäftsinformationen
                </h2>
                <div className="text-slate-700 dark:text-slate-300 space-y-2">
                  <p>
                    <span className="font-medium">USt-IdNr.:</span> DE356558857
                  </p>
                  <p>
                    <span className="font-medium">Rechtsform:</span> Einzelunternehmen
                  </p>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
                  Verantwortlich für den Inhalt nach §55(2) RStV (Deutschland):
                </h2>
                <div className="text-slate-700 dark:text-slate-300 space-y-1">
                  <p>Clemens Schmid, Anschrift wie oben.</p>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
                  EU-Streitschlichtung
                </h2>
                <p className="text-slate-700 dark:text-slate-300 mb-2">
                  Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:
                </p>
                <p className="text-slate-700 dark:text-slate-300 mb-4">
                  <a 
                    href="https://ec.europa.eu/consumers/odr" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline break-all"
                  >
                    https://ec.europa.eu/consumers/odr
                  </a>
                </p>
                <p className="text-slate-700 dark:text-slate-300">
                  Unsere E-Mail-Adresse finden Sie oben im Impressum.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
                  Verbraucherstreitbeilegung / Universalschlichtungsstelle
                </h2>
                <p className="text-slate-700 dark:text-slate-300 mb-2">
                  Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.
                </p>
              </section>

              <section className="mt-12 pt-8 border-t border-slate-200 dark:border-white/10">
                <p className="text-slate-600 dark:text-slate-400 text-sm">
                  © 2024 Fahrzeugfehler.de. Alle Rechte vorbehalten.
                </p>
              </section>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}


