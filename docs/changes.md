# CMS Backend Migration — Changelog

> **Date:** 2026-04-20  
> **Scope:** Decouple backend from Next.js → standalone Hono REST API in a pnpm monorepo

---

## Overview

All server-side logic (authentication, CMS CRUD, media gallery, database access) has been extracted from the Next.js `cms` project into a new standalone **Hono on Node.js** server (`cms-backend-hono`). The Next.js frontend is now a pure UI layer that communicates with the backend exclusively via HTTP.

```
Before:
  cms/ (Next.js)
  └── app/api/**         ← 22 route handlers + DB access

After:
  cms/ (Next.js)         ← frontend only, proxies /api/* to Hono
  cms-backend-hono/      ← REST API server on :4000
  pnpm-workspace.yaml    ← monorepo ties both together
```

---

## 1. New: `cms-backend-hono/` — Hono REST API

### Project setup

| File | Description |
|---|---|
| `package.json` | Dependencies: `hono`, `@hono/node-server`, `@prisma/client`, `@prisma/adapter-pg`, `pg`, `bcryptjs`, `pino`, `tsx` |
| `tsconfig.json` | `module: Node16`, `moduleResolution: Node16`, ESM |
| `.env` / `.env.example` | `DATABASE_URL`, `PORT=4000`, `CORS_ORIGINS`, `SESSION_COOKIE_NAME`, `SESSION_MAX_AGE_DAYS` |
| `.gitignore` | Excludes `node_modules/`, `dist/`, `.env`, `assets/uploads/` |
| `prisma/schema.prisma` | Full schema (User, Session, CmsPage, CmsBlock, CmsLayout, CmsSiteContent) |
| `prisma/seed.ts` | Dev seed — moved from `cms/prisma/seed.ts` |

### `src/lib/` — Logic layer

| File | Description |
|---|---|
| `prisma.ts` | `PrismaClient` singleton using `PrismaPg` adapter + `Pool` |
| `password.ts` | `hashPassword()` / `verifyPassword()` via bcryptjs |
| `token.ts` | `generateSessionToken()` using `node:crypto` |
| `cms-service.ts` | Full CMS CRUD — pages, blocks, layouts, site chrome, public API |
| `cms-public-block.ts` | Strips editor `__*` keys, shapes public block `{ sectionKey, content }` |
| `cms-public-page-seo.ts` | Public SEO field shaper |
| `cms-page-seo-parse.ts` | Validates & parses SEO fields from request body |
| `media-gallery.ts` | Path helpers: `galleryBaseDir()`, `galleryPublicUrl()`, safe path validation |

### `src/middleware/`

| File | Description |
|---|---|
| `auth.ts` | `sessionMiddleware` — reads cookie → Postgres → `c.var.user`. `requireAuth` guard → 401 if missing |

### `src/routes/`

| Route file | Method | Path | Auth |
|---|---|---|---|
| `auth.ts` | `POST` | `/api/auth/login` | — |
| | `POST` | `/api/auth/register` | — |
| | `POST` | `/api/auth/logout` | optional |
| | `GET` | `/api/auth/me` | ✅ |
| `admin/cms-pages.ts` | `GET` | `/api/v1/admin/cms-pages/pages` | ✅ |
| | `POST` | `/api/v1/admin/cms-pages/pages` | ✅ |
| | `GET/PATCH/DELETE` | `/api/v1/admin/cms-pages/pages/:pageId` | ✅ |
| | `POST` | `/api/v1/admin/cms-pages/pages/:pageId/blocks` | ✅ |
| | `POST` | `/api/v1/admin/cms-pages/pages/:pageId/reorder` | ✅ |
| | `PATCH/DELETE` | `/api/v1/admin/cms-pages/blocks/:blockId` | ✅ |
| | `GET/POST` | `/api/v1/admin/cms-pages/layouts` | ✅ |
| | `GET/PATCH/DELETE` | `/api/v1/admin/cms-pages/layouts/:id` | ✅ |
| | `GET/PUT` | `/api/v1/admin/cms-pages/navigation` | ✅ |
| | `GET/PUT` | `/api/v1/admin/cms-pages/footer` | ✅ |
| | `GET/PUT` | `/api/v1/admin/cms-pages/announcements` | ✅ |
| `admin/media.ts` | `GET` | `/api/v1/admin/media/gallery/list` | ✅ |
| | `POST` | `/api/v1/admin/media/gallery/upload` | ✅ |
| | `POST/DELETE` | `/api/v1/admin/media/gallery/folder` | ✅ |
| | `DELETE` | `/api/v1/admin/media/gallery/file` | ✅ |
| `cms.ts` | `GET` | `/api/v1/cms/pages` | — |
| | `GET` | `/api/v1/cms/pages/:slugOrId` | — |
| | `GET` | `/api/v1/cms/navigation` | — |
| | `GET` | `/api/v1/cms/footer` | — |
| | `GET` | `/api/v1/cms/announcements` | — |
| `health.ts` | `GET` | `/api/health` | — |

