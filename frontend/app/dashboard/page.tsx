import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  return (
    <main className="px-container-margin py-stack-space-lg flex flex-col gap-stack-space-lg pt-20 pb-32">
      {/* Greeting Section */}
      <section className="flex flex-col gap-unit">
        <h2 className="font-label-lg text-on-surface-variant uppercase tracking-wider">
          Today&apos;s Focus
        </h2>
        <h1 className="font-headline-lg text-headline-lg text-on-surface">Ready to crush it?</h1>
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

      {/* Minimal Data Snippets (Bento-ish) */}
      <section className="grid grid-cols-2 gap-element-gap">
        <div className="bg-surface-container-lowest p-4 rounded-xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-outline-variant/30 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-primary">
            <span className="material-symbols-outlined text-[20px]">fitness_center</span>
            <span className="font-label-sm uppercase">Weekly Volume</span>
          </div>
          <span className="font-headline-md text-on-surface">
            15,200 <span className="font-body-md text-on-surface-variant">lbs</span>
          </span>
        </div>
        <div className="bg-surface-container-lowest p-4 rounded-xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-outline-variant/30 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-primary">
            <span className="material-symbols-outlined text-[20px]">timer</span>
            <span className="font-label-sm uppercase">Active Time</span>
          </div>
          <span className="font-headline-md text-on-surface">4h 15m</span>
        </div>
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
          {/* Card 1 */}
          <Link
            href="/history"
            className="bg-surface-container-lowest rounded-xl p-4 shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-outline-variant/20 flex items-center justify-between active:bg-surface-container-low transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary-fixed flex items-center justify-center text-primary">
                <span className="material-symbols-outlined">fitness_center</span>
              </div>
              <div className="flex flex-col">
                <span className="font-body-lg font-medium text-on-surface">Upper Body Power</span>
                <span className="font-label-sm text-on-surface-variant">Tuesday • 45 mins • 15,200 lbs</span>
              </div>
            </div>
            <span className="material-symbols-outlined text-outline-variant">chevron_right</span>
          </Link>
          {/* Card 2 */}
          <Link
            href="/history"
            className="bg-surface-container-lowest rounded-xl p-4 shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-outline-variant/20 flex items-center justify-between active:bg-surface-container-low transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-tertiary-fixed flex items-center justify-center text-tertiary">
                <span className="material-symbols-outlined">directions_run</span>
              </div>
              <div className="flex flex-col">
                <span className="font-body-lg font-medium text-on-surface">Endurance Run</span>
                <span className="font-label-sm text-on-surface-variant">Sunday • 60 mins • 22,500 lbs</span>
              </div>
            </div>
            <span className="material-symbols-outlined text-outline-variant">chevron_right</span>
          </Link>
        </div>
      </section>
    </main>
  );
}
