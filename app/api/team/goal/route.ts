import { NextRequest, NextResponse } from 'next/server'
import { useMemoryDb, getDb } from '@/db'
import { memoryDb } from '@/db/memory'
import * as schema from '@/db/schema'
import { getSession } from '@/lib/auth'
import { eq } from 'drizzle-orm'

export async function PATCH(request: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'manager') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()

  if (typeof body.dailyGoal === 'number' && body.dailyGoal >= 1 && body.dailyGoal <= 999) {
    if (useMemoryDb) {
      memoryDb.updateTeam(session.teamId, { dailyGoal: body.dailyGoal })
    } else {
      // dailyGoal isn't in the Drizzle schema (it's in the session cookie)
      // We update the session cookie directly
    }

    // Update the session cookie so the goal reflects immediately
    const updatedSession = { ...session, dailyGoal: body.dailyGoal, iat: Date.now() }
    const res = NextResponse.json({ success: true, dailyGoal: body.dailyGoal })
    res.cookies.set('sf_session', JSON.stringify(updatedSession), {
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
    })
    return res
  }

  if (typeof body.webhookUrl === 'string' && useMemoryDb) {
    memoryDb.updateTeam(session.teamId, { webhookUrl: body.webhookUrl.trim() || null })
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'No valid fields' }, { status: 400 })
}
