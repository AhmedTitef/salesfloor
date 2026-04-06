"use client";

import { useRouter } from "next/navigation";

interface DashboardFilterProps {
  current: "today" | "week" | "month";
}

const OPTIONS = [
  { value: "today", label: "Today" },
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
] as const;

export function DashboardFilter({ current }: DashboardFilterProps) {
  const router = useRouter();

  return (
    <div className="flex rounded-lg border bg-muted p-1 gap-1">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => router.push(`/dashboard?period=${opt.value}`)}
          className={`flex-1 text-sm font-medium rounded-md py-1.5 transition-all ${
            current === opt.value
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
