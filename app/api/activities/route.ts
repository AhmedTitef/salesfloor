import { NextRequest, NextResponse } from 'next/server'
import { getDb, useMemoryDb } from '@/db'
import { activityLogs, activityTypes, users } from '@/db/schema'
import { memoryDb } from '@/db/memory'
import { getSession } from '@/lib/auth'
import { eq, and, gte, lte, desc } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = request.nextUrl
    const start = searchParams.get('start')
    const end = searchParams.get('end')

    if (useMemoryDb) {
      const logs = memoryDb.getActivityLogs(session.teamId, {
        start: start ? new Date(start) : undefined,
        end: end ? new Date(end) : undefined,
        limit: 50,
      })

      return NextResponse.json({ logs })
    }

    const db = getDb()

    const conditions = [eq(activityLogs.teamId, session.teamId)]
    if (start) conditions.push(gte(activityLogs.createdAt, new Date(start)))
    if (end) conditions.push(lte(activityLogs.createdAt, new Date(end)))

    const logs = await db
      .select({
        id: activityLogs.id,
        notes: activityLogs.notes,
        createdAt: activityLogs.createdAt,
        userName: users.name,
        activityTypeName: activityTypes.name,
        activityTypeColor: activityTypes.color,
        activityTypeIcon: activityTypes.icon,
      })
      .from(activityLogs)
      .innerJoin(users, eq(activityLogs.userId, users.id))
      .innerJoin(activityTypes, eq(activityLogs.activityTypeId, activityTypes.id))
      .where(and(...conditions))
      .orderBy(desc(activityLogs.createdAt))
      .limit(50)

    return NextResponse.json({ logs })
  } catch (error) {
    console.error('Error fetching activities:', error)
    return NextResponse.json({ error: 'Failed to fetch activities' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { activityTypeId, notes } = await request.json()

    if (!activityTypeId) {
      return NextResponse.json({ error: 'Missing activityTypeId' }, { status: 400 })
    }

    if (useMemoryDb) {
      const log = memoryDb.createActivityLog({
        userId: session.userId,
        teamId: session.teamId,
        activityTypeId,
        notes: notes || null,
      })

      return NextResponse.json({ log })
    }

    const db = getDb()

    const [log] = await db.insert(activityLogs).values({
      userId: session.userId,
      teamId: session.teamId,
      activityTypeId,
      notes: notes || null,
    }).returning()

    return NextResponse.json({ log })
  } catch (error) {
    console.error('Error logging activity:', error)
    return NextResponse.json({ error: 'Failed to log activity' }, { status: 500 })
  }
}
