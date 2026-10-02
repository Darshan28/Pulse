<script setup lang="ts">
import { computed } from 'vue'
import type { LiveResults } from '@shared/types'

const props = defineProps<{ results: LiveResults; large?: boolean }>()

const bars = computed(() => {
  const data = props.results.data.bars as Array<{
    id: string
    label: string
    count: number
    percent: number
  }>
  return data ?? []
})

const colors = [
  'var(--pulse-bar-1)',
  'var(--pulse-bar-2)',
  'var(--pulse-bar-3)',
  'var(--pulse-bar-4)',
  'var(--pulse-bar-5)',
  'var(--pulse-bar-6)',
]
</script>

<template>
  <div class="space-y-4 w-full max-w-3xl mx-auto">
    <div v-for="(bar, i) in bars" :key="bar.id" class="space-y-1">
      <div class="flex justify-between gap-4" :class="large ? 'text-xl' : 'text-sm'">
        <span class="font-semibold">{{ bar.label }}</span>
        <span class="tabular-nums text-pulse-muted">{{ bar.percent }}%</span>
      </div>
      <div class="h-3 rounded-full bg-black/5 overflow-hidden" :class="large ? 'h-4' : ''">
        <div
          class="h-full rounded-full transition-all duration-700 ease-out"
          :style="{ width: `${bar.percent}%`, background: colors[i % colors.length] }"
        />
      </div>
    </div>
    <p class="text-sm text-pulse-muted text-center pt-2">
      {{ results.responseCount }} response{{ results.responseCount === 1 ? '' : 's' }}
    </p>
  </div>
</template>
