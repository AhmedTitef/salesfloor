import { NextResponse } from 'next/server'
import { getDb, useMemoryDb } from '@/db'
import { users, teams } from '@/db/schema'
import { memoryDb } from '@/db/memory'
import { getSession, clearSession } from '@/lib/auth'
import { eq } from 'drizzle-orm'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ session: null })
    }

    if (useMemoryDb) {
      const user = memoryDb.findUserById(session.userId)
      const team = memoryDb.findTeamById(session.teamId)

      if (!user || !team) {
        return NextResponse.json({ session: null })
      }

      return NextResponse.json({
        session: {
          userId: user.id,
          userName: user.name,
          role: user.role,
          teamId: team.id,
          teamName: team.name,
          teamPin: team.plainPin,
          dailyGoal: team.dailyGoal,
          orgId: team.orgId || undefined,
          orgRole: session.orgRole || undefined,
        },
      })
    }

    const db = getDb()

    const [user] = await db
      .select({ id: users.id, name: users.name, role: users.role })
      .from(users)
      .where(eq(users.id, session.userId))
      .limit(1)

    const [team] = await db
      .select({ id: teams.id, name: teams.name, pin: teams.pin })
      .from(teams)
      .where(eq(teams.id, session.teamId))
      .limit(1)

    if (!user || !team) {
      return NextResponse.json({ session: null })
    }

    return NextResponse.json({
      session: {
        userId: user.id,
        userName: user.name,
        role: user.role,
        teamId: team.id,
        teamName: team.name,
        teamPin: team.pin,
      },
    })
  } catch (error) {
    console.error('Error fetching session:', error)
    return NextResponse.json({ session: null })
  }
}

export async function DELETE() {
  try {
    await clearSession()
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error clearing session:', error)
    return NextResponse.json({ error: 'Failed to clear session' }, { status: 500 })
  }
}
