import { NextRequest, NextResponse } from 'next/server'
import { getDb, useMemoryDb } from '@/db'
import { activityLogs, activityTypes, users } from '@/db/schema'
import { memoryDb } from '@/db/memory'
import { getSession } from '@/lib/auth'
import { eq, and, gte, sql } from 'drizzle-orm'

function getStartDate(period: string): Date {
  const now = new Date()
  switch (period) {
    case 'today': {
      const start = new Date(now)
      start.setHours(0, 0, 0, 0)
      return start
    }
    case 'week': {
      const start = new Date(now)
      start.setDate(start.getDate() - start.getDay())
      start.setHours(0, 0, 0, 0)
      return start
    }
    case 'month': {
      const start = new Date(now.getFullYear(), now.getMonth(), 1)
      return start
    }
    default:
      return new Date(now.setHours(0, 0, 0, 0))
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = request.nextUrl
    const period = searchParams.get('period') || 'today'
    const startDate = getStartDate(period)

    if (useMemoryDb) {
      const { teamStats, repStats, leaderboard } = memoryDb.getStats(session.teamId, startDate, new Date())
      return NextResponse.json({ teamStats, repStats, leaderboard })
    }

    const db = getDb()

    // Team stats: count per activity type
    const teamStatsRows = await db
      .select({
        activityTypeName: activityTypes.name,
        count: sql<number>`cast(count(*) as int)`,
      })
      .from(activityLogs)
      .innerJoin(activityTypes, eq(activityLogs.activityTypeId, activityTypes.id))
      .where(
        and(
          eq(activityLogs.teamId, session.teamId),
          gte(activityLogs.createdAt, startDate)
        )
      )
      .groupBy(activityTypes.name)

    const teamStats: Record<string, number> = {}
    for (const row of teamStatsRows) {
      teamStats[row.activityTypeName] = row.count
    }

    // Rep stats: count per rep per activity type
    const repStatsRows = await db
      .select({
        userName: users.name,
        activityTypeName: activityTypes.name,
        count: sql<number>`cast(count(*) as int)`,
      })
      .from(activityLogs)
      .innerJoin(users, eq(activityLogs.userId, users.id))
      .innerJoin(activityTypes, eq(activityLogs.activityTypeId, activityTypes.id))
      .where(
        and(
          eq(activityLogs.teamId, session.teamId),
          gte(activityLogs.createdAt, startDate)
        )
      )
      .groupBy(users.name, activityTypes.name)

    const repMap: Record<string, Record<string, number>> = {}
    for (const row of repStatsRows) {
      if (!repMap[row.userName]) repMap[row.userName] = {}
      repMap[row.userName][row.activityTypeName] = row.count
    }

    const repStats = Object.entries(repMap).map(([name, counts]) => ({
      name,
      counts,
    }))

    // Leaderboard: total activities per rep
    const leaderboardRows = await db
      .select({
        userName: users.name,
        total: sql<number>`cast(count(*) as int)`,
      })
      .from(activityLogs)
      .innerJoin(users, eq(activityLogs.userId, users.id))
      .where(
        and(
          eq(activityLogs.teamId, session.teamId),
          gte(activityLogs.createdAt, startDate)
        )
      )
      .groupBy(users.name)
      .orderBy(sql`count(*) desc`)

    const leaderboard = leaderboardRows.map((row) => ({
      name: row.userName,
      total: row.total,
    }))

    return NextResponse.json({ teamStats, repStats, leaderboard })
  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
