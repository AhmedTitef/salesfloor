import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { ActivityHeatmap } from "@/components/activity-heatmap";
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

export default async function RepCoachingPage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const session = await getSessionData();
  if (!session?.teamId || session.role !== "manager") redirect("/");

  const { name } = await params;
  const repName = decodeURIComponent(name);

  const teamUsers = useMemoryDb ? memoryDb.getUsersByTeam(session.teamId) : [];
  const rep = teamUsers.find((u) => u.name === repName && u.role === "rep");
  if (!rep) redirect("/dashboard");

  const activityTypes = useMemoryDb
    ? memoryDb.getActivityTypesByTeam(session.teamId)
    : [];

  // Get all logs for this rep
  const allLogs = useMemoryDb
    ? memoryDb.getActivityLogs(session.teamId, { limit: 500 }).filter((l) => l.userName === repName)
    : [];

  // Today's stats
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayLogs = allLogs.filter((l) => l.createdAt >= today);
  const todayTotal = todayLogs.length;

  // Per activity type today
  const todayCounts: Record<string, number> = {};
  for (const log of todayLogs) {
    todayCounts[log.activityTypeName] = (todayCounts[log.activityTypeName] || 0) + 1;
  }

  // Last 7 days daily totals
  const dailyTotals: { date: string; count: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    const next = new Date(d);
    next.setDate(next.getDate() + 1);
    const count = allLogs.filter((l) => l.createdAt >= d && l.createdAt < next).length;
    dailyTotals.push({
      date: d.toLocaleDateString("en-US", { weekday: "short" }),
      count,
    });
  }

  const weekTotal = dailyTotals.reduce((s, d) => s + d.count, 0);
  const avgPerDay = dailyTotals.length > 0 ? Math.round(weekTotal / dailyTotals.length) : 0;
  const maxDay = Math.max(...dailyTotals.map((d) => d.count), 1);

  // Streak
  const streak = useMemoryDb ? memoryDb.getUserStreak(rep.id, session.teamId) : 0;
  const pb = useMemoryDb
    ? memoryDb.getUserPersonalBest(rep.id, session.teamId)
    : { best: 0, isNewBest: false };

  // Consistency score: days with activity / 7
  const activeDays = dailyTotals.filter((d) => d.count > 0).length;
  const consistency = Math.round((activeDays / 7) * 100);

  // Heatmap
  const heatmapData = useMemoryDb ? memoryDb.getUserHeatmap(rep.id, session.teamId) : {};

  return (
    <div className="flex flex-col gap-4 p-4 max-w-lg mx-auto w-full pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">{repName}</h1>
          <p className="text-xs text-muted-foreground">Rep Coaching View</p>
        </div>
        <Link
          href="/dashboard"
          className="text-xs text-muted-foreground hover:text-foreground underline"
        >
          Back
        </Link>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-4 gap-2">
        <Card>
          <CardContent className="pt-3 pb-3 text-center">
            <p className="text-lg font-bold font-mono">{todayTotal}</p>
            <p className="text-[10px] text-muted-foreground">Today</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-3 pb-3 text-center">
            <p className="text-lg font-bold font-mono">{streak}</p>
            <p className="text-[10px] text-muted-foreground">Streak</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-3 pb-3 text-center">
            <p className="text-lg font-bold font-mono">{pb.best}</p>
            <p className="text-[10px] text-muted-foreground">PB</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-3 pb-3 text-center">
            <p className="text-lg font-bold font-mono">{consistency}%</p>
            <p className="text-[10px] text-muted-foreground">Consistency</p>
          </CardContent>
        </Card>
      </div>

      {/* 7-day trend */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold">Last 7 Days</p>
            <p className="text-xs text-muted-foreground">Avg: {avgPerDay}/day</p>
          </div>
          <div className="flex items-end gap-1 h-20">
            {dailyTotals.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex flex-col justify-end h-14">
                  <div
                    className="w-full rounded-sm bg-primary transition-all"
                    style={{
                      height: `${Math.max(4, (d.count / maxDay) * 100)}%`,
                    }}
                  />
                </div>
                <span className="text-[9px] text-muted-foreground">{d.date}</span>
                <span className="text-[9px] font-mono font-bold">{d.count}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Activity heatmap */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <p className="text-sm font-semibold mb-3">Activity History</p>
          <ActivityHeatmap data={heatmapData} />
        </CardContent>
      </Card>

      {/* Today's breakdown */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <p className="text-sm font-semibold mb-3">Today&apos;s Breakdown</p>
          {todayTotal === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-2">No activity yet today</p>
          ) : (
            <div className="flex flex-col gap-2">
              {activityTypes
                .filter((at) => at.isActive)
                .map((at) => {
                  const c = todayCounts[at.name] || 0;
                  const pct = todayTotal > 0 ? Math.round((c / todayTotal) * 100) : 0;
                  return (
                    <div key={at.id} className="flex items-center gap-3">
                      <span className="text-sm flex-1 truncate" style={{ color: at.color }}>
                        {at.name}
                      </span>
                      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${pct}%`, backgroundColor: at.color }}
                        />
                      </div>
                      <span className="font-mono text-sm font-bold tabular-nums w-8 text-right">
                        {c}
                      </span>
                    </div>
                  );
                })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent activity */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <p className="text-sm font-semibold mb-3">Recent Activity</p>
          <div className="flex flex-col gap-1.5">
            {allLogs.slice(0, 10).map((log) => {
              const time = new Date(log.createdAt).toLocaleTimeString([], {
                hour: "numeric",
                minute: "2-digit",
              });
              return (
                <div
                  key={log.id}
                  className="flex items-center justify-between text-sm"
                >
                  <span style={{ color: log.activityTypeColor }}>
                    {log.activityTypeName}
                  </span>
                  <span className="text-xs text-muted-foreground font-mono">
                    {time}
                  </span>
                </div>
              );
            })}
            {allLogs.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-2">
                No activity recorded
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
