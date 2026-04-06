"use client";

import { useState, useEffect, useCallback } from "react";
import { undoActivityAction } from "@/app/log/actions";

export function UndoToast() {
  const [logId, setLogId] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);

  // Listen for custom events from the log form
  useEffect(() => {
    function handler(e: CustomEvent<{ logId: string }>) {
      setLogId(e.detail.logId);
      setVisible(true);
    }
    window.addEventListener("sf:activity-logged" as string, handler as EventListener);
    return () => window.removeEventListener("sf:activity-logged" as string, handler as EventListener);
  }, []);

  // Auto-dismiss after 5 seconds
  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(() => {
      setVisible(false);
      setLogId(null);
    }, 5000);
    return () => clearTimeout(t);
  }, [visible, logId]);

  const handleUndo = useCallback(async () => {
    if (!logId) return;
    setVisible(false);
    await undoActivityAction(logId);
    setLogId(null);
  }, [logId]);

  if (!visible) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 mx-auto max-w-sm animate-bounce-in">
      <div className="flex items-center justify-between rounded-xl border bg-card px-4 py-3 shadow-lg">
        <span className="text-sm">Activity logged</span>
        <button
          onClick={handleUndo}
          className="text-sm font-bold text-primary hover:underline ml-4"
        >
          Undo
        </button>
      </div>
    </div>
  );
}
