# Pulse — Feel the room.

Real-time audience interaction platform (Mentimeter-class UX) for workshops, research, meetings, and presentations.

Presenters create a session, share a short join code / QR, and watch live results as participants respond from any phone or laptop — no participant accounts required.

## Tech stack

- **Frontend:** Vue 3, TypeScript, Vite, Vue Router, Pinia, Tailwind CSS
- **Backend:** Node.js, Hono (Vercel-compatible API routes)
- **Database:** PostgreSQL via Prisma (file-backed memory store when `DATABASE_URL` is unset)
- **Realtime:** Transport abstraction — in-process bus locally; Upstash Redis + SSE on Vercel; HTTP poll fallback
- **Analytics:** PostHog abstraction (no-op if keys missing)

## Local setup

```bash
npm install
cp .env.example .env
npm run dev
```

- Web: http://localhost:5173  
- API: http://localhost:3001  

Without `DATABASE_URL`, data persists to `.data/pulse.json`.  
Without Redis, realtime uses an in-process bus (fine for single-server local/dev).

### Local test login (no Supabase required)

On `npm run dev` at `http://localhost:5173`, the sign-in page shows **Continue as test user**. That mints a localhost-only presenter token so you can use the dashboard and editor without Google or magic links. It is disabled in production and on Vercel.

### With PostgreSQL

1. Set `DATABASE_URL` in `.env`
2. `npm run db:push` (or `npm run db:migrate`)
3. `npm run db:seed` (optional)
4. `npm run dev`

## Environment variables

See [`.env.example`](.env.example):

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Postgres connection (required in production) |
| `REDIS_URL` / `REDIS_TOKEN` | Upstash Redis for multi-instance realtime |
| `VITE_APP_URL` | Public URL for join links, QR, and auth redirects |
| `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` | Public Supabase Auth config (browser + build) |
| `SUPABASE_URL` / `SUPABASE_ANON_KEY` | Server JWT verification (same project; keep service role out of Vite) |
| `DEV_AUTH_SECRET` | Optional HMAC secret for localhost test login tokens (non-prod only) |
| `VITE_POSTHOG_KEY` / `VITE_POSTHOG_HOST` | Optional analytics |
| `MAX_PARTICIPANTS_PER_SESSION` | Soft cap (default 200) |

### Supabase setup (presenters)

1. Create a Supabase project
2. Enable **Google** and **Email** (magic link) providers
3. Add redirect URLs: `http://localhost:5173/auth/callback` and your production `/auth/callback`
4. Copy the project URL + anon key into `.env` / Vercel env vars
5. Do **not** put the service role key in any `VITE_` variable

Participants stay anonymous (join code + optional name + participant token).

If Supabase is not configured yet, use **Continue as test user** on `/auth` while developing locally.

## Scripts

| Script | Description |
|---|---|
| `npm run dev` | API + Vite together |
| `npm run build` | Production frontend build |
| `npm run preview` | Preview built frontend |
| `npm run lint` | ESLint |
| `npm run typecheck` | Vue + server TypeScript check |
| `npm run db:generate` | Prisma client |
| `npm run db:migrate` | Prisma migrate **dev** (local schema iteration) |
| `npm run db:deploy` | `prisma migrate deploy` (**production / Preview**) |
| `npm run db:seed` | Seed demo session |
| `npm run db:push` | Push schema without migrations (**local prototyping only**) |

## Routes

- `/` — Landing
- `/join`, `/join/:code` — Participant join (no Supabase account)
- `/auth` — Presenter sign-in (Google + magic link)
- `/auth/callback` — OAuth / magic-link callback
- `/onboarding` — First-run preferences (server-persisted)
- `/app/sessions` — Presentations dashboard
- `/app/sessions/new` — Create
- `/app/sessions/:id` — Slide editor
- `/app/sessions/:id/present` — Present mode (lobby + live)
- `/app/sessions/:id/results` — Results + CSV export
- `/app/settings` — Profile preferences
- `/demo` — Multi-pane presenter + 2 participants
- `/participant/:sessionId` — Live participant UI

## Realtime architecture

1. Mutations persist to the store (Postgres or memory)
2. Aggregated results are computed server-side
3. Events publish on `RealtimeBus` (`RESULTS_UPDATED`, `QUESTION_STARTED`, …)
4. Clients subscribe via SSE (`/api/realtime/subscribe`) with presenter JWT or participant token
5. On SSE failure, clients poll `/api/sessions/:id/live-state` every ~2.5s and auto-reconnect

## Vercel deployment

1. Create a Vercel project from this repo
2. Provision **Neon** (or other Postgres) → set `DATABASE_URL` for Preview and Production
3. Provision **Upstash Redis** → set `REDIS_URL` + `REDIS_TOKEN` (required on Vercel)
4. Configure **Supabase Auth** → set browser + server Supabase env vars (see table below)
5. Set `VITE_APP_URL` **per environment** (Preview URL ≠ Production URL)
6. Add each environment’s `/auth/callback` URL to the Supabase redirect allowlist
7. Run production migrations: `npx prisma migrate deploy` (not `db push`, not `migrate dev`)
8. Deploy

### Vercel environment variables

| Variable | Development | Preview | Production |
|---|---|---|---|
| `DATABASE_URL` | optional / local | required | required |
| `USE_MEMORY_DB` | `true` ok locally | must be unset/false | must be unset/false |
| `REDIS_URL` / `REDIS_TOKEN` | optional | required | required |
| `VITE_APP_URL` | `http://localhost:5173` | preview host | canonical prod URL |
| `VITE_SUPABASE_URL` | yes | yes | yes |
| `VITE_SUPABASE_ANON_KEY` | yes | yes | yes |
| `SUPABASE_URL` | yes | yes | yes |
| `SUPABASE_ANON_KEY` | yes | yes | yes |
| `CORS_ORIGINS` | optional | optional | optional |
| PostHog keys | optional | optional | optional |

Never set `SUPABASE_SERVICE_ROLE_KEY` as a `VITE_` variable.

Capacity design target: **200 concurrent participants per session**.

Full auth E2E checklist: [`AUTH_PRODUCTION_TEST.md`](./AUTH_PRODUCTION_TEST.md).

## Project structure

```
api/           Vercel serverless entry (Hono)
server/        API app, services, store, realtime
shared/        Shared types
prisma/        Schema + migrations + seed
src/           Vue app (views, components, stores)
```

## License

Private — all rights reserved.
