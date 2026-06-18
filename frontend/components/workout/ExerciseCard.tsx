"use client";

import { Button } from "@/components/ui/button";

interface LocalSet {
  set_number: number;
  weight: number;
  reps: number;
  duration_seconds?: number;
}

interface CompactStepperProps {
  value: number;
  step?: number;
  min?: number;
  unit?: string;
  onChange: (val: number) => void;
}

function CompactStepper({ value, step = 1, min = 0, unit = "", onChange }: CompactStepperProps) {
  return (
    <div className="flex items-center bg-surface-container rounded-lg overflow-hidden h-10 w-28 border border-outline-variant/30">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - step))}
        className="w-8 h-full flex items-center justify-center text-outline hover:bg-surface-variant/20 active:bg-surface-variant/40 transition-colors cursor-pointer"
      >
        <span className="material-symbols-outlined text-[16px]">remove</span>
      </button>
      <div className="flex-1 text-center font-label-md text-on-surface">
        {value}
        <span className="text-[10px] text-outline ml-0.5">{unit}</span>
      </div>
      <button
        type="button"
        onClick={() => onChange(value + step)}
        className="w-8 h-full flex items-center justify-center text-primary hover:bg-primary/10 active:bg-primary/20 transition-colors cursor-pointer"
      >
        <span className="material-symbols-outlined text-[16px]">add</span>
      </button>
    </div>
  );
}

export function ExerciseCard({
  exerciseName,
  category,
  sets,
  onUpdateSet,
  onAddSet,
  onRemoveSet,
  onRemoveExercise,
  weightUnit = "lbs",
}: {
  exerciseName: string;
  category: string;
  sets: LocalSet[];
  onUpdateSet: (setIndex: number, fields: Partial<LocalSet>) => void;
  onAddSet: () => void;
  onRemoveSet: (setIndex: number) => void;
  onRemoveExercise: () => void;
  weightUnit?: string;
}) {
  return (
    <article className="bg-surface-container-lowest rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.06)] p-element-gap border border-surface-variant/50 flex flex-col gap-element-gap">
      <div className="flex justify-between items-center">
        <h2 className="font-headline-md text-on-surface tracking-tight">{exerciseName}</h2>
        <Button 
          variant="ghost" 
          size="icon"
          onClick={onRemoveExercise}
          className="text-outline hover:text-error hover:bg-error/10 rounded-full min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
        >
          <span className="material-symbols-outlined text-[20px]">delete</span>
        </Button>
      </div>
      
      <div className="flex flex-col gap-3">
        {sets.map((set, idx) => (
          <div 
            key={idx} 
            className="flex items-center justify-between gap-3 border-b border-surface-variant/30 pb-3 last:border-0 last:pb-0"
          >
            <div className="flex flex-col">
              <span className="font-label-md text-outline">Set {set.set_number}</span>
              <span className="text-[10px] font-label-sm text-primary/70 uppercase tracking-wider">Working</span>
            </div>
            
            <div className="flex items-center gap-2">
              {category === "cardio" ? (
                <CompactStepper 
                  value={set.duration_seconds ?? 60} 
                  step={10} 
                  min={10} 
                  unit="s" 
                  onChange={(val) => onUpdateSet(idx, { duration_seconds: val })} 
                />
              ) : (
                <>
                  <CompactStepper 
                    value={set.weight} 
                    step={weightUnit === "kg" ? 2.5 : 5} 
                    min={0} 
                    unit={weightUnit} 
                    onChange={(val) => onUpdateSet(idx, { weight: val })} 
                  />
                  <CompactStepper 
                    value={set.reps} 
                    step={1} 
                    min={0} 
                    unit="rep" 
                    onChange={(val) => onUpdateSet(idx, { reps: val })} 
                  />
                </>
              )}

              {sets.length > 1 && (
                <button
                  type="button"
                  onClick={() => onRemoveSet(idx)}
                  className="w-8 h-8 flex items-center justify-center text-error hover:bg-error/10 active:bg-error/20 rounded-full transition-colors cursor-pointer ml-1"
                >
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={onAddSet}
        className="w-full h-[40px] flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-outline hover:border-primary text-outline hover:text-primary font-label-md transition-colors cursor-pointer mt-1 bg-transparent"
      >
        <span className="material-symbols-outlined text-[16px]">add</span>
        Add Set
      </button>
    </article>
  );
}
