'use client';

import { useState, useMemo } from 'react';
import { getSupabaseClient } from '@/lib/supabase';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [notificationEmail, setNotificationEmail] = useState('');
  const [notificationStatus, setNotificationStatus] = useState<string | null>(null);
  const [isSubmittingNotification, setIsSubmittingNotification] = useState(false);
  const router = useRouter();
  const params = useParams();
  const lang = params.lang as string;
  const supabase = useMemo(() => getSupabaseClient(), []);

  // Translation helper function
  const t = (en: string, de: string) => lang === 'de' ? de : en;

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    // This form is disabled, so the logic inside is currently unused.
    // If re-enabled, loading/error/message state will need to be re-added.

    const { error: signupError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${location.origin}/auth/callback`,
      },
    });

    if (signupError) {
      console.error('Signup Error:', signupError.message);
    } else {
      console.log('Signup successful, confirmation email sent.');
      // Redirect to profile page after successful signup
      router.push(`/${lang}/profile`);
    }
  };

  const handleNotificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notificationEmail || !notificationEmail.includes('@')) {
      setNotificationStatus(t('Please enter a valid email address.', 'Bitte geben Sie eine gültige E-Mail-Adresse ein.'));
      return;
    }

    setIsSubmittingNotification(true);
    setNotificationStatus(null);

    try {
      // Store the email in a simple way - you can enhance this later
      const response = await fetch('/api/notify-signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: notificationEmail }),
      });

      if (response.ok) {
        setNotificationStatus(t('Thank you! We will notify you when signups are available.', 'Vielen Dank! Wir benachrichtigen Sie, wenn Registrierungen verfügbar sind.'));
        setNotificationEmail('');
      } else {
        setNotificationStatus(t('Something went wrong. Please try again.', 'Etwas ist schiefgelaufen. Bitte versuchen Sie es erneut.'));
      }
    } catch {
      setNotificationStatus(t('Something went wrong. Please try again.', 'Etwas ist schiefgelaufen. Bitte versuchen Sie es erneut.'));
    } finally {
      setIsSubmittingNotification(false);
    }
  };

  return (
    <>
      <Header />
      <main className="min-h-screen bg-white dark:bg-slate-950 pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto">
          {/* Top Bar with Theme Toggle and Language Switcher */}
          <div className="flex items-center justify-end gap-3 mb-8">
            <Link
              href={`/${lang === 'en' ? 'de' : 'en'}/signup`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
              </svg>
              {lang === 'en' ? 'Deutsch' : 'English'}
            </Link>
          </div>

          {/* Main Signup Card */}
          <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-lg overflow-hidden">
            {/* Header Section */}
            <div className="bg-red-600 px-8 py-6 text-white">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-center">
            {t("Join Infoneva", "Infoneva beitreten")}
          </h1>
          <p className="text-green-100 text-center text-sm mt-2">
            {t("Create your account to get started", "Erstellen Sie Ihr Konto, um loszulegen")}
          </p>
        </div>

        {/* Temporary Launch Banner */}
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-amber-800">
                {t("Signup Temporarily Unavailable", "Registrierung vorübergehend nicht verfügbar")}
              </h3>
              <div className="mt-2 text-sm text-amber-700">
                <p>
                  {t("We are sorry but this functionality is not live right now. It will take about 24 hours until signups and your personal Infoneva account are available. We will gladly send you an email as soon as we are done.", "Es tut uns leid, aber diese Funktionalität ist derzeit nicht verfügbar. Es wird etwa 24 Stunden dauern, bis Registrierungen und Ihr persönliches Infoneva-Konto verfügbar sind. Wir senden Ihnen gerne eine E-Mail, sobald wir fertig sind.")}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Form Section - Disabled with Overlay */}
        <div className="relative">
          {/* Overlay to disable the form */}
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center">
            <div className="text-center p-6">
              <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <p className="text-gray-600 font-medium">
                {t("Signup Form Temporarily Disabled", "Registrierungsformular vorübergehend deaktiviert")}
              </p>
            </div>
          </div>

          <div className="p-8 opacity-50">
            <form onSubmit={handleSignup} className="space-y-6">
              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-2">
                  {t("Email Address", "E-Mail-Adresse")}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                  </div>
            <input
              type="email"
              id="email"
                    className="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-xl leading-5 bg-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                    placeholder={t("Enter your email", "E-Mail eingeben")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
                    disabled
            />
          </div>
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-slate-700 mb-2">
                  {t("Password", "Passwort")}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
            <input
              type="password"
              id="password"
                    className="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-xl leading-5 bg-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                    placeholder={t("Create a strong password", "Starkes Passwort erstellen")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {t("Password must be at least 6 characters long", "Passwort muss mindestens 6 Zeichen lang sein")}
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={true}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                <div className="flex items-center justify-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  {t("Create Account", "Konto erstellen")}
                </div>
              </button>
            </form>
          </div>
        </div>
      </div>

          {/* Email Notification Form */}
          <div className="w-full mt-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4 text-center">
          {t("Get Notified When Signups Are Available", "Benachrichtigung erhalten, wenn Registrierungen verfügbar sind")}
        </h3>
        <form onSubmit={handleNotificationSubmit} className="space-y-4">
          <div>
            <label htmlFor="notification-email" className="block text-sm font-medium text-slate-700 mb-2">
              {t("Email Address", "E-Mail-Adresse")}
            </label>
            <input
              type="email"
              id="notification-email"
              className="block w-full px-3 py-3 border border-slate-300 rounded-xl leading-5 bg-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              placeholder={t("Enter your email to get notified", "E-Mail eingeben für Benachrichtigung")}
              value={notificationEmail}
              onChange={(e) => setNotificationEmail(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            disabled={isSubmittingNotification}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            {isSubmittingNotification ? (
              <div className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {t("Sending...", "Wird gesendet...")}
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                {t("Notify Me", "Benachrichtigen Sie mich")}
            </div>
          )}
          </button>
          {notificationStatus && (
            <div className={`p-3 rounded-lg text-sm ${
              notificationStatus.includes('Thank you') || notificationStatus.includes('Vielen Dank') 
                ? 'bg-green-50 text-green-700 border border-green-200' 
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {notificationStatus}
            </div>
          )}
        </form>
      </div>

          {/* Benefits Section */}
          <div className="w-full mt-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 text-center">
              {t("Why join FAULTBASE?", "Warum FAULTBASE beitreten?")}
            </h3>
            <div className="space-y-3">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-red-600 dark:text-red-400 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  {t("Unlimited AI-powered technical support", "Unbegrenzter KI-gestützter technischer Support")}
                </span>
              </div>
              <div className="flex items-start">
                <svg className="w-5 h-5 text-red-600 dark:text-red-400 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  {t("Access to comprehensive knowledge base", "Zugang zur umfassenden Wissensdatenbank")}
                </span>
              </div>
              <div className="flex items-start">
                <svg className="w-5 h-5 text-red-600 dark:text-red-400 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  {t("Vote and comment on solutions", "Lösungen bewerten und kommentieren")}
                </span>
              </div>
            </div>
          </div>

          {/* Sign In Link */}
          <div className="mt-6 text-center">
            <p className="text-slate-600 dark:text-slate-400 text-sm">
              {t("Already have an account?", "Bereits ein Konto?")}{' '}
              <Link 
                href={`/${lang}/login`} 
                className="font-semibold text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
              >
                {t("Sign in here", "Hier anmelden")}
              </Link>
            </p>
          </div>

          {/* Footer */}
          <footer className="mt-8 text-center">
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              {t("By creating an account, you agree to our", "Durch die Kontoerstellung stimmen Sie unseren")}{' '}
              <Link href={`/${lang}/privacy`} className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300">
                {t("Privacy Policy", "Datenschutzerklärung")}
              </Link>
            </p>
          </footer>
        </div>
      </main>
    </>
  );
} 