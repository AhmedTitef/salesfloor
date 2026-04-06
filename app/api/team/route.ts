import { NextRequest, NextResponse } from 'next/server'
import { getDb, useMemoryDb } from '@/db'
import { teams, users, activityTypes } from '@/db/schema'
import { memoryDb } from '@/db/memory'
import { hashPin, createSessionCookie } from '@/lib/auth'

const DEFAULT_ACTIVITY_TYPES = [
  { name: 'Call', color: '#3B82F6', icon: 'phone', sortOrder: 0 },
  { name: 'Callback Booked', color: '#10B981', icon: 'calendar-check', sortOrder: 1 },
  { name: 'No Book', color: '#EF4444', icon: 'x-circle', sortOrder: 2 },
  { name: 'Raffle Sign-up', color: '#F59E0B', icon: 'ticket', sortOrder: 3 },
  { name: 'Inspection Booked', color: '#8B5CF6', icon: 'home', sortOrder: 4 },
]

export async function POST(request: NextRequest) {
  try {
    const { name, pin, managerName } = await request.json()

    if (!name || !pin || !managerName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (useMemoryDb) {
      const team = memoryDb.createTeam({ name, pin: hashPin(pin), plainPin: pin })
      const manager = memoryDb.createUser({ teamId: team.id, name: managerName, role: 'manager' })

      for (const at of DEFAULT_ACTIVITY_TYPES) {
        memoryDb.createActivityType({ teamId: team.id, ...at })
      }

      const cookie = createSessionCookie({
        userId: manager.id, teamId: team.id, role: 'manager',
        userName: managerName, teamName: name, dailyGoal: team.dailyGoal,
      })
      const res = NextResponse.json({ team, user: manager })
      res.headers.set('Set-Cookie', cookie)
      return res
    }

    const db = getDb()

    const [team] = await db.insert(teams).values({
      name,
      pin: hashPin(pin),
    }).returning()

    const [manager] = await db.insert(users).values({
      teamId: team.id,
      name: managerName,
      role: 'manager',
    }).returning()

    await db.insert(activityTypes).values(
      DEFAULT_ACTIVITY_TYPES.map((at) => ({
        teamId: team.id,
        name: at.name,
        color: at.color,
        icon: at.icon,
        sortOrder: at.sortOrder,
      }))
    )

    const cookie = createSessionCookie({
      userId: manager.id, teamId: team.id, role: 'manager',
      userName: managerName, teamName: name, dailyGoal: 50,
    })
    const res = NextResponse.json({ team, user: manager })
    res.headers.set('Set-Cookie', cookie)
    return res
  } catch (error) {
    console.error('Error creating team:', error)
    return NextResponse.json({ error: 'Failed to create team' }, { status: 500 })
  }
}
