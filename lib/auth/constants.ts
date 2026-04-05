/** httpOnly cookie storing the opaque session id (row id in `Session` table). */
export const SESSION_COOKIE_NAME = "session";

/** Session lifetime (days). */
export const SESSION_MAX_AGE_DAYS = 7;

export function sessionCookieOptions() {
  const maxAge = SESSION_MAX_AGE_DAYS * 24 * 60 * 60;
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge,
  };
}
