import { nanoid } from 'nanoid'
import type { QuestionConfig, QuestionType } from '../../shared/types.js'
import { AppError } from '../lib/errors.js'
import { assertSessionOwned } from '../lib/sessionAccess.js'
import { getRealtimeBus, makeEvent } from '../realtime/bus.js'
import { getStore } from '../store/index.js'
import { aggregateResults } from './results.js'
import { toQuestionDTO, toSessionDTO } from './sessionService.js'

const defaultContentConfig = (type: QuestionType): QuestionConfig => {
  const base = {
    body: '',
    layout: 'media_right' as const,
    imageUrl: '',
    videoUrl: '',
    backgroundColor: '#ffffff',
    showLogo: true,
    animateListItems: false,
    leftTitle: 'Before',
    leftBody: '',
    rightTitle: 'After',
    rightBody: '',
  }
  switch (type) {
    case 'CONTENT_TEXT':
      return { ...base, layout: 'media_right', body: '' }
    case 'CONTENT_IMAGE':
      return { ...base, layout: 'media_right', body: 'Pair a headline with a visual.' }
    case 'CONTENT_VIDEO':
      return { ...base, layout: 'media_right', body: 'Share a short clip with the room.', videoUrl: '' }
    case 'CONTENT_INSTRUCTIONS':
      return {
        ...base,
        layout: 'text_only',
        body: '1. Join with the code on screen\n2. Answer when prompted\n3. Watch results appear live',
        animateListItems: true,
      }
    case 'CONTENT_COMPARE':
      return {
        ...base,
        layout: 'text_only',
        leftTitle: 'Option A',
        leftBody: 'Describe the first side…',
        rightTitle: 'Option B',
        rightBody: 'Describe the second side…',
      }
    default:
      return base
  }
}

const defaultConfig = (type: QuestionType): QuestionConfig => {
  switch (type) {
    case 'MULTIPLE_CHOICE':
      return { allowMultiple: false, required: true }
    case 'RATING':
      return { min: 1, max: 5, required: true }
    case 'SCALE':
      return {
        min: 1,
        max: 5,
        minLabel: 'Strongly disagree',
        maxLabel: 'Strongly agree',
        required: true,
      }
    case 'OPEN_TEXT':
    case 'WORD_CLOUD':
      return { maxLength: 500, required: true }
    case 'RANKING':
    case 'YES_NO':
      return { required: true }
    case 'CONTENT_TEXT':
    case 'CONTENT_IMAGE':
    case 'CONTENT_VIDEO':
    case 'CONTENT_INSTRUCTIONS':
    case 'CONTENT_COMPARE':
      return defaultContentConfig(type)
  }
}

const defaultPrompt = (type: QuestionType): string => {
  switch (type) {
    case 'MULTIPLE_CHOICE':
      return 'What is your opinion?'
    case 'RATING':
      return 'How would you rate this?'
    case 'SCALE':
      return 'How strongly do you agree?'
    case 'OPEN_TEXT':
      return 'What are your thoughts?'
    case 'WORD_CLOUD':
      return 'What word comes to mind...'
    case 'RANKING':
      return 'Rank these in order of importance'
    case 'YES_NO':
      return 'Do you agree?'
    case 'CONTENT_TEXT':
      return 'Looking ahead'
    case 'CONTENT_IMAGE':
      return 'A picture worth sharing'
    case 'CONTENT_VIDEO':
      return 'Watch this together'
    case 'CONTENT_INSTRUCTIONS':
      return 'How to join'
    case 'CONTENT_COMPARE':
      return 'Compare these sides'
    default:
      return 'Untitled question'
  }
}

const defaultOptions = (type: QuestionType): string[] => {
  switch (type) {
    case 'MULTIPLE_CHOICE':
      return ['Option 1', 'Option 2', 'Option 3']
    case 'RANKING':
      return ['Item 1', 'Item 2', 'Item 3']
    case 'YES_NO':
      return ['Yes', 'No']
    default:
      return []
  }
}

