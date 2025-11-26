'use client';

import { useState, useEffect, useMemo } from 'react';
import { getSupabaseClient } from '@/lib/supabase';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { User } from '@supabase/supabase-js';
import Header from '@/components/Header';

interface UserProfile extends User {
  username?: string;
}

interface UserComment {
  id: string;
  created_at: string;
  content: string;
  question: {
    slug: string;
    question: string;
  };
}

interface UserStats {
  commentsCount: number;
  votesGiven: number;
  upvotesGiven: number;
  downvotesGiven: number;
}

export default function ProfilePage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [userComments, setUserComments] = useState<UserComment[]>([]);
  const [userStats, setUserStats] = useState<UserStats>({
    commentsCount: 0,
    votesGiven: 0,
    upvotesGiven: 0,
    downvotesGiven: 0,
  });
  const [loading, setLoading] = useState(true);
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [usernameError, setUsernameError] = useState<string | null>(null);

  const supabase = useMemo(() => getSupabaseClient(), []);
  const router = useRouter();
  const params = useParams();
  const lang = params.lang as string;

  const t = (en: string, de: string) => lang === 'de' ? de : en;

  useEffect(() => {
    let mounted = true;

    const fetchUserData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!mounted) return;
        
        if (!user) {
          router.push(`/${lang}/login`);
          return;
        }

        // Fetch user profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', user.id)
          .single();

        if (!mounted) return;

        if (profileError) {
          console.error('Error fetching user profile:', profileError);
        } else if (profileData) {
          setUser({ ...user, ...profileData });
          setNewUsername(profileData.username || '');
        } else {
          setUser(user);
        }

        // Fetch user comments
        const { data: commentsData, error: commentsError } = await supabase
          .from('comments')
          .select('*, question:question_id(slug, question)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50);

        if (!mounted) return;

        if (commentsError) {
          console.error('Error fetching user comments:', commentsError);
        } else {
          setUserComments(commentsData || []);
        }

        // Fetch user stats - votes
        const { data: votesData, error: votesError } = await supabase
          .from('votes')
          .select('vote_type')
          .eq('user_id', user.id);

        if (!mounted) return;

        if (votesError) {
          console.error('Error fetching user votes:', votesError);
        } else {
          const votes = votesData || [];
          const upvotes = votes.filter(v => v.vote_type === true).length;
          const downvotes = votes.filter(v => v.vote_type === false).length;
          setUserStats({
            commentsCount: commentsData?.length || 0,
            votesGiven: votes.length,
            upvotesGiven: upvotes,
            downvotesGiven: downvotes,
          });
        }
      } catch (err) {
        console.error('Error in fetchUserData:', err);
      }

      if (mounted) {
      setLoading(false);
      }
    };

    fetchUserData();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      
      if (session?.user) {
        setUser(session.user);
        // Refetch data
        fetchUserData();
      } else {
        setUser(null);
        setUserComments([]);
        router.push(`/${lang}/login`);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = async () => {
    setLoading(true);
    const { error: signOutError } = await supabase.auth.signOut();

    if (signOutError) {
      console.error('Error signing out:', signOutError);
      setLoading(false);
    }
  };

  const handleUsernameChange = async () => {
    if (!newUsername.trim()) {
      setUsernameError(t('Username cannot be empty.', 'Benutzername darf nicht leer sein.'));
      return;
    }
    if (newUsername === user?.username) {
      setIsEditingUsername(false);
      setUsernameError(null);
      return;
    }

    setLoading(true);
    setUsernameError(null);

    if (user) {
      // First, check if username already exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', newUsername.trim())
        .neq('id', user.id)
        .single();

      if (existingProfile) {
        setUsernameError(t('Username already taken.', 'Benutzername bereits vergeben.'));
        setLoading(false);
        return;
      }

      // Update or insert profile
      const { error } = await supabase
        .from('profiles')
        .upsert({ 
          id: user.id, 
          username: newUsername.trim(),
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error updating username:', error);
        setUsernameError(error.message);
      } else {
        setUser({ ...user, username: newUsername.trim() });
        setIsEditingUsername(false);
      }
    }
    setLoading(false);
  };

  if (loading && !user) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-white dark:bg-slate-950 pt-24 pb-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-1/3"></div>
              <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded"></div>
            </div>
          </div>
        </main>
      </>
    );
  }

  const signupDate = user?.created_at ? new Date(user.created_at).toLocaleDateString(lang === 'de' ? 'de-DE' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }) : 'N/A';

  const lastLogin = user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString(lang === 'de' ? 'de-DE' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }) : 'N/A';

  return (
    <>
      <Header />
      <main className="min-h-screen bg-white dark:bg-slate-950 pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Top Bar with Theme Toggle and Language Switcher */}
          <div className="flex items-center justify-end gap-3 mb-8">
            <Link
              href={`/${lang === 'en' ? 'de' : 'en'}/profile`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
              </svg>
              {lang === 'en' ? 'Deutsch' : 'English'}
            </Link>
          </div>

          {/* Profile Header Card */}
          <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border border-red-200 dark:border-red-900/30 rounded-2xl shadow-lg p-8 mb-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              {/* Avatar */}
              <div className="w-24 h-24 rounded-full bg-red-600 dark:bg-red-500 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                {user?.username?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
              </div>
              
              {/* User Info */}
              <div className="flex-1">
                <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2">
                  {user?.username || t('User', 'Benutzer')}
                </h1>
                <p className="text-slate-600 dark:text-slate-400 mb-4">{user?.email}</p>
                
                {/* Stats Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-white/60 dark:bg-slate-800/60 rounded-xl p-4 border border-red-200 dark:border-red-900/30">
                    <div className="text-2xl font-black text-red-600 dark:text-red-400 mb-1">
                      {userStats.commentsCount}
                    </div>
                    <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      {t('Comments', 'Kommentare')}
                    </div>
                  </div>
                  <div className="bg-white/60 dark:bg-slate-800/60 rounded-xl p-4 border border-red-200 dark:border-red-900/30">
                    <div className="text-2xl font-black text-green-600 dark:text-green-400 mb-1">
                      {userStats.upvotesGiven}
                    </div>
                    <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      {t('Upvotes', 'Positive Bewertungen')}
                    </div>
                  </div>
                  <div className="bg-white/60 dark:bg-slate-800/60 rounded-xl p-4 border border-red-200 dark:border-red-900/30">
                    <div className="text-2xl font-black text-orange-600 dark:text-orange-400 mb-1">
                      {userStats.downvotesGiven}
                    </div>
                    <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      {t('Downvotes', 'Negative Bewertungen')}
                    </div>
                  </div>
                  <div className="bg-white/60 dark:bg-slate-800/60 rounded-xl p-4 border border-red-200 dark:border-red-900/30">
                    <div className="text-2xl font-black text-blue-600 dark:text-blue-400 mb-1">
                      {userStats.votesGiven}
                    </div>
                    <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      {t('Total Votes', 'Bewertungen gesamt')}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Profile Settings Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
              {t('Profile Settings', 'Profileinstellungen')}
            </h2>

            <div className="space-y-6">
              {/* Username Section */}
              <div>
                <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
                  {t('Username', 'Benutzername')}
                </label>
            {isEditingUsername ? (
                  <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                      className="flex-1 px-4 py-3 border border-slate-300 dark:border-white/20 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
                  disabled={loading}
                      placeholder={t('Enter username', 'Benutzername eingeben')}
                />
                <button
                  onClick={handleUsernameChange}
                      className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 transition-colors"
                  disabled={loading || !newUsername.trim()}
                >
                      {t('Save', 'Speichern')}
                    </button>
                    <button
                      onClick={() => {
                        setIsEditingUsername(false);
                        setNewUsername(user?.username || '');
                        setUsernameError(null);
                      }}
                      className="px-6 py-3 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-semibold rounded-xl transition-colors"
                    >
                      {t('Cancel', 'Abbrechen')}
                </button>
              </div>
            ) : (
                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-white/10">
                    <span className="text-lg font-medium text-slate-900 dark:text-white">
                      {user?.username || t('Not set', 'Nicht gesetzt')}
                    </span>
                <button
                  onClick={() => setIsEditingUsername(true)}
                      className="px-4 py-2 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-semibold transition-colors"
                >
                      {t('Edit', 'Bearbeiten')}
                </button>
              </div>
            )}
            {usernameError && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400">{usernameError}</p>
            )}
          </div>

              {/* Account Information */}
              <div className="pt-6 border-t border-slate-200 dark:border-white/10">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                  {t('Account Information', 'Kontoinformationen')}
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                      {t('Email', 'E-Mail')}
                    </span>
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">
                      {user?.email}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                      {t('Member since', 'Mitglied seit')}
                    </span>
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">
                      {signupDate}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                      {t('Last login', 'Letzter Login')}
                    </span>
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">
                      {lastLogin}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                      {t('User ID', 'Benutzer-ID')}
                    </span>
                    <span className="text-xs font-mono text-slate-500 dark:text-slate-400 break-all">
                      {user?.id.substring(0, 8)}...
                    </span>
                  </div>
                </div>
          </div>

              {/* Logout Button */}
              <div className="pt-6 border-t border-slate-200 dark:border-white/10">
            <button
              onClick={handleLogout}
                  className="w-full px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors disabled:opacity-50"
              disabled={loading}
            >
                  {t('Logout', 'Abmelden')}
            </button>
              </div>
          </div>
        </div>

        {/* My Comments Section */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-lg p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                {t('My Comments', 'Meine Kommentare')}
              </h2>
              {userComments.length > 0 && (
                <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                  {userComments.length} {t('total', 'gesamt')}
                </span>
              )}
            </div>
            
          {userComments.length > 0 ? (
            <div className="space-y-4">
              {userComments.map((comment) => (
                  <div key={comment.id} className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-xl border border-slate-200 dark:border-white/10 hover:border-red-300 dark:hover:border-red-900/50 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                    <Link
                      href={`/${lang}/knowledge/${comment.question.slug}`}
                        className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-semibold text-lg line-clamp-2"
                    >
                      {comment.question.question}
                    </Link>
                      <span className="text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {new Date(comment.created_at).toLocaleDateString(lang === 'de' ? 'de-DE' : 'en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                    </span>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                      {comment.content}
                    </p>
                </div>
              ))}
            </div>
          ) : (
              <div className="text-center py-12">
                <svg className="w-16 h-16 mx-auto text-slate-400 dark:text-slate-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p className="text-slate-600 dark:text-slate-400 text-lg">
                  {t('No comments yet. Start engaging with the community!', 'Noch keine Kommentare. Beginnen Sie, sich mit der Community zu engagieren!')}
                </p>
                <Link
                  href={`/${lang}/knowledge`}
                  className="inline-block mt-4 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-colors"
                >
                  {t('Browse Knowledge Base', 'Wissensdatenbank durchsuchen')}
                </Link>
              </div>
          )}
        </div>
      </div>
      </main>
    </>
  );
} 
