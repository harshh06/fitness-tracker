import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";

// ── Types ─────────────────────────────────────────────────────

interface WeeklyWorkout {
  week: string;
  count: number;
}

interface MuscleGroupStat {
  muscle_group: string;
  total_sets: number;
}

export interface AnalyticsSummary {
  months: number;
  total_workouts: number;
  total_volume_lbs: number;
  total_duration_mins: number;
  estimated_calories_burned: number;
  workouts_per_week: WeeklyWorkout[];
  top_muscle_groups: MuscleGroupStat[];
}

// ── Hook ──────────────────────────────────────────────────────

export function useAnalytics(months: number = 1) {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await api.get<AnalyticsSummary>("/analytics/summary", {
        params: { months },
      });
      setSummary(data);
    } catch (err: any) {
      setError(err?.detail || "Failed to load analytics");
    } finally {
      setIsLoading(false);
    }
  }, [months]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return { summary, isLoading, error, refetch: fetchSummary };
}
