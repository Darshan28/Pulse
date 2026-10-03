import { app } from '../server/app.js'

/**
 * Export the Hono app itself (Web Standard `{ fetch }` handler).
 *
 * Do NOT wrap with `handle()` from `hono/vercel` here: that returns a bare
 * `(req) => Response` function, which Vercel's Node.js `/api` runtime can
 * treat as a classic `(req, res)` handler — the returned Response is ignored,
 * nothing calls `res.end()`, and every API route hangs until maxDuration (504).
 */
export default app
