<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '@/services/api'
import { useSessionStore } from '@/stores/sessionStore'
import { useRealtime } from '@/composables/useRealtime'
import { useRealtimeStore } from '@/stores/realtimeStore'
import ConnectionPill from '@/components/session/ConnectionPill.vue'
import ContentSlideDisplay from '@/components/session/ContentSlideDisplay.vue'
import LiveResultsView from '@/components/results/LiveResultsView.vue'
import Button from '@/components/ui/Button.vue'
import type {
  ContentSlideConfig,
  LiveResults,
  LiveState,
  QuestionDTO,
  RealtimeEvent,
} from '@shared/types'
import { isContentSlide } from '@shared/types'
import { track } from '@/analytics'

const route = useRoute()
const router = useRouter()
const store = useSessionStore()
const realtimeStore = useRealtimeStore()
const sessionId = computed(() => route.params.sessionId as string)

const qrSvg = ref('')
const joinUrl = ref('')
const showResults = ref(true)
const activeQuestion = ref<QuestionDTO | null>(null)
const results = ref<LiveResults | null>(null)
const phase = ref<'lobby' | 'question'>('lobby')

const questions = computed(() => store.current?.questions ?? [])
const activeIndex = computed(() =>
  activeQuestion.value ? questions.value.findIndex((q) => q.id === activeQuestion.value!.id) : -1,
)
const activeIsContent = computed(() =>
  activeQuestion.value ? isContentSlide(activeQuestion.value.type) : false,
)
const activeContentConfig = computed(
  () => (activeQuestion.value?.config ?? {}) as Partial<ContentSlideConfig>,
)

async function refreshState() {
  const { state } = await api.liveState(sessionId.value)
  applyLiveState(state)
}

function applyLiveState(state: LiveState) {
  store.setSession(state.session)
  store.participantCount = state.participantCount
  activeQuestion.value = state.activeQuestion
  results.value = state.results
  phase.value = state.activeQuestion ? 'question' : 'lobby'
}

function onEvent(event: RealtimeEvent) {
  if (event.type === 'PARTICIPANT_JOINED' || event.type === 'PARTICIPANT_LEFT') {
    if (typeof event.participantCount === 'number') {
      store.participantCount = event.participantCount
    }
  }
  if (event.type === 'RESULTS_UPDATED' && event.payload?.results) {
    results.value = event.payload.results as LiveResults
  }
  if (event.type === 'QUESTION_STARTED') {
    void refreshState()
  }
  if (event.type === 'SESSION_UPDATED' && event.payload?.liveState) {
    applyLiveState(event.payload.liveState as LiveState)
  }
  if (event.type === 'SESSION_ENDED') {
    void router.push(`/app/sessions/${sessionId.value}/results`)
  }
}

const { connectionState } = useRealtime(() => sessionId.value, onEvent)
watch(connectionState, (s) => realtimeStore.setConnectionState(s))

onMounted(async () => {
  await store.load(sessionId.value)
  await api.openLobby(sessionId.value)
  const qr = await api.qr(sessionId.value)
  qrSvg.value = qr.svg
  joinUrl.value = qr.joinUrl
  await refreshState()
})

async function startAt(index: number) {
  const q = questions.value[index]
  if (!q) return
  const res = await api.startQuestion(sessionId.value, q.id)
  activeQuestion.value = res.question
  results.value = res.results
  store.setSession(res.session)
  phase.value = 'question'
  track('question_started', { questionId: q.id })
}

async function next() {
  const idx = activeIndex.value
  if (idx < 0) {
    await startAt(0)
    return
  }
  if (idx < questions.value.length - 1) await startAt(idx + 1)
}

async function prev() {
  const idx = activeIndex.value
  if (idx > 0) await startAt(idx - 1)
}

async function toggleClose() {
  if (!activeQuestion.value) return
  if (activeQuestion.value.status === 'ACTIVE') {
    await api.closeQuestion(sessionId.value, activeQuestion.value.id)
    activeQuestion.value = { ...activeQuestion.value, status: 'CLOSED' }
    showResults.value = true
  } else {
    await api.reopenQuestion(sessionId.value, activeQuestion.value.id)
    activeQuestion.value = { ...activeQuestion.value, status: 'ACTIVE' }
  }
}

async function clear() {
  if (!activeQuestion.value) return
  const res = await api.clearResponses(sessionId.value, activeQuestion.value.id)
  results.value = res.results
}

async function end() {
  await api.endSession(sessionId.value)
  track('session_completed', { sessionId: sessionId.value })
  await router.push(`/app/sessions/${sessionId.value}/results`)
}

function onKey(e: KeyboardEvent) {
  if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
  if (e.code === 'Space' || e.key === 'ArrowRight') {
    e.preventDefault()
    void next()
  }
  if (e.key === 'ArrowLeft') void prev()
  if (e.key.toLowerCase() === 'c') void toggleClose()
  if (e.key.toLowerCase() === 'e') void end()
}

