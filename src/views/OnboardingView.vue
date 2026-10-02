<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BrandMark from '@/components/ui/BrandMark.vue'
import Button from '@/components/ui/Button.vue'
import {
  AUDIENCE_SIZE_OPTIONS,
  ROLE_OPTIONS,
  USE_CASE_OPTIONS,
} from '@shared/onboarding'
import { safeAppPath } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

const step = ref(0)
const useCases = ref<string[]>([])
const audienceSize = ref<string | null>(null)
const role = ref<string | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

const nextPath = computed(() => safeAppPath(route.query.next, '/app/sessions/new'))

onMounted(async () => {
  await auth.init()
  if (!auth.isAuthenticated) {
    await router.replace({ path: '/auth', query: { next: nextPath.value } })
    return
  }
  if (auth.profileStatus !== 'ready') {
    try {
      await auth.refreshProfile()
    } catch {
      error.value = 'Could not load your profile. Refresh and try again.'
      return
    }
  }
  if (auth.onboardingCompleted) {
    await router.replace(nextPath.value)
  }
})

function toggleUseCase(value: string) {
  if (useCases.value.includes(value)) {
    useCases.value = useCases.value.filter((item) => item !== value)
  } else {
    useCases.value = [...useCases.value, value]
  }
}

function canContinue() {
  if (step.value === 0) return useCases.value.length > 0
  if (step.value === 1) return Boolean(audienceSize.value)
  return Boolean(role.value)
}

async function next() {
  if (!canContinue()) return
  if (step.value < 2) {
    step.value += 1
    return
  }
  loading.value = true
  error.value = null
  try {
    await auth.completeOnboarding({
      useCases: useCases.value,
      audienceSize: audienceSize.value!,
      role: role.value!,
    })
    await router.replace(nextPath.value)
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Could not save preferences'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="app-shell flex items-center justify-center px-4 py-10">
    <div class="app-shell-bg" aria-hidden="true" />
    <div class="relative z-10 w-full max-w-lg card p-8 sm:p-10">
      <BrandMark to="/" size="sm" />
      <p class="mt-6 text-xs font-semibold uppercase tracking-[0.14em] text-pulse-muted">
        Step {{ step + 1 }} of 3
      </p>

      <template v-if="step === 0">
        <h1 class="mt-2 text-2xl font-bold tracking-tight">How will you use Pulse?</h1>
        <p class="mt-2 text-sm text-pulse-muted">Pick all that apply — you can change this later.</p>
        <div class="mt-6 flex flex-wrap gap-2">
          <button
            v-for="option in USE_CASE_OPTIONS"
            :key="option"
            type="button"
            class="rounded-full border px-4 py-2 text-sm font-medium transition"
            :class="
              useCases.includes(option)
                ? 'border-pulse-purple bg-pulse-soft text-pulse-ink'
                : 'border-pulse-border bg-white text-pulse-muted hover:border-pulse-purple'
            "
            @click="toggleUseCase(option)"
          >
            {{ option }}
          </button>
        </div>
      </template>

      <template v-else-if="step === 1">
        <h1 class="mt-2 text-2xl font-bold tracking-tight">How many people usually join?</h1>
        <p class="mt-2 text-sm text-pulse-muted">We’ll tune defaults for your typical room size.</p>
        <div class="mt-6 grid gap-2 sm:grid-cols-2">
          <button
            v-for="option in AUDIENCE_SIZE_OPTIONS"
            :key="option"
            type="button"
            class="rounded-2xl border px-4 py-3 text-left text-sm font-medium transition"
            :class="
              audienceSize === option
                ? 'border-pulse-purple bg-pulse-soft'
                : 'border-pulse-border bg-white hover:border-pulse-purple'
            "
            @click="audienceSize = option"
          >
            {{ option }}
          </button>
        </div>
      </template>

      <template v-else>
        <h1 class="mt-2 text-2xl font-bold tracking-tight">What’s your role?</h1>
        <p class="mt-2 text-sm text-pulse-muted">Helps us understand who’s using Pulse.</p>
        <div class="mt-6 grid gap-2 sm:grid-cols-2">
          <button
            v-for="option in ROLE_OPTIONS"
            :key="option"
            type="button"
            class="rounded-2xl border px-4 py-3 text-left text-sm font-medium transition"
            :class="
              role === option
                ? 'border-pulse-purple bg-pulse-soft'
                : 'border-pulse-border bg-white hover:border-pulse-purple'
            "
            @click="role = option"
          >
            {{ option }}
          </button>
        </div>
      </template>

      <p v-if="error" class="mt-4 text-sm text-pulse-danger">{{ error }}</p>

      <div class="mt-8 flex gap-2">
        <Button
          v-if="step > 0"
          variant="secondary"
          :disabled="loading"
          @click="step -= 1"
        >
          Back
        </Button>
        <Button class="flex-1" :disabled="loading || !canContinue()" @click="next">
          {{ step === 2 ? 'Finish' : 'Continue' }}
          <span aria-hidden="true">→</span>
        </Button>
      </div>
    </div>
  </div>
</template>
