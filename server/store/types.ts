import type {
  QuestionConfig,
  QuestionStatus,
  QuestionType,
  SessionSettings,
  SessionStatus,
} from '../../shared/types.js'
import type { UserProfileDTO } from '../../shared/onboarding.js'

export type UserProfileRecord = UserProfileDTO

export interface SessionRecord {
  id: string
  title: string
  description: string | null
  joinCode: string
  status: SessionStatus
  createdAt: string
  updatedAt: string
  startedAt: string | null
  endedAt: string | null
  createdById: string
  settings: SessionSettings
  activeQuestionId: string | null
}

export interface QuestionRecord {
  id: string
  sessionId: string
  type: QuestionType
  prompt: string
  config: QuestionConfig
  order: number
  status: QuestionStatus
  createdAt: string
}

export interface OptionRecord {
  id: string
  questionId: string
  label: string
  order: number
}

export interface ParticipantRecord {
  id: string
  sessionId: string
  displayName: string | null
  token: string
  joinedAt: string
  leftAt: string | null
}

export interface ResponseRecord {
  id: string
  sessionId: string
  questionId: string
  participantId: string
  value: unknown
  createdAt: string
}

export interface UpsertUserProfileInput {
  authUserId: string
  email?: string | null
}

export interface UpdateUserProfileInput {
  role?: string | null
  useCases?: string[]
  audienceSize?: string | null
  onboardingCompleted?: boolean
  email?: string | null
}

export interface Store {
  upsertUserProfile(input: UpsertUserProfileInput): Promise<UserProfileRecord>
  getUserById(id: string): Promise<UserProfileRecord | null>
  getUserByAuthId(authUserId: string): Promise<UserProfileRecord | null>
  updateUserProfile(id: string, patch: UpdateUserProfileInput): Promise<UserProfileRecord>

  createSession(data: Omit<SessionRecord, 'createdAt' | 'updatedAt' | 'startedAt' | 'endedAt' | 'activeQuestionId' | 'status'> & {
    status?: SessionStatus
  }): Promise<SessionRecord>
  updateSession(id: string, patch: Partial<SessionRecord>): Promise<SessionRecord>
  getSession(id: string): Promise<SessionRecord | null>
  getSessionByJoinCode(code: string): Promise<SessionRecord | null>
  listSessionsByUser(userId: string): Promise<SessionRecord[]>

  createQuestion(data: Omit<QuestionRecord, 'createdAt' | 'status'> & { status?: QuestionStatus }): Promise<QuestionRecord>
  updateQuestion(id: string, patch: Partial<QuestionRecord>): Promise<QuestionRecord>
  deleteQuestion(id: string): Promise<void>
  getQuestion(id: string): Promise<QuestionRecord | null>
  listQuestions(sessionId: string): Promise<QuestionRecord[]>
  reorderQuestions(sessionId: string, orderedIds: string[]): Promise<QuestionRecord[]>

  replaceOptions(questionId: string, options: { label: string; order: number }[]): Promise<OptionRecord[]>
  listOptions(questionId: string): Promise<OptionRecord[]>

  createParticipant(data: Omit<ParticipantRecord, 'joinedAt' | 'leftAt'> & { joinedAt?: string }): Promise<ParticipantRecord>
  getParticipantByToken(token: string): Promise<ParticipantRecord | null>
  getParticipant(id: string): Promise<ParticipantRecord | null>
  countActiveParticipants(sessionId: string): Promise<number>
  listParticipants(sessionId: string): Promise<ParticipantRecord[]>

  createResponse(data: Omit<ResponseRecord, 'createdAt' | 'id'> & { id?: string }): Promise<ResponseRecord>
  getResponseByParticipantQuestion(participantId: string, questionId: string): Promise<ResponseRecord | null>
  listResponsesForQuestion(questionId: string): Promise<ResponseRecord[]>
  deleteResponsesForQuestion(questionId: string): Promise<number>
  countResponsesForQuestion(questionId: string): Promise<number>
}
