import { storeToRefs } from 'pinia'
import { useParticipantStore } from '@/stores/participantStore'

export function useParticipant() {
  const store = useParticipantStore()
  return {
    ...storeToRefs(store),
    setToken: store.setToken,
    setDisplayName: store.setDisplayName,
  }
}
