import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { nanoid } from 'nanoid'
import type {
  OptionRecord,
  ParticipantRecord,
  QuestionRecord,
  ResponseRecord,
  SessionRecord,
  Store,
  UpdateUserProfileInput,
  UpsertUserProfileInput,
  UserProfileRecord,
} from './types.js'
import type { QuestionStatus, SessionStatus } from '../../shared/types.js'

interface MemoryData {
  users: UserProfileRecord[]
  sessions: SessionRecord[]
  questions: QuestionRecord[]
  options: OptionRecord[]
  participants: ParticipantRecord[]
  responses: ResponseRecord[]
}

const empty = (): MemoryData => ({
  users: [],
  sessions: [],
  questions: [],
  options: [],
  participants: [],
  responses: [],
})

export class MemoryStore implements Store {
  private data: MemoryData = empty()
  private filePath: string
  private persistTimer: ReturnType<typeof setTimeout> | null = null
  private ready: Promise<void>

  constructor(filePath = path.join(process.cwd(), '.data', 'pulse.json')) {
    this.filePath = filePath
    this.ready = this.load()
  }

  private async load() {
    try {
      const raw = await readFile(this.filePath, 'utf8')
      const parsed = { ...empty(), ...JSON.parse(raw) } as MemoryData & {
        users: Array<UserProfileRecord & { token?: string }>
      }
      // Drop legacy anonymous cookie users (token-based).
      parsed.users = (parsed.users || []).filter(
        (u) => typeof u.authUserId === 'string' && u.authUserId.length > 0,
      )
      this.data = parsed
    } catch {
      this.data = empty()
    }
  }

  private schedulePersist() {
    if (this.persistTimer) clearTimeout(this.persistTimer)
    this.persistTimer = setTimeout(() => {
      void this.persist()
    }, 100)
  }

  private async persist() {
    await mkdir(path.dirname(this.filePath), { recursive: true })
    await writeFile(this.filePath, JSON.stringify(this.data, null, 2), 'utf8')
  }

  private async ensure() {
    await this.ready
  }

  async upsertUserProfile(input: UpsertUserProfileInput): Promise<UserProfileRecord> {
    await this.ensure()
    const existing = this.data.users.find((u) => u.authUserId === input.authUserId)
    if (existing) {
      if (input.email !== undefined) existing.email = input.email
      existing.updatedAt = new Date().toISOString()
      this.schedulePersist()
      return existing
    }
    const now = new Date().toISOString()
    const user: UserProfileRecord = {
      id: nanoid(),
      authUserId: input.authUserId,
      email: input.email ?? null,
      role: null,
      useCases: [],
      audienceSize: null,
      onboardingCompleted: false,
      createdAt: now,
      updatedAt: now,
    }
    this.data.users.push(user)
    this.schedulePersist()
    return user
  }

  async getUserById(id: string) {
    await this.ensure()
    return this.data.users.find((u) => u.id === id) ?? null
  }

  async getUserByAuthId(authUserId: string) {
    await this.ensure()
    return this.data.users.find((u) => u.authUserId === authUserId) ?? null
  }

  async updateUserProfile(id: string, patch: UpdateUserProfileInput) {
    await this.ensure()
    const idx = this.data.users.findIndex((u) => u.id === id)
    if (idx < 0) throw new Error('USER_NOT_FOUND')
    const current = this.data.users[idx]
    this.data.users[idx] = {
      ...current,
      role: patch.role === undefined ? current.role : patch.role,
      useCases: patch.useCases === undefined ? current.useCases : patch.useCases,
      audienceSize: patch.audienceSize === undefined ? current.audienceSize : patch.audienceSize,
      onboardingCompleted:
        patch.onboardingCompleted === undefined
          ? current.onboardingCompleted
          : patch.onboardingCompleted,
      email: patch.email === undefined ? current.email : patch.email,
      updatedAt: new Date().toISOString(),
    }
    this.schedulePersist()
    return this.data.users[idx]
  }

  async createSession(data: Omit<SessionRecord, 'createdAt' | 'updatedAt' | 'startedAt' | 'endedAt' | 'activeQuestionId' | 'status'> & {
    status?: SessionStatus
  }) {
    await this.ensure()
    const now = new Date().toISOString()
    const session: SessionRecord = {
      ...data,
      status: data.status ?? 'DRAFT',
      createdAt: now,
      updatedAt: now,
      startedAt: null,
      endedAt: null,
      activeQuestionId: null,
    }
    this.data.sessions.push(session)
    this.schedulePersist()
    return session
  }

  async updateSession(id: string, patch: Partial<SessionRecord>) {
    await this.ensure()
    const idx = this.data.sessions.findIndex((s) => s.id === id)
    if (idx < 0) throw new Error('SESSION_NOT_FOUND')
    this.data.sessions[idx] = {
      ...this.data.sessions[idx],
      ...patch,
      id,
      updatedAt: new Date().toISOString(),
    }
    this.schedulePersist()
    return this.data.sessions[idx]
  }

