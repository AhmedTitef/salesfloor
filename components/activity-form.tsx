"use client";

import { useTransition, useState } from "react";
import { logActivityAction } from "@/app/log/actions";
import { pushToQueue } from "@/lib/offline-queue";

interface ActivityFormProps {
  activityTypeId: string;
  emoji: string;
  name: string;
  color: string;
  count: number;
}

export function ActivityForm({ activityTypeId, emoji, name, color, count }: ActivityFormProps) {
  const [isPending, startTransition] = useTransition();
  const [optimisticCount, setOptimisticCount] = useState(0);

  function playFeedback() {
    if (navigator.vibrate) navigator.vibrate(30);
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 800;
      gain.gain.value = 0.08;
      osc.start();
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      osc.stop(ctx.currentTime + 0.08);
    } catch {}
  }

  function handleTap() {
    playFeedback();
    setOptimisticCount((c) => c + 1);

    if (!navigator.onLine) {
      // Queue for later sync
      pushToQueue({ activityTypeId, timestamp: Date.now() });
      window.dispatchEvent(new CustomEvent("sf:activity-queued"));
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.set("activityTypeId", activityTypeId);
      const result = await logActivityAction(formData);
      setOptimisticCount(0); // Reset after server confirms (page revalidates with new count)
      if (result?.logId) {
        window.dispatchEvent(
          new CustomEvent("sf:activity-logged", { detail: { logId: result.logId } })
        );
      }
    });
  }

  const displayCount = count + optimisticCount;

  return (
    <button
      type="button"
      onClick={handleTap}
      disabled={isPending}
      className="w-full min-h-[130px] rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all active:scale-95 select-none touch-manipulation"
      style={{
        backgroundColor: `${color}15`,
        borderColor: `${color}40`,
      }}
    >
      <span className="text-3xl">{emoji}</span>
      <span className="text-sm font-semibold" style={{ color }}>
        {name}
      </span>
      <span
        className="font-mono text-xs font-bold px-2 py-0.5 rounded-full"
        style={{ backgroundColor: `${color}30`, color }}
      >
        {displayCount}
      </span>
    </button>
  );
}