### `src/index.ts` — Entry point

- Global CORS middleware (`CORS_ORIGINS` env, `credentials: true`)
- Static media served at `/api/media/*` → `assets/uploads/`
- `@hono/node-server` on `PORT` (default `4000`)

### DB commands (all move here from `cms/`)

```bash
cd cms-backend-hono
pnpm db:generate    # prisma generate
pnpm db:migrate     # prisma migrate dev
pnpm db:deploy      # prisma migrate deploy
pnpm db:seed        # prisma db seed
pnpm db:studio      # prisma studio
```

---

## 2. Changed: `cms/` — Next.js (frontend only)

### New files

| File | Description |
|---|---|
| `pnpm-workspace.yaml` | Monorepo — includes `.`, `packages/*`, `../cms-backend-hono` |
| `lib/fetcher.ts` | Unified HTTP fetcher — `api.get/post/put/patch/delete`. Shows sonner toast on errors (client-side). Calls `notFound()` on 404. |
| `lib/api/services.ts` | Typed domain API modules: `cmsPageApi`, `cmsBlockApi`, `cmsLayoutApi`, `adminSiteChromeApi`, `mediaApi`, `authApi`, `publicCmsApi`, `healthApi` |

### Modified files

#### `next.config.ts`
- Added `rewrites()` — all `/api/*` requests proxied to `NEXT_PUBLIC_API_URL` (Hono)
- Removed `serverExternalPackages` for Prisma / pg / bcryptjs (no longer in Next.js)
- Added `localhost:4000` to `images.remotePatterns` for local media

#### `lib/auth/actions.ts`
- **Before:** Called Prisma directly to verify credentials, created sessions in DB
- **After:** Calls `POST /api/auth/login` and `POST /api/auth/register` on Hono, forwards `Set-Cookie` header to browser

#### `lib/auth/session.ts`
- **Before:** Read session cookie, queried `Session` table via Prisma
- **After:** Calls `GET /api/auth/me` on Hono with the cookie forwarded — no DB access

#### `app/dashboard/page.tsx`
- **Before:** `getPrisma().cmsPage.count()` / `cmsLayout.count()` directly
- **After:** `fetch()` to `GET /api/v1/admin/cms-pages/pages` and `/layouts` on Hono

#### `.env`
```diff
+ NEXT_PUBLIC_API_URL=http://localhost:4000
+ SESSION_COOKIE_NAME=session
```

#### `package.json`
- **Removed dependencies:** `@prisma/client`, `@prisma/adapter-pg`, `pg`, `bcryptjs`, `pino`
- **Removed devDependencies:** `prisma`, `tsx`, `@types/pg`, `pino-pretty`
- **Removed scripts:** `postinstall: prisma generate`, all `db:*` commands

### Deleted files

