<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import BrandMark from '@/components/ui/BrandMark.vue'
import Button from '@/components/ui/Button.vue'
import { useAuthStore } from '@/stores/authStore'
import { useSessionStore } from '@/stores/sessionStore'

const store = useSessionStore()
const auth = useAuthStore()
const router = useRouter()

onMounted(() => {
  void store.fetchSessions()
})

async function logout() {
  await auth.signOut()
  await router.push('/')
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}
</script>

<template>
  <div class="app-shell">
    <div class="app-shell-bg" aria-hidden="true" />

    <header class="relative z-10 border-b border-pulse-border/80 bg-white/80 backdrop-blur-md">
      <div class="mx-auto flex max-w-5xl items-center justify-between gap-3 px-5 py-4 sm:px-6">
        <BrandMark />
        <div class="flex flex-wrap items-center gap-2">
          <Button variant="ghost" @click="router.push('/app/settings')">Settings</Button>
          <Button variant="secondary" @click="logout">Log out</Button>
          <Button @click="router.push('/app/sessions/new')">
            + New presentation
          </Button>
        </div>
      </div>
    </header>

    <main class="relative z-10 mx-auto max-w-5xl px-5 py-10 sm:px-6">
      <h1 class="text-3xl font-bold tracking-tight sm:text-4xl">Your presentations</h1>
      <p class="mt-2 text-pulse-muted">Create, edit, and present live sessions.</p>

      <div v-if="store.loading" class="mt-10 text-pulse-muted">Loading…</div>

      <div v-else-if="!store.sessions.length" class="card mt-10 p-10 text-center sm:p-12">
        <div
          class="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-pulse-soft text-pulse-magenta"
          aria-hidden="true"
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 5v14M5 12h14"
              stroke="currentColor"
              stroke-width="2.2"
              stroke-linecap="round"
            />
          </svg>
        </div>
        <p class="mt-5 text-lg font-semibold">No presentations yet</p>
        <p class="mt-2 text-pulse-muted">Create your first session to feel the room.</p>
        <Button class="mt-6" @click="router.push('/app/sessions/new')">
          Create presentation <span aria-hidden="true">→</span>
        </Button>
      </div>

      <ul v-else class="mt-8 space-y-3">
        <li
          v-for="s in store.sessions"
          :key="s.id"
          class="card flex flex-col gap-4 p-5 transition hover:border-pulse-purple hover:shadow-glow sm:flex-row sm:items-center sm:justify-between"
        >
          <div class="min-w-0">
            <button
              class="text-left text-lg font-bold tracking-tight transition hover:text-pulse-magenta"
              @click="router.push(`/app/sessions/${s.id}`)"
            >
              {{ s.title }}
            </button>
            <p class="mt-1 text-sm text-pulse-muted">
              {{ s.participantCount }} participants · {{ s.questionCount }} slides ·
              {{ formatDate(s.updatedAt) }}
            </p>
          </div>
          <div class="flex flex-wrap gap-2">
            <Button variant="secondary" @click="router.push(`/app/sessions/${s.id}`)">Edit</Button>
            <Button @click="router.push(`/app/sessions/${s.id}/present`)">Present</Button>
          </div>
        </li>
      </ul>
    </main>
  </div>
</template>
