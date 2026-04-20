# Frontend Changelog — `cms`

> All changes made to this project during and after the migration to the Hono backend.

---

## 1. New files added

| File | Description |
|---|---|
| `pnpm-workspace.yaml` | Monorepo root — includes `cms/`, `packages/*`, `../cms-backend-hono` |
| `lib/fetcher.ts` | Unified HTTP client — `api.get/post/put/patch/delete`. Sonner toast on error (client-side only). `notFound()` on 404. `credentials: include` for cookie forwarding. |
| `lib/api/services.ts` | Typed, domain-grouped API modules: `cmsPageApi`, `cmsBlockApi`, `cmsLayoutApi`, `adminSiteChromeApi`, `mediaApi`, `authApi`, `publicCmsApi`, `healthApi` |
| `docs/structure.md` | Project structure reference |
| `docs/changes.md` | This file |

---

## 2. Modified files

### `next.config.ts`

```diff
+ rewrites() → proxies all /api/* to NEXT_PUBLIC_API_URL (Hono :4000)
- serverExternalPackages: ['@prisma/client', 'pg', 'bcryptjs']  // removed
+ images.remotePatterns: localhost:4000  // for local media preview
```

### `lib/auth/actions.ts`

| Before | After |
|---|---|
| Called Prisma directly to verify password, created `Session` row in DB | Calls `POST /api/auth/login` on Hono, forwards `Set-Cookie` header to browser |
| Same for `registerAction` | Calls `POST /api/auth/register` on Hono |
| Deleted session row in Postgres | Calls `POST /api/auth/logout` on Hono, deletes cookie locally |

### `lib/auth/session.ts`

| Before | After |
|---|---|
| Read `session` cookie, queried `Session` table via Prisma | Calls `GET /api/auth/me` on Hono with the cookie forwarded |
| Returned `AppSession` from DB row | Returns `AppSession` from Hono response |

### `app/dashboard/page.tsx`

| Before | After |
|---|---|
| `getPrisma().cmsPage.count()` + `cmsLayout.count()` directly | `fetch()` to `GET /api/v1/admin/cms-pages/pages` + `/layouts` on Hono |

### `.env`

```diff
+ NEXT_PUBLIC_API_URL=http://localhost:4000
+ SESSION_COOKIE_NAME=session
```

### `package.json`

**Removed dependencies:**
- `@prisma/client`, `@prisma/adapter-pg`, `pg`, `bcryptjs`, `pino`

**Removed devDependencies:**
- `prisma`, `tsx`, `@types/pg`, `pino-pretty`

**Removed scripts:**
- `postinstall: prisma generate`
- `db:generate`, `db:migrate`, `db:deploy`, `db:setup`, `db:push`, `db:studio`, `db:seed`, `db:ensure`
- `build` simplified: `prisma generate && next build` → `next build`

**Updated scripts** — `docker:*` now delegate to the backend's compose file:
```diff
- "docker:db": "docker compose up postgres -d"
+ "docker:db": "docker compose -f ../cms-backend-hono/docker-compose.yml up postgres -d"
```

### `Dockerfile`

```diff
- COPY prisma ./prisma
- COPY prisma.config.ts ./
- RUN apt-get install -y openssl
- RUN pnpm exec prisma generate
+ ARG NEXT_PUBLIC_API_URL=http://localhost:4000
+ ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
  RUN pnpm build
```

### `proxy.ts`

