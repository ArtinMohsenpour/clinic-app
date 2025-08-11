// lib/hashing.ts
import bcrypt from "bcryptjs";

/**
 * Hash a plain-text password using bcryptjs.
 * @param password - Plain text password to hash
 * @returns Promise<string> - The hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10; // cost factor — 10 is a good balance
  const salt = await bcrypt.genSalt(saltRounds);
  return bcrypt.hash(password, salt);
}

/**
 * Compare a plain-text password with a bcrypt hash.
 * @param password - Plain text password
 * @param hashed - Previously hashed password
 * @returns Promise<boolean> - true if match, false otherwise
 */
export async function verifyPassword(
  password: string,
  hashed: string
): Promise<boolean> {
  return bcrypt.compare(password, hashed);
}
