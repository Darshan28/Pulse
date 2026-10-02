<script setup lang="ts">
import { computed } from 'vue'
import type { ContentLayout, QuestionDTO, QuestionType } from '@shared/types'
import { isContentSlide } from '@shared/types'
import { QUESTION_TYPES, TYPE_META } from './questionTypeMeta'

const props = defineProps<{
  selected: QuestionDTO | null
  draftConfig: Record<string, unknown>
  showJoiningInfo: boolean
  showLogo: boolean
  open: boolean
}>()

const emit = defineEmits<{
  'update:draftConfig': [value: Record<string, unknown>]
  'update:showJoiningInfo': [value: boolean]
  'update:showLogo': [value: boolean]
  'update:open': [value: boolean]
  changeTypeHint: []
  deleteSlide: []
  save: []
}>()

const contentMode = computed(() => (props.selected ? isContentSlide(props.selected.type) : false))

const layouts: { value: ContentLayout; label: string }[] = [
  { value: 'text_only', label: 'Text only' },
  { value: 'media_right', label: 'Text + media right' },
  { value: 'media_left', label: 'Media left + text' },
  { value: 'media_full', label: 'Full media' },
]

function patchConfig(key: string, value: unknown) {
  emit('update:draftConfig', { ...props.draftConfig, [key]: value })
}

function onToggle(key: string, e: Event) {
  patchConfig(key, (e.target as HTMLInputElement).checked)
  emit('save')
}

function onNumber(key: string, e: Event) {
  const n = Number((e.target as HTMLInputElement).value)
  if (!Number.isFinite(n)) return
  patchConfig(key, n)
}

function onText(key: string, e: Event) {
  patchConfig(key, (e.target as HTMLInputElement).value)
}

function onSelect(key: string, e: Event) {
  patchConfig(key, (e.target as HTMLSelectElement).value)
  emit('save')
}

const typeLabel = (type: QuestionType) => TYPE_META[type].label
</script>

