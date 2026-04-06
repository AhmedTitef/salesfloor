import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { useMemoryDb } from "@/db";
import { memoryDb } from "@/db/memory";
import * as queries from "@/db/queries";
import { Confetti } from "@/components/confetti";
import { ActivityForm } from "@/components/activity-form";
import { UndoToast } from "@/components/undo-toast";
import { HotStreakProvider } from "@/components/hot-streak";
import { Onboarding } from "@/components/onboarding";
import { OfflineSync } from "@/components/offline-sync";
import { OutcomeTag } from "@/components/outcome-tag";
import { LiveUpdates } from "@/components/live-updates";
import { ChallengeBanner } from "@/components/challenge-banner";
import { BroadcastBanner } from "@/components/broadcast-banner";
import { PullToRefresh } from "@/components/pull-to-refresh";
import { InsightsCard } from "@/components/insights-card";
import { generateInsights } from "@/lib/insights";
import { getRankTier, getNextTier } from "@/lib/rank-tiers";

async function getSessionData() {
  const cookieStore = await cookies();
  const raw = cookieStore.get("sf_session")?.value;
  if (!raw) return null;
  try {
    const session = JSON.parse(raw);
    if (!session.userId || !session.teamId) return null;
    return {
      userId: session.userId,
      userName: session.userName || "User",
      role: session.role,
      teamId: session.teamId,
      teamName: session.teamName || "Team",
      dailyGoal: session.dailyGoal ?? 50,
    };
  } catch {
    return null;
  }
}

const ICON_MAP: Record<string, string> = {
  phone: "📞",
  "calendar-check": "📅",
  "x-circle": "❌",
  ticket: "🎫",
  home: "🏠",
  star: "⭐",
  flag: "🚩",
  check: "✅",
  chat: "💬",
  mail: "📧",
  handshake: "🤝",
  money: "💰",
  rocket: "🚀",
  fire: "🔥",
  target: "🎯",
  trophy: "🏆",
  chart: "📊",
  clock: "⏰",
  car: "🚗",
  door: "🚪",
  clipboard: "📋",
  megaphone: "📣",
  gift: "🎁",
  thumbsup: "👍",
};

function getEmoji(icon: string): string {
  return ICON_MAP[icon] || icon || "📋";
}

