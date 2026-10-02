export type SessionStatus = 'DRAFT' | 'LOBBY' | 'LIVE' | 'PAUSED' | 'ENDED'
export type QuestionType =
  | 'MULTIPLE_CHOICE'
  | 'RATING'
  | 'SCALE'
  | 'OPEN_TEXT'
  | 'WORD_CLOUD'
  | 'RANKING'
  | 'YES_NO'
  | 'CONTENT_TEXT'
  | 'CONTENT_IMAGE'
  | 'CONTENT_VIDEO'
  | 'CONTENT_INSTRUCTIONS'
  | 'CONTENT_COMPARE'
export type QuestionStatus = 'DRAFT' | 'ACTIVE' | 'CLOSED'

export type ContentLayout = 'text_only' | 'media_right' | 'media_left' | 'media_full'

export const CONTENT_SLIDE_TYPES: QuestionType[] = [
  'CONTENT_TEXT',
  'CONTENT_IMAGE',
  'CONTENT_VIDEO',
  'CONTENT_INSTRUCTIONS',
  'CONTENT_COMPARE',
]

export function isContentSlide(type: QuestionType): boolean {
  return CONTENT_SLIDE_TYPES.includes(type)
}

export type RealtimeEventType =
  | 'SESSION_UPDATED'
  | 'PARTICIPANT_JOINED'
  | 'PARTICIPANT_LEFT'
  | 'QUESTION_STARTED'
  | 'QUESTION_UPDATED'
  | 'QUESTION_CLOSED'
  | 'RESPONSE_SUBMITTED'
  | 'RESULTS_UPDATED'
  | 'SESSION_ENDED'

export interface ApiErrorBody {
  error: {
    code: string
    message: string
  }
}

export interface SessionSettings {
  allowAnonymous?: boolean
  maxParticipants?: number
}

export interface MultipleChoiceConfig {
  allowMultiple: boolean
  required: boolean
}

export interface RatingConfig {
  min: number
  max: number
  required: boolean
}

export interface ScaleConfig {
  min: number
  max: number
  minLabel: string
  maxLabel: string
  required: boolean
}

export interface OpenTextConfig {
  maxLength: number
  required: boolean
}

export interface WordCloudConfig {
  maxLength: number
  required: boolean
}

export interface RankingConfig {
  required: boolean
}

export interface YesNoConfig {
  required: boolean
}

export interface ContentSlideConfig {
  body: string
  layout: ContentLayout
  imageUrl: string
  videoUrl: string
  backgroundColor: string
  showLogo: boolean
  animateListItems: boolean
  leftTitle: string
  leftBody: string
  rightTitle: string
  rightBody: string
}

export type QuestionConfig =
  | MultipleChoiceConfig
  | RatingConfig
  | ScaleConfig
  | OpenTextConfig
  | WordCloudConfig
  | RankingConfig
  | YesNoConfig
  | ContentSlideConfig

export interface QuestionOptionDTO {
  id: string
  label: string
  order: number
}

export interface QuestionDTO {
  id: string
  sessionId: string
  type: QuestionType
  prompt: string
  config: QuestionConfig
  order: number
  status: QuestionStatus
  options: QuestionOptionDTO[]
}

export interface SessionDTO {
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
  participantCount: number
  questionCount: number
  questions?: QuestionDTO[]
}

export interface ParticipantDTO {
  id: string
  sessionId: string
  displayName: string | null
  joinedAt: string
}

export interface LiveResults {
  questionId: string
  type: QuestionType
  responseCount: number
  showResults: boolean
  data: Record<string, unknown>
}

export interface LiveState {
  session: SessionDTO
  activeQuestion: QuestionDTO | null
  results: LiveResults | null
  participantCount: number
  connectionHint?: 'sse' | 'poll'
}

export interface RealtimeEvent {
  type: RealtimeEventType
  sessionId: string
  questionId?: string
  responseCount?: number
  participantCount?: number
  payload?: Record<string, unknown>
  ts: number
}

export const MAX_PARTICIPANTS_DEFAULT = 200
export const OPEN_TEXT_MAX = 500
export const JOIN_CODE_LENGTH = 5
