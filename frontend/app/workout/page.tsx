"use client";

import { useState } from "react";
import Link from "next/link";
import { ExerciseCard } from "@/components/workout/ExerciseCard";
import { AddExerciseModal } from "@/components/workout/AddExerciseModal";

interface ExerciseEntry {
  id: string;
  name: string;
  category?: string;
  equipment?: string;
  initialWeight: number;
  initialReps: number;
}

export default function WorkoutPage() {
  const [isAddExerciseOpen, setIsAddExerciseOpen] = useState(false);

  const [exercises, setExercises] = useState<ExerciseEntry[]>([
    { id: "ex-1", name: "Barbell Squat", category: "Legs", equipment: "Barbell", initialWeight: 135, initialReps: 10 },
    { id: "ex-2", name: "Overhead Press", category: "Shoulders", equipment: "Barbell", initialWeight: 115, initialReps: 5 },
  ]);

  const handleAddExercise = (exercise: { id: string; name: string; category?: string; equipment?: string }) => {
    setExercises([
      ...exercises,
      {
        id: exercise.id,
        name: exercise.name,
        category: exercise.category,
        equipment: exercise.equipment,
        initialWeight: 45,
        initialReps: 10,
      },
    ]);
  };

  const handleRemoveExercise = (id: string) => {
    setExercises(exercises.filter((ex) => ex.id !== id));
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen pb-[160px] bg-surface">
      <header className="sticky top-0 z-40 bg-surface/95 backdrop-blur-md px-container-margin py-4 flex items-center justify-between border-b border-surface-variant">
        <Link
          href="/dashboard"
          className="text-primary font-label-lg active:opacity-70 transition-opacity"
        >
          Cancel
        </Link>
        <span className="font-headline-md text-on-surface">Workout</span>
        <div className="w-[50px]" />
      </header>

      <main className="flex-1 overflow-y-auto px-container-margin py-stack-space-lg flex flex-col gap-stack-space-lg no-scrollbar">
        {exercises.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <span className="material-symbols-outlined text-[64px] text-outline-variant mb-4">
              fitness_center
            </span>
            <h2 className="font-headline-md text-on-surface-variant mb-2">No exercises yet</h2>
            <p className="font-body-md text-outline">Tap &quot;Add Exercise&quot; to get started.</p>
          </div>
        )}
        {exercises.map((ex) => (
          <ExerciseCard
            key={ex.id}
            exerciseName={ex.name}
            initialWeight={ex.initialWeight}
            initialReps={ex.initialReps}
            onRemove={() => handleRemoveExercise(ex.id)}
          />
        ))}
      </main>

      <footer className="fixed bottom-0 left-0 w-full bg-surface/95 backdrop-blur-md border-t border-surface-variant px-container-margin pt-4 pb-[calc(20px+env(safe-area-inset-bottom))] flex flex-col gap-unit z-50">
        <button
          onClick={() => setIsAddExerciseOpen(true)}
          className="w-full h-[64px] flex items-center justify-center rounded-xl border-[2px] border-primary text-primary font-label-lg uppercase tracking-widest active:bg-primary/10 transition-colors"
        >
          <span className="material-symbols-outlined mr-2">add_circle</span>
          Add Exercise
        </button>
        <Link
          href="/dashboard"
          className="w-full h-[64px] flex items-center justify-center rounded-xl bg-primary text-on-primary font-label-lg uppercase tracking-widest shadow-[0_8px_16px_rgba(0,88,188,0.2)] active:scale-[0.98] transition-transform"
        >
          Save Workout
        </Link>
      </footer>

      <AddExerciseModal
        isOpen={isAddExerciseOpen}
        onClose={() => setIsAddExerciseOpen(false)}
        onAdd={handleAddExercise}
      />
    </div>
  );
}
