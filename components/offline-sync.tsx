"use client";

import { useEffect, useState } from "react";
import { getQueue, clearQueue } from "@/lib/offline-queue";
import { logActivityAction } from "@/app/log/actions";

export function OfflineSync() {
  const [queueSize, setQueueSize] = useState(0);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    function updateCount() {
      setQueueSize(getQueue().length);
    }

    async function syncQueue() {
      const queue = getQueue();
      if (queue.length === 0 || syncing) return;

      setSyncing(true);
      for (const item of queue) {
        const formData = new FormData();
        formData.set("activityTypeId", item.activityTypeId);
        await logActivityAction(formData);
      }
      clearQueue();
      setQueueSize(0);
      setSyncing(false);
    }

    // Sync when coming back online
    window.addEventListener("online", syncQueue);
    // Update count when items are queued
    window.addEventListener("sf:activity-queued", updateCount);
    // Try to sync on mount in case we came back online
    if (navigator.onLine) syncQueue();

    return () => {
      window.removeEventListener("online", syncQueue);
      window.removeEventListener("sf:activity-queued", updateCount);
    };
  }, [syncing]);

  if (queueSize === 0 && !syncing) return null;

  return (
    <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-3 py-2 text-center text-xs">
      {syncing ? (
        <span className="text-yellow-400">Syncing {queueSize} queued activities...</span>
      ) : (
        <span className="text-yellow-400">
          Offline — {queueSize} {queueSize === 1 ? "activity" : "activities"} queued
        </span>
      )}
    </div>
  );
}
