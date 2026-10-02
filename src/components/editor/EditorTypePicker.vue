<script setup lang="ts">
import type { QuestionType } from '@shared/types'
import { CONTENT_TYPES, INTERACTIVE_TYPES, TYPE_META } from './questionTypeMeta'

defineProps<{
  open: boolean
}>()

defineEmits<{
  close: []
  pick: [type: QuestionType]
}>()
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="type-picker" role="dialog" aria-modal="true" aria-label="Choose slide type">
      <button type="button" class="type-picker__backdrop" aria-label="Close" @click="$emit('close')" />
      <div class="type-picker__sheet">
        <div class="type-picker__head">
          <div>
            <h2>New slide</h2>
            <p>Questions for the room, or content to present</p>
          </div>
          <button type="button" class="type-picker__close" aria-label="Close" @click="$emit('close')">
            ✕
          </button>
        </div>

        <section class="type-picker__section">
          <h3>Interactive questions</h3>
          <div class="type-picker__grid">
            <button
              v-for="t in INTERACTIVE_TYPES"
              :key="t.type"
              type="button"
              class="type-picker__card"
              @click="$emit('pick', t.type)"
            >
              <span class="type-picker__badge">{{ TYPE_META[t.type].short }}</span>
              <span class="type-picker__label">{{ t.label }}</span>
              <span class="type-picker__hint">{{ t.hint }}</span>
            </button>
          </div>
        </section>

        <section class="type-picker__section">
          <h3>Content slides</h3>
          <div class="type-picker__grid type-picker__grid--content">
            <button
              v-for="t in CONTENT_TYPES"
              :key="t.type"
              type="button"
              class="type-picker__card"
              @click="$emit('pick', t.type)"
            >
              <span class="type-picker__badge type-picker__badge--content">{{ TYPE_META[t.type].short }}</span>
              <span class="type-picker__label">{{ t.label }}</span>
              <span class="type-picker__hint">{{ t.hint }}</span>
            </button>
          </div>
        </section>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.type-picker {
  position: fixed;
  inset: 0;
  z-index: 80;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.type-picker__backdrop {
  position: absolute;
  inset: 0;
  border: 0;
  background: rgba(11, 18, 32, 0.45);
  cursor: pointer;
}

.type-picker__sheet {
  position: relative;
  width: min(100%, 44rem);
  max-height: min(88vh, 40rem);
  overflow: auto;
  border-radius: 1rem;
  background: white;
  box-shadow: 0 28px 80px rgba(15, 23, 42, 0.22);
  padding: 1.15rem 1.15rem 1.35rem;
  animation: sheet-in 0.28s cubic-bezier(0.22, 1, 0.36, 1) both;
}

.type-picker__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.85rem;
}

.type-picker__head h2 {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.type-picker__head p {
  margin: 0.25rem 0 0;
  font-size: 0.85rem;
  color: var(--pulse-muted);
}

.type-picker__close {
  border: 0;
  background: var(--pulse-bg);
  width: 2rem;
  height: 2rem;
  border-radius: 0.5rem;
  color: var(--pulse-muted);
  cursor: pointer;
}

.type-picker__section + .type-picker__section {
  margin-top: 1.15rem;
  padding-top: 1rem;
  border-top: 1px solid var(--pulse-border);
}

.type-picker__section h3 {
  margin: 0 0 0.65rem;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--pulse-muted);
}

.type-picker__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.65rem;
}

.type-picker__grid--content {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.type-picker__card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.25rem;
  border: 1px solid var(--pulse-border);
  border-radius: 0.85rem;
  background: white;
  padding: 0.85rem;
  text-align: left;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s, box-shadow 0.15s;
}

.type-picker__card:hover {
  border-color: var(--pulse-purple);
  background: var(--pulse-soft);
  box-shadow: 0 8px 20px rgba(20, 184, 166, 0.1);
}

.type-picker__badge {
  display: inline-flex;
  width: 2rem;
  height: 2rem;
  align-items: center;
  justify-content: center;
  border-radius: 0.5rem;
  background: var(--pulse-bg);
  font-size: 0.62rem;
  font-weight: 700;
  color: var(--pulse-magenta);
  margin-bottom: 0.25rem;
}

.type-picker__badge--content {
  background: #eef2ff;
  color: #6366f1;
}

.type-picker__label {
  font-size: 0.88rem;
  font-weight: 700;
  color: var(--pulse-ink);
}

.type-picker__hint {
  font-size: 0.72rem;
  color: var(--pulse-muted);
}

@keyframes sheet-in {
  from {
    opacity: 0;
    transform: translateY(12px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@media (max-width: 720px) {
  .type-picker__grid,
  .type-picker__grid--content {
    grid-template-columns: 1fr;
  }
}

@media (prefers-reduced-motion: reduce) {
  .type-picker__sheet {
    animation: none;
  }
}
</style>
