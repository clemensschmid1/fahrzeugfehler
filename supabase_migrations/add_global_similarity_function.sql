-- Create function for global vector similarity search (across all generations)
CREATE OR REPLACE FUNCTION match_car_faults_global(
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  filter_language text DEFAULT NULL,
  exclude_fault_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  slug text,
  title text,
  similarity float,
  generation_id uuid,
  generation_name text,
  model_name text,
  brand_name text
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    cf.id,
    cf.slug,
    cf.title,
    1 - (cfe.embedding <=> query_embedding) as similarity,
    cf.model_generation_id as generation_id,
    mg.name as generation_name,
    cm.name as model_name,
    cb.name as brand_name
  FROM car_fault_embeddings cfe
  INNER JOIN car_faults cf ON cfe.car_fault_id = cf.id
  LEFT JOIN model_generations mg ON cf.model_generation_id = mg.id
  LEFT JOIN car_models cm ON mg.car_model_id = cm.id
  LEFT JOIN car_brands cb ON cm.brand_id = cb.id
  WHERE
    cf.status = 'live'
    AND (filter_language IS NULL OR cf.language_path = filter_language)
    AND (exclude_fault_id IS NULL OR cf.id != exclude_fault_id)
    AND cfe.embedding IS NOT NULL
    AND (1 - (cfe.embedding <=> query_embedding)) >= match_threshold
  ORDER BY cfe.embedding <=> query_embedding
  LIMIT match_count;
$$;

COMMENT ON FUNCTION match_car_faults_global IS 'Find similar car faults globally (across all generations) using vector similarity search';









