"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { api, onUnauthorized } from "./api";
import { useToast } from "./toast-context";
import { supabase } from "./supabaseClient";

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
  logout: () => Promise<void>;
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

  const userRef = useRef<Profile | null>(null);
  const tokenRef = useRef<string | null>(null);

  // Keep refs in sync with state
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    tokenRef.current = token;
  }, [token]);

  const [exercises, setExercises] = useState<ExerciseSearchResult[]>([]);
  const [workouts, setWorkouts] = useState<WorkoutSummary[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  const refetchUserData = useCallback(async () => {
    // If not authenticated (no token), skip fetching data
    if (!supabase.auth.getSession()) return;
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

  // Load initial session on mount and subscribe to changes
  useEffect(() => {
    let mounted = true;

    // Listen to changes (e.g. login, token refresh, sign out)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      if (session) {
        const isNewToken = session.access_token !== tokenRef.current;
        const isNewUser = !userRef.current || session.user.id !== userRef.current.id;

        setToken(session.access_token);

        // Fetch profile only if:
        // 1. We don't have the user profile loaded, OR
        // 2. The user has switched (different sub ID)
        if (isNewUser && (event === "INITIAL_SESSION" || event === "SIGNED_IN")) {
          try {
            setIsLoading(true);
            const data = await api.get<{ profile: Profile }>("/profile/");
            if (mounted) {
              setUser(data.profile);
            }
          } catch (err) {
            console.error("Failed to fetch profile on auth change:", err);
          } finally {
            if (mounted) setIsLoading(false);
          }
        } else {
          // Token refreshed or user profile already loaded, just clear loading
          setIsLoading(false);
        }
      } else {
        setUser(null);
        setToken(null);
        setIsLoading(false);
      }
    });

    // Register global interceptor/listener for unauthorized requests (401)
    onUnauthorized(() => {
      if (mounted) {
        setUser(null);
        setToken(null);
        showToast("Session expired. Please log in again.", "error");
        router.push("/login");
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [router, showToast]);

  // ── Auth Operations ────────────────────────────────────────

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { error, data } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      if (data.session) {
        setToken(data.session.access_token);
      }

      showToast("Logged in successfully!", "success");
      router.push("/dashboard");
    } catch (err: any) {
      setUser(null);
      setToken(null);
      showToast(err?.message || "Invalid email or password. Please try again.", "error");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (email: string, password: string, name: string) => {
    setIsLoading(true);
    try {
      const { error, data } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: name,
          }
        }
      });
      if (error) throw error;

      if (data.session) {
        setToken(data.session.access_token);
        showToast("Account created successfully!", "success");
        router.push("/dashboard");
      } else {
        // If email confirmation is required, session might be null
        showToast("Registration successful! Please check your email for confirmation.", "success");
        router.push("/login");
      }
    } catch (err: any) {
      setUser(null);
      setToken(null);
      showToast(err?.message || "Signup failed. Please try again.", "error");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setToken(null);
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
