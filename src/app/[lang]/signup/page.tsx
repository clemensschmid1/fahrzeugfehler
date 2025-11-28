'use client';

import { useState, useMemo } from 'react';
import { getSupabaseClient } from '@/lib/supabase';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const params = useParams();
  const lang = params.lang as string;
  const supabase = useMemo(() => getSupabaseClient(), []);

  // Translation helper function
  const t = (en: string, de: string) => lang === 'de' ? de : en;

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    // Validation
    if (password.length < 6) {
      setError(t('Password must be at least 6 characters long', 'Passwort muss mindestens 6 Zeichen lang sein'));
      setLoading(false);
      return;
    }

    if (username.length < 3) {
      setError(t('Username must be at least 3 characters long', 'Benutzername muss mindestens 3 Zeichen lang sein'));
      setLoading(false);
      return;
    }

    try {
      // Check if username is already taken
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username.trim())
        .maybeSingle();

      if (existingProfile) {
        setError(t('Username already taken. Please choose another.', 'Benutzername bereits vergeben. Bitte wählen Sie einen anderen.'));
        setLoading(false);
        return;
      }

      // Sign up user
      const { data: authData, error: signupError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/${lang}/profile`,
          data: {
            username: username.trim(),
          },
        },
      });

      if (signupError) {
        setError(signupError.message);
        setLoading(false);
        return;
      }

      if (authData.user) {
        // Create profile with username
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: authData.user.id,
            username: username.trim(),
            updated_at: new Date().toISOString(),
          });

        if (profileError) {
          console.error('Profile creation error:', profileError);
          // Don't fail signup if profile creation fails - it might be created by trigger
        }

        // Check if email confirmation is required
        if (authData.session) {
          // User is immediately signed in (email confirmation disabled)
          setSuccess(true);
          setTimeout(() => {
            router.push(`/${lang}/profile`);
          }, 1500);
        } else {
          // Email confirmation required
          setSuccess(true);
          setError(t('Please check your email to confirm your account.', 'Bitte überprüfen Sie Ihre E-Mail, um Ihr Konto zu bestätigen.'));
        }
      }
    } catch (err) {
      const error = err as Error;
      setError(error.message || t('An error occurred during signup', 'Bei der Registrierung ist ein Fehler aufgetreten'));
    } finally {
      setLoading(false);
    }
  };


  return (
    <>
      <Header />
      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-black dark:to-slate-950 pt-20 sm:pt-24 pb-8 sm:pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto">
          {/* Main Signup Card */}
          <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden">
            {/* Header Section */}
            <div className="bg-gradient-to-br from-red-600 to-orange-600 px-8 py-8 text-white">
              <div className="flex items-center justify-center mb-4">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                </div>
              </div>
              <h1 className="text-3xl font-bold text-center mb-2">
                {t("Create Your Account", "Konto erstellen")}
              </h1>
              <p className="text-red-100 text-center text-sm">
                {t("Join FAULTBASE and get started", "Treten Sie FAULTBASE bei und legen Sie los")}
              </p>
            </div>

            {/* Form Section */}
            <div className="p-4 sm:p-6 lg:p-8">
              <form onSubmit={handleSignup} className="space-y-4 sm:space-y-5">
                {/* Username Field */}
                <div>
                  <label htmlFor="username" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    {t("Username", "Benutzername")}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      id="username"
                      className="block w-full pl-10 pr-3 py-3 border border-slate-300 dark:border-slate-700 rounded-xl leading-5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200"
                      placeholder={t("Choose a username", "Wählen Sie einen Benutzernamen")}
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                      minLength={3}
                      disabled={loading}
                    />
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {t("3-20 characters, letters and numbers only", "3-20 Zeichen, nur Buchstaben und Zahlen")}
                  </p>
                </div>

                {/* Email Field */}
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
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
                      className="block w-full pl-10 pr-3 py-3 border border-slate-300 dark:border-slate-700 rounded-xl leading-5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200"
                      placeholder={t("Enter your email", "E-Mail eingeben")}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <label htmlFor="password" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
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
                      className="block w-full pl-10 pr-3 py-3 border border-slate-300 dark:border-slate-700 rounded-xl leading-5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200"
                      placeholder={t("Create a strong password", "Starkes Passwort erstellen")}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      disabled={loading}
                    />
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {t("At least 6 characters", "Mindestens 6 Zeichen")}
                  </p>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                    <div className="flex items-start">
                      <svg className="w-5 h-5 text-red-600 dark:text-red-400 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-red-700 dark:text-red-400 text-sm font-medium">{error}</span>
                    </div>
                  </div>
                )}

                {/* Success Message */}
                {success && !error && (
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
                    <div className="flex items-start">
                      <svg className="w-5 h-5 text-green-600 dark:text-green-400 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-green-700 dark:text-green-400 text-sm font-medium">
                        {t("Account created successfully! Redirecting...", "Konto erfolgreich erstellt! Weiterleitung...")}
                      </span>
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-semibold py-3 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {t("Creating Account...", "Konto wird erstellt...")}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                      </svg>
                      {t("Create Account", "Konto erstellen")}
                    </div>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Benefits Section */}
          <div className="w-full mt-4 sm:mt-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-lg p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white mb-3 sm:mb-4 text-center">
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
          <div className="mt-4 sm:mt-6 text-center">
            <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm">
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
          <footer className="mt-6 sm:mt-8 text-center px-2">
            <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm">
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
