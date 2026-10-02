<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import EditorTopBar from '@/components/editor/EditorTopBar.vue'
import EditorSlideRail from '@/components/editor/EditorSlideRail.vue'
import EditorCanvas from '@/components/editor/EditorCanvas.vue'
import EditorEditPanel from '@/components/editor/EditorEditPanel.vue'
import EditorIconRail from '@/components/editor/EditorIconRail.vue'
import EditorTypePicker from '@/components/editor/EditorTypePicker.vue'
import EditorResultsPane from '@/components/editor/EditorResultsPane.vue'
import { api } from '@/services/api'
import { useSessionStore } from '@/stores/sessionStore'
import type { QuestionType } from '@shared/types'
import { track } from '@/analytics'

const route = useRoute()
const router = useRouter()
const store = useSessionStore()
const sessionId = computed(() => route.params.sessionId as string)
const editorMode = computed<'create' | 'results'>(() =>
  route.query.tab === 'results' ? 'results' : 'create',
)

const selectedId = ref<string | null>(null)
const saving = ref(false)
const savedFlash = ref(false)
const shareFlash = ref(false)
const typePickerOpen = ref(false)
const panelOpen = ref(route.query.edit !== '0')
const promptFocused = ref(false)
const showJoiningInfo = ref(true)
const showLogo = ref(true)

const draftPrompt = ref('')
const draftOptions = ref<string[]>([])
const draftConfig = ref<Record<string, unknown>>({})

const questions = computed(() => store.current?.questions ?? [])
const selected = computed(() => questions.value.find((q) => q.id === selectedId.value) ?? null)
const selectedIndex = computed(() =>
  selected.value ? questions.value.findIndex((q) => q.id === selected.value!.id) + 1 : 0,
)

function selectSlide(id: string | null) {
  selectedId.value = id
  const slide = typeof route.query.slide === 'string' ? route.query.slide : null
  if (slide === id) return
  const query = { ...route.query }
  if (id) query.slide = id
  else delete query.slide
  void router.replace({ query })
}

function setPanelOpen(open: boolean) {
  panelOpen.value = open
  const closedInUrl = route.query.edit === '0'
  if (open === !closedInUrl) return
  const query = { ...route.query }
  if (open) delete query.edit
  else query.edit = '0'
  void router.replace({ query })
}

function setEditorMode(mode: 'create' | 'results') {
  if (editorMode.value === mode) return
  const query = { ...route.query }
  if (mode === 'results') query.tab = 'results'
  else delete query.tab
  void router.replace({ query })
}

onMounted(async () => {
  await store.load(sessionId.value)
  const fromQuery = typeof route.query.slide === 'string' ? route.query.slide : null
  const match = fromQuery && questions.value.some((q) => q.id === fromQuery)
  selectSlide(match ? fromQuery : questions.value[0]?.id ?? null)
})

watch(selected, (q) => {
  if (!q) return
  draftPrompt.value = q.prompt
  draftOptions.value = q.options.map((o) => o.label)
  draftConfig.value = { ...(q.config as Record<string, unknown>) }
})

async function addSlide(type: QuestionType) {
  typePickerOpen.value = false
  const res = await api.createQuestion(sessionId.value, { type })
  store.upsertQuestion(res.question)
  selectSlide(res.question.id)
  setPanelOpen(true)
  track('question_created', { type, sessionId: sessionId.value })
}

async function saveSelected() {
  if (!selected.value) return
  saving.value = true
  try {
    const res = await api.updateQuestion(sessionId.value, selected.value.id, {
      prompt: draftPrompt.value,
      options: draftOptions.value.filter((o) => o.trim()),
      config: {
        ...(selected.value.config as object),
        ...draftConfig.value,
      },
    })
    store.upsertQuestion(res.question)
    savedFlash.value = true
    window.setTimeout(() => {
      savedFlash.value = false
    }, 1400)
  } finally {
    saving.value = false
  }
}

async function removeSelected() {
  if (!selected.value) return
  await api.deleteQuestion(sessionId.value, selected.value.id)
  store.removeQuestion(selected.value.id)
  selectSlide(questions.value[0]?.id ?? null)
}

async function reorderSlides(orderedIds: string[]) {
  // Optimistic local reorder
  const byId = new Map(questions.value.map((q) => [q.id, q]))
  const next = orderedIds
    .map((id, order) => {
      const q = byId.get(id)
      return q ? { ...q, order } : null
    })
    .filter((q): q is NonNullable<typeof q> => Boolean(q))
  store.setQuestionOrder(next)

  try {
    const res = await api.reorderQuestions(sessionId.value, orderedIds)
    store.setQuestionOrder(res.questions)
  } catch {
    await store.load(sessionId.value)
  }
}

function addOption() {
  draftOptions.value.push(`Option ${draftOptions.value.length + 1}`)
}

function removeOption(i: number) {
  draftOptions.value.splice(i, 1)
  void saveSelected()
}

function toggleEditPanel() {
  setPanelOpen(!panelOpen.value)
}

