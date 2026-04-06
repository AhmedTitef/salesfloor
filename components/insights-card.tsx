import type { Insight } from "@/lib/insights";

const TYPE_STYLES = {
  positive: "border-green-500/30 bg-green-500/5",
  tip: "border-blue-500/30 bg-blue-500/5",
  warning: "border-orange-500/30 bg-orange-500/5",
};

export function InsightsCard({ insights }: { insights: Insight[] }) {
  if (insights.length === 0) return null;

  return (
    <div className="flex flex-col gap-1.5">
      <h2 className="text-sm font-semibold text-muted-foreground">Coach</h2>
      {insights.map((insight, i) => (
        <div
          key={i}
          className={`rounded-lg border px-3 py-2 text-sm ${TYPE_STYLES[insight.type]}`}
        >
          {insight.emoji} {insight.message}
        </div>
      ))}
    </div>
  );
}
