import { PrismaClient } from '@prisma/client'

function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL || ''
  // Remove channel_binding parameter — not supported in serverless environments
  let clean = url.replace(/[&?]channel_binding=[^&]*/g, '').replace(/\?$/, '')
  // Add pgbouncer=true for Neon pooler compatibility in serverless
  if (clean.includes('pooler') && !clean.includes('pgbouncer=')) {
    clean += (clean.includes('?') ? '&' : '?') + 'pgbouncer=true'
  }
  // Add connection timeout for serverless
  if (!clean.includes('connect_timeout=')) {
    clean += (clean.includes('?') ? '&' : '?') + 'connect_timeout=15'
  }
  return clean
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: getDatabaseUrl(),
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
