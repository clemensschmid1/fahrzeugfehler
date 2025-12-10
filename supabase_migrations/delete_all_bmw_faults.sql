-- Delete all BMW car_faults and related data
-- This script deletes all faults for BMW brand and their associated embeddings

-- First, delete embeddings for BMW faults
DELETE FROM car_fault_embeddings
WHERE car_fault_id IN (
  SELECT cf.id
  FROM car_faults cf
  JOIN model_generations mg ON cf.model_generation_id = mg.id
  JOIN car_models cm ON mg.car_model_id = cm.id
  JOIN car_brands cb ON cm.brand_id = cb.id
  WHERE cb.slug = 'bmw'
);

-- Then, delete all BMW faults
DELETE FROM car_faults
WHERE model_generation_id IN (
  SELECT mg.id
  FROM model_generations mg
  JOIN car_models cm ON mg.car_model_id = cm.id
  JOIN car_brands cb ON cm.brand_id = cb.id
  WHERE cb.slug = 'bmw'
);

-- Optional: Show count of deleted items (for verification)
-- SELECT COUNT(*) as deleted_faults FROM car_faults WHERE model_generation_id IN (
--   SELECT mg.id FROM model_generations mg
--   JOIN car_models cm ON mg.car_model_id = cm.id
--   JOIN car_brands cb ON cm.brand_id = cb.id
--   WHERE cb.slug = 'bmw'
-- );


