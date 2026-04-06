import { NextRequest, NextResponse } from 'next/server'
import { getDb, useMemoryDb } from '@/db'
import { activityTypes } from '@/db/schema'
import { memoryDb } from '@/db/memory'
import { getSession } from '@/lib/auth'
import { eq, and } from 'drizzle-orm'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (useMemoryDb) {
      const types = memoryDb.getActivityTypesByTeam(session.teamId)
      return NextResponse.json({ activityTypes: types })
    }

    const db = getDb()

    const types = await db
      .select()
      .from(activityTypes)
      .where(eq(activityTypes.teamId, session.teamId))
      .orderBy(activityTypes.sortOrder)

    return NextResponse.json({ activityTypes: types })
  } catch (error) {
    console.error('Error fetching activity types:', error)
    return NextResponse.json({ error: 'Failed to fetch activity types' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.role !== 'manager') {
      return NextResponse.json({ error: 'Manager access required' }, { status: 403 })
    }

    const { name, color, icon } = await request.json()

    if (!name || !color || !icon) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (useMemoryDb) {
      const existing = memoryDb.getActivityTypesByTeam(session.teamId)
      const maxSort = existing.reduce((max, t) => Math.max(max, t.sortOrder), -1)

      const activityType = memoryDb.createActivityType({
        teamId: session.teamId,
        name,
        color,
        icon,
        sortOrder: maxSort + 1,
      })

      return NextResponse.json({ activityType })
    }

    const db = getDb()

    // Get next sort order
    const existing = await db
      .select()
      .from(activityTypes)
      .where(eq(activityTypes.teamId, session.teamId))

    const maxSort = existing.reduce((max, t) => Math.max(max, t.sortOrder), -1)

    const [activityType] = await db.insert(activityTypes).values({
      teamId: session.teamId,
      name,
      color,
      icon,
      sortOrder: maxSort + 1,
    }).returning()

    return NextResponse.json({ activityType })
  } catch (error) {
    console.error('Error creating activity type:', error)
    return NextResponse.json({ error: 'Failed to create activity type' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: 'Missing activity type id' }, { status: 400 })
    }

    // Build update object with only provided fields
    const updateData: Record<string, unknown> = {}
    if (updates.name !== undefined) updateData.name = updates.name
    if (updates.color !== undefined) updateData.color = updates.color
    if (updates.is_active !== undefined) updateData.isActive = updates.is_active
    if (updates.sort_order !== undefined) updateData.sortOrder = updates.sort_order

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    if (useMemoryDb) {
      // Verify the activity type belongs to this team
      const existing = memoryDb.findActivityTypeById(id)
      if (!existing || existing.teamId !== session.teamId) {
        return NextResponse.json({ error: 'Activity type not found' }, { status: 404 })
      }

      const updated = memoryDb.updateActivityType(id, updateData as Partial<Pick<typeof existing, 'name' | 'color' | 'icon' | 'isActive' | 'sortOrder'>>)

      return NextResponse.json({ activityType: updated })
    }

    const db = getDb()

    const [updated] = await db
      .update(activityTypes)
      .set(updateData)
      .where(
        and(
          eq(activityTypes.id, id),
          eq(activityTypes.teamId, session.teamId)
        )
      )
      .returning()

    if (!updated) {
      return NextResponse.json({ error: 'Activity type not found' }, { status: 404 })
    }

    return NextResponse.json({ activityType: updated })
  } catch (error) {
    console.error('Error updating activity type:', error)
    return NextResponse.json({ error: 'Failed to update activity type' }, { status: 500 })
  }
}
