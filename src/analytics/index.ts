type Props = Record<string, unknown>

interface AnalyticsProvider {
  track(event: string, props?: Props): void
  identify?(id: string, props?: Props): void
}

class NoopAnalytics implements AnalyticsProvider {
  track() {}
  identify() {}
}

class PostHogAnalytics implements AnalyticsProvider {
  constructor(private key: string, private host: string) {
    void this.init()
  }

  private async init() {
    try {
      const script = document.createElement('script')
      script.src = 'https://cdn.jsdelivr.net/npm/posthog-js@1/dist/array.js'
      script.async = true
      document.head.appendChild(script)
      script.onload = () => {
        const ph = (window as unknown as { posthog?: { init: (k: string, o: Record<string, string>) => void } }).posthog
        ph?.init(this.key, { api_host: this.host, persistence: 'localStorage' })
      }
    } catch {
      console.warn('[analytics] PostHog failed to load')
    }
  }

  track(event: string, props?: Props) {
    const ph = (window as unknown as { posthog?: { capture: (e: string, p?: Props) => void } }).posthog
    ph?.capture(event, props)
  }

  identify(id: string, props?: Props) {
    const ph = (window as unknown as { posthog?: { identify: (e: string, p?: Props) => void } }).posthog
    ph?.identify(id, props)
  }
}

let client: AnalyticsProvider | null = null

export function getAnalytics(): AnalyticsProvider {
  if (client) return client
  const key = import.meta.env.VITE_POSTHOG_KEY
  const host = import.meta.env.VITE_POSTHOG_HOST || 'https://app.posthog.com'
  client = key ? new PostHogAnalytics(key, host) : new NoopAnalytics()
  return client
}

export function track(event: string, props?: Props) {
  getAnalytics().track(event, props)
}
