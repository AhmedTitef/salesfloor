"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface RepProfileEditorProps {
  repId: string;
  repName: string;
  personalGoal: number | null;
  daysOff: string | null;
}

export function RepProfileEditor({ repId, repName, personalGoal, daysOff: daysOffStr }: RepProfileEditorProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(repName);
  const [goal, setGoal] = useState(personalGoal ? String(personalGoal) : "");
  const [daysOff, setDaysOff] = useState<Set<number>>(
    daysOffStr ? new Set(daysOffStr.split(",").map(Number).filter((n) => !isNaN(n))) : new Set()
  );
  const [saving, setSaving] = useState(false);

  function toggleDay(day: number) {
    setDaysOff((prev) => {
      const next = new Set(prev);
      if (next.has(day)) next.delete(day);
      else next.add(day);
      return next;
    });
  }

  async function handleSave() {
    setSaving(true);
    await fetch("/api/user/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        targetUserId: repId,
        name: name.trim() || undefined,
        personalGoal: goal ? parseInt(goal) : null,
        daysOff: daysOff.size > 0 ? Array.from(daysOff).sort().join(",") : null,
      }),
    });
    setSaving(false);
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} className="text-xs">
        Edit Profile
      </Button>
    );
  }

  return (
    <div className="rounded-lg border bg-card p-3 flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium">Name</label>
        <Input value={name} onChange={(e) => setName(e.target.value)} className="h-8 text-sm" />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium">Personal Goal</label>
        <Input type="number" min={1} max={999} value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="Team default" className="h-8 text-sm w-28" />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium">Days Off</label>
        <div className="flex gap-1.5">
          {DAYS.map((label, i) => (
            <button
              key={i}
              type="button"
              onClick={() => toggleDay(i)}
              className={`w-8 h-8 rounded text-[10px] font-semibold transition-all ${
                daysOff.has(i)
                  ? "bg-primary text-primary-foreground"
                  : "border border-border hover:bg-muted"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={handleSave} disabled={saving} className="text-xs">
          {saving ? "Saving..." : "Save"}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setOpen(false)} className="text-xs">
          Cancel
        </Button>
      </div>
    </div>
  );
}
