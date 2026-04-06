"use client";

import { useTransition, useState } from "react";
import { tagOutcomeAction } from "@/app/log/actions";

const OUTCOMES = [
  { value: "won" as const, label: "Won", emoji: "✅", color: "text-green-400" },
  { value: "lost" as const, label: "Lost", emoji: "❌", color: "text-red-400" },
  { value: "pending" as const, label: "Pending", emoji: "⏳", color: "text-yellow-400" },
] as const;

interface OutcomeTagProps {
  logId: string;
  currentOutcome: string | null;
  isOwner: boolean;
}

export function OutcomeTag({ logId, currentOutcome, isOwner }: OutcomeTagProps) {
  const [isPending, startTransition] = useTransition();
  const [expanded, setExpanded] = useState(false);

  if (!isOwner) {
    // Show outcome badge if set, nothing if not
    if (!currentOutcome) return null;
    const o = OUTCOMES.find((o) => o.value === currentOutcome);
    if (!o) return null;
    return <span className={`text-xs ${o.color}`}>{o.emoji}</span>;
  }

  if (currentOutcome) {
    const o = OUTCOMES.find((o) => o.value === currentOutcome);
    return (
      <button
        onClick={() => {
          startTransition(() => tagOutcomeAction(logId, null));
        }}
        disabled={isPending}
        className={`text-xs ${o?.color || ""} hover:opacity-70`}
        title="Click to clear"
      >
        {o?.emoji}
      </button>
    );
  }

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="text-[10px] text-muted-foreground hover:text-foreground px-1.5 py-0.5 rounded border border-border"
      >
        Tag
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1">
      {OUTCOMES.map((o) => (
        <button
          key={o.value}
          onClick={() => {
            setExpanded(false);
            startTransition(() => tagOutcomeAction(logId, o.value));
          }}
          disabled={isPending}
          className="text-xs hover:scale-110 transition-transform"
          title={o.label}
        >
          {o.emoji}
        </button>
      ))}
    </div>
  );
}
