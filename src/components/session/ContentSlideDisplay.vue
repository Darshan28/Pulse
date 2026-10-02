<script setup lang="ts">
import { computed, ref } from 'vue'
import type { ContentSlideConfig, QuestionType } from '@shared/types'
import { contentBodyLines } from '@/components/editor/questionTypeMeta'

const props = withDefaults(
  defineProps<{
    type: QuestionType
    title: string
    config: Partial<ContentSlideConfig>
    editable?: boolean
    tone?: 'light' | 'dark'
  }>(),
  { editable: false, tone: 'light' },
)

const emit = defineEmits<{
  'update:title': [value: string]
  'update:body': [value: string]
  'update:leftTitle': [value: string]
  'update:leftBody': [value: string]
  'update:rightTitle': [value: string]
  'update:rightBody': [value: string]
  blur: []
}>()

const bodyFocused = ref(false)
const titleFocused = ref(false)

const layout = computed(() => props.config.layout || 'media_right')
const bodyLines = computed(() => contentBodyLines(String(props.config.body || '')))
const imageUrl = computed(() => String(props.config.imageUrl || ''))
const videoUrl = computed(() => String(props.config.videoUrl || ''))
const bodyEmpty = computed(() => !String(props.config.body || '').trim())
const showMedia = computed(() => {
  if (props.type === 'CONTENT_COMPARE' || props.type === 'CONTENT_INSTRUCTIONS') return false
  if (props.type === 'CONTENT_VIDEO' || props.type === 'CONTENT_IMAGE') return true
  return layout.value !== 'text_only'
})
const mediaFull = computed(() => layout.value === 'media_full')
const mediaLeft = computed(() => layout.value === 'media_left')

function youtubeEmbed(url: string) {
  try {
    const u = new URL(url)
    if (u.hostname.includes('youtu.be')) {
      return `https://www.youtube.com/embed/${u.pathname.slice(1)}`
    }
    if (u.hostname.includes('youtube.com')) {
      const id = u.searchParams.get('v')
      if (id) return `https://www.youtube.com/embed/${id}`
    }
  } catch {
    /* ignore */
  }
  return ''
}

const embedSrc = computed(() => (videoUrl.value ? youtubeEmbed(videoUrl.value) : ''))
</script>

