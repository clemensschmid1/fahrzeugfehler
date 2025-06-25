-- Add progress tracking columns to bulk_import_jobs table
ALTER TABLE bulk_import_jobs 
ADD COLUMN IF NOT EXISTS total_questions integer,
ADD COLUMN IF NOT EXISTS processed_questions integer DEFAULT 0; 