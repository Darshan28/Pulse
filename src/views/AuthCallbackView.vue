<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BrandMark from '@/components/ui/BrandMark.vue'
import { consumeAuthIntent } from '@/lib/supabase'
import { friendlyAuthError } from '@/lib/authErrors'
import { useAuthStore } from '@/stores/authStore'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()
const error = ref<string | null>(null)

onMounted(async () => {
  try {
    await auth.init()
    await auth.handleAuthCallback()
    const intent = consumeAuthIntent(route.query.next)
    if (auth.profileStatus === 'ready' && !auth.onboardingCompleted) {
      await router.replace({ path: '/onboarding', query: { next: intent } })
      return
    }
    await router.replace(intent)
  } catch (e) {
    // Prefer the thrown message when it is already user-safe (e.g. profile load failure).
    const fallback = e instanceof Error && e.message ? e.message : undefined
    error.value = friendlyAuthError(e, fallback)
  }
})
</script>

<template>
  <div class="app-shell flex items-center justify-center px-4 py-10">
    <div class="app-shell-bg" aria-hidden="true" />
    <div class="relative z-10 w-full max-w-md card p-8 text-center">
      <BrandMark to="/" size="sm" class="justify-center" />
      <p v-if="!error" class="mt-6 text-pulse-muted">Finishing sign-in…</p>
      <div v-else class="mt-6 space-y-4">
        <p class="text-sm text-pulse-danger">{{ error }}</p>
        <button type="button" class="btn-secondary" @click="router.push('/auth')">
          Back to sign in
        </button>
      </div>
    </div>
  </div>
</template>
