"use client";

import { useState, useEffect } from "react";

interface ChallengeData {
  challenge: { id: string; name: string; endsAt: string } | null;
  leaderboard: { name: string; total: number }[];
}

export function ChallengeBanner() {
  const [data, setData] = useState<ChallengeData | null>(null);
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    fetchChallenge();
    const interval = setInterval(fetchChallenge, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!data?.challenge) return;
    function tick() {
      const end = new Date(data!.challenge!.endsAt).getTime();
      const diff = end - Date.now();
      if (diff <= 0) {
        setTimeLeft("Ended!");
        return;
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(h > 0 ? `${h}h ${m}m` : `${m}m ${s}s`);
    }
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [data]);

  async function fetchChallenge() {
    try {
      const res = await fetch("/api/challenge");
      const d = await res.json();
      setData(d);
    } catch {}
  }

  if (!data?.challenge) return null;

  return (
    <div className="rounded-lg border border-purple-500/40 bg-purple-500/10 px-3 py-2.5">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm font-bold text-purple-300">
          ⚡ {data.challenge.name}
        </span>
        <span className="text-xs font-mono text-purple-400">{timeLeft}</span>
      </div>
      {data.leaderboard.length > 0 && (
        <div className="flex gap-3 text-xs">
          {data.leaderboard.slice(0, 3).map((rep, i) => (
            <span key={rep.name} className={i === 0 ? "font-bold text-purple-300" : "text-purple-400"}>
              {i === 0 ? "👑" : `#${i + 1}`} {rep.name}: {rep.total}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