async function shareSession() {
  const code = store.current?.joinCode
  if (!code) return
  const url = `${window.location.origin}/join/${code}`
  try {
    if (navigator.share) {
      await navigator.share({ title: store.current?.title || 'Pulse session', url })
    } else {
      await navigator.clipboard.writeText(url)
    }
  } catch {
    await navigator.clipboard.writeText(url)
  }
  shareFlash.value = true
  window.setTimeout(() => {
    shareFlash.value = false
  }, 1600)
}

function previewSession() {
  const code = store.current?.joinCode
  if (!code) return
  window.open(`/join/${code}`, '_blank', 'noopener,noreferrer')
}

function onTypeHint() {
  typePickerOpen.value = true
}
</script>

<template>
  <div class="editor">
    <EditorTopBar
      :title="store.current?.title || 'Presentation'"
      :join-code="store.current?.joinCode || ''"
      :saved-flash="savedFlash"
      :mode="editorMode"
      @create="setEditorMode('create')"
      @results="setEditorMode('results')"
      @share="shareSession"
      @preview="previewSession"
      @present="router.push(`/app/sessions/${sessionId}/present`)"
    />

    <EditorResultsPane
      v-if="editorMode === 'results'"
      :session-id="sessionId"
      :questions="questions"
      :participant-count="store.current?.participantCount"
      :title="store.current?.title"
    />

    <div v-else class="editor__body">
      <EditorSlideRail
        :questions="questions"
        :selected-id="selectedId"
        @select="selectSlide"
        @add="typePickerOpen = true"
        @reorder="reorderSlides"
      />

      <div class="editor__canvas-col" :class="{ 'is-panel-open': panelOpen }">
        <EditorCanvas
          class="editor__canvas"
          :selected="selected"
          :selected-index="selectedIndex"
          :draft-prompt="draftPrompt"
          :draft-options="draftOptions"
          :draft-config="draftConfig"
          :join-code="store.current?.joinCode || ''"
          :show-joining-info="showJoiningInfo"
          :show-logo="showLogo"
          :prompt-focused="promptFocused"
          @update:draft-prompt="draftPrompt = $event"
          @update:draft-options="draftOptions = $event"
          @update:draft-config="draftConfig = $event"
          @update:prompt-focused="promptFocused = $event"
          @save="saveSelected"
          @add-option="addOption"
          @remove-option="removeOption"
          @add-first="addSlide"
        >
          <template #tools>
            <EditorIconRail :active="panelOpen" @select="toggleEditPanel" />
          </template>
        </EditorCanvas>

        <div class="editor__panel-shell">
          <EditorEditPanel
            :selected="selected"
            :draft-config="draftConfig"
            :show-joining-info="showJoiningInfo"
            :show-logo="showLogo"
            :open="panelOpen"
            @update:draft-config="draftConfig = $event"
            @update:show-joining-info="showJoiningInfo = $event"
            @update:show-logo="showLogo = $event"
            @update:open="setPanelOpen"
            @change-type-hint="onTypeHint"
            @delete-slide="removeSelected"
            @save="saveSelected"
          />
        </div>
      </div>
    </div>

    <EditorTypePicker
      :open="typePickerOpen"
      @close="typePickerOpen = false"
      @pick="addSlide"
    />

    <div v-if="shareFlash" class="editor-toast" role="status">
      Join link copied
    </div>

    <span class="sr-only" aria-live="polite">{{ saving ? 'Saving' : '' }}</span>
  </div>
</template>

<style scoped>
.editor {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
  background: var(--pulse-bg);
}

.editor__body {
  position: relative;
  display: flex;
  min-height: 0;
  flex: 1;
  background: #f2f1f0;
}

.editor__canvas-col {
  position: relative;
  display: flex;
  min-width: 0;
  flex: 1;
  min-height: 0;
}

.editor__canvas {
  flex: 1;
  min-width: 0;
  transition: flex-basis 0.34s cubic-bezier(0.22, 1, 0.36, 1);
    background: #f2f1f0;
}

.editor__panel-shell {
  width: 0;
  flex-shrink: 0;
  overflow: hidden;
  opacity: 0;
  pointer-events: none;
  transition:
    width 0.34s cubic-bezier(0.22, 1, 0.36, 1),
    opacity 0.28s ease;
}

.editor__canvas-col.is-panel-open .editor__panel-shell {
  width: 17.5rem;
  opacity: 1;
  pointer-events: auto;
  margin: 1rem;
  border-radius: 0.5rem;
}

@media (prefers-reduced-motion: reduce) {
  .editor__canvas,
  .editor__panel-shell {
    transition: none;
  }
}

.editor-toast {
  position: fixed;
  left: 50%;
  bottom: 1.5rem;
  z-index: 90;
  transform: translateX(-50%);
  border-radius: 999px;
  background: var(--pulse-ink);
  color: white;
  font-size: 0.8rem;
  font-weight: 600;
  padding: 0.65rem 1.1rem;
  box-shadow: 0 12px 32px rgba(15, 23, 42, 0.22);
  animation: toast-in 0.25s ease-out both;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

@keyframes toast-in {
  from {
    opacity: 0;
    transform: translate(-50%, 8px);
  }
  to {
    opacity: 1;
    transform: translate(-50%, 0);
  }
}
</style>
