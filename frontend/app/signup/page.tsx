"use client";

import { useState } from "react";
import Link from "next/link";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !password || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    // Integration point: POST /auth/signup
    console.log("Signup:", { email, password });
    setTimeout(() => setLoading(false), 1000);
  };

  return (
    <main className="min-h-screen bg-surface flex flex-col items-center justify-center p-container-margin">
      <div className="w-full max-w-md flex flex-col gap-stack-space-lg">
        {/* Brand Header */}
        <header className="text-center flex flex-col items-center">
          <div className="h-16 w-16 bg-primary-container rounded-[16px] flex items-center justify-center mb-6 shadow-sm shadow-primary/10">
            <span
              className="material-symbols-outlined text-primary text-4xl"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              monitor_heart
            </span>
          </div>
          <h1 className="font-display text-[48px] leading-[56px] font-bold tracking-[-0.02em] text-primary">
            Pulse
          </h1>
          <p className="font-body-lg text-on-surface-variant mt-2">
            Track performance. Reach goals.
          </p>
        </header>

        {/* Signup Form */}
        <form
          className="flex flex-col gap-element-gap"
          onSubmit={handleSubmit}
        >
          {/* Email */}
          <div className="flex flex-col gap-2">
            <label
              className="font-label-lg text-on-surface"
              htmlFor="signup-email"
            >
              Email
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">
                mail
              </span>
              <input
                className="w-full h-touch-target-min pl-12 pr-4 bg-surface rounded-lg border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary-fixed-dim focus:outline-none transition-all text-on-surface placeholder:text-outline/70"
                id="signup-email"
                placeholder="you@example.com"
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          {/* Password */}
          <div className="flex flex-col gap-2">
            <label
              className="font-label-lg text-on-surface"
              htmlFor="signup-password"
            >
              Password
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">
                lock
              </span>
              <input
                className="w-full h-touch-target-min pl-12 pr-4 bg-surface rounded-lg border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary-fixed-dim focus:outline-none transition-all text-on-surface placeholder:text-outline/70"
                id="signup-password"
                placeholder="••••••••"
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {/* Confirm Password */}
          <div className="flex flex-col gap-2">
            <label
              className="font-label-lg text-on-surface"
              htmlFor="signup-confirm-password"
            >
              Confirm Password
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">
                lock
              </span>
              <input
                className="w-full h-touch-target-min pl-12 pr-4 bg-surface rounded-lg border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary-fixed-dim focus:outline-none transition-all text-on-surface placeholder:text-outline/70"
                id="signup-confirm-password"
                placeholder="••••••••"
                required
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <p className="text-error font-label-lg text-center">{error}</p>
          )}

          {/* Massive CTA */}
          <div className="mt-4">
            <button
              className="w-full min-h-[64px] bg-primary hover:bg-surface-tint text-on-primary font-headline-md text-[24px] leading-[32px] font-semibold rounded-[16px] shadow-sm shadow-primary/20 flex items-center justify-center transition-all active:scale-[0.98] focus:outline-none focus:ring-4 focus:ring-primary-fixed disabled:opacity-60"
              type="submit"
              disabled={loading}
            >
              {loading ? "Creating Account..." : "Create Account"}
            </button>
          </div>
        </form>

        {/* Footer Link */}
        <footer className="text-center mt-2">
          <p className="font-body-md text-on-surface-variant">
            Already have an account?{" "}
            <Link
              className="text-primary font-bold hover:text-surface-tint hover:underline transition-colors decoration-2 underline-offset-4"
              href="/login"
            >
              Log In
            </Link>
          </p>
        </footer>
      </div>
    </main>
  );
}
