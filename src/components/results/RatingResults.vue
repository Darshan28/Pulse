<script setup lang="ts">
import { computed } from 'vue'
import type { LiveResults } from '@shared/types'

const props = defineProps<{ results: LiveResults; large?: boolean }>()

const average = computed(() => Number(props.results.data.average ?? 0))
const max = computed(() => Number(props.results.data.max ?? 5))
const distribution = computed(
  () =>
    (props.results.data.distribution as Array<{ value: number; count: number; percent: number }>) ??
    [],
)
</script>

<template>
  <div class="text-center space-y-6">
    <div>
      <p :class="large ? 'text-6xl' : 'text-4xl'" class="font-extrabold text-pulse-purple tabular-nums">
        {{ average }}
        <span class="text-pulse-muted text-2xl font-semibold">/ {{ max }}</span>
      </p>
    </div>
    <div class="space-y-2 max-w-md mx-auto text-left">
      <div v-for="d in distribution" :key="d.value" class="flex items-center gap-3 text-sm">
        <span class="w-6 tabular-nums font-medium">{{ d.value }}</span>
        <div class="flex-1 h-2.5 rounded-full bg-black/5 overflow-hidden">
          <div
            class="h-full rounded-full bg-pulse-magenta transition-all duration-700"
            :style="{ width: `${d.percent}%` }"
          />
        </div>
        <span class="w-10 text-right text-pulse-muted tabular-nums">{{ d.percent }}%</span>
      </div>
    </div>
    <p class="text-sm text-pulse-muted">{{ results.responseCount }} responses</p>
  </div>
</template>
