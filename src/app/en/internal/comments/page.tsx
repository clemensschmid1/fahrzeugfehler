"use client";

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import InternalAuth from '@/components/InternalAuth';

interface Comment {
  id: string;
  content: string;
  created_at: string;
  question_id: string;
  user_id: string;
  status: 'live' | 'binned';
}

export default function CommentsPage() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [usernamesMap, setUsernamesMap] = useState<{[key: string]: string}>({});
  const [selectedComments, setSelectedComments] = useState<string[]>([]);
  const [slugsMap, setSlugsMap] = useState<{[key: string]: string}>({});
  const [filter, setFilter] = useState<'all' | 'live' | 'binned'>('all');
  const [error, setError] = useState<string | null>(null);
  const pageSize = 50; // Limit to 50 comments per page

  const fetchComments = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('comments')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (filter !== 'all') {
      query = query.eq('status', filter);
    }
    
    // Add pagination
    const { data, error } = await query.limit(pageSize);

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
          setUsernamesMap(prev => ({ ...prev, ...fetchedUsernamesMap }));
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
          setSlugsMap(prev => ({ ...prev, ...fetchedSlugsMap }));
        }
      } catch (slugsFetchError) {
        console.error('Error fetching slugs:', slugsFetchError);
      }
    }
  }, [filter]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

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

  if (loading) {
    return (
      <InternalAuth>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </InternalAuth>
    );
  }

  return (
    <InternalAuth>
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
                className={`px-4 py-2 rounded-md font-semibold border ${filter === 'binned' ? 'bg-red-600 text-white' : 'bg-white text-red-600 border-red-600'} transition`}
              >
                Binned
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-600 rounded">
              {error}
            </div>
          )}

          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Comments ({filteredComments.length})
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={handleSelectAll}
                    className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                  >
                    {selectedComments.length === comments.length ? 'Deselect All' : 'Select All'}
                  </button>
                  {selectedComments.length > 0 && (
                    <>
                      <button
                        onClick={handleMassMakeLive}
                        className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        Make Live ({selectedComments.length})
                      </button>
                      <button
                        onClick={handleMassMoveToBin}
                        className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                      >
                        Move to Bin ({selectedComments.length})
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <input
                        type="checkbox"
                        checked={selectedComments.length === comments.length && comments.length > 0}
                        onChange={handleSelectAll}
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Content</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Question</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredComments.map((comment) => (
                    <tr key={comment.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedComments.includes(comment.id)}
                          onChange={() => handleToggleSelect(comment.id)}
                          className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">
                          {comment.content}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {usernamesMap[comment.user_id] || 'Unknown User'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <Link
                          href={`/en/knowledge/${slugsMap[comment.question_id] || '#'}`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          {slugsMap[comment.question_id] || 'Unknown Question'}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${comment.status === 'live' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {comment.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(comment.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {comment.status === 'live' ? (
                          <button
                            onClick={() => handleMoveToBin(comment.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Move to Bin
                          </button>
                        ) : (
                          <button
                            onClick={() => handleMakeLive(comment.id)}
                            className="text-green-600 hover:text-green-900"
                          >
                            Make Live
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredComments.length === 0 && (
                <div className="text-center py-4 text-gray-500">No comments found.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </InternalAuth>
  );
} 