<template>
  <div
    class="content-slide"
    :class="[
      `content-slide--${tone}`,
      {
        'content-slide--text-only': !showMedia && type !== 'CONTENT_COMPARE',
        'content-slide--media-left': mediaLeft && showMedia && !mediaFull,
        'content-slide--media-full': mediaFull,
        'content-slide--compare': type === 'CONTENT_COMPARE',
      },
    ]"
    :style="{ background: config.backgroundColor || undefined }"
  >
    <template v-if="type === 'CONTENT_COMPARE'">
      <div class="content-slide__title-wrap content-slide__title-wrap--full">
        <textarea
          v-if="editable"
          :value="title"
          class="content-slide__title"
          rows="2"
          placeholder="Compare title…"
          @input="emit('update:title', ($event.target as HTMLTextAreaElement).value)"
          @blur="emit('blur')"
        />
        <h2 v-else class="content-slide__title">{{ title }}</h2>
      </div>
      <div class="content-slide__compare">
        <div class="content-slide__col">
          <input
            v-if="editable"
            class="content-slide__col-title"
            :value="config.leftTitle || ''"
            placeholder="Left title"
            @input="emit('update:leftTitle', ($event.target as HTMLInputElement).value)"
            @blur="emit('blur')"
          />
          <h3 v-else class="content-slide__col-title">{{ config.leftTitle || 'Option A' }}</h3>
          <textarea
            v-if="editable"
            class="content-slide__col-body"
            rows="5"
            :value="config.leftBody || ''"
            placeholder="Left side details…"
            @input="emit('update:leftBody', ($event.target as HTMLTextAreaElement).value)"
            @blur="emit('blur')"
          />
          <p v-else class="content-slide__col-body">{{ config.leftBody }}</p>
        </div>
        <div class="content-slide__col">
          <input
            v-if="editable"
            class="content-slide__col-title"
            :value="config.rightTitle || ''"
            placeholder="Right title"
            @input="emit('update:rightTitle', ($event.target as HTMLInputElement).value)"
            @blur="emit('blur')"
          />
          <h3 v-else class="content-slide__col-title">{{ config.rightTitle || 'Option B' }}</h3>
          <textarea
            v-if="editable"
            class="content-slide__col-body"
            rows="5"
            :value="config.rightBody || ''"
            placeholder="Right side details…"
            @input="emit('update:rightBody', ($event.target as HTMLTextAreaElement).value)"
            @blur="emit('blur')"
          />
          <p v-else class="content-slide__col-body">{{ config.rightBody }}</p>
        </div>
      </div>
    </template>

    <template v-else>
      <div v-if="!mediaFull" class="content-slide__copy">
        <div
          class="content-slide__title-shell"
          :class="{ 'content-slide__title-shell--focus': titleFocused }"
        >
          <textarea
            v-if="editable"
            :value="title"
            class="content-slide__title"
            rows="2"
            placeholder="Add a title…"
            @focus="titleFocused = true"
            @input="emit('update:title', ($event.target as HTMLTextAreaElement).value)"
            @blur="titleFocused = false; emit('blur')"
          />
          <h2 v-else class="content-slide__title">{{ title }}</h2>
        </div>

        <div
          v-if="editable"
          class="content-slide__body-shell"
          :class="{
            'content-slide__body-shell--empty': bodyEmpty && !bodyFocused,
            'content-slide__body-shell--focus': bodyFocused,
            'content-slide__body-shell--instructions': type === 'CONTENT_INSTRUCTIONS',
          }"
        >
          <div v-if="bodyEmpty && !bodyFocused" class="content-slide__empty" aria-hidden="true">
            <span class="content-slide__empty-icon">+</span>
            <span class="content-slide__empty-label">
              {{
                type === 'CONTENT_INSTRUCTIONS'
                  ? 'Add step-by-step instructions'
                  : 'Add supporting text'
              }}
            </span>
            <span class="content-slide__empty-hint">Click to start typing</span>
          </div>
          <textarea
            class="content-slide__body-input"
            :class="{ 'content-slide__body-input--ghost': bodyEmpty && !bodyFocused }"
            rows="5"
            :value="config.body || ''"
            :placeholder="
              type === 'CONTENT_INSTRUCTIONS'
                ? '1. Join with the code\n2. Answer when prompted\n3. Watch results appear'
                : 'Tell the room what this moment is about…'
            "
            @focus="bodyFocused = true"
            @input="emit('update:body', ($event.target as HTMLTextAreaElement).value)"
            @blur="bodyFocused = false; emit('blur')"
          />
        </div>

        <ul
          v-else-if="type === 'CONTENT_INSTRUCTIONS' && bodyLines.length"
          class="content-slide__list"
          :class="{ 'content-slide__list--animate': config.animateListItems }"
        >
          <li v-for="(line, i) in bodyLines" :key="i">{{ line.replace(/^\d+\.\s*/, '') }}</li>
        </ul>
        <p v-else-if="config.body" class="content-slide__body">{{ config.body }}</p>
      </div>

      <div
        v-if="showMedia || type === 'CONTENT_VIDEO' || type === 'CONTENT_IMAGE' || mediaFull"
        class="content-slide__media"
      >
        <template v-if="type === 'CONTENT_VIDEO'">
          <iframe
            v-if="embedSrc"
            class="content-slide__video"
            :src="embedSrc"
            title="Video"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen
          />
          <div v-else class="content-slide__placeholder content-slide__placeholder--video">
            <span class="content-slide__play" aria-hidden="true">▶</span>
            <span>Add a YouTube URL in Edit</span>
          </div>
        </template>
        <img
          v-else-if="imageUrl"
          :src="imageUrl"
          alt=""
          class="content-slide__image"
        />
        <div v-else class="content-slide__placeholder" aria-hidden="true">
          <svg viewBox="0 0 220 180" fill="none" class="content-slide__art">
            <rect
              x="18"
              y="22"
              width="184"
              height="136"
              rx="16"
              stroke="currentColor"
              stroke-width="2"
              opacity="0.22"
            />
            <circle cx="78" cy="78" r="18" stroke="currentColor" stroke-width="2.5" />
            <path
              d="M48 132c18-28 34-16 52-40 16-22 36-18 56 2"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linecap="round"
            />
            <path
              d="M132 70c10-16 28-18 40-4"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linecap="round"
            />
            <circle cx="150" cy="58" r="5" fill="currentColor" opacity="0.35" />
          </svg>
          <span v-if="editable" class="content-slide__placeholder-label">Add an image URL in Edit</span>
        </div>

        <div v-if="mediaFull" class="content-slide__overlay-title">
          <textarea
            v-if="editable"
            :value="title"
            class="content-slide__title"
            rows="2"
            placeholder="Slide title…"
            @input="emit('update:title', ($event.target as HTMLTextAreaElement).value)"
            @blur="emit('blur')"
          />
          <h2 v-else class="content-slide__title">{{ title }}</h2>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.content-slide {
  display: grid;
  grid-template-columns: 1.05fr 0.95fr;
  gap: clamp(1.25rem, 3vw, 2.5rem);
  align-items: center;
  min-height: 0;
  width: 100%;
  height: 100%;
}

