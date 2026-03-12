import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Resolve the database URL at runtime:
// Prefer POSTGRES_PRISMA_URL (Supabase pooled connection), fall back to DATABASE_URL
const databaseUrl = process.env.POSTGRES_PRISMA_URL || process.env.DATABASE_URL;

// Also set DATABASE_URL so Prisma's generated client can find it
// (the generated client reads env vars based on what was in schema.prisma at generate time)
if (!process.env.DATABASE_URL && process.env.POSTGRES_PRISMA_URL) {
  process.env.DATABASE_URL = process.env.POSTGRES_PRISMA_URL;
}

const isExistingClient = !!globalForPrisma.prisma;
console.log('[v0] Prisma init:', {
  existingClient: isExistingClient,
  dbUrlSet: !!databaseUrl,
  dbUrlPrefix: databaseUrl ? databaseUrl.substring(0, 40) + '...' : 'NONE',
  DATABASE_URL_set: !!process.env.DATABASE_URL,
  POSTGRES_PRISMA_URL_set: !!process.env.POSTGRES_PRISMA_URL,
});

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['error', 'warn'],
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
