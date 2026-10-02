<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { setAuthIntent } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'

const router = useRouter()
const auth = useAuthStore()
const signedIn = ref(false)

onMounted(async () => {
  await auth.init()
  signedIn.value = auth.isAuthenticated
})

async function startCreateSession() {
  await auth.init()
  setAuthIntent('/app/sessions/new')
  if (!auth.isAuthenticated) {
    await router.push({ path: '/auth', query: { next: '/app/sessions/new' } })
    return
  }
  if (!auth.onboardingCompleted) {
    await router.push({ path: '/onboarding', query: { next: '/app/sessions/new' } })
    return
  }
  await router.push('/app/sessions/new')
}

async function goSignIn() {
  setAuthIntent('/app/sessions')
  await router.push({ path: '/auth', query: { next: '/app/sessions' } })
}
</script>

<template>
  <div class="landing">
    <div class="landing-bg" aria-hidden="true">
      <div class="landing-orb landing-orb--a" />
      <div class="landing-orb landing-orb--b" />
      <div class="landing-orb landing-orb--c" />
      <svg class="landing-orbit" viewBox="0 0 1440 900" fill="none" preserveAspectRatio="xMidYMid slice">
        <ellipse cx="1100" cy="320" rx="540" ry="310" stroke="url(#og)" stroke-width="1.5" opacity="0.42" />
        <ellipse cx="1060" cy="350" rx="380" ry="220" stroke="url(#og)" stroke-width="1.15" opacity="0.28" />
        <path
          d="M-60 600 C280 400, 500 720, 780 500 S1220 290, 1520 470"
          stroke="url(#og)"
          stroke-width="1.5"
          opacity="0.34"
        />
        <defs>
          <linearGradient id="og" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#14B8A6" stop-opacity="0.1" />
            <stop offset="50%" stop-color="#14B8A6" stop-opacity="0.8" />
            <stop offset="100%" stop-color="#34D399" stop-opacity="0.12" />
          </linearGradient>
        </defs>
      </svg>
    </div>

    <header class="landing-header">
      <div class="landing-brand">
        <span class="landing-logo-mark" aria-hidden="true">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M2 12h3.2l2.1-5.5L11.5 18l2.8-8.2L16.8 12H22"
              stroke="currentColor"
              stroke-width="2.2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </span>
        <span class="landing-brand-name">Pulse</span>
      </div>
      <nav class="landing-nav">
        <button type="button" class="landing-nav-link" @click="router.push('/join')">
          Join a session
        </button>
        <button
          v-if="signedIn"
          type="button"
          class="landing-nav-link"
          @click="router.push('/app/sessions')"
        >
          Dashboard
        </button>
        <button
          v-else
          type="button"
          class="landing-nav-link"
          @click="goSignIn"
        >
          Sign in
        </button>
        <button type="button" class="landing-btn-primary" @click="startCreateSession">
          Create a session <span aria-hidden="true">→</span>
        </button>
      </nav>
    </header>

    <main class="landing-hero">
      <div class="landing-copy landing-fade">
        <div class="landing-badge">
          <span class="landing-badge-dot" aria-hidden="true" />
          LIVE AUDIENCE INTERACTION
        </div>

        <h1 class="landing-title">
          Feel the<br />
          <span class="landing-title-accent">room.</span>
        </h1>

        <p class="landing-subhead">Every voice. One pulse.</p>

        <p class="landing-desc">
          Turn any room into a live conversation. Create a session, invite your audience, and see
          what everyone thinks - instantly.
        </p>

        <div class="landing-ctas">
          <button
            type="button"
            class="landing-btn-primary landing-btn-hero"
            @click="startCreateSession"
          >
            Create a session <span aria-hidden="true">→</span>
          </button>
          <button
            type="button"
            class="landing-btn-secondary landing-btn-hero"
            @click="router.push('/join')"
          >
            Join a session
          </button>
        </div>

        <ul class="landing-features">
          <li>
            <span class="landing-feature-icon" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path
                  d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linejoin="round"
                />
              </svg>
            </span>
            No account required to join
          </li>
          <li>
            <span class="landing-feature-icon" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="4" width="18" height="14" rx="2" stroke="currentColor" stroke-width="2" />
                <path d="M8 20h8" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
              </svg>
            </span>
            Works on any device
          </li>
          <li>
            <span class="landing-feature-icon" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path
                  d="M4 19V5M10 19V9M16 19V7M22 19V11"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                />
              </svg>
            </span>
            Live results in real time
          </li>
        </ul>
      </div>

      <div class="landing-stage landing-fade landing-fade--delay">
        <img
          class="landing-stage-img"
          src="/pulse.png"
          alt="Pulse live session dashboard with audience phone view and real-time responses"
        />
      </div>
    </main>
  </div>
