import { NextRequest, NextResponse } from 'next/server'
import { useMemoryDb } from '@/db'
import { memoryDb } from '@/db/memory'
import { verifyPin, createSessionCookie } from '@/lib/auth'
import { checkRateLimit } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const { allowed } = checkRateLimit(`join:${ip}`)
  if (!allowed) {
    return NextResponse.redirect(new URL('/join?error=ratelimit', request.url))
  }

  const formData = await request.formData()
  const name = formData.get('name') as string
  const pin = formData.get('pin') as string

  if (!name || !pin) {
    return NextResponse.redirect(new URL('/join?error=missing', request.url))
  }

  if (useMemoryDb) {
    const allTeams = memoryDb.getAllTeams()
    const team = allTeams.find((t) => verifyPin(pin, t.pin))

    if (!team) {
      return NextResponse.redirect(new URL('/join?error=invalid', request.url))
    }

    const user = memoryDb.createUser({ teamId: team.id, name: name.trim(), role: 'rep' })
    const cookie = createSessionCookie({
      userId: user.id, teamId: team.id, role: 'rep',
      userName: name.trim(), teamName: team.name, dailyGoal: team.dailyGoal,
    })
    const res = NextResponse.redirect(new URL('/log', request.url))
    res.headers.set('Set-Cookie', cookie)
    return res
  }

  return NextResponse.redirect(new URL('/join?error=nodb', request.url))
}
