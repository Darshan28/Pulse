import { nanoid } from 'nanoid'
import {
  MAX_PARTICIPANTS_DEFAULT,
  type QuestionDTO,
  type SessionDTO,
} from '../../shared/types.js'
import { AppError } from '../lib/errors.js'
import { createJoinCode } from '../lib/joinCode.js'
import { assertSessionOwned } from '../lib/sessionAccess.js'
import { getStore } from '../store/index.js'
import type { QuestionRecord, SessionRecord } from '../store/types.js'
import { getRealtimeBus, makeEvent } from '../realtime/bus.js'
import { getProfileForUser } from './profileService.js'

async function toQuestionDTO(q: QuestionRecord): Promise<QuestionDTO> {
  const store = getStore()
  const options = await store.listOptions(q.id)
  return {
    id: q.id,
    sessionId: q.sessionId,
    type: q.type,
    prompt: q.prompt,
    config: q.config,
    order: q.order,
    status: q.status,
    options: options.map((o) => ({ id: o.id, label: o.label, order: o.order })),
  }
}

export async function toSessionDTO(session: SessionRecord, includeQuestions = false): Promise<SessionDTO> {
  const store = getStore()
  const [participantCount, questions] = await Promise.all([
    store.countActiveParticipants(session.id),
    store.listQuestions(session.id),
  ])
  const dto: SessionDTO = {
    id: session.id,
    title: session.title,
    description: session.description,
    joinCode: session.joinCode,
    status: session.status,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
    startedAt: session.startedAt,
    endedAt: session.endedAt,
    createdById: session.createdById,
    settings: session.settings,
    activeQuestionId: session.activeQuestionId,
    participantCount,
    questionCount: questions.length,
  }
  if (includeQuestions) {
    dto.questions = await Promise.all(questions.map(toQuestionDTO))
  }
  return dto
}

export async function ensurePresenter(userId: string | null) {
  if (!userId) throw new AppError('UNAUTHORIZED', 'Presenter authentication required.', 401)
  return getProfileForUser(userId)
}

async function uniqueJoinCode() {
  const store = getStore()
  for (let i = 0; i < 20; i++) {
    const code = createJoinCode()
    const existing = await store.getSessionByJoinCode(code)
    if (!existing) return code
  }
  throw new AppError('JOIN_CODE_FAILED', 'Could not generate a join code. Try again.')
}

export async function createSession(userId: string, title: string, description?: string) {
  const store = getStore()
  const joinCode = await uniqueJoinCode()
  const session = await store.createSession({
    id: nanoid(),
    title: title.trim() || 'Untitled presentation',
    description: description?.trim() || null,
    joinCode,
    createdById: userId,
    settings: {
      allowAnonymous: true,
      maxParticipants: Number(process.env.MAX_PARTICIPANTS_PER_SESSION || MAX_PARTICIPANTS_DEFAULT),
    },
    status: 'DRAFT',
  })
  return toSessionDTO(session, true)
}

export async function listSessions(userId: string) {
  const sessions = await getStore().listSessionsByUser(userId)
  return Promise.all(sessions.map((s) => toSessionDTO(s)))
}

export async function getSessionForPresenter(sessionId: string, userId: string) {
  const session = await getStore().getSession(sessionId)
  assertSessionOwned(session, userId)
  return toSessionDTO(session!, true)
}

/** Limited public metadata. Prefer resolveSessionViewer-gated routes instead. */
export async function getSessionPublic(sessionId: string) {
  const session = await getStore().getSession(sessionId)
  if (!session) throw new AppError('SESSION_NOT_FOUND', 'This session no longer exists.', 404)
  if (session.status === 'DRAFT') {
    throw new AppError('SESSION_NOT_FOUND', 'This session no longer exists.', 404)
  }
  // Intentionally omits joinCode, createdById, settings, and questions.
  return {
    id: session.id,
    title: session.title,
    status: session.status,
    activeQuestionId: session.activeQuestionId,
  }
}

export async function openLobby(sessionId: string, userId: string) {
  const store = getStore()
  const session = assertSessionOwned(await store.getSession(sessionId), userId)
  const updated = await store.updateSession(sessionId, {
    status: 'LOBBY',
    startedAt: session.startedAt ?? new Date().toISOString(),
  })
  const dto = await toSessionDTO(updated, true)
  await getRealtimeBus().publish(
    makeEvent({ type: 'SESSION_UPDATED', sessionId, payload: { status: 'LOBBY' } }),
  )
  return dto
}

export async function endSession(sessionId: string, userId: string) {
  const store = getStore()
  assertSessionOwned(await store.getSession(sessionId), userId)
  const updated = await store.updateSession(sessionId, {
    status: 'ENDED',
    endedAt: new Date().toISOString(),
    activeQuestionId: null,
  })
  await getRealtimeBus().publish(makeEvent({ type: 'SESSION_ENDED', sessionId }))
  return toSessionDTO(updated, true)
}

export { toQuestionDTO }
