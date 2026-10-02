import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { LiveResults, QuestionDTO, SessionDTO } from '@shared/types'
import { api } from '@/services/api'
import { track } from '@/analytics'

export const useSessionStore = defineStore('session', () => {
  const sessions = ref<SessionDTO[]>([])
  const current = ref<SessionDTO | null>(null)
  const results = ref<LiveResults | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const participantCount = ref(0)

  async function fetchSessions() {
    loading.value = true
    error.value = null
    try {
      const res = await api.listSessions()
      sessions.value = res.sessions
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to load sessions'
    } finally {
      loading.value = false
    }
  }

  async function create(title: string, description?: string) {
    const res = await api.createSession(title, description)
    current.value = res.session
    track('session_created', { sessionId: res.session.id })
    return res.session
  }

  async function load(id: string) {
    loading.value = true
    error.value = null
    try {
      const res = await api.getSession(id)
      current.value = res.session
      participantCount.value = res.session.participantCount
      return res.session
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to load session'
      throw e
    } finally {
      loading.value = false
    }
  }

  function setSession(session: SessionDTO) {
    current.value = session
    participantCount.value = session.participantCount
  }

  function setActiveQuestion(question: QuestionDTO | null) {
    if (!current.value) return
    current.value = {
      ...current.value,
      activeQuestionId: question?.id ?? null,
      questions: current.value.questions?.map((q) =>
        q.id === question?.id ? question : q,
      ),
    }
  }

  function setResults(next: LiveResults | null) {
    results.value = next
  }

  function upsertQuestion(question: QuestionDTO) {
    if (!current.value) return
    const list = current.value.questions ? [...current.value.questions] : []
    const idx = list.findIndex((q) => q.id === question.id)
    if (idx >= 0) list[idx] = question
    else list.push(question)
    current.value = {
      ...current.value,
      questions: list.sort((a, b) => a.order - b.order),
      questionCount: list.length,
    }
  }

  function removeQuestion(questionId: string) {
    if (!current.value?.questions) return
    const list = current.value.questions.filter((q) => q.id !== questionId)
    current.value = { ...current.value, questions: list, questionCount: list.length }
  }

  function setQuestionOrder(questions: QuestionDTO[]) {
    if (!current.value) return
    current.value = {
      ...current.value,
      questions: [...questions].sort((a, b) => a.order - b.order),
      questionCount: questions.length,
    }
  }

  return {
    sessions,
    current,
    results,
    loading,
    error,
    participantCount,
    fetchSessions,
    create,
    load,
    setSession,
    setActiveQuestion,
    setResults,
    upsertQuestion,
    removeQuestion,
    setQuestionOrder,
  }
})
