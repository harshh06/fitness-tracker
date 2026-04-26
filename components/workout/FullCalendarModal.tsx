"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface FullCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDate?: (dateLabel: string) => void;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

function formatDateLabel(date: Date): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const compare = new Date(date);
  compare.setHours(0, 0, 0, 0);

  const diffMs = today.getTime() - compare.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays > 1 && diffDays < 7) {
    return compare.toLocaleDateString("en-US", { weekday: "long" });
  }
  return compare.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function FullCalendarModal({ isOpen, onClose, onSelectDate }: FullCalendarModalProps) {
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [selectedDay, setSelectedDay] = useState<number>(now.getDate());

  if (!isOpen) return null;

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDayOfWeek = getFirstDayOfWeek(viewYear, viewMonth);
  const todayDate = now.getDate();
  const isCurrentMonth = viewYear === now.getFullYear() && viewMonth === now.getMonth();

  const goToPrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
    setSelectedDay(0); // deselect when switching months
  };

  const goToNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
    setSelectedDay(0);
  };

  const handleConfirm = () => {
    if (selectedDay > 0) {
      const selectedDate = new Date(viewYear, viewMonth, selectedDay);
      const label = formatDateLabel(selectedDate);
      onSelectDate?.(label);
    }
    onClose();
  };

  const selectedDateObj = selectedDay > 0 ? new Date(viewYear, viewMonth, selectedDay) : null;
  const formattedSelected = selectedDateObj
    ? selectedDateObj.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })
    : "No date selected";

  return (
    <div className="fixed inset-0 z-[65] bg-surface text-on-surface min-h-screen font-body-md flex flex-col pt-16 animate-in slide-in-from-bottom-full duration-300">
      {/* TopAppBar */}
      <header className="fixed top-0 w-full z-50 border-b border-surface-variant bg-surface flex justify-between items-center h-16 px-5">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-full text-outline"
          >
            <span className="material-symbols-outlined">close</span>
          </Button>
          <h1 className="text-xl font-black text-primary font-['Lexend'] tracking-tight">Select Date</h1>
        </div>
      </header>

      {/* Main Content Canvas */}
      <main className="flex-1 flex flex-col px-container-margin py-stack-space-lg w-full max-w-md mx-auto h-full overflow-y-auto pb-24">
        {/* Calendar Header (Month/Year + Navigation Arrows) */}
        <div className="flex justify-between items-center mb-element-gap pt-4">
          <h2 className="font-headline-md text-on-surface">{MONTH_NAMES[viewMonth]} {viewYear}</h2>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={goToPrevMonth}
              className="rounded-full bg-surface-container text-on-surface-variant"
            >
              <span className="material-symbols-outlined">chevron_left</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={goToNextMonth}
              className="rounded-full bg-surface-container text-on-surface-variant"
            >
              <span className="material-symbols-outlined">chevron_right</span>
            </Button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="bg-surface rounded-xl p-4 shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-surface-variant flex-1">
          {/* Days of Week Header */}
          <div className="grid grid-cols-7 gap-2 mb-4">
            {DAY_NAMES.map(day => (
              <div key={day} className="text-center font-label-sm text-outline uppercase">{day}</div>
            ))}
          </div>

          {/* Day Cells */}
          <div className="grid grid-cols-7 gap-y-4 gap-x-2">
            {/* Empty cells for alignment before the 1st */}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="h-12 w-full" />
            ))}

            {/* Actual day buttons */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const isSelected = day === selectedDay;
              const isToday = isCurrentMonth && day === todayDate;

              return (
                <Button
                  key={day}
                  variant="ghost"
                  onClick={() => setSelectedDay(day)}
                  className={cn(
                    "h-12 w-full flex justify-center items-center rounded-full font-body-lg transition-all",
                    isSelected
                      ? "bg-primary text-on-primary shadow-[0_4px_10px_rgba(0,88,188,0.3)] font-bold hover:bg-primary/90"
                      : isToday
                        ? "text-primary border border-primary font-bold hover:bg-primary/10"
                        : "text-on-surface hover:bg-surface-container"
                  )}
                >
                  {day}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Selected Date Summary */}
        <div className="mt-element-gap text-center py-4">
          <p className="font-body-md text-on-surface-variant">Selected Date</p>
          <p className="font-headline-lg text-primary mt-1">{formattedSelected}</p>
        </div>

        {/* Confirm Action */}
        <div className="mt-auto pt-stack-space-lg">
          <Button 
            size="lg"
            onClick={handleConfirm}
            className="w-full font-label-lg font-bold shadow-[0_4px_12px_rgba(0,88,188,0.2)]"
          >
            Confirm
          </Button>
        </div>
      </main>
    </div>
  );
}
