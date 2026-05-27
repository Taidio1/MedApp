const FALLBACK_LOCAL_ORIGIN = 'http://localhost:3000'

function normalizeOrigin(value: string | undefined): string | null {
  if (!value) return null

  const withProtocol = value.startsWith('http://') || value.startsWith('https://')
    ? value
    : `https://${value}`

  try {
    return new URL(withProtocol).origin
  } catch {
    return null
  }
}

function getConfiguredPublicOrigin(): string | null {
  return (
    normalizeOrigin(process.env.NEXT_PUBLIC_SITE_URL) ??
    normalizeOrigin(process.env.NEXT_PUBLIC_VERCEL_URL)
  )
}

export function getBrowserPublicOrigin(): string {
  return getConfiguredPublicOrigin() ?? window.location.origin
}

export function getRequestPublicOrigin(request: Request): string {
  const configuredOrigin = getConfiguredPublicOrigin()
  if (configuredOrigin) return configuredOrigin

  const forwardedHost = request.headers.get('x-forwarded-host')?.split(',')[0]?.trim()
  const host = forwardedHost || request.headers.get('host')

  if (host && !host.startsWith('0.0.0.0') && !host.startsWith('localhost')) {
    const forwardedProto = request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim()
    return `${forwardedProto || 'https'}://${host}`
  }

  return FALLBACK_LOCAL_ORIGIN
}
