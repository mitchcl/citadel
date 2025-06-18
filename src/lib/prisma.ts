import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Force new client for ban history features
export const prisma = new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
