"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { cn } from "@/lib/utils";

// ── Types ───────────────────────────────────────────────────

export type ToastType = "success" | "error" | "info";

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: any, type?: ToastType) => void;
}

// ── Context ─────────────────────────────────────────────────

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// ── Provider ────────────────────────────────────────────────

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((message: any, type: ToastType = "info") => {
    const stringMessage = typeof message === "string" ? message : JSON.stringify(message);
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message: stringMessage, type }]);

    // Auto-dismiss after 4 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Global Toast Overlay Container */}
      <div 
        className="fixed bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] md:bottom-6 left-1/2 -translate-x-1/2 md:left-auto md:right-6 md:translate-x-0 z-[100] flex flex-col gap-3 w-full max-w-[90%] md:max-w-sm pointer-events-none"
        aria-live="assertive"
      >
        {toasts.map((toast) => {
          const isSuccess = toast.type === "success";
          const isError = toast.type === "error";

          return (
            <div
              key={toast.id}
              onClick={() => dismissToast(toast.id)}
              className={cn(
                "w-full p-4 rounded-xl shadow-lg border backdrop-blur-md flex items-center gap-3 pointer-events-auto cursor-pointer transition-all duration-300 transform animate-in slide-in-from-bottom-5 fade-in",
                isSuccess && "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400",
                isError && "bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400",
                !isSuccess && !isError && "bg-surface-container border-outline-variant/30 text-on-surface"
              )}
            >
              {/* Icon */}
              <span 
                className={cn(
                  "material-symbols-outlined text-2xl shrink-0",
                  isSuccess && "text-emerald-500",
                  isError && "text-rose-500",
                  !isSuccess && !isError && "text-primary"
                )}
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                {isSuccess && "check_circle"}
                {isError && "error"}
                {!isSuccess && !isError && "info"}
              </span>

              {/* Message */}
              <p className="font-sans text-sm font-semibold leading-relaxed flex-1">
                {toast.message}
              </p>

              {/* Close Button */}
              <button 
                type="button"
                className="text-outline-variant hover:text-on-surface transition-colors p-1"
                aria-label="Close notification"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

// ── Hook ────────────────────────────────────────────────────

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
