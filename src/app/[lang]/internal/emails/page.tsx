'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import InternalAuth from '@/components/InternalAuth';

interface EmailRecord {
  id: string;
  email: string;
  type: string;
  status: string;
  metadata: any;
  created_at: string;
  updated_at: string;
}

export default function EmailsPage() {
  const [emails, setEmails] = useState<EmailRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'signup_notification' | 'pending' | 'sent'>('all');
  const params = useParams();
  const lang = params.lang as string;

  useEffect(() => {
    fetchEmails();
  }, [filter]);

  const fetchEmails = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('emails')
        .select('*')
        .order('created_at', { ascending: false });

      if (filter === 'signup_notification') {
        query = query.eq('type', 'signup_notification');
      } else if (filter === 'pending') {
        query = query.eq('status', 'pending');
      } else if (filter === 'sent') {
        query = query.eq('status', 'sent');
      }

      const { data, error } = await query;

      if (error) throw error;
      setEmails(data || []);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const updateEmailStatus = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('emails')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;
      fetchEmails(); // Refresh the list
    } catch (error: any) {
      setError(`Error updating email status: ${error.message}`);
    }
  };

  const exportEmails = () => {
    const csvContent = [
      ['Email', 'Type', 'Status', 'Created At', 'Source'],
      ...emails.map(email => [
        email.email,
        email.type,
        email.status,
        new Date(email.created_at).toLocaleString(),
        email.metadata?.source || 'unknown'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `emails_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const filteredEmails = emails;

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
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-3xl font-bold text-gray-900">Email Management</h1>
              <Link 
                href={`/${lang}/internal`}
                className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-600 hover:underline"
              >
                Back to Developer Dashboard
              </Link>
            </div>
            
            <div className="flex flex-wrap items-center gap-4 mb-6">
              <div className="flex items-center space-x-2">
                <span className="text-gray-700">Filter:</span>
                <button
                  onClick={() => setFilter('all')}
                  className={`px-3 py-1 rounded-md text-sm font-medium ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilter('signup_notification')}
                  className={`px-3 py-1 rounded-md text-sm font-medium ${filter === 'signup_notification' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                >
                  Signup Notifications
                </button>
                <button
                  onClick={() => setFilter('pending')}
                  className={`px-3 py-1 rounded-md text-sm font-medium ${filter === 'pending' ? 'bg-yellow-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                >
                  Pending
                </button>
                <button
                  onClick={() => setFilter('sent')}
                  className={`px-3 py-1 rounded-md text-sm font-medium ${filter === 'sent' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                >
                  Sent
                </button>
              </div>

              <button
                onClick={exportEmails}
                className="px-4 py-2 bg-green-600 text-white rounded-md font-semibold hover:bg-green-700 transition"
              >
                Export CSV
              </button>
            </div>

            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-600 rounded">
                {error}
              </div>
            )}

            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Collected Emails ({filteredEmails.length})
                </h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                  Email addresses collected from various forms and notifications
                </p>
              </div>

              <div className="border-t border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredEmails.map((email) => (
                      <tr key={email.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {email.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            email.type === 'signup_notification' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {email.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            email.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                            email.status === 'sent' ? 'bg-green-100 text-green-800' : 
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {email.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {email.metadata?.source || 'unknown'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(email.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {email.status === 'pending' && (
                            <button
                              onClick={() => updateEmailStatus(email.id, 'sent')}
                              className="text-green-600 hover:text-green-900 mr-4"
                            >
                              Mark Sent
                            </button>
                          )}
                          {email.status === 'sent' && (
                            <button
                              onClick={() => updateEmailStatus(email.id, 'pending')}
                              className="text-yellow-600 hover:text-yellow-900"
                            >
                              Mark Pending
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredEmails.length === 0 && (
                  <div className="text-center py-4 text-gray-500">No emails found.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </InternalAuth>
  );
} 