import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/auth/server'
import { getRequestPublicOrigin } from '@/lib/site-url'

function getSafeRedirectPath(value: string | null): string {
  if (!value || !value.startsWith('/') || value.startsWith('//')) {
    return '/'
  }

  return value
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const publicOrigin = getRequestPublicOrigin(request)
  const code = requestUrl.searchParams.get('code')
  const next = getSafeRedirectPath(requestUrl.searchParams.get('next'))

  if (code) {
    const supabase = await createSupabaseServerClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      return NextResponse.redirect(new URL(next, publicOrigin))
    }
  }

  return NextResponse.redirect(new URL('/login?error=oauth', publicOrigin))
}
