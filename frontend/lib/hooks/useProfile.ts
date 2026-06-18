import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";

// ── Types ─────────────────────────────────────────────────────

export interface ProfileData {
  id: string;
  user_id: string;
  display_name: string;
  email: string;
  date_of_birth: string | null;
  gender: string | null;
  weight_kg: number | null;
  height_cm: number | null;
  unit_preference: string;
  fitness_level: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface HealthCondition {
  id: string;
  user_id: string;
  condition_name: string;
  body_area: string;
  severity: string;
  notes: string | null;
  diagnosed_date: string | null;
  is_active: boolean;
  created_at: string;
}

interface ProfileResponse {
  profile: ProfileData;
  health_conditions: HealthCondition[];
}

interface ProfileUpdateFields {
  display_name?: string;
  date_of_birth?: string;
  gender?: string;
  weight_kg?: number;
  height_cm?: number;
  unit_preference?: string;
  fitness_level?: string;
}

interface HealthConditionCreate {
  condition_name: string;
  body_area: string;
  severity: string;
  notes?: string;
  diagnosed_date?: string;
}

// ── Hook ──────────────────────────────────────────────────────

export function useProfile() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [healthConditions, setHealthConditions] = useState<HealthCondition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await api.get<ProfileResponse>("/profile/");
      setProfile(data.profile);
      setHealthConditions(data.health_conditions);
    } catch (err: any) {
      setError(err?.detail || "Failed to load profile");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const updateProfile = async (fields: ProfileUpdateFields) => {
    const updated = await api.put<any>("/profile/", fields);
    // PUT /profile returns profile fields + health_conditions at root level
    const { health_conditions, ...profileFields } = updated;
    setProfile(profileFields as ProfileData);
    if (health_conditions) setHealthConditions(health_conditions);
    return profileFields;
  };

  const addHealthCondition = async (data: HealthConditionCreate) => {
    const newCondition = await api.post<HealthCondition>("/profile/health-conditions", data);
    setHealthConditions((prev) => [...prev, newCondition]);
    return newCondition;
  };

  const deleteHealthCondition = async (conditionId: string) => {
    await api.delete(`/profile/health-conditions/${conditionId}`);
    setHealthConditions((prev) => prev.filter((hc) => hc.id !== conditionId));
  };

  return {
    profile,
    healthConditions,
    isLoading,
    error,
    updateProfile,
    addHealthCondition,
    deleteHealthCondition,
    refetch: fetchProfile,
  };
}
