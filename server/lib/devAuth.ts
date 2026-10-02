import { createHmac, timingSafeEqual } from 'node:crypto'
import type { Context } from 'hono'
import { AppError } from './errors.js'

export const DEV_AUTH_USER_ID = 'dev-local-user'
export const DEV_AUTH_EMAIL = 'dev@localhost'
const DEV_TOKEN_PREFIX = 'pulse_dev.'

const LOCAL_ORIGINS = new Set(['http://localhost:5173', 'http://127.0.0.1:5173'])

function isProductionRuntime() {
  return process.env.VERCEL === '1' || process.env.NODE_ENV === 'production'
}

/** Dev login / token acceptance is never available in production or on Vercel. */
export function isDevAuthAllowed() {
  return !isProductionRuntime()
}

function getDevAuthSecret() {
  if (isProductionRuntime()) {
    throw new AppError('FORBIDDEN', 'Dev auth is not available.', 403)
  }
  return process.env.DEV_AUTH_SECRET?.trim() || 'pulse-local-dev-auth-secret'
}

function b64url(input: Buffer | string) {
  const buf = typeof input === 'string' ? Buffer.from(input, 'utf8') : input
  return buf.toString('base64url')
}

function signPayload(payloadB64: string) {
  return createHmac('sha256', getDevAuthSecret()).update(payloadB64).digest('base64url')
}

export function isDevAccessToken(token: string) {
  return token.startsWith(DEV_TOKEN_PREFIX)
}

export function mintDevAccessToken() {
  if (!isDevAuthAllowed()) {
    throw new AppError('FORBIDDEN', 'Dev auth is not available.', 403)
  }
  const payload = b64url(
    JSON.stringify({
      sub: DEV_AUTH_USER_ID,
      email: DEV_AUTH_EMAIL,
      iat: Math.floor(Date.now() / 1000),
    }),
  )
  const sig = signPayload(payload)
  return `${DEV_TOKEN_PREFIX}${payload}.${sig}`
}

export function verifyDevAccessToken(token: string): { authUserId: string; email: string } | null {
  if (!isDevAuthAllowed() || !isDevAccessToken(token)) return null
  const body = token.slice(DEV_TOKEN_PREFIX.length)
  const lastDot = body.lastIndexOf('.')
  if (lastDot <= 0) return null
  const payloadB64 = body.slice(0, lastDot)
  const sig = body.slice(lastDot + 1)
  if (!payloadB64 || !sig) return null

  const expected = signPayload(payloadB64)
  const sigBuf = Buffer.from(sig)
  const expectedBuf = Buffer.from(expected)
  if (sigBuf.length !== expectedBuf.length || !timingSafeEqual(sigBuf, expectedBuf)) {
    return null
  }

  try {
    const parsed = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8')) as {
      sub?: string
      email?: string
    }
    if (parsed.sub !== DEV_AUTH_USER_ID) return null
    return { authUserId: DEV_AUTH_USER_ID, email: parsed.email || DEV_AUTH_EMAIL }
  } catch {
    return null
  }
}

/** Hard gate for POST /api/auth/dev-login — non-prod + localhost Vite origin only. */
export function assertDevLoginRequest(c: Context) {
  if (!isDevAuthAllowed()) {
    throw new AppError('FORBIDDEN', 'Dev login is not available in this environment.', 403)
  }
  const origin = c.req.header('origin') || c.req.header('Origin') || ''
  if (!LOCAL_ORIGINS.has(origin)) {
    throw new AppError('FORBIDDEN', 'Dev login is only allowed from localhost.', 403)
  }
}
