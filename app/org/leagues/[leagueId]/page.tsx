import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useMemoryDb } from "@/db";
import { memoryDb } from "@/db/memory";

async function getSessionData() {
  const cookieStore = await cookies();
  const raw = cookieStore.get("sf_session")?.value;
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export default async function LeagueStandingsPage({
  params,
}: {
  params: Promise<{ leagueId: string }>;
}) {
  const session = await getSessionData();
  if (!session?.orgId) redirect("/dashboard");

  const { leagueId } = await params;
  const league = useMemoryDb ? memoryDb.findLeagueById(leagueId) : null;
  if (!league || league.orgId !== session.orgId) redirect("/org/leagues");

  const standings = useMemoryDb ? memoryDb.getLeagueStandings(leagueId) : [];
  const now = new Date();
  const isActive = league.isActive && league.endsAt > now;
  const daysLeft = isActive ? Math.ceil((league.endsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 0;

  return (
    <div className="flex flex-col gap-4 p-4 max-w-lg mx-auto w-full pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">{league.name}</h1>
          <p className="text-xs text-muted-foreground">
            {league.scoringMode === "per_rep_avg" ? "Per-rep average" : "Total activities"}
            {isActive ? ` \u00b7 ${daysLeft}d remaining` : " \u00b7 Ended"}
          </p>
        </div>
        <div className="flex gap-3 items-center">
          {isActive && <Badge variant="default" className="text-xs">Live</Badge>}
          <Link href="/org/leagues" className="text-xs text-muted-foreground hover:text-foreground underline">
            All Leagues
          </Link>
        </div>
      </div>

      {/* Standings */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Standings</CardTitle>
        </CardHeader>
        <CardContent>
          {standings.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No teams enrolled</p>
          ) : (
            <div className="flex flex-col gap-2">
              {standings.map((s) => {
                const isMyTeam = s.teamId === session.teamId;
                return (
                  <div
                    key={s.teamId}
                    className={`flex items-center gap-3 rounded-lg px-3 py-3 border ${
                      s.rank === 1
                        ? "bg-yellow-500/10 border-yellow-500/30"
                        : isMyTeam
                        ? "bg-primary/5 border-primary/30"
                        : "bg-card border-border"
                    }`}
                  >
                    <span className={`text-xl font-bold w-8 text-center ${
                      s.rank === 1 ? "text-yellow-400" : s.rank === 2 ? "text-zinc-300" : s.rank === 3 ? "text-orange-400" : "text-muted-foreground"
                    }`}>
                      {s.rank}
                    </span>
                    <div className="flex-1">
                      <p className="font-semibold text-sm">
                        {s.rank === 1 && "👑 "}{s.teamName}
                        {isMyTeam && <span className="text-xs text-primary ml-1">(you)</span>}
                      </p>
                      <p className="text-xs text-muted-foreground">{s.repCount} reps &middot; {s.totalActivities} total</p>
                    </div>
                    <span className="font-mono text-2xl font-bold">{s.score}</span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
