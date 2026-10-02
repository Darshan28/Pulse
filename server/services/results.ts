import type { LiveResults, QuestionType } from '../../shared/types.js'
import type { OptionRecord, QuestionRecord, ResponseRecord } from '../store/types.js'

export function aggregateResults(
  question: QuestionRecord,
  options: OptionRecord[],
  responses: ResponseRecord[],
  showResults = true,
): LiveResults {
  const type = question.type
  const responseCount = responses.length
  const data = buildData(type, options, responses, question)
  return {
    questionId: question.id,
    type,
    responseCount,
    showResults,
    data,
  }
}

function buildData(
  type: QuestionType,
  options: OptionRecord[],
  responses: ResponseRecord[],
  question: QuestionRecord,
): Record<string, unknown> {
  switch (type) {
    case 'MULTIPLE_CHOICE':
    case 'YES_NO': {
      const counts: Record<string, number> = {}
      for (const opt of options) counts[opt.id] = 0
      if (type === 'YES_NO' && options.length === 0) {
        counts.yes = 0
        counts.no = 0
      }
      for (const r of responses) {
        const val = r.value as { optionIds?: string[]; value?: string }
        if (val.optionIds) {
          for (const id of val.optionIds) counts[id] = (counts[id] ?? 0) + 1
        } else if (val.value === 'yes' || val.value === 'no') {
          counts[val.value] = (counts[val.value] ?? 0) + 1
        }
      }
      const total = responses.length || 1
      const bars = (options.length
        ? options.map((o) => ({
            id: o.id,
            label: o.label,
            count: counts[o.id] ?? 0,
            percent: Math.round(((counts[o.id] ?? 0) / total) * 100),
          }))
        : [
            { id: 'yes', label: 'Yes', count: counts.yes ?? 0, percent: Math.round(((counts.yes ?? 0) / total) * 100) },
            { id: 'no', label: 'No', count: counts.no ?? 0, percent: Math.round(((counts.no ?? 0) / total) * 100) },
          ])
      return { bars }
    }
    case 'RATING':
    case 'SCALE': {
      const cfg = question.config as { min: number; max: number }
      const min = cfg.min ?? 1
      const max = cfg.max ?? 5
      const dist: Record<number, number> = {}
      for (let i = min; i <= max; i++) dist[i] = 0
      let sum = 0
      for (const r of responses) {
        const n = Number((r.value as { value?: number }).value)
        if (!Number.isFinite(n)) continue
        dist[n] = (dist[n] ?? 0) + 1
        sum += n
      }
      const avg = responses.length ? Math.round((sum / responses.length) * 10) / 10 : 0
      return {
        average: avg,
        min,
        max,
        distribution: Object.entries(dist).map(([value, count]) => ({
          value: Number(value),
          count,
          percent: responses.length ? Math.round((count / responses.length) * 100) : 0,
        })),
      }
    }
    case 'OPEN_TEXT': {
      return {
        texts: responses
          .map((r) => ({
            id: r.id,
            text: String((r.value as { text?: string }).text ?? ''),
            createdAt: r.createdAt,
          }))
          .filter((t) => t.text.trim().length > 0),
      }
    }
    case 'WORD_CLOUD': {
      const freq = new Map<string, number>()
      for (const r of responses) {
        const word = String((r.value as { text?: string }).text ?? '')
          .trim()
          .toLowerCase()
        if (!word) continue
        freq.set(word, (freq.get(word) ?? 0) + 1)
      }
      const words = [...freq.entries()]
        .map(([text, count]) => ({ text, count }))
        .sort((a, b) => b.count - a.count)
      return { words }
    }
    case 'RANKING': {
      const scores: Record<string, { sum: number; count: number; label: string }> = {}
      for (const opt of options) {
        scores[opt.id] = { sum: 0, count: 0, label: opt.label }
      }
      for (const r of responses) {
        const order = (r.value as { order?: string[] }).order ?? []
        order.forEach((id, idx) => {
          if (!scores[id]) return
          scores[id].sum += idx + 1
          scores[id].count += 1
        })
      }
      const ranking = Object.entries(scores)
        .map(([id, s]) => ({
          id,
          label: s.label,
          averageRank: s.count ? Math.round((s.sum / s.count) * 10) / 10 : 0,
          votes: s.count,
        }))
        .sort((a, b) => a.averageRank - b.averageRank)
      return { ranking }
    }
    default:
      return {}
  }
}
