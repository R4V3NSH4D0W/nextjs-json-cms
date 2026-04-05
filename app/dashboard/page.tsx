import Link from "next/link";

import { getPrisma } from "@/lib/server/prisma";

export default async function DashboardHomePage() {
  const prisma = getPrisma();
  const [cmsPageCount, cmsLayoutCount] = await Promise.all([
    prisma.cmsPage.count(),
    prisma.cmsLayout.count(),
  ]);

  return (
    <div className="mx-auto max-w-4xl space-y-10">
      <header className="border-b border-border/80 pb-8">
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Dashboard
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Welcome back</h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
          Media library and storefront CMS. Public content is exposed under{" "}
          <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
            /api/v1/cms
          </code>
          .
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-sm border border-border/80 bg-card p-5 shadow-sm">
          <p className="text-xs font-medium text-muted-foreground">CMS pages</p>
          <p className="mt-2 text-3xl font-semibold tabular-nums">{cmsPageCount}</p>
          <p className="mt-1 text-xs text-muted-foreground">Headless content</p>
        </div>
        <div className="rounded-sm border border-border/80 bg-card p-5 shadow-sm">
          <p className="text-xs font-medium text-muted-foreground">Layouts</p>
          <p className="mt-2 text-3xl font-semibold tabular-nums">{cmsLayoutCount}</p>
          <p className="mt-1 text-xs text-muted-foreground">Section schemas</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/dashboard/media"
          className="inline-flex items-center justify-center rounded-sm bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90"
        >
          Media
        </Link>
        <Link
          href="/dashboard/cms"
          className="inline-flex items-center justify-center rounded-sm border border-border bg-background px-5 py-2.5 text-sm font-medium text-foreground shadow-sm transition hover:bg-muted"
        >
          Storefront CMS
        </Link>
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-sm border border-border bg-background px-5 py-2.5 text-sm font-medium text-foreground shadow-sm transition hover:bg-muted"
        >
          Public home
        </Link>
        <a
          href="/api/health"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center rounded-sm border border-border bg-background px-5 py-2.5 text-sm font-medium text-foreground shadow-sm transition hover:bg-muted"
        >
          API health
        </a>
      </div>
    </div>
  );
}
