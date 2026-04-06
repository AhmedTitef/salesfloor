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
  try { return JSON.parse(raw); } catch { return null; }
}

function getRepStats(teamId: string, userId: string, name: string) {
  if (!useMemoryDb) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const logs = memoryDb.getActivityLogs(teamId, { start: today, limit: 500 }).filter(l => l.userName === name);
  const streak = memoryDb.getUserStreak(userId, teamId);
  const pb = memoryDb.getUserPersonalBest(userId, teamId);
  const counts: Record<string, number> = {};
  for (const l of logs) counts[l.activityTypeName] = (counts[l.activityTypeName] || 0) + 1;
  return { total: logs.length, streak, pb: pb.best, counts };
}

export default async function VersusPage({
  searchParams,
}: {
  searchParams: Promise<{ rep1?: string; rep2?: string }>;
}) {
  const session = await getSessionData();
  if (!session?.teamId) redirect("/");

  const params = await searchParams;
  const teamUsers = useMemoryDb ? memoryDb.getUsersByTeam(session.teamId).filter(u => u.role === "rep") : [];

  const rep1Name = params.rep1 ? decodeURIComponent(params.rep1) : null;
  const rep2Name = params.rep2 ? decodeURIComponent(params.rep2) : null;

  const rep1User = rep1Name ? teamUsers.find(u => u.name === rep1Name) : null;
  const rep2User = rep2Name ? teamUsers.find(u => u.name === rep2Name) : null;

  const rep1Stats = rep1User ? getRepStats(session.teamId, rep1User.id, rep1User.name) : null;
  const rep2Stats = rep2User ? getRepStats(session.teamId, rep2User.id, rep2User.name) : null;

  const activityTypes = useMemoryDb ? memoryDb.getActivityTypesByTeam(session.teamId).filter(at => at.isActive) : [];

  return (
    <div className="flex flex-col gap-4 p-4 max-w-lg mx-auto w-full pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Head to Head</h1>
          <p className="text-xs text-muted-foreground">Compare two reps</p>
        </div>
        <Link href="/dashboard" className="text-xs text-muted-foreground hover:text-foreground underline">
          Back
        </Link>
      </div>

      {/* Selector */}
      <form className="flex gap-2">
        <select name="rep1" defaultValue={rep1Name || ""} className="flex-1 h-9 rounded-lg border border-input bg-transparent px-2 text-sm">
          <option value="">Select rep...</option>
          {teamUsers.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
        </select>
        <span className="self-center text-sm font-bold text-muted-foreground">vs</span>
        <select name="rep2" defaultValue={rep2Name || ""} className="flex-1 h-9 rounded-lg border border-input bg-transparent px-2 text-sm">
          <option value="">Select rep...</option>
          {teamUsers.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
        </select>
        <button type="submit" className="h-9 px-3 rounded-lg bg-primary text-primary-foreground text-sm font-semibold">Go</button>
      </form>

      {rep1Stats && rep2Stats && rep1Name && rep2Name && (
        <>
          {/* Head-to-head stats */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <Card>
              <CardContent className="pt-3 pb-3">
                <p className={`text-2xl font-bold font-mono ${rep1Stats.total > rep2Stats.total ? "text-green-400" : ""}`}>{rep1Stats.total}</p>
                <p className="text-[10px] text-muted-foreground truncate">{rep1Name}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-3 pb-3 flex flex-col items-center justify-center">
                <p className="text-xs text-muted-foreground">Today</p>
                <p className="text-lg font-bold">vs</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-3 pb-3">
                <p className={`text-2xl font-bold font-mono ${rep2Stats.total > rep1Stats.total ? "text-green-400" : ""}`}>{rep2Stats.total}</p>
                <p className="text-[10px] text-muted-foreground truncate">{rep2Name}</p>
              </CardContent>
            </Card>
          </div>

          {/* Comparison rows */}
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-mono font-bold">{rep1Stats.streak}d</span>
                  <span className="text-muted-foreground">Streak</span>
                  <span className="font-mono font-bold">{rep2Stats.streak}d</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-mono font-bold">{rep1Stats.pb}</span>
                  <span className="text-muted-foreground">PB</span>
                  <span className="font-mono font-bold">{rep2Stats.pb}</span>
                </div>
                {activityTypes.map(at => (
                  <div key={at.id} className="flex items-center justify-between text-sm">
                    <span className={`font-mono font-bold ${(rep1Stats.counts[at.name] || 0) > (rep2Stats.counts[at.name] || 0) ? "text-green-400" : ""}`}>
                      {rep1Stats.counts[at.name] || 0}
                    </span>
                    <span className="text-muted-foreground" style={{ color: at.color }}>{at.name}</span>
                    <span className={`font-mono font-bold ${(rep2Stats.counts[at.name] || 0) > (rep1Stats.counts[at.name] || 0) ? "text-green-400" : ""}`}>
                      {rep2Stats.counts[at.name] || 0}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
