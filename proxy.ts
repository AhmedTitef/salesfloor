import { NextRequest, NextResponse } from 'next/server'

const PROTECTED_PAGES = ['/log', '/dashboard', '/settings', '/recap', '/tv', '/contacts', '/org']
const PROTECTED_API = ['/api/activities', '/api/stats', '/api/activity-types', '/api/org']
const SESSION_MAX_AGE = 60 * 60 * 24 * 30 // 30 days
const ROTATION_INTERVAL = 60 * 60 * 24 * 1000 // 24 hours in ms

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const sessionCookie = request.cookies.get('sf_session')

  const isProtectedPage = PROTECTED_PAGES.some((p) => pathname.startsWith(p))
  const isProtectedApi = PROTECTED_API.some((p) => pathname.startsWith(p))

  if (!sessionCookie?.value) {
    if (isProtectedPage) {
      return NextResponse.redirect(new URL('/', request.url))
    }
    if (isProtectedApi) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.next()
  }

  // Session rotation: refresh the cookie if it's older than 24h
  try {
    const session = JSON.parse(decodeURIComponent(sessionCookie.value))
    const issuedAt = session.iat || 0
    const now = Date.now()

    if (now - issuedAt > ROTATION_INTERVAL) {
      session.iat = now
      const response = NextResponse.next()
      response.cookies.set('sf_session', JSON.stringify(session), {
        httpOnly: true,
        path: '/',
        sameSite: 'lax',
        maxAge: SESSION_MAX_AGE,
      })
      return response
    }
  } catch {
    // Invalid session — clear it
    if (isProtectedPage) {
      const response = NextResponse.redirect(new URL('/', request.url))
      response.cookies.delete('sf_session')
      return response
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/log', '/log/:path*', '/dashboard', '/dashboard/:path*', '/settings', '/settings/:path*', '/recap', '/recap/:path*', '/tv', '/tv/:path*', '/contacts', '/contacts/:path*', '/org', '/org/:path*', '/api/activities/:path*', '/api/stats/:path*', '/api/activity-types/:path*', '/api/org/:path*'],
}
