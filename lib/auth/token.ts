import { randomBytes } from "node:crypto";

/** Opaque session token stored as `Session.id` and in the httpOnly cookie. */
export function generateSessionToken(): string {
  return randomBytes(32).toString("hex");
}
