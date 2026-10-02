<script setup lang="ts">
import { computed } from 'vue'
import type { ContentSlideConfig, QuestionDTO, QuestionType } from '@shared/types'
import { isContentSlide } from '@shared/types'
import ContentSlideDisplay from '@/components/session/ContentSlideDisplay.vue'
import { hasEditableOptions, optionLetter, PROMPT_PLACEHOLDERS } from './questionTypeMeta'

const props = defineProps<{
  selected: QuestionDTO | null
  selectedIndex: number
  draftPrompt: string
  draftOptions: string[]
  draftConfig: Record<string, unknown>
  joinCode: string
  showJoiningInfo: boolean
  showLogo: boolean
  promptFocused: boolean
}>()

const emit = defineEmits<{
  'update:draftPrompt': [value: string]
  'update:draftOptions': [value: string[]]
  'update:draftConfig': [value: Record<string, unknown>]
  'update:promptFocused': [value: boolean]
  save: []
  addOption: []
  removeOption: [index: number]
  addFirst: [type: QuestionType]
}>()

const contentSelected = computed(() =>
  props.selected ? isContentSlide(props.selected.type) : false,
)
const contentConfig = computed(() => props.draftConfig as Partial<ContentSlideConfig>)
const slideShowLogo = computed(() =>
  contentSelected.value
    ? Boolean(props.draftConfig.showLogo ?? props.showLogo)
    : props.showLogo,
)

function patchConfig(key: string, value: unknown) {
  emit('update:draftConfig', { ...props.draftConfig, [key]: value })
}

const ratingMax = computed(() => Number(props.draftConfig.max ?? 5) || 5)
const scaleMin = computed(() => Number(props.draftConfig.min ?? 1) || 1)
const scaleMax = computed(() => Number(props.draftConfig.max ?? 5) || 5)
const scaleTicks = computed(() => {
  const min = scaleMin.value
  const max = scaleMax.value
  const count = Math.max(2, Math.min(10, max - min + 1))
  return Array.from({ length: count }, (_, i) => min + i)
})
const minLabel = computed(() => String(props.draftConfig.minLabel ?? 'Strongly disagree'))
const maxLabel = computed(() => String(props.draftConfig.maxLabel ?? 'Strongly agree'))
const maxLength = computed(() => Number(props.draftConfig.maxLength ?? 500) || 500)

/** Mentimeter-style word-cloud empty preview — flex cluster, no overlap */
const cloudWords = [
  { text: 'leader', size: 'md', color: 'sky' },
  { text: 'fast', size: 'lg', color: 'blue' },
  { text: 'ideas', size: 'sm', color: 'mint' },
  { text: 'creative', size: 'xl', color: 'violet' },
  { text: 'bold', size: 'md', color: 'coral' },
  { text: 'focus', size: 'sm', color: 'rose' },
  { text: 'inspiration', size: 'xs', color: 'lilac' },
]

const promptPlaceholder = computed(() =>
  props.selected ? PROMPT_PLACEHOLDERS[props.selected.type] : 'Ask the room something…',
)

const starterPrompts = new Set(Object.values(PROMPT_PLACEHOLDERS).concat([
  'Untitled question',
  'What is your opinion?',
  'How would you rate this?',
  'How strongly do you agree?',
  'What are your thoughts?',
  'What word comes to mind...',
  'Rank these in order of importance',
  'Do you agree?',
]))

const isStarterPrompt = computed(() => starterPrompts.has(props.draftPrompt.trim()))

function updateOption(i: number, value: string, options: string[]) {
  const next = [...options]
  next[i] = value
  emit('update:draftOptions', next)
}
</script>

