# Authentication

This app uses **opaque server-side sessions** stored in PostgreSQL. The browser only holds an **httpOnly cookie** with a random session id—not a JWT and not credentials in `localStorage`.

## Data model

| Model | Role |
|-------|------|
| `User` | `email` (unique, stored lowercase), `passwordHash` (bcrypt). |
| `Session` | One row per active login: `id` (opaque token), `userId`, `expiresAt`. Deleting the row revokes that session immediately. |

The cookie value **equals** `Session.id`. Anyone with that value is treated as that user until the session expires or is deleted.

## Passwords

- **Hashing**: `bcryptjs` with **12 rounds** (`lib/auth/password.ts`).
- **Registration**: rejects passwords shorter than 8 characters; email is trimmed and lowercased before storage.
- **Login**: same email normalization; generic error on failure (“Invalid email or password”) to avoid account enumeration.

## Session cookie

Defined in `lib/auth/constants.ts`:

- **Name**: `session`
- **Value**: random 32-byte hex string (`lib/auth/token.ts` → `Session.id`)
- **Options**: `httpOnly`, `sameSite: lax`, `path: /`, `secure` in production, `maxAge` aligned with **7 days** (`SESSION_MAX_AGE_DAYS`)

## Request flow

### Sign in (`loginAction`)

1. Read `email`, `password`, optional `callbackUrl` from `FormData` (Server Action in `lib/auth/actions.ts`).
2. Normalize email; validate `callbackUrl` must be a same-origin path (default `/dashboard`).
3. Load `User` by email; verify password with `bcrypt.compare`.
4. On success: `createSession(user.id)` → insert `Session`, set cookie → `redirect(callbackUrl)`.

### Sign up (`registerAction`)

1. Same email/password rules; ensure email is not already taken.
2. `hashPassword` → create `User` → `createSession` → redirect to `/dashboard`.

### Sign out (`logoutAction`)

1. `destroyCurrentSession()`: delete matching `Session` row (if any), clear cookie → redirect to `/login`.

### Reading the current user (`getSession`)

`lib/auth/session.ts`:

1. Read the `session` cookie.
2. `findUnique` on `Session` with `user` included.
3. If missing: clear stale cookie, return `null`.
4. If `expiresAt` in the past: delete row, clear cookie, return `null`.
5. Otherwise return `{ user: { id, email } }`.

Use **`getSession()`** in Server Components, Route Handlers, and Server Actions. It touches the database each time—appropriate for correctness and revocation; add caching only if you measure a need.

## Protecting routes

- **Dashboard** (`app/dashboard/layout.tsx`): calls `getSession()`; if `null`, `redirect("/login?callbackUrl=/dashboard")`.
- **`proxy.ts` does not enforce auth.** It handles CORS, optional rate limits, and request IDs. Keeping session checks in layouts/server code avoids coupling auth to the proxy and keeps a single source of truth (`getSession`).

## Files (quick map)

| File | Responsibility |
|------|----------------|
| `lib/auth/actions.ts` | `loginAction`, `registerAction`, `logoutAction` |
| `lib/auth/session.ts` | `getSession()` |
| `lib/auth/session-service.ts` | `createSession`, `destroyCurrentSession` |
| `lib/auth/password.ts` | `hashPassword`, `verifyPassword` |
| `lib/auth/constants.ts` | Cookie name, lifetime, cookie options |
| `lib/auth/token.ts` | `generateSessionToken()` |
| `prisma/schema.prisma` | `User`, `Session` models |

## Dev seeding

`pnpm db:seed` runs `prisma/seed.ts` to upsert a development user (see that file). Rotate credentials outside local use.

## Not included (by design)

Email verification, password reset, 2FA, “remember me” with different lifetimes, and device/session management UI are not implemented. For **external API clients** (mobile app, third parties), you could add API keys or JWTs later without removing cookie sessions for the web app.
