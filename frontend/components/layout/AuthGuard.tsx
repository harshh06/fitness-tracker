"use client";

import React, { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { usePathname, useRouter } from "next/navigation";

const PUBLIC_ROUTES = ["/login", "/signup"];

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !user && !PUBLIC_ROUTES.includes(pathname)) {
      router.push("/login");
    }
  }, [user, isLoading, pathname, router]);

  // While resolving auth state, show a clean, premium loading animation
  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-surface p-6">
        <div className="flex flex-col items-center gap-4">
          <div className="relative flex items-center justify-center">
            {/* Outer pulse */}
            <div className="absolute h-16 w-16 animate-ping rounded-full bg-primary/20 opacity-75"></div>
            {/* Inner rotating arc */}
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary/20 border-t-primary"></div>
          </div>
          <p className="font-sans text-sm font-semibold tracking-wide text-outline animate-pulse">
            Loading Pulse...
          </p>
        </div>
      </div>
    );
  }

  // If not authenticated and attempting a private route, render nothing to avoid flash of content
  if (!user && !PUBLIC_ROUTES.includes(pathname)) {
    return null;
  }

  return <>{children}</>;
}
