<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import BrandMark from '@/components/ui/BrandMark.vue'
import Button from '@/components/ui/Button.vue'
import LiveResultsView from '@/components/results/LiveResultsView.vue'
import { api } from '@/services/api'
import { useSessionStore } from '@/stores/sessionStore'
import type { LiveResults } from '@shared/types'

const route = useRoute()
const store = useSessionStore()
const sessionId = route.params.sessionId as string
const perQuestion = ref<Array<{ questionId: string; prompt: string; results: LiveResults }>>([])

onMounted(async () => {
  await store.load(sessionId)
  const qs = store.current?.questions ?? []
  const rows = []
  for (const q of qs) {
    const { results } = await api.liveState(sessionId).then(async () => {
      const res = await fetch(`/api/sessions/${sessionId}/questions/${q.id}/results`, {
        credentials: 'include',
      })
      return res.json() as Promise<{ results: LiveResults }>
    })
    rows.push({ questionId: q.id, prompt: q.prompt, results })
  }
  perQuestion.value = rows
})

function exportCsv() {
  void api.exportCsv(sessionId)
}

async function share() {
  const url = window.location.href
  if (navigator.share) {
    await navigator.share({ title: store.current?.title, url })
  } else {
    await navigator.clipboard.writeText(url)
    alert('Results link copied')
  }
}
</script>

<template>
  <div class="app-shell">
    <div class="app-shell-bg" aria-hidden="true" />

    <header class="relative z-10 border-b border-pulse-border/80 bg-white/80 backdrop-blur-md">
      <div class="mx-auto flex max-w-4xl flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div class="min-w-0">
          <BrandMark to="/app/sessions" size="sm" />
          <h1 class="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">{{ store.current?.title }}</h1>
          <p class="mt-1 text-sm text-pulse-muted">
            {{ store.current?.participantCount }} participants · {{ store.current?.questionCount }} questions
          </p>
        </div>
        <div class="flex flex-wrap gap-2">
          <Button variant="secondary" @click="share">Share results</Button>
          <Button @click="exportCsv">Export CSV</Button>
        </div>
      </div>
    </header>

    <main class="relative z-10 mx-auto max-w-4xl space-y-5 px-5 py-8 sm:px-6 sm:py-10">
      <section
        v-for="row in perQuestion"
        :key="row.questionId"
        class="card p-5 sm:p-7"
      >
        <h2 class="mb-5 text-lg font-bold tracking-tight sm:text-xl">{{ row.prompt }}</h2>
        <LiveResultsView :results="row.results" />
      </section>
      <p v-if="!perQuestion.length" class="text-pulse-muted">Loading results…</p>
    </main>
  </div>
</template>
