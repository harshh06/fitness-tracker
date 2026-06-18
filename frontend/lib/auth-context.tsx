"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  api,
  setTokens,
  clearTokens,
  getAccessToken,
  isAuthenticated,
  onUnauthorized,
} from "./api";
import { useToast } from "./toast-context";

// ── Types ───────────────────────────────────────────────────

export interface Profile {
  id: string;
  user_id: string;
  display_name: string;
  email: string;
  date_of_birth?: string;
  gender?: string;
  weight_kg?: number;
  height_cm?: number;
  unit_preference: string;
  fitness_level?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface ExerciseSearchResult {
  id: string;
  name: string;
  category: string;
  equipment: string;
  difficulty: string;
  instructions: string | null;
  is_compound: boolean;
  is_system: boolean;
  created_by: string | null;
  created_at: string;
  muscles: string[];
}

export interface WorkoutSummary {
  id: string;
  user_id: string;
  started_at: string;
  completed_at: string | null;
  title: string | null;
  workout_type: string;
  notes: string | null;
  rating: number | null;
  energy_level: number | null;
  pain_notes: string | null;
  duration_mins: number | null;
  is_deleted: boolean;
  created_at: string;
  exercise_count?: number;
}

interface AuthContextType {
  user: Profile | null;
  token: string | null;
  isLoading: boolean;
  exercises: ExerciseSearchResult[];
  workouts: WorkoutSummary[];
  isLoadingData: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  refetchUserData: () => Promise<void>;
  updateUser: (user: Profile) => void;
}

// ── Context ─────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ── Provider Component ──────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { showToast } = useToast();

  const [exercises, setExercises] = useState<ExerciseSearchResult[]>([]);
  const [workouts, setWorkouts] = useState<WorkoutSummary[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  const refetchUserData = useCallback(async () => {
    if (!isAuthenticated()) return;
    try {
      setIsLoadingData(true);
      const [exercisesData, workoutsData] = await Promise.all([
        api.get<ExerciseSearchResult[]>("/exercises"),
        api.get<WorkoutSummary[]>("/workouts", { params: { limit: 100 } })
      ]);
      setExercises(exercisesData);
      setWorkouts(workoutsData);
    } catch (err) {
      console.error("Failed to fetch user exercises/workouts:", err);
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  // Fetch exercises and workouts as soon as the user object is set
  useEffect(() => {
    if (!user) {
      setExercises([]);
      setWorkouts([]);
      return;
    }
    refetchUserData();
  }, [user, refetchUserData]);

  // Load initial session on mount (guarantees hydration-safety for SSR)
  useEffect(() => {
    async function loadSession() {
      try {
        if (isAuthenticated()) {
          const accessToken = getAccessToken();
          setToken(accessToken);

          // Fetch the live profile from the backend
          const data = await api.get<{ profile: Profile }>("/profile/");
          setUser(data.profile);
        }
      } catch (err) {
        console.error("Failed to load session:", err);
        showToast("Session expired. Please log in again.", "error");
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
      showToast("Session expired. Please log in again.", "error");
      router.push("/login");
    });
  }, [router, showToast]);

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
      const profileData = await api.get<{ profile: Profile }>("/profile/");
      setUser(profileData.profile);

      showToast("Logged in successfully!", "success");
      router.push("/dashboard");
    } catch (err: any) {
      clearTokens();
      setToken(null);
      setUser(null);
      showToast(err?.detail || "Invalid email or password. Please try again.", "error");
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
      const putResponse = await api.put<any>("/profile/", { display_name: name });
      const { health_conditions: _, ...profileFields } = putResponse;
      setUser(profileFields as Profile);

      showToast("Account created successfully!", "success");
      router.push("/dashboard");
    } catch (err: any) {
      clearTokens();
      setToken(null);
      setUser(null);
      showToast(err?.detail || "Signup failed. Please try again.", "error");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    clearTokens();
    setToken(null);
    setUser(null);
    showToast("Logged out successfully.", "info");
    router.push("/login");
  };

  const updateUser = useCallback((updatedProfile: Profile) => {
    setUser(updatedProfile);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        exercises,
        workouts,
        isLoadingData,
        login,
        signup,
        logout,
        refetchUserData,
        updateUser,
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
