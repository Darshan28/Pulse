<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import BrandMark from '@/components/ui/BrandMark.vue'
import Button from '@/components/ui/Button.vue'
import Input from '@/components/ui/Input.vue'
import { useSessionStore } from '@/stores/sessionStore'

const title = ref('')
const description = ref('')
const loading = ref(false)
const error = ref<string | null>(null)
const store = useSessionStore()
const router = useRouter()

async function create() {
  if (!title.value.trim()) {
    error.value = 'Add a title for your presentation.'
    return
  }
  loading.value = true
  error.value = null
  try {
    const session = await store.create(title.value.trim(), description.value.trim() || undefined)
    await router.push(`/app/sessions/${session.id}`)
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Could not create session'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="app-shell flex items-center justify-center px-4 py-10">
    <div class="app-shell-bg" aria-hidden="true" />
    <div class="relative z-10 card w-full max-w-lg p-8 sm:p-10">
      <BrandMark to="/app/sessions" size="sm" />
      <h1 class="mt-6 text-2xl font-bold tracking-tight sm:text-3xl">New presentation</h1>
      <p class="mt-2 text-sm text-pulse-muted">Give your session a clear title so the room knows what’s coming.</p>
      <form class="mt-7 space-y-4" @submit.prevent="create">
        <Input v-model="title" label="Session title" placeholder="NextGen UX Feedback" />
        <label class="block space-y-2">
          <span class="text-sm font-medium">Description (optional)</span>
          <textarea
            v-model="description"
            class="input min-h-24"
            placeholder="Optional context for your team"
          />
        </label>
        <p v-if="error" class="text-sm text-pulse-danger">{{ error }}</p>
        <div class="flex flex-col gap-2 pt-1 sm:flex-row">
          <Button type="submit" class="w-full sm:flex-1" :disabled="loading">
            Create session <span aria-hidden="true">→</span>
          </Button>
          <Button
            type="button"
            variant="secondary"
            class="w-full sm:w-auto"
            :disabled="loading"
            @click="router.push('/app/sessions')"
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  </div>
</template>
