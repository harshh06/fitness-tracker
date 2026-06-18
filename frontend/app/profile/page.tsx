"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { useProfile } from "@/lib/hooks/useProfile";
import { lbsToKg, kgToLbs, cmToFtIn, ftInToCm } from "@/lib/units";

export default function ProfilePage() {
  const { logout, refetchUserData, updateUser } = useAuth();
  const {
    profile,
    healthConditions,
    isLoading,
    updateProfile,
    addHealthCondition,
    deleteHealthCondition,
  } = useProfile();

  // Local form state — initialized from profile once loaded
  const [weight, setWeight] = useState("");
  const [heightFt, setHeightFt] = useState("");
  const [heightIn, setHeightIn] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [unitPreference, setUnitPreference] = useState("lbs");
  const [isSaving, setIsSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  // Health condition form
  const [newConditionName, setNewConditionName] = useState("");
  const [newBodyArea, setNewBodyArea] = useState("");
  const [newSeverity, setNewSeverity] = useState("mild");
  const [isAddingCondition, setIsAddingCondition] = useState(false);

  // Sync state once profile is loaded
  useEffect(() => {
    if (profile) {
      const pref = profile.unit_preference || "lbs";
      setUnitPreference(pref);
      
      if (pref === "kg") {
        if (profile.weight_kg) setWeight(String(profile.weight_kg));
        if (profile.height_cm) setHeightCm(String(profile.height_cm));
      } else {
        if (profile.weight_kg) {
          // Convert stored kg to display lbs
          setWeight(String(Math.round(kgToLbs(profile.weight_kg) * 10) / 10));
        }
        if (profile.height_cm) {
          // Convert stored cm to display feet and inches
          const { ft, in: inch } = cmToFtIn(profile.height_cm);
          setHeightFt(String(ft));
          setHeightIn(String(inch));
        }
      }
    }
  }, [profile]);

  const handleUnitChange = async (newUnit: "lbs" | "kg") => {
    if (newUnit === unitPreference) return;
    
    setUnitPreference(newUnit);
    
    if (newUnit === "kg") {
      // Convert current display weight from lbs to kg
      if (weight) {
        setWeight(String(Math.round(lbsToKg(parseFloat(weight)) * 10) / 10));
      }
      // Convert height from ft/in to cm
      const ft = parseFloat(heightFt || "0");
      const inch = parseFloat(heightIn || "0");
      const cmVal = ftInToCm(ft, inch);
      if (cmVal > 0) {
        setHeightCm(String(Math.round(cmVal)));
      }
    } else {
      // Convert current display weight from kg to lbs
      if (weight) {
        setWeight(String(Math.round(kgToLbs(parseFloat(weight)) * 10) / 10));
      }
      // Convert height from cm to ft/in
      const cmVal = parseFloat(heightCm || "0");
      if (cmVal > 0) {
        const { ft, in: inch } = cmToFtIn(cmVal);
        setHeightFt(String(ft));
        setHeightIn(String(inch));
      }
    }

    // Auto-save the unit preference immediately
    try {
      const updatedProfile = await updateProfile({ unit_preference: newUnit });
      updateUser(updatedProfile as any);
    } catch {
      // Silently fail — user can still save via Save Vitals button
    }
  };

  const handleSaveVitals = async () => {
    setIsSaving(true);
    setSaveMsg(null);
    try {
      let weight_kg: number | undefined;
      let height_cm: number | undefined;

      if (unitPreference === "kg") {
        weight_kg = parseFloat(weight) || undefined;
        height_cm = parseFloat(heightCm) || undefined;
      } else {
        const lbsVal = parseFloat(weight);
        if (lbsVal) {
          weight_kg = lbsToKg(lbsVal);
        }
        
        const ft = parseInt(heightFt || "0");
        const inch = parseInt(heightIn || "0");
        if (ft || inch) {
          height_cm = ftInToCm(ft, inch);
        }
      }

      const updatedProfile = await updateProfile({
        weight_kg,
        height_cm,
        unit_preference: unitPreference,
      });
      updateUser(updatedProfile as any);
      await refetchUserData();
      setSaveMsg("Saved!");
      setTimeout(() => setSaveMsg(null), 2000);
    } catch {
      setSaveMsg("Failed to save");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddCondition = async () => {
    if (!newConditionName || !newBodyArea) return;
    setIsAddingCondition(true);
    try {
      await addHealthCondition({
        condition_name: newConditionName,
        body_area: newBodyArea,
        severity: newSeverity,
      });
      setNewConditionName("");
      setNewBodyArea("");
      setNewSeverity("mild");
    } catch {
      // error handled silently
    } finally {
      setIsAddingCondition(false);
    }
  };

  if (isLoading) {
    return (
      <main className="flex-grow pt-24 px-container-margin w-full max-w-2xl mx-auto flex flex-col gap-stack-space-lg pb-32">
        <div className="flex flex-col items-center mt-8 gap-4 animate-pulse">
          <div className="w-32 h-32 rounded-full bg-surface-container" />
          <div className="h-6 w-40 bg-surface-container rounded-md" />
          <div className="h-4 w-48 bg-surface-container rounded-md" />
        </div>
      </main>
    );
  }

  return (
    <main className="flex-grow pt-24 md:pt-8 px-container-margin w-full max-w-2xl mx-auto flex flex-col gap-stack-space-lg pb-32">
      {/* Profile Header */}
      <section className="flex flex-col items-center mt-8 gap-4">
        <div className="relative">
          <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-surface shadow-sm bg-surface-container flex items-center justify-center">
            <span
              className="material-symbols-outlined text-6xl text-outline"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              person
            </span>
          </div>
        </div>
        <div className="text-center">
          <h2 className="font-headline-lg text-on-surface">
            {profile?.display_name || "User"}
          </h2>
          <p className="font-body-md text-on-surface-variant">{profile?.email}</p>
        </div>
      </section>

      {/* Vitals Section */}
      <section className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/30 p-6 flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h3 className="font-headline-md text-on-surface">Vitals</h3>
          {saveMsg && (
            <span className="font-label-sm text-primary animate-in fade-in duration-200">
              {saveMsg}
            </span>
          )}
        </div>
        <div className="grid grid-cols-1 gap-6">
          {/* Unit Preference Selector */}
          <div className="flex flex-col gap-2">
            <label className="font-label-sm text-on-surface-variant uppercase tracking-wider">
              Weight Unit Preference
            </label>
            <div className="flex bg-surface-container-low rounded-lg p-1 h-[56px] border border-outline-variant/10">
              <button
                type="button"
                onClick={() => handleUnitChange("lbs")}
                className={`flex-1 rounded-md font-label-lg transition-colors cursor-pointer ${
                  unitPreference === "lbs"
                    ? "bg-primary text-on-primary shadow-sm"
                    : "text-on-surface hover:bg-surface-container-high"
                }`}
              >
                lbs (Imperial)
              </button>
              <button
                type="button"
                onClick={() => handleUnitChange("kg")}
                className={`flex-1 rounded-md font-label-lg transition-colors cursor-pointer ${
                  unitPreference === "kg"
                    ? "bg-primary text-on-primary shadow-sm"
                    : "text-on-surface hover:bg-surface-container-high"
                }`}
              >
                kg (Metric)
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-element-gap">
          {/* Weight */}
          <div className="flex flex-col gap-2">
            <label className="font-label-sm text-on-surface-variant uppercase tracking-wider" htmlFor="weight">
              Weight ({unitPreference})
            </label>
            <div className="relative">
              <input
                className="w-full bg-surface-container-low border-none rounded-lg h-[56px] px-4 font-body-lg text-on-surface focus:ring-2 focus:ring-primary focus:bg-surface-container-lowest transition-colors"
                id="weight"
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 font-label-sm text-on-surface-variant">
                {unitPreference}
              </span>
            </div>
          </div>

          {/* Height */}
          <div className="flex flex-col gap-2">
            <label className="font-label-sm text-on-surface-variant uppercase tracking-wider">
              Height
            </label>
            {unitPreference === "kg" ? (
              <div className="relative">
                <input
                  className="w-full bg-surface-container-low border-none rounded-lg h-[56px] px-4 font-body-lg text-on-surface focus:ring-2 focus:ring-primary focus:bg-surface-container-lowest transition-colors"
                  type="number"
                  placeholder="Height in cm"
                  value={heightCm}
                  onChange={(e) => setHeightCm(e.target.value)}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 font-label-sm text-on-surface-variant">
                  cm
                </span>
              </div>
            ) : (
              <div className="relative flex items-center bg-surface-container-low rounded-lg focus-within:ring-2 focus-within:ring-primary focus-within:bg-surface-container-lowest transition-colors h-[56px]">
                <input
                  className="w-1/2 bg-transparent border-none text-right font-body-lg text-on-surface focus:ring-0"
                  id="height-ft"
                  type="number"
                  value={heightFt}
                  onChange={(e) => setHeightFt(e.target.value)}
                />
                <span className="font-label-sm text-on-surface-variant px-1">ft</span>
                <input
                  className="w-1/2 bg-transparent border-none text-right font-body-lg text-on-surface focus:ring-0"
                  id="height-in"
                  type="number"
                  value={heightIn}
                  onChange={(e) => setHeightIn(e.target.value)}
                />
                <span className="font-label-sm text-on-surface-variant pr-4 pl-1">in</span>
              </div>
            )}
          </div>
        </div>

        <Button
          variant="primary"
          size="lg"
          className="w-full"
          onClick={handleSaveVitals}
          disabled={isSaving}
        >
          {isSaving ? "Saving..." : "Save Vitals"}
        </Button>
      </section>

      {/* Health Conditions */}
      <section className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/30 p-6 flex flex-col gap-4">
        <div>
          <h3 className="font-headline-md text-on-surface">Health & Physical Considerations</h3>
          <p className="font-body-md text-on-surface-variant mt-1">
            Track injuries, sensitivities, or areas requiring modifications.
          </p>
        </div>

        {/* Existing conditions */}
        {healthConditions.length > 0 && (
          <div className="flex flex-col gap-2">
            {healthConditions.map((hc) => (
              <div
                key={hc.id}
                className="flex items-center justify-between p-3 rounded-lg bg-surface-container-low border border-outline-variant/20"
              >
                <div className="flex flex-col">
                  <span className="font-body-lg font-medium text-on-surface">
                    {hc.condition_name}
                  </span>
                  <span className="font-label-sm text-on-surface-variant">
                    {hc.body_area} • {hc.severity}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-error hover:bg-error/10 rounded-full h-10 w-10 min-h-[40px] min-w-[40px]"
                  onClick={() => deleteHealthCondition(hc.id)}
                >
                  <span className="material-symbols-outlined text-xl">close</span>
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Add new condition form */}
        <div className="flex flex-col gap-3 pt-2 border-t border-outline-variant/20">
          <div className="grid grid-cols-2 gap-2">
            <input
              className="bg-surface-container-low border-none rounded-lg h-[48px] px-3 font-body-md text-on-surface focus:ring-2 focus:ring-primary transition-colors"
              placeholder="Condition (e.g. PFPS)"
              value={newConditionName}
              onChange={(e) => setNewConditionName(e.target.value)}
            />
            <input
              className="bg-surface-container-low border-none rounded-lg h-[48px] px-3 font-body-md text-on-surface focus:ring-2 focus:ring-primary transition-colors"
              placeholder="Body area (e.g. right_knee)"
              value={newBodyArea}
              onChange={(e) => setNewBodyArea(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <select
              className="flex-1 bg-surface-container-low border-none rounded-lg h-[48px] px-3 font-body-md text-on-surface focus:ring-2 focus:ring-primary transition-colors"
              value={newSeverity}
              onChange={(e) => setNewSeverity(e.target.value)}
            >
              <option value="mild">Mild</option>
              <option value="moderate">Moderate</option>
              <option value="severe">Severe</option>
            </select>
            <Button
              variant="primary"
              className="h-[48px] px-6"
              onClick={handleAddCondition}
              disabled={isAddingCondition || !newConditionName || !newBodyArea}
            >
              {isAddingCondition ? "Adding..." : "Add"}
            </Button>
          </div>
        </div>
      </section>

      {/* Logout Action */}
      <div className="mt-4 mb-8">
        <Button
          variant="outline"
          size="lg"
          className="w-full text-error border-error/30 hover:bg-error/5"
          onClick={logout}
        >
          <span className="material-symbols-outlined mr-2">logout</span>
          Log Out
        </Button>
      </div>
    </main>
  );
}