| File | Reason |
|---|---|
| `app/api/v1/**` | All 22 API route handlers → Hono |
| `app/api/media/[...path]/route.ts` | Static serving → Hono `/api/media/*` |
| `app/api/health/route.ts` | Health check → Hono `/api/health` |
| `lib/server/` | Entire server layer (Prisma, CMS service, media, logger, etc.) → Hono |
| `lib/auth/session-service.ts` | Session create/destroy via Prisma → Hono auth routes |
| `lib/auth/password.ts` | bcrypt helpers → `cms-backend-hono/src/lib/password.ts` |
| `lib/auth/token.ts` | Token generator → `cms-backend-hono/src/lib/token.ts` |
| `lib/auth/constants.ts` | Orphaned — nothing imported it after migration |
| `lib/auth/index.ts` | Orphaned barrel re-export — no consumers |
| `lib/generated/` | Prisma-generated client — no longer in Next.js |
| `lib/api/admin-client.ts` | Duplicate of `lib/fetcher.ts` |
| `lib/api/client.ts` | Unused `apiJson` helper |
| `prisma/seed.ts` | Moved to `cms-backend-hono/prisma/seed.ts` |
| `prisma.config.ts` | Prisma no longer configured in Next.js |

### Kept files

| File | Reason |
|---|---|
| `lib/auth/session.ts` | `getSession()` used by dashboard layout, login, register pages |
| `lib/auth/actions.ts` | Server Actions for login/register/logout forms |
| `lib/http/client-ip.ts` | Still used by `lib/middleware/rate-limit.ts` (Upstash) |
| `lib/middleware/rate-limit.ts` | Upstash Redis rate limiting for Next.js middleware |
| `lib/cms/**` | All client-side CMS UI utilities (types, builders, drafts, etc.) |

---

## 3. Running locally

```bash
# Terminal 1 — Hono REST API
cd cms-backend-hono
pnpm install
pnpm db:migrate      # run migrations
pnpm db:seed         # seed admin user
pnpm dev             # → http://localhost:4000

# Terminal 2 — Next.js frontend
cd cms
pnpm dev             # → http://localhost:3000
                     # /api/* is proxied to :4000 automatically
```

### Verify Hono is healthy
```bash
curl http://localhost:4000/api/health
# → { "ok": true, "database": { "connected": true } }
```

---

## 4. Architecture diagram

```
Browser
  │
  ▼
Next.js :3000
  │  /api/* rewrite
  ▼
Hono :4000
  ├── /api/auth/*              session cookie management
  ├── /api/v1/admin/cms-pages/* admin CMS (auth required)
  ├── /api/v1/admin/media/*    gallery upload/list (auth required)
  ├── /api/v1/cms/*            public storefront (no auth)
  ├── /api/media/*             static file serving (assets/uploads/)
  └── /api/health              health + DB check
        │
        ▼
      PostgreSQL
```

---

## 5. Environment variables reference

### `cms-backend-hono/.env`

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | `postgres://nepal:nepal@localhost:5432/cms` | Postgres connection string |
| `PORT` | `4000` | Hono server port |
| `CORS_ORIGINS` | `http://localhost:3000` | Comma-separated allowed origins |
| `SESSION_COOKIE_NAME` | `session` | httpOnly cookie name |
| `SESSION_MAX_AGE_DAYS` | `7` | Session lifetime |
| `NODE_ENV` | `development` | Enables `Secure` cookie flag in production |

### `cms/.env`

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Base URL of the Hono backend (used by rewrites + server fetch) |
| `SESSION_COOKIE_NAME` | Must match the Hono backend value |
| `NEXT_PUBLIC_APP_URL` | Public URL of the Next.js app |

---

## 6. Post-migration cleanup

> Changes made after the initial migration to resolve remaining issues and dead code.

### 6.1 Fetcher consolidation

**Problem:** `lib/api/admin-client.ts` and the new `lib/fetcher.ts` were functionally identical.

| Action | Detail |
|---|---|
| Deleted `lib/api/admin-client.ts` | Merged its only unique feature (sonner toast on error) into `lib/fetcher.ts` |
| Deleted `lib/api/client.ts` | Unused — zero imports |
| Updated 4 import sites | `lib/cms/api.ts`, `lib/cms/reference-image-upload.ts`, `app/dashboard/media/page.tsx`, `components/media/media-picker-modal.tsx` now import from `@/lib/fetcher` |

