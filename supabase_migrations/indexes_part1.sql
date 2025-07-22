-- PART 1: Most Critical Indexes (Run this first)
-- These will have the biggest impact on reducing your 8GB daily egress

-- CRITICAL: Index for filter options queries (prevents full table scans)
-- This is the most important one - it will dramatically reduce compute on /knowledge page
CREATE INDEX IF NOT EXISTS idx_questions_filter_options 
ON questions(language_path, is_main, meta_generated, sector, manufacturer, complexity_level, part_type, voltage, current, power_rating, machine_type, product_category, control_type, industry_tag);

-- CRITICAL: Index for live-slugs API (prevents full table scans)
-- This will fix the massive data egress from the sitemap-check page
CREATE INDEX IF NOT EXISTS idx_questions_live_slugs 
ON questions(status, is_main, slug) WHERE status = 'live' AND is_main = true;

-- CRITICAL: Index for metadata generation queries
-- This will speed up all knowledge page queries
CREATE INDEX IF NOT EXISTS idx_questions_metadata_lookup 
ON questions(status, is_main, language_path, meta_generated); 