</template>

<style scoped>
.landing {
  --teal: #14b8a6;
  --teal-deep: #0f9f8a;
  --ink: #0b1220;
  --muted: #64748b;
  --soft: #e8f8f4;
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 100svh;
  overflow: hidden;
  color: var(--ink);
  background: #f5f8f7;
}

.landing-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
  background:
    radial-gradient(ellipse 50% 42% at 8% 20%, rgba(20, 184, 166, 0.16), transparent 70%),
    radial-gradient(ellipse 48% 40% at 92% 12%, rgba(52, 211, 153, 0.18), transparent 68%),
    radial-gradient(ellipse 40% 36% at 70% 88%, rgba(20, 184, 166, 0.1), transparent 70%),
    linear-gradient(180deg, #f8fbfa 0%, #f2f6f5 50%, #eef3f2 100%);
}

.landing-orb {
  position: absolute;
  border-radius: 9999px;
  filter: blur(1.5px);
  animation: landing-drift 14s ease-in-out infinite;
}

.landing-orb--a {
  width: min(24vw, 280px);
  height: min(24vw, 280px);
  top: 6%;
  right: 14%;
  background: radial-gradient(circle at 35% 35%, rgba(52, 211, 153, 0.55), rgba(20, 184, 166, 0.05) 72%);
}

.landing-orb--b {
  width: min(15vw, 170px);
  height: min(15vw, 170px);
  bottom: 12%;
  left: 5%;
  background: radial-gradient(circle at 40% 40%, rgba(20, 184, 166, 0.42), rgba(20, 184, 166, 0.04) 72%);
  animation-delay: -4s;
}

.landing-orb--c {
  width: min(9vw, 100px);
  height: min(9vw, 100px);
  top: 48%;
  left: 46%;
  background: radial-gradient(circle at 40% 40%, rgba(110, 231, 183, 0.5), transparent 70%);
  animation-delay: -7s;
}