export async function createQuestion(
  sessionId: string,
  userId: string,
  input: { type: QuestionType; prompt?: string; config?: QuestionConfig; options?: string[] },
) {
  const store = getStore()
  const session = await store.getSession(sessionId)
  if (!session) throw new AppError('SESSION_NOT_FOUND', 'This session no longer exists.', 404)
  assertSessionOwned(session, userId)

  const existing = await store.listQuestions(sessionId)
  const type = input.type
  const question = await store.createQuestion({
    id: nanoid(),
    sessionId,
    type,
    prompt: input.prompt?.trim() || defaultPrompt(type),
    config: input.config ?? defaultConfig(type),
    order: existing.length,
  })

  const labels = input.options?.length ? input.options : defaultOptions(type)
  if (labels.length) {
    await store.replaceOptions(
      question.id,
      labels.map((label, order) => ({ label, order })),
    )
  }

  return toQuestionDTO(question)
}

export async function updateQuestion(
  sessionId: string,
  questionId: string,
  userId: string,
  input: {
    prompt?: string
    config?: QuestionConfig
    options?: string[]
    type?: QuestionType
  },
) {
  const store = getStore()
  const session = await store.getSession(sessionId)
  if (!session) throw new AppError('SESSION_NOT_FOUND', 'This session no longer exists.', 404)
  assertSessionOwned(session, userId)
  const question = await store.getQuestion(questionId)
  if (!question || question.sessionId !== sessionId) {
    throw new AppError('QUESTION_NOT_FOUND', 'Question not found.', 404)
  }

  const updated = await store.updateQuestion(questionId, {
    prompt: input.prompt ?? question.prompt,
    config: input.config ?? question.config,
    type: input.type ?? question.type,
  })

  if (input.options) {
    await store.replaceOptions(
      questionId,
      input.options.map((label, order) => ({ label, order })),
    )
  }

  const dto = await toQuestionDTO(updated)
  await getRealtimeBus().publish(
    makeEvent({ type: 'QUESTION_UPDATED', sessionId, questionId, payload: { question: dto } }),
  )
  return dto
}

export async function reorderQuestions(sessionId: string, userId: string, orderedIds: string[]) {
  const store = getStore()
  const session = await store.getSession(sessionId)
  if (!session) throw new AppError('SESSION_NOT_FOUND', 'This session no longer exists.', 404)
  assertSessionOwned(session, userId)

  const existing = await store.listQuestions(sessionId)
  const existingIds = new Set(existing.map((q) => q.id))
  if (orderedIds.length !== existing.length || orderedIds.some((id) => !existingIds.has(id))) {
    throw new AppError('VALIDATION_ERROR', 'Invalid slide order.', 400)
  }

  const reordered = await store.reorderQuestions(sessionId, orderedIds)
  return Promise.all(reordered.map(toQuestionDTO))
}

export async function deleteQuestion(sessionId: string, questionId: string, userId: string) {
  const store = getStore()
  const session = await store.getSession(sessionId)
  if (!session) throw new AppError('SESSION_NOT_FOUND', 'This session no longer exists.', 404)
  assertSessionOwned(session, userId)
  const question = await store.getQuestion(questionId)
  if (!question || question.sessionId !== sessionId) {
    throw new AppError('QUESTION_NOT_FOUND', 'Question not found.', 404)
  }
  await store.deleteQuestion(questionId)
  if (session.activeQuestionId === questionId) {
    await store.updateSession(sessionId, { activeQuestionId: null })
  }
}

