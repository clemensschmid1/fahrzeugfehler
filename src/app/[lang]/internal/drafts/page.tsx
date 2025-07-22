'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import InternalAuth from '@/components/InternalAuth';

interface DraftQuestion {
  id: string;
  question: string;
  sector: string;
  slug: string;
  created_at: string;
  status: 'draft' | 'live' | 'bin';
}

export default function DraftsPage() {
  const [drafts, setDrafts] = useState<DraftQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDrafts, setSelectedDrafts] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [actionStatus, setActionStatus] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'draft' | 'live' | 'bin'>('all');
  const [page, setPage] = useState(1);
  const pageSize = 50; // Limit to 50 drafts per page
  const params = useParams();
  const lang = params.lang as string;

  const fetchDrafts = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('questions')
        .select('id, question, sector, slug, created_at, status')
        .eq('language_path', lang);

      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus);
      } else {
        query = query.in('status', ['draft', 'live', 'bin']);
      }

      // Add pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      const { data, error } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;
      if (page === 1) {
        setDrafts(data || []);
      } else {
        setDrafts(prev => [...prev, ...(data || [])]);
      }
      setSelectedDrafts([]);
      setSelectAll(false);
    } catch (error) {
      const err = error as Error;
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [lang, filterStatus, page]);

  useEffect(() => {
    setPage(1); // Reset to first page when filter changes
  }, [filterStatus]);
  
  useEffect(() => {
    fetchDrafts();
  }, [fetchDrafts]);

  const handleCheckboxChange = (id: string) => {
    setSelectedDrafts(prev => 
      prev.includes(id) ? prev.filter(draftId => draftId !== id) : [...prev, id]
    );
  };

  const handleSelectAllChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectAll(e.target.checked);
    if (e.target.checked) {
      setSelectedDrafts(drafts.map(d => d.id));
    } else {
      setSelectedDrafts([]);
    }
  };

  const updateDraftStatus = async (ids: string[], newStatus: 'live' | 'bin') => {
    if (ids.length === 0) return;

    setActionStatus(`Moving ${ids.length} items to ${newStatus}...`);

    try {
      const { error } = await supabase
        .from('questions')
        .update({ status: newStatus })
        .in('id', ids);

      if (error) throw error;
      setActionStatus(`Successfully moved ${ids.length} items to ${newStatus}.`);
      fetchDrafts();
    } catch (error) {
      const err = error as Error;
      setActionStatus(`Error moving items: ${err.message}`);
    }
  };

  const handleMakeLive = () => updateDraftStatus(selectedDrafts, 'live');
  const handleMoveToBin = () => updateDraftStatus(selectedDrafts, 'bin');

  if (loading) {
    return (
      <InternalAuth>
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
      </InternalAuth>
    );
  }

  if (error) {
    return (
      <InternalAuth>
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-600">Error: {error}</div>
      </div>
      </InternalAuth>
    );
  }

  return (
    <InternalAuth>
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold text-gray-900">Drafts</h1>
            <Link 
              href={`/${lang}/internal`}
              className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-600 hover:underline"
            >
              Back to Developer Dashboard
            </Link>
          </div>
          
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <div className="flex items-center space-x-2">
              <span className="text-gray-700">Show:</span>
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-3 py-1 rounded-md text-sm font-medium ${filterStatus === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
              >
                All
              </button>
              <button
                onClick={() => setFilterStatus('draft')}
                className={`px-3 py-1 rounded-md text-sm font-medium ${filterStatus === 'draft' ? 'bg-yellow-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
              >
                Drafts
              </button>
              <button
                onClick={() => setFilterStatus('live')}
                className={`px-3 py-1 rounded-md text-sm font-medium ${filterStatus === 'live' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
              >
                Live
              </button>
              <button
                onClick={() => setFilterStatus('bin')}
                className={`px-3 py-1 rounded-md text-sm font-medium ${filterStatus === 'bin' ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
              >
                Bin
              </button>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={handleMakeLive}
                disabled={selectedDrafts.length === 0}
                className="px-4 py-2 bg-green-600 text-white rounded-md font-semibold hover:bg-green-700 transition disabled:opacity-50"
              >
                Make Live ({selectedDrafts.length})
              </button>
              <button
                onClick={handleMoveToBin}
                disabled={selectedDrafts.length === 0}
                className="px-4 py-2 bg-red-600 text-white rounded-md font-semibold hover:bg-red-700 transition disabled:opacity-50"
              >
                Move to Bin ({selectedDrafts.length})
              </button>
            </div>
            {actionStatus && <span className="text-sm text-gray-600">{actionStatus}</span>}
          </div>

          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={handleSelectAllChange}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Question</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sector</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {drafts.map((draft) => (
                  <tr key={draft.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedDrafts.includes(draft.id)}
                        onChange={() => handleCheckboxChange(draft.id)}
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <Link 
                        href={`/${lang}/knowledge/${draft.slug}`}
                        className="text-sm font-medium text-blue-600 hover:underline"
                      >
                        {draft.question}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{draft.sector}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${draft.status === 'live' ? 'bg-green-100 text-green-800' : draft.status === 'draft' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                        {draft.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(draft.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {draft.status !== 'live' && (
                        <button
                          onClick={() => updateDraftStatus([draft.id], 'live')}
                          className="text-green-600 hover:text-green-900 mr-4"
                        >
                          Make Live
                        </button>
                      )}
                      {draft.status !== 'bin' && (
                        <button
                          onClick={() => updateDraftStatus([draft.id], 'bin')}
                          className="text-red-600 hover:text-red-900"
                        >
                          Move to Bin
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {drafts.length === 0 && (
              <div className="text-center py-4 text-gray-500">No drafts or bin items found.</div>
            )}
          </div>
        </div>
      </div>
    </div>
    </InternalAuth>
  );
} 