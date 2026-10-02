<script setup lang="ts">
defineProps<{
  title: string
  joinCode: string
  savedFlash?: boolean
  mode?: 'create' | 'results'
}>()

defineEmits<{
  share: []
  preview: []
  present: []
  results: []
  create: []
}>()
</script>

<template>
  <header class="editor-topbar">
    <div class="editor-topbar__left">
      <RouterLink to="/app/sessions" class="editor-topbar__back" aria-label="Back to sessions">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M15 6l-6 6 6 6"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </RouterLink>
      <div class="editor-topbar__title-block min-w-0">
        <h1 class="editor-topbar__title">{{ title || 'Untitled session' }}</h1>
        <p class="editor-topbar__crumb">
          My sessions
          <span class="editor-topbar__code">· {{ joinCode || '—' }}</span>
        </p>
      </div>
    </div>

    <nav class="editor-topbar__tabs" aria-label="Editor mode">
      <button
        type="button"
        class="editor-topbar__tab"
        :class="{ 'editor-topbar__tab--active': mode !== 'results' }"
        @click="$emit('create')"
      >
        Create
      </button>
      <button
        type="button"
        class="editor-topbar__tab"
        :class="{ 'editor-topbar__tab--active': mode === 'results' }"
        @click="$emit('results')"
      >
        Results
      </button>
    </nav>

    <div class="editor-topbar__actions">
      <span v-if="savedFlash" class="editor-topbar__saved">Saved</span>
      <button type="button" class="editor-topbar__btn editor-topbar__btn--ghost" @click="$emit('share')">
        Share
      </button>
      <button type="button" class="editor-topbar__btn editor-topbar__btn--ghost" @click="$emit('preview')">
        Preview
      </button>
      <button type="button" class="editor-topbar__btn editor-topbar__btn--primary" @click="$emit('present')">
        Start presentation
      </button>
    </div>
  </header>
</template>

<style scoped>
.editor-topbar {
  position: relative;
  z-index: 30;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  align-items: center;
  gap: 0.75rem;
  min-height: 3.5rem;
  padding: 0.5rem 0.85rem;
  border-bottom: 1px solid color-mix(in srgb, var(--pulse-border) 80%, transparent);
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(16px);
}

.editor-topbar__left {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  min-width: 0;
}

.editor-topbar__back {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: 0.55rem;
  color: var(--pulse-muted);
  transition: background 0.15s, color 0.15s;
}

.editor-topbar__back:hover {
  background: var(--pulse-soft);
  color: var(--pulse-ink);
}

.editor-topbar__title {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.editor-topbar__crumb {
  margin: 0.1rem 0 0;
  font-size: 0.7rem;
  color: var(--pulse-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.editor-topbar__code {
  font-weight: 600;
  color: var(--pulse-magenta);
  letter-spacing: 0.04em;
}

.editor-topbar__tabs {
  display: inline-flex;
  align-items: center;
  gap: 0.15rem;
  padding: 0.2rem;
  border-radius: 999px;
  background: var(--pulse-bg);
  border: 1px solid color-mix(in srgb, var(--pulse-border) 70%, transparent);
}

.editor-topbar__tab {
  border: 0;
  background: transparent;
  border-radius: 999px;
  padding: 0.4rem 0.95rem;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--pulse-muted);
  cursor: pointer;
  transition: background 0.15s, color 0.15s, box-shadow 0.15s;
}

.editor-topbar__tab--active {
  background: white;
  color: var(--pulse-ink);
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.08);
}

.editor-topbar__actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.4rem;
  min-width: 0;
}

.editor-topbar__saved {
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--pulse-magenta);
  margin-right: 0.25rem;
}

.editor-topbar__btn {
  border: 0;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 600;
  border-radius: 999px;
  padding: 0.45rem 0.9rem;
  transition: background 0.15s, color 0.15s, box-shadow 0.15s, transform 0.15s;
  white-space: nowrap;
}

.editor-topbar__btn--ghost {
  background: white;
  color: var(--pulse-ink);
  border: 1px solid var(--pulse-border);
}

.editor-topbar__btn--ghost:hover {
  background: var(--pulse-soft);
}

.editor-topbar__btn--primary {
  background: var(--pulse-purple);
  color: white;
  box-shadow: 0 8px 20px rgba(20, 184, 166, 0.22);
}

.editor-topbar__btn--primary:hover {
  background: var(--pulse-magenta);
  transform: translateY(-1px);
}

@media (max-width: 900px) {
  .editor-topbar {
    grid-template-columns: 1fr auto;
    grid-template-areas:
      'left actions'
      'tabs tabs';
  }

  .editor-topbar__left {
    grid-area: left;
  }

  .editor-topbar__tabs {
    grid-area: tabs;
    justify-self: start;
  }

  .editor-topbar__actions {
    grid-area: actions;
  }

  .editor-topbar__btn--ghost {
    display: none;
  }
}
</style>