.content-slide--dark {
  color: white;
}

.content-slide--media-left {
  direction: rtl;
}

.content-slide--media-left > * {
  direction: ltr;
}

.content-slide--media-full {
  grid-template-columns: 1fr;
  position: relative;
}

.content-slide--text-only,
.content-slide--compare {
  grid-template-columns: 1fr;
  align-content: stretch;
  align-items: stretch;
}

.content-slide--text-only .content-slide__copy {
  max-width: none;
  width: 100%;
  height: 100%;
  min-height: 0;
}

.content-slide--text-only .content-slide__body-shell {
  width: 100%;
  flex: 1;
  min-height: 12rem;
  display: flex;
  flex-direction: column;
}

.content-slide--text-only .content-slide__body-input {
  flex: 1;
  min-height: 0;
  height: 100%;
}

.content-slide__copy {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.content-slide__title-wrap--full {
  margin-bottom: 0.25rem;
}

.content-slide__title-shell,
.content-slide__body-shell {
  position: relative;
  border-radius: 0.45rem;
  border: 2px solid transparent;
  transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
}

.content-slide__title-shell--focus,
.content-slide__body-shell--focus {
  border-color: var(--pulse-purple);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--pulse-purple) 16%, transparent);
}

.content-slide__body-shell--empty {
  min-height: 8.5rem;
  border-style: dashed;
  border-color: #d5dde3;
  background: linear-gradient(180deg, #fbfcfc 0%, #f4f7f8 100%);
}

.content-slide--text-only .content-slide__body-shell--empty {
  min-height: 0;
}

.content-slide__body-shell--empty:hover {
  border-color: color-mix(in srgb, var(--pulse-purple) 45%, #d5dde3);
  background: #f7fbfa;
}

.content-slide__body-shell--instructions.content-slide__body-shell--empty {
  min-height: 10rem;
}

.content-slide__empty {
  pointer-events: none;
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: 0.2rem;
  padding: 1.1rem 1.2rem;
  z-index: 1;
}

.content-slide__empty-icon {
  display: inline-flex;
  width: 1.6rem;
  height: 1.6rem;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.35rem;
  border-radius: 999px;
  background: var(--pulse-soft);
  color: var(--pulse-magenta);
  font-size: 1rem;
  font-weight: 600;
  line-height: 1;
}

.content-slide__empty-label {
  font-size: 1rem;
  font-weight: 600;
  color: var(--pulse-ink);
}

.content-slide__empty-hint {
  font-size: 0.8rem;
  color: #94a3b8;
}

.content-slide__title,
.content-slide__col-title {
  margin: 0;
  width: 100%;
  border: 0;
  border-radius: 0.25rem;
  background: transparent;
  resize: none;
  font: inherit;
  font-weight: 700;
  letter-spacing: -0.03em;
  color: inherit;
  outline: none;
  box-shadow: none;
}

.content-slide__title:focus,
.content-slide__title:focus-visible,
.content-slide__body-input:focus,
.content-slide__body-input:focus-visible,
.content-slide__col-title:focus,
.content-slide__col-title:focus-visible,
.content-slide__col-body:focus,
.content-slide__col-body:focus-visible {
  outline: none !important;
  box-shadow: none !important;
  --tw-ring-shadow: 0 0 #0000;
  --tw-ring-offset-shadow: 0 0 #0000;
  --tw-ring-offset-width: 0px;
}

.content-slide__title {
  font-size: clamp(1.85rem, 3.6vw, 2.75rem);
  line-height: 1.12;
  padding: 0.2rem 0.35rem;
}

.content-slide__body,
.content-slide__body-input,
.content-slide__col-body {
  margin: 0;
  font-size: clamp(1.02rem, 1.7vw, 1.2rem);
  line-height: 1.55;
  color: #64748b;
  white-space: pre-wrap;
}

.content-slide--dark .content-slide__body,
.content-slide--dark .content-slide__col-body {
  color: rgba(255, 255, 255, 0.82);
}

.content-slide__body-input,
.content-slide__col-body {
  position: relative;
  z-index: 2;
  width: 100%;
  border: 0;
  border-radius: 0.35rem;
  background: transparent;
  resize: none;
  padding: 0.85rem 1rem;
  outline: none;
  font: inherit;
  min-height: 8.5rem;
}

.content-slide__body-input--ghost {
  color: transparent;
  caret-color: var(--pulse-ink);
}

.content-slide__body-input--ghost::placeholder {
  color: transparent;
}

.content-slide__body-shell--instructions .content-slide__body-input {
  min-height: 10rem;
}

.content-slide__col-body {
  margin-top: 0.65rem;
  min-height: 6rem;
  padding: 0.35rem 0.4rem;
}

.content-slide__list {
  margin: 0.35rem 0 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
}

.content-slide__list li {
  position: relative;
  padding-left: 1.5rem;
  font-size: 1.05rem;
  font-weight: 500;
  color: var(--pulse-ink);
}

.content-slide--dark .content-slide__list li {
  color: white;
}

.content-slide__list li::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0.45rem;
  width: 0.55rem;
  height: 0.55rem;
  border-radius: 999px;
  background: var(--pulse-purple);
}

.content-slide__media {
  position: relative;
  min-height: 0;
  height: 100%;
  border-radius: 0.85rem;
  overflow: hidden;
  background: #f1f5f4;
  align-self: stretch;
}

.content-slide--dark .content-slide__media {
  background: rgba(255, 255, 255, 0.08);
}

.content-slide__image,
.content-slide__video {
  display: block;
  width: 100%;
  height: 100%;
  min-height: 12rem;
  object-fit: cover;
  border: 0;
}

.content-slide__placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.65rem;
  height: 100%;
  min-height: 12rem;
  color: #94a3b8;
  padding: 1.5rem;
  text-align: center;
  font-size: 0.8rem;
  font-weight: 600;
  background:
    radial-gradient(ellipse 55% 45% at 50% 45%, rgba(20, 184, 166, 0.08), transparent 70%),
    #f4f7f6;
}

