import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getParticipantToken } from '@/services/api'

export const useParticipantStore = defineStore('participant', () => {
  const token = ref<string | null>(getParticipantToken())
  const displayName = ref<string | null>(null)

  function setToken(next: string) {
    token.value = next
  }

  function setDisplayName(name: string | null) {
    displayName.value = name
  }

  return { token, displayName, setToken, setDisplayName }
})
