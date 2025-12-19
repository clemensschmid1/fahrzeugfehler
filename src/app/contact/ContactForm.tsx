'use client';

import { useState } from 'react';

export default function ContactForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: 'improvement',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    // Create mailto link with form data
    const subject = encodeURIComponent(`Fahrzeugfehler.de Kontaktformular - ${formData.subject}`);
    const body = encodeURIComponent(
      `Name: ${formData.name}\n` +
      `Email: ${formData.email}\n` +
      `Betreff: ${formData.subject}\n\n` +
      `Nachricht:\n${formData.message}`
    );

    // Open email client
    window.location.href = `mailto:info@fahrzeugfehler.de?subject=${subject}&body=${body}`;

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

  const subjectLabels: Record<string, string> = {
    improvement: 'Verbesserungsvorschlag',
    bug: 'Fehlermeldung',
    content: 'Inhaltsvorschlag',
    feedback: 'Allgemeines Feedback',
    other: 'Sonstiges',
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="name" className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
          Name
        </label>
        <input
          type="text"
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-4 py-3 border border-slate-300 dark:border-white/20 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white transition-colors"
          placeholder="Ihr Name"
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
          E-Mail
        </label>
        <input
          type="email"
          id="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="w-full px-4 py-3 border border-slate-300 dark:border-white/20 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white transition-colors"
          placeholder="ihre.email@beispiel.de"
          required
        />
      </div>

      <div>
        <label htmlFor="subject" className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
          Betreff
        </label>
        <select
          id="subject"
          value={formData.subject}
          onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
          className="w-full px-4 py-3 border border-slate-300 dark:border-white/20 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white transition-colors"
        >
          <option value="improvement">Verbesserungsvorschlag</option>
          <option value="bug">Fehlermeldung</option>
          <option value="content">Inhaltsvorschlag</option>
          <option value="feedback">Allgemeines Feedback</option>
          <option value="other">Sonstiges</option>
        </select>
      </div>

      <div>
        <label htmlFor="message" className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
          Nachricht
        </label>
        <textarea
          id="message"
          value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          rows={8}
          className="w-full px-4 py-3 border border-slate-300 dark:border-white/20 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white transition-colors resize-none"
          placeholder="Erzählen Sie uns von Ihrer Idee, Ihrem Vorschlag oder Feedback. Seien Sie so detailliert wie möglich."
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
              Ihr E-Mail-Client sollte sich jetzt öffnen. Falls nicht, senden Sie Ihre Nachricht bitte an info@fahrzeugfehler.de
            </span>
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full px-8 py-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-lg font-semibold rounded-xl transition-colors shadow-lg hover:shadow-xl"
      >
        {isSubmitting ? 'E-Mail-Client wird geöffnet...' : 'Nachricht senden'}
      </button>
    </form>
  );
}


