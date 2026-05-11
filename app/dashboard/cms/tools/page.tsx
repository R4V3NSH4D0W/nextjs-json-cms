"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import { Download, Hammer, Loader2, Pencil, Trash2, Upload } from "lucide-react";
import {
  useCmsCustomTools,
  useDeleteCmsCustomTool,
  useExportCmsCustomTool,
  useExportCmsCustomTools,
  useImportCmsCustomTools,
} from "@/hooks/use-cms";
import { AlertDialog } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import type { CmsCustomToolsExportPayload } from "@/lib/cms/api";

function downloadJson(payload: CmsCustomToolsExportPayload, filename: string) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const href = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(href);
}

export default function CmsToolsListPage() {
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const { data, isLoading, isError, error, refetch } = useCmsCustomTools();
  const deleteTool = useDeleteCmsCustomTool();
  const exportTool = useExportCmsCustomTool();
  const exportTools = useExportCmsCustomTools();
  const importTools = useImportCmsCustomTools();
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
  const allVisibleIds = tools.map((tool) => tool.id);
  const selectedVisibleCount = allVisibleIds.filter((id) => selectedIds.has(id)).length;
  const allVisibleSelected = tools.length > 0 && selectedVisibleCount === tools.length;
  const exportPending = exportTool.isPending || exportTools.isPending;

  async function handleDelete(id: string) {
    await deleteTool.mutateAsync(id);
    setDeleteTarget(null);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }

  async function handleExportSelected() {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) {
      toast.error("Select at least one tool to export.");
      return;
    }
    const payload = await exportTools.mutateAsync(ids);
    downloadJson(payload, `cms-tools-selected-${Date.now()}.json`);
  }

  async function handleExportAll() {
    const payload = await exportTools.mutateAsync([]);
    downloadJson(payload, `cms-tools-all-${Date.now()}.json`);
  }

  async function handleExportOne(id: string, name: string) {
    const payload = await exportTool.mutateAsync(id);
    const safeName = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-") || "tool";
    downloadJson(payload, `cms-tool-${safeName}.json`);
  }

  async function handleImportFile(file: File) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(await file.text());
    } catch {
      toast.error("Invalid JSON file.");
      return;
    }
    const payload =
      parsed && typeof parsed === "object" && "kind" in parsed
        ? (parsed as Record<string, unknown>)
        : Array.isArray(parsed)
          ? ({ kind: "cms-custom-tools", version: 1, tools: parsed } as Record<string, unknown>)
          : ({
              kind: "cms-custom-tools",
              version: 1,
              tools: [parsed],
            } as Record<string, unknown>);
    const result = await importTools.mutateAsync(payload);
    if (result.rejected.length > 0) {
      toast.error(
        `Imported ${result.created.length} tool(s), skipped ${result.rejected.length}.`,
      );
    }
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

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Input
          type="text"
          placeholder="Search tools"
          className="w-full sm:max-w-md"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <p className="text-sm text-muted-foreground">
            {hasSearch
              ? `Showing ${tools.length} of ${totalTools}`
              : `Showing ${totalTools} tool${totalTools === 1 ? "" : "s"}`}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8"
            onClick={() => importInputRef.current?.click()}
            disabled={importTools.isPending}
          >
            {importTools.isPending ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Upload className="mr-1.5 h-3.5 w-3.5" />
            )}
            Import
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8"
            onClick={() => void handleExportSelected()}
            disabled={selectedIds.size === 0 || exportPending}
          >
            {exportPending ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Download className="mr-1.5 h-3.5 w-3.5" />
            )}
            Export selected
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8"
            onClick={() => void handleExportAll()}
            disabled={totalTools === 0 || exportPending}
          >
            {exportPending ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Download className="mr-1.5 h-3.5 w-3.5" />
            )}
            Export all
          </Button>
        </div>
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
        <>
          <div className="flex items-center gap-2">
            <Checkbox
              checked={allVisibleSelected}
              onCheckedChange={(checked) => {
                setSelectedIds((prev) => {
                  const next = new Set(prev);
                  if (checked) {
                    for (const id of allVisibleIds) next.add(id);
                  } else {
                    for (const id of allVisibleIds) next.delete(id);
                  }
                  return next;
                });
              }}
            />
            <p className="text-sm text-muted-foreground">
              {selectedVisibleCount === 0
                ? "Select visible tools"
                : `${selectedVisibleCount} visible tool${
                    selectedVisibleCount === 1 ? "" : "s"
                  } selected`}
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {tools.map((tool) => (
            <Card key={tool.id} className="border-border/60">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={selectedIds.has(tool.id)}
                    onCheckedChange={(checked) => {
                      setSelectedIds((prev) => {
                        const next = new Set(prev);
                        if (checked) next.add(tool.id);
                        else next.delete(tool.id);
                        return next;
                      });
                    }}
                  />
                  <CardTitle className="text-base">{tool.name}</CardTitle>
                </div>
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
                    onClick={() => void handleExportOne(tool.id, tool.name)}
                    disabled={exportPending}
                  >
                    <Download className="mr-1.5 h-3.5 w-3.5" />
                    Export
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
        </>
      )}

      <input
        ref={importInputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            void handleImportFile(file);
          }
          e.currentTarget.value = "";
        }}
      />

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
        confirmationText={deleteTarget?.name}
        confirmationLabel="Type the custom tool name to confirm."
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
