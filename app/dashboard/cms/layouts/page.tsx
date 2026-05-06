"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { ImageIcon, LayoutTemplate, Trash2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useCmsLayouts, useDeleteCmsLayout } from "@/hooks/use-cms";
import type { CmsLayoutListItem } from "@/lib/cms/api";
import { appendAddLayoutIdToUrl } from "@/lib/cms/add-layout-query";
import { absoluteApiUrl } from "@/lib/cms/absolute-url";
import { cn } from "@/lib/shared/utils";
import Image from "next/image";
import { AlertDialog } from "@/components/ui/alert-dialog";

function layoutHref(id: string, returnToEncoded: string | null) {
  return returnToEncoded
    ? `/dashboard/cms/layouts/${id}?returnTo=${returnToEncoded}`
    : `/dashboard/cms/layouts/${id}`;
}

function LayoutsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnToRaw = searchParams.get("returnTo");
  const returnPath = returnToRaw ? decodeURIComponent(returnToRaw) : null;
  const returnToEncoded = returnToRaw ? encodeURIComponent(returnToRaw) : null;

  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<CmsLayoutListItem | null>(
    null,
  );
  const { data, isLoading, isError, error, refetch } = useCmsLayouts();
  const deleteLayout = useDeleteCmsLayout();

  const rows = useMemo(() => {
    const layouts = data?.layouts ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return layouts;
    return layouts.filter(
      (l) =>
        l.name.toLowerCase().includes(q) || l.rootKey.toLowerCase().includes(q),
    );
  }, [data?.layouts, search]);

  function handleDelete(layout: CmsLayoutListItem, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDeleteTarget(layout);
  }

  function addLayoutToReturnPage(layoutId: string) {
    if (!returnPath) return;
    router.push(appendAddLayoutIdToUrl(returnPath, layoutId));
  }

  const createLayoutHref = returnToRaw
    ? `/dashboard/cms/layouts/new?returnTo=${encodeURIComponent(returnToRaw)}`
    : "/dashboard/cms/layouts/new";

  return (
    <>
      <AlertDialog
        open={deleteTarget !== null}
        title={
          deleteTarget
            ? `Delete layout “${deleteTarget.name}”?`
            : "Delete layout?"
        }
        description="Pages using it will have the layout unset."
        confirmLabel="Delete layout"
        destructive
        onConfirm={() => {
          if (!deleteTarget) return;
          deleteLayout.mutate(deleteTarget.id);
          setDeleteTarget(null);
        }}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      />
      <div className="flex flex-col space-y-5">
        <div className="flex flex-row items-center justify-between">
          <span className="text-2xl font-bold">Layouts</span>
          <Button className="w-fit gap-2" asChild>
            <Link href={createLayoutHref}>
              <LayoutTemplate className="h-4 w-4 shrink-0" aria-hidden />
              Create layout
            </Link>
          </Button>
        </div>

        {returnPath && (
          <p className="text-center text-sm text-muted-foreground">
            Pick a layout below to send it back to your page, or{" "}
            <Link
              href={returnPath}
              className="text-primary underline underline-offset-2"
            >
              return without choosing
            </Link>
            .
          </p>
        )}

        <Input
          type="text"
          placeholder="Search by name or root key"
          className="w-full max-w-md"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {isError && (
          <div className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error instanceof Error ? error.message : "Failed to load layouts."}{" "}
            <button
              type="button"
              className="underline underline-offset-2"
              onClick={() => void refetch()}
            >
              Retry
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="aspect-16/10 w-full rounded-none" />
                <CardHeader className="space-y-2 pb-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : rows.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map((row) => {
              const editLink = layoutHref(row.id, returnToEncoded);
              const pickMode = Boolean(returnPath);

              return (
                <Card
                  key={row.id}
                  role="button"
                  tabIndex={0}
                  className={cn(
                    "group flex cursor-pointer flex-col overflow-hidden py-0 transition-shadow hover:shadow-md",
                    "gap-0 outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring",
                  )}
                  onClick={(e) => {
                    if ((e.target as HTMLElement).closest("a, button")) return;
                    if (pickMode) addLayoutToReturnPage(row.id);
                    else router.push(editLink);
                  }}
                  onKeyDown={(e) => {
                    if (e.key !== "Enter" && e.key !== " ") return;
                    if ((e.target as HTMLElement).closest("a, button")) return;
                    e.preventDefault();
                    if (pickMode) addLayoutToReturnPage(row.id);
                    else router.push(editLink);
                  }}
                >
                  <div className="relative aspect-16/10 w-full shrink-0 overflow-hidden bg-muted/40">
                    {row.referenceImageUrl ? (
                      <Image
                        src={absoluteApiUrl(row.referenceImageUrl)}
                        alt=""
                        fill
                        className="object-cover object-center"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    ) : (
                      <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted-foreground">
                        <ImageIcon className="h-12 w-12 opacity-40" />
                        <span className="text-xs">No reference image</span>
                      </div>
                    )}

                    <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-background/90 via-background/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

                    <div className="absolute right-2 top-2 flex gap-1.5">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="pointer-events-auto h-8 px-2.5 text-xs shadow-sm"
                        asChild
                      >
                        <Link
                          href={editLink}
                          onClick={(e) => e.stopPropagation()}
                        >
                          Edit
                        </Link>
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        size="icon"
                        className="pointer-events-auto h-9 w-9 text-muted-foreground shadow-sm hover:text-destructive"
                        title="Delete layout"
                        disabled={deleteLayout.isPending}
                        onClick={(e) => handleDelete(row, e)}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete {row.name}</span>
                      </Button>
                    </div>

                    {pickMode ? (
                      <div className="pointer-events-none absolute bottom-2 left-2 right-2 rounded-md bg-background/90 px-2 py-1.5 text-center text-xs font-medium shadow-sm opacity-0 transition-opacity group-hover:opacity-100">
                        Click card to use
                      </div>
                    ) : null}
                  </div>

                  <CardHeader className="px-4 pb-2 pt-4">
                    <h3 className="line-clamp-2 text-base font-semibold leading-snug">
                      {row.name}
                    </h3>
                    <p className="font-mono text-xs text-muted-foreground">
                      {row.rootKey}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Updated {format(new Date(row.updatedAt), "MMM d, yyyy")}
                    </p>
                  </CardHeader>

                  <CardContent className="px-4 pb-4 pt-0">
                    <p className="text-xs text-muted-foreground">
                      {pickMode
                        ? "Click the card to attach this layout to your page."
                        : "Click the card to edit this layout."}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed bg-muted/20 px-6 py-16 text-center text-muted-foreground">
            No layouts yet. Create one to attach to CMS pages.
          </div>
        )}
      </div>
    </>
  );
}

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
          Loading…
        </div>
      }
    >
      <LayoutsPageContent />
    </Suspense>
  );
}
