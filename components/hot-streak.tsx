"use client";

import { useState, useEffect, createContext, useContext, useCallback, useRef } from "react";

const HotStreakContext = createContext(false);
export const useHotStreak = () => useContext(HotStreakContext);

const THRESHOLD = 5; // activities in the window
const WINDOW_MS = 10 * 60 * 1000; // 10 minutes

export function HotStreakProvider({ children }: { children: React.ReactNode }) {
  const [isHot, setIsHot] = useState(false);
  const timestamps = useRef<number[]>([]);

  const checkStreak = useCallback(() => {
    const now = Date.now();
    timestamps.current = timestamps.current.filter(t => now - t < WINDOW_MS);
    setIsHot(timestamps.current.length >= THRESHOLD);
  }, []);

  useEffect(() => {
    function handler() {
      timestamps.current.push(Date.now());
      checkStreak();
    }
    window.addEventListener("sf:activity-logged", handler);
    return () => window.removeEventListener("sf:activity-logged", handler);
  }, [checkStreak]);

  // Re-check periodically to turn off streak when window expires
  useEffect(() => {
    if (!isHot) return;
    const interval = setInterval(checkStreak, 5000);
    return () => clearInterval(interval);
  }, [isHot, checkStreak]);

  return (
    <HotStreakContext.Provider value={isHot}>
      {isHot && (
        <div className="rounded-lg border border-orange-500/50 bg-orange-500/10 px-3 py-2 text-center text-sm animate-pulse">
          <span className="font-bold text-orange-400">HOT STREAK</span>
          <span className="text-orange-300"> &mdash; {timestamps.current.length} activities in 10 min!</span>
        </div>
      )}
      {children}
    </HotStreakContext.Provider>
  );
}
