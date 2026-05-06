# Frontend Project Structure — `cms`

> Next.js 16 dashboard + public storefront. Pure UI layer — no direct database access. All data flows through the Hono REST API.

---

## Directory tree

```
cms/
├── .env                          # Local environment variables (gitignored)
├── .gitignore
├── .dockerignore
├── AGENTS.md                     # AI agent rules for this repo
├── Dockerfile                    # Next.js standalone build; receives NEXT_PUBLIC_API_URL as build ARG
├── README.md
├── next.config.ts                # Rewrites /api/* → Hono backend, image remote patterns
├── proxy.ts                      # Next.js 16 proxy: rate limiting + X-Request-Id forwarding
├── package.json
├── pnpm-lock.yaml
├── pnpm-workspace.yaml           # Monorepo — includes cms + cms-backend-hono
├── tsconfig.json
├── postcss.config.mjs
├── eslint.config.mjs
│
├── app/                          # Next.js App Router pages
│   ├── layout.tsx                # Root layout (fonts, theme, Toaster)
│   ├── globals.css               # Global styles + CSS variables
│   │
│   ├── (site)/                   # Public storefront route group
│   │   └── page.tsx              # Public home page
│   │
│   ├── login/
│   │   └── page.tsx              # Login form page
│   ├── register/
│   │   └── page.tsx              # Register form page
│   │
│   └── dashboard/                # Admin dashboard (auth-protected)
│       ├── layout.tsx            # Dashboard shell: sidebar + header; calls getSession()
│       ├── page.tsx              # Dashboard home — fetches page/layout counts from Hono
│       ├── media/
│       │   └── page.tsx          # Media gallery manager
│       └── cms/
│           ├── page.tsx          # CMS overview
│           ├── new/page.tsx      # Create new page wizard
│           ├── pages/
│           │   ├── page.tsx      # Page list
│           │   └── [id]/page.tsx # Page editor (blocks, SEO, layout slots)
│           ├── layouts/
│           │   ├── page.tsx      # Layout list
│           │   ├── new/page.tsx  # Create layout
│           │   ├── [id]/page.tsx # Layout editor
│           │   └── layout-builder.tsx  # Shared layout builder component
│           ├── navigation/
│           │   └── page.tsx      # Navigation editor
│           ├── footer/
│           │   └── page.tsx      # Footer editor
│           └── announcements/
│               └── page.tsx      # Announcements editor
│
├── components/
│   ├── auth/
│   │   ├── login-form.tsx        # Login form (uses loginAction Server Action)
│   │   └── register-form.tsx     # Register form (uses registerAction)
│   │
│   ├── cms/                      # CMS editor components
│   │   ├── cms-announcement-tree-editor.tsx
│   │   ├── cms-footer-editor.tsx
│   │   ├── cms-html-description-editor.tsx  # Tiptap rich text editor
│   │   ├── cms-layout-page-preview-aside.tsx
│   │   ├── cms-layout-slots-editor.tsx
│   │   ├── cms-link-tree-editor.tsx
│   │   ├── cms-page-seo-editor.tsx
│   │   ├── cms-public-api-link.tsx
│   │   ├── cms-reference-screenshot-field.tsx
│   │   ├── cms-site-chrome-layout-sections.tsx
│   │   ├── cms-config-form.tsx
│   │   └── layout-builder/
│   │       ├── block-branch.tsx
│   │       ├── block-type-badge.tsx
│   │       ├── grouped-tool-palette.tsx
│   │       └── leaf-default-field.tsx
│   │
│   ├── dashboard/
│   │   ├── admin-dashboard-shell.tsx  # Top-level shell wrapping sidebar + main
│   │   ├── admin-header.tsx
│   │   ├── admin-sidebar.tsx
│   │   └── copy-api-button.tsx
│   │
│   ├── media/
│   │   └── media-picker-modal.tsx     # File picker dialog (used in CMS editors)
│   │
│   ├── providers/
│   │   └── query-provider.tsx         # TanStack Query provider
│   │
│   └── ui/                            # shadcn/ui primitives (Radix-based)
│       └── (avatar, badge, button, card, dialog, input, select, table, tabs …)
│
├── hooks/
│   ├── use-cms.ts                # TanStack Query hooks for all admin CMS API calls
│   ├── use-cms-site-content.ts   # Query hooks for navigation/footer/announcements
│   └── use-mobile.ts             # Responsive breakpoint hook
│
├── lib/
│   ├── fetcher.ts                # Base HTTP client — api.get/post/put/patch/delete
│   │                             # Sonner toast on error (client), notFound() on 404
│   │
│   ├── api/
│   │   └── services.ts           # Typed domain API modules (import from here, not fetcher directly)
│   │                             # cmsPageApi, cmsBlockApi, cmsLayoutApi, adminSiteChromeApi
│   │                             # mediaApi, authApi, publicCmsApi, healthApi
│   │
│   ├── auth/
│   │   ├── actions.ts            # Server Actions: loginAction, registerAction, logoutAction
│   │   └── session.ts            # getSession() — calls GET /api/auth/me, returns AppSession | null
│   │
│   ├── cms/                      # CMS client-side logic + types (no server/DB code)
│   │   ├── api.ts                # API response types: CmsPage, CmsBlock, CmsLayout, etc.
│   │   ├── site-content-types.ts # JSON shapes for navigation, footer, announcements
│   │   ├── block-meta.ts         # Block type registry and metadata
│   │   ├── layout-builder.ts     # Layout builder state management
│   │   ├── layout-payload.ts     # Layout JSON serialization helpers
│   │   ├── new-page-draft.ts     # New page draft types and defaults
│   │   ├── cms-page-draft-data.ts# Draft data versioning
│   │   ├── page-seo.ts           # SEO form value helpers
│   │   ├── page-slots.ts         # Layout slot utilities
│   │   ├── site-layout-sections.ts
│   │   ├── sync-layout-slots.ts
│   │   ├── add-layout-query.ts
│   │   ├── absolute-url.ts
│   │   ├── html-string-empty.ts
│   │   ├── public-site-api-paths.ts  # Public /api/v1/cms/* path constants
│   │   ├── reference-image-upload.ts # Uploads reference screenshots to media gallery
│   │   ├── sections-expand-pref.ts   # Persist section expand preference in localStorage
│   │   └── site-content-storage.ts   # localStorage draft helpers
│   │
│   ├── http/
│   │   └── client-ip.ts          # getClientIp() — reads x-forwarded-for / x-real-ip
│   │
│   ├── media/
│   │   └── clipboard.ts          # Copy URL to clipboard helper
│   │
│   ├── middleware/
│   │   └── rate-limit.ts         # Upstash Redis sliding-window rate limiter (used in proxy.ts)
│   │
│   └── shared/
│       ├── utils.ts              # cn() className helper (clsx + tailwind-merge)
│       └── react-query.ts        # Shared QueryClient factory
│
├── public/                       # Static assets served by Next.js
│   └── images/story/             # Demo story images
│
└── docs/
    ├── structure.md              # This file
    └── changes.md                # Full migration changelog
```

