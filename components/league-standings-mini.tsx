import Link from "next/link";

interface Standing {
  teamId: string;
  teamName: string;
  score: number;
  rank: number;
}

interface LeagueStandingsMiniProps {
  leagueId: string;
  leagueName: string;
  standings: Standing[];
  currentTeamId: string;
}

export function LeagueStandingsMini({ leagueId, leagueName, standings, currentTeamId }: LeagueStandingsMiniProps) {
  return (
    <div className="flex flex-col gap-1.5 mb-3 last:mb-0">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold">{leagueName}</span>
        <Link href={`/org/leagues/${leagueId}`} className="text-[10px] text-primary hover:underline">
          Full standings &rarr;
        </Link>
      </div>
      {standings.slice(0, 5).map((s) => {
        const isMe = s.teamId === currentTeamId;
        return (
          <div
            key={s.teamId}
            className={`flex items-center gap-2 text-sm px-2 py-1 rounded ${isMe ? "bg-primary/10" : ""}`}
          >
            <span className={`font-mono w-5 text-center text-xs ${
              s.rank === 1 ? "text-yellow-400 font-bold" : "text-muted-foreground"
            }`}>
              {s.rank}
            </span>
            <span className={`flex-1 truncate ${isMe ? "font-bold" : ""}`}>
              {s.rank === 1 && "👑 "}{s.teamName}
            </span>
            <span className="font-mono font-bold">{s.score}</span>
          </div>
        );
      })}
    </div>
  );
}
