-- ============================================================
-- Pulse Fitness — 006_add_analytics_performance_index.sql
-- Performance optimization for workout analytics queries
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_workouts_analytics_perf 
ON workouts(user_id, started_at) 
WHERE is_deleted = false;
