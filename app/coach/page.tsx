"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

function ProgressRing({
  value,
  max,
  label,
  colorClass,
}: {
  value: number;
  max: number;
  label: string;
  colorClass: string;
}) {
  const circumference = 2 * Math.PI * 40;
  const progress = Math.max(0, Math.min(1, value / max));
  const offset = circumference * (1 - progress);

  return (
    <div className="bg-surface p-element-gap rounded-xl shadow-sm border border-outline-variant/30 flex flex-col items-center justify-center gap-unit">
      <div className="relative w-24 h-24 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          <circle
            className="text-surface-variant"
            cx="50"
            cy="50"
            r="40"
            fill="transparent"
            stroke="currentColor"
            strokeWidth="8"
          />
          <circle
            className={colorClass}
            cx="50"
            cy="50"
            r="40"
            fill="transparent"
            stroke="currentColor"
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center">
          <span className="font-headline-md text-on-surface">
            {value >= 1000 ? `${Math.round(value / 1000)}k` : value}
          </span>
        </div>
      </div>
      <span className="font-label-sm text-on-surface-variant">{label}</span>
    </div>
  );
}

export default function CoachPage() {
  const [message, setMessage] = useState("");

  return (
    <main className="flex-1 overflow-y-auto pb-32 px-container-margin pt-20 flex flex-col gap-stack-space-lg">
      {/* Monthly Overview Widget */}
      <section className="flex flex-col gap-element-gap">
        <h2 className="font-headline-md text-on-surface">Monthly Overview</h2>
        <div className="grid grid-cols-2 gap-unit">
          <ProgressRing value={12} max={16} label="Workouts" colorClass="text-primary" />
          <ProgressRing value={15000} max={30000} label="Volume (lbs)" colorClass="text-secondary" />
        </div>
      </section>

      {/* AI Insights Card */}
      <section className="bg-surface-container-low p-element-gap rounded-xl shadow-sm border border-outline-variant/50 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-10 -mt-10" />
        <div className="flex items-center gap-2 mb-unit relative z-10">
          <span className="material-symbols-outlined text-primary">psychology</span>
          <h3 className="font-label-lg text-on-surface">Monthly AI Review</h3>
        </div>
        <p className="font-body-md text-on-surface-variant relative z-10 leading-relaxed">
          Based on your recent leg volume and reported recovery metrics, consider
          substituting heavy squats with leg press variations this week to reduce
          patellar load. Incorporating a low-impact swimming session could enhance
          active recovery.
        </p>
      </section>

      {/* Chat Interface Section */}
      <section className="flex flex-col gap-element-gap mt-unit flex-1 justify-end">
        {/* User Prompt Suggestion */}
        <div className="flex justify-end w-full">
          <Button
            variant="ghost"
            className="bg-surface-container-high hover:bg-surface-dim text-on-surface font-label-sm py-3 px-5 rounded-full border border-outline-variant/30 flex items-center gap-2 max-w-[85%] text-left shadow-sm h-auto"
          >
            &quot;Adjust my next leg day for my knees&quot;
            <span className="material-symbols-outlined text-[16px]">arrow_upward</span>
          </Button>
        </div>

        {/* Chat Input */}
        <div className="relative w-full">
          <div className="flex items-center bg-surface border border-outline-variant/40 rounded-full p-2 shadow-sm focus-within:ring-2 focus-within:ring-primary focus-within:border-transparent transition-all">
            <Button
              variant="ghost"
              size="icon"
              className="text-outline hover:text-primary rounded-full shrink-0"
            >
              <span className="material-symbols-outlined">add_circle</span>
            </Button>
            <input
              className="flex-1 bg-transparent border-none focus:ring-0 font-body-md text-on-surface placeholder:text-outline px-2 h-[56px]"
              placeholder="Ask your AI coach..."
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <Button
              size="icon"
              className="rounded-full shrink-0 mr-1 shadow-sm"
            >
              <span
                className="material-symbols-outlined"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                send
              </span>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
