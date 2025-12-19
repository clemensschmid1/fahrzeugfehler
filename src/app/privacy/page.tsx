import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Datenschutzerklärung | Fahrzeugfehler.de',
  description: 'Datenschutzerklärung von Fahrzeugfehler.de - Informationen zur Datenverarbeitung',
  alternates: {
    canonical: 'https://fahrzeugfehler.de/privacy',
  },
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-white dark:bg-slate-950 pt-24 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-lg overflow-hidden">
          <div className="p-8">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
              Datenschutzerklärung
            </h1>
            
            <div className="text-slate-600 dark:text-slate-400 mb-8">
              <p>Gültig ab: 21. Juni 2025</p>
              <p>Zuletzt aktualisiert: 21. Juni 2025</p>
            </div>

            <div className="prose prose-lg max-w-none dark:prose-invert">
              <p className="text-slate-700 dark:text-slate-300 mb-8">
                Diese Datenschutzerklärung beschreibt, wie Fahrzeugfehler.de Ihre personenbezogenen Daten erhebt, verwendet und schützt, wenn Sie unsere Website besuchen oder unsere Dienste nutzen.
              </p>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
                  1. Wer wir sind
                </h2>
                <p className="text-slate-700 dark:text-slate-300 mb-2">
                  <span className="font-medium">Verantwortliche Stelle:</span>
                </p>
                <div className="text-slate-700 dark:text-slate-300 space-y-1 ml-4">
                  <p>Clemens Schmid</p>
                  <p>Mahlgasse 2</p>
                  <p>88339 Bad Waldsee, Deutschland</p>
                  <p>USt-IdNr.: DE356558857</p>
                  <p>
                    E-Mail:{' '}
                    <a href="mailto:info@fahrzeugfehler.de" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300">
                      info@fahrzeugfehler.de
                    </a>
                  </p>
                  <p>Telefon: +49 1567 9638061</p>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
                  2. Welche Daten wir erheben
                </h2>
                <p className="text-slate-700 dark:text-slate-300 mb-4">
                  Wir erheben folgende Daten, wenn Sie unsere Dienste nutzen:
                </p>
                <ul className="text-slate-700 dark:text-slate-300 space-y-2 ml-4">
                  <li><span className="font-medium">Technische Daten:</span> IP-Adresse, Browsertyp, Betriebssystem, Geräteinformationen</li>
                  <li><span className="font-medium">Nutzungsdaten:</span> Besuchte Seiten, Verweildauer, verweisende Seiten, Suchanfragen</li>
                  <li><span className="font-medium">Login-/Kontodaten (nur bei Registrierung):</span> E-Mail-Adresse, Anmeldezeiten</li>
                  <li><span className="font-medium">Diagnoseeingaben:</span> Fragen oder Eingaben über unsere Chat-Oberfläche</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
                  3. Wie wir Ihre Daten erheben
                </h2>
                <p className="text-slate-700 dark:text-slate-300 mb-2">
                  Wir erheben Daten über:
                </p>
                <ul className="text-slate-700 dark:text-slate-300 space-y-1 ml-4">
                  <li>Server-Logs (gehostet von Vercel)</li>
                  <li>Unsere eigene Anwendung (gehostet auf Supabase/PostgreSQL)</li>
                  <li>Cookies oder localStorage (minimaler Einsatz – nur bei erforderlich für Login/Session)</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
                  4. Warum wir Ihre Daten erheben
                </h2>
                <p className="text-slate-700 dark:text-slate-300 mb-2">
                  Wir verwenden Ihre Daten für:
                </p>
                <ul className="text-slate-700 dark:text-slate-300 space-y-1 ml-4 mb-4">
                  <li>Bereitstellung und Verbesserung unserer Diagnoseplattform</li>
                  <li>Gewährleistung der Stabilität und Leistung des Systems</li>
                  <li>Verkehrsanalyse (aggregiert, nicht personalisiert)</li>
                  <li>Verhinderung von Missbrauch (Sicherheits-Logs, Rate-Limiting)</li>
                </ul>
                <p className="text-slate-700 dark:text-slate-300">
                  Wir verkaufen, vermieten oder teilen Ihre personenbezogenen Daten nicht mit Dritten zu Werbezwecken.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
                  5. Rechtsgrundlage (EU-Nutzer)
                </h2>
                <p className="text-slate-700 dark:text-slate-300 mb-2">
                  Für Nutzer in der Europäischen Union stützen wir uns auf:
                </p>
                <ul className="text-slate-700 dark:text-slate-300 space-y-1 ml-4">
                  <li>Art. 6(1)(b) DSGVO – Vertragserfüllung (wenn Sie unseren Dienst nutzen)</li>
                  <li>Art. 6(1)(f) DSGVO – berechtigtes Interesse (Analyse, Sicherheit)</li>
                  <li>Art. 6(1)(a) DSGVO – Nutzereinwilligung (nur falls Cookies später eingeführt werden)</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
                  6. Datenspeicherung und Hosting
                </h2>
                <div className="text-slate-700 dark:text-slate-300 space-y-2">
                  <p>Daten werden auf Supabase (PostgreSQL) Servern in der EU gehostet.</p>
                  <p>Das Frontend wird über Vercel bereitgestellt und nutzt verteilte Infrastruktur.</p>
                  <p>Wir behalten Diagnoseeingaben (Ihre eingereichten Fragen) für technische Verbesserungen und interne Analysen bei.</p>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
                  7. Ihre Rechte
                </h2>
                <p className="text-slate-700 dark:text-slate-300 mb-2">
                  Nach DSGVO und ähnlichen Gesetzen haben Sie das Recht:
                </p>
                <ul className="text-slate-700 dark:text-slate-300 space-y-1 ml-4 mb-4">
                  <li>Zugang zu Ihren personenbezogenen Daten zu verlangen</li>
                  <li>Berichtigung oder Löschung zu verlangen</li>
                  <li>Der Datenverarbeitung zu widersprechen</li>
                  <li>Datenübertragbarkeit zu verlangen</li>
                </ul>
                <p className="text-slate-700 dark:text-slate-300">
                  Um diese Rechte auszuüben, kontaktieren Sie:{' '}
                  <a href="mailto:info@fahrzeugfehler.de" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300">
                    info@fahrzeugfehler.de
                  </a>
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
                  8. Datensicherheit
                </h2>
                <p className="text-slate-700 dark:text-slate-300">
                  Wir implementieren moderne Verschlüsselung (HTTPS), Zugangskontrolle und regelmäßige Audits zum Schutz Ihrer Daten.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
                  9. Dritte
                </h2>
                <p className="text-slate-700 dark:text-slate-300">
                  Derzeit verwenden wir keine externen Tracker (z.B. Google Analytics, Facebook Pixel). Falls solche Tools in Zukunft eingeführt werden, wird diese Richtlinie aktualisiert.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
                  10. Kontakt
                </h2>
                <p className="text-slate-700 dark:text-slate-300 mb-2">
                  Wenn Sie Fragen zu dieser Datenschutzerklärung oder zur Verarbeitung Ihrer Daten haben, kontaktieren Sie bitte:
                </p>
                <div className="text-slate-700 dark:text-slate-300 space-y-1 ml-4">
                  <p>Clemens Schmid</p>
                  <p>
                    <a href="mailto:info@fahrzeugfehler.de" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300">
                      info@fahrzeugfehler.de
                    </a>
                  </p>
                </div>
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


