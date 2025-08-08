import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@/lib/prisma";

export const auth = betterAuth({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: { enabled: true },
  session: {
    modelName: "Session",
    expiresIn: 60 * 60 * 8, // 8 hours hard TTL
    updateAge: 60 * 60 * 24 * 365, // don't refresh within 8h (non‑sliding)
    cookies: {
      name: "clinic_session",
      maxAge: 60 * 60 * 8, // cookie matches server TTL
      secure: process.env.NODE_ENV === "production",
    },
  },
});
