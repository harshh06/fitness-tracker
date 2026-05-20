"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface HealthCondition {
  id: string;
  name: string;
  bodyArea: string;
  severity: string;
}

export default function ProfilePage() {
  const [age, setAge] = useState("28");
  const [weight, setWeight] = useState("175");
  const [heightFt, setHeightFt] = useState("5");
  const [heightIn, setHeightIn] = useState("11");
  const [fitnessLevel, setFitnessLevel] = useState("intermediate");
  const [gender, setGender] = useState("male");

  const [conditions, setConditions] = useState<HealthCondition[]>([
    { id: "hc-1", name: "Right Knee Pain", bodyArea: "Lower Body", severity: "Medium" },
    { id: "hc-2", name: "Shoulder Impingement", bodyArea: "Upper Body", severity: "Low" },
  ]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newConditionName, setNewConditionName] = useState("");
  const [newBodyArea, setNewBodyArea] = useState("");
  const [newSeverity, setNewSeverity] = useState("low");

  const handleAddCondition = () => {
    if (!newConditionName.trim() || !newBodyArea.trim()) return;
    setConditions([
      ...conditions,
      {
        id: `hc-${Date.now()}`,
        name: newConditionName.trim(),
        bodyArea: newBodyArea.trim(),
        severity: newSeverity,
      },
    ]);
    setNewConditionName("");
    setNewBodyArea("");
    setNewSeverity("low");
    setShowAddForm(false);
  };

  const handleDeleteCondition = (id: string) => {
    setConditions(conditions.filter((c) => c.id !== id));
  };

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
          <Button
            size="icon"
            className="absolute bottom-0 right-0 w-10 h-10 rounded-full shadow-md"
          >
            <span className="material-symbols-outlined text-xl">edit</span>
          </Button>
        </div>
        <div className="text-center">
          <h2 className="font-headline-lg text-on-surface">Harsh Soni</h2>
          <p className="font-body-md text-on-surface-variant">harsh@example.com</p>
        </div>
      </section>

      {/* Vitals Section */}
      <section className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/30 p-6 flex flex-col gap-6">
        <h3 className="font-headline-md text-on-surface">Vitals</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-element-gap">
          {/* Age */}
          <div className="flex flex-col gap-2">
            <label className="font-label-sm text-on-surface-variant uppercase tracking-wider" htmlFor="age">
              Age
            </label>
            <div className="relative">
              <input
                className="w-full bg-surface-container-low border-none rounded-lg h-[56px] px-4 font-body-lg text-on-surface focus:ring-2 focus:ring-primary focus:bg-surface-container-lowest transition-colors"
                id="age"
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 font-label-sm text-on-surface-variant">
                yrs
              </span>
            </div>
          </div>

          {/* Weight */}
          <div className="flex flex-col gap-2">
            <label className="font-label-sm text-on-surface-variant uppercase tracking-wider" htmlFor="weight">
              Weight
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
                lbs
              </span>
            </div>
          </div>

          {/* Height */}
          <div className="flex flex-col gap-2">
            <label className="font-label-sm text-on-surface-variant uppercase tracking-wider">
              Height
            </label>
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
          </div>

          {/* Fitness Level */}
          <div className="flex flex-col gap-2">
            <label className="font-label-sm text-on-surface-variant uppercase tracking-wider" htmlFor="fitness-level">
              Fitness Level
            </label>
            <select
              className="w-full bg-surface-container-low border-none rounded-lg h-[56px] px-4 font-body-lg text-on-surface focus:ring-2 focus:ring-primary focus:bg-surface-container-lowest transition-colors appearance-none"
              id="fitness-level"
              value={fitnessLevel}
              onChange={(e) => setFitnessLevel(e.target.value)}
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>

          {/* Gender */}
          <div className="flex flex-col gap-2">
            <label className="font-label-sm text-on-surface-variant uppercase tracking-wider" htmlFor="gender">
              Gender
            </label>
            <select
              className="w-full bg-surface-container-low border-none rounded-lg h-[56px] px-4 font-body-lg text-on-surface focus:ring-2 focus:ring-primary focus:bg-surface-container-lowest transition-colors appearance-none"
              id="gender"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="non-binary">Non-binary</option>
              <option value="prefer-not-to-say">Prefer not to say</option>
            </select>
          </div>
        </div>
      </section>

      {/* Health Considerations — Structured Cards */}
      <section className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/30 p-6 flex flex-col gap-4">
        <div>
          <h3 className="font-headline-md text-on-surface">Health &amp; Physical Considerations</h3>
          <p className="font-body-md text-on-surface-variant mt-1">
            Note any injuries, sensitivities, or areas requiring modifications.
          </p>
        </div>

        {/* Condition Cards */}
        <div className="flex flex-col gap-3">
          {conditions.map((condition) => (
            <div
              key={condition.id}
              className="bg-surface-container-low rounded-lg p-4 flex items-center justify-between border border-outline-variant/20"
            >
              <div>
                <h4 className="font-label-lg text-on-surface">{condition.name}</h4>
                <p className="font-label-sm text-on-surface-variant">
                  {condition.bodyArea} | {condition.severity}
                </p>
              </div>
              <button
                onClick={() => handleDeleteCondition(condition.id)}
                className="text-on-surface-variant hover:text-error transition-colors"
              >
                <span className="material-symbols-outlined">delete</span>
              </button>
            </div>
          ))}
        </div>

        {/* Add Condition Form */}
        {showAddForm && (
          <div className="bg-surface-container-low rounded-lg p-4 border border-outline-variant/20 flex flex-col gap-3">
            <input
              className="w-full bg-surface border border-outline-variant rounded-lg h-[48px] px-4 font-body-md text-on-surface focus:ring-2 focus:ring-primary focus:outline-none"
              placeholder="Condition name (e.g., Right Knee Pain)"
              value={newConditionName}
              onChange={(e) => setNewConditionName(e.target.value)}
            />
            <input
              className="w-full bg-surface border border-outline-variant rounded-lg h-[48px] px-4 font-body-md text-on-surface focus:ring-2 focus:ring-primary focus:outline-none"
              placeholder="Body area (e.g., Lower Body)"
              value={newBodyArea}
              onChange={(e) => setNewBodyArea(e.target.value)}
            />
            <select
              className="w-full bg-surface border border-outline-variant rounded-lg h-[48px] px-4 font-body-md text-on-surface focus:ring-2 focus:ring-primary focus:outline-none appearance-none"
              value={newSeverity}
              onChange={(e) => setNewSeverity(e.target.value)}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowAddForm(false)}
              >
                Cancel
              </Button>
              <Button className="flex-1" onClick={handleAddCondition}>
                Add
              </Button>
            </div>
          </div>
        )}

        {/* Add Condition Button */}
        {!showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="w-full h-12 mt-2 bg-transparent border-2 border-dashed border-primary text-primary font-label-lg rounded-xl flex items-center justify-center gap-2 hover:bg-primary/5 active:scale-[0.98] transition-all uppercase tracking-wider"
          >
            <span className="material-symbols-outlined">add</span>
            ADD CONDITION
          </button>
        )}
      </section>

      {/* Logout Action */}
      <div className="mt-4 mb-8">
        <Button
          variant="outline"
          size="lg"
          className="w-full bg-error-container text-on-error-container border-none hover:bg-error-container/80"
        >
          <span className="material-symbols-outlined mr-2">logout</span>
          Log Out
        </Button>
      </div>
    </main>
  );
}
