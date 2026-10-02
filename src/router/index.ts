import { createRouter, createWebHistory } from 'vue-router'
import { safeAppPath, setAuthIntent } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'landing',
      component: () => import('@/views/LandingView.vue'),
    },
    {
      path: '/join',
      name: 'join',
      component: () => import('@/views/JoinView.vue'),
      meta: { public: true },
    },
    {
      path: '/join/:code',
      name: 'join-code',
      component: () => import('@/views/JoinView.vue'),
      props: true,
      meta: { public: true },
    },
    {
      path: '/auth',
      name: 'auth',
      component: () => import('@/views/AuthView.vue'),
      meta: { guest: true },
    },
    {
      path: '/auth/callback',
      name: 'auth-callback',
      component: () => import('@/views/AuthCallbackView.vue'),
      meta: { guest: true },
    },
    {
      path: '/onboarding',
      name: 'onboarding',
      component: () => import('@/views/OnboardingView.vue'),
      meta: { requiresAuth: true, skipOnboardingGate: true },
    },
    {
      path: '/app',
      redirect: '/app/sessions',
    },
    {
      path: '/app/sessions',
      name: 'sessions',
      component: () => import('@/views/SessionsView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/app/sessions/new',
      name: 'sessions-new',
      component: () => import('@/views/NewSessionView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/app/sessions/:sessionId',
      name: 'session-editor',
      component: () => import('@/views/SessionEditorView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/app/sessions/:sessionId/present',
      name: 'session-present',
      component: () => import('@/views/PresentView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/app/sessions/:sessionId/results',
      name: 'session-results',
      meta: { requiresAuth: true },
      redirect: (to) => ({
        path: `/app/sessions/${to.params.sessionId}`,
        query: { ...to.query, tab: 'results' },
      }),
    },
    {
      path: '/app/settings',
      name: 'settings',
      component: () => import('@/views/SettingsView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/participant/:sessionId',
      name: 'participant',
      component: () => import('@/views/ParticipantView.vue'),
      meta: { public: true },
    },
    {
      path: '/demo',
      name: 'demo',
      component: () => import('@/views/DemoView.vue'),
    },
  ],
  scrollBehavior() {
    return { top: 0 }
  },
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()
  await auth.init()

  if (to.meta.public) return true

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    const next = safeAppPath(to.fullPath)
    setAuthIntent(next)
    return { path: '/auth', query: { next } }
  }

  // Wait for profile when authenticated so we do not flash dashboard → logout/onboarding.
  if (
    to.meta.requiresAuth &&
    auth.isAuthenticated &&
    (auth.profileStatus === 'idle' || auth.profileStatus === 'loading')
  ) {
    try {
      await auth.refreshProfile()
    } catch {
      /* profileStatus set to error */
    }
  }

  // Only gate onboarding when profile is known. Profile errors must not look like "incomplete".
  if (
    to.meta.requiresAuth &&
    auth.isAuthenticated &&
    !to.meta.skipOnboardingGate &&
    auth.profileStatus === 'ready' &&
    !auth.onboardingCompleted
  ) {
    return { path: '/onboarding', query: { next: safeAppPath(to.fullPath) } }
  }

  if (to.meta.guest && auth.isAuthenticated && to.name === 'auth') {
    const next = safeAppPath(to.query.next)
    if (auth.profileStatus !== 'ready') {
      try {
        await auth.refreshProfile()
      } catch {
        return true
      }
    }
    if (auth.profileStatus === 'ready' && !auth.onboardingCompleted) {
      return { path: '/onboarding', query: { next } }
    }
    return next
  }

  return true
})

export default router
