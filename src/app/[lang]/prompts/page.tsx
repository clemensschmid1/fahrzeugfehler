'use client';

import { useState, useEffect, useMemo } from 'react';
import InternalAuth from '@/components/InternalAuth';
import { getSupabaseClient } from '@/lib/supabase';
import Link from 'next/link';
import { useParams } from 'next/navigation';

type CarBrand = {
  id: string;
  name: string;
  slug: string;
};

type CarModel = {
  id: string;
  name: string;
  slug: string;
  brand_id: string;
};

type ModelGeneration = {
  id: string;
  name: string;
  slug: string;
  car_model_id: string;
  generation_code?: string;
  year_start?: number;
  year_end?: number;
};

type GenerationPrompt = {
  id: string;
  generation_id: string;
  content_type: 'fault' | 'manual';
  language: 'en' | 'de';
  prompt_order: number;
  system_prompt: string;
  user_prompt_template: string;
  model: string;
  temperature: number;
  max_tokens: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
  notes?: string;
};

export default function PromptsPage() {
  return (
    <InternalAuth>
      <PromptsContent />
    </InternalAuth>
  );
}

function PromptsContent() {
  const params = useParams();
  const lang = params.lang as string;
  const t = (en: string, de: string) => lang === 'de' ? de : en;

  const [brands, setBrands] = useState<CarBrand[]>([]);
  const [models, setModels] = useState<CarModel[]>([]);
  const [generations, setGenerations] = useState<ModelGeneration[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [selectedGeneration, setSelectedGeneration] = useState<string>('');
  const [contentType, setContentType] = useState<'fault' | 'manual'>('fault');
  const [language, setLanguage] = useState<'en' | 'de'>('en');
  const [prompts, setPrompts] = useState<GenerationPrompt[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const supabase = useMemo(() => {
    try {
      return getSupabaseClient();
    } catch (error: any) {
      console.error('Failed to initialize Supabase client:', error);
      return null;
    }
  }, []);

  // Load brands
  useEffect(() => {
    if (!supabase) return;
    const loadBrands = async () => {
      try {
        const { data, error } = await supabase
          .from('car_brands')
          .select('id, name, slug')
          .order('name');
        if (error) throw error;
        setBrands(data || []);
      } catch (err) {
        console.error('Error loading brands:', err);
      }
    };
    loadBrands();
  }, [supabase]);

  // Load models when brand selected
  useEffect(() => {
    if (!supabase || !selectedBrand) {
      // Don't update if already empty to avoid re-render loops
      return;
    }
    const loadModels = async () => {
      try {
        const { data, error } = await supabase
          .from('car_models')
          .select('id, name, slug, brand_id')
          .eq('brand_id', selectedBrand)
          .order('name');
        if (error) throw error;
        setModels(data || []);
      } catch (err) {
        console.error('Error loading models:', err);
      }
    };
    loadModels();
  }, [supabase, selectedBrand]);

  // Load generations when model selected
  useEffect(() => {
    if (!supabase || !selectedModel) {
      // Don't update if already empty to avoid re-render loops
      return;
    }
    const loadGenerations = async () => {
      try {
        const { data, error } = await supabase
          .from('model_generations')
          .select('id, name, slug, car_model_id, generation_code, year_start, year_end')
          .eq('car_model_id', selectedModel)
          .order('year_start', { ascending: false });
        if (error) throw error;
        setGenerations(data || []);
      } catch (err) {
        console.error('Error loading generations:', err);
      }
    };
    loadGenerations();
  }, [supabase, selectedModel]);

  // Load prompts when generation selected
  useEffect(() => {
    if (!supabase || !selectedGeneration) {
      // Don't update state if already in the correct state to avoid re-render loops
      return;
    }
    let cancelled = false;
    const loadPrompts = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('generation_prompts')
          .select('*')
          .eq('generation_id', selectedGeneration)
          .eq('content_type', contentType)
          .eq('language', language)
          .order('prompt_order');
        if (error) throw error;
        if (!cancelled) {
          setPrompts(data || []);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Error loading prompts:', err);
          setError(lang === 'de' ? 'Fehler beim Laden der Prompts' : 'Failed to load prompts');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };
    loadPrompts();
    return () => {
      cancelled = true;
    };
  }, [supabase, selectedGeneration, contentType, language, lang]);

  const handleSavePrompt = async (prompt: Partial<GenerationPrompt>, promptOrder: number) => {
    if (!supabase || !selectedGeneration) {
      setError(t('Please select a generation', 'Bitte wählen Sie eine Generation'));
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const promptData = {
        generation_id: selectedGeneration,
        content_type: contentType,
        language: language,
        prompt_order: promptOrder,
        system_prompt: prompt.system_prompt || '',
        user_prompt_template: prompt.user_prompt_template || '',
        model: prompt.model || 'gpt-4o-mini',
        temperature: prompt.temperature || 0.7,
        max_tokens: prompt.max_tokens || 4000,
        is_active: prompt.is_active !== undefined ? prompt.is_active : true,
        notes: prompt.notes || null,
      };

      const existingPrompt = prompts.find(p => p.prompt_order === promptOrder);

      if (existingPrompt) {
        // Update existing
        const { error } = await supabase
          .from('generation_prompts')
          .update(promptData)
          .eq('id', existingPrompt.id);
        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase
          .from('generation_prompts')
          .insert(promptData);
        if (error) throw error;
      }

      setSuccess(t('Prompt saved successfully', 'Prompt erfolgreich gespeichert'));
      // Reload prompts
      const { data, error } = await supabase
        .from('generation_prompts')
        .select('*')
        .eq('generation_id', selectedGeneration)
        .eq('content_type', contentType)
        .eq('language', language)
        .order('prompt_order');
      if (error) throw error;
      setPrompts(data || []);
    } catch (err: any) {
      console.error('Error saving prompt:', err);
      setError(err.message || t('Failed to save prompt', 'Fehler beim Speichern des Prompts'));
    } finally {
      setSaving(false);
    }
  };

  const selectedGenerationData = generations.find(g => g.id === selectedGeneration);
  const selectedModelData = models.find(m => m.id === selectedModel);
  const selectedBrandData = brands.find(b => b.id === selectedBrand);

  // Create 5 prompt slots (for rotation)
  const promptSlots = [1, 2, 3, 4, 5];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              {t('Prompt Variance Center', 'Prompt-Varianz-Zentrum')}
            </h1>
            <Link
              href={`/${lang}/mass-generation`}
              className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-700 transition-all text-sm font-medium"
            >
              {t('Back to Mass Generation', 'Zurück zur Massen-Generierung')}
            </Link>
          </div>
          <p className="text-slate-600 dark:text-slate-400">
            {t(
              'Manage adaptive prompts for each generation. Prompts rotate every 5 batches to ensure variance in generated content.',
              'Verwalten Sie adaptive Prompts für jede Generation. Prompts rotieren alle 5 Batches, um Varianz in generiertem Inhalt zu gewährleisten.'
            )}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-lg">
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/30 rounded-lg">
            <p className="text-sm text-green-800 dark:text-green-200">{success}</p>
          </div>
        )}

        {/* Selection */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                {t('Brand', 'Marke')}
              </label>
              <select
                value={selectedBrand}
                onChange={(e) => {
                  setSelectedBrand(e.target.value);
                  setSelectedModel('');
                  setSelectedGeneration('');
                }}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              >
                <option value="">{t('Select Brand', 'Marke wählen')}</option>
                {brands.map(brand => (
                  <option key={brand.id} value={brand.id}>{brand.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                {t('Model', 'Modell')}
              </label>
              <select
                value={selectedModel}
                onChange={(e) => {
                  setSelectedModel(e.target.value);
                  setSelectedGeneration('');
                }}
                disabled={!selectedBrand}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white disabled:opacity-50"
              >
                <option value="">{t('Select Model', 'Modell wählen')}</option>
                {models.map(model => (
                  <option key={model.id} value={model.id}>{model.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                {t('Generation', 'Generation')}
              </label>
              <select
                value={selectedGeneration}
                onChange={(e) => setSelectedGeneration(e.target.value)}
                disabled={!selectedModel}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white disabled:opacity-50"
              >
                <option value="">{t('Select Generation', 'Generation wählen')}</option>
                {generations.map(gen => (
                  <option key={gen.id} value={gen.id}>
                    {gen.name} {gen.generation_code && `(${gen.generation_code})`}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  {t('Type', 'Typ')}
                </label>
                <select
                  value={contentType}
                  onChange={(e) => setContentType(e.target.value as 'fault' | 'manual')}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                >
                  <option value="fault">{t('Fault', 'Fehler')}</option>
                  <option value="manual">{t('Manual', 'Anleitung')}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  {t('Language', 'Sprache')}
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as 'en' | 'de')}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                >
                  <option value="en">EN</option>
                  <option value="de">DE</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Prompts Editor */}
        {selectedGeneration && (
          <div className="space-y-6">
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">
                {t('Generation Context', 'Generation-Kontext')}
              </h3>
              <p className="text-sm text-blue-800 dark:text-blue-300">
                {selectedBrandData?.name} {selectedModelData?.name} {selectedGenerationData?.name}
                {selectedGenerationData?.generation_code && ` (${selectedGenerationData.generation_code})`}
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-400 mt-2">
                {t(
                  'Prompts will rotate: Prompt 1 for batches 1-5, Prompt 2 for batches 6-10, etc.',
                  'Prompts rotieren: Prompt 1 für Batches 1-5, Prompt 2 für Batches 6-10, usw.'
                )}
              </p>
            </div>

            {loading ? (
              <div className="text-center py-8 text-slate-600 dark:text-slate-400">
                {t('Loading prompts...', 'Lade Prompts...')}
              </div>
            ) : (
              <div className="space-y-6">
                {promptSlots.map((order) => {
                  const existingPrompt = prompts.find(p => p.prompt_order === order);
                  return (
                    <PromptEditor
                      key={order}
                      order={order}
                      prompt={existingPrompt}
                      onSave={(prompt) => handleSavePrompt(prompt, order)}
                      saving={saving}
                      t={t}
                    />
                  );
                })}
              </div>
            )}
          </div>
        )}

        {!selectedGeneration && (
          <div className="text-center py-12 text-slate-500 dark:text-slate-400">
            {t('Please select a brand, model, and generation to manage prompts', 'Bitte wählen Sie eine Marke, ein Modell und eine Generation, um Prompts zu verwalten')}
          </div>
        )}
      </div>
    </div>
  );
}

function PromptEditor({
  order,
  prompt,
  onSave,
  saving,
  t,
}: {
  order: number;
  prompt?: GenerationPrompt;
  onSave: (prompt: Partial<GenerationPrompt>) => void;
  saving: boolean;
  t: (en: string, de: string) => string;
}) {
  const [systemPrompt, setSystemPrompt] = useState(prompt?.system_prompt || '');
  const [userPromptTemplate, setUserPromptTemplate] = useState(prompt?.user_prompt_template || '');
  const [model, setModel] = useState(prompt?.model || 'gpt-4o-mini');
  const [temperature, setTemperature] = useState(prompt?.temperature || 0.7);
  const [maxTokens, setMaxTokens] = useState(prompt?.max_tokens || 4000);
  const [isActive, setIsActive] = useState(prompt?.is_active !== undefined ? prompt.is_active : true);
  const [notes, setNotes] = useState(prompt?.notes || '');

  useEffect(() => {
    if (prompt) {
      setSystemPrompt(prompt.system_prompt);
      setUserPromptTemplate(prompt.user_prompt_template);
      setModel(prompt.model);
      setTemperature(prompt.temperature);
      setMaxTokens(prompt.max_tokens);
      setIsActive(prompt.is_active);
      setNotes(prompt.notes || '');
    } else {
      // Reset to defaults
      setSystemPrompt('');
      setUserPromptTemplate('');
      setModel('gpt-4o-mini');
      setTemperature(0.7);
      setMaxTokens(4000);
      setIsActive(true);
      setNotes('');
    }
  }, [prompt]);

  const handleSave = () => {
    onSave({
      system_prompt: systemPrompt,
      user_prompt_template: userPromptTemplate,
      model,
      temperature,
      max_tokens: maxTokens,
      is_active: isActive,
      notes,
    });
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border-2 border-slate-200 dark:border-slate-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
          {t('Prompt', 'Prompt')} {order} {t('(Batches', '(Batches')} {(order - 1) * 5 + 1}-{order * 5}{')'}
        </h3>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4"
            />
            {t('Active', 'Aktiv')}
          </label>
          <button
            onClick={handleSave}
            disabled={saving || !systemPrompt.trim() || !userPromptTemplate.trim()}
            className="px-4 py-2 bg-red-600 dark:bg-red-500 text-white rounded-lg font-medium hover:bg-red-700 dark:hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {saving ? t('Saving...', 'Speichere...') : t('Save', 'Speichern')}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            {t('System Prompt', 'System-Prompt')}
          </label>
          <textarea
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            rows={6}
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-mono text-sm"
            placeholder={t('Enter system prompt...', 'System-Prompt eingeben...')}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            {t('User Prompt Template', 'User-Prompt-Vorlage')} ({t('Use placeholders: {brand}, {model}, {generation}, {generationCode}, {batchNumber}, {totalBatches}', 'Verwenden Sie Platzhalter: {brand}, {model}, {generation}, {generationCode}, {batchNumber}, {totalBatches}')})
          </label>
          <textarea
            value={userPromptTemplate}
            onChange={(e) => setUserPromptTemplate(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-mono text-sm"
            placeholder={t('Enter user prompt template...', 'User-Prompt-Vorlage eingeben...')}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              {t('Model', 'Modell')}
            </label>
            <input
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              {t('Temperature', 'Temperatur')}
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="2"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              {t('Max Tokens', 'Max Tokens')}
            </label>
            <input
              type="number"
              value={maxTokens}
              onChange={(e) => setMaxTokens(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            {t('Notes', 'Notizen')} ({t('Optional', 'Optional')})
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
            placeholder={t('Add notes about this prompt...', 'Notizen zu diesem Prompt hinzufügen...')}
          />
        </div>
      </div>
    </div>
  );
}

