import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useSessionStore } from '@/stores/sessionStore'

export function useResults() {
  const store = useSessionStore()
  const { results } = storeToRefs(store)
  const responseCount = computed(() => results.value?.responseCount ?? 0)
  return { results, responseCount, setResults: store.setResults }
}
