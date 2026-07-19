import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

// Password hashing via Node's built-in scrypt — no native dependencies.
// Stored format: "<saltHex>:<hashHex>".
const KEYLEN = 64;

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, KEYLEN).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hashHex] = stored.split(":");
  if (!salt || !hashHex) return false;
  const hashBuf = Buffer.from(hashHex, "hex");
  const testBuf = scryptSync(password, salt, KEYLEN);
  // Constant-time compare; guard length first (timingSafeEqual throws on mismatch).
  return (
    hashBuf.length === testBuf.length && timingSafeEqual(hashBuf, testBuf)
  );
}
