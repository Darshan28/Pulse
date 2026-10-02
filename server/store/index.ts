import { PrismaClient } from '@prisma/client'
import { MemoryStore } from './memory.js'
import { PrismaStore } from './prisma.js'
import type { Store } from './types.js'

let store: Store | null = null
let prisma: PrismaClient | null = null

function isProductionRuntime() {
  return process.env.VERCEL === '1' || process.env.NODE_ENV === 'production'
}

function shouldUseMemory() {
  const isProd = isProductionRuntime()
  if (process.env.USE_MEMORY_DB === 'true') {
    if (isProd) {
      throw new Error(
        '[pulse] USE_MEMORY_DB=true is not allowed on Vercel/production. Set DATABASE_URL to Postgres and USE_MEMORY_DB=false.',
      )
    }
    return true
  }
  const url = process.env.DATABASE_URL?.trim()
  if (!url || url.includes('user:pass@localhost')) {
    if (isProd) {
      throw new Error(
        '[pulse] DATABASE_URL is required in production. Point it at Postgres (e.g. Neon) and run `npx prisma migrate deploy`.',
      )
    }
    return true
  }
  return false
}

export function getStore(): Store {
  if (store) return store

  if (shouldUseMemory()) {
    store = new MemoryStore()
    console.log('[pulse] Using file-backed memory store (.data/pulse.json)')
  } else {
    prisma = new PrismaClient()
    store = new PrismaStore(prisma)
    console.log('[pulse] Using PostgreSQL via Prisma')
  }
  return store
}

export function getPrisma(): PrismaClient | null {
  return prisma
}

export type { Store }
