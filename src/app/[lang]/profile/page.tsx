'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [userComments, setUserComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [usernameError, setUsernameError] = useState<string | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const router = useRouter();
  const params = useParams();
  const lang = params.lang as string;

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
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

        if (profileError) {
          console.error('Error fetching user profile:', profileError);
        } else if (profileData) {
          setUser({ ...user, ...profileData });
          setNewUsername(profileData.username);
        }

        // Fetch user comments
        const { data: commentsData, error: commentsError } = await supabase
          .from('comments')
          .select('*, question:question_id(slug, question)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (commentsError) {
          console.error('Error fetching user comments:', commentsError);
        } else {
          setUserComments(commentsData || []);
        }
      } catch (err) {
        console.error('Error in fetchUserData:', err);
        setError('Failed to load user data');
      }

      setLoading(false);
    };

    fetchUserData();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser(session.user);
        // Refetch profile and comments if user logs in while on the page
        const fetchProfileAndCommentsOnAuthChange = async () => {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', session.user.id)
            .single();

          if (profileError) {
            console.error('Error refetching user profile on auth change:', profileError);
          } else if (profileData) {
            setUser({ ...session.user, ...profileData });
            setNewUsername(profileData.username);
          }

          const { data: commentsData, error: commentsError } = await supabase
            .from('comments')
            .select('*, question:question_id(slug, question)')
            .eq('user_id', session.user.id)
            .order('created_at', { ascending: false });

          if (commentsError) {
            console.error('Error refetching user comments on auth change:', commentsError);
          } else {
            setUserComments(commentsData || []);
          }
        };
        fetchProfileAndCommentsOnAuthChange();
      } else {
        setUser(null);
        setUserComments([]);
        router.push(`/${lang}/login`);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, router, lang]);

  const handleLogout = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signOut();

    if (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  const handleUsernameChange = async () => {
    if (!newUsername.trim()) {
      setUsernameError('Username cannot be empty.');
      return;
    }
    if (newUsername === user?.username) {
      setIsEditingUsername(false);
      setUsernameError(null);
      return;
    }

    setLoading(true);
    setUsernameError(null);

    const { error } = await supabase
      .from('profiles')
      .update({ username: newUsername.trim() })
      .eq('id', user.id);

    if (error) {
      console.error('Error updating username:', error);
      setUsernameError(error.message);
    } else {
      setUser({ ...user, username: newUsername.trim() });
      setIsEditingUsername(false);
    }
    setLoading(false);
  };

  const signupDate = user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 py-12">
      <div className="max-w-2xl w-full bg-white p-8 rounded-lg shadow-md text-gray-800 space-y-8">
        {/* Profile Info and Navigation Section */}
        <div>
          <h2 className="text-2xl font-bold text-center mb-6">Profile Dashboard</h2>
          
          <div className="mb-4">
            <p className="text-sm font-semibold text-gray-600">Email:</p>
            <p className="text-lg font-medium">{user?.email || 'N/A'}</p>
          </div>
          
          <div className="mb-4">
            <p className="text-sm font-semibold text-gray-600">Username:</p>
            {isEditingUsername ? (
              <div className="flex items-center mt-1">
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mr-2"
                  disabled={loading}
                />
                <button
                  onClick={handleUsernameChange}
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
                  disabled={loading || !newUsername.trim()}
                >
                  Save
                </button>
              </div>
            ) : (
              <div className="flex items-center mt-1">
                <p className="text-lg font-medium">{user?.username || 'Not set'}</p>
                <button
                  onClick={() => setIsEditingUsername(true)}
                  className="ml-2 text-blue-500 hover:text-blue-700"
                >
                  Edit
                </button>
              </div>
            )}
            {usernameError && (
              <p className="text-red-500 text-sm mt-1">{usernameError}</p>
            )}
          </div>

          <div className="mb-4">
            <p className="text-sm font-semibold text-gray-600">Member since:</p>
            <p className="text-lg font-medium">{signupDate}</p>
          </div>

          <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4">
            {/* Navigation Buttons */}
            <Link href={`/${lang}/knowledge`} 
              className="w-full sm:w-auto bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition-colors duration-200 text-center"
            >
              Knowledge Base
            </Link>
            <Link href={`/${lang}/chat`}
              className="w-full sm:w-auto bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition-colors duration-200 text-center"
            >
              Chat
            </Link>
            {/* Logout button */}
            <button
              onClick={handleLogout}
              className="w-full sm:w-auto bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition-colors duration-200"
              disabled={loading}
            >
              Logout
            </button>
          </div>
        </div>

        {/* My Comments Section */}
        <div className="mt-8">
          <h3 className="text-xl font-bold mb-4">My Comments</h3>
          {userComments.length > 0 ? (
            <div className="space-y-4">
              {userComments.map((comment) => (
                <div key={comment.id} className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <Link
                      href={`/${lang}/knowledge/${comment.question.slug}`}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      {comment.question.question}
                    </Link>
                    <span className="text-sm text-gray-500">
                      {new Date(comment.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-gray-700">{comment.content}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600">No comments yet.</p>
          )}
        </div>
      </div>
    </div>
  );
} 