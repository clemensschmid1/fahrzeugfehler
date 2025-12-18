'use client';

import { useState, useEffect } from 'react';
import InternalAuth from '@/components/InternalAuth';
import { supabase } from '@/lib/supabase';
import { useParams } from 'next/navigation';
import Link from 'next/link';

// Client Components are automatically dynamic, no need to export these

type CarFault = {
  id: string;
  title: string;
  slug: string;
  model_generation_id: string;
};

type CarManual = {
  id: string;
  title: string;
  slug: string;
  model_generation_id: string;
};

type GeneratedProfile = {
  id: string;
  username: string;
  email: string;
  user_id: string;
  comments_count?: number;
  last_used_at?: string;
};

type CommentGenerationTask = {
  id: string;
  targetId: string;
  targetType: 'fault' | 'manual';
  targetTitle: string;
  status: 'pending' | 'generating' | 'done' | 'error';
  comment?: string;
  profileId?: string;
  error?: string;
};

export default function CarCommentsPage() {
  const params = useParams();
  const lang = params.lang as string;
  const t = (en: string, de: string) => lang === 'de' ? de : en;

  // State
  const [profiles, setProfiles] = useState<GeneratedProfile[]>([]);
  const [isGeneratingProfiles, setIsGeneratingProfiles] = useState(false);
  const [profileCount, setProfileCount] = useState(10);
  const [faults, setFaults] = useState<CarFault[]>([]);
  const [manuals, setManuals] = useState<CarManual[]>([]);
  const [selectedTargets, setSelectedTargets] = useState<Array<{ id: string; type: 'fault' | 'manual'; title: string }>>([]);
  const [commentsPerPage, setCommentsPerPage] = useState(3);
  const [isGeneratingComments, setIsGeneratingComments] = useState(false);
  const [generationTasks, setGenerationTasks] = useState<CommentGenerationTask[]>([]);
  const [status, setStatus] = useState<string>('');

  // Load existing profiles
  useEffect(() => {
    loadProfiles();
    loadFaultsAndManuals();
  }, []);

  async function loadProfiles() {
    try {
      // Fetch from generated_profiles table (tracks auto-generated profiles)
      const { data, error } = await supabase
        .from('generated_profiles')
        .select('id, username, email, comments_count, last_used_at, is_active')
        .eq('is_active', true)
        .order('generated_at', { ascending: false })
        .limit(200);

      if (error) {
        // Fallback to old method if table doesn't exist yet
        const { data: fallbackData } = await supabase
          .from('profiles')
          .select('id, username')
          .like('username', 'user_%')
          .order('created_at', { ascending: false })
          .limit(100);

        const profileData: GeneratedProfile[] = (fallbackData || []).map((profile: { id: string; username?: string | null }) => ({
          id: profile.id,
          username: profile.username || 'Unknown',
          email: `${profile.username || 'user'}@generated.local`,
          user_id: profile.id,
        }));

        setProfiles(profileData);
        return;
      }

      // profiles.id is the same as auth.users.id
      const profileData: GeneratedProfile[] = (data || []).map((profile: { id: string; username?: string | null; email?: string | null; comments_count?: number | null; last_used_at?: string | null }) => ({
        id: profile.id,
        username: profile.username || 'Unknown',
        email: profile.email || `${profile.username || 'user'}@generated.local`,
        user_id: profile.id,
        comments_count: profile.comments_count || 0,
        last_used_at: profile.last_used_at || undefined,
      }));

      setProfiles(profileData);
    } catch (error) {
      console.error('Error loading profiles:', error);
    }
  }

  async function loadFaultsAndManuals() {
    try {
      const [faultsResult, manualsResult] = await Promise.all([
        supabase
          .from('car_faults')
          .select('id, title, slug, model_generation_id')
          .eq('status', 'live')
          .eq('language_path', lang)
          .order('created_at', { ascending: false })
          .limit(500),
        supabase
          .from('car_manuals')
          .select('id, title, slug, model_generation_id')
          .eq('status', 'live')
          .eq('language_path', lang)
          .order('created_at', { ascending: false })
          .limit(500),
      ]);

      if (faultsResult.error) throw faultsResult.error;
      if (manualsResult.error) throw manualsResult.error;

      setFaults(faultsResult.data || []);
      setManuals(manualsResult.data || []);
    } catch (error) {
      console.error('Error loading faults/manuals:', error);
    }
  }

  async function generateProfiles() {
    setIsGeneratingProfiles(true);
    setStatus(t('Generating profiles...', 'Generiere Profile...'));

    try {
      const newProfiles: GeneratedProfile[] = [];

      // Generate realistic usernames via API
      const usernameResponse = await fetch('/api/users/generate-username', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count: profileCount }),
      });

      if (!usernameResponse.ok) {
        throw new Error('Failed to generate usernames');
      }

      const { usernames } = await usernameResponse.json();

      for (let i = 0; i < profileCount; i++) {
        const username = usernames[i];
        const email = `${username}@generated.local`;

        // Create auth user via API (admin access)
        const authResponse = await fetch('/api/users/create-generated', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            username,
          }),
        });

        if (!authResponse.ok) {
          const errorData = await authResponse.json().catch(() => ({}));
          console.error(`Error creating user ${i + 1}:`, errorData.error || 'Unknown error');
          continue;
        }

        const authData = await authResponse.json();

        if (!authData.user) {
          console.error(`Error creating user ${i + 1}:`, authData.error || 'Unknown error');
          continue;
        }

        newProfiles.push({
          id: authData.user.id,
          username,
          email,
          user_id: authData.user.id,
        });

        setStatus(t(`Generated ${newProfiles.length}/${profileCount} profiles...`, `Generiert ${newProfiles.length}/${profileCount} Profile...`));
      }

      setProfiles(prev => [...newProfiles, ...prev]);
      setStatus(t(`✅ Successfully generated ${newProfiles.length} profiles!`, `✅ Erfolgreich ${newProfiles.length} Profile generiert!`));
    } catch (error) {
      console.error('Error generating profiles:', error);
      setStatus(t(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`, `Fehler: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`));
    } finally {
      setIsGeneratingProfiles(false);
    }
  }

  async function generateComments() {
    if (selectedTargets.length === 0) {
      alert(t('Please select at least one fault or manual', 'Bitte wählen Sie mindestens einen Fehler oder eine Anleitung aus'));
      return;
    }

    if (profiles.length === 0) {
      alert(t('Please generate profiles first', 'Bitte generieren Sie zuerst Profile'));
      return;
    }

    setIsGeneratingComments(true);
    setStatus(t('Generating comments...', 'Generiere Kommentare...'));

    // Create tasks for all targets
    const tasks: CommentGenerationTask[] = selectedTargets.flatMap(target => {
      const taskList: CommentGenerationTask[] = [];
      for (let i = 0; i < commentsPerPage; i++) {
        taskList.push({
          id: `${target.id}-${i}-${Date.now()}-${Math.random()}`,
          targetId: target.id,
          targetType: target.type,
          targetTitle: target.title,
          status: 'pending',
        });
      }
      return taskList;
    });

    setGenerationTasks(tasks);

    let successCount = 0;
    let errorCount = 0;

    // Helper function to process comment insertion
    const processCommentInsertion = async (task: CommentGenerationTask, comment: string, profile: GeneratedProfile) => {
      try {
        const insertData: any = {
          user_id: profile.user_id,
          content: comment.trim(),
          status: 'live',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        if (task.targetType === 'fault') {
          insertData.car_fault_id = task.targetId;
        } else {
          insertData.car_manual_id = task.targetId;
        }

        // Use bulk insert API with service role (bypasses RLS)
        const bulkResponse = await fetch('/api/cars/comments/bulk-insert', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            comments: [insertData],
          }),
        });

        if (!bulkResponse.ok) {
          const errorData = await bulkResponse.json().catch(() => ({}));
          throw new Error(`Database error: ${errorData.error || 'Failed to insert comment'}`);
        }

        setGenerationTasks(prev => prev.map(t => 
          t.id === task.id 
            ? { ...t, status: 'done', comment, profileId: profile.id }
            : t
        ));

        return true;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setGenerationTasks(prev => prev.map(t => 
          t.id === task.id 
            ? { ...t, status: 'error', error: errorMessage }
            : t
        ));
        return false;
      }
    };

    // Process tasks in batches of 20 (optimized for batch API)
    const batchSize = 20;
    for (let i = 0; i < tasks.length; i += batchSize) {
      const batch = tasks.slice(i, i + batchSize);
      
      // Update all to generating
      setGenerationTasks(prev => prev.map(t => 
        batch.some(b => b.id === t.id) ? { ...t, status: 'generating' } : t
      ));

      // Batch generate comments (more efficient - single API call for up to 20 comments)
      const batchRequests = batch.map(task => ({
        targetType: task.targetType,
        targetTitle: task.targetTitle,
        language: lang,
      }));

      try {
        const batchResponse = await fetch('/api/cars/generate-comments-batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ requests: batchRequests }),
        });

        if (!batchResponse.ok) {
          throw new Error('Batch generation failed');
        }

        const { comments: generatedComments } = await batchResponse.json();

        // Process all results and insert comments
        const insertPromises = batch.map(async (task, index) => {
          const generatedResult = generatedComments[index];
          
          if (generatedResult.error || !generatedResult.comment || generatedResult.comment.trim().length === 0) {
            const errorMsg = generatedResult.error || 'Generated comment is empty';
            setGenerationTasks(prev => prev.map(t => 
              t.id === task.id 
                ? { ...t, status: 'error', error: errorMsg }
                : t
            ));
            errorCount++;
            return;
          }

          // Select random profile
          const randomProfile = profiles[Math.floor(Math.random() * profiles.length)];
          const success = await processCommentInsertion(task, generatedResult.comment, randomProfile);
          
          if (success) {
            successCount++;
          } else {
            errorCount++;
          }
        });

        await Promise.all(insertPromises);
      } catch (error) {
        // Fallback to individual generation if batch fails
        console.warn('Batch generation failed, falling back to individual:', error);
        
        const results = await Promise.allSettled(batch.map(async (task) => {
          try {
            const response = await fetch('/api/cars/generate-comment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                targetType: task.targetType,
                targetTitle: task.targetTitle,
                language: lang,
              }),
            });

            if (!response.ok) {
              const errorText = await response.text();
              throw new Error(`Failed to generate comment: ${errorText}`);
            }

            const { comment } = await response.json();

            if (!comment || comment.trim().length === 0) {
              throw new Error('Generated comment is empty');
            }

            const randomProfile = profiles[Math.floor(Math.random() * profiles.length)];
            const success = await processCommentInsertion(task, comment, randomProfile);
            
            return { success };
          } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Unknown error';
            setGenerationTasks(prev => prev.map(t => 
              t.id === task.id 
                ? { ...t, status: 'error', error: errorMsg }
                : t
            ));
            return { success: false };
          }
        }));

        results.forEach((result, index) => {
          if (result.status === 'fulfilled' && result.value.success) {
            successCount++;
          } else {
            errorCount++;
          }
        });
      }

      setStatus(t(
        `Generated ${Math.min(i + batchSize, tasks.length)}/${tasks.length} comments... (${successCount} success, ${errorCount} errors)`,
        `Generiert ${Math.min(i + batchSize, tasks.length)}/${tasks.length} Kommentare... (${successCount} Erfolg, ${errorCount} Fehler)`
      ));
    }

    setStatus(t(
      `✅ Completed: ${successCount} successful, ${errorCount} errors out of ${tasks.length} total`,
      `✅ Abgeschlossen: ${successCount} erfolgreich, ${errorCount} Fehler von ${tasks.length} gesamt`
    ));
    setIsGeneratingComments(false);
  }

  const toggleTarget = (id: string, type: 'fault' | 'manual', title: string) => {
    setSelectedTargets(prev => {
      const exists = prev.find(t => t.id === id && t.type === type);
      if (exists) {
        return prev.filter(t => !(t.id === id && t.type === type));
      } else {
        return [...prev, { id, type, title }];
      }
    });
  };

  const selectAll = () => {
    const allTargets = [
      ...faults.map(f => ({ id: f.id, type: 'fault' as const, title: f.title })),
      ...manuals.map(m => ({ id: m.id, type: 'manual' as const, title: m.title })),
    ];
    setSelectedTargets(allTargets);
  };

  const clearSelection = () => {
    setSelectedTargets([]);
  };

  return (
    <InternalAuth>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {t('Car Comments Generator', 'Auto-Kommentare Generator')}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {t('Mass generate comments for car faults and manuals', 'Massen-Generierung von Kommentaren für Auto-Fehler und Anleitungen')}
            </p>
            <div className="mt-4 flex gap-4">
              <Link
                href={`/${lang}/internal`}
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                ← {t('Back to Internal', 'Zurück zu Intern')}
              </Link>
              <Link
                href={`/${lang}/carinternal`}
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                {t('Car Content Generator', 'Auto-Inhaltsgenerator')} →
              </Link>
            </div>
          </div>

          {/* Profile Generation Section */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">{t('1. Generate Profiles', '1. Profile generieren')}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('Number of profiles to generate', 'Anzahl der zu generierenden Profile')}
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={profileCount}
                  onChange={(e) => setProfileCount(parseInt(e.target.value) || 10)}
                  className="w-full border rounded-md px-3 py-2 dark:bg-gray-700 dark:text-white"
                  disabled={isGeneratingProfiles}
                />
              </div>
              <button
                onClick={generateProfiles}
                disabled={isGeneratingProfiles}
                className="bg-indigo-600 text-white px-6 py-2 rounded-md font-semibold hover:bg-indigo-700 disabled:opacity-50"
              >
                {isGeneratingProfiles 
                  ? t('Generating...', 'Generiere...') 
                  : t(`Generate ${profileCount} Profiles`, `${profileCount} Profile generieren`)}
              </button>
              {profiles.length > 0 && (
                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <p>{t(`✅ ${profiles.length} profiles available`, `✅ ${profiles.length} Profile verfügbar`)}</p>
                  {profiles.some(p => p.comments_count && p.comments_count > 0) && (
                    <p className="text-xs">
                      {t(
                        `Total comments: ${profiles.reduce((sum, p) => sum + (p.comments_count || 0), 0)}`,
                        `Gesamt Kommentare: ${profiles.reduce((sum, p) => sum + (p.comments_count || 0), 0)}`
                      )}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Target Selection Section */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">
              {t('2. Select Targets', '2. Ziele auswählen')}
              <span className="ml-2 text-sm font-normal text-gray-500">
                ({selectedTargets.length} {t('selected', 'ausgewählt')})
              </span>
            </h2>
            <div className="mb-4 flex gap-2">
              <button
                onClick={selectAll}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                {t('Select All', 'Alle auswählen')}
              </button>
              <button
                onClick={clearSelection}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                {t('Clear Selection', 'Auswahl löschen')}
              </button>
            </div>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              <div>
                <h3 className="font-semibold mb-2">{t('Faults', 'Fehler')} ({faults.length})</h3>
                <div className="space-y-2">
                  {faults.slice(0, 100).map(fault => (
                    <label key={fault.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedTargets.some(t => t.id === fault.id && t.type === 'fault')}
                        onChange={() => toggleTarget(fault.id, 'fault', fault.title)}
                        className="rounded"
                      />
                      <span className="text-sm">{fault.title}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-2">{t('Manuals', 'Anleitungen')} ({manuals.length})</h3>
                <div className="space-y-2">
                  {manuals.slice(0, 100).map(manual => (
                    <label key={manual.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedTargets.some(t => t.id === manual.id && t.type === 'manual')}
                        onChange={() => toggleTarget(manual.id, 'manual', manual.title)}
                        className="rounded"
                      />
                      <span className="text-sm">{manual.title}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Comment Generation Section */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">{t('3. Generate Comments', '3. Kommentare generieren')}</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('Comments per page', 'Kommentare pro Seite')}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={commentsPerPage}
                    onChange={(e) => setCommentsPerPage(parseInt(e.target.value) || 3)}
                    className="w-full border rounded-md px-3 py-2 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                    disabled={isGeneratingComments}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {t('How many comments to generate for each selected page', 'Wie viele Kommentare pro ausgewählter Seite generieren')}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('Total Comments', 'Gesamt Kommentare')}
                  </label>
                  <div className="w-full border rounded-md px-3 py-2 bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300">
                    {selectedTargets.length * commentsPerPage}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {t('Will be generated in batches of 20', 'Wird in Batches von 20 generiert')}
                  </p>
                </div>
              </div>
              <button
                onClick={generateComments}
                disabled={isGeneratingComments || selectedTargets.length === 0 || profiles.length === 0}
                className="w-full bg-green-600 text-white px-6 py-3 rounded-md font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {isGeneratingComments ? (
                  <>
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {t('Generating...', 'Generiere...')}
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    {t(`Generate ${selectedTargets.length * commentsPerPage} Comments`, `Generiere ${selectedTargets.length * commentsPerPage} Kommentare`)}
                  </>
                )}
              </button>
              {selectedTargets.length === 0 && (
                <p className="text-sm text-amber-600 dark:text-amber-400">
                  {t('⚠️ Please select at least one fault or manual', '⚠️ Bitte wählen Sie mindestens einen Fehler oder eine Anleitung aus')}
                </p>
              )}
              {profiles.length === 0 && (
                <p className="text-sm text-amber-600 dark:text-amber-400">
                  {t('⚠️ Please generate profiles first', '⚠️ Bitte generieren Sie zuerst Profile')}
                </p>
              )}
            </div>
          </div>

          {/* Status */}
          {status && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-8">
              <p className="text-blue-800 dark:text-blue-200">{status}</p>
            </div>
          )}

          {/* Generation Progress */}
          {generationTasks.length > 0 && (
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">{t('Generation Progress', 'Generierungsfortschritt')}</h2>
                <div className="flex items-center gap-4">
                  <div className="text-sm">
                    <span className="font-semibold text-green-600 dark:text-green-400">
                      {generationTasks.filter(t => t.status === 'done').length}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400"> / </span>
                    <span className="font-semibold">{generationTasks.length}</span>
                    <span className="text-gray-600 dark:text-gray-400"> {t('completed', 'abgeschlossen')}</span>
                  </div>
                  {generationTasks.some(t => t.status === 'error') && (
                    <div className="text-sm text-red-600 dark:text-red-400">
                      {generationTasks.filter(t => t.status === 'error').length} {t('errors', 'Fehler')}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="mb-4">
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                  <div
                    className="bg-green-600 h-2.5 rounded-full transition-all duration-300"
                    style={{
                      width: `${(generationTasks.filter(t => t.status === 'done').length / generationTasks.length) * 100}%`
                    }}
                  ></div>
                </div>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {generationTasks.map(task => (
                  <div key={task.id} className={`flex items-start justify-between p-3 border rounded-lg transition-colors ${
                    task.status === 'done' ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900/30' :
                    task.status === 'error' ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/30' :
                    task.status === 'generating' ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/30 animate-pulse' :
                    'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700'
                  }`}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">{task.targetTitle}</p>
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          task.targetType === 'fault' 
                            ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' 
                            : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                        }`}>
                          {task.targetType}
                        </span>
                      </div>
                      {task.comment && (
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 line-clamp-2 italic">
                          "{task.comment}"
                        </p>
                      )}
                      {task.error && (
                        <p className="text-xs text-red-600 dark:text-red-400 mt-2 font-mono">
                          {task.error}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                      {task.status === 'pending' && (
                        <span className="text-gray-400" title={t('Pending', 'Wartend')}>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </span>
                      )}
                      {task.status === 'generating' && (
                        <span className="text-blue-400 animate-spin" title={t('Generating...', 'Generiere...')}>
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        </span>
                      )}
                      {task.status === 'done' && (
                        <span className="text-green-400" title={t('Done', 'Fertig')}>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </span>
                      )}
                      {task.status === 'error' && (
                        <span className="text-red-400" title={t('Error', 'Fehler')}>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </InternalAuth>
  );
}

