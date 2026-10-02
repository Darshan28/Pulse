import type { LiveResults, LiveState, QuestionDTO, SessionDTO } from '@shared/types'
import type { UserProfileDTO } from '@shared/onboarding'
import { getSupabaseBrowserClient, isSupabaseConfigured } from '@/lib/supabase'

const PARTICIPANT_KEY = 'pulse_participant_token'
export const DEV_ACCESS_TOKEN_KEY = 'pulse_dev_access_token'

export function getDevAccessToken() {
  try {
    return localStorage.getItem(DEV_ACCESS_TOKEN_KEY)
  } catch {
    return null
  }
}

export function setDevAccessToken(token: string) {
  localStorage.setItem(DEV_ACCESS_TOKEN_KEY, token)
}

export function clearDevAccessToken() {
  try {
    localStorage.removeItem(DEV_ACCESS_TOKEN_KEY)
  } catch {
    /* private mode */
  }
}

export async function getPresenterAccessToken() {
  const devToken = getDevAccessToken()
  if (devToken) return devToken

  if (!isSupabaseConfigured()) return null
  try {
    const { data } = await getSupabaseBrowserClient().auth.getSession()
    return data.session?.access_token ?? null
  } catch {
    return null
  }
}

export function getParticipantToken() {
  return localStorage.getItem(PARTICIPANT_KEY)
}

export function setParticipantToken(token: string) {
  localStorage.setItem(PARTICIPANT_KEY, token)
}

export function clearParticipantToken() {
  localStorage.removeItem(PARTICIPANT_KEY)
}

export class ApiClientError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number,
  ) {
    super(message)
  }
}

async function request<T>(
  path: string,
  init: RequestInit = {},
  options: { auth?: boolean } = {},
): Promise<T> {
  const headers = new Headers(init.headers)
  if (!headers.has('Content-Type') && init.body) {
    headers.set('Content-Type', 'application/json')
  }
  const participant = getParticipantToken()
  if (participant) headers.set('x-pulse-participant', participant)

  if (options.auth !== false) {
    const token = await getPresenterAccessToken()
    if (token) headers.set('Authorization', `Bearer ${token}`)
  }

  const res = await fetch(path, {
    ...init,
    headers,
    credentials: 'include',
  })

  const contentType = res.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) {
    if (!res.ok) throw new ApiClientError('HTTP_ERROR', res.statusText, res.status)
    return undefined as T
  }

  const data = await res.json()
  if (!res.ok) {
    throw new ApiClientError(
      data?.error?.code || 'HTTP_ERROR',
      data?.error?.message || 'Request failed',
      res.status,
    )
  }
  return data as T
}

export const api = {
  devLogin() {
    return request<{ accessToken: string; profile: UserProfileDTO }>(
      '/api/auth/dev-login',
      { method: 'POST' },
      { auth: false },
    )
  },
  me() {
    return request<{ profile: UserProfileDTO }>('/api/me')
  },
  updateMe(body: {
    role?: string | null
    useCases?: string[]
    audienceSize?: string | null
  }) {
    return request<{ profile: UserProfileDTO }>('/api/me', {
      method: 'PATCH',
      body: JSON.stringify(body),
    })
  },
  completeOnboarding(body: { useCases: string[]; audienceSize: string; role: string }) {
    return request<{ profile: UserProfileDTO }>('/api/me/onboarding', {
      method: 'POST',
      body: JSON.stringify(body),
    })
  },
  createSession(title: string, description?: string) {
    return request<{ session: SessionDTO }>('/api/sessions', {
      method: 'POST',
      body: JSON.stringify({ title, description }),
    })
  },
  listSessions() {
    return request<{ sessions: SessionDTO[] }>('/api/sessions')
  },
  getSession(id: string) {
    return request<{ session: SessionDTO }>(`/api/sessions/${id}`)
  },
  openLobby(id: string) {
    return request<{ session: SessionDTO }>(`/api/sessions/${id}/lobby`, { method: 'POST' })
  },
  endSession(id: string) {
    return request<{ session: SessionDTO }>(`/api/sessions/${id}/end`, { method: 'POST' })
  },
  createQuestion(
    sessionId: string,
    body: { type: string; prompt?: string; options?: string[]; config?: Record<string, unknown> },
  ) {
    return request<{ question: QuestionDTO }>(`/api/sessions/${sessionId}/questions`, {
      method: 'POST',
      body: JSON.stringify(body),
    })
  },
  updateQuestion(
    sessionId: string,
    questionId: string,
    body: { prompt?: string; options?: string[]; config?: Record<string, unknown> },
  ) {
    return request<{ question: QuestionDTO }>(`/api/sessions/${sessionId}/questions/${questionId}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    })
  },
  deleteQuestion(sessionId: string, questionId: string) {
    return request<{ ok: boolean }>(`/api/sessions/${sessionId}/questions/${questionId}`, {
      method: 'DELETE',
    })
  },
  reorderQuestions(sessionId: string, orderedIds: string[]) {
    return request<{ questions: QuestionDTO[] }>(`/api/sessions/${sessionId}/questions/reorder`, {
      method: 'PUT',
      body: JSON.stringify({ orderedIds }),
    })
  },
  startQuestion(sessionId: string, questionId: string) {
    return request<{
      session: SessionDTO
      question: QuestionDTO
      results: LiveResults
    }>(`/api/sessions/${sessionId}/questions/${questionId}/start`, { method: 'POST' })
  },
  closeQuestion(sessionId: string, questionId: string) {
    return request<{ question: QuestionDTO }>(
      `/api/sessions/${sessionId}/questions/${questionId}/close`,
      { method: 'POST' },
    )
  },
  reopenQuestion(sessionId: string, questionId: string) {
    return request<{ question: QuestionDTO }>(
      `/api/sessions/${sessionId}/questions/${questionId}/reopen`,
      { method: 'POST' },
    )
  },
  clearResponses(sessionId: string, questionId: string) {
    return request<{ results: LiveResults }>(
      `/api/sessions/${sessionId}/questions/${questionId}/clear`,
      { method: 'POST' },
    )
  },
  questionResults(sessionId: string, questionId: string) {
    return request<{ results: LiveResults }>(
      `/api/sessions/${sessionId}/questions/${questionId}/results`,
    )
  },
  liveState(sessionId: string) {
    return request<{ state: LiveState }>(`/api/sessions/${sessionId}/live-state`)
  },
  qr(sessionId: string) {
    return request<{ joinUrl: string; svg: string; code: string }>(
      `/api/sessions/${sessionId}/qr`,
    )
  },
  join(code: string, displayName?: string) {
    return request<{
      token: string
      participant: { id: string; sessionId: string; displayName: string | null; joinedAt: string }
      session: SessionDTO
    }>(
      '/api/join',
      {
        method: 'POST',
        body: JSON.stringify({ code, displayName }),
      },
      { auth: false },
    )
  },
  submitResponse(questionId: string, value: unknown) {
    return request<{ ok: boolean }>(
      '/api/responses',
      {
        method: 'POST',
        body: JSON.stringify({ questionId, value }),
      },
      { auth: false },
    )
  },
  async exportCsv(sessionId: string) {
    const headers = new Headers()
    const token = await getPresenterAccessToken()
    if (token) headers.set('Authorization', `Bearer ${token}`)
    const res = await fetch(`/api/sessions/${sessionId}/export.csv`, {
      headers,
      credentials: 'include',
    })
    if (!res.ok) {
      throw new ApiClientError('HTTP_ERROR', 'Could not export CSV', res.status)
    }
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `pulse-${sessionId}.csv`
    a.click()
    URL.revokeObjectURL(url)
  },
}
