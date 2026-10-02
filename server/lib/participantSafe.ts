import type { LiveResults, LiveState, QuestionDTO, RealtimeEvent, SessionDTO } from '../../shared/types.js'
import type { SessionRecord } from '../store/types.js'

/** Session fields a participant needs for the join / live experience. */
export function toParticipantSessionDTO(
  session: SessionRecord,
  meta: {
    participantCount: number
    questionCount: number
    activeQuestion?: QuestionDTO | null
  },
): SessionDTO {
  return {
    id: session.id,
    title: session.title,
    description: null,
    joinCode: '',
    status: session.status,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
    startedAt: session.startedAt,
    endedAt: session.endedAt,
    createdById: '',
    settings: {
      allowAnonymous: true,
      maxParticipants: session.settings.maxParticipants,
    },
    activeQuestionId: session.activeQuestionId,
    participantCount: meta.participantCount,
    questionCount: meta.questionCount,
    questions: meta.activeQuestion ? [meta.activeQuestion] : [],
  }
}

/**
 * Participant-facing results: aggregates only.
 * Strips individual response records, timestamps, and internal response IDs.
 * Participants do not receive open-text dumps (presenter screen only).
 */
export function toParticipantSafeResults(results: LiveResults | null | undefined): LiveResults | null {
  if (!results) return null

  const base = {
    questionId: results.questionId,
    type: results.type,
    responseCount: results.responseCount,
    showResults: results.showResults,
  }

  switch (results.type) {
    case 'MULTIPLE_CHOICE':
    case 'YES_NO': {
      const bars = (results.data.bars as Array<{ id: string; label: string; count: number; percent: number }>) ?? []
      return {
        ...base,
        data: {
          bars: bars.map((b) => ({
            id: b.id,
            label: b.label,
            count: b.count,
            percent: b.percent,
          })),
        },
      }
    }
    case 'RATING':
    case 'SCALE': {
      const distribution =
        (results.data.distribution as Array<{ value: number; count: number; percent: number }>) ?? []
      return {
        ...base,
        data: {
          average: results.data.average,
          min: results.data.min,
          max: results.data.max,
          distribution: distribution.map((d) => ({
            value: d.value,
            count: d.count,
            percent: d.percent,
          })),
        },
      }
    }
    case 'WORD_CLOUD': {
      const words = (results.data.words as Array<{ text: string; count: number }>) ?? []
      return {
        ...base,
        data: {
          words: words.map((w) => ({ text: w.text, count: w.count })),
        },
      }
    }
    case 'RANKING': {
      const ranking =
        (results.data.ranking as Array<{
          id: string
          label: string
          averageRank: number
          votes: number
        }>) ?? []
      return {
        ...base,
        data: {
          ranking: ranking.map((r) => ({
            id: r.id,
            label: r.label,
            averageRank: r.averageRank,
            votes: r.votes,
          })),
        },
      }
    }
    case 'OPEN_TEXT':
      // Individual free-text answers stay on the presenter screen only.
      return {
        ...base,
        data: { responseCount: results.responseCount },
      }
    default:
      return { ...base, data: {} }
  }
}

/**
 * Participant UI does not render live results today — live-state returns
 * active question + session status only. Results stay presenter-side.
 */
export function toParticipantLiveState(input: {
  session: SessionRecord
  participantCount: number
  questionCount: number
  activeQuestion: QuestionDTO | null
}): LiveState {
  return {
    session: toParticipantSessionDTO(input.session, {
      participantCount: input.participantCount,
      questionCount: input.questionCount,
      activeQuestion: input.activeQuestion,
    }),
    activeQuestion: input.activeQuestion,
    results: null,
    participantCount: input.participantCount,
  }
}

/**
 * Strip presenter/private payloads from SSE events before sending to participants.
 * Presenters continue to receive the original bus events unchanged.
 */
export function sanitizeRealtimeEventForParticipant(event: RealtimeEvent): RealtimeEvent {
  switch (event.type) {
    case 'PARTICIPANT_JOINED':
    case 'PARTICIPANT_LEFT':
      return {
        type: event.type,
        sessionId: event.sessionId,
        participantCount: event.participantCount,
        ts: event.ts,
      }
    case 'RESPONSE_SUBMITTED':
      return {
        type: event.type,
        sessionId: event.sessionId,
        questionId: event.questionId,
        responseCount: event.responseCount,
        ts: event.ts,
      }
    case 'RESULTS_UPDATED':
      // Counts only — no aggregate dumps / open-text lists on the participant wire.
      return {
        type: event.type,
        sessionId: event.sessionId,
        questionId: event.questionId,
        responseCount: event.responseCount,
        ts: event.ts,
      }
    case 'QUESTION_STARTED': {
      const question = event.payload?.question
      return {
        type: event.type,
        sessionId: event.sessionId,
        questionId: event.questionId,
        ts: event.ts,
        payload: question ? { question } : undefined,
      }
    }
    case 'QUESTION_UPDATED': {
      const question = event.payload?.question as QuestionDTO | undefined
      // Only forward updates for the active question payload; never include results.
      if (!question || question.status !== 'ACTIVE') {
        return {
          type: event.type,
          sessionId: event.sessionId,
          questionId: event.questionId,
          ts: event.ts,
        }
      }
      return {
        type: event.type,
        sessionId: event.sessionId,
        questionId: event.questionId,
        ts: event.ts,
        payload: { question },
      }
    }
    case 'QUESTION_CLOSED':
    case 'SESSION_ENDED':
      return {
        type: event.type,
        sessionId: event.sessionId,
        questionId: event.questionId,
        ts: event.ts,
      }
    case 'SESSION_UPDATED':
      return {
        type: event.type,
        sessionId: event.sessionId,
        ts: event.ts,
        payload: event.payload?.status ? { status: event.payload.status } : undefined,
      }
    default:
      return {
        type: event.type,
        sessionId: event.sessionId,
        ts: event.ts,
      }
  }
}
