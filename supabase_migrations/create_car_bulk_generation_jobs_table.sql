-- Create table for tracking car bulk generation jobs
CREATE TABLE IF NOT EXISTS car_bulk_generation_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL,
  model_id uuid NOT NULL,
  generation_id uuid NOT NULL,
  content_type text NOT NULL CHECK (content_type IN ('fault', 'manual')),
  language text NOT NULL CHECK (language IN ('en', 'de')),
  count integer NOT NULL,
  status text NOT NULL DEFAULT 'pending', -- pending, batch1_created, batch1_complete, batch2_created, batch2_complete, processing, completed, failed, cancelled
  batch1_id text,
  batch2_id text,
  batch1_status text,
  batch2_status text,
  progress_current integer DEFAULT 0,
  progress_total integer DEFAULT 0,
  current_stage text,
  success_count integer DEFAULT 0,
  failed_count integer DEFAULT 0,
  errors jsonb DEFAULT '[]'::jsonb,
  result jsonb,
  error_message text,
  estimated_cost numeric(10, 4),
  actual_cost numeric(10, 4),
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid
);

CREATE INDEX IF NOT EXISTS idx_car_bulk_jobs_status ON car_bulk_generation_jobs(status);
CREATE INDEX IF NOT EXISTS idx_car_bulk_jobs_created_at ON car_bulk_generation_jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_car_bulk_jobs_user_id ON car_bulk_generation_jobs(user_id);

-- Add comments
COMMENT ON TABLE car_bulk_generation_jobs IS 'Tracks car bulk content generation jobs using OpenAI Batch API';
COMMENT ON COLUMN car_bulk_generation_jobs.batch1_id IS 'OpenAI Batch API ID for answer generation';
COMMENT ON COLUMN car_bulk_generation_jobs.batch2_id IS 'OpenAI Batch API ID for metadata generation';




