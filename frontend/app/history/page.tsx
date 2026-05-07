"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface WorkoutSet {
  weight: number;
  reps: number;
}

interface Exercise {
  name: string;
  sets: WorkoutSet[];
}

interface WorkoutEntry {
  date: string;
  title: string;
  duration: string;
  icon: string;
  exercises?: Exercise[];
}

const MOCK_HISTORY: WorkoutEntry[] = [
  {
    date: "April 20, 2026",
    title: "Upper Body Power",
    duration: "65 mins",
    icon: "fitness_center",
    exercises: [
      {
        name: "Barbell Bench Press",
        sets: [
          { weight: 135, reps: 10 },
          { weight: 185, reps: 8 },
          { weight: 205, reps: 5 },
        ],
      },
      {
        name: "Incline Dumbbell Press",
        sets: [
          { weight: 60, reps: 10 },
          { weight: 70, reps: 8 },
          { weight: 70, reps: 8 },
        ],
      },
    ],
  },
  {
    date: "April 18, 2026",
    title: "Outdoor Run • 3.2 mi",
    duration: "28 mins",
    icon: "directions_run",
  },
  {
    date: "April 16, 2026",
    title: "Lower Body Strength • 4 Exercises",
    duration: "45 mins",
    icon: "fitness_center",
  },
  {
    date: "April 14, 2026",
    title: "Swim Intervals • 40 Laps",
    duration: "35 mins",
    icon: "pool",
  },
];

function WorkoutCard({ entry, defaultExpanded = false }: { entry: WorkoutEntry; defaultExpanded?: boolean }) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const hasExercises = entry.exercises && entry.exercises.length > 0;

  return (
    <article className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/30 overflow-hidden">
      {/* Card Header (always visible) */}
      <Button
        variant="ghost"
        onClick={() => hasExercises && setIsExpanded(!isExpanded)}
        className={cn(
          "w-full p-4 flex justify-between items-center h-auto rounded-none",
          hasExercises && "cursor-pointer"
        )}
      >
        <div className="flex items-center gap-4 text-left">
          <div
            className={cn(
              "w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0",
              isExpanded ? "bg-primary/10 text-primary" : "bg-surface-container text-on-surface-variant"
            )}
          >
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
              {entry.icon}
            </span>
          </div>
          <div>
            <h2 className="font-headline-md text-on-surface text-base mb-1">{entry.date}</h2>
            <p className="font-body-md text-on-surface-variant text-sm">
              {entry.title} • {entry.duration}
            </p>
          </div>
        </div>
        {hasExercises && (
          <span
            className={cn(
              "material-symbols-outlined text-outline transition-transform duration-200",
              isExpanded && "rotate-180"
            )}
          >
            expand_more
          </span>
        )}
      </Button>

      {/* Expanded Content */}
      {isExpanded && hasExercises && (
        <div className="px-4 pb-4 pt-2 border-t border-outline-variant/20 bg-surface-container-low/50">
          <div className="flex flex-col gap-4">
            {entry.exercises!.map((exercise) => (
              <div key={exercise.name}>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-label-lg text-on-surface">{exercise.name}</h3>
                  <span className="font-label-sm text-on-surface-variant bg-surface-container px-2 py-1 rounded-md">
                    {exercise.sets.length} Sets
                  </span>
                </div>
                <div className="flex flex-col gap-1 pl-2 border-l-2 border-outline-variant/30">
                  {exercise.sets.map((set, idx) => (
                    <div key={idx} className="flex justify-between text-sm py-1">
                      <span className="font-body-md text-on-surface-variant">Set {idx + 1}</span>
                      <span className="font-body-md text-on-surface font-medium">
                        {set.weight} lbs × {set.reps}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}

export default function HistoryPage() {
  return (
    <main className="flex-1 w-full max-w-2xl mx-auto px-container-margin pt-24 pb-32">
      <div className="mb-8">
        <h1 className="font-headline-lg text-on-surface mb-2">History</h1>
        <p className="font-body-md text-on-surface-variant">Review your past performance.</p>
      </div>

      <div className="flex flex-col gap-element-gap">
        {MOCK_HISTORY.map((entry, idx) => (
          <WorkoutCard key={entry.date} entry={entry} defaultExpanded={idx === 0} />
        ))}
      </div>
    </main>
  );
}
