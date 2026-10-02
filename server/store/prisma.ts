import { PrismaClient, type Prisma } from '@prisma/client'
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
import type { QuestionConfig, QuestionStatus, SessionSettings, SessionStatus, QuestionType } from '../../shared/types.js'

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === 'string')
}

function mapUserProfile(u: {
  id: string
  authUserId: string
  email: string | null
  role: string | null
  useCases: unknown
  audienceSize: string | null
  onboardingCompleted: boolean
  createdAt: Date
  updatedAt: Date
}): UserProfileRecord {
  return {
    id: u.id,
    authUserId: u.authUserId,
    email: u.email,
    role: u.role,
    useCases: asStringArray(u.useCases),
    audienceSize: u.audienceSize,
    onboardingCompleted: u.onboardingCompleted,
    createdAt: u.createdAt.toISOString(),
    updatedAt: u.updatedAt.toISOString(),
  }
}

function mapSession(s: {
  id: string
  title: string
  description: string | null
  joinCode: string
  status: SessionStatus
  createdAt: Date
  updatedAt: Date
  startedAt: Date | null
  endedAt: Date | null
  createdById: string
  settings: unknown
  activeQuestionId: string | null
}): SessionRecord {
  return {
    id: s.id,
    title: s.title,
    description: s.description,
    joinCode: s.joinCode,
    status: s.status,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
    startedAt: s.startedAt?.toISOString() ?? null,
    endedAt: s.endedAt?.toISOString() ?? null,
    createdById: s.createdById,
    settings: (s.settings ?? {}) as SessionSettings,
    activeQuestionId: s.activeQuestionId,
  }
}

function mapQuestion(q: {
  id: string
  sessionId: string
  type: QuestionType
  prompt: string
  config: unknown
  order: number
  status: QuestionStatus
  createdAt: Date
}): QuestionRecord {
  return {
    id: q.id,
    sessionId: q.sessionId,
    type: q.type,
    prompt: q.prompt,
    config: (q.config ?? {}) as QuestionConfig,
    order: q.order,
    status: q.status,
    createdAt: q.createdAt.toISOString(),
  }
}

export class PrismaStore implements Store {
  constructor(private prisma: PrismaClient) {}

  async upsertUserProfile(input: UpsertUserProfileInput): Promise<UserProfileRecord> {
    const u = await this.prisma.userProfile.upsert({
      where: { authUserId: input.authUserId },
      create: {
        authUserId: input.authUserId,
        email: input.email ?? null,
      },
      update: {
        email: input.email === undefined ? undefined : input.email,
      },
    })
    return mapUserProfile(u)
  }

  async getUserById(id: string) {
    const u = await this.prisma.userProfile.findUnique({ where: { id } })
    return u ? mapUserProfile(u) : null
  }

  async getUserByAuthId(authUserId: string) {
    const u = await this.prisma.userProfile.findUnique({ where: { authUserId } })
    return u ? mapUserProfile(u) : null
  }

  async updateUserProfile(id: string, patch: UpdateUserProfileInput) {
    const u = await this.prisma.userProfile.update({
      where: { id },
      data: {
        role: patch.role === undefined ? undefined : patch.role,
        useCases:
          patch.useCases === undefined
            ? undefined
            : (patch.useCases as unknown as Prisma.InputJsonValue),
        audienceSize: patch.audienceSize === undefined ? undefined : patch.audienceSize,
        onboardingCompleted:
          patch.onboardingCompleted === undefined ? undefined : patch.onboardingCompleted,
        email: patch.email === undefined ? undefined : patch.email,
      },
    })
    return mapUserProfile(u)
  }

  async createSession(data: Omit<SessionRecord, 'createdAt' | 'updatedAt' | 'startedAt' | 'endedAt' | 'activeQuestionId' | 'status'> & {
    status?: SessionStatus
  }) {
    const s = await this.prisma.session.create({
      data: {
        id: data.id,
        title: data.title,
        description: data.description,
        joinCode: data.joinCode,
        status: data.status ?? 'DRAFT',
        createdById: data.createdById,
        settings: data.settings as unknown as Prisma.InputJsonValue,
      },
    })
    return mapSession(s)
  }

  async updateSession(id: string, patch: Partial<SessionRecord>) {
    const s = await this.prisma.session.update({
      where: { id },
      data: {
        title: patch.title,
        description: patch.description,
        status: patch.status,
        startedAt: patch.startedAt === null ? null : patch.startedAt ? new Date(patch.startedAt) : undefined,
        endedAt: patch.endedAt === null ? null : patch.endedAt ? new Date(patch.endedAt) : undefined,
        activeQuestionId: patch.activeQuestionId,
        settings: patch.settings as unknown as Prisma.InputJsonValue | undefined,
      },
    })
    return mapSession(s)
  }

  async getSession(id: string) {
    const s = await this.prisma.session.findUnique({ where: { id } })
    return s ? mapSession(s) : null
  }

  async getSessionByJoinCode(code: string) {
    const s = await this.prisma.session.findUnique({ where: { joinCode: code.toUpperCase() } })
    return s ? mapSession(s) : null
  }

  async listSessionsByUser(userId: string) {
    const rows = await this.prisma.session.findMany({
      where: { createdById: userId },
      orderBy: { updatedAt: 'desc' },
    })
    return rows.map(mapSession)
  }

