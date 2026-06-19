"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useExerciseSearch, type ExerciseSearchResult } from "@/lib/hooks/useExerciseSearch";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { lbsToKg, kgToLbs } from "@/lib/units";
import Fuse from "fuse.js";

interface AddExerciseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (exercise: ExerciseSearchResult, customSets?: any[]) => void;
}

const SpeechRecognition =
  typeof window !== "undefined" &&
  ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

export function AddExerciseModal({ isOpen, onClose, onAdd }: AddExerciseModalProps) {
  const { user } = useAuth();
  const unitPreference = user?.unit_preference || "lbs";

  const { query, setQuery, results, isLoading } = useExerciseSearch();
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  
  const [allExercises, setAllExercises] = useState<ExerciseSearchResult[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [parsingStatus, setParsingStatus] = useState("");

  // UI state for ambiguous matching
  const [pendingVoiceSets, setPendingVoiceSets] = useState<any[] | null>(null);
  const [showVoiceBanner, setShowVoiceBanner] = useState(false);

  // Load all exercises once when the modal is opened for fast local fuzzy matching
  useEffect(() => {
    if (isOpen) {
      api.get<ExerciseSearchResult[]>("/exercises")
        .then((res) => {
          setAllExercises(res || []);
        })
        .catch((err) => {
          console.error("Failed to pre-load exercise library:", err);
        });
    }
  }, [isOpen]);

  useEffect(() => {
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = "en-US";

      rec.onstart = () => {
        setIsListening(true);
        // Reset voice helper state on new record attempt
        setPendingVoiceSets(null);
        setShowVoiceBanner(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      rec.onresult = async (event: any) => {
        const transcript = event.results[0][0].transcript;
        const cleaned = transcript.trim().replace(/\.$/, "");
        
        setIsListening(false);
        setIsParsing(true);
        setParsingStatus("Analyzing voice...");

        try {
          // Send transcript to backend to parse structured exercises
          const parsedExercises = await api.post<any[]>("/voice/parse", { transcript: cleaned });
          
          if (!parsedExercises || parsedExercises.length === 0) {
            setQuery(cleaned);
            return;
          }

          // Initialize Fuse.js for local fuzzy matching (enabling score tracking)
          const fuse = new Fuse(allExercises, {
            keys: ["name"],
            threshold: 0.5,
            includeScore: true
          });

          let addedCount = 0;
          for (const parsedEx of parsedExercises) {
            let matchedEx: ExerciseSearchResult | null = null;
            const fuseResults = fuse.search(parsedEx.exercise_name);

            // Map parsed sets to our local schema, converting weight units if needed
            const mappedSets = parsedEx.sets.map((s: any, sIdx: number) => {
              let finalWeight = s.weight || 0;
              if (s.unit && s.unit !== unitPreference) {
                if (s.unit === "lbs" && unitPreference === "kg") {
                  finalWeight = Math.round(lbsToKg(s.weight) * 10) / 10;
                } else if (s.unit === "kg" && unitPreference === "lbs") {
                  finalWeight = Math.round(kgToLbs(s.weight) * 10) / 10;
                }
              }
              return {
                set_number: sIdx + 1,
                weight: s.weight === null ? 0 : finalWeight,
                reps: s.reps === null ? 0 : (s.reps || 10),
                duration_seconds: s.duration_seconds || undefined,
              };
            });

            // check confidence score: 0 is exact match, 1 is mismatch
            // If the top result is a very high-confidence match (score < 0.15)
            if (fuseResults.length > 0 && fuseResults[0].score !== undefined && fuseResults[0].score < 0.15) {
              matchedEx = fuseResults[0].item;
            }

            if (matchedEx) {
              // Ensure correct cardio/strength type mappings
              const finalSets = mappedSets.map((s: any) => ({
                ...s,
                weight: matchedEx.category === "cardio" ? 0 : s.weight,
                reps: matchedEx.category === "cardio" ? 0 : s.reps,
                duration_seconds: matchedEx.category === "cardio" ? (s.duration_seconds || 60) : undefined
              }));

              onAdd(matchedEx, finalSets);
              addedCount++;
            } else {
              // Ambiguous or generic term (like "squats" matching multiple variants)
              // Set search filter, store sets in pending state, and show helper banner
              setQuery(parsedEx.exercise_name);
              setPendingVoiceSets(mappedSets);
              setShowVoiceBanner(true);
            }
          }

          // If all parsed exercises were added automatically, close the modal
          if (addedCount > 0 && addedCount === parsedExercises.length) {
            setQuery("");
            onClose();
          }
        } catch (err) {
          console.error("Voice parsing failed:", err);
          setQuery(cleaned);
        } finally {
          setIsParsing(false);
        }
      };

      rec.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
      };

      setRecognition(rec);
    }
  }, [setQuery, onAdd, onClose, unitPreference, allExercises]);

  const toggleListening = () => {
    if (!recognition) {
      alert("Voice input is not supported in this browser. Please use Chrome, Safari, or Edge.");
      return;
    }

    if (isListening) {
      recognition.stop();
    } else {
      try {
        recognition.start();
      } catch (err) {
        console.error("Failed to start speech recognition:", err);
      }
    }
  };

  const handleClose = () => {
    // Reset helper states on close
    setQuery("");
    setPendingVoiceSets(null);
    setShowVoiceBanner(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center">
      {/* Backdrop */}
      <div 
        aria-hidden="true" 
        className="fixed inset-0 bg-on-surface/40 backdrop-blur-sm transition-opacity" 
        onClick={handleClose}
      />

      {/* Bottom Sheet Container */}
      <div className="relative w-full max-w-md bg-surface-container-lowest rounded-t-3xl md:rounded-3xl shadow-[0_-8px_40px_rgba(0,0,0,0.08)] flex flex-col max-h-[85vh] h-[80vh] pb-8 md:pb-0 animate-in slide-in-from-bottom-full md:slide-in-from-bottom-0 md:zoom-in-95 duration-300">
        
        {/* Drag Handle */}
        <div className="w-full flex justify-center pt-3 pb-1 md:hidden">
          <div className="w-12 h-1.5 bg-surface-variant rounded-full" />
        </div>

        {/* Header */}
        <div className="flex flex-col px-container-margin py-element-gap border-b border-surface-container gap-4">
          <div className="flex items-center justify-between">
            <h2 className="font-headline-md text-on-surface">Add Exercise</h2>
            <Button 
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="text-on-surface-variant hover:bg-surface-container rounded-full transition-colors"
            >
              <span className="material-symbols-outlined">close</span>
            </Button>
          </div>
          
          {/* Search Bar */}
          <div className="relative w-full flex items-center">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline">search</span>
            <input 
              type="text" 
              placeholder={isListening ? "Listening..." : "Search exercises..."}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                // Reset pending sets if user starts typing manually
                if (pendingVoiceSets) {
                  setPendingVoiceSets(null);
                  setShowVoiceBanner(false);
                }
              }}
              disabled={isParsing}
              className={cn(
                "w-full pl-10 pr-12 py-3 bg-surface-container rounded-xl border-none text-on-surface placeholder:text-outline-variant focus:ring-2 focus:ring-primary outline-none transition-all",
                isListening && "placeholder:text-primary placeholder:font-medium bg-primary/5 focus:ring-primary/40",
                isParsing && "opacity-50"
              )}
            />
            {/* Mic button */}
            <button
              type="button"
              onClick={toggleListening}
              disabled={isParsing}
              className={cn(
                "absolute right-3 w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer border-0 outline-none",
                isListening 
                  ? "bg-error text-white animate-pulse" 
                  : "text-outline hover:bg-surface-variant/20 active:bg-surface-variant/40",
                isParsing && "opacity-50 pointer-events-none"
              )}
              title={isListening ? "Stop listening" : "Start voice search"}
            >
              <span className="material-symbols-outlined text-[20px]">
                {isListening ? "mic" : "mic_none"}
              </span>
            </button>
          </div>
        </div>

        {/* Scrollable List */}
        <div className="flex-1 overflow-y-auto px-container-margin py-stack-space-lg space-y-2">
          {/* Ambiguity Help Banner */}
          {showVoiceBanner && pendingVoiceSets && (
            <div className="bg-primary/10 border border-primary/20 text-on-surface rounded-xl p-3 mb-2 flex items-start gap-2.5 animate-in slide-in-from-top-4 duration-300">
              <span className="material-symbols-outlined text-primary text-[20px] shrink-0 mt-0.5 animate-bounce">info</span>
              <div className="space-y-0.5">
                <p className="font-label-md text-primary font-semibold">Select the exact exercise</p>
                <p className="font-body-sm text-on-surface-variant text-[12px] leading-relaxed">
                  Tap which squat or exercise you did to automatically apply your parsed sets ({pendingVoiceSets.length} sets).
                </p>
              </div>
            </div>
          )}

          {isParsing ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4 animate-in fade-in duration-300">
              <div className="relative w-16 h-16 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-4 border-primary/20 animate-ping" />
                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary animate-spin" />
                <span className="material-symbols-outlined text-primary text-2xl">insights</span>
              </div>
              <div className="text-center space-y-1">
                <span className="font-title-medium text-on-surface block">{parsingStatus}</span>
                <span className="font-body-sm text-on-surface-variant text-sm block">Structuring your exercises...</span>
              </div>
            </div>
          ) : isLoading ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
              <span className="font-body-md text-on-surface-variant">Searching...</span>
            </div>
          ) : !query ? (
            <div className="text-center text-on-surface-variant py-8 px-4 flex flex-col items-center gap-4">
              <div className={cn(
                "w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300",
                isListening ? "bg-error/15 text-error scale-110" : "bg-primary/10 text-primary"
              )}>
                <span className={cn("material-symbols-outlined text-3xl", isListening && "animate-bounce")}>
                  {isListening ? "mic" : "mic"}
                </span>
              </div>
              <div className="space-y-1">
                <p className="font-title-medium text-on-surface">
                  {isListening ? "Listening..." : "Try Voice Commands"}
                </p>
                <p className="font-body-md text-on-surface-variant text-sm max-w-[280px] mx-auto">
                  {isListening 
                    ? "Speak clearly to log exercises and sets." 
                    : "Tap the mic icon and say any exercise along with sets/weight/reps:"}
                </p>
              </div>
              {!isListening && (
                <div className="bg-surface-container rounded-xl p-4 text-left w-full border border-outline-variant/20 space-y-2.5 font-label-md text-on-surface-variant max-w-[320px]">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px] text-primary">arrow_forward</span>
                    <span>&quot;Bench press 3 sets of 8 reps at 50kg&quot;</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px] text-primary">arrow_forward</span>
                    <span>&quot;Bicep curls 12kg 10 reps&quot;</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px] text-primary">arrow_forward</span>
                    <span>&quot;Treadmill run for 10 minutes&quot;</span>
                  </div>
                </div>
              )}
            </div>
          ) : results.length === 0 ? (
            <div className="text-center text-on-surface-variant py-8">
              No exercises found matching &quot;{query}&quot;
            </div>
          ) : (
            results.map((exercise) => (
              <Button 
                key={exercise.id}
                variant="ghost"
                onClick={() => {
                  // If there are pending sets, apply them based on the matched exercise category
                  const finalSets = pendingVoiceSets
                    ? pendingVoiceSets.map((s: any) => ({
                        ...s,
                        weight: exercise.category === "cardio" ? 0 : s.weight,
                        reps: exercise.category === "cardio" ? 0 : s.reps,
                        duration_seconds: exercise.category === "cardio" ? (s.duration_seconds || 60) : undefined
                      }))
                    : undefined;

                  onAdd(exercise, finalSets);
                  setQuery("");
                  setPendingVoiceSets(null);
                  setShowVoiceBanner(false);
                  onClose();
                }}
                className="w-full flex items-center justify-between min-h-[56px] px-4 rounded-xl bg-surface hover:bg-surface-container-high active:bg-surface-container-highest transition-all border border-transparent h-auto py-3 text-left"
              >
                <div className="flex flex-col">
                  <span className="font-label-lg text-on-surface">{exercise.name}</span>
                  <span className="font-label-sm text-on-surface-variant capitalize">
                    {exercise.category} • {exercise.equipment}
                  </span>
                </div>
                <span className="material-symbols-outlined text-outline">add</span>
              </Button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
