<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BrandMark from '@/components/ui/BrandMark.vue'
import Button from '@/components/ui/Button.vue'
import Input from '@/components/ui/Input.vue'
import { api, setParticipantToken } from '@/services/api'
import { track } from '@/analytics'
import { ApiClientError } from '@/services/api'

const props = defineProps<{ code?: string }>()
const route = useRoute()
const router = useRouter()

const joinCode = ref((props.code || (route.params.code as string) || '').toUpperCase())
const name = ref('')
const step = ref<'code' | 'name'>('code')
const error = ref<string | null>(null)
const loading = ref(false)

watch(
  () => route.params.code,
  (c) => {
    if (typeof c === 'string' && c) {
      joinCode.value = c.toUpperCase()
    }
  },
)

async function continueCode() {
  error.value = null
  if (joinCode.value.trim().length < 4) {
    error.value = 'Enter the code shown on the presenter’s screen.'
    return
  }
  step.value = 'name'
}

async function join(anonymous = false) {
  loading.value = true
  error.value = null
  try {
    const res = await api.join(joinCode.value.trim(), anonymous ? undefined : name.value || undefined)
    setParticipantToken(res.token)
    track('participant_joined', { sessionId: res.session.id })
    await router.push(`/participant/${res.session.id}`)
  } catch (e) {
    error.value = e instanceof ApiClientError ? e.message : 'Could not join session'
    step.value = 'code'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="app-shell flex items-center justify-center px-4 py-10">
    <div class="app-shell-bg" aria-hidden="true" />
    <div class="relative z-10 card w-full max-w-md p-8 sm:p-10">
      <div class="flex justify-center">
        <BrandMark />
      </div>
      <h1 class="mt-6 text-center text-2xl font-bold tracking-tight">Join a session</h1>
      <p class="mt-2 text-center text-pulse-muted text-sm leading-relaxed">
        Enter the code shown on the presenter’s screen.
      </p>

      <div v-if="step === 'code'" class="mt-8 space-y-4">
        <Input
          v-model="joinCode"
          placeholder="7F4K2"
          maxlength="8"
          autocomplete="one-time-code"
          class="uppercase tracking-[0.3em] text-center text-2xl font-bold"
        />
        <p v-if="error" class="text-sm text-pulse-danger" role="alert">{{ error }}</p>
        <Button class="w-full" :disabled="loading" @click="continueCode">
          Continue <span aria-hidden="true">→</span>
        </Button>
      </div>

      <div v-else class="mt-8 space-y-4">
        <p class="text-center font-semibold">What should we call you?</p>
        <Input v-model="name" label="Your name" placeholder="Optional" maxlength="60" />
        <p v-if="error" class="text-sm text-pulse-danger" role="alert">{{ error }}</p>
        <Button class="w-full" :disabled="loading" @click="join(false)">
          Join session <span aria-hidden="true">→</span>
        </Button>
        <Button variant="ghost" class="w-full" :disabled="loading" @click="join(true)">
          Continue anonymously
        </Button>
      </div>
    </div>
  </div>
</template>
