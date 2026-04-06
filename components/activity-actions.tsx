"use client";

import { useTransition, useState } from "react";
import { undoActivityAction } from "@/app/log/actions";

interface ActivityActionsProps {
  logId: string;
}

export function ActivityActions({ logId }: ActivityActionsProps) {
  const [isPending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <div className="flex items-center gap-1">
        <button
          onClick={() => {
            startTransition(async () => {
              await undoActivityAction(logId);
              setConfirming(false);
            });
          }}
          disabled={isPending}
          className="text-[10px] text-red-400 hover:text-red-300 font-bold"
        >
          {isPending ? "..." : "Delete"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="text-[10px] text-muted-foreground"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="text-[10px] text-muted-foreground hover:text-red-400 px-1"
      title="Delete"
    >
      ✕
    </button>
  );
}
