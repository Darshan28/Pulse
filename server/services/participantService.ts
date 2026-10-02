import { nanoid } from 'nanoid'
import { MAX_PARTICIPANTS_DEFAULT, OPEN_TEXT_MAX, type LiveState } from '../../shared/types.js'
import { AppError } from '../lib/errors.js'
import { toParticipantLiveState, toParticipantSessionDTO } from '../lib/participantSafe.js'
import { assertSessionOwned } from '../lib/sessionAccess.js'
import { getRealtimeBus, makeEvent } from '../realtime/bus.js'
import { getStore } from '../store/index.js'
import { aggregateResults } from './results.js'
import { toQuestionDTO, toSessionDTO } from './sessionService.js'

export async function joinSession(code: string, displayName?: string) {
  const store = getStore()
  const session = await store.getSessionByJoinCode(code.trim().toUpperCase())
  if (!session) throw new AppError('INVALID_JOIN_CODE', 'That join code is not valid.', 404)
  if (session.status === 'ENDED') {
    throw new AppError('SESSION_ENDED', 'This session has ended.', 400)
  }
  if (session.status === 'DRAFT') {
    throw new AppError(
      'SESSION_NOT_OPEN',
      'This session is not open for participants yet.',
      400,
    )
  }

  const max = session.settings.maxParticipants ?? MAX_PARTICIPANTS_DEFAULT
  const count = await store.countActiveParticipants(session.id)
  if (count >= max) {
    throw new AppError('SESSION_FULL', 'This session is full.', 403)
  }

  const token = nanoid(32)
  const participant = await store.createParticipant({
    id: nanoid(),
    sessionId: session.id,
    displayName: displayName?.trim() || null,
    token,
  })

  const participantCount = await store.countActiveParticipants(session.id)
  // Count only — never broadcast peer names/ids/tokens on the shared bus.
  await getRealtimeBus().publish(
    makeEvent({
      type: 'PARTICIPANT_JOINED',
      sessionId: session.id,
      participantCount,
    }),
  )

  const questions = await store.listQuestions(session.id)
  let activeQuestion = null
  if (session.activeQuestionId) {
    const q = await store.getQuestion(session.activeQuestionId)
    if (q) activeQuestion = await toQuestionDTO(q)
  }

  return {
    token,
    participant: {
      id: participant.id,
      sessionId: participant.sessionId,
      displayName: participant.displayName,
      joinedAt: participant.joinedAt,
    },
    session: toParticipantSessionDTO(session, {
      participantCount,
      questionCount: questions.length,
      activeQuestion,
    }),
  }
}

export async function submitResponse(
  participantToken: string,
  questionId: string,
  value: unknown,
) {
  const store = getStore()
  const participant = await store.getParticipantByToken(participantToken)
  if (!participant) throw new AppError('UNAUTHORIZED', 'Join the session again.', 401)

  const question = await store.getQuestion(questionId)
  if (!question || question.sessionId !== participant.sessionId) {
    throw new AppError('QUESTION_NOT_FOUND', 'Question not found.', 404)
  }
  if (question.status !== 'ACTIVE') {
    throw new AppError('QUESTION_CLOSED', 'This question is closed for responses.', 400)
  }

  const existing = await store.getResponseByParticipantQuestion(participant.id, questionId)
  if (existing) {
    throw new AppError('DUPLICATE_SUBMISSION', 'You already answered this question.', 409)
  }

  validateValue(question.type, question.config, value)

  await store.createResponse({
    sessionId: participant.sessionId,
    questionId,
    participantId: participant.id,
    value,
  })

  const options = await store.listOptions(questionId)
  const responses = await store.listResponsesForQuestion(questionId)
  const results = aggregateResults(question, options, responses, true)

  await getRealtimeBus().publish(
    makeEvent({
      type: 'RESPONSE_SUBMITTED',
      sessionId: participant.sessionId,
      questionId,
      responseCount: results.responseCount,
    }),
  )
  // Full aggregates for presenters on the bus; participants receive a sanitized SSE copy.
  await getRealtimeBus().publish(
    makeEvent({
      type: 'RESULTS_UPDATED',
      sessionId: participant.sessionId,
      questionId,
      responseCount: results.responseCount,
      payload: { results },
    }),
  )

  // Do not return result dumps to the submitting participant.
  return { ok: true as const }
}