  async getSession(id: string) {
    await this.ensure()
    return this.data.sessions.find((s) => s.id === id) ?? null
  }

  async getSessionByJoinCode(code: string) {
    await this.ensure()
    return this.data.sessions.find((s) => s.joinCode === code.toUpperCase()) ?? null
  }

  async listSessionsByUser(userId: string) {
    await this.ensure()
    return this.data.sessions
      .filter((s) => s.createdById === userId)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  }

  async createQuestion(data: Omit<QuestionRecord, 'createdAt' | 'status'> & { status?: QuestionStatus }) {
    await this.ensure()
    const q: QuestionRecord = {
      ...data,
      status: data.status ?? 'DRAFT',
      createdAt: new Date().toISOString(),
    }
    this.data.questions.push(q)
    this.schedulePersist()
    return q
  }

  async updateQuestion(id: string, patch: Partial<QuestionRecord>) {
    await this.ensure()
    const idx = this.data.questions.findIndex((q) => q.id === id)
    if (idx < 0) throw new Error('QUESTION_NOT_FOUND')
    this.data.questions[idx] = { ...this.data.questions[idx], ...patch, id }
    this.schedulePersist()
    return this.data.questions[idx]
  }

  async deleteQuestion(id: string) {
    await this.ensure()
    this.data.questions = this.data.questions.filter((q) => q.id !== id)
    this.data.options = this.data.options.filter((o) => o.questionId !== id)
    this.data.responses = this.data.responses.filter((r) => r.questionId !== id)
    this.schedulePersist()
  }

  async getQuestion(id: string) {
    await this.ensure()
    return this.data.questions.find((q) => q.id === id) ?? null
  }

  async listQuestions(sessionId: string) {
    await this.ensure()
    return this.data.questions
      .filter((q) => q.sessionId === sessionId)
      .sort((a, b) => a.order - b.order)
  }

  async reorderQuestions(sessionId: string, orderedIds: string[]) {
    await this.ensure()
    orderedIds.forEach((id, order) => {
      const q = this.data.questions.find((item) => item.id === id && item.sessionId === sessionId)
      if (q) q.order = order
    })
    this.schedulePersist()
    return this.listQuestions(sessionId)
  }

  async replaceOptions(questionId: string, options: { label: string; order: number }[]) {
    await this.ensure()
    this.data.options = this.data.options.filter((o) => o.questionId !== questionId)
    const created = options.map((o) => ({
      id: nanoid(),
      questionId,
      label: o.label,
      order: o.order,
    }))
    this.data.options.push(...created)
    this.schedulePersist()
    return created
  }

  async listOptions(questionId: string) {
    await this.ensure()
    return this.data.options
      .filter((o) => o.questionId === questionId)
      .sort((a, b) => a.order - b.order)
  }

  async createParticipant(data: Omit<ParticipantRecord, 'joinedAt' | 'leftAt'> & { joinedAt?: string }) {
    await this.ensure()
    const p: ParticipantRecord = {
      ...data,
      joinedAt: data.joinedAt ?? new Date().toISOString(),
      leftAt: null,
    }
    this.data.participants.push(p)
    this.schedulePersist()
    return p
  }

  async getParticipantByToken(token: string) {
    await this.ensure()
    return this.data.participants.find((p) => p.token === token) ?? null
  }

  async getParticipant(id: string) {
    await this.ensure()
    return this.data.participants.find((p) => p.id === id) ?? null
  }

  async countActiveParticipants(sessionId: string) {
    await this.ensure()
    return this.data.participants.filter((p) => p.sessionId === sessionId && !p.leftAt).length
  }

  async listParticipants(sessionId: string) {
    await this.ensure()
    return this.data.participants.filter((p) => p.sessionId === sessionId)
  }

  async createResponse(data: Omit<ResponseRecord, 'createdAt' | 'id'> & { id?: string }) {
    await this.ensure()
    const r: ResponseRecord = {
      id: data.id ?? nanoid(),
      sessionId: data.sessionId,
      questionId: data.questionId,
      participantId: data.participantId,
      value: data.value,
      createdAt: new Date().toISOString(),
    }
    this.data.responses.push(r)
    this.schedulePersist()
    return r
  }

  async getResponseByParticipantQuestion(participantId: string, questionId: string) {
    await this.ensure()
    return (
      this.data.responses.find((r) => r.participantId === participantId && r.questionId === questionId) ?? null
    )
  }

  async listResponsesForQuestion(questionId: string) {
    await this.ensure()
    return this.data.responses.filter((r) => r.questionId === questionId)
  }

  async deleteResponsesForQuestion(questionId: string) {
    await this.ensure()
    const before = this.data.responses.length
    this.data.responses = this.data.responses.filter((r) => r.questionId !== questionId)
    this.schedulePersist()
    return before - this.data.responses.length
  }

  async countResponsesForQuestion(questionId: string) {
    await this.ensure()
    return this.data.responses.filter((r) => r.questionId === questionId).length
  }
}
