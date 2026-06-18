import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";

// ── Types ─────────────────────────────────────────────────────

export interface WorkoutSummary {
  id: string;
  user_id: string;
  started_at: string;
  completed_at: string | null;
  title: string | null;
  workout_type: string;
  notes: string | null;
  rating: number | null;
  energy_level: number | null;
  pain_notes: string | null;
  duration_mins: number | null;
  is_deleted: boolean;
  created_at: string;
  exercise_count?: number;
}

export interface WorkoutSet {
  id: string;
  workout_exercise_id: string;
  set_number: number;
  set_type: string;
  weight_lbs: number | null;
  reps: number | null;
  duration_seconds: number | null;
  distance_meters: number | null;
  is_completed: boolean;
  rpe: number | null;
}

export interface WorkoutExercise {
  id: string;
  workout_id: string;
  exercise_id: string;
  sort_order: number;
  notes: string | null;
  rest_seconds: number;
  exercise_name: string;
  sets: WorkoutSet[];
}

export interface WorkoutDetail {
  id: string;
  user_id: string;
  started_at: string;
  completed_at: string | null;
  title: string | null;
  workout_type: string;
  notes: string | null;
  rating: number | null;
  energy_level: number | null;
  pain_notes: string | null;
  duration_mins: number | null;
  is_deleted: boolean;
  created_at: string;
  exercises: WorkoutExercise[];
}

// ── useWorkouts (list with pagination) ────────────────────────

export function useWorkouts(pageSize: number = 20) {
  const [workouts, setWorkouts] = useState<WorkoutSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const fetchWorkouts = useCallback(
    async (reset: boolean = false) => {
      try {
        setIsLoading(true);
        setError(null);
        const currentOffset = reset ? 0 : offset;
        const data = await api.get<WorkoutSummary[]>("/workouts", {
          params: { limit: pageSize, offset: currentOffset },
        });

        if (reset) {
          setWorkouts(data);
          setOffset(data.length);
        } else {
          setWorkouts((prev) => [...prev, ...data]);
          setOffset((prev) => prev + data.length);
        }

        setHasMore(data.length === pageSize);
      } catch (err: any) {
        setError(err?.detail || "Failed to load workouts");
      } finally {
        setIsLoading(false);
      }
    },
    [offset, pageSize]
  );

  // Initial load
  useEffect(() => {
    fetchWorkouts(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadMore = () => {
    if (!isLoading && hasMore) {
      fetchWorkouts(false);
    }
  };

  const refetch = () => fetchWorkouts(true);

  return { workouts, isLoading, error, hasMore, loadMore, refetch };
}

// ── useWorkout (single workout detail) ────────────────────────

export function useWorkout(workoutId: string | null) {
  const [workout, setWorkout] = useState<WorkoutDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!workoutId) {
      setIsLoading(false);
      return;
    }

    const fetchWorkout = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await api.get<WorkoutDetail>(`/workouts/${workoutId}`);
        setWorkout(data);
      } catch (err: any) {
        setError(err?.detail || "Failed to load workout");
      } finally {
        setIsLoading(false);
      }
    };

    fetchWorkout();
  }, [workoutId]);

  return { workout, isLoading, error };
}
