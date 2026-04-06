import { NextRequest, NextResponse } from 'next/server'
import { useMemoryDb } from '@/db'
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
  const formData = await request.formData()
  const name = formData.get('teamName') as string
  const managerName = formData.get('managerName') as string
  const pin = formData.get('pin') as string

  if (!name || !managerName || !pin) {
    return NextResponse.redirect(new URL('/setup?error=missing', request.url))
  }

  if (useMemoryDb) {
    const team = memoryDb.createTeam({ name: name.trim(), pin: hashPin(pin), plainPin: pin })
    const manager = memoryDb.createUser({ teamId: team.id, name: managerName.trim(), role: 'manager' })

    for (const at of DEFAULT_ACTIVITY_TYPES) {
      memoryDb.createActivityType({ teamId: team.id, ...at })
    }

    const cookie = createSessionCookie({
      userId: manager.id, teamId: team.id, role: 'manager',
      userName: managerName.trim(), teamName: name.trim(), dailyGoal: team.dailyGoal,
    })
    const res = NextResponse.redirect(new URL('/dashboard', request.url))
    res.headers.set('Set-Cookie', cookie)
    return res
  }

  return NextResponse.redirect(new URL('/setup?error=nodb', request.url))
}
