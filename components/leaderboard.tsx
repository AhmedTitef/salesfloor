import Link from "next/link";
import { Badge } from "@/components/ui/badge";

interface Rep {
  name: string;
  total: number;
  rank: number;
  streak?: number;
}

interface LeaderboardProps {
  reps: Rep[];
  linkToRep?: boolean;
}

const RANK_STYLES: Record<number, string> = {
  1: "bg-yellow-500/20 text-yellow-400 border-yellow-500/40",
  2: "bg-zinc-400/20 text-zinc-300 border-zinc-400/40",
  3: "bg-orange-500/20 text-orange-400 border-orange-500/40",
};

function getStreakBadge(streak: number): { emoji: string; label: string; color: string } | null {
  if (streak >= 30) return { emoji: "🥇", label: `${streak}d`, color: "text-yellow-400" };
  if (streak >= 10) return { emoji: "🥈", label: `${streak}d`, color: "text-zinc-300" };
  if (streak >= 5) return { emoji: "🥉", label: `${streak}d`, color: "text-orange-400" };
  if (streak >= 3) return { emoji: "🔥", label: `${streak}d`, color: "text-orange-400" };
  return null;
}

export function Leaderboard({ reps, linkToRep }: LeaderboardProps) {
  if (reps.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-6 text-sm">
        No activity yet. Get logging!
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {reps.map((rep) => {
        const isTop3 = rep.rank <= 3;
        const streakBadge = rep.streak ? getStreakBadge(rep.streak) : null;
        return (
          <div
            key={rep.name}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 border ${
              rep.rank === 1
                ? "bg-yellow-500/10 border-yellow-500/30"
                : "bg-card border-border"
            }`}
          >
            <Badge
              variant="outline"
              className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold p-0 ${
                isTop3 ? RANK_STYLES[rep.rank] : ""
              }`}
            >
              {rep.rank}
            </Badge>
            <span className="flex-1 font-medium text-sm truncate">
              {rep.rank === 1 && "\u{1F451} "}
              {linkToRep ? (
                <Link href={`/dashboard/rep/${encodeURIComponent(rep.name)}`} className="hover:underline">
                  {rep.name}
                </Link>
              ) : (
                rep.name
              )}
              {streakBadge && (
                <span className={`ml-1.5 text-xs ${streakBadge.color}`} title={`${rep.streak}-day streak`}>
                  {streakBadge.emoji} {streakBadge.label}
                </span>
              )}
            </span>
            <span className="font-mono text-lg font-bold tabular-nums text-foreground">
              {rep.total}
            </span>
          </div>
        );
      })}
    </div>
  );
}
