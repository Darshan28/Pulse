<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { setAuthIntent } from '@/lib/supabase'
import { api, setParticipantToken } from '@/services/api'
import { useAuthStore } from '@/stores/authStore'

const auth = useAuthStore()
const router = useRouter()
const presenterUrl = ref('')
const p1Url = ref('')
const p2Url = ref('')
const error = ref<string | null>(null)
const ready = ref(false)

onMounted(async () => {
  try {
    await auth.init()
    if (!auth.isAuthenticated) {
      setAuthIntent('/demo')
      await router.replace({ path: '/auth', query: { next: '/demo' } })
      return
    }
    if (!auth.onboardingCompleted) {
      await router.replace({ path: '/onboarding', query: { next: '/demo' } })
      return
    }

    const created = await api.createSession('Demo: Feel the room', 'Multi-pane demo session')
    const sessionId = created.session.id
    await api.createQuestion(sessionId, {
      type: 'MULTIPLE_CHOICE',
      prompt: 'What is your biggest pain point?',
      options: ['Navigation', 'Performance', 'Too many clicks', 'Missing features'],
    })
    await api.createQuestion(sessionId, {
      type: 'RATING',
      prompt: 'How easy was the new experience?',
    })
    await api.createQuestion(sessionId, {
      type: 'WORD_CLOUD',
      prompt: 'Describe the product in one word',
    })

    const j1 = await api.join(created.session.joinCode, 'Alex')
    const token1 = j1.token
    const j2 = await api.join(created.session.joinCode, 'Sam')
    const token2 = j2.token

    presenterUrl.value = `/app/sessions/${sessionId}/present`
    p1Url.value = `/participant/${sessionId}?demoToken=${encodeURIComponent(token1)}`
    p2Url.value = `/participant/${sessionId}?demoToken=${encodeURIComponent(token2)}`

    setParticipantToken(token1)
    ready.value = true
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Demo setup failed'
  }
})
</script>

<template>
  <div class="min-h-screen bg-pulse-ink text-white p-3">
    <div class="mb-3 flex items-center justify-between">
      <h1 class="font-bold">Pulse Demo</h1>
      <p class="text-xs opacity-70">Presenter + 2 participants</p>
    </div>
    <p v-if="error" class="text-red-300">{{ error }}</p>
    <p v-else-if="!ready" class="opacity-70">Preparing demo session…</p>
    <div v-else class="grid h-[calc(100vh-4rem)] grid-cols-1 gap-3 lg:grid-cols-3">
      <iframe :src="presenterUrl" class="h-full w-full rounded-xl bg-white" title="Presenter" />
      <iframe :src="p1Url" class="h-full w-full rounded-xl bg-white" title="Participant 1" />
      <iframe :src="p2Url" class="h-full w-full rounded-xl bg-white" title="Participant 2" />
    </div>
  </div>
</template>