<template>
  <aside class="edit-panel" :aria-hidden="!open">
    <div class="edit-panel__head">
      <h2>Edit</h2>
      <button
        type="button"
        class="edit-panel__close"
        aria-label="Close edit panel"
        @click="emit('update:open', false)"
      >
        ✕
      </button>
    </div>

    <div v-if="!selected" class="edit-panel__empty">
      <p>Select a slide to edit its settings.</p>
    </div>

    <div v-else class="edit-panel__body">
      <section class="edit-section">
        <label class="edit-label">Question</label>
        <button type="button" class="edit-type" @click="emit('changeTypeHint')">
          <span class="edit-type__badge">{{ TYPE_META[selected.type].short }}</span>
          <span class="edit-type__label">{{ typeLabel(selected.type) }}</span>
          <span class="edit-type__chev" aria-hidden="true">▾</span>
        </button>
        <p class="edit-hint">
          {{ QUESTION_TYPES.find((t) => t.type === selected!.type)?.hint }}
        </p>
      </section>

      <section v-if="selected.type === 'MULTIPLE_CHOICE'" class="edit-section">
        <h3 class="edit-section__title">Response settings</h3>
        <label class="edit-toggle">
          <span>Multiple selection</span>
          <input
            type="checkbox"
            role="switch"
            :checked="Boolean(draftConfig.allowMultiple)"
            @change="onToggle('allowMultiple', $event)"
          />
        </label>
      </section>

      <section v-else-if="selected.type === 'RATING'" class="edit-section">
        <h3 class="edit-section__title">Response settings</h3>
        <label class="edit-field">
          <span>Max stars</span>
          <input
            class="edit-input"
            type="number"
            min="3"
            max="10"
            :value="Number(draftConfig.max ?? 5)"
            @input="onNumber('max', $event)"
            @blur="emit('save')"
          />
        </label>
      </section>

      <section v-else-if="selected.type === 'SCALE'" class="edit-section">
        <h3 class="edit-section__title">Response settings</h3>
        <div class="edit-field-row">
          <label class="edit-field">
            <span>Min</span>
            <input
              class="edit-input"
              type="number"
              min="0"
              max="9"
              :value="Number(draftConfig.min ?? 1)"
              @input="onNumber('min', $event)"
              @blur="emit('save')"
            />
          </label>
          <label class="edit-field">
            <span>Max</span>
            <input
              class="edit-input"
              type="number"
              min="2"
              max="10"
              :value="Number(draftConfig.max ?? 5)"
              @input="onNumber('max', $event)"
              @blur="emit('save')"
            />
          </label>
        </div>
        <label class="edit-field">
          <span>Low label</span>
          <input
            class="edit-input"
            type="text"
            :value="String(draftConfig.minLabel ?? '')"
            @input="onText('minLabel', $event)"
            @blur="emit('save')"
          />
        </label>
        <label class="edit-field">
          <span>High label</span>
          <input
            class="edit-input"
            type="text"
            :value="String(draftConfig.maxLabel ?? '')"
            @input="onText('maxLabel', $event)"
            @blur="emit('save')"
          />
        </label>
      </section>

      <section
        v-else-if="selected.type === 'OPEN_TEXT' || selected.type === 'WORD_CLOUD'"
        class="edit-section"
      >
        <h3 class="edit-section__title">Response settings</h3>
        <label class="edit-field">
          <span>Character limit</span>
          <input
            class="edit-input"
            type="number"
            min="20"
            max="1000"
            :value="Number(draftConfig.maxLength ?? 500)"
            @input="onNumber('maxLength', $event)"
            @blur="emit('save')"
          />
        </label>
      </section>

      <section v-if="contentMode" class="edit-section">
        <h3 class="edit-section__title">Design</h3>
        <label
          v-if="selected.type === 'CONTENT_IMAGE' || selected.type === 'CONTENT_TEXT'"
          class="edit-field"
        >
          <span>Content image URL</span>
          <input
            class="edit-input"
            type="url"
            placeholder="https://…"
            :value="String(draftConfig.imageUrl ?? '')"
            @input="onText('imageUrl', $event)"
            @blur="emit('save')"
          />
        </label>
        <label v-if="selected.type === 'CONTENT_VIDEO'" class="edit-field">
          <span>Video URL (YouTube)</span>
          <input
            class="edit-input"
            type="url"
            placeholder="https://youtube.com/watch?v=…"
            :value="String(draftConfig.videoUrl ?? '')"
            @input="onText('videoUrl', $event)"
            @blur="emit('save')"
          />
        </label>
        <label
          v-if="selected.type !== 'CONTENT_COMPARE' && selected.type !== 'CONTENT_INSTRUCTIONS'"
          class="edit-field"
        >
          <span>Layout</span>
          <select
            class="edit-select edit-select--active"
            :value="String(draftConfig.layout ?? 'media_right')"
            @change="onSelect('layout', $event)"
          >
            <option v-for="l in layouts" :key="l.value" :value="l.value">{{ l.label }}</option>
          </select>
        </label>
        <label class="edit-field">
          <span>Background color</span>
          <input
            class="edit-input"
            type="color"
            :value="String(draftConfig.backgroundColor || '#ffffff')"
            @input="onText('backgroundColor', $event)"
            @change="emit('save')"
          />
        </label>
        <label class="edit-toggle">
          <span>Show logo</span>
          <input
            type="checkbox"
            role="switch"
            :checked="Boolean(draftConfig.showLogo ?? showLogo)"
            @change="onToggle('showLogo', $event)"
          />
        </label>
        <label v-if="selected.type === 'CONTENT_INSTRUCTIONS'" class="edit-toggle">
          <span>Animate list items</span>
          <input
            type="checkbox"
            role="switch"
            :checked="Boolean(draftConfig.animateListItems)"
            @change="onToggle('animateListItems', $event)"
          />
        </label>
      </section>

      <section v-else class="edit-section">
        <h3 class="edit-section__title">Design</h3>
        <div class="edit-row">
          <span>Background color</span>
          <span class="edit-swatch" title="Theme white" />
        </div>
        <label class="edit-toggle">
          <span>Show logo</span>
          <input
            type="checkbox"
            role="switch"
            :checked="showLogo"
            @change="emit('update:showLogo', ($event.target as HTMLInputElement).checked)"
          />
        </label>
      </section>

      <section class="edit-section">
        <h3 class="edit-section__title">Joining instructions</h3>
        <label class="edit-toggle">
          <span>Show joining information</span>
          <input
            type="checkbox"
            role="switch"
            :checked="showJoiningInfo"
            @change="emit('update:showJoiningInfo', ($event.target as HTMLInputElement).checked)"
          />
        </label>
        <div class="edit-row edit-row--stack">
          <span>Type</span>
          <select class="edit-select" disabled>
            <option>Join code</option>
          </select>
        </div>
      </section>

      <section class="edit-section edit-section--danger">
        <button type="button" class="edit-danger" @click="emit('deleteSlide')">
          Delete slide
        </button>
      </section>
    </div>
  </aside>
</template>

<style scoped>
.edit-panel {
  display: flex;
  flex-direction: column;
  width: 17.5rem;
  height: 100%;
  flex-shrink: 0;
  /*border-left: 1px solid color-mix(in srgb, var(--pulse-border) 80%, transparent);*/
  background: white;
  box-shadow: -8px 0 24px rgba(15, 23, 42, 0.04);
  z-index: 12;
}

