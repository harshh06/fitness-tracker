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

  // Mode state: view vs edit
  const [isEditMode, setIsEditMode] = useState(false);

  // Form states
  const [displayName, setDisplayName] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("male");
  const [weight, setWeight] = useState("50");
  const [heightFt, setHeightFt] = useState("5");
  const [heightIn, setHeightIn] = useState("10");
  const [heightCm, setHeightCm] = useState("178");
  const [unitPreference, setUnitPreference] = useState<"lbs" | "kg">("lbs");
  const [fitnessLevel, setFitnessLevel] = useState("intermediate");
  const [avatarUrl, setAvatarUrl] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  // Health condition states
  const [newConditionName, setNewConditionName] = useState("");
  const [newBodyArea, setNewBodyArea] = useState("");
  const [newSeverity, setNewSeverity] = useState("mild");
  const [showAddConditionForm, setShowAddConditionForm] = useState(false);
  const [isAddingCondition, setIsAddingCondition] = useState(false);

  // Initialize values when profile loads
  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || "");
      setDob(profile.date_of_birth || "");
      setGender(profile.gender || "male");
      setFitnessLevel(profile.fitness_level || "intermediate");
      setAvatarUrl(profile.avatar_url || "");
      
      const pref = (profile.unit_preference || "lbs") as "lbs" | "kg";
      setUnitPreference(pref);
      
      if (pref === "kg") {
        if (profile.weight_kg) setWeight(String(profile.weight_kg));
        if (profile.height_cm) setHeightCm(String(profile.height_cm));
      } else {
        if (profile.weight_kg) {
          setWeight(String(Math.round(kgToLbs(profile.weight_kg) * 10) / 10));
        }
        if (profile.height_cm) {
          const { ft, in: inch } = cmToFtIn(profile.height_cm);
          setHeightFt(String(ft));
          setHeightIn(String(inch));
        }
      }
    }
  }, [profile]);

  // Age calculation helper
  const calculateAge = (dobString: string | null) => {
    if (!dobString) return null;
    const birthDate = new Date(dobString);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const handleUnitToggle = (unit: "lbs" | "kg") => {
    if (unit === unitPreference) return;
    setUnitPreference(unit);
    
    const wVal = parseFloat(weight) || 0;
    if (unit === "kg") {
      setWeight(String(Math.round(lbsToKg(wVal) * 10) / 10));
      const ft = parseFloat(heightFt || "0");
      const inch = parseFloat(heightIn || "0");
      const cmVal = ftInToCm(ft, inch);
      if (cmVal > 0) {
        setHeightCm(String(Math.round(cmVal)));
      }
    } else {
      setWeight(String(Math.round(kgToLbs(wVal) * 10) / 10));
      const cmVal = parseFloat(heightCm || "0");
      if (cmVal > 0) {
        const { ft, in: inch } = cmToFtIn(cmVal);
        setHeightFt(String(ft));
        setHeightIn(String(inch));
      }
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const max_size = 200;
        let width = img.width;
        let height = img.height;
        
        if (width > height) {
          if (width > max_size) {
            height *= max_size / width;
            width = max_size;
          }
        } else {
          if (height > max_size) {
            width *= max_size / height;
            height = max_size;
          }
        }
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL("image/jpeg", 0.75);
          setAvatarUrl(dataUrl);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleWeightStepper = (action: "add" | "remove") => {
    const currentVal = parseFloat(weight) || 0;
    const step = 0.5;
    const newVal = action === "add" ? currentVal + step : Math.max(0, currentVal - step);
    setWeight(String(Math.round(newVal * 10) / 10));
  };

  const handleSaveProfile = async () => {
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
        display_name: displayName,
        date_of_birth: dob || undefined,
        gender: gender || undefined,
        weight_kg,
        height_cm,
        unit_preference: unitPreference,
        fitness_level: fitnessLevel || undefined,
        avatar_url: avatarUrl || undefined,
      });

      updateUser(updatedProfile as any);
      await refetchUserData();
      
      setSaveMsg("Profile updated successfully!");
      setIsEditMode(false);
      setTimeout(() => setSaveMsg(null), 2000);
    } catch (err) {
      setSaveMsg("Failed to save changes");
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
      setShowAddConditionForm(false);
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

  // ── EDIT MODE ───────────────────────────────────────────────
  if (isEditMode) {
    return (
      <div className="bg-surface-bright min-h-screen pb-32">
        {/* Navigation Header */}
        <header className="bg-white border-b border-zinc-100 shadow-[0_4px_20px_rgba(0,0,0,0.06)] sticky top-0 z-50 w-full flex justify-between items-center px-5 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsEditMode(false)}
              className="active:scale-95 transition-all duration-200 p-2 -ml-2 rounded-full hover:bg-zinc-50 flex items-center justify-center cursor-pointer"
            >
              <span className="material-symbols-outlined text-on-surface">arrow_back</span>
            </button>
            <h1 className="font-sans font-medium tracking-tight text-zinc-900 text-xl">Edit Profile</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary">person_edit</span>
          </div>
        </header>

        <main className="max-w-xl mx-auto px-5 pt-8 space-y-10">
          {/* Section 1: Core Details */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>badge</span>
              <h2 className="font-headline-md text-headline-md text-on-surface">Core Details</h2>
            </div>
            
            {/* Profile Picture Display & URL field */}
            <div className="flex flex-col items-center bg-white p-6 rounded-3xl ambient-shadow">
              <input
                type="file"
                id="avatar-upload-input"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
              <div
                onClick={() => document.getElementById("avatar-upload-input")?.click()}
                className="relative group cursor-pointer"
              >
                <div className="w-28 h-28 rounded-full border-4 border-surface-container bg-surface-variant overflow-hidden flex items-center justify-center shadow-inner hover:opacity-90 transition-opacity">
                  {avatarUrl ? (
                    <img className="w-full h-full object-cover" src={avatarUrl} alt="Avatar Preview" />
                  ) : (
                    <span className="material-symbols-outlined text-5xl text-outline">person</span>
                  )}
                </div>
                <div className="absolute bottom-0 right-0 bg-primary text-on-primary w-10 h-10 rounded-full flex items-center justify-center ambient-shadow border-4 border-white active:scale-95 transition-transform">
                  <span className="material-symbols-outlined text-xl">photo_camera</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => document.getElementById("avatar-upload-input")?.click()}
                className="mt-4 font-label-lg text-label-lg text-primary uppercase tracking-wider hover:underline cursor-pointer bg-transparent border-none"
              >
                Upload Photo
              </button>
              {/* <div className="w-full max-w-sm mt-4">
                <label className="font-label-lg text-on-surface-variant block text-center mb-1">Or paste Image URL</label>
                <input
                  type="text"
                  className="w-full h-12 px-4 rounded-xl border border-zinc-200 bg-surface-container-low font-body-md text-on-surface text-center focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                  placeholder="https://example.com/avatar.png"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                />
              </div> */}
            </div>

            <div className="space-y-6">
              {/* Display Name */}
              <div className="space-y-2">
                <label className="font-label-lg text-on-surface-variant block ml-1">Display Name</label>
                <input
                  className="w-full h-16 px-5 rounded-2xl border border-zinc-200 bg-white ambient-shadow font-body-md text-on-surface focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                  placeholder="Enter your name"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Date of Birth */}
                <div className="space-y-2">
                  <label className="font-label-lg text-on-surface-variant block ml-1">Date of Birth</label>
                  <div className="relative">
                    <input
                      className="w-full h-16 px-5 rounded-2xl border border-zinc-200 bg-white ambient-shadow font-body-md text-on-surface focus:ring-2 focus:ring-primary focus:border-primary transition-all appearance-none"
                      type="date"
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                    />
                    <span className="material-symbols-outlined absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-outline">calendar_today</span>
                  </div>
                </div>

                {/* Gender */}
                <div className="space-y-2">
                  <label className="font-label-lg text-on-surface-variant block ml-1">Gender</label>
                  <div className="relative">
                    <select
                      className="w-full h-16 px-5 pr-12 rounded-2xl border border-zinc-200 bg-white ambient-shadow font-body-md text-on-surface focus:ring-2 focus:ring-primary focus:border-primary transition-all appearance-none cursor-pointer"
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-outline">expand_more</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Section 2: Body Metrics */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>analytics</span>
              <h2 className="font-headline-md text-headline-md text-on-surface">Body Metrics</h2>
            </div>

            <div className="bg-white p-6 rounded-3xl ambient-shadow space-y-8 border border-zinc-100">
              {/* Unit Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-label-lg text-label-lg text-on-surface">Weight Unit</h3>
                  <p className="font-label-sm text-label-sm text-on-surface-variant">Used for all weight tracking</p>
                </div>
                <div className="flex bg-surface-container rounded-xl p-1 w-32 h-12 relative">
                  <div
                    className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-primary rounded-lg transition-all duration-300 ${
                      unitPreference === "lbs" ? "left-1" : "left-[calc(50%+2px)]"
                    }`}
                  />
                  <button
                    type="button"
                    className={`relative z-10 flex-1 text-label-lg font-bold transition-colors cursor-pointer ${
                      unitPreference === "lbs" ? "text-white" : "text-on-surface-variant"
                    }`}
                    onClick={() => handleUnitToggle("lbs")}
                  >
                    lbs
                  </button>
                  <button
                    type="button"
                    className={`relative z-10 flex-1 text-label-lg font-bold transition-colors cursor-pointer ${
                      unitPreference === "kg" ? "text-white" : "text-on-surface-variant"
                    }`}
                    onClick={() => handleUnitToggle("kg")}
                  >
                    kg
                  </button>
                </div>
              </div>

              {/* Weight Input with Stepper */}
              <div className="space-y-3">
                <label className="font-label-lg text-on-surface-variant block">Current Weight</label>
                <div className="flex items-center justify-between gap-4">
                  <button
                    type="button"
                    onClick={() => handleWeightStepper("remove")}
                    className="w-16 h-16 rounded-2xl bg-surface-container flex items-center justify-center active:scale-90 transition-transform cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-2xl font-bold">remove</span>
                  </button>
                  <div className="flex-1 text-center">
                    <div className="flex items-baseline justify-center gap-1">
                      <input
                        type="number"
                        step="0.1"
                        className="font-headline-lg text-headline-lg w-24 text-center border-b border-zinc-200 focus:border-primary focus:ring-0 bg-transparent text-on-surface"
                        value={weight}
                        onChange={(e) => setWeight(e.target.value)}
                      />
                      <span className="font-label-lg text-primary uppercase">{unitPreference}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleWeightStepper("add")}
                    className="w-16 h-16 rounded-2xl bg-primary text-on-primary flex items-center justify-center active:scale-90 transition-transform cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-2xl font-bold">add</span>
                  </button>
                </div>
              </div>

              {/* Height Input */}
              <div className="space-y-3">
                <label className="font-label-lg text-on-surface-variant block">Current Height</label>
                {unitPreference === "lbs" ? (
                  <div className="flex gap-4">
                    <div className="flex-1 relative">
                      <input
                        className="w-full h-16 px-5 rounded-2xl border-none bg-surface-container-low font-body-md text-on-surface text-center focus:ring-2 focus:ring-primary"
                        type="number"
                        value={heightFt}
                        onChange={(e) => setHeightFt(e.target.value)}
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 font-label-lg text-outline">ft</span>
                    </div>
                    <div className="flex-1 relative">
                      <input
                        className="w-full h-16 px-5 rounded-2xl border-none bg-surface-container-low font-body-md text-on-surface text-center focus:ring-2 focus:ring-primary"
                        type="number"
                        value={heightIn}
                        onChange={(e) => setHeightIn(e.target.value)}
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 font-label-lg text-outline">in</span>
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    <input
                      className="w-full h-16 px-5 rounded-2xl border-none bg-surface-container-low font-body-md text-on-surface text-center focus:ring-2 focus:ring-primary"
                      type="number"
                      value={heightCm}
                      onChange={(e) => setHeightCm(e.target.value)}
                    />
                    <span className="absolute right-6 top-1/2 -translate-y-1/2 font-label-lg text-outline">cm</span>
                  </div>
                )}
              </div>

              {/* Fitness Level */}
              <div className="space-y-3">
                <label className="font-label-lg text-on-surface-variant block">Fitness Level</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setFitnessLevel("beginner")}
                    className={`flex flex-col items-center justify-center gap-2 h-24 rounded-2xl border-2 transition-all cursor-pointer ${
                      fitnessLevel === "beginner"
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-surface-variant hover:border-primary text-outline"
                    }`}
                  >
                    <span className="material-symbols-outlined">directions_walk</span>
                    <span className="font-label-sm uppercase">Beginner</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFitnessLevel("intermediate")}
                    className={`flex flex-col items-center justify-center gap-2 h-24 rounded-2xl border-2 transition-all cursor-pointer ${
                      fitnessLevel === "intermediate"
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-surface-variant hover:border-primary text-outline"
                    }`}
                  >
                    <span className="material-symbols-outlined">sprint</span>
                    <span className="font-label-sm uppercase">Inter</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFitnessLevel("advanced")}
                    className={`flex flex-col items-center justify-center gap-2 h-24 rounded-2xl border-2 transition-all cursor-pointer ${
                      fitnessLevel === "advanced"
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-surface-variant hover:border-primary text-outline"
                    }`}
                  >
                    <span className="material-symbols-outlined">fitness_center</span>
                    <span className="font-label-sm uppercase">Adv</span>
                  </button>
                </div>
              </div>
            </div>
          </section>
        </main>

        {/* Save CTA */}
        <div className="fixed bottom-0 left-0 w-full p-5 bg-gradient-to-t from-surface-bright via-surface-bright/95 to-transparent z-40">
          <button
            onClick={handleSaveProfile}
            disabled={isSaving}
            className="w-full h-[64px] bg-primary text-on-primary rounded-[16px] font-bold text-body-lg shadow-lg hover:shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 group cursor-pointer disabled:bg-zinc-400"
          >
            <span>{isSaving ? "Saving..." : "Save Changes"}</span>
            <span className="material-symbols-outlined transition-transform group-hover:translate-x-1">arrow_forward</span>
          </button>
        </div>
      </div>
    );
  }

  // ── VIEW MODE (READ ONLY WITH EDIT TRIGGER) ──────────────────
  return (
    <div className="bg-surface min-h-screen pb-32">
      {/* Header View Mode */}
      <header className="bg-white/90 backdrop-blur-md sticky top-0 z-50 border-b border-slate-100 shadow-sm flex justify-between items-center w-full px-5 py-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-surface-container overflow-hidden flex-shrink-0 flex items-center justify-center border border-zinc-200">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="User Avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="material-symbols-outlined text-outline">person</span>
            )}
          </div>
        </div>
        <div className="text-center absolute left-1/2 -translate-x-1/2">
          <h1 className="font-sans font-bold text-lg tracking-tight text-blue-600 font-black text-xl">Pulse Fitness</h1>
        </div>
        <button
          onClick={() => setIsEditMode(true)}
          className="w-10 h-10 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-50 transition-colors active:scale-95 cursor-pointer"
        >
          <span className="material-symbols-outlined text-2xl">settings</span>
        </button>
      </header>

      <main className="px-container-margin w-full max-w-2xl mx-auto flex flex-col gap-stack-space-lg mt-8">
        {/* Profile Header */}
        <section className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-sm bg-surface-container flex items-center justify-center">
              {profile?.avatar_url ? (
                <img alt="User profile" className="w-full h-full object-cover" src={profile.avatar_url} />
              ) : (
                <span className="material-symbols-outlined text-6xl text-outline" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
              )}
            </div>
            <button
              onClick={() => setIsEditMode(true)}
              className="absolute bottom-0 right-0 w-10 h-10 bg-primary text-on-primary rounded-full flex items-center justify-center shadow-md active:scale-95 transition-transform cursor-pointer"
            >
              <span className="material-symbols-outlined text-xl">edit</span>
            </button>
          </div>
          <div className="text-center">
            <h2 className="font-headline-lg text-headline-lg text-on-surface">{profile?.display_name || "User"}</h2>
            <p className="font-body-md text-body-md text-on-surface-variant">{profile?.email}</p>
            <button
              onClick={() => setIsEditMode(true)}
              className="mt-4 px-6 h-10 bg-primary text-on-primary font-label-lg text-label-lg rounded-full shadow-md flex items-center justify-center gap-2 mx-auto active:scale-95 transition-transform cursor-pointer"
            >
              <span className="material-symbols-outlined text-xl">edit_square</span>
              Edit Profile
            </button>
          </div>
        </section>

        {/* Vitals Section */}
        <section className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/30 p-6 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h3 className="font-headline-md text-headline-md text-on-surface">Vitals</h3>
            {saveMsg && (
              <span className="font-label-sm text-primary animate-in fade-in duration-200">
                {saveMsg}
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-element-gap">
            {/* Age */}
            <div className="flex flex-col gap-2">
              <label className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider" htmlFor="age">Age</label>
              <div className="relative">
                <input
                  disabled
                  className="w-full bg-surface-container-low border-none rounded-lg h-touch-target-min px-4 font-body-lg text-body-lg text-on-surface/70"
                  id="age"
                  type="text"
                  value={dob ? `${calculateAge(dob) || "—"}` : "—"}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 font-label-sm text-label-sm text-on-surface-variant">yrs</span>
              </div>
            </div>
            {/* Weight */}
            <div className="flex flex-col gap-2">
              <label className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider" htmlFor="weight">Weight</label>
              <div className="relative">
                <input
                  disabled
                  className="w-full bg-surface-container-low border-none rounded-lg h-touch-target-min px-4 font-body-lg text-body-lg text-on-surface/70"
                  id="weight"
                  type="text"
                  value={weight}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 font-label-sm text-label-sm text-on-surface-variant">{unitPreference}</span>
              </div>
            </div>
            {/* Height */}
            <div className="flex flex-col gap-2">
              <label className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider" htmlFor="height">Height</label>
              {unitPreference === "kg" ? (
                <div className="relative">
                  <input
                    disabled
                    className="w-full bg-surface-container-low border-none rounded-lg h-touch-target-min px-4 font-body-lg text-body-lg text-on-surface/70"
                    id="height"
                    type="text"
                    value={heightCm}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 font-label-sm text-label-sm text-on-surface-variant">cm</span>
                </div>
              ) : (
                <div className="relative flex items-center bg-surface-container-low rounded-lg h-touch-target-min w-full">
                  <input disabled className="w-1/2 bg-transparent border-none text-right font-body-lg text-on-surface/70 focus:ring-0" value={heightFt} />
                  <span className="font-label-sm text-on-surface-variant px-1">ft</span>
                  <input disabled className="w-1/2 bg-transparent border-none text-right font-body-lg text-on-surface/70 focus:ring-0" value={heightIn} />
                  <span className="font-label-sm text-on-surface-variant pr-4 pl-1">in</span>
                </div>
              )}
            </div>
            {/* Fitness Level */}
            <div className="flex flex-col gap-2">
              <label className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Fitness Level</label>
              <input
                disabled
                className="w-full bg-surface-container-low border-none rounded-lg h-touch-target-min px-4 font-body-lg text-body-lg text-on-surface/70 capitalize"
                type="text"
                value={fitnessLevel}
              />
            </div>
            {/* Gender */}
            <div className="flex flex-col gap-2 col-span-1 md:col-span-2 lg:col-span-1">
              <label className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Gender</label>
              <input
                disabled
                className="w-full bg-surface-container-low border-none rounded-lg h-touch-target-min px-4 font-body-lg text-body-lg text-on-surface/70 capitalize"
                type="text"
                value={gender}
              />
            </div>
          </div>
        </section>

        {/* Health Considerations */}
        <section className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/30 p-6 flex flex-col gap-4">
          <div>
            <h3 className="font-headline-md text-headline-md text-on-surface">Health &amp; Physical Considerations</h3>
            <p className="font-body-md text-body-md text-on-surface-variant mt-1">Note any injuries, sensitivities, or areas requiring modifications.</p>
          </div>

          {/* Condition List */}
          <div className="flex flex-col gap-3">
            {healthConditions.length > 0 ? (
              healthConditions.map((hc) => (
                <div key={hc.id} className="bg-surface-container-low rounded-lg p-4 flex items-center justify-between border border-outline-variant/20">
                  <div>
                    <h4 className="font-label-lg text-on-surface">{hc.condition_name}</h4>
                    <p className="font-label-sm text-on-surface-variant capitalize">{hc.body_area} | {hc.severity}</p>
                  </div>
                  <button
                    onClick={() => deleteHealthCondition(hc.id)}
                    className="text-on-surface-variant hover:text-error transition-colors p-2 rounded-full hover:bg-zinc-200/50 flex items-center justify-center cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-xl">delete</span>
                  </button>
                </div>
              ))
            ) : (
              <p className="text-on-surface-variant font-body-md text-center py-4">No physical conditions logged.</p>
            )}
          </div>

          {/* Add Condition Trigger or Form */}
          {showAddConditionForm ? (
            <div className="flex flex-col gap-3 pt-4 border-t border-outline-variant/20 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="grid grid-cols-2 gap-2">
                <input
                  className="bg-surface-container-low border border-zinc-200 rounded-lg h-[48px] px-3 font-body-md text-on-surface focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                  placeholder="Condition (e.g. Right Knee Pain)"
                  value={newConditionName}
                  onChange={(e) => setNewConditionName(e.target.value)}
                />
                <input
                  className="bg-surface-container-low border border-zinc-200 rounded-lg h-[48px] px-3 font-body-md text-on-surface focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                  placeholder="Body Area (e.g. Knee)"
                  value={newBodyArea}
                  onChange={(e) => setNewBodyArea(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <select
                  className="flex-1 bg-surface-container-low border border-zinc-200 rounded-lg h-[48px] px-3 font-body-md text-on-surface focus:ring-2 focus:ring-primary focus:border-primary transition-colors cursor-pointer"
                  value={newSeverity}
                  onChange={(e) => setNewSeverity(e.target.value)}
                >
                  <option value="mild">Mild</option>
                  <option value="moderate">Moderate</option>
                  <option value="severe">Severe</option>
                </select>
                <div className="flex gap-1.5">
                  <Button
                    variant="primary"
                    className="h-[48px] px-4 cursor-pointer"
                    onClick={handleAddCondition}
                    disabled={isAddingCondition || !newConditionName || !newBodyArea}
                  >
                    {isAddingCondition ? "Adding..." : "Add"}
                  </Button>
                  <Button
                    variant="outline"
                    className="h-[48px] px-3 cursor-pointer"
                    onClick={() => setShowAddConditionForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowAddConditionForm(true)}
              className="w-full h-12 mt-2 bg-transparent border-2 border-dashed border-primary text-primary font-label-lg text-label-lg rounded-xl flex items-center justify-center gap-2 hover:bg-primary/5 active:scale-[0.98] transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined">add</span>
              ADD CONDITION
            </button>
          )}
        </section>

        {/* Log Out */}
        <div className="mt-4 mb-8">
          <button
            onClick={logout}
            className="w-full h-touch-target-min bg-error/10 hover:bg-error/15 text-error font-label-lg text-label-lg rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-transform cursor-pointer"
          >
            <span className="material-symbols-outlined text-xl">logout</span>
            Log Out
          </button>
        </div>
      </main>
    </div>
  );
}
