import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PUBLIC_PREFIXES = ['/login', '/auth/', '/api/', '/_next/', '/favicon']

function isPublic(pathname: string): boolean {
  return PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))
}

function hasSupabaseSession(request: NextRequest): boolean {
  return request.cookies.getAll().some(
    (c) => c.name.startsWith('sb-') && c.name.includes('-auth-token'),
  )
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (isPublic(pathname)) return NextResponse.next()

  if (!hasSupabaseSession(request)) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all routes except Next.js static files and files with extensions
     * (images, fonts, .glb models, etc.)
     */
    '/((?!_next/static|_next/image|.*\\..*).*)',
  ],
}