export default async function LogPage() {
  const session = await getSessionData();
  if (!session) redirect("/");

  const activityTypes = await queries.getActivityTypesByTeam(session.teamId);

  // Check for personal goal
  const currentUser = useMemoryDb ? memoryDb.findUserById(session.userId) : null;
  const effectiveGoal = currentUser?.personalGoal ?? session.dailyGoal ?? 50;

  // Playbook
  const team = useMemoryDb ? memoryDb.findTeamById(session.teamId) : null;
  const playbook = team?.playbook || [];

  // Get today's logs
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const logs = await queries.getActivityLogs(session.teamId, { start: today, limit: 50 });

  // Count per activity type for current user
  const userLogs = logs.filter((l) => l.userName === session.userName);
  const counts: Record<string, number> = {};
  for (const log of userLogs) {
    counts[log.activityTypeName] = (counts[log.activityTypeName] || 0) + 1;
  }
  const totalToday = Object.values(counts).reduce((sum, c) => sum + c, 0);

  // Streak & personal best
  const streak = await queries.getUserStreak(session.userId, session.teamId);
  const pb = await queries.getUserPersonalBest(session.userId, session.teamId);

  // Leaderboard position
  const teamStats = await queries.getStats(session.teamId, today, new Date());
  const myRank = teamStats.leaderboard.findIndex((r: { name: string }) => r.name === session.userName) + 1;
  const leader = teamStats.leaderboard[0];
  const behindBy = leader && leader.name !== session.userName ? leader.total - totalToday : 0;

  // Goal progress
  const goalPct = effectiveGoal > 0 ? Math.min(100, Math.round((totalToday / effectiveGoal) * 100)) : 0;
  const goalHit = effectiveGoal > 0 && totalToday >= effectiveGoal;

  // Pace calculation — how many more per hour to hit goal by 5pm
  let paceMessage = "";
  if (effectiveGoal > 0 && !goalHit) {
    const now = new Date();
    const endOfDay = new Date(now);
    endOfDay.setHours(team?.workEndHour ?? 17, 0, 0, 0);
    const hoursLeft = Math.max(0, (endOfDay.getTime() - now.getTime()) / (1000 * 60 * 60));
    const remaining = effectiveGoal - totalToday;
    if (hoursLeft <= 0) {
      paceMessage = `${remaining} left — push to close it out!`;
    } else if (remaining > 0) {
      const perHour = Math.ceil(remaining / hoursLeft);
      const endHour = team?.workEndHour ?? 17;
      const endLabel = endHour > 12 ? `${endHour - 12}pm` : `${endHour}am`;
      paceMessage = `${remaining} left — ~${perHour}/hr to hit goal by ${endLabel}`;
    }
  }

  // Rank tier
  const allTimeCount = await queries.getUserAllTimeCount(session.userId, session.teamId);
  const rankTier = getRankTier(allTimeCount);
  const nextTier = getNextTier(allTimeCount);

  // Celebrations
  const celebrations: string[] = [];
  if (goalHit && totalToday === effectiveGoal) celebrations.push("🎯 Daily Goal Reached!");
  if (pb.isNewBest) celebrations.push(`🏆 New Personal Best: ${pb.best}!`);
  if (myRank === 1 && totalToday > 0 && teamStats.leaderboard.length > 1) celebrations.push("👑 You're #1!");

  // Variable reward surprises
  if (totalToday === 10) celebrations.push("🎉 Double digits! You hit 10!");
  if (totalToday === 25) celebrations.push("🚀 25 activities — you're on fire!");
  if (totalToday === 50) celebrations.push("💯 FIFTY! Absolute machine!");
  if (allTimeCount === 100) celebrations.push("🎊 100 all-time activities! Milestone unlocked!");
  if (allTimeCount === 500) celebrations.push("⭐ 500 all-time! You're a Closer now!");
  if (allTimeCount === 1000) celebrations.push("💎 1000 all-time! Crusher status achieved!");

  // Recent activity — show only YOUR logs, limit to 5
  const myRecentLogs = logs.filter((l) => l.userName === session.userName).slice(0, 5);

  // Weekly MVP (show on Monday)
  const isMonday = new Date().getDay() === 1;
  const weeklyMVP = isMonday && useMemoryDb ? memoryDb.getWeeklyMVP(session.teamId) : null;

  // AI Coach insights
  const insights = useMemoryDb ? generateInsights(session.userId, session.teamId) : [];

  return (
    <div className="flex flex-col gap-4 p-4 max-w-lg mx-auto w-full pb-8">
      {celebrations.length > 0 && <Confetti messages={celebrations} />}
      <OfflineSync />
      {weeklyMVP && (
        <div className="rounded-lg border border-yellow-500/40 bg-yellow-500/10 px-3 py-2.5 text-center">
          <p className="text-sm font-bold text-yellow-400">🏆 Last Week&apos;s MVP</p>
          <p className="text-lg font-bold">{weeklyMVP.name}</p>
          <p className="text-xs text-muted-foreground">{weeklyMVP.total} activities</p>
        </div>
      )}
      <BroadcastBanner />
      <ChallengeBanner />

      {/* Top bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-lg font-bold">
              {session.userName}
              <span className={`ml-1.5 text-xs ${rankTier.color}`}>{rankTier.emoji} {rankTier.name}</span>
            </h1>
            <p className="text-xs text-muted-foreground">
              {session.teamName}
              {nextTier && <span className="ml-1">· {nextTier.remaining} to {nextTier.tier.name}</span>}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {streak > 0 && (
            <div className="flex items-center gap-1 text-xs font-bold">
              <span className={streak >= 3 ? "animate-pulse-fire" : ""}>🔥</span>
              <span>{streak}d</span>
            </div>
          )}
          {session.role === "manager" && (
            <Link href="/dashboard" className="text-xs text-muted-foreground hover:text-foreground underline">
              Dashboard
            </Link>
          )}
        </div>
      </div>

      {/* Goal progress bar */}
      {effectiveGoal > 0 && (
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-muted-foreground">
              {goalHit ? "🎯 Goal smashed!" : "🎯 Daily Goal"}
            </span>
            <span className="text-xs font-mono font-bold">
              {totalToday}/{effectiveGoal}
            </span>
          </div>
          <div className="h-2.5 rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${goalHit ? "bg-green-500 goal-complete" : "bg-primary"}`}
              style={{ width: `${goalPct}%` }}
            />
          </div>
          {paceMessage && (
            <p className="text-xs text-muted-foreground mt-1">{paceMessage}</p>
          )}
        </div>
      )}

      {/* Competitive nudge */}
      {teamStats.leaderboard.length > 1 && (
        <div className="rounded-lg border bg-card px-3 py-2 text-center text-sm">
          {myRank === 1 ? (
            <span className="font-semibold text-yellow-500">👑 You&apos;re leading the floor!</span>
          ) : behindBy > 0 ? (
            <span>
              You&apos;re <span className="font-bold">#{myRank}</span> &mdash;{" "}
              <span className="font-bold">{behindBy}</span> behind{" "}
              <span className="font-semibold">{leader?.name}</span>. Keep pushing!
            </span>
          ) : (
            <span>
              You&apos;re <span className="font-bold">#{myRank}</span> &mdash; tied with the leader!
            </span>
          )}
        </div>
      )}

      {/* Playbook checklist */}
      {playbook.length > 0 && (
        <div className="flex flex-col gap-1">
          <h2 className="text-xs font-semibold text-muted-foreground">Today&apos;s Playbook</h2>
          <div className="flex flex-wrap gap-2">
            {playbook.map((item) => {
              const done = (counts[item.activityTypeName] || 0) >= item.target;
              const current = counts[item.activityTypeName] || 0;
              return (
                <div
                  key={item.activityTypeName}
                  className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs ${
                    done ? "border-green-500/40 bg-green-500/10 text-green-400" : "border-border bg-card"
                  }`}
                >
                  <span>{done ? "✅" : "⬜"}</span>
                  <span>{item.activityTypeName}</span>
                  <span className="font-mono font-bold">{current}/{item.target}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Personal stats row */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <div className="flex flex-col items-center justify-center rounded-lg border bg-card px-3 py-2 min-w-[70px]">
          <span className="font-mono text-xl font-bold">{totalToday}</span>
          <span className="text-[10px] text-muted-foreground">Total</span>
        </div>
        {pb.best > 0 && (
          <div className={`flex flex-col items-center justify-center rounded-lg border px-3 py-2 min-w-[70px] ${pb.isNewBest ? "border-yellow-500/50 bg-yellow-500/10" : "bg-card"}`}>
            <span className="font-mono text-xl font-bold">{pb.best}</span>
            <span className="text-[10px] text-muted-foreground">{pb.isNewBest ? "🏆 NEW PB" : "PB"}</span>
          </div>
        )}
        {activityTypes.map((at) => (
          <div key={at.id} className="flex flex-col items-center justify-center rounded-lg border bg-card px-3 py-2 min-w-[70px] shrink-0">
            <span className="font-mono text-xl font-bold">{counts[at.name] || 0}</span>
            <span className="text-[10px] text-muted-foreground text-center leading-tight max-w-[80px]">{at.name}</span>
          </div>
        ))}
      </div>

      <Separator />

      {/* Activity buttons grid */}
      <HotStreakProvider>
        <div className="grid grid-cols-2 gap-3">
          {activityTypes.map((at) => {
            const emoji = getEmoji(at.icon);
            const count = counts[at.name] || 0;
            return (
              <ActivityForm
                key={at.id}
                activityTypeId={at.id}
                emoji={emoji}
                name={at.name}
                color={at.color}
                count={count}
              />
            );
          })}
        </div>
      </HotStreakProvider>

      <Separator />

      {/* Manager: Team overview — tap a rep to see their stats */}
      {session.role === "manager" && teamStats.leaderboard.length > 0 && (
        <>
          <Separator />
          <div>
            <h2 className="text-sm font-semibold text-muted-foreground mb-2">Your Team</h2>
            <div className="flex flex-col gap-1.5">
              {teamStats.leaderboard.map((rep: { name: string; total: number }, i: number) => (
                <Link
                  key={rep.name}
                  href={`/dashboard/rep/${encodeURIComponent(rep.name)}`}
                  className="flex items-center gap-2 rounded-lg bg-card px-3 py-2.5 text-sm border hover:border-primary/50 transition-colors"
                >
                  <span className={`font-mono w-5 text-center text-xs ${i === 0 ? "text-yellow-400 font-bold" : "text-muted-foreground"}`}>
                    {i + 1}
                  </span>
                  <span className="flex-1 font-medium">{rep.name}</span>
                  <span className="font-mono font-bold">{rep.total}</span>
                  <span className="text-xs text-muted-foreground">&rsaquo;</span>
                </Link>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Your recent activity */}
      <Separator />
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground mb-2">Your Recent Activity</h2>
        {myRecentLogs.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No activity yet today. Start tapping!
          </p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {myRecentLogs.map((log) => {
              const emoji = getEmoji(log.activityTypeIcon);
              const time = new Date(log.createdAt).toLocaleTimeString([], {
                hour: "numeric",
                minute: "2-digit",
              });
              return (
                <div
                  key={log.id}
                  className="flex items-center gap-2 rounded-md bg-card px-3 py-2 text-sm border"
                >
                  <span>{emoji}</span>
                  <span className="flex-1 truncate">
                    <span style={{ color: log.activityTypeColor }} className="font-medium">
                      {log.activityTypeName}
                    </span>
                  </span>
                  <OutcomeTag
                    logId={log.id}
                    currentOutcome={log.outcome ?? null}
                    isOwner={true}
                  />
                  <span className="text-xs text-muted-foreground font-mono shrink-0">{time}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {insights.length > 0 && (
        <>
          <Separator />
          <InsightsCard insights={insights} />
        </>
      )}

      <UndoToast />
      <Onboarding />
      <LiveUpdates />
      <PullToRefresh />
    </div>
  );
}