**`lib/fetcher.ts` additions:**
- `showErrorToast?: boolean` option (default `true`) — shows `toast.error()` on client, suppressed server-side via `typeof window !== 'undefined'` guard
- `put()` method added for site chrome `PUT` endpoints

### 6.2 Orphaned auth files removed

| Deleted | Reason |
|---|---|
| `lib/auth/constants.ts` | `SESSION_COOKIE_NAME` was read from `process.env` directly everywhere — nobody imported this |
| `lib/auth/index.ts` | Barrel re-export with zero consumers |
| `lib/auth/password.ts` | bcrypt now lives in Hono backend only |
| `lib/auth/token.ts` | Token generation now lives in Hono backend only |
| `lib/auth/session-service.ts` | Session DB logic moved to Hono `src/routes/auth.ts` |

### 6.3 Prisma fully removed from `cms/`

| Action | Detail |
|---|---|
| Deleted `cms/prisma/schema.prisma` | Schema is the source of truth in `cms-backend-hono/prisma/` |
| Moved `cms/prisma/migrations/` → `cms-backend-hono/prisma/migrations/` | 8 migration files moved |
| Deleted `cms/scripts/ensure-database.mjs` | Called by `db:ensure` which was already removed from `package.json` |
| Deleted `cms/scripts/` directory | Now empty after script removal |

### 6.4 `proxy.ts` — CORS conflict resolved

**Problem:** `proxy.ts` was adding CORS headers to all `/api/*` responses. Since `/api/*` is a rewrite to Hono, Hono's own `hono/cors` middleware also set CORS headers — causing duplicate/conflicting values.

**Fix:** Removed all CORS logic from `proxy.ts`. Deleted `lib/middleware/cors.ts` (now unused).  
`proxy.ts` now only handles:
- Rate limiting via Upstash (`checkRateLimit`)
- Forwarding `X-Request-Id` on every request

### 6.5 Containerization

#### `cms/Dockerfile` — updated
```diff
- COPY prisma ./prisma
- COPY prisma.config.ts ./
- RUN pnpm exec prisma generate
+ ARG NEXT_PUBLIC_API_URL=http://localhost:4000
+ ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
  RUN pnpm build
```
- Removed `openssl` apt dep (no longer needed without Prisma)
- Added `NEXT_PUBLIC_API_URL` as a build-time `ARG` so it is inlined into the Next.js bundle

#### `cms-backend-hono/Dockerfile` — new
- Multi-stage: `deps` (install + `prisma generate`) → `builder` (`tsc`) → `runner`
- Exposes port `4000`, runs `node dist/index.js`
- Mounts `/app/assets/uploads` for the media gallery volume

#### `docker-compose.yml` — moved to `cms-backend-hono/`
**Reason:** The backend owns the database and infrastructure; compose belongs alongside Prisma, migrations, and the seed.

| Service | Profile | Notes |
|---|---|---|
| `postgres` | default | Unchanged |
| `api` | `full` | Builds from `.` (backend dir), mounts `cms_uploads` |
| `web` | `full` | Builds from `../cms`, receives `NEXT_PUBLIC_API_URL` as build arg |

`cms/package.json` `docker:*` scripts updated to delegate via `-f ../cms-backend-hono/docker-compose.yml`.

`cms-backend-hono/package.json` gains `docker:*` scripts + `db:setup` (deploy + seed).

### 6.6 `X-Request-Id` middleware in Hono

Added to `src/index.ts` as a global middleware — reads the forwarded id from the Next.js `proxy.ts` (or generates a new one) and attaches it to every response for request correlation across logs.

```
Request flow:
  Browser → Next.js proxy.ts
    generates X-Request-Id
    forwards it in request headers
      → Hono src/index.ts
          reads X-Request-Id
          sets it on response headers
```

### 6.7 Final deleted files summary (additional)

| File | Reason |
|---|---|
| `cms/lib/middleware/cors.ts` | CORS logic removed from proxy — only used by the now-deleted CORS block |
| `cms/docker-compose.yml` | Moved to `cms-backend-hono/docker-compose.yml` |
| `cms/scripts/ensure-database.mjs` | `db:ensure` script removed from `package.json`; `pg` dep removed from `cms/` |
