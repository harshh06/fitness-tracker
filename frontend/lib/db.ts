import Dexie, { type Table } from "dexie";

// ── Types and Interfaces ─────────────────────────────────────

export interface LocalExerciseSet {
  id: string;
  workout_exercise_id: string;
  set_number: number;
  set_type: "warmup" | "working" | "dropset" | "failure" | "amrap";
  weight_lbs: number | null;
  reps: number | null;
  duration_seconds: number | null;
  distance_meters: number | null;
  is_completed: boolean;
  rpe: number | null;
}

export interface LocalWorkoutExercise {
  id: string;
  workout_id: string;
  exercise_id: string;
  sort_order: number;
  notes: string | null;
  rest_seconds: number;
  // Inlined fields from exercise_library to support direct offline rendering
  exercise_name: string;
  exercise_category: string;
  sets: LocalExerciseSet[];
}

export interface LocalWorkout {
  id: string;
  user_id: string;
  started_at: string;
  completed_at: string | null;
  title: string;
  workout_type: "strength" | "cardio" | "flexibility" | "mixed";
  notes: string | null;
  rating: number | null;
  energy_level: number | null;
  pain_notes: string | null;
  duration_mins: number;
  is_deleted: boolean;
  created_at: string;
  // Nested structure for seamless offline operations
  exercises: LocalWorkoutExercise[];
  // Sync state tracking
  syncStatus: "synced" | "pending-create" | "pending-update" | "pending-delete";
}

export interface LocalProfile {
  user_id: string;
  id: string;
  display_name: string;
  email: string;
  date_of_birth?: string;
  gender?: "male" | "female" | "other";
  weight_lbs?: number;
  height_inches?: number;
  fitness_level?: "beginner" | "intermediate" | "advanced";
  avatar_url?: string;
  created_at: string;
  updated_at: string;
  syncStatus: "synced" | "pending-update";
}

export interface LocalHealthCondition {
  id: string;
  user_id: string;
  condition_name: string;
  body_area: string;
  severity: "mild" | "moderate" | "severe";
  notes: string | null;
  diagnosed_date: string | null;
  is_active: boolean;
  created_at: string;
  syncStatus: "synced" | "pending-create" | "pending-update" | "pending-delete";
}

export interface LocalExercise {
  id: string;
  name: string;
  category: "strength" | "cardio" | "flexibility" | "rehab";
  equipment: "barbell" | "dumbbell" | "machine" | "cable" | "band" | "bodyweight" | "kettlebell" | "other";
  difficulty: "beginner" | "intermediate" | "advanced";
  instructions: string | null;
  is_compound: boolean;
  is_system: boolean;
  created_by: string | null;
  created_at: string;
  muscles?: string[]; // primary/secondary/stabilizer targeted muscle groups
}

export interface LocalPersonalRecord {
  id: string;
  user_id: string;
  exercise_id: string;
  record_type: "max_weight" | "max_reps" | "max_volume" | "est_1rm";
  value: number;
  achieved_at: string;
  workout_id: string;
}

// ── Database Definition ──────────────────────────────────────

class PulseDatabase extends Dexie {
  workouts!: Table<LocalWorkout>;
  exerciseLibrary!: Table<LocalExercise>;
  profiles!: Table<LocalProfile>;
  healthConditions!: Table<LocalHealthCondition>;
  personalRecords!: Table<LocalPersonalRecord>;

  constructor() {
    super("PulseDatabase");

    // Define IndexedDB Stores.
    // Index syntax: 'primaryKey, index1, index2, [compoundIndex1+compoundIndex2]'
    this.version(1).stores({
      workouts: "id, user_id, started_at, syncStatus",
      exerciseLibrary: "id, name, category, is_system, created_by",
      profiles: "user_id, syncStatus",
      healthConditions: "id, user_id, syncStatus",
      personalRecords: "id, user_id, exercise_id",
    });
  }
}

// Export database singleton
export const db = new PulseDatabase();
