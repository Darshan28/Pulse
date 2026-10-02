import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { QuestionDTO } from '@shared/types'

export const useQuestionStore = defineStore('question', () => {
  const active = ref<QuestionDTO | null>(null)
  function setActive(q: QuestionDTO | null) {
    active.value = q
  }
  return { active, setActive }
})
