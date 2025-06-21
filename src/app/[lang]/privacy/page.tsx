'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function PrivacyPage() {
  const params = useParams();
  const lang = params.lang as string;

  const t = (en: string, de: string) => lang === 'de' ? de : en;

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-xl rounded-2xl overflow-hidden">
          <div className="p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <Link 
                href={`/${lang}`}
                className="text-blue-600 hover:text-blue-800 flex items-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                {t("Back to Home", "Zurück zur Startseite")}
              </Link>
            </div>

            {/* Title */}
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {t("Privacy Policy", "Datenschutzerklärung")}
            </h1>
            
            {/* Date */}
            <div className="text-gray-600 mb-8">
              <p>{t("Effective date:", "Gültig ab:")} June 21, 2025</p>
              <p>{t("Last updated:", "Zuletzt aktualisiert:")} June 21, 2025</p>
            </div>

            {/* Introduction */}
            <div className="prose prose-lg max-w-none">
              <p className="text-gray-700 mb-8">
                {t(
                  "This Privacy Policy describes how Infoneva collects, uses, and protects your personal data when you visit our website or use our services.",
                  "Diese Datenschutzerklärung beschreibt, wie Infoneva Ihre personenbezogenen Daten erhebt, verwendet und schützt, wenn Sie unsere Website besuchen oder unsere Dienste nutzen."
                )}
              </p>

              {/* 1. Who We Are */}
              <section className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  1. {t("Who We Are", "Wer wir sind")}
                </h2>
                <p className="text-gray-700 mb-2">
                  <span className="font-medium">{t("Responsible entity:", "Verantwortliche Stelle:")}</span>
                </p>
                <div className="text-gray-700 space-y-1 ml-4">
                  <p>Clemens Schmid</p>
                  <p>Mahlgasse 2</p>
                  <p>88339 Bad Waldsee, Germany</p>
                  <p>{t("VAT ID:", "USt-IdNr.:")} DE356558857</p>
                  <p>
                    {t("Email:", "E-Mail:")} 
                    <a href="mailto:info@infoneva.com" className="text-blue-600 hover:text-blue-800 ml-1">
                      info@infoneva.com
                    </a>
                  </p>
                  <p>{t("Phone:", "Telefon:")} +49 15679638061</p>
                </div>
              </section>

              {/* 2. What Data We Collect */}
              <section className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  2. {t("What Data We Collect", "Welche Daten wir erheben")}
                </h2>
                <p className="text-gray-700 mb-4">
                  {t("We collect the following data when you use our services:", "Wir erheben folgende Daten, wenn Sie unsere Dienste nutzen:")}
                </p>
                <ul className="text-gray-700 space-y-2 ml-4">
                  <li><span className="font-medium">{t("Technical data:", "Technische Daten:")}</span> {t("IP address, browser type, operating system, device information", "IP-Adresse, Browsertyp, Betriebssystem, Geräteinformationen")}</li>
                  <li><span className="font-medium">{t("Usage data:", "Nutzungsdaten:")}</span> {t("Pages visited, time spent, referring pages, search queries", "Besuchte Seiten, Verweildauer, verweisende Seiten, Suchanfragen")}</li>
                  <li><span className="font-medium">{t("Login/account data (only if you sign up):", "Login-/Kontodaten (nur bei Registrierung):")}</span> {t("Email address, login times", "E-Mail-Adresse, Anmeldezeiten")}</li>
                  <li><span className="font-medium">{t("Diagnostic input:", "Diagnoseeingaben:")}</span> {t("Questions or inputs submitted via our AI chat interface", "Fragen oder Eingaben über unsere KI-Chat-Oberfläche")}</li>
                </ul>
              </section>

              {/* 3. How We Collect Your Data */}
              <section className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  3. {t("How We Collect Your Data", "Wie wir Ihre Daten erheben")}
                </h2>
                <p className="text-gray-700 mb-2">
                  {t("We collect data via:", "Wir erheben Daten über:")}
                </p>
                <ul className="text-gray-700 space-y-1 ml-4">
                  <li>{t("Server logs (hosted by Vercel)", "Server-Logs (gehostet von Vercel)")}</li>
                  <li>{t("Our own application (hosted on Supabase/PostgreSQL)", "Unsere eigene Anwendung (gehostet auf Supabase/PostgreSQL)")}</li>
                  <li>{t("Cookies or localStorage (minimal use – only if required for login/session)", "Cookies oder localStorage (minimaler Einsatz – nur bei erforderlich für Login/Session)")}</li>
                </ul>
              </section>

              {/* 4. Why We Collect Your Data */}
              <section className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  4. {t("Why We Collect Your Data", "Warum wir Ihre Daten erheben")}
                </h2>
                <p className="text-gray-700 mb-2">
                  {t("We use your data to:", "Wir verwenden Ihre Daten für:")}
                </p>
                <ul className="text-gray-700 space-y-1 ml-4 mb-4">
                  <li>{t("Provide and improve our AI-powered diagnostic platform", "Bereitstellung und Verbesserung unserer KI-gestützten Diagnoseplattform")}</li>
                  <li>{t("Ensure stability and performance of the system", "Gewährleistung der Stabilität und Leistung des Systems")}</li>
                  <li>{t("Analyze traffic (aggregated, non-personalized)", "Verkehrsanalyse (aggregiert, nicht personalisiert)")}</li>
                  <li>{t("Prevent abuse or misuse (security logs, rate-limiting)", "Verhinderung von Missbrauch (Sicherheits-Logs, Rate-Limiting)")}</li>
                </ul>
                <p className="text-gray-700">
                  {t("We do not sell, rent, or share your personal data with third parties for advertising purposes.", "Wir verkaufen, vermieten oder teilen Ihre personenbezogenen Daten nicht mit Dritten zu Werbezwecken.")}
                </p>
              </section>

              {/* 5. Legal Basis */}
              <section className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  5. {t("Legal Basis (EU Users)", "Rechtsgrundlage (EU-Nutzer)")}
                </h2>
                <p className="text-gray-700 mb-2">
                  {t("For users in the European Union, we rely on:", "Für Nutzer in der Europäischen Union stützen wir uns auf:")}
                </p>
                <ul className="text-gray-700 space-y-1 ml-4">
                  <li>{t("Art. 6(1)(b) GDPR – contractual necessity (when you use our service)", "Art. 6(1)(b) DSGVO – Vertragserfüllung (wenn Sie unseren Dienst nutzen)")}</li>
                  <li>{t("Art. 6(1)(f) GDPR – legitimate interest (analytics, security)", "Art. 6(1)(f) DSGVO – berechtigtes Interesse (Analyse, Sicherheit)")}</li>
                  <li>{t("Art. 6(1)(a) GDPR – user consent (only if cookies are introduced later)", "Art. 6(1)(a) DSGVO – Nutzereinwilligung (nur falls Cookies später eingeführt werden)")}</li>
                </ul>
              </section>

              {/* 6. Data Storage and Hosting */}
              <section className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  6. {t("Data Storage and Hosting", "Datenspeicherung und Hosting")}
                </h2>
                <div className="text-gray-700 space-y-2">
                  <p>{t("Data is hosted in Supabase (PostgreSQL) servers located in the EU.", "Daten werden auf Supabase (PostgreSQL) Servern in der EU gehostet.")}</p>
                  <p>{t("Frontend is deployed via Vercel, using distributed infrastructure.", "Das Frontend wird über Vercel bereitgestellt und nutzt verteilte Infrastruktur.")}</p>
                  <p>{t("We retain diagnostic input (your submitted questions) for technical improvement and internal analytics.", "Wir behalten Diagnoseeingaben (Ihre eingereichten Fragen) für technische Verbesserungen und interne Analysen bei.")}</p>
                </div>
              </section>

              {/* 7. Your Rights */}
              <section className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  7. {t("Your Rights", "Ihre Rechte")}
                </h2>
                <p className="text-gray-700 mb-2">
                  {t("Under GDPR and similar laws, you have the right to:", "Nach DSGVO und ähnlichen Gesetzen haben Sie das Recht:")}
                </p>
                <ul className="text-gray-700 space-y-1 ml-4 mb-4">
                  <li>{t("Request access to your personal data", "Zugang zu Ihren personenbezogenen Daten zu verlangen")}</li>
                  <li>{t("Request correction or deletion", "Berichtigung oder Löschung zu verlangen")}</li>
                  <li>{t("Object to data processing", "Der Datenverarbeitung zu widersprechen")}</li>
                  <li>{t("Request data portability", "Datenübertragbarkeit zu verlangen")}</li>
                </ul>
                <p className="text-gray-700">
                  {t("To exercise these rights, contact:", "Um diese Rechte auszuüben, kontaktieren Sie:")} 
                  <a href="mailto:info@infoneva.com" className="text-blue-600 hover:text-blue-800 ml-1">
                    info@infoneva.com
                  </a>
                </p>
              </section>

              {/* 8. Data Security */}
              <section className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  8. {t("Data Security", "Datensicherheit")}
                </h2>
                <p className="text-gray-700">
                  {t("We implement modern encryption (HTTPS), access control, and regular audits to protect your data.", "Wir implementieren moderne Verschlüsselung (HTTPS), Zugangskontrolle und regelmäßige Audits zum Schutz Ihrer Daten.")}
                </p>
              </section>

              {/* 9. Third Parties */}
              <section className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  9. {t("Third Parties", "Dritte")}
                </h2>
                <p className="text-gray-700">
                  {t("Currently, we do not use external trackers (e.g. Google Analytics, Facebook Pixel). If any such tools are introduced in the future, this policy will be updated.", "Derzeit verwenden wir keine externen Tracker (z.B. Google Analytics, Facebook Pixel). Falls solche Tools in Zukunft eingeführt werden, wird diese Richtlinie aktualisiert.")}
                </p>
              </section>

              {/* 10. Contact */}
              <section className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  10. {t("Contact", "Kontakt")}
                </h2>
                <p className="text-gray-700 mb-2">
                  {t("If you have any questions about this Privacy Policy or how we handle your data, please contact:", "Wenn Sie Fragen zu dieser Datenschutzerklärung oder zur Verarbeitung Ihrer Daten haben, kontaktieren Sie bitte:")}
                </p>
                <div className="text-gray-700 space-y-1 ml-4">
                  <p>Clemens Schmid</p>
                  <p>
                    <a href="mailto:info@infoneva.com" className="text-blue-600 hover:text-blue-800">
                      info@infoneva.com
                    </a>
                  </p>
                </div>
              </section>

              <section className="mt-12 pt-8 border-t border-gray-200">
                <p className="text-gray-600 text-sm">
                  © 2024 Infoneva. {t("All rights reserved.", "Alle Rechte vorbehalten.")}
                </p>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 