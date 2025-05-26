"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

interface Comment {
  id: string;
  content: string;
  created_at: string;
  question_id: string;
  user_id: string;
  status: 'live' | 'binned';
}

export default function CommentsPage() {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [usernamesMap, setUsernamesMap] = useState<{[key: string]: string}>({});
  const [selectedComments, setSelectedComments] = useState<string[]>([]);
  const [slugsMap, setSlugsMap] = useState<{[key: string]: string}>({});
  const [filter, setFilter] = useState<'all' | 'live' | 'binned'>('all');

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password === '12345678') {
      setIsAuthenticated(true);
      setError(null);
    } else {
      setError('Invalid password');
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchComments();
    }
  }, [isAuthenticated]);

  const fetchComments = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching comments:', error);
      setError('Failed to load comments: ' + error.message);
      setLoading(false);
      return;
    }

    setComments(data || []);
    setLoading(false);

    // Fetch usernames for unique user_ids
    const uniqueUserIds = Array.from(new Set((data || []).map(comment => comment.user_id).filter(Boolean)));
    if (uniqueUserIds.length > 0) {
      try {
        const usernamesResponse = await fetch('/api/users/usernames', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userIds: uniqueUserIds }),
        });

        if (!usernamesResponse.ok) {
          console.error('Failed to fetch usernames');
        } else {
          const fetchedUsernamesMap = await usernamesResponse.json();
          setUsernamesMap(fetchedUsernamesMap);
        }
      } catch (usernameFetchError) {
        console.error('Error fetching usernames:', usernameFetchError);
      }
    }

    // Fetch slugs for unique question_ids
    const uniqueQuestionIds = Array.from(new Set((data || []).map(comment => comment.question_id).filter(Boolean)));
    if (uniqueQuestionIds.length > 0) {
      try {
        const slugsResponse = await fetch('/api/questions/slugs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ questionIds: uniqueQuestionIds }),
        });

        if (!slugsResponse.ok) {
          console.error('Failed to fetch slugs');
        } else {
          const fetchedSlugsMap = await slugsResponse.json();
          setSlugsMap(fetchedSlugsMap);
        }
      } catch (slugFetchError) {
        console.error('Error fetching slugs:', slugFetchError);
      }
    }
  };

  const handleToggleSelect = (commentId: string) => {
    setSelectedComments(prevSelected =>
      prevSelected.includes(commentId)
        ? prevSelected.filter(id => id !== commentId)
        : [...prevSelected, commentId]
    );
  };

  const handleSelectAll = () => {
    if (selectedComments.length === comments.length) {
      setSelectedComments([]);
    } else {
      setSelectedComments(comments.map(comment => comment.id));
    }
  };

  const updateCommentStatus = async (commentIds: string[], newStatus: 'live' | 'binned') => {
    if (commentIds.length === 0) return;

    const { error } = await supabase
      .from('comments')
      .update({ status: newStatus })
      .in('id', commentIds);

    if (error) {
      console.error(`Error updating comments status to ${newStatus}:`, error);
      setError(`Failed to update comment status: ${error.message}`);
    } else {
      fetchComments();
      setSelectedComments([]);
    }
  };

  const handleMoveToBin = (commentId: string) => updateCommentStatus([commentId], 'binned');
  const handleMakeLive = (commentId: string) => updateCommentStatus([commentId], 'live');

  const handleMassMoveToBin = () => updateCommentStatus(selectedComments, 'binned');
  const handleMassMakeLive = () => updateCommentStatus(selectedComments, 'live');

  const filteredComments = filter === 'all' ? comments : comments.filter(c => c.status === filter);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-lg">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Developer Access
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Please enter the password to access developer tools
            </p>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleSignIn}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
                {error}
              </div>
            )}
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div>
              <button
                type="submit"
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Access Developer Tools
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Manage Comments</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-md font-semibold border ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-white text-blue-600 border-blue-600'} transition`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('live')}
              className={`px-4 py-2 rounded-md font-semibold border ${filter === 'live' ? 'bg-green-600 text-white' : 'bg-white text-green-600 border-green-600'} transition`}
            >
              Live
            </button>
            <button
              onClick={() => setFilter('binned')}
              className={`px-4 py-2 rounded-md font-semibold border ${filter === 'binned' ? 'bg-yellow-500 text-white' : 'bg-white text-yellow-600 border-yellow-500'} transition`}
            >
              Bin
            </button>
          </div>
          <Link
            href="/internal"
            className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Back to Dashboard
          </Link>
          <button
            onClick={() => setIsAuthenticated(false)}
            className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
          >
            Sign Out
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-800 border border-red-200 rounded-lg">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center text-gray-600">Loading comments...</div>
        ) : (
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="p-6">
              {/* Mass action buttons */}
              <div className="mb-4 space-x-4">
                <button
                  onClick={handleMassMoveToBin}
                  disabled={selectedComments.length === 0}
                  className="px-4 py-2 bg-yellow-500 text-white rounded-md font-semibold hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Move Selected to Bin
                </button>
                <button
                  onClick={handleMassMakeLive}
                  disabled={selectedComments.length === 0}
                  className="px-4 py-2 bg-green-600 text-white rounded-md font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Make Selected Live
                </button>
              </div>

              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="w-10 px-4 py-3">
                      <input
                        type="checkbox"
                        onChange={handleSelectAll}
                        checked={selectedComments.length === filteredComments.length && filteredComments.length > 0}
                        className="rounded text-blue-600"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Comment</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Author</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Page</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredComments.map((comment) => (
                    <tr key={comment.id} className={selectedComments.includes(comment.id) ? 'bg-blue-50' : ''}>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedComments.includes(comment.id)}
                          onChange={() => handleToggleSelect(comment.id)}
                          className="rounded text-blue-600"
                        />
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{comment.content}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{usernamesMap[comment.user_id] || 'Anonymous'}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{new Date(comment.created_at).toLocaleString()}</td>
                      <td className="px-6 py-4 text-sm text-blue-700">
                        {slugsMap[comment.question_id] ? (
                          <Link
                            href={`/knowledge/${slugsMap[comment.question_id]}`}
                            className="hover:underline"
                            target="_blank"
                          >
                            View Page
                          </Link>
                        ) : (
                          comment.question_id
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${comment.status === 'live' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{comment.status}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {comment.status === 'live' ? (
                          <button onClick={() => handleMoveToBin(comment.id)} className="text-yellow-600 hover:text-yellow-900 mr-4">Bin</button>
                        ) : (
                          <button onClick={() => handleMakeLive(comment.id)} className="text-green-600 hover:text-green-900 mr-4">Make Live</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredComments.length === 0 && !loading && (
                <div className="text-center text-gray-600 py-8">No comments found for this filter.</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 