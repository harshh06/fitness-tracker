"use client";

import { useState } from "react";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }
    setLoading(true);
    // Integration point: POST /auth/login
    console.log("Login:", { email, password });
    setTimeout(() => setLoading(false), 1000);
  };

  return (
    <main className="min-h-screen bg-surface flex flex-col items-center justify-center p-container-margin">
      <div className="w-full max-w-md bg-surface-container-lowest rounded-xl shadow-[0_4px_24px_rgba(0,0,0,0.06)] p-stack-space-lg">
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-stack-space-lg">
          <div className="w-16 h-16 bg-primary-container rounded-full flex items-center justify-center mb-element-gap">
            <span
              className="material-symbols-outlined text-on-primary-container text-4xl"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              bolt
            </span>
          </div>
          <h1 className="font-display text-[48px] leading-[56px] font-bold tracking-[-0.02em] text-primary">
            Pulse
          </h1>
          <p className="font-body-md text-on-surface-variant mt-2">
            Log in to track your performance.
          </p>
        </div>

        {/* Login Form */}
        <form className="flex flex-col gap-element-gap" onSubmit={handleSubmit}>
          {/* Email */}
          <div className="flex flex-col gap-unit">
            <label
              className="font-label-lg text-on-surface"
              htmlFor="login-email"
            >
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="material-symbols-outlined text-outline">
                  mail
                </span>
              </div>
              <input
                className="w-full h-touch-target-min pl-10 pr-4 bg-surface rounded-lg border border-outline-variant text-on-surface focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none transition-shadow"
                id="login-email"
                name="email"
                placeholder="athlete@example.com"
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          {/* Password */}
          <div className="flex flex-col gap-unit pb-unit">
            <label
              className="font-label-lg text-on-surface"
              htmlFor="login-password"
            >
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="material-symbols-outlined text-outline">
                  lock
                </span>
              </div>
              <input
                className="w-full h-touch-target-min pl-10 pr-4 bg-surface rounded-lg border border-outline-variant text-on-surface focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none transition-shadow"
                id="login-password"
                name="password"
                placeholder="••••••••"
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <p className="text-error font-label-lg text-center">{error}</p>
          )}

          {/* Massive CTA */}
          <button
            className="w-full h-[64px] bg-primary text-on-primary font-headline-md text-[24px] leading-[32px] font-semibold rounded-xl shadow-sm hover:bg-surface-tint active:scale-[0.98] transition-all duration-200 flex items-center justify-center mt-stack-space-lg disabled:opacity-60"
            type="submit"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Log In"}
          </button>
        </form>

        {/* Sign Up Link */}
        <div className="mt-element-gap text-center pt-stack-space-lg border-t border-surface-variant">
          <p className="font-body-md text-on-surface-variant">
            Don&apos;t have an account?{" "}
            <Link
              className="text-primary font-label-lg hover:underline decoration-2 underline-offset-4"
              href="/signup"
            >
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
