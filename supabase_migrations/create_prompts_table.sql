-- Create prompts table for managing adaptive prompts per generation
CREATE TABLE IF NOT EXISTS generation_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  generation_id UUID NOT NULL REFERENCES model_generations(id) ON DELETE CASCADE,
  content_type VARCHAR(20) NOT NULL CHECK (content_type IN ('fault', 'manual')),
  language VARCHAR(10) NOT NULL CHECK (language IN ('en', 'de')),
  prompt_order INTEGER NOT NULL DEFAULT 1, -- Order of prompt rotation (1, 2, 3, 4, 5...)
  system_prompt TEXT NOT NULL,
  user_prompt_template TEXT NOT NULL, -- Template with {brand}, {model}, {generation}, {generationCode} placeholders
  model VARCHAR(50) DEFAULT 'gpt-4o-mini',
  temperature DECIMAL(3,2) DEFAULT 0.7,
  max_tokens INTEGER DEFAULT 5000,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by VARCHAR(255),
  notes TEXT,
  UNIQUE(generation_id, content_type, language, prompt_order)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_generation_prompts_generation ON generation_prompts(generation_id, content_type, language, is_active);
CREATE INDEX IF NOT EXISTS idx_generation_prompts_order ON generation_prompts(generation_id, content_type, language, prompt_order);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_generation_prompts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_generation_prompts_updated_at
  BEFORE UPDATE ON generation_prompts
  FOR EACH ROW
  EXECUTE FUNCTION update_generation_prompts_updated_at();

-- Add comments
COMMENT ON TABLE generation_prompts IS 'Stores adaptive prompts for question generation per generation. Prompts rotate every 5 batches to ensure variance.';
COMMENT ON COLUMN generation_prompts.prompt_order IS 'Order of prompt in rotation sequence (1-5 for 5 different prompts that rotate)';
COMMENT ON COLUMN generation_prompts.user_prompt_template IS 'Template string with placeholders: {brand}, {model}, {generation}, {generationCode}, {batchNumber}, {totalBatches}';

