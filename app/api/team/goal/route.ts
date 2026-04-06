import { NextRequest, NextResponse } from 'next/server'
import { useMemoryDb } from '@/db'
import { memoryDb } from '@/db/memory'
import { getSession } from '@/lib/auth'

export async function PATCH(request: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'manager') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const updates: Record<string, unknown> = {}

  if (typeof body.dailyGoal === 'number' && body.dailyGoal >= 1 && body.dailyGoal <= 999) {
    updates.dailyGoal = body.dailyGoal
  }
  if (typeof body.webhookUrl === 'string') {
    updates.webhookUrl = body.webhookUrl.trim() || null
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields' }, { status: 400 })
  }

  if (useMemoryDb) {
    const team = memoryDb.updateTeam(session.teamId, updates as { dailyGoal?: number; webhookUrl?: string | null })
    return NextResponse.json({ team })
  }

  return NextResponse.json({ error: 'No database configured' }, { status: 500 })
}
