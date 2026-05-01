import { PrismaClient } from '@prisma/client'

function getCleanUrl(): string {
  let url = process.env.DATABASE_URL || ''
  // Remove channel_binding — not supported in serverless
  url = url.replace(/[&?]channel_binding=[^&]*/g, '').replace(/\?$/, '')
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
        url: getCleanUrl(),
      },
    },
    log: ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
