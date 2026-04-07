import { PrismaClient } from "../generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

function createPrismaClient() {
  const url = process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL || "file:./prisma/dev.db";
  const authToken = process.env.TURSO_AUTH_TOKEN;

  const adapter = new PrismaLibSql(
    authToken ? { url, authToken } : { url }
  );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new PrismaClient({ adapter } as any);
}

const globalForPrisma = globalThis as unknown as { prisma: ReturnType<typeof createPrismaClient> };

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
