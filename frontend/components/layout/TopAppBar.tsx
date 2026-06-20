"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";

export default function TopAppBar() {
  const pathname = usePathname();
  const { user } = useAuth();

  // Hide on workout page or auth pages
  if (pathname === "/workout" || pathname === "/profile" || pathname.startsWith("/login") || pathname.startsWith("/signup")) return null;

  return (
    <header className="bg-white/90 backdrop-blur-md fixed top-0 w-full z-50 border-b border-surface-variant shadow-sm flex justify-between items-center px-5 py-3">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full overflow-hidden bg-surface-container flex items-center justify-center border border-outline-variant">
          {user?.avatar_url ? (
            <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <span
              className="material-symbols-outlined text-outline"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              person
            </span>
          )}
        </div>
      </div>
      <div className="absolute left-1/2 -translate-x-1/2">
        <span className="text-primary font-sans font-black text-xl">Pulse Fitness</span>
      </div>
      <Link href="/profile" passHref legacyBehavior>
        <Button
          variant="ghost"
          size="icon"
          className="text-primary hover:bg-surface-container rounded-full"
        >
          <span className="material-symbols-outlined">settings</span>
        </Button>
      </Link>
    </header>
  );
}
