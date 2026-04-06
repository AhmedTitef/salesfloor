import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { useMemoryDb } from "@/db";
import { memoryDb } from "@/db/memory";
import { TVClient } from "./tv-client";

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

export default async function TVPage() {
  const session = await getSessionData();
  if (!session?.teamId) redirect("/");

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const stats = useMemoryDb
    ? memoryDb.getStats(session.teamId, today, new Date())
    : { teamStats: {}, leaderboard: [] };

  const totalActivities = Object.values(stats.teamStats).reduce(
    (sum: number, c: number) => sum + c, 0
  );

  const teamUsers = useMemoryDb ? memoryDb.getUsersByTeam(session.teamId) : [];
  const leaderboard = stats.leaderboard.map((rep, i) => {
    const user = teamUsers.find((u) => u.name === rep.name);
    const streak = user && useMemoryDb ? memoryDb.getUserStreak(user.id, session.teamId) : 0;
    return { ...rep, rank: i + 1, streak };
  });

  const recentLogs = useMemoryDb
    ? memoryDb.getActivityLogs(session.teamId, { start: today, limit: 8 })
    : [];

  const goalPct = session.dailyGoal > 0
    ? Math.min(100, Math.round((totalActivities / session.dailyGoal) * 100))
    : 0;

  return (
    <TVClient
      teamName={session.teamName}
      totalActivities={totalActivities}
      dailyGoal={session.dailyGoal}
      goalPct={goalPct}
      leaderboard={leaderboard}
      recentLogs={recentLogs.map((l) => ({
        id: l.id,
        userName: l.userName,
        activityTypeName: l.activityTypeName,
        activityTypeColor: l.activityTypeColor,
        createdAt: l.createdAt.toISOString(),
      }))}
    />
  );
}