function validateValue(type: string, config: unknown, value: unknown) {
  const cfg = config as Record<string, unknown>
  switch (type) {
    case 'MULTIPLE_CHOICE': {
      const optionIds = (value as { optionIds?: string[] })?.optionIds
      if (!Array.isArray(optionIds) || optionIds.length === 0) {
        throw new AppError('VALIDATION_ERROR', 'Select at least one option.')
      }
      if (!cfg.allowMultiple && optionIds.length > 1) {
        throw new AppError('VALIDATION_ERROR', 'Select only one option.')
      }
      break
    }
    case 'YES_NO': {
      const v = (value as { value?: string })?.value
      if (v !== 'yes' && v !== 'no') throw new AppError('VALIDATION_ERROR', 'Choose yes or no.')
      break
    }
    case 'RATING':
    case 'SCALE': {
      const n = Number((value as { value?: number })?.value)
      const min = Number(cfg.min ?? 1)
      const max = Number(cfg.max ?? 5)
      if (!Number.isFinite(n) || n < min || n > max) {
        throw new AppError('VALIDATION_ERROR', `Choose a value between ${min} and ${max}.`)
      }
      break
    }
    case 'OPEN_TEXT':
    case 'WORD_CLOUD': {
      const text = String((value as { text?: string })?.text ?? '').trim()
      const max = Number(cfg.maxLength ?? OPEN_TEXT_MAX)
      if (!text) throw new AppError('VALIDATION_ERROR', 'Enter a response.')
      if (text.length > max) throw new AppError('VALIDATION_ERROR', `Keep it under ${max} characters.`)
      break
    }
    case 'RANKING': {
      const order = (value as { order?: string[] })?.order
      if (!Array.isArray(order) || order.length === 0) {
        throw new AppError('VALIDATION_ERROR', 'Rank all items.')
      }
      break
    }
    case 'CONTENT_TEXT':
    case 'CONTENT_IMAGE':
    case 'CONTENT_VIDEO':
    case 'CONTENT_INSTRUCTIONS':
    case 'CONTENT_COMPARE':
      throw new AppError('VALIDATION_ERROR', 'This slide does not take responses.')
    default:
      throw new AppError('VALIDATION_ERROR', 'Unsupported question type.')
  }
}

export async function getLiveState(
  sessionId: string,
  viewer: 'presenter' | 'participant' = 'presenter',
): Promise<LiveState> {
  const store = getStore()
  const session = await store.getSession(sessionId)
  if (!session) throw new AppError('SESSION_NOT_FOUND', 'This session no longer exists.', 404)

  const participantCount = await store.countActiveParticipants(sessionId)
  const allQuestions = await store.listQuestions(sessionId)
  let activeQuestion = null
  let results = null

  if (session.activeQuestionId) {
    const q = await store.getQuestion(session.activeQuestionId)
    if (q) {
      activeQuestion = await toQuestionDTO(q)
      const options = await store.listOptions(q.id)
      const responses = await store.listResponsesForQuestion(q.id)
      results = aggregateResults(q, options, responses, true)
      if (q.status === 'CLOSED') {
        results = { ...results, showResults: true }
      }
    }
  }

  if (viewer === 'participant') {
    return toParticipantLiveState({
      session,
      participantCount,
      questionCount: allQuestions.length,
      activeQuestion,
    })
  }

  return {
    session: await toSessionDTO(session, true),
    activeQuestion,
    results,
    participantCount,
  }
}

export async function exportCsv(sessionId: string, userId: string) {
  const store = getStore()
  const session = await store.getSession(sessionId)
  assertSessionOwned(session, userId)

  const questions = await store.listQuestions(sessionId)
  const lines = ['question_order,question_type,question_prompt,response_count,response_json']

  for (const q of questions) {
    const responses = await store.listResponsesForQuestion(q.id)
    for (const r of responses) {
      lines.push(
        [
          q.order + 1,
          q.type,
          csvEscape(q.prompt),
          responses.length,
          csvEscape(JSON.stringify(r.value)),
        ].join(','),
      )
    }
    if (responses.length === 0) {
      lines.push([q.order + 1, q.type, csvEscape(q.prompt), 0, ''].join(','))
    }
  }

  return lines.join('\n')
}

function csvEscape(value: string) {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}