.content-slide__placeholder-label {
  color: #94a3b8;
}

.content-slide__art {
  width: min(100%, 13rem);
  color: #14b8a6;
  opacity: 0.85;
}

.content-slide__play {
  display: inline-flex;
  width: 3rem;
  height: 3rem;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: var(--pulse-purple);
  color: white;
  font-size: 0.9rem;
}

.content-slide__overlay-title {
  position: absolute;
  left: 1.25rem;
  right: 1.25rem;
  bottom: 1.25rem;
  padding: 0.75rem 1rem;
  border-radius: 0.65rem;
  background: rgba(255, 255, 255, 0.92);
  color: var(--pulse-ink);
}

.content-slide__compare {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  flex: 1;
}

.content-slide__col {
  border: 1px solid var(--pulse-border);
  border-radius: 0.85rem;
  padding: 1rem 1.1rem;
  background: #f8faf9;
  min-height: 12rem;
}

.content-slide--dark .content-slide__col {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.15);
}

.content-slide__col-title {
  font-size: 1.1rem;
  font-weight: 700;
  padding: 0.2rem 0.3rem;
}

.content-slide__col:first-child {
  border-bottom: 3px solid var(--pulse-purple);
}

.content-slide__col:last-child {
  border-bottom: 3px solid #8b7cf6;
}

@media (max-width: 800px) {
  .content-slide,
  .content-slide--media-left {
    grid-template-columns: 1fr;
    direction: ltr;
  }

  .content-slide__compare {
    grid-template-columns: 1fr;
  }

  .content-slide__media {
    min-height: 11rem;
  }
}
</style>