<template>
  <main class="editor-canvas-wrap">
    <div v-if="!selected" class="editor-empty">
      <div class="editor-empty__icon" aria-hidden="true">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
          <path
            d="M4 6h16M4 12h10M4 18h14"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
          />
        </svg>
      </div>
      <h2>Build your first slide</h2>
      <p>Add a question and edit it right on the canvas — like a live presentation deck.</p>
      <button type="button" class="editor-empty__cta" @click="emit('addFirst', 'MULTIPLE_CHOICE')">
        Add multiple choice
      </button>
    </div>

    <div v-else class="editor-stage">
      <div class="editor-slide-frame">
      <div
        class="editor-slide"
        :class="{ 'editor-slide--content': contentSelected }"
        :style="contentSelected && draftConfig.backgroundColor
          ? { background: String(draftConfig.backgroundColor) }
          : undefined"
      >
        <div v-if="slideShowLogo" class="editor-slide__brand" aria-hidden="true">
          <span class="editor-slide__brand-mark">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
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
        </div>

        <!-- Content slides -->
        <ContentSlideDisplay
          v-if="contentSelected"
          :type="selected.type"
          :title="draftPrompt"
          :config="contentConfig"
          editable
          @update:title="emit('update:draftPrompt', $event)"
          @update:body="patchConfig('body', $event)"
          @update:left-title="patchConfig('leftTitle', $event)"
          @update:left-body="patchConfig('leftBody', $event)"
          @update:right-title="patchConfig('rightTitle', $event)"
          @update:right-body="patchConfig('rightBody', $event)"
          @blur="emit('save')"
        />

        <template v-else>
        <div
          class="editor-slide__prompt-wrap"
          :class="{ 'editor-slide__prompt-wrap--focus': promptFocused }"
        >
          <textarea
            :value="draftPrompt"
            rows="1"
            class="editor-slide__prompt"
            :class="{ 'editor-slide__prompt--starter': isStarterPrompt }"
            :placeholder="promptPlaceholder"
            @input="emit('update:draftPrompt', ($event.target as HTMLTextAreaElement).value)"
            @focus="emit('update:promptFocused', true)"
            @blur="emit('update:promptFocused', false); emit('save')"
          />
          <div v-if="promptFocused" class="editor-toolbar" role="toolbar" aria-label="Text formatting">
            <span class="editor-toolbar__style">Body</span>
            <span class="editor-toolbar__swatch" aria-hidden="true" />
            <button type="button" class="editor-toolbar__btn" tabindex="-1" aria-hidden="true">
              <strong>B</strong>
            </button>
            <button type="button" class="editor-toolbar__btn" tabindex="-1" aria-hidden="true">
              <em>I</em>
            </button>
            <span class="editor-toolbar__sep" />
            <span class="editor-toolbar__hint">Edit your question</span>
          </div>
        </div>

        <!-- Multiple choice / Yes-No -->
        <div
          v-if="selected.type === 'MULTIPLE_CHOICE' || selected.type === 'YES_NO'"
          class="editor-slide__options"
        >
          <div v-for="(opt, i) in draftOptions" :key="i" class="editor-option">
            <span class="editor-option__letter">{{ optionLetter(i) }}</span>
            <input
              :value="opt"
              class="editor-option__input"
              :placeholder="`Option ${i + 1}`"
              @input="updateOption(i, ($event.target as HTMLInputElement).value, draftOptions)"
              @blur="emit('save')"
            />
            <button
              v-if="selected.type !== 'YES_NO'"
              type="button"
              class="editor-option__remove"
              aria-label="Remove option"
              @click="emit('removeOption', i)"
            >
              ✕
            </button>
            <span class="editor-option__count" aria-hidden="true">0</span>
          </div>
          <button
            v-if="selected.type !== 'YES_NO'"
            type="button"
            class="editor-option__add"
            @click="emit('addOption')"
          >
            + Add option
          </button>
        </div>

        <!-- Ranking -->
        <div v-else-if="selected.type === 'RANKING'" class="editor-rank">
          <div v-for="(opt, i) in draftOptions" :key="i" class="editor-rank__row">
            <span class="editor-rank__handle" aria-hidden="true">⋮⋮</span>
            <span class="editor-rank__num">{{ i + 1 }}</span>
            <input
              :value="opt"
              class="editor-rank__input"
              :placeholder="`Item ${i + 1}`"
              @input="updateOption(i, ($event.target as HTMLInputElement).value, draftOptions)"
              @blur="emit('save')"
            />
            <button
              type="button"
              class="editor-option__remove"
              aria-label="Remove item"
              @click="emit('removeOption', i)"
            >
              ✕
            </button>
          </div>
          <button type="button" class="editor-option__add" @click="emit('addOption')">
            + Add item
          </button>
        </div>

        <!-- Open text -->
        <div v-else-if="selected.type === 'OPEN_TEXT'" class="editor-open">
          <div class="editor-open__field">
            <span class="editor-open__placeholder">Audience answers appear as text responses</span>
            <span class="editor-open__limit">up to {{ maxLength }} chars</span>
          </div>
          <div class="editor-bubbles" aria-hidden="true">
            <span style="width: 7.5rem" />
            <span style="width: 4.2rem" />
            <span style="width: 5.8rem" />
            <span style="width: 3.4rem" />
            <span style="width: 6.2rem" />
          </div>
          <p class="editor-cloud__hint">Preview — typed replies show up here live</p>
        </div>

        <!-- Word cloud -->
        <div v-else-if="selected.type === 'WORD_CLOUD'" class="editor-cloud" aria-hidden="true">
          <div class="editor-cloud__stage">
            <span
              v-for="word in cloudWords"
              :key="word.text"
              class="editor-cloud__word"
              :class="[
                `editor-cloud__word--${word.size}`,
                `editor-cloud__word--${word.color}`,
              ]"
            >
              {{ word.text }}
            </span>
          </div>
        </div>

        <!-- Rating -->
        <div v-else-if="selected.type === 'RATING'" class="editor-rating">
          <div class="editor-stars" aria-hidden="true">
            <span v-for="n in ratingMax" :key="n" :class="{ 'editor-stars__lit': n <= 3 }">★</span>
          </div>
          <p class="editor-slide__response-label">
            Rate from {{ draftConfig.min ?? 1 }}–{{ ratingMax }}
          </p>
        </div>

        <!-- Scale -->
        <div v-else-if="selected.type === 'SCALE'" class="editor-scale-block">
          <div class="editor-scale-labels">
            <span>{{ minLabel }}</span>
            <span>{{ maxLabel }}</span>
          </div>
          <div class="editor-scale-track">
            <button
              v-for="tick in scaleTicks"
              :key="tick"
              type="button"
              class="editor-scale-tick"
              tabindex="-1"
            >
              {{ tick }}
            </button>
          </div>
        </div>

        <div v-else-if="hasEditableOptions(selected.type)" class="editor-slide__options" />
        </template>

        <div v-if="showJoiningInfo" class="editor-slide__join">
          Join at pulse · <strong>{{ joinCode || '————' }}</strong>
        </div>
      </div>
      </div>
      <slot name="tools" />
    </div>
  </main>
