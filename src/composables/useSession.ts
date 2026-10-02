import { storeToRefs } from 'pinia'
import { useSessionStore } from '@/stores/sessionStore'

export function useSession() {
  const store = useSessionStore()
  return {
    ...storeToRefs(store),
    fetchSessions: store.fetchSessions,
    create: store.create,
    load: store.load,
    setSession: store.setSession,
  }
}
