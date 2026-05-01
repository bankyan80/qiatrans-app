import { PrismaClient } from '@prisma/client'

function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL || ''
  // Remove channel_binding parameter — not supported in serverless environments
  return url.replace(/[&?]channel_binding=[^&]*/g, '').replace(/\?$/, '')
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
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
