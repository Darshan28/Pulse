import { Redis } from '@upstash/redis'
import type { RealtimeEvent } from '../../shared/types.js'

type Listener = (event: RealtimeEvent) => void

export interface RealtimeBus {
  publish(event: RealtimeEvent): Promise<void>
  subscribe(sessionId: string, listener: Listener): () => void
}

class MemoryBus implements RealtimeBus {
  private listeners = new Map<string, Set<Listener>>()

  async publish(event: RealtimeEvent) {
    const set = this.listeners.get(event.sessionId)
    if (!set) return
    for (const listener of set) listener(event)
  }

  subscribe(sessionId: string, listener: Listener) {
    let set = this.listeners.get(sessionId)
    if (!set) {
      set = new Set()
      this.listeners.set(sessionId, set)
    }
    set.add(listener)
    return () => {
      set?.delete(listener)
      if (set && set.size === 0) this.listeners.delete(sessionId)
    }
  }
}

class UpstashBus implements RealtimeBus {
  private redis: Redis
  private local = new MemoryBus()
  private timers = new Map<string, ReturnType<typeof setInterval>>()

  constructor(url: string, token: string) {
    this.redis = new Redis({ url, token })
  }

  private channel(sessionId: string) {
    return `pulse:session:${sessionId}`
  }

  async publish(event: RealtimeEvent) {
    const key = this.channel(event.sessionId)
    await this.redis.lpush(key, JSON.stringify(event))
    await this.redis.ltrim(key, 0, 99)
    await this.redis.publish(key, JSON.stringify(event))
    await this.local.publish(event)
  }

  subscribe(sessionId: string, listener: Listener) {
    const unsub = this.local.subscribe(sessionId, listener)
    const key = this.channel(sessionId)

    if (!this.timers.has(sessionId)) {
      let lastRaw = ''
      const timer = setInterval(() => {
        void (async () => {
          try {
            const latest = await this.redis.lindex(key, 0)
            if (!latest || latest === lastRaw) return
            lastRaw = typeof latest === 'string' ? latest : JSON.stringify(latest)
            const event =
              typeof latest === 'string'
                ? (JSON.parse(latest) as RealtimeEvent)
                : (latest as RealtimeEvent)
            await this.local.publish(event)
          } catch (err) {
            console.error('[realtime] poll error', err)
          }
        })()
      }, 800)
      this.timers.set(sessionId, timer)
    }

    return () => {
      unsub()
      const still = (this.local as unknown as { listeners: Map<string, Set<Listener>> }).listeners?.get(sessionId)
      if (!still || still.size === 0) {
        const t = this.timers.get(sessionId)
        if (t) clearInterval(t)
        this.timers.delete(sessionId)
      }
    }
  }
}

let bus: RealtimeBus | null = null

export function getRealtimeBus(): RealtimeBus {
  if (bus) return bus
  const url = process.env.REDIS_URL?.trim()
  const token = process.env.REDIS_TOKEN?.trim()
  const isProd = process.env.VERCEL === '1' || process.env.NODE_ENV === 'production'
  if (url && token) {
    bus = new UpstashBus(url, token)
    console.log('[pulse] Realtime: Upstash Redis')
  } else {
    if (isProd) {
      throw new Error(
        '[pulse] REDIS_URL and REDIS_TOKEN are required on Vercel/production for multi-instance realtime.',
      )
    }
    bus = new MemoryBus()
    console.log('[pulse] Realtime: in-process memory bus')
  }
  return bus
}

export function makeEvent(
  partial: Omit<RealtimeEvent, 'ts'> & { ts?: number },
): RealtimeEvent {
  return { ...partial, ts: partial.ts ?? Date.now() }
}
