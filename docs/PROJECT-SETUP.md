# Nepal Travel — project setup and current changes

This document describes the **nepal_travel** fullstack Next.js app: structure, tooling, and the major decisions implemented during setup (migration from the previous Payload-heavy `codex_ai` project, Docker, Prisma, proxy layer, and auth).

## Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js **16.2** (App Router, `output: "standalone"` for Docker) |
| UI | React **19**, Tailwind CSS **4** |
| Package manager | **pnpm** (`packageManager` in `package.json`) |
| Database | **PostgreSQL 16** (local via Docker Compose) |
| ORM | **Prisma 7** with `@prisma/adapter-pg` + `pg` (driver adapter) |
| Auth | **Opaque sessions**: httpOnly `session` cookie + `Session` rows in Postgres; passwords hashed with **bcryptjs** |
| Logging | **pino** (server / API routes only) |
| Rate limiting (optional) | **Upstash Redis** (`UPSTASH_*` env vars) in `proxy.ts` |

## Migration context (from `codex_ai`)

The earlier project used **Payload CMS**, district/province routes, and a large district component tree. **nepal_travel** was created as a **clean fullstack base**:

- Removed Payload, collections, admin routes, and district/province UI.
- Kept a **single public home** (story hero, Nepal map, closing section) under `app/(site)/`.
- Renamed package to **`nepal_travel`** and aligned branding where noted.

## Folder structure (high level)

```text
app/
  (site)/          # Public site (route group; URL `/`)
  dashboard/       # Admin UI (protected by layout + getSession)
  login/           # Sign in
  register/        # Sign up
  api/             # Route handlers (health, v1 stub)
  layout.tsx       # Root layout + globals
  globals.css
components/
  site/            # Public: story, map
  dashboard/       # Admin shell, logout
  auth/            # Login / register forms
lib/
  auth/            # Sessions, actions, password hashing
  server/          # Prisma, logger, DB status, env
  middleware/    # CORS + rate-limit helpers used by proxy.ts
  http/            # Shared helpers (e.g. client IP)
  generated/prisma # Prisma Client (generated; gitignored)
prisma/
  schema.prisma
  migrations/
proxy.ts           # Next.js 16 proxy (Node): CORS, rate limit, request IDs
```

## Routes

| Path | Purpose |
|------|---------|
| `/` | Public home (Nepal story + map) |
| `/login` | Email/password sign-in |
| `/register` | Create account (dev-oriented; add verification for production) |
| `/dashboard` | Admin shell; **requires session** (`app/dashboard/layout.tsx` redirects if unauthenticated) |
| `/api/health` | Health + DB connectivity JSON |
| `/api/v1` | Versioned API placeholder |

## Database and Prisma

- **Config**: `prisma.config.ts` (datasource URL from `DATABASE_URL`), `prisma/schema.prisma`.
- **Client output**: `lib/generated/prisma` (see `generator` block — path is custom).
- **Runtime**: `lib/server/prisma.ts` — singleton `PrismaClient` + `PrismaPg` adapter + `pg` `Pool`.
- **Models**: `User`, `Session` (opaque session id stored as `Session.id` and in the `session` cookie).

Commands:

- `pnpm db:migrate` — dev migrations  
- `pnpm db:deploy` — production (`prisma migrate deploy`)  
- `pnpm db:studio` — Prisma Studio  
- `pnpm db:seed` — runs `prisma/seed.ts` (dev user upsert; credentials live in that file — rotate for anything beyond local dev)  

## Docker

- **`Dockerfile`**: multi-stage build; `openssl` in base image; Prisma schema copied before `pnpm install` so `postinstall` / `prisma generate` works; `prisma generate` before `next build`; Next standalone output.
- **`docker-compose.yml`**:
  - **Default**: Postgres only (`pnpm docker:up` or `pnpm docker:db`) — use with local `pnpm dev` and `DATABASE_URL` pointing at `localhost`.
  - **Profile `full`**: optional app + Postgres (`pnpm docker:up:full`) for smoke-testing the full stack.

Production is expected to run the **container image** with a **managed** `DATABASE_URL`, not necessarily Compose.

## Next.js 16 `proxy.ts` (replaces root `middleware.ts`)

- File: **`proxy.ts`** at the project root (same level as `app/`).
- Export: **`export async function proxy`** (+ optional `export const config` with `matcher`).
- **Runtime**: Node (not Edge). CORS and optional Upstash rate limiting run here.
- **Dashboard auth** is **not** enforced in proxy; it is enforced in **`app/dashboard/layout.tsx`** via `getSession()` so each request validates the session against the database.

See comments in `proxy.ts` and [Next.js proxy docs](https://nextjs.org/docs/app/api-reference/file-conventions/proxy).

## Authentication (sessions, not JWT in the browser)

Full walkthrough: **[`docs/AUTH.md`](./AUTH.md)** (cookie, DB session rows, login/register/logout flows, route protection, file map).

Summary:

- **Cookie**: httpOnly `session` — value is a random opaque id matching `Session.id`.
- **Server**: `getSession()` in `lib/auth/session.ts` reads the cookie and loads `Session` + `User` via Prisma.
- **Actions**: `lib/auth/actions.ts` — `loginAction`, `registerAction`, `logoutAction` (Server Actions).
- **Why not JWT in `localStorage`**: same-origin Next + Prisma can use **server-side sessions** with instant revocation and simpler threat model for a typical web admin.

For mobile or external SPAs consuming only HTTP APIs, you can add **JWT or API tokens** later without removing cookie sessions for the web app.

## Cross-cutting concerns (proxy + `next.config`)

- **CORS**: `lib/middleware/cors.ts` — allowlist via `CORS_ORIGINS` / `NEXT_PUBLIC_APP_URL`.
- **Rate limit**: `lib/middleware/rate-limit.ts` — active when `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are set.
- **Security headers**: `next.config.ts` `headers()` — frame options, nosniff, referrer policy, permissions policy.
- **Request ID**: set in `proxy.ts` and available to route handlers via `x-request-id` header.
- **Logging**: `lib/server/logger.ts` — use in Route Handlers / server code; do not import in `proxy.ts` if you rely on Node-only APIs inconsistently (proxy uses minimal logic; pino is for API/server modules).

## Environment variables

See **`.env.example`** for:

- `DATABASE_URL`, `NEXT_PUBLIC_APP_URL`
- Docker Compose: `POSTGRES_*`, `WEB_PORT`
- CORS, Upstash, `LOG_LEVEL`
- Auth is documented there (cookie + DB; no separate `AUTH_GUARD_*` flag — dashboard uses layout + `getSession()`)

## Scripts (from `package.json`)

| Script | Purpose |
|--------|---------|
| `pnpm dev` | Next dev server |
| `pnpm build` | `prisma generate` + `next build` |
| `pnpm start` | Production server |
| `pnpm docker:db` | Postgres only, detached |
| `pnpm docker:up` | Compose up (default: Postgres) |
| `pnpm docker:up:full` | Compose with `full` profile (app + Postgres) |

## Related files not duplicated here

- Map assets: `public/geo-json/`
- Prisma migrations: `prisma/migrations/`
- ESLint: `eslint.config.mjs`

---

*Last updated to reflect the repository layout and conventions described above.*
