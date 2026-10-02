<script setup lang="ts">
import { computed } from 'vue'
import type { LiveResults } from '@shared/types'

const props = defineProps<{ results: LiveResults }>()
const texts = computed(
  () => (props.results.data.texts as Array<{ id: string; text: string }>) ?? [],
)
</script>

<template>
  <div class="grid gap-3 max-w-3xl mx-auto max-h-[60vh] overflow-y-auto">
    <div
      v-for="t in texts"
      :key="t.id"
      class="rounded-2xl border border-pulse-border bg-white px-4 py-3 text-left shadow-sm"
    >
      {{ t.text }}
    </div>
    <p v-if="!texts.length" class="text-center text-pulse-muted">No responses yet</p>
  </div>
</template>
