<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BrandMark from '@/components/ui/BrandMark.vue'
import Button from '@/components/ui/Button.vue'
import Input from '@/components/ui/Input.vue'
import { friendlyAuthError } from '@/lib/authErrors'
import {
  consumeAuthIntent,
  isSupabaseConfigured,
  peekAuthIntent,
  safeAppPath,
  setAuthIntent,
} from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

const email = ref('')
const loading = ref(false)
const magicSent = ref(false)
const error = ref<string | null>(null)
const supabaseReady = isSupabaseConfigured()

onMounted(async () => {
  await auth.init()
  const next = safeAppPath(
    typeof route.query.next === 'string' ? route.query.next : peekAuthIntent(),
  )
  setAuthIntent(next)

  if (auth.isAuthenticated) {
    await continueAfterAuth()
  }
})

async function continueAfterAuth() {
  if (auth.profileStatus !== 'ready') {
    try {
      await auth.refreshProfile()
    } catch {
      error.value = 'Could not load your profile. Refresh and try again.'
      return
    }
  }
  const intent = consumeAuthIntent(route.query.next)
  if (!auth.onboardingCompleted) {
    await router.replace({ path: '/onboarding', query: { next: intent } })
    return
  }
  await router.replace(intent)
}

async function google() {
  loading.value = true
  error.value = null
  try {
    await auth.signInWithGoogle()
  } catch (e) {
    error.value = friendlyAuthError(e, 'Google sign-in failed. Please try again.')
    loading.value = false
  }
}

async function sendMagicLink() {
  if (!email.value.trim() || !email.value.includes('@')) {
    error.value = 'Enter a valid email address.'
    return
  }
  loading.value = true
  error.value = null
  try {
    await auth.signInWithMagicLink(email.value)
    magicSent.value = true
  } catch (e) {
    error.value = friendlyAuthError(e, 'Could not send magic link. Please try again.')
  } finally {
    loading.value = false
  }
}

async function continueAsTestUser() {
  loading.value = true
  error.value = null
  try {
    await auth.signInAsTestUser()
    await continueAfterAuth()
  } catch (e) {
    error.value = friendlyAuthError(e, 'Test login failed. Is the API running?')
    loading.value = false
  }
}
</script>

<template>
  <div class="app-shell flex items-center justify-center px-4 py-10">
    <div class="app-shell-bg" aria-hidden="true" />
    <div class="relative z-10 w-full max-w-md card p-8 sm:p-10">
      <BrandMark to="/" size="sm" />
      <h1 class="mt-6 text-2xl font-bold tracking-tight sm:text-3xl">Continue to Pulse</h1>
      <p class="mt-2 text-sm text-pulse-muted">
        Create your first live session in under a minute. Participants never need an account.
      </p>

      <div v-if="magicSent" class="mt-8 rounded-2xl bg-pulse-soft px-4 py-5 text-sm text-pulse-ink">
        Check your email for a magic link to finish signing in.
      </div>

      <div v-else class="mt-8 space-y-4">
        <Button
          v-if="auth.devLoginEnabled"
          class="w-full"
          variant="secondary"
          :disabled="loading"
          @click="continueAsTestUser"
        >
          Continue as test user
        </Button>

        <template v-if="supabaseReady">
          <div
            v-if="auth.devLoginEnabled"
            class="flex items-center gap-3 text-xs uppercase tracking-wide text-pulse-muted"
          >
            <span class="h-px flex-1 bg-pulse-border" />
            or
            <span class="h-px flex-1 bg-pulse-border" />
          </div>

          <Button class="w-full" variant="secondary" :disabled="loading" @click="google">
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="#EA4335"
                d="M12 10.2v3.9h5.5c-.2 1.3-1.6 3.8-5.5 3.8-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.3 14.6 2.4 12 2.4 6.9 2.4 2.7 6.6 2.7 11.7S6.9 21 12 21c5.2 0 8.6-3.6 8.6-8.7 0-.6-.1-1-.2-1.5H12z"
              />
            </svg>
            Continue with Google
          </Button>

          <div class="flex items-center gap-3 text-xs uppercase tracking-wide text-pulse-muted">
            <span class="h-px flex-1 bg-pulse-border" />
            or
            <span class="h-px flex-1 bg-pulse-border" />
          </div>

          <form class="space-y-3" @submit.prevent="sendMagicLink">
            <Input
              v-model="email"
              type="email"
              label="Email address"
              placeholder="you@company.com"
            />
            <Button type="submit" class="w-full" :disabled="loading">Send magic link</Button>
          </form>
        </template>

        <p
          v-else-if="auth.devLoginEnabled"
          class="text-center text-xs text-pulse-muted"
        >
          Local test login — Supabase is not configured.
        </p>
      </div>

      <p v-if="error" class="mt-4 text-sm text-pulse-danger">{{ error }}</p>
      <p class="mt-6 text-center text-xs text-pulse-muted">
        By continuing you agree to use Pulse for live audience sessions.
      </p>
    </div>
  </div>
</template>
