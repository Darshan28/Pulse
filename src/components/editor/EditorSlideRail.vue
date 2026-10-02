<script setup lang="ts">
import { ref } from 'vue'
import type { QuestionDTO } from '@shared/types'
import { TYPE_META } from './questionTypeMeta'

defineProps<{
  questions: QuestionDTO[]
  selectedId: string | null
}>()

const emit = defineEmits<{
  select: [id: string]
  add: []
  reorder: [orderedIds: string[]]
}>()

const dragId = ref<string | null>(null)
const overId = ref<string | null>(null)

function onDragStart(id: string, e: DragEvent) {
  dragId.value = id
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', id)
  }
}

function onDragOver(id: string, e: DragEvent) {
  e.preventDefault()
  if (e.dataTransfer) e.dataTransfer.dropEffect = 'move'
  overId.value = id
}

function onDrop(targetId: string, questions: QuestionDTO[], e: DragEvent) {
  e.preventDefault()
  const sourceId = dragId.value || e.dataTransfer?.getData('text/plain')
  overId.value = null
  dragId.value = null
  if (!sourceId || sourceId === targetId) return

  const ids = questions.map((q) => q.id)
  const from = ids.indexOf(sourceId)
  const to = ids.indexOf(targetId)
  if (from < 0 || to < 0) return
  ids.splice(from, 1)
  ids.splice(to, 0, sourceId)
  emit('reorder', ids)
}

function onDragEnd() {
  dragId.value = null
  overId.value = null
}
</script>

<template>
  <aside class="slide-rail">
    <div class="slide-rail__top">
      <button type="button" class="slide-rail__new" @click="$emit('add')">
        <span class="slide-rail__new-icon" aria-hidden="true">+</span>
        New slide
      </button>
    </div>

    <div class="slide-rail__list">
      <div
        v-for="(q, index) in questions"
        :key="q.id"
        class="slide-thumb"
        :class="{
          'slide-thumb--active': q.id === selectedId,
          'slide-thumb--dragging': dragId === q.id,
          'slide-thumb--over': overId === q.id && dragId !== q.id,
        }"
        draggable="true"
        @dragstart="onDragStart(q.id, $event)"
        @dragover="onDragOver(q.id, $event)"
        @drop="onDrop(q.id, questions, $event)"
        @dragend="onDragEnd"
      >
        <span class="slide-thumb__num">{{ index + 1 }}</span>
        <button type="button" class="slide-thumb__card" @click="$emit('select', q.id)">
          <p class="slide-thumb__prompt">{{ q.prompt || 'Untitled question' }}</p>
          <div class="slide-thumb__viz" aria-hidden="true">
            <template v-if="q.type === 'MULTIPLE_CHOICE' || q.type === 'YES_NO'">
              <span
                v-for="(opt, i) in q.options.slice(0, 3)"
                :key="opt.id || i"
                class="slide-thumb__bar"
                :style="{ width: `${58 - i * 14}%` }"
              />
            </template>
            <template v-else-if="q.type === 'RANKING'">
              <span v-for="(opt, i) in q.options.slice(0, 3)" :key="opt.id || i" class="slide-thumb__rank">
                {{ i + 1 }}
              </span>
            </template>
            <template v-else-if="q.type === 'OPEN_TEXT'">
              <span class="slide-thumb__bubble" />
              <span class="slide-thumb__bubble slide-thumb__bubble--sm" />
              <span class="slide-thumb__bubble" />
            </template>
            <template v-else-if="q.type === 'WORD_CLOUD'">
              <span class="slide-thumb__word slide-thumb__word--rose">creative</span>
              <span class="slide-thumb__word slide-thumb__word--lg slide-thumb__word--blue">fast</span>
              <span class="slide-thumb__word slide-thumb__word--rose">bold</span>
            </template>
            <template v-else-if="q.type === 'RATING'">
              <span class="slide-thumb__stars">★★★★★</span>
            </template>
            <template v-else-if="q.type === 'CONTENT_COMPARE'">
              <span class="slide-thumb__split" />
            </template>
            <template v-else-if="q.type.startsWith('CONTENT_')">
              <span class="slide-thumb__content-line" />
              <span class="slide-thumb__content-line slide-thumb__content-line--short" />
              <span class="slide-thumb__media-box" />
            </template>
            <template v-else>
              <span class="slide-thumb__scale" />
            </template>
          </div>
          <span class="slide-thumb__type">{{ TYPE_META[q.type].short }}</span>
        </button>
      </div>
    </div>
  </aside>
</template>

<style scoped>
.slide-rail {
  display: flex;
  flex-direction: column;
  width: 14rem;
  padding-right: 1rem;
  flex-shrink: 0;
  /*border-right: 1px solid color-mix(in srgb, var(--pulse-border) 80%, transparent);*/
  background: #f2f1f0;
}

.slide-rail__top {
  padding: 0.75rem;
}

.slide-rail__new {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  border: 0;
  border-radius: 0.65rem;
  background: var(--pulse-ink);
  color: white;
  font-size: 0.8rem;
  font-weight: 600;
  padding: 0.65rem 0.75rem;
  cursor: pointer;
  transition: background 0.15s, transform 0.15s;
}

