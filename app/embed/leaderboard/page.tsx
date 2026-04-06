import { useMemoryDb } from "@/db";
import { memoryDb } from "@/db/memory";

export default async function EmbedLeaderboard({
  searchParams,
}: {
  searchParams: Promise<{ team?: string }>;
}) {
  const { team: teamId } = await searchParams;
  if (!teamId) {
    return <div className="p-4 text-sm text-muted-foreground">Missing team parameter</div>;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const teamData = useMemoryDb ? memoryDb.findTeamById(teamId) : null;
  const stats = useMemoryDb
    ? memoryDb.getStats(teamId, today, new Date())
    : { leaderboard: [] };

  if (!teamData) {
    return <div className="p-4 text-sm text-muted-foreground">Team not found</div>;
  }

  return (
    <div className="p-4 max-w-md mx-auto font-sans">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold">{teamData.name}</h2>
        <span className="text-xs text-muted-foreground">Live Leaderboard</span>
      </div>
      {stats.leaderboard.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">No activity yet today</p>
      ) : (
        <div className="flex flex-col gap-1.5">
          {stats.leaderboard.map((rep, i) => (
            <div
              key={rep.name}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm ${
                i === 0 ? "bg-yellow-500/10 border border-yellow-500/30" : "bg-card border border-border"
              }`}
            >
              <span className={`font-bold w-6 text-center ${
                i === 0 ? "text-yellow-400" : i === 1 ? "text-zinc-300" : i === 2 ? "text-orange-400" : "text-muted-foreground"
              }`}>
                {i + 1}
              </span>
              <span className="flex-1 font-medium">{i === 0 && "👑 "}{rep.name}</span>
              <span className="font-mono font-bold text-lg">{rep.total}</span>
            </div>
          ))}
        </div>
      )}
      <p className="text-center text-[10px] text-muted-foreground mt-3">
        Powered by SalesFloor
      </p>
    </div>
  );
}