export async function startQuestion(sessionId: string, questionId: string, userId: string) {
  const store = getStore()
  const session = await store.getSession(sessionId)
  if (!session) throw new AppError('SESSION_NOT_FOUND', 'This session no longer exists.', 404)
  assertSessionOwned(session, userId)
  const question = await store.getQuestion(questionId)
  if (!question || question.sessionId !== sessionId) {
    throw new AppError('QUESTION_NOT_FOUND', 'Question not found.', 404)
  }

  if (session.activeQuestionId) {
    await store.updateQuestion(session.activeQuestionId, { status: 'CLOSED' })
  }

  await store.updateQuestion(questionId, { status: 'ACTIVE' })
  const updatedSession = await store.updateSession(sessionId, {
    status: 'LIVE',
    activeQuestionId: questionId,
    startedAt: session.startedAt ?? new Date().toISOString(),
  })

  const dto = await toQuestionDTO({ ...question, status: 'ACTIVE' })
  const options = await store.listOptions(questionId)
  const responses = await store.listResponsesForQuestion(questionId)
  const results = aggregateResults({ ...question, status: 'ACTIVE' }, options, responses, true)

  await getRealtimeBus().publish(
    makeEvent({
      type: 'QUESTION_STARTED',
      sessionId,
      questionId,
      payload: { question: dto, results },
    }),
  )
  await getRealtimeBus().publish(
    makeEvent({ type: 'SESSION_UPDATED', sessionId, payload: { status: 'LIVE' } }),
  )

  return { session: await toSessionDTO(updatedSession, true), question: dto, results }
}

export async function closeQuestion(sessionId: string, questionId: string, userId: string) {
  const store = getStore()
  const session = await store.getSession(sessionId)
  assertSessionOwned(session, userId)
  const question = await store.getQuestion(questionId)
  if (!question || question.sessionId !== sessionId) {
    throw new AppError('QUESTION_NOT_FOUND', 'Question not found.', 404)
  }
  await store.updateQuestion(questionId, { status: 'CLOSED' })
  await getRealtimeBus().publish(makeEvent({ type: 'QUESTION_CLOSED', sessionId, questionId }))
  return toQuestionDTO((await store.getQuestion(questionId))!)
}

export async function reopenQuestion(sessionId: string, questionId: string, userId: string) {
  const store = getStore()
  const session = await store.getSession(sessionId)
  assertSessionOwned(session, userId)
  const question = await store.getQuestion(questionId)
  if (!question || question.sessionId !== sessionId) {
    throw new AppError('QUESTION_NOT_FOUND', 'Question not found.', 404)
  }
  await store.updateQuestion(questionId, { status: 'ACTIVE' })
  await store.updateSession(sessionId, { activeQuestionId: questionId, status: 'LIVE' })
  await getRealtimeBus().publish(
    makeEvent({ type: 'QUESTION_STARTED', sessionId, questionId }),
  )
  return toQuestionDTO((await store.getQuestion(questionId))!)
}

export async function clearResponses(sessionId: string, questionId: string, userId: string) {
  const store = getStore()
  const session = await store.getSession(sessionId)
  assertSessionOwned(session, userId)
  const question = await store.getQuestion(questionId)
  if (!question || question.sessionId !== sessionId) {
    throw new AppError('QUESTION_NOT_FOUND', 'Question not found.', 404)
  }
  await store.deleteResponsesForQuestion(questionId)
  const options = await store.listOptions(questionId)
  const results = aggregateResults(question, options, [], true)
  await getRealtimeBus().publish(
    makeEvent({
      type: 'RESULTS_UPDATED',
      sessionId,
      questionId,
      responseCount: 0,
      payload: { results },
    }),
  )
  return results
}

export async function getResults(sessionId: string, questionId: string, userId: string) {
  const store = getStore()
  const session = await store.getSession(sessionId)
  assertSessionOwned(session, userId)
  const question = await store.getQuestion(questionId)
  if (!question || question.sessionId !== sessionId) {
    throw new AppError('QUESTION_NOT_FOUND', 'Question not found.', 404)
  }
  const options = await store.listOptions(questionId)
  const responses = await store.listResponsesForQuestion(questionId)
  return aggregateResults(question, options, responses, true)
}