  async createQuestion(data: Omit<QuestionRecord, 'createdAt' | 'status'> & { status?: QuestionStatus }) {
    const q = await this.prisma.question.create({
      data: {
        id: data.id,
        sessionId: data.sessionId,
        type: data.type,
        prompt: data.prompt,
        config: data.config as unknown as Prisma.InputJsonValue,
        order: data.order,
        status: data.status ?? 'DRAFT',
      },
    })
    return mapQuestion(q)
  }

  async updateQuestion(id: string, patch: Partial<QuestionRecord>) {
    const q = await this.prisma.question.update({
      where: { id },
      data: {
        prompt: patch.prompt,
        type: patch.type,
        config: patch.config as unknown as Prisma.InputJsonValue | undefined,
        order: patch.order,
        status: patch.status,
      },
    })
    return mapQuestion(q)
  }

  async deleteQuestion(id: string) {
    await this.prisma.question.delete({ where: { id } })
  }

  async getQuestion(id: string) {
    const q = await this.prisma.question.findUnique({ where: { id } })
    return q ? mapQuestion(q) : null
  }

  async listQuestions(sessionId: string) {
    const rows = await this.prisma.question.findMany({
      where: { sessionId },
      orderBy: { order: 'asc' },
    })
    return rows.map(mapQuestion)
  }

  async reorderQuestions(sessionId: string, orderedIds: string[]) {
    await this.prisma.$transaction(
      orderedIds.map((id, order) =>
        this.prisma.question.updateMany({ where: { id, sessionId }, data: { order } }),
      ),
    )
    return this.listQuestions(sessionId)
  }

  async replaceOptions(questionId: string, options: { label: string; order: number }[]) {
    await this.prisma.questionOption.deleteMany({ where: { questionId } })
    await this.prisma.questionOption.createMany({
      data: options.map((o) => ({
        id: nanoid(),
        questionId,
        label: o.label,
        order: o.order,
      })),
    })
    return this.listOptions(questionId)
  }

  async listOptions(questionId: string): Promise<OptionRecord[]> {
    const rows = await this.prisma.questionOption.findMany({
      where: { questionId },
      orderBy: { order: 'asc' },
    })
    return rows.map((o) => ({ id: o.id, questionId: o.questionId, label: o.label, order: o.order }))
  }

  async createParticipant(data: Omit<ParticipantRecord, 'joinedAt' | 'leftAt'> & { joinedAt?: string }) {
    const p = await this.prisma.participant.create({
      data: {
        id: data.id,
        sessionId: data.sessionId,
        displayName: data.displayName,
        token: data.token,
      },
    })
    return {
      id: p.id,
      sessionId: p.sessionId,
      displayName: p.displayName,
      token: p.token,
      joinedAt: p.joinedAt.toISOString(),
      leftAt: p.leftAt?.toISOString() ?? null,
    }
  }

  async getParticipantByToken(token: string) {
    const p = await this.prisma.participant.findUnique({ where: { token } })
    if (!p) return null
    return {
      id: p.id,
      sessionId: p.sessionId,
      displayName: p.displayName,
      token: p.token,
      joinedAt: p.joinedAt.toISOString(),
      leftAt: p.leftAt?.toISOString() ?? null,
    }
  }

  async getParticipant(id: string) {
    const p = await this.prisma.participant.findUnique({ where: { id } })
    if (!p) return null
    return {
      id: p.id,
      sessionId: p.sessionId,
      displayName: p.displayName,
      token: p.token,
      joinedAt: p.joinedAt.toISOString(),
      leftAt: p.leftAt?.toISOString() ?? null,
    }
  }

  async countActiveParticipants(sessionId: string) {
    return this.prisma.participant.count({ where: { sessionId, leftAt: null } })
  }

  async listParticipants(sessionId: string) {
    const rows = await this.prisma.participant.findMany({ where: { sessionId } })
    return rows.map((p) => ({
      id: p.id,
      sessionId: p.sessionId,
      displayName: p.displayName,
      token: p.token,
      joinedAt: p.joinedAt.toISOString(),
      leftAt: p.leftAt?.toISOString() ?? null,
    }))
  }

  async createResponse(data: Omit<ResponseRecord, 'createdAt' | 'id'> & { id?: string }) {
    const r = await this.prisma.response.create({
      data: {
        id: data.id ?? nanoid(),
        sessionId: data.sessionId,
        questionId: data.questionId,
        participantId: data.participantId,
        value: data.value as unknown as Prisma.InputJsonValue,
      },
    })
    return {
      id: r.id,
      sessionId: r.sessionId,
      questionId: r.questionId,
      participantId: r.participantId,
      value: r.value,
      createdAt: r.createdAt.toISOString(),
    }
  }

  async getResponseByParticipantQuestion(participantId: string, questionId: string) {
    const r = await this.prisma.response.findUnique({
      where: { questionId_participantId: { questionId, participantId } },
    })
    if (!r) return null
    return {
      id: r.id,
      sessionId: r.sessionId,
      questionId: r.questionId,
      participantId: r.participantId,
      value: r.value,
      createdAt: r.createdAt.toISOString(),
    }
  }

  async listResponsesForQuestion(questionId: string) {
    const rows = await this.prisma.response.findMany({ where: { questionId } })
    return rows.map((r) => ({
      id: r.id,
      sessionId: r.sessionId,
      questionId: r.questionId,
      participantId: r.participantId,
      value: r.value,
      createdAt: r.createdAt.toISOString(),
    }))
  }

  async deleteResponsesForQuestion(questionId: string) {
    const res = await this.prisma.response.deleteMany({ where: { questionId } })
    return res.count
  }

  async countResponsesForQuestion(questionId: string) {
    return this.prisma.response.count({ where: { questionId } })
  }
}
