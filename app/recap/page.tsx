import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { useMemoryDb } from "@/db";
import { memoryDb } from "@/db/memory";

async function getSessionData() {
  const cookieStore = await cookies();
  const raw = cookieStore.get("sf_session")?.value;
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export default async function RecapPage() {
  const session = await getSessionData();
  if (!session?.teamId) redirect("/");

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const stats = useMemoryDb
    ? memoryDb.getStats(session.teamId, today, new Date())
    : { teamStats: {}, repStats: [], leaderboard: [] };

  const totalActivities = Object.values(stats.teamStats).reduce(
    (sum: number, c: number) => sum + c,
    0
  );
  const topRep = stats.leaderboard[0];
  const callbacks = stats.teamStats["Callback Booked"] || 0;
  const calls = stats.teamStats["Call"] || 0;
  const conversionRate = calls > 0 ? Math.round((callbacks / calls) * 100) : 0;
  const goalPct =
    session.dailyGoal > 0
      ? Math.min(100, Math.round((totalActivities / session.dailyGoal) * 100))
      : 0;

  const teamUsers = useMemoryDb ? memoryDb.getUsersByTeam(session.teamId) : [];
  const repCount = teamUsers.filter((u) => u.role === "rep").length;

  const dateStr = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="flex flex-col gap-4 p-4 max-w-lg mx-auto w-full pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Daily Recap</h1>
          <p className="text-xs text-muted-foreground">{dateStr}</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/dashboard"
            className="text-xs text-muted-foreground hover:text-foreground underline"
          >
            Dashboard
          </Link>
          <Link
            href="/log"
            className="text-xs text-muted-foreground hover:text-foreground underline"
          >
            Log
          </Link>
        </div>
      </div>

      {/* Hero stat */}
      <Card>
        <CardContent className="pt-6 pb-6 text-center">
          <p className="text-5xl font-bold font-mono">{totalActivities}</p>
          <p className="text-sm text-muted-foreground mt-1">total activities today</p>
          {session.dailyGoal > 0 && (
            <p className="text-xs text-muted-foreground mt-2">
              {goalPct >= 100
                ? "🎯 Team goal reached!"
                : `${goalPct}% of daily goal (${session.dailyGoal})`}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Key metrics */}
      <div className="grid grid-cols-3 gap-2">
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-lg font-bold">{repCount}</p>
            <p className="text-[10px] text-muted-foreground">Active Reps</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-lg font-bold">{callbacks}</p>
            <p className="text-[10px] text-muted-foreground">Callbacks</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-lg font-bold">{conversionRate}%</p>
            <p className="text-[10px] text-muted-foreground">Callback %</p>
          </CardContent>
        </Card>
      </div>

      {/* MVP */}
      {topRep && (
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-3xl mb-1">👑</p>
            <p className="text-sm font-semibold">Today&apos;s MVP</p>
            <p className="text-lg font-bold">{topRep.name}</p>
            <p className="text-xs text-muted-foreground">
              {topRep.total} activities
            </p>
          </CardContent>
        </Card>
      )}

      {/* Leaderboard summary */}
      {stats.leaderboard.length > 0 && (
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-sm font-semibold mb-3">Leaderboard</p>
            <div className="flex flex-col gap-1.5">
              {stats.leaderboard.slice(0, 5).map((rep, i) => (
                <div
                  key={rep.name}
                  className="flex items-center justify-between text-sm"
                >
                  <span>
                    <span className="font-mono text-muted-foreground mr-2">
                      #{i + 1}
                    </span>
                    <span className={i === 0 ? "font-bold" : ""}>{rep.name}</span>
                  </span>
                  <span className="font-mono font-bold">{rep.total}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Activity breakdown */}
      {Object.keys(stats.teamStats).length > 0 && (
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-sm font-semibold mb-3">Breakdown</p>
            <div className="flex flex-col gap-1.5">
              {Object.entries(stats.teamStats)
                .sort(([, a], [, b]) => b - a)
                .map(([name, count]) => (
                  <div
                    key={name}
                    className="flex items-center justify-between text-sm"
                  >
                    <span>{name}</span>
                    <span className="font-mono font-bold">{count}</span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Team Records */}
      {useMemoryDb && (() => {
        const records = memoryDb.getTeamRecords(session.teamId);
        if (!records.bestDay && !records.bestRep) return null;
        return (
          <Card>
            <CardContent className="pt-4 pb-4">
              <p className="text-sm font-semibold mb-3">Team Records</p>
              {records.bestDay && (
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <span className="text-muted-foreground">Best team day</span>
                  <span className="font-mono font-bold">{records.bestDay.count} ({records.bestDay.date})</span>
                </div>
              )}
              {records.bestRep && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Best individual day</span>
                  <span className="font-mono font-bold">{records.bestRep.name}: {records.bestRep.count} ({records.bestRep.date})</span>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })()}

      <p className="text-center text-xs text-muted-foreground">
        {session.teamName} &mdash; SalesFloor Daily Recap
      </p>
    </div>
  );
}