.slide-rail__new:hover {
  background: #1a2436;
  transform: translateY(-1px);
}

.slide-rail__new-icon {
  font-size: 1rem;
  line-height: 1;
}

.slide-rail__list {
  flex: 1;
  overflow-y: auto;
  padding: 0.15rem 0.75rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.slide-thumb {
  display: flex;
  align-items: flex-start;
  gap: 0.4rem;
  width: 100%;
  cursor: grab;
}

.slide-thumb--dragging {
  opacity: 0.45;
}

.slide-thumb--over .slide-thumb__card {
  border-color: var(--pulse-purple);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--pulse-purple) 25%, transparent);
}

.slide-thumb__num {
  width: 1rem;
  padding-top: 0.35rem;
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--pulse-muted);
  user-select: none;
}

.slide-thumb__card {
  position: relative;
  flex: 1;
  min-height: 4.75rem;
  border-radius: 0.55rem;
  border: 2px solid transparent;
  background: white;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.06);
  padding: 0.45rem 0.5rem 0.4rem;
  transition: border-color 0.15s, box-shadow 0.15s;
  text-align: left;
  cursor: pointer;
  width: 100%;
}

.slide-thumb:hover .slide-thumb__card {
  border-color: color-mix(in srgb, var(--pulse-border) 90%, var(--pulse-purple));
}

.slide-thumb--active .slide-thumb__card {
  border-color: var(--pulse-purple);
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--pulse-purple) 35%, transparent);
}

.slide-thumb--active .slide-thumb__num {
  color: var(--pulse-magenta);
}

.slide-thumb__prompt {
  margin: 0;
  font-size: 0.58rem;
  font-weight: 600;
  line-height: 1.25;
  color: var(--pulse-ink);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.slide-thumb__viz {
  margin-top: 0.45rem;
  display: flex;
  flex-direction: column;
  gap: 0.22rem;
  min-height: 1.6rem;
}

.slide-thumb__bar {
  display: block;
  height: 0.28rem;
  border-radius: 999px;
  background: color-mix(in srgb, var(--pulse-purple) 55%, #cbd5e1);
}

.slide-thumb__viz:has(.slide-thumb__bubble),
.slide-thumb__viz:has(.slide-thumb__word),
.slide-thumb__viz:has(.slide-thumb__rank) {
  flex-direction: row;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.25rem;
}

.slide-thumb__bubble {
  width: 1.35rem;
  height: 0.7rem;
  border-radius: 999px;
  background: #e8eef0;
}

.slide-thumb__bubble--sm {
  width: 0.95rem;
}

.slide-thumb__word {
  font-size: 0.45rem;
  font-weight: 500;
  color: #a8c4e8;
  opacity: 0.85;
}

.slide-thumb__word--lg {
  font-size: 0.62rem;
}

.slide-thumb__word--rose {
  color: #e8b4c8;
}

.slide-thumb__word--blue {
  color: #a8c4e8;
}

.slide-thumb__rank {
  display: inline-flex;
  width: 0.85rem;
  height: 0.85rem;
  align-items: center;
  justify-content: center;
  border-radius: 0.25rem;
  background: var(--pulse-soft);
  font-size: 0.48rem;
  font-weight: 700;
  color: var(--pulse-magenta);
}

.slide-thumb__stars {
  font-size: 0.55rem;
  letter-spacing: 0.05em;
  color: #cbd5e1;
}

.slide-thumb__scale {
  margin-top: 0.35rem;
  height: 0.35rem;
  border-radius: 999px;
  background: linear-gradient(90deg, var(--pulse-purple), #94a3b8, #f59e0b);
}

.slide-thumb__viz:has(.slide-thumb__content-line),
.slide-thumb__viz:has(.slide-thumb__split) {
  display: grid;
  grid-template-columns: 1fr 0.7fr;
  gap: 0.25rem;
  align-items: start;
}

.slide-thumb__content-line {
  grid-column: 1;
  height: 0.28rem;
  border-radius: 999px;
  background: #d7e5e1;
}

.slide-thumb__content-line--short {
  width: 70%;
}

.slide-thumb__media-box {
  grid-column: 2;
  grid-row: 1 / span 2;
  min-height: 1.5rem;
  border-radius: 0.25rem;
  background: linear-gradient(135deg, #e8f8f4, #dbeafe);
}

.slide-thumb__split {
  grid-column: 1 / -1;
  height: 1.5rem;
  border-radius: 0.3rem;
  background: linear-gradient(90deg, #e8f8f4 49%, #fff 49%, #fff 51%, #eef2ff 51%);
  border: 1px solid #e2e8f0;
}

.slide-thumb__type {
  position: absolute;
  right: 0.3rem;
  bottom: 0.25rem;
  font-size: 0.5rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: var(--pulse-muted);
}

@media (max-width: 720px) {
  .slide-rail {
    width: 5.5rem;
  }

  .slide-rail__new {
    font-size: 0;
    gap: 0;
    padding: 0.55rem;
  }

  .slide-rail__new-icon {
    font-size: 1.15rem;
  }

  .slide-thumb__num {
    display: none;
  }
}
</style>
