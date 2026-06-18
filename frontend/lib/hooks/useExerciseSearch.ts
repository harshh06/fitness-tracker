import { useState, useEffect, useRef } from "react";
import { api } from "@/lib/api";

// ── Types ─────────────────────────────────────────────────────

export interface ExerciseSearchResult {
  id: string;
  name: string;
  category: string;
  equipment: string;
  difficulty: string;
  instructions: string | null;
  is_compound: boolean;
  is_system: boolean;
  created_by: string | null;
  created_at: string;
}

// ── Hook ──────────────────────────────────────────────────────

export function useExerciseSearch(debounceMs: number = 300) {
  const [query, setQuery] = useState("");
  const [muscleGroup, setMuscleGroup] = useState("");
  const [equipment, setEquipment] = useState("");
  const [results, setResults] = useState<ExerciseSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Clear previous timer
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Don't search if all filters are empty
    if (!query && !muscleGroup && !equipment) {
      setResults([]);
      return;
    }

    timeoutRef.current = setTimeout(async () => {
      try {
        setIsLoading(true);
        setError(null);

        const params: Record<string, string> = {};
        if (query) params.q = query;
        if (muscleGroup) params.muscle_group = muscleGroup;
        if (equipment) params.equipment = equipment;

        const data = await api.get<ExerciseSearchResult[]>("/exercises/search", {
          params,
        });
        setResults(data);
      } catch (err: any) {
        setError(err?.detail || "Failed to search exercises");
      } finally {
        setIsLoading(false);
      }
    }, debounceMs);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [query, muscleGroup, equipment, debounceMs]);

  return {
    query,
    setQuery,
    muscleGroup,
    setMuscleGroup,
    equipment,
    setEquipment,
    results,
    isLoading,
    error,
  };
}
