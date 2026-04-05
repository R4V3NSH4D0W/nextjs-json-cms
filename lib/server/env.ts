/**
 * Server-only environment helpers. Import only from Server Components,
 * Route Handlers, or server actions — not from client components.
 */
export function getPublicAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

/** Postgres connection string (same in Docker `web` service and local dev). */
export function getDatabaseUrl(): string | undefined {
  return process.env.DATABASE_URL?.trim() || undefined;
}
