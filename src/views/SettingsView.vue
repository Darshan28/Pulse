<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import BrandMark from '@/components/ui/BrandMark.vue'
import Button from '@/components/ui/Button.vue'
import {
  AUDIENCE_SIZE_OPTIONS,
  ROLE_OPTIONS,
  USE_CASE_OPTIONS,
} from '@shared/onboarding'
import { useAuthStore } from '@/stores/authStore'

const auth = useAuthStore()
const router = useRouter()

const useCases = ref<string[]>([])
const audienceSize = ref<string | null>(null)
const role = ref<string | null>(null)
const loading = ref(false)
const saved = ref(false)
const error = ref<string | null>(null)

onMounted(async () => {
  await auth.init()
  if (!auth.isAuthenticated) {
    await router.replace({ path: '/auth', query: { next: '/app/settings' } })
    return
  }
  useCases.value = [...(auth.profile?.useCases ?? [])]
  audienceSize.value = auth.profile?.audienceSize ?? null
  role.value = auth.profile?.role ?? null
})

function toggleUseCase(value: string) {
  if (useCases.value.includes(value)) {
    useCases.value = useCases.value.filter((item) => item !== value)
  } else {
    useCases.value = [...useCases.value, value]
  }
}

async function save() {
  loading.value = true
  error.value = null
  saved.value = false
  try {
    await auth.updatePreferences({
      useCases: useCases.value,
      audienceSize: audienceSize.value,
      role: role.value,
    })
    saved.value = true
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Could not save settings'
  } finally {
    loading.value = false
  }
}

async function logout() {
  await auth.signOut()
  await router.push('/')
}
</script>

<template>
  <div class="app-shell">
    <div class="app-shell-bg" aria-hidden="true" />
    <header class="relative z-10 border-b border-pulse-border/80 bg-white/80 backdrop-blur-md">
      <div class="mx-auto flex max-w-3xl items-center justify-between px-5 py-4 sm:px-6">
        <BrandMark to="/app/sessions" />
        <Button variant="ghost" @click="router.push('/app/sessions')">Back</Button>
      </div>
    </header>

    <main class="relative z-10 mx-auto max-w-3xl px-5 py-10 sm:px-6">
      <h1 class="text-3xl font-bold tracking-tight">Settings</h1>
      <p class="mt-2 text-pulse-muted">
        {{ auth.profile?.email || 'Your presenter preferences' }}
      </p>

      <section class="card mt-8 space-y-6 p-6 sm:p-8">
        <div>
          <h2 class="text-sm font-semibold">How will you use Pulse?</h2>
          <div class="mt-3 flex flex-wrap gap-2">
            <button
              v-for="option in USE_CASE_OPTIONS"
              :key="option"
              type="button"
              class="rounded-full border px-4 py-2 text-sm font-medium transition"
              :class="
                useCases.includes(option)
                  ? 'border-pulse-purple bg-pulse-soft'
                  : 'border-pulse-border bg-white text-pulse-muted'
              "
              @click="toggleUseCase(option)"
            >
              {{ option }}
            </button>
          </div>
        </div>

        <div>
          <h2 class="text-sm font-semibold">Audience size</h2>
          <div class="mt-3 grid gap-2 sm:grid-cols-2">
            <button
              v-for="option in AUDIENCE_SIZE_OPTIONS"
              :key="option"
              type="button"
              class="rounded-2xl border px-4 py-3 text-left text-sm font-medium"
              :class="
                audienceSize === option
                  ? 'border-pulse-purple bg-pulse-soft'
                  : 'border-pulse-border bg-white'
              "
              @click="audienceSize = option"
            >
              {{ option }}
            </button>
          </div>
        </div>

        <div>
          <h2 class="text-sm font-semibold">Role</h2>
          <div class="mt-3 grid gap-2 sm:grid-cols-2">
            <button
              v-for="option in ROLE_OPTIONS"
              :key="option"
              type="button"
              class="rounded-2xl border px-4 py-3 text-left text-sm font-medium"
              :class="
                role === option
                  ? 'border-pulse-purple bg-pulse-soft'
                  : 'border-pulse-border bg-white'
              "
              @click="role = option"
            >
              {{ option }}
            </button>
          </div>
        </div>

        <p v-if="error" class="text-sm text-pulse-danger">{{ error }}</p>
        <p v-if="saved" class="text-sm text-pulse-purple">Preferences saved.</p>

        <div class="flex flex-wrap gap-2 pt-2">
          <Button :disabled="loading" @click="save">Save preferences</Button>
          <Button variant="secondary" :disabled="loading" @click="logout">Log out</Button>
        </div>
      </section>
    </main>
  </div>
</template>
