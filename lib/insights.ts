// Rule-based activity insights engine
// Generates personalized coaching tips from activity data

import { memoryDb } from "@/db/memory";

export interface Insight {
  emoji: string;
  message: string;
  type: "positive" | "tip" | "warning";
}

export function generateInsights(userId: string, teamId: string): Insight[] {
  const insights: Insight[] = [];
  const allLogs = memoryDb.getActivityLogs(teamId, { limit: 1000 }).filter(
    (l) => l.userName === memoryDb.findUserById(userId)?.name
  );

  if (allLogs.length < 5) return [{ emoji: "👋", message: "Keep logging — insights unlock after more activity!", type: "tip" }];

  const user = memoryDb.findUserById(userId);
  if (!user) return [];

  // Group by day of week
  const byDow: Record<number, number> = {};
  for (const l of allLogs) {
    const dow = new Date(l.createdAt).getDay();
    byDow[dow] = (byDow[dow] || 0) + 1;
  }
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const bestDow = Object.entries(byDow).sort(([, a], [, b]) => b - a)[0];
  if (bestDow) {
    insights.push({
      emoji: "📅",
      message: `Your most productive day is ${days[Number(bestDow[0])]}. You log ${Math.round(Number(bestDow[1]) / Math.max(1, Math.ceil(allLogs.length / 7)))}x more on those days.`,
      type: "positive",
    });
  }

  // Group by hour
  const byHour: Record<number, number> = {};
  for (const l of allLogs) {
    const h = new Date(l.createdAt).getHours();
    byHour[h] = (byHour[h] || 0) + 1;
  }
  const bestHour = Object.entries(byHour).sort(([, a], [, b]) => b - a)[0];
  if (bestHour) {
    const h = Number(bestHour[0]);
    const period = h < 12 ? "morning" : h < 17 ? "afternoon" : "evening";
    insights.push({
      emoji: "⏰",
      message: `You're most active in the ${period} (${h > 12 ? h - 12 : h}${h >= 12 ? "pm" : "am"} peak). Schedule important calls then.`,
      type: "tip",
    });
  }

  // Slowdown detection: compare last 3 days to prior 3 days
  const now = new Date();
  const recent3 = allLogs.filter((l) => {
    const diff = (now.getTime() - l.createdAt.getTime()) / (1000 * 60 * 60 * 24);
    return diff <= 3;
  }).length;
  const prior3 = allLogs.filter((l) => {
    const diff = (now.getTime() - l.createdAt.getTime()) / (1000 * 60 * 60 * 24);
    return diff > 3 && diff <= 6;
  }).length;
  if (prior3 > 0 && recent3 < prior3 * 0.6) {
    insights.push({
      emoji: "📉",
      message: `Your activity dropped ${Math.round((1 - recent3 / prior3) * 100)}% vs last few days. Time to push!`,
      type: "warning",
    });
  } else if (prior3 > 0 && recent3 > prior3 * 1.2) {
    insights.push({
      emoji: "📈",
      message: `You're up ${Math.round((recent3 / prior3 - 1) * 100)}% vs last few days. Great momentum!`,
      type: "positive",
    });
  }

  // Activity type mix
  const typeCounts: Record<string, number> = {};
  for (const l of allLogs) typeCounts[l.activityTypeName] = (typeCounts[l.activityTypeName] || 0) + 1;
  const sorted = Object.entries(typeCounts).sort(([, a], [, b]) => b - a);
  if (sorted.length >= 2) {
    const topType = sorted[0][0];
    const topPct = Math.round((sorted[0][1] / allLogs.length) * 100);
    if (topPct > 60) {
      insights.push({
        emoji: "🎯",
        message: `${topPct}% of your activity is ${topType}. Consider diversifying to boost callbacks.`,
        type: "tip",
      });
    }
  }

  // Streak encouragement
  const streak = memoryDb.getUserStreak(userId, teamId);
  if (streak >= 7) {
    insights.push({ emoji: "🔥", message: `${streak}-day streak! Top performers average 15+ day streaks.`, type: "positive" });
  } else if (streak === 0) {
    insights.push({ emoji: "⚠️", message: "No activity today yet. Even 1 log keeps your streak alive!", type: "warning" });
  }

  // Callback conversion
  const calls = typeCounts["Call"] || 0;
  const callbacks = typeCounts["Callback Booked"] || 0;
  if (calls >= 10) {
    const rate = Math.round((callbacks / calls) * 100);
    if (rate < 20) {
      insights.push({ emoji: "💡", message: `Your callback rate is ${rate}%. Reps who log 5+ calls before 10am convert 30% more.`, type: "tip" });
    } else if (rate >= 30) {
      insights.push({ emoji: "🏆", message: `${rate}% callback rate — that's elite. Keep closing.`, type: "positive" });
    }
  }

  return insights.slice(0, 4); // Max 4 insights
}
