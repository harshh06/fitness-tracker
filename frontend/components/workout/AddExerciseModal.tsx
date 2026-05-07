"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface AddExerciseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (exercise: string) => void;
}

const EXERCISES = [
  "Bench Press",
  "Barbell Squat",
  "Deadlift",
  "Overhead Press",
  "Pull-ups",
  "Barbell Rows",
  "Leg Press",
  "Dumbbell Curls",
  "Tricep Extensions",
  "Lateral Raises",
  "Front Squat",
  "Lunges"
];

export function AddExerciseModal({ isOpen, onClose, onAdd }: AddExerciseModalProps) {
  const [searchQuery, setSearchQuery] = useState("");

  if (!isOpen) return null;

  const filteredExercises = EXERCISES.filter(ex => 
    ex.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center">
      {/* Backdrop */}
      <div 
        aria-hidden="true" 
        className="fixed inset-0 bg-on-surface/40 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      {/* Bottom Sheet Container */}
      <div className="relative w-full max-w-md bg-surface-container-lowest rounded-t-3xl md:rounded-3xl shadow-[0_-8px_40px_rgba(0,0,0,0.08)] flex flex-col max-h-[85vh] h-[80vh] pb-8 md:pb-0 animate-in slide-in-from-bottom-full md:slide-in-from-bottom-0 md:zoom-in-95 duration-300">
        
        {/* Drag Handle */}
        <div className="w-full flex justify-center pt-3 pb-1 md:hidden">
          <div className="w-12 h-1.5 bg-surface-variant rounded-full" />
        </div>

        {/* Header */}
        <div className="flex flex-col px-container-margin py-element-gap border-b border-surface-container gap-4">
          <div className="flex items-center justify-between">
            <h2 className="font-headline-md text-on-surface">Add Exercise</h2>
            <Button 
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-on-surface-variant hover:bg-surface-container rounded-full transition-colors"
            >
              <span className="material-symbols-outlined">close</span>
            </Button>
          </div>
          
          {/* Search Bar */}
          <div className="relative w-full">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline">search</span>
            <input 
              type="text" 
              placeholder="Search exercises..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-surface-container rounded-xl border-none text-on-surface placeholder:text-outline-variant focus:ring-2 focus:ring-primary outline-none"
            />
          </div>
        </div>

        {/* Scrollable List */}
        <div className="flex-1 overflow-y-auto px-container-margin py-stack-space-lg space-y-2">
          {filteredExercises.length === 0 ? (
            <div className="text-center text-on-surface-variant py-8">
              No exercises found matching "{searchQuery}"
            </div>
          ) : (
            filteredExercises.map((exercise) => (
              <Button 
                key={exercise}
                variant="ghost"
                onClick={() => {
                  onAdd(exercise);
                  setSearchQuery("");
                  onClose();
                }}
                className="w-full flex items-center justify-between min-h-[56px] px-4 rounded-xl bg-surface hover:bg-surface-container-high active:bg-surface-container-highest transition-all border border-transparent h-auto py-3 text-left"
              >
                <span className="font-label-lg text-on-surface">{exercise}</span>
                <span className="material-symbols-outlined text-outline">add</span>
              </Button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
