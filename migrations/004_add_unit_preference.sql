-- ============================================================
-- Pulse Fitness — 004_add_unit_preference.sql
-- ============================================================

ALTER TABLE profiles 
ADD COLUMN unit_preference VARCHAR(10) DEFAULT 'lbs' CHECK (unit_preference IN ('lbs', 'kg'));
