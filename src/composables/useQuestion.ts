import { storeToRefs } from 'pinia'
import { useQuestionStore } from '@/stores/questionStore'

export function useQuestion() {
  const store = useQuestionStore()
  return { ...storeToRefs(store), setActive: store.setActive }
}
