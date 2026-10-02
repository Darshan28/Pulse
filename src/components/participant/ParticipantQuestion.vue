<script setup lang="ts">
import { computed, ref } from 'vue'
import type { QuestionDTO } from '@shared/types'
import Button from '@/components/ui/Button.vue'

const props = defineProps<{ question: QuestionDTO }>()
const emit = defineEmits<{ submit: [value: unknown] }>()

const selected = ref<string[]>([])
const rating = ref<number | null>(null)
const text = ref('')
const rankOrder = ref<string[]>([])
const submitting = ref(false)

const options = computed(() => [...props.question.options].sort((a, b) => a.order - b.order))

if (props.question.type === 'RANKING') {
  rankOrder.value = options.value.map((o) => o.id)
}

function toggleOption(id: string) {
  const cfg = props.question.config as { allowMultiple?: boolean }
  if (cfg.allowMultiple) {
    selected.value = selected.value.includes(id)
      ? selected.value.filter((x) => x !== id)
      : [...selected.value, id]
  } else {
    selected.value = [id]
  }
}

function moveRank(index: number, dir: -1 | 1) {
  const next = index + dir
  if (next < 0 || next >= rankOrder.value.length) return
  const copy = [...rankOrder.value]
  ;[copy[index], copy[next]] = [copy[next], copy[index]]
  rankOrder.value = copy
}

async function onSubmit() {
  submitting.value = true
  try {
    let value: unknown
    switch (props.question.type) {
      case 'MULTIPLE_CHOICE':
        value = { optionIds: selected.value }
        break
      case 'YES_NO':
        value = { value: selected.value[0] === options.value[0]?.id ? 'yes' : 'no' }
        if (options.value.length === 0) value = { value: selected.value[0] }
        break
      case 'RATING':
      case 'SCALE':
        value = { value: rating.value }
        break
      case 'OPEN_TEXT':
      case 'WORD_CLOUD':
        value = { text: text.value }
        break
      case 'RANKING':
        value = { order: rankOrder.value }
        break
    }
    emit('submit', value)
  } finally {
    submitting.value = false
  }
}

const cfg = computed(() => props.question.config as unknown as Record<string, number | string | boolean>)
</script>

<template>
  <form class="space-y-6" @submit.prevent="onSubmit">
    <h2 class="text-2xl font-bold leading-snug">{{ question.prompt }}</h2>

    <div v-if="question.type === 'MULTIPLE_CHOICE' || question.type === 'YES_NO'" class="space-y-3">
      <button
        v-for="opt in options"
        :key="opt.id"
        type="button"
        class="flex w-full min-h-12 items-center gap-3 rounded-2xl border px-4 py-3 text-left font-medium transition"
        :class="
          selected.includes(opt.id)
            ? 'border-pulse-purple bg-pulse-soft text-pulse-magenta shadow-sm'
            : 'border-pulse-border bg-white hover:border-pulse-purple/40'
        "
        @click="toggleOption(opt.id)"
      >
        <span
          class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2"
          :class="
            selected.includes(opt.id)
              ? 'border-pulse-purple bg-pulse-purple text-white'
              : 'border-pulse-border'
          "
          aria-hidden="true"
        >
          <svg
            v-if="selected.includes(opt.id)"
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="none"
          >
            <path
              d="M5 12.5 10 17l9-10"
              stroke="currentColor"
              stroke-width="3"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </span>
        {{ opt.label }}
      </button>
    </div>

    <div v-else-if="question.type === 'RATING' || question.type === 'SCALE'" class="space-y-4">
      <div class="flex justify-between text-xs text-pulse-muted">
        <span>{{ cfg.minLabel || cfg.min }}</span>
        <span>{{ cfg.maxLabel || cfg.max }}</span>
      </div>
      <div class="flex flex-wrap gap-2 justify-center">
        <button
          v-for="n in Array.from(
            { length: Number(cfg.max) - Number(cfg.min) + 1 },
            (_, i) => Number(cfg.min) + i,
          )"
          :key="n"
          type="button"
          class="h-12 w-12 rounded-full border font-semibold"
          :class="rating === n ? 'bg-pulse-purple text-white border-pulse-purple' : 'border-pulse-border'"
          @click="rating = n"
        >
          {{ n }}
        </button>
      </div>
    </div>

    <div v-else-if="question.type === 'OPEN_TEXT' || question.type === 'WORD_CLOUD'">
      <textarea
        v-model="text"
        class="input min-h-28"
        :maxlength="Number(cfg.maxLength || 500)"
        :placeholder="question.type === 'WORD_CLOUD' ? 'One word…' : 'Type your answer…'"
      />
      <p class="text-xs text-pulse-muted mt-1 text-right">{{ text.length }}/{{ cfg.maxLength || 500 }}</p>
    </div>

    <div v-else-if="question.type === 'RANKING'" class="space-y-2">
      <div
        v-for="(id, index) in rankOrder"
        :key="id"
        class="flex items-center gap-2 rounded-2xl border border-pulse-border bg-white px-3 py-3"
      >
        <span class="font-bold text-pulse-purple w-6">{{ index + 1 }}</span>
        <span class="flex-1 font-medium">{{ options.find((o) => o.id === id)?.label }}</span>
        <button type="button" class="btn-ghost px-2 py-1" @click="moveRank(index, -1)">↑</button>
        <button type="button" class="btn-ghost px-2 py-1" @click="moveRank(index, 1)">↓</button>
      </div>
    </div>

    <Button type="submit" class="w-full" :disabled="submitting">
      Submit <span aria-hidden="true">→</span>
    </Button>
  </form>
</template>
