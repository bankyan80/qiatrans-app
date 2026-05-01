import { PrismaClient } from '@prisma/client'

function getDatabaseUrl(): string {
  let url = process.env.DATABASE_URL || ''

  // Remove channel_binding — not supported in serverless
  url = url.replace(/[&?]channel_binding=[^&]*/g, '').replace(/\?$/, '')

  // Use direct connection (not pooler) for serverless reliability
  // Pooler (-pooler) uses TCP port 5432 which times out in serverless
  // Direct connection uses WebSocket which is faster
  url = url.replace(/-pooler\./, '.')

  return url
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
    log: ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
