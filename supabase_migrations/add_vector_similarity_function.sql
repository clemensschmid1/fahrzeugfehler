-- Create function for vector similarity search
CREATE OR REPLACE FUNCTION match_car_faults(
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  filter_generation_id uuid DEFAULT NULL,
  filter_language text DEFAULT NULL,
  exclude_fault_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  slug text,
  title text,
  similarity float
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    cf.id,
    cf.slug,
    cf.title,
    1 - (cfe.embedding <=> query_embedding) as similarity
  FROM car_fault_embeddings cfe
  INNER JOIN car_faults cf ON cfe.car_fault_id = cf.id
  WHERE
    cf.status = 'live'
    AND (filter_generation_id IS NULL OR cf.model_generation_id = filter_generation_id)
    AND (filter_language IS NULL OR cf.language_path = filter_language)
    AND (exclude_fault_id IS NULL OR cf.id != exclude_fault_id)
    AND cfe.embedding IS NOT NULL
    AND (1 - (cfe.embedding <=> query_embedding)) >= match_threshold
  ORDER BY cfe.embedding <=> query_embedding
  LIMIT match_count;
$$;

COMMENT ON FUNCTION match_car_faults IS 'Find similar car faults within a specific generation using vector similarity search';

