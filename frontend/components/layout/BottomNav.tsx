"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { name: "Home", href: "/dashboard", icon: "home" },
  { name: "Workout", href: "/workout", icon: "fitness_center" },
  { name: "Coach", href: "/coach", icon: "psychology" },
  { name: "History", href: "/history", icon: "history" },
  { name: "Profile", href: "/profile", icon: "person" },
];

export default function BottomNav() {
  const pathname = usePathname();

  // Hide on active workout page (has its own sticky footer) and auth pages
  if (pathname === "/workout" || pathname === "/login" || pathname === "/signup") return null;

  return (
    <nav className="md:hidden bg-white fixed bottom-0 w-full z-50 border-t rounded-t-2xl border-surface-variant shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
      <div className="flex justify-around items-center px-2 pt-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)]">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname.startsWith(item.href);

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center rounded-xl px-3 py-1.5 transition-all duration-200 min-h-[44px] min-w-[44px] active:scale-90",
                isActive
                  ? "text-primary bg-primary/10"
                  : "text-outline hover:text-primary"
              )}
            >
              <span
                className="material-symbols-outlined text-xl mb-0.5"
                data-weight={isActive ? "fill" : undefined}
              >
                {item.icon}
              </span>
              <span className="font-sans text-[10px] font-semibold tracking-wide uppercase">
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
