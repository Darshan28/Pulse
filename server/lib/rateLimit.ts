const hits = new Map<string, { count: number; reset: number }>()

export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now()
  const row = hits.get(key)
  if (!row || row.reset < now) {
    hits.set(key, { count: 1, reset: now + windowMs })
    return true
  }
  if (row.count >= limit) return false
  row.count += 1
  return true
}
