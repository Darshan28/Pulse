<script setup lang="ts">
import { computed } from 'vue'
import type { LiveResults } from '@shared/types'

const props = defineProps<{ results: LiveResults; large?: boolean }>()
const ranking = computed(
  () =>
    (props.results.data.ranking as Array<{
      id: string
      label: string
      averageRank: number
      votes: number
    }>) ?? [],
)
</script>

<template>
  <ol class="space-y-3 max-w-xl mx-auto">
    <li
      v-for="(item, index) in ranking"
      :key="item.id"
      class="flex items-center gap-4 rounded-2xl bg-white/90 border border-pulse-border px-4 py-3"
    >
      <span
        class="flex h-10 w-10 items-center justify-center rounded-full bg-pulse-purple text-white font-bold"
      >
        {{ index + 1 }}
      </span>
      <div class="flex-1 text-left">
        <p :class="large ? 'text-xl' : 'text-base'" class="font-semibold">{{ item.label }}</p>
        <p class="text-sm text-pulse-muted">Avg rank {{ item.averageRank }}</p>
      </div>
    </li>
  </ol>
</template>