.edit-panel__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.85rem 1rem;
  border-bottom: 1px solid color-mix(in srgb, var(--pulse-border) 70%, transparent);
}

.edit-panel__head h2 {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 700;
}

.edit-panel__close {
  border: 0;
  background: transparent;
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 0.4rem;
  color: var(--pulse-muted);
  cursor: pointer;
}

.edit-panel__close:hover {
  background: var(--pulse-bg);
  color: var(--pulse-ink);
}

.edit-panel__empty {
  padding: 1.5rem 1rem;
  color: var(--pulse-muted);
  font-size: 0.85rem;
}

.edit-panel__body {
  flex: 1;
  overflow-y: auto;
  padding: 0.35rem 0 1rem;
}

.edit-section {
  padding: 0.9rem 1rem;
  border-bottom: 1px solid color-mix(in srgb, var(--pulse-border) 55%, transparent);
}

.edit-section--danger {
  border-bottom: 0;
}

.edit-section__title,
.edit-label {
  display: block;
  margin: 0 0 0.75rem;
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--pulse-muted);
}

.edit-label {
  margin-bottom: 0.45rem;
}

.edit-type {
  display: flex;
  width: 100%;
  align-items: center;
  gap: 0.55rem;
  border: 1px solid var(--pulse-border);
  border-radius: 0.65rem;
  background: white;
  padding: 0.55rem 0.65rem;
  cursor: pointer;
  text-align: left;
}

.edit-type:hover {
  border-color: var(--pulse-purple);
  background: var(--pulse-soft);
}

.edit-type__badge {
  display: inline-flex;
  width: 1.85rem;
  height: 1.85rem;
  align-items: center;
  justify-content: center;
  border-radius: 0.45rem;
  background: var(--pulse-bg);
  font-size: 0.6rem;
  font-weight: 700;
  color: var(--pulse-magenta);
}

.edit-type__label {
  flex: 1;
  font-size: 0.85rem;
  font-weight: 600;
}

.edit-type__chev {
  color: var(--pulse-muted);
  font-size: 0.7rem;
}

.edit-hint {
  margin: 0.45rem 0 0;
  font-size: 0.75rem;
  color: var(--pulse-muted);
}

.edit-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--pulse-ink);
  margin-bottom: 0.65rem;
  cursor: pointer;
}

.edit-toggle:last-child {
  margin-bottom: 0;
}

.edit-toggle input {
  appearance: none;
  width: 2.4rem;
  height: 1.35rem;
  border-radius: 999px;
  background: #cbd5e1;
  position: relative;
  cursor: pointer;
  transition: background 0.15s;
  flex-shrink: 0;
}

.edit-toggle input::after {
  content: '';
  position: absolute;
  top: 0.15rem;
  left: 0.15rem;
  width: 1.05rem;
  height: 1.05rem;
  border-radius: 999px;
  background: white;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.2);
  transition: transform 0.15s;
}

.edit-toggle input:checked {
  background: var(--pulse-purple);
}

.edit-toggle input:checked::after {
  transform: translateX(1.05rem);
}

.edit-field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  margin-bottom: 0.7rem;
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--pulse-ink);
}

.edit-field:last-child {
  margin-bottom: 0;
}

.edit-field-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.55rem;
  margin-bottom: 0.7rem;
}

.edit-field-row .edit-field {
  margin-bottom: 0;
}

.edit-input {
  border: 1px solid var(--pulse-border);
  border-radius: 0.55rem;
  padding: 0.5rem 0.65rem;
  font-size: 0.85rem;
  background: white;
  color: var(--pulse-ink);
  outline: none;
}

.edit-input:focus {
  border-color: var(--pulse-purple);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--pulse-purple) 16%, transparent);
}

.edit-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  font-size: 0.85rem;
  font-weight: 500;
  margin-bottom: 0.65rem;
}

.edit-row--stack {
  flex-direction: column;
  align-items: stretch;
}

.edit-swatch {
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 999px;
  background: white;
  border: 1px solid var(--pulse-border);
  box-shadow: inset 0 0 0 1px #f1f5f4;
}

.edit-select {
  border: 1px solid var(--pulse-border);
  border-radius: 0.55rem;
  padding: 0.5rem 0.65rem;
  font-size: 0.85rem;
  background: var(--pulse-bg);
  color: var(--pulse-muted);
}

.edit-select--active {
  background: white;
  color: var(--pulse-ink);
  width: 100%;
}

.edit-danger {
  border: 0;
  background: transparent;
  color: var(--pulse-danger);
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  padding: 0.25rem 0;
}

.edit-danger:hover {
  text-decoration: underline;
}

</style>
