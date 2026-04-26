"use client";

import { useState } from "react";
import Link from "next/link";
import { ExerciseCard } from "@/components/workout/ExerciseCard";
import { DateSelectionModal } from "@/components/workout/DateSelectionModal";
import { FullCalendarModal } from "@/components/workout/FullCalendarModal";
import { AddExerciseModal } from "@/components/workout/AddExerciseModal";

export default function WorkoutPage() {
  const [isDateModalOpen, setIsDateModalOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isAddExerciseOpen, setIsAddExerciseOpen] = useState(false);
  
  const [selectedDate, setSelectedDate] = useState("Today");
  
  const [exercises, setExercises] = useState([
    { name: "Barbell Squat", initialWeight: 135, initialReps: 10 },
    { name: "Overhead Press", initialWeight: 115, initialReps: 5 }
  ]);

  return (
    <div className="flex-1 flex flex-col min-h-screen pb-[160px] bg-surface">
      <header className="sticky top-0 z-40 bg-surface/95 backdrop-blur-md px-container-margin py-4 flex items-center justify-between border-b border-surface-variant">
        <Link href="/dashboard" onClick={() => console.log("cancel")} className="text-primary font-label-lg active:opacity-70 transition-opacity">
          Cancel
        </Link>
        <button 
          onClick={() => {
            console.log("open date modal");
            setIsDateModalOpen(true)
          }}
          className="flex items-center gap-1 cursor-pointer active:opacity-70 transition-opacity min-h-[44px] px-2 rounded-lg hover:bg-surface-container"
        >
          <span className="font-headline-md text-on-surface">{selectedDate}</span>
          <span className="material-symbols-outlined text-outline" data-weight="fill">expand_more</span>
        </button>
        <div className="w-[50px]"></div>
      </header>

      <main className="flex-1 overflow-y-auto px-container-margin py-stack-space-lg flex flex-col gap-stack-space-lg no-scrollbar">
        {exercises.map((ex, idx) => (
          <ExerciseCard key={idx} exerciseName={ex.name} initialWeight={ex.initialWeight} initialReps={ex.initialReps} />
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
        <Link href="/dashboard" className="w-full h-[64px] flex items-center justify-center rounded-xl bg-primary text-on-primary font-label-lg uppercase tracking-widest shadow-[0_8px_16px_rgba(0,88,188,0.2)] active:scale-[0.98] transition-transform">
          Save Workout
        </Link>
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
        onAdd={(name) => setExercises([...exercises, { name, initialWeight: 45, initialReps: 10 }])}
      />
    </div>
  );
}

