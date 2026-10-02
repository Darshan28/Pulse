<script setup lang="ts">
withDefaults(
  defineProps<{
    to?: string
    size?: 'sm' | 'md'
  }>(),
  { to: '/', size: 'md' },
)
</script>

<template>
  <RouterLink :to="to" class="brand-mark" :class="size === 'sm' ? 'text-base' : 'text-lg'">
    <span
      class="brand-mark-icon"
      :class="size === 'sm' ? '!h-8 !w-8 rounded-lg' : ''"
      aria-hidden="true"
    >
      <svg
        :width="size === 'sm' ? 16 : 18"
        :height="size === 'sm' ? 16 : 18"
        viewBox="0 0 24 24"
        fill="none"
      >
        <path
          d="M2 12h3.2l2.1-5.5L11.5 18l2.8-8.2L16.8 12H22"
          stroke="currentColor"
          stroke-width="2.2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </span>
    Pulse
  </RouterLink>
</template>
