import { useState, useMemo } from "react";
import { useAuth, type ExerciseSearchResult } from "@/lib/auth-context";
import Fuse from "fuse.js";

export type { ExerciseSearchResult };

export function useExerciseSearch() {
  const { exercises, isLoadingData } = useAuth();
  const [query, setQuery] = useState("");
  const [muscleGroup, setMuscleGroup] = useState("");
  const [equipment, setEquipment] = useState("");

  const fuse = useMemo(() => {
    return new Fuse(exercises, {
      keys: [
        { name: "name", weight: 0.6 },
        { name: "muscles", weight: 0.3 },
        { name: "category", weight: 0.1 },
        { name: "equipment", weight: 0.1 },
      ],
      threshold: 0.4,
      ignoreLocation: true,
    });
  }, [exercises]);

  const results = useMemo(() => {
    if (!query && !muscleGroup && !equipment) {
      return [];
    }

    let filtered = exercises;

    // Apply strict filters first if set
    if (muscleGroup) {
      filtered = filtered.filter((e) =>
        e.muscles?.some((m) => m.toLowerCase() === muscleGroup.toLowerCase())
      );
    }
    if (equipment) {
      filtered = filtered.filter((e) =>
        e.equipment?.toLowerCase() === equipment.toLowerCase()
      );
    }

    if (query) {
      const searchResults = fuse.search(query);
      return searchResults.map((r) => r.item).filter((item) => filtered.includes(item));
    }

    return filtered;
  }, [query, muscleGroup, equipment, exercises, fuse]);

  return {
    query,
    setQuery,
    muscleGroup,
    setMuscleGroup,
    equipment,
    setEquipment,
    results,
    isLoading: isLoadingData,
    error: null,
  };
}
