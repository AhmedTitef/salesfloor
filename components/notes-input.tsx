"use client";

import { useState, useEffect } from "react";

export function NotesInput() {
  const [note, setNote] = useState("");

  // Store in a global so ActivityForm can read it
  useEffect(() => {
    (window as unknown as Record<string, string>).__sf_note = note;
  }, [note]);

  // Clear after an activity is logged
  useEffect(() => {
    function handler() {
      setNote("");
      (window as unknown as Record<string, string>).__sf_note = "";
    }
    window.addEventListener("sf:activity-logged", handler);
    return () => window.removeEventListener("sf:activity-logged", handler);
  }, []);

  return (
    <input
      type="text"
      value={note}
      onChange={(e) => setNote(e.target.value)}
      placeholder="Add a note (optional)..."
      className="h-9 rounded-lg border border-input bg-transparent px-3 text-sm placeholder:text-muted-foreground w-full"
    />
  );
}
