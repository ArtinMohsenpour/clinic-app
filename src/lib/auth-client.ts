// lib/auth-client.ts

import { createAuthClient } from "better-auth/react";
export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000", // match server
  /** The base URL of the server (optional if you're using the same domain) */
});
