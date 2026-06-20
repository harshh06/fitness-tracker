"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAnalytics } from "@/lib/hooks/useAnalytics";
import { useWorkouts, type WorkoutSummary } from "@/lib/hooks/useWorkouts";
import { useAuth } from "@/lib/auth-context";
import { lbsToKg } from "@/lib/units";


function formatVolume(lbs: number): string {
  if (lbs >= 1000) return `${(lbs / 1000).toFixed(1)}k`;
  return String(Math.round(lbs));
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
}

function WorkoutTypeIcon({ type }: { type: string }) {
  const iconMap: Record<string, { icon: string; bg: string; fg: string }> = {
    strength: { icon: "fitness_center", bg: "bg-primary-fixed", fg: "text-primary" },
    cardio: { icon: "directions_run", bg: "bg-tertiary-fixed", fg: "text-tertiary" },
    flexibility: { icon: "self_improvement", bg: "bg-secondary/10", fg: "text-secondary" },
    mixed: { icon: "exercise", bg: "bg-primary-fixed", fg: "text-primary" },
  };
  const { icon, bg, fg } = iconMap[type] || iconMap.strength;
  return (
    <div className={`w-12 h-12 rounded-full ${bg} flex items-center justify-center ${fg}`}>
      <span className="material-symbols-outlined">{icon}</span>
    </div>
  );
}

function RecentWorkoutCard({ workout }: { workout: WorkoutSummary }) {
  return (
    <Link
      href="/history"
      className="bg-surface-container-lowest rounded-xl p-4 shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-outline-variant/20 flex items-center justify-between active:bg-surface-container-low transition-colors"
    >
      <div className="flex items-center gap-4">
        <WorkoutTypeIcon type={workout.workout_type} />
        <div className="flex flex-col">
          <span className="font-body-lg font-medium text-on-surface">
            {workout.title || "Workout"}
          </span>
          <span className="font-label-sm text-on-surface-variant">
            {formatDate(workout.started_at)}
            {workout.duration_mins ? ` • ${workout.duration_mins} mins` : ""}
          </span>
        </div>
      </div>
      <span className="material-symbols-outlined text-outline-variant">chevron_right</span>
    </Link>
  );
}

function StatSkeleton() {
  return (
    <div className="bg-surface-container-lowest p-4 rounded-xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-outline-variant/30 flex flex-col gap-2 animate-pulse">
      <div className="h-4 w-20 bg-surface-container rounded-md" />
      <div className="h-6 w-16 bg-surface-container rounded-md" />
    </div>
  );
}

function WorkoutSkeleton() {
  return (
    <div className="bg-surface-container-lowest rounded-xl p-4 shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-outline-variant/20 flex items-center gap-4 animate-pulse">
      <div className="w-12 h-12 rounded-full bg-surface-container" />
      <div className="flex flex-col gap-2 flex-1">
        <div className="h-4 w-32 bg-surface-container rounded-md" />
        <div className="h-3 w-48 bg-surface-container rounded-md" />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { summary, isLoading: analyticsLoading } = useAnalytics(1);
  const { workouts, isLoading: workoutsLoading } = useWorkouts(5);
  const unitPreference = user?.unit_preference || "lbs";

  const volumeValue = summary
    ? (unitPreference === "kg" ? lbsToKg(summary.total_volume_lbs) : summary.total_volume_lbs)
    : 0;

  return (
    <main className="px-container-margin py-stack-space-lg flex flex-col gap-stack-space-lg pt-20 pb-32">
      {/* Greeting Section */}
      <section className="flex flex-col gap-unit">
        
        <h1 className="font-headline-lg text-headline-lg text-on-surface mt-4 align-">
          {/* {user?.display_name ? `Hey ${user.display_name}!` : "Ready to crush it?"} */}
        </h1>
      </section>

      {/* Massive CTA */}
      <section>
        <Link href="/workout">
          <Button
            size="lg"
            className="w-full min-h-[64px] rounded-[16px] shadow-[0_8px_24px_rgba(0,88,188,0.25)] flex items-center justify-center gap-3 group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out rounded-[16px]" />
            <span
              className="material-symbols-outlined text-[32px] relative z-10"
              data-weight="fill"
            >
              play_arrow
            </span>
            <span className="font-headline-md relative z-10">Start Workout</span>
          </Button>
        </Link>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-2 gap-element-gap">
        {analyticsLoading ? (
          <>
            <StatSkeleton />
            <StatSkeleton />
          </>
        ) : summary ? (
          <>
            <div className="bg-surface-container-lowest p-4 rounded-xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-outline-variant/30 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-primary">
                <span className="material-symbols-outlined text-[20px]">local_fire_department</span>
                <span className="font-label-sm uppercase">Volume</span>
              </div>
              <span className="font-headline-md text-on-surface">
                {formatVolume(volumeValue)}{" "}
                <span className="font-body-md text-on-surface-variant">{unitPreference}</span>
              </span>
            </div>
            <div className="bg-surface-container-lowest p-4 rounded-xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-outline-variant/30 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-tertiary">
                <span className="material-symbols-outlined text-[20px]">bolt</span>
                <span className="font-label-sm uppercase">Est. Calories</span>
              </div>
              <span className="font-headline-md text-on-surface">
                {summary.estimated_calories_burned.toLocaleString()}{" "}
                <span className="font-body-md text-on-surface-variant">kcal</span>
              </span>
            </div>
          </>
        ) : (
          <>
            <div className="bg-surface-container-lowest p-4 rounded-xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-outline-variant/30 flex flex-col gap-2 items-center justify-center text-center min-h-[80px]">
              <p className="font-body-md text-on-surface-variant">No data yet</p>
            </div>
            <div className="bg-surface-container-lowest p-4 rounded-xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-outline-variant/30 flex flex-col gap-2 items-center justify-center text-center min-h-[80px]">
              <p className="font-body-md text-on-surface-variant">No data yet</p>
            </div>
          </>
        )}
      </section>

      {/* Recent Activity */}
      <section className="flex flex-col gap-element-gap">
        <div className="flex items-center justify-between">
          <h3 className="font-headline-md text-on-surface">Recent Workouts</h3>
          <Link href="/history" className="font-label-lg text-primary hover:text-primary-container transition-colors">
            See All
          </Link>
        </div>
        <div className="flex flex-col gap-3">
          {workoutsLoading ? (
            <>
              <WorkoutSkeleton />
              <WorkoutSkeleton />
            </>
          ) : workouts.length > 0 ? (
            workouts.slice(0, 5).map((w) => (
              <RecentWorkoutCard key={w.id} workout={w} />
            ))
          ) : (
            <div className="bg-surface-container-lowest rounded-xl p-6 border border-outline-variant/20 text-center">
              <span className="material-symbols-outlined text-4xl text-outline mb-2">fitness_center</span>
              <p className="font-body-lg text-on-surface-variant">
                No workouts yet. Start your first one!
              </p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
