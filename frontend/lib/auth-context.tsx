"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  api,
  setTokens,
  clearTokens,
  getAccessToken,
  isAuthenticated,
  onUnauthorized,
} from "./api";

// ── Types ───────────────────────────────────────────────────

export interface Profile {
  id: string;
  user_id: string;
  display_name: string;
  email: string;
  date_of_birth?: string;
  gender?: string;
  weight_lbs?: number;
  height_inches?: number;
  fitness_level?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: Profile | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
}

// ── Context ─────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ── Provider Component ──────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Load initial session on mount (guarantees hydration-safety for SSR)
  useEffect(() => {
    async function loadSession() {
      try {
        if (isAuthenticated()) {
          const accessToken = getAccessToken();
          setToken(accessToken);

          // Fetch the live profile from the backend
          const profile = await api.get<Profile>("/profile");
          setUser(profile);
        }
      } catch (err) {
        console.error("Failed to load session:", err);
        // If profile fetch fails, clear invalid tokens
        clearTokens();
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }

    loadSession();

    // Register global interceptor/listener for unauthorized requests (401)
    onUnauthorized(() => {
      setUser(null);
      setToken(null);
      router.push("/login");
    });
  }, [router]);

  // ── Auth Operations ────────────────────────────────────────

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const data = await api.post<{
        access_token: string;
        refresh_token: string;
      }>("/auth/login", { email, password }, { public: true });

      setTokens(data.access_token, data.refresh_token);
      setToken(data.access_token);

      // Immediately fetch user profile
      const profile = await api.get<Profile>("/profile");
      setUser(profile);

      router.push("/dashboard");
    } catch (err) {
      clearTokens();
      setToken(null);
      setUser(null);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (email: string, password: string, name: string) => {
    setIsLoading(true);
    try {
      const data = await api.post<{
        access_token: string;
        refresh_token: string;
      }>("/auth/signup", { email, password }, { public: true });

      setTokens(data.access_token, data.refresh_token);
      setToken(data.access_token);

      // Create/Update profile with the user's name
      const profile = await api.put<Profile>("/profile", { display_name: name });
      setUser(profile);

      router.push("/dashboard");
    } catch (err) {
      clearTokens();
      setToken(null);
      setUser(null);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    clearTokens();
    setToken(null);
    setUser(null);
    router.push("/login");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        signup,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ── Hook ────────────────────────────────────────────────────

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
