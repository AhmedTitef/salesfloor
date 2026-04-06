"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

interface TVClientProps {
  teamName: string;
  totalActivities: number;
  dailyGoal: number;
  goalPct: number;
  leaderboard: { name: string; total: number; rank: number; streak: number }[];
  recentLogs: { id: string; userName: string; activityTypeName: string; activityTypeColor: string; createdAt: string }[];
}

export function TVClient({ teamName, totalActivities, dailyGoal, goalPct, leaderboard, recentLogs }: TVClientProps) {
  const router = useRouter();

  // Auto-refresh via SSE
  useEffect(() => {
    const es = new EventSource("/api/live");
    es.addEventListener("activity", () => router.refresh());
    es.onerror = () => { es.close(); setTimeout(() => router.refresh(), 5000); };
    // Also refresh every 30s as fallback
    const interval = setInterval(() => router.refresh(), 30000);
    return () => { es.close(); clearInterval(interval); };
  }, [router]);

  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

  return (
    <div className="min-h-screen bg-background text-foreground p-8 flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold">{teamName}</h1>
          <p className="text-lg text-muted-foreground">SalesFloor Live</p>
        </div>
        <div className="text-right">
          <p className="text-5xl font-bold font-mono">{totalActivities}</p>
          <p className="text-sm text-muted-foreground">activities today</p>
        </div>
      </div>

      {/* Goal bar */}
      {dailyGoal > 0 && (
        <div>
          <div className="flex justify-between mb-2 text-sm">
            <span>{goalPct >= 100 ? "🎯 Goal Reached!" : "🎯 Daily Goal"}</span>
            <span className="font-mono font-bold">{totalActivities}/{dailyGoal}</span>
          </div>
          <div className="h-4 rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${goalPct >= 100 ? "bg-green-500 goal-complete" : "bg-primary"}`}
              style={{ width: `${goalPct}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex gap-8 flex-1 min-h-0">
        {/* Leaderboard */}
        <div className="flex-1">
          <h2 className="text-xl font-bold mb-4">Leaderboard</h2>
          <div className="flex flex-col gap-3">
            {leaderboard.length === 0 && (
              <p className="text-muted-foreground text-lg">No activity yet today</p>
            )}
            {leaderboard.map((rep) => (
              <div
                key={rep.name}
                className={`flex items-center gap-4 rounded-xl px-5 py-4 border text-lg ${
                  rep.rank === 1
                    ? "bg-yellow-500/10 border-yellow-500/30"
                    : "bg-card border-border"
                }`}
              >
                <span className={`text-2xl font-bold w-10 text-center ${
                  rep.rank === 1 ? "text-yellow-400" : rep.rank === 2 ? "text-zinc-300" : rep.rank === 3 ? "text-orange-400" : "text-muted-foreground"
                }`}>
                  {rep.rank}
                </span>
                <span className="flex-1 font-semibold">
                  {rep.rank === 1 && "👑 "}{rep.name}
                  {rep.streak >= 3 && <span className="ml-2 text-sm text-orange-400">🔥 {rep.streak}d</span>}
                </span>
                <span className="font-mono text-3xl font-bold">{rep.total}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Activity feed */}
        <div className="w-80 shrink-0">
          <h2 className="text-xl font-bold mb-4">Live Feed</h2>
          <div className="flex flex-col gap-2">
            {recentLogs.map((log) => {
              const time = new Date(log.createdAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
              return (
                <div key={log.id} className="rounded-lg bg-card border px-4 py-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{log.userName}</span>
                    <span className="text-xs text-muted-foreground font-mono">{time}</span>
                  </div>
                  <span className="text-sm" style={{ color: log.activityTypeColor }}>
                    {log.activityTypeName}
                  </span>
                </div>
              );
            })}
            {recentLogs.length === 0 && (
              <p className="text-muted-foreground">Waiting for activity...</p>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-muted-foreground">
        {timeStr} &mdash; Auto-refreshing
      </div>
    </div>
  );
}
