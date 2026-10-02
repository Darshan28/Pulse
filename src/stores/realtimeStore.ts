import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { ConnectionState } from '@/composables/useRealtime'

export const useRealtimeStore = defineStore('realtime', () => {
  const connectionState = ref<ConnectionState>('disconnected')
  function setConnectionState(state: ConnectionState) {
    connectionState.value = state
  }
  return { connectionState, setConnectionState }
})
