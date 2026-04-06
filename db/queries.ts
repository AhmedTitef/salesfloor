// Unified query layer — works with both memory DB and Drizzle/Neon
import { getDb, useMemoryDb } from './index'
import { memoryDb } from './memory'
import * as schema from './schema'
import { eq, and, gte, lte, desc, sql } from 'drizzle-orm'

// ============ Activity Types ============

export async function getActivityTypesByTeam(teamId: string) {
  if (useMemoryDb) {
    return memoryDb.getActivityTypesByTeam(teamId).filter(t => t.isActive)
  }
  const db = getDb()
  return db.select().from(schema.activityTypes)
    .where(and(eq(schema.activityTypes.teamId, teamId), eq(schema.activityTypes.isActive, true)))
    .orderBy(schema.activityTypes.sortOrder)
}

// ============ Activity Logs ============

export async function createActivityLog(data: { userId: string; teamId: string; activityTypeId: string }) {
  if (useMemoryDb) {
    return memoryDb.createActivityLog(data)
  }
  const db = getDb()
  const [log] = await db.insert(schema.activityLogs).values(data).returning()
  return log
}

export async function deleteActivityLog(id: string, userId: string) {
  if (useMemoryDb) {
    return memoryDb.deleteActivityLog(id, userId)
  }
  const db = getDb()
  await db.delete(schema.activityLogs).where(and(eq(schema.activityLogs.id, id), eq(schema.activityLogs.userId, userId)))
  return true
}

export async function getActivityLogs(teamId: string, opts?: { start?: Date; limit?: number }) {
  if (useMemoryDb) {
    const logs = memoryDb.getActivityLogs(teamId, opts)
    return logs
  }
  const db = getDb()
  const conditions = [eq(schema.activityLogs.teamId, teamId)]
  if (opts?.start) conditions.push(gte(schema.activityLogs.createdAt, opts.start))

  const logs = await db
    .select({
      id: schema.activityLogs.id,
      userId: schema.activityLogs.userId,
      teamId: schema.activityLogs.teamId,
      activityTypeId: schema.activityLogs.activityTypeId,
      notes: schema.activityLogs.notes,
      outcome: schema.activityLogs.outcome,
      createdAt: schema.activityLogs.createdAt,
      userName: schema.users.name,
      activityTypeName: schema.activityTypes.name,
      activityTypeColor: schema.activityTypes.color,
      activityTypeIcon: schema.activityTypes.icon,
    })
    .from(schema.activityLogs)
    .leftJoin(schema.users, eq(schema.activityLogs.userId, schema.users.id))
    .leftJoin(schema.activityTypes, eq(schema.activityLogs.activityTypeId, schema.activityTypes.id))
    .where(and(...conditions))
    .orderBy(desc(schema.activityLogs.createdAt))
    .limit(opts?.limit || 100)

  return logs.map(l => ({
    ...l,
    userName: l.userName || 'Unknown',
    activityTypeName: l.activityTypeName || 'Unknown',
    activityTypeColor: l.activityTypeColor || '#888',
    activityTypeIcon: l.activityTypeIcon || 'star',
  }))
}

// ============ Stats ============

export async function getStats(teamId: string, start: Date, end: Date) {
  if (useMemoryDb) {
    return memoryDb.getStats(teamId, start, end)
  }

  const db = getDb()

  // Get all logs in range
  const logs = await db.select({
    userId: schema.activityLogs.userId,
    activityTypeId: schema.activityLogs.activityTypeId,
  }).from(schema.activityLogs)
    .where(and(
      eq(schema.activityLogs.teamId, teamId),
      gte(schema.activityLogs.createdAt, start),
      lte(schema.activityLogs.createdAt, end),
    ))

  // Get team users and activity types
  const teamUsers = await db.select().from(schema.users).where(eq(schema.users.teamId, teamId))
  const teamTypes = await db.select().from(schema.activityTypes).where(eq(schema.activityTypes.teamId, teamId))

  // Team totals by type
  const teamStats: Record<string, number> = {}
  for (const at of teamTypes) {
    teamStats[at.name] = logs.filter(l => l.activityTypeId === at.id).length
  }

  // Per-user stats (include everyone who has logged activity)
  const activeUserIds = new Set(logs.map(l => l.userId))
  const activeUsers = teamUsers.filter(u => activeUserIds.has(u.id))
  // Also include reps with 0 activity so they show on the board
  const reps = teamUsers.filter(u => u.role === 'rep')
  const allRelevant = [...new Map([...activeUsers, ...reps].map(u => [u.id, u])).values()]
  const repStats = allRelevant.map(u => {
    const userLogs = logs.filter(l => l.userId === u.id)
    const counts: Record<string, number> = {}
    for (const at of teamTypes) {
      counts[at.name] = userLogs.filter(l => l.activityTypeId === at.id).length
    }
    return { name: u.name, counts, total: userLogs.length }
  })

  const leaderboard = repStats
    .map(r => ({ name: r.name, total: r.total }))
    .sort((a, b) => b.total - a.total)

  return { teamStats, repStats, leaderboard }
}

// ============ Streaks ============

export async function getUserStreak(userId: string, teamId: string): Promise<number> {
  if (useMemoryDb) {
    return memoryDb.getUserStreak(userId, teamId)
  }

  const db = getDb()
  const logs = await db.select({ createdAt: schema.activityLogs.createdAt })
    .from(schema.activityLogs)
    .where(and(eq(schema.activityLogs.userId, userId), eq(schema.activityLogs.teamId, teamId)))

  if (logs.length === 0) return 0

  const days = new Set(logs.map(l => {
    const d = new Date(l.createdAt)
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
  }))

  let streak = 0
  const check = new Date()
  check.setHours(0, 0, 0, 0)

  while (true) {
    const key = `${check.getFullYear()}-${check.getMonth()}-${check.getDate()}`
    if (days.has(key)) {
      streak++
      check.setDate(check.getDate() - 1)
    } else {
      break
    }
  }
  return streak
}

// ============ Personal Best ============

export async function getUserPersonalBest(userId: string, teamId: string): Promise<{ best: number; isNewBest: boolean }> {
  if (useMemoryDb) {
    return memoryDb.getUserPersonalBest(userId, teamId)
  }

  const db = getDb()
  const logs = await db.select({ createdAt: schema.activityLogs.createdAt })
    .from(schema.activityLogs)
    .where(and(eq(schema.activityLogs.userId, userId), eq(schema.activityLogs.teamId, teamId)))

  if (logs.length === 0) return { best: 0, isNewBest: false }

  const byDay: Record<string, number> = {}
  for (const l of logs) {
    const d = new Date(l.createdAt)
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
    byDay[key] = (byDay[key] || 0) + 1
  }

  const now = new Date()
  const todayKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`
  const todayCount = byDay[todayKey] || 0
  const allBest = Math.max(...Object.values(byDay))
  const prevBest = Math.max(0, ...Object.entries(byDay).filter(([k]) => k !== todayKey).map(([, v]) => v))

  return { best: allBest, isNewBest: todayCount > 0 && todayCount > prevBest && prevBest > 0 }
}

// ============ All-time count ============

export async function getUserAllTimeCount(userId: string, teamId: string): Promise<number> {
  if (useMemoryDb) {
    return memoryDb.getUserAllTimeCount(userId, teamId)
  }
  const db = getDb()
  const [result] = await db.select({ count: sql<number>`count(*)` })
    .from(schema.activityLogs)
    .where(and(eq(schema.activityLogs.userId, userId), eq(schema.activityLogs.teamId, teamId)))
  return Number(result?.count || 0)
}
