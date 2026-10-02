<script setup lang="ts">
import { computed } from 'vue'
import type { ConnectionState } from '@/composables/useRealtime'

const props = defineProps<{ state: ConnectionState }>()

const label = computed(() => {
  if (props.state === 'connected') return 'Connected'
  if (props.state === 'reconnecting') return 'Reconnecting…'
  if (props.state === 'connecting') return 'Connecting…'
  return 'Disconnected'
})
</script>

<template>
  <div
    class="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium"
    :class="state === 'connected' ? 'bg-pulse-soft text-pulse-magenta' : 'bg-amber-50 text-amber-800'"
    role="status"
  >
    <span
      class="h-2 w-2 rounded-full"
      :class="state === 'connected' ? 'bg-pulse-purple' : 'bg-amber-500 animate-pulse'"
    />
    {{ label }}
  </div>
</template>
