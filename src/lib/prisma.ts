// lib/prisma.ts
import { PrismaClient } from "@prisma/client";

declare global {
  // avoid multiple instances in dev
  var prisma: PrismaClient | undefined;
}

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ["error"], // optional logs
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

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
