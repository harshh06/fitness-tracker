"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ExerciseCard } from "@/components/workout/ExerciseCard";
import { DateSelectionModal } from "@/components/workout/DateSelectionModal";
import { FullCalendarModal } from "@/components/workout/FullCalendarModal";
import { AddExerciseModal } from "@/components/workout/AddExerciseModal";
import { api } from "@/lib/api";
import type { ExerciseSearchResult } from "@/lib/hooks/useExerciseSearch";
import { useAuth } from "@/lib/auth-context";
import { kgToLbs } from "@/lib/units";

interface LocalSet {
  set_number: number;
  weight: number;
  reps: number;
  duration_seconds?: number;
}

interface LocalExercise {
  exercise_id: string;
  name: string;
  category: string;
  sets: LocalSet[];
}

export default function WorkoutPage() {
  const router = useRouter();
  const { user } = useAuth();
  const unitPreference = user?.unit_preference || "lbs";

  const [isDateModalOpen, setIsDateModalOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isAddExerciseOpen, setIsAddExerciseOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [selectedDate, setSelectedDate] = useState("Today");
  
  const [exercises, setExercises] = useState<LocalExercise[]>([]);

  const handleAddExercise = (exercise: ExerciseSearchResult) => {
    setExercises((prev) => [
      ...prev,
      {
        exercise_id: exercise.id,
        name: exercise.name,
        category: exercise.category,
        sets: [
          {
            set_number: 1,
            weight: exercise.category === "cardio" ? 0 : (unitPreference === "kg" ? 20 : 45),
            reps: exercise.category === "cardio" ? 0 : 10,
            duration_seconds: exercise.category === "cardio" ? 60 : undefined,
          },
        ],
      },
    ]);
  };

  const handleUpdateSet = (exerciseIndex: number, setIndex: number, fields: Partial<LocalSet>) => {
    setExercises((prev) =>
      prev.map((ex, exIdx) => {
        if (exIdx !== exerciseIndex) return ex;
        const newSets = ex.sets.map((set, sIdx) =>
          sIdx === setIndex ? { ...set, ...fields } : set
        );
        return { ...ex, sets: newSets };
      })
    );
  };

  const handleAddSet = (exerciseIndex: number) => {
    setExercises((prev) =>
      prev.map((ex, exIdx) => {
        if (exIdx !== exerciseIndex) return ex;
        const lastSet = ex.sets[ex.sets.length - 1];
        const newSet: LocalSet = {
          set_number: ex.sets.length + 1,
          weight: lastSet ? lastSet.weight : (ex.category === "cardio" ? 0 : (unitPreference === "kg" ? 20 : 45)),
          reps: lastSet ? lastSet.reps : (ex.category === "cardio" ? 0 : 10),
          duration_seconds: lastSet ? lastSet.duration_seconds : (ex.category === "cardio" ? 60 : undefined),
        };
        return { ...ex, sets: [...ex.sets, newSet] };
      })
    );
  };

  const handleRemoveSet = (exerciseIndex: number, setIndex: number) => {
    setExercises((prev) =>
      prev.map((ex, exIdx) => {
        if (exIdx !== exerciseIndex) return ex;
        const filteredSets = ex.sets.filter((_, sIdx) => sIdx !== setIndex);
        const renumberedSets = filteredSets.map((set, sIdx) => ({
          ...set,
          set_number: sIdx + 1,
        }));
        return { ...ex, sets: renumberedSets };
      })
    );
  };

  const handleRemoveExercise = (exerciseIndex: number) => {
    setExercises((prev) => prev.filter((_, idx) => idx !== exerciseIndex));
  };

  const handleSaveWorkout = async () => {
    if (exercises.length === 0) return;

    setIsSaving(true);
    try {
      // Determine workout type dynamically based on exercise categories
      const categories = new Set(
        exercises.map((ex) => {
          const cat = ex.category?.toLowerCase();
          if (cat === "rehab") return "flexibility";
          return cat;
        })
      );
      let workoutType = "strength";
      if (categories.size === 1) {
        const singleCat = Array.from(categories)[0];
        if (singleCat === "cardio" || singleCat === "flexibility" || singleCat === "strength") {
          workoutType = singleCat;
        }
      } else if (categories.size > 1) {
        workoutType = "mixed";
      }

      const payload = {
        title: `Workout — ${selectedDate}`,
        workout_type: workoutType,
        exercises: exercises.map((ex, exIdx) => ({
          exercise_id: ex.exercise_id,
          sort_order: exIdx + 1,
          sets: ex.sets.map((s) => ({
            set_number: s.set_number,
            set_type: "working",
            weight_lbs: ex.category === "cardio"
              ? null
              : (unitPreference === "kg" ? kgToLbs(s.weight) : s.weight),
            reps: ex.category === "cardio" ? null : s.reps,
            duration_seconds: ex.category === "cardio" ? s.duration_seconds : null,
            is_completed: true,
          })),
        })),
      };

      await api.post("/workouts", payload);

      router.push("/dashboard");
    } catch (err) {
      console.error("Failed to save workout:", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen pb-[160px] bg-surface">
      <header className="sticky top-0 z-40 bg-surface/95 backdrop-blur-md px-container-margin py-4 flex items-center justify-between border-b border-surface-variant">
        <Link href="/dashboard" className="text-primary font-label-lg active:opacity-70 transition-opacity">
          Cancel
        </Link>
        <button 
          onClick={() => setIsDateModalOpen(true)}
          className="flex items-center gap-1 cursor-pointer active:opacity-70 transition-opacity min-h-[44px] px-2 rounded-lg hover:bg-surface-container"
        >
          <span className="font-headline-md text-on-surface">{selectedDate}</span>
          <span className="material-symbols-outlined text-outline" data-weight="fill">expand_more</span>
        </button>
        <div className="w-[50px]"></div>
      </header>
 
      <main className="flex-1 overflow-y-auto px-container-margin py-stack-space-lg flex flex-col gap-stack-space-lg no-scrollbar">
        {exercises.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 gap-4 py-16 text-center">
            <span className="material-symbols-outlined text-5xl text-outline">fitness_center</span>
            <p className="font-body-lg text-on-surface-variant">
              Add exercises to start your workout
            </p>
          </div>
        ) : (
          exercises.map((ex, idx) => (
            <ExerciseCard
              key={idx}
              exerciseName={ex.name}
              category={ex.category}
              sets={ex.sets}
              onUpdateSet={(setIdx, fields) => handleUpdateSet(idx, setIdx, fields)}
              onAddSet={() => handleAddSet(idx)}
              onRemoveSet={(setIdx) => handleRemoveSet(idx, setIdx)}
              onRemoveExercise={() => handleRemoveExercise(idx)}
              weightUnit={unitPreference}
            />
          ))
        )}
      </main>


      <footer className="fixed bottom-0 left-0 w-full bg-surface/95 backdrop-blur-md border-t border-surface-variant px-container-margin pt-4 pb-[calc(20px+env(safe-area-inset-bottom))] flex flex-col gap-unit z-50">
        <button 
          onClick={() => setIsAddExerciseOpen(true)}
          className="w-full h-[64px] flex items-center justify-center rounded-xl border-[2px] border-primary text-primary font-label-lg uppercase tracking-widest active:bg-primary/10 transition-colors"
        >
          <span className="material-symbols-outlined mr-2">add_circle</span>
          Add Exercise
        </button>
        <button
          onClick={handleSaveWorkout}
          disabled={isSaving || exercises.length === 0}
          className="w-full h-[64px] flex items-center justify-center rounded-xl bg-primary text-on-primary font-label-lg uppercase tracking-widest shadow-[0_8px_16px_rgba(0,88,188,0.2)] active:scale-[0.98] transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? (
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Saving...
            </div>
          ) : (
            "Save Workout"
          )}
        </button>
      </footer>

      <DateSelectionModal 
        isOpen={isDateModalOpen} 
        currentDate={selectedDate}
        onClose={() => setIsDateModalOpen(false)} 
        onSelectDate={(date) => setSelectedDate(date)}
        onOpenCalendar={() => {
          setIsDateModalOpen(false);
          setIsCalendarOpen(true);
        }}
      />

      <FullCalendarModal 
        isOpen={isCalendarOpen}
        onClose={() => setIsCalendarOpen(false)}
        onSelectDate={(dateLabel) => {
          setSelectedDate(dateLabel);
          setIsCalendarOpen(false);
        }}
      />

      <AddExerciseModal 
        isOpen={isAddExerciseOpen}
        onClose={() => setIsAddExerciseOpen(false)}
        onAdd={handleAddExercise}
      />
    </div>
  );
}
