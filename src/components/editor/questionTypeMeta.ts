import type { QuestionType } from '@shared/types'
import { isContentSlide } from '@shared/types'

export const INTERACTIVE_TYPES: { type: QuestionType; label: string; hint: string }[] = [
  { type: 'MULTIPLE_CHOICE', label: 'Multiple Choice', hint: 'Pick one or many' },
  { type: 'RATING', label: 'Rating', hint: 'Star-style scores' },
  { type: 'SCALE', label: 'Scales', hint: 'Numeric range' },
  { type: 'OPEN_TEXT', label: 'Open Ended', hint: 'Free-form answers' },
  { type: 'WORD_CLOUD', label: 'Word Cloud', hint: 'One-word reactions' },
  { type: 'RANKING', label: 'Ranking', hint: 'Order by preference' },
  { type: 'YES_NO', label: 'Yes / No', hint: 'Binary decisions' },
]

export const CONTENT_TYPES: { type: QuestionType; label: string; hint: string }[] = [
  { type: 'CONTENT_COMPARE', label: 'Compare', hint: 'Two sides side-by-side' },
  { type: 'CONTENT_TEXT', label: 'Text', hint: 'Headline and body copy' },
  { type: 'CONTENT_IMAGE', label: 'Image', hint: 'Visual with optional text' },
  { type: 'CONTENT_VIDEO', label: 'Video', hint: 'Embed a video URL' },
  { type: 'CONTENT_INSTRUCTIONS', label: 'Instructions', hint: 'How to join or participate' },
]

/** @deprecated use INTERACTIVE_TYPES + CONTENT_TYPES */
export const QUESTION_TYPES = [...INTERACTIVE_TYPES, ...CONTENT_TYPES]

export const TYPE_META: Record<QuestionType, { label: string; short: string }> = {
  MULTIPLE_CHOICE: { label: 'Multiple Choice', short: 'MC' },
  RATING: { label: 'Rating', short: 'RT' },
  SCALE: { label: 'Scales', short: 'SC' },
  OPEN_TEXT: { label: 'Open Ended', short: 'OE' },
  WORD_CLOUD: { label: 'Word Cloud', short: 'WC' },
  RANKING: { label: 'Ranking', short: 'RK' },
  YES_NO: { label: 'Yes / No', short: 'YN' },
  CONTENT_TEXT: { label: 'Text', short: 'TX' },
  CONTENT_IMAGE: { label: 'Image', short: 'IMG' },
  CONTENT_VIDEO: { label: 'Video', short: 'VID' },
  CONTENT_INSTRUCTIONS: { label: 'Instructions', short: 'INS' },
  CONTENT_COMPARE: { label: 'Compare', short: 'CMP' },
}

export function optionLetter(i: number) {
  return String.fromCharCode(65 + i)
}

export function hasEditableOptions(type: QuestionType) {
  return type === 'MULTIPLE_CHOICE' || type === 'RANKING' || type === 'YES_NO'
}

export { isContentSlide }

export function contentBodyLines(body: string) {
  return body
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
}

export const PROMPT_PLACEHOLDERS: Record<QuestionType, string> = {
  MULTIPLE_CHOICE: 'Ask a question with clear choices…',
  RATING: 'Ask something people can rate…',
  SCALE: 'Ask how strongly people agree…',
  OPEN_TEXT: 'Ask an open question…',
  WORD_CLOUD: 'What word comes to mind...',
  RANKING: 'Ask people to rank these…',
  YES_NO: 'Ask a yes / no question…',
  CONTENT_TEXT: 'Add a title…',
  CONTENT_IMAGE: 'Add a title…',
  CONTENT_VIDEO: 'Add a title…',
  CONTENT_INSTRUCTIONS: 'Add a title…',
  CONTENT_COMPARE: 'Add a compare title…',
}
