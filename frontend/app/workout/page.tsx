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

interface LocalExercise {
  exercise_id: string;
  name: string;
  weight: number;
  reps: number;
}

export default function WorkoutPage() {
  const router = useRouter();
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
        weight: 45,
        reps: 10,
      },
    ]);
  };

  const handleUpdateExercise = (index: number, weight: number, reps: number) => {
    setExercises((prev) =>
      prev.map((ex, idx) => (idx === index ? { ...ex, weight, reps } : ex))
    );
  };

  const handleSaveWorkout = async () => {
    if (exercises.length === 0) return;

    setIsSaving(true);
    try {
      // 1. Create the workout session
      const workout = await api.post<{ id: string }>("/workouts", {
        title: `Workout — ${selectedDate}`,
        workout_type: "strength",
      });

      // 2. Add each exercise to the workout
      for (let i = 0; i < exercises.length; i++) {
        const ex = exercises[i];
        const workoutExercise = await api.post<{ id: string }>(
          `/workouts/${workout.id}/exercises`,
          {
            exercise_id: ex.exercise_id,
            sort_order: i + 1,
          }
        );

        // 3. Add a default working set for each exercise
        await api.post(
          `/workouts/${workout.id}/exercises/${workoutExercise.id}/sets`,
          {
            set_number: 1,
            set_type: "working",
            weight_lbs: ex.weight,
            reps: ex.reps,
            is_completed: true,
          }
        );
      }

      // 4. Mark the workout as completed
      await api.put(`/workouts/${workout.id}/complete`);

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
              weight={ex.weight}
              reps={ex.reps}
              onChange={(weight, reps) => handleUpdateExercise(idx, weight, reps)}
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