.landing-orbit {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.landing-header {
  position: relative;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 1rem 1.25rem 0.5rem;
}

@media (min-width: 960px) {
  .landing-header {
    padding: 1.35rem clamp(1.5rem, 12vw, 12rem) 0.75rem;
  }
}

.landing-brand {
  display: flex;
  align-items: center;
  gap: 0.7rem;
}

.landing-logo-mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.4rem;
  height: 2.4rem;
  border-radius: 0.75rem;
  color: #fff;
  background: linear-gradient(135deg, #14b8a6, #2dd4bf);
  box-shadow: 0 10px 24px rgba(20, 184, 166, 0.3);
}

.landing-brand-name {
  font-size: 1.4rem;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.landing-nav {
  display: flex;
  align-items: center;
  gap: 0.85rem;
}

.landing-nav-link {
  display: none;
  padding: 0.55rem 0.85rem;
  font-size: 1rem;
  font-weight: 500;
  color: #334155;
  transition: color 0.15s ease;
}

.landing-nav-link:hover {
  color: var(--ink);
}

@media (min-width: 640px) {
  .landing-nav-link {
    display: inline-flex;
  }
}

.landing-hero {
  position: relative;
  z-index: 10;
  flex: 1;
  display: grid;
  align-items: center;
  gap: 1.75rem;
  width: 100%;
  min-height: 0;
  padding: 0.75rem 1.25rem 1.5rem;
  grid-template-columns: 1fr;
}

@media (min-width: 960px) {
  .landing-hero {
    grid-template-columns: minmax(17rem, 0.68fr) minmax(0, 1.32fr);
    gap: clamp(2.75rem, 5.5vw, 6rem);
    padding:
      clamp(0.5rem, 1.5vh, 1.25rem)
      clamp(0.5rem, 1.5vw, 1.25rem)
      clamp(1.25rem, 3vh, 2.5rem)
      clamp(1.5rem, 12vw, 12rem);
  }
}

.landing-copy {
  max-width: 34rem;
}

@media (min-width: 960px) {
  .landing-copy {
    max-width: min(32rem, 100%);
    padding-right: 0.5rem;
  }
}

.landing-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  border: 1px solid #d5e5e1;
  background: rgba(255, 255, 255, 0.78);
  backdrop-filter: blur(8px);
  border-radius: 9999px;
  padding: 0.5rem 1rem;
  font-size: 0.74rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  color: var(--muted);
}

.landing-badge-dot {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 9999px;
  background: var(--teal);
  box-shadow: 0 0 0 4px rgba(20, 184, 166, 0.16);
}

.landing-title {
  margin-top: clamp(1.15rem, 2.4vh, 1.75rem);
  font-size: clamp(3.5rem, 7.2vw, 6.25rem);
  font-weight: 800;
  line-height: 0.92;
  letter-spacing: -0.045em;
}

.landing-title-accent {
  background: linear-gradient(115deg, #14b8a6 8%, #2dd4bf 48%, #10b981 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.landing-subhead {
  margin-top: clamp(0.9rem, 1.8vh, 1.35rem);
  font-size: clamp(1.4rem, 2.4vw, 1.95rem);
  font-weight: 700;
  letter-spacing: -0.03em;
  line-height: 1.2;
}

.landing-desc {
  margin-top: clamp(1rem, 2vh, 1.4rem);
  max-width: 28rem;
  font-size: clamp(1rem, 1.25vw, 1.15rem);
  line-height: 1.6;
  color: var(--muted);
}

.landing-ctas {
  display: flex;
  flex-wrap: wrap;
  gap: 0.85rem;
  margin-top: clamp(1.6rem, 3.2vh, 2.35rem);
}

.landing-btn-primary,
.landing-btn-secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  border-radius: 9999px;
  font-weight: 600;
  transition:
    background 0.2s ease,
    transform 0.2s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.landing-btn-primary {
  background: var(--teal);
  color: #fff;
  font-size: 0.98rem;
  padding: 0.75rem 1.3rem;
  min-height: 2.85rem;
  box-shadow: 0 12px 28px rgba(20, 184, 166, 0.26);
}

.landing-btn-primary:hover {
  background: var(--teal-deep);
  transform: translateY(-1px);
}

.landing-btn-secondary {
  background: #fff;
  color: var(--ink);
  border: 1px solid #d5dee8;
  font-size: 0.98rem;
  padding: 0.75rem 1.3rem;
  min-height: 2.85rem;
}

.landing-btn-secondary:hover {
  background: #f8fafc;
  border-color: #c2cedb;
}

.landing-btn-hero {
  min-height: 3.5rem;
  padding: 0.95rem 1.65rem;
  font-size: 1.08rem;
}

.landing-features {
  display: flex;
  flex-wrap: wrap;
  gap: 0.85rem 1.35rem;
  margin-top: clamp(1.9rem, 3.8vh, 2.75rem);
  font-size: clamp(0.88rem, 1.05vw, 0.98rem);
  font-weight: 500;
  color: #475569;
}

.landing-features li {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  white-space: nowrap;
}

.landing-feature-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.8rem;
  height: 1.8rem;
  border-radius: 9999px;
  color: var(--teal-deep);
  background: var(--soft);
}

.landing-stage {
  width: 100%;
  min-width: 0;
  align-self: stretch;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: clamp(0.75rem, 2vh, 1.5rem) 0;
}

@media (min-width: 960px) {
  .landing-stage {
    padding: clamp(0.5rem, 1.5vh, 1.25rem) clamp(0.25rem, 1vw, 0.75rem);
    justify-content: stretch;
  }
}

.landing-stage-img {
  display: block;
  width: 100%;
  height: 100%;
  max-height: min(88vh, calc(100svh - 4.5rem));
  object-fit: contain;
  object-position: center right;
  animation: landing-stage-in 0.85s cubic-bezier(0.22, 1, 0.36, 1) 0.12s both;
}

.landing-fade {
  animation: landing-fade-up 0.75s cubic-bezier(0.22, 1, 0.36, 1) both;
}

.landing-fade--delay {
  animation-delay: 100ms;
}

@keyframes landing-fade-up {
  from {
    opacity: 0;
    transform: translateY(18px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes landing-stage-in {
  from {
    opacity: 0;
    transform: translateY(22px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes landing-drift {
  0%,
  100% {
    transform: translate3d(0, 0, 0);
  }
  50% {
    transform: translate3d(14px, -12px, 0);
  }
}

@media (max-width: 959px) {
  .landing-header {
    padding-bottom: 0.25rem;
  }

  .landing-hero {
    align-content: center;
    justify-items: center;
    padding-top: 1.5rem;
    text-align: left;
  }

  .landing-copy {
    width: 100%;
    max-width: 22.5rem;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }

  .landing-title {
    font-size: clamp(2.75rem, 12vw, 3.75rem);
  }

  .landing-subhead {
    font-size: clamp(1.25rem, 5vw, 1.5rem);
  }

  .landing-desc {
    max-width: none;
  }

  .landing-ctas {
    flex-direction: column;
    width: 100%;
  }

  .landing-btn-hero {
    width: 100%;
  }

  .landing-nav .landing-btn-primary {
    min-height: 2.5rem;
    padding: 0.55rem 0.95rem;
    font-size: 0.875rem;
  }

  .landing-features {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
    margin-top: 1.5rem;
  }

  .landing-stage {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .landing-fade,
  .landing-fade--delay,
  .landing-stage-img,
  .landing-orb {
    animation: none !important;
  }
}
</style>
