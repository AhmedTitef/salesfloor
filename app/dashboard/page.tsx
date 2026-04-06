import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { StatCard } from "@/components/stat-card";
import { Leaderboard } from "@/components/leaderboard";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMemoryDb } from "@/db";
import { memoryDb } from "@/db/memory";
import { LeagueStandingsMini } from "@/components/league-standings-mini";
import { DashboardFilter } from "./filter";

async function getSessionData() {
  const cookieStore = await cookies();
  const raw = cookieStore.get("sf_session")?.value;
  if (!raw) return null;
  try {
    const session = JSON.parse(raw);
    if (!session.userId || !session.teamId) return null;
    return {
      userId: session.userId,
      userName: session.userName || "User",
      role: session.role,
      teamId: session.teamId,
      teamName: session.teamName || "Team",
      dailyGoal: session.dailyGoal ?? 50,
    };
  } catch {
    return null;
  }
}

function getStartDate(period: string): Date {
  const now = new Date();
  switch (period) {
    case "week": {
      const start = new Date(now);
      start.setDate(start.getDate() - start.getDay());
      start.setHours(0, 0, 0, 0);
      return start;
    }
    case "month":
      return new Date(now.getFullYear(), now.getMonth(), 1);
    default: {
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      return start;
    }
  }
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const session = await getSessionData();
  if (!session) redirect("/");

  const params = await searchParams;
  const period = (params.period as "today" | "week" | "month") || "today";
  const start = getStartDate(period);

  const stats = useMemoryDb
    ? memoryDb.getStats(session.teamId, start, new Date())
    : { teamStats: {}, repStats: [], leaderboard: [] };

  const totalActivities = Object.values(stats.teamStats).reduce((sum, c) => sum + c, 0);
  const topPerformer = stats.leaderboard?.[0]?.name || "---";
  const calls = stats.teamStats["Call"] || 0;
  const callbacks = stats.teamStats["Callback Booked"] || 0;
  const conversionRate = calls > 0 ? Math.round((callbacks / calls) * 100) : 0;

  const goalPct = session.dailyGoal > 0 ? Math.min(100, Math.round((totalActivities / session.dailyGoal) * 100)) : 0;

  // Week-over-week comparison
  const prevStart = new Date(start);
  prevStart.setDate(prevStart.getDate() - 7);
  const prevEnd = new Date(start);
  const prevStats = useMemoryDb
    ? memoryDb.getStats(session.teamId, prevStart, prevEnd)
    : { teamStats: {}, leaderboard: [] };
  const prevTotal = Object.values(prevStats.teamStats).reduce((sum: number, c: number) => sum + c, 0);
  const totalTrend = prevTotal > 0 ? Math.round(((totalActivities - prevTotal) / prevTotal) * 100) : 0;

  // Check if team is in an org
  const currentTeam = useMemoryDb ? memoryDb.findTeamById(session.teamId) : null;
  const hasOrg = !!currentTeam?.orgId;

  // Active leagues for this team
  const activeLeagues = useMemoryDb ? memoryDb.getActiveLeaguesForTeam(session.teamId) : [];
  const leagueStandings = activeLeagues.map((l) => ({
    league: l,
    standings: useMemoryDb ? memoryDb.getLeagueStandings(l.id) : [],
  }));

  // Get streaks for each rep on the leaderboard
  const teamUsers = useMemoryDb ? memoryDb.getUsersByTeam(session.teamId) : [];
  const leaderboardWithRank = stats.leaderboard.map((rep, i) => {
    const user = teamUsers.find((u) => u.name === rep.name);
    const streak = user && useMemoryDb ? memoryDb.getUserStreak(user.id, session.teamId) : 0;
    return { ...rep, rank: i + 1, streak };
  });

  return (
    <div className="flex flex-col gap-4 p-4 max-w-lg mx-auto w-full pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">{session.teamName}</h1>
          <p className="text-xs text-muted-foreground">Dashboard</p>
        </div>
        <div className="flex gap-3">
          {hasOrg && (
            <Link href="/org/dashboard" className="text-xs text-muted-foreground hover:text-foreground underline">
              Org
            </Link>
          )}
          <Link href="/log" className="text-xs text-muted-foreground hover:text-foreground underline">
            Log
          </Link>
          {session.role === "manager" && (
            <Link href="/settings" className="text-xs text-muted-foreground hover:text-foreground underline">
              Settings
            </Link>
          )}
        </div>
      </div>

      {/* Date filter */}
      <DashboardFilter current={period} />

      {/* Overview cards */}
      <div className="grid grid-cols-3 gap-2">
        <StatCard label="Total" value={totalActivities} icon="📊" trend={totalTrend} />
        <StatCard label="Top Rep" value={topPerformer} icon="👑" />
        <StatCard label="Callback %" value={`${conversionRate}%`} icon="📈" />
      </div>

      {/* Team goal progress */}
      {period === "today" && session.dailyGoal > 0 && (
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">
                {goalPct >= 100 ? "🎯 Goal Reached!" : "🎯 Team Goal"}
              </span>
              <span className="text-sm font-mono font-bold">
                {totalActivities}/{session.dailyGoal}
              </span>
            </div>
            <div className="h-3 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${goalPct >= 100 ? "bg-green-500 goal-complete" : "bg-primary"}`}
                style={{ width: `${goalPct}%` }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      <Separator />

      {/* Leaderboard */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Leaderboard</CardTitle>
        </CardHeader>
        <CardContent>
          <Leaderboard reps={leaderboardWithRank} linkToRep={session.role === "manager"} />
        </CardContent>
      </Card>

      {/* League standings */}
      {leagueStandings.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">League Standings</CardTitle>
          </CardHeader>
          <CardContent>
            {leagueStandings.map(({ league, standings }) => (
              <LeagueStandingsMini
                key={league.id}
                leagueId={league.id}
                leagueName={league.name}
                standings={standings}
                currentTeamId={session.teamId}
              />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Per-activity breakdown */}
      {Object.keys(stats.teamStats).length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Activity Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              {Object.entries(stats.teamStats)
                .sort((a, b) => b[1] - a[1])
                .map(([name, count]) => {
                  const pct = totalActivities > 0 ? Math.round((count / totalActivities) * 100) : 0;
                  return (
                    <div key={name} className="flex items-center gap-3">
                      <span className="text-sm flex-1 truncate">{name}</span>
                      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary transition-all duration-300"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="font-mono text-sm font-bold tabular-nums w-8 text-right">
                        {count}
                      </span>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick actions */}
      <div className="flex gap-3">
        <Link href="/log" className="flex-1 inline-flex h-8 items-center justify-center rounded-lg border border-border bg-background hover:bg-muted text-sm font-medium px-2.5 dark:border-input dark:bg-input/30 dark:hover:bg-input/50">
          Start Logging
        </Link>
        <Link href="/recap" className="flex-1 inline-flex h-8 items-center justify-center rounded-lg border border-border bg-background hover:bg-muted text-sm font-medium px-2.5 dark:border-input dark:bg-input/30 dark:hover:bg-input/50">
          Daily Recap
        </Link>
        {session.role === "manager" && (
          <>
            <a
              href={`/api/export?period=${period}`}
              download
              className="flex-1 inline-flex h-8 items-center justify-center rounded-lg border border-border bg-background hover:bg-muted text-sm font-medium px-2.5 dark:border-input dark:bg-input/30 dark:hover:bg-input/50"
            >
              Export CSV
            </a>
            <Link href="/settings" className="flex-1 inline-flex h-8 items-center justify-center rounded-lg border border-border bg-background hover:bg-muted text-sm font-medium px-2.5 dark:border-input dark:bg-input/30 dark:hover:bg-input/50">
              Settings
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
