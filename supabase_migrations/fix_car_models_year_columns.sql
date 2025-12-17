-- =====================================================
-- Fix: Fehlende Spalten in car_models
-- =====================================================
-- Diese Datei fügt alle fehlenden Spalten zur car_models
-- Tabelle hinzu, falls sie noch nicht existieren.
-- =====================================================

-- Add all missing columns to car_models if table already exists
ALTER TABLE public.car_models 
    ADD COLUMN IF NOT EXISTS year_start INTEGER,
    ADD COLUMN IF NOT EXISTS year_end INTEGER,
    ADD COLUMN IF NOT EXISTS image_url TEXT,
    ADD COLUMN IF NOT EXISTS sprite_3d_url TEXT,
    ADD COLUMN IF NOT EXISTS description TEXT,
    ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS production_numbers JSONB;

-- =====================================================
-- FERTIG!
-- =====================================================
-- Alle fehlenden Spalten wurden zur car_models Tabelle
-- hinzugefügt. Der Fehler sollte jetzt behoben sein.
-- =====================================================

