# Pulse — Auth & production readiness test plan

Use this checklist before shipping presenter authentication to a real Vercel deployment.
Do not treat green typecheck / lint / build as sufficient.

---

## Environment matrix

Configure **separate** values per Vercel environment. Preview and Production do **not** share the same public URL.

### Development (local)

| Variable | Value |
|---|---|
| `VITE_APP_URL` | `http://localhost:5173` |
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_URL` | Same project URL |
| `SUPABASE_ANON_KEY` | Same anon key |
| `DATABASE_URL` | Local / Neon Postgres (or leave empty + `USE_MEMORY_DB=true` for local-only) |
| `USE_MEMORY_DB` | `true` only for local prototyping |
| `REDIS_URL` / `REDIS_TOKEN` | Optional locally (in-process bus) |
| `CORS_ORIGINS` | Optional extra origins (comma-separated) |

Local commands:

```bash
cp .env.example .env
npm install
npm run db:push          # local prototyping only
# or: npm run db:migrate # local migration development
npm run dev
```

### Preview (Vercel Preview)

| Variable | Notes |
|---|---|
| `VITE_APP_URL` | Prefer the stable preview domain, or set per-preview via `https://$VERCEL_URL` workflow. CORS also allows `VERCEL_URL` automatically. |
| `VITE_SUPABASE_*` / `SUPABASE_*` | Same Supabase project is fine; add each preview callback URL to Supabase allowlist **or** use a wildcard preview pattern only if your Supabase plan supports it. |
| `DATABASE_URL` | Postgres (Neon). **Required.** `USE_MEMORY_DB` must be `false` / unset. |
| `REDIS_URL` / `REDIS_TOKEN` | **Required** on Vercel. |
| `NODE_ENV` | Set by Vercel |

Production migration against the Preview DB (if separate):

```bash
npx prisma migrate deploy
```

### Production (Vercel Production + custom domain)

| Variable | Notes |
|---|---|
| `VITE_APP_URL` | Canonical production URL, e.g. `https://pulse.example.com` (no trailing slash) |
| `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` | Browser-safe |
| `SUPABASE_URL` / `SUPABASE_ANON_KEY` | Server JWT verification |
| `DATABASE_URL` | Production Postgres (pooled URL recommended) |
| `REDIS_URL` / `REDIS_TOKEN` | Upstash |
| `USE_MEMORY_DB` | Must **not** be `true` |

Apply schema:

```bash
npx prisma migrate deploy
```

Do **not** use `prisma migrate dev` or `prisma db push` as the production migration mechanism.

### Never commit / never expose via `VITE_*`

- `SUPABASE_SERVICE_ROLE_KEY` (if introduced later)
- Database passwords
- Redis tokens beyond server env

---

## Supabase redirect URL allowlist

In **Authentication → URL Configuration**, add only controlled callbacks:

```text
http://localhost:5173/auth/callback
https://YOUR_APP.vercel.app/auth/callback
https://YOUR_PREVIEW_HOST.vercel.app/auth/callback
https://your-custom-domain.com/auth/callback
```

Site URL should be the canonical production origin.

Pulse embeds `?next=` on the callback URL for intent preservation. `next` is validated client-side to same-app relative paths only (`/app…`, `/onboarding…`, `/demo…`). Arbitrary external redirect targets are rejected.

---

## Google

```text
[ ] Click Create session
[ ] Continue with Google
[ ] OAuth succeeds
[ ] Callback succeeds (`/auth/callback`)
[ ] User lands in Pulse (not unexpectedly on homepage)
[ ] Onboarding appears if required
[ ] Create session works after onboarding
[ ] Refresh preserves authentication
[ ] Close/reopen browser preserves authentication (Supabase persisted session)
[ ] Logout works
[ ] Login again works
```

---

## Magic link

```text
[ ] Enter email
[ ] Receive magic link
[ ] Open link (including in a new browser/tab)
[ ] Callback succeeds
[ ] User is authenticated
[ ] Intended destination preserved (Create session → `/app/sessions/new`)
[ ] Refresh works
[ ] Logout works
[ ] Expired link shows a friendly error (not raw Supabase text)
[ ] Already-used / invalid link shows a friendly error
[ ] Cancelled OAuth / denied consent shows a friendly error
[ ] Refreshing the callback page after success does not break the session
```

---

## Authorization (User A vs User B)

Setup: User A creates Session A. User B obtains Session A's ID.

```text
[ ] User A can access own sessions (`GET /api/sessions`, `GET /api/sessions/:id`)
[ ] User B cannot access User A's sessions (`GET /api/sessions/A` → 404)
[ ] User B cannot modify User A's sessions (`PATCH` / lobby / end → 404)
[ ] User B cannot create questions on User A's session → 404
[ ] User B cannot access User A's results → 401/404
[ ] User B cannot export User A's results (`export.csv` → 404)
[ ] Unauthenticated caller cannot read results / live-state / SSE for Session A → 401
[ ] Expired JWT → 401 on presenter APIs
[ ] Invalid JWT → 401 on presenter APIs
```

---

## Participant (separate from presenter auth)

```text
[ ] Participant joins without Supabase account
[ ] Participant receives participant token
[ ] Participant can answer while question is active
[ ] Participant cannot access presenter APIs with participant token (Bearer participant token → 401)
[ ] Participant cannot open DRAFT sessions via join code
[ ] Multiple participants work simultaneously
[ ] Participant live-state / SSE require a valid participant token for that session
```

---

## Onboarding

```text
[ ] Shown only when `onboardingCompleted` is false server-side
[ ] Progress persisted via `POST /api/me/onboarding` (not localStorage)
[ ] Interrupted flow (refresh / close browser / logout+login) resumes from server profile
[ ] Preferences editable from Settings
[ ] `PATCH /api/me` cannot mark onboarding complete without the onboarding endpoint
```

---

## Vercel

```text
[ ] Production URL loads
[ ] Google OAuth works against production callback
[ ] Magic link works against production callback
[ ] Preview deployment OAuth works (if preview redirects are allowlisted)
[ ] No hard-coded `localhost` / `127.0.0.1` used for redirects in production
[ ] `DATABASE_URL` + `npx prisma migrate deploy` applied
[ ] Redis configured; live results update across instances
[ ] Health check: `GET /api/health`
```

---

## Auth flow (expected)

```text
Create session
→ authentication (/auth?next=/app/sessions/new)
→ callback (/auth/callback?next=…)
→ session established (Supabase JWT persisted)
→ onboarding if required
→ create session (/app/sessions/new)
```

Intent must survive magic-link opens in another tab/device via the `next` query on the redirect URL (plus short-lived durable local storage backup).
