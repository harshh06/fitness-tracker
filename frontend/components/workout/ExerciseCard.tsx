"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

const SET_TYPES = ["warmup", "working", "drop"] as const;
type SetType = (typeof SET_TYPES)[number];

interface SetData {
  id: string;
  setNumber: number;
  setType: SetType;
  weight: number;
  reps: number;
}

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
          className="w-[64px] h-[64px] flex items-center justify-center text-on-surface rounded-none hover:bg-surface-variant active:bg-surface-dim transition-colors"
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

function SetTypeBadge({ type, onCycle }: { type: SetType; onCycle: () => void }) {
  const styles: Record<SetType, string> = {
    warmup: "text-primary bg-primary-fixed-dim/20",
    working: "text-on-surface bg-surface-variant/50",
    drop: "text-tertiary bg-tertiary-fixed/40",
  };
  const labels: Record<SetType, string> = {
    warmup: "Warmup",
    working: "Working",
    drop: "Drop Set",
  };

  return (
    <button
      onClick={onCycle}
      className={`font-label-lg px-3 py-1 rounded-full transition-colors cursor-pointer active:scale-95 ${styles[type]}`}
    >
      {labels[type]}
    </button>
  );
}

interface ExerciseCardProps {
  exerciseName: string;
  initialWeight?: number;
  initialReps?: number;
  onRemove?: () => void;
}

export function ExerciseCard({
  exerciseName,
  initialWeight = 45,
  initialReps = 10,
  onRemove,
}: ExerciseCardProps) {
  const [sets, setSets] = useState<SetData[]>([
    {
      id: "set-1",
      setNumber: 1,
      setType: "working",
      weight: initialWeight,
      reps: initialReps,
    },
  ]);
  const [menuOpen, setMenuOpen] = useState(false);

  const addSet = () => {
    const lastSet = sets[sets.length - 1];
    setSets([
      ...sets,
      {
        id: `set-${Date.now()}`,
        setNumber: sets.length + 1,
        setType: "working",
        weight: lastSet?.weight ?? initialWeight,
        reps: lastSet?.reps ?? initialReps,
      },
    ]);
  };

  const updateSet = (id: string, field: keyof SetData, value: number | SetType) => {
    setSets(sets.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
  };

  const cycleSetType = (id: string) => {
    const set = sets.find((s) => s.id === id);
    if (!set) return;
    const idx = SET_TYPES.indexOf(set.setType);
    const next = SET_TYPES[(idx + 1) % SET_TYPES.length];
    updateSet(id, "setType", next);
  };

  return (
    <article className="bg-surface-container-lowest rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.06)] p-element-gap border border-surface-variant/50 relative">
      {/* Card Header */}
      <div className="flex justify-between items-center mb-element-gap">
        <h2 className="font-headline-md text-on-surface tracking-tight">{exerciseName}</h2>
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="text-outline hover:text-on-surface active:bg-surface-variant rounded-full transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <span className="material-symbols-outlined">more_horiz</span>
          </Button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-full mt-1 bg-surface-container-lowest rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.1)] border border-surface-variant py-1 z-20 min-w-[160px]">
                <button
                  className="w-full text-left px-4 py-3 text-error font-label-lg hover:bg-surface-variant transition-colors flex items-center gap-3"
                  onClick={() => {
                    setMenuOpen(false);
                    onRemove?.();
                  }}
                >
                  <span className="material-symbols-outlined">delete</span>
                  Delete Exercise
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Sets Container */}
      <div className="flex flex-col gap-stack-space-lg">
        {sets.map((set, idx) => (
          <div
            key={set.id}
            className={`flex flex-col gap-element-gap ${idx < sets.length - 1 ? "border-b border-surface-variant pb-element-gap" : ""}`}
          >
            <div className="flex justify-between items-center">
              <span className="font-label-lg text-outline uppercase tracking-wider">
                Set {set.setNumber}
              </span>
              <SetTypeBadge type={set.setType} onCycle={() => cycleSetType(set.id)} />
            </div>
            <div className="flex flex-col gap-unit">
              <Stepper
                label="Weight (lbs)"
                value={set.weight}
                step={5}
                min={0}
                onChange={(v) => updateSet(set.id, "weight", v)}
              />
              <Stepper
                label="Reps"
                value={set.reps}
                step={1}
                min={0}
                onChange={(v) => updateSet(set.id, "reps", v)}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Add Set Button */}
      <button
        onClick={addSet}
        className="w-full mt-6 py-3 rounded-xl border-2 border-dashed border-outline-variant text-primary font-label-lg uppercase tracking-wider flex items-center justify-center gap-2 active:bg-surface-variant transition-colors"
      >
        <span className="material-symbols-outlined text-[20px]">add</span> ADD SET
      </button>
    </article>
  );
}
