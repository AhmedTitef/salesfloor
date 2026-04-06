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

export default async function LeaguesPage() {
  const session = await getSessionData();
  if (!session?.orgId) redirect("/dashboard");

  const leagues = useMemoryDb ? memoryDb.getLeaguesByOrg(session.orgId) : [];
  const now = new Date();

  const active = leagues.filter((l) => l.isActive && l.endsAt > now);
  const past = leagues.filter((l) => !l.isActive || l.endsAt <= now);

  return (
    <div className="flex flex-col gap-4 p-4 max-w-lg mx-auto w-full pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Leagues</h1>
          <p className="text-xs text-muted-foreground">Inter-team competitions</p>
        </div>
        <div className="flex gap-3">
          <Link href="/org/dashboard" className="text-xs text-muted-foreground hover:text-foreground underline">
            Org
          </Link>
          {session.orgRole === "org_admin" && (
            <Link href="/org/leagues/create" className="text-xs text-primary hover:underline font-medium">
              + New League
            </Link>
          )}
        </div>
      </div>

      {active.length === 0 && past.length === 0 && (
        <Card>
          <CardContent className="pt-6 pb-6 text-center">
            <p className="text-3xl mb-2">🏆</p>
            <p className="text-sm text-muted-foreground">No leagues yet. Create one to start competing!</p>
          </CardContent>
        </Card>
      )}

      {active.length > 0 && (
        <>
          <h2 className="text-sm font-semibold text-muted-foreground">Active</h2>
          {active.map((league) => {
            const daysLeft = Math.ceil((league.endsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            const teams = useMemoryDb ? memoryDb.getLeagueTeams(league.id) : [];
            return (
              <Link key={league.id} href={`/org/leagues/${league.id}`}>
                <Card className="hover:border-primary/50 transition-colors">
                  <CardContent className="pt-3 pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-sm">{league.name}</p>
                        <p className="text-xs text-muted-foreground">{teams.length} teams &middot; {league.scoringMode === "per_rep_avg" ? "Per-rep avg" : "Total"}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-mono text-primary">{daysLeft}d left</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </>
      )}

      {past.length > 0 && (
        <>
          <h2 className="text-sm font-semibold text-muted-foreground mt-2">Past</h2>
          {past.map((league) => {
            const teams = useMemoryDb ? memoryDb.getLeagueTeams(league.id) : [];
            return (
              <Link key={league.id} href={`/org/leagues/${league.id}`}>
                <Card className="opacity-60 hover:opacity-80 transition-opacity">
                  <CardContent className="pt-3 pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-sm">{league.name}</p>
                        <p className="text-xs text-muted-foreground">{teams.length} teams &middot; Ended</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </>
      )}
    </div>
  );
}
