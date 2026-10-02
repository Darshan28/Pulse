import type { Context } from 'hono'
import { AppError } from './errors.js'
import { getParticipantToken, tryResolvePresenter } from './auth.js'
import { getStore } from '../store/index.js'
import type { SessionRecord, UserProfileRecord } from '../store/types.js'

/** Private resources: missing and non-owned look the same (404). */
export function assertSessionOwned(session: SessionRecord | null, userId: string): SessionRecord {
  if (!session || session.createdById !== userId) {
    throw new AppError('SESSION_NOT_FOUND', 'This session no longer exists.', 404)
  }
  return session
}

export async function requireOwnedSession(sessionId: string, userId: string): Promise<SessionRecord> {
  const session = await getStore().getSession(sessionId)
  return assertSessionOwned(session, userId)
}

export type SessionViewer =
  | { role: 'presenter'; user: UserProfileRecord; session: SessionRecord }
  | { role: 'participant'; participantId: string; session: SessionRecord }

/**
 * Grant live-session access to the owning presenter (Bearer JWT) or a
 * participant whose token is scoped to this session.
 *
 * EventSource cannot send Authorization headers, so `access_token` /
 * `participant` query params are accepted for SSE only.
 */
export async function resolveSessionViewer(
  c: Context,
  sessionId: string,
  options: { allowQueryTokens?: boolean } = {},
): Promise<SessionViewer> {
  const store = getStore()
  const session = await store.getSession(sessionId)
  if (!session) {
    throw new AppError('SESSION_NOT_FOUND', 'This session no longer exists.', 404)
  }

  const presenter = await tryResolvePresenter(c, {
    accessTokenOverride: options.allowQueryTokens
      ? c.req.query('access_token') || undefined
      : undefined,
  })
  if (presenter && session.createdById === presenter.id) {
    return { role: 'presenter', user: presenter, session }
  }

  let participantToken = getParticipantToken(c)
  if (!participantToken && options.allowQueryTokens) {
    participantToken = c.req.query('participant') || null
  }
  if (participantToken) {
    const participant = await store.getParticipantByToken(participantToken)
    if (participant && participant.sessionId === sessionId && !participant.leftAt) {
      if (session.status === 'DRAFT') {
        throw new AppError('UNAUTHORIZED', 'This session is not open yet.', 401)
      }
      return { role: 'participant', participantId: participant.id, session }
    }
  }

  throw new AppError('UNAUTHORIZED', 'Sign in or join this session to continue.', 401)
}
