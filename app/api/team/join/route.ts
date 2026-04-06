import { NextRequest, NextResponse } from 'next/server'
import { getDb, useMemoryDb } from '@/db'
import { teams, users } from '@/db/schema'
import { memoryDb } from '@/db/memory'
import { verifyPin, createSessionCookie } from '@/lib/auth'
import { checkRateLimit } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    const { allowed, retryAfterMs } = checkRateLimit(`join:${ip}`)
    if (!allowed) {
      return NextResponse.json(
        { error: 'Too many attempts. Try again shortly.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(retryAfterMs / 1000)) } }
      )
    }

    const { name, pin, email } = await request.json()

    if (!name || !pin) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (useMemoryDb) {
      const allTeams = memoryDb.getAllTeams()
      const team = allTeams.find((t) => verifyPin(pin, t.pin))

      if (!team) {
        return NextResponse.json({ error: 'Invalid PIN' }, { status: 401 })
      }

      const user = memoryDb.createUser({ teamId: team.id, name, email: email?.trim() || null, role: 'rep' })
      const cookie = createSessionCookie({
        userId: user.id, teamId: team.id, role: 'rep',
        userName: name, teamName: team.name, dailyGoal: team.dailyGoal,
      })
      const res = NextResponse.json({ team, user })
      res.headers.set('Set-Cookie', cookie)
      return res
    }

    const db = getDb()

    const allTeams = await db.select().from(teams)
    const team = allTeams.find((t) => verifyPin(pin, t.pin))

    if (!team) {
      return NextResponse.json({ error: 'Invalid PIN' }, { status: 401 })
    }

    const [user] = await db.insert(users).values({
      teamId: team.id,
      name,
      role: 'rep',
    }).returning()

    const cookie = createSessionCookie({
      userId: user.id, teamId: team.id, role: 'rep',
      userName: name, teamName: team.name, dailyGoal: 50,
    })
    const res = NextResponse.json({ team, user })
    res.headers.set('Set-Cookie', cookie)
    return res
  } catch (error) {
    console.error('Error joining team:', error)
    return NextResponse.json({ error: 'Failed to join team' }, { status: 500 })
  }
}
