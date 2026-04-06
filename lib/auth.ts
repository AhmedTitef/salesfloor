import { cookies } from 'next/headers'
import crypto from 'crypto'

const COOKIE_NAME = 'sf_session'
const MAX_AGE = 60 * 60 * 24 * 30 // 30 days

export interface Session {
  userId: string
  teamId: string
  role: string
  userName: string
  teamName: string
  dailyGoal: number
  orgId?: string
  orgRole?: 'org_admin' | 'org_viewer'
}

export function hashPin(pin: string): string {
  return crypto.createHash('sha256').update(pin).digest('hex')
}

export function verifyPin(pin: string, hash: string): boolean {
  return hashPin(pin) === hash
}

export async function createSession(data: Session) {
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, JSON.stringify({ ...data, iat: Date.now() }), {
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
    maxAge: MAX_AGE,
  })
}

export function createSessionCookie(data: Session): string {
  const value = encodeURIComponent(JSON.stringify({ ...data, iat: Date.now() }))
  return `${COOKIE_NAME}=${value}; Path=/; Max-Age=${MAX_AGE}; HttpOnly; SameSite=Lax`
}

export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies()
  const cookie = cookieStore.get(COOKIE_NAME)
  if (!cookie?.value) return null
  try {
    return JSON.parse(cookie.value) as Session
  } catch {
    return null
  }
}

export async function clearSession() {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}
