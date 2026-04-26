"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface DateSelectionModalProps {
  isOpen: boolean;
  currentDate: string;
  onClose: () => void;
  onOpenCalendar: () => void;
  onSelectDate: (date: string) => void;
}

const RECENT_DATES = [
  { id: "Today", label: "Today", subLabel: "Thu, Oct 26" },
  { id: "Yesterday", label: "Yesterday", subLabel: "Wed, Oct 25" },
  { id: "Tuesday", label: "Tuesday", subLabel: "Tue, Oct 24" }
];

export function DateSelectionModal({ isOpen, currentDate, onClose, onOpenCalendar, onSelectDate }: DateSelectionModalProps) {
  const [selected, setSelected] = useState(currentDate);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[55] flex items-end md:items-center justify-center">
      {/* Backdrop */}
      <div 
        aria-hidden="true" 
        className="fixed inset-0 bg-on-surface/40 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      {/* Bottom Sheet Modal Container */}
      <div className="relative w-full max-w-md bg-surface-container-lowest rounded-t-3xl md:rounded-3xl shadow-[0_-8px_40px_rgba(0,0,0,0.08)] flex flex-col max-h-[85vh] pb-8 md:pb-0 animate-in slide-in-from-bottom-full md:slide-in-from-bottom-0 md:zoom-in-95 duration-300">
        
        {/* Drag Handle Indicator (Mobile) */}
        <div className="w-full flex justify-center pt-3 pb-1 md:hidden">
          <div className="w-12 h-1.5 bg-surface-variant rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-container-margin py-element-gap border-b border-surface-container">
          <h2 className="font-headline-md text-on-surface">Select Date</h2>
          <Button 
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Close modal" 
            className="text-on-surface-variant hover:bg-surface-container rounded-full transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </Button>
        </div>

        {/* Scrollable Date Content */}
        <div className="flex-1 overflow-y-auto px-container-margin py-stack-space-lg space-y-unit">
          <div className="font-label-sm text-outline uppercase tracking-widest mb-element-gap pl-1">Recent Activity</div>

          {RECENT_DATES.map((date) => {
            const isSelected = selected === date.id;
            return (
              <Button 
                key={date.id}
                variant="ghost"
                onClick={() => setSelected(date.id)}
                className={cn(
                  "w-full flex items-center justify-between min-h-[56px] px-4 rounded-xl transition-all group border h-auto py-3",
                  isSelected 
                    ? "bg-primary-fixed border-primary-fixed-dim hover:bg-primary-fixed/90" 
                    : "bg-surface hover:bg-surface-container-high border-transparent"
                )}
              >
                <div className="flex flex-col text-left">
                  <span className={cn("font-label-lg", isSelected ? "text-on-primary-fixed" : "text-on-surface")}>
                    {date.label}
                  </span>
                  <span className={cn("font-body-md", isSelected ? "text-on-primary-fixed-variant" : "text-on-surface-variant")}>
                    {date.subLabel}
                  </span>
                </div>
                {isSelected && (
                  <span className="material-symbols-outlined text-primary" data-weight="fill">check_circle</span>
                )}
              </Button>
            );
          })}

          <div className="pt-element-gap mt-element-gap border-t border-surface-container-low">
            <Button 
              variant="ghost"
              onClick={onOpenCalendar}
              className="w-full flex items-center justify-start gap-4 min-h-[56px] px-4 rounded-xl bg-surface-container-low hover:bg-surface-container transition-all text-primary h-auto py-3"
            >
              <span className="material-symbols-outlined">calendar_month</span>
              <span className="font-label-lg">Select from Calendar</span>
            </Button>
          </div>
        </div>

        {/* Footer / Massive CTA */}
        <div className="px-container-margin pt-element-gap pb-container-margin border-t border-surface-container bg-surface-container-lowest md:rounded-b-3xl">
          <Button 
            size="lg"
            onClick={() => {
              onSelectDate(selected);
              onClose();
            }}
            className="w-full font-label-lg uppercase tracking-wide shadow-[0_4px_12px_rgba(0,88,188,0.15)]"
          >
            Confirm Selection
          </Button>
        </div>
      </div>
    </div>
  );
}