</template>

<style scoped>
.editor-canvas-wrap {
  position: relative;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  background: #f2f1f0;
}

.editor-empty {
  margin: auto;
  max-width: 22rem;
  padding: 4rem 1.5rem;
  text-align: center;
}

.editor-empty__icon {
  margin: 0 auto;
  display: flex;
  width: 3.5rem;
  height: 3.5rem;
  align-items: center;
  justify-content: center;
  border-radius: 1rem;
  background: white;
  color: var(--pulse-magenta);
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
}

.editor-empty h2 {
  margin: 1.1rem 0 0.4rem;
  font-size: 1.35rem;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.editor-empty p {
  margin: 0;
  font-size: 0.875rem;
  line-height: 1.5;
  color: var(--pulse-muted);
}

.editor-empty__cta {
  margin-top: 1.25rem;
  border: 0;
  border-radius: 999px;
  background: var(--pulse-purple);
  color: white;
  font-size: 0.875rem;
  font-weight: 600;
  padding: 0.7rem 1.2rem;
  cursor: pointer;
  box-shadow: 0 8px 20px rgba(20, 184, 166, 0.22);
}

.editor-stage {
  position: relative;
  container-type: size;
  display: flex;
  height: 100%;
  min-height: 0;
  align-items: flex-start;
  justify-content: center;
  padding: 0.75rem 3.25rem 0.85rem 0.85rem;
}

.editor-slide-frame {
  aspect-ratio: 16 / 9;
  width: min(100cqw, calc(100cqh * 16 / 9));
  max-width: 100%;
  max-height: 100%;
  height: auto;
  transition:
    width 0.34s cubic-bezier(0.22, 1, 0.36, 1),
    max-width 0.34s cubic-bezier(0.22, 1, 0.36, 1);
}

.editor-slide {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 0.5rem;
  background: white;
  box-shadow: none;
  border: 1px solid rgba(15, 23, 42, 0.12);
  padding: clamp(1.5rem, 3.5vw, 2.75rem) clamp(1.75rem, 4vw, 3.25rem) clamp(2rem, 4vw, 3rem);
  overflow: hidden;
  animation: editor-in 0.4s cubic-bezier(0.22, 1, 0.36, 1) both;
  display: flex;
  flex-direction: column;
}

.editor-slide--content {
  justify-content: stretch;
  padding-top: clamp(1.75rem, 3.5vw, 2.75rem);
  padding-bottom: clamp(2.25rem, 4vw, 3rem);
}

.editor-slide__brand {
  position: absolute;
  top: 1rem;
  right: 1.25rem;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.68rem;
  font-weight: 700;
  color: #a8b3bd;
  z-index: 2;
}

.editor-slide__brand-mark {
  display: inline-flex;
  width: 1.15rem;
  height: 1.15rem;
  align-items: center;
  justify-content: center;
  border-radius: 0.3rem;
  background: linear-gradient(135deg, #14b8a6, #2dd4bf);
  color: white;
}

.editor-slide__prompt-wrap {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  max-width: none;
  flex-shrink: 0;
  min-height: 3rem;
  padding: 0.8rem 1rem;
  border: 2px solid transparent;
  border-radius: 0.8rem;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.editor-slide__prompt-wrap--focus {
  border-color: var(--pulse-purple);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--pulse-purple) 18%, transparent);
}

.editor-slide__prompt {
  width: 100%;
  resize: none;
  border: 0;
  border-radius: 0;
  background: transparent;
  padding: 0;
  margin: 0;
  min-height: 1.45em;
  max-height: 3.2em;
  font-size: clamp(1.45rem, 2.8vw, 2rem);
  font-weight: 500;
  line-height: 1.3;
  letter-spacing: -0.025em;
  color: #334155;
  outline: none;
  field-sizing: content;
  overflow-y: auto;
}

.editor-slide__prompt::placeholder {
  color: #c5d0cc;
}

.editor-slide__prompt--starter {
  color: #94a3b8;
  font-weight: 500;
}

.editor-slide__prompt:focus,
.editor-slide__prompt:focus-visible {
  outline: none !important;
  box-shadow: none !important;
  --tw-ring-shadow: 0 0 #0000;
  --tw-ring-offset-shadow: 0 0 #0000;
  --tw-ring-offset-width: 0px;
}

.editor-toolbar {
  position: absolute;
  left: 50%;
  bottom: calc(100% + 0.55rem);
  transform: translateX(-50%);
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.35rem 0.5rem;
  border-radius: 0.65rem;
  background: white;
  border: 1px solid var(--pulse-border);
  box-shadow: 0 10px 28px rgba(15, 23, 42, 0.12);
  white-space: nowrap;
  z-index: 5;
}

.editor-toolbar__style {
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--pulse-ink);
  padding: 0.2rem 0.45rem;
  border-radius: 0.4rem;
  background: var(--pulse-bg);
}

