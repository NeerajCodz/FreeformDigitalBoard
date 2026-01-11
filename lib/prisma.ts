import { PrismaClient } from '@prisma/client'

// Prisma client with Label and Group models
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Re-export PrismaClient type for consistency
export type { PrismaClient }
