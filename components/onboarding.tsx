"use client";

import { useState, useEffect } from "react";

const STEPS = [
  { label: "Tap a button to log an activity", emoji: "👆" },
  { label: "Your stats update in real-time", emoji: "📊" },
  { label: "Compete on the leaderboard", emoji: "🏆" },
];

export function Onboarding() {
  const [step, setStep] = useState(-1); // -1 = not shown

  useEffect(() => {
    if (localStorage.getItem("sf_onboarded")) return;
    setStep(0);
  }, []);

  function advance() {
    const next = step + 1;
    if (next >= STEPS.length) {
      setStep(-1);
      localStorage.setItem("sf_onboarded", "1");
    } else {
      setStep(next);
    }
  }

  if (step < 0) return null;

  const current = STEPS[step];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center pb-8 bg-black/60" onClick={advance}>
      <div className="animate-bounce-in mx-4 max-w-sm w-full rounded-xl bg-card border p-4 text-center shadow-xl" onClick={(e) => e.stopPropagation()}>
        <span className="text-4xl block mb-2">{current.emoji}</span>
        <p className="text-sm font-medium mb-3">{current.label}</p>
        <div className="flex items-center justify-between">
          <div className="flex gap-1">
            {STEPS.map((_, i) => (
              <div key={i} className={`w-2 h-2 rounded-full ${i === step ? "bg-primary" : "bg-muted"}`} />
            ))}
          </div>
          <button
            onClick={advance}
            className="text-sm font-semibold text-primary hover:underline"
          >
            {step === STEPS.length - 1 ? "Got it!" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
