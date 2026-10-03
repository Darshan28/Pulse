import { app } from '../server/app.js'

/**
 * Single Vercel function entry for all API routes.
 *
 * Nested paths like `/api/me/onboarding` do not hit `api/[[...route]].ts`
 * outside Next.js — Vercel returns NOT_FOUND before Hono runs. Rewrite
 * `/api/:path*` → `/api` in vercel.json so every API request lands here.
 *
 * Export the Hono app itself (Web Standard `{ fetch }` handler), not
 * `handle()` from `hono/vercel`, which can hang under the Node `/api` runtime.
 */
export default app
