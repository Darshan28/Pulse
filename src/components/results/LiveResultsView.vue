<script setup lang="ts">
import type { LiveResults } from '@shared/types'
import MultipleChoiceResults from './MultipleChoiceResults.vue'
import RatingResults from './RatingResults.vue'
import TextResults from './TextResults.vue'
import WordCloudResults from './WordCloudResults.vue'
import RankingResults from './RankingResults.vue'

defineProps<{ results: LiveResults; large?: boolean }>()
</script>

<template>
  <MultipleChoiceResults
    v-if="results.type === 'MULTIPLE_CHOICE' || results.type === 'YES_NO'"
    :results="results"
    :large="large"
  />
  <RatingResults
    v-else-if="results.type === 'RATING' || results.type === 'SCALE'"
    :results="results"
    :large="large"
  />
  <TextResults v-else-if="results.type === 'OPEN_TEXT'" :results="results" />
  <WordCloudResults v-else-if="results.type === 'WORD_CLOUD'" :results="results" :large="large" />
  <RankingResults v-else-if="results.type === 'RANKING'" :results="results" :large="large" />
</template>
