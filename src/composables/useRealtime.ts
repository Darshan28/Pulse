import { onUnmounted, ref } from 'vue'
import type { RealtimeEvent } from '@shared/types'
import { api, getParticipantToken, getPresenterAccessToken } from '@/services/api'

export type ConnectionState = 'connected' | 'connecting' | 'reconnecting' | 'disconnected'

export function useRealtime(sessionId: () => string | null, onEvent: (e: RealtimeEvent) => void) {
  const connectionState = ref<ConnectionState>('disconnected')
  let source: EventSource | null = null
  let pollTimer: ReturnType<typeof setInterval> | null = null
  let stopped = false

  function stopPoll() {
    if (pollTimer) {
      clearInterval(pollTimer)
      pollTimer = null
    }
  }

  function startPoll() {
    stopPoll()
    const id = sessionId()
    if (!id) return
    pollTimer = setInterval(() => {
      void api.liveState(id).then((res) => {
        onEvent({
          type: 'SESSION_UPDATED',
          sessionId: id,
          ts: Date.now(),
          payload: { liveState: res.state },
        })
      })
    }, 2500)
  }

  async function buildSubscribeUrl(id: string) {
    const params = new URLSearchParams({ sessionId: id })
    // EventSource cannot set Authorization headers — pass credentials as query params.
    const participant = getParticipantToken()
    if (participant) params.set('participant', participant)
    const access = await getPresenterAccessToken()
    if (access) params.set('access_token', access)
    return `/api/realtime/subscribe?${params.toString()}`
  }

  async function connect() {
    const id = sessionId()
    if (!id || stopped) return
    connectionState.value = connectionState.value === 'disconnected' ? 'connecting' : 'reconnecting'
    source?.close()
    const url = await buildSubscribeUrl(id)
    source = new EventSource(url)

    source.addEventListener('connected', () => {
      connectionState.value = 'connected'
      stopPoll()
    })

    const types = [
      'SESSION_UPDATED',
      'PARTICIPANT_JOINED',
      'PARTICIPANT_LEFT',
      'QUESTION_STARTED',
      'QUESTION_UPDATED',
      'QUESTION_CLOSED',
      'RESPONSE_SUBMITTED',
      'RESULTS_UPDATED',
      'SESSION_ENDED',
    ]
    for (const type of types) {
      source.addEventListener(type, (ev) => {
        try {
          const data = JSON.parse((ev as MessageEvent).data) as RealtimeEvent
          onEvent(data)
        } catch {
          /* ignore */
        }
      })
    }

    source.onerror = () => {
      connectionState.value = 'reconnecting'
      source?.close()
      source = null
      startPoll()
      if (!stopped) {
        setTimeout(() => {
          void connect()
        }, 2000)
      }
    }
  }

  function disconnect() {
    stopped = true
    source?.close()
    source = null
    stopPoll()
    connectionState.value = 'disconnected'
  }

  void connect()
  onUnmounted(disconnect)

  return {
    connectionState,
    reconnect: () => {
      stopped = false
      void connect()
    },
    disconnect,
  }
}
