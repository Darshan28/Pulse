<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api, getParticipantToken } from '@/services/api'
import { useRealtime } from '@/composables/useRealtime'
import BrandMark from '@/components/ui/BrandMark.vue'
import ParticipantQuestion from '@/components/participant/ParticipantQuestion.vue'
import ContentSlideDisplay from '@/components/session/ContentSlideDisplay.vue'
import ConnectionPill from '@/components/session/ConnectionPill.vue'
import type {
  ContentSlideConfig,
  LiveState,
  QuestionDTO,
  RealtimeEvent,
  SessionDTO,
} from '@shared/types'
import { isContentSlide } from '@shared/types'
import { track } from '@/analytics'
import { ApiClientError } from '@/services/api'

const route = useRoute()
const router = useRouter()
const sessionId = computed(() => route.params.sessionId as string)

const session = ref<SessionDTO | null>(null)
const activeQuestion = ref<QuestionDTO | null>(null)
const submittedFor = ref<Set<string>>(new Set())
const error = ref<string | null>(null)
const status = ref<'waiting' | 'question' | 'submitted' | 'ended'>('waiting')

async function refresh() {
  const { state } = await api.liveState(sessionId.value)
  apply(state)
}

function apply(state: LiveState) {
  session.value = state.session
  if (state.session.status === 'ENDED') {
    status.value = 'ended'
    activeQuestion.value = null
    return
  }
  activeQuestion.value = state.activeQuestion
  if (!state.activeQuestion || state.activeQuestion.status !== 'ACTIVE') {
    status.value = 'waiting'
    return
  }
  if (submittedFor.value.has(state.activeQuestion.id)) {
    status.value = 'submitted'
  } else {
    status.value = 'question'
  }
}

function onEvent(event: RealtimeEvent) {
  if (
    event.type === 'QUESTION_STARTED' ||
    event.type === 'QUESTION_CLOSED' ||
    event.type === 'SESSION_UPDATED' ||
    event.type === 'SESSION_ENDED'
  ) {
    if (event.payload?.liveState) apply(event.payload.liveState as LiveState)
    else void refresh()
  }
}

const { connectionState } = useRealtime(() => sessionId.value, onEvent)

onMounted(async () => {
  const demoToken = typeof route.query.demoToken === 'string' ? route.query.demoToken : null
  if (demoToken) {
    const { setParticipantToken } = await import('@/services/api')
    setParticipantToken(demoToken)
  }
  if (!getParticipantToken()) {
    await router.replace('/join')
    return
  }
  await refresh()
})

watch(
  () => activeQuestion.value?.id,
  () => {
    if (activeQuestion.value && !submittedFor.value.has(activeQuestion.value.id)) {
      status.value = 'question'
    }
  },
)

const progress = computed(() => {
  if (!activeQuestion.value || !session.value) return ''
  const total = session.value.questionCount || 1
  const current = activeQuestion.value.order + 1
  const label = isContentSlide(activeQuestion.value.type) ? 'Slide' : 'Question'
  return `${label} ${current} of ${total}`
})

const activeIsContent = computed(() =>
  activeQuestion.value ? isContentSlide(activeQuestion.value.type) : false,
)
const activeContentConfig = computed(
  () => (activeQuestion.value?.config ?? {}) as Partial<ContentSlideConfig>,
)

async function submit(value: unknown) {
  if (!activeQuestion.value) return
  error.value = null
  try {
    await api.submitResponse(activeQuestion.value.id, value)
    submittedFor.value = new Set([...submittedFor.value, activeQuestion.value.id])
    status.value = 'submitted'
    track('response_submitted', { questionId: activeQuestion.value.id })
  } catch (e) {
    error.value = e instanceof ApiClientError ? e.message : 'Could not submit'
    if (e instanceof ApiClientError && e.code === 'DUPLICATE_SUBMISSION') {
      submittedFor.value = new Set([...submittedFor.value, activeQuestion.value.id])
      status.value = 'submitted'
    }
  }
}
</script>

<template>
  <div class="app-shell px-4 py-6">
    <div class="app-shell-bg" aria-hidden="true" />
    <div class="relative z-10 mx-auto max-w-lg">
      <div class="mb-6 flex items-center justify-between">
        <BrandMark to="/join" size="sm" />
        <ConnectionPill :state="connectionState" />
      </div>

      <p class="text-sm text-pulse-muted">{{ session?.title }}</p>
      <p v-if="progress" class="mt-1 text-xs font-semibold uppercase tracking-[0.08em] text-pulse-magenta">
        {{ progress }}
      </p>

      <div v-if="status === 'ended'" class="card mt-10 p-8 text-center">
        <p class="text-2xl font-bold tracking-tight">Session ended</p>
        <p class="mt-2 text-pulse-muted">Thanks for participating.</p>
      </div>

      <div v-else-if="status === 'waiting'" class="card mt-10 p-8 text-center">
        <div class="mx-auto h-12 w-12 rounded-full border-4 border-pulse-purple border-t-transparent animate-spin" />
        <p class="mt-6 text-xl font-semibold tracking-tight">Waiting for the next question…</p>
      </div>

      <div v-else-if="status === 'submitted'" class="card mt-10 p-8 text-center">
        <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-pulse-soft text-3xl text-pulse-magenta">
          ✓
        </div>
        <p class="mt-6 text-xl font-bold tracking-tight">Response recorded</p>
        <p class="mt-2 text-pulse-muted">Waiting for the next question…</p>
      </div>

      <div v-else-if="activeQuestion && activeIsContent" class="card mt-6 p-5 sm:p-6">
        <ContentSlideDisplay
          :type="activeQuestion.type"
          :title="activeQuestion.prompt"
          :config="activeContentConfig"
        />
        <p class="mt-5 text-center text-sm text-pulse-muted">
          Follow along on the presenter’s screen
        </p>
      </div>

      <div v-else-if="activeQuestion" class="card mt-6 p-5 sm:p-6">
        <ParticipantQuestion :question="activeQuestion" @submit="submit" />
        <p v-if="error" class="mt-3 text-sm text-pulse-danger" role="alert">{{ error }}</p>
      </div>
    </div>
  </div>
</template>