.editor-toolbar__swatch {
  width: 1rem;
  height: 1rem;
  border-radius: 999px;
  background: #0b1220;
  border: 1px solid #d7e5e1;
}

.editor-toolbar__btn {
  border: 0;
  background: transparent;
  width: 1.6rem;
  height: 1.6rem;
  border-radius: 0.35rem;
  color: var(--pulse-ink);
  cursor: default;
  opacity: 0.55;
}

.editor-toolbar__sep {
  width: 1px;
  height: 1rem;
  background: var(--pulse-border);
  margin: 0 0.15rem;
}

.editor-toolbar__hint {
  font-size: 0.65rem;
  font-weight: 600;
  color: var(--pulse-muted);
  padding-right: 0.25rem;
}

.editor-slide__options,
.editor-rank,
.editor-open,
.editor-rating,
.editor-scale-block {
  margin-top: clamp(1.25rem, 3vw, 2.25rem);
  max-width: 38rem;
  flex: 1;
  min-height: 0;
}

.editor-cloud {
  flex: 1;
  min-height: 0;
  max-width: none;
  width: 100%;
  margin-top: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.editor-cloud__hint {
  margin: 0;
  font-size: 0.78rem;
  font-weight: 500;
  color: #a8b3bd;
  letter-spacing: 0.01em;
}

.editor-slide__options,
.editor-rank {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
}

.editor-option {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  border-bottom: 3px solid color-mix(in srgb, var(--pulse-purple) 45%, #cbd5e1);
  padding: 0.35rem 0 0.55rem;
}

.editor-option:nth-child(2) {
  border-bottom-color: color-mix(in srgb, #8b7cf6 55%, #cbd5e1);
}
.editor-option:nth-child(3) {
  border-bottom-color: color-mix(in srgb, #5b9fed 55%, #cbd5e1);
}
.editor-option:nth-child(4) {
  border-bottom-color: color-mix(in srgb, #f59e0b 55%, #cbd5e1);
}
.editor-option:nth-child(5) {
  border-bottom-color: color-mix(in srgb, #94a3b8 55%, #cbd5e1);
}

.editor-option__letter {
  flex-shrink: 0;
  width: 1.5rem;
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--pulse-muted);
}

.editor-option__input,
.editor-rank__input {
  flex: 1;
  min-width: 0;
  border: 0;
  background: transparent;
  font-size: 1rem;
  font-weight: 500;
  color: var(--pulse-ink);
  outline: none;
  padding: 0.25rem 0;
}

.editor-option__remove {
  border: 0;
  background: transparent;
  color: var(--pulse-muted);
  opacity: 0;
  cursor: pointer;
  padding: 0.2rem 0.35rem;
  border-radius: 999px;
  transition: opacity 0.15s, background 0.15s, color 0.15s;
}

.editor-option:hover .editor-option__remove,
.editor-rank__row:hover .editor-option__remove {
  opacity: 1;
}

.editor-option__remove:hover {
  background: #fee2e2;
  color: var(--pulse-danger);
}

.editor-option__count {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--pulse-ink);
  min-width: 1.25rem;
  text-align: right;
}

.editor-option__add {
  align-self: flex-start;
  margin-top: 0.35rem;
  border: 0;
  background: transparent;
  color: var(--pulse-magenta);
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  padding: 0.35rem 0.15rem;
}

.editor-option__add:hover {
  text-decoration: underline;
}

.editor-rank__row {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  border: 1px solid var(--pulse-border);
  border-radius: 0.75rem;
  padding: 0.55rem 0.7rem;
  background: #fafbfb;
}

.editor-rank__handle {
  color: #cbd5e1;
  font-size: 0.7rem;
  letter-spacing: -0.08em;
  user-select: none;
}

.editor-rank__num {
  display: inline-flex;
  width: 1.5rem;
  height: 1.5rem;
  align-items: center;
  justify-content: center;
  border-radius: 0.4rem;
  background: var(--pulse-soft);
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--pulse-magenta);
}

.editor-open__field {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border: 1.5px dashed #c5d4cf;
  border-radius: 0.85rem;
  padding: 1rem 1.1rem;
  background: #f8faf9;
  margin-bottom: 1.1rem;
}

.editor-open__placeholder {
  color: #94a3b8;
  font-size: 0.95rem;
}

.editor-open__limit {
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--pulse-muted);
}

.editor-bubbles {
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
}

.editor-bubbles span {
  height: 2.1rem;
  border-radius: 999px;
  background: #eef2f3;
}

.editor-cloud__stage {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  align-content: center;
  gap: 0.55rem 1.35rem;
  width: min(90%, 44rem);
  max-width: 100%;
  padding: 0.5rem 1rem;
}

.editor-cloud__word {
  position: static;
  transform: none;
  font-weight: 500;
  letter-spacing: -0.01em;
  line-height: 1.05;
  white-space: nowrap;
  user-select: none;
  opacity: 0.72;
}

.editor-cloud__word--xl {
  flex: 1 0 100%;
  text-align: center;
  font-size: clamp(3.75rem, 7.5vw, 6rem);
  font-weight: 600;
  margin: 0.15rem 0;
}
.editor-cloud__word--lg { font-size: clamp(2.4rem, 4.8vw, 3.6rem); }
.editor-cloud__word--md { font-size: clamp(2rem, 4vw, 3rem); }
.editor-cloud__word--sm { font-size: clamp(1.65rem, 3.2vw, 2.4rem); }
.editor-cloud__word--xs { font-size: clamp(1.35rem, 2.6vw, 1.9rem); opacity: 0.55; }

/* Soft multi-tone empty-state palette */
.editor-cloud__word--blue { color: #8eb4ea; }
.editor-cloud__word--sky { color: #7ec4d8; }
.editor-cloud__word--mint { color: #7ec4b0; }
.editor-cloud__word--violet { color: #a89ad8; }
.editor-cloud__word--coral { color: #f0a090; }
.editor-cloud__word--rose { color: #e8a0b4; }
.editor-cloud__word--lilac { color: #c8b0dc; }

.editor-stars {
  display: flex;
  gap: 0.45rem;
  font-size: 2rem;
  color: #d7e5e1;
  letter-spacing: 0.08em;
}

.editor-stars__lit {
  color: #f59e0b;
}

.editor-slide__response-label {
  margin: 0.85rem 0 0;
  font-size: 0.85rem;
  color: var(--pulse-muted);
}

.editor-scale-labels {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--pulse-muted);
  margin-bottom: 0.85rem;
}

.editor-scale-track {
  display: flex;
  gap: 0.5rem;
}

.editor-scale-tick {
  flex: 1;
  border: 1px solid var(--pulse-border);
  border-radius: 0.65rem;
  background: #f8faf9;
  padding: 0.85rem 0.35rem;
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--pulse-ink);
  cursor: default;
}

.editor-scale-tick:nth-child(1) { border-bottom: 3px solid var(--pulse-bar-1); }
.editor-scale-tick:nth-child(2) { border-bottom: 3px solid var(--pulse-bar-2); }
.editor-scale-tick:nth-child(3) { border-bottom: 3px solid var(--pulse-bar-3); }
.editor-scale-tick:nth-child(4) { border-bottom: 3px solid var(--pulse-bar-4); }
.editor-scale-tick:nth-child(5) { border-bottom: 3px solid var(--pulse-bar-5); }
.editor-scale-tick:nth-child(6) { border-bottom: 3px solid var(--pulse-bar-6); }

.editor-slide__join {
  position: absolute;
  right: 1.25rem;
  bottom: 0.9rem;
  font-size: 0.72rem;
  color: #94a3b8;
  z-index: 2;
}

.editor-slide__join strong {
  color: #64748b;
  letter-spacing: 0.06em;
  font-weight: 700;
}

:deep(.content-slide) {
  flex: 1;
  min-height: 0;
}

@keyframes editor-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .editor-slide {
    animation: none;
  }
}

@media (max-width: 900px) {
  .editor-stage {
    container-type: normal;
    padding: 0.75rem 0.75rem 4.5rem;
    align-items: flex-start;
    overflow: auto;
  }

  .editor-slide-frame {
    aspect-ratio: 16 / 9;
    width: 100%;
    max-width: 100%;
    max-height: none;
  }

  .editor-slide {
    min-height: 0;
  }

  .editor-toolbar {
    left: 0;
    transform: none;
  }

  .editor-scale-track {
    flex-wrap: wrap;
  }
}

@supports not (width: 1cqw) {
  .editor-slide-frame {
    width: min(100%, calc((100vh - 7.5rem) * 16 / 9));
  }
}

@media (prefers-reduced-motion: reduce) {
  .editor-slide-frame {
    transition: none;
  }
}
</style>
