"use client";

import Link from "next/link";
import { format } from "date-fns";
import { Hammer, Loader2, Pencil, Trash2 } from "lucide-react";
import { useCmsCustomTools, useDeleteCmsCustomTool } from "@/hooks/use-cms";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function CmsToolsListPage() {
  const { data, isLoading, isError, error, refetch } = useCmsCustomTools();
  const deleteTool = useDeleteCmsCustomTool();
  const tools = [...(data?.tools ?? [])].sort(
    (a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );

  async function handleDelete(id: string, name: string) {
    if (
      typeof window !== "undefined" &&
      !window.confirm(`Delete custom tool "${name}"?`)
    ) {
      return;
    }
    await deleteTool.mutateAsync(id);
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 pb-10">
      <Button variant="ghost" size="sm" className="w-fit" asChild>
        <Link href="/dashboard/cms">← CMS home</Link>
      </Button>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Hammer className="h-6 w-6 text-muted-foreground" aria-hidden />
            <h1 className="text-2xl font-bold tracking-tight">CMS Tools</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Click a tool card to edit, or create a new grouped tool.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/cms/tools/new">Create tool</Link>
        </Button>
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
            No tools yet. Create one to reuse in layout builder palettes.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool) => (
            <Card key={tool.id} className="group border-border/60">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{tool.name}</CardTitle>
                {tool.description ? (
                  <p className="text-xs text-muted-foreground">{tool.description}</p>
                ) : null}
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-[11px] text-muted-foreground">
                  Updated {format(new Date(tool.updatedAt), "MMM d, yyyy h:mm a")}
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
                    onClick={() => void handleDelete(tool.id, tool.name)}
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
    </div>
  );
}
