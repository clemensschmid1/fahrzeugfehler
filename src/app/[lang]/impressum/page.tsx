'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function ImpressumPage() {
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
            <h1 className="text-3xl font-bold text-gray-900 mb-8">
              {t("Legal Notice", "Impressum")}
            </h1>

            {/* Legal Content */}
            <div className="prose prose-lg max-w-none">
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  {t("Information in accordance with §5 TMG (Germany) / §25 MedienG (Austria)", "Angaben gemäß §5 TMG (Deutschland) / §25 MedienG (Österreich)")}
                </h2>
              </div>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  {t("Business Owner", "Inhaber")}
                </h2>
                <div className="text-gray-700 space-y-1">
                  <p>Clemens Schmid</p>
                  <p>Mahlgasse 2</p>
                  <p>88339 Bad Waldsee</p>
                  <p>Germany</p>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  {t("Contact Information", "Kontaktinformationen")}
                </h2>
                <div className="text-gray-700 space-y-2">
                  <p>
                    <span className="font-medium">{t("Phone:", "Telefon:")}</span> +49 1567 9638061
                  </p>
                  <p>
                    <span className="font-medium">{t("Email:", "E-Mail:")}</span> 
                    <a href="mailto:info@infoneva.com" className="text-blue-600 hover:text-blue-800 ml-1">
                      info@infoneva.com
                    </a>
                  </p>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  {t("Business Information", "Geschäftsinformationen")}
                </h2>
                <div className="text-gray-700 space-y-2">
                  <p>
                    <span className="font-medium">{t("VAT ID:", "USt-IdNr.:")}</span> DE356558857
                  </p>
                  <p>
                    <span className="font-medium">{t("Business Type:", "Rechtsform:")}</span> 
                    {t("Sole proprietorship", "Einzelunternehmen")}
                  </p>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  {t("Responsible for content according to §55(2) RStV (Germany):", "Verantwortlich für den Inhalt nach §55(2) RStV (Deutschland):")}
                </h2>
                <div className="text-gray-700 space-y-1">
                  <p>Clemens Schmid, {t("address as above", "Anschrift wie oben")}.</p>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  {t("Online Dispute Resolution", "Online-Streitbeilegung")}
                </h2>
                <p className="text-gray-700 mb-2">
                  {t("Platform of the EU Commission for online dispute resolution (ODR):", "Plattform der EU-Kommission zur Online-Streitbeilegung (OS):")}
                </p>
                <a 
                  href="https://ec.europa.eu/consumers/odr" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 break-all"
                >
                  https://ec.europa.eu/consumers/odr
                </a>
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