/** Allowed relative in-app paths after authentication. Blocks open redirects. */
export const DEFAULT_AUTH_INTENT = '/app/sessions'

const ALLOWED_PREFIXES = ['/app', '/onboarding', '/demo', '/auth'] as const

/**
 * Accept only same-origin relative paths.
 * Rejects protocol-relative (`//evil.com`), absolute URLs, and unknown prefixes.
 */
export function safeAppPath(path: unknown, fallback = DEFAULT_AUTH_INTENT): string {
  if (typeof path !== 'string' || !path) return fallback
  const trimmed = path.trim()
  if (!trimmed.startsWith('/')) return fallback
  if (trimmed.startsWith('//')) return fallback
  if (trimmed.includes('://')) return fallback
  if (trimmed.includes('\\')) return fallback
  const pathname = trimmed.split(/[?#]/)[0] || trimmed
  const allowed = ALLOWED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  )
  if (!allowed && pathname !== '/') return fallback
  return trimmed
}
