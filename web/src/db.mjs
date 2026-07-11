import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const { Pool } = pg;

let _prisma = null;

export function getPrisma(databaseUrl) {
  if (!_prisma) {
    const url = databaseUrl || process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/criadero_camila_andrea";
    const pool = new Pool({ connectionString: url, max: 10 });
    const adapter = new PrismaPg(pool);
    _prisma = new PrismaClient({
      adapter,
      log: process.env.PRISMA_LOG === "true" ? ["query", "info", "warn", "error"] : ["error"],
    });
  }
  return _prisma;
}

export async function disconnectPrisma() {
  if (_prisma) {
    await _prisma.$disconnect();
    _prisma = null;
  }
}
