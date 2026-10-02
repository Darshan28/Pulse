import { AppError } from './errors.js'

export function getAllowedCorsOrigins(): string[] {
  const origins = new Set<string>()

  const appUrl = process.env.VITE_APP_URL?.trim().replace(/\/$/, '')
  if (appUrl) origins.add(appUrl)

  const vercelUrl = process.env.VERCEL_URL?.trim().replace(/\/$/, '')
  if (vercelUrl) {
    origins.add(vercelUrl.startsWith('http') ? vercelUrl : `https://${vercelUrl}`)
  }

  const extra = process.env.CORS_ORIGINS?.split(',') ?? []
  for (const item of extra) {
    const trimmed = item.trim().replace(/\/$/, '')
    if (trimmed) origins.add(trimmed)
  }

  const isProd = process.env.VERCEL === '1' || process.env.NODE_ENV === 'production'
  if (!isProd) {
    origins.add('http://localhost:5173')
    origins.add('http://127.0.0.1:5173')
    origins.add('http://localhost:3001')
    origins.add('http://127.0.0.1:3001')
  }

  return [...origins]
}

export function resolveCorsOrigin(requestOrigin: string | undefined): string | null {
  if (!requestOrigin) return null
  const allowed = getAllowedCorsOrigins()
  if (allowed.includes(requestOrigin)) return requestOrigin
  return null
}

export function getPublicAppUrl(): string {
  const configured = process.env.VITE_APP_URL?.trim().replace(/\/$/, '')
  const isProd = process.env.VERCEL === '1' || process.env.NODE_ENV === 'production'
  if (configured) return configured
  if (isProd) {
    throw new AppError(
      'CONFIG_ERROR',
      'VITE_APP_URL must be set in production for join links and QR codes.',
      500,
    )
  }
  return 'http://localhost:5173'
}
