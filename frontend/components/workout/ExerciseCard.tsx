"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface StepperProps {
  label: string;
  value: number;
  step?: number;
  min?: number;
  onChange: (val: number) => void;
}

function Stepper({ label, value, step = 1, min = 0, onChange }: StepperProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="font-body-md text-on-surface-variant flex-1">{label}</span>
      <div className="flex items-center bg-surface-container rounded-lg overflow-hidden h-[64px] w-[220px]">
        <Button 
          variant="ghost"
          onClick={() => onChange(Math.max(min, value - step))}
          className="w-[64px] h-[64px] flex items-center justify-center text-on-surface rounded-none"
        >
          <span className="material-symbols-outlined text-[32px]">remove</span>
        </Button>
        <div className="flex-1 text-center font-headline-lg text-on-surface tracking-tight">
          {value}
        </div>
        <Button 
          variant="ghost"
          onClick={() => onChange(value + step)}
          className="w-[64px] h-[64px] flex items-center justify-center text-primary bg-primary-fixed/50 hover:bg-primary-fixed active:bg-primary-fixed-dim transition-colors rounded-none"
        >
          <span className="material-symbols-outlined text-[32px]">add</span>
        </Button>
      </div>
    </div>
  );
}

export function ExerciseCard({
  exerciseName,
  weight,
  reps,
  onChange,
}: {
  exerciseName: string;
  weight: number;
  reps: number;
  onChange: (weight: number, reps: number) => void;
}) {
  return (
    <article className="bg-surface-container-lowest rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.06)] p-element-gap border border-surface-variant/50">
      <div className="flex justify-between items-center mb-element-gap">
        <h2 className="font-headline-md text-on-surface tracking-tight">{exerciseName}</h2>
        <Button 
          variant="ghost" 
          size="icon"
          className="text-outline rounded-full"
        >
          <span className="material-symbols-outlined">more_horiz</span>
        </Button>
      </div>
      
      <div className="flex flex-col gap-stack-space-lg">
        <div className="flex flex-col gap-element-gap border-b border-surface-variant pb-element-gap last:border-0 last:pb-0">
          <div className="flex justify-between items-center">
            <span className="font-label-lg text-outline uppercase tracking-wider">Set 1</span>
            <span className="font-label-lg text-on-surface bg-surface-variant/50 px-3 py-1 rounded-full">Working</span>
          </div>
          
          <div className="flex flex-col gap-unit">
            <Stepper label="Weight (lbs)" value={weight} step={5} min={0} onChange={(val) => onChange(val, reps)} />
            <Stepper label="Reps" value={reps} step={1} min={0} onChange={(val) => onChange(weight, val)} />
          </div>
        </div>
      </div>
    </article>
  );
}
