// lib/auth.ts
import bcrypt from "bcryptjs";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@/lib/prisma";

export const auth = betterAuth({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    password: {
      // OK to keep this signature (string -> Promise<string>)
      async hash(password: string) {
        return bcrypt.hash(password, 10);
      },
      // IMPORTANT: one object param with { password, hash }
      async verify({ password, hash }: { password: string; hash: string }) {
        return bcrypt.compare(password, hash);
      },
    },
  },
  session: {
    modelName: "Session",
    expiresIn: 60 * 60 * 8,
    updateAge: 60 * 60 * 24 * 365,
    cookies: {
      name: "clinic_session",
      maxAge: 60 * 60 * 8,
      secure: process.env.NODE_ENV === "production",
    },
  },
});
