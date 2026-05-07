-- ============================================================
-- Pulse Fitness — 001_create_tables.sql
-- Database: Neon (PostgreSQL 16)
-- ============================================================

-- 0. Users (self-managed auth)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 1. Profiles (one-to-one with users, auto-created via trigger)
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL DEFAULT 'User',
    email TEXT NOT NULL,
    date_of_birth DATE,
    gender TEXT CHECK (gender IN ('male', 'female', 'other')),
    height_cm NUMERIC,
    weight_kg NUMERIC,
    fitness_level TEXT CHECK (fitness_level IN ('beginner', 'intermediate', 'advanced')),
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Health conditions (critical for AI safety)
CREATE TABLE health_conditions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    condition_name TEXT NOT NULL,
    body_area TEXT NOT NULL,
    severity TEXT CHECK (severity IN ('mild', 'moderate', 'severe')),
    notes TEXT,
    diagnosed_date DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Exercise library (system-seeded + user-created)
CREATE TABLE exercise_library (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    category TEXT CHECK (category IN ('strength', 'cardio', 'flexibility', 'rehab', 'yoga')),
    equipment TEXT CHECK (equipment IN ('barbell', 'dumbbell', 'machine', 'cable', 'band', 'bodyweight', 'kettlebell', 'other')),
    difficulty TEXT CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
    instructions TEXT,
    is_compound BOOLEAN DEFAULT false,
    is_system BOOLEAN DEFAULT false,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Exercise muscles (many-to-many)
CREATE TABLE exercise_muscles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exercise_id UUID NOT NULL REFERENCES exercise_library(id) ON DELETE CASCADE,
    muscle_group TEXT NOT NULL,
    role TEXT CHECK (role IN ('primary', 'secondary', 'stabilizer')),
    UNIQUE (exercise_id, muscle_group)
);

-- 5. Exercise contraindications (powers AI safety layer)
CREATE TABLE exercise_contraindications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exercise_id UUID NOT NULL REFERENCES exercise_library(id) ON DELETE CASCADE,
    condition_name TEXT NOT NULL,
    risk_level TEXT CHECK (risk_level IN ('avoid', 'modify', 'caution')),
    modification_notes TEXT,
    alternative_exercise_id UUID REFERENCES exercise_library(id)
);

-- 6. Workouts (one row per session)
CREATE TABLE workouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at TIMESTAMPTZ,
    title TEXT,
    workout_type TEXT CHECK (workout_type IN ('strength', 'cardio', 'flexibility', 'mixed')),
    notes TEXT,
    rating SMALLINT CHECK (rating BETWEEN 1 AND 5),
    energy_level SMALLINT CHECK (energy_level BETWEEN 1 AND 5),
    pain_notes TEXT,
    duration_mins INTEGER,
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Workout exercises
CREATE TABLE workout_exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workout_id UUID NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
    exercise_id UUID NOT NULL REFERENCES exercise_library(id),
    sort_order SMALLINT NOT NULL,
    notes TEXT,
    rest_seconds SMALLINT DEFAULT 90
);

-- 8. Exercise sets
CREATE TABLE exercise_sets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workout_exercise_id UUID NOT NULL REFERENCES workout_exercises(id) ON DELETE CASCADE,
    set_number SMALLINT NOT NULL,
    set_type TEXT DEFAULT 'working' CHECK (set_type IN ('warmup', 'working', 'dropset', 'failure', 'amrap')),
    weight_lbs DECIMAL(6,1),
    reps SMALLINT,
    duration_seconds SMALLINT,
    distance_meters DECIMAL(8,1),
    is_completed BOOLEAN DEFAULT false,
    rpe SMALLINT CHECK (rpe BETWEEN 1 AND 10),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 9. Body measurements
CREATE TABLE body_measurements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    measured_at DATE NOT NULL,
    weight_kg DECIMAL(5,1),
    body_fat_pct DECIMAL(4,1),
    notes TEXT,
    UNIQUE (user_id, measured_at)
);

-- 10. Workout templates
CREATE TABLE workout_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    workout_type TEXT CHECK (workout_type IN ('strength', 'cardio', 'flexibility', 'mixed')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 11. Template exercises
CREATE TABLE template_exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES workout_templates(id) ON DELETE CASCADE,
    exercise_id UUID NOT NULL REFERENCES exercise_library(id),
    sort_order SMALLINT NOT NULL,
    target_sets SMALLINT DEFAULT 3,
    target_reps SMALLINT DEFAULT 10,
    target_weight_lbs DECIMAL(6,1)
);

-- 12. Personal records
CREATE TABLE personal_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    exercise_id UUID NOT NULL REFERENCES exercise_library(id),
    record_type TEXT CHECK (record_type IN ('max_weight', 'max_reps', 'max_volume', 'est_1rm')),
    value DECIMAL(8,1) NOT NULL,
    achieved_at DATE NOT NULL,
    workout_id UUID REFERENCES workouts(id),
    UNIQUE (user_id, exercise_id, record_type)
);

-- 13. Coach conversations
CREATE TABLE coach_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 14. Coach messages
CREATE TABLE coach_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES coach_conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 15. Monthly summaries
CREATE TABLE monthly_summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    month DATE NOT NULL,
    stats JSONB NOT NULL,
    muscle_group_breakdown JSONB,
    ai_observations TEXT,
    ai_suggestions JSONB,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (user_id, month)
);

-- ============================================================
-- Triggers
-- ============================================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON workout_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON coach_conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-create profile when a user signs up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (user_id, email, display_name)
    VALUES (NEW.id, NEW.email, 'User');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_user_created
    AFTER INSERT ON users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();