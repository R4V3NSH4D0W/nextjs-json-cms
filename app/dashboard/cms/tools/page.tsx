"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { format } from "date-fns";
import { Hammer, Loader2, Pencil, Trash2 } from "lucide-react";
import { useCmsCustomTools, useDeleteCmsCustomTool } from "@/hooks/use-cms";
import { AlertDialog } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function CmsToolsListPage() {
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const { data, isLoading, isError, error, refetch } = useCmsCustomTools();
  const deleteTool = useDeleteCmsCustomTool();
  const tools = useMemo(
    () =>
      Object.values(data?.tools ?? {})
        .filter((tool) => {
          const q = search.trim().toLowerCase();
          if (!q) return true;
          return [tool.name, tool.description ?? "", tool.id]
            .join(" ")
            .toLowerCase()
            .includes(q);
        })
        .sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
        ),
    [data?.tools, search],
  );

  const totalTools = Object.keys(data?.tools ?? {}).length;
  const hasSearch = search.trim().length > 0;

  async function handleDelete(id: string) {
    await deleteTool.mutateAsync(id);
    setDeleteTarget(null);
  }

  return (
    <div className="flex w-full flex-col gap-6 px-4 pb-10 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-1">
          <Button variant="ghost" size="sm" className="w-fit px-0" asChild>
            <Link href="/dashboard/cms">← CMS home</Link>
          </Button>
          <div className="flex items-center gap-2">
            <Hammer className="h-5 w-5 text-muted-foreground" aria-hidden />
            <h1 className="text-2xl font-bold tracking-tight">CMS Tools</h1>
          </div>
        </div>
        <Button asChild className="shrink-0">
          <Link href="/dashboard/cms/tools/new">Create tool</Link>
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Input
          type="text"
          placeholder="Search tools"
          className="w-full sm:max-w-md"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <p className="text-sm text-muted-foreground">
          {hasSearch
            ? `Showing ${tools.length} of ${totalTools}`
            : `Showing ${totalTools} tool${totalTools === 1 ? "" : "s"}`}
        </p>
      </div>

      {isError ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error instanceof Error ? error.message : "Failed to load tools."}{" "}
          <button
            type="button"
            className="underline underline-offset-2"
            onClick={() => void refetch()}
          >
            Retry
          </button>
        </div>
      ) : isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading tools…
        </div>
      ) : tools.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            {hasSearch
              ? "No tools match your search. Clear the filter to see every tool."
              : "No tools yet. Create one to reuse in layout builder palettes."}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {tools.map((tool) => (
            <Card key={tool.id} className="border-border/60">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{tool.name}</CardTitle>
                {tool.description ? (
                  <p className="text-xs text-muted-foreground">
                    {tool.description}
                  </p>
                ) : null}
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-[11px] text-muted-foreground">
                  Updated{" "}
                  {format(new Date(tool.updatedAt), "MMM d, yyyy h:mm a")}
                </p>
                <div className="flex gap-2">
                  <Button asChild size="sm" className="h-8">
                    <Link href={`/dashboard/cms/tools/${tool.id}`}>
                      <Pencil className="mr-1.5 h-3.5 w-3.5" />
                      Edit
                    </Link>
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-8"
                    onClick={() =>
                      setDeleteTarget({ id: tool.id, name: tool.name })
                    }
                    disabled={deleteTool.isPending}
                  >
                    <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog
        open={deleteTarget !== null}
        title={
          deleteTarget
            ? `Delete custom tool "${deleteTarget.name}"?`
            : "Delete custom tool?"
        }
        description="This cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        destructive
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        onConfirm={
          deleteTarget ? () => handleDelete(deleteTarget.id) : undefined
        }
      />
    </div>
  );
}