onMounted(() => window.addEventListener('keydown', onKey))
onUnmounted(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <div class="min-h-screen text-white relative overflow-hidden bg-pulse-deep">
    <div
      class="absolute inset-0 bg-gradient-to-br from-[#0b1220] via-[#0f766e] to-[#14b8a6] opacity-95"
      aria-hidden="true"
    />
    <div
      class="pointer-events-none absolute inset-0 opacity-40"
      style="
        background:
          radial-gradient(ellipse 50% 40% at 20% 20%, rgba(45, 212, 191, 0.35), transparent 70%),
          radial-gradient(ellipse 45% 35% at 80% 70%, rgba(20, 184, 166, 0.25), transparent 70%);
      "
      aria-hidden="true"
    />

    <div class="relative z-10 flex min-h-screen flex-col">
      <header class="flex items-center justify-between px-6 py-4">
        <div class="flex items-center gap-4">
          <span class="text-xl font-extrabold">Pulse</span>
          <span class="opacity-80">{{ store.current?.title }}</span>
          <span
            v-if="phase === 'question'"
            class="rounded-full bg-red-500/90 px-3 py-1 text-xs font-bold"
          >
            LIVE
          </span>
        </div>
        <div class="flex items-center gap-3">
          <ConnectionPill :state="connectionState" />
          <span class="text-sm font-medium">{{ store.participantCount }} participants</span>
          <Button variant="secondary" class="!text-pulse-ink" @click="end">End</Button>
        </div>
      </header>

      <!-- Lobby -->
      <main v-if="phase === 'lobby'" class="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <p class="text-xl sm:text-2xl font-medium opacity-90">Join at</p>
        <p class="mt-2 text-2xl sm:text-3xl font-bold">{{ joinUrl.replace(/^https?:\/\//, '') }}</p>
        <p class="mt-10 text-sm uppercase tracking-[0.35em] opacity-80">Code</p>
        <p class="mt-3 text-6xl sm:text-8xl font-black tracking-[0.2em]">
          {{ store.current?.joinCode }}
        </p>
        <div class="mt-10 grid gap-8 sm:grid-cols-2 items-center">
          <div class="bg-white rounded-2xl p-4 text-pulse-ink" v-html="qrSvg" />
          <div class="text-left sm:text-center">
            <p class="text-3xl font-bold">{{ store.participantCount }}</p>
            <p class="opacity-80">participants joined</p>
            <Button class="mt-6 !bg-white !text-pulse-purple" @click="next">Start presentation</Button>
          </div>
        </div>
      </main>

      <!-- Question / content -->
      <main v-else class="flex flex-1 flex-col items-center justify-center px-6 pb-28">
        <p class="text-sm uppercase tracking-widest opacity-80 mb-4">
          {{ activeIsContent ? 'Slide' : 'Question' }} {{ activeIndex + 1 }} of {{ questions.length }}
        </p>

        <div
          v-if="activeIsContent && activeQuestion"
          class="w-full max-w-5xl rounded-3xl bg-white/95 p-8 sm:p-10 text-pulse-ink shadow-soft"
        >
          <ContentSlideDisplay
            :type="activeQuestion.type"
            :title="activeQuestion.prompt"
            :config="activeContentConfig"
            tone="light"
          />
        </div>

        <template v-else>
          <h2 class="max-w-4xl text-center text-3xl sm:text-5xl font-extrabold leading-tight">
            {{ activeQuestion?.prompt }}
          </h2>
          <div class="mt-12 w-full max-w-4xl text-pulse-ink">
            <div v-if="showResults && results" class="rounded-3xl bg-white/95 p-8 shadow-soft">
              <LiveResultsView :results="results" large />
            </div>
            <p v-else class="text-center text-white/80 text-xl">Responses hidden</p>
          </div>
        </template>
      </main>

      <footer class="absolute bottom-0 inset-x-0 bg-black/20 backdrop-blur px-4 py-3">
        <div class="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 text-sm">
          <div class="flex flex-wrap gap-2">
            <Button variant="secondary" class="!text-pulse-ink !py-2" @click="prev">Previous</Button>
            <Button variant="secondary" class="!text-pulse-ink !py-2" @click="next">Next</Button>
            <template v-if="!activeIsContent">
              <Button variant="secondary" class="!text-pulse-ink !py-2" @click="toggleClose">
                {{ activeQuestion?.status === 'ACTIVE' ? 'Close responses' : 'Reopen' }}
              </Button>
              <Button variant="secondary" class="!text-pulse-ink !py-2" @click="clear">Clear</Button>
              <Button variant="secondary" class="!text-pulse-ink !py-2" @click="showResults = !showResults">
                {{ showResults ? 'Hide results' : 'Show results' }}
              </Button>
            </template>
          </div>
          <p class="opacity-70 text-xs">Space next · ← → · E end</p>
        </div>
      </footer>
    </div>
  </div>
</template>
