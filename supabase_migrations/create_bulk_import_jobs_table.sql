-- Create table for server-side background processing of bulk import files
CREATE TABLE IF NOT EXISTS bulk_import_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  filename text NOT NULL,
  status text NOT NULL DEFAULT 'pending', -- pending, processing, done, error
  result jsonb,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid, -- optional: to associate jobs with users
  file_url text -- where the uploaded file is stored (e.g., Supabase Storage)
);

CREATE INDEX IF NOT EXISTS idx_bulk_import_jobs_status ON bulk_import_jobs(status);
CREATE INDEX IF NOT EXISTS idx_bulk_import_jobs_created_at ON bulk_import_jobs(created_at); 