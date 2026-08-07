// Single source of the Prisma client + re-exported enums/types so the rest of
// the monorepo imports database types from one place (@truvo/db).
import { PrismaClient } from "@prisma/client";

export * from "@prisma/client";

let prisma: PrismaClient;

declare global {
  // eslint-disable-next-line no-var
  var __truvoPrisma: PrismaClient | undefined;
}

// Reuse a single client in dev to avoid exhausting connections on hot-reload.
export function getPrisma(): PrismaClient {
  if (!prisma) {
    prisma = global.__truvoPrisma ?? new PrismaClient();
    if (process.env.NODE_ENV !== "production") {
      global.__truvoPrisma = prisma;
    }
  }
  return prisma;
}

export { PrismaClient };
