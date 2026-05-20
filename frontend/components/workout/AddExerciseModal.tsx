"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface Exercise {
  id: string;
  name: string;
  category: string;
  equipment: string;
  icon: string;
}

interface AddExerciseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (exercise: { id: string; name: string; category?: string; equipment?: string }) => void;
}

const EXERCISES: Exercise[] = [
  { id: "ex-squat", name: "Barbell Squat", category: "Legs", equipment: "Barbell", icon: "fitness_center" },
  { id: "ex-rdl", name: "Romanian Deadlift", category: "Legs", equipment: "Barbell", icon: "fitness_center" },
  { id: "ex-legpress", name: "Leg Press", category: "Legs", equipment: "Machine", icon: "accessibility_new" },
  { id: "ex-lunges", name: "Walking Lunges", category: "Legs", equipment: "Dumbbell", icon: "accessibility_new" },
  { id: "ex-calf", name: "Calf Raises", category: "Legs", equipment: "Bodyweight", icon: "accessibility_new" },
  { id: "ex-bss", name: "Bulgarian Split Squat", category: "Legs", equipment: "Dumbbell", icon: "fitness_center" },
  { id: "ex-bench", name: "Bench Press", category: "Chest", equipment: "Barbell", icon: "fitness_center" },
  { id: "ex-ohp", name: "Overhead Press", category: "Shoulders", equipment: "Barbell", icon: "fitness_center" },
  { id: "ex-pullups", name: "Pull-ups", category: "Back", equipment: "Bodyweight", icon: "fitness_center" },
  { id: "ex-rows", name: "Barbell Rows", category: "Back", equipment: "Barbell", icon: "fitness_center" },
  { id: "ex-curls", name: "Dumbbell Curls", category: "Arms", equipment: "Dumbbell", icon: "fitness_center" },
  { id: "ex-tricep", name: "Tricep Extensions", category: "Arms", equipment: "Cable", icon: "fitness_center" },
];

const CATEGORIES = ["All", "Legs", "Chest", "Back", "Shoulders", "Arms"];

export function AddExerciseModal({ isOpen, onClose, onAdd }: AddExerciseModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  if (!isOpen) return null;

  const filteredExercises = EXERCISES.filter((ex) => {
    const matchesSearch = ex.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === "All" || ex.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center">
      {/* Backdrop */}
      <div
        aria-hidden="true"
        className="fixed inset-0 bg-on-surface/40 backdrop-blur-[2px] transition-opacity"
        onClick={onClose}
      />

      {/* Bottom Sheet Container */}
      <div className="relative w-full max-w-md bg-surface rounded-t-[24px] md:rounded-[24px] shadow-[0_-8px_30px_rgba(0,0,0,0.12)] flex flex-col max-h-[85vh] h-[80vh] overflow-hidden animate-in slide-in-from-bottom-full md:slide-in-from-bottom-0 md:zoom-in-95 duration-300">
        {/* Drag Handle */}
        <div className="w-full flex justify-center py-4 shrink-0 bg-surface z-20 md:hidden">
          <div className="w-12 h-1.5 bg-outline-variant/50 rounded-full" />
        </div>

        {/* Header + Search */}
        <div className="sticky top-0 bg-surface z-10 px-container-margin pb-4 shrink-0">
          <div className="flex items-center justify-between mb-element-gap">
            <h2 className="font-headline-md text-on-surface">Add Exercise</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-container-low hover:bg-surface-variant transition-colors text-on-surface"
            >
              <span className="material-symbols-outlined">close</span>
            </Button>
          </div>

          {/* Search Bar */}
          <div className="relative w-full">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">
              search
            </span>
            <input
              type="text"
              placeholder="Search exercises..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface-container-low text-on-surface rounded-xl py-3.5 pl-12 pr-4 border-none focus:ring-2 focus:ring-primary focus:bg-surface outline-none transition-all placeholder:text-outline-variant"
            />
          </div>
        </div>

        {/* Category Chips */}
        <div className="w-full overflow-x-auto no-scrollbar px-container-margin py-2 mb-2 shrink-0 bg-surface sticky top-0 z-10">
          <div className="flex gap-2 w-max">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-5 py-2.5 rounded-full font-label-lg whitespace-nowrap transition-colors ${
                  activeCategory === cat
                    ? "bg-primary text-on-primary shadow-sm"
                    : "bg-surface-container-low text-on-surface hover:bg-surface-variant border border-outline-variant/30"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable Exercise List */}
        <div className="flex-1 overflow-y-auto no-scrollbar relative flex flex-col">
          <div className="flex flex-col pb-8">
            {filteredExercises.length === 0 ? (
              <div className="text-center text-on-surface-variant py-8">
                No exercises found matching &quot;{searchQuery}&quot;
              </div>
            ) : (
              filteredExercises.map((exercise) => (
                <button
                  key={exercise.id}
                  onClick={() => {
                    onAdd({
                      id: exercise.id + "-" + Date.now(),
                      name: exercise.name,
                      category: exercise.category,
                      equipment: exercise.equipment,
                    });
                    setSearchQuery("");
                    onClose();
                  }}
                  className="w-full flex items-center justify-between px-container-margin py-4 border-b border-surface-variant/50 hover:bg-surface-container-low transition-colors group text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center group-hover:bg-primary/10 transition-colors shrink-0">
                      <span
                        className="material-symbols-outlined text-outline group-hover:text-primary transition-colors"
                        style={{ fontVariationSettings: "'FILL' 0, 'wght' 300" }}
                      >
                        {exercise.icon}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-body-lg text-on-surface font-semibold tracking-tight">
                        {exercise.name}
                      </span>
                      <span className="font-body-md text-on-surface-variant opacity-80">
                        {exercise.category} • {exercise.equipment}
                      </span>
                    </div>
                  </div>
                  <span
                    className="material-symbols-outlined text-outline-variant group-hover:text-primary transition-colors"
                    style={{ fontVariationSettings: "'FILL' 1, 'wght' 400" }}
                  >
                    add_circle
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
