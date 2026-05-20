"use client";

import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function TopAppBar() {
  const pathname = usePathname();

  // Hide on workout page (has its own custom header) and auth pages
  if (pathname === "/workout" || pathname === "/login" || pathname === "/signup") return null;

  return (
    <header className="bg-white/90 backdrop-blur-md fixed top-0 w-full z-50 border-b border-surface-variant shadow-sm flex justify-between items-center px-5 py-3">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full overflow-hidden bg-surface-container flex items-center justify-center border border-outline-variant">
          <span
            className="material-symbols-outlined text-outline"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            person
          </span>
        </div>
      </div>
      <span className="text-primary font-sans font-black text-xl">Pulse Fitness</span>
      <Button
        variant="ghost"
        size="icon"
        className="text-outline hover:bg-surface-container rounded-full"
      >
        <span className="material-symbols-outlined">settings</span>
      </Button>
    </header>
  );
}
