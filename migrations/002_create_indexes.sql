-- ============================================================
-- Pulse Fitness — 002_create_indexes.sql
-- Performance-critical indexes
-- ============================================================

-- Workout history (Dashboard + History page pagination)
CREATE INDEX idx_workouts_user_date ON workouts(user_id, started_at DESC);
CREATE INDEX idx_workouts_not_deleted ON workouts(user_id) WHERE is_deleted = false;

-- Workout detail loading
CREATE INDEX idx_workout_exercises_workout ON workout_exercises(workout_id);
CREATE INDEX idx_exercise_sets_workout_ex ON exercise_sets(workout_exercise_id);

-- Exercise search + filtering
CREATE INDEX idx_exercise_muscles_exercise ON exercise_muscles(exercise_id);
CREATE INDEX idx_exercise_muscles_group ON exercise_muscles(muscle_group);
CREATE INDEX idx_exercise_library_search ON exercise_library USING gin(to_tsvector('english', name));

-- Health conditions (AI coach queries active conditions)
CREATE INDEX idx_health_conditions_user ON health_conditions(user_id) WHERE is_active = true;

-- Body measurements (weight tracking chart)
CREATE INDEX idx_body_measurements_user ON body_measurements(user_id, measured_at DESC);

-- Personal records
CREATE INDEX idx_personal_records_user ON personal_records(user_id, exercise_id);

-- Coach chat history
CREATE INDEX idx_coach_messages_convo ON coach_messages(conversation_id, created_at);