**Before:** Applied CORS headers on all `/api/*` responses (conflicted with Hono's own CORS headers on proxied responses).

**After:** CORS block removed entirely. Now only:
- Rate limiting via Upstash (`checkRateLimit`)
- Forwarding `X-Request-Id` on all requests

```diff
- import { corsHeaders } from "@/lib/middleware/cors";
- // OPTIONS preflight handler → corsHeaders()
- // CORS headers applied to all /api/* responses
+ // Rate limit only — CORS is handled by Hono
```

---

## 3. Deleted files

### API routes — moved to Hono

| Deleted | Replaced by |
|---|---|
| `app/api/v1/admin/cms-pages/**` (11 route files) | `cms-backend-hono/src/routes/admin/cms-pages.ts` |
| `app/api/v1/admin/media/**` (4 route files) | `cms-backend-hono/src/routes/admin/media.ts` |
| `app/api/v1/cms/**` (5 route files) | `cms-backend-hono/src/routes/cms.ts` |
| `app/api/health/route.ts` | `cms-backend-hono/src/routes/health.ts` |
| `app/api/media/[...path]/route.ts` | Hono static serving at `/api/media/*` |

### Server layer — moved to Hono

| Deleted | Moved to |
|---|---|
| `lib/server/prisma.ts` | `cms-backend-hono/src/lib/prisma.ts` |
| `lib/server/cms-service.ts` | `cms-backend-hono/src/lib/cms-service.ts` |
| `lib/server/cms-public-block.ts` | `cms-backend-hono/src/lib/cms-public-block.ts` |
| `lib/server/cms-public-page-seo.ts` | `cms-backend-hono/src/lib/cms-public-page-seo.ts` |
| `lib/server/cms-page-seo-parse.ts` | `cms-backend-hono/src/lib/cms-page-seo-parse.ts` |
| `lib/server/media-gallery.ts` | `cms-backend-hono/src/lib/media-gallery.ts` |
| `lib/server/` (all remaining) | — |

### Auth layer — split or removed

| Deleted | Reason |
|---|---|
| `lib/auth/session-service.ts` | Session DB logic → Hono `src/routes/auth.ts` |
| `lib/auth/password.ts` | bcrypt → `cms-backend-hono/src/lib/password.ts` |
| `lib/auth/token.ts` | Token gen → `cms-backend-hono/src/lib/token.ts` |
| `lib/auth/constants.ts` | Orphaned — all consumers used `process.env` directly |
| `lib/auth/index.ts` | Orphaned barrel re-export — zero consumers |

### Prisma — fully removed from this project

| Deleted | Replaced by |
|---|---|
| `prisma/schema.prisma` | `cms-backend-hono/prisma/schema.prisma` |
| `prisma/migrations/` (8 files) | `cms-backend-hono/prisma/migrations/` |
| `prisma/seed.ts` | `cms-backend-hono/prisma/seed.ts` |
| `prisma.config.ts` | — |
| `lib/generated/` | `cms-backend-hono/src/generated/` |
| `scripts/ensure-database.mjs` | `db:ensure` removed from `package.json` |
| `scripts/` directory | Now empty, removed |

### API clients — consolidated into `lib/fetcher.ts`

| Deleted | Reason |
|---|---|
| `lib/api/admin-client.ts` | Duplicate of `lib/fetcher.ts` — merged sonner toast into fetcher |
| `lib/api/client.ts` | Unused `apiJson` helper — zero imports |

### Middleware — CORS removed

| Deleted | Reason |
|---|---|
| `lib/middleware/cors.ts` | CORS logic removed from `proxy.ts` — Hono handles it on `/api/*` |
| `docker-compose.yml` | Moved to `cms-backend-hono/docker-compose.yml` |

---

## 4. Kept files (unchanged)

| File | Reason |
|---|---|
| `lib/auth/session.ts` | `getSession()` used by `dashboard/layout.tsx`, `login/page.tsx`, `register/page.tsx` |
| `lib/auth/actions.ts` | Server Actions for login/register/logout forms — updated to call Hono |
| `lib/http/client-ip.ts` | Used by `lib/middleware/rate-limit.ts` (Upstash IP key) |
| `lib/middleware/rate-limit.ts` | Upstash Redis rate limiter — runs in Next.js proxy |
| `lib/cms/**` | All client-side CMS UI utilities, types, builders — frontend only, no DB |
