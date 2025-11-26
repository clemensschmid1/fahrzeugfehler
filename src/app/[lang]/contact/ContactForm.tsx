'use client';

import { useState } from 'react';

interface ContactFormProps {
  lang: string;
}

export default function ContactForm({ lang }: ContactFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: 'improvement',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const t = (en: string, de: string) => lang === 'de' ? de : en;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    // Create mailto link with form data
    const subject = encodeURIComponent(`${t('FAULTBASE Contact Form', 'FAULTBASE Kontaktformular')} - ${formData.subject}`);
    const body = encodeURIComponent(
      `Name: ${formData.name}\n` +
      `Email: ${formData.email}\n` +
      `Subject: ${formData.subject}\n\n` +
      `Message:\n${formData.message}`
    );

    // Open email client
    window.location.href = `mailto:contact@faultbase.com?subject=${subject}&body=${body}`;

    // Show success message
    setTimeout(() => {
      setSubmitStatus('success');
      setIsSubmitting(false);
      setFormData({
        name: '',
        email: '',
        subject: 'improvement',
        message: '',
      });
      setTimeout(() => setSubmitStatus('idle'), 5000);
    }, 500);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="name" className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
          {t('Name', 'Name')}
        </label>
        <input
          type="text"
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-4 py-3 border border-slate-300 dark:border-white/20 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white transition-colors"
          placeholder={t('Your name', 'Ihr Name')}
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
          {t('Email', 'E-Mail')}
        </label>
        <input
          type="email"
          id="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="w-full px-4 py-3 border border-slate-300 dark:border-white/20 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white transition-colors"
          placeholder={t('your.email@example.com', 'ihre.email@beispiel.de')}
          required
        />
      </div>

      <div>
        <label htmlFor="subject" className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
          {t('Subject', 'Betreff')}
        </label>
        <select
          id="subject"
          value={formData.subject}
          onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
          className="w-full px-4 py-3 border border-slate-300 dark:border-white/20 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white transition-colors"
        >
          <option value="improvement">{t('Suggestion for Improvement', 'Verbesserungsvorschlag')}</option>
          <option value="bug">{t('Bug Report', 'Fehlermeldung')}</option>
          <option value="content">{t('Content Suggestion', 'Inhaltsvorschlag')}</option>
          <option value="feedback">{t('General Feedback', 'Allgemeines Feedback')}</option>
          <option value="other">{t('Other', 'Sonstiges')}</option>
        </select>
      </div>

      <div>
        <label htmlFor="message" className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
          {t('Message', 'Nachricht')}
        </label>
        <textarea
          id="message"
          value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          rows={8}
          className="w-full px-4 py-3 border border-slate-300 dark:border-white/20 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white transition-colors resize-none"
          placeholder={t(
            'Tell us about your idea, suggestion, or feedback. Be as detailed as possible.',
            'Erzählen Sie uns von Ihrer Idee, Ihrem Vorschlag oder Feedback. Seien Sie so detailliert wie möglich.'
          )}
          required
        ></textarea>
      </div>

      {submitStatus === 'success' && (
        <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
          <div className="flex items-center gap-2 text-green-900 dark:text-green-200">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="font-medium text-sm">
              {t(
                'Your email client should open now. If not, please send your message to contact@faultbase.com',
                'Ihr E-Mail-Client sollte sich jetzt öffnen. Falls nicht, senden Sie Ihre Nachricht bitte an contact@faultbase.com'
              )}
            </span>
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full px-8 py-4 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-lg font-semibold rounded-xl transition-colors shadow-lg hover:shadow-xl"
      >
        {isSubmitting ? t('Opening email client...', 'E-Mail-Client wird geöffnet...') : t('Send Message', 'Nachricht senden')}
      </button>
    </form>
  );
}

