export interface RankTier {
  name: string;
  emoji: string;
  minActivities: number;
  color: string;
}

const TIERS: RankTier[] = [
  { name: "Legend", emoji: "💎", minActivities: 2000, color: "text-purple-400" },
  { name: "Crusher", emoji: "⚡", minActivities: 1000, color: "text-yellow-400" },
  { name: "Closer", emoji: "🔥", minActivities: 500, color: "text-orange-400" },
  { name: "Grinder", emoji: "💪", minActivities: 200, color: "text-blue-400" },
  { name: "Starter", emoji: "🌱", minActivities: 50, color: "text-green-400" },
  { name: "Rookie", emoji: "👋", minActivities: 0, color: "text-muted-foreground" },
];

export function getRankTier(totalAllTime: number): RankTier {
  for (const tier of TIERS) {
    if (totalAllTime >= tier.minActivities) return tier;
  }
  return TIERS[TIERS.length - 1];
}

export function getNextTier(totalAllTime: number): { tier: RankTier; remaining: number } | null {
  const current = getRankTier(totalAllTime);
  const idx = TIERS.indexOf(current);
  if (idx === 0) return null; // Already at max
  const next = TIERS[idx - 1];
  return { tier: next, remaining: next.minActivities - totalAllTime };
}
