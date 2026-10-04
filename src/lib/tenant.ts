export const ROOT_DOMAIN = (
  process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'stratum.mn'
).toLowerCase()

const RESERVED_SUBDOMAINS = ['www', 'api', 'admin']

export function getCurrentSubdomain(): string | null {
  if (typeof window === 'undefined') return null

  const hostname = window.location.hostname.toLowerCase()
  const suffix = `.${ROOT_DOMAIN}`

  if (!hostname.endsWith(suffix)) return null

  const sub = hostname.slice(0, -suffix.length)

  if (!sub || sub.includes('.') || RESERVED_SUBDOMAINS.includes(sub)) {
    return null
  }

  return sub
}

export function getExpectedHostname(user: {
  role?: string
  organization?: { subdomain?: string | null } | null
}): string | null {
  if (user.role === 'superadmin') return ROOT_DOMAIN

  const sub = user.organization?.subdomain?.trim().toLowerCase()
  return sub ? `${sub}.${ROOT_DOMAIN}` : null
}

export function buildUrlForHostname(hostname: string, path?: string): string {
  const { protocol, port, pathname, search } = window.location
  return `${protocol}//${hostname}${port ? `:${port}` : ''}${path ?? pathname + search}`
}