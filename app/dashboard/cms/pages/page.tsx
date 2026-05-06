"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { ExternalLink, Trash2 } from "lucide-react";
import Link from "next/link";
import { useCurrentProject } from "@/components/providers/current-project-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCmsPages, useDeleteCmsPage } from "@/hooks/use-cms";
import type { CmsPage } from "@/lib/cms/api";
import { absoluteTenantApiUrl } from "@/lib/cms/absolute-url";
import {
  publicCmsPageApiPath,
  trimPublicApiPathDisplay,
} from "@/lib/cms/public-site-api-paths";
import { AlertDialog } from "@/components/ui/alert-dialog";

/**
 * Public storefront CMS route (no auth). Same as headless / Next.js public fetch.
 * @see GET /api/v1/pages/:slugOrId — slug or page id (cuid).
 */
function Page() {
  const { currentProject } = useCurrentProject();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "active" | "archived" | "all"
  >("active");
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
  const [deleteTarget, setDeleteTarget] = useState<CmsPage | null>(null);

  const { data, isLoading, isError, error, refetch } = useCmsPages();
  const deletePage = useDeleteCmsPage();

  const pages = data?.pages ?? [];
  const counts = useMemo(() => {
    const active = pages.filter((p) => p.isActive).length;
    const archived = pages.filter((p) => !p.isActive).length;
    return { all: pages.length, active, archived };
  }, [pages]);

  const rows = useMemo(() => {
    const pages = data?.pages ?? [];
    const byStatus =
      statusFilter === "all"
        ? pages
        : statusFilter === "active"
          ? pages.filter((p) => p.isActive)
          : pages.filter((p) => !p.isActive);
    const q = search.trim().toLowerCase();
    if (!q) return byStatus;
    return byStatus.filter(
      (p) =>
        p.title.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q),
    );
  }, [data?.pages, search, statusFilter]);

  const selectedIds = useMemo(
    () => new Set(Object.keys(rowSelection).filter((id) => rowSelection[id])),
    [rowSelection],
  );

  const allSelected = rows.length > 0 && selectedIds.size === rows.length;
  const someSelected = selectedIds.size > 0 && !allSelected;

  function toggleAll(checked: boolean) {
    if (!checked) {
      setRowSelection({});
      return;
    }
    const next: Record<string, boolean> = {};
    for (const row of rows) next[row.id] = true;
    setRowSelection(next);
  }

  function toggleRow(id: string, checked: boolean) {
    setRowSelection((prev) => {
      const next = { ...prev };
      if (checked) next[id] = true;
      else delete next[id];
      return next;
    });
  }

  function handleDeleteRow(page: CmsPage) {
    setDeleteTarget(page);
  }

  return (
    <>
      <AlertDialog
        open={deleteTarget !== null}
        title={
          deleteTarget ? `Delete page “${deleteTarget.title}”?` : "Delete page?"
        }
        description="This cannot be undone."
        confirmLabel="Delete page"
        destructive
        onConfirm={() => {
          if (!deleteTarget) return;
          deletePage.mutate(deleteTarget.id);
          setDeleteTarget(null);
        }}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      />
      <div className="flex w-full flex-col space-y-5">
        <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-fit px-0"
              asChild
            >
              <Link href="/dashboard/cms">← CMS home</Link>
            </Button>
            <span className="text-2xl font-bold">CMS Pages</span>
          </div>
          <Button type="button" asChild>
            <Link href="/dashboard/cms/new">Create Page</Link>
          </Button>
        </div>

        <Input
          type="text"
          placeholder="Search pages by title or slug"
          className="w-full"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <Tabs
          value={statusFilter}
          onValueChange={(value) =>
            setStatusFilter(value as "active" | "archived" | "all")
          }
        >
          <TabsList className="h-9">
            <TabsTrigger value="active">Active ({counts.active})</TabsTrigger>
            <TabsTrigger value="archived">
              Archived ({counts.archived})
            </TabsTrigger>
            <TabsTrigger value="all">All ({counts.all})</TabsTrigger>
          </TabsList>
        </Tabs>

        {isError && (
          <div className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error instanceof Error ? error.message : "Failed to load pages."}{" "}
            <button
              type="button"
              className="underline underline-offset-2"
              onClick={() => void refetch()}
            >
              Retry
            </button>
          </div>
        )}

        <div className="w-full rounded-md border">
          <Table className="w-full">
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    aria-label="Select all"
                    checked={
                      allSelected
                        ? true
                        : someSelected
                          ? "indeterminate"
                          : false
                    }
                    onCheckedChange={(v) => toggleAll(v === true)}
                    disabled={rows.length === 0 || isLoading}
                  />
                </TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead>Public API</TableHead>
                <TableHead className="w-12 text-right" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                loadingRows()
              ) : rows.length ? (
                rows.map((row) => {
                  const apiPath = publicCmsPageApiPath(
                    row.slug?.trim() || row.id,
                  );
                  const apiHref = absoluteTenantApiUrl(apiPath, {
                    slug: currentProject?.slug,
                    primaryDomain: currentProject?.primaryDomain,
                  });
                  return (
                    <TableRow
                      key={row.id}
                      data-state={rowSelection[row.id] ? "selected" : undefined}
                    >
                      <TableCell>
                        <Checkbox
                          aria-label={`Select ${row.title}`}
                          checked={!!rowSelection[row.id]}
                          onCheckedChange={(v) => toggleRow(row.id, v === true)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        <Link
                          href={`/dashboard/cms/pages/${row.id}`}
                          className="text-foreground flex flex-row flex-wrap items-center gap-2 underline-offset-4 hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          {row.title}
                          {row.draftData != null ? (
                            <Badge variant="secondary" className="font-normal">
                              Admin draft
                            </Badge>
                          ) : null}
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                      </TableCell>
                      <TableCell className="font-mono text-sm text-muted-foreground">
                        {row.slug}
                      </TableCell>
                      <TableCell>
                        {!row.isActive ? (
                          <span className="text-muted-foreground">
                            Archived
                          </span>
                        ) : row.published ? (
                          <span className="text-emerald-600 dark:text-emerald-400">
                            Live
                          </span>
                        ) : (
                          <span className="text-muted-foreground">Draft</span>
                        )}
                      </TableCell>

                      <TableCell className="text-muted-foreground">
                        {format(new Date(row.updatedAt), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="max-w-[min(280px,40vw)]">
                        <a
                          href={apiHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex max-w-full items-center gap-1 font-mono text-xs text-primary underline-offset-2 hover:underline"
                          title={`${apiHref}\n(Public JSON; draft or inactive pages may 404.)`}
                        >
                          <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-70" />
                          <span className="min-w-0 truncate">
                            {trimPublicApiPathDisplay(apiPath)}
                          </span>
                        </a>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          aria-label={`Delete ${row.title}`}
                          disabled={deletePage.isPending}
                          onClick={() => handleDeleteRow(row)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No pages found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </>
  );
}

function loadingRows() {
  return (
    <>
      {[0, 1, 2].map((i) => (
        <TableRow key={i}>
          <TableCell colSpan={8}>
            <div className="flex items-center gap-3 py-2">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 flex-1 max-w-50" />
              <Skeleton className="h-4 flex-1 max-w-30" />
              <Skeleton className="h-4 w-16" />
            </div>
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}

export default Page;
