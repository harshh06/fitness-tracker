"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useWorkouts, useWorkout, type WorkoutSummary } from "@/lib/hooks/useWorkouts";
import { useAuth } from "@/lib/auth-context";
import { formatWeight } from "@/lib/units";

// ── Helpers ───────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function workoutIcon(type: string): string {
  const map: Record<string, string> = {
    strength: "fitness_center",
    cardio: "directions_run",
    flexibility: "self_improvement",
    mixed: "exercise",
  };
  return map[type] || "fitness_center";
}

// ── Workout Card ──────────────────────────────────────────────

function WorkoutCard({
  workout,
  defaultExpanded = false,
}: {
  workout: WorkoutSummary;
  defaultExpanded?: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const { workout: detail, isLoading } = useWorkout(isExpanded ? workout.id : null);
  const { user } = useAuth();
  const unitPreference = user?.unit_preference || "lbs";

  return (
    <article className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/30 overflow-hidden">
      {/* Card Header */}
      <Button
        variant="ghost"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex justify-between items-center h-auto rounded-none cursor-pointer"
      >
        <div className="flex items-center gap-4 text-left">
          <div
            className={cn(
              "w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0",
              isExpanded
                ? "bg-primary/10 text-primary"
                : "bg-surface-container text-on-surface-variant"
            )}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              {workoutIcon(workout.workout_type)}
            </span>
          </div>
          <div>
            <h2 className="font-headline-md text-on-surface text-base mb-1">
              {formatDate(workout.started_at)}
            </h2>
            <p className="font-body-md text-on-surface-variant text-sm">
              {workout.title || "Workout"}
              {workout.duration_mins ? ` • ${workout.duration_mins} mins` : ""}
            </p>
          </div>
        </div>
        <span
          className={cn(
            "material-symbols-outlined text-outline transition-transform duration-200",
            isExpanded && "rotate-180"
          )}
        >
          expand_more
        </span>
      </Button>

      {/* Expanded detail — shows metadata */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-2 border-t border-outline-variant/20 bg-surface-container-low/50">
          <div className="flex flex-col gap-2">
            <div className="flex justify-between text-sm mb-2">
              <span className="font-body-md text-on-surface-variant">Type</span>
              <span className="font-body-md text-on-surface font-medium capitalize">
                {workout.workout_type}
              </span>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
              </div>
            ) : detail && detail.exercises && detail.exercises.length > 0 ? (
              <div className="flex flex-col gap-4 mt-2 pt-2 border-t border-outline-variant/10">
                {detail.exercises.map((exercise) => (
                  <div key={exercise.id}>
                    <div className="flex justify-between items-center mb-1">
                      <h3 className="font-label-lg text-on-surface font-semibold">{exercise.exercise_name}</h3>
                      <span className="font-label-sm text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-md text-xs">
                        {exercise.sets.length} Set{exercise.sets.length > 1 ? "s" : ""}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1 pl-2 border-l-2 border-outline-variant/30">
                      {exercise.sets.map((set) => (
                        <div key={set.id} className="flex justify-between text-sm py-0.5">
                          <span className="font-body-md text-on-surface-variant">Set {set.set_number}</span>
                          <span className="font-body-md text-on-surface font-medium">
                            {formatWeight(set.weight_lbs || 0, unitPreference)} {unitPreference} × {set.reps}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

            {workout.rating && (
              <div className="flex justify-between text-sm mt-2">
                <span className="font-body-md text-on-surface-variant">Rating</span>
                <span className="font-body-md text-on-surface font-medium">
                  {"⭐".repeat(workout.rating)}
                </span>
              </div>
            )}
            {workout.notes && (
              <div className="flex flex-col gap-1 mt-2">
                <span className="font-label-sm text-on-surface-variant uppercase text-xs">Notes</span>
                <p className="font-body-md text-on-surface text-sm">{workout.notes}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </article>
  );
}

// ── Skeleton ──────────────────────────────────────────────────

function CardSkeleton() {
  return (
    <div className="bg-surface-container-lowest rounded-xl p-4 border border-outline-variant/30 flex items-center gap-4 animate-pulse">
      <div className="w-12 h-12 rounded-lg bg-surface-container flex-shrink-0" />
      <div className="flex flex-col gap-2 flex-1">
        <div className="h-4 w-40 bg-surface-container rounded-md" />
        <div className="h-3 w-56 bg-surface-container rounded-md" />
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────

export default function HistoryPage() {
  const { workouts, isLoading, hasMore, loadMore } = useWorkouts(20);

  return (
    <main className="flex-1 w-full max-w-2xl mx-auto px-container-margin pt-24 pb-32">
      <div className="mb-8">
        <h1 className="font-headline-lg text-on-surface mb-2">History</h1>
        <p className="font-body-md text-on-surface-variant">Review your past performance.</p>
      </div>

      <div className="flex flex-col gap-element-gap">
        {isLoading && workouts.length === 0 ? (
          <>
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </>
        ) : workouts.length > 0 ? (
          <>
            {workouts.map((w, idx) => (
              <WorkoutCard key={w.id} workout={w} defaultExpanded={idx === 0} />
            ))}
            {hasMore && (
              <Button
                variant="outline"
                size="lg"
                className="w-full"
                onClick={loadMore}
                disabled={isLoading}
              >
                {isLoading ? "Loading..." : "Load More"}
              </Button>
            )}
          </>
        ) : (
          <div className="bg-surface-container-lowest rounded-xl p-8 border border-outline-variant/20 text-center">
            <span className="material-symbols-outlined text-5xl text-outline mb-3">
              history
            </span>
            <p className="font-body-lg text-on-surface-variant">
              No workout history yet. Complete your first workout to see it here!
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
