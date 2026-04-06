import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/stat-card";
import { useMemoryDb } from "@/db";
import { memoryDb } from "@/db/memory";
import { DashboardFilter } from "@/app/dashboard/filter";

async function getSessionData() {
  const cookieStore = await cookies();
  const raw = cookieStore.get("sf_session")?.value;
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
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

export default async function OrgDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const session = await getSessionData();
  if (!session?.orgId || !session.orgRole) redirect("/dashboard");

  const params = await searchParams;
  const period = (params.period as "today" | "week" | "month") || "today";
  const start = getStartDate(period);

  const org = useMemoryDb ? memoryDb.findOrgById(session.orgId) : null;
  const stats = useMemoryDb
    ? memoryDb.getOrgStats(session.orgId, start, new Date())
    : { perTeam: [], topReps: [], totalActivities: 0, teamCount: 0 };

  return (
    <div className="flex flex-col gap-4 p-4 max-w-lg mx-auto w-full pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">{org?.name || "Organization"}</h1>
          <p className="text-xs text-muted-foreground">Org Dashboard</p>
        </div>
        <div className="flex gap-3">
          <Link href="/dashboard" className="text-xs text-muted-foreground hover:text-foreground underline">
            Team
          </Link>
          <Link href="/org/settings" className="text-xs text-muted-foreground hover:text-foreground underline">
            Org Settings
          </Link>
        </div>
      </div>

      <DashboardFilter current={period} />

      {/* Overview */}
      <div className="grid grid-cols-3 gap-2">
        <StatCard label="Total" value={stats.totalActivities} icon="📊" />
        <StatCard label="Teams" value={stats.teamCount} icon="👥" />
        <StatCard label="Top Rep" value={stats.topReps[0]?.name || "---"} icon="👑" />
      </div>

      {/* Per-team breakdown */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Team Standings</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.perTeam.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No activity yet</p>
          ) : (
            <div className="flex flex-col gap-2">
              {stats.perTeam.map((t, i) => (
                <div
                  key={t.teamId}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 border ${
                    i === 0 ? "bg-yellow-500/10 border-yellow-500/30" : "bg-card border-border"
                  }`}
                >
                  <span className={`font-bold w-6 text-center ${
                    i === 0 ? "text-yellow-400" : i === 1 ? "text-zinc-300" : i === 2 ? "text-orange-400" : "text-muted-foreground"
                  }`}>
                    {i + 1}
                  </span>
                  <span className="flex-1 font-medium text-sm">{i === 0 && "👑 "}{t.teamName}</span>
                  <span className="font-mono text-lg font-bold">{t.total}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cross-team top reps */}
      {stats.topReps.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Top Reps (All Teams)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-1.5">
              {stats.topReps.map((rep, i) => (
                <div key={`${rep.name}-${i}`} className="flex items-center justify-between text-sm">
                  <span>
                    <span className="font-mono text-muted-foreground mr-2">#{i + 1}</span>
                    <span className={i === 0 ? "font-bold" : ""}>{rep.name}</span>
                    <span className="text-xs text-muted-foreground ml-1">({rep.teamName})</span>
                  </span>
                  <span className="font-mono font-bold">{rep.total}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick actions */}
      <div className="flex gap-3">
        <Link href="/org/settings" className="flex-1 inline-flex h-8 items-center justify-center rounded-lg border border-border bg-background hover:bg-muted text-sm font-medium px-2.5 dark:border-input dark:bg-input/30 dark:hover:bg-input/50">
          Manage Org
        </Link>
        <Link href="/org/leagues" className="flex-1 inline-flex h-8 items-center justify-center rounded-lg border border-border bg-background hover:bg-muted text-sm font-medium px-2.5 dark:border-input dark:bg-input/30 dark:hover:bg-input/50">
          Leagues
        </Link>
      </div>
    </div>
  );
}