---

## Key patterns

### Data fetching

| Context | Pattern | Where |
|---|---|---|
| Server Components | `api.get()` from `lib/fetcher.ts` (no toast, `showErrorToast: false`) | `app/**/*.tsx` |
| Client Components | TanStack Query hooks from `hooks/use-cms.ts` | `components/cms/*.tsx` |
| Server Actions | Direct `fetch()` to Hono (login/logout/register) | `lib/auth/actions.ts` |

### Authentication flow

```
1. User submits login form
2. loginAction (Server Action) → POST /api/auth/login (Hono)
3. Hono sets httpOnly session cookie in Set-Cookie header
4. loginAction forwards Set-Cookie to browser via cookies().set()
5. All subsequent requests carry the cookie automatically
6. getSession() → GET /api/auth/me to validate on server per request
```

### API service usage

```ts
// Server Component
import { cmsPageApi, publicCmsApi } from '@/lib/api/services';
const { pages } = await cmsPageApi.list();

// Client Component (via hook)
import { useCmsPages } from '@/hooks/use-cms';
const { data, isLoading } = useCmsPages();
```

---

## Environment variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Hono backend base URL — used by `lib/fetcher.ts` and Next.js rewrites |
| `SESSION_COOKIE_NAME` | Must match `cms-backend-hono` value (default: `session`) |
| `NEXT_PUBLIC_APP_URL` | Public URL of this Next.js app |
| `UPSTASH_REDIS_REST_URL` | Optional — enables distributed rate limiting |
| `UPSTASH_REDIS_REST_TOKEN` | Optional — required alongside `UPSTASH_REDIS_REST_URL` |
| `RATE_LIMIT_WINDOW_SEC` | Rate limit window in seconds (default: `60`) |
| `RATE_LIMIT_MAX` | Max requests per window (default: `100`) |
