<script setup lang="ts">
import { computed } from 'vue'
import type { LiveResults } from '@shared/types'

const props = defineProps<{ results: LiveResults; large?: boolean }>()

const words = computed(() => {
  const list = (props.results.data.words as Array<{ text: string; count: number }>) ?? []
  const max = Math.max(...list.map((w) => w.count), 1)
  return list.slice(0, 40).map((w, i) => ({
    ...w,
    size: 0.85 + (w.count / max) * (props.large ? 2.4 : 1.6),
    color: ['#14b8a6', '#0f9f8a', '#8b7cf6', '#5b9fed', '#2dd4bf'][i % 5],
  }))
})
</script>

<template>
  <div class="flex flex-wrap items-center justify-center gap-x-4 gap-y-3 min-h-[200px] px-4">
    <span
      v-for="w in words"
      :key="w.text"
      class="font-bold leading-none transition-transform"
      :style="{ fontSize: `${w.size}rem`, color: w.color }"
    >
      {{ w.text }}
    </span>
    <p v-if="!words.length" class="text-pulse-muted">Waiting for words…</p>
  </div>
</template>
