<script setup lang="ts">
defineProps<{
  active?: boolean
}>()

defineEmits<{
  select: []
}>()
</script>

<template>
  <aside class="icon-rail" aria-label="Editor tools">
    <button
      type="button"
      class="icon-rail__btn"
      title="Edit"
      :class="{ 'icon-rail__btn--active': active !== false }"
      @click="$emit('select')"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M4 20h4l10.5-10.5a2.1 2.1 0 0 0-3-3L5 17v3z"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linejoin="round"
        />
        <path d="M13 6.5l3.5 3.5" stroke="currentColor" stroke-width="1.8" />
      </svg>
    </button>
  </aside>
</template>

<style scoped>
.icon-rail {
  position: absolute;
  top: 50%;
  right: 0.85rem;
  z-index: 15;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.2rem;
  width: auto;
  padding: 0.4rem;
  border-radius: 999px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 10px 28px rgba(15, 23, 42, 0.12);
  backdrop-filter: blur(10px);
  transition:
    right 0.34s cubic-bezier(0.22, 1, 0.36, 1),
    opacity 0.28s ease;
}

.icon-rail__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.35rem;
  height: 2.35rem;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: var(--pulse-muted);
  cursor: pointer;
  transition: background 0.15s, color 0.15s, transform 0.15s;
}

.icon-rail__btn:hover {
  background: var(--pulse-bg);
  color: var(--pulse-ink);
}

.icon-rail__btn--active {
  background: var(--pulse-soft);
  color: var(--pulse-magenta);
}

@media (max-width: 900px) {
  .icon-rail {
    top: auto;
    bottom: 1rem;
    right: 1rem;
    transform: none;
    flex-direction: row;
  }
}
</style>
