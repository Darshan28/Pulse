<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import LiveResultsView from '@/components/results/LiveResultsView.vue'
import { api } from '@/services/api'
import { isContentSlide, type LiveResults, type QuestionDTO } from '@shared/types'

const props = defineProps<{
  sessionId: string
  questions: QuestionDTO[]
  participantCount?: number
  title?: string
}>()

const rows = ref<Array<{ questionId: string; prompt: string; results: LiveResults }>>([])
const loading = ref(false)
const error = ref('')

async function load() {
  loading.value = true
  error.value = ''
  try {
    const interactive = props.questions.filter((q) => !isContentSlide(q.type))
    const next = []
    for (const q of interactive) {
      const { results } = await api.questionResults(props.sessionId, q.id)
      next.push({ questionId: q.id, prompt: q.prompt, results })
    }
    rows.value = next
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Could not load results'
  } finally {
    loading.value = false
  }
}

function exportCsv() {
  void api.exportCsv(props.sessionId)
}

async function shareResults() {
  const url = `${window.location.origin}/app/sessions/${props.sessionId}?tab=results`
  try {
    if (navigator.share) {
      await navigator.share({ title: props.title || 'Pulse results', url })
    } else {
      await navigator.clipboard.writeText(url)
    }
  } catch {
    await navigator.clipboard.writeText(url)
  }
}

onMounted(() => {
  void load()
})

watch(
  () => [props.sessionId, props.questions.map((q) => q.id).join(',')],
  () => {
    void load()
  },
)
</script>

<template>
  <div class="editor-results">
    <div class="editor-results__toolbar">
      <div class="editor-results__meta">
        <h2 class="editor-results__heading">Results</h2>
        <p class="editor-results__sub">
          {{ participantCount ?? 0 }} participants · {{ rows.length }} questions
        </p>
      </div>
      <div class="editor-results__actions">
        <button type="button" class="editor-results__btn editor-results__btn--ghost" @click="shareResults">
          Share results
        </button>
        <button type="button" class="editor-results__btn editor-results__btn--primary" @click="exportCsv">
          Export CSV
        </button>
      </div>
    </div>

    <div class="editor-results__list">
      <p v-if="loading" class="editor-results__status">Loading results…</p>
      <p v-else-if="error" class="editor-results__status editor-results__status--error">{{ error }}</p>
      <p v-else-if="!rows.length" class="editor-results__status">No interactive questions yet.</p>

      <section v-for="row in rows" :key="row.questionId" class="editor-results__card">
        <h3 class="editor-results__prompt">{{ row.prompt }}</h3>
        <LiveResultsView :results="row.results" />
      </section>
    </div>
  </div>
</template>

<style scoped>
.editor-results {
  display: flex;
  flex-direction: column;
  min-height: 0;
  flex: 1;
  overflow: auto;
  background: #f2f1f0;
}

.editor-results__toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.25rem 1.5rem 0.75rem;
  max-width: 52rem;
  width: 100%;
  margin: 0 auto;
}

.editor-results__heading {
  margin: 0;
  font-size: 1.35rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--pulse-ink);
}

.editor-results__sub {
  margin: 0.25rem 0 0;
  font-size: 0.85rem;
  color: var(--pulse-muted);
}

.editor-results__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
}

.editor-results__btn {
  border: 0;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 600;
  border-radius: 999px;
  padding: 0.5rem 0.95rem;
}

.editor-results__btn--ghost {
  background: white;
  color: var(--pulse-ink);
  border: 1px solid var(--pulse-border);
}

.editor-results__btn--primary {
  background: var(--pulse-purple);
  color: white;
}

.editor-results__list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 0.75rem 1.5rem 2rem;
  max-width: 52rem;
  width: 100%;
  margin: 0 auto;
}

.editor-results__card {
  background: white;
  border: 1px solid color-mix(in srgb, var(--pulse-border) 80%, transparent);
  border-radius: 0.85rem;
  padding: 1.25rem 1.4rem 1.4rem;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
}

.editor-results__prompt {
  margin: 0 0 1.1rem;
  font-size: 1.05rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--pulse-ink);
}

.editor-results__status {
  margin: 1.5rem 0;
  text-align: center;
  color: var(--pulse-muted);
  font-size: 0.9rem;
}

.editor-results__status--error {
  color: #dc2626;
}
</style>
