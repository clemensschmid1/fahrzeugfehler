import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import KnowledgeClient from './KnowledgeClient';
import { supabase } from '@/lib/supabase';
import Header from '@/components/Header';

interface Question {
  id: string;
  question: string;
  answer: string;
  sector: string;
  created_at: string;
  slug: string;
  status: 'draft' | 'live' | 'bin';
  header?: string;
  manufacturer?: string;
  part_type?: string;
  part_series?: string;
  embedding?: number[];
  language_path: string;
  complexity_level?: string;
  voltage?: string;
  current?: string;
  power_rating?: string;
  machine_type?: string;
  application_area?: string[];
  product_category?: string;
  control_type?: string;
  industry_tag?: string;
  _similarity?: number;
}

export const revalidate = 600;

export const dynamic = 'force-dynamic';

function parseIntOrDefault(val: string | null, def: number) {
  const n = Number(val);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : def;
}

export async function generateMetadata({ params, searchParams }: { params: Promise<{ lang: string }>, searchParams: Promise<Record<string, string | string[] | undefined>> }): Promise<Metadata> {
  const { lang } = await params;
  const sp = await searchParams;
  const q = typeof sp.q === 'string' ? sp.q : '';
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _page = parseIntOrDefault(typeof sp.page === 'string' ? sp.page : null, 1);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _pageSize = parseIntOrDefault(typeof sp.pageSize === 'string' ? sp.pageSize : null, 60);
  const title = lang === 'de' ? 'Wissensdatenbank' : 'Knowledge Base';
  let description = lang === 'de' ? 'Durchsuchen Sie unsere Wissensdatenbank.' : 'Browse our knowledge base.';
  if (q) description += ` ${lang === 'de' ? 'Suchbegriff:' : 'Search:'} ${q}`;
  const canonical = `/${lang}/knowledge${q ? `?q=${encodeURIComponent(q)}` : ''}`;
  return {
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title,
      description,
      url: canonical,
      type: 'website',
      locale: lang === 'de' ? 'de_DE' : 'en_US',
      },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

// Add this type above getFilterOptions

type FilterOptionsParams = {
  lang: string;
  q: string;
  sector: string;
  manufacturer: string;
  complexity: string;
  partType: string;
  voltage: string;
  current: string;
  power_rating: string;
  machine_type: string;
  application_area: string;
  product_category: string;
  control_type: string;
  industry_tag: string;
};

// Add helper to get filter options
async function getFilterOptions({ lang, q, sector, manufacturer, complexity, partType, voltage, current, power_rating, machine_type, application_area, product_category, control_type, industry_tag }: FilterOptionsParams) {
  // Helper to build base query for each filter
  async function getOptions(column: keyof Question) {
    let query = supabase
            .from('questions')
      .select(`${column}`)
            .eq('language_path', lang)
      .eq('is_main', true);
    if (q) query = query.ilike('header', `%${q}%`);
    if (column !== 'sector' && sector) query = query.eq('sector', sector);
    if (column !== 'manufacturer' && manufacturer) query = query.eq('manufacturer', manufacturer);
    if (column !== 'complexity_level' && complexity) query = query.eq('complexity_level', complexity);
    if (column !== 'part_type' && partType) query = query.eq('part_type', partType);
    if (column !== 'voltage' && voltage) query = query.eq('voltage', voltage);
    if (column !== 'current' && current) query = query.eq('current', current);
    if (column !== 'power_rating' && power_rating) query = query.eq('power_rating', power_rating);
    if (column !== 'machine_type' && machine_type) query = query.eq('machine_type', machine_type);
    if (column !== 'application_area' && application_area) query = query.contains('application_area', [application_area]);
    if (column !== 'product_category' && product_category) query = query.eq('product_category', product_category);
    if (column !== 'control_type' && control_type) query = query.eq('control_type', control_type);
    if (column !== 'industry_tag' && industry_tag) query = query.eq('industry_tag', industry_tag);
    const { data, error } = await query;
    if (error) return [];
    // Special handling for array fields
    if (column === 'application_area') {
      const counts: Record<string, number> = {};
      (data as Record<string, unknown>[] || []).forEach(opt => {
        const arr = opt[column] as string[] | string | undefined;
        if (Array.isArray(arr)) {
          arr.forEach((val: string) => {
            if (val) counts[val] = (counts[val] || 0) + 1;
          });
        } else if (typeof arr === 'string' && arr) {
          counts[arr] = (counts[arr] || 0) + 1;
        }
      });
      return Object.entries(counts)
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
        .slice(0, 10)
        .map(([value, count]) => ({ value, count }));
        }
    // Default for non-array fields
    const counts: Record<string, number> = {};
    (data as Record<string, unknown>[] || []).forEach(opt => {
      const val = opt[column as string] as string | undefined;
      if (val) counts[val] = (counts[val] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 10)
      .map(([value, count]) => ({ value, count }));
  }
  const [sectors, manufacturers, complexities, partTypes, voltages, currents, power_ratings, machine_types, application_areas, product_categories, control_types, industry_tags] = await Promise.all([
    getOptions('sector'),
    getOptions('manufacturer'),
    getOptions('complexity_level'),
    getOptions('part_type'),
    getOptions('voltage'),
    getOptions('current'),
    getOptions('power_rating'),
    getOptions('machine_type'),
    getOptions('application_area'),
    getOptions('product_category'),
    getOptions('control_type'),
    getOptions('industry_tag'),
  ]);
  return { sectors, manufacturers, complexities, partTypes, voltages, currents, power_ratings, machine_types, application_areas, product_categories, control_types, industry_tags };
      }

function cosineSimilarity(a: number[], b: number[]) {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
      }

export default async function KnowledgePage({ params, searchParams }: { params: Promise<{ lang: string }>, searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { lang } = await params;
  const sp = await searchParams;
  const q = typeof sp.q === 'string' ? sp.q : '';
  const sort = typeof sp.sort === 'string' ? sp.sort : 'date-desc';
  const similarTo = typeof sp.similarTo === 'string' ? sp.similarTo : '';
  const similaritySort = typeof sp.similaritySort === 'string' ? sp.similaritySort : 'desc';
  const sector = typeof sp.sector === 'string' ? sp.sector : '';
  const manufacturer = typeof sp.manufacturer === 'string' ? sp.manufacturer : '';
  const complexity = typeof sp.complexity === 'string' ? sp.complexity : '';
  const partType = typeof sp.partType === 'string' ? sp.partType : '';
  const voltage = typeof sp.voltage === 'string' ? sp.voltage : '';
  const current = typeof sp.current === 'string' ? sp.current : '';
  const power_rating = typeof sp.power_rating === 'string' ? sp.power_rating : '';
  const machine_type = typeof sp.machine_type === 'string' ? sp.machine_type : '';
  const application_area = typeof sp.application_area === 'string' ? sp.application_area : '';
  const product_category = typeof sp.product_category === 'string' ? sp.product_category : '';
  const control_type = typeof sp.control_type === 'string' ? sp.control_type : '';
  const industry_tag = typeof sp.industry_tag === 'string' ? sp.industry_tag : '';

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _page = parseIntOrDefault(typeof sp.page === 'string' ? sp.page : null, 1);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _pageSize = parseIntOrDefault(typeof sp.pageSize === 'string' ? sp.pageSize : null, 60);

  // Sanitize pageSize
  const allowedPageSizes = [30, 60, 100];
  const safePageSize = allowedPageSizes.includes(_pageSize) ? _pageSize : 60;

  let questions: Question[] = [];
  let total = 0;
  let referenceQuestion: Question | undefined = undefined;
  if (similarTo) {
    // Fetch all questions and the reference question
    const { data: allQuestions, error: allError } = await supabase
      .from('questions')
      .select('*')
      .eq('language_path', lang)
      .eq('is_main', true)
      .eq('meta_generated', true);
    if (allError) throw allError;
    const { data: refQ, error: refError } = await supabase
      .from('questions')
      .select('*')
      .eq('slug', similarTo)
      .eq('language_path', lang)
      .maybeSingle();
    if (refError) throw refError;
    referenceQuestion = refQ;
    if (refQ && refQ.embedding) {
      // Compute similarity for each question
      questions = allQuestions.map(q => ({ ...q, _similarity: q.embedding ? cosineSimilarity(refQ.embedding, q.embedding) : -1 }));
      // Sort by similaritySort param
      if (similaritySort === 'asc') {
        questions.sort((a, b) => (a._similarity ?? -1) - (b._similarity ?? -1));
      } else {
        questions.sort((a, b) => (b._similarity ?? -1) - (a._similarity ?? -1));
      }
    } else {
      questions = allQuestions;
    }
    total = questions.length;
    // Pagination
    questions = questions.slice((_page - 1) * safePageSize, (_page - 1) * safePageSize + safePageSize);
  } else {
  let query = supabase
    .from('questions')
    .select('*', { count: 'exact' })
    .eq('language_path', lang)
    .eq('is_main', true)
    .eq('meta_generated', true);
    if (q) query = query.ilike('header', `%${q}%`);
  if (sector) query = query.eq('sector', sector);
  if (manufacturer) query = query.eq('manufacturer', manufacturer);
  if (complexity) query = query.eq('complexity_level', complexity);
  if (partType) query = query.eq('part_type', partType);
  if (voltage) query = query.eq('voltage', voltage);
  if (current) query = query.eq('current', current);
  if (power_rating) query = query.eq('power_rating', power_rating);
  if (machine_type) query = query.eq('machine_type', machine_type);
  if (application_area) query = query.contains('application_area', [application_area]);
  if (product_category) query = query.eq('product_category', product_category);
  if (control_type) query = query.eq('control_type', control_type);
  if (industry_tag) query = query.eq('industry_tag', industry_tag);
  if (sort === 'date-asc') query = query.order('created_at', { ascending: true });
  else query = query.order('created_at', { ascending: false });
  const from = (_page - 1) * safePageSize;
  const to = from + safePageSize - 1;
  query = query.range(from, to);
    const { data, count, error } = await query;
  if (error) throw error;
    if (!data) return notFound();
    questions = data;
    total = count || 0;
  }
  const totalPages = Math.max(1, Math.ceil((total || 0) / safePageSize));

  // SEO: canonical, prev, next links
  const baseUrl = `/${lang}/knowledge`;
  const urlParams = new URLSearchParams();
  if (q) urlParams.set('q', q);
  if (sort && sort !== 'date-desc') urlParams.set('sort', sort);
  if (sector) urlParams.set('sector', sector);
  if (manufacturer) urlParams.set('manufacturer', manufacturer);
  if (complexity) urlParams.set('complexity', complexity);
  if (partType) urlParams.set('partType', partType);
  if (safePageSize !== 60) urlParams.set('pageSize', String(safePageSize));
  const canonicalUrl = `${baseUrl}${urlParams.toString() ? '?' + urlParams.toString() : ''}`;
  const prevUrl = _page > 1 ? `${canonicalUrl}${urlParams.toString() ? '&' : '?'}page=${_page - 1}` : null;
  const nextUrl = _page < totalPages ? `${canonicalUrl}${urlParams.toString() ? '&' : '?'}page=${_page + 1}` : null;

  // Get dynamic filter options
  const filterOptions = await getFilterOptions({ lang, q, sector, manufacturer, complexity, partType, voltage, current, power_rating, machine_type, application_area, product_category, control_type, industry_tag });

  // Build title and description for SEO and JSON-LD
  const title = lang === 'de' ? 'Wissensdatenbank' : 'Knowledge Base';
  let description = lang === 'de' ? 'Durchsuchen Sie unsere Wissensdatenbank.' : 'Browse our knowledge base.';
  if (q) description += ` ${lang === 'de' ? 'Suchbegriff:' : 'Search:'} ${q}`;

  return (
    <>
      <Header />
      {/* SEO links */}
      <link rel="canonical" href={canonicalUrl} />
      {prevUrl && <link rel="prev" href={prevUrl} />}
      {nextUrl && <link rel="next" href={nextUrl} />}
      <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        'name': title,
        'description': description,
        'url': canonicalUrl,
        'inLanguage': lang,
        'hasPart': questions.map(q => ({
          '@type': 'TechArticle',
          'headline': q.question,
          'datePublished': q.created_at,
          'url': `https://infoneva.com/${lang}/knowledge/${q.slug}`
        }))
      }) }} />
      <KnowledgeClient
        questions={questions}
        total={total || 0}
        totalAvailable={total || 0}
        page={_page}
        pageSize={safePageSize}
        totalPages={totalPages}
        sort={sort}
        sector={sector}
        manufacturer={manufacturer}
        complexity={complexity}
        partType={partType}
        q={q}
        lang={lang}
        voltage={voltage}
        current={current}
        power_rating={power_rating}
        machine_type={machine_type}
        application_area={application_area}
        product_category={product_category}
        control_type={control_type}
        industry_tag={industry_tag}
        filterOptions={filterOptions}
        referenceQuestion={referenceQuestion}
        similarityMode={!!similarTo}
        similaritySort={similaritySort}
      />
    </>
  );
} 