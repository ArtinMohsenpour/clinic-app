// lib/prisma.ts
import { PrismaClient } from "@prisma/client";

declare global {
  // avoid multiple instances in dev
  var prisma: PrismaClient | undefined;
}

export const prisma: PrismaClient =
  global.prisma ||
  new PrismaClient({
    log: ["query", "warn", "error"],
  });

if (process.env.NODE_ENV !== "production") global.prisma = prisma;
export default prisma;

export const user = prisma.user;
export const sessions = prisma.session;
export const account = prisma.account;
export const verification = prisma.verification;

export const prismaSchema = {
  user,
  sessions,
  account,
  verification,
};
export const prismaAdapter = {
  user: prisma.user,
  sessions: prisma.session,
  account: prisma.account,
  verification: prisma.verification,
